import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { POINTS_RULES } from "@edurank/shared";
import { schools, users } from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/password";
import { createSession, destroySession, requireUser } from "../lib/auth";
import { awardPoints, checkProfileCompletion, processStreak, rankOf } from "../lib/points";
import { evalBadges } from "../lib/badges";
import { referralCode, shortId } from "../lib/id";
import { err, parseJsonBody, publicUser } from "../lib/http";
import type { AppEnv, UserRow } from "../types";

const app = new Hono<AppEnv>();

async function schoolName(env: { DB: D1Database }, schoolId: string | null): Promise<string | null> {
  if (!schoolId) return null;
  const db = drizzle(env.DB);
  const row = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, schoolId)).limit(1);
  return row[0]?.name ?? null;
}

async function fullMe(env: AppEnv["Bindings"], u: UserRow) {
  const rows = await freshUser(env, u.id);
  const fresh = rows[0]?.user ?? u;
  const streak = await processStreak(env, fresh);
  const completed = await checkProfileCompletion(env, streak.user);
  const rank = await rankOf(env, completed.totalEarned);
  await evalBadges(env, completed.id);
  return publicUser(completed, await schoolName(env, completed.schoolId), rank);
}

function freshUser(env: AppEnv["Bindings"], id: string) {
  return drizzle(env.DB)
    .select({ user: users })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .all() as Promise<{ user: UserRow }[]>;
}

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password needs at least 8 characters").max(100),
  displayName: z.string().trim().min(3).max(24),
  grade: z.number().int().min(8).max(12).nullable().optional(),
  schoolId: z.string().trim().max(64).nullable().optional(),
  referralCode: z.string().trim().length(6).nullable().optional(),
  bio: z.string().trim().max(280).optional(),
});

app.post("/register", async (c) => {
  const body = await parseJsonBody(c, registerSchema);
  const db = drizzle(c.env.DB);

  const existing = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${body.email}`).limit(1);
  if (existing.length > 0) err(409, "That email is already enlisted. Try logging in.");

  if (body.schoolId) {
    const s = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, body.schoolId)).limit(1);
    if (s.length === 0) err(400, "Unknown school");
  }

  let referrer: UserRow | undefined;
  if (body.referralCode) {
    referrer = (
      await db.select().from(users).where(eq(users.referralCode, body.referralCode.toUpperCase())).limit(1)
    )[0] as UserRow | undefined;
    if (!referrer) err(400, "Invalid referral code");
  }

  let code = referralCode();
  for (let i = 0; i < 5; i++) {
    const clash = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code)).limit(1);
    if (clash.length === 0) break;
    code = referralCode();
  }

  const now = Date.now();
  const userId = shortId(12);
  await db.insert(users).values({
    id: userId,
    email: body.email,
    passwordHash: await hashPassword(body.password),
    displayName: body.displayName,
    grade: body.grade ?? null,
    schoolId: body.schoolId ?? null,
    bio: body.bio ?? "",
    referralCode: code,
    referredBy: referrer?.id ?? null,
    createdAt: now,
  });

  // Referral economy: both sides get paid immediately.
  if (referrer) {
    await awardPoints(c.env, {
      userId: referrer.id,
      delta: POINTS_RULES.REFERRAL_BONUS,
      reason: "referral_bonus",
      description: `Referral bonus — ${body.displayName} joined with your code`,
    });
    await awardPoints(c.env, {
      userId,
      delta: POINTS_RULES.REFERRAL_BONUS,
      reason: "referral_bonus",
      description: `Joined with ${referrer.displayName}'s referral code`,
    });
  }

  const token = await createSession(c, userId);
  const me = await fullMe(c.env, (await freshUser(c.env, userId))[0]!.user);
  return c.json({ token, user: me }, 201);
});

app.post("/login", async (c) => {
  const body = await parseJsonBody(
    c,
    z.object({
      email: z.string().trim().toLowerCase(),
      password: z.string().min(1),
    }),
  );
  const db = drizzle(c.env.DB);
  const found = (await db.select().from(users).where(sql`lower(${users.email}) = ${body.email}`).limit(1)) as UserRow[];
  const user = found[0];
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    err(401, "Wrong credentials. Check your email and password.");
  }
  const token = await createSession(c, user.id);
  const me = await fullMe(c.env, user);
  return c.json({ token, user: me });
});

app.post("/logout", async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});

app.get("/me", async (c) => {
  const user = await requireUser(c);
  const me = await fullMe(c.env, user);
  const earnedBadges = await evalBadges(c.env, user.id); // ensure badge state is fresh
  void earnedBadges;
  return c.json({ user: me });
});

export default app;

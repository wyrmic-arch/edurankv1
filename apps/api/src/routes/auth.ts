import { Hono } from "hono";
import { eq, sql, and, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { POINTS_RULES } from "@edurank/shared";
import { schools, users, sessions, userBadges, badges } from "../db/schema";
import { hashPassword, verifyPassword, sha256Hex } from "../lib/password";
import { createSession, destroySession, requireUser, currentUser } from "../lib/auth";
import { awardPoints, checkProfileCompletion, processStreak, rankOf } from "../lib/points";
import { evalBadges } from "../lib/badges";
import { referralCode, shortId } from "../lib/id";
import { err, parseJsonBody, publicUser } from "../lib/http";
import { sendEmail, appUrl } from "../lib/email";
import type { AppEnv, UserRow } from "../types";

const app = new Hono<AppEnv>();

// Early-access cutoff (unix ms). Signups on or before this are FOUNDERs.
// Defaults to 180 days after the platform's reference launch so the window
// stays open unless a specific date is set. Set EARLY_ACCESS_UNTIL=0 to close it.
const DEFAULT_EARLY_ACCESS_UNTIL = Date.parse("2027-03-01T00:00:00Z");
function envEarlyAccessUntil(env: AppEnv["Bindings"]): number {
  const raw = env.EARLY_ACCESS_UNTIL;
  if (raw == null || raw === "") return DEFAULT_EARLY_ACCESS_UNTIL;
  return Number(raw) || DEFAULT_EARLY_ACCESS_UNTIL;
}

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
  const verifyToken = shortId(32);
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
    verifyToken: await sha256Hex(verifyToken),
    verifyTokenAt: now,
    createdAt: now,
  });

  // Send a one-time verification email (fire-and-forget; never blocks signup).
  const link = appUrl(c.env, `/verify-email?token=${verifyToken}&email=${encodeURIComponent(body.email)}`);
  void sendEmail(c, {
    to: body.email,
    subject: "Verify your EduRank email",
    text: `Welcome to EduRank. Confirm your email to activate your account:\n${link}\n\nIf you didn't sign up, ignore this.`,
    html: `<p>Welcome to <b>EduRank</b>.</p><p>Confirm your email to activate your account:</p><p><a href="${link}">Verify my email</a></p><p>If you didn't sign up, you can ignore this.</p>`,
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

  // Early-access founder reward. New signups before the cutoff are permanent
  // FOUNDERs: they get a points bonus plus the founder badge. Windows set how
  // the launch is framed — a clean "join now, you're an OG" moment.
  const EARLY_ACCESS_UNTIL = envEarlyAccessUntil(c.env);
  if (now <= EARLY_ACCESS_UNTIL) {
    const hasFounder = await db.select({ id: badges.id }).from(badges).where(eq(badges.id, "founder")).limit(1);
    if (hasFounder.length > 0) {
      await db
        .insert(userBadges)
        .values({ userId, badgeId: "founder", awardedAt: now })
        .onConflictDoNothing();
      await awardPoints(c.env, {
        userId,
        delta: POINTS_RULES.FOUNDER_BONUS,
        reason: "founder_bonus",
        description: "Founder bonus — you joined during early access",
      });
    }
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

// GET /auth/verify-email?token=...&email=... — one-time activation link.
app.get("/verify-email", async (c) => {
  const token = c.req.query("token") ?? "";
  const email = (c.req.query("email") ?? "").trim().toLowerCase();
  if (!token || !email) err(400, "Invalid verification link.");
  const db = drizzle(c.env.DB);
  const hashed = await sha256Hex(token);
  const found = (await db.select().from(users).where(and(eq(users.email, email), eq(users.verifyToken, hashed))).limit(1)) as UserRow[];
  const user = found[0];
  if (!user) err(400, "This verification link is invalid or has already been used.");
  // Link valid for 24h.
  if (user.verifyTokenAt && Date.now() - user.verifyTokenAt > 24 * 3600 * 1000) {
    err(400, "This link has expired. Request a new one.");
  }
  await db.update(users).set({ emailVerifiedAt: Date.now(), verifyToken: null, verifyTokenAt: null }).where(eq(users.id, user.id));
  return c.json({ ok: true, email: user.email });
});

// POST /auth/resend-verification — resend the activation email.
// Works from the session token, or from an email for unauthenticated sessions.
app.post("/resend-verification", async (c) => {
  const db = drizzle(c.env.DB);
  let email: string | null = null;

  // Prefer the authenticated session so the client never has to send the email.
  const authed = await currentUser(c);
  if (authed) {
    email = authed.email;
  } else {
    const body = await parseJsonBody(c, z.object({ email: z.string().trim().toLowerCase().email() }));
    email = body.email;
  }

  const found = (await db.select().from(users).where(eq(users.email, email!)).limit(1)) as UserRow[];
  const user = found[0];
  // Always return ok:true to avoid leaking which emails are registered.
  if (user && !user.emailVerifiedAt) {
    const verifyToken = shortId(32);
    await db.update(users).set({ verifyToken: await sha256Hex(verifyToken), verifyTokenAt: Date.now() }).where(eq(users.id, user.id));
    const link = appUrl(c.env, `/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`);
    void sendEmail(c, {
      to: user.email,
      subject: "Verify your EduRank email",
      text: `Confirm your email for EduRank:\n${link}\n\nIf you didn't sign up, ignore this.`,
      html: `<p>Confirm your email for <b>EduRank</b>:</p><p><a href="${link}">Verify my email</a></p>`,
    });
  }
  return c.json({ ok: true });
});

// POST /auth/forgot-password — issue a reset link. Always ok to avoid leaking emails.
app.post("/forgot-password", async (c) => {
  const body = await parseJsonBody(c, z.object({ email: z.string().trim().toLowerCase().email() }));
  const db = drizzle(c.env.DB);
  const found = (await db.select().from(users).where(eq(users.email, body.email)).limit(1)) as UserRow[];
  const user = found[0];
  if (user) {
    const resetToken = shortId(32);
    await db.update(users).set({ resetToken: await sha256Hex(resetToken), resetTokenAt: Date.now() }).where(eq(users.id, user.id));
    const link = appUrl(c.env, `/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`);
    void sendEmail(c, {
      to: user.email,
      subject: "Reset your EduRank password",
      text: `Reset your EduRank password:\n${link}\n\nIf you didn't request this, you can ignore it.`,
      html: `<p>Reset your <b>EduRank</b> password:</p><p><a href="${link}">Reset password</a></p><p>If you didn't request this, ignore it.</p>`,
    });
  }
  return c.json({ ok: true });
});

// POST /auth/reset-password — set a new password with a valid reset token.
app.post("/reset-password", async (c) => {
  const body = await parseJsonBody(
    c,
    z.object({ token: z.string().min(1), email: z.string().trim().toLowerCase().email(), password: z.string().min(8, "Password needs at least 8 characters").max(100) }),
  );
  const db = drizzle(c.env.DB);
  const hashed = await sha256Hex(body.token);
  const found = (await db.select().from(users).where(and(eq(users.email, body.email), eq(users.resetToken, hashed))).limit(1)) as UserRow[];
  const user = found[0];
  if (!user) err(400, "This reset link is invalid or has already been used.");
  if (user.resetTokenAt && Date.now() - user.resetTokenAt > 60 * 60 * 1000) {
    err(400, "This link has expired. Request a new one.");
  }
  await db.update(users).set({ passwordHash: await hashPassword(body.password), resetToken: null, resetTokenAt: null }).where(eq(users.id, user.id));
  // Invalidate existing sessions after a password change.
  await db.delete(sessions).where(sql`user_id = ${user.id}`);
  return c.json({ ok: true });
});

export default app;

import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { challengeCompletions, noteUpvotes, noteUnlocks, notes } from "../db/schema";
import { requireUser } from "../lib/auth";
import { awardPoints } from "../lib/points";
import { dateKeySAST, startOfSASTDay } from "../lib/dates";
import type { AppEnv, UserRow } from "../types";
import { challengesForDate, type ChallengeStateDTO } from "@edurank/shared";

const app = new Hono<AppEnv>();

// GET /challenges/daily — computes live progress; auto-claims completed challenges once.
app.get("/daily", async (c) => {
  const user = (await requireUser(c)) as UserRow;
  const db = drizzle(c.env.DB);
  const today = dateKeySAST();
  const dayStart = startOfSASTDay(today);
  const defs = challengesForDate(today);

  const [downloadsRow] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(noteUnlocks)
    .where(sql`${noteUnlocks.userId} = ${user.id} AND ${noteUnlocks.createdAt} >= ${dayStart}`);
  const [uploadsRow] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(notes)
    .where(sql`${notes.uploaderId} = ${user.id} AND ${notes.createdAt} >= ${dayStart}`);
  const [upvotesRow] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(noteUpvotes)
    .where(sql`${noteUpvotes.userId} = ${user.id} AND ${noteUpvotes.createdAt} >= ${dayStart}`);

  const metrics = {
    downloads_today: Number(downloadsRow?.n ?? 0),
    uploads_today: Number(uploadsRow?.n ?? 0),
    upvotes_given_today: Number(upvotesRow?.n ?? 0),
    login_today: user.lastStreakDate === today ? 1 : 0,
  };

  const priorClaims = await db
    .select()
    .from(challengeCompletions)
    .where(sql`${challengeCompletions.userId} = ${user.id} AND ${challengeCompletions.dateKey} = ${today}`);
  const claimedKeys = new Set(priorClaims.map((r) => r.challengeKey));

  const states: ChallengeStateDTO[] = [];
  for (const def of defs) {
    const progress = Math.min(def.target, metrics[def.metric]);
    const complete = progress >= def.target;
    let claimed = claimedKeys.has(def.key);
    if (complete && !claimed) {
      await db
        .insert(challengeCompletions)
        .values({
          userId: user.id,
          dateKey: today,
          challengeKey: def.key,
          pointsAwarded: def.reward,
          claimedAt: Date.now(),
        })
        .onConflictDoNothing();
      const { balanceAfter } = await awardPoints(c.env, {
        userId: user.id,
        delta: def.reward,
        reason: "daily_challenge",
        description: `Daily challenge cleared — ${def.label}`,
      });
      user.balance = balanceAfter;
      claimed = true;
    }
    states.push({ ...def, progress, complete, claimed });
  }

  return c.json({ dateKey: today, challenges: states, balance: user.balance });
});

export default app;

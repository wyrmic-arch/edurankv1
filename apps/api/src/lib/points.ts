import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { POINTS_RULES, type LedgerReason } from "@edurank/shared";
import { pointsLedger, users } from "../db/schema";
import { shortId } from "./id";
import { dateKeySAST } from "./dates";
import type { UserRow } from "../types";

export interface AwardInput {
  userId: string;
  delta: number;
  reason: LedgerReason;
  description: string;
  noteId?: string | null;
  subjectId?: string | null;
  createdAt?: number;
}

/**
 * The single write path into the points ledger. Updates the user's running
 * totals and appends a ledger row whose balance_after is authoritative.
 */
export async function awardPoints(
  env: { DB: D1Database },
  input: AwardInput,
): Promise<{ balanceAfter: number; ledgerId: string }> {
  const db = drizzle(env.DB);
  const ledgerId = shortId(14);
  const at = input.createdAt ?? Date.now();

  const updated = await db
    .update(users)
    .set({
      balance: sql`${users.balance} + ${input.delta}`,
      totalEarned: sql`${users.totalEarned} + ${input.delta > 0 ? input.delta : 0}`,
      totalSpent: sql`${users.totalSpent} + ${input.delta < 0 ? -input.delta : 0}`,
    })
    .where(eq(users.id, input.userId))
    .returning({ balance: users.balance });

  const balanceAfter = updated[0]?.balance ?? 0;

  await db.insert(pointsLedger).values({
    id: ledgerId,
    userId: input.userId,
    delta: input.delta,
    reason: input.reason,
    noteId: input.noteId ?? null,
    subjectId: input.subjectId ?? null,
    description: input.description,
    balanceAfter,
    createdAt: at,
  });

  return { balanceAfter, ledgerId };
}

export interface StreakResult {
  user: UserRow;
  awardedToday: number;
}

/** Daily login streak processing — runs on login and on /auth/me. */
export async function processStreak(
  env: { DB: D1Database },
  user: UserRow,
): Promise<StreakResult> {
  const today = dateKeySAST();
  if (user.lastStreakDate === today) return { user, awardedToday: 0 };

  const yesterday = dateKeySAST(Date.now() - 86_400_000);
  const nextCount = user.lastStreakDate === yesterday ? user.streakCount + 1 : 1;
  const best = Math.max(user.bestStreak, nextCount);
  // Day 1 pays the base; each extra consecutive day adds a step up to the cap.
  const reward = Math.min(POINTS_RULES.STREAK_CAP, POINTS_RULES.STREAK_BASE + POINTS_RULES.STREAK_STEP * (nextCount - 1));

  const db = drizzle(env.DB);
  await db
    .update(users)
    .set({ lastStreakDate: today, streakCount: nextCount, bestStreak: best })
    .where(eq(users.id, user.id));

  let updatedUser: UserRow = { ...user, lastStreakDate: today, streakCount: nextCount, bestStreak: best };
  let awarded = 0;
  if (reward > 0) {
    await awardPoints(env, {
      userId: user.id,
      delta: reward,
      reason: "streak_bonus",
      description: `Day ${nextCount} login streak`,
    });
    updatedUser = {
      ...updatedUser,
      balance: updatedUser.balance + reward,
      totalEarned: updatedUser.totalEarned + reward,
    };
    awarded = reward;
  }
  return { user: updatedUser, awardedToday: awarded };
}

/** Awards the one-time profile completion bonus once grade + school are set. */
export async function checkProfileCompletion(env: { DB: D1Database }, user: UserRow): Promise<UserRow> {
  if (user.profileCompletedAt) return user;
  if (!user.grade || !user.schoolId) return user;

  const now = Date.now();
  const db = drizzle(env.DB);
  const res = await db
    .update(users)
    .set({ profileCompletedAt: now })
    .where(and(eq(users.id, user.id), sql`${users.profileCompletedAt} IS NULL`))
    .returning({ id: users.id });
  if (res.length === 0) return user;

  const { balanceAfter } = await awardPoints(env, {
    userId: user.id,
    delta: POINTS_RULES.PROFILE_COMPLETE,
    reason: "profile_bonus",
    description: "Profile completed",
    createdAt: now,
  });
  return { ...user, profileCompletedAt: now, balance: balanceAfter, totalEarned: user.totalEarned + POINTS_RULES.PROFILE_COMPLETE };
}

/** Public rank = position by total earned among all users. */
export async function rankOf(env: { DB: D1Database }, totalEarned: number): Promise<number> {
  const db = drizzle(env.DB);
  const rows = await db
    .select({ n: sql<number>`COUNT(*) + 1` })
    .from(users)
    .where(sql`${users.totalEarned} > ${totalEarned}`);
  return rows[0]?.n ?? 1;
}

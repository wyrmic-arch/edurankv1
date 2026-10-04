import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { POINTS_RULES, type LedgerReason } from "@edurank/shared";
import { pointsLedger, streakClaims, users } from "../db/schema";
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
  const ledgerId = shortId(14);
  const at = input.createdAt ?? Date.now();
  const earned = input.delta > 0 ? input.delta : 0;
  const spent = input.delta < 0 ? -input.delta : 0;

  // A D1 batch is a single atomic transaction: the balance update and its
  // ledger row commit together or not at all, so a crash can't leave the
  // running balance out of sync with the ledger. The ledger's balance_after is
  // read via subquery AFTER the update within the same transaction.
  const results = await env.DB.batch([
    env.DB
      .prepare(
        `UPDATE users
            SET balance = balance + ?1,
                total_earned = total_earned + ?2,
                total_spent = total_spent + ?3
          WHERE id = ?4
          RETURNING balance`,
      )
      .bind(input.delta, earned, spent, input.userId),
    env.DB
      .prepare(
        `INSERT INTO points_ledger
           (id, user_id, delta, reason, note_id, subject_id, description, balance_after, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, (SELECT balance FROM users WHERE id = ?2), ?8)`,
      )
      .bind(
        ledgerId,
        input.userId,
        input.delta,
        input.reason,
        input.noteId ?? null,
        input.subjectId ?? null,
        input.description,
        at,
      ),
  ]);

  const updatedRows = (results[0]?.results ?? []) as Array<{ balance: number }>;
  return { balanceAfter: Number(updatedRows[0]?.balance ?? 0), ledgerId };
}

/**
 * Atomic spend path. The conditional `WHERE balance >= amount` guarantees a
 * concurrent pair of spends can never drive the balance negative: whichever
 * statement lands second simply matches zero rows and reports `ok: false`.
 * Only after the guarded decrement succeeds do we append the ledger row.
 */
export async function spendPoints(
  env: { DB: D1Database },
  input: Omit<AwardInput, "delta"> & { amount: number },
): Promise<{ ok: boolean; balanceAfter: number }> {
  const db = drizzle(env.DB);
  const amount = input.amount;
  if (amount <= 0) {
    const row = await db.select({ b: users.balance }).from(users).where(eq(users.id, input.userId)).limit(1);
    return { ok: true, balanceAfter: row[0]?.b ?? 0 };
  }

  const updated = await db
    .update(users)
    .set({
      balance: sql`${users.balance} - ${amount}`,
      totalSpent: sql`${users.totalSpent} + ${amount}`,
    })
    .where(and(eq(users.id, input.userId), sql`${users.balance} >= ${amount}`))
    .returning({ balance: users.balance });

  if (updated.length === 0) {
    const row = await db.select({ b: users.balance }).from(users).where(eq(users.id, input.userId)).limit(1);
    return { ok: false, balanceAfter: row[0]?.b ?? 0 };
  }

  const balanceAfter = updated[0]!.balance;
  await db.insert(pointsLedger).values({
    id: shortId(14),
    userId: input.userId,
    delta: -amount,
    reason: input.reason,
    noteId: input.noteId ?? null,
    subjectId: input.subjectId ?? null,
    description: input.description,
    balanceAfter,
    createdAt: input.createdAt ?? Date.now(),
  });
  return { ok: true, balanceAfter };
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

  // Write the claim token FIRST. If the worker dies between this insert and
  // the user/ledger update, a retry sees the claim row and short-circuits —
  // no double-pay, no stuck streak. PK on (user_id, date_key) makes the insert
  // itself idempotent under concurrent calls.
  try {
    await db.insert(streakClaims).values({
      userId: user.id,
      dateKey: today,
      streakCount: nextCount,
      reward,
      claimedAt: Date.now(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE") || msg.includes("constraint")) {
      // Already claimed today (concurrent request or previous crash) — bail.
      return { user, awardedToday: 0 };
    }
    throw e;
  }

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

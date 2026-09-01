import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { notes, noteUpvotes, noteUnlocks, purchases, userBadges, users } from "../db/schema";

export const BADGE_CRITERIA = [
  "uploads_approved",
  "downloads_received",
  "upvotes_received",
  "streak",
  "total_earned",
  "purchases",
] as const;
export type BadgeCriteria = (typeof BADGE_CRITERIA)[number];

interface BadgeRow {
  id: string;
  criteria_type: BadgeCriteria;
  threshold: number;
}

/** Evaluate every badge's criteria for a user and award any newly earned ones. */
export async function evalBadges(env: { DB: D1Database }, userId: string): Promise<string[]> {
  const db = drizzle(env.DB);
  const now = Date.now();

  const [uploadsRow] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(notes)
    .where(and(eq(notes.uploaderId, userId), eq(notes.status, "approved")));

  const [downloadsRow] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(noteUnlocks)
    .innerJoin(notes, eq(notes.id, noteUnlocks.noteId))
    .where(eq(notes.uploaderId, userId));

  const [upvotesRow] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(noteUpvotes)
    .innerJoin(notes, eq(notes.id, noteUpvotes.noteId))
    .where(eq(notes.uploaderId, userId));

  const [userStats] = await db
    .select({ bestStreak: users.bestStreak, totalEarned: users.totalEarned })
    .from(users)
    .where(eq(users.id, userId));

  const [purchasesRow] = await db
    .select({ n: sql<number>`COUNT(DISTINCT ${purchases.itemId})` })
    .from(purchases)
    .where(eq(purchases.userId, userId));

  const stats: Record<BadgeCriteria, number> = {
    uploads_approved: Number(uploadsRow?.n ?? 0),
    downloads_received: Number(downloadsRow?.n ?? 0),
    upvotes_received: Number(upvotesRow?.n ?? 0),
    streak: Number(userStats?.bestStreak ?? 0),
    total_earned: Number(userStats?.totalEarned ?? 0),
    purchases: Number(purchasesRow?.n ?? 0),
  };

  const catalogRes = await env.DB.prepare(
    "SELECT id, criteria_type, threshold FROM badges",
  ).all<BadgeRow>();
  const catalog = catalogRes.results ?? [];

  const ownedRows = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  const owned = new Set(ownedRows.map((r) => r.badgeId));

  const earnedNow: string[] = [];
  for (const b of catalog) {
    if (owned.has(b.id)) continue;
    const stat = stats[b.criteria_type];
    if (stat !== undefined && stat >= b.threshold) {
      await db
        .insert(userBadges)
        .values({ userId, badgeId: b.id, awardedAt: now })
        .onConflictDoNothing();
      earnedNow.push(b.id);
    }
  }
  return earnedNow;
}

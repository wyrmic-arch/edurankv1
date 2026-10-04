import { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import type { UserRole } from "@edurank/shared";
import { badges, purchases, schools, shopItems, userBadges, users } from "../db/schema";
import { requireUser } from "../lib/auth";
import { awardPoints, checkProfileCompletion, rankOf } from "../lib/points";
import { evalBadges } from "../lib/badges";
import { err, pagination, parseJsonBody, publicUser } from "../lib/http";
import { shortId } from "../lib/id";
import type { AppEnv, LedgerReason, UserRow } from "../types";

const app = new Hono<AppEnv>();

// GET /me — current profile snapshot (no streak side effects; use /auth/me for that)
app.get("/me", async (c) => {
  const user = await requireUser(c);
  const rank = await rankOf(c.env, user.totalEarned);
  const schoolRow = user.schoolId
    ? (await drizzle(c.env.DB).select({ name: schools.name }).from(schools).where(eq(schools.id, user.schoolId)).limit(1))[0]
    : undefined;
  return c.json({ user: publicUser(user, schoolRow?.name ?? null, rank) });
});

app.patch("/me", async (c) => {
  const user = await requireUser(c);
  const body = await parseJsonBody(
    c,
    z.object({
      displayName: z.string().trim().min(3).max(24).optional(),
      bio: z.string().trim().max(280).optional(),
      grade: z.number().int().min(8).max(12).nullable().optional(),
      schoolId: z.string().nullable().optional(),
      equippedFrameId: z.string().nullable().optional(),
      equippedSkinId: z.string().nullable().optional(),
    }),
  );
  const db = drizzle(c.env.DB);

  if (body.schoolId) {
    const s = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, body.schoolId)).limit(1);
    if (s.length === 0) err(400, "Unknown school");
  }

  // Cosmetics can only be equipped if actually owned AND of the matching kind
  // (a purchased badge id must not be assignable to a frame/skin slot).
  const slots = [
    { key: "equippedFrameId", kind: "frame" },
    { key: "equippedSkinId", kind: "skin" },
  ] as const;
  for (const { key, kind } of slots) {
    const itemId = body[key];
    if (!itemId) continue;
    const owned = await db
      .select({ kind: shopItems.kind })
      .from(purchases)
      .innerJoin(shopItems, eq(shopItems.id, purchases.itemId))
      .where(and(eq(purchases.userId, user.id), eq(purchases.itemId, itemId)))
      .limit(1);
    if (owned.length === 0) err(403, "You don't own that cosmetic yet — hit the shop.");
    if (owned[0]!.kind !== kind) err(400, `That item can't be equipped as a ${kind}.`);
  }

  await db.update(users).set(body).where(eq(users.id, user.id));
  const fresh = (await db.select().from(users).where(eq(users.id, user.id)).limit(1))[0] as UserRow;
  const completed = await checkProfileCompletion(c.env, fresh);
  await evalBadges(c.env, user.id);
  const rank = await rankOf(c.env, completed.totalEarned);
  const school = body.schoolId
    ? (await drizzle(c.env.DB).select({ name: schools.name }).from(schools).where(eq(schools.id, completed.schoolId ?? "")).limit(1))[0]?.name ?? null
    : null;
  return c.json({ user: publicUser(completed, school, rank) });
});

app.post("/me/avatar", async (c) => {
  const user = await requireUser(c);
  const form = await c.req.parseBody();
  const file = form["file"];
  if (!(file instanceof File)) err(400, "Attach an image file in the 'file' field");
  if (!/^(image\/(png|jpeg|webp|gif))$/.test(file.type)) err(415, "Avatar must be PNG, JPEG, WebP or GIF");
  if (file.size > 2 * 1024 * 1024) err(413, "Avatar must be under 2MB");

  const ext = file.type.split("/")[1]!.replace("jpeg", "jpg");
  const key = `avatars/${user.id}/${shortId(8)}.${ext}`;
  await c.env.NOTES_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  const avatarUrl = `/r2/${key}`;
  const db = drizzle(c.env.DB);
  await db.update(users).set({ avatarUrl }).where(eq(users.id, user.id));
  return c.json({ avatarUrl });
});

interface LedgerRow {
  id: string;
  delta: number;
  reason: LedgerReason;
  description: string;
  balance_after: number;
  created_at: number;
  note_id: string | null;
}

app.get("/me/ledger", async (c) => {
  const user = await requireUser(c);
  const { page, pageSize, offset } = pagination(c);
  const flow = c.req.query("flow") ?? "all"; // all | earned | spent
  const flowClause = flow === "earned" ? "AND delta > 0" : flow === "spent" ? "AND delta < 0" : "";

  const rowsRes = await c.env.DB.prepare(
    `SELECT id, delta, reason, description, balance_after, created_at, note_id
     FROM points_ledger WHERE user_id = ?1 ${flowClause} ORDER BY created_at DESC LIMIT ?2 OFFSET ?3`,
  )
    .bind(user.id, pageSize, offset)
    .all<LedgerRow>();
  const rows = rowsRes.results ?? [];

  const totalRes = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM points_ledger WHERE user_id = ?1 ${flowClause}`,
  )
    .bind(user.id)
    .all<{ n: number }>();

  return c.json({
    items: rows.map((r) => ({
      id: r.id,
      delta: r.delta,
      reason: r.reason,
      description: r.description,
      balanceAfter: r.balance_after,
      createdAt: new Date(r.created_at).toISOString(),
      noteId: r.note_id,
    })),
    page,
    pageSize,
    total: Number(totalRes.results?.[0]?.n ?? 0),
  });
});

app.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const row = (
    await db
      .select({ user: users, schoolName: schools.name })
      .from(users)
      .leftJoin(schools, eq(schools.id, users.schoolId))
      .where(eq(users.id, id))
      .limit(1)
  )[0];
  if (!row) err(404, "No such player on the board.");

  // Drizzle returns role as `string`; narrow it here at the API boundary.
  const userRow: UserRow = { ...row.user, role: row.user.role as UserRole };

  const rank = await rankOf(c.env, userRow.totalEarned);

  const badgeRows = await db
    .select({
      id: badges.id,
      name: badges.name,
      description: badges.description,
      icon: badges.icon,
      tier: badges.tier,
      criteriaType: badges.criteriaType,
      threshold: badges.threshold,
      awardedAt: userBadges.awardedAt,
    })
    .from(badges)
    .leftJoin(userBadges, and(eq(userBadges.badgeId, badges.id), eq(userBadges.userId, id)));

  const [stats] = await db
    .select({
      uploads: sql<number>`(SELECT COUNT(*) FROM notes WHERE uploader_id = ${id} AND status = 'approved')`,
      downloadsReceived: sql<number>`(SELECT COUNT(*) FROM note_unlocks u JOIN notes n ON n.id = u.note_id WHERE n.uploader_id = ${id})`,
      upvotesReceived: sql<number>`(SELECT COUNT(*) FROM note_upvotes v JOIN notes n ON n.id = v.note_id WHERE n.uploader_id = ${id})`,
    })
    .from(sql`(SELECT 1)`);

  return c.json({
    user: publicUser(userRow, row.schoolName, rank),
    stats: {
      uploads: Number(stats?.uploads ?? 0),
      downloadsReceived: Number(stats?.downloadsReceived ?? 0),
      upvotesReceived: Number(stats?.upvotesReceived ?? 0),
    },
    badges: badgeRows.map((b) => ({
      ...b,
      awardedAt: b.awardedAt ? new Date(b.awardedAt).toISOString() : null,
    })),
  });
});

// Inventory for the profile screen: earned badges + purchased cosmetics.
app.get("/me/inventory", async (c) => {
  const user = await requireUser(c);
  const db = drizzle(c.env.DB);
  const items = await db.select().from(shopItems);
  const owned = await db.select({ itemId: purchases.itemId }).from(purchases).where(eq(purchases.userId, user.id));
  const ownedSet = new Set(owned.map((o) => o.itemId));
  return c.json({
    items: items
      .filter((i) => ownedSet.has(i.id))
      .map((i) => ({
        id: i.id,
        kind: i.kind as "badge" | "frame" | "skin",
        name: i.name,
        description: i.description,
        pricePoints: i.pricePoints,
        config: JSON.parse(i.configJson) as Record<string, unknown>,
        owned: true,
        equipped: i.kind === "frame" ? user.equippedFrameId === i.id : i.kind === "skin" ? user.equippedSkinId === i.id : false,
      })),
  });
});

export default app;

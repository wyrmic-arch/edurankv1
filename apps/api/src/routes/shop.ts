import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { purchases, shopItems, users } from "../db/schema";
import { currentUser, requireUser } from "../lib/auth";
import { spendPoints } from "../lib/points";
import { evalBadges } from "../lib/badges";
import { err } from "../lib/http";
import type { AppEnv, ShopRow, UserRow } from "../types";

const app = new Hono<AppEnv>();

app.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const viewer = await currentUser(c);
  const items = await db.select().from(shopItems).orderBy(shopItems.kind, shopItems.sortOrder);
  const ownedSet = new Set<string>();
  if (viewer) {
    const owned = await db.select({ itemId: purchases.itemId }).from(purchases).where(eq(purchases.userId, viewer.id));
    owned.forEach((o) => ownedSet.add(o.itemId));
  }
  return c.json({
    items: items.map((i) => ({
      id: i.id,
      kind: i.kind as "badge" | "frame" | "skin",
      name: i.name,
      description: i.description,
      pricePoints: i.pricePoints,
      config: JSON.parse(i.configJson) as Record<string, unknown>,
      owned: ownedSet.has(i.id),
      equipped:
        viewer != null &&
        ((i.kind === "frame" && viewer.equippedFrameId === i.id) ||
          (i.kind === "skin" && viewer.equippedSkinId === i.id)),
    })),
  });
});

// POST /shop/:id/purchase
app.post("/:id/purchase", async (c) => {
  const user = await requireUser(c);
  const itemId = c.req.param("id");
  const db = drizzle(c.env.DB);
  const item = (await db.select().from(shopItems).where(eq(shopItems.id, itemId)).limit(1))[0] as ShopRow | undefined;
  if (!item) err(404, "That item isn't stocked.");
  if (user.balance < item.pricePoints) err(402, `Not enough PTS — you need ${item.pricePoints - user.balance} more.`);

  // Insert the purchase first so a second concurrent buy of the SAME item hits
  // UNIQUE and bails before any points move.
  const purchaseId = crypto.randomUUID();
  try {
    await db.insert(purchases).values({
      id: purchaseId,
      userId: user.id,
      itemId,
      pricePaid: item.pricePoints,
      createdAt: Date.now(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE") || msg.includes("constraint")) {
      err(409, "Already in your inventory.");
    }
    throw e;
  }

  // Guarded atomic decrement. If a concurrent spend drained the balance since
  // the pre-check, roll the purchase row back and refuse (never go negative).
  const spend = await spendPoints(c.env, {
    userId: user.id,
    amount: item.pricePoints,
    reason: "cosmetic_purchase",
    description: `Bought "${item.name}" (${item.kind})`,
  });
  if (!spend.ok) {
    await db.delete(purchases).where(and(eq(purchases.userId, user.id), eq(purchases.itemId, itemId)));
    err(402, `Not enough PTS — you need ${item.pricePoints - spend.balanceAfter} more.`);
  }
  const balanceAfter = spend.balanceAfter;

  // Auto-equip frames/skins on purchase.
  if (item.kind === "frame") await db.update(users).set({ equippedFrameId: itemId }).where(eq(users.id, user.id));
  if (item.kind === "skin") await db.update(users).set({ equippedSkinId: itemId }).where(eq(users.id, user.id));

  await evalBadges(c.env, user.id);

  const freshUser = (await db.select().from(users).where(eq(users.id, user.id)).limit(1))[0] as UserRow;
  return c.json({
    purchased: true,
    itemId,
    balanceAfter,
    equippedFrameId: freshUser.equippedFrameId,
    equippedSkinId: freshUser.equippedSkinId,
  });
});
export default app;

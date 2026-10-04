import { Hono } from "hono";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { notifications, users } from "../db/schema";
import { requireUser } from "../lib/auth";
import { err, pagination } from "../lib/http";
import type { AppEnv } from "../types";
import type { NotificationDTO, NotificationType } from "@edurank/shared";

const app = new Hono<AppEnv>();

type NotificationRow = typeof notifications.$inferSelect;

function toDTO(n: NotificationRow): NotificationDTO {
  return {
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.readAt != null,
    createdAt: new Date(Number(n.createdAt)).toISOString(),
  };
}

// GET /notifications — list (newest first) + unread count
app.get("/", async (c) => {
  const user = await requireUser(c);
  const { page, pageSize, offset } = pagination(c);
  const db = drizzle(c.env.DB);
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset(offset);
  const [countRow] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(eq(notifications.userId, user.id));
  const [unreadRow] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  return c.json({
    items: rows.map(toDTO),
    page,
    pageSize,
    total: Number(countRow?.n ?? 0),
    unread: Number(unreadRow?.n ?? 0),
  });
});

app.get("/unread-count", async (c) => {
  const user = await requireUser(c);
  const [row] = await drizzle(c.env.DB)
    .select({ n: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  return c.json({ unread: Number(row?.n ?? 0) });
});

// POST /notifications/read { ids? } — mark the given ids (or all) read
app.post("/read", async (c) => {
  const user = await requireUser(c);
  const body = await c.req.json<{ ids?: string[] }>().catch(() => ({} as { ids?: string[] }));
  const db = drizzle(c.env.DB);
  const now = Date.now();
  if (Array.isArray(body.ids) && body.ids.length > 0) {
    await db
      .update(notifications)
      .set({ readAt: now })
      .where(and(eq(notifications.userId, user.id), inArray(notifications.id, body.ids), isNull(notifications.readAt)));
  } else {
    await db
      .update(notifications)
      .set({ readAt: now })
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  }
  return c.json({ ok: true });
});

// GET/PATCH /notifications/prefs
app.get("/prefs", async (c) => {
  const user = await requireUser(c);
  return c.json({ email: user.notifyEmail === 1 });
});

app.patch("/prefs", async (c) => {
  const user = await requireUser(c);
  const body = await c.req.json<{ email?: boolean }>().catch(() => ({} as { email?: boolean }));
  if (typeof body.email !== "boolean") err(400, "email must be a boolean.");
  await drizzle(c.env.DB).update(users).set({ notifyEmail: body.email ? 1 : 0 }).where(eq(users.id, user.id));
  return c.json({ ok: true, email: body.email });
});

export default app;

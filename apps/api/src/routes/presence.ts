import { Hono } from "hono";
import { currentUser } from "../lib/auth";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

const MAX_CLIENT_ID = 64;
const MAX_PATH = 120;

/**
 * Drop presence rows nobody has refreshed in `olderThanMs`. Called from the
 * daily cron and opportunistically from the owner live endpoint so the table
 * can't grow without bound from one-off visitors.
 */
export async function pruneStalePresence(db: D1Database, olderThanMs = 24 * 3600 * 1000): Promise<void> {
  await db.prepare("DELETE FROM presence WHERE last_seen < ?").bind(Date.now() - olderThanMs).run();
}

// POST /presence — heartbeat sent every ~30s by an open tab. Anonymous-friendly:
// signed-in visitors are tagged with their user id, everyone else is a guest.
app.post("/", async (c) => {
  let body: { clientId?: unknown; path?: unknown };
  try {
    body = (await c.req.json()) as { clientId?: unknown; path?: unknown };
  } catch {
    return c.json({ error: "Bad request" }, 400);
  }

  const clientId = typeof body.clientId === "string" ? body.clientId.slice(0, MAX_CLIENT_ID) : "";
  if (clientId.length < 8) return c.json({ error: "clientId required" }, 400);
  const path = typeof body.path === "string" ? body.path.slice(0, MAX_PATH) : null;

  const user = await currentUser(c);
  const now = Date.now();

  await c.env.DB.prepare(
    `INSERT INTO presence (client_id, user_id, path, first_seen, last_seen)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(client_id) DO UPDATE SET
       user_id = excluded.user_id,
       path = excluded.path,
       last_seen = excluded.last_seen`,
  )
    .bind(clientId, user?.id ?? null, path, now, now)
    .run();

  return c.json({ ok: true });
});

export default app;

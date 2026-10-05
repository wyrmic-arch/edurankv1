import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { suggestions } from "../db/schema";
import { requireUser } from "../lib/auth";
import { err, parseJsonBody } from "../lib/http";
import { shortId } from "../lib/id";
import { sendAlert } from "../lib/email";
import type { AppEnv } from "../types";
import type { SuggestionDTO } from "@edurank/shared";

const app = new Hono<AppEnv>();

type Row = typeof suggestions.$inferSelect;

function toDTO(s: Row): SuggestionDTO {
  return {
    id: s.id,
    title: s.title,
    body: s.body,
    category: s.category as SuggestionDTO["category"],
    status: s.status as SuggestionDTO["status"],
    adminNote: s.adminNote,
    createdAt: new Date(Number(s.createdAt)).toISOString(),
    updatedAt: s.updatedAt ? new Date(Number(s.updatedAt)).toISOString() : null,
  };
}

// POST /suggestions — submit an improvement idea / bug / request
app.post("/", async (c) => {
  const user = await requireUser(c);
  const body = await parseJsonBody(
    c,
    z.object({
      title: z.string().trim().min(3, "Give it a short title").max(120),
      body: z.string().trim().min(10, "Tell us a bit more").max(2000),
      category: z.enum(["idea", "bug", "content", "other"]).optional(),
    }),
  );
  const now = Date.now();
  const id = shortId(12);
  await drizzle(c.env.DB).insert(suggestions).values({
    id,
    userId: user.id,
    title: body.title,
    body: body.body,
    category: body.category ?? "idea",
    status: "open",
    createdAt: now,
  });

  try {
    c.executionCtx.waitUntil(
      sendAlert(c.env, "New suggestion", `${body.title}\n\n${body.body}\n\nFrom: ${user.displayName} (${user.id})`),
    );
  } catch {
    /* best-effort */
  }
  return c.json({ ok: true, id }, 201);
});

// GET /suggestions/mine — the caller's own submissions
app.get("/mine", async (c) => {
  const user = await requireUser(c);
  const rows = await drizzle(c.env.DB)
    .select()
    .from(suggestions)
    .where(eq(suggestions.userId, user.id))
    .orderBy(suggestions.createdAt);
  return c.json({ items: rows.map(toDTO).reverse() });
});

// DELETE /suggestions/:id — withdraw your own open suggestion
app.delete("/:id", async (c) => {
  const user = await requireUser(c);
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const row = (await db.select().from(suggestions).where(eq(suggestions.id, id)).limit(1))[0];
  if (!row) err(404, "Not found.");
  if (row.userId !== user.id) err(403, "That isn't yours.");
  if (row.status !== "open") err(400, "That one's already in review.");
  await db.delete(suggestions).where(eq(suggestions.id, id));
  return c.json({ ok: true });
});

export default app;

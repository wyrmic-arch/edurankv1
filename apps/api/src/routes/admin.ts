import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "../db/schema";
import { requireAdmin } from "../lib/auth";
import { awardPoints } from "../lib/points";
import { evalBadges } from "../lib/badges";
import { err } from "../lib/http";
import { POINTS_RULES } from "@edurank/shared";
import type { AppEnv, NoteRow, UserRow } from "../types";

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  await requireAdmin(c);
  await next();
});

interface PendingRawRow {
  id: string;
  title: string;
  description: string;
  topic: string;
  grade: number;
  uploader_id: string;
  uploader_name: string;
  subject_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: number;
}

// GET /admin/pending — moderation queue
app.get("/pending", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT n.*, u.display_name AS uploader_name, s.name AS subject_name
     FROM notes n JOIN users u ON u.id = n.uploader_id JOIN subjects s ON s.id = n.subject_id
     WHERE n.status = 'pending' ORDER BY n.created_at ASC LIMIT 100`,
  ).all<PendingRawRow>();
  const rows = res.results ?? [];
  return c.json({
    items: rows.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      topic: n.topic,
      grade: n.grade,
      subjectName: n.subject_name,
      uploaderId: n.uploader_id,
      uploaderName: n.uploader_name,
      fileName: n.file_name,
      fileSize: n.file_size,
      mimeType: n.mime_type,
      createdAt: new Date(Number(n.created_at)).toISOString(),
    })),
  });
});

// POST /admin/notes/:id/approve
app.post("/notes/:id/approve", async (c) => {
  const admin = (await requireAdmin(c)) as UserRow;
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note) err(404, "Note not found");
  if (note.status !== "pending") err(409, "That note was already reviewed.");

  await db
    .update(notes)
    .set({ status: "approved", reviewedBy: admin.id, reviewedAt: Date.now(), reviewNote: null })
    .where(eq(notes.id, id));

  // Contribution payout lands the moment the note clears review.
  const { balanceAfter } = await awardPoints(c.env, {
    userId: note.uploaderId,
    delta: POINTS_RULES.UPLOAD_APPROVED,
    reason: "upload_approved",
    description: `"${note.title}" approved`,
    noteId: note.id,
    subjectId: note.subjectId,
  });

  await evalBadges(c.env, note.uploaderId);
  return c.json({ ok: true, status: "approved", uploaderBalanceAfter: balanceAfter });
});

// POST /admin/notes/:id/reject  { reason }
app.post("/notes/:id/reject", async (c) => {
  const admin = (await requireAdmin(c)) as UserRow;
  const id = c.req.param("id");
  const body = await c.req.json<{ reason?: string }>().catch(() => ({ reason: undefined }));
  const reason = (body.reason ?? "").slice(0, 280) || "Didn't meet quality standards.";
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note) err(404, "Note not found");
  if (note.status !== "pending") err(409, "That note was already reviewed.");

  await db
    .update(notes)
    .set({ status: "rejected", reviewedBy: admin.id, reviewedAt: Date.now(), reviewNote: reason })
    .where(eq(notes.id, id));
  return c.json({ ok: true, status: "rejected" });
});

// GET /admin/stats — quick counts for the moderation header
app.get("/stats", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM notes WHERE status='pending') AS pending,
       (SELECT COUNT(*) FROM notes WHERE status='approved') AS approved,
       (SELECT COUNT(*) FROM notes WHERE status='rejected') AS rejected,
       (SELECT COUNT(*) FROM users WHERE role != 'x') AS players,
       (SELECT IFNULL(SUM(delta),0) FROM points_ledger WHERE delta > 0) AS points_earned_all_time`,
  ).all<Record<string, number>>();
  const r = res.results?.[0] ?? {};
  return c.json({
    pending: Number(r.pending ?? 0),
    approved: Number(r.approved ?? 0),
    rejected: Number(r.rejected ?? 0),
    players: Number(r.players ?? 0),
    pointsEarnedAllTime: Number(r.points_earned_all_time ?? 0),
  });
});

export default app;

import { Hono } from "hono";
import { and, desc, eq, like, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { notes, noteReports, schools, staffInvites, users } from "../db/schema";
import { requireAdmin } from "../lib/auth";
import { awardPoints } from "../lib/points";
import { evalBadges } from "../lib/badges";
import { notify } from "../lib/notify";
import { runDigest } from "../lib/digest";
import { err } from "../lib/http";
import { shortId } from "../lib/id";
import { POINTS_RULES, USER_ROLES, academicYear, type UserRole } from "@edurank/shared";
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

// GET /admin/rejected — notes the AI/human reviewers turned away (with reasons)
app.get("/rejected", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT n.id, n.title, n.description, n.topic, n.grade, n.file_name, n.file_size, n.mime_type,
            n.review_note, n.reviewed_by, n.reviewed_at, n.created_at,
            u.display_name AS uploader_name, s.name AS subject_name
       FROM notes n JOIN users u ON u.id = n.uploader_id JOIN subjects s ON s.id = n.subject_id
      WHERE n.status = 'rejected'
      ORDER BY n.reviewed_at DESC, n.created_at DESC LIMIT 100`,
  ).all<{
    id: string;
    title: string;
    description: string;
    topic: string;
    grade: number;
    file_name: string;
    file_size: number;
    mime_type: string;
    review_note: string | null;
    reviewed_by: string | null;
    reviewed_at: number | null;
    created_at: number;
    uploader_name: string;
    subject_name: string;
  }>();
  return c.json({
    items: (res.results ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      topic: n.topic,
      grade: Number(n.grade),
      subjectName: n.subject_name,
      uploaderName: n.uploader_name,
      fileName: n.file_name,
      fileSize: Number(n.file_size),
      mimeType: n.mime_type,
      reviewNote: n.review_note,
      reviewedBy: n.reviewed_by,
      reviewedAt: n.reviewed_at ? new Date(Number(n.reviewed_at)).toISOString() : null,
      createdAt: new Date(Number(n.created_at)).toISOString(),
    })),
  });
});

// POST /admin/notes/:id/restore — bring a rejected note back to approved
// (no payout: it is a moderation reversal, not a first approval).
app.post("/notes/:id/restore", async (c) => {
  const admin = (await requireAdmin(c)) as UserRow;
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const flipped = await db
    .update(notes)
    .set({ status: "approved", reviewedBy: admin.id, reviewedAt: Date.now(), reviewNote: null })
    .where(and(eq(notes.id, id), ne(notes.status, "approved")))
    .returning({ id: notes.id });
  if (flipped.length === 0) err(404, "Note not found or already approved.");
  return c.json({ ok: true, status: "approved" });
});

// GET /admin/ai-check — verify the Workers AI moderation binding is working
app.get("/ai-check", async (c) => {
  await requireAdmin(c);
  if (!c.env.AI) return c.json({ ok: false, error: "AI binding is not configured." });
  try {
    const res = (await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
      prompt: "Reply with exactly: OK",
      max_tokens: 5,
      temperature: 0,
    })) as { response?: string };
    return c.json({ ok: true, sample: (res.response ?? "").trim().slice(0, 40) });
  } catch (e) {
    return c.json({ ok: false, error: (e instanceof Error ? e.message : String(e)).slice(0, 200) });
  }
});

// POST /admin/notes/:id/approve
app.post("/notes/:id/approve", async (c) => {
  const admin = (await requireAdmin(c)) as UserRow;
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note) err(404, "Note not found");
  if (note.status !== "pending") err(409, "That note was already reviewed.");

  // Conditional update closes the race: only the request that actually flips
  // the row pending -> approved proceeds to pay out. A concurrent second
  // approval (or the AI moderator) matches zero rows and bails.
  const flipped = await db
    .update(notes)
    .set({ status: "approved", reviewedBy: admin.id, reviewedAt: Date.now(), reviewNote: null })
    .where(and(eq(notes.id, id), eq(notes.status, "pending")))
    .returning({ id: notes.id });
  if (flipped.length === 0) err(409, "That note was already reviewed.");

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
  await notify(c.env, note.uploaderId, {
    type: "note_approved",
    title: `Note approved: "${note.title}"`,
    body: `+${POINTS_RULES.UPLOAD_APPROVED} PTS — it's live on the board now.`,
    link: `/notes/${id}`,
  });
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
  await notify(c.env, note.uploaderId, {
    type: "note_rejected",
    title: `Note rejected: "${note.title}"`,
    body: reason,
    link: `/notes/${id}`,
  });
  return c.json({ ok: true, status: "rejected" });
});

// POST /admin/users/:id/grade { grade?, heldBack?, graduated? } — admin override
app.post("/users/:id/grade", async (c) => {
  const id = c.req.param("id");
  const body = await c.req
    .json<{ grade?: number | null; heldBack?: boolean; graduated?: boolean }>()
    .catch(() => ({} as { grade?: number | null; heldBack?: boolean; graduated?: boolean }));

  const patch: Partial<{ grade: number | null; gradeYear: number | null; gradeSetAt: number | null; heldBack: number; graduatedAt: number | null }> = {};
  if (body.grade !== undefined) {
    if (body.grade !== null && (body.grade < 8 || body.grade > 12)) err(400, "Grade must be 8–12.");
    patch.grade = body.grade;
    if (body.grade != null) {
      patch.gradeYear = academicYear();
      patch.gradeSetAt = Date.now();
    }
  }
  if (body.heldBack !== undefined) patch.heldBack = body.heldBack ? 1 : 0;
  if (body.graduated !== undefined) patch.graduatedAt = body.graduated ? Date.now() : null;
  if (Object.keys(patch).length === 0) err(400, "Nothing to update.");

  await drizzle(c.env.DB).update(users).set(patch).where(eq(users.id, id));
  return c.json({ ok: true });
});

// GET /admin/promotions/preview — who advances / repeats / graduates
app.get("/promotions/preview", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT grade,
            COUNT(*) AS total,
            SUM(CASE WHEN held_back = 1 THEN 1 ELSE 0 END) AS held_back
       FROM users
      WHERE role = 'user' AND grade IS NOT NULL AND graduated_at IS NULL
      GROUP BY grade ORDER BY grade ASC`,
  ).all<{ grade: number; total: number; held_back: number }>();
  const rows = (res.results ?? []).map((r) => {
    const total = Number(r.total);
    const heldBack = Number(r.held_back);
    const graduating = Number(r.grade) >= 12;
    return {
      grade: Number(r.grade),
      total,
      heldBack,
      graduating,
      advancing: graduating ? 0 : total - heldBack,
      nextGrade: graduating ? null : Number(r.grade) + 1,
    };
  });
  return c.json({ academicYear: academicYear(), rows });
});

// POST /admin/promotions/run — apply the annual promotion atomically
app.post("/promotions/run", async (c) => {
  const now = Date.now();
  const results = await c.env.DB.batch([
    // 1. Grade 12 leaves as alumni (read-only).
    c.env.DB.prepare(
      `UPDATE users SET graduated_at = ?1, grade_year = grade_year + 1
        WHERE role = 'user' AND grade = 12 AND graduated_at IS NULL`,
    ).bind(now),
    // 2. Repeaters (principal-flagged) stay on their grade.
    c.env.DB.prepare(
      `UPDATE users SET held_back = 0, grade_year = grade_year + 1
        WHERE role = 'user' AND grade < 12 AND held_back = 1 AND graduated_at IS NULL`,
    ),
    // 3. Everyone else advances a grade.
    c.env.DB.prepare(
      `UPDATE users SET grade = grade + 1, grade_year = grade_year + 1
        WHERE role = 'user' AND grade IS NOT NULL AND grade < 12 AND held_back = 0 AND graduated_at IS NULL`,
    ),
  ]);
  const changes = (r: D1Result | undefined) => Number(r?.meta?.changes ?? 0);
  return c.json({
    ok: true,
    graduated: changes(results[0]),
    heldBack: changes(results[1]),
    promoted: changes(results[2]),
  });
});

// GET /admin/stats — quick counts for the moderation header
app.get("/stats", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM notes WHERE status='pending') AS pending,
       (SELECT COUNT(*) FROM notes WHERE status='approved') AS approved,
       (SELECT COUNT(*) FROM notes WHERE status='rejected') AS rejected,
       (SELECT COUNT(*) FROM users WHERE role IN ('user','admin')) AS players,
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

// --- Staff invites & user management ---------------------------------------

const INVITE_TTL_MS = 30 * 24 * 3600 * 1000;

interface InviteRaw {
  id: string;
  code: string;
  role: string;
  school_id: string;
  subject_ids: string;
  created_at: number;
  expires_at: number;
  used_by: string | null;
  used_at: number | null;
  school_name: string;
}

app.get("/invites", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT i.id, i.code, i.role, i.school_id, i.subject_ids, i.created_at, i.expires_at, i.used_by, i.used_at, s.name AS school_name
       FROM staff_invites i JOIN schools s ON s.id = i.school_id
      ORDER BY i.created_at DESC LIMIT 200`,
  ).all<InviteRaw>();
  return c.json({
    items: (res.results ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      role: r.role,
      schoolId: r.school_id,
      schoolName: r.school_name,
      subjectIds: JSON.parse(r.subject_ids || "[]") as string[],
      createdAt: new Date(Number(r.created_at)).toISOString(),
      expiresAt: new Date(Number(r.expires_at)).toISOString(),
      used: r.used_by != null,
      usedAt: r.used_at != null ? new Date(Number(r.used_at)).toISOString() : null,
    })),
  });
});

app.post("/invites", async (c) => {
  const admin = await requireAdmin(c);
  const body = await c.req
    .json<{ role?: string; schoolId?: string; subjectIds?: string[] }>()
    .catch(() => ({} as { role?: string; schoolId?: string; subjectIds?: string[] }));
  const role = body.role === "principal" ? "principal" : body.role === "teacher" ? "teacher" : null;
  if (!role) err(400, "role must be 'principal' or 'teacher'.");
  if (!body.schoolId) err(400, "schoolId is required.");
  const db = drizzle(c.env.DB);
  const s = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, body.schoolId)).limit(1);
  if (s.length === 0) err(400, "Unknown school.");

  const code = shortId(8).toUpperCase();
  const now = Date.now();
  const subjectIds = Array.isArray(body.subjectIds) ? body.subjectIds.filter((x) => typeof x === "string") : [];
  await db.insert(staffInvites).values({
    id: shortId(12),
    code,
    schoolId: body.schoolId,
    role,
    subjectIds: JSON.stringify(subjectIds),
    createdBy: admin.id,
    createdAt: now,
    expiresAt: now + INVITE_TTL_MS,
  });
  return c.json({ ok: true, code, role, schoolId: body.schoolId, expiresAt: now + INVITE_TTL_MS }, 201);
});

app.get("/users", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const role = c.req.query("role");
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? 50) || 50));
  const db = drizzle(c.env.DB);
  const conds = [];
  if (q) conds.push(or(like(users.email, `%${q}%`), like(users.displayName, `%${q}%`)));
  if (role && (USER_ROLES as readonly string[]).includes(role)) conds.push(eq(users.role, role));
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      grade: users.grade,
      schoolId: users.schoolId,
      totalEarned: users.totalEarned,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit);
  return c.json({
    items: rows.map((r) => ({ ...r, createdAt: new Date(Number(r.createdAt)).toISOString() })),
  });
});

app.post("/users/:id/role", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ role?: string }>().catch(() => ({} as { role?: string }));
  if (!body.role || !(USER_ROLES as readonly string[]).includes(body.role)) err(400, "Invalid role.");
  await drizzle(c.env.DB).update(users).set({ role: body.role }).where(eq(users.id, id));
  return c.json({ ok: true });
});

// GET /admin/reports — open stolen/abuse reports
app.get("/reports", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT r.id, r.note_id, r.reason, r.details, r.status, r.created_at,
            n.title AS note_title, n.status AS note_status,
            u.display_name AS reporter_name
       FROM note_reports r
       JOIN notes n ON n.id = r.note_id
       JOIN users u ON u.id = r.reporter_id
      WHERE r.status = 'open' ORDER BY r.created_at ASC LIMIT 200`,
  ).all<{
    id: string;
    note_id: string;
    reason: string;
    details: string;
    status: string;
    created_at: number;
    note_title: string;
    note_status: string;
    reporter_name: string;
  }>();
  return c.json({
    items: (res.results ?? []).map((r) => ({
      id: r.id,
      noteId: r.note_id,
      noteTitle: r.note_title,
      noteStatus: r.note_status,
      reason: r.reason,
      details: r.details,
      reporterName: r.reporter_name,
      createdAt: new Date(Number(r.created_at)).toISOString(),
    })),
  });
});

// POST /admin/reports/:id/resolve { action: 'dismiss' | 'remove' }
app.post("/reports/:id/resolve", async (c) => {
  const admin = await requireAdmin(c);
  const id = c.req.param("id");
  const body = await c.req.json<{ action?: string }>().catch(() => ({} as { action?: string }));
  const action = body.action === "remove" ? "remove" : body.action === "dismiss" ? "dismiss" : null;
  if (!action) err(400, "action must be 'dismiss' or 'remove'.");
  const db = drizzle(c.env.DB);
  const rep = (await db.select().from(noteReports).where(eq(noteReports.id, id)).limit(1))[0];
  if (!rep) err(404, "Report not found.");
  await db
    .update(noteReports)
    .set({ status: action === "remove" ? "removed" : "dismissed", resolvedBy: admin.id, resolvedAt: Date.now() })
    .where(eq(noteReports.id, id));
  if (action === "remove") {
    await db
      .update(notes)
      .set({ status: "rejected", reviewedBy: admin.id, reviewedAt: Date.now(), reviewNote: `Removed after report: ${rep.reason}` })
      .where(eq(notes.id, rep.noteId));
  }
  return c.json({ ok: true });
});

// POST /admin/notifications/run-digest — trigger the daily digest manually
app.post("/notifications/run-digest", async (c) => {
  await requireAdmin(c);
  const res = await runDigest(c.env);
  return c.json({ ok: true, ...res });
});

export default app;

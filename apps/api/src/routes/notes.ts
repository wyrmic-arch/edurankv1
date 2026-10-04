import { Hono } from "hono";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { DEFAULT_LICENSE, POINTS_RULES, isStaffRole } from "@edurank/shared";
import { noteUpvotes, noteUnlocks, notes, noteReports, noteVerifications, pointsLedger, subjects, teacherSubjects, users } from "../db/schema";
import { canAccessNotes, currentUser, requireTeacher, requireUser, requireVerifiedUser } from "../lib/auth";
import { awardPoints, spendPoints } from "../lib/points";
import { evalBadges } from "../lib/badges";
import { notify } from "../lib/notify";
import { sha256HexBytes } from "../lib/password";
import { err, noteDTO, pagination } from "../lib/http";
import { moderateNote } from "../lib/moderation";
import { appUrl } from "../lib/email";
import { sendAlert } from "../lib/email";
import { shortId } from "../lib/id";
import type { AppEnv, NoteRow, UserRow } from "../types";

const app = new Hono<AppEnv>();

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "text/plain": "txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/zip": "zip",
};
const MAX_UPLOAD = 20 * 1024 * 1024;
const MAX_COVER = 2 * 1024 * 1024;

async function subjectMap(env: AppEnv["Bindings"]) {
  const rows = await drizzle(env.DB).select().from(subjects);
  return new Map(rows.map((s) => [s.id, s]));
}

/** Subject ids a teacher is assigned (empty for non-teachers). */
async function teacherSubjectIds(env: AppEnv["Bindings"], userId: string): Promise<string[]> {
  const rows = await drizzle(env.DB)
    .select({ subjectId: teacherSubjects.subjectId })
    .from(teacherSubjects)
    .where(eq(teacherSubjects.userId, userId));
  return rows.map((r) => r.subjectId);
}

/**
 * Can this staff member view a note's file without unlocking? Admin sees all;
 * a principal sees their whole school; a teacher sees their school + assigned
 * subjects. Students always go through the normal unlock path.
 */
async function staffCanViewNote(
  env: AppEnv["Bindings"],
  viewer: UserRow,
  note: NoteRow,
): Promise<boolean> {
  if (viewer.role === "admin") return true;
  if (!viewer.schoolId || note.schoolId !== viewer.schoolId) return false;
  if (viewer.role === "principal") return true;
  if (viewer.role === "teacher") {
    const subs = await teacherSubjectIds(env, viewer.id);
    return subs.includes(note.subjectId);
  }
  return false;
}

/** HMAC-SHA256 provenance signature for a note's ownership certificate. */
async function certificateSignature(
  env: AppEnv["Bindings"],
  note: NoteRow,
): Promise<string | null> {
  if (!env.CERT_SECRET) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.CERT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = new TextEncoder().encode(`${note.id}|${note.contentHash ?? ""}|${note.uploaderId}|${note.createdAt}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface JoinedNote {
  note: NoteRow;
  uploaderName: string;
  subjectName: string;
  subjectColor: string;
}

type RawNoteRow = Record<string, unknown> & {
  uploader_name?: string;
  subject_name?: string;
  subject_color?: string;
};

/** Raw D1 rows are snake_case — normalise before decorating. */
function mapRaw(r: RawNoteRow): JoinedNote {
  const num = (v: unknown): number => Number(v ?? 0);
  const str = (v: unknown): string => String(v ?? "");
  return {
    note: {
      id: str(r.id),
      uploaderId: str(r.uploader_id),
      subjectId: str(r.subject_id),
      grade: num(r.grade),
      topic: str(r.topic),
      title: str(r.title),
      description: str(r.description),
      fileKey: str(r.file_key),
      fileName: str(r.file_name),
      fileSize: num(r.file_size),
      mimeType: str(r.mime_type),
      coverKey: (r.cover_key as string | null) ?? null,
      schoolId: (r.school_id as string | null) ?? null,
      contentHash: (r.content_hash as string | null) ?? null,
      license: str(r.license) || DEFAULT_LICENSE,
      isFree: num(r.is_free),
      pricePoints: num(r.price_points),
      status: str(r.status) as NoteRow["status"],
      reviewNote: (r.review_note as string | null) ?? null,
      reviewedBy: (r.reviewed_by as string | null) ?? null,
      reviewedAt: (r.reviewed_at as number | null) ?? null,
      downloadCount: num(r.download_count),
      upvoteCount: num(r.upvote_count),
      createdAt: num(r.created_at),
    },
    uploaderName: str(r.uploader_name),
    subjectName: str(r.subject_name),
    subjectColor: str(r.subject_color),
  };
}

async function decorate(c: { env: AppEnv["Bindings"] }, rows: JoinedNote[], viewer: UserRow | null) {
  const ids = rows.map((r) => r.note.id);
  let unlocked = new Set<string>();
  let upvoted = new Set<string>();
  let verified = new Set<string>();
  let teacherSubs: string[] = [];
  if (viewer && ids.length > 0) {
    const [uRows, vRows, verRows] = await Promise.all([
      drizzle(c.env.DB)
        .select({ noteId: noteUnlocks.noteId })
        .from(noteUnlocks)
        .where(and(eq(noteUnlocks.userId, viewer.id), inArray(noteUnlocks.noteId, ids))),
      drizzle(c.env.DB)
        .select({ noteId: noteUpvotes.noteId })
        .from(noteUpvotes)
        .where(and(eq(noteUpvotes.userId, viewer.id), inArray(noteUpvotes.noteId, ids))),
      drizzle(c.env.DB)
        .select({ noteId: noteVerifications.noteId })
        .from(noteVerifications)
        .where(and(eq(noteVerifications.verdict, "correct"), inArray(noteVerifications.noteId, ids))),
    ]);
    unlocked = new Set(uRows.map((r) => r.noteId));
    upvoted = new Set(vRows.map((r) => r.noteId));
    verified = new Set(verRows.map((r) => r.noteId));
    if (viewer.role === "teacher") teacherSubs = await teacherSubjectIds(c.env, viewer.id);
  }

  const staffView = (n: NoteRow): boolean => {
    if (!viewer || !isStaffRole(viewer.role)) return false;
    if (viewer.role === "admin") return true;
    if (!viewer.schoolId || n.schoolId !== viewer.schoolId) return false;
    if (viewer.role === "principal") return true;
    return teacherSubs.includes(n.subjectId); // teacher: assigned subjects only
  };

  return rows.map((r) => {
    const owned = viewer?.id === r.note.uploaderId;
    const isUnlocked = unlocked.has(r.note.id);
    return noteDTO(r.note, {
      subjectName: r.subjectName,
      subjectColor: r.subjectColor,
      uploaderName: r.uploaderName,
      unlockedByMe: isUnlocked,
      upvotedByMe: upvoted.has(r.note.id),
      ownedByMe: owned,
      verifiedByTeacher: verified.has(r.note.id),
      canViewFile: owned || isUnlocked || viewer?.role === "admin" || staffView(r.note),
    });
  });
}

// GET /notes — approved notes with filters + search + sort
app.get("/", async (c) => {
  const { page, pageSize, offset } = pagination(c);
  const viewer = await currentUser(c);
  const subjectId = c.req.query("subject");
  const gradeParam = c.req.query("grade");
  const q = c.req.query("q");
  const sort = c.req.query("sort") ?? "recent"; // recent | downloads | top

  const conds = ["n.status = 'approved'"];
  const binds: (string | number)[] = [];
  if (subjectId) {
    conds.push("n.subject_id = ?");
    binds.push(subjectId);
  }
  // Grade lock: a student only ever sees their own grade, regardless of the
  // `grade` query param. Staff (teacher/principal/admin) may filter freely.
  const isStudent = viewer != null && !isStaffRole(viewer.role);
  if (isStudent) {
    if (!canAccessNotes(viewer)) err(403, "Set your grade before browsing notes.");
    conds.push("n.grade = ?");
    binds.push(viewer.grade!);
  } else {
    // Staff are scoped to their school; teachers further to their subjects.
    if (viewer && isStaffRole(viewer.role) && viewer.role !== "admin") {
      conds.push("n.school_id = ?");
      binds.push(viewer.schoolId ?? "");
      if (viewer.role === "teacher") {
        const subs = await teacherSubjectIds(c.env, viewer.id);
        if (subs.length === 0) conds.push("1 = 0");
        else {
          conds.push(`n.subject_id IN (${subs.map(() => "?").join(",")})`);
          binds.push(...subs);
        }
      }
    }
    if (gradeParam) {
      conds.push("n.grade = ?");
      binds.push(Number(gradeParam));
    }
  }
  if (q) {
    conds.push("(LOWER(n.title) LIKE ? OR LOWER(n.topic) LIKE ? OR LOWER(n.description) LIKE ?)");
    const like = `%${q.toLowerCase()}%`;
    binds.push(like, like, like);
  }
  const orderBy =
    sort === "downloads"
      ? "n.download_count DESC, n.created_at DESC"
      : sort === "top"
        ? "n.upvote_count DESC, n.created_at DESC"
        : "n.created_at DESC";

  const where = conds.join(" AND ");
  const rowsRes = await c.env.DB.prepare(
    `SELECT n.*, u.display_name AS uploader_name, s.name AS subject_name, s.color AS subject_color
     FROM notes n
     JOIN users u ON u.id = n.uploader_id
     JOIN subjects s ON s.id = n.subject_id
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
  )
    .bind(...binds, pageSize, offset)
    .all<RawNoteRow>();
  const raw = rowsRes.results ?? [];

  // Separate COUNT so `total` is correct even when the requested page is past
  // the end (a window-function total would be absent on an empty page).
  const countRes = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM notes n WHERE ${where}`)
    .bind(...binds)
    .all<{ n: number }>();
  const total = Number(countRes.results?.[0]?.n ?? 0);

  const items = await decorate(c, raw.map(mapRaw), viewer);

  return c.json({ items, page, pageSize, total });
});

app.get("/mine", async (c) => {
  const user = await requireUser(c);
  const rowsRes = await c.env.DB.prepare(
    `SELECT n.*, u.display_name AS uploader_name, s.name AS subject_name, s.color AS subject_color
     FROM notes n JOIN users u ON u.id = n.uploader_id JOIN subjects s ON s.id = n.subject_id
     WHERE n.uploader_id = ?1 ORDER BY n.created_at DESC LIMIT 100`,
  )
    .bind(user.id)
    .all<RawNoteRow>();
  const items = await decorate(c, (rowsRes.results ?? []).map(mapRaw), user);
  return c.json({ items });
});

// GET /notes/:id
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rowsRes = await c.env.DB.prepare(
    `SELECT n.*, u.display_name AS uploader_name, s.name AS subject_name, s.color AS subject_color
     FROM notes n JOIN users u ON u.id = n.uploader_id JOIN subjects s ON s.id = n.subject_id
     WHERE n.id = ?1`,
  )
    .bind(id)
    .all<RawNoteRow>();
  const rawRow = rowsRes.results?.[0];
  if (!rawRow) err(404, "That transmission doesn't exist.");
  const row = mapRaw(rawRow!);
  const viewer = await currentUser(c);

  // Non-approved notes are visible to owner and admins only.
  if (row.note.status !== "approved" && viewer?.id !== row.note.uploaderId && viewer?.role !== "admin") {
    err(404, "That transmission doesn't exist.");
  }

  // Grade lock: a student can only open notes from their own grade.
  if (viewer && !isStaffRole(viewer.role) && viewer.id !== row.note.uploaderId && row.note.grade !== viewer.grade) {
    err(404, "That transmission doesn't exist.");
  }
  // Staff (non-admin) are scoped to their school / assigned subjects.
  if (viewer && isStaffRole(viewer.role) && viewer.role !== "admin" && viewer.id !== row.note.uploaderId) {
    if (!(await staffCanViewNote(c.env, viewer, row.note))) err(404, "That transmission doesn't exist.");
  }

  const [dto] = await decorate(c, [row], viewer);
  const vers = await drizzle(c.env.DB)
    .select({
      verdict: noteVerifications.verdict,
      comment: noteVerifications.comment,
      createdAt: noteVerifications.createdAt,
      teacherName: users.displayName,
    })
    .from(noteVerifications)
    .innerJoin(users, eq(users.id, noteVerifications.teacherId))
    .where(eq(noteVerifications.noteId, id));
  return c.json({
    note: dto,
    verifications: vers.map((v) => ({
      verdict: v.verdict,
      comment: v.comment,
      teacherName: v.teacherName,
      createdAt: new Date(v.createdAt).toISOString(),
    })),
  });
});

// POST /notes/:id/verify — a teacher marks a note correct / needs work
app.post("/:id/verify", async (c) => {
  const user = await requireTeacher(c);
  const id = c.req.param("id");
  const body = await c.req
    .json<{ verdict?: string; comment?: string }>()
    .catch(() => ({} as { verdict?: string; comment?: string }));
  const verdict = body.verdict === "correct" || body.verdict === "needs_work" ? body.verdict : null;
  if (!verdict) err(400, "verdict must be 'correct' or 'needs_work'.");
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note || note.status !== "approved") err(404, "That note isn't available.");
  if (user.role !== "admin") {
    if (!user.schoolId || note.schoolId !== user.schoolId) err(403, "That note isn't from your school.");
    if (user.role === "teacher") {
      const subs = await teacherSubjectIds(c.env, user.id);
      if (!subs.includes(note.subjectId)) err(403, "That subject isn't assigned to you.");
    }
  }
  const comment = (body.comment ?? "").slice(0, 500);
  await db
    .insert(noteVerifications)
    .values({ noteId: id, teacherId: user.id, verdict, comment, createdAt: Date.now() })
    .onConflictDoUpdate({
      target: [noteVerifications.noteId, noteVerifications.teacherId],
      set: { verdict, comment, createdAt: Date.now() },
    });
  await notify(c.env, note.uploaderId, {
    type: "note_verified",
    title: `A teacher ${verdict === "correct" ? "verified" : "flagged"} "${note.title}"`,
    body: comment || (verdict === "correct" ? "Your notes check out." : "A teacher thinks this needs another look."),
    link: `/notes/${note.id}`,
  });
  return c.json({ ok: true, verdict });
});

// GET /notes/:id/certificate — public ownership/provenance certificate
app.get("/:id/certificate", async (c) => {
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note || note.status !== "approved") err(404, "No note to certify.");
  const uploader = (
    await db.select({ name: users.displayName }).from(users).where(eq(users.id, note.uploaderId)).limit(1)
  )[0];
  return c.json({
    certificate: {
      noteId: note.id,
      title: note.title,
      uploaderName: uploader?.name ?? "Unknown",
      uploadedAt: new Date(note.createdAt).toISOString(),
      contentHash: note.contentHash,
      license: note.license,
      signature: await certificateSignature(c.env, note),
      verifyUrl: appUrl(c.env, `/verify/${note.id}`),
    },
  });
});

// POST /notes/:id/report { reason, details } — report stolen/abusive content
app.post("/:id/report", async (c) => {
  const user = await requireUser(c);
  const id = c.req.param("id");
  const body = await c.req
    .json<{ reason?: string; details?: string }>()
    .catch(() => ({} as { reason?: string; details?: string }));
  const reason = (body.reason ?? "").trim().slice(0, 120) || "Unspecified";
  const details = (body.details ?? "").trim().slice(0, 1000);
  const db = drizzle(c.env.DB);
  const note = (await db.select({ id: notes.id }).from(notes).where(eq(notes.id, id)).limit(1))[0];
  if (!note) err(404, "Note not found.");
  await db.insert(noteReports).values({
    id: shortId(12),
    noteId: id,
    reporterId: user.id,
    reason,
    details,
    status: "open",
    createdAt: Date.now(),
  });
  try {
    c.executionCtx.waitUntil(
      sendAlert(c.env, "New content report", `Note: ${id}\nReason: ${reason}\nDetails: ${details}\nReporter: ${user.displayName} (${user.id})`),
    );
  } catch {
    /* alerting is best-effort */
  }
  return c.json({ ok: true });
});

// POST /notes — multipart upload -> pending review
app.post("/", async (c) => {
  const user = await requireVerifiedUser(c);
  if (!canAccessNotes(user)) err(403, "Set your grade before uploading notes.");
  const form = await c.req.parseBody();
  const file = form["file"];
  if (!(file instanceof File)) err(400, "Attach your study file in the 'file' field");
  const ext = ALLOWED_MIME[file.type];
  if (!ext) err(415, "Unsupported file type. PDF, images, DOCX, PPTX, XLSX, TXT or ZIP only.");
  if (file.size === 0) err(400, "That file is empty.");
  if (file.size > MAX_UPLOAD) err(413, "Max upload size is 20MB.");

  const fieldsSchema = z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(1000).optional(),
    subjectId: z.string().trim().min(1),
    grade: z.coerce.number().int().min(8).max(12),
    topic: z.string().trim().max(80).optional(),
    pricing: z.enum(["free", "paid"]).optional(),
    pricePoints: z.coerce.number().int().min(5).max(5000).optional(),
    license: z.enum(["all-rights-reserved", "cc-by-nc", "cc-by"]).optional(),
  });
  const body = fieldsSchema.safeParse({
    title: form["title"],
    description: form["description"],
    subjectId: form["subjectId"],
    grade: form["grade"],
    topic: form["topic"],
    pricing: form["pricing"] ?? "free",
    pricePoints: form["pricePoints"],
    license: form["license"],
  });
  if (!body.success) {
    const issue = body.error.issues[0];
    err(400, `${issue?.path.join(".")}: ${issue?.message ?? "Invalid upload fields"}`);
  }

  const smap = await subjectMap(c.env);
  const subject = smap.get(body.data.subjectId);
  if (!subject) err(400, "Pick a valid subject district");

  const isFree = body.data.pricing !== "paid";
  const pricePoints = isFree ? 0 : Math.round((body.data.pricePoints ?? 50) / 5) * 5;

  // Students upload to their own locked grade; staff may target any grade.
  const effectiveGrade = isStaffRole(user.role) ? body.data.grade : (user.grade as number);

  const id = shortId(10);
  const now = Date.now();
  const fileKey = `notes/${id}/file.${ext}`;
  const bytes = await file.arrayBuffer();
  const contentHash = await sha256HexBytes(bytes);
  const db = drizzle(c.env.DB);

  // Provenance / duplicate guard: reject an exact copy of an existing note.
  const dup = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.contentHash, contentHash), sql`${notes.status} != 'rejected'`))
    .limit(1);
  if (dup.length > 0) err(409, "This exact file is already on EduRank — duplicates aren't allowed.");

  await c.env.NOTES_BUCKET.put(fileKey, bytes, {
    httpMetadata: { contentType: file.type },
  });

  let coverKey: string | null = null;
  const cover = form["cover"];
  if (cover instanceof File && cover.size > 0 && ALLOWED_MIME[cover.type]?.match(/^(png|jpg|webp)$/)) {
    if (cover.size > MAX_COVER) err(413, "Cover image must be under 2MB.");
    coverKey = `covers/${id}.${ALLOWED_MIME[cover.type]}`;
    await c.env.NOTES_BUCKET.put(coverKey, await cover.arrayBuffer(), {
      httpMetadata: { contentType: cover.type },
    });
  }

  await db.insert(notes).values({
    id,
    uploaderId: user.id,
    subjectId: subject.id,
    grade: effectiveGrade,
    schoolId: user.schoolId,
    contentHash,
    license: body.data.license ?? DEFAULT_LICENSE,
    topic: body.data.topic ?? "",
    title: body.data.title,
    description: body.data.description ?? "",
    fileKey,
    fileName: file.name.slice(0, 120),
    fileSize: file.size,
    mimeType: file.type,
    coverKey,
    isFree: isFree ? 1 : 0,
    pricePoints,
    status: "pending",
    createdAt: now,
  });

  // AI moderator takes it from here — verdict lands async (approve/reject + PTS payout)
  c.executionCtx.waitUntil(moderateNote(c.env, id));

  return c.json({ ok: true, id, status: "pending", rewardOnApproval: POINTS_RULES.UPLOAD_APPROVED }, 201);
});

// POST /notes/:id/unlock — spend points / claim free access; pays the uploader
app.post("/:id/unlock", async (c) => {
  const user = await requireVerifiedUser(c);
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note || note.status !== "approved") err(404, "That note isn't available.");
  // Grade lock: students can only unlock notes from their own grade.
  if (!isStaffRole(user.role) && note.uploaderId !== user.id && note.grade !== user.grade) {
    err(403, "That note is for a different grade.");
  }
  if (note.uploaderId === user.id || user.role === "admin") {
    const fresh = (await db.select({ b: users.balance }).from(users).where(eq(users.id, user.id)).limit(1))[0];
    return c.json({ unlocked: true, free: true, balanceAfter: fresh?.b ?? user.balance });
  }

  const price = note.isFree === 1 ? 0 : note.pricePoints;
  if (price > user.balance) {
    err(402, `Not enough PTS — you need ${price - user.balance} more.`);
  }

  const cut = price > 0 ? Math.round(price * POINTS_RULES.SELLER_CUT) : 0;
  const now = Date.now();

  // Atomic guard: insert the unlock row first. The PK on (note_id, user_id)
  // means concurrent requests from the same buyer are deduplicated by the
  // database — the second one hits UNIQUE and we return "alreadyOwned".
  try {
    await db.insert(noteUnlocks).values({
      noteId: id,
      userId: user.id,
      pricePaid: price,
      uploaderCut: cut,
      createdAt: now,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE") || msg.includes("constraint")) {
      const fresh = (await db.select({ b: users.balance }).from(users).where(eq(users.id, user.id)).limit(1))[0];
      return c.json({ unlocked: true, alreadyOwned: true, balanceAfter: fresh?.b ?? user.balance });
    }
    throw e;
  }

  // Charge the buyer with a guarded, atomic decrement. If it fails (a
  // concurrent spend drained the balance since our pre-check) we roll the
  // unlock row back and refuse — the balance can never go negative.
  let balanceAfter: number;
  if (price > 0) {
    const spend = await spendPoints(c.env, {
      userId: user.id,
      amount: price,
      reason: "unlock_purchase",
      description: `Unlocked "${note.title}"`,
      noteId: note.id,
      subjectId: note.subjectId,
    });
    if (!spend.ok) {
      await db
        .delete(noteUnlocks)
        .where(and(eq(noteUnlocks.noteId, id), eq(noteUnlocks.userId, user.id)));
      err(402, `Not enough PTS — you need ${price - spend.balanceAfter} more.`);
    }
    balanceAfter = spend.balanceAfter;
  } else {
    const fresh = (await db.select({ b: users.balance }).from(users).where(eq(users.id, user.id)).limit(1))[0];
    balanceAfter = fresh?.b ?? user.balance;
  }

  if (price > 0) {
    await awardPoints(c.env, {
      userId: note.uploaderId,
      delta: cut,
      reason: "unlock_revenue",
      description: `${user.displayName} bought your "${note.title}" — 50% cut`,
      noteId: note.id,
      subjectId: note.subjectId,
    });
  }

  // Every download event pays the uploader a flat bonus.
  await awardPoints(c.env, {
    userId: note.uploaderId,
    delta: POINTS_RULES.DOWNLOAD_RECEIVED,
    reason: "download_received",
    description: `"${note.title}" was downloaded by ${user.displayName}`,
    noteId: note.id,
    subjectId: note.subjectId,
  });

  await db
    .update(notes)
    .set({ downloadCount: sql`${notes.downloadCount} + 1` })
    .where(eq(notes.id, id));

  await evalBadges(c.env, note.uploaderId);

  await notify(c.env, note.uploaderId, {
    type: "note_unlocked",
    title: `${user.displayName} unlocked "${note.title}"`,
    body: price > 0 ? `You earned ${cut} PTS from the sale.` : "Your note got a new download.",
    link: `/notes/${note.id}`,
  });

  return c.json({ unlocked: true, pricePaid: price, balanceAfter });
});

// POST /notes/:id/upvote — toggle; first-ever upvote from this user rewards uploader once
app.post("/:id/upvote", async (c) => {
  const user = await requireUser(c);
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note || note.status !== "approved") err(404, "That note isn't available.");
  if (note.uploaderId === user.id) err(400, "You can't upvote your own drop.");

  // Toggle atomically: try to insert. If a row is actually inserted we just
  // upvoted; otherwise the (note, user) PK already existed → un-vote. This
  // avoids the read-then-write race that could 500 on a concurrent upvote.
  const inserted = await db
    .insert(noteUpvotes)
    .values({ noteId: id, userId: user.id, createdAt: Date.now() })
    .onConflictDoNothing()
    .returning({ userId: noteUpvotes.userId });

  let upvotedByMe: boolean;
  if (inserted.length > 0) {
    await db.update(notes).set({ upvoteCount: sql`${notes.upvoteCount} + 1` }).where(eq(notes.id, id));
    upvotedByMe = true;

    // Anti-farm guard: reward only the FIRST time this voter upvotes this note.
    const prior = await db
      .select({ id: pointsLedger.id })
      .from(pointsLedger)
      .where(
        and(
          eq(pointsLedger.reason, "upvote_received"),
          eq(pointsLedger.noteId, id),
          eq(pointsLedger.description, `upvote:${user.id}`),
        ),
      )
      .limit(1);
    if (prior.length === 0) {
      await awardPoints(c.env, {
        userId: note.uploaderId,
        delta: POINTS_RULES.UPVOTE_RECEIVED,
        reason: "upvote_received",
        description: `upvote:${user.id}`,
        noteId: id,
        subjectId: note.subjectId,
      });
    }
    await evalBadges(c.env, note.uploaderId);
  } else {
    await db.delete(noteUpvotes).where(and(eq(noteUpvotes.noteId, id), eq(noteUpvotes.userId, user.id)));
    await db.update(notes).set({ upvoteCount: sql`${notes.upvoteCount} - 1` }).where(eq(notes.id, id));
    upvotedByMe = false;
  }

  const fresh = (await db.select({ c: notes.upvoteCount }).from(notes).where(eq(notes.id, id)).limit(1))[0];
  return c.json({ upvotedByMe, upvoteCount: fresh?.c ?? note.upvoteCount });
});

// GET /notes/:id/file — gated download stream from R2
app.get("/:id/file", async (c) => {
  const user = await requireUser(c);
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note) err(404, "File not found.");

  // Grade lock: students can only open files from their own grade.
  if (!isStaffRole(user.role) && note.uploaderId !== user.id && note.grade !== user.grade) {
    err(403, "That file is for a different grade.");
  }

  let allowed = note.uploaderId === user.id || user.role === "admin";
  if (!allowed && isStaffRole(user.role)) {
    allowed = await staffCanViewNote(c.env, user, note);
  }
  if (!allowed) {
    const access = await db
      .select({ userId: noteUnlocks.userId })
      .from(noteUnlocks)
      .where(and(eq(noteUnlocks.noteId, id), eq(noteUnlocks.userId, user.id)))
      .limit(1);
    allowed = access.length > 0;
  }
  if (!allowed) err(403, "Unlock this note first.");

  const obj = await c.env.NOTES_BUCKET.get(note.fileKey);
  if (!obj) err(404, "File missing from storage — ping an admin.");

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? note.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(note.fileName)}`,
      "Cache-Control": "private, max-age=60",
    },
  });
});

export default app;

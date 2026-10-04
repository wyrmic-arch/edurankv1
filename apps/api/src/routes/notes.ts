import { Hono } from "hono";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { POINTS_RULES } from "@edurank/shared";
import { noteUpvotes, noteUnlocks, notes, pointsLedger, subjects, users } from "../db/schema";
import { currentUser, requireUser } from "../lib/auth";
import { awardPoints, spendPoints } from "../lib/points";
import { evalBadges } from "../lib/badges";
import { err, noteDTO, pagination } from "../lib/http";
import { moderateNote } from "../lib/moderation";
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

async function subjectMap(env: AppEnv["Bindings"]) {
  const rows = await drizzle(env.DB).select().from(subjects);
  return new Map(rows.map((s) => [s.id, s]));
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
  if (viewer && ids.length > 0) {
    const [uRows, vRows] = await Promise.all([
      drizzle(c.env.DB)
        .select({ noteId: noteUnlocks.noteId })
        .from(noteUnlocks)
        .where(and(eq(noteUnlocks.userId, viewer.id), inArray(noteUnlocks.noteId, ids))),
      drizzle(c.env.DB)
        .select({ noteId: noteUpvotes.noteId })
        .from(noteUpvotes)
        .where(and(eq(noteUpvotes.userId, viewer.id), inArray(noteUpvotes.noteId, ids))),
    ]);
    unlocked = new Set(uRows.map((r) => r.noteId));
    upvoted = new Set(vRows.map((r) => r.noteId));
  }
  return rows.map((r) =>
    noteDTO(r.note, {
      subjectName: r.subjectName,
      subjectColor: r.subjectColor,
      uploaderName: r.uploaderName,
      unlockedByMe: unlocked.has(r.note.id),
      upvotedByMe: upvoted.has(r.note.id),
      ownedByMe: viewer?.id === r.note.uploaderId,
    }),
  );
}

// GET /notes — approved notes with filters + search + sort
app.get("/", async (c) => {
  const { page, pageSize, offset } = pagination(c);
  const subjectId = c.req.query("subject");
  const grade = c.req.query("grade");
  const q = c.req.query("q");
  const sort = c.req.query("sort") ?? "recent"; // recent | downloads | top

  const conds = ["n.status = 'approved'"];
  const binds: (string | number)[] = [];
  if (subjectId) {
    conds.push("n.subject_id = ?");
    binds.push(subjectId);
  }
  if (grade) {
    conds.push("n.grade = ?");
    binds.push(Number(grade));
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

  const rowsRes = await c.env.DB.prepare(
    `SELECT n.*, u.display_name AS uploader_name, s.name AS subject_name, s.color AS subject_color,
            COUNT(*) OVER() AS total_count
     FROM notes n
     JOIN users u ON u.id = n.uploader_id
     JOIN subjects s ON s.id = n.subject_id
     WHERE ${conds.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
  )
    .bind(...binds, pageSize, offset)
    .all<RawNoteRow & { total_count: number }>();
  const raw = rowsRes.results ?? [];
  const total = Number(raw[0]?.total_count ?? 0);

  const viewer = await currentUser(c);
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

  const [dto] = await decorate(c, [row], viewer);
  return c.json({ note: dto });
});

// POST /notes — multipart upload -> pending review
app.post("/", async (c) => {
  const user = await requireUser(c);
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
  });
  const body = fieldsSchema.safeParse({
    title: form["title"],
    description: form["description"],
    subjectId: form["subjectId"],
    grade: form["grade"],
    topic: form["topic"],
    pricing: form["pricing"] ?? "free",
    pricePoints: form["pricePoints"],
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

  const id = shortId(10);
  const now = Date.now();
  const fileKey = `notes/${id}/file.${ext}`;
  await c.env.NOTES_BUCKET.put(fileKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  let coverKey: string | null = null;
  const cover = form["cover"];
  if (cover instanceof File && cover.size > 0 && ALLOWED_MIME[cover.type]?.match(/^(png|jpg|webp)$/)) {
    coverKey = `covers/${id}.${ALLOWED_MIME[cover.type]}`;
    await c.env.NOTES_BUCKET.put(coverKey, await cover.arrayBuffer(), {
      httpMetadata: { contentType: cover.type },
    });
  }

  const db = drizzle(c.env.DB);
  await db.insert(notes).values({
    id,
    uploaderId: user.id,
    subjectId: subject.id,
    grade: body.data.grade,
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
  const user = await requireUser(c);
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note || note.status !== "approved") err(404, "That note isn't available.");
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

  const existing = await db
    .select({ userId: noteUpvotes.userId })
    .from(noteUpvotes)
    .where(and(eq(noteUpvotes.noteId, id), eq(noteUpvotes.userId, user.id)))
    .limit(1);

  let upvotedByMe: boolean;
  let upvoteCount: number;
  if (existing.length > 0) {
    await db.delete(noteUpvotes).where(and(eq(noteUpvotes.noteId, id), eq(noteUpvotes.userId, user.id)));
    await db.update(notes).set({ upvoteCount: sql`${notes.upvoteCount} - 1` }).where(eq(notes.id, id));
    upvotedByMe = false;
    upvoteCount = note.upvoteCount - 1;
  } else {
    await db.insert(noteUpvotes).values({ noteId: id, userId: user.id, createdAt: Date.now() });
    await db.update(notes).set({ upvoteCount: sql`${notes.upvoteCount} + 1` }).where(eq(notes.id, id));
    upvotedByMe = true;
    upvoteCount = note.upvoteCount + 1;

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
  }

  return c.json({ upvotedByMe, upvoteCount });
});

// GET /notes/:id/file — gated download stream from R2
app.get("/:id/file", async (c) => {
  const user = await requireUser(c);
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const note = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] as NoteRow | undefined;
  if (!note) err(404, "File not found.");

  const isOwnerOrAdmin = note.uploaderId === user.id || user.role === "admin";
  if (!isOwnerOrAdmin) {
    const access = await db
      .select({ userId: noteUnlocks.userId })
      .from(noteUnlocks)
      .where(and(eq(noteUnlocks.noteId, id), eq(noteUnlocks.userId, user.id)))
      .limit(1);
    if (access.length === 0) err(403, "Unlock this note first.");
  }

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

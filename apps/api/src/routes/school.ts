import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { notes, schools, staffInvites, teacherSubjects, users } from "../db/schema";
import { requirePrincipal } from "../lib/auth";
import { err } from "../lib/http";
import { shortId } from "../lib/id";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

// Every route is principal-only and scoped to the principal's own school.
app.use("*", async (c, next) => {
  await requirePrincipal(c);
  await next();
});

const INVITE_TTL_MS = 30 * 24 * 3600 * 1000;

async function requireSchool(c: { env: AppEnv["Bindings"] }, schoolId: string | null): Promise<string> {
  if (!schoolId) err(400, "No school is assigned to this staff account.");
  return schoolId;
}

// GET /school — dashboard
app.get("/", async (c) => {
  const me = await requirePrincipal(c);
  const schoolId = await requireSchool(c, me.schoolId);
  const db = drizzle(c.env.DB);
  const school = (await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1))[0];

  const res = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE school_id = ?1 AND role = 'user') AS students,
       (SELECT COUNT(*) FROM notes n JOIN users u ON u.id = n.uploader_id WHERE u.school_id = ?1 AND n.status = 'approved') AS notes_approved,
       (SELECT COUNT(*) FROM notes n JOIN users u ON u.id = n.uploader_id WHERE u.school_id = ?1 AND n.status = 'pending') AS notes_pending,
       (SELECT IFNULL(SUM(total_earned),0) FROM users WHERE school_id = ?1 AND role = 'user') AS points`,
  )
    .bind(schoolId)
    .all<Record<string, number>>();
  const s = res.results?.[0] ?? {};

  const byGrade = await c.env.DB.prepare(
    `SELECT grade, COUNT(*) AS n FROM users
      WHERE school_id = ?1 AND role = 'user' AND grade IS NOT NULL
      GROUP BY grade ORDER BY grade ASC`,
  )
    .bind(schoolId)
    .all<{ grade: number; n: number }>();

  return c.json({
    school: { id: school?.id, name: school?.name, province: school?.province, city: school?.city },
    stats: {
      students: Number(s.students ?? 0),
      notesApproved: Number(s.notes_approved ?? 0),
      notesPending: Number(s.notes_pending ?? 0),
      points: Number(s.points ?? 0),
    },
    byGrade: (byGrade.results ?? []).map((r) => ({ grade: Number(r.grade), students: Number(r.n) })),
  });
});

// GET /school/students?grade=&q=
app.get("/students", async (c) => {
  const me = await requirePrincipal(c);
  const schoolId = await requireSchool(c, me.schoolId);
  const grade = c.req.query("grade");
  const q = (c.req.query("q") ?? "").trim().toLowerCase();
  const db = drizzle(c.env.DB);
  const conds = [eq(users.schoolId, schoolId), eq(users.role, "user")];
  if (grade) conds.push(eq(users.grade, Number(grade)));
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      grade: users.grade,
      heldBack: users.heldBack,
      totalEarned: users.totalEarned,
      balance: users.balance,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conds))
    .orderBy(desc(users.totalEarned))
    .limit(300);
  const filtered = q
    ? rows.filter((r) => r.displayName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
    : rows;
  return c.json({
    items: filtered.map((r) => ({
      id: r.id,
      displayName: r.displayName,
      email: r.email,
      grade: r.grade,
      heldBack: r.heldBack === 1,
      totalEarned: Number(r.totalEarned),
      balance: Number(r.balance),
      createdAt: new Date(Number(r.createdAt)).toISOString(),
    })),
  });
});

// GET /school/notes — notes uploaded by this school's students
app.get("/notes", async (c) => {
  const me = await requirePrincipal(c);
  const schoolId = await requireSchool(c, me.schoolId);
  const res = await c.env.DB.prepare(
    `SELECT n.id, n.title, n.grade, n.status, n.created_at, n.upvote_count, n.download_count,
            u.display_name AS uploader_name, s.name AS subject_name,
            (SELECT COUNT(*) FROM note_verifications v WHERE v.note_id = n.id AND v.verdict = 'correct') AS verified
       FROM notes n JOIN users u ON u.id = n.uploader_id JOIN subjects s ON s.id = n.subject_id
      WHERE u.school_id = ?1 ORDER BY n.created_at DESC LIMIT 200`,
  )
    .bind(schoolId)
    .all<{
      id: string;
      title: string;
      grade: number;
      status: string;
      created_at: number;
      upvote_count: number;
      download_count: number;
      uploader_name: string;
      subject_name: string;
      verified: number;
    }>();
  return c.json({
    items: (res.results ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      grade: Number(n.grade),
      status: n.status,
      subjectName: n.subject_name,
      uploaderName: n.uploader_name,
      upvoteCount: Number(n.upvote_count),
      downloadCount: Number(n.download_count),
      verified: Number(n.verified) > 0,
      createdAt: new Date(Number(n.created_at)).toISOString(),
    })),
  });
});

// POST /school/students/:id/held-back { heldBack } — mark a repeater
app.post("/students/:id/held-back", async (c) => {
  const me = await requirePrincipal(c);
  const schoolId = await requireSchool(c, me.schoolId);
  const id = c.req.param("id");
  const body = await c.req.json<{ heldBack?: boolean }>().catch(() => ({} as { heldBack?: boolean }));
  const db = drizzle(c.env.DB);
  const row = (await db.select({ schoolId: users.schoolId }).from(users).where(eq(users.id, id)).limit(1))[0];
  if (!row) err(404, "Student not found.");
  if (row.schoolId !== schoolId) err(403, "That student isn't at your school.");
  await db.update(users).set({ heldBack: body.heldBack ? 1 : 0 }).where(eq(users.id, id));
  return c.json({ ok: true });
});

// GET /school/invites — teacher invites for this school
app.get("/invites", async (c) => {
  const me = await requirePrincipal(c);
  const schoolId = await requireSchool(c, me.schoolId);
  const res = await c.env.DB.prepare(
    `SELECT id, code, role, subject_ids, created_at, expires_at, used_by, used_at
       FROM staff_invites WHERE school_id = ?1 AND role = 'teacher'
      ORDER BY created_at DESC LIMIT 200`,
  )
    .bind(schoolId)
    .all<{
      id: string;
      code: string;
      role: string;
      subject_ids: string;
      created_at: number;
      expires_at: number;
      used_by: string | null;
      used_at: number | null;
    }>();
  return c.json({
    items: (res.results ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      role: r.role,
      subjectIds: JSON.parse(r.subject_ids || "[]") as string[],
      createdAt: new Date(Number(r.created_at)).toISOString(),
      expiresAt: new Date(Number(r.expires_at)).toISOString(),
      used: r.used_by != null,
      usedAt: r.used_at != null ? new Date(Number(r.used_at)).toISOString() : null,
    })),
  });
});

// POST /school/invites { subjectIds? } — issue a teacher invite
app.post("/invites", async (c) => {
  const me = await requirePrincipal(c);
  const schoolId = await requireSchool(c, me.schoolId);
  const body = await c.req.json<{ subjectIds?: string[] }>().catch(() => ({} as { subjectIds?: string[] }));
  const subjectIds = Array.isArray(body.subjectIds) ? body.subjectIds.filter((x) => typeof x === "string") : [];
  const db = drizzle(c.env.DB);
  const code = shortId(8).toUpperCase();
  const now = Date.now();
  await db.insert(staffInvites).values({
    id: shortId(12),
    code,
    schoolId,
    role: "teacher",
    subjectIds: JSON.stringify(subjectIds),
    createdBy: me.id,
    createdAt: now,
    expiresAt: now + INVITE_TTL_MS,
  });
  return c.json({ ok: true, code, subjectIds, expiresAt: now + INVITE_TTL_MS }, 201);
});

// POST /school/teachers/:id/subjects { subjectIds } — set a teacher's subjects
app.post("/teachers/:id/subjects", async (c) => {
  const me = await requirePrincipal(c);
  const schoolId = await requireSchool(c, me.schoolId);
  const id = c.req.param("id");
  const body = await c.req.json<{ subjectIds?: string[] }>().catch(() => ({} as { subjectIds?: string[] }));
  const subjectIds = Array.isArray(body.subjectIds) ? body.subjectIds.filter((x) => typeof x === "string") : [];
  const db = drizzle(c.env.DB);
  const row = (await db.select({ schoolId: users.schoolId, role: users.role }).from(users).where(eq(users.id, id)).limit(1))[0];
  if (!row) err(404, "Teacher not found.");
  if (row.schoolId !== schoolId || row.role !== "teacher") err(403, "That teacher isn't at your school.");
  await db.delete(teacherSubjects).where(eq(teacherSubjects.userId, id));
  if (subjectIds.length > 0) {
    await db.insert(teacherSubjects).values(subjectIds.map((sid) => ({ userId: id, subjectId: sid }))).onConflictDoNothing();
  }
  return c.json({ ok: true, subjectIds });
});

export default app;

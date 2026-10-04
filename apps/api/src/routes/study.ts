import { Hono } from "hono";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

interface StudyRow {
  slug: string;
  title: string;
  grade: number;
  subject_id: string;
  subject_name: string;
  topic: string;
  description: string;
  file_key: string;
  body: string | null;
  body_updated_at: number | null;
}

const SELECT = `SELECT n.slug, n.title, n.grade, n.subject_id, s.name AS subject_name,
                        n.topic, n.description, n.file_key, n.body, n.body_updated_at
                   FROM notes n JOIN subjects s ON s.id = n.subject_id
                  WHERE n.is_official = 1 AND n.status = 'approved' AND n.slug IS NOT NULL`;

function toItem(r: StudyRow) {
  return {
    slug: r.slug,
    title: r.title,
    grade: Number(r.grade),
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    topic: r.topic,
    description: r.description,
    updatedAt: r.body_updated_at ? new Date(Number(r.body_updated_at)).toISOString() : null,
  };
}

// GET /study — all official notes
app.get("/", async (c) => {
  const res = await c.env.DB.prepare(`${SELECT} ORDER BY n.grade ASC, s.name ASC, n.title ASC`)
    .all<StudyRow>();
  c.header("Cache-Control", "public, max-age=300");
  return c.json({ items: (res.results ?? []).map(toItem) });
});

// GET /study/:grade/:subject — hub for one grade + subject
app.get("/:grade/:subject", async (c) => {
  const grade = Number(c.req.param("grade"));
  const subject = c.req.param("subject");
  const res = await c.env.DB.prepare(`${SELECT} AND n.grade = ?1 AND n.subject_id = ?2 ORDER BY n.title ASC`)
    .bind(grade, subject)
    .all<StudyRow>();
  c.header("Cache-Control", "public, max-age=300");
  return c.json({ grade, subject, items: (res.results ?? []).map(toItem) });
});

// GET /study/:grade/:subject/:slug/file — public PDF
app.get("/:grade/:subject/:slug/file", async (c) => {
  const slug = c.req.param("slug");
  const row = (
    await c.env.DB.prepare(
      `SELECT file_key, title FROM notes WHERE slug = ?1 AND is_official = 1 AND status = 'approved' LIMIT 1`,
    )
      .bind(slug)
      .first<{ file_key: string; title: string }>()
  );
  if (!row) return c.json({ error: "Not found" }, 404);
  const obj = await c.env.NOTES_BUCKET.get(row.file_key);
  if (!obj) return c.json({ error: "File missing" }, 404);
  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(row.title)}.pdf`,
      "Cache-Control": "public, max-age=604800",
    },
  });
});

// GET /study/:grade/:subject/:slug — a single official note (with body)
app.get("/:grade/:subject/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = (
    await c.env.DB.prepare(`${SELECT} AND n.slug = ?1 LIMIT 1`).bind(slug).all<StudyRow>()
  ).results?.[0];
  if (!row) return c.json({ error: "That guide doesn't exist." }, 404);
  c.header("Cache-Control", "public, max-age=300");
  return c.json({
    note: {
      ...toItem(row),
      body: row.body ?? "",
    },
  });
});

export default app;

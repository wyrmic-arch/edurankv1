import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { notes, subjects } from "../db/schema";
import { currentUser } from "../lib/auth";
import { err } from "../lib/http";
import { shortId } from "../lib/id";
import { sha256HexBytes } from "../lib/password";
import type { AppEnv, NoteRow } from "../types";

const app = new Hono<AppEnv>();

const TEAM_USER_ID = "edurank-team";

/** Minimal defence-in-depth sanitiser for our own (server-rendered) HTML. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function slugifyTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

// POST /official/publish — create/update an official note. Auth: the shared
// publish secret (for the automation script) OR an admin/owner session.
app.post("/publish", async (c) => {
  const secret = c.env.OFFICIAL_PUBLISH_SECRET;
  const provided = c.req.header("x-publish-secret");
  const sessionUser = await currentUser(c);
  const isAdminSession = !!sessionUser && (sessionUser.role === "admin" || sessionUser.role === "owner");
  const secretOk = !!secret && !!provided && provided === secret;
  if (!secretOk && !isAdminSession) err(403, "Not authorized to publish official notes.");

  const form = await c.req.parseBody();
  const str = (k: string) => (typeof form[k] === "string" ? (form[k] as string).trim() : "");

  const title = str("title");
  const subjectId = str("subjectId");
  const body = str("body");
  const pdf = form["pdf"];
  const cover = form["cover"];
  const grade = Number(str("grade"));
  const topic = str("topic");
  const description = str("description");
  const license = str("license") || "all-rights-reserved";
  const slug = (str("slug") || slugifyTitle(title)).toLowerCase();

  if (title.length < 3) err(400, "title is required.");
  if (!body) err(400, "body (HTML) is required.");
  if (!Number.isInteger(grade) || grade < 8 || grade > 12) err(400, "grade must be 8–12.");
  if (!/^[a-z0-9-]{3,120}$/.test(slug)) err(400, "slug must be lowercase letters, numbers and hyphens.");
  if (!(pdf instanceof File) || pdf.size === 0) err(400, "A PDF file is required.");
  if (pdf.type && pdf.type !== "application/pdf") err(415, "The file must be a PDF.");

  const db = drizzle(c.env.DB);
  const subject = (await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, subjectId)).limit(1))[0];
  if (!subject) err(400, "Unknown subject.");

  const now = Date.now();
  const existing = (
    await db.select().from(notes).where(eq(notes.slug, slug)).limit(1)
  )[0] as NoteRow | undefined;
  const id = existing?.id ?? shortId(10);

  const bytes = await pdf.arrayBuffer();
  const contentHash = await sha256HexBytes(bytes);
  const fileKey = `notes/${id}/file.pdf`;
  await c.env.NOTES_BUCKET.put(fileKey, bytes, { httpMetadata: { contentType: "application/pdf" } });

  let coverKey: string | null = existing?.coverKey ?? null;
  if (cover instanceof File && cover.size > 0 && /^(image\/(png|jpeg|webp))$/.test(cover.type)) {
    const ext = cover.type.split("/")[1] === "jpeg" ? "jpg" : cover.type.split("/")[1];
    coverKey = `covers/${id}.${ext}`;
    await c.env.NOTES_BUCKET.put(coverKey, await cover.arrayBuffer(), { httpMetadata: { contentType: cover.type } });
  }

  const cleanBody = sanitizeHtml(body);
  if (existing) {
    await db
      .update(notes)
      .set({
        title,
        description,
        subjectId,
        grade,
        topic,
        body: cleanBody,
        bodyUpdatedAt: now,
        fileKey,
        contentHash,
        coverKey,
        isOfficial: 1,
        isFree: 1,
        pricePoints: 0,
        status: "approved",
        license,
      })
      .where(eq(notes.id, id));
  } else {
    await db.insert(notes).values({
      id,
      uploaderId: TEAM_USER_ID,
      subjectId,
      grade,
      topic,
      title,
      description,
      body: cleanBody,
      bodyUpdatedAt: now,
      slug,
      fileKey,
      fileName: `${slug}.pdf`,
      fileSize: pdf.size,
      mimeType: "application/pdf",
      coverKey,
      isFree: 1,
      pricePoints: 0,
      license,
      isOfficial: 1,
      status: "approved",
      contentHash,
      createdAt: now,
    });
  }

  return c.json({ ok: true, id, slug, updated: !!existing }, existing ? 200 : 201);
});

export default app;

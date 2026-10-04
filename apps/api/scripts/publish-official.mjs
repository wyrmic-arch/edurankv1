#!/usr/bin/env node
/**
 * Publish official (EduRank Team) notes.
 *
 * Reads `content/official/<grade>/<subject>/<topic>.md` (+ matching .pdf) from
 * the repo, renders the Markdown to HTML, and POSTs it to the API's official
 * publish endpoint.
 *
 * Usage:
 *   npm run publish:official                 # local (127.0.0.1:8787)
 *   SEED_URL=https://api.edurank.co.za npm run publish:official
 *
 * Requires OFFICIAL_PUBLISH_SECRET (env, or read from apps/api/.dev.vars).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const CONTENT = process.env.CONTENT_DIR ?? join(ROOT, "content", "official");
const API = process.env.SEED_URL ?? "http://127.0.0.1:8787";

function readDevVar(key) {
  const p = join(__dirname, "..", ".dev.vars");
  if (!existsSync(p)) return null;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, "");
  }
  return null;
}

const SECRET = process.env.OFFICIAL_PUBLISH_SECRET ?? readDevVar("OFFICIAL_PUBLISH_SECRET");
if (!SECRET) {
  console.error("Missing OFFICIAL_PUBLISH_SECRET (env or apps/api/.dev.vars).");
  process.exit(1);
}
if (!existsSync(CONTENT)) {
  console.error(`No content directory at ${CONTENT}.`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("missing YAML frontmatter");
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { fm, body: m[2] };
}

const files = walk(CONTENT);
if (files.length === 0) {
  console.log(`No .md files found in ${CONTENT}.`);
  process.exit(0);
}

let ok = 0;
let failed = 0;

for (const mdPath of files) {
  const rel = mdPath.slice(CONTENT.length + 1);
  try {
    const { fm, body } = parseFrontmatter(readFileSync(mdPath, "utf8"));
    const pdfPath = mdPath.replace(/\.md$/, ".pdf");
    if (!fm.title || !fm.subject || !fm.grade || !fm.slug) throw new Error("frontmatter needs title, subject, grade, slug");
    if (!existsSync(pdfPath)) throw new Error(`missing PDF: ${pdfPath.replace(ROOT + "/", "")}`);

    const html = await marked.parse(body);
    const form = new FormData();
    form.append("title", fm.title);
    form.append("subjectId", fm.subject);
    form.append("grade", String(fm.grade));
    form.append("topic", fm.topic ?? "");
    form.append("slug", fm.slug);
    form.append("description", fm.description ?? "");
    form.append("license", fm.license ?? "all-rights-reserved");
    form.append("body", html);
    form.append("pdf", new Blob([readFileSync(pdfPath)], { type: "application/pdf" }), `${fm.slug}.pdf`);
    const coverPath = mdPath.replace(/\.md$/, ".cover.png");
    if (existsSync(coverPath)) {
      form.append("cover", new Blob([readFileSync(coverPath)], { type: "image/png" }), `${fm.slug}.png`);
    }

    const res = await fetch(`${API}/official/publish`, {
      method: "POST",
      headers: { "x-publish-secret": SECRET },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      ok++;
      console.log(`  ✓ ${data.updated ? "updated" : "created"}  ${fm.slug}`);
    } else {
      failed++;
      console.error(`  ✗ ${rel}: ${data.error ?? res.status}`);
    }
  } catch (e) {
    failed++;
    console.error(`  ✗ ${rel}: ${e instanceof Error ? e.message : e}`);
  }
}

console.log(`\nPublish complete: ${ok} ok, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);

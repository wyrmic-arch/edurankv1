import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "../db/schema";
import { awardPoints } from "./points";
import { evalBadges } from "./badges";
import { POINTS_RULES } from "@edurank/shared";
import type { AppEnv, NoteRow } from "../types";

type Env = AppEnv["Bindings"];

const AI_REVIEWER = "ai-moderator";

// Deterministic hard gate: exam-paper / leak markers (case-insensitive).
const LEAK_MARKERS: Array<[RegExp, string]> = [
  [/national\s+senior\s+certificate/i, "National Senior Certificate header"],
  [/department\s+of\s+(basic\s+)?education/i, "Department of Education header"],
  [/senior\s+certificate\s+examination/i, "Senior Certificate examination header"],
  [/matric\s+(final|trial|preliminary?)\s+(exam|paper)/i, "Matric exam paper wording"],
  [/\bpast\s+papers?\b/i, "Past paper reference"],
  [/\bmemorandum\b/i, "Exam memorandum marker"],
  [/\b(november|june)\s*20\d\d\s*[\s-]*(paper|exam)/i, "Dated exam paper reference"],
  [/\bmarking\s+guidelines?\b/i, "Marking guidelines document"],
  [/\bexamination\s+(number|code)\b/i, "Examination numbering"],
];

interface LlmVerdict {
  approve: boolean;
  reason: string;
}

async function extractText(env: Env, note: NoteRow): Promise<string | null> {
  if (!env.AI) return null;
  const obj = await env.NOTES_BUCKET.get(note.fileKey);
  if (!obj) return null;
  try {
    const buf = await obj.arrayBuffer();
    const ext = note.fileKey.split(".").pop() ?? "pdf";
    const ai = env.AI as unknown as {
      toMarkdown: (doc: { name: string; blob: Blob }) => Promise<{
        format: "markdown" | "text" | "error";
        data?: string;
        error?: string;
      }>;
    };
    const result = await ai.toMarkdown({
      name: `note.${ext}`,
      blob: new Blob([buf], { type: note.mimeType || "application/octet-stream" }),
    });
    if (result.format === "error") {
      console.error("toMarkdown conversion failed:", result.error);
      return null;
    }
    return result.data ?? null;
  } catch (e) {
    console.error("toMarkdown failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function llmClassify(
  env: Env,
  note: NoteRow,
  subjectName: string,
  textSample: string,
): Promise<LlmVerdict | null> {
  if (!env.AI) return null;
  const prompt = `You are the moderation system for EduRank, a South African study-notes marketplace. Grade ${note.grade} students upload study notes. This note was uploaded to the "${subjectName}" subject.

Title: ${note.title}
Description: ${note.description ?? "(none)"}

First 6000 characters of the document:
"""
${textSample.slice(0, 6000)}
"""

Decide if this is a legitimate, useful study document for that subject (summaries, explanations, worked examples, flashcards, formula sheets, class notes). Reject spam, empty/junk content, offensive material, content completely unrelated to the subject, or exam papers/memoranda.

Reply with ONLY a JSON object, no other text:
{"approve": true|false, "reason": "<max 140 chars, shown to the uploader>", "quality": <1-10>}`;

  try {
    const res = (await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
      prompt,
      max_tokens: 200,
      temperature: 0.1,
    })) as { response?: string };
    const raw = res.response ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("llmClassify: no JSON in response:", raw.slice(0, 200));
      return null;
    }
    const parsed = JSON.parse(match[0]) as { approve?: boolean; reason?: string };
    if (typeof parsed.approve !== "boolean") return null;
    return {
      approve: parsed.approve,
      reason: (parsed.reason ?? "").slice(0, 180),
    };
  } catch (e) {
    console.error("llmClassify failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function moderateNote(env: Env, noteId: string): Promise<void> {
  const db = drizzle(env.DB);
  const note = (
    await db.select().from(notes).where(eq(notes.id, noteId)).limit(1)
  )[0] as NoteRow | undefined;
  if (!note || note.status !== "pending") return;

  const subjectRow = await env.DB.prepare("SELECT name FROM subjects WHERE id = ?")
    .bind(note.subjectId)
    .first<{ name: string }>();
  const subjectName = subjectRow?.name ?? "General";

  const fail = async (reason: string) => {
    await db
      .update(notes)
      .set({
        status: "rejected",
        reviewedBy: AI_REVIEWER,
        reviewedAt: Date.now(),
        reviewNote: reason.slice(0, 300),
      })
      .where(eq(notes.id, noteId));
  };

  const pass = async (reviewNote: string | null) => {
    await db
      .update(notes)
      .set({
        status: "approved",
        reviewedBy: AI_REVIEWER,
        reviewedAt: Date.now(),
        reviewNote,
      })
      .where(eq(notes.id, noteId));
    await awardPoints(env, {
      userId: note.uploaderId,
      delta: POINTS_RULES.UPLOAD_APPROVED,
      reason: "upload_approved",
      description: `"${note.title}" approved by AI review`,
      noteId: note.id,
      subjectId: note.subjectId,
    });
    await evalBadges(env, note.uploaderId);
  };

  try {
    const text = await extractText(env, note);

    if (text !== null && text.trim().length < 30) {
      await fail(
        "AI review: the document has almost no readable text (scanned images?). Upload a text-based PDF or typed notes.",
      );
      return;
    }

    if (text !== null) {
      for (const [pattern, label] of LEAK_MARKERS) {
        if (pattern.test(text)) {
          await fail(
            `AI review: flagged as exam-paper/leaked content (${label}). Original study notes only.`,
          );
          return;
        }
      }

      const verdict = await llmClassify(env, note, subjectName, text);
      if (verdict) {
        if (verdict.approve) {
          await pass(null);
        } else {
          await fail(`AI review: ${verdict.reason || "not useful study notes"}`);
        }
        return;
      }
      // LLM unavailable -> fail-open on a clean hard-gate scan
      await pass("Approved by keyword scan (AI model unavailable).");
      return;
    }

    // No text pipeline for this file type -> approve with a transparency note
    await pass("Approved without full AI scan (file type has no text layer yet).");
  } catch (e) {
    // Never leave notes stuck in pending because of an AI outage
    try {
      await pass("Approved automatically (AI review temporarily unavailable).");
    } catch {
      console.error("moderation failure", noteId, e);
    }
  }
}

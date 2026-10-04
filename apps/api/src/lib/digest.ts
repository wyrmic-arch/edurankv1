import { and, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { notifications, users } from "../db/schema";
import { sendEmail } from "./email";
import type { AppEnv } from "../types";

function escapeHtml(s: string): string {
  return s.replace(/[<>&'"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&#39;", '"': "&quot;" })[ch] ?? ch);
}

/**
 * Daily digest: email users who opted in and have unread notifications.
 * Returns how many candidates were considered and how many emails were sent.
 */
export async function runDigest(
  env: AppEnv["Bindings"],
  limit = 500,
): Promise<{ candidates: number; sent: number }> {
  const db = drizzle(env.DB);
  const base = (env.APP_URL ?? "https://edurank.co.za").replace(/\/$/, "");

  const candidates = await env.DB.prepare(
    `SELECT u.id, u.email
       FROM users u
      WHERE u.notify_email = 1
        AND EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.read_at IS NULL)
      ORDER BY COALESCE(u.last_digest_at, 0) ASC
      LIMIT ?1`,
  )
    .bind(limit)
    .all<{ id: string; email: string }>();

  const rows = candidates.results ?? [];
  let sent = 0;
  for (const u of rows) {
    const items = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, u.id), isNull(notifications.readAt)))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
    if (items.length === 0) continue;

    const text = [
      "Here's what happened on EduRank:",
      "",
      ...items.map((n) => `• ${n.title}${n.body ? ` — ${n.body}` : ""}`),
      "",
      `Open EduRank: ${base}/notifications`,
      "",
      "You can turn this daily digest off in your profile settings.",
    ].join("\n");
    const html = `<p>Here's what happened on EduRank:</p><ul>${items
      .map((n) => `<li><b>${escapeHtml(n.title)}</b>${n.body ? ` — ${escapeHtml(n.body)}` : ""}</li>`)
      .join("")}</ul><p><a href="${base}/notifications">Open EduRank</a></p><p style="color:#888;font-size:12px">Turn this daily digest off in your profile settings.</p>`;

    const { delivered } = await sendEmail(
      { env },
      { to: u.email, subject: "Your EduRank daily digest", text, html },
    );
    if (delivered) sent++;
    await db.update(users).set({ lastDigestAt: Date.now() }).where(eq(users.id, u.id));
  }

  return { candidates: rows.length, sent };
}

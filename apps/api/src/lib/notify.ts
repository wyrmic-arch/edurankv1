import { drizzle } from "drizzle-orm/d1";
import { notifications } from "../db/schema";
import { shortId } from "./id";
import type { NotificationType } from "@edurank/shared";

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string | null;
  data?: Record<string, unknown>;
}

/**
 * Append an in-app notification. Best-effort: never let a notification
 * failure break the business action that triggered it.
 */
export async function notify(
  env: { DB: D1Database },
  userId: string,
  input: NotifyInput,
): Promise<void> {
  try {
    await drizzle(env.DB).insert(notifications).values({
      id: shortId(14),
      userId,
      type: input.type,
      title: input.title.slice(0, 160),
      body: (input.body ?? "").slice(0, 400),
      link: input.link ?? null,
      dataJson: JSON.stringify(input.data ?? {}),
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("notify failed:", e instanceof Error ? e.message : e);
  }
}

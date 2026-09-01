import type { Context } from "hono";
import { z } from "zod";
import type { UserRole } from "@edurank/shared";
import { ApiError, type AppEnv, type NoteRow, type UserRow } from "../types";

export function parseBody<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const res = schema.safeParse(data);
  if (!res.success) {
    const issue = res.error.issues[0];
    const path = issue?.path.join(".");
    throw new ApiError(400, `${path ? `${path}: ` : ""}${issue?.message ?? "Invalid input"}`);
  }
  return res.data;
}

export async function parseJsonBody<T extends z.ZodTypeAny>(c: Context<AppEnv>, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  return parseBody(schema, raw);
}

export function pagination(c: Context<AppEnv>): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(c.req.query("pageSize") ?? "20") || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function publicUser(u: UserRow, schoolName: string | null, rank: number) {
  return {
    id: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    bannerUrl: `/img/banner/${u.id}`,
    bio: u.bio,
    grade: u.grade,
    schoolId: u.schoolId,
    schoolName,
    role: u.role as UserRole,
    balance: u.balance,
    totalEarned: u.totalEarned,
    totalSpent: u.totalSpent,
    streakCount: u.streakCount,
    bestStreak: u.bestStreak,
    referralCode: u.referralCode,
    equippedFrameId: u.equippedFrameId,
    equippedSkinId: u.equippedSkinId,
    rank,
    createdAt: new Date(u.createdAt).toISOString(),
  };
}

export function noteDTO(
  n: NoteRow,
  extra: {
    subjectName: string;
    subjectColor: string;
    uploaderName: string;
    unlockedByMe?: boolean;
    upvotedByMe?: boolean;
    ownedByMe?: boolean;
  },
) {
  return {
    id: n.id,
    title: n.title,
    description: n.description,
    subjectId: n.subjectId,
    subjectName: extra.subjectName,
    subjectColor: extra.subjectColor,
    grade: n.grade,
    topic: n.topic,
    uploaderId: n.uploaderId,
    uploaderName: extra.uploaderName,
    coverUrl: n.coverKey ? `/r2/${n.coverKey}` : null,
    isFree: n.isFree === 1,
    pricePoints: n.pricePoints,
    status: n.status,
    reviewNote: n.reviewNote,
    downloadCount: n.downloadCount,
    upvoteCount: n.upvoteCount,
    createdAt: new Date(n.createdAt).toISOString(),
    unlockedByMe: extra.unlockedByMe ?? false,
    upvotedByMe: extra.upvotedByMe ?? false,
    ownedByMe: extra.ownedByMe ?? false,
    fileName: n.fileName,
    fileSize: n.fileSize,
    mimeType: n.mimeType,
  };
}

export function err(status: number, message: string): never {
  throw new ApiError(status, message);
}

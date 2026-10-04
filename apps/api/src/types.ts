import type { LedgerReason, UserRole } from "@edurank/shared";

export interface Bindings {
  DB: D1Database;
  NOTES_BUCKET: R2Bucket;
  ALLOWED_ORIGINS: string;
  APP_URL?: string;
  RESEND_API_KEY?: string;
  REPLY_TO?: string;
  ALERT_EMAIL?: string;
  TURNSTILE_SECRET?: string;
  OFFICIAL_PUBLISH_SECRET?: string;
  /** Local/dev only: auto-verify new accounts so seed/smoke don't need inboxes. */
  DEV_AUTO_VERIFY?: string;
  EARLY_ACCESS_UNTIL?: string;
  UNSPLASH_ACCESS_KEY?: string;
  CERT_SECRET?: string;
  AI?: Ai;
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    userId?: string;
  };
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  grade: number | null;
  gradeYear: number | null;
  gradeSetAt: number | null;
  heldBack: number;
  graduatedAt: number | null;
  schoolId: string | null;
  schoolLockedAt: number | null;
  role: UserRole;
  emailVerifiedAt: number | null;
  verifyToken: string | null;
  verifyTokenAt: number | null;
  resetToken: string | null;
  resetTokenAt: number | null;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  streakCount: number;
  bestStreak: number;
  lastStreakDate: string | null;
  referralCode: string;
  referredBy: string | null;
  profileCompletedAt: number | null;
  equippedFrameId: string | null;
  equippedSkinId: string | null;
  notifyEmail: number;
  lastDigestAt: number | null;
  createdAt: number;
}

export interface NoteRow {
  id: string;
  uploaderId: string;
  subjectId: string;
  grade: number;
  topic: string;
  title: string;
  description: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  coverKey: string | null;
  schoolId: string | null;
  contentHash: string | null;
  license: string;
  isOfficial: number;
  slug: string | null;
  body: string | null;
  bodyUpdatedAt: number | null;
  isFree: number;
  pricePoints: number;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: number | null;
  downloadCount: number;
  upvoteCount: number;
  createdAt: number;
}

export interface SubjectRow {
  id: string;
  name: string;
  blurb: string;
  color: string;
  icon: string;
  unsplashQuery: string;
  sortOrder: number;
}

export interface ShopRow {
  id: string;
  kind: string; // 'badge' | 'frame' | 'skin'
  name: string;
  description: string;
  pricePoints: number;
  configJson: string;
  sortOrder: number;
}

export type { LedgerReason };

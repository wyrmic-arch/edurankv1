// ---------------------------------------------------------------------------
// EduRank shared types & constants (used by both the API worker and the web app)
// ---------------------------------------------------------------------------

export const GRADES = [8, 9, 10, 11, 12] as const;
export type Grade = (typeof GRADES)[number];

// --- Feature flags ----------------------------------------------------------

// Email verification is ENFORCED: new student accounts must confirm their
// email before they can upload, unlock or buy. Local dev sets DEV_AUTO_VERIFY
// so seed/smoke accounts skip it. Staff (invite-based) are exempt.
export const REQUIRE_EMAIL_VERIFICATION = true;

// --- Points economy ---------------------------------------------------------

export const POINTS_RULES = {
  UPLOAD_APPROVED: 50,
  DOWNLOAD_RECEIVED: 10,
  UPVOTE_RECEIVED: 5,
  REFERRAL_BONUS: 100,
  FOUNDER_BONUS: 150,
  PROFILE_COMPLETE: 30,
  STREAK_BASE: 5,
  STREAK_STEP: 2,
  STREAK_CAP: 15,
  DAILY_CHALLENGE_REWARD: 25,
  SELLER_CUT: 0.5, // uploader earns 50% of unlock price when someone unlocks their note
} as const;

// Referral anti-farming caps. The referral bonus is payable to the referrer at
// most this many times per day and over the lifetime of the account.
export const REFERRAL_CAPS = {
  MAX_PER_DAY: 5,
  MAX_TOTAL: 50,
} as const;

export type LedgerReason =
  | "upload_approved"
  | "download_received"
  | "upvote_received"
  | "unlock_purchase"
  | "unlock_revenue"
  | "streak_bonus"
  | "referral_bonus"
  | "founder_bonus"
  | "profile_bonus"
  | "daily_challenge"
  | "cosmetic_purchase"
  | "admin_adjust";

export type UserRole = "user" | "teacher" | "principal" | "admin" | "owner";
export const USER_ROLES: readonly UserRole[] = ["user", "teacher", "principal", "admin", "owner"] as const;

// "user" is the internal value for a student account. Staff roles may not be
// self-selected — they are granted through invite codes (see staff_invites).
// "owner" is the platform founder: a super-admin who sees everything.
export const STAFF_ROLES = ["teacher", "principal", "admin", "owner"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export function isStaffRole(role: UserRole | string | null | undefined): boolean {
  return role === "teacher" || role === "principal" || role === "admin" || role === "owner";
}

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Student",
  teacher: "Teacher",
  principal: "Principal",
  admin: "Admin",
  owner: "Owner",
};

// --- Note licensing ---------------------------------------------------------

export const NOTE_LICENSES = [
  { id: "all-rights-reserved", label: "All rights reserved", hint: "On-platform access only. Resale or redistribution is not allowed." },
  { id: "cc-by-nc", label: "CC BY-NC", hint: "Others may share with credit for non-commercial use." },
  { id: "cc-by", label: "CC BY", hint: "Others may share and adapt with credit." },
] as const;
export type LicenseId = (typeof NOTE_LICENSES)[number]["id"];
export const DEFAULT_LICENSE: LicenseId = "all-rights-reserved";
export function licenseLabel(id: string | null | undefined): string {
  return NOTE_LICENSES.find((l) => l.id === id)?.label ?? NOTE_LICENSES[0].label;
}

// Academic-year helper: the SA school year is the calendar year.
export function academicYear(at: number = Date.now()): number {
  return new Date(at).getUTCFullYear();
}


export const LEDGER_REASON_LABELS: Record<LedgerReason, string> = {
  upload_approved: "Note approved",
  download_received: "Your note was downloaded",
  upvote_received: "Your note got an upvote",
  unlock_purchase: "Unlocked a note",
  unlock_revenue: "Unlock revenue (50% cut)",
  streak_bonus: "Daily login streak",
  referral_bonus: "Referral bonus",
  founder_bonus: "Founder bonus",
  profile_bonus: "Profile completed",
  daily_challenge: "Daily challenge cleared",
  cosmetic_purchase: "Shop purchase",
  admin_adjust: "Admin adjustment",
};

export const TIERS = [
  { key: "rookie", label: "ROOKIE", min: 0, color: "#8A97A8" },
  { key: "runner", label: "RUNNER", min: 500, color: "#43D9FF" },
  { key: "hustler", label: "HUSTLER", min: 2000, color: "#A6FF3F" },
  { key: "elite", label: "ELITE", min: 6000, color: "#FFC24B" },
  { key: "legend", label: "LEGEND", min: 15000, color: "#FF4D5E" },
] as const;

export type Tier = (typeof TIERS)[number];

export function tierFor(totalEarned: number): Tier {
  let tier: Tier = TIERS[0]!;
  for (const t of TIERS) if (totalEarned >= t.min) tier = t;
  return tier;
}

// --- Daily challenges -------------------------------------------------------

export type ChallengeMetric =
  | "downloads_today"
  | "uploads_today"
  | "upvotes_given_today"
  | "login_today";

export interface ChallengeDef {
  key: string;
  label: string;
  hint: string;
  metric: ChallengeMetric;
  target: number;
  reward: number;
  icon: string; // lucide icon name
}

export const CHALLENGE_CATALOG: ChallengeDef[] = [
  {
    key: "study_sprint",
    label: "STUDY SPRINT",
    hint: "Download any 2 notes today",
    metric: "downloads_today",
    target: 2,
    reward: 25,
    icon: "Download",
  },
  {
    key: "give_back",
    label: "GIVE BACK",
    hint: "Upload 1 note for review today",
    metric: "uploads_today",
    target: 1,
    reward: 25,
    icon: "UploadCloud",
  },
  {
    key: "hype_man",
    label: "HYPE MAN",
    hint: "Upvote 3 notes today",
    metric: "upvotes_given_today",
    target: 3,
    reward: 25,
    icon: "ThumbsUp",
  },
  {
    key: "show_up",
    label: "SHOW UP",
    hint: "Log in and keep the streak alive",
    metric: "login_today",
    target: 1,
    reward: 25,
    icon: "Flame",
  },
];

/** Deterministic pick of 3 challenges per calendar day. */
export function challengesForDate(dateKey: string): ChallengeDef[] {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  const pool = [...CHALLENGE_CATALOG];
  const picked: ChallengeDef[] = [];
  while (picked.length < 3 && pool.length > 0) {
    h = (h * 1103515245 + 12345) >>> 0;
    const idx = h % pool.length;
    picked.push(pool.splice(idx, 1)[0] as ChallengeDef);
  }
  return picked;
}

// --- API payload types ------------------------------------------------------

export interface PublicUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  grade: number | null;
  gradeYear: number | null;
  heldBack: boolean;
  graduated: boolean;
  schoolId: string | null;
  schoolName?: string | null;
  role: UserRole;
  emailVerified: boolean;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  streakCount: number;
  bestStreak: number;
  referralCode: string;
  equippedFrameId: string | null;
  equippedSkinId: string | null;
  rank: number;
  createdAt: string;
}

export interface SubjectDTO {
  id: string;
  name: string;
  blurb: string;
  color: string;
  icon: string;
  noteCount: number;
}

export interface NoteDTO {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  grade: number;
  topic: string;
  uploaderId: string;
  uploaderName: string;
  coverUrl: string | null;
  isFree: boolean;
  pricePoints: number;
  license: string;
  isOfficial?: boolean;
  slug?: string | null;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string | null;
  downloadCount: number;
  upvoteCount: number;
  createdAt: string;
  unlockedByMe?: boolean;
  upvotedByMe?: boolean;
  ownedByMe?: boolean;
  verifiedByTeacher?: boolean;
  canViewFile?: boolean;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface LedgerEntryDTO {
  id: string;
  delta: number;
  reason: LedgerReason;
  description: string;
  balanceAfter: number;
  createdAt: string;
  noteId: string | null;
}

export interface LeaderboardRowDTO {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  schoolName: string | null;
  grade: number | null;
  points: number;
  rank: number;
}

export interface ShopItemDTO {
  id: string;
  kind: "badge" | "frame" | "skin";
  name: string;
  description: string;
  pricePoints: number;
  config: Record<string, unknown>;
  owned?: boolean;
  equipped?: boolean;
}

export interface BadgeDTO {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: number;
  criteriaType: string;
  threshold: number;
  awardedAt: string | null;
}

export interface ChallengeStateDTO extends ChallengeDef {
  progress: number;
  complete: boolean;
  claimed: boolean;
}

export interface MeResponse {
  user: PublicUser;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// --- Notifications ----------------------------------------------------------

export type NotificationType =
  | "note_approved"
  | "note_rejected"
  | "note_unlocked"
  | "note_verified"
  | "referral_joined"
  | "badge_earned"
  | "challenge_cleared"
  | "system";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

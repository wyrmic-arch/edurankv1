import type { PublicUser, UserRole, NotificationDTO, SuggestionDTO, SuggestionCategory } from "@edurank/shared";

// Production API URL is baked in as the fallback so the deployed build
// always talks to the worker even if NEXT_PUBLIC_API_URL isn't set.
// Override locally by setting NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
// in apps/web/.env.local.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.edurank.co.za";

export const TOKEN_KEY = "edurank_token";

export function imgUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function isApiClientError(e: unknown): e is ApiClientError {
  return e instanceof ApiClientError;
}

async function request<T>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  // Hard request timeout. Some networks resolve Cloudflare hostnames to IPv6
  // first but have no IPv6 route; without a timeout the fetch can hang for a
  // long time waiting on Happy Eyeballs. We abort fast and retry once, which
  // lets the second attempt land on the (working) IPv4 address.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  let res: Response | null;
  const method = opts.method ?? "GET";
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
  } catch {
    // Only retry idempotent requests. Retrying a POST/PATCH could duplicate a
    // note, re-run a purchase, or surface a confusing error after success.
    if (method !== "GET" && method !== "HEAD") {
      clearTimeout(timer);
      throw new ApiClientError(0, "Network error — check your connection and try again.");
    }
    // Aborted / network failure — retry once before surfacing the error.
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      clearTimeout(timer);
      throw new ApiClientError(0, "Can't reach the server — check your connection, then try again.");
    }
  } finally {
    clearTimeout(timer);
  }

  if (res === null) {
    throw new ApiClientError(
      0,
      `No response from ${API_BASE}. Worker may be offline.`,
    );
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error ?? `Request failed (${res.status})`;
    throw new ApiClientError(res.status, msg);
  }
  return data as T;
}

// ---- endpoints ----

export const api = {
  register: (body: {
    email: string;
    password: string;
    displayName: string;
    grade?: number | null;
    schoolId?: string | null;
    referralCode?: string | null;
    inviteCode?: string | null;
    turnstileToken?: string | null;
    bio?: string;
  }): Promise<{ token: string; user: PublicUser }> => request("/auth/register", { method: "POST", body }),
  login: (email: string, password: string, turnstileToken?: string): Promise<{ token: string; user: PublicUser }> =>
    request("/auth/login", { method: "POST", body: { email, password, turnstileToken } }),
  logout: (): Promise<{ ok: boolean }> => request("/auth/logout", { method: "POST" }),
  me: (): Promise<{ user: PublicUser }> => request("/auth/me"),
  verifyEmail: (token: string, email: string): Promise<{ ok: boolean }> =>
    request(`/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`),
  resendVerification: (): Promise<{ ok: boolean }> =>
    request("/auth/resend-verification", { method: "POST", body: {} }),
  forgotPassword: (email: string): Promise<{ ok: boolean }> =>
    request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token: string, email: string, password: string): Promise<{ ok: boolean }> =>
    request("/auth/reset-password", { method: "POST", body: { token, email, password } }),
  updateMe: (patch: Partial<{ displayName: string; bio: string; grade: number | null; schoolId: string | null; equippedFrameId: string | null; equippedSkinId: string | null }>): Promise<{ user: PublicUser }> =>
    request("/me", { method: "PATCH", body: patch }),
  ledger: (page = 1, flow = "all"): Promise<Paginatedish<LedgerItem>> =>
    request(`/me/ledger?page=${page}&flow=${flow}`),
  subjects: (): Promise<{ items: Subject[] }> => request("/subjects"),
  schools: (): Promise<{ items: School[] }> => request("/schools"),
  school: (id: string): Promise<SchoolDetail> => request(`/schools/${id}`),
  notes: (params: Record<string, string | number | undefined>): Promise<Paginatedish<Note>> => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && qs.set(k, String(v)));
    return request(`/notes?${qs.toString()}`);
  },
  myNotes: (): Promise<{ items: Note[] }> => request("/notes/mine"),
  note: (id: string): Promise<{ note: Note; verifications: NoteVerification[] }> => request(`/notes/${id}`),
  uploadNote: (form: FormData): Promise<{ id: string; rewardOnApproval: number }> => request("/notes", { method: "POST", form }),
  unlock: (id: string): Promise<{ unlocked: boolean; pricePaid: number; balanceAfter: number }> => request(`/notes/${id}/unlock`, { method: "POST" }),
  upvote: (id: string): Promise<{ upvotedByMe: boolean; upvoteCount: number }> => request(`/notes/${id}/upvote`, { method: "POST" }),
  fileUrl: (id: string) => `${API_BASE}/notes/${id}/file`,
  downloadNote: async (id: string): Promise<Blob> => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/notes/${id}/file`, { headers });
    if (!res.ok) {
      let msg = `Download failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) msg = data.error;
      } catch {
        /* non-JSON body */
      }
      throw new ApiClientError(res.status, msg);
    }
    return res.blob();
  },
  leaderboard: (scope: string, range: string, extra?: Record<string, string>): Promise<{ items: LeaderRow[] }> =>
    request(`/leaderboard?scope=${scope}&range=${range}${extra ? `&${new URLSearchParams(extra)}` : ""}`),
  shop: (): Promise<{ items: ShopItemView[] }> => request("/shop"),
  purchase: (id: string): Promise<{ purchased: boolean; balanceAfter: number }> => request(`/shop/${id}/purchase`, { method: "POST" }),
  challenges: (): Promise<ChallengesResponse> => request("/challenges/daily"),
  adminPending: (): Promise<{ items: AdminPendingNote[] }> => request("/admin/pending"),
  adminRejected: (): Promise<{ items: AdminRejectedNote[] }> => request("/admin/rejected"),
  adminRestore: (id: string): Promise<{ ok: boolean }> => request(`/admin/notes/${id}/restore`, { method: "POST" }),
  adminAiCheck: (): Promise<{ ok: boolean; sample?: string; error?: string }> => request("/admin/ai-check"),
  adminStats: (): Promise<AdminStats> => request("/admin/stats"),
  approve: (id: string): Promise<{ ok: boolean }> => request(`/admin/notes/${id}/approve`, { method: "POST" }),
  reject: (id: string, reason: string): Promise<{ ok: boolean }> => request(`/admin/notes/${id}/reject`, { method: "POST", body: { reason } }),
  profile: (id: string): Promise<ProfileResponse> => request(`/users/${id}`),
  verifyNote: (id: string, verdict: "correct" | "needs_work", comment = ""): Promise<{ ok: boolean; verdict: string }> =>
    request(`/notes/${id}/verify`, { method: "POST", body: { verdict, comment } }),
  certificate: (id: string): Promise<{ certificate: Certificate }> => request(`/notes/${id}/certificate`),
  reportNote: (id: string, reason: string, details = ""): Promise<{ ok: boolean }> =>
    request(`/notes/${id}/report`, { method: "POST", body: { reason, details } }),

  notifications: (page = 1): Promise<{ items: NotificationDTO[]; unread: number; page: number; pageSize: number; total: number }> =>
    request(`/notifications?page=${page}`),
  notificationsUnread: (): Promise<{ unread: number }> => request("/notifications/unread-count"),
  markNotificationsRead: (ids?: string[]): Promise<{ ok: boolean }> =>
    request("/notifications/read", { method: "POST", body: { ids } }),
  notificationPrefs: (): Promise<{ email: boolean }> => request("/notifications/prefs"),
  setNotificationPrefs: (email: boolean): Promise<{ ok: boolean; email: boolean }> =>
    request("/notifications/prefs", { method: "PATCH", body: { email } }),

  submitSuggestion: (body: { title: string; body: string; category: SuggestionCategory }): Promise<{ ok: boolean; id: string }> =>
    request("/suggestions", { method: "POST", body }),
  mySuggestions: (): Promise<{ items: SuggestionDTO[] }> => request("/suggestions/mine"),
  withdrawSuggestion: (id: string): Promise<{ ok: boolean }> => request(`/suggestions/${id}`, { method: "DELETE" }),
  adminSuggestions: (status = ""): Promise<{ items: AdminSuggestion[] }> =>
    request(`/admin/suggestions${status ? `?status=${status}` : ""}`),
  adminTriageSuggestion: (id: string, status: string, adminNote = ""): Promise<{ ok: boolean }> =>
    request(`/admin/suggestions/${id}`, { method: "POST", body: { status, adminNote } }),

  // --- admin ---
  adminUsers: (q = "", role = ""): Promise<{ items: AdminUser[] }> =>
    request(`/admin/users?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}`),
  adminSetRole: (id: string, role: string): Promise<{ ok: boolean }> => request(`/admin/users/${id}/role`, { method: "POST", body: { role } }),
  adminSetGrade: (id: string, patch: { grade?: number | null; heldBack?: boolean; graduated?: boolean }): Promise<{ ok: boolean }> =>
    request(`/admin/users/${id}/grade`, { method: "POST", body: patch }),
  adminInvites: (): Promise<{ items: StaffInvite[] }> => request("/admin/invites"),
  adminCreateInvite: (role: "principal" | "teacher", schoolId: string, subjectIds: string[] = []): Promise<{ code: string }> =>
    request("/admin/invites", { method: "POST", body: { role, schoolId, subjectIds } }),
  adminPromotions: (): Promise<{ academicYear: number; rows: PromotionRow[] }> => request("/admin/promotions/preview"),
  adminRunPromotions: (): Promise<{ ok: boolean; graduated: number; heldBack: number; promoted: number }> =>
    request("/admin/promotions/run", { method: "POST" }),
  adminReports: (): Promise<{ items: ReportRow[] }> => request("/admin/reports"),
  adminResolveReport: (id: string, action: "dismiss" | "remove"): Promise<{ ok: boolean }> =>
    request(`/admin/reports/${id}/resolve`, { method: "POST", body: { action } }),

  ownerOverview: (): Promise<OwnerOverview> => request("/owner/overview"),

  // --- principal ---
  schoolDashboard: (): Promise<SchoolDashboard> => request("/school"),
  schoolStudents: (): Promise<{ items: SchoolStudent[] }> => request("/school/students"),
  schoolNotes: (): Promise<{ items: SchoolNote[] }> => request("/school/notes"),
  schoolInvites: (): Promise<{ items: StaffInvite[] }> => request("/school/invites"),
  schoolCreateInvite: (subjectIds: string[]): Promise<{ code: string }> => request("/school/invites", { method: "POST", body: { subjectIds } }),
  schoolSetHeldBack: (id: string, heldBack: boolean): Promise<{ ok: boolean }> =>
    request(`/school/students/${id}/held-back`, { method: "POST", body: { heldBack } }),
  schoolSetTeacherSubjects: (id: string, subjectIds: string[]): Promise<{ ok: boolean }> =>
    request(`/school/teachers/${id}/subjects`, { method: "POST", body: { subjectIds } }),
};

export interface Paginatedish<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
export type { PublicUser };

import type {
  BadgeDTO,
  ChallengeStateDTO,
  LedgerEntryDTO,
  NoteDTO,
  ShopItemDTO,
} from "@edurank/shared";
export type Note = NoteDTO;
export type LedgerItem = LedgerEntryDTO;
export type ShopItemView = ShopItemDTO & { owned: boolean; equipped: boolean };
export interface Subject {
  id: string;
  name: string;
  blurb: string;
  color: string;
  icon: string;
  noteCount: number;
}
export interface School {
  id: string;
  name: string;
  province: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  playerCount: number;
}
export interface SchoolTopPlayer {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  grade: number | null;
  points: number;
}
export interface SchoolDetail {
  school: School;
  stats: { playerCount: number; notesUploaded: number; totalPoints: number };
  topPlayers: SchoolTopPlayer[];
}
export function schoolCoverUrl(id: string, variant?: string): string {
  return imgUrl(`/img/school/${encodeURIComponent(id)}${variant ? `?v=${encodeURIComponent(variant)}` : ""}`) ?? "";
}
export interface LeaderRow {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  schoolName: string | null;
  grade: number | null;
  points: number;
  rank: number;
}
export interface ChallengesResponse {
  dateKey: string;
  challenges: ChallengeStateDTO[];
  balance: number;
}
export interface AdminPendingNote {
  id: string;
  title: string;
  description: string;
  topic: string;
  grade: number;
  subjectName: string;
  uploaderId: string;
  uploaderName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}
export interface AdminStats {
  pending: number;
  approved: number;
  rejected: number;
  players: number;
  pointsEarnedAllTime: number;
}
export interface AdminRejectedNote {
  id: string;
  title: string;
  description: string;
  topic: string;
  grade: number;
  subjectName: string;
  uploaderName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}
export interface ProfileResponse {
  user: PublicUser;
  stats: { uploads: number; downloadsReceived: number; upvotesReceived: number };
  badges: BadgeDTO[];
}
export interface NoteVerification {
  verdict: "correct" | "needs_work";
  comment: string;
  teacherName: string;
  createdAt: string;
}
export interface StaffInvite {
  id: string;
  code: string;
  role: string;
  schoolId?: string;
  schoolName?: string;
  subjectIds: string[];
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedAt: string | null;
}
export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  grade: number | null;
  schoolId: string | null;
  totalEarned: number;
  createdAt: string;
}
export interface PromotionRow {
  grade: number;
  total: number;
  heldBack: number;
  graduating: boolean;
  advancing: number;
  nextGrade: number | null;
}
export interface SchoolDashboard {
  school: { id: string; name: string; province: string; city: string | null };
  stats: { students: number; notesApproved: number; notesPending: number; points: number };
  byGrade: { grade: number; students: number }[];
}
export interface SchoolStudent {
  id: string;
  displayName: string;
  email: string;
  grade: number | null;
  heldBack: boolean;
  totalEarned: number;
  balance: number;
  createdAt: string;
}
export interface SchoolNote {
  id: string;
  title: string;
  grade: number;
  status: string;
  subjectName: string;
  uploaderName: string;
  upvoteCount: number;
  downloadCount: number;
  verified: boolean;
  createdAt: string;
}
export interface Certificate {
  noteId: string;
  title: string;
  uploaderName: string;
  uploadedAt: string;
  contentHash: string | null;
  license: string;
  signature: string | null;
  verifyUrl: string;
}
export interface ReportRow {
  id: string;
  noteId: string;
  noteTitle: string;
  noteStatus: string;
  reason: string;
  details: string;
  reporterName: string;
  createdAt: string;
}
export interface AdminSuggestion {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
  adminNote: string | null;
  userName: string;
  createdAt: string;
  updatedAt: string | null;
}
export interface OwnerOverview {
  stats: {
    students: number;
    teachers: number;
    principals: number;
    admins: number;
    owners: number;
    notesTotal: number;
    notesPending: number;
    notesApproved: number;
    notesRejected: number;
    notesOfficial: number;
    pointsIssued: number;
    pointsSpent: number;
    pointsOutstanding: number;
    unlocks: number;
    reportsOpen: number;
    principalInvites: number;
  };
  recentUsers: { id: string; displayName: string; role: UserRole; createdAt: string }[];
  recentNotes: { id: string; title: string; status: string; official: boolean; createdAt: string }[];
}

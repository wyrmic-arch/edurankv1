import type { PublicUser } from "@edurank/shared";

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
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body,
      signal: controller.signal,
    });
  } catch {
    // Aborted / network failure — retry once before surfacing the error.
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method: opts.method ?? "GET",
        headers,
        body,
        signal: AbortSignal.timeout(8_000),
      });
    } catch (e) {
      clearTimeout(timer);
      // Network-level failure (DNS, TLS, CORS preflight, offline, etc.).
      // Browsers swallow the real reason for CORS preflight failures, so
      // give the user something actionable.
      throw new ApiClientError(
        0,
        `Can't reach the API at ${API_BASE}. ` +
          `Open the browser dev tools (Network tab) and look at the failing request — ` +
          `if it's red and says "CORS" or "(blocked)", the API needs ${API_BASE} 's origin in its ALLOWED_ORIGINS. ` +
          `Otherwise make sure the worker is deployed (it is at: ${API_BASE}).`,
      );
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
    bio?: string;
  }): Promise<{ token: string; user: PublicUser }> => request("/auth/register", { method: "POST", body }),
  login: (email: string, password: string): Promise<{ token: string; user: PublicUser }> =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  logout: (): Promise<{ ok: boolean }> => request("/auth/logout", { method: "POST" }),
  me: (): Promise<{ user: PublicUser }> => request("/auth/me"),
  updateMe: (patch: Partial<{ displayName: string; bio: string; grade: number | null; schoolId: string | null; equippedFrameId: string | null; equippedSkinId: string | null }>): Promise<{ user: PublicUser }> =>
    request("/me", { method: "PATCH", body: patch }),
  ledger: (page = 1, flow = "all"): Promise<Paginatedish<LedgerItem>> =>
    request(`/me/ledger?page=${page}&flow=${flow}`),
  subjects: (): Promise<{ items: Subject[] }> => request("/subjects"),
  schools: (): Promise<{ items: School[] }> => request("/schools"),
  notes: (params: Record<string, string | number | undefined>): Promise<Paginatedish<Note>> => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && qs.set(k, String(v)));
    return request(`/notes?${qs.toString()}`);
  },
  myNotes: (): Promise<{ items: Note[] }> => request("/notes/mine"),
  note: (id: string): Promise<{ note: Note }> => request(`/notes/${id}`),
  uploadNote: (form: FormData): Promise<{ id: string; rewardOnApproval: number }> => request("/notes", { method: "POST", form }),
  unlock: (id: string): Promise<{ unlocked: boolean; pricePaid: number; balanceAfter: number }> => request(`/notes/${id}/unlock`, { method: "POST" }),
  upvote: (id: string): Promise<{ upvotedByMe: boolean; upvoteCount: number }> => request(`/notes/${id}/upvote`, { method: "POST" }),
  fileUrl: (id: string) => `${API_BASE}/notes/${id}/file`,
  leaderboard: (scope: string, range: string, extra?: Record<string, string>): Promise<{ items: LeaderRow[] }> =>
    request(`/leaderboard?scope=${scope}&range=${range}${extra ? `&${new URLSearchParams(extra)}` : ""}`),
  shop: (): Promise<{ items: ShopItemView[] }> => request("/shop"),
  purchase: (id: string): Promise<{ purchased: boolean; balanceAfter: number }> => request(`/shop/${id}/purchase`, { method: "POST" }),
  challenges: (): Promise<ChallengesResponse> => request("/challenges/daily"),
  adminPending: (): Promise<{ items: AdminPendingNote[] }> => request("/admin/pending"),
  adminStats: (): Promise<AdminStats> => request("/admin/stats"),
  approve: (id: string): Promise<{ ok: boolean }> => request(`/admin/notes/${id}/approve`, { method: "POST" }),
  reject: (id: string, reason: string): Promise<{ ok: boolean }> => request(`/admin/notes/${id}/reject`, { method: "POST", body: { reason } }),
  profile: (id: string): Promise<ProfileResponse> => request(`/users/${id}`),
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
export interface ProfileResponse {
  user: PublicUser;
  stats: { uploads: number; downloadsReceived: number; upvotesReceived: number };
  badges: BadgeDTO[];
}

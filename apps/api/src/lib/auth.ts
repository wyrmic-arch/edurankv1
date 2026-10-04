import { eq, and, gt } from "drizzle-orm";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { drizzle } from "drizzle-orm/d1";
import { sessions, users } from "../db/schema";
import { sha256Hex } from "./password";
import { shortId } from "./id";
import type { UserRole } from "@edurank/shared";
import { isStaffRole } from "@edurank/shared";
import { ApiError, type UserRow } from "../types";

const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;
export const SESSION_COOKIE = "edu_session";

const dbOf = (c: Context) => drizzle(c.env.DB);

/** Create a session for the user. Returns the raw bearer token. */
export async function createSession(c: Context, userId: string): Promise<string> {
  const token = `${shortId(12)}.${shortId(32)}`; // high-entropy opaque token
  const id = await sha256Hex(token);
  const now = Date.now();
  const db = dbOf(c);
  await db.insert(sessions).values({ id, userId, createdAt: now, expiresAt: now + SESSION_TTL_MS });
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return token;
}

async function userForToken(c: Context, token: string | undefined): Promise<UserRow | null> {
  if (!token) return null;
  const id = await sha256Hex(token);
  const db = dbOf(c);
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, Date.now())))
    .limit(1);
  const u = rows[0]?.user;
  if (!u) return null;
  // Drizzle returns role as `string`; narrow it to UserRole at the boundary.
  return { ...u, role: u.role as UserRole };
}

function bearerFrom(c: Context): string | undefined {
  const h = c.req.header("Authorization");
  if (h?.startsWith("Bearer ")) return h.slice(7);
  return getCookie(c, SESSION_COOKIE);
}

/** Resolve the current user from Bearer token or cookie. Null when anonymous. */
export async function currentUser(c: Context): Promise<UserRow | null> {
  return userForToken(c, bearerFrom(c));
}

/** Require auth — throws a 401 handled by the error boundary. */
export async function requireUser(c: Context): Promise<UserRow> {
  const u = await currentUser(c);
  if (!u) throw new ApiError(401, "Sign in required.");
  return u;
}

export async function requireAdmin(c: Context): Promise<UserRow> {
  const u = await requireUser(c);
  if (u.role !== "admin") throw new ApiError(403, "Restricted area.");
  return u;
}

/** Require one of the given roles. */
export async function requireRole(c: Context, ...roles: UserRole[]): Promise<UserRow> {
  const u = await requireUser(c);
  if (!roles.includes(u.role)) throw new ApiError(403, "Restricted area.");
  return u;
}

/** Teacher, principal or admin. */
export async function requireStaff(c: Context): Promise<UserRow> {
  const u = await requireUser(c);
  if (!isStaffRole(u.role)) throw new ApiError(403, "Staff only.");
  return u;
}

/** Principal or admin. */
export async function requirePrincipal(c: Context): Promise<UserRow> {
  const u = await requireUser(c);
  if (u.role !== "principal" && u.role !== "admin") throw new ApiError(403, "Principals only.");
  return u;
}

/** Teacher, principal or admin. */
export async function requireTeacher(c: Context): Promise<UserRow> {
  const u = await requireUser(c);
  if (!isStaffRole(u.role)) throw new ApiError(403, "Teachers only.");
  return u;
}

/**
 * Students must have a locked grade to touch notes; staff are exempt (a
 * principal/teacher/admin is not in a grade). Graduated (alumni) keep read
 * access.
 */
export function canAccessNotes(user: UserRow): boolean {
  return isStaffRole(user.role) || user.grade != null;
}

export async function destroySession(c: Context): Promise<void> {
  const token = bearerFrom(c);
  if (!token) return;
  const id = await sha256Hex(token);
  await dbOf(c).delete(sessions).where(eq(sessions.id, id));
}

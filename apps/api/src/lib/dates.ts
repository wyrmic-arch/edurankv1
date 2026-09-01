import type { UserRow } from "../types";

const SAST = "Africa/Johannesburg";

/** 'YYYY-MM-DD' for the given epoch ms, in South African local time. */
export function dateKeySAST(ms: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SAST }).format(new Date(ms));
}

/** Epoch ms of SAST midnight for the given date key. */
export function startOfSASTDay(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00+02:00`).getTime();
}

export function addDays(dateKey: string, days: number): string {
  const ms = startOfSASTDay(dateKey) + days * 86_400_000;
  return dateKeySAST(ms);
}

/** True if the user logged in already today (per their streak marker). */
export function isLoggedInToday(user: UserRow): boolean {
  return user.lastStreakDate === dateKeySAST();
}

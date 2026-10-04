import type { UserRole } from "@edurank/shared";

/**
 * Where a signed-in user should land. Staff (owner/admin/principal) go straight
 * to their control panels; everyone else continues to `next` (or the board).
 */
export function roleHome(role: UserRole | null | undefined, next?: string | null): string {
  switch (role) {
    case "owner":
      return "/owner";
    case "admin":
      return "/admin";
    case "principal":
      return "/school";
    default:
      return next && next.startsWith("/") && !next.startsWith("//") ? next : "/leaderboard";
  }
}

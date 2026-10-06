import { Hono } from "hono";
import { requireOwner } from "../lib/auth";
import { pruneStalePresence } from "./presence";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

// A visitor counts as "online" if their tab sent a heartbeat in this window.
// Heartbeats are every 30s, so 90s tolerates one missed beat (background tab,
// flaky connection) without dropping someone who is genuinely still around.
const ONLINE_WINDOW_MS = 90_000;

app.use("*", async (c, next) => {
  await requireOwner(c);
  await next();
});

// GET /owner/overview — the control room snapshot
app.get("/overview", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE role='user')      AS students,
       (SELECT COUNT(*) FROM users WHERE role='teacher')   AS teachers,
       (SELECT COUNT(*) FROM users WHERE role='principal') AS principals,
       (SELECT COUNT(*) FROM users WHERE role='admin')     AS admins,
       (SELECT COUNT(*) FROM users WHERE role='owner')     AS owners,
       (SELECT COUNT(*) FROM notes)                        AS notes_total,
       (SELECT COUNT(*) FROM notes WHERE status='pending') AS notes_pending,
       (SELECT COUNT(*) FROM notes WHERE status='approved')AS notes_approved,
       (SELECT COUNT(*) FROM notes WHERE status='rejected')AS notes_rejected,
       (SELECT COUNT(*) FROM notes WHERE is_official=1)    AS notes_official,
       (SELECT IFNULL(SUM(CASE WHEN delta>0 THEN delta ELSE 0 END),0) FROM points_ledger) AS points_issued,
       (SELECT IFNULL(SUM(CASE WHEN delta<0 THEN -delta ELSE 0 END),0) FROM points_ledger) AS points_spent,
       (SELECT IFNULL(SUM(balance),0) FROM users)          AS points_outstanding,
       (SELECT COUNT(*) FROM note_unlocks)                 AS unlocks,
       (SELECT COUNT(*) FROM note_reports WHERE status='open') AS reports_open,
       (SELECT COUNT(*) FROM staff_invites WHERE role='principal') AS principal_invites`,
  ).all<Record<string, number>>();
  const s = res.results?.[0] ?? {};
  const n = (k: string) => Number(s[k] ?? 0);

  const recentUsers = await c.env.DB.prepare(
    `SELECT id, display_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 6`,
  ).all<{ id: string; display_name: string; role: string; created_at: number }>();

  const recentNotes = await c.env.DB.prepare(
    `SELECT id, title, status, is_official, created_at FROM notes ORDER BY created_at DESC LIMIT 6`,
  ).all<{ id: string; title: string; status: string; is_official: number; created_at: number }>();

  return c.json({
    stats: {
      students: n("students"),
      teachers: n("teachers"),
      principals: n("principals"),
      admins: n("admins"),
      owners: n("owners"),
      notesTotal: n("notes_total"),
      notesPending: n("notes_pending"),
      notesApproved: n("notes_approved"),
      notesRejected: n("notes_rejected"),
      notesOfficial: n("notes_official"),
      pointsIssued: n("points_issued"),
      pointsSpent: n("points_spent"),
      pointsOutstanding: n("points_outstanding"),
      unlocks: n("unlocks"),
      reportsOpen: n("reports_open"),
      principalInvites: n("principal_invites"),
    },
    recentUsers: (recentUsers.results ?? []).map((u) => ({
      id: u.id,
      displayName: u.display_name,
      role: u.role,
      createdAt: new Date(Number(u.created_at)).toISOString(),
    })),
    recentNotes: (recentNotes.results ?? []).map((x) => ({
      id: x.id,
      title: x.title,
      status: x.status,
      official: x.is_official === 1,
      createdAt: new Date(Number(x.created_at)).toISOString(),
    })),
  });
});

// GET /owner/live — "who is on the site right now" for the control-room tile.
// Cheap by design: two indexed aggregate queries over the trailing window.
app.get("/live", async (c) => {
  const now = Date.now();
  const cutoff = now - ONLINE_WINDOW_MS;

  const totals = await c.env.DB.prepare(
    `SELECT
       COUNT(*) AS active,
       SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) AS signed_in
     FROM presence
     WHERE last_seen > ?`,
  )
    .bind(cutoff)
    .all<{ active: number; signed_in: number }>();
  const t = totals.results?.[0];
  const active = Number(t?.active ?? 0);
  const signedIn = Number(t?.signed_in ?? 0);

  const paths = await c.env.DB.prepare(
    `SELECT path, COUNT(*) AS n
     FROM presence
     WHERE last_seen > ? AND path IS NOT NULL AND path != ''
     GROUP BY path
     ORDER BY n DESC
     LIMIT 6`,
  )
    .bind(cutoff)
    .all<{ path: string; n: number }>();

  // Opportunistic cleanup: owner polling is low-volume, so it's a free sweep.
  await pruneStalePresence(c.env.DB);

  return c.json({
    active,
    signedIn,
    guests: Math.max(0, active - signedIn),
    windowSeconds: ONLINE_WINDOW_MS / 1000,
    topPaths: (paths.results ?? []).map((p) => ({ path: p.path, count: Number(p.n) })),
    updatedAt: new Date(now).toISOString(),
  });
});

export default app;

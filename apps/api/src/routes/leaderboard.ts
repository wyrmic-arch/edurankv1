import { Hono } from "hono";
import type { LeaderboardRowDTO } from "@edurank/shared";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

interface RawRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  school_name: string | null;
  grade: number | null;
  points: number;
}

// GET /leaderboard?scope=global|subject|school&subjectId=&range=weekly|all-time
app.get("/", async (c) => {
  const scope = c.req.query("scope") ?? "global";
  const range = c.req.query("range") === "weekly" ? "weekly" : "all";
  const subjectId = c.req.query("subjectId");
  const schoolId = c.req.query("schoolId");

  let rows: RawRow[] = [];

  if (scope === "subject" && subjectId) {
    // Subject boards always rank on ledger deltas (positive only), scoped to the subject.
    const cutoffSql = range === "weekly" ? "AND l.created_at >= (strftime('%s','now') * 1000 - 7*86400000)" : "";
    const res = await c.env.DB.prepare(
      `SELECT u.id AS user_id, u.display_name, u.avatar_url, sc.name AS school_name, u.grade,
              SUM(l.delta) AS points
       FROM points_ledger l
       JOIN users u ON u.id = l.user_id
       LEFT JOIN schools sc ON sc.id = u.school_id
       WHERE l.delta > 0 AND l.subject_id = ?1 ${cutoffSql}
       GROUP BY l.user_id
       ORDER BY points DESC
       LIMIT 100`,
    )
      .bind(subjectId)
      .all<RawRow>();
    rows = res.results ?? [];
  } else if (scope === "school" && schoolId) {
    const cutoffSql = range === "weekly" ? "WHERE l.created_at >= (strftime('%s','now') * 1000 - 7*86400000)" : "";
    const sumExpr =
      range === "weekly"
        ? "IFNULL(SUM(l.delta),0)"
        : "u.total_earned"; // all-time school board ranks on career earnings
    const joinLedger = range === "weekly" ? "LEFT JOIN points_ledger l ON l.user_id = u.id AND l.delta > 0" : "";
    const res = await c.env.DB.prepare(
      `SELECT u.id AS user_id, u.display_name, u.avatar_url, sc.name AS school_name, u.grade,
              ${sumExpr} AS points
       FROM users u
       LEFT JOIN schools sc ON sc.id = u.school_id
       ${joinLedger}
       ${cutoffSql ? cutoffSql.replace("WHERE", "AND") : ""}
       WHERE u.school_id = ?1
       GROUP BY u.id
       ORDER BY points DESC
       LIMIT 100`,
    )
      .bind(schoolId)
      .all<RawRow>();
    rows = res.results ?? [];
  } else {
    if (range === "weekly") {
      const res = await c.env.DB.prepare(
        `SELECT u.id AS user_id, u.display_name, u.avatar_url, sc.name AS school_name, u.grade,
                SUM(l.delta) AS points
         FROM points_ledger l
         JOIN users u ON u.id = l.user_id
         LEFT JOIN schools sc ON sc.id = u.school_id
         WHERE l.delta > 0 AND l.created_at >= (strftime('%s','now') * 1000 - 7*86400000)
         GROUP BY l.user_id
         ORDER BY points DESC
         LIMIT 100`,
      ).all<RawRow>();
      rows = res.results ?? [];
    } else {
      const res = await c.env.DB.prepare(
        `SELECT u.id AS user_id, u.display_name, u.avatar_url, sc.name AS school_name, u.grade,
                u.total_earned AS points
         FROM users u
         LEFT JOIN schools sc ON sc.id = u.school_id
         ORDER BY points DESC
         LIMIT 100`,
      ).all<RawRow>();
      rows = res.results ?? [];
    }
  }

  const items: LeaderboardRowDTO[] = rows.map((r, i) => ({
    userId: r.user_id,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    schoolName: r.school_name,
    grade: r.grade,
    points: Number(r.points),
    rank: i + 1,
  }));

  return c.json({ items, scope, range });
});

export default app;

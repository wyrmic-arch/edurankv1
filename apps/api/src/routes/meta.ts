import { Hono } from "hono";
import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { schools, users } from "../db/schema";
import { err } from "../lib/http";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

// GET /subjects — districts with approved-note counts
app.get("/subjects", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT s.id, s.name, s.blurb, s.color, s.icon,
            (SELECT COUNT(*) FROM notes n WHERE n.subject_id = s.id AND n.status = 'approved') AS note_count
     FROM subjects s ORDER BY s.sort_order ASC`,
  ).all<{ id: string; name: string; blurb: string; color: string; icon: string; note_count: number }>();
  return c.json({
    items: (res.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      blurb: r.blurb,
      color: r.color,
      icon: r.icon,
      noteCount: Number(r.note_count),
    })),
  });
});

app.get("/schools", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT sc.id, sc.name, sc.province, sc.city, sc.lat, sc.lng,
            (SELECT COUNT(*) FROM users u WHERE u.school_id = sc.id) AS player_count
     FROM schools sc ORDER BY sc.name ASC`,
  ).all<{ id: string; name: string; province: string; city: string | null; lat: number | null; lng: number | null; player_count: number }>();
  return c.json({
    items: (res.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      province: r.province,
      city: r.city,
      lat: r.lat,
      lng: r.lng,
      playerCount: Number(r.player_count),
    })),
  });
});

// GET /schools/:id — a school's profile: stats + top players.
app.get("/schools/:id", async (c) => {
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const school = (await db.select().from(schools).where(eq(schools.id, id)).limit(1))[0];
  if (!school) err(404, "No such school on the board.");

  const [stats] = await db
    .select({
      playerCount: sql<number>`(SELECT COUNT(*) FROM users WHERE school_id = ${id})`,
      notesUploaded: sql<number>`(SELECT COUNT(*) FROM notes n JOIN users u ON u.id = n.uploader_id WHERE u.school_id = ${id} AND n.status = 'approved')`,
      totalPoints: sql<number>`(SELECT IFNULL(SUM(total_earned),0) FROM users WHERE school_id = ${id})`,
    })
    .from(sql`(SELECT 1)`);

  const top = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      grade: users.grade,
      points: users.totalEarned,
    })
    .from(users)
    .where(eq(users.schoolId, id))
    .orderBy(desc(users.totalEarned))
    .limit(5);

  const playerCount = Number(stats?.playerCount ?? 0);
  return c.json({
    school: {
      id: school.id,
      name: school.name,
      province: school.province,
      city: school.city,
      lat: school.lat,
      lng: school.lng,
      playerCount,
    },
    stats: {
      playerCount,
      notesUploaded: Number(stats?.notesUploaded ?? 0),
      totalPoints: Number(stats?.totalPoints ?? 0),
    },
    topPlayers: top.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      grade: p.grade,
      points: Number(p.points),
    })),
  });
});

export default app;

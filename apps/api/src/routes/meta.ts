import { Hono } from "hono";
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
    `SELECT sc.id, sc.name, sc.province,
            (SELECT COUNT(*) FROM users u WHERE u.school_id = sc.id) AS player_count
     FROM schools sc ORDER BY sc.name ASC`,
  ).all<{ id: string; name: string; province: string; player_count: number }>();
  return c.json({
    items: (res.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      province: r.province,
      playerCount: Number(r.player_count),
    })),
  });
});

export default app;

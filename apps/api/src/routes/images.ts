import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { subjects } from "../db/schema";
import { bannerImage, subjectImage } from "../lib/images";
import type { AppEnv, SubjectRow } from "../types";

const app = new Hono<AppEnv>();

// GET /img/subject/:id — district art, R2-cached, Unsplash-backed
app.get("/subject/:id", async (c) => {
  const id = c.req.param("id");
  const row = (await drizzle(c.env.DB).select().from(subjects).where(eq(subjects.id, id)).limit(1))[0] as
    | SubjectRow
    | undefined;
  if (!row) return c.text("Unknown district", 404);
  return subjectImage(c.env, row.id, row.name, row.color, row.unsplashQuery);
});

// GET /img/banner/:seed — profile banner defaults
app.get("/banner/:seed", async (c) => {
  const seed = c.req.param("seed").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "default";
  return bannerImage(c.env, seed);
});

export default app;

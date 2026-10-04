import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { subjects, users, schools } from "../db/schema";
import { bannerImage, subjectImage, schoolImage } from "../lib/images";
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
  // Only render banners for real users (or the "default" seed). Without this a
  // caller can mint unbounded R2 cache objects / Unsplash calls from random seeds.
  if (seed !== "default") {
    const row = await drizzle(c.env.DB).select({ id: users.id }).from(users).where(eq(users.id, seed)).limit(1);
    if (row.length === 0) return c.text("Unknown banner", 404);
  }
  return bannerImage(c.env, seed);
});

// GET /img/school/:id?v= — school cover art (representative campus imagery)
app.get("/school/:id", async (c) => {
  const id = c.req.param("id");
  const variant = (c.req.query("v") ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const row = (await drizzle(c.env.DB).select().from(schools).where(eq(schools.id, id)).limit(1))[0];
  if (!row) return c.text("Unknown school", 404);
  return schoolImage(c.env, row.id, row.name, row.city, variant);
});

export default app;

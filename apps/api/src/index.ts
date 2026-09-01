import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiError, AppEnv } from "./types";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import noteRoutes from "./routes/notes";
import leaderboardRoutes from "./routes/leaderboard";
import shopRoutes from "./routes/shop";
import challengeRoutes from "./routes/challenges";
import adminRoutes from "./routes/admin";
import imageRoutes from "./routes/images";
import metaRoutes from "./routes/meta";
import { rateLimit } from "./lib/ratelimit";

const app = new Hono<AppEnv>();

const allowedOrigins = (c: { env: AppEnv["Bindings"] }): string | string[] => {
  const raw = c.env.ALLOWED_ORIGINS ?? "*";
  if (raw.trim() === "*") return "*";
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
};

// CORS — applied to every request, including OPTIONS preflights.
app.use("*", async (c, next) => {
  const origin = allowedOrigins(c);
  return cors({
    origin,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })(c, next);
});

// Explicit preflight handler — Hono's cors() short-circuits OPTIONS in
// most cases, but defining an explicit 204 here makes browsers happy
// even if a downstream middleware short-circuits before cors() can.
app.options("*", (c) => {
  const origin = allowedOrigins(c);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin === "*" ? "*" : (c.req.header("Origin") ?? "*"),
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  if (origin !== "*") headers["Vary"] = "Origin";
  return new Response(null, { status: 204, headers });
});

app.onError((err, c) => {
  const apiErr = err as ApiError;
  if (typeof apiErr.status === "number" && apiErr.message) {
    return c.json({ error: apiErr.message }, apiErr.status as 400);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Something broke on our side. Try again." }, 500);
});

app.get("/healthz", (c) => c.json({ ok: true, service: "edurank-api", time: Date.now() }));

app.route("/auth", authRoutes);
app.route("/", userRoutes); // /users/:id, /me/*
app.route("/notes", noteRoutes);
app.route("/leaderboard", leaderboardRoutes);
app.route("/shop", shopRoutes);
app.route("/challenges", challengeRoutes);
app.route("/admin", adminRoutes);
app.route("/img", imageRoutes);
app.route("/", metaRoutes); // /subjects, /schools

// Mutating endpoints get per-IP throttling. Auth is the harshest because
// password-guessing is the highest-value abuse vector.
app.use("/auth/register", rateLimit({ max: 3, windowMs: 60_000 }));
app.use("/auth/login", rateLimit({ max: 5, windowMs: 60_000 }));
app.use("/notes/*/unlock", rateLimit({ max: 10, windowMs: 60_000 }));
app.use("/notes/*/upvote", rateLimit({ max: 30, windowMs: 60_000 }));
app.use("/shop/*/purchase", rateLimit({ max: 5, windowMs: 60_000 }));

// Public R2 read passthrough for avatars/covers/img keys (files stay gated
// behind /notes/:id/file).
app.get("/r2/*", async (c) => {
  const key = decodeURIComponent(new URL(c.req.url).pathname.replace(/^\/r2\//, ""));
  if (!/^(avatars|covers|img)\//.test(key)) return c.json({ error: "Not found" }, 404);
  const obj = await c.env.NOTES_BUCKET.get(key);
  if (!obj) return c.json({ error: "Not found" }, 404);
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=604800",
    },
  });
});
app.notFound((c) => c.json({ error: "Unknown route" }, 404));

export default app;

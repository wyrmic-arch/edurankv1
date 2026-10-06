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
import schoolRoutes from "./routes/school";
import notificationRoutes from "./routes/notifications";
import suggestionRoutes from "./routes/suggestions";
import officialRoutes from "./routes/official";
import studyRoutes from "./routes/study";
import ownerRoutes from "./routes/owner";
import imageRoutes from "./routes/images";
import metaRoutes from "./routes/meta";
import presenceRoutes, { pruneStalePresence } from "./routes/presence";
import { rateLimit } from "./lib/ratelimit";
import { runDigest } from "./lib/digest";
import { sendAlert } from "./lib/email";

const app = new Hono<AppEnv>();

// De-dupe operational alert emails so a repeating error can't flood the inbox.
const alertThrottle = new Map<string, number>();

const allowedOrigins = (c: { env: AppEnv["Bindings"] }): string | string[] => {
  const raw = c.env.ALLOWED_ORIGINS ?? "*";
  if (raw.trim() === "*") return "*";
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
};

// True if `origin` is explicitly listed or matches a `*.suffix` wildcard entry
// (e.g. `https://*.pages.dev` matches https://<anything>.pages.dev). Handles
// origins with or without a scheme, and wildcards that appear after a prefix.
function originAllowed(configured: string | string[], origin: string | null | undefined): boolean {
  if (configured === "*") return true;
  if (!origin || typeof configured === "string") return false;
  if (configured.includes(origin)) return true;
  const originHost = origin.replace(/^https?:\/\//, "");
  for (const entry of configured) {
    if (!entry.includes("*")) continue;
    const entryHost = entry.replace(/^https?:\/\//, "");
    const [prefix, suffix] = entryHost.split("*");
    const startMatch = !prefix || originHost.startsWith(prefix);
    const endMatch = !suffix || originHost.endsWith(suffix);
    if (startMatch && endMatch) return true;
  }
  return false;
}

// Security headers — set on every response, including error responses.
app.use("*", async (c, next) => {
  try {
    await next();
  } finally {
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    c.header("X-Robots-Tag", "noindex");
    c.header(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
});

// CORS — applied to every request, including OPTIONS preflights.
app.use("*", async (c, next) => {
  const configured = allowedOrigins(c);
  return cors({
    origin: (origin) => (originAllowed(configured, origin) ? origin : null),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })(c, next);
});

// Explicit preflight handler — Hono's cors() short-circuits OPTIONS in
// most cases, but defining an explicit 204 here makes browsers happy
// even if a downstream middleware short-circuits before cors() can.
app.options("*", (c) => {
  const configured = allowedOrigins(c);
  const requestOrigin = c.req.header("Origin");
  if (!originAllowed(configured, requestOrigin)) return new Response(null, { status: 204 });
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": configured === "*" ? "*" : (requestOrigin ?? "*"),
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  if (configured !== "*") headers["Vary"] = "Origin";
  return new Response(null, { status: 204, headers });
});

app.onError((err, c) => {
  const apiErr = err as ApiError;
  if (typeof apiErr.status === "number" && apiErr.message) {
    return c.json({ error: apiErr.message }, apiErr.status as 400);
  }
  console.error("Unhandled error:", err);

  // Email the operator (throttled) so problems don't go unnoticed.
  try {
    const path = new URL(c.req.url).pathname;
    const key = `${c.req.method} ${path}: ${String((err as Error)?.message ?? err)}`.slice(0, 160);
    const now = Date.now();
    if (c.env.ALERT_EMAIL && now - (alertThrottle.get(key) ?? 0) > 5 * 60_000) {
      alertThrottle.set(key, now);
      if (alertThrottle.size > 200) alertThrottle.clear();
      const details = `${c.req.method} ${path}\n\n${(err as Error)?.stack ?? String(err)}`;
      c.executionCtx.waitUntil(sendAlert(c.env, `Error: ${c.req.method} ${path}`, details));
    }
  } catch {
    /* never let alerting break the error response */
  }

  return c.json({ error: "Something broke on our side. Try again." }, 500);
});

app.get("/healthz", (c) => c.json({ ok: true, service: "edurank-api", time: Date.now() }));

// Mutating endpoints get per-IP throttling. Auth is the harshest because
// password-guessing is the highest-value abuse vector.
//
// IMPORTANT: Hono applies middleware only to handlers registered AFTER it, so
// these MUST stay above the app.route(...) mounts below. Registering them after
// the routes silently disables every limiter (verified against Hono 4).
app.use("/auth/register", rateLimit({ max: 3, windowMs: 60_000 }));
app.use("/auth/login", rateLimit({ max: 5, windowMs: 60_000 }));
app.use("/auth/forgot-password", rateLimit({ max: 3, windowMs: 60_000 }));
app.use("/auth/reset-password", rateLimit({ max: 3, windowMs: 60_000 }));
app.use("/auth/resend-verification", rateLimit({ max: 3, windowMs: 60_000 }));
app.use("/notes/*/unlock", rateLimit({ max: 10, windowMs: 60_000 }));
app.use("/notes/*/upvote", rateLimit({ max: 30, windowMs: 60_000 }));
app.use("/shop/*/purchase", rateLimit({ max: 5, windowMs: 60_000 }));
// Heartbeats are cheap but frequent; allow plenty of headroom for schools
// behind a single NAT IP (~2/min per tab).
app.use("/presence", rateLimit({ max: 600, windowMs: 60_000 }));

app.route("/auth", authRoutes);
app.route("/", userRoutes); // /users/:id, /me/*
app.route("/notes", noteRoutes);
app.route("/leaderboard", leaderboardRoutes);
app.route("/shop", shopRoutes);
app.route("/challenges", challengeRoutes);
app.route("/admin", adminRoutes);
app.route("/school", schoolRoutes);
app.route("/notifications", notificationRoutes);
app.route("/suggestions", suggestionRoutes);
app.route("/official", officialRoutes);
app.route("/study", studyRoutes);
app.route("/owner", ownerRoutes);
app.route("/img", imageRoutes);
app.route("/", metaRoutes); // /subjects, /schools
app.route("/presence", presenceRoutes);

// Public R2 read passthrough for avatars/covers/img keys (files stay gated
// behind /notes/:id/file).
app.get("/r2/*", async (c) => {
  let key: string;
  try {
    key = decodeURIComponent(new URL(c.req.url).pathname.replace(/^\/r2\//, ""));
  } catch {
    // Malformed percent-encoding (e.g. /r2/%) must not surface as a 500.
    return c.json({ error: "Not found" }, 404);
  }
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

// Worker entry: HTTP fetch + daily notification digest via Cron Trigger.
export default {
  fetch: (request: Request, env: AppEnv["Bindings"], ctx: ExecutionContext) => app.fetch(request, env, ctx),
  scheduled: (_event: ScheduledEvent, env: AppEnv["Bindings"], ctx: ExecutionContext) => {
    ctx.waitUntil(runDigest(env));
    ctx.waitUntil(pruneStalePresence(env.DB));
  },
};

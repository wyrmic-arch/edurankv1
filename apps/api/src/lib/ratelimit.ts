// Per-instance IP rate limiting using a sliding window. Per-worker only —
// resets on Worker restart and doesn't share state across instances —
// good enough for v1; swap for Durable Object or KV later.
//
// Reads the IP from `cf-connecting-ip` (Cloudflare sets this on every
// request) and falls back to a local-guard no-op if the header is absent.

import type { Context } from "hono";
import type { AppEnv } from "../types";

const buckets = new Map<string, number[]>();

function clientIp(c: Context<AppEnv>): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function prune(bucket: number[], windowMs: number, now: number): number[] {
  const cutoff = now - windowMs;
  while (bucket.length > 0 && bucket[0]! < cutoff) bucket.shift();
  return bucket;
}

interface RateLimitOptions {
  /** Maximum number of requests allowed within `windowMs`. */
  max: number;
  /** Sliding window size in milliseconds. */
  windowMs: number;
}

/**
 * Build a Hono middleware that allows up to `max` requests per IP per
 * `windowMs` window. Returns 429 with `Retry-After` (in seconds) on
 * exceed.
 */
export function rateLimit(opts: RateLimitOptions) {
  return async (c: Context<AppEnv>, next: () => Promise<unknown>) => {
    // CORS preflights are cheap and not abuse vectors — never count them.
    if (c.req.method === "OPTIONS") return next();
    const ip = clientIp(c);
    const now = Date.now();
    const bucket = buckets.get(ip) ?? [];
    prune(bucket, opts.windowMs, now);
    if (bucket.length >= opts.max) {
      const oldest = bucket[0]!;
      const retryAfter = Math.max(1, Math.ceil((opts.windowMs - (now - oldest)) / 1000));
      c.header("Retry-After", String(retryAfter));
      return c.json({ error: "Too many requests — slow down." }, 429);
    }
    bucket.push(now);
    buckets.set(ip, bucket);
    return next();
  };
}
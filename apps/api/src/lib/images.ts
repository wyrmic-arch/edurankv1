import type { Bindings } from "../types";

const UNSPLASH_API = "https://api.unsplash.com";
const IMG_CACHE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days — content is immutable per key

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (ch) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[ch] ?? ch,
  );
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Designed on-brand fallback used whenever Unsplash isn't configured or fails.
 * Flat, dark, HUD-styled SVG — no gradients, matches the app aesthetic.
 */
export function placeholderArt(opts: {
  label: string;
  code: string;
  color: string;
  seed: string;
}): string {
  const { label, code, color, seed } = opts;
  const gridId = `g${hash(seed) % 100000}`;
  const rot = hash(seed) % 14 - 7;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <pattern id="${gridId}" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="#1B2330" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="675" fill="#0A0E14"/>
  <rect width="1200" height="675" fill="url(#${gridId})"/>
  <rect x="40" y="40" width="1120" height="595" fill="none" stroke="${color}" stroke-opacity="0.55" stroke-width="2"/>
  <rect x="56" y="56" width="24" height="24" fill="${color}"/>
  <rect x="1120" y="595" width="24" height="24" fill="${color}"/>
  <g transform="rotate(${rot} 600 338)" opacity="0.92">
    <text x="600" y="380" text-anchor="middle" font-family="'Arial Narrow','Helvetica Neue',Arial,sans-serif" font-weight="900" font-size="220" letter-spacing="10" fill="none" stroke="${color}" stroke-width="2.5">${escapeXml(code)}</text>
    <text x="600" y="470" text-anchor="middle" font-family="'Arial Narrow',Arial,sans-serif" font-weight="700" font-size="42" letter-spacing="18" fill="#EAF0F6">${escapeXml(label.toUpperCase())}</text>
  </g>
  <text x="64" y="618" font-family="'Courier New',monospace" font-size="20" letter-spacing="4" fill="#5B6779">EDURANK // DISTRICT GRID</text>
</svg>`;
}

async function r2Get(env: Bindings, key: string): Promise<Response | null> {
  const obj = await env.NOTES_BUCKET.get(key);
  if (!obj) return null;
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": `public, max-age=${IMG_CACHE_MAX_AGE}, immutable`,
    },
  });
}

async function fetchUnsplashPhoto(
  env: Bindings,
  query: string,
  pickSeed: string,
): Promise<{ bytes: ArrayBuffer; contentType: string; photographer: string } | null> {
  if (!env.UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=6&content_filter=high`,
      { headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ urls?: { regular?: string }; user?: { name?: string } }>;
    };
    const results = data.results ?? [];
    if (results.length === 0) return null;
    const photo = results[hash(pickSeed) % results.length]!;
    const url = photo.urls?.regular;
    if (!url) return null;
    const imgRes = await fetch(url);
    if (!imgRes.ok) return null;
    return {
      bytes: await imgRes.arrayBuffer(),
      contentType: imgRes.headers.get("Content-Type") ?? "image/jpeg",
      photographer: photo.user?.name ?? "Unsplash contributor",
    };
  } catch {
    return null; // graceful fallback to designed placeholder
  }
}

/**
 * Subject district art. Cached in R2 under img/subject/{subjectId}. Falls back
 * to a generated placeholder that matches the design language when no API key.
 */
export async function subjectImage(
  env: Bindings,
  subjectId: string,
  subjectName: string,
  color: string,
  unsplashQuery: string,
): Promise<Response> {
  const key = `img/subject/${subjectId}`;
  const cached = await r2Get(env, key);
  if (cached) return cached;

  const photo = await fetchUnsplashPhoto(env, unsplashQuery || subjectName, subjectId);
  if (photo) {
    await env.NOTES_BUCKET.put(key, photo.bytes, {
      httpMetadata: { contentType: photo.contentType },
      customMetadata: { attribution: `Photo by ${photo.photographer} on Unsplash`, kind: "subject-art" },
    });
    return new Response(photo.bytes, {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": `public, max-age=${IMG_CACHE_MAX_AGE}, immutable`,
        "X-Image-Attribution": `Photo by ${photo.photographer} on Unsplash`,
      },
    });
  }
  const code = subjectName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 4);
  return new Response(placeholderArt({ label: subjectName, code, color, seed: subjectId }), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${IMG_CACHE_MAX_AGE}, immutable`,
    },
  });
}

/** Profile banner defaults keyed by a stable seed (user id or explicit seed). */
export async function bannerImage(env: Bindings, seed: string): Promise<Response> {
  const key = `img/banner/${seed}`;
  const cached = await r2Get(env, key);
  if (cached) return cached;

  const queries = ["night city aerial", "study desk lamp", "stadium lights", "library archive", "mountain ridge dusk"];
  const q = queries[hash(seed) % queries.length]!;
  const photo = await fetchUnsplashPhoto(env, q, `banner-${seed}`);
  if (photo) {
    await env.NOTES_BUCKET.put(key, photo.bytes, {
      httpMetadata: { contentType: photo.contentType },
      customMetadata: { attribution: `Photo by ${photo.photographer} on Unsplash`, kind: "banner" },
    });
    return new Response(photo.bytes, {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": `public, max-age=${IMG_CACHE_MAX_AGE}, immutable`,
        "X-Image-Attribution": `Photo by ${photo.photographer} on Unsplash`,
      },
    });
  }
  const palette = ["#A6FF3F", "#43D9FF", "#FFC24B", "#FF6B9D"];
  const color = palette[hash(seed) % palette.length]!;
  return new Response(placeholderArt({ label: "EDURANK", code: String(hash(seed) % 90 + 10), color, seed }), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${IMG_CACHE_MAX_AGE}, immutable`,
    },
  });
}

# EDURANK

**South Africa's study notes arena.** Students upload CAPS-aligned study notes, earn **PTS** for
contributing, spend PTS to unlock premium packs, and climb leaderboards from their district to the
national board — all wrapped in a map where every district is a subject.

I built this when I was still in school, after watching classmates buy and sell notes on WhatsApp
and at break time. This is the one place to do it.

> Points-only economy. Real-money payouts are a teased feature, not a currency — every balance on
> screen is labelled PTS and traces back to a real ledger row in D1.

---

## Stack

| Layer      | Tech                                                        |
| ---------- | ----------------------------------------------------------- |
| Frontend   | Next.js 14 (App Router) · TypeScript strict · Tailwind CSS  |
| API        | Cloudflare Worker · Hono                                    |
| Database   | Cloudflare D1 (SQLite) via Drizzle ORM                      |
| Storage    | Cloudflare R2 (note files, avatars, covers, cached imagery) |
| Auth       | Email + password (PBKDF2), opaque sessions in D1            |
| Imagery    | Unsplash API → R2 cache, with designed SVG fallback         |

Monorepo layout (npm workspaces):

```
apps/web          Next.js frontend
apps/api          Hono worker (all business logic lives here)
packages/shared   Shared types + economy constants (single source of truth)
```

---

## Quick start (local)

Prereqs: Node 20+, npm. No Cloudflare account needed for local dev — D1 and R2 run locally
through wrangler/Miniflare.

```bash
# 1. install
npm install

# 2. local env for the API worker
cp apps/api/.dev.vars.example apps/api/.dev.vars
# (add an UNSPLASH_ACCESS_KEY if you have one; everything works without it)

# 3. create schema + reference data (subjects, schools, badges, shop items)
npm run migrate -w apps/api
npx wrangler d1 execute edurank-app-db --local --file scripts/reference-seed.sql -w apps/api
# ^ run from repo root if the -w shorthand complains:
#   cd apps/api && npx wrangler d1 execute edurank-app-db --local --file scripts/reference-seed.sql

# 4. start the API (terminal A)
npm run dev:api        # http://127.0.0.1:8787

# 5. seed believable content (players, notes w/ real PDFs in R2, unlocks, upvotes)
cd apps/api && npm run seed

# 6. start the web app (terminal B)
npm run dev:web        # http://localhost:3000
```

Seeded demo accounts:

| Role   | Email                   | Password       |
| ------ | ----------------------- | -------------- |
| Admin  | `admin@edurank.co.za`   | `Admin#2026`   |
| Player | `player1@edurank.co.za` | `Password#2026`|

(All 28 seeded players use `Password#2026`.)

### Environment variables

Root `.env.example` documents everything; per-app copies live next to the code:

- `apps/api/.dev.vars` — `UNSPLASH_ACCESS_KEY`, `DEV_SEED_SECRET`, `ALLOWED_ORIGINS`
- `apps/web/.env.local` — `NEXT_PUBLIC_API_URL` (defaults to `http://127.0.0.1:8787`)

Without `UNSPLASH_ACCESS_KEY` the image pipeline serves designed SVG placeholder art that matches
the aesthetic — nothing breaks and no broken-image icons appear.

---

## Deploying to Cloudflare

### 1. Create resources

```bash
cd apps/api
npx wrangler login

# D1 database — put the real id into wrangler.toml
npx wrangler d1 create edurank-app-db

# R2 bucket
npx wrangler r2 bucket create edurank-notes
```

Update `apps/api/wrangler.toml`: set `database_id` from the create output.

### 2. Migrate + deploy the API

```bash
cd apps/api
npm run migrate:remote                                  # applies migrations to prod D1
npx wrangler d1 execute edurank-app-db --remote --file scripts/reference-seed.sql
npx wrangler secret put UNSPLASH_ACCESS_KEY             # optional but recommended
npx wrangler secret put DEV_SEED_SECRET                 # only needed if seeding remote
npm run deploy                                          # → https://edurank-api.<subdomain>.workers.dev
```

Set your frontend origin in the `ALLOWED_ORIGINS` var in `wrangler.toml`.

### 3. Deploy the web app (Cloudflare Pages)

The frontend talks to the API directly from the browser, so any static-ish Next host works.
With Cloudflare Pages + `@cloudflare/next-on-pages`:

```bash
cd apps/web
npm i -D @cloudflare/next-on-pages
npm run copy-gs                         # copies the Ghostscript WASM runtime into public/gs/
npx @cloudflare/next-on-pages           # produces .vercel/output/static
npx wrangler pages deploy .vercel/output/static --project-name edurank
```

> `npm install` and `npm run build` already run `copy-gs` automatically (via
> `postinstall`/`prebuild`); run it manually if you build with a tool that
> bypasses those hooks. `public/gs/gs.{js,wasm}` are gitignored, so `public/gs/`
> must contain the runtime before deploying or client-side PDF compression will
> silently fall back to uploading the original file.

In the Pages dashboard, set env var `NEXT_PUBLIC_API_URL=https://edurank-api.<subdomain>.workers.dev`.
(The pages are client-rendered against the API, so no Node runtime features are required.)

Optionally seed the remote DB the same way as local: run `SEED_URL=https://…workers.dev npm run seed`
from `apps/api` (requires `DEV_SEED_SECRET`-less flow used by the script — it seeds through the
public API like a normal client).

---

## PDF compression (storage)

Two layers keep PDFs small:

1. **Uploads — in the browser.** On the upload page, PDFs over 1MB are re-encoded
   client-side before they reach the API, using Ghostscript compiled to
   WebAssembly (`@okathira/ghostpdl-wasm`) inside a Web Worker. Ghostscript
   resamples images, subsets fonts and repacks streams — typically 40–85%
   smaller — while keeping text selectable. If the runtime is unavailable or the
   result isn't smaller, the original file is uploaded, so output is never worse.
   The runtime is copied to `apps/web/public/gs/` by `scripts/copy-gs.mjs`
   (`npm run copy-gs`); it is not committed to git.

2. **Official notes — at build time.** `content/tools/md2pdf.py` runs Ghostscript
   (`/ebook`) on each rendered PDF, and `content/tools/compress_pdfs.py`
   back-fills existing ones:

   ```bash
   python3 content/tools/compress_pdfs.py content/official   # recompress in place
   PDF_PRESET=screen python3 content/tools/compress_pdfs.py  # smaller, 72dpi
   ```

   Docs in `content/official/` are ~46% smaller after this pass (verified text
   and stream integrity preserved). Re-run `npm run publish:official` to push the
   recompressed PDFs to R2.

## The points economy (how numbers are earned)

Every rule below is implemented server-side in `apps/api/src/lib/points.ts` and friends, with the
constants defined once in `packages/shared/src/index.ts`:

| Event                                   | PTS                              |
| --------------------------------------- | -------------------------------- |
| Note approved by moderation             | +50                              |
| Someone downloads your note             | +10                              |
| Someone upvotes your note (first time)  | +5                               |
| Daily login streak                      | +5 base, +2/day, capped at +15   |
| Referral (both sides)                   | +100                             |
| Complete profile (grade + school)       | +30                              |
| Clearing a daily challenge              | +25 each                         |
| Unlocking someone's paid note           | −price (uploader keeps **50%**)  |
| Cosmetic purchase                       | −price                           |

All movements land in `points_ledger` with a running `balance_after`, visible on the player's
profile wallet. Leaderboards (global / per-subject / per-school × weekly / all-time) aggregate
real ledger deltas — weekly boards count positive deltas from the last 7 days.

## Verification

```bash
cd apps/api && npm run smoke     # 26-check end-to-end suite against a running dev API
npm run typecheck                # strict TS across all three packages (run at root)
```

District art: fetched from Unsplash and cached into R2 on first request (`GET /img/subject/:id`),
with photographer attribution stored on the R2 object and credited in the UI footer.

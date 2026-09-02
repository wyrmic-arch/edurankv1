# DECISIONS.md

Notable setup and design decisions made while building EduRank against the spec. The brief said
"make reasonable decisions, document them" — this is that document.

## Architecture

- **Monorepo via npm workspaces** (`apps/web`, `apps/api`, `packages/shared`). The shared package
  holds economy constants (point values, tiers, challenge definitions) so the API enforces exactly
  what the UI advertises — there is no second place where "upload = 50 PTS" could drift.
- **All business logic lives in the worker.** The Next.js app is a client-side shell that talks to
  the API over fetch; no screen reads mock data. This keeps a single write path into the points
  ledger and makes the frontend deployable anywhere static-ish.
- **Timestamps are epoch-millisecond integers** across all tables. Day boundaries for streaks,
  daily challenges and weekly leaderboards are computed in SAST (`Africa/Johannesburg`) since the
  product is explicitly South African.

## Auth

- **Email/password with opaque bearer tokens** (32+ chars of CSPRNG entropy), sessions stored as
  SHA-256 hashes in D1, passwords hashed with PBKDF2-SHA256 (100k iterations) via WebCrypto — no
  native deps, works on Workers.
- **Why bearer-in-localStorage instead of cookies:** Pages domains (`*.pages.dev`) and Worker
  domains (`*.workers.dev`) are different registrable sites, so `SameSite=Lax` cookies would never
  ride along on cross-origin XHR, and `SameSite=None` adds CSRF surface without a CSRF layer. A
  bearer token sidesteps cross-site cookie semantics entirely; CORS is locked to an allowlist.
  Trade-off (XSS exposure of the token) is accepted for this build and noted here deliberately.
- Magic-link auth was skipped: it needs an email provider + secrets the project doesn't have.

## Points economy

- **Upload reward lands on approval**, not on upload submission ("pending review" in the spec is
  interpreted as: the note enters the pending state, the +50 pays when a moderator approves).
  Otherwise rejected spam would still have been paid out transiently.
- **Free notes also flow through the unlock endpoint.** The `note_unlocks` row doubles as the
  has-access marker, so "+10 PTS per download" maps 1:1 to real download events and can't be farmed
  by re-downloading (one unlock row per user per note).
- **Upvote rewards are once-per-voter-per-note ever.** The ledger itself is checked before paying;
  toggling an upvote off/on again doesn't re-award.
- **Seller economics on paid unlocks:** buyer pays `price`, uploader receives a 50% cut *plus* the
  flat +10 download bonus. Rounded to nearest whole point.
- **Weekly leaderboard** = sum of positive ledger deltas over a rolling 7 days (not calendar ISO
  weeks — simpler to explain, no boundary weirdness). **All-time** = career earnings
  (`total_earned`), not current balance, so spending doesn't demote you.
- **Streaks**: day 1 pays base 5, each consecutive day adds +2, capped at +15/day. Processed on
  login and on `/auth/me`; idempotent per SAST day.

## Map / frontend

- **The subject map is hand-built SVG topography** (contour-ring districts on a cream field),
  not a static image with hotspots: hover focus rings, a soft central lens, click-to-enter districts,
  instrument-cluster corner annotations, and a minimap component docked bottom-left on app pages (active
  district highlighted). Mobile collapses to a vertical district list with the same visual language.
- **Design system:** Anton (display) / Barlow (UI) / JetBrains Mono (data) — self-hosted TTFs in
  `public/fonts/` (OFL-licensed) rather than `next/font/google`, so builds don't depend on Google's
  CSS API being reachable. Dark-first palette: near-black surfaces, volt-green primary accent,
  gold = premium/points-spent, blood = danger/rejected. No gradients, no emoji-as-icons
  (lucide-react everywhere).
- **Cosmetics:** frames render as glowing avatar rings; map skins recolor roads/accent lines
  (config stored as JSON on the shop item); purchased frames/skins auto-equip. Purchasable badges
  are cosmetic titles distinct from earned achievement badges.

## Imagery

- **Unsplash chosen** over Pexels (search API supports deterministic seeded picking and simple
  client-ID auth). Fetched images are cached into R2 on first request under `img/subject/:id`;
  photographer attribution is stored in object metadata, surfaced via response header, and credited
  in the landing footer. Without an API key, the worker serves a designed SVG placeholder (flat,
  dark, grid + subject initials in subject colour) — matching the aesthetic rather than shipping a
  broken image.

## Seeding

- **Seed through the real HTTP API** (register → login → upload multipart → admin approve → unlock →
  upvote → purchase), then **backdate timestamps with generated SQL** and rebuild every
  `balance_after` with a window function plus user totals from ledger sums. Result: leaderboards,
  streaks and wallets look lived-in, and every number still reconciles exactly (verified: zero
  inconsistent rows after seeding ~1300 ledger entries).
- Note files are small valid PDFs generated on the fly, stored in local R2 like real uploads.
- D1-local quirk discovered: no `UPDATE … FROM (VALUES …)` support — the backdate SQL uses CTE +
  correlated subquery form instead.

## Known limitations (deliberate)

- Moderation gating is role-based only (`users.role = 'admin'`), per spec ("simple gated route").
- Admin promotion is done via SQL (`UPDATE users SET role='admin' …`) — documented in README seed
  output; no admin-management UI by design.

## Post-audit fixes (2026-09)

After the initial build I ran an audit and addressed the highest-impact items in a single
green-light pass:

- **Unlock / shop race conditions.** Both `POST /notes/:id/unlock` and `POST /shop/:id/purchase`
  used a check-then-act sequence that allowed a double-spend under concurrency. Fixed by
  inserting the unique-keyed row first (`note_unlocks` PK; new `uq_purchases_user_item` index
  on `purchases`) and treating the UNIQUE violation as the atomic guard. The point awards now
  run only after the row is durably claimed.
- **Streak / daily-challenge idempotency.** Added a `streak_claims(user_id, date_key)` token
  written before the user/ledger updates. A worker crash between the award and the user row
  update can no longer cause a stuck streak or a missed payout — the next call sees the claim
  and short-circuits. Daily challenges now award first and write the completion row second for
  the same reason.
- **Admin stats overcount.** Changed `WHERE role != 'x'` to `WHERE role IN ('user','admin')` —
  the magic sentinel silently dropped any user with a non-standard role string.
- **CORS.** Added every preview deployment URL to `ALLOWED_ORIGINS` in `wrangler.toml` and
  improved the client-side error message to point at the fix.
- **Rate limiting.** In-process sliding window per `cf-connecting-ip` for auth + mutating
  endpoints. Per-instance only — explicitly acknowledged as v1-grade, replaceable with a
  Durable Object later.
- **Copy.** Bio rewritten to reflect a solo builder who was a student. Filler paragraph under
  the city-map heading removed.

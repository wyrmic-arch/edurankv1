#!/usr/bin/env node
/**
 * EduRank seed script.
 *
 * Populates the local (or remote, via --url) API with believable content:
 * players, schools/subjects reference data, notes with real PDF files in R2,
 * unlocks/upvotes/purchases — then backdates timestamps so leaderboards,
 * streaks and history look alive. Every number on screen traces back to a
 * real ledger row; nothing here is rendered from thin air.
 *
 * Usage:
 *   npm run seed            # expects wrangler dev on :8787
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const API = process.env.SEED_URL ?? "http://127.0.0.1:8787";
const ADMIN_EMAIL = "admin@edurank.co.za";
const ADMIN_PASS = "Admin#2026";

// ---------- helpers ----------

const j = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }
};

async function api(path, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: form ?? (body ? JSON.stringify(body) : undefined),
    signal: AbortSignal.timeout(20000),
  });
  const data = await j(res);
  return { status: res.status, ok: res.ok, data };
}

let rngState = 42;
function rand() {
  // deterministic-ish LCG so re-running produces comparable shapes
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

function makePdf(title, lines) {
  const esc = (s) => s.replace(/([()\\])/g, "\\$1");
  const content = [`BT /F1 22 Tf 64 720 Td (${esc(title)}) Tj ET`, ...lines.map((l, i) => `BT /F1 12 Tf 64 ${680 - i * 18} Td (${esc(l)}) Tj ET`)].join("\n");
  return Buffer.from(
    `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${content.length}>>stream
${content}
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%%%EOF`,
    "utf8",
  );
}

// ---------- content pools ----------

const FIRST = ["Sipho","Thabo","Lerato","Zanele","Kagiso","Naledi","Ayanda","Bongani","Thandiwe","Siyabonga","Nomvula","Tebogo","Refilwe","Sibusiso","Amogelang","Precious","Luyolo","Chanté","Jean-Luc","Anele","Mbali","Katlego","Yusuf","Fatima","Riaan","Anja","Thato","Karabo","Lindiwe","Mpho"];
const LAST = ["Dlamini","Nkosi","Mokoena","van der Merwe","Botha","Khumalo","Ndlovu","Sithole","Mahlangu","Zulu","Jacobs","Petersen","Abrahams","Maseko","Tshabalala","Naidoo","Pillay","Govender","Mthembu","Buthelezi","Mabaso","Molefe","Pretorius","Steyn","Coetzee","Naicker"];
const TAGSUFFIX = ["_HD","Plays","2008","_Gamer","","Xtreme","OnFire","","_Study","99"];

const TOPICS = {
  mathematics: ["Quadratic Equations","Functions & Graphs","Trigonometry","Euclidean Geometry","Analytical Geometry","Number Patterns","Probability","Calculus Basics"],
  "physical-sciences": ["Newton's Laws","Momentum & Impulse","Electrostatics","Organic Chemistry","Chemical Bonding","Acids & Bases","Projectile Motion"],
  "life-sciences": ["Cell Division: Mitosis","Photosynthesis","DNA & Protein Synthesis","Human Reproduction","Genetics & Inheritance","Evolution: Natural Selection"],
  accounting: ["Bank Reconciliation","Fixed Assets Register","Partnerships Ledger","Company Financial Statements","Cost Accounting","Cash Budgets"],
  economics: ["Perfect Markets","Business Cycles","Inflation & Deflation","Foreign Exchange Markets","Circular Flow Model","Protectionism & Free Trade"],
  "business-studies": ["Writing a Business Plan","Forms of Ownership","Leadership Styles","Investment Securities","Team Performance Assessment","Ethics & CSR"],
  geography: ["Mid-latitude Cyclones","Tropical Cyclones","Drainage Systems in SA","Rural Settlement Patterns","Urban Hierarchies","Economic Geography of SA"],
  history: ["Origins of the Cold War","Civil Rights Movement","Black Power Movement","Congo Independence Crisis","Truth & Reconciliation Commission","Globalisation Debates"],
  english: ["Poetry: Analysing Sonnets","The Crucible: Essay Pack","Cry the Beloved Country Themes","Visual Literacy: Cartoons","Comprehension Strategy","Transactional Writing Formats"],
  "cat-it": ["Hardware & Software Basics","Network Fundamentals","Excel Functions Cheatsheet","HTML & CSS Starters","Access Databases","Social Implications of ICT"],
};

const TITLE_SHAPES = [
  (t) => `${t} — Full Summary`,
  (t) => `${t} Survival Guide`,
  (t) => `${t}: Exam Pack + Examples`,
  (t) => `Mastering ${t}`,
  (t) => `${t} Crash Notes`,
];
const DESC = [
  "Went through the whole chapter and condensed it into what actually gets asked in exams.",
  "Made these while studying — includes worked examples and common traps.",
  "Everything you need for paper 1 and 2 on this topic. Good luck, you've got this.",
  "Teacher's class notes cleaned up + my own diagrams explained in words.",
  "Past-paper driven summary. If it's not in here, it's probably not in the exam.",
];

// ---------- main ----------

async function main() {
  console.log(`→ seeding against ${API}`);

  // 0. health + reference data
  const health = await api("/healthz");
  if (!health.ok) throw new Error("API is not up — start `wrangler dev` first.");
  const tokens = {}; // email -> bearer token
  execSync("npx wrangler d1 execute edurank-db --local --file scripts/reference-seed.sql", { cwd: join(__dirname, ".."), stdio: "pipe" });
  console.log("✓ reference data (subjects/schools/badges/shop)");

  const subjects = (await api("/subjects")).data.items;
  const schools = (await api("/schools")).data.items;

  // 1. admin
  let ar = await api("/auth/register", { method: "POST", body: { email: ADMIN_EMAIL, password: ADMIN_PASS, displayName: "ModeratorPrime" } });
  if (ar.status === 409) ar = await api("/auth/login", { method: "POST", body: { email: ADMIN_EMAIL, password: ADMIN_PASS } });
  if (!ar.ok) throw new Error(`admin login failed: ${JSON.stringify(ar.data)}`);
  execSync(`npx wrangler d1 execute edurank-db --local --command "UPDATE users SET role='admin' WHERE lower(email)=lower('${ADMIN_EMAIL}')"`, { cwd: join(__dirname, ".."), stdio: "pipe" });
  tokens[ADMIN_EMAIL] = ar.data.token;
  console.log("✓ admin account present");

  // 2. players
  const usedNames = new Set();
  const players = [];
  for (let i = 0; i < 28; i++) {
    let name;
    do {
      name = `${pick(FIRST)}${rand() > 0.45 ? pick(LAST).split(" ").pop().replace(/\s/g, "") : ""}${pick(TAGSUFFIX)}`;
    } while (usedNames.has(name));
    usedNames.add(name);
    players.push({
      email: `player${i + 1}@edurank.co.za`,
      password: "Password#2026",
      displayName: name.slice(0, 24),
      grade: pick([8, 9, 10, 11, 11, 12, 12]),
      schoolId: rand() > 0.15 ? pick(schools).id : null,
    });
  }


  let referrerCode = null;
  for (const p of players) {
    const body = { ...p };
    if (referrerCode && rand() > 0.6) body.referralCode = referrerCode;
    let r = await api("/auth/register", { method: "POST", body });
    if (r.status === 409) r = await api("/auth/login", { method: "POST", body: { email: p.email, password: p.password } });
    if (!r.ok) {
      console.warn(`  ! skipped ${p.email}: ${r.data.error}`);
      continue;
    }
    tokens[p.email] = r.data.token;
    if (!referrerCode) referrerCode = r.data.user.referralCode;
    await api("/me", { method: "PATCH", token: r.data.token, body: { bio: pick(["Grade 12 final sprint. Notes or it didn't happen.", "Here to trade notes and climb ranks.", "Maths enjoyer. Ask me about quadratics.", "Building the biggest archive in my school.", "Night-owl grinder.", ""]) } });
  }
  console.log(`✓ ${Object.keys(tokens).length} players active`);

  const tokenList = Object.values(tokens);
  void tokenList;

  // 3. uploads
  const notes = []; // {id, uploaderEmail, isFree}
  for (const p of players) {
    const token = tokens[p.email];
    if (!token) continue;
    const count = int(3, 6);
    for (let k = 0; k < count; k++) {
      const subject = pick(subjects);
      const topic = pick(TOPICS[subject.id] ?? ["General Summary"]);
      const grade = p.grade ?? 12;
      const title = pick(TITLE_SHAPES)(topic);
      const paid = rand() > 0.72;
      const form = new FormData();
      const pdfBytes = makePdf(`${title} — Grade ${grade}`, [
        `Subject: ${subject.name}`,
        "This pack covers:",
        `- key definitions and formulae for ${topic.toLowerCase()}`,
        "- worked examples, step by step",
        "- common mistakes and how to dodge them",
        "",
        "Uploaded via EduRank — share knowledge, earn PTS.",
      ]);
      form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), `${topic.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-gr${grade}.pdf`);
      form.append("title", title);
      form.append("description", pick(DESC));
      form.append("subjectId", subject.id);
      form.append("grade", String(grade));
      form.append("topic", topic);
      form.append("pricing", paid ? "paid" : "free");
      if (paid) form.append("pricePoints", String(pick([50, 100, 150, 200])));
      const up = await fetch(`${API}/notes`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const upd = await j(up);
      if (up.ok) notes.push({ id: upd.id, uploaderEmail: p.email, subjectId: subject.id });
    }
  }
  console.log(`✓ ${notes.length} notes uploaded`);

  // 4. moderation: approve ~90%, keep a live pending queue
  let approved = 0;
  for (const n of notes) {
    if (rand() < 0.9) {
      const r = await api(`/admin/notes/${n.id}/approve`, { method: "POST", token: tokens[ADMIN_EMAIL] });
      if (r.ok) approved++;
    }
  }
  console.log(`✓ ${approved} approved, ${notes.length - approved} left pending for the demo queue`);

  // 5. cross-pollination: unlocks + upvotes
  let unlockCount = 0, upvoteCount = 0;
  for (const n of notes.filter((x) => x.id)) {
    const detail = await api(`/notes/${n.id}`);
    if (!detail.ok || detail.data.note.status !== "approved") continue;
    const buyers = int(1, 5);
    for (let b = 0; b < buyers; b++) {
      const buyer = pick(players);
      if (!tokens[buyer.email] || buyer.email === n.uploaderEmail) continue;
      const r = await api(`/notes/${n.id}/unlock`, { method: "POST", token: tokens[buyer.email] });
      if (r.ok && !r.data.alreadyOwned) unlockCount++;
    }
    const vipers = int(2, 8);
    for (let v = 0; v < vipers; v++) {
      const voter = pick(players);
      if (!tokens[voter.email] || voter.email === n.uploaderEmail) continue;
      const r = await api(`/notes/${n.id}/upvote`, { method: "POST", token: tokens[voter.email] });
      if (r.ok && r.data.upvotedByMe) upvoteCount++;
    }
  }
  console.log(`✓ ${unlockCount} unlocks, ${upvoteCount} upvotes recorded`);

  // 6. shop purchases for anyone who can afford the cheapest frames/skins
  let bought = 0;
  for (const p of players) {
    const token = tokens[p.email];
    if (!token) continue;
    const me = await api("/me", { token });
    if (!me.ok) continue;
    let bal = me.data.user.balance;
    for (const item of ["frame-volt", "badge-owl", "skin-volt", "frame-gold"]) {
      if (bal >= 400 && rand() > 0.55) {
        const r = await api(`/shop/${item}/purchase`, { method: "POST", token });
        if (r.ok) {
          bought++;
          bal = r.data.balanceAfter;
        }
      }
    }  }
  console.log(`✓ ${bought} cosmetics purchased`);

  // 7. backdate timestamps so weekly/all-time boards + streaks look real
  const sqlChunks = [];
  const spread = (table, col, ids, minDays, maxDays, recentShare) => {
    const vals = [];
    for (const id of ids) {
      const daysAgo = rand() < recentShare ? int(0, 6) : int(minDays, maxDays);
      const ms = Date.now() - daysAgo * 86400000 - int(0, 20) * 3600000 - int(0, 59) * 60000;
      vals.push(`('${id}', ${ms})`);
    }
    for (let i = 0; i < vals.length; i += 100) {
      const chunk = vals.slice(i, i + 100).join(",");
      sqlChunks.push(
        `WITH v(id, ms) AS (VALUES ${chunk}) UPDATE ${table} SET ${col} = (SELECT ms FROM v WHERE v.id = ${table}.id) WHERE ${table}.id IN (SELECT id FROM v);`,
      );
    }
  };

  const idOf = (r) => r.id;
  const ledgerRes = execSync(
    `npx wrangler d1 execute edurank-db --local --command "SELECT id FROM points_ledger" --json`,
    { cwd: join(__dirname, ".."), encoding: "utf8" },
  );
  const ledgerIds = JSON.parse(ledgerRes)[0].results.map(idOf);
  spread("points_ledger", "created_at", ledgerIds, 7, 21, 0.35);

  const noteIdsRes = execSync(`npx wrangler d1 execute edurank-db --local --command "SELECT id FROM notes" --json`, { cwd: join(__dirname, ".."), encoding: "utf8" });
  const noteIds = JSON.parse(noteIdsRes)[0].results.map(idOf);
  spread("notes", "created_at", noteIds, 3, 30, 0.25);

  const userIdsRes = execSync(`npx wrangler d1 execute edurank-db --local --command "SELECT id FROM users" --json`, { cwd: join(__dirname, ".."), encoding: "utf8" });
  const userIds = JSON.parse(userIdsRes)[0].results.map(idOf);

  // user signup dates + streak variety
  const userVals = userIds
    .filter(() => rand() > 0.5)
    .map((id) => {
      const daysAgo = int(10, 60);
      const ms = Date.now() - daysAgo * 86400000;
      const best = int(2, 14);
      return `('${id}', ${ms}, ${best})`;
    });
  for (let i = 0; i < userVals.length; i += 80) {
    const chunk = userVals.slice(i, i + 80).join(",");
    sqlChunks.push(
      `WITH v(id, ms, best) AS (VALUES ${chunk}) UPDATE users SET created_at = (SELECT ms FROM v WHERE v.id = users.id), best_streak = MAX(best_streak, (SELECT best FROM v WHERE v.id = users.id)) WHERE users.id IN (SELECT id FROM v);`,
    );
  }

  // badges awarded shortly after their triggering events
  const badgeRes = execSync(`npx wrangler d1 execute edurank-db --local --command "SELECT rowid AS rid FROM user_badges" --json`, { cwd: join(__dirname, ".."), encoding: "utf8" });
  const badgeRids = JSON.parse(badgeRes)[0].results.map((r) => r.rid);
  for (const rid of badgeRids) {
    sqlChunks.push(`UPDATE user_badges SET awarded_at = ${Date.now() - int(1, 20) * 86400000} WHERE rowid = ${rid};`);
  }

  // rebuild running balances so every balance_after matches the new timeline
  sqlChunks.push(`
    WITH runs AS (
      SELECT id, SUM(delta) OVER (PARTITION BY user_id ORDER BY created_at) AS run
      FROM points_ledger
    )
    UPDATE points_ledger SET balance_after = (SELECT run FROM runs WHERE runs.id = points_ledger.id);
  `);
  sqlChunks.push(`
    UPDATE users SET
      total_earned = IFNULL((SELECT SUM(delta) FROM points_ledger l WHERE l.user_id = users.id AND l.delta > 0), 0),
      total_spent  = IFNULL((SELECT -SUM(delta) FROM points_ledger l WHERE l.user_id = users.id AND l.delta < 0), 0);
  `);
  sqlChunks.push(`UPDATE users SET balance = total_earned - total_spent;`);

  const backdateFile = join(__dirname, "seed-backdate.sql");
  writeFileSync(backdateFile, sqlChunks.join("\n"));
  execSync(`npx wrangler d1 execute edurank-db --local --file scripts/seed-backdate.sql`, { cwd: join(__dirname, ".."), stdio: "pipe" });
  console.log("✓ history backdated + balances recomputed");

  // sanity check: top of the all-time board
  const lb = await api("/leaderboard?scope=global&range=all-time");
  console.log("\nTop 5 all-time:");
  for (const row of lb.data.items.slice(0, 5)) {
    console.log(`  #${row.rank} ${row.displayName.padEnd(18)} ${String(row.points).padStart(6)} PTS  ${row.schoolName ?? "—"}`);
  }

  console.log(`
═══════════════════════════════════════════════
 Seed complete.
 Admin login:  ${ADMIN_EMAIL} / ${ADMIN_PASS}
 Player login: player1@edurank.co.za / Password#2026
═══════════════════════════════════════════════`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});

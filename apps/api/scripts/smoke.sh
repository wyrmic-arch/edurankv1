#!/usr/bin/env bash
# EduRank API smoke test — exercises the full economy against a local dev server.
set -u
API="http://127.0.0.1:8787"
PASS=0; FAIL=0

say() { printf '%s\n' "$*"; }
ok()  { PASS=$((PASS+1)); say "  ok: $1"; }
bad() { FAIL=$((FAIL+1)); say "FAIL: $1"; }

check() { # check <desc> <jsonl-expr> <actual-json>
  local desc="$1" expr="$2" json="$3"
  local val
  val=$(printf '%s' "$json" | jq -r "$expr" 2>/dev/null)
  if [ -n "$val" ] && [ "$val" != "null" ] && [ "$val" != "false" ]; then ok "$desc ($val)"; else bad "$desc — got: $(printf '%s' "$json" | head -c 200)"; fi
}

pdf() { # tiny valid-ish PDF on stdout
  printf '%%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 74>>stream\nBT /F1 24 Tf 72 700 Td (%s) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%%%EOF\n' "$1"
}

TS=$(date +%s)
A="smoke-a-$TS"; B="smoke-b-$TS"

# Each request gets a fresh synthetic client IP so the (now-enforced) per-IP
# rate limiters never interfere with the functional flow. A dedicated section
# at the end deliberately hammers one IP to prove the limiter fires.
# NB: use $RANDOM (not a counter) — curl is often called inside $(), so a
# shell variable increment would happen in a subshell and never persist.
curl() { command curl -H "cf-connecting-ip: smoke-$TS-$RANDOM$RANDOM" "$@"; }

say "== auth =="
RA=$(curl -s --max-time 15 -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"$A@test.co.za\",\"password\":\"password123\",\"displayName\":\"Smoke A\"}")
check "register A returns token+user" '.token != null and .user.id != null' "$RA"
TA=$(echo "$RA" | jq -r .token)

RB=$(curl -s --max-time 15 -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"$B@test.co.za\",\"password\":\"password123\",\"displayName\":\"Smoke B\",\"referralCode\":\"$(echo "$RA" | jq -r .user.referralCode)\"}")
check "register B with A's referral code" '.token != null' "$RB"
TB=$(echo "$RB" | jq -r .token)

check "B got referral bonus (100)" '.user.balance >= 100' "$RB"

ME=$(curl -s --max-time 15 $API/auth/me -H "Authorization: Bearer $TB")
check "auth/me works with bearer" '.user.displayName == "Smoke B"' "$ME"

GA=$(curl -s --max-time 15 -X PATCH $API/me -H "Authorization: Bearer $TA" -H 'Content-Type: application/json' -d '{"grade":11}')
check "A locks their grade (11)" '.user.grade == 11' "$GA"

DUP=$(curl -s --max-time 15 -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"$A@test.co.za\",\"password\":\"password123\",\"displayName\":\"Dup\"}")
check "duplicate email rejected (409)" '.error | test("already")' "$DUP"

say "== subjects & profile =="
SUBS=$(curl -s --max-time 15 $API/subjects)
check "subjects list has mathematics" '.items | map(select(.id=="mathematics")) | length == 1' "$SUBS"

SCHOOL=$(curl -s --max-time 15 $API/schools | jq -r '.items[0].id')
PROF=$(curl -s --max-time 15 -X PATCH $API/me -H "Authorization: Bearer $TB" -H 'Content-Type: application/json' \
  -d "{\"grade\":11,\"schoolId\":\"$SCHOOL\",\"bio\":\"Here for the grind.\"}")
check "profile completion bonus lands (+30)" '.user.totalEarned >= 130' "$PROF"

# Give A the same school so their upload carries a school_id (teacher scoping).
AS=$(curl -s --max-time 15 -X PATCH $API/me -H "Authorization: Bearer $TA" -H 'Content-Type: application/json' -d "{\"schoolId\":\"$SCHOOL\"}")
check "A locks their school" '.user.schoolId != null' "$AS"

say "== grade & school locks =="
SL=$(curl -s --max-time 15 -X PATCH $API/me -H "Authorization: Bearer $TB" -H 'Content-Type: application/json' -d '{"schoolId":"some-other-school"}')
check "school change refused once locked" '.error != null' "$SL"
GL=$(curl -s --max-time 15 -X PATCH $API/me -H "Authorization: Bearer $TB" -H 'Content-Type: application/json' -d '{"grade":10}')
check "grade change refused once locked" '.error != null' "$GL"

say "== admin setup =="
curl -s --max-time 15 -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin-smoke-$TS@test.co.za\",\"password\":\"password123\",\"displayName\":\"Smoke Admin\"}" > /dev/null
cd "$(dirname "$0")/.." || exit 1
npx wrangler d1 execute edurank-app-db --local --command "UPDATE users SET role='admin' WHERE email LIKE 'admin-smoke-%'" > /dev/null 2>&1
LA=$(curl -s --max-time 15 -X POST $API/auth/login -H 'Content-Type: application/json' -d '{"email":"admin-smoke-'$TS'@test.co.za","password":"password123"}')
TADMIN=$(echo "$LA" | jq -r .token)
check "admin login + role" '.user.role == "admin"' "$LA"

say "== upload -> review -> approve =="
pdf "Quadratic equations masterclass $TS" > /tmp/opencode/smoke.pdf
UP=$(curl -s --max-time 30 -X POST $API/notes -H "Authorization: Bearer $TA" \
  -F "file=@/tmp/opencode/smoke.pdf;type=application/pdf" \
  -F "title=Quadratics Unlocked" -F "description=Everything factorising, completing the square, formula." \
  -F "subjectId=mathematics" -F "grade=11" -F "topic=Quadratic equations" \
  -F "pricing=paid" -F "pricePoints=100")
check "upload accepted as pending" '.status == "pending"' "$UP"
NOTE_ID=$(echo "$UP" | jq -r .id)

PEN=$(curl -s --max-time 15 $API/admin/pending -H "Authorization: Bearer $TADMIN")
check "pending queue lists the upload" '.items | length >= 1' "$PEN"

AP=$(curl -s --max-time 15 -X POST $API/admin/notes/$NOTE_ID/approve -H "Authorization: Bearer $TADMIN")
check "approve pays uploader +50" '.uploaderBalanceAfter >= 50' "$AP"

say "== staff: principal & teacher =="
PI=$(curl -s --max-time 15 -X POST $API/admin/invites -H "Authorization: Bearer $TADMIN" -H 'Content-Type: application/json' -d "{\"role\":\"principal\",\"schoolId\":\"$SCHOOL\"}")
check "admin issues a principal invite" '.code != null' "$PI"
PCODE=$(echo "$PI" | jq -r .code)

PR=$(curl -s --max-time 15 -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"principal-$TS@test.co.za\",\"password\":\"password123\",\"displayName\":\"Smoke Principal\",\"inviteCode\":\"$PCODE\"}")
check "principal signs up with invite" '.user.role == "principal"' "$PR"
TPR=$(echo "$PR" | jq -r .token)

TIV=$(curl -s --max-time 15 -X POST $API/school/invites -H "Authorization: Bearer $TPR" -H 'Content-Type: application/json' -d '{"subjectIds":["mathematics"]}')
check "principal issues a teacher invite" '.code != null' "$TIV"
TCODE=$(echo "$TIV" | jq -r .code)

TR=$(curl -s --max-time 15 -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"teacher-$TS@test.co.za\",\"password\":\"password123\",\"displayName\":\"Smoke Teacher\",\"inviteCode\":\"$TCODE\"}")
check "teacher signs up with invite" '.user.role == "teacher"' "$TR"
TT=$(echo "$TR" | jq -r .token)

TF=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 $API/notes/$NOTE_ID/file -H "Authorization: Bearer $TT")
check "teacher free-views a school note (no unlock) " '.c == "200"' "$(printf '{"c":"%s"}' "$TF")"

TV=$(curl -s --max-time 15 -X POST $API/notes/$NOTE_ID/verify -H "Authorization: Bearer $TT" -H 'Content-Type: application/json' -d '{"verdict":"correct"}')
check "teacher verifies the note" '.verdict == "correct"' "$TV"

VD=$(curl -s --max-time 15 $API/notes/$NOTE_ID -H "Authorization: Bearer $TB")
check "note is flagged teacher-verified" '.note.verifiedByTeacher == true' "$VD"

# Invites are single-use.
RE=$(curl -s --max-time 15 -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"reuse-$TS@test.co.za\",\"password\":\"password123\",\"displayName\":\"Reuse\",\"inviteCode\":\"$TCODE\"}")
check "used invite is rejected" '.error != null' "$RE"

say "== unlock economy =="
UN=$(curl -s --max-time 15 -X POST $API/notes/$NOTE_ID/unlock -H "Authorization: Bearer $TB")
# B had 105+streak5=110ish; price 100 → should succeed or fail with 402 depending on streak timing.
BAL_B=$(curl -s --max-time 15 $API/auth/me -H "Authorization: Bearer $TB" | jq -r .user.balance)
if [ "$(echo "$UN" | jq -r .unlocked)" = "true" ]; then
  ok "B unlocked paid note (paid 100)"
else
  bad "unlock failed unexpectedly: $UN"
fi
check "file gated download works after unlock" 'true' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 $API/notes/$NOTE_ID/file -H "Authorization: Bearer $TB" | grep 200)"

LED_A=$(curl -s --max-time 15 "$API/me/ledger?flow=earned" -H "Authorization: Bearer $TA")
check "uploader ledger shows unlock revenue + download bonus" '[.items[].reason] | index("unlock_revenue") != null and index("download_received") != null' "$LED_A"

say "== upvote =="
UV=$(curl -s --max-time 15 -X POST $API/notes/$NOTE_ID/upvote -H "Authorization: Bearer $TB")
check "upvote toggles on" '.upvotedByMe == true' "$UV"
LED_A2=$(curl -s --max-time 15 "$API/me/ledger?flow=earned" -H "Authorization: Bearer $TA")
check "+5 upvote reward ledgered once" '[.items[] | select(.reason=="upvote_received")] | length == 1' "$LED_A2"

say "== notes listing/detail =="
LIST=$(curl -s --max-time 15 "$API/notes?subject=mathematics&sort=recent&q=quadratics")
check "search finds the note" '.items | length >= 1' "$LIST"
DET=$(curl -s --max-time 15 "$API/notes/$NOTE_ID" -H "Authorization: Bearer $TB")
check "detail shows unlockedByMe" '.note.unlockedByMe == true' "$DET"

# A student locked to another grade must not be able to open this note.
RC=$(curl -s --max-time 15 -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"smoke-c-$TS@test.co.za\",\"password\":\"password123\",\"displayName\":\"Smoke C\",\"grade\":10}")
TC=$(echo "$RC" | jq -r .token)
DETC=$(curl -s --max-time 15 "$API/notes/$NOTE_ID" -H "Authorization: Bearer $TC")
check "other grade can't open the note" '.error != null' "$DETC"

say "== challenges =="
CH=$(curl -s --max-time 15 $API/challenges/daily -H "Authorization: Bearer $TB")
check "3 daily challenges returned" '.challenges | length == 3' "$CH"
check "login challenge auto-claimed" '[.challenges[] | select(.key=="show_up")][0].claimed == true' "$CH"

say "== leaderboard =="
LB=$(curl -s --max-time 15 "$API/leaderboard?scope=global&range=all-time")
check "leaderboard ranks players" '.items | length >= 2' "$LB"
LBS=$(curl -s --max-time 15 "$API/leaderboard?scope=subject&subjectId=mathematics&range=weekly")
check "subject weekly board works" '.items | length >= 1' "$LBS"
SCHOOL_LB=$(curl -s --max-time 15 "$API/leaderboard?scope=school&schoolId=$SCHOOL&range=all-time")
check "school board works" '.items | length >= 1' "$SCHOOL_LB"

say "== shop =="
# Give B a top-up via admin adjust? No admin-adjust route by design. Fund via referral uploads:
# simplest real path: B buys cheapest item only if affordable; otherwise verify clean 402.
SHOP=$(curl -s --max-time 15 $API/shop)
check "shop lists items" '.items | length >= 5' "$SHOP"
PRICE=$(echo "$SHOP" | jq -r '.items[] | select(.id=="frame-volt") | .pricePoints')
BAL_B=$(curl -s --max-time 15 $API/auth/me -H "Authorization: Bearer $TB" | jq -r .user.balance)
BUY=$(curl -s --max-time 15 -X POST $API/shop/frame-volt/purchase -H "Authorization: Bearer $TB")
if [ "${BAL_B:-0}" -ge "${PRICE:-999999}" ]; then
  check "purchase succeeded + auto-equips frame" '.equippedFrameId == "frame-volt"' "$BUY"
else
  check "purchase cleanly refused when broke (402)" '.error | test("Not enough PTS")' "$BUY"
fi

say "== ownership & reports =="
CERT=$(curl -s --max-time 15 $API/notes/$NOTE_ID/certificate)
check "certificate exposes the content hash" '.certificate.contentHash != null' "$CERT"

DUPUP=$(curl -s --max-time 30 -X POST $API/notes -H "Authorization: Bearer $TA" \
  -F "file=@/tmp/opencode/smoke.pdf;type=application/pdf" \
  -F "title=Duplicate attempt" -F "subjectId=mathematics" -F "grade=11")
check "duplicate file rejected" '.error != null' "$DUPUP"

REP=$(curl -s --max-time 15 -X POST $API/notes/$NOTE_ID/report -H "Authorization: Bearer $TB" -H 'Content-Type: application/json' -d '{"reason":"test report","details":"smoke"}')
check "note report accepted" '.ok == true' "$REP"
RPT=$(curl -s --max-time 15 $API/admin/reports -H "Authorization: Bearer $TADMIN")
check "report appears in the admin queue" '.items | length >= 1' "$RPT"
RID=$(echo "$RPT" | jq -r '.items[0].id')
RES=$(curl -s --max-time 15 -X POST $API/admin/reports/$RID/resolve -H "Authorization: Bearer $TADMIN" -H 'Content-Type: application/json' -d '{"action":"dismiss"}')
check "report dismissed" '.ok == true' "$RES"

say "== notifications =="
NOTIF=$(curl -s --max-time 15 $API/notifications -H "Authorization: Bearer $TA")
check "uploader has notifications" '.items | length >= 1' "$NOTIF"
check "unread count is positive" '.unread >= 1' "$NOTIF"
RD=$(curl -s --max-time 15 -X POST $API/notifications/read -H "Authorization: Bearer $TA" -H 'Content-Type: application/json' -d '{}')
check "mark-all-read works" '.ok == true' "$RD"
UN=$(curl -s --max-time 15 $API/notifications/unread-count -H "Authorization: Bearer $TA")
check "unread cleared" '.unread == 0' "$UN"
PRE=$(curl -s --max-time 15 -X PATCH $API/notifications/prefs -H "Authorization: Bearer $TA" -H 'Content-Type: application/json' -d '{"email":false}')
check "digest preference toggles" '.ok == true' "$PRE"
PRG=$(curl -s --max-time 15 $API/notifications/prefs -H "Authorization: Bearer $TA")
check "digest preference persisted" '.email | not' "$PRG"
DG=$(curl -s --max-time 20 -X POST $API/admin/notifications/run-digest -H "Authorization: Bearer $TADMIN")
check "digest runs" '.ok == true' "$DG"

say "== rate limiting =="
# Hammer one IP: the 5/min login limiter must reject the 6th attempt.
RLIP="smoke-$TS-ratelimit"
CODES=""
for i in 1 2 3 4 5 6; do
  CODE=$(command curl -s -o /dev/null -w '%{http_code}' --max-time 10 -X POST "$API/auth/login" \
    -H 'Content-Type: application/json' -H "cf-connecting-ip: $RLIP" \
    -d '{"email":"nobody@test.co.za","password":"wrongpass"}')
  CODES="$CODES $CODE"
done
case "$CODES" in
  *429*) ok "login limiter returns 429 after 5 attempts ($CODES)";;
  *) bad "login limiter never fired ($CODES)";;
esac

say ""
say "RESULT: $PASS passed, $FAIL failed"
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)

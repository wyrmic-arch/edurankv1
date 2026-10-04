#!/usr/bin/env bash
# Rebuild the EduRank handover PDF from docs/handbook.template.html.
# Fonts are embedded as base64 so the PDF is self-contained.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
FONTS="$ROOT/apps/web/public/fonts"

CHROME="${CHROME:-$(command -v chromium || command -v chromium-browser || command -v google-chrome || echo /home/jacques/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome)}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

node -e '
const fs = require("fs");
const F = process.argv[1], D = process.argv[2], OUT = process.argv[3];
const b64 = (p) => fs.readFileSync(p).toString("base64");
let html = fs.readFileSync(D + "/handbook.template.html", "utf8");
html = html
  .replace("__INTER__", b64(F + "/inter-variable.woff2"))
  .replace("__MONO__", b64(F + "/jetbrains-mono-variable.woff2"))
  .replace("__GARAMOND__", b64(F + "/font_06.woff2"));
fs.writeFileSync(OUT, html);
' "$FONTS" "$DIR" "$TMP/handbook.html"

"$CHROME" --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=5000 \
  --print-to-pdf="$DIR/EduRank-Handbook.pdf" "file://$TMP/handbook.html"

echo "Wrote $DIR/EduRank-Handbook.pdf"

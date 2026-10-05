#!/usr/bin/env python3
"""EduRank official notes: render Markdown (with YAML frontmatter) to a clean,
printable PDF using headless Chromium.

Usage:
    python3 md2pdf.py <file.md> [more.md ...]
    python3 md2pdf.py --all <root_dir>      # every .md under root that has frontmatter

Produces <same-name>.pdf next to each .md.
"""
import html
import os
import re
import shutil
import subprocess
import sys
import tempfile

CHROMIUM = "chromium"
# Ghostscript pass applied after rendering: resamples images, subsets fonts and
# repacks streams so the published PDFs take far less storage in R2.
# /ebook ≈ 150 dpi (readable on screen, ~40–55% smaller); override with
# PDF_PRESET=screen|printer|prepress.
GS = os.environ.get("GS", "gs")
GS_PRESET = os.environ.get("PDF_PRESET", "ebook")

CSS = """
@page { size: A4; margin: 16mm 15mm 18mm 15mm; }
* { box-sizing: border-box; }
body {
  font-family: "DejaVu Sans", "Liberation Sans", system-ui, sans-serif;
  font-size: 10.5pt; line-height: 1.5; color: #14181f; margin: 0;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
h1, h2, h3, h4 { line-height: 1.25; color: #0b0f14; }
h1 { font-size: 18pt; margin: 0 0 4pt; }
h2 { font-size: 14pt; margin: 16pt 0 6pt; border-bottom: 1.2px solid #d7dce3; padding-bottom: 3pt; }
h3 { font-size: 11.5pt; margin: 12pt 0 4pt; color: #1b2a3a; }
p { margin: 5pt 0; }
ul, ol { margin: 5pt 0 5pt 0; padding-left: 18pt; }
li { margin: 2pt 0; }
strong { color: #0b0f14; }
code {
  font-family: "DejaVu Sans Mono", "Liberation Mono", monospace;
  font-size: 9.3pt; background: #f2f4f7; padding: 0.5pt 3pt; border-radius: 3px;
}
pre {
  background: #f7f9fb; border: 1px solid #e2e7ee; border-radius: 5px;
  padding: 8pt 10pt; overflow-x: auto; page-break-inside: avoid;
}
pre code { background: none; padding: 0; font-size: 9pt; }
blockquote {
  margin: 7pt 0; padding: 5pt 10pt; border-left: 3px solid #9fb3c8;
  background: #f6f8fb; color: #33475b;
}
table { border-collapse: collapse; width: 100%; margin: 7pt 0; font-size: 9.7pt; page-break-inside: avoid; }
th, td { border: 1px solid #d7dce3; padding: 4pt 7pt; text-align: left; vertical-align: top; }
th { background: #eef2f6; font-weight: 600; }
hr { border: 0; border-top: 1px solid #d7dce3; margin: 12pt 0; }
.doc-title { font-size: 19pt; font-weight: 700; margin: 0 0 2pt; color: #0b0f14; }
.doc-meta { font-size: 9pt; color: #64748b; margin: 0 0 12pt; }
.doc-meta .pill {
  display: inline-block; border: 1px solid #d7dce3; border-radius: 100px;
  padding: 1pt 8pt; margin-right: 5pt; font-size: 8.5pt; color: #475569;
}
.footer-note {
  margin-top: 14pt; padding-top: 8pt; border-top: 1px solid #d7dce3;
  font-size: 9pt; color: #475569; font-style: italic;
}
"""


def split_frontmatter(text):
    if text.startswith("---"):
        m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
        if m:
            return m.group(1), m.group(2)
    return "", text


def parse_frontmatter(block):
    fm = {}
    for line in block.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(r"(?<!_)_([^_\n]+)_(?!_)", r"<em>\1</em>", t)
    return t


def md_to_html(md):
    lines = md.replace("\r\n", "\n").split("\n")
    out, i = [], 0
    n = len(lines)
    while i < n:
        line = lines[i]
        # fenced code
        if line.strip().startswith("```"):
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(html.escape(lines[i]))
                i += 1
            i += 1
            out.append("<pre><code>" + "\n".join(buf) + "</code></pre>")
            continue
        # table
        if line.strip().startswith("|") and i + 1 < n and re.match(r"^\s*\|?[\s:|-]+\|?\s*$", lines[i + 1]):
            header = [c.strip() for c in line.strip().strip("|").split("|")]
            i += 2
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            t = ["<table><thead><tr>"]
            t += ["<th>" + inline(c) + "</th>" for c in header]
            t.append("</tr></thead><tbody>")
            for r in rows:
                t.append("<tr>" + "".join("<td>" + inline(c) + "</td>" for c in r) + "</tr>")
            t.append("</tbody></table>")
            out.append("".join(t))
            continue
        # headings
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            lvl = len(m.group(1))
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>")
            i += 1
            continue
        # hr
        if re.match(r"^\s*([-*_])\1{2,}\s*$", line):
            out.append("<hr>")
            i += 1
            continue
        # blockquote (group consecutive)
        if line.strip().startswith(">"):
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip()[1:].strip())
                i += 1
            out.append("<blockquote>" + "<br>".join(inline(b) for b in buf) + "</blockquote>")
            continue
        # lists
        if re.match(r"^\s*[-*+]\s+", line):
            items = []
            while i < n and re.match(r"^\s*[-*+]\s+", lines[i]):
                items.append(inline(re.sub(r"^\s*[-*+]\s+", "", lines[i])))
                i += 1
            out.append("<ul>" + "".join("<li>" + it + "</li>" for it in items) + "</ul>")
            continue
        if re.match(r"^\s*\d+[.)]\s+", line):
            items = []
            while i < n and re.match(r"^\s*\d+[.)]\s+", lines[i]):
                items.append(inline(re.sub(r"^\s*\d+[.)]\s+", "", lines[i])))
                i += 1
            out.append("<ol>" + "".join("<li>" + it + "</li>" for it in items) + "</ol>")
            continue
        # blank
        if not line.strip():
            i += 1
            continue
        # paragraph
        buf = []
        while i < n and lines[i].strip() and not re.match(r"^(#{1,6}\s|>|\s*[-*+]\s|\s*\d+[.)]\s|```|\|)", lines[i]):
            buf.append(lines[i].strip())
            i += 1
        if not buf:
            # A line starting with '|' that is not a table (header without a
            # separator row), or any other unmatched line: emit it as text and
            # ALWAYS advance, so the parser can never stall.
            buf = [lines[i].strip()]
            i += 1
        out.append("<p>" + inline(" ".join(buf)) + "</p>")
    return "\n".join(out)


def build_html(md_path):
    text = open(md_path, encoding="utf-8").read()
    fm_block, body = split_frontmatter(text)
    fm = parse_frontmatter(fm_block)
    title = fm.get("title", os.path.basename(md_path))
    subject = fm.get("subject", "")
    grade = fm.get("grade", "")
    body_html = md_to_html(body.strip())
    meta = (
        f'<div class="doc-title">{html.escape(title)}</div>'
        f'<div class="doc-meta"><span class="pill">Grade {html.escape(str(grade))}</span>'
        f'<span class="pill">{html.escape(subject.replace("-", " ").title())}</span>'
        f'<span class="pill">CAPS</span></div>'
    )
    return (
        "<!doctype html><html lang=\"en-ZA\"><head><meta charset=\"utf-8\">"
        f"<title>{html.escape(title)}</title><style>{CSS}</style></head><body>"
        f"{meta}{body_html}</body></html>"
    )


def compress_pdf(pdf_path):
    """Shrink a rendered PDF in place with Ghostscript, if available."""
    if not shutil.which(GS):
        print(f"  (ghostscript not found — leaving {os.path.basename(pdf_path)} uncompressed)")
        return
    before = os.path.getsize(pdf_path)
    out = pdf_path + ".gs.tmp"
    try:
        subprocess.run(
            [GS, "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.7",
             f"-dPDFSETTINGS=/{GS_PRESET}", "-dDetectDuplicateImages=true",
             "-dNOPAUSE", "-dQUIET", "-dBATCH", "-dSAFER",
             f"-sOutputFile={out}", pdf_path],
            check=True, capture_output=True, timeout=300,
        )
        after = os.path.getsize(out)
        if after < before:
            os.replace(out, pdf_path)
            print(f"  compressed {before // 1024}KB -> {after // 1024}KB")
        else:
            os.unlink(out)
    except Exception as e:  # noqa: BLE001
        if os.path.exists(out):
            os.unlink(out)
        print(f"  (ghostscript compression skipped: {e})")


def render_one(md_path):
    html_str = build_html(md_path)
    pdf_path = os.path.splitext(md_path)[0] + ".pdf"
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_str)
        tmp = f.name
    try:
        subprocess.run(
            [CHROMIUM, "--headless=new", "--no-sandbox", "--disable-gpu",
             "--no-pdf-header-footer", f"--print-to-pdf={pdf_path}", tmp],
            check=True, capture_output=True, timeout=120,
        )
    finally:
        os.unlink(tmp)
    compress_pdf(pdf_path)
    return pdf_path


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    files = []
    if argv[0] == "--all":
        root = argv[1]
        for dirpath, _dirs, names in os.walk(root):
            for nm in sorted(names):
                if nm.endswith(".md"):
                    files.append(os.path.join(dirpath, nm))
    else:
        files = argv
    ok = 0
    for f in files:
        try:
            p = render_one(f)
            sz = os.path.getsize(p)
            print(f"OK  {p}  ({sz} bytes)")
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"FAIL {f}: {e}")
    print(f"\n{ok}/{len(files)} rendered")
    return 0 if ok == len(files) else 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

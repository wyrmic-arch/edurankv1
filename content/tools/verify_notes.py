#!/usr/bin/env python3
"""Verify the EduRank official notes library (content/official).

Checks every .md against the required schema and body rules, and checks that a
matching .pdf exists, opens, and carries the note's text.

Usage:  python3 verify_notes.py [root]      # default root: content/official
Exit code 0 = all good, 1 = problems found.
"""
import os
import re
import subprocess
import sys

REQUIRED_KEYS = ["title", "subject", "grade", "topic", "slug", "description",
                 "license", "order"]
SUBJECTS = {"mathematics", "physical-sciences", "life-sciences", "accounting"}
GRADES = {"11", "12"}
FINAL_LINE = "Official EduRank Team notes. Always cross-check with your textbook and teacher."
MIN_WORDS, MAX_WORDS = 1400, 3400
SECTION_CHECKS = [
    ("What you'll learn", r"^##\s+What you'?ll learn"),
    ("Common mistakes", r"^##\s+Common mistakes"),
    ("Quick summary", r"^##\s+Quick summary"),
    ("Practice questions", r"^##\s+Practice questions"),
    ("Answers", r"^###\s+Answers"),
]


def parse(md):
    fm_raw, body = "", md
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", md, re.S)
    if m:
        fm_raw, body = m.group(1), m.group(2)
    fm = {}
    for line in fm_raw.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm_raw, fm, body


def check_md(path, root):
    problems = []
    md = open(path, encoding="utf-8").read()
    fm_raw, fm, body = parse(md)

    # path
    rel = os.path.relpath(path, root)
    parts = rel.split(os.sep)
    if len(parts) != 3:
        problems.append(f"path depth != 3: {rel}")
        return problems, {}
    dgrade, dsubject, fname = parts
    stem = fname[:-3]

    # frontmatter keys
    keys = list(fm.keys())
    if keys != REQUIRED_KEYS:
        problems.append(f"frontmatter keys wrong: {keys}")

    grade, subject, slug = fm.get("grade", ""), fm.get("subject", ""), fm.get("slug", "")
    if dgrade != f"grade-{grade}":
        problems.append(f"dir grade {dgrade} != frontmatter grade {grade}")
    if dsubject != subject:
        problems.append(f"dir subject {dsubject} != frontmatter subject {subject}")
    if subject not in SUBJECTS:
        problems.append(f"bad subject {subject!r}")
    if grade not in GRADES:
        problems.append(f"bad grade {grade!r}")
    want_slug = f"grade-{grade}-{subject}-{stem}"
    if slug != want_slug:
        problems.append(f"slug {slug!r} != expected {want_slug!r}")
    if fm.get("license") != "all-rights-reserved":
        problems.append(f"bad license {fm.get('license')!r}")
    if fm.get("order") not in {"1", "2", "3"}:
        problems.append(f"bad order {fm.get('order')!r}")
    dlen = len(fm.get("description", ""))
    if not (120 <= dlen <= 165):
        problems.append(f"description length {dlen} (want 120-160)")

    # body rules
    for label, pat in SECTION_CHECKS:
        if not re.search(pat, body, re.M | re.I):
            problems.append(f"missing section: {label}")
    for line in body.splitlines():
        if re.match(r"^#\s+\S", line):
            problems.append("has a top-level '#' heading")
            break
    if "$" in body:
        problems.append("contains '$' (LaTeX marker)")
    if re.search(r"\\\(|\\\[", body):
        problems.append("contains LaTeX delimiters")
    nonempty = [l for l in body.splitlines() if l.strip()]
    if not nonempty or nonempty[-1].strip() != FINAL_LINE:
        problems.append(f"last line wrong: {nonempty[-1][:60]!r}" if nonempty else "empty body")

    words = len(re.findall(r"\S+", body))
    if not (MIN_WORDS <= words <= MAX_WORDS):
        problems.append(f"word count {words} outside {MIN_WORDS}-{MAX_WORDS}")
    ex = len(re.findall(r"example", body, re.I))
    if ex < 2:
        problems.append(f"only {ex} 'example' mentions (want worked examples)")

    info = {"slug": slug, "words": words, "grade": grade, "subject": subject,
            "order": fm.get("order"), "title": fm.get("title", "")}
    return problems, info


def check_pdf(md_path, info):
    problems = []
    pdf = os.path.splitext(md_path)[0] + ".pdf"
    if not os.path.exists(pdf):
        return [f"missing PDF: {os.path.basename(pdf)}"]
    if os.path.getsize(pdf) < 4000:
        problems.append("PDF suspiciously small")
    try:
        pi = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True, timeout=30)
        pages = re.search(r"Pages:\s+(\d+)", pi.stdout)
        if pages and int(pages.group(1)) < 1:
            problems.append("PDF has 0 pages")
    except Exception as e:  # noqa: BLE001
        problems.append(f"pdfinfo failed: {e}")
    try:
        txt = subprocess.run(["pdftotext", pdf, "-"], capture_output=True, text=True,
                             timeout=60).stdout
        norm = re.sub(r"\s+", " ", txt)
        # the final line is a good fingerprint of full-body rendering
        frag = re.sub(r"\s+", " ", FINAL_LINE)[:50]
        if frag.lower() not in norm.lower():
            problems.append("PDF text missing the closing EduRank line (body may not have rendered)")
    except Exception as e:  # noqa: BLE001
        problems.append(f"pdftotext failed: {e}")
    return problems


def main(argv):
    root = argv[0] if argv else os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "official")
    mds = []
    for dp, _d, names in os.walk(root):
        for n in sorted(names):
            if n.endswith(".md"):
                mds.append(os.path.join(dp, n))
    if not mds:
        print(f"No .md files found under {root}")
        return 1

    all_ok = True
    slugs = []
    total_problems = 0
    for md in mds:
        probs, info = check_md(md, root)
        if info.get("slug"):
            slugs.append(info["slug"])
        probs += check_pdf(md, info)
        status = "OK " if not probs else "BAD"
        print(f"[{status}] {os.path.relpath(md, root)}  ({info.get('words','?')} words)")
        for p in probs:
            print(f"        - {p}")
        if probs:
            all_ok = False
            total_problems += len(probs)

    print(f"\n{len(mds)} notes checked, {total_problems} problems")
    print(f"{len(set(slugs))} unique slugs")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

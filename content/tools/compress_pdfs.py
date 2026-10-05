#!/usr/bin/env python3
"""Shrink existing PDFs in place with Ghostscript (lossless-ish: keeps text
selectable, resamples embedded images).

Usage:
    python3 compress_pdfs.py [root_dir]      # default: content/official
    PDF_PRESET=screen python3 compress_pdfs.py
"""
import os
import subprocess
import sys

GS = os.environ.get("GS", "gs")
PRESET = os.environ.get("PDF_PRESET", "ebook")


def human(n):
    return f"{n / 1024 / 1024:.1f}MB" if n >= 1024 * 1024 else f"{n // 1024}KB"


def compress(path):
    before = os.path.getsize(path)
    out = path + ".gs.tmp"
    try:
        subprocess.run(
            [GS, "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.7",
             f"-dPDFSETTINGS=/{PRESET}", "-dDetectDuplicateImages=true",
             "-dNOPAUSE", "-dQUIET", "-dBATCH", "-dSAFER",
             f"-sOutputFile={out}", path],
            check=True, capture_output=True, timeout=300,
        )
        after = os.path.getsize(out)
        if after < before:
            os.replace(out, path)
            print(f"  {human(before)} -> {human(after)}  {os.path.relpath(path)}")
            return before - after
        os.unlink(out)
        print(f"  kept original ({human(before)})  {os.path.relpath(path)}")
    except Exception as e:  # noqa: BLE001
        if os.path.exists(out):
            os.unlink(out)
        print(f"  FAILED {os.path.relpath(path)}: {e}")
    return 0


def main(argv):
    root = argv[0] if argv else os.path.join(os.path.dirname(__file__), "..", "official")
    total = 0
    count = 0
    for dirpath, _dirs, names in os.walk(root):
        for nm in sorted(names):
            if nm.lower().endswith(".pdf"):
                total += compress(os.path.join(dirpath, nm))
                count += 1
    print(f"\n{count} PDFs processed, {human(total)} saved.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

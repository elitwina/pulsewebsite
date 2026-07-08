"""
Download every framerusercontent.com image referenced from the site
into /assets/img/blog/, then rewrite the HTML files to point at the
local copy. One-off: ship to client with the rest of the site, or
delete after running.
"""
from __future__ import annotations
import os
import re
import sys
import time
import pathlib
import urllib.parse
import urllib.request

SITE_ROOT = pathlib.Path(__file__).resolve().parent.parent
DEST_DIR = SITE_ROOT / "assets" / "img" / "blog"
URL_RX = re.compile(r"https://framerusercontent\.com/images/([^\"'\s)]+)")

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def extract_extension(filename: str) -> str:
    stem = filename.split("?", 1)[0]
    if "." in stem:
        return "." + stem.rsplit(".", 1)[1].lower()
    return ".png"


def normalize_local_name(raw_filename: str) -> str:
    # raw_filename = "HASH.png" or "HASH.png?width=…"
    stem = raw_filename.split("?", 1)[0]
    return stem  # e.g., "HrkQA7B6mdA7AKAkYfrHYG4KH8w.png"


def collect_urls() -> dict[str, str]:
    """Return {full_url_in_html: local_path}."""
    found: dict[str, str] = {}
    for path in SITE_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".css", ".js"}:
            continue
        if any(p in path.parts for p in ("_scripts", ".tmp-verify", "assets")):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for m in URL_RX.finditer(text):
            full = m.group(0)
            # de-entitize &amp; for the URL match
            clean = full.replace("&amp;", "&")
            local = normalize_local_name(m.group(1))
            found[clean] = local
            # also map the &amp; variant for find/replace later
            if "&" in full:
                found[full] = local
    return found


def download(url: str, target: pathlib.Path) -> bool:
    if target.exists() and target.stat().st_size > 0:
        return True
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        target.write_bytes(data)
        return True
    except Exception as e:
        print(f"  ! FAIL {url} -> {e}", file=sys.stderr)
        return False


def rewrite_files(url_to_local: dict[str, str]) -> int:
    changes = 0
    # Order longest URL first so that a query-string version is replaced
    # before its bare counterpart.
    pairs = sorted(url_to_local.items(), key=lambda kv: -len(kv[0]))
    for path in SITE_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".css", ".js"}:
            continue
        if any(p in path.parts for p in ("_scripts", ".tmp-verify", "assets")):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        original = text
        for full_url, local in pairs:
            local_path = f"/assets/img/blog/{local}"
            text = text.replace(full_url, local_path)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changes += 1
    return changes


def main() -> None:
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    url_to_local = collect_urls()
    print(f"Found {len(url_to_local)} URL variants -> {len(set(url_to_local.values()))} unique files")
    # Download each unique local name from its canonical URL (strip query)
    seen: dict[str, str] = {}
    for url, local in url_to_local.items():
        # use the cleaned canonical (no query) for fetching
        canon = url.split("?", 1)[0]
        seen[local] = canon
    ok = 0
    for i, (local, canon) in enumerate(sorted(seen.items()), 1):
        target = DEST_DIR / local
        print(f"  [{i}/{len(seen)}] {local} ", end="", flush=True)
        if download(canon, target):
            print(f"({target.stat().st_size} B)")
            ok += 1
        time.sleep(0.05)
    print(f"\nDownloaded {ok}/{len(seen)} files into {DEST_DIR}")
    changes = rewrite_files(url_to_local)
    print(f"Rewrote {changes} HTML/CSS/JS files")


if __name__ == "__main__":
    main()

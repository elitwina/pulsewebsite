#!/usr/bin/env python3
"""
Build / refresh the YouTube ID cache for Hot 100 snapshots.

For every track in assets/data/hot100-*.json, run a yt-dlp search and store
the resulting video ID in assets/data/youtube-cache.json, keyed by the
Pulse API's track _id. Tracks already in the cache are skipped, so re-runs
after a chart refresh only hit yt-dlp for new entries.

Usage:
    python3 scripts/build_yt_cache.py            # all snapshots
    python3 scripts/build_yt_cache.py il us      # only listed country codes
"""

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from glob import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "data")
CACHE_PATH = os.path.join(DATA_DIR, "youtube-cache.json")

# Light politeness delay so we don't hammer YouTube.
DELAY_SEC = 0.25
# Per-search timeout - yt-dlp normally returns in 2-5s.
TIMEOUT_SEC = 25


def load_cache():
    if not os.path.exists(CACHE_PATH):
        return {"version": 1, "updatedAt": None, "tracks": {}}
    with open(CACHE_PATH, "r", encoding="utf-8") as f:
        cache = json.load(f)
    cache.setdefault("tracks", {})
    return cache


def save_cache(cache):
    cache["updatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    tmp = CACHE_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    os.replace(tmp, CACHE_PATH)


def normalize_query(track, artist):
    """Strip noisy bits so YouTube search is more accurate."""
    q = f"{track} {artist}".strip()
    # collapse whitespace + drop common in-title noise
    q = re.sub(r"\s+", " ", q)
    return q


def yt_search(query):
    """Return the first YouTube video ID for the query, or None."""
    try:
        out = subprocess.run(
            [
                "yt-dlp",
                f"ytsearch1:{query}",
                "--print", "id",
                "--no-download",
                "--no-warnings",
                "--no-update",
                "--skip-download",
                "--default-search", "ytsearch",
                "--socket-timeout", "10",
            ],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SEC,
        )
        if out.returncode != 0:
            return None
        for line in out.stdout.splitlines():
            line = line.strip()
            if re.fullmatch(r"[A-Za-z0-9_-]{11}", line):
                return line
        return None
    except subprocess.TimeoutExpired:
        return None
    except FileNotFoundError:
        print("ERROR: yt-dlp not found - install with: brew install yt-dlp", file=sys.stderr)
        sys.exit(1)


def snapshot_files(country_filter):
    pattern = os.path.join(DATA_DIR, "hot100-*.json")
    files = sorted(glob(pattern))
    if country_filter:
        wanted = {cc.lower() for cc in country_filter}
        files = [f for f in files if os.path.basename(f).replace("hot100-", "").replace(".json", "").lower() in wanted]
    return files


def main():
    country_filter = [a.strip().lower() for a in sys.argv[1:] if a.strip()]
    cache = load_cache()
    tracks_cache = cache["tracks"]

    files = snapshot_files(country_filter)
    if not files:
        print("No snapshots found in", DATA_DIR)
        sys.exit(1)

    total_lookups = 0
    total_skipped = 0
    total_failed = 0

    for fpath in files:
        cc = os.path.basename(fpath).replace("hot100-", "").replace(".json", "").upper()
        with open(fpath, "r", encoding="utf-8") as f:
            snap = json.load(f)
        items = snap.get("data") or []
        print(f"\n[{cc}] {len(items)} tracks")
        for i, t in enumerate(items, 1):
            tid = t.get("id")
            if not tid:
                continue
            if tid in tracks_cache and tracks_cache[tid].get("youtubeId"):
                total_skipped += 1
                continue
            track = (t.get("track") or "").strip()
            artist = (t.get("artist") or "").strip()
            if not track:
                continue
            q = normalize_query(track, artist)
            vid = yt_search(q)
            total_lookups += 1
            if vid:
                tracks_cache[tid] = {
                    "youtubeId": vid,
                    "track": track,
                    "artist": artist,
                    "cachedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                }
                print(f"  {i:>3}. {track[:40]:<40} {artist[:24]:<24} -> {vid}")
            else:
                total_failed += 1
                tracks_cache[tid] = {
                    "youtubeId": None,
                    "track": track,
                    "artist": artist,
                    "cachedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                    "failed": True,
                }
                print(f"  {i:>3}. {track[:40]:<40} {artist[:24]:<24} -> (no result)")
            # checkpoint every 10 lookups so a crash mid-run doesn't lose work
            if total_lookups % 10 == 0:
                save_cache(cache)
            time.sleep(DELAY_SEC)

    save_cache(cache)
    print(f"\nDone. lookups={total_lookups} skipped(cached)={total_skipped} failed={total_failed}")


if __name__ == "__main__":
    main()

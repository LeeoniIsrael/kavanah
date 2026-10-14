#!/usr/bin/env python3
"""Collect explicitly licensed Sefaria editions into a research cache, not the app.

Usage: python3 collect_sources.py /tmp/kavanah-prayer-research
Requires the index, works, schema, and version snapshots described in README.
Never treats a work-level license or an available heading as text approval.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import sys
import urllib.parse
import urllib.request

CACHE = Path(sys.argv[1])
LICENSES = {"Public Domain", "CC0", "CC-BY", "CC-BY-SA"}


def count(value):
    if isinstance(value, str):
        return int(bool(value.strip()))
    if isinstance(value, dict):
        return sum(map(count, value.values()))
    if isinstance(value, list):
        return sum(map(count, value))
    return 0


def collect(work):
    title = work["title"]
    versions = json.loads((CACHE / (title + ".versions.json")).read_text())
    result = {"work": title, "categories": work["categories"], "editions": [], "errors": []}
    for lang, folder in [("he", "Hebrew"), ("en", "English")]:
        candidates = [v for v in versions if v.get("actualLanguage", v.get("language")) == lang
                      and v.get("license") in LICENSES]
        # Do not silently substitute Chabad for Lita or an additions-only edition for a full work.
        candidates = [v for v in candidates if not (title == "Selichot Nusach Ashkenaz Lita"
                      and "Nusach Chabad" in v["versionTitle"])]
        for version in candidates:
            name = version["versionTitle"]
            rel = "/".join(work["categories"] + [title, folder, name + ".json"])
            url = "https://storage.googleapis.com/sefaria-export/json/" + urllib.parse.quote(rel, safe="/")
            filename = hashlib.sha256((title + lang + name).encode()).hexdigest()[:20] + ".json"
            target = CACHE / "exports" / filename
            try:
                if target.exists():
                    raw = target.read_bytes()
                else:
                    with urllib.request.urlopen(url, timeout=35) as response:
                        raw = response.read()
                data = json.loads(raw)
                if data.get("title") != title or data.get("versionTitle") != name:
                    raise ValueError("Export identity does not match requested edition")
                if data.get("license") not in LICENSES:
                    raise ValueError("Export has missing or different non-permitted license")
                if data.get("actualLanguage", data.get("language")) != lang:
                    raise ValueError("Export language mismatch")
                # Store compactly to avoid inflating research artifacts with whitespace.
                compact = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
                target.write_text(compact)
                result["editions"].append({"language": lang, "versionTitle": name,
                    "license": data["license"], "versionSource": data.get("versionSource"),
                    "exportUrl": url, "cacheFile": filename,
                    "nonemptySegments": count(data.get("text")),
                    "sha256": hashlib.sha256(compact.encode()).hexdigest()})
            except Exception as error:
                result["errors"].append({"language": lang, "versionTitle": name,
                    "exportUrl": url, "error": str(error)})
    print(title, len(result["editions"]), "editions", len(result["errors"]), "errors", flush=True)
    return result


if __name__ == "__main__":
    (CACHE / "exports").mkdir(exist_ok=True)
    works = json.loads((CACHE / "works.json").read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(collect, works))
    (CACHE / "export-manifest.json").write_text(json.dumps(results, ensure_ascii=False, indent=2))

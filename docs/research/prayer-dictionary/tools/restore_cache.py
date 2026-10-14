#!/usr/bin/env python3
"""Restore the original source cache from committed snapshots for offline reproduction."""
import gzip
import json
from pathlib import Path
import sys

DATA, CACHE = map(Path, sys.argv[1:3])
CACHE.mkdir(parents=True, exist_ok=True)
(CACHE / "exports").mkdir(exist_ok=True)
snapshots = json.load(gzip.open(DATA / "source-schemas-and-versions.json.gz", "rt"))
editions = json.loads((DATA / "editions.json").read_text())
manifest, works = [], []
for title, data in snapshots.items():
    for kind in ["schema", "versions"]:
        (CACHE / (title + "." + kind + ".json")).write_text(json.dumps(data[kind], ensure_ascii=False))
    categories = data["schema"]["categories"]
    works.append({"title": title, "categories": categories})
    manifest.append({"work": title, "categories": categories,
        "editions": [e for e in editions if e["work"] == title], "errors": []})
for line in gzip.open(DATA / "source-editions.jsonl.gz", "rt"):
    source = json.loads(line)
    edition = next(e for e in editions if e["work"] == source["title"]
                   and e["versionTitle"] == source["versionTitle"]
                   and e["language"] == source.get("actualLanguage", source["language"]))
    (CACHE / "exports" / edition["cacheFile"]).write_text(line.rstrip("\n"))
responses = json.load(gzip.open(DATA / "psalm-source-responses.json.gz", "rt"))
(CACHE / "psalms.json").write_text(json.dumps(responses["bilingual"], ensure_ascii=False))
(CACHE / "psalms-accented.json").write_text(json.dumps(responses["accented"], ensure_ascii=False))
(CACHE / "works.json").write_text(json.dumps(works, ensure_ascii=False))
# Preserve initial retrieval errors as recorded in the work report.
reports = {w['work']: w for w in json.loads((DATA / 'work-coverage.json').read_text())}
for item in manifest:
    item['errors'] = reports[item['work']]['retrievalErrors']
(CACHE / "export-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False))
print("Restored", len(manifest), "work snapshots and pinned Psalm sources.")

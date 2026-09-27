#!/usr/bin/env python3
"""Read a research entry by exact ID/reference, or search titles. Not an app runtime loader."""
import gzip
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
query = " ".join(sys.argv[1:]).strip()
if not query:
    raise SystemExit('Usage: python3 tools/read_entry.py "exact ID, reference, or search words"')
matches = []
for line in gzip.open(root / "data/liturgy-corpus.jsonl.gz", "rt"):
    entry = json.loads(line)
    if query in [entry["id"], entry["ref"]]:
        print(json.dumps(entry, ensure_ascii=False, indent=2))
        raise SystemExit(0)
    if query.casefold() in entry["ref"].casefold():
        matches.append({"id": entry["id"], "ref": entry["ref"], "sourceUrl": entry["sourceUrl"]})
print(json.dumps(matches, ensure_ascii=False, indent=2))

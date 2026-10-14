#!/usr/bin/env python3
"""Check source fidelity and completeness claims, not religious or linguistic correctness."""
import collections
import gzip
import hashlib
import json
from pathlib import Path
import sys

DATA = Path(sys.argv[1])
psalms = json.loads((DATA / "psalms.json").read_text())
records = [json.loads(line) for line in gzip.open(DATA / "liturgy-corpus.jsonl.gz", "rt")]
editions = {e["id"]: e for e in json.loads((DATA / "editions.json").read_text())}
assert len(psalms) == 150 and [p["number"] for p in psalms] == list(range(1, 151))
assert sum(len(p["verses"]) for p in psalms) == 2527
sources = json.load(gzip.open(DATA / "psalm-source-responses.json.gz", "rt"))
he = next(v for v in sources["bilingual"]["versions"] if v["language"] == "he")
en = next(v for v in sources["bilingual"]["versions"] if v["language"] == "en")
accent = sources["accented"]["versions"][0]
assert he["versionTitle"] == "Tanach with Nikkud"
assert en["versionTitle"] == "The Holy Scriptures: A New Translation (JPS 1917)"
assert accent["versionTitle"] == "Tanach with Ta'amei Hamikra"
assert all(v["license"] == "Public Domain" for v in [he, en, accent])
for p in psalms:
    n = p["number"] - 1
    assert len(p["verses"]) == len(he["text"][n]) == len(en["text"][n]) == len(accent["text"][n])
    for i, v in enumerate(p["verses"]):
        assert v["verse"] == i + 1
        assert v["hebrew"] == he["text"][n][i]
        assert v["hebrewAccented"] == accent["text"][n][i]
        assert v["englishSourceText"] == en["text"][n][i]
        assert v["transliteration"] and v["transliterationStatus"] == "machine-draft-unreviewed"
    assert p["approval"] is None and p["publicationStatus"] == "blocked-pending-review"
assert len({r["id"] for r in records}) == len(records)
assert len({r["ref"] for r in records}) == len(records)
assert all(r["approval"] is None and r["publicationStatus"] == "blocked-pending-review" for r in records)
raw_by_id = {}
for line in gzip.open(DATA / "source-editions.jsonl.gz", "rt"):
    raw = line.rstrip("\n")
    digest = hashlib.sha256(raw.encode()).hexdigest()
    assert digest[:20] in editions
    assert editions[digest[:20]]["sha256"] == digest
    raw_by_id[digest[:20]] = json.loads(raw)


def at(value, keys, numbers):
    for key in keys:
        value = value[key]
    for number in numbers:
        value = value[number - 1]
    return value


for r in records:
    for lang in ["hebrew", "english"]:
        item = r[lang]
        if not item:
            continue
        assert item["editionId"] in editions
        raw = raw_by_id[item["editionId"]]
        for s in item["segments"]:
            expected = at(raw["text"], r["exportKeys"], r["numberedSection"] + s["address"])
            assert expected == s["sourceText"], (r["ref"], lang, s["address"])

paths = collections.defaultdict(set)
for r in records:
    paths[r["work"]].add(tuple(r["exportKeys"]))


def leaf_paths(value, path=()):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from leaf_paths(child, path + (key,))
    elif isinstance(value, list):
        yield path, value


def nonempty(value):
    return bool(value.strip()) if isinstance(value, str) else any(map(nonempty, value)) if isinstance(value, list) else False


unmapped = []
for raw in raw_by_id.values():
    for keys, value in leaf_paths(raw["text"]):
        if nonempty(value) and keys not in paths[raw["title"]]:
            unmapped.append({"work": raw["title"], "edition": raw["versionTitle"], "path": keys})
assert not unmapped, unmapped
(DATA / "unmapped-export-paths.json").write_text("[]\n")

biblical = json.loads((DATA / "biblical-prayers.json").read_text())
assert len(biblical) == 37 and all(p["sourceMatched"] for p in biblical)
for p in biblical:
    assert {v["versionTitle"] for v in p["versions"]} == {
        "Tanach with Ta'amei Hamikra", "The Holy Scriptures: A New Translation (JPS 1917)"}
    assert all(v["license"] == "Public Domain" for v in p["versions"])
    identity = [{k: v.get(k) for k in ["versionTitle", "language", "license", "versionSource", "text"]} for v in p["versions"]]
    assert hashlib.sha256(json.dumps(identity, ensure_ascii=False, sort_keys=True).encode()).hexdigest() == p["snapshotSha256"]
    assert p["approval"] is None
assert json.loads((DATA / "approved-manifest.json").read_text())["entries"] == []
report = {"status": "passed", "psalms": 150, "verses": 2527, "psalmSourceTextFidelity": "exact",
    "psalmPronunciationDrafts": 2527, "liturgySections": len(records),
    "liturgySourceTextFidelity": "exact for every selected raw segment",
    "unmappedNonemptyExportPaths": 0, "biblicalPassages": 37,
    "duplicateIds": 0, "duplicateRefs": 0, "approvedEntries": 0,
    "notVerified": ["independent linguistic correctness", "all English-Hebrew alignment", "liturgical completeness and suitability of each section", "cantor or rabbinic approval", "all Jewish traditions or all digital archives"]}
(DATA / "verification-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))

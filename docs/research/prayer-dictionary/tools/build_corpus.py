#!/usr/bin/env python3
"""Build a non-production research corpus from pinned source snapshots.

python3 build_corpus.py CACHE OUTPUT_DIRECTORY
No app files or approval flags are modified. Texts remain edition-specific.
"""
import csv
import gzip
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import urllib.parse

CACHE = Path(sys.argv[1])
OUT = Path(sys.argv[2])
DATE = "2026-09-27"


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.hidden_depth = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if self.hidden_depth:
            if tag not in {"br", "hr", "img", "wbr", "input", "meta", "link"}:
                self.hidden_depth += 1
        elif tag == "sup" or (tag == "i" and "footnote" in values.get("class", "")):
            self.hidden_depth = 1
        elif tag in {"br", "p", "div"}:
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag in {"br", "hr", "img", "wbr", "input", "meta", "link"}:
            return
        if self.hidden_depth:
            self.hidden_depth -= 1
        elif tag in {"p", "div"}:
            self.parts.append(" ")

    def handle_data(self, data):
        if not self.hidden_depth:
            self.parts.append(data)


def clean(raw):
    parser = PlainText()
    parser.feed(raw)
    return re.sub(r"\s+", " ", html.unescape("".join(parser.parts))).strip()


def flatten(value, address=()):
    if isinstance(value, str):
        yield {"address": list(address), "sourceText": value, "text": clean(value)}
    elif isinstance(value, list):
        for i, child in enumerate(value, 1):
            yield from flatten(child, address + (i,))


def text_at(data, keys, numbers=()):
    for key in keys:
        if not isinstance(data, dict):
            return []
        data = data.get(key, data.get("", []) if key == "default" else [])
    for number in numbers:
        if not isinstance(data, list) or number > len(data):
            return []
        data = data[number - 1]
    return data


def count(value):
    return sum(bool(x["text"]) for x in flatten(value))


def title(node, lang):
    return html.unescape(next((x["text"] for x in node.get("titles", [])
                 if x.get("lang") == lang and x.get("primary")), node.get("key", "") if lang == "en" else ""))


def leaves(node, keys=(), names=(), export_keys=()):
    if node.get("nodes"):
        for child in node["nodes"]:
            yield from leaves(child, keys + (child["key"],),
                              names + (() if child.get("default") else (title(child, "en"),)),
                              export_keys + ("" if child.get("default") else title(child, "en"),))
    else:
        yield node, keys, names, export_keys


RULES = [
    ("health", r"healing|sick|illness|refu|asher yatzar|medic|health"),
    ("wellness", r"neshama|soul|comfort|distress|anxiety|yatzar"),
    ("opportunity", r"success|livelihood|business|parnass|prosper|blessing of the year"),
    ("provision", r"livelihood|parnass|prosper|\byear\b|\brain\b|\bdew\b|manna|sustenance"),
    ("gratitude", r"thank|modim|hodaa|modeh ani|nishmat|hagomel|hoda'"),
    ("protection", r"protect|rescue|deliver|salvation|captiv|danger"),
    ("travel", r"travel|journey|haderech|wayfar"),
    ("sleep", r"bedtime|hamapil|retiring|sleep"),
    ("repentance", r"repent|confess|vidui|selich|forgive|tachanun|al chet|ashamnu|tashlich"),
    ("grief", r"mourner|mourning|yizkor|memorial|funeral|burial|dead|death|kinnot|tisha|yabbok"),
    ("family", r"children|child|marriage|wedding|bride|groom|wife|husband|family|shelah"),
    ("fertility", r"birth|pregnan|fertil|concep"),
    ("learning", r"torah|study|learning|hadran|siyum|beit midrash|talmud"),
    ("wisdom", r"wisdom|knowledge|understanding"),
    ("justice", r"justice|judg|righteous"),
    ("peace", r"peace|shalom|shlom"),
    ("community", r"congregation|community|israel|nation|country|state|government"),
    ("jerusalem", r"jerusalem|zion"),
    ("shabbat", r"shabbat|shabbos|sabbath|havdalah|havdala|lekha dodi|shalom aleichem"),
    ("festivals", r"festival|hashana|kippur|sukkot|sukkos|shavu|pesach|passover|haggadah|chanuk|hanuk|purim|omer|hoshana|simchat"),
    ("nature", r"nature|rainbow|thunder|lightning|fragrance|sun|moon|levan|hamah|perek shirah|dew|rain"),
    ("food", r"food|bread|wine|fruit|hamazon|nefashot|mezonot|shehakol|hamotzi|after meals|birkat hamazon"),
    ("ritual", r"tefillin|tallit|tzitzit|mezuz|mikv|washing|netilat|immersion|circumcision|pidyon"),
    ("devotion", r"yichud|tikkun|kedush|kaddish|praise|adon olam|yigdal|yab[b]?ok|chakhamim"),
    ("daily", r"weekday|shacharit|mincha|maariv|arvit|arising|morning|evening"),
]


def buckets(ref):
    return [key for key, pattern in RULES if re.search(pattern, ref, re.I)] or ["general"]


def tradition(work):
    if "Edot" in work:
        return "edot-hamizrach"
    if "Chabad" in work:
        return "chabad"
    if "Sefard" in work:
        return "nusach-sefard"
    if "Polin" in work:
        return "ashkenaz-polin"
    if "Lita" in work:
        return "ashkenaz-lita"
    if "Ashkenaz" in work:
        return "ashkenaz"
    return "requires-edition-specific-identification"


def choose(editions, keys, numbers, lang):
    candidates = []
    for metadata, payload in editions:
        if metadata["language"] != lang:
            continue
        data = text_at(payload["text"], keys, numbers)
        n = count(data)
        if n:
            candidates.append((n, metadata, data))
    if not candidates:
        return None
    # Largest nonempty section in ONE edition. Never stitch prayer wording between editions.
    _, metadata, data = max(candidates, key=lambda x: x[0])
    return {"editionId": metadata["sha256"][:20], "segments": list(flatten(data)),
            "selectionMethod": "most nonempty source segments within this section; editorial review pending"}


def reading(raw):
    changes = []
    def replace(match):
        oral = " ".join(re.findall(r"\[([^\]]+)\]", match[2]))
        changes.append({"ketiv": match[1], "qere": oral})
        return oral + (" " if match[2].endswith(" ") else "")
    result = re.sub(r"([\u05d0-\u05ea\u05f3\u05f4־]+)\s*((?:\[[^\]]+\]\s*)+)", replace, raw)
    return result, changes


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    works = json.loads((CACHE / "export-manifest.json").read_text())
    records, editions, work_report, snapshots = [], [], [], {}
    for work in works:
        name = work["work"]
        schema = json.loads((CACHE / (name + ".schema.json")).read_text())
        versions = json.loads((CACHE / (name + ".versions.json")).read_text())
        snapshots[name] = {"schema": schema, "versions": versions}
        loaded = [(m, json.loads((CACHE / "exports" / m["cacheFile"]).read_text()))
                  for m in work["editions"]]
        for meta, payload in loaded:
            editions.append({**meta, "id": meta["sha256"][:20], "work": name,
                "retrievedAt": DATE, "rightsStatus": "reusable-license-reported-by-source",
                "credit": payload.get("versionNotes") or payload.get("versionTitle"),
                "licenseVersion": "not-specified-in-source-metadata" if meta["license"].startswith("CC-BY") else None})
        start = len(records)
        seen_refs = {}
        for node, keys, names, export_keys in leaves(schema["schema"]):
            base_ref = ", ".join((name,) + names)
            depth = node.get("depth", 1)
            # Numeric chapters are separate candidates; paragraph/word arrays are kept inside them.
            size = max([len(text_at(p["text"], export_keys)) for m, p in loaded
                        if isinstance(text_at(p["text"], export_keys), list)] + [0])
            if depth > 1:
                size = max(size, (node.get("lengths") or [0])[0])
            numbers_list = [(i,) for i in range(1, size + 1)] if depth > 1 and size else [()]
            for numbers in numbers_list:
                ref = base_ref + ("." + ".".join(map(str, numbers)) if numbers else "")
                if ref in seen_refs:
                    previous = seen_refs[ref]
                    assert previous["exportKeys"] == list(export_keys) and previous["numberedSection"] == list(numbers), ref
                    previous["schemaOccurrences"] += 1
                    continue
                he = choose(loaded, export_keys, numbers, "he")
                en = choose(loaded, export_keys, numbers, "en")
                record = {"id": "lit-" + hashlib.sha256(ref.encode()).hexdigest()[:16],
                    "ref": ref, "sourceUrl": "https://www.sefaria.org/" + urllib.parse.quote(ref.replace(" ", "_")),
                    "work": name, "path": list(names), "sourceKeys": list(keys), "exportKeys": list(export_keys),
                    "numberedSection": list(numbers), "title": names[-1] if names else name,
                    "hebrewTitle": title(node, "he"), "tradition": tradition(name),
                    "originalLanguageReview": "pending; Hebrew-source editions may contain Aramaic and other languages",
                    "kind": "source-section-candidate", "buckets": buckets(ref),
                    "bucketBasis": "editorial-title-rule; not a documented ritual prescription",
                    "hebrew": he, "english": en,
                    "alignmentStatus": "unreviewed" if he and en else "missing-language",
                    "contentStatus": "source-section-imported" if he or en else "reference-only",
                    "liturgicalCompleteness": "not-certified; may include rubrics, variants, study or prose",
                    "publicationStatus": "blocked-pending-review", "approval": None, "schemaOccurrences": 1}
                records.append(record)
                seen_refs[ref] = record
        subset = records[start:]
        work_report.append({"work": name, "tradition": tradition(name), "sections": len(subset),
            "withHebrew": sum(bool(x["hebrew"]) for x in subset),
            "withEnglish": sum(bool(x["english"]) for x in subset),
            "withBoth": sum(bool(x["hebrew"] and x["english"]) for x in subset),
            "retrievalErrors": work["errors"]})
    psalm_source = json.loads((CACHE / "psalms.json").read_text())
    accent_source = json.loads((CACHE / "psalms-accented.json").read_text())
    source_versions = psalm_source["versions"] + accent_source["versions"]
    for version in source_versions:
        editions.append({"id": "psalms-" + digest(version)[:12], "work": "Psalms",
            "versionTitle": version["versionTitle"], "language": version["language"],
            "license": version["license"], "versionSource": version.get("versionSource"),
            "sourceUrl": "https://www.sefaria.org/Psalms", "retrievedAt": DATE,
            "sha256": digest(version), "rightsStatus": "public-domain-reported-by-source"})
    he_v = next(x for x in psalm_source["versions"] if x["language"] == "he")
    en_v = next(x for x in psalm_source["versions"] if x["language"] == "en")
    accent_v = accent_source["versions"][0]
    themes = list(csv.DictReader((OUT / "psalm-themes.tsv").open(), delimiter="\t"))
    healing = [20,6,9,13,16,17,18,22,23,28,30,31,32,33,37,38,39,41,49,55,56,69,86,88,89,90,91,102,103,104,107,116,118,142,143,148]
    short = [20,30,121,130,142]
    psalms = []
    assert len(he_v["text"]) == len(en_v["text"]) == len(accent_v["text"]) == len(themes) == 150
    for i in range(150):
        he, en, accent = he_v["text"][i], en_v["text"][i], accent_v["text"][i]
        assert len(he) == len(en) == len(accent), f"Verse mismatch in Psalm {i+1}"
        verses = []
        for j, (h, e, a) in enumerate(zip(he, en, accent), 1):
            oral, qere = reading(a)
            verses.append({"verse": j, "hebrew": h, "hebrewAccented": a,
                "readingHebrew": oral, "qereTransformations": qere,
                "english": clean(e), "englishSourceText": e,
                "transliteration": None, "transliterationStatus": "pending-generation"})
        tags = themes[i]["buckets"].split(",")
        customs = []
        if i+1 in healing:
            customs.append({"collection": "chabad-healing-36", "bucket": "health",
                "sourceUrl": "https://www.chabad.org/library/article_cdo/aid/1228223/jewish/Psalms-and-Jewish-Prayer-for-Healing.htm"})
        if i+1 in short:
            customs.append({"collection": "chabad-visiting-sick-short-5", "bucket": "health",
                "sourceUrl": "https://www.chabad.org/library/article_cdo/aid/6873805/jewish/WhatYou-Need-to-Know-About-Visiting-the-Sick.htm"})
        if customs and "health" not in tags:
            tags.append("health")
        psalms.append({"id": f"psalm-{i+1:03}", "number": i+1, "ref": f"Psalms.{i+1}",
            "sourceUrl": f"https://www.sefaria.org/Psalms.{i+1}", "title": f"Psalm {i+1}",
            "theme": themes[i]["theme"], "buckets": tags,
            "themeBasis": "editorial reading of the Psalm; no promised outcome",
            "documentedUses": customs, "verses": verses,
            "hebrewEditionId": "psalms-" + digest(he_v)[:12],
            "englishEditionId": "psalms-" + digest(en_v)[:12],
            "accentedEditionId": "psalms-" + digest(accent_v)[:12],
            "textStatus": "complete-chapter-source-matched; no independent rabbinic certification",
            "publicationStatus": "blocked-pending-review", "approval": None})
    save("editions.json", editions)
    save("work-coverage.json", work_report)
    save("psalms.json", psalms)
    with gzip.open(OUT / "liturgy-corpus.jsonl.gz", "wt", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False, separators=(",", ":")) + "\n")
    with gzip.open(OUT / "source-schemas-and-versions.json.gz", "wt", encoding="utf-8") as f:
        json.dump(snapshots, f, ensure_ascii=False, separators=(",", ":"))
    # Store all reusable raw exports in one compressed audit artifact.
    with gzip.open(OUT / "source-editions.jsonl.gz", "wt", encoding="utf-8") as f:
        for w in works:
            for m in w["editions"]:
                f.write((CACHE / "exports" / m["cacheFile"]).read_text() + "\n")
    with gzip.open(OUT / "psalm-source-responses.json.gz", "wt", encoding="utf-8") as f:
        json.dump({"bilingual": psalm_source, "accented": accent_source}, f, ensure_ascii=False)
    save("approved-manifest.json", {"schemaVersion": 1, "status": "research-only",
        "reason": "No exact rendered Hebrew, English, pronunciation, or usage approval is evidenced by this research.",
        "entries": []})
    summary = {"retrievedAt": DATE, "liturgyWorks": len(works), "sourceSectionCandidates": len(records),
        "sourceEditionsIncludingPsalms": len(editions), "psalms": len(psalms),
        "psalmVerses": sum(len(p["verses"]) for p in psalms),
        "sectionsWithHebrew": sum(bool(r["hebrew"]) for r in records),
        "sectionsWithEnglish": sum(bool(r["english"]) for r in records),
        "sectionsWithBoth": sum(bool(r["hebrew"] and r["english"]) for r in records),
        "approvedEntries": 0}
    save("coverage-summary.json", summary)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

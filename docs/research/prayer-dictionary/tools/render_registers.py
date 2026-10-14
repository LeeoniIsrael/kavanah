#!/usr/bin/env python3
"""Readable research registers; no app publication side effects."""
import collections
import gzip
import json
from pathlib import Path
import sys

ROOT = Path(sys.argv[1])
DATA = ROOT / "data"
psalms = json.loads((DATA / "psalms.json").read_text())
records = [json.loads(line) for line in gzip.open(DATA / "liturgy-corpus.jsonl.gz", "rt")]
editions = {x["id"]: x for x in json.loads((DATA / "editions.json").read_text())}


def esc(text):
    return str(text).replace("|", "\\|").replace("\n", " ")


def count(record, lang):
    return sum(bool(x["text"]) for x in record[lang]["segments"]) if record[lang] else 0


def write(name, parts):
    (ROOT / name).write_text("\n".join(line.rstrip() for line in "\n".join(parts).splitlines()) + "\n")


parts = ["# Complete 150-Psalm register", "", "Every chapter and verse is in `data/psalms.json`. Read the full trilingual draft in `PSALMS-READER.md`.", "", "Themes are editorial descriptions of content, not promises of effects. Documented healing uses have separate source attribution in the data. All pronunciation is a machine draft pending review.", "", "| Psalm | Verses | Theme | Buckets | Pronunciation drafts |", "|---|---:|---|---|---:|"]
for p in psalms:
    parts.append(f"| [{p['number']}]({p['sourceUrl']}) | {len(p['verses'])} | {esc(p['theme'])} | {', '.join(p['buckets'])} | {sum(bool(v['transliteration']) for v in p['verses'])}/{len(p['verses'])} |")
write("PSALM-REGISTER.md", parts)

parts = ["# Psalms: full Hebrew, English, and pronunciation drafts", "", "All 150 chapters. Hebrew and English are preserved from the pinned source editions; pronunciation is machine-generated and unreviewed. These are not approved app entries. See TRANSLITERATION.md for the sound guide and limitations.", "", "Hebrew: Tanach with Nikkud, citing tanach.us (source reports Public Domain). Pronunciation input: Tanach with Ta'amei Hamikra, same source. English: The Holy Scriptures: A New Translation (JPS 1917), source reports Public Domain. Original language, numbering and superscriptions are retained. Separate source qere forms inform the pronunciation."]
for p in psalms:
    parts += ["", f"## Psalm {p['number']} — {p['theme']}", "", f"[Source]({p['sourceUrl']}) · Buckets: {', '.join(p['buckets'])}"]
    for v in p["verses"]:
        parts += ["", f"### {p['number']}:{v['verse']}", "", v["hebrew"], "", f"**Pronunciation draft:** {v['transliteration'] or '[withheld; requires manual pronunciation]'}", "", v["english"]]
        if v["qereTransformations"]:
            parts += ["", "Reading note: " + "; ".join(f"written {x['ketiv']} → read {x['qere']}" for x in v["qereTransformations"]) + ". Original source spelling above is unchanged."]
write("PSALMS-READER.md", parts)

parts = ["# Liturgy source-section register", "", "All captured schema sections and numbered divisions. These are not a count of distinct prayers. Repeated services, prose, instructions, variants and study material remain in the research inventory. H/E counts indicate nonempty source segments, not certified completeness or alignment. A zero means no text imported in the selected reusable editions, not that no text exists anywhere.", "", "Full source text and pronunciation drafts are in `data/liturgy-corpus.jsonl.gz`; `tools/read_entry.py` opens an entry by ID or exact reference. Every record is blocked pending review."]
for work, group in __import__('itertools').groupby(records, key=lambda x: x["work"]):
    parts += ["", "## " + work, "", "| ID | Section/reference | Buckets | H / E segments |", "|---|---|---|---:|"]
    for r in group:
        parts.append(f"| `{r['id']}` | [{esc(r['ref'])}]({r['sourceUrl']}) | {', '.join(r['buckets'])} | {count(r,'hebrew')} / {count(r,'english')} |")
write("LITURGY-REGISTER.md", parts)

buckets = collections.defaultdict(list)
for p in psalms:
    for bucket in p["buckets"]:
        buckets[bucket].append((f"Psalm {p['number']}: {p['theme']}", p["sourceUrl"], "complete source chapter; pronunciation draft"))
for r in records:
    for bucket in r["buckets"]:
        buckets[bucket].append((r["ref"], r["sourceUrl"], f"H/E segments {count(r,'hebrew')}/{count(r,'english')}; unreviewed"))
parts = ["# Need-based bucket index", "", "All Psalm themes and all rule-tagged liturgy source sections. The same record may appear in several buckets. Liturgy tags come from source-heading rules and need editorial review before they may drive app recommendations. A heading may be a collection or instructional passage. This is discovery inventory, not an approved prayer menu."]
for bucket in ["health", "wellness", "opportunity", "provision"] + sorted(set(buckets) - {"health", "wellness", "opportunity", "provision"}):
    parts += ["", f"## {bucket} ({len(buckets[bucket])} source records)", ""]
    parts.extend(f"- [{esc(name)}]({url}) — {status}." for name, url, status in buckets[bucket])
write("BUCKET-INDEX.md", parts)

parts = ["# Edition credits and rights record", "", "Source materials retain their provider-reported licenses. No license is asserted over public-domain originals. Source-based pronunciation and normalized renderings are adaptations and retain applicable source-license requirements, including ShareAlike where applicable. New editorial research prose and indexing contributions in this package are offered under CC0; that does not relicense the imported texts or their adaptations.", "", "For each edition, the raw snapshot preserves original metadata. The following inventory credits titles, translators/authors named by the source and source links. Some API license labels do not specify a license version; do not invent one or claim that production rights review is complete.", "", "License references: [CC0](https://creativecommons.org/publicdomain/zero/1.0/), [Creative Commons licenses](https://creativecommons.org/share-your-work/cclicenses/). Confirm the particular BY/BY-SA license and required notices against the edition's source before app release."]
for e in editions.values():
    parts += ["", f"## {e['id']} — {e['work']}", "", f"- Edition: {e['versionTitle']}", f"- Language: {e['language']}", f"- Reported license: {e['license']}", f"- Source: {e.get('versionSource') or e.get('sourceUrl')}", f"- Retrieved: {e['retrievedAt']}", f"- SHA-256: `{e['sha256']}`"]
    if e.get("exportUrl"):
        parts += [f"- [Exact export]({e['exportUrl']})"]
    if e.get("credit") and e["credit"] != e["versionTitle"]:
        parts += [f"- Source credit/notes: {e['credit']}"]
write("ATTRIBUTION.md", parts)

parts = ["# Selected biblical prayer passages beyond Psalms", "", "These 37 passages have edition-pinned Hebrew and JPS 1917 English in `data/biblical-prayers.json`. Some include narrative framing; they must not automatically be published as complete standalone prayers. The selection does not claim to enumerate every biblical prayer.", "", "| Passage | Description | Buckets | Retrieved |", "|---|---|---|---|"]
for r in json.loads((DATA / "biblical-prayers.json").read_text()):
    parts.append(f"| [{r['ref']}]({r['sourceUrl']}) | {r['title']} | {', '.join(r['buckets'])} | {r['sourceMatched']} |")
write("BIBLICAL-REGISTER.md", parts)

parts = ["# Work-by-work coverage", "", "Counts describe imported source sections, not certified distinct prayers. Hebrew/English counts include partial sections, instructions and variants. Rights-unknown editions were not imported. Exact versions and initial URL failures are retained in the structured data.", "", "| Work | Source sections | Hebrew | English | Both |", "|---|---:|---:|---:|---:|"]
for r in json.loads((DATA / "work-coverage.json").read_text()):
    parts.append(f"| {r['work']} | {r['sections']} | {r['withHebrew']} | {r['withEnglish']} | {r['withBoth']} |")
write("WORK-COVERAGE.md", parts)

examples = [
    ("health", "Siddur Ashkenaz, Weekday, Shacharit, Amidah, Healing"),
    ("health", "Siddur Ashkenaz, Shabbat, Shacharit, Torah Reading, Reading from Sefer, Mi Sheberach, For Sickness (includes man and woman)"),
    ("health", "Siddur Edot HaMizrach, Assorted Blessings and Prayers, Prayer for Taking Medicine"),
    ("health / gratitude", "Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Asher Yatzar"),
    ("wellness", "Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Elokai Neshama"),
    ("gratitude", "Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Modeh Ani"),
    ("opportunity / wisdom", "Siddur Ashkenaz, Weekday, Shacharit, Amidah, Knowledge"),
    ("opportunity / provision", "Siddur Ashkenaz, Weekday, Shacharit, Amidah, Prosperity"),
    ("opportunity / provision", "Siddur Sefard, Various Prayers & Segulot, Prayer for Livelihood"),
    ("family", "Siddur Sefard, Various Prayers & Segulot, Prayer of the Shelah"),
    ("travel", "Siddur Edot HaMizrach, Assorted Blessings and Prayers, Traveler's Prayer"),
    ("sleep", "Siddur Ashkenaz, Weekday, Maariv, Keri'at Shema al Hamita"),
    ("devotion", "Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Shema"),
    ("repentance", "Siddur Ashkenaz, Weekday, Shacharit, Amidah, Forgiveness"),
    ("peace", "Siddur Ashkenaz, Weekday, Shacharit, Amidah, Peace"),
]
parts = ["# Priority prayer text review packet", "", "Fifteen requested/useful source sections, with actual imported text. All are unapproved research candidates. Hebrew and English are shown in separate sequences because paragraph alignment has not been reviewed. Source instructions and variant wording may still appear: do not read every source segment as prayer. Pronunciation is machine-generated. Missing English is stated rather than invented."]
for bucket, ref in examples:
    r = next((x for x in records if x["ref"] == ref), None)
    assert r, f"Missing priority reference: {ref}"
    parts += ["", f"## {r['title']} — {bucket}", "", f"[{r['ref']}]({r['sourceUrl']}) · `{r['id']}`"]
    if r["hebrew"]:
        e = editions[r["hebrew"]["editionId"]]
        parts += ["", f"Hebrew edition: **{e['versionTitle']}**; {e['license']}.", "", "### Hebrew source and pronunciation drafts"]
        for s in r["hebrew"]["segments"]:
            if s["text"]:
                parts += ["", f"**Source segment {'.'.join(map(str,s['address']))}**", "", s["text"], "", "Pronunciation draft: " + (s.get("transliterationDraft", {}).get("text") or "[withheld; manual review needed]")]
    parts += ["", "### English source"]
    if r["english"]:
        e = editions[r["english"]["editionId"]]
        parts += ["", f"English edition: **{e['versionTitle']}**; {e['license']}."]
        parts.extend("\n" + f"**Source segment {'.'.join(map(str,s['address']))}:** " + s["text"] for s in r["english"]["segments"] if s["text"])
    else:
        parts += ["", "No English imported for this exact section in a selected reusable edition. Commission or locate a correctly licensed translation, then review it; do not use a summary as the translation."]
write("PRIORITY-PRAYERS.md", parts)
print("Rendered registers, full Psalm reader, attribution, and priority prayer packet.")

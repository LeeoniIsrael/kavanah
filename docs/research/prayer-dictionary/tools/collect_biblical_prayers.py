#!/usr/bin/env python3
"""Supplementary biblical prayer passages, edition-pinned; not a complete Bible prayer index."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import sys
import urllib.parse
import urllib.request

DEST = Path(sys.argv[1])
PASSAGES = [
    ("Genesis 24:12-14", "Abraham's servant asks for guidance", "wisdom,opportunity,relationships"),
    ("Genesis 28:20-22", "Jacob's vow on his journey", "travel,provision"),
    ("Genesis 32:10-13", "Jacob asks for deliverance", "protection,family"),
    ("Exodus 15:1-19", "Song at the Sea", "gratitude,protection"),
    ("Exodus 15:20-21", "Miriam leads a song of praise", "gratitude"),
    ("Exodus 32:11-13", "Moses intercedes for Israel", "repentance,community"),
    ("Exodus 34:6-7", "Thirteen Attributes source passage", "repentance"),
    ("Numbers 6:24-26", "Priestly Blessing source verses", "peace,family,protection"),
    ("Numbers 10:35-36", "Verses when the ark sets out and rests", "protection,community"),
    ("Numbers 12:13", "Moses asks for Miriam's healing", "health"),
    ("Deuteronomy 3:23-25", "Moses asks to enter the land", "hope"),
    ("Deuteronomy 6:4-9", "Shema and Ve'ahavta: first biblical paragraph", "devotion,learning"),
    ("Deuteronomy 11:13-21", "Vehayah im shamoa: second biblical paragraph", "devotion,learning"),
    ("Numbers 15:37-41", "Vayomer: third biblical paragraph", "devotion,ritual"),
    ("Deuteronomy 26:13-15", "Declaration after tithing and appeal for blessing", "provision,ritual"),
    ("I Samuel 1:10-11", "Hannah's petition", "fertility,family"),
    ("I Samuel 2:1-10", "Hannah's prayer of thanksgiving", "gratitude,justice"),
    ("II Samuel 7:18-29", "David's prayer concerning his house", "family,community"),
    ("II Samuel 22", "David's song of deliverance", "gratitude,protection"),
    ("I Kings 3:6-9", "Solomon asks for discernment", "wisdom,justice"),
    ("I Kings 8:22-53", "Solomon's Temple dedication prayer", "community,repentance"),
    ("I Kings 18:36-37", "Elijah's appeal at Carmel", "devotion"),
    ("II Kings 19:15-19", "Hezekiah asks for deliverance", "protection,community"),
    ("Isaiah 38:9-20", "Hezekiah's thanksgiving after illness", "health,gratitude"),
    ("Jeremiah 17:14", "Heal me and I shall be healed", "health"),
    ("Jeremiah 32:17-25", "Jeremiah's prayer amid siege", "hope,community"),
    ("Jonah 2:2-10", "Jonah's prayer from the depths", "hope,gratitude"),
    ("Habakkuk 3", "Habakkuk's prayer", "hope,provision"),
    ("Daniel 9:4-19", "Daniel's confession and supplication", "repentance,community"),
    ("Ezra 9:6-15", "Ezra's confession", "repentance,community"),
    ("Nehemiah 1:5-11", "Nehemiah's petition", "repentance,opportunity"),
    ("Nehemiah 9:5-37", "Communal praise and confession", "repentance,community"),
    ("I Chronicles 4:10", "Jabez's petition", "protection,opportunity"),
    ("I Chronicles 29:10-19", "David's blessing and petition", "gratitude,community"),
    ("II Chronicles 20:6-12", "Jehoshaphat's communal petition", "protection,community"),
    ("Proverbs 30:7-9", "A request for truthfulness and sufficient provision", "provision,wisdom"),
    ("Job 42:1-6", "Job's response", "repentance,wisdom"),
]


def get(entry):
    ref, title, buckets = entry
    url = "https://www.sefaria.org/api/v3/texts/" + urllib.parse.quote(ref) + "?" + urllib.parse.urlencode([
        ("version", "hebrew|Tanach with Ta'amei Hamikra"),
        ("version", "english|The Holy Scriptures: A New Translation (JPS 1917)")])
    result = {"ref": ref, "title": title, "buckets": buckets.split(","), "apiUrl": url,
              "sourceUrl": "https://www.sefaria.org/" + urllib.parse.quote(ref.replace(" ", "_")),
              "scope": "selected scriptural passage; includes narrative when present; not automatically a complete liturgical unit",
              "publicationStatus": "blocked-pending-review", "approval": None}
    try:
        payload = json.load(urllib.request.urlopen(url, timeout=35))
        versions = payload.get("versions", [])
        if len(versions) != 2 or any(v.get("license") != "Public Domain" for v in versions):
            raise ValueError("Missing pinned public-domain edition")
        result["returnedRef"] = payload["ref"]
        result["versions"] = versions
        result["sourceMatched"] = True
        # Hash text and edition identity, avoiding JSON number-format differences across Python/JS.
        identity = [{k: v.get(k) for k in ["versionTitle", "language", "license", "versionSource", "text"]} for v in versions]
        result["snapshotSha256"] = hashlib.sha256(json.dumps(identity, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
        result["hashScope"] = "versionTitle, language, license, versionSource, and exact text arrays"
    except Exception as error:
        result["sourceMatched"] = False
        result["error"] = str(error)
    return result


with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(get, PASSAGES))
DEST.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
print(len(results), "passages;", sum(x["sourceMatched"] for x in results), "retrieved")

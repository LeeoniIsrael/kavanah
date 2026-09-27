# Kavanah prayer dictionary research

**Start with [RESEARCH.md](RESEARCH.md), the [bucket index](BUCKET-INDEX.md), and the [Codex implementation prompt](CODEX-IMPLEMENTATION-PROMPT.md).**

This package gives Kavanah a large, traceable research foundation for a pronunciation-first prayer dictionary. It contains actual source text as well as lists. It does **not** establish that every recorded Jewish prayer has been found, that every source section is a complete prayer, or that machine-generated pronunciation has been reviewed by a cantor.

## Coverage

| Measure | Count |
|---|---:|
| Complete Psalms | 150 |
| Psalm verses with Hebrew / JPS 1917 English | 2,527 |
| Liturgy works audited | 46 |
| Distinct source-section references | 3,009 |
| Liturgical sections with imported Hebrew | 2,224 |
| Liturgical sections with imported English | 1,374 |
| Liturgical sections with both | 1,315 |
| Retrieved liturgical/Psalm editions | 83 |
| Additional biblical passages | 37 |
| Approved production entries | 0 |

All Hebrew and English source segments were compared against the retained selected-edition snapshots. For Psalms, all three source versions have matching chapter/verse structure. These checks establish source fidelity and stated structural coverage; they do not establish independent linguistic or rabbinic approval.

No application runtime or active dictionary was changed. The user requested the research and an implementation prompt; the prompt describes the later replacement. The production approval manifest is empty because this work has no evidence of exact-text approval for all three renderings. It must not be used to erase the current app catalog.

## Read the results

| File | Contents |
|---|---|
| [RESEARCH.md](RESEARCH.md) | Findings, source methodology, detailed prayer-family checklist, category definitions, source hierarchy, tradition gaps and review requirements. |
| [BUCKET-INDEX.md](BUCKET-INDEX.md) | Every imported source-section candidate and Psalm organized by need-based tags, including health, wellness, opportunity and provision. Tags are research aids, pending editorial review. |
| [PSALM-REGISTER.md](PSALM-REGISTER.md) | Every Psalm, 1–150, with a theme, verse count, categories and source link. |
| [PSALMS-READER.md](PSALMS-READER.md) | Full pointed Hebrew, JPS 1917 English and simple pronunciation drafts for all 2,527 verses. Written/read differences are noted. |
| [LITURGY-REGISTER.md](LITURGY-REGISTER.md) | Every captured liturgy section, exact source reference, stable research ID, category tags and available Hebrew/English segment counts. |
| [WORK-COVERAGE.md](WORK-COVERAGE.md) | A compact coverage table for all 46 liturgical works. |
| [PRIORITY-PRAYERS.md](PRIORITY-PRAYERS.md) | Actual source text and pronunciation drafts for 15 priority sections: healing, medicine, bodily gratitude, renewal, wisdom, livelihood, parenting, travel, bedtime, Shema, forgiveness and peace. Missing English is explicitly identified. |
| [BIBLICAL-REGISTER.md](BIBLICAL-REGISTER.md) | 37 additional biblical prayer/blessing passages, with source references. |
| [TRANSLITERATION.md](TRANSLITERATION.md) | The beginner pronunciation convention, engine limitations and detailed review method. |
| [ATTRIBUTION.md](ATTRIBUTION.md) | Exact edition credits, provider-reported licenses, source URLs and hashes. |
| [CODEX-IMPLEMENTATION-PROMPT.md](CODEX-IMPLEMENTATION-PROMPT.md) | Copy-ready instructions for an approved-only dictionary, migration, cache/search/assistant enforcement and verification. |

Example of the intended pronunciation style: **sh’MAH yis-rah-EL, ah-doh-NAI eh-loh-HEY-noo, ah-doh-NAI eh-KHAHD.** This illustrates the first verse, not a complete Shema record. Generated drafts use the explicit schema and still require editorial correction to reach this quality consistently.

## Structured files

- `data/psalms.json`: all Psalm verses, exact Hebrew/English source strings, accented Hebrew, reading variants, categories, named documented healing uses and pronunciation drafts.
- `data/liturgy-corpus.jsonl.gz`: one JSON object per source-section candidate. Hebrew and English editions are tracked separately. The selected source strings, normalized display text and any pronunciation draft are retained.
- `data/biblical-prayers.json`: pinned Hebrew/English versions and pronunciation drafts for the 37 supplementary passages; some contain narrative context.
- `data/editions.json`: 83 selected/retrieved edition records, including the three Psalm versions. Additional biblical editions are recorded inside the corresponding passage records.
- `data/work-coverage.json`: counts and initial retrieval failures by work.
- `data/coverage-summary.json`, `data/transliteration-report.json`, `data/verification-report.json`: exact generated counts and verification scope.
- `data/psalm-themes.tsv`: all 150 original editorial theme descriptions and tags.
- `data/source-editions.jsonl.gz`, `data/source-schemas-and-versions.json.gz`, `data/psalm-source-responses.json.gz`: compact audit snapshots. These preserve source evidence and are not app-bundle input.
- `data/unmapped-export-paths.json`: zero unmapped nonempty dictionary paths after the coverage audit.
- `data/approved-manifest.json`: the empty publication allowlist; do not populate it by inference.

Research status is intentionally explicit. “Source matched” means that text can be traced to a particular retrieved edition. “Machine draft” means pronunciation is not independently verified. “Reference only” means an indexed heading lacks imported usable text. `H/E 3/0` does not mean a complete prayer exists in English; it means three nonempty Hebrew source segments and no imported English segments. Equal counts do not prove translation alignment.

## Reproduce or inspect

The tools use Python's standard library and the pinned Node package `hebrew-transliteration@2.10.1`. Do not change the app's dependencies to use these research utilities. No dependency directory is committed.

From this package directory:

```sh
python3 tools/verify.py data
python3 tools/read_entry.py "Prayer for Livelihood"
python3 tools/read_entry.py "Siddur Ashkenaz, Weekday, Shacharit, Amidah, Healing"
```

To restore the original source cache and regenerate into a **new local output directory**:

```sh
python3 tools/restore_cache.py data /tmp/kavanah-research-source-cache
mkdir -p /tmp/kavanah-research-regenerated/data
cp data/psalm-themes.tsv data/biblical-prayers.json /tmp/kavanah-research-regenerated/data/
python3 tools/build_corpus.py /tmp/kavanah-research-source-cache /tmp/kavanah-research-regenerated/data
npm install --prefix /tmp/kavanah-research-tools --ignore-scripts --no-audit --no-fund --package-lock=false hebrew-transliteration@2.10.1
node tools/transliterate.mjs /tmp/kavanah-research-regenerated/data /tmp/kavanah-research-tools/node_modules
python3 tools/render_registers.py /tmp/kavanah-research-regenerated
python3 tools/verify.py /tmp/kavanah-research-regenerated/data
```

Snapshot reproduction is offline except for installing the explicitly pinned pronunciation tool. `collect_sources.py` is a separate network refresh utility for an existing source cache, not a way to approve content. `collect_biblical_prayers.py` explicitly requests the named biblical editions. Regenerated timestamps/serialization and engine-run cache counters may differ; compare actual source records and content hashes rather than gzip container bytes.

## Remaining work before replacing the dictionary

Select production editions and pronunciation profiles; review original text, English alignment, pronunciation and ritual context; resolve remaining rights and credit details; complete missing languages; verify the app rendering; and approve exact content hashes. Expand the identified community and archive gaps if “all traditions” is the intended scope.

The attached prompt enforces that process and then removes everything outside the resulting approved catalog from the app's active prayer surfaces. It preserves user history and research archives, and blocks deletion when no approved replacement exists.

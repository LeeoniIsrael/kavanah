# Prompt for Codex: implement Kavanah's approved prayer dictionary

Paste the following into a Kavanah development chat after making this research package available. The research can be imported into review tooling now; publishing requires an actual populated approval manifest.

---

Implement a large, pronunciation-first, **approved-only prayer dictionary** in Kavanah using `docs/research/prayer-dictionary/`. Read the repository's `AGENTS.md`, `docs/design-system.md`, the package README, `RESEARCH.md`, `TRANSLITERATION.md`, and the generated coverage reports first. Preserve existing user changes.

The package is a research corpus. It is not evidence that every entry is approved. Use **only exact records in `data/approved-manifest.json` whose content hashes and all required review fields validate** as publishable prayers. The manifest currently has no approved entries. Build the import, review, validation and replacement workflow without inventing approvals. If it remains empty, stop the production cutover and give a precise report of what must be reviewed; do not erase the working dictionary or publish an empty replacement.

## Intended app behavior

After an approved catalog exists and the migration passes validation, replace the active prayer dictionary with that allowlist. Remove all other prayers from every user-facing discovery and retrieval path. Users should receive only prayer texts actually contained in the approved catalog. A missing prayer should produce a clear unavailable result, not an invented prayer, incomplete text, runtime translation or transliteration, or an external result presented as approved.

The dictionary must support health, wellness, opportunity/work, livelihood, gratitude, protection, travel, sleep, repentance, mourning, family, relationships, children, fertility/birth, learning, wisdom, justice, peace, community/Israel, Shabbat, festivals, food, nature, ritual and devotional categories. Use many-to-many tags. Keep a distinction between a documented traditional use and an editorial thematic association. Do not infer that a Psalm guarantees a desired outcome.

Make simple pronunciation the primary reading mode, with Hebrew and the verified English readily available. Use reviewed syllable breaks, plain characters and capitalized stressed syllables according to the pronunciation guide. Avoid academic-only glyphs, long stretched vowels and chant-like spellings. Add optional reviewed audio only when rights and version matching are documented. Accessibility and dynamic text sizes must work across all three renderings.

## Import and identity

- Import the research into a separate review catalog. Do not bundle raw research snapshots into the production app or mark all source-backed entries approved.
- Maintain separate IDs for prayer families, full prayer texts, excerpts, editions, traditions, pronunciation profiles, segments and ordered collections. A service containing many prayers is a collection. Linear word segments are not separate prayers. Preserve local customs rather than combining their wording.
- Psalms 1–150 are complete chapter records using Jewish/Hebrew verse numbering. A selected verse is an explicitly identified excerpt. Keep superscriptions and all verses. Preserve the original ketiv and the reviewed spoken qere separately.
- Shema's opening verse is not the complete Shema. Ashrei is not just Psalm 145 without its liturgical framing. Hallel is not a single interchangeable text: full/abridged and blessings vary. Bedtime Shema is an ordered sequence. Amidah blessings must retain their service context and conditional inserts.
- Do not count Torah readings, commentary, legal instructions, ketubah prose or study passages as standalone prayers without a deliberate classification decision. Preserve them as source material when appropriate.
- Retain exact source URLs, edition titles, original-language metadata, translator/author credits, rights evidence and snapshot hashes for every language. A reusable license and a schema heading do not prove textual completeness or religious approval.
- Translate only when explicitly authorized in a separate content workflow. Do not fill missing English with `summary` or `useCase`. Existing `hydratePrayerFromSefaria` currently has a summary fallback; that must not survive as a purported translation in the approved-only system.
- Do not create a Hebrew original for an Aramaic, Yiddish, Ladino, Ge'ez, Judeo-Arabic or English prayer. Distinguish textual rite from pronunciation tradition; Nusach Sefard and Edot HaMizrach are distinct.

## Approval contract

Require independent records for Hebrew/original-text review, English review and alignment, pronunciation review, completeness, usage/variant review, and applicable rights. The approval must name the reviewer or approving authority, date, edition, pronunciation profile and hash of the exact published content. Do not use the old Hebrew-only approval as approval of English or transliteration. Never invent reviewers, dates, endorsements or licenses.

Review placeholders, gender and number, Divine Names, niqqud, Aramaic, minyan/leader/congregation roles, calendar and geography, weekday/Shabbat/holiday variants, optional passages and instructions. Preserve instructions outside the text to be spoken. An amendment to text, translation, pronunciation or a material recitation condition invalidates the relevant approval and removes the changed version from publication until reapproved.

For rights-unclear or missing languages, keep the research record blocked. For machine pronunciation drafts, keep `machine-draft-unreviewed` until actual review. Do not auto-upgrade entries merely because a script succeeds or all three string fields are nonempty.

## Replace every active dictionary path

Audit at least `src/data/corePrayers.ts`, `src/data/generatedLiturgyIndex.json`, `src/data/prayerReviewCatalog.ts`, `src/data/siddurOrder.json`, `src/services/prayerService.ts`, `src/services/prayerAvailability.ts`, prayer search/grouping/focus and conversation-context services, stores, shortcuts, recommendations, reminders, deep links, backend catalog generation, the assistant API, and tests. Inspect current code rather than assuming these are the only paths.

The approved catalog must be the single authority for bundled data, offline reading, search, related prayers, service navigation, deep-link resolution, assistant suggestions and all backend retrieval. Remove or gate the live Sefaria fallback from published discovery. External-source research can remain in review tooling, clearly distinct from approved app content.

The assistant may select approved IDs and explain approved metadata; it must not generate prayer wording or rewrite Hebrew/English/pronunciation. Resolve selected IDs against the server-side allowlist and return only stored content. Reject unknown IDs and content hashes even if a model requests them. Do not rely solely on a prompt to enforce the restriction.

Version and migrate caches, including `prayers.core.v2`, `prayers.remote.v1`, and `prayers.sefaria-index.v1` or their current replacements. Reject stale cached records outside the new manifest. Validate membership at every read path, not only at sync time. Ensure old core-array fallback, remote hydration, fuzzy search, external indexes and deep links cannot reintroduce removed content.

“Remove everything else” applies to the **active prayer dictionary**. Preserve source/review archives in development and preserve user favorites, history, completion records and notes. Migrate stable IDs where there is a reviewed equivalent. Otherwise retain a tombstone/unavailable reference without exposing an unapproved prayer. Do not delete user history to simplify migration.

Use an atomic catalog-version switch after preflight verification. Keep a recoverable previous snapshot. No half-migrated state should combine old and new prayer content.

## Validation and completion

Before enabling the replacement, produce a report showing published distinct prayer families, exact text variants, full Psalms, collection completeness, traditions, pronunciation profiles, language coverage, blocked records and missing review items. Do not advertise all Jewish prayers or universal coverage.

Verify:

1. Every published record is allowlisted and has current valid content hashes and required approvals.
2. Every published prayer has complete, aligned original/Hebrew, English and reviewed simple pronunciation, except explicitly supported original-language cases where transliteration is not applicable.
3. The selected approved Tehillim collection contains chapters 1–150 and all required verse records; qere and superscriptions are preserved.
4. Every category, service and collection resolves only approved IDs in the intended order. No source-only heading is offered as a recitable prayer.
5. Search, assistant, offline cache, reminders, recommendations, shortcuts, favorites, history and deep links cannot reveal removed entries or invent missing text.
6. Missing English is not replaced with a summary, missing Hebrew is not generated, and pronunciation is not generated on the device or by the assistant.
7. Stale caches and deliberately malformed/unknown IDs fail closed. The empty-manifest case blocks cutover safely.
8. Rights attribution is visible and accurately reflects each edition; ShareAlike material is handled according to its applicable terms.
9. Hebrew RTL, mixed-direction punctuation, English, pronunciation emphasis, selection/copy behavior, dynamic text size, screen-reader order, scroll clearance, dark/light contrast and any reduced-motion behavior work in the live iOS preview.

Follow the repository's development-session startup rules before launching Expo or a simulator: identify and gracefully stop the prior Kavanah session, then run one server and one native target and verify that the app loads. Report checkout, URL/port and device. Do not silently preview an older commit.

Run appropriate type, data-integrity, service, backend and UI checks. Commit every intended project change while preserving unrelated work. Keep `core.hooksPath=.githooks`, push to `origin` on the current branch, and verify zero commits ahead of upstream. Report any failure clearly. Provide the final catalog counts, remaining content limitations, verification results and commit/push status.

---

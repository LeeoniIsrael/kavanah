# App integration — September 27, 2026

The owner requested that the research replace the app dictionary. The published set has **560 entries: 150 complete Psalms, 376 prayer-book source sections, and 34 selected biblical passages**. Entries are not necessarily distinct prayers. The source research covers more candidates than the app can responsibly display with all three requested text forms.

Publication does not imply cantor, rabbinic, or independent translation approval. Every entry retains pending review. Pronunciation is labeled as a machine draft in both readers. The research approval manifest remains empty; the owner's request authorizes publication, not a fictitious expert signature.

## Import rule

`npm run prayers:import` deterministically builds the offline app corpus, index, and siddur order from the retained snapshots. Every imported recitation segment requires captured Hebrew, captured English at matching source addresses, and a nonempty pronunciation draft. Exact addresses are a structural check, not a claim of semantic alignment. The import report records every exclusion.

Unpointed small-print blocks are separated as prayer-book instructions and receive no recitation pronunciation. One explicit Shema instruction (segment 9, which quotes pointed words) is classified by its actual content. Fully pointed small-print recitations such as Barukh Shem remain recitations. Entries with unresolved mixed directions, partial translation, or unmatched addresses stay excluded as whole sections. No missing language is filled with a summary or an AI translation. Three biblical candidates also fail the pronunciation/alignment gate.

Psalm Hebrew and English match the captured source strings verse for verse. Display pronunciation removes invisible joining controls and normalizes whitespace. Source credits, license labels, and edition URLs are retained separately for Hebrew and English. Provider-reported reusable licensing is recorded without claiming independent rights certification.

## Runtime boundary

`src/data/researchPrayers.json` supplies search, direct reading, the Siddur provider, and offline lookup. The former bundled approximations are replaced. Cached core prayers, remote-search results, remote hydration, Siddur book/section caches, and cached Siddur search cannot add or replace published content. Legacy history, annotations, bookmarks, and catalog identities remain recoverable; removed texts cannot open as another prayer.

The Siddur lists only books with published sections and explicitly calls them selected sections. It is not a complete ritual service. Unavailable traditions are not silently represented as covered. The previous live source-fetch path is removed. Captured English and the pronunciation draft are used as-is even when the interface language differs.

The assistant endpoint resolves the catalog ID against the server's bundled corpus and rejects unknown IDs. It supplies canonical source context to the model and instructs it to explain only that entry, not compose prayers or recommend outside texts. As with any generated explanation, the response is not an expert-reviewed prayer text.

## Backend migration

`npm run backend:catalog` generates `202609270001_research_catalog.sql`. It marks historical catalog entries inactive, publishes only the new set, replaces the quotable passage pool, and enforces active membership for new completions/posts. Existing sessions and activity are preserved. The migration is transactional and is tested against PostgreSQL via PGlite.

The mobile catalog works entirely offline. A pushed migration file does not mean a hosted Supabase database has applied it, nor does a pushed API file prove the hosted assistant has deployed it. Those deployment states must be verified separately.

## Validation

Catalog tests compare all 150 Psalms and every verse to the research snapshot, verify membership consistency and attribution, check complete Shema paragraph presence and instruction separation, and reject forged or stale cached records. Siddur tests verify that every available leaf resolves to the same canonical text without network access. Reader tests cover explicit completion, close, bookmarks, and details. TypeScript and targeted lint pass.

The wider unit suite has pre-existing React Native module-loading failures in several store suites, and the wider UI suite has Worklets/Lucide test-environment failures. Targeted tests for this change are run independently. Native preview details and final verification are reported in the task response.

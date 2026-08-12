import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { corePrayers } from "../src/data/corePrayers";
import type { HebrewContentKind } from "../src/types/prayer";

const output = resolve(process.cwd(), "docs/rabbinic-hebrew-review.md");
const counts = corePrayers.reduce<Record<HebrewContentKind, number>>(
  (result, prayer) => ({ ...result, [prayer.hebrewReview.contentKind]: result[prayer.hebrewReview.contentKind] + 1 }),
  { complete: 0, excerpt: 0, collection: 0, missing: 0, "remote-unreviewed": 0 }
);

const sections = corePrayers.map((prayer, index) => {
  const review = prayer.hebrewReview;
  const hebrew = prayer.tokens.map((token) => token.hebrew.trim()).filter(Boolean);
  return [
    `## ${index + 1}. ${prayer.title}`,
    "",
    `- **Catalog ID:** \`${prayer.id}\``,
    `- **Proposed tradition:** ${formatTradition(review.tradition)}`,
    `- **Content state:** ${formatKind(review.contentKind)}`,
    `- **Candidate source:** ${review.sourceTitle}, ${review.sourceRef}`,
    `- **Source lookup:** [Open source record](${review.sourceUrl})`,
    `- **Editorial note:** ${review.notes ?? "No special note."}`,
    "",
    "### Hebrew candidate",
    "",
    hebrew.length > 0 ? hebrew.map((line) => `<div dir="rtl" lang="he">${line}</div>`).join("\n\n") : "**No Hebrew candidate is ready for approval.**",
    "",
    "### Rabbinic decision",
    "",
    "- [ ] Approve the Hebrew exactly as shown",
    "- [ ] Approve after corrections written below",
    "- [ ] Do not use this text",
    "- **Corrected Hebrew / notes:**",
    "",
    "  ____________________________________________________________________________",
    "",
    "  ____________________________________________________________________________",
    "",
    "- **Reviewer name:** ______________________________",
    "- **Date:** ____________________",
    ""
  ].join("\n");
});

const packet = [
  "# Kavanah Hebrew Prayer Review",
  "",
  "**Review scope:** Hebrew and Aramaic prayer text, prayer identity, proposed nusach/tradition, completeness, and ritual suitability. Translations and transliterations are intentionally excluded.",
  "",
  "## Important",
  "",
  "This packet is an editorial working document, not a claim that every entry is ready. Entries marked **Excerpt**, **Service collection**, or **Missing** must not be approved as complete prayers. They identify exactly where source preparation is still required.",
  "",
  "The initial baseline is common wording where broadly shared, Ashkenaz for service-dependent wording, scriptural Hebrew for biblical passages, and separately labeled modern Israeli communal prayers. The reviewer should flag every place where another nusach must be offered or where the wording is not universal.",
  "",
  "## Inventory",
  "",
  `- Complete candidates awaiting review: **${counts.complete}**`,
  `- Excerpts requiring completion: **${counts.excerpt}**`,
  `- Service collections requiring section-level treatment: **${counts.collection}**`,
  `- Entries with no Hebrew candidate: **${counts.missing}**`,
  `- Total catalog entries: **${corePrayers.length}**`,
  "",
  "## Review standard",
  "",
  "For each candidate, verify spelling, niqqud, punctuation, Divine Name representation, paragraph boundaries, omitted or optional passages, congregation/leader responses, singular/plural wording, gendered placeholders, weekday/Shabbat/holiday variants, and whether the proposed nusach label is accurate.",
  "",
  "Approval means the exact Hebrew shown may be bundled in Kavanah under the stated tradition. Corrections should preserve line boundaries where practical so translations and transliterations can later be aligned without altering the approved Hebrew.",
  "",
  ...sections
].join("\n");

writeFileSync(output, packet, "utf8");
console.log(`Wrote ${output}`);

function formatKind(kind: HebrewContentKind): string {
  if (kind === "complete") return "Complete candidate; rabbinic approval pending";
  if (kind === "excerpt") return "Excerpt; completion required before approval";
  if (kind === "collection") return "Service collection; section-level source plan required";
  if (kind === "missing") return "Missing; no candidate to approve";
  return "Remote and outside the review catalog";
}

function formatTradition(tradition: string): string {
  return tradition.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

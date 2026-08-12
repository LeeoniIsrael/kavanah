import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { corePrayers } from "../src/data/corePrayers";
import type { HebrewContentKind } from "../src/types/prayer";

const output = resolve(process.cwd(), "docs/rabbinic-hebrew-review.md");
const generated = JSON.parse(readFileSync(resolve(process.cwd(), "src/data/generatedHebrewCandidates.json"), "utf8")) as GeneratedCandidates;
const candidates = new Map(generated.candidates.map((candidate) => [candidate.id, candidate]));
const preparedIds = new Set([
  ...candidates.keys(),
  ...corePrayers.filter((prayer) => prayer.hebrewReview.contentKind === "complete").map((prayer) => prayer.id)
]);
const unsnapshottedComplete = corePrayers.filter(
  (prayer) => prayer.hebrewReview.contentKind === "complete" && !candidates.has(prayer.id)
).length;
const blockedCount = corePrayers.length - preparedIds.size;

const sections = corePrayers.map((prayer, index) => {
  const review = prayer.hebrewReview;
  const sourcedCandidate = candidates.get(prayer.id);
  const hebrew = sourcedCandidate?.hebrew ?? prayer.tokens.map((token) => token.hebrew.trim()).filter(Boolean);
  const candidateComplete = review.contentKind === "complete" || Boolean(sourcedCandidate);
  const sourceLines = sourcedCandidate
    ? sourcedCandidate.sources.map((source) => `${source.ref} — ${source.versionTitle}; license: ${source.license}`).join("<br />")
    : `${review.sourceTitle}, ${review.sourceRef}; license verification required`;
  return [
    `## ${index + 1}. ${prayer.title}`,
    "",
    `- **Catalog ID:** \`${prayer.id}\``,
    `- **Proposed tradition:** ${formatTradition(review.tradition)}`,
    `- **Content state:** ${sourcedCandidate ? "Source-backed candidate; rabbinic approval pending" : candidateComplete ? "Existing short candidate; source verification and rabbinic approval pending" : formatKind(review.contentKind)}`,
    `- **Candidate source and edition:** ${sourceLines}`,
    `- **Source snapshot retrieved:** ${sourcedCandidate ? generated.retrievedAt.slice(0, 10) : "Not yet"}`,
    `- **Editorial note:** ${review.notes ?? "No special note."}`,
    "",
    "### Hebrew candidate",
    "",
    hebrew.length > 0 ? hebrew.map((line) => `<div dir="rtl" lang="he">${line}</div>`).join("\n\n") : "**No Hebrew candidate is ready for approval.**",
    "",
    "### Rabbinic decision",
    "",
    candidateComplete ? "- [ ] Approve the Hebrew exactly as shown" : "- [ ] Candidate incomplete — approval is blocked",
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
  "This packet contains static source-backed candidates for individual prayers. Entries marked **Service collection** must not be approved as single prayers; Shacharit, Mincha, and Maariv require a separate section-level review.",
  "",
  "The initial baseline is common wording where broadly shared, Ashkenaz for service-dependent wording, scriptural Hebrew for biblical passages, and separately labeled modern Israeli communal prayers. The reviewer should flag every place where another nusach must be offered or where the wording is not universal.",
  "",
  "## Inventory",
  "",
  `- Source-backed individual candidates ready for review: **${candidates.size}**`,
  `- Complete candidates still awaiting a pinned source edition: **${unsnapshottedComplete}**`,
  `- Service collections excluded from single-prayer approval: **${blockedCount}**`,
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

type GeneratedCandidates = {
  retrievedAt: string;
  candidates: {
    id: string;
    hebrew: string[];
    sources: { ref: string; versionTitle: string; license: string; url: string }[];
  }[];
};

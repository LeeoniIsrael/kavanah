// Research pronunciation drafts. Never grants approval or changes Hebrew.
// node transliterate.mjs DATA_DIRECTORY RUNTIME_NODE_MODULES_DIRECTORY
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync, gunzipSync } from "node:zlib";

const [data, modules] = process.argv.slice(2);
const { transliterate } = await import(pathToFileURL(path.join(modules, "hebrew-transliteration/dist/index.js")));
const { sblSimple } = await import(pathToFileURL(path.join(modules, "hebrew-transliteration/dist/schemas/sblSimple.js")));
const schema = {
  ...sblSimple,
  QOF: "k", DAGESH_CHAZAQ: false, SYLLABLE_SEPARATOR: "-",
  DIVINE_NAME: "ah-doh-NAI", DIVINE_NAME_ELOHIM: "eh-loh-HEEM",
  VOCAL_SHEVA: "e", PATAH: "ah", QAMATS: "ah", HATAF_PATAH: "ah",
  SEGOL: "eh", HATAF_SEGOL: "eh", TSERE: "eh", HIRIQ: "ee",
  HOLAM: "oh", HOLAM_HASER: "oh", QUBUTS: "oo", QAMATS_QATAN: "oh",
  HATAF_QAMATS: "oh", HOLAM_VAV: "oh", SHUREQ: "oo", HIRIQ_YOD: "ee",
  TSERE_YOD: "ey", SEGOL_YOD: "ey", QAMATS_HE: "ah", SEGOL_HE: "eh",
  TSERE_HE: "eh", FURTIVE_PATAH: "ah", MS_SUFX: "ahv", MAQAF: " ",
};
let produced = 0, withheld = 0;
const cacheFile = path.join(modules, "..", "pronunciation-research-cache-v2.json");
const cache = new Map(fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : []);
const wordCache = new Map();

function draft(input) {
  if (cache.has(input)) return cache.get(input);
  const words = input.match(/[\u05d0-\u05ea][\u0591-\u05c7\u05d0-\u05ea]*/g) ?? [];
  const vocalized = words.filter(w => /[\u05b0-\u05bb\u05c7]/.test(w) || /ו[\u0591-\u05af]*ּ/.test(w) || /^יהוה$/.test(w));
  if (!words.length || vocalized.length / words.length < 0.85 || /[\[\]<>]/.test(input)) {
    withheld++;
    return { text: null, status: "withheld-insufficient-vowels-or-unresolved-editorial-markup" };
  }
  const accent = /[\u0591-\u05af]/.test(input) || /\u05bd[^\s]*\u05c3/.test(input);
  try {
    // Extraordinary dots and inverted-nun markers are manuscript signs, not spoken syllables.
    const speechInput = input.replace(/[\u05c4\u05c5]/g, "").replace(/\(?\u05c6\)?/g, "");
    // Token-level parsing avoids pathological memory/time growth on very long source paragraphs.
    // Hebrew maqqef-connected groups stay intact; whitespace is preserved.
    let result = speechInput.normalize("NFC").split(/(\s+)/).map(token => {
      if (!token.trim()) return token;
      if (wordCache.has(token)) return wordCache.get(token);
      if (token.length > 300) throw new Error("Unusually long unseparated source token");
      // A meteg-shaped mark in the final sof-pasuq group is silluq; other meteg is not main stress.
      const accentedToken = /[\u0591-\u05af]/.test(token) || /\u05bd[^\s]*\u05c3/.test(token);
      const value = transliterate(token, {
        ...schema,
        ...(accentedToken ? { STRESS_MARKER: { location: "before-syllable", mark: "~" } } : {}),
      });
      wordCache.set(token, value);
      return value;
    }).join("");
    result = result.replace(/~([^-\s]+)/g, (_, syl) => syl.toUpperCase());
    if (/[\u0590-\u05ff]/.test(result)) {
      withheld++;
      return { text: null, status: "withheld-unresolved-hebrew-characters" };
    }
    const value = { text: result, status: "machine-draft-unreviewed",
      stress: accent ? "machine-derived-from-cantillation; review-required" : "unmarked-no-cantillation",
      pronunciation: "modern-israeli-oriented-learning-aid", engine: "hebrew-transliteration@2.10.1",
      warning: "Not cantor-verified. Check sheva, qamats qatan, qere, word boundaries, Divine Names, Aramaic and instructions." };
    cache.set(input, value);
    produced++;
    return value;
  } catch (error) {
    withheld++;
    return { text: null, status: "withheld-parser-error", error: error.message };
  }
}

const psalmFile = path.join(data, "psalms.json");
const psalms = JSON.parse(fs.readFileSync(psalmFile, "utf8"));
for (const psalm of psalms) {
  for (const verse of psalm.verses) {
    const value = draft(verse.readingHebrew);
    verse.transliteration = value.text;
    verse.transliterationStatus = value.status;
    verse.pronunciationMetadata = value;
  }
}
fs.writeFileSync(psalmFile, JSON.stringify(psalms, null, 2) + "\n");
console.log("Psalms processed", produced, "unique drafts;", withheld, "withheld");
const corpusFile = path.join(data, "liturgy-corpus.jsonl.gz");
const corpus = gunzipSync(fs.readFileSync(corpusFile)).toString("utf8").trim().split("\n").map(JSON.parse);
let occurrenceCount = 0;
for (const [i, record] of corpus.entries()) {
  for (const segment of record.hebrew?.segments ?? []) {
    if (!segment.text) continue;
    const value = draft(segment.text);
    segment.transliterationDraft = value;
    if (value.text) occurrenceCount++;
  }
  if (i % 400 === 0) console.log("Source sections processed", i, "of", corpus.length);
}
fs.writeFileSync(corpusFile, gzipSync(corpus.map(r => JSON.stringify(r)).join("\n") + "\n"));
const biblicalFile = path.join(data, "biblical-prayers.json");
if (fs.existsSync(biblicalFile)) {
  const passages = JSON.parse(fs.readFileSync(biblicalFile, "utf8"));
  function flatten(value, address = []) {
    if (typeof value === "string") return [{ address, sourceText: value }];
    return Array.isArray(value) ? value.flatMap((v, i) => flatten(v, [...address, i + 1])) : [];
  }
  for (const passage of passages) {
    const hebrew = passage.versions?.find(v => v.language === "he");
    passage.pronunciationSegments = flatten(hebrew?.text).map(segment => {
      const changes = [];
      const readingHebrew = segment.sourceText.replace(/([\u05d0-\u05ea\u05f3\u05f4־]+)\s*((?:\[[^\]]+\]\s*)+)/g, (_, ketiv, qereGroups) => {
        const qere = [...qereGroups.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]).join(" ");
        changes.push({ ketiv, qere });
        return qere + (qereGroups.endsWith(" ") ? " " : "");
      });
      return { ...segment, readingHebrew, qereTransformations: changes, transliterationDraft: draft(readingHebrew) };
    });
  }
  fs.writeFileSync(biblicalFile, JSON.stringify(passages, null, 2) + "\n");
}
const report = { engine: "hebrew-transliteration@2.10.1", schema,
  newUniqueDraftsThisRun: produced, cachedUniqueDrafts: cache.size, withheldAttempts: withheld,
  liturgySegmentOccurrencesWithDraft: occurrenceCount,
  psalmVersesWithDraft: psalms.flatMap(p => p.verses).filter(v => v.transliteration).length,
  approvalStatus: "none; all machine drafts require review" };
fs.writeFileSync(path.join(data, "transliteration-report.json"), JSON.stringify(report, null, 2) + "\n");
fs.writeFileSync(cacheFile, JSON.stringify([...cache]));
console.log(JSON.stringify({ ...report, schema: undefined }, null, 2));

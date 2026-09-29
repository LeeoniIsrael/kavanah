import { corePrayers } from "@/data/corePrayers";
import { catalogPrayer, searchPrayers } from "@/services/prayerService";
import { prayerReadingGuide } from "@/data/prayerReadingGuide";
import { prayerTokenStep } from "@/data/prayerSteps";

const tefillin = catalogPrayer("tefillin")!;
test.each(["tefillin", "tefilin", "tfilin", "תפילין", "put on tefillin"])(
  "%s finds the whole practice first",
  (query) => {
    expect(searchPrayers(query)[0]?.prayer.id).toBe("tefillin");
  },
);
test("old tefillin bookmarks resolve to the full guide", () => {
  expect(catalogPrayer("tefillin-blessing")?.id).toBe("tefillin");
});
test("all Shema paragraphs retain exactly the catalog's three text fields", () => {
  const shema = catalogPrayer("shema")!;
  for (const n of [2, 3, 5, 6, 7, 8, 10]) {
    const original = shema.tokens.find((t) => t.id === `shema-${n}`)!;
    const included = tefillin.tokens.find(
      (t) => t.id === `tefillin-shema-${n}`,
    )!;
    expect([
      included.hebrew,
      included.translation,
      included.transliteration,
    ]).toEqual([
      original.hebrew,
      original.translation,
      original.transliteration,
    ]);
  }
  expect(tefillin.tokens.map((t) => t.id)).toEqual(
    [3, 5, 7, 8, 10, 12, 13]
      .map((n) => `tefillin-${n}`)
      .concat([2, 3, 5, 6, 7, 8, 10].map((n) => `tefillin-shema-${n}`)),
  );
});
test("ritual actions and conditional blessings remain explicit", () => {
  expect(tefillin.tokens.filter((t) => t.custom).map((t) => t.id)).toEqual([
    "tefillin-5",
    "tefillin-7",
  ]);
  expect(tefillin.tokens.every((t) => t.readingStep && t.sourceRef)).toBe(true);
  expect(prayerReadingGuide(tefillin).after).toContain("head tefillin first");
  expect(prayerReadingGuide(tefillin).before).toContain("Chol HaMoed");
});
test("Veahavta searches the full Shema, and bedtime keeps Hamapil", () => {
  expect(searchPrayers("vehafta")[0]?.prayer.id).toBe("shema");
  const bedtime = corePrayers.find(
    (p) =>
      p.id === "sefaria-siddur-ashkenaz-weekday-maariv-keri-at-shema-al-hamita",
  )!;
  expect(bedtime.title).toBe("Bedtime Shema");
  expect(prayerTokenStep(bedtime.tokens[1]!)?.title).toContain("Hamapil");
  expect(prayerReadingGuide(bedtime).before).toContain("separate from Maariv");
});

test("tefillin blessings and Exodus passages preserve the captured source exactly", () => {
  const fs = require("node:fs");
  const zlib = require("node:zlib");
  const corpus = zlib
    .gunzipSync(
      fs.readFileSync(
        "docs/research/prayer-dictionary/data/liturgy-corpus.jsonl.gz",
      ),
    )
    .toString("utf8");
  const source = corpus
    .split("\n")
    .filter(Boolean)
    .map((line: string) => JSON.parse(line))
    .find((row: any) => row.ref === tefillin.sefariaRef);
  for (const n of [3, 5, 7, 8, 10, 12, 13]) {
    const h = source.hebrew.segments.find((s: any) => s.address[0] === n);
    const e = source.english.segments.find((s: any) => s.address[0] === n);
    const t = tefillin.tokens.find((t) => t.id === `tefillin-${n}`)!;
    expect(t.hebrew).toBe(h.text);
    expect(t.translation).toBe(e.text);
    expect(t.transliteration).toBe(
      h.transliterationDraft.text
        .replace(/[\u200c\u200d]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    );
  }
});

test("related service fragments explain their scope and congregational setting", () => {
  const kaddish = corePrayers.find((p) => p.title === "Mourner's Kaddish")!;
  expect(prayerReadingGuide(kaddish).before).toContain("minyan");
  const amidah = corePrayers.find(
    (p) => p.sourceMetadata?.path.includes("Amidah") && p.title !== "Amidah",
  )!;
  expect(prayerReadingGuide(amidah).before).toContain("one section");
  const washing = catalogPrayer(
    "sefaria-siddur-ashkenaz-weekday-shacharit-preparatory-prayers-netilat-yadayim",
  )!;
  expect(prayerReadingGuide(washing).before).toContain("morning handwashing");
});

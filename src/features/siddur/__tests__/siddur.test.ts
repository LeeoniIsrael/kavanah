import { allowedLicense, candidateBooks, chooseVersions } from "../registry";
import {
  leafNodes,
  mapSegments,
  normalizeHebrewSearch,
  normalizeSchema,
} from "../sefaria";
import type { SiddurVersion, TextAnnotation } from "../model";
import { pageDirection, pageForRef, rulerTarget } from "../navigation";
const versions: SiddurVersion[] = [
  {
    language: "he",
    versionTitle: "Daat Siddur Ashkenaz",
    license: "Public Domain",
  },
  {
    language: "en",
    versionTitle: "Sefaria Community Translation",
    license: "CC0",
  },
  {
    language: "en",
    versionTitle: "The Standard Prayer Book, tr. by Simeon Singer, [1915]",
    license: "Public Domain",
  },
  {
    language: "en",
    versionTitle: "Commercial edition",
    license: "Copyrighted",
  },
];
test("normalizes nested Sefaria schema to stable canonical refs", () => {
  const nodes = normalizeSchema("Siddur Ashkenaz", {
    nodes: [
      {
        titles: [{ lang: "en", text: "Weekday", primary: true }],
        nodes: [
          {
            titles: [
              { lang: "en", text: "Modeh Ani", primary: true },
              { lang: "he", text: "מודה אני", primary: true },
            ],
            depth: 1,
          },
        ],
      },
    ],
  });
  expect(leafNodes(nodes)[0]).toMatchObject({
    ref: "Siddur Ashkenaz, Weekday, Modeh Ani",
    titleHe: "מודה אני",
  });
});
test("maps Hebrew and English to identical refs and retains untranslated Hebrew", () => {
  const segments = mapSegments(
    "Siddur Ashkenaz, Morning Blessings",
    ["א", "ב"],
    ["A"],
  );
  expect(segments.map((s) => s.ref)).toEqual([
    "Siddur Ashkenaz, Morning Blessings.1",
    "Siddur Ashkenaz, Morning Blessings.2",
  ]);
  expect(segments[1]).toMatchObject({ he: "ב", en: undefined });
});
test("allows only verified public domain or CC0 metadata", () => {
  expect(allowedLicense("CC-BY")).toBe(false);
  expect(allowedLicense("unknown")).toBe(false);
  expect(chooseVersions(versions).versions.en?.versionTitle).toBe(
    "Sefaria Community Translation",
  );
  expect(chooseVersions(versions).fallbackEnglish?.license).toBe(
    "Public Domain",
  );
});
test("normalizes Hebrew for search without changing display text", () => {
  expect(normalizeHebrewSearch("מוֹדֶה־אֲנִי")).toBe(
    normalizeHebrewSearch("מודה אני"),
  );
});
test("annotation anchors survive JSON storage without rectangles", () => {
  const a: TextAnnotation = {
    id: "1",
    siddurId: "Siddur Ashkenaz",
    versionKey: "Daat Siddur Ashkenaz",
    language: "he",
    startSegmentId: "ref.1",
    startOffset: 2,
    endSegmentId: "ref.1",
    endOffset: 5,
    selectedText: "תפילה",
    type: "highlight",
    createdAt: 1,
    updatedAt: 1,
  };
  expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  expect(JSON.stringify(a)).not.toContain("rect");
});
test("catalog keeps rite and scope separate", () => {
  expect(
    candidateBooks.find((b) => b.id === "Machzor Yom Kippur Sefard"),
  ).toMatchObject({ rite: "SEFARD", scope: "MACHZOR" });
});

test("bookmark restoration follows canonical ref after repagination", () => {
  const segments = mapSegments("Section", ["א", "ב", "ג"], ["A", "B", "C"]);
  expect(
    pageForRef([[segments[0]!], [segments[1]!, segments[2]!]], "Section.2"),
  ).toBe(1);
});
test("ruler release uses exact drag target and no velocity", () => {
  expect(rulerTarget(10, -25, 100)).toBe(12);
  expect(rulerTarget(10, -25, 100)).toBe(12);
  expect(rulerTarget(0, 100, 100)).toBe(0);
});
test("Hebrew page progression mirrors English", () => {
  expect(pageDirection("en", -50)).toBe(1);
  expect(pageDirection("he", -50)).toBe(-1);
});

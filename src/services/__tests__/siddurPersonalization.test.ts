import { fitsDailyView, preferredSiddurBook, siddurEntries } from "../siddur";
import type { LiturgyIndexEntry } from "@/types/prayer";

const sample = (title: string): LiturgyIndexEntry => ({
  id: title, title, hebrewTitle: "", ref: title, work: "", categories: [],
  path: [], tradition: "common", aliases: [], tags: [], summary: "", useCase: "",
  sourceVersion: null, translationVersions: [],
});

describe("personalized siddur defaults", () => {
  it("routes each familiar community description to an indexed prayer book", () => {
    const pairs = [
      ["european", "Siddur Ashkenaz"],
      ["hasidic", "Siddur Sefard"],
      ["mediterranean", "Siddur Edot HaMizrach"],
    ] as const;
    for (const [community, book] of pairs) {
      expect(preferredSiddurBook({ audience: "man", community })).toBe(book);
      expect(siddurEntries(book).length).toBeGreaterThan(0);
    }
    expect(preferredSiddurBook({ audience: "woman", community: "unsure" })).toBeNull();
  });
  it("keeps common text in both daily views while omitting tefillin from the woman's default", () => {
    expect(fitsDailyView(sample("Shema"), { audience: "woman", community: "european" })).toBe(true);
    expect(fitsDailyView(sample("Tefillin Blessing"), { audience: "woman", community: "european" })).toBe(false);
    expect(fitsDailyView(sample("Tefillin Blessing"), { audience: "man", community: "european" })).toBe(true);
  });
});

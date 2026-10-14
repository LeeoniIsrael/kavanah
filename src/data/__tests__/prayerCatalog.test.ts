import { corePrayers } from "@/data/corePrayers";
import index from "@/data/generatedLiturgyIndex.json";
import psalms from "../../../docs/research/prayer-dictionary/data/psalms.json";

describe("published research catalog", () => {
  it("uses one membership list and never asserts expert approval", () => {
    expect(corePrayers.length).toBeGreaterThan(500);
    expect(new Set(corePrayers.map(p => p.id)).size).toBe(corePrayers.length);
    expect(index.entries.map(p => p.id)).toEqual(corePrayers.map(p => p.id));
    for (const prayer of corePrayers) {
      expect(prayer.research?.id).toBeTruthy();
      expect(prayer.hebrewReview.status).toBe("pending");
      expect(prayer.sourceMetadata?.sourceVersion?.license).toMatch(/Public Domain|CC0|CC[- ]BY/i);
      expect(prayer.sourceMetadata?.translationVersions[0]?.versionTitle).toBeTruthy();
      expect(prayer.tokens.length).toBeGreaterThan(0);
      for (const token of prayer.tokens) {
        expect(token.hebrew).toMatch(/[\u05d0-\u05ea]/);
        expect(token.translation.trim()).not.toBe("");
        expect(token.hebrew).not.toMatch(/<[^>]+>/);
        if (token.kind === "instruction") expect(token.transliteration).toBe("");
        else expect(token.transliteration.trim()).not.toBe("");
      }
    }
  });
  it("includes every Psalm verse with exactly its captured Hebrew and English", () => {
    expect(corePrayers.filter(p => p.sourceMetadata?.work === "Psalms")).toHaveLength(150);
    for (const source of psalms) {
      const prayer = corePrayers.find(p => p.sefariaRef === `Psalms ${source.number}`)!;
      expect(prayer.tokens).toHaveLength(source.verses.length);
      source.verses.forEach((verse, i) => {
        expect(prayer.tokens[i]?.hebrew).toBe(verse.hebrew);
        expect(prayer.tokens[i]?.translation).toBe(verse.english);
      });
    }
  });
  it("keeps Shema paragraphs and separates instructions from recitation", () => {
    const shema = corePrayers.find(p => p.id === "shema")!;
    expect(shema.tokens.length).toBeGreaterThan(5);
    expect(shema.tokens.some(t => t.kind === "instruction")).toBe(true);
    expect(shema.tokens.some(t => t.hebrew.includes("וְאָהַבְתָּ"))).toBe(true);
    expect(shema.tokens.some(t => t.hebrew.includes("וְהָיָה"))).toBe(true);
    expect(shema.tokens.some(t => t.hebrew.includes("צִיצִת"))).toBe(true);
  });
});

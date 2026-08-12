import { corePrayers } from "@/data/corePrayers";
import generatedCandidates from "@/data/generatedHebrewCandidates.json";

describe("Hebrew prayer catalog", () => {
  it("has unique identities and complete review metadata", () => {
    const ids = corePrayers.map((prayer) => prayer.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(corePrayers).toHaveLength(33);
    for (const prayer of corePrayers) {
      expect(prayer.hebrewReview.status).toBe("pending");
      expect(prayer.hebrewReview.sourceTitle).not.toHaveLength(0);
      expect(prayer.hebrewReview.sourceRef).not.toHaveLength(0);
      expect(prayer.hebrewReview.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("preserves static source provenance for prepared Hebrew candidates", () => {
    expect(generatedCandidates.candidates).toHaveLength(22);
    expect(new Set(generatedCandidates.candidates.map((candidate) => candidate.id)).size).toBe(22);

    for (const candidate of generatedCandidates.candidates) {
      expect(corePrayers.some((prayer) => prayer.id === candidate.id)).toBe(true);
      expect(candidate.hebrew.length).toBeGreaterThan(0);
      expect(candidate.sources.length).toBeGreaterThan(0);
      for (const line of candidate.hebrew) {
        expect(line).toMatch(/[\u0590-\u05FF]/);
        expect(line).not.toMatch(/<[^>]+>|&[a-z]+;|%[0-9A-F]{2}/i);
      }
      for (const source of candidate.sources) {
        expect(source.ref).not.toHaveLength(0);
        expect(source.versionTitle).not.toHaveLength(0);
        expect(source.license).not.toHaveLength(0);
        expect(source.url).toMatch(/^https:\/\//);
      }
    }
  });

  it("never labels absent Hebrew as complete", () => {
    for (const prayer of corePrayers) {
      const kind = prayer.hebrewReview.contentKind;
      const hasHebrew = prayer.tokens.some((token) => token.hebrew.trim().length > 0);

      if (kind === "complete") expect(hasHebrew).toBe(true);
      if (kind === "missing" || kind === "collection") expect(prayer.tokens).toHaveLength(0);
    }
  });

  it("keeps machine artifacts and commentary out of bundled Hebrew", () => {
    const forbidden = [/<[^>]+>/, /%[0-9A-F]{2}/i, /Secondary Actions:/i, /Description:/i];

    for (const prayer of corePrayers) {
      for (const token of prayer.tokens) {
        expect(token.hebrew).toMatch(/[\u0590-\u05FF]/);
        for (const pattern of forbidden) expect(token.hebrew).not.toMatch(pattern);
      }
    }
  });
});

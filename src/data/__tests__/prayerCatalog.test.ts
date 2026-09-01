import { corePrayers } from "@/data/corePrayers";
import generatedCandidates from "@/data/generatedHebrewCandidates.json";
import generatedLiturgyIndex from "@/data/generatedLiturgyIndex.json";

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
    expect(generatedCandidates.candidates).toHaveLength(30);
    expect(new Set(generatedCandidates.candidates.map((candidate) => candidate.id)).size).toBe(30);

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

  it("indexes every available non-commentary section in Sefaria's liturgy catalog", () => {
    expect(generatedLiturgyIndex.workCount).toBeGreaterThan(40);
    expect(generatedLiturgyIndex.entryCount).toBe(generatedLiturgyIndex.entries.length);
    expect(generatedLiturgyIndex.entryCount).toBeGreaterThan(2_200);
    expect(new Set(generatedLiturgyIndex.entries.map((entry) => entry.id)).size).toBe(generatedLiturgyIndex.entryCount);
    expect(new Set(generatedLiturgyIndex.entries.map((entry) => entry.ref)).size).toBe(generatedLiturgyIndex.entryCount);

    for (const entry of generatedLiturgyIndex.entries) {
      expect(entry.title).not.toHaveLength(0);
      expect(entry.ref).toMatch(/^.+/);
      expect(entry.useCase).not.toHaveLength(0);
      if (entry.sourceVersion) expect(entry.sourceVersion.license).toMatch(/Public Domain|CC0|CC[- ]BY/i);
      for (const version of entry.translationVersions) expect(version.license).toMatch(/Public Domain|CC0|CC[- ]BY/i);
    }

    const psalms = generatedLiturgyIndex.entries.filter((entry) => entry.work === "Psalms");
    expect(psalms).toHaveLength(150);
    expect(new Set(psalms.map((entry) => entry.ref))).toEqual(new Set(Array.from({ length: 150 }, (_value, index) => `Psalms ${index + 1}`)));
  });
});

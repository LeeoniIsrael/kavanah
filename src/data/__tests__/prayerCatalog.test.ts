import { corePrayers } from "@/data/corePrayers";

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

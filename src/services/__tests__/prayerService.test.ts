import { getCachedPrayers, getLiturgyIndexCoverage, hydratePrayerFromSefaria, searchPrayers, searchSefariaPrayerRefs, syncCorePrayers } from "@/services/prayerService";

describe("prayer search", () => {
  it("matches intent terms across title, translation, and transliteration", () => {
    const [travel] = searchPrayers("lead us in peace");
    const [shema] = searchPrayers("adonai echad");

    expect(travel?.prayer.id).toBe("tefilat-haderech");
    expect(shema?.prayer.id).toBe("shema");
  });

  it("keeps bundled Hebrew immutable while rabbinic review is pending", async () => {
    const before = getCachedPrayers();
    const after = await syncCorePrayers();

    expect(after).toEqual(before);
    expect(after.every((prayer) => prayer.hebrewReview.status === "pending")).toBe(true);
    expect(after.find((prayer) => prayer.id === "asher-yatzar")?.hebrewReview.contentKind).toBe("excerpt");
  });

  it("finds simple intent matches across the complete liturgy index", async () => {
    const travel = await searchSefariaPrayerRefs("travel");
    const health = await searchSefariaPrayerRefs("health");
    const psalm = await searchSefariaPrayerRefs("Psalm 91");
    const coverage = getLiturgyIndexCoverage();

    expect(coverage.entryCount).toBeGreaterThan(2_000);
    expect(coverage.workCount).toBeGreaterThan(40);
    expect(travel.length).toBeLessThanOrEqual(16);
    expect(travel.some((prayer) => prayer.title === "Traveler's Prayer")).toBe(true);
    expect(health.some((prayer) => prayer.aliases.includes("health"))).toBe(true);
    expect(psalm[0]?.sefariaRef).toBe("Psalms 91");
    expect([...travel, ...health].every((prayer) => prayer.source === "sefaria-search" && prayer.hebrewReview.contentKind === "remote-unreviewed")).toBe(true);
  });

  it("hydrates only licensed source versions and preserves their attribution", async () => {
    const candidates = await searchSefariaPrayerRefs("modeh ani");
    const prayer = candidates.find((item) => item.sourceMetadata?.sourceVersion);
    expect(prayer).toBeDefined();

    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      ref: prayer?.sefariaRef,
      versions: [
        {
          versionTitle: "Reusable Hebrew Test Edition",
          language: "he",
          actualLanguage: "he",
          license: "CC-BY",
          versionSource: "https://example.com/hebrew",
          text: ["מוֹדֶה אֲנִי"]
        },
        {
          versionTitle: "Reusable English Test Edition",
          language: "en",
          actualLanguage: "en",
          license: "Public Domain",
          versionSource: "https://example.com/english",
          text: ["I give thanks."]
        }
      ]
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

    const hydrated = await hydratePrayerFromSefaria(prayer!);

    expect(hydrated.tokens[0]).toMatchObject({ hebrew: "מוֹדֶה אֲנִי", translation: "I give thanks." });
    expect(hydrated.sourceMetadata?.sourceVersion?.license).toBe("CC-BY");
    expect(hydrated.hebrewReview.licenseStatus).toBe("verified");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("return_format=text_only");
    fetchMock.mockRestore();
  });
});

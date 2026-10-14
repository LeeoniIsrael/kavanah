import { catalogPrayer, getCachedPrayers, getLiturgyIndexCoverage, hydratePrayerFromSefaria, mergePrayerCollections, searchPrayers, searchSefariaPrayerRefs, syncCorePrayers } from "@/services/prayerService";
import { cacheStorage, writeJson } from "@/services/mmkv";

describe("research-only prayer catalog", () => {
  it("finds Psalms and needs from the captured catalog", async () => {
    expect(searchPrayers("adonai echad")[0]?.prayer.id).toBe("shema");
    expect((await searchSefariaPrayerRefs("Psalm 91"))[0]?.sefariaRef).toBe("Psalms 91");
    for (const query of ["health", "wellness", "opportunity", "gratitude", "travel"]) {
      expect(searchPrayers(query).length).toBeGreaterThan(0);
    }
    expect(getLiturgyIndexCoverage().entryCount).toBe(getCachedPrayers().length);
  });
  it("ignores old caches, unknown entries, and modified copies of known entries", async () => {
    const canonical = getCachedPrayers()[0]!;
    const forged = {...canonical, title: "Unapproved replacement", tokens: []};
    const foreign = {...forged, id: "outside-research"};
    for (const key of ["prayers.core.v2", "prayers.remote.v1", "prayers.sefaria-index.v1.health"]) writeJson(cacheStorage, key, [foreign, forged]);
    expect(getCachedPrayers()).not.toContainEqual(foreign);
    expect(mergePrayerCollections([foreign], [forged])).toEqual([canonical]);
    expect(searchPrayers("", [foreign, forged]).map(r => r.prayer)).toEqual([canonical]);
    expect(await syncCorePrayers()).toEqual(getCachedPrayers());
    expect(catalogPrayer("outside-research")).toBeUndefined();
    await expect(hydratePrayerFromSefaria(foreign)).rejects.toThrow("not included");
  });
  it("opens the immutable offline text without a network fetch", async () => {
    const fetchMock = jest.spyOn(global, "fetch");
    const prayer = getCachedPrayers()[0]!;
    expect(await hydratePrayerFromSefaria({...prayer, tokens: []})).toBe(prayer);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});

import {
  getCachedPrayers,
  mergePrayerCollections,
  searchPrayers,
  searchSefariaPrayerRefs,
} from "@/services/prayerService";
import { groupPrayerSearchResults } from "@/services/prayerSearchGroups";

describe("prayer search groups", () => {
  it("shows one Modeh Ani while preserving all prayer-book sources", async () => {
    const prayers = mergePrayerCollections(
      getCachedPrayers(),
      await searchSefariaPrayerRefs("modeh ani"),
    );
    const results = searchPrayers("modeh ani", prayers);
    const groups = groupPrayerSearchResults(results);
    const modeh = groups.filter(({ prayer }) => prayer.title === "Modeh Ani");
    expect(modeh).toHaveLength(1);
    if (!modeh[0]) throw new Error("Modeh Ani group missing");
    expect(modeh[0].prayer.id).toBe("modeh-ani");
    const ids = [
      modeh[0].prayer.id,
      ...modeh[0].editions.map(({ prayer }) => prayer.id),
    ];
    expect(new Set(ids)).toEqual(
      new Set(
        results
          .filter(({ prayer }) => prayer.title === "Modeh Ani")
          .map(({ prayer }) => prayer.id),
      ),
    );
    expect(
      modeh[0].editions.some(({ prayer }) =>
        prayer.sefariaRef.includes("Shabbat"),
      ),
    ).toBe(true);
    expect(
      modeh[0].editions.some(({ prayer }) =>
        prayer.sefariaRef.includes("Weekday"),
      ),
    ).toBe(true);
  });

  it("keeps distinct prayer titles separate and ignores repeated source IDs", () => {
    const results = searchPrayers("", getCachedPrayers());
    const grouped = groupPrayerSearchResults([...results, ...results]);
    expect(grouped.length).toBe(
      new Set(results.map(({ prayer }) => prayer.title.toLowerCase())).size,
    );
    for (const group of grouped) {
      const ids = [
        group.prayer.id,
        ...group.editions.map(({ prayer }) => prayer.id),
      ];
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

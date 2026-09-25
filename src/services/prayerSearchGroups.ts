import type { PrayerSearchResult } from "@/types/prayer";

export type PrayerSearchGroup = PrayerSearchResult & {
  editions: PrayerSearchResult[];
};

// Group presentation only: keep every source ID available to readers/bookmarks.
// Matching titles do not imply identical texts across prayer traditions.
export function groupPrayerSearchResults(
  results: PrayerSearchResult[],
): PrayerSearchGroup[] {
  const groups = new Map<string, PrayerSearchGroup>();
  for (const result of results) {
    const key = result.prayer.title
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    const group = groups.get(key);
    if (!group) groups.set(key, { ...result, editions: [] });
    else if (
      group.prayer.id !== result.prayer.id &&
      !group.editions.some(({ prayer }) => prayer.id === result.prayer.id)
    ) {
      group.editions.push(result);
    }
  }
  return [...groups.values()];
}

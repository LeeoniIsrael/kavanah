import { corePrayers } from "@/data/corePrayers";
import generatedLiturgyIndex from "@/data/generatedLiturgyIndex.json";
import redirects from "@/data/researchPrayerRedirects.json";
import type { LiturgyIndexEntry, LiturgyIndexManifest, PrayerSearchResult, PrayerText } from "@/types/prayer";

const liturgyIndex = generatedLiturgyIndex as LiturgyIndexManifest;
const byId = new Map(corePrayers.map((prayer) => [prayer.id, prayer]));
const redirectMap: Record<string, string> = redirects;
export class PrayerSourceUnavailableError extends Error {
  constructor(message: string) { super(message); this.name = "PrayerSourceUnavailableError"; }
}
export function catalogPrayer(id: string): PrayerText | undefined {
  return byId.get(redirectMap[id] ?? id);
}
function canonicalPrayers(prayers: PrayerText[]): PrayerText[] {
  return [...new Map(prayers.flatMap((candidate) => {
    const prayer = catalogPrayer(candidate.id);
    return prayer ? [[prayer.id, prayer] as const] : [];
  })).values()];
}
// Legacy caches are intentionally never read. History and bookmarks remain intact.
export function getCachedPrayers(): PrayerText[] { return corePrayers; }
export async function syncCorePrayers(): Promise<PrayerText[]> { return corePrayers; }
export async function hydratePrayerFromSefaria(prayer: PrayerText): Promise<PrayerText> {
  const canonical = catalogPrayer(prayer.id);
  if (!canonical) throw new PrayerSourceUnavailableError("This prayer is not included in the current research catalog.");
  return canonical;
}
export async function searchSefariaPrayerRefs(query: string): Promise<PrayerText[]> {
  return query.trim().length < 2 ? [] : searchPrayers(query).slice(0, 16).map(({ prayer }) => prayer);
}
export function createIndexedPrayer(entry: LiturgyIndexEntry): PrayerText {
  const prayer = catalogPrayer(entry.id);
  if (!prayer) throw new PrayerSourceUnavailableError("This section is not included in the current research catalog.");
  return prayer;
}
export function mergePrayerCollections(local: PrayerText[], remote: PrayerText[]): PrayerText[] {
  return canonicalPrayers([...local, ...remote]);
}
export function getLiturgyIndexCoverage(): Pick<LiturgyIndexManifest, "entryCount" | "excludedWorks" | "generatedAt" | "languages" | "workCount"> {
  const {entryCount, excludedWorks, generatedAt, languages, workCount} = liturgyIndex;
  return {entryCount, excludedWorks, generatedAt, languages, workCount};
}

export function searchPrayers(query: string, prayers: PrayerText[] = getCachedPrayers()): PrayerSearchResult[] {
  prayers = canonicalPrayers(prayers);
  const cleanQuery = normalizeSearch(query);
  if (!cleanQuery) return prayers.map((prayer) => ({ prayer, score: 1, reason: "Prayer index" }));

  return prayers
    .map((prayer) => {
      const title = normalizeSearch(prayer.title);
      const aliases = prayer.aliases.map(normalizeSearch);
      const tags = prayer.tags.map(normalizeSearch);
      const fields = {
        ref: normalizeSearch(prayer.sefariaRef),
        summary: normalizeSearch(prayer.summary),
        useCase: normalizeSearch(prayer.useCase),
        tokens: normalizeSearch(prayer.tokens.flatMap((token) => [token.translation, token.transliteration, token.hebrew]).join(" "))
      };
      let score = 0;
      if (title === cleanQuery) score = 130;
      else if (title.startsWith(cleanQuery)) score = 115;
      else if (title.includes(cleanQuery)) score = 100;
      else if (aliases.some((alias) => alias === cleanQuery)) score = 92;
      else if (aliases.some((alias) => alias.includes(cleanQuery))) score = 86;
      else if (fields.useCase.includes(cleanQuery)) score = 78;
      else if (tags.some((tag) => tag === cleanQuery)) score = 72;
      else if (fields.summary.includes(cleanQuery)) score = 66;
      else if (fields.ref.includes(cleanQuery)) score = 60;
      else if (fields.tokens.includes(cleanQuery)) score = 55;
      else score = fuzzyScore(cleanQuery, [title, ...aliases, ...tags, ...Object.values(fields)].join(" "));
      if (prayer.source !== "sefaria-search") score += 8;
      return { prayer, score, reason: score >= 60 ? "Direct match" : "Intent match" };
    })
    .filter((result) => result.score > 8)
    .sort((a, b) => b.score - a.score);
}

function fuzzyScore(query: string, target: string): number {
  const words = query.split(/\s+/).filter(Boolean);
  const matches = words.filter((word) => target.includes(word)).length;
  return matches === words.length ? matches * 3 : 0;
}

function normalizeSearch(input: string): string {
  return input.toLowerCase().normalize("NFKD").replace(/[’']/g, "'").replace(/[^a-z0-9\u0590-\u05ff']+/g, " ").trim();
}

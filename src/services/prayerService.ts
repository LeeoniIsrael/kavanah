import { corePrayers } from "@/data/corePrayers";
import { cacheStorage, readJson, writeJson } from "@/services/mmkv";
import { secureFetch } from "@/services/network";
import type { PrayerSearchResult, PrayerText, PrayerToken } from "@/types/prayer";

const CACHE_KEY = "prayers.core";
const SEFARIA_BASE_URL = "https://www.sefaria.org/api/texts/";

type SefariaTextResponse = {
  he: string[] | string;
  text: string[] | string;
  ref: string;
};

function isPrayerTextArray(value: unknown): value is PrayerText[] {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && typeof (item as { id?: unknown }).id === "string");
}

export function getCachedPrayers(): PrayerText[] {
  return readJson(cacheStorage, CACHE_KEY, isPrayerTextArray) ?? corePrayers;
}

export async function hydratePrayerFromSefaria(prayer: PrayerText): Promise<PrayerText> {
  const encodedRef = encodeURIComponent(prayer.sefariaRef);
  const response = await secureFetch(`${SEFARIA_BASE_URL}${encodedRef}?commentary=0&context=0`);
  const payload = (await response.json()) as SefariaTextResponse;
  const hebrewLines = normalizeLines(payload.he);
  const translatedLines = normalizeLines(payload.text);
  const tokens: PrayerToken[] = hebrewLines.map((hebrew, index) => ({
    id: `${prayer.id}-${index}`,
    hebrew,
    translation: translatedLines[index] ?? prayer.tokens[index]?.translation ?? "",
    transliteration: prayer.tokens[index]?.transliteration ?? transliterateHebrewFallback(hebrew)
  }));

  return {
    ...prayer,
    tokens: tokens.length > 0 ? tokens : prayer.tokens,
    source: "sefaria",
    updatedAt: new Date().toISOString()
  };
}

export async function syncCorePrayers(): Promise<PrayerText[]> {
  const settled = await Promise.allSettled(corePrayers.map(hydratePrayerFromSefaria));
  const prayers = settled.map((result, index) => (result.status === "fulfilled" ? result.value : corePrayers[index])).filter(Boolean) as PrayerText[];
  writeJson(cacheStorage, CACHE_KEY, prayers);
  return prayers;
}

export function searchPrayers(query: string, prayers: PrayerText[] = getCachedPrayers()): PrayerSearchResult[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return prayers.map((prayer) => ({ prayer, score: 1, reason: "Core prayer" }));
  }

  return prayers
    .map((prayer) => {
      const haystack = [prayer.title, prayer.category, prayer.sefariaRef, ...prayer.tokens.flatMap((token) => [token.translation, token.transliteration, token.hebrew])]
        .join(" ")
        .toLowerCase();
      const score = haystack.includes(cleanQuery) ? 10 : fuzzyScore(cleanQuery, haystack);
      return { prayer, score, reason: score >= 10 ? "Direct match" : "Intent match" };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}

function normalizeLines(value: string[] | string): string[] {
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function fuzzyScore(query: string, target: string): number {
  const words = query.split(/\s+/).filter(Boolean);
  return words.reduce((score, word) => score + (target.includes(word) ? 2 : 0), 0);
}

function transliterateHebrewFallback(input: string): string {
  return input.length > 0 ? "Transliteration is available from the local prayer cache when provided." : "";
}

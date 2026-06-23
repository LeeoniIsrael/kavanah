import { corePrayers } from "@/data/corePrayers";
import { cacheStorage, readJson, writeJson } from "@/services/mmkv";
import { secureFetch } from "@/services/network";
import type { PrayerSearchResult, PrayerText, PrayerToken } from "@/types/prayer";
import { transliterate } from "hebrew-transliteration";

const CACHE_KEY = "prayers.core";
const SEFARIA_SEARCH_CACHE_KEY = "prayers.sefaria-search";
const SEFARIA_BASE_URL = "https://www.sefaria.org/api/texts/";
const SEFARIA_NAME_URL = "https://www.sefaria.org/api/name/";

type SefariaTextResponse = {
  he?: unknown;
  text?: unknown;
  ref: string;
};

type SefariaNameResponse = {
  completions?: string[];
  is_ref?: boolean;
};

function isPrayerTextArray(value: unknown): value is PrayerText[] {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && typeof (item as { id?: unknown }).id === "string");
}

export function getCachedPrayers(): PrayerText[] {
  const cached = readJson(cacheStorage, CACHE_KEY, isPrayerTextArray);
  return cached ? hydrateMissingSearchGuidance(cached) : corePrayers;
}

export async function hydratePrayerFromSefaria(prayer: PrayerText): Promise<PrayerText> {
  const encodedRef = encodeURIComponent(prayer.sefariaRef);
  const response = await secureFetch(`${SEFARIA_BASE_URL}${encodedRef}?commentary=0&context=0`);
  const payload = (await response.json()) as SefariaTextResponse;
  const hebrewLines = normalizeLines(payload.he);
  const translatedLines = normalizeLines(payload.text);
  const tokens: PrayerToken[] = hebrewLines.map((hebrew, index) => ({
    id: `${prayer.id}-${index}`,
    hebrew: stripHtml(hebrew),
    translation: stripHtml(translatedLines[index] ?? prayer.tokens[index]?.translation ?? prayer.summary),
    transliteration: prayer.tokens[index]?.transliteration ?? transliterateHebrew(stripHtml(hebrew))
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

export async function searchSefariaPrayerRefs(query: string): Promise<PrayerText[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 3) {
    return [];
  }

  const cacheKey = `${SEFARIA_SEARCH_CACHE_KEY}.${cleanQuery.toLowerCase()}`;
  const cached = readJson(cacheStorage, cacheKey, isPrayerTextArray);
  if (cached) {
    return cached;
  }

  const response = await secureFetch(`${SEFARIA_NAME_URL}${encodeURIComponent(cleanQuery)}`);
  const payload = (await response.json()) as SefariaNameResponse;
  const completions = (payload.completions ?? [])
    .filter((completion) => typeof completion === "string")
    .filter((completion) => looksPrayerAdjacent(completion, cleanQuery))
    .slice(0, 8);

  const prayers = completions.map((completion) => createSefariaSearchPrayer(completion, cleanQuery));
  writeJson(cacheStorage, cacheKey, prayers);
  return prayers;
}

export function searchPrayers(query: string, prayers: PrayerText[] = getCachedPrayers()): PrayerSearchResult[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return prayers.map((prayer) => ({ prayer, score: 1, reason: "Prayer index" }));
  }

  return prayers
    .map((prayer) => {
      const haystack = [
        prayer.title,
        prayer.category,
        prayer.sefariaRef,
        prayer.summary,
        prayer.useCase,
        ...prayer.aliases,
        ...prayer.tags,
        ...prayer.tokens.flatMap((token) => [token.translation, token.transliteration, token.hebrew])
      ]
        .join(" ")
        .toLowerCase();
      const score = haystack.includes(cleanQuery) ? 10 : fuzzyScore(cleanQuery, haystack);
      return { prayer, score, reason: score >= 10 ? "Direct match" : "Intent match" };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function mergePrayerCollections(localPrayers: PrayerText[], remotePrayers: PrayerText[]): PrayerText[] {
  const seen = new Set<string>();
  return [...localPrayers, ...remotePrayers].filter((prayer) => {
    const key = prayer.id.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function hydrateMissingSearchGuidance(prayers: PrayerText[]): PrayerText[] {
  const guidanceById = new Map(corePrayers.map((prayer) => [prayer.id, prayer.useCase]));
  return prayers.map((prayer) => ({
    ...prayer,
    useCase: prayer.useCase || guidanceById.get(prayer.id) || prayer.summary || `Open ${prayer.title} to read the full prayer.`
  }));
}

function normalizeLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeLines).filter(Boolean);
  }
  return typeof value === "string" && value.trim() ? [value] : [];
}

function fuzzyScore(query: string, target: string): number {
  const words = query.split(/\s+/).filter(Boolean);
  return words.reduce((score, word) => score + (target.includes(word) ? 2 : 0), 0);
}

function transliterateHebrew(input: string): string {
  if (!input.trim()) {
    return "";
  }
  try {
    return transliterate(input)
      .replace(/š/g, "sh")
      .replace(/ḥ/g, "ch")
      .replace(/ṭ/g, "t")
      .replace(/ṣ/g, "tz")
      .replace(/[ʾʿ]/g, "'")
      .replace(/[āă]/g, "a")
      .replace(/[ēĕ]/g, "e")
      .replace(/[îī]/g, "i")
      .replace(/[ôō]/g, "o")
      .replace(/[ûū]/g, "u")
      .replace(/ə/g, "e");
  } catch {
    return "";
  }
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function looksPrayerAdjacent(completion: string, query: string): boolean {
  const normalized = `${completion} ${query}`.toLowerCase();
  const terms = [
    "siddur",
    "prayer",
    "blessing",
    "berach",
    "birkat",
    "kaddish",
    "shema",
    "tefillin",
    "tallit",
    "kiddush",
    "havdalah",
    "psalm",
    "tehillim",
    "candle",
    "omer",
    "vidui",
    "aleinu",
    "adon olam",
    "hamazon",
    "nefashot",
    "shehecheyanu"
  ];
  return terms.some((term) => normalized.includes(term));
}

function createSefariaSearchPrayer(ref: string, query: string): PrayerText {
  return {
    id: `sefaria-${slugify(ref)}`,
    title: ref.split(",").at(-1)?.trim() || ref,
    sefariaRef: ref,
    category: "source",
    summary: `Sefaria result for “${query}”. Open to load Hebrew, translation, and generated transliteration.`,
    useCase: "Open this Sefaria source when the local prayer list does not have the exact text you searched for.",
    aliases: [query, ref],
    tags: ["sefaria", "library", "source"],
    source: "sefaria-search",
    updatedAt: new Date().toISOString(),
    tokens: [
      {
        id: `sefaria-${slugify(ref)}-preview`,
        hebrew: "",
        translation: `Open “${ref}” from Sefaria.`,
        transliteration: ""
      }
    ]
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

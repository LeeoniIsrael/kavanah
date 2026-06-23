import { cacheStorage, readJson, writeJson } from "@/services/mmkv";
import { secureFetch } from "@/services/network";

const TRANSLATION_CACHE_KEY = "language.translations";

type TranslationCache = Record<string, string>;

function isTranslationCache(value: unknown): value is TranslationCache {
  return typeof value === "object" && value !== null && Object.values(value).every((item) => typeof item === "string");
}

export async function translatePrayerText(text: string, languageCode: string): Promise<string> {
  const cleanText = text.trim();
  if (!cleanText || languageCode === "en") {
    return cleanText;
  }
  if (languageCode === "he") {
    return cleanText;
  }

  const cache = readJson(cacheStorage, TRANSLATION_CACHE_KEY, isTranslationCache) ?? {};
  const cacheKey = `${languageCode}:${cleanText}`;
  const cached = cache[cacheKey];
  if (cached) {
    return cached;
  }

  try {
    const response = await secureFetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|${encodeURIComponent(languageCode)}`, {}, { retries: 1, timeoutMs: 7000 });
    const payload = (await response.json()) as { responseData?: { translatedText?: unknown } };
    const translated = typeof payload.responseData?.translatedText === "string" ? stripEntities(payload.responseData.translatedText) : cleanText;
    writeJson(cacheStorage, TRANSLATION_CACHE_KEY, { ...cache, [cacheKey]: translated });
    return translated;
  } catch {
    return cleanText;
  }
}

export function localizeHebrewTransliteration(transliteration: string, languageCode: string): string {
  const clean = transliteration.trim();
  if (!clean) {
    return clean;
  }

  if (["es", "pt", "it", "lad"].includes(languageCode)) {
    return clean.replace(/ch/gi, "j").replace(/sh/gi, "sh").replace(/tz/gi, "tz");
  }
  if (["fr"].includes(languageCode)) {
    return clean.replace(/ch/gi, "kh").replace(/ou/gi, "ou");
  }
  if (["de", "yi"].includes(languageCode)) {
    return clean.replace(/sh/gi, "sch").replace(/ch/gi, "ch").replace(/tz/gi, "z");
  }
  if (["pl"].includes(languageCode)) {
    return clean.replace(/sh/gi, "sz").replace(/ch/gi, "ch").replace(/tz/gi, "c");
  }
  if (["ru", "uk"].includes(languageCode)) {
    return clean.replace(/kh|ch/gi, "kh").replace(/sh/gi, "sh").replace(/tz/gi, "ts");
  }
  if (["tr"].includes(languageCode)) {
    return clean.replace(/sh/gi, "ş").replace(/ch/gi, "h").replace(/tz/gi, "ts");
  }
  if (["ar", "fa", "ur"].includes(languageCode)) {
    return clean.replace(/kh|ch/gi, "kh").replace(/sh/gi, "sh");
  }
  return clean;
}

function stripEntities(input: string): string {
  return input.replace(/&#39;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").trim();
}

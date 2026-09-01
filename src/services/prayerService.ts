import { corePrayers } from "@/data/corePrayers";
import generatedLiturgyIndex from "@/data/generatedLiturgyIndex.json";
import { getPendingHebrewReview } from "@/data/prayerReviewCatalog";
import { cacheStorage, readJson, writeJson } from "@/services/mmkv";
import { secureFetch } from "@/services/network";
import type { LiturgyIndexEntry, LiturgyIndexManifest, PrayerCategory, PrayerSearchResult, PrayerSourceVersion, PrayerText, PrayerToken } from "@/types/prayer";
import { transliterate } from "hebrew-transliteration";

const CACHE_KEY = "prayers.core.v2";
const REMOTE_CACHE_KEY = "prayers.remote.v1";
const SEFARIA_SEARCH_CACHE_KEY = "prayers.sefaria-index.v1";
const SEFARIA_V3_URL = "https://www.sefaria.org/api/v3/texts/";
const SEFARIA_VERSIONS_URL = "https://www.sefaria.org/api/texts/versions/";
const REUSABLE_LICENSE = /^(public domain|cc0|cc[- ]by(?:[- ]sa)?)(?:\s|$|\d)/i;
const REMOTE_RESULT_LIMIT = 16;
const liturgyIndex = generatedLiturgyIndex as LiturgyIndexManifest;

type SefariaVersionResponse = {
  actualLanguage?: unknown;
  language?: unknown;
  license?: unknown;
  text?: unknown;
  versionSource?: unknown;
  versionTitle?: unknown;
};

type SefariaTextResponse = {
  ref?: unknown;
  versions?: unknown;
};

export class PrayerSourceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrayerSourceUnavailableError";
  }
}

function isPrayerTextArray(value: unknown): value is PrayerText[] {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && typeof (item as { id?: unknown }).id === "string");
}

export function getCachedPrayers(): PrayerText[] {
  const cachedCore = readJson(cacheStorage, CACHE_KEY, isPrayerTextArray);
  const cachedRemote = readJson(cacheStorage, REMOTE_CACHE_KEY, isPrayerTextArray) ?? [];
  return mergePrayerCollections(cachedCore ? hydrateMissingSearchGuidance(cachedCore) : corePrayers, cachedRemote);
}

export async function hydratePrayerFromSefaria(prayer: PrayerText): Promise<PrayerText> {
  const cached = getCachedRemotePrayer(prayer.id);
  if (cached?.tokens.some((token) => token.hebrew.trim())) return cached;
  if (!prayer.sourceMetadata) throw new PrayerSourceUnavailableError("This source is not part of Kavanah's verified liturgy index.");
  if (!prayer.sourceMetadata.sourceVersion) {
    throw new PrayerSourceUnavailableError("Kavanah cannot reproduce this text because Sefaria does not currently list a commercially reusable Hebrew edition. You can still open the original source on Sefaria.");
  }

  let payload = await fetchPrimarySefariaText(prayer.sefariaRef);
  let usable = extractUsableVersions(payload);

  if (!usable.hebrew) {
    const preferredVersions = [
      prayer.sourceMetadata.sourceVersion,
      ...prayer.sourceMetadata.translationVersions.filter((version) => version.actualLanguage === "en")
    ];
    payload = await fetchSefariaText(prayer.sefariaRef, preferredVersions);
    usable = extractUsableVersions(payload);
  }

  if (!usable.hebrew) {
    payload = await fetchSefariaText(prayer.sefariaRef, await fetchReusableWorkVersions(prayer.sourceMetadata.work));
    usable = extractUsableVersions(payload);
  }

  if (!usable.hebrew) {
    throw new PrayerSourceUnavailableError("A reusable edition exists for this prayer book, but this individual section is not present in that edition. Open Sefaria to view the source while Kavanah's review team prepares it.");
  }

  const hebrewLines = normalizeLines(usable.hebrew.text).map(stripHtml).filter(Boolean);
  const translatedLines = usable.translation ? normalizeLines(usable.translation.text).map(stripHtml) : [];
  if (hebrewLines.length === 0) throw new PrayerSourceUnavailableError("Sefaria returned no reusable Hebrew text for this section.");

  const tokens: PrayerToken[] = hebrewLines.map((hebrew, index) => ({
    id: `${prayer.id}-${index}`,
    hebrew,
    translation: translatedLines[index] ?? prayer.summary,
    transliteration: transliterateHebrew(hebrew)
  }));
  const sourceVersion = normalizeVersion(usable.hebrew);
  const translationVersion = usable.translation ? normalizeVersion(usable.translation) : null;
  const hydrated: PrayerText = {
    ...prayer,
    tokens,
    source: "sefaria",
    updatedAt: new Date().toISOString(),
    hebrewReview: {
      ...prayer.hebrewReview,
      sourceTitle: prayer.sourceMetadata.work,
      sourceRef: typeof payload.ref === "string" ? payload.ref : prayer.sefariaRef,
      licenseStatus: "verified",
      notes: "Source-backed library text. The edition license is verified; rabbinic content review is still pending."
    },
    sourceMetadata: {
      ...prayer.sourceMetadata,
      sourceVersion,
      translationVersions: translationVersion ? [translationVersion] : []
    }
  };

  cacheRemotePrayer(hydrated);
  return hydrated;
}

export async function syncCorePrayers(): Promise<PrayerText[]> {
  // Bundled Hebrew stays immutable until its exact source and wording receive
  // rabbinic approval. Previously opened licensed library texts remain cached.
  writeJson(cacheStorage, CACHE_KEY, corePrayers);
  const cachedRemote = readJson(cacheStorage, REMOTE_CACHE_KEY, isPrayerTextArray) ?? [];
  return mergePrayerCollections(corePrayers, cachedRemote);
}

export async function searchSefariaPrayerRefs(query: string): Promise<PrayerText[]> {
  const cleanQuery = normalizeSearch(query);
  if (cleanQuery.length < 2) return [];

  const cacheKey = `${SEFARIA_SEARCH_CACHE_KEY}.${cleanQuery}`;
  const cached = readJson(cacheStorage, cacheKey, isPrayerTextArray);
  if (cached) return cached;

  const words = cleanQuery.split(/\s+/).filter(Boolean);
  const entries = liturgyIndex.entries
    .map((entry) => ({ entry, score: scoreLiturgyEntry(entry, cleanQuery, words) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, REMOTE_RESULT_LIMIT)
    .map(({ entry }) => createIndexedPrayer(entry));
  writeJson(cacheStorage, cacheKey, entries);
  return entries;
}

export function searchPrayers(query: string, prayers: PrayerText[] = getCachedPrayers()): PrayerSearchResult[] {
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

export function mergePrayerCollections(localPrayers: PrayerText[], remotePrayers: PrayerText[]): PrayerText[] {
  const byId = new Map<string, PrayerText>();
  for (const prayer of [...remotePrayers, ...localPrayers]) byId.set(prayer.id.toLowerCase(), prayer);
  return [...byId.values()];
}

export function getLiturgyIndexCoverage(): Pick<LiturgyIndexManifest, "entryCount" | "excludedWorks" | "generatedAt" | "languages" | "workCount"> {
  return {
    entryCount: liturgyIndex.entryCount,
    excludedWorks: liturgyIndex.excludedWorks,
    generatedAt: liturgyIndex.generatedAt,
    languages: liturgyIndex.languages,
    workCount: liturgyIndex.workCount
  };
}

function scoreLiturgyEntry(entry: LiturgyIndexEntry, query: string, words: string[]): number {
  const title = normalizeSearch(entry.title);
  const ref = normalizeSearch(entry.ref);
  const aliases = entry.aliases.map(normalizeSearch);
  const tags = entry.tags.map(normalizeSearch);
  const useCase = normalizeSearch(entry.useCase);
  let score = 0;
  if (title === query) score = 150;
  else if (title.startsWith(query)) score = 135;
  else if (title.includes(query)) score = 120;
  else if (aliases.some((alias) => alias === query)) score = 110;
  else if (aliases.some((alias) => alias.includes(query))) score = 102;
  else if (useCase.includes(query)) score = 94;
  else if (tags.some((tag) => tag === query)) score = 88;
  else if (ref.includes(query)) score = 80;
  else {
    const haystack = `${title} ${ref} ${aliases.join(" ")} ${tags.join(" ")} ${useCase}`;
    const matchedWords = words.filter((word) => haystack.includes(word)).length;
    if (matchedWords === words.length) score = 56 + matchedWords * 4;
  }
  if (entry.sourceVersion) score += 4;
  return score;
}

function createIndexedPrayer(entry: LiturgyIndexEntry): PrayerText {
  const cached = getCachedRemotePrayer(entry.id);
  if (cached) return cached;
  const review = getPendingHebrewReview(entry.id);
  return {
    id: entry.id,
    title: entry.title,
    sefariaRef: entry.ref,
    category: categoryFor(entry),
    summary: entry.summary,
    useCase: entry.useCase,
    aliases: unique([entry.hebrewTitle, ...entry.aliases, entry.work]),
    tags: unique([...entry.tags, ...entry.categories]),
    tokens: [],
    source: "sefaria-search",
    updatedAt: liturgyIndex.generatedAt,
    hebrewReview: {
      ...review,
      tradition: entry.tradition,
      sourceTitle: entry.work,
      sourceRef: entry.ref,
      sourceUrl: `https://www.sefaria.org/${encodeURIComponent(entry.ref.replaceAll(" ", "_"))}`,
      licenseStatus: entry.sourceVersion ? "verified" : "verification-required",
      notes: entry.sourceVersion
        ? "The source edition license is reusable. Exact Hebrew and ritual suitability still require rabbinic approval."
        : "No reusable Hebrew edition is currently available for in-app reproduction."
    },
    sourceMetadata: {
      work: entry.work,
      categories: entry.categories,
      path: entry.path,
      hebrewTitle: entry.hebrewTitle,
      sourceVersion: entry.sourceVersion,
      translationVersions: entry.translationVersions
    }
  };
}

function categoryFor(entry: LiturgyIndexEntry): PrayerCategory {
  const values = new Set(entry.tags.map((tag) => tag.toLowerCase()));
  const ordered: PrayerCategory[] = ["travel", "health", "food", "tefillin", "study", "protection", "mourning", "repentance", "shabbat", "holiday", "nation", "thanks", "success", "sleep", "daily"];
  return ordered.find((category) => values.has(category)) ?? "source";
}

async function fetchSefariaText(ref: string, versions: PrayerSourceVersion[]): Promise<SefariaTextResponse> {
  const params = new URLSearchParams({ return_format: "text_only" });
  for (const version of uniqueVersions(versions)) params.append("version", `${languageName(version.actualLanguage)}|${version.versionTitle}`);
  const response = await secureFetch(`${SEFARIA_V3_URL}${encodeURIComponent(ref)}?${params.toString()}`);
  return await response.json() as SefariaTextResponse;
}

async function fetchPrimarySefariaText(ref: string): Promise<SefariaTextResponse> {
  const params = new URLSearchParams({ return_format: "text_only" });
  params.append("version", "source");
  params.append("version", "translation");
  const response = await secureFetch(`${SEFARIA_V3_URL}${encodeURIComponent(ref)}?${params.toString()}`);
  return await response.json() as SefariaTextResponse;
}

async function fetchReusableWorkVersions(work: string): Promise<PrayerSourceVersion[]> {
  const response = await secureFetch(`${SEFARIA_VERSIONS_URL}${encodeURIComponent(work)}`);
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload)) return [];
  const versions = payload.map((value) => normalizeVersion(value as SefariaVersionResponse)).filter((value): value is PrayerSourceVersion => value !== null && isReusableLicense(value.license));
  const hebrew = versions.filter((version) => version.actualLanguage === "he" || version.language === "he");
  const english = versions.filter((version) => version.actualLanguage === "en");
  return [...hebrew.slice(0, 8), ...english.slice(0, 4)];
}

function extractUsableVersions(payload: SefariaTextResponse): { hebrew: SefariaVersionResponse | null; translation: SefariaVersionResponse | null } {
  const versions = Array.isArray(payload.versions) ? payload.versions.filter(isSefariaVersion) : [];
  return {
    hebrew: versions.find((version) => isHebrewVersion(version) && hasText(version.text) && isReusableLicense(String(version.license ?? ""))) ?? null,
    translation: versions.find((version) => isEnglishVersion(version) && hasText(version.text) && isReusableLicense(String(version.license ?? ""))) ?? null
  };
}

function normalizeVersion(value: SefariaVersionResponse): PrayerSourceVersion | null {
  if (typeof value.versionTitle !== "string" || typeof value.language !== "string" || typeof value.license !== "string") return null;
  return {
    versionTitle: value.versionTitle,
    language: value.language,
    actualLanguage: typeof value.actualLanguage === "string" ? value.actualLanguage : value.language,
    license: value.license,
    versionSource: typeof value.versionSource === "string" ? value.versionSource : ""
  };
}

function isSefariaVersion(value: unknown): value is SefariaVersionResponse {
  return typeof value === "object" && value !== null;
}

function isHebrewVersion(version: SefariaVersionResponse): boolean {
  return version.actualLanguage === "he" || version.language === "he";
}

function isEnglishVersion(version: SefariaVersionResponse): boolean {
  return version.actualLanguage === "en";
}

function hasText(value: unknown): boolean {
  return normalizeLines(value).some((line) => stripHtml(line).length > 0);
}

function isReusableLicense(license: string): boolean {
  return REUSABLE_LICENSE.test(license.trim());
}

function languageName(code: string): string {
  if (code === "he") return "hebrew";
  if (code === "en") return "english";
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code)?.split(" (")[0]?.toLowerCase() ?? code;
  } catch {
    return code;
  }
}

function uniqueVersions(versions: PrayerSourceVersion[]): PrayerSourceVersion[] {
  const seen = new Set<string>();
  return versions.filter((version) => {
    const key = `${version.actualLanguage}|${version.versionTitle}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCachedRemotePrayer(id: string): PrayerText | undefined {
  return (readJson(cacheStorage, REMOTE_CACHE_KEY, isPrayerTextArray) ?? []).find((prayer) => prayer.id === id);
}

function cacheRemotePrayer(prayer: PrayerText): void {
  const cached = readJson(cacheStorage, REMOTE_CACHE_KEY, isPrayerTextArray) ?? [];
  writeJson(cacheStorage, REMOTE_CACHE_KEY, mergePrayerCollections([prayer], cached).slice(0, 80));
}

function hydrateMissingSearchGuidance(prayers: PrayerText[]): PrayerText[] {
  const guidanceById = new Map(corePrayers.map((prayer) => [prayer.id, prayer.useCase]));
  return prayers.map((prayer) => ({
    ...prayer,
    useCase: prayer.useCase || guidanceById.get(prayer.id) || prayer.summary || `Open ${prayer.title} to read the full prayer.`
  }));
}

function normalizeLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(normalizeLines).filter(Boolean);
  return typeof value === "string" && value.trim() ? [value] : [];
}

function fuzzyScore(query: string, target: string): number {
  const words = query.split(/\s+/).filter(Boolean);
  const matches = words.filter((word) => target.includes(word)).length;
  return matches === words.length ? matches * 3 : 0;
}

function transliterateHebrew(input: string): string {
  if (!input.trim()) return "";
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
    .replace(/&nbsp;|&thinsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearch(input: string): string {
  return input.toLowerCase().normalize("NFKD").replace(/[’']/g, "'").replace(/[^a-z0-9\u0590-\u05ff']+/g, " ").trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

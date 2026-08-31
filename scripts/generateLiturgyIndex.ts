import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { LiturgyIndexEntry, LiturgyIndexManifest, PrayerSourceVersion, PrayerTradition } from "../src/types/prayer";

const SEFARIA = "https://www.sefaria.org";
const OUTPUT = resolve(process.cwd(), "src/data/generatedLiturgyIndex.json");
const REUSABLE_LICENSE = /^(public domain|cc0|cc[- ]by(?:[- ]sa)?)(?:\s|$|\d)/i;

type TocNode = {
  category?: unknown;
  contents?: unknown;
  title?: unknown;
  dependence?: unknown;
};

type SchemaNode = {
  default?: unknown;
  depth?: unknown;
  heTitle?: unknown;
  key?: unknown;
  nodes?: unknown;
  title?: unknown;
  titles?: unknown;
};

type IndexResponse = {
  categories?: unknown;
  schema?: unknown;
  title?: unknown;
};

type VersionResponse = {
  actualLanguage?: unknown;
  language?: unknown;
  license?: unknown;
  versionSource?: unknown;
  versionTitle?: unknown;
};

type Intent = {
  pattern: RegExp;
  aliases: string[];
  tags: string[];
  useCase: string;
};

const intents: Intent[] = [
  intent(/modeh ani|upon arising|waking|morning blessings?|elokai neshama/, ["wake up", "start my day", "morning gratitude"], ["morning", "thanks"], "Use this while beginning the day or expressing gratitude for waking up."),
  intent(/asher yatzar|healing|sick|illness|refuah|health|hagomel/, ["health", "recovery", "healing", "bathroom blessing"], ["health", "healing"], "Use this for health, recovery, healing, or gratitude for the body."),
  intent(/travell?er|journey|road|wayfar|haderech/, ["travel", "trip", "flight", "driving", "safety on the road"], ["travel", "safety"], "Use this before or during travel and journeys."),
  intent(/bread|hamotzi|food|meal|hamazon|nefashot|mezonot|wine|fruit|shehakol|after eating/, ["food", "eating", "meal", "blessing before food", "blessing after food"], ["food", "gratitude"], "Use this around eating or drinking; open it to confirm the food and timing it applies to."),
  intent(/tefillin|phylacter/, ["wrap tefillin", "put on tefillin"], ["tefillin", "weekday"], "Use this while putting on or removing tefillin."),
  intent(/tallit|tzitzit|fringes/, ["prayer shawl", "wear tallit"], ["tallit", "morning"], "Use this while putting on a tallit or handling tzitzit."),
  intent(/shema|bedtime|sleep|night prayer/, ["going to sleep", "bedtime prayer", "declaration of faith"], ["shema", "sleep"], "Use this for the Shema declaration or the bedtime prayer sequence."),
  intent(/study|learning|torah blessing|beit midrash|siyum|hadran/, ["studies", "learning", "before studying", "after studying"], ["study", "torah"], "Use this before, during, or after Torah learning and study."),
  intent(/livelihood|parnassah|success|business|prosper/, ["success", "work", "job", "income", "livelihood"], ["success", "livelihood"], "Use this when praying about work, livelihood, or success."),
  intent(/mourner|memorial|yizkor|yatom|el malei|burial|funeral|death|departed/, ["mourning", "remember someone", "memorial", "grief"], ["mourning", "memorial"], "Use this for mourning, remembrance, or a memorial observance."),
  intent(/protection|guardian|danger|war|soldier|psalm 121|shir lamaalot/, ["protection", "safety", "danger", "soldiers"], ["protection", "safety"], "Use this when seeking protection or safety."),
  intent(/repent|vidui|confession|selich|forgive|atonement|ashamnu|al chet/, ["sorry", "forgiveness", "repentance", "confession"], ["repentance", "forgiveness"], "Use this for repentance, confession, or asking forgiveness."),
  intent(/shabbat|sabbath|kiddush|havdalah|kabbalat|candle lighting|shalom aleichem/, ["Friday night", "Saturday", "Shabbat meal", "end Shabbat"], ["shabbat"], "Use this for Shabbat preparation, prayer, meals, or conclusion."),
  intent(/rosh hashana|yom kippur|sukkot|pesach|passover|haggadah|chanuk|purim|shavuot|festival|holiday|omer/, ["Jewish holiday", "festival", "holy day"], ["holiday"], "Use this as part of the named holiday or festival observance."),
  intent(/israel|state|idf|country|nation/, ["Israel", "country", "nation", "community"], ["nation", "community"], "Use this for communal prayer concerning Israel, the nation, or public welfare."),
  intent(/thanks|thanksgiving|gratitude|nishmat|hodaa|modim/, ["thank you", "thanks", "gratitude"], ["thanks", "gratitude"], "Use this to express thanks and gratitude."),
  intent(/mincha|afternoon/, ["afternoon prayer"], ["daily", "afternoon"], "Use this as part of the afternoon prayer service."),
  intent(/maariv|arvit|evening/, ["evening prayer", "night service"], ["daily", "evening"], "Use this as part of the evening prayer service."),
  intent(/shacharit|morning/, ["morning prayer", "morning service"], ["daily", "morning"], "Use this as part of the morning prayer service.")
];

void main();

async function main(): Promise<void> {
  const toc = await getJson<unknown[]>(`${SEFARIA}/api/index`);
  const liturgy = toc.find((node) => isObject(node) && node.category === "Liturgy") as TocNode | undefined;
  if (!liturgy) throw new Error("Sefaria's Liturgy catalog was not found.");

  const titles = collectWorkTitles(liturgy).sort((a, b) => a.localeCompare(b));
  const excludedWorks: LiturgyIndexManifest["excludedWorks"] = [];
  const entries: LiturgyIndexEntry[] = [];
  let workCount = 0;

  for (const [index, title] of titles.entries()) {
    process.stdout.write(`[${index + 1}/${titles.length}] ${title}\n`);
    const [workPayload, versionsPayload] = await Promise.all([
      getJson<unknown>(`${SEFARIA}/api/v2/index/${encodeURIComponent(title)}`),
      getJson<unknown>(`${SEFARIA}/api/texts/versions/${encodeURIComponent(title)}`)
    ]);
    if (!isObject(workPayload) || typeof workPayload.error === "string" || !isObject(workPayload.schema)) {
      const reason = isObject(workPayload) && typeof workPayload.error === "string" ? workPayload.error : "No readable text schema is currently available.";
      excludedWorks.push({ title, reason });
      continue;
    }
    workCount += 1;
    const work = workPayload as IndexResponse;
    const versions = Array.isArray(versionsPayload) ? versionsPayload as VersionResponse[] : [];
    const reusableVersions = versions.map(normalizeVersion).filter((version): version is PrayerSourceVersion => version !== null && isReusableLicense(version.license));
    const sourceVersion = chooseSourceVersion(reusableVersions);
    const translationVersions = chooseTranslations(reusableVersions);
    const categories = stringArray(work.categories);
    const schema = isObject(work.schema) ? work.schema as SchemaNode : null;
    if (!schema) throw new Error(`No schema found for ${title}`);

    const leaves = collectSchemaLeaves(schema);
    for (const leaf of leaves) {
      entries.push(createEntry(title, categories, leaf, sourceVersion, translationVersions));
    }
  }

  const deduped = deduplicateEntries(entries).sort((a, b) => a.ref.localeCompare(b.ref));
  const languages = [...new Set(deduped.flatMap((entry) => entry.translationVersions.map((version) => version.actualLanguage)))].sort();
  const manifest: LiturgyIndexManifest = {
    generatedAt: new Date().toISOString(),
    sourceApi: `${SEFARIA}/api/v2/index/{work}`,
    sourceCatalog: `${SEFARIA}/api/index`,
    workCount,
    entryCount: deduped.length,
    languages,
    excludedWorks,
    entries: deduped
  };

  writeFileSync(OUTPUT, `${JSON.stringify(manifest)}\n`, "utf8");
  process.stdout.write(`Wrote ${manifest.entryCount} sections from ${manifest.workCount} works to ${OUTPUT}\n`);
}

function collectWorkTitles(node: TocNode): string[] {
  const contents = Array.isArray(node.contents) ? node.contents as TocNode[] : [];
  const title = typeof node.title === "string" ? node.title : "";
  const dependence = typeof node.dependence === "string" ? node.dependence : "";
  const own = title && dependence.toLowerCase() !== "commentary" && contents.length === 0 ? [title] : [];
  return [...own, ...contents.flatMap(collectWorkTitles)];
}

function collectSchemaLeaves(node: SchemaNode, parents: { title: string; hebrewTitle: string }[] = []): { title: string; hebrewTitle: string; path: string[]; hebrewPath: string[] }[] {
  const title = primaryTitle(node, "en");
  const hebrewTitle = primaryTitle(node, "he");
  const includeNode = node.default !== true && title.length > 0;
  const nextParents = includeNode ? [...parents, { title, hebrewTitle }] : parents;
  const children = Array.isArray(node.nodes) ? node.nodes.filter(isObject) as SchemaNode[] : [];

  if (children.length > 0) return children.flatMap((child) => collectSchemaLeaves(child, nextParents));
  const path = nextParents.map((part) => part.title).filter(Boolean);
  if (path.length === 0) return [{ title: "Complete text", hebrewTitle: "", path: [], hebrewPath: [] }];
  return [{ title: path.at(-1) ?? "Complete text", hebrewTitle: nextParents.at(-1)?.hebrewTitle ?? "", path, hebrewPath: nextParents.map((part) => part.hebrewTitle) }];
}

function createEntry(
  work: string,
  categories: string[],
  leaf: { title: string; hebrewTitle: string; path: string[]; hebrewPath: string[] },
  sourceVersion: PrayerSourceVersion | null,
  translationVersions: PrayerSourceVersion[]
): LiturgyIndexEntry {
  const path = leaf.path[0] === work ? leaf.path.slice(1) : leaf.path;
  const ref = [work, ...path].join(", ");
  const searchable = `${work} ${path.join(" ")}`;
  const matchedIntents = intents.filter((item) => item.pattern.test(searchable));
  const useCase = matchedIntents[0]?.useCase ?? `Use this section while following ${humanizePath(work, path)}.`;
  const aliases = unique([leaf.hebrewTitle, ...matchedIntents.flatMap((item) => item.aliases)]).filter(Boolean);
  const tags = unique([categories.at(-1) ?? "liturgy", traditionFor(work), ...matchedIntents.flatMap((item) => item.tags)]);

  return {
    id: `sefaria-${slugify(ref)}`,
    title: leaf.title === "Complete text" ? work : leaf.title,
    hebrewTitle: leaf.hebrewTitle,
    ref,
    work,
    categories,
    path,
    tradition: traditionFor(work),
    aliases,
    tags,
    summary: path.length > 0 ? `${path.join(" · ")} in ${work}` : `Complete text of ${work}`,
    useCase,
    sourceVersion,
    translationVersions
  };
}

function chooseSourceVersion(versions: PrayerSourceVersion[]): PrayerSourceVersion | null {
  return [...versions]
    .filter((version) => version.actualLanguage === "he" || version.language === "he")
    .sort(compareVersions)[0] ?? null;
}

function chooseTranslations(versions: PrayerSourceVersion[]): PrayerSourceVersion[] {
  const byLanguage = new Map<string, PrayerSourceVersion>();
  for (const version of [...versions].filter((item) => item.actualLanguage !== "he").sort(compareVersions)) {
    if (!byLanguage.has(version.actualLanguage)) byLanguage.set(version.actualLanguage, version);
  }
  return [...byLanguage.values()].sort((a, b) => a.actualLanguage.localeCompare(b.actualLanguage));
}

function compareVersions(a: PrayerSourceVersion, b: PrayerSourceVersion): number {
  return licenseRank(a.license) - licenseRank(b.license) || a.versionTitle.localeCompare(b.versionTitle);
}

function licenseRank(license: string): number {
  const clean = license.toLowerCase();
  if (clean.includes("public domain")) return 0;
  if (clean.includes("cc0")) return 1;
  if (/cc[- ]by(?:\s|$|\d)/i.test(clean)) return 2;
  return 3;
}

function normalizeVersion(value: VersionResponse): PrayerSourceVersion | null {
  if (typeof value.versionTitle !== "string" || typeof value.language !== "string" || typeof value.license !== "string") return null;
  return {
    versionTitle: value.versionTitle,
    language: value.language,
    actualLanguage: typeof value.actualLanguage === "string" ? value.actualLanguage : value.language,
    license: value.license,
    versionSource: typeof value.versionSource === "string" ? value.versionSource : ""
  };
}

function isReusableLicense(license: string): boolean {
  return REUSABLE_LICENSE.test(license.trim());
}

function primaryTitle(node: SchemaNode, language: "en" | "he"): string {
  const direct = language === "en" ? node.title : node.heTitle;
  if (typeof direct === "string") return direct;
  const titles = Array.isArray(node.titles) ? node.titles : [];
  const primary = titles.find((item) => isObject(item) && item.lang === language && item.primary === true);
  return isObject(primary) && typeof primary.text === "string" ? primary.text : "";
}

function traditionFor(work: string): PrayerTradition {
  const normalized = work.toLowerCase();
  if (normalized.includes("edot hamiz")) return "edot-hamizrach";
  if (normalized.includes("chabad")) return "chabad";
  if (normalized.includes("sefard")) return "sefard";
  if (normalized.includes("ashkenaz") || normalized.includes("lita") || normalized.includes("polin")) return "ashkenaz";
  return "varies";
}

function humanizePath(work: string, path: string[]): string {
  if (path.length === 0) return work;
  return `${path.slice(0, -1).join(", ") || work}`;
}

function deduplicateEntries(entries: LiturgyIndexEntry[]): LiturgyIndexEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = entry.ref.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function slugify(input: string): string {
  return input.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function intent(pattern: RegExp, aliases: string[], tags: string[], useCase: string): Intent {
  return { pattern: new RegExp(pattern.source, pattern.flags.includes("i") ? pattern.flags : `${pattern.flags}i`), aliases, tags, useCase };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return await response.json() as T;
}

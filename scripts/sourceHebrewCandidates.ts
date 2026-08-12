import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

type SourceSpec = {
  ref: string;
  preserveSmall?: boolean;
  select?: (line: string, index: number, lines: string[]) => boolean;
};

type CandidateSpec = {
  id: string;
  sources: SourceSpec[];
};

type SefariaVersion = {
  language?: unknown;
  license?: unknown;
  text?: unknown;
  versionTitle?: unknown;
};

type SefariaResponse = {
  ref?: unknown;
  versions?: unknown;
};

const all = () => true;
const indices = (...included: number[]) => (_line: string, index: number) => included.includes(index);
const range = (start: number, end: number) => (_line: string, index: number) => index >= start && index <= end;

const specs: CandidateSpec[] = [
  candidate("shema", source("Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Shema", indices(2, 4, 5, 6, 7), true)),
  candidate("asher-yatzar", source("Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Asher Yatzar")),
  candidate("torah-blessings", source("Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Torah Blessings")),
  candidate("tefilat-haderech", source("Siddur Sefard, Blessings, Traveler's Prayer", indices(2), true)),
  candidate("psalm-121", source("Psalms 121")),
  candidate("psalm-23", source("Psalms 23")),
  candidate(
    "birkat-hamazon",
    source("Birkat Hamazon, Blessing on the Food"),
    source("Birkat Hamazon, Blessing on the Land", indices(0, 4)),
    source("Birkat Hamazon, Blessing on Jerusalem", indices(0, 10)),
    source("Birkat Hamazon, Hatov Vehametiv", indices(0, 1, 2, 4, 5, 11, 12))
  ),
  candidate("borei-nefashot", source("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Brachot Achronot, Borei Nefashot", indices(2))),
  candidate("bedtime-shema", source("Siddur Sefard, Bedtime Shema", all)),
  candidate("kaddish-yatom", source("Siddur Ashkenaz, Kaddish, Mourner's Kaddish")),
  candidate("aleinu", source("Siddur Ashkenaz, Shabbat, Maariv, Aleinu")),
  candidate("adon-olam", source("Siddur Ashkenaz, Shabbat, Maariv, Adon Olam", range(1, 10))),
  candidate("kiddush-friday-night", source("Siddur Ashkenaz, Shabbat, Shabbat Evening, Kiddush", indices(1, 3, 4, 5, 6))),
  candidate("havdalah", source("Siddur Ashkenaz, Shabbat, Havdalah")),
  candidate("chanukah-candles", source("Siddur Ashkenaz, Festivals, Chanukah, Service for Lighting Chanukah Candles, Blessings on Chanukah Candles", range(1, 7))),
  candidate(
    "counting-omer",
    source("Siddur Edot HaMizrach, Counting of the Omer", (_line, index) => index === 3 || (index >= 5 && index <= 149 && (index - 5) % 3 === 0) || index === 151)
  ),
  candidate("vidui", source("Siddur Ashkenaz, Weekday, Shacharit, Post Amidah, Vidui and 13 Middot", indices(1, 2, 3))),
  candidate("prayer-for-livelihood", source("Siddur Sefard, Various Prayers & Segulot, Prayer for Livelihood", indices(1, 2))),
  candidate("ana-bekoach", source("Siddur Ashkenaz, Shabbat, Kabbalat Shabbat, Ana Bekoach")),
  candidate("nishmat", source("Siddur Ashkenaz, Shabbat, Shacharit, Pesukei Dezimra, Nishmat Kol Chai")),
  candidate("prayer-state-israel", source("Siddur Ashkenaz, Shabbat, Shacharit, Communal Prayers, Prayer of the State of Israel")),
  candidate("idf-prayer", source("Siddur Ashkenaz, Shabbat, Shacharit, Communal Prayers, Prayer for Israeli Soldiers"))
];

void main();

async function main(): Promise<void> {
  const candidates = await Promise.all(
    specs.map(async (spec) => {
      const snapshots = await Promise.all(spec.sources.map(fetchSource));
      return {
        id: spec.id,
        hebrew: snapshots.flatMap((snapshot) => snapshot.hebrew),
        sources: snapshots.map(({ hebrew: _hebrew, ...metadata }) => metadata)
      };
    })
  );

  const output = resolve(process.cwd(), "src/data/generatedHebrewCandidates.json");
  writeFileSync(output, `${JSON.stringify({ retrievedAt: new Date().toISOString(), candidates }, null, 2)}\n`, "utf8");
  console.log(`Wrote ${candidates.length} source-backed Hebrew candidates to ${output}`);
}

async function fetchSource(spec: SourceSpec) {
  const endpoint = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(spec.ref)}?version=hebrew`;
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Sefaria returned ${response.status} for ${spec.ref}`);

  const payload = (await response.json()) as SefariaResponse;
  const versions = Array.isArray(payload.versions) ? payload.versions as SefariaVersion[] : [];
  const version = versions.find((item) => item.language === "he" && item.text !== undefined);
  if (!version || typeof version.versionTitle !== "string") throw new Error(`No Hebrew version found for ${spec.ref}`);

  const rawLines = flattenText(version.text);
  const select = spec.select ?? all;
  const hebrew = rawLines
    .filter(select)
    .map((line) => cleanSefariaText(line, spec.preserveSmall === true))
    .filter((line) => /[\u0590-\u05FF]/.test(line));
  if (hebrew.length === 0) throw new Error(`No Hebrew candidate lines remained for ${spec.ref}`);

  return {
    ref: typeof payload.ref === "string" ? payload.ref : spec.ref,
    versionTitle: version.versionTitle,
    license: typeof version.license === "string" ? version.license : "Unknown; verify before release",
    url: `https://www.sefaria.org/${encodeURIComponent(spec.ref.replaceAll(" ", "_"))}`,
    hebrew
  };
}

function flattenText(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(flattenText);
  return typeof value === "string" && value.trim() ? [value] : [];
}

function cleanSefariaText(value: string, preserveSmall: boolean): string {
  return value
    .replace(preserveSmall ? /<\/?small[^>]*>/gi : /<small[^>]*>[\s\S]*?<\/small>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&thinsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\(\s*תוֹרָתְךָ\)/g, "")
    .replace(/\[אם דעתו לחזור מיד אומר:\s*/g, "[")
    .replace(/\s+/g, " ")
    .trim();
}

function source(ref: string, select?: SourceSpec["select"], preserveSmall = false): SourceSpec {
  return select ? { ref, select, preserveSmall } : { ref, preserveSmall };
}

function candidate(id: string, ...sources: SourceSpec[]): CandidateSpec {
  return { id, sources };
}

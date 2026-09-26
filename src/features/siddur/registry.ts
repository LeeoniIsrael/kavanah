import type { Nusach, Scope, SiddurDefinition, SiddurVersion } from "./model";
const entries: [string, Nusach, Scope, string?][] = [
  ["Siddur Ashkenaz", "ASHKENAZ", "COMPLETE"],
  ["Siddur Sefard", "SEFARD", "COMPLETE"],
  ["Siddur Edot HaMizrach", "EDOT_HAMIZRACH", "COMPLETE"],
  ["Weekday Siddur Chabad", "ARI_CHABAD", "WEEKDAY"],
  ["Machzor Rosh Hashanah Ashkenaz", "ASHKENAZ", "MACHZOR", "Rosh Hashanah"],
  ["Machzor Rosh Hashanah Sefard", "SEFARD", "MACHZOR", "Rosh Hashanah"],
  [
    "Machzor Rosh Hashanah Edot HaMizrach",
    "EDOT_HAMIZRACH",
    "MACHZOR",
    "Rosh Hashanah",
  ],
  ["Machzor Yom Kippur Ashkenaz", "ASHKENAZ", "MACHZOR", "Yom Kippur"],
  ["Machzor Yom Kippur Sefard", "SEFARD", "MACHZOR", "Yom Kippur"],
  [
    "Machzor Yom Kippur Edot HaMizrach",
    "EDOT_HAMIZRACH",
    "MACHZOR",
    "Yom Kippur",
  ],
];
export const candidateBooks = entries.map(([title, rite, scope, occasion]) => ({
  id: title,
  sefariaIndex: title,
  displayName: title,
  rite,
  scope,
  occasion,
  category: (scope === "MACHZOR"
    ? "machzor"
    : "siddur") as SiddurDefinition["category"],
  presentation: "STANDARD" as const,
}));
export const allowedLicense = (license: string | undefined) =>
  license === "Public Domain" || license === "CC0";
export function chooseVersions(
  versions: SiddurVersion[],
): Pick<SiddurDefinition, "versions" | "availability" | "fallbackEnglish"> {
  const permitted = versions.filter((v) => allowedLicense(v.license));
  const preferred = (lang: "en" | "he", title: string) =>
    permitted.find((v) => v.language === lang && v.versionTitle === title);
  const he =
    preferred("he", "Daat Siddur Ashkenaz") ??
    preferred("he", "Torat Emet 357") ??
    permitted.find((v) => v.language === "he");
  const en =
    preferred("en", "Sefaria Community Translation") ??
    permitted.find((v) => v.language === "en");
  const fallbackEnglish = preferred(
    "en",
    "The Standard Prayer Book, tr. by Simeon Singer, [1915]",
  );
  return {
    versions: { he, en },
    availability: { he: !!he, en: !!en },
    fallbackEnglish,
  };
}
// Catalog dimensions remain explicit even where no verified open edition is available.
export const futureCatalog = {
  rites: [
    "SPANISH_PORTUGUESE",
    "BALADI",
    "SHAMI",
    "ITALKIM",
    "ROMANIOTE",
    "KARAITE",
  ] as const,
  denominations: [
    "ORTHODOX",
    "MODERN_ORTHODOX",
    "CONSERVATIVE",
    "REFORM",
    "RECONSTRUCTIONIST",
    "RENEWAL",
    "HUMANISTIC",
  ] as const,
  presentations: ["INTERLINEAR", "TRANSLITERATED"] as const,
};

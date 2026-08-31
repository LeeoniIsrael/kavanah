export type PrayerToken = {
  id: string;
  hebrew: string;
  translation: string;
  transliteration: string;
};

export type PrayerCategory =
  | "daily"
  | "tefillin"
  | "food"
  | "safety"
  | "health"
  | "thanks"
  | "success"
  | "study"
  | "protection"
  | "travel"
  | "shabbat"
  | "holiday"
  | "mourning"
  | "sleep"
  | "repentance"
  | "nation"
  | "source";

export type HebrewContentKind = "complete" | "excerpt" | "collection" | "missing" | "remote-unreviewed";

export type HebrewReviewStatus = "pending" | "approved" | "changes-requested";

export type PrayerTradition =
  | "common"
  | "ashkenaz"
  | "sefard"
  | "edot-hamizrach"
  | "chabad"
  | "scriptural"
  | "modern-israeli"
  | "varies";

export type HebrewReview = {
  contentKind: HebrewContentKind;
  status: HebrewReviewStatus;
  tradition: PrayerTradition;
  sourceTitle: string;
  sourceRef: string;
  sourceUrl: string;
  licenseStatus: "verified" | "verification-required";
  reviewer?: string;
  reviewedAt?: string;
  notes?: string;
};

export type PrayerSourceVersion = {
  versionTitle: string;
  language: string;
  actualLanguage: string;
  license: string;
  versionSource: string;
};

export type PrayerSourceMetadata = {
  work: string;
  categories: string[];
  path: string[];
  hebrewTitle: string;
  sourceVersion: PrayerSourceVersion | null;
  translationVersions: PrayerSourceVersion[];
};

export type PrayerText = {
  id: string;
  title: string;
  sefariaRef: string;
  category: PrayerCategory;
  summary: string;
  useCase: string;
  aliases: string[];
  tags: string[];
  tokens: PrayerToken[];
  source: "sefaria" | "local-cache" | "sefaria-search";
  updatedAt: string;
  hebrewReview: HebrewReview;
  sourceMetadata?: PrayerSourceMetadata;
};

export type LiturgyIndexEntry = {
  id: string;
  title: string;
  hebrewTitle: string;
  ref: string;
  work: string;
  categories: string[];
  path: string[];
  tradition: PrayerTradition;
  aliases: string[];
  tags: string[];
  summary: string;
  useCase: string;
  sourceVersion: PrayerSourceVersion | null;
  translationVersions: PrayerSourceVersion[];
};

export type LiturgyIndexManifest = {
  generatedAt: string;
  sourceApi: string;
  sourceCatalog: string;
  workCount: number;
  entryCount: number;
  languages: string[];
  excludedWorks: { title: string; reason: string }[];
  entries: LiturgyIndexEntry[];
};

export type PrayerSearchResult = {
  prayer: PrayerText;
  score: number;
  reason: string;
};

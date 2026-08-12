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

export type HebrewReview = {
  contentKind: HebrewContentKind;
  status: HebrewReviewStatus;
  tradition: "common" | "ashkenaz" | "sefard" | "scriptural" | "modern-israeli" | "varies";
  sourceTitle: string;
  sourceRef: string;
  sourceUrl: string;
  licenseStatus: "verified" | "verification-required";
  reviewer?: string;
  reviewedAt?: string;
  notes?: string;
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
};

export type PrayerSearchResult = {
  prayer: PrayerText;
  score: number;
  reason: string;
};

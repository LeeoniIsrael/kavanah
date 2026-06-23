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

export type PrayerText = {
  id: string;
  title: string;
  sefariaRef: string;
  category: PrayerCategory;
  summary: string;
  aliases: string[];
  tags: string[];
  tokens: PrayerToken[];
  source: "sefaria" | "local-cache" | "sefaria-search";
  updatedAt: string;
};

export type PrayerSearchResult = {
  prayer: PrayerText;
  score: number;
  reason: string;
};

export type PrayerToken = {
  id: string;
  hebrew: string;
  translation: string;
  transliteration: string;
};

export type PrayerText = {
  id: string;
  title: string;
  sefariaRef: string;
  category: "daily" | "travel" | "nation" | "study";
  tokens: PrayerToken[];
  source: "sefaria" | "local-cache";
  updatedAt: string;
};

export type PrayerSearchResult = {
  prayer: PrayerText;
  score: number;
  reason: string;
};

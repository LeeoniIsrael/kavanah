import { create } from "zustand";

import { cacheStorage, readJson, writeJson } from "@/services/mmkv";
import { getCachedPrayers, hydratePrayerFromSefaria, mergePrayerCollections, searchPrayers, searchSefariaPrayerRefs, syncCorePrayers } from "@/services/prayerService";
import type { PrayerSearchResult, PrayerText } from "@/types/prayer";

const BOOKMARKS_KEY = "prayers.bookmarks";

type PrayerState = {
  prayers: PrayerText[];
  query: string;
  results: PrayerSearchResult[];
  selectedPrayerId: string;
  isSyncing: boolean;
  isSearchingRemote: boolean;
  bookmarkedPrayerIds: string[];
  setQuery: (query: string) => void;
  searchRemote: (query?: string) => Promise<void>;
  selectPrayer: (id: string) => Promise<void>;
  toggleBookmark: (id: string) => void;
  sync: () => Promise<void>;
};

const cached = getCachedPrayers();
const persistedBookmarks = readJson(cacheStorage, BOOKMARKS_KEY, isStringArray) ?? ["tefillin-blessing"];

export const usePrayerStore = create<PrayerState>((set, get) => ({
  prayers: cached,
  query: "",
  results: searchPrayers("", cached),
  selectedPrayerId: cached[0]?.id ?? "shema",
  isSyncing: false,
  isSearchingRemote: false,
  bookmarkedPrayerIds: persistedBookmarks,
  setQuery: (query) => {
    const prayers = get().prayers;
    set({ query, results: searchPrayers(query, prayers) });
  },
  searchRemote: async (queryOverride) => {
    const query = (queryOverride ?? get().query).trim();
    if (query.length < 3) {
      return;
    }
    set({ isSearchingRemote: true });
    try {
      const remotePrayers = await searchSefariaPrayerRefs(query);
      const prayers = mergePrayerCollections(get().prayers, remotePrayers);
      set({ prayers, results: searchPrayers(query, prayers) });
    } finally {
      set({ isSearchingRemote: false });
    }
  },
  selectPrayer: async (id) => {
    set({ selectedPrayerId: id });
    const prayer = get().prayers.find((item) => item.id === id);
    if (!prayer || prayer.source === "sefaria") {
      return;
    }
    try {
      const hydrated = await hydratePrayerFromSefaria(prayer);
      set((state) => {
        const prayers = state.prayers.map((item) => (item.id === id ? hydrated : item));
        return {
          prayers,
          results: searchPrayers(state.query, prayers),
          selectedPrayerId: id
        };
      });
    } catch {
      set({ selectedPrayerId: id });
    }
  },
  toggleBookmark: (id) => {
    set((state) => {
      const bookmarkedPrayerIds = state.bookmarkedPrayerIds.includes(id) ? state.bookmarkedPrayerIds.filter((bookmarkId) => bookmarkId !== id) : [id, ...state.bookmarkedPrayerIds];
      writeJson(cacheStorage, BOOKMARKS_KEY, bookmarkedPrayerIds);
      return { bookmarkedPrayerIds };
    });
  },
  sync: async () => {
    set({ isSyncing: true });
    try {
      const prayers = await syncCorePrayers();
      set((state) => ({
        prayers,
        results: searchPrayers(state.query, prayers),
        selectedPrayerId: prayers.some((prayer) => prayer.id === state.selectedPrayerId) ? state.selectedPrayerId : prayers[0]?.id ?? "shema"
      }));
    } finally {
      set({ isSyncing: false });
    }
  }
}));

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

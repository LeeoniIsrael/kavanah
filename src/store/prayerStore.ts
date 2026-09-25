import { recoverPrayerHistory } from "@/services/activityCalendar";
import { useSocialStore } from "@/store/socialStore";
import { readSocialData, writeSocialData } from "@/services/socialStorage";
import { create } from "zustand";

import { cacheStorage, readJson, writeJson } from "@/services/mmkv";
import {
  getCachedPrayers,
  hydratePrayerFromSefaria,
  mergePrayerCollections,
  searchPrayers,
  searchSefariaPrayerRefs,
  syncCorePrayers,
} from "@/services/prayerService";
import type { PrayerSearchResult, PrayerText } from "@/types/prayer";

const BOOKMARKS_KEY = "prayers.bookmarks";
const HISTORY_KEY = "prayers.history.v1";

export type PrayerHistoryEntry = {
  id: string;
  prayerId: string;
  prayerTitle: string;
  completedAt: string;
  startedAt?: string;
  durationSeconds?: number;
  source: "guided-reading" | "reader" | "imported-activity";
};

type PrayerState = {
  prayers: PrayerText[];
  query: string;
  results: PrayerSearchResult[];
  selectedPrayerId: string;
  isSyncing: boolean;
  isSearchingRemote: boolean;
  loadingPrayerId: string | null;
  prayerLoadError: string | null;
  bookmarkedPrayerIds: string[];
  history: PrayerHistoryEntry[];
  setQuery: (query: string) => void;
  searchRemote: (query?: string) => Promise<void>;
  selectPrayer: (id: string) => Promise<void>;
  toggleBookmark: (id: string) => void;
  recordCompletion: (
    prayer: Pick<PrayerText, "id" | "title">,
    completedAt?: Date,
    startedAt?: Date,
    source?: PrayerHistoryEntry["source"],
  ) => PrayerHistoryEntry;
  sync: () => Promise<void>;
};

const cached = getCachedPrayers();
const persistedBookmarks = readJson(
  cacheStorage,
  BOOKMARKS_KEY,
  isStringArray,
) ?? ["tefillin-blessing"];
const persistedHistory = recoverPrayerHistory(
  readSocialData(HISTORY_KEY, isPrayerHistoryArray) ?? [],
  useSocialStore.getState().posts,
);

if (persistedHistory.length) writeSocialData(HISTORY_KEY, persistedHistory);

export const usePrayerStore = create<PrayerState>((set, get) => ({
  prayers: cached,
  query: "",
  results: searchPrayers("", cached),
  selectedPrayerId: cached[0]?.id ?? "shema",
  isSyncing: false,
  isSearchingRemote: false,
  loadingPrayerId: null,
  prayerLoadError: null,
  bookmarkedPrayerIds: persistedBookmarks,
  history: persistedHistory,
  setQuery: (query) => {
    const prayers = get().prayers;
    set({ query, results: searchPrayers(query, prayers) });
  },
  searchRemote: async (queryOverride) => {
    const query = (queryOverride ?? get().query).trim();
    if (query.length < 2) {
      return;
    }
    set({ isSearchingRemote: true });
    try {
      const remotePrayers = await searchSefariaPrayerRefs(query);
      const prayers = mergePrayerCollections(get().prayers, remotePrayers);
      if (get().query.trim().toLowerCase() === query.toLowerCase()) {
        set({ prayers, results: searchPrayers(query, prayers) });
      }
    } finally {
      set({ isSearchingRemote: false });
    }
  },
  selectPrayer: async (id) => {
    set({ selectedPrayerId: id, loadingPrayerId: null, prayerLoadError: null });
    const prayer = get().prayers.find((item) => item.id === id);
    if (!prayer || prayer.source !== "sefaria-search") {
      return;
    }
    set({ loadingPrayerId: id });
    try {
      const hydrated = await hydratePrayerFromSefaria(prayer);
      set((state) => {
        const prayers = state.prayers.map((item) =>
          item.id === id ? hydrated : item,
        );
        return {
          prayers,
          results: searchPrayers(state.query, prayers),
          loadingPrayerId:
            state.loadingPrayerId === id ? null : state.loadingPrayerId,
          prayerLoadError:
            state.selectedPrayerId === id ? null : state.prayerLoadError,
        };
      });
    } catch (error) {
      set((state) =>
        state.selectedPrayerId === id
          ? {
              loadingPrayerId: null,
              prayerLoadError:
                error instanceof Error
                  ? error.message
                  : "This prayer could not be loaded right now.",
            }
          : state,
      );
    }
  },
  toggleBookmark: (id) => {
    set((state) => {
      const bookmarkedPrayerIds = state.bookmarkedPrayerIds.includes(id)
        ? state.bookmarkedPrayerIds.filter((bookmarkId) => bookmarkId !== id)
        : [id, ...state.bookmarkedPrayerIds];
      writeJson(cacheStorage, BOOKMARKS_KEY, bookmarkedPrayerIds);
      return { bookmarkedPrayerIds };
    });
  },
  recordCompletion: (
    prayer,
    completedAt = new Date(),
    startedAt,
    source = "guided-reading",
  ) => {
    const entry: PrayerHistoryEntry = {
      id: `${completedAt.toISOString()}-${prayer.id}`,
      prayerId: prayer.id,
      prayerTitle: prayer.title,
      completedAt: completedAt.toISOString(),
      ...(startedAt && startedAt <= completedAt
        ? {
            startedAt: startedAt.toISOString(),
            durationSeconds: Math.floor(
              (completedAt.getTime() - startedAt.getTime()) / 1000,
            ),
          }
        : {}),
      source,
    };
    set((state) => {
      const history = [entry, ...state.history].slice(0, 5000);
      writeSocialData(HISTORY_KEY, history);
      return { history };
    });
    return entry;
  },
  sync: async () => {
    set({ isSyncing: true });
    try {
      const prayers = await syncCorePrayers();
      set((state) => ({
        prayers,
        results: searchPrayers(state.query, prayers),
        selectedPrayerId: prayers.some(
          (prayer) => prayer.id === state.selectedPrayerId,
        )
          ? state.selectedPrayerId
          : (prayers[0]?.id ?? "shema"),
      }));
    } finally {
      set({ isSyncing: false });
    }
  },
}));

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isPrayerHistoryArray(value: unknown): value is PrayerHistoryEntry[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      const entry = item as Partial<PrayerHistoryEntry>;
      return (
        typeof entry.id === "string" &&
        typeof entry.prayerId === "string" &&
        typeof entry.prayerTitle === "string" &&
        typeof entry.completedAt === "string" &&
        (entry.source === "guided-reading" ||
          entry.source === "reader" ||
          entry.source === "imported-activity")
      );
    })
  );
}

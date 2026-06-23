import { create } from "zustand";

import { getCachedPrayers, searchPrayers, syncCorePrayers } from "@/services/prayerService";
import type { PrayerSearchResult, PrayerText } from "@/types/prayer";

type PrayerState = {
  prayers: PrayerText[];
  query: string;
  results: PrayerSearchResult[];
  selectedPrayerId: string;
  isSyncing: boolean;
  setQuery: (query: string) => void;
  selectPrayer: (id: string) => void;
  sync: () => Promise<void>;
};

const cached = getCachedPrayers();

export const usePrayerStore = create<PrayerState>((set, get) => ({
  prayers: cached,
  query: "",
  results: searchPrayers("", cached),
  selectedPrayerId: cached[0]?.id ?? "shema",
  isSyncing: false,
  setQuery: (query) => {
    const prayers = get().prayers;
    set({ query, results: searchPrayers(query, prayers) });
  },
  selectPrayer: (id) => set({ selectedPrayerId: id }),
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

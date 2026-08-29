import { create } from "zustand";

import { requestZmanimLocation } from "@/services/location";
import { scheduleZmanNotifications } from "@/services/notifications";
import { calculateZmanimRange } from "@/services/zmanimService";
import { useSettingsStore } from "@/store/settingsStore";
import type { GeoPoint, Zman } from "@/types/zmanim";

type ZmanimState = {
  location: GeoPoint | null;
  zmanim: Zman[];
  upcomingZmanim: Zman[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useZmanimStore = create<ZmanimState>((set) => ({
  location: null,
  zmanim: [],
  upcomingZmanim: [],
  isLoading: false,
  error: null,
  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      const location = await requestZmanimLocation();
      const now = new Date();
      const schedule = await calculateZmanimRange(location, now, 7);
      const dateKey = toDateKey(now);
      const zmanim = schedule.filter((zman) => toDateKey(zman.time) === dateKey);
      const upcomingZmanim = schedule.filter((zman) => zman.time.getTime() > now.getTime());
      if (useSettingsStore.getState().zmanNotificationsEnabled) {
        await scheduleZmanNotifications(schedule);
      }
      set({ location, zmanim, upcomingZmanim });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Local times could not be calculated right now." });
    } finally {
      set({ isLoading: false });
    }
  }
}));

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

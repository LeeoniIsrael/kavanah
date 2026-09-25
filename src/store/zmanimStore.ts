import { create } from "zustand";

import { requestZmanimLocation } from "@/services/location";
import { calculateZmanimRange } from "@/services/zmanimService";
import type { GeoPoint, Zman } from "@/types/zmanim";

type ZmanimState = {
  location: GeoPoint | null;
  locationCheckedAt: number | null;
  zmanim: Zman[];
  upcomingZmanim: Zman[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useZmanimStore = create<ZmanimState>((set, get) => ({
  location: null,
  locationCheckedAt: null,
  zmanim: [],
  upcomingZmanim: [],
  isLoading: false,
  error: null,
  refresh: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const location = await requestZmanimLocation();
      const now = new Date();
      const schedule = await calculateZmanimRange(location, now, 7);
      const dateKey = toDateKey(now);
      const zmanim = schedule.filter(
        (zman) => toDateKey(zman.time) === dateKey,
      );
      const upcomingZmanim = schedule.filter(
        (zman) => zman.time.getTime() > now.getTime(),
      );
      set({
        location,
        locationCheckedAt: now.getTime(),
        zmanim,
        upcomingZmanim,
      });
    } catch {
      set({
        error:
          "Couldn’t get local prayer times. Check location access in Settings, then tap Update.",
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

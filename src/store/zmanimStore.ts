import { create } from "zustand";

import { requestZmanimLocation } from "@/services/location";
import { scheduleZmanNotifications } from "@/services/notifications";
import { calculateZmanim } from "@/services/zmanimService";
import type { GeoPoint, Zman } from "@/types/zmanim";

type ZmanimState = {
  location: GeoPoint | null;
  zmanim: Zman[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export const useZmanimStore = create<ZmanimState>((set) => ({
  location: null,
  zmanim: [],
  isLoading: false,
  refresh: async () => {
    set({ isLoading: true });
    try {
      const location = await requestZmanimLocation();
      const zmanim = await calculateZmanim(location);
      await scheduleZmanNotifications(zmanim);
      set({ location, zmanim });
    } finally {
      set({ isLoading: false });
    }
  }
}));

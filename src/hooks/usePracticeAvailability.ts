import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useZmanimStore } from "@/store/zmanimStore";
import { useSettingsStore } from "@/store/settingsStore";
import { currentPrayerAvailability } from "@/services/currentPrayerAvailability";

export function usePracticeAvailability() {
  const [, tick] = useState(0);
  useZmanimStore((s) => s.locationCheckedAt);
  useSettingsStore((s) => s.calendarInIsrael);
  useEffect(() => {
    const refresh = () => {
      tick((n) => n + 1);
      const state = useZmanimStore.getState();
      if (
        !state.locationCheckedAt ||
        Date.now() - state.locationCheckedAt > 45 * 60 * 1000
      )
        void state.refresh();
    };
    refresh();
    const timer = setInterval(() => tick((n) => n + 1), 30000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return currentPrayerAvailability;
}

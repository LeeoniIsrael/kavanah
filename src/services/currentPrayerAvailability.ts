import { practiceAvailability } from "./prayerAvailability";
import { useZmanimStore } from "@/store/zmanimStore";
import { useSettingsStore } from "@/store/settingsStore";

export function currentPrayerAvailability(
  practice: string | undefined,
  now = new Date(),
) {
  const { location, locationCheckedAt } = useZmanimStore.getState();
  // Never enforce a deadline using an old location or the display service's estimated times.
  const fresh =
    locationCheckedAt !== null &&
    now.getTime() >= locationCheckedAt &&
    now.getTime() - locationCheckedAt < 60 * 60 * 1000;
  return practiceAvailability(
    practice,
    now,
    fresh ? location : null,
    useSettingsStore.getState().calendarInIsrael,
  );
}

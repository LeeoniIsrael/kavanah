import { useAppearanceStore } from "@/design/appearance";
import { useZmanimStore } from "@/store/zmanimStore";
import { updateNextPrayerWidget } from "@/widgets/syncNextPrayerWidget";
import { useEffect } from "react";
import { Platform } from "react-native";

export function WidgetSync(): null {
  const upcomingZmanim = useZmanimStore((state) => state.upcomingZmanim);
  const locationLabel = useZmanimStore((state) => state.location?.label);
  const appearance = useAppearanceStore((state) => state.preference);

  useEffect(() => {
    if (Platform.OS === "ios") {
      updateNextPrayerWidget(upcomingZmanim, locationLabel, appearance);
    }
  }, [appearance, locationLabel, upcomingZmanim]);

  return null;
}

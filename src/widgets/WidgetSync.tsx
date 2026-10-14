import { isAccountSession } from "@/services/accountAccess";
import { useCircleAccount } from "@/store/circleAccountStore";
import { useAppearanceStore } from "@/design/appearance";
import { useZmanimStore } from "@/store/zmanimStore";
import { updateNextPrayerWidget } from "@/widgets/syncNextPrayerWidget";
import { useEffect } from "react";
import { Platform } from "react-native";

export function WidgetSync(): null {
  const upcomingZmanim = useZmanimStore((state) => state.upcomingZmanim);
  const locationLabel = useZmanimStore((state) => state.location?.label);
  const session = useCircleAccount(s => s.session);
  const ready = useCircleAccount(s => s.sessionReady && !s.sessionError);
  const signedIn = ready && isAccountSession(session);
  const appearance = useAppearanceStore((state) => state.preference);

  useEffect(() => {
    if (Platform.OS === "ios") {
      updateNextPrayerWidget(signedIn ? upcomingZmanim : [], signedIn ? locationLabel : undefined, appearance);
      // AppProviders unmounts children during local reset; clear the persisted timeline too.
      return () => updateNextPrayerWidget([], undefined, appearance);
    }
  }, [appearance, locationLabel, upcomingZmanim, signedIn, session?.user.id]);

  return null;
}

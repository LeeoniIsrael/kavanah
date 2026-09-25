import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PrayerFocusSetupContent } from "@/components/PrayerFocusSetupContent";
import { Button } from "@/components/ui/button";
import { X } from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
export default function FocusSetup() {
  const { result } = useLocalSearchParams<{ result?: string }>();
  const router = useRouter(),
    colors = useThemeColors();
  return (
    <Screen
      largeTitle="Prayer Focus"
      subtitle="Ready-made. Yours to approve."
      rightComponent={
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Close Prayer Focus setup"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/profile")
          }
        >
          <X size={20} color={colors.ink} />
        </Button>
      }
    >
      <PrayerFocusSetupContent result={result} />
    </Screen>
  );
}

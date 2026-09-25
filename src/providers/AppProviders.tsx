import { BrandWordmark } from "@/components/BrandMark";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { LockKeyhole } from "@/components/ui/icons";
import { useEffect, useState, type PropsWithChildren } from "react";
import { AppState, View } from "react-native";

import { Button } from "@/components/ui/button";
import { configureNotificationCategories } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";

export function AppProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  const colors = useThemeColors();

  const { biometricLockEnabled, hydrate, unlockWithBiometrics } =
    useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    void hydrate().finally(() => setHydrated(true));
  }, [hydrate]);

  useEffect(() => {
    void configureNotificationCategories().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!biometricLockEnabled) {
      setUnlocked(true);
      return;
    }
    void unlockWithBiometrics().then(setUnlocked);
  }, [biometricLockEnabled, hydrated, unlockWithBiometrics]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && biometricLockEnabled) setUnlocked(false);
    });
    return () => subscription.remove();
  }, [biometricLockEnabled]);

  if (!hydrated) {
    return (
      <View
        accessibilityLabel="Opening Kavanah"
        accessibilityRole="progressbar"
        className="flex-1 items-center justify-center bg-background gap-3"
      >
        <BrandWordmark width={190} />
        <View className="w-7 h-[2px] bg-gold" />
      </View>
    );
  }

  if (biometricLockEnabled && !unlocked) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-background gap-3">
        <BrandWordmark width={170} />
        <View className="w-[54px] h-[54px] rounded-md items-center justify-center bg-muted border border-hairline">
          <LockKeyhole size={24} color={colors.ink} />
        </View>
        <Text className="text-[27px] leading-[33px] font-semibold tracking-normal text-foreground text-center font-heading">
          Kavanah is locked
        </Text>
        <Text className="text-[16px] leading-[22px] font-normal tracking-normal text-muted-foreground text-center max-w-[310px] font-body">
          Your saved prayers and personal progress stay private.
        </Text>
        <Button
          variant="default"
          size="content"
          accessibilityLabel="Unlock Kavanah"
          accessibilityRole="button"
          onPress={() => void unlockWithBiometrics().then(setUnlocked)}
          className="min-h-12 min-w-[150px] rounded-md items-center justify-center bg-primary mt-2"
        >
          <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-primary-foreground font-heading">
            Unlock
          </Text>
        </Button>
      </View>
    );
  }

  return <>{children}</>;
}

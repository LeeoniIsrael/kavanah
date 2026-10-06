import {
  useLocalDataDeletion,
  clearLocalData,
  finishLocalDataDeletion,
} from "@/services/localDataDeletion";
import { startReminderScheduling } from "@/services/reminderScheduler";
import { startCircleAccount } from "@/store/circleAccountStore";
import { circleClient } from "@/services/network/client";
import { flushCircle } from "@/services/network/outbox";
import { BrandWordmark } from "@/components/BrandMark";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { LockKeyhole } from "@/components/ui/icons";
import { useEffect, useState, type PropsWithChildren } from "react";
import { AppState, StatusBar, View } from "react-native";

import { Button } from "@/components/ui/button";
import { retireTravelPrayerReminders } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";

export function AppProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  const colors = useThemeColors();
  const deletionStatus = useLocalDataDeletion((state) => state.status);
  useEffect(() => startReminderScheduling(), []);
  useEffect(() => {
    const stop = startCircleAccount();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void circleClient?.auth.startAutoRefresh();
        void flushCircle();
      } else void circleClient?.auth.stopAutoRefresh();
    });
    return () => {
      stop();
      subscription.remove();
    };
  }, []);

  const { biometricLockEnabled, hydrate, unlockWithBiometrics } =
    useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    void hydrate().finally(() => setHydrated(true));
  }, [hydrate]);

  useEffect(() => {
    void retireTravelPrayerReminders().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!biometricLockEnabled) return;
    void unlockWithBiometrics().then(setUnlocked);
  }, [biometricLockEnabled, hydrated, unlockWithBiometrics]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && biometricLockEnabled) setUnlocked(false);
    });
    return () => subscription.remove();
  }, [biometricLockEnabled]);

  if (deletionStatus !== "idle") {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-background gap-4">
        <Text accessibilityRole="header" variant="section">
          {deletionStatus === "done"
            ? "Local data cleared"
            : deletionStatus === "error"
              ? "Local data could not be fully cleared"
              : "Clearing local data…"}
        </Text>
        <Text accessibilityLiveRegion="polite" variant="body">
          {deletionStatus === "done"
            ? "Practice history, bookmarks, annotations, preferences, saved locations, and local photos were removed. Your cloud account remains. Public downloaded prayer text remains available."
            : deletionStatus === "error"
              ? "Some data may remain. Check your connection and try again."
              : "Please keep Kavanah open until this finishes."}
        </Text>
        {deletionStatus === "done" && (
          <Button
            accessibilityLabel="Continue after clearing local data"
            onPress={finishLocalDataDeletion}
          >
            <Text>Continue</Text>
          </Button>
        )}
        {deletionStatus === "error" && (
          <Button
            accessibilityLabel="Retry clearing local data"
            onPress={() => void clearLocalData()}
          >
            <Text>Retry</Text>
          </Button>
        )}
      </View>
    );
  }

  if (!hydrated) {
    return (
      <View
        accessibilityLabel="Opening Kavanah"
        accessibilityRole="progressbar"
        style={{
          flex: 1,
          backgroundColor: "#000000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar barStyle="light-content" />
        <BrandWordmark width={190} color="#FFFFFF" />
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
          Unlock to see your saved prayers and personal progress.
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

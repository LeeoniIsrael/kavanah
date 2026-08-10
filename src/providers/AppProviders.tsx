import { LockKeyhole } from "lucide-react-native";
import { useEffect, useState, type PropsWithChildren } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { colors, radii, spacing, type } from "@/design/theme";
import { useAuthStore } from "@/store/authStore";

export function AppProviders({ children }: PropsWithChildren): React.JSX.Element {
  const { biometricLockEnabled, hydrate, unlockWithBiometrics } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    void hydrate().finally(() => setHydrated(true));
  }, [hydrate]);

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
    return <View style={styles.lockScreen} />;
  }

  if (biometricLockEnabled && !unlocked) {
    return (
      <View style={styles.lockScreen}>
        <View style={styles.lockMark}>
          <LockKeyhole size={25} color={colors.ink} />
        </View>
        <Text style={styles.lockTitle}>Kavanah is locked</Text>
        <Text style={styles.lockBody}>Your saved prayers and personal progress stay private.</Text>
        <AnimatedPressable accessibilityRole="button" onPress={() => void unlockWithBiometrics().then(setUnlocked)} style={styles.unlockButton}>
          <Text style={styles.unlockText}>Unlock</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  lockScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.parchment,
    gap: spacing.md
  },
  lockMark: {
    width: 54,
    height: 54,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  lockTitle: {
    ...type.title,
    color: colors.ink,
    textAlign: "center"
  },
  lockBody: {
    ...type.body,
    color: colors.inkMuted,
    textAlign: "center",
    maxWidth: 310
  },
  unlockButton: {
    minHeight: 48,
    minWidth: 150,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue,
    marginTop: spacing.sm
  },
  unlockText: {
    ...type.body,
    color: colors.white,
    fontWeight: "600"
  }
});

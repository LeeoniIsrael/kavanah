import { Lock, LogOut, ShieldCheck } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, radii, spacing } from "@/design/theme";
import { HALACHIC_ASSISTANT_SYSTEM_PROMPT } from "@/services/assistantService";
import { confirmHaptic } from "@/services/haptics";
import { useAuthStore } from "@/store/authStore";

export function ProfileScreen(): React.JSX.Element {
  const { tokens, biometricLockEnabled, hydrate, signInWithApple, signOut, setBiometricLockEnabled } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.lightLine} />
        <Label>Security</Label>
        <Display>Private by default</Display>
        <Body>Tokens stay in secure storage. Sensitive moments stay on the device whenever possible.</Body>
      </View>

      <Card accent="olive" style={styles.authCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusIcon}>
            <ShieldCheck size={22} color={colors.olive} />
          </View>
          <View style={styles.statusText}>
            <SectionTitle>{tokens ? "Signed in securely" : "Guest mode"}</SectionTitle>
            <Body>{tokens ? "Your session is protected by native secure storage." : "You can explore Kavanah without creating an account."}</Body>
          </View>
        </View>
        <Button label={tokens ? "Sign out" : "Sign in with Apple"} icon={tokens ? <LogOut size={17} color={colors.white} /> : <Lock size={17} color={colors.white} />} onPress={() => (tokens ? void signOut() : void signInWithApple())} />
      </Card>

      <Card accent="blue" style={styles.settingCard}>
        <View style={styles.settingText}>
          <SectionTitle>Biometric lock</SectionTitle>
          <Body>Require Face ID, Touch ID, or device biometrics before opening your profile.</Body>
        </View>
        <Switch
          value={biometricLockEnabled}
          trackColor={{ false: colors.hairline, true: colors.blueSoft }}
          thumbColor={biometricLockEnabled ? colors.blue : colors.white}
          onValueChange={(enabled) => {
            void confirmHaptic();
            void setBiometricLockEnabled(enabled);
          }}
        />
      </Card>

      <Card accent="rose" style={styles.guardrailCard}>
        <Label>Assistant guardrail</Label>
        <Body style={styles.guardrail}>{HALACHIC_ASSISTANT_SYSTEM_PROMPT}</Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  lightLine: {
    width: 64,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.olive,
    marginBottom: spacing.sm
  },
  authCard: {
    gap: spacing.lg
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  statusIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.oliveSoft
  },
  statusText: {
    flex: 1,
    gap: 4
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  settingText: {
    flex: 1,
    gap: 4
  },
  guardrailCard: {
    gap: spacing.sm
  },
  guardrail: {
    fontSize: 14,
    lineHeight: 21
  }
});

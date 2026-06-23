import { Check, Languages, Lock, LogOut, ShieldCheck, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { findLanguage, languageOptions } from "@/data/languages";
import { colors, radii, spacing } from "@/design/theme";
import { HALACHIC_ASSISTANT_SYSTEM_PROMPT } from "@/services/assistantService";
import { confirmHaptic } from "@/services/haptics";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";

export function ProfileScreen(): React.JSX.Element {
  const { tokens, biometricLockEnabled, hydrate, signInWithApple, signOut, setBiometricLockEnabled } = useAuthStore();
  const { primaryLanguageCode, setPrimaryLanguageCode } = useSettingsStore();
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const primaryLanguage = findLanguage(primaryLanguageCode);

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

      <Card accent="gold" style={styles.languageCard}>
        <View style={styles.statusRow}>
          <View style={styles.languageIcon}>
            <Languages size={22} color={colors.gold} />
          </View>
          <View style={styles.statusText}>
            <SectionTitle>Primary language</SectionTitle>
            <Body>{primaryLanguage.name} · {primaryLanguage.nativeName}</Body>
          </View>
        </View>
        <Button label="Change language" tone="quiet" onPress={() => setLanguageModalOpen(true)} />
      </Card>

      <Card accent="rose" style={styles.guardrailCard}>
        <Label>Assistant guardrail</Label>
        <Body style={styles.guardrail}>{HALACHIC_ASSISTANT_SYSTEM_PROMPT}</Body>
      </Card>

      <Modal visible={languageModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLanguageModalOpen(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <View>
                <Label>Language</Label>
                <Display style={styles.modalTitle}>Choose text language</Display>
              </View>
              <AnimatedPressable accessibilityRole="button" onPress={() => setLanguageModalOpen(false)} style={styles.closeButton}>
                <X size={20} color={colors.ink} />
              </AnimatedPressable>
            </View>
            <View style={styles.languageList}>
              {languageOptions.map((language) => {
                const selected = language.code === primaryLanguageCode;
                return (
                  <AnimatedPressable
                    key={language.code}
                    accessibilityRole="button"
                    onPress={() => {
                      void confirmHaptic();
                      setPrimaryLanguageCode(language.code);
                      setLanguageModalOpen(false);
                    }}
                    style={[styles.languageRow, selected && styles.languageRowSelected]}
                  >
                    <View style={styles.settingText}>
                      <SectionTitle style={styles.languageName}>{language.name}</SectionTitle>
                      <Body>{language.nativeName}</Body>
                    </View>
                    {selected ? <Check size={20} color={colors.gold} /> : null}
                  </AnimatedPressable>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  languageCard: {
    gap: spacing.lg
  },
  languageIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.goldSoft
  },
  guardrailCard: {
    gap: spacing.sm
  },
  guardrail: {
    fontSize: 14,
    lineHeight: 21
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.parchment
  },
  modalContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  modalTitle: {
    fontSize: 34,
    lineHeight: 39
  },
  closeButton: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.vellum,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  languageList: {
    gap: spacing.sm
  },
  languageRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.vellum,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  languageRowSelected: {
    borderColor: "rgba(181,138,42,0.45)",
    backgroundColor: colors.goldSoft
  },
  languageName: {
    fontSize: 16,
    lineHeight: 21
  }
});

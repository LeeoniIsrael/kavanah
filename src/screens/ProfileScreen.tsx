import { Check, ChevronRight, Languages, Lock, LogOut, ShieldCheck, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { findLanguage, languageOptions } from "@/data/languages";
import { colors, grid, radii, shadows, spacing, type } from "@/design/theme";
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
      <View style={styles.header}>
        <Label>Account</Label>
        <Display>Profile</Display>
        <Body style={styles.headerCopy}>Privacy, language, and access controls for Kavanah.</Body>
      </View>

      <View style={styles.statusPanel}>
        <View style={styles.statusTop}>
          <View style={styles.blueDot} />
          <Text style={styles.statusMeta}>{tokens ? "Secure session" : "Guest session"}</Text>
        </View>
        <SectionTitle style={styles.statusTitle}>{tokens ? "Signed in" : "Private by default"}</SectionTitle>
        <Body style={styles.statusBody}>{tokens ? "Your tokens are stored in the native secure store." : "Use the app without an account. Sign in only when you need profile sync."}</Body>
        <AnimatedPressable accessibilityRole="button" onPress={() => (tokens ? void signOut() : void signInWithApple())} style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>{tokens ? "Sign out" : "Sign in with Apple"}</Text>
          {tokens ? <LogOut size={17} color={colors.white} /> : <Lock size={17} color={colors.white} />}
        </AnimatedPressable>
      </View>

      <View style={styles.settingsList}>
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <ShieldCheck size={19} color={colors.blue} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Biometric lock</Text>
            <Text style={styles.settingDetail}>Require Face ID, Touch ID, or device biometrics.</Text>
          </View>
          <Switch
            value={biometricLockEnabled}
            trackColor={{ false: colors.hairlineStrong, true: colors.blueSoft }}
            thumbColor={biometricLockEnabled ? colors.blue : colors.white}
            onValueChange={(enabled) => {
              void confirmHaptic();
              void setBiometricLockEnabled(enabled);
            }}
          />
        </View>

        <AnimatedPressable accessibilityRole="button" onPress={() => setLanguageModalOpen(true)} style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Languages size={19} color={colors.blue} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Primary language</Text>
            <Text style={styles.settingDetail}>{primaryLanguage.name} · {primaryLanguage.nativeName}</Text>
          </View>
          <ChevronRight size={18} color={colors.inkMuted} />
        </AnimatedPressable>
      </View>

      <View style={styles.guardrail}>
        <Text style={styles.guardrailTitle}>Assistant boundary</Text>
        <Text style={styles.guardrailText} numberOfLines={6}>
          {HALACHIC_ASSISTANT_SYSTEM_PROMPT}
        </Text>
      </View>

      <Modal visible={languageModalOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setLanguageModalOpen(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalChrome} pointerEvents="box-none">
            <AnimatedPressable accessibilityLabel="Close language picker" accessibilityRole="button" onPress={() => setLanguageModalOpen(false)} pressedScale={0.94} style={styles.closeButton}>
              <X size={18} color={colors.ink} />
            </AnimatedPressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Label>Language</Label>
              <Display style={styles.modalTitle}>Text language</Display>
              <Body>Hebrew remains visible. Translation and transliteration follow this choice.</Body>
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
                      <Text style={styles.settingTitle}>{language.name}</Text>
                      <Text style={styles.settingDetail}>{language.nativeName}</Text>
                    </View>
                    {selected ? <Check size={20} color={colors.blue} /> : null}
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
  header: {
    gap: spacing.xs
  },
  headerCopy: {
    maxWidth: 320
  },
  statusPanel: {
    borderRadius: radii.xl,
    backgroundColor: colors.ink,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.card
  },
  statusTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.blue
  },
  statusMeta: {
    ...type.caption,
    color: "rgba(255,255,255,0.66)"
  },
  statusTitle: {
    color: colors.white
  },
  statusBody: {
    color: "rgba(255,255,255,0.70)"
  },
  primaryAction: {
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  primaryActionText: {
    ...type.caption,
    color: colors.white
  },
  settingsList: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden"
  },
  settingRow: {
    minHeight: 74,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  settingText: {
    flex: 1,
    gap: 2
  },
  settingTitle: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink
  },
  settingDetail: {
    ...type.caption,
    color: colors.inkMuted,
    lineHeight: 18
  },
  guardrail: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.sm
  },
  guardrailTitle: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink
  },
  guardrailText: {
    ...type.caption,
    color: colors.inkMuted,
    lineHeight: 18
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.parchment
  },
  modalChrome: {
    position: "absolute",
    top: spacing.lg,
    right: grid.margin,
    zIndex: 10,
    pointerEvents: "box-none"
  },
  closeButton: {
    width: grid.touch,
    height: grid.touch,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.floating
  },
  modalContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl
  },
  modalHeader: {
    gap: spacing.xs,
    paddingRight: spacing.xxxl
  },
  modalTitle: {
    fontSize: 34,
    lineHeight: 39
  },
  languageList: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden"
  },
  languageRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  languageRowSelected: {
    backgroundColor: colors.blueSoft
  }
});

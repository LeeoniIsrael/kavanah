import { Bell, Check, ChevronRight, Languages, LockKeyhole, ShieldCheck, Sparkles, X } from "lucide-react-native";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { findLanguage, languageOptions } from "@/data/languages";
import { colors, grid, radii, shadows, spacing, type } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { confirmHaptic } from "@/services/haptics";
import { initializeNotifications, scheduleZmanNotifications } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";
import { CURRENT_ASSISTANT_CONSENT_VERSION, useSettingsStore } from "@/store/settingsStore";
import { useZmanimStore } from "@/store/zmanimStore";

type ProfileModal = "language" | "privacy" | null;

export function ProfileScreen(): React.JSX.Element {
  const { biometricLockEnabled, setBiometricLockEnabled } = useAuthStore();
  const {
    primaryLanguageCode,
    assistantConsentVersion,
    zmanNotificationsEnabled,
    setPrimaryLanguageCode,
    setAssistantConsent,
    setZmanNotificationsEnabled
  } = useSettingsStore();
  const [activeModal, setActiveModal] = useState<ProfileModal>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const reduceMotion = useReducedMotion();
  const primaryLanguage = findLanguage(primaryLanguageCode);
  const assistantEnabled = assistantConsentVersion === CURRENT_ASSISTANT_CONSENT_VERSION;

  const changeNotifications = async (enabled: boolean) => {
    void confirmHaptic();
    if (!enabled) {
      setZmanNotificationsEnabled(false);
      setNotificationMessage("");
      return;
    }
    const granted = await initializeNotifications();
    setZmanNotificationsEnabled(granted);
    setNotificationMessage(granted ? "Reminders will follow your calculated local times." : "Notifications are disabled in device settings.");
    if (granted) {
      const { upcomingZmanim, refresh } = useZmanimStore.getState();
      if (upcomingZmanim.length > 0) {
        await scheduleZmanNotifications(upcomingZmanim);
      } else {
        await refresh();
      }
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Label>Settings</Label>
        <Display>Your Kavanah</Display>
        <Body style={styles.headerCopy}>Language, reminders, and privacy stay under your control.</Body>
      </View>

      <View style={styles.localPanel}>
        <View style={styles.localIcon}><ShieldCheck size={21} color={colors.blue} /></View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>Local by default</Text>
          <Text style={styles.settingDetail}>Bookmarks, streaks, and location calculations stay on this device.</Text>
        </View>
      </View>

      <View style={styles.settingsList}>
        <AnimatedPressable accessibilityRole="button" onPress={() => setActiveModal("language")} style={styles.settingRow}>
          <View style={styles.settingIcon}><Languages size={19} color={colors.blue} /></View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Primary language</Text>
            <Text style={styles.settingDetail}>{primaryLanguage.name} · {primaryLanguage.nativeName}</Text>
          </View>
          <ChevronRight size={18} color={colors.inkMuted} />
        </AnimatedPressable>

        <View style={styles.settingRow}>
          <View style={styles.settingIcon}><Bell size={19} color={colors.blue} /></View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Zmanim reminders</Text>
            <Text style={styles.settingDetail}>{notificationMessage || "Alerts before selected local prayer times."}</Text>
          </View>
          <Switch value={zmanNotificationsEnabled} onValueChange={(enabled) => void changeNotifications(enabled)} {...switchColors(zmanNotificationsEnabled)} />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingIcon}><LockKeyhole size={19} color={colors.blue} /></View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Biometric lock</Text>
            <Text style={styles.settingDetail}>Lock Kavanah whenever the app leaves the foreground.</Text>
          </View>
          <Switch
            value={biometricLockEnabled}
            onValueChange={(enabled) => {
              void confirmHaptic();
              void setBiometricLockEnabled(enabled);
            }}
            {...switchColors(biometricLockEnabled)}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingIcon}><Sparkles size={19} color={colors.blue} /></View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Prayer assistant</Text>
            <Text style={styles.settingDetail}>Allow prayer questions to be processed by OpenAI through Kavanah.</Text>
          </View>
          <Switch
            value={assistantEnabled}
            onValueChange={(enabled) => {
              void confirmHaptic();
              setAssistantConsent(enabled);
            }}
            {...switchColors(assistantEnabled)}
          />
        </View>

        <AnimatedPressable accessibilityRole="button" onPress={() => setActiveModal("privacy")} style={[styles.settingRow, styles.lastRow]}>
          <View style={styles.settingIcon}><ShieldCheck size={19} color={colors.blue} /></View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Privacy and data use</Text>
            <Text style={styles.settingDetail}>What stays here and what leaves this device.</Text>
          </View>
          <ChevronRight size={18} color={colors.inkMuted} />
        </AnimatedPressable>
      </View>

      <Body style={styles.accountNote}>Account sync is unavailable until secure server verification and complete account deletion are ready.</Body>

      <Modal visible={activeModal !== null} animationType={reduceMotion ? "none" : "slide"} presentationStyle="fullScreen" onRequestClose={() => setActiveModal(null)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalChrome} pointerEvents="box-none">
            <AnimatedPressable accessibilityLabel="Close" accessibilityRole="button" onPress={() => setActiveModal(null)} pressedScale={0.94} style={styles.closeButton}>
              <X size={18} color={colors.ink} />
            </AnimatedPressable>
          </View>
          {activeModal === "language" ? (
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Label>Language</Label>
                <Display style={styles.modalTitle}>Prayer text</Display>
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
                        setActiveModal(null);
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
          ) : (
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Label>Privacy</Label>
                <Display style={styles.modalTitle}>Clear by design</Display>
              </View>
              <PrivacySection title="Stored on this device" body="Bookmarks, streaks, language preferences, reminder settings, and the coordinates used to calculate zmanim. Precise coordinates are not sent to the prayer assistant." />
              <PrivacySection title="Prayer assistant" body="Only after you allow it, your question, selected prayer text, language, and verified source reference are sent through Kavanah's server to OpenAI. Email addresses, phone numbers, and street addresses are removed first. Questions are not used for advertising." />
              <PrivacySection title="Religious guidance" body="Assistant answers are educational and may be incomplete. They are not binding halachic rulings and do not replace a qualified rabbi, doctor, or emergency service." />
              <PrivacySection title="Your choice" body="You can turn off the prayer assistant or reminders here at any time. Kavanah can still be used for prayer search, reading, bookmarks, and local zmanim without an account." />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

function PrivacySection({ title, body }: { title: string; body: string }): React.JSX.Element {
  return <View style={styles.privacySection}><SectionTitle>{title}</SectionTitle><Body>{body}</Body></View>;
}

function switchColors(enabled: boolean) {
  return {
    trackColor: { false: colors.hairlineStrong, true: colors.blueSoft },
    thumbColor: enabled ? colors.blue : colors.white
  };
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  headerCopy: { maxWidth: 330 },
  localPanel: {
    minHeight: 94,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.oliveSoft,
    borderLeftWidth: 2,
    borderLeftColor: colors.olive
  },
  localIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.vellum
  },
  settingsList: {
    borderTopWidth: 1,
    borderTopColor: colors.hairlineStrong
  },
  settingRow: {
    minHeight: 76,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline
  },
  lastRow: { borderBottomWidth: 0 },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.mineral,
    alignItems: "center",
    justifyContent: "center"
  },
  settingText: { flex: 1, gap: 2 },
  settingTitle: { ...type.body, fontWeight: "600", color: colors.ink },
  settingDetail: { ...type.caption, color: colors.inkMuted, lineHeight: 18 },
  accountNote: { fontSize: 12, lineHeight: 18, paddingHorizontal: spacing.xs },
  modalSafeArea: { flex: 1, backgroundColor: colors.parchment },
  modalChrome: { position: "absolute", top: spacing.lg, right: grid.margin, zIndex: 10 },
  closeButton: {
    width: grid.touch,
    height: grid.touch,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.floating
  },
  modalContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl + spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.xl },
  modalHeader: { gap: spacing.xs, paddingRight: spacing.xxxl },
  modalTitle: { fontSize: 34, lineHeight: 39 },
  languageList: { borderTopWidth: 1, borderTopColor: colors.hairlineStrong },
  languageRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingHorizontal: spacing.xs, paddingVertical: spacing.md },
  languageRowSelected: { backgroundColor: colors.blueSoft },
  privacySection: { gap: spacing.sm, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.hairline }
});

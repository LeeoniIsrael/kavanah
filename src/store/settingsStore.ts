import { create } from "zustand";

import { findLanguage } from "@/data/languages";
import { userStorage } from "@/services/mmkv";

const LANGUAGE_KEY = "settings.primary-language";
const ASSISTANT_CONSENT_KEY = "settings.assistant-consent-version";
const ZMAN_NOTIFICATIONS_KEY = "settings.zman-notifications";
const PRAYER_FOCUS_KEY = "settings.prayer-focus";
export const CURRENT_ASSISTANT_CONSENT_VERSION = 1;

type SettingsState = {
  primaryLanguageCode: string;
  assistantConsentVersion: number;
  zmanNotificationsEnabled: boolean;
  prayerFocusEnabled: boolean;
  setPrimaryLanguageCode: (code: string) => void;
  setAssistantConsent: (accepted: boolean) => void;
  setZmanNotificationsEnabled: (enabled: boolean) => void;
  setPrayerFocusEnabled: (enabled: boolean) => void;
};

const initialLanguageCode = userStorage.getString(LANGUAGE_KEY) ?? "en";
const initialAssistantConsentVersion = Number(
  userStorage.getString(ASSISTANT_CONSENT_KEY) ?? "0",
);
const initialZmanNotificationsEnabled =
  userStorage.getString(ZMAN_NOTIFICATIONS_KEY) === "true";
const initialPrayerFocusEnabled =
  userStorage.getString(PRAYER_FOCUS_KEY) === "true";

export const useSettingsStore = create<SettingsState>((set) => ({
  primaryLanguageCode: findLanguage(initialLanguageCode).code,
  assistantConsentVersion: Number.isFinite(initialAssistantConsentVersion)
    ? initialAssistantConsentVersion
    : 0,
  zmanNotificationsEnabled: initialZmanNotificationsEnabled,
  prayerFocusEnabled: initialPrayerFocusEnabled,
  setPrimaryLanguageCode: (code) => {
    const language = findLanguage(code);
    userStorage.set(LANGUAGE_KEY, language.code);
    set({ primaryLanguageCode: language.code });
  },
  setAssistantConsent: (accepted) => {
    const version = accepted ? CURRENT_ASSISTANT_CONSENT_VERSION : 0;
    userStorage.set(ASSISTANT_CONSENT_KEY, String(version));
    set({ assistantConsentVersion: version });
  },
  setZmanNotificationsEnabled: (enabled) => {
    userStorage.set(ZMAN_NOTIFICATIONS_KEY, String(enabled));
    set({ zmanNotificationsEnabled: enabled });
  },
  setPrayerFocusEnabled: (enabled) => {
    userStorage.set(PRAYER_FOCUS_KEY, String(enabled));
    set({ prayerFocusEnabled: enabled });
  },
}));

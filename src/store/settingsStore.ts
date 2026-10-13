import { readSocialData, writeSocialData } from "@/services/socialStorage";
import { create } from "zustand";

import { findLanguage } from "@/data/languages";
import { onAccountScopeChange } from "@/services/accountScope";
const isString = (v: unknown): v is string => typeof v === "string";
const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const LANGUAGE_KEY = "settings.primary-language";
const ASSISTANT_CONSENT_KEY = "settings.assistant-consent-version";
const ZMAN_NOTIFICATIONS_KEY = "settings.zman-notifications";
const PRAYER_FOCUS_KEY = "settings.prayer-focus";
export const CURRENT_ASSISTANT_CONSENT_VERSION = 2;

type SettingsState = {
  primaryLanguageCode: string;
  assistantConsentVersion: number;
  zmanNotificationsEnabled: boolean;
  shareAfterPrayer: boolean;
  setShareAfterPrayer: (enabled: boolean) => void;
  prayerFocusEnabled: boolean;
  calendarInIsrael: boolean;
  setCalendarInIsrael: (value: boolean) => void;
  setPrimaryLanguageCode: (code: string) => void;
  setAssistantConsent: (accepted: boolean) => void;
  setZmanNotificationsEnabled: (enabled: boolean) => void;
  setPrayerFocusEnabled: (enabled: boolean) => void;
};

function savedSettings() {
  return {
    primaryLanguageCode: findLanguage(readSocialData(LANGUAGE_KEY, isString) ?? "en").code,
    assistantConsentVersion: readSocialData(ASSISTANT_CONSENT_KEY, isNumber) ?? 0,
    zmanNotificationsEnabled: readSocialData(ZMAN_NOTIFICATIONS_KEY, isBoolean) ?? false,
    prayerFocusEnabled: readSocialData(PRAYER_FOCUS_KEY, isBoolean) ?? false,
    shareAfterPrayer: readSocialData("settings.share-after-prayer", isBoolean) ?? true,
    calendarInIsrael: readSocialData("settings.calendar-israel", isBoolean) ?? false,
  };
}
export const useSettingsStore = create<SettingsState>((set) => ({
  ...savedSettings(),
  setShareAfterPrayer: (enabled) => {
    writeSocialData("settings.share-after-prayer", enabled);
    set({ shareAfterPrayer: enabled });
  },
  setCalendarInIsrael: (value) => {
    writeSocialData("settings.calendar-israel", value);
    set({ calendarInIsrael: value });
  },
  setPrimaryLanguageCode: (code) => {
    const language = findLanguage(code);
    writeSocialData(LANGUAGE_KEY, language.code);
    set({ primaryLanguageCode: language.code });
  },
  setAssistantConsent: (accepted) => {
    const version = accepted ? CURRENT_ASSISTANT_CONSENT_VERSION : 0;
    writeSocialData(ASSISTANT_CONSENT_KEY, version);
    set({ assistantConsentVersion: version });
  },
  setZmanNotificationsEnabled: (enabled) => {
    writeSocialData(ZMAN_NOTIFICATIONS_KEY, enabled);
    set({ zmanNotificationsEnabled: enabled });
  },
  setPrayerFocusEnabled: (enabled) => {
    writeSocialData(PRAYER_FOCUS_KEY, enabled);
    set({ prayerFocusEnabled: enabled });
  },
}));

onAccountScopeChange(() => useSettingsStore.setState(savedSettings()));

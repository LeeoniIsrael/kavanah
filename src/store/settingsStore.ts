import { create } from "zustand";

import { findLanguage } from "@/data/languages";
import { userStorage } from "@/services/mmkv";

const LANGUAGE_KEY = "settings.primary-language";

type SettingsState = {
  primaryLanguageCode: string;
  setPrimaryLanguageCode: (code: string) => void;
};

const initialLanguageCode = userStorage.getString(LANGUAGE_KEY) ?? "en";

export const useSettingsStore = create<SettingsState>((set) => ({
  primaryLanguageCode: findLanguage(initialLanguageCode).code,
  setPrimaryLanguageCode: (code) => {
    const language = findLanguage(code);
    userStorage.set(LANGUAGE_KEY, language.code);
    set({ primaryLanguageCode: language.code });
  }
}));

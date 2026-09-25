import { useMemo } from "react";
import { useColorScheme } from "nativewind";
import { create } from "zustand";
import { readSocialData, writeSocialData } from "@/services/socialStorage";
import { palettes } from "./theme";

export type AppearancePreference = "system" | "light" | "dark";
export type ThemeColors = { [K in keyof typeof palettes.light]: string };
const key = "settings.appearance.v1";
const isPreference = (v: unknown): v is AppearancePreference =>
  v === "system" || v === "light" || v === "dark";
export const useAppearanceStore = create<{
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
}>((set) => ({
  preference: readSocialData(key, isPreference) ?? "system",
  setPreference: (preference) => {
    writeSocialData(key, preference);
    set({ preference });
  },
}));
export function useAppColorScheme(): "light" | "dark" {
  const preference = useAppearanceStore((s) => s.preference);
  const { colorScheme: system } = useColorScheme();
  return preference === "system"
    ? system === "dark"
      ? "dark"
      : "light"
    : preference;
}
export function useThemeColors(): ThemeColors {
  return palettes[useAppColorScheme()];
}
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const colors = useThemeColors();
  return useMemo(() => factory(colors), [factory, colors]);
}

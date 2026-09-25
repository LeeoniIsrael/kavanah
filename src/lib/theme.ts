import { colors, fonts } from "@/design/theme";
import { DarkTheme } from "expo-router";

// Kavanah is a dark interface. Matching the native color scheme prevents white
// flashes and gives iOS navigation glass the correct content to sample.
export const NAV_THEME: { dark: typeof DarkTheme } = {
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.parchment,
      card: colors.vellum,
      text: colors.ink,
      primary: colors.blue,
      border: colors.mineral,
      notification: colors.blue,
    },
    fonts: {
      regular: { fontFamily: fonts.regular, fontWeight: "400" },
      medium: { fontFamily: fonts.medium, fontWeight: "500" },
      bold: { fontFamily: fonts.bold, fontWeight: "700" },
      heavy: { fontFamily: fonts.bold, fontWeight: "700" },
    },
  },
};

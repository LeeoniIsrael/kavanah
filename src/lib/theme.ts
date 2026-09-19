import { colors, fonts } from "@/design/theme";
import { DefaultTheme, type Theme } from "@react-navigation/native";

// Kavanah intentionally follows its configured light appearance on every screen.
export const NAV_THEME: { light: Theme } = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
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

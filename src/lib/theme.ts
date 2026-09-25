import { fonts, palettes } from "@/design/theme";
import { DarkTheme, DefaultTheme } from "expo-router";

export const NAV_THEME = Object.fromEntries(
  (["light", "dark"] as const).map((scheme) => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    const colors = palettes[scheme];
    return [
      scheme,
      {
        ...base,
        colors: {
          ...base.colors,
          background: colors.parchment,
          card: colors.vellum,
          text: colors.ink,
          primary: colors.blue,
          border: colors.hairline,
          notification: colors.blue,
        },
        fonts: {
          regular: { fontFamily: fonts.regular, fontWeight: "400" },
          medium: { fontFamily: fonts.medium, fontWeight: "500" },
          bold: { fontFamily: fonts.bold, fontWeight: "700" },
          heavy: { fontFamily: fonts.bold, fontWeight: "700" },
        },
      },
    ];
  }),
) as Record<"light" | "dark", typeof DarkTheme>;

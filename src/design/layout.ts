import { Platform, StyleSheet } from "react-native";
import { fonts, geometry } from "./theme";
import { useThemedStyles, type ThemeColors } from "./appearance";

export const layout = {
  page: 24,
  section: 24,
  item: 12,
  card: 20,
  feature: 24,
} as const;
const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    surface: {
      padding: layout.card,
      borderRadius: geometry.radius.surface,
      borderCurve: "continuous",
      backgroundColor: colors.vellum,
      gap: 12,
    },
    feature: {
      padding: layout.feature,
      borderRadius: geometry.radius.feature,
      borderCurve: "continuous",
      backgroundColor: colors.blueSoft,
      gap: 16,
    },
    sectionTitle: {
      fontFamily: fonts.semibold,
      fontSize: 20,
      lineHeight: 28,
      color: colors.ink,
    },
    itemTitle: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      lineHeight: 24,
      color: colors.ink,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 22,
      color: colors.inkMuted,
    },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 20,
      color: colors.inkMuted,
    },
    time: {
      fontFamily: fonts.regular,
      fontSize: 48,
      lineHeight: 56,
      letterSpacing: -1.5,
      fontVariant: ["tabular-nums"],
      color: colors.ink,
    },
    editorial: {
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      fontSize: 28,
      lineHeight: 36,
      color: colors.ink,
    },
    row: {
      paddingHorizontal: layout.card,
      paddingVertical: 16,
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    separator: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
  });
export function useInterfaceStyles() {
  return useThemedStyles(makeStyles);
}

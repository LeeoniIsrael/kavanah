import { colors, fonts } from "@/design/theme";

export const animatedHeaderConfig = {
  barHeight: 56,
  collapseDistance: 72,
  contentMaxWidth: 600,
  horizontalInset: 20,
  background: colors.parchment,
  title: colors.ink,
  subtitle: colors.inkMuted,
  fontFamily: fonts.regular,
  titleFontFamily: fonts.semibold,
} as const;

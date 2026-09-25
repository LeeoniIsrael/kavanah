export const palettes = {
  light: {
    parchment: "#F7F8FA",
    parchmentLift: "#FFFFFF",
    vellum: "#FFFFFF",
    glass: "#FFFFFF",
    ink: "#152137",
    inkMuted: "#546174",
    inkFaint: "#647184",
    hairline: "#E4E8ED",
    hairlineStrong: "#CDD5DF",
    mineral: "#EDF1F5",
    mineralDark: "#667386",
    gold: "#0B1A3B",
    goldSoft: "#E7EEF7",
    olive: "#0B1A3B",
    oliveSoft: "#E7EEF7",
    blue: "#0B1A3B",
    blueSoft: "#E7EEF7",
    rose: "#0B1A3B",
    roseSoft: "#E7EEF7",
    danger: "#A52D3A",
    shadow: "#0B1A3B",
    white: "#FFFFFF",
    onAccent: "#FFFFFF",
  },
  dark: {
    parchment: "#0E141C",
    parchmentLift: "#121B25",
    vellum: "#17212D",
    glass: "#17212D",
    ink: "#E9EEF4",
    inkMuted: "#A7B4C3",
    inkFaint: "#8E9EAF",
    hairline: "#243140",
    hairlineStrong: "#354658",
    mineral: "#233243",
    mineralDark: "#91A2B5",
    gold: "#8DB6E8",
    goldSoft: "#1B304A",
    olive: "#8DB6E8",
    oliveSoft: "#1B304A",
    blue: "#8DB6E8",
    blueSoft: "#1B304A",
    rose: "#8DB6E8",
    roseSoft: "#1B304A",
    danger: "#F2A0A8",
    shadow: "#000000",
    white: "#FFFFFF",
    onAccent: "#0B1A3B",
  },
} as const;

// Static fallback for non-rendering consumers. UI uses useThemeColors.
export const colors = palettes.dark;
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Parametric primitives: all surfaces derive from this compact rule set.
export const geometry = {
  radius: { control: 18, surface: 26, feature: 32 },
  stroke: { quiet: 1, emphasis: 2 },
  cut: 18,
} as const;

export const motion = {
  pressMs: 72,
  stateMs: 300,
  navigationMs: 380,
  snappy: [0.16, 1, 0.3, 1] as const,
  standard: [0.25, 1, 0.5, 1] as const,
} as const;

export const grid = {
  margin: spacing.xl,
  gutter: spacing.md,
  touch: 44,
} as const;

export const fonts = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  hebrew: "NotoSansHebrew_400Regular",
  hebrewSemibold: "NotoSansHebrew_600SemiBold",
} as const;

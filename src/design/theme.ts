export const colors = {
  parchment: "#121214",
  parchmentLift: "#151518",
  vellum: "#1A1A1E",
  glass: "rgba(24, 24, 27, 0.94)",
  ink: "#F4F4F5",
  inkMuted: "#A1A1AA",
  inkFaint: "rgba(244, 244, 245, 0.62)",
  hairline: "rgba(255, 255, 255, 0.07)",
  hairlineStrong: "rgba(255, 255, 255, 0.14)",
  mineral: "#242429",
  mineralDark: "#71717A",
  gold: "#7C8CFF",
  goldSoft: "#24283A",
  olive: "#7C8CFF",
  oliveSoft: "#24283A",
  blue: "#7C8CFF",
  blueSoft: "#24283A",
  rose: "#7C8CFF",
  roseSoft: "#24283A",
  danger: "#E06C75",
  shadow: "rgba(0, 0, 0, 0.44)",
  white: "#FFFFFF",
} as const;

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

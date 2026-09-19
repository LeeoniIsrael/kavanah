export const colors = {
  parchment: "#F2EEE4",
  parchmentLift: "#F8F5EE",
  vellum: "#FFFFFF",
  glass: "rgba(255, 255, 255, 0.88)",
  ink: "#0F0F14",
  inkMuted: "#64666D",
  inkFaint: "rgba(15, 15, 20, 0.62)",
  hairline: "rgba(11, 26, 59, 0.12)",
  hairlineStrong: "rgba(11, 26, 59, 0.22)",
  mineral: "#E5E1D8",
  mineralDark: "#777B85",
  gold: "#0B1A3B",
  goldSoft: "#E3E7EF",
  olive: "#0B1A3B",
  oliveSoft: "#E3E7EF",
  blue: "#0B1A3B",
  blueSoft: "#E3E7EF",
  rose: "#0B1A3B",
  roseSoft: "#E3E7EF",
  danger: "#B44343",
  shadow: "rgba(0, 0, 0, 0.14)",
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
  radius: { control: 4, surface: 4, feature: 8 },
  stroke: { quiet: 1, emphasis: 2 },
  cut: 18,
} as const;

export const motion = {
  pressMs: 90,
  stateMs: 320,
  navigationMs: 420,
  standard: [0.22, 1, 0.36, 1] as const,
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

export const colors = {
  parchment: "#F5F7FA",
  parchmentLift: "#FAFCFF",
  vellum: "#FFFFFF",
  glass: "rgba(255, 255, 255, 0.88)",
  ink: "#202936",
  inkMuted: "#647082",
  inkFaint: "rgba(15, 15, 20, 0.62)",
  hairline: "rgba(11, 26, 59, 0.07)",
  hairlineStrong: "rgba(11, 26, 59, 0.16)",
  mineral: "#EDF1F6",
  mineralDark: "#7D8999",
  gold: "#285EA8",
  goldSoft: "#E6EFFA",
  olive: "#285EA8",
  oliveSoft: "#E6EFFA",
  blue: "#285EA8",
  blueSoft: "#E6EFFA",
  rose: "#285EA8",
  roseSoft: "#E6EFFA",
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
  radius: { control: 18, surface: 26, feature: 32 },
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

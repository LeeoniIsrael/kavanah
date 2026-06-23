import { Platform } from "react-native";

export const colors = {
  parchment: "#F6F7F8",
  parchmentLift: "#FFFFFF",
  vellum: "#FFFFFF",
  glass: "rgba(255, 255, 255, 0.88)",
  ink: "#0B0D10",
  inkMuted: "#626A73",
  inkFaint: "rgba(11, 13, 16, 0.48)",
  hairline: "rgba(11, 13, 16, 0.08)",
  hairlineStrong: "rgba(11, 13, 16, 0.14)",
  gold: "#0A84FF",
  goldSoft: "#E8F2FF",
  olive: "#0A84FF",
  oliveSoft: "#EEF5FF",
  blue: "#0A84FF",
  blueSoft: "#E8F2FF",
  rose: "#0A84FF",
  roseSoft: "#EEF5FF",
  shadow: "rgba(11, 13, 16, 0.10)",
  white: "#FFFFFF"
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999
} as const;

export const motion = {
  pressMs: 160,
  stateMs: 220,
  navigationMs: 420,
  standard: [0.4, 0, 0.2, 1] as const
} as const;

export const grid = {
  margin: spacing.xl,
  gutter: spacing.md,
  touch: 44
} as const;

export const type = {
  display: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  section: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "400" as const,
    letterSpacing: 0
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  data: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "600" as const,
    letterSpacing: 0
  }
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.52,
      shadowRadius: 30
    },
    default: {
      elevation: 3
    }
  }),
  floating: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 24
    },
    default: {
      elevation: 5
    }
  }),
  pressed: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.32,
      shadowRadius: 12
    },
    default: {
      elevation: 2
    }
  })
} as const;

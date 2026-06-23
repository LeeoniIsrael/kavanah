import { Platform } from "react-native";

export const colors = {
  parchment: "#F6F1E7",
  parchmentLift: "#FAF7EF",
  vellum: "#FFFDF8",
  glass: "rgba(255, 253, 248, 0.86)",
  ink: "#18202B",
  inkMuted: "#68707C",
  inkFaint: "rgba(24, 32, 43, 0.52)",
  hairline: "rgba(24, 32, 43, 0.10)",
  hairlineStrong: "rgba(24, 32, 43, 0.16)",
  gold: "#B58A2A",
  goldSoft: "#EFE2C1",
  olive: "#5F765F",
  oliveSoft: "#E6ECE2",
  blue: "#385B78",
  blueSoft: "#E7EEF3",
  rose: "#9F5F55",
  roseSoft: "#F0DFDA",
  shadow: "rgba(24, 32, 43, 0.14)",
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
  sm: 7,
  md: 13,
  lg: 21,
  xl: 34,
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
    fontSize: 40,
    lineHeight: 45,
    fontWeight: "700" as const,
    letterSpacing: 0
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700" as const,
    letterSpacing: 0
  },
  section: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700" as const,
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
    fontWeight: "700" as const,
    letterSpacing: 0.8
  },
  data: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700" as const,
    letterSpacing: 0
  }
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 1,
      shadowRadius: 26
    },
    default: {
      elevation: 3
    }
  }),
  floating: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.8,
      shadowRadius: 22
    },
    default: {
      elevation: 5
    }
  }),
  pressed: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.55,
      shadowRadius: 13
    },
    default: {
      elevation: 2
    }
  })
} as const;

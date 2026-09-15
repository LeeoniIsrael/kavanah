import { Platform } from "react-native";

export const colors = {
  parchment: "#F3F5F3",
  parchmentLift: "#F8F9F7",
  vellum: "#FEFEFC",
  glass: "rgba(254, 254, 252, 0.94)",
  ink: "#111412",
  inkMuted: "#616A65",
  inkFaint: "rgba(17, 20, 18, 0.42)",
  hairline: "rgba(17, 20, 18, 0.09)",
  hairlineStrong: "rgba(17, 20, 18, 0.16)",
  mineral: "#E4E8E5",
  mineralDark: "#9DA69F",
  gold: "#9B7B38",
  goldSoft: "#F0E9D7",
  olive: "#456050",
  oliveSoft: "#E3E9E5",
  blue: "#1F5EFF",
  blueSoft: "#E8EEFF",
  rose: "#8B5359",
  roseSoft: "#F1E5E6",
  danger: "#B44343",
  shadow: "rgba(17, 20, 18, 0.11)",
  white: "#FFFFFF"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48
} as const;

export const radii = {
  sm: 5,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999
} as const;

export const motion = {
  pressMs: 140,
  stateMs: 240,
  navigationMs: 380,
  standard: [0.4, 0, 0.2, 1] as const
} as const;

export const grid = {
  margin: spacing.xl,
  gutter: spacing.md,
  touch: 44
} as const;

export const type = {
  display: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  section: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  body: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400" as const,
    letterSpacing: 0
  },
  caption: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0
  },
  data: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "600" as const,
    letterSpacing: 0
  }
} as const;

export const fonts = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  hebrew: "NotoSansHebrew_400Regular",
  hebrewSemibold: "NotoSansHebrew_600SemiBold"
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.34,
      shadowRadius: 24
    },
    default: {
      elevation: 3
    }
  }),
  floating: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 18
    },
    default: {
      elevation: 5
    }
  }),
  pressed: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 8
    },
    default: {
      elevation: 2
    }
  })
} as const;

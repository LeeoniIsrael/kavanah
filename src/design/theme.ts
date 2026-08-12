import { Platform } from "react-native";

export const colors = {
  parchment: "#F2F3F1",
  parchmentLift: "#F8F9F7",
  vellum: "#FCFCFA",
  glass: "rgba(252, 252, 250, 0.92)",
  ink: "#151715",
  inkMuted: "#626762",
  inkFaint: "rgba(21, 23, 21, 0.43)",
  hairline: "rgba(21, 23, 21, 0.10)",
  hairlineStrong: "rgba(21, 23, 21, 0.18)",
  mineral: "#DDE2DF",
  mineralDark: "#A8B0AB",
  gold: "#9B7B38",
  goldSoft: "#F0E9D7",
  olive: "#456050",
  oliveSoft: "#E3E9E5",
  blue: "#255CFF",
  blueSoft: "#E7ECFF",
  rose: "#8B5359",
  roseSoft: "#F1E5E6",
  danger: "#B44343",
  shadow: "rgba(21, 23, 21, 0.12)",
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
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  title: {
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  section: {
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
    letterSpacing: 0
  },
  body: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400" as const,
    letterSpacing: 0
  },
  caption: {
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0
  },
  data: {
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "600" as const,
    letterSpacing: 0
  }
} as const;

export const fonts = {
  regular: "IBMPlexSans_400Regular",
  medium: "IBMPlexSans_500Medium",
  semibold: "IBMPlexSans_600SemiBold",
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

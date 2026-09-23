import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { colors, fonts } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

import { animatedHeaderConfig as config } from "./conf";
import type { AnimatedHeaderScrollViewProps } from "./types";

export type {
  AnimatedHeaderScrollViewProps,
  BlurConfig,
  GradientConfig,
  MaskGradientColors,
} from "./types";

const DEFAULT_GRADIENT = [
  "rgba(18, 18, 20, 0.98)",
  "rgba(18, 18, 20, 0.92)",
  "rgba(18, 18, 20, 0)",
] as const;

export function AnimatedHeaderScrollView({
  largeTitle,
  subtitle,
  children,
  leftComponent,
  rightComponent,
  showsVerticalScrollIndicator = false,
  contentContainerStyle,
  headerBackgroundGradient,
  headerBlurConfig,
  smallTitleBlurIntensity,
  smallTitleBlurTint,
  maskGradientColors,
  largeTitleBlurIntensity = 0,
  largeHeaderTitleStyle,
  largeHeaderSubtitleStyle,
  smallHeaderTitleStyle,
  smallHeaderSubtitleStyle,
}: AnimatedHeaderScrollViewProps): React.JSX.Element {
  const scrollY = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const gradient = useMemo(
    () => headerBackgroundGradient ?? { colors: DEFAULT_GRADIENT },
    [headerBackgroundGradient],
  );
  const blurIntensity =
    smallTitleBlurIntensity ?? headerBlurConfig?.intensity ?? 48;
  const blurTint = smallTitleBlurTint ?? headerBlurConfig?.tint ?? "dark";

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [8, config.collapseDistance],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const smallTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [config.collapseDistance * 0.55, config.collapseDistance],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: reduceMotion
          ? 0
          : interpolate(
              scrollY.value,
              [config.collapseDistance * 0.55, config.collapseDistance],
              [5, 0],
              Extrapolation.CLAMP,
            ),
      },
    ],
  }));

  const largeHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, config.collapseDistance * 0.85],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: reduceMotion
          ? 0
          : interpolate(
              scrollY.value,
              [0, config.collapseDistance],
              [0, -12],
              Extrapolation.CLAMP,
            ),
      },
      {
        scale: reduceMotion
          ? 1
          : interpolate(
              scrollY.value,
              [0, config.collapseDistance],
              [1, 0.96],
              Extrapolation.CLAMP,
            ),
      },
    ],
  }));

  const fadeColors = maskGradientColors ?? gradient.colors;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <AmbientGlow />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        <View style={styles.contentColumn}>
          <View style={styles.barSpacer} />
          <Animated.View style={[styles.largeHeader, largeHeaderStyle]}>
            {largeTitleBlurIntensity > 0 ? (
              <BlurView
                pointerEvents="none"
                intensity={largeTitleBlurIntensity}
                tint={blurTint}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <Text
              accessibilityRole="header"
              style={[styles.largeTitle, largeHeaderTitleStyle]}
            >
              {largeTitle}
            </Text>
            {subtitle ? (
              <Text style={[styles.largeSubtitle, largeHeaderSubtitleStyle]}>
                {subtitle}
              </Text>
            ) : null}
          </Animated.View>
          <View style={styles.children}>{children}</View>
        </View>
      </Animated.ScrollView>

      <View pointerEvents="box-none" style={styles.stickyHeader}>
        <Animated.View pointerEvents="none" style={[styles.chrome, chromeStyle]}>
          <BlurView
            intensity={blurIntensity}
            tint={blurTint}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[...fadeColors]}
            locations={gradient.locations ? [...gradient.locations] : null}
            start={gradient.start ?? { x: 0.5, y: 0 }}
            end={gradient.end ?? { x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.hairline} />
        </Animated.View>

        <View style={styles.barContent}>
          <View style={styles.side}>{leftComponent}</View>
          <Animated.View style={[styles.smallTitleWrap, smallTitleStyle]}>
            <Text
              numberOfLines={1}
              style={[styles.smallTitle, smallHeaderTitleStyle]}
            >
              {largeTitle}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={[styles.smallSubtitle, smallHeaderSubtitleStyle]}
              >
                {subtitle}
              </Text>
            ) : null}
          </Animated.View>
          <View style={[styles.side, styles.right]}>{rightComponent}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function AmbientGlow(): React.JSX.Element {
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      viewBox="0 0 600 900"
      preserveAspectRatio="xMidYMin slice"
    >
      <Defs>
        <RadialGradient id="animatedHeaderAmbient" cx="50%" cy="0%" r="68%">
          <Stop offset="0" stopColor={colors.blue} stopOpacity="0.11" />
          <Stop offset="0.55" stopColor={colors.blue} stopOpacity="0.025" />
          <Stop offset="1" stopColor={colors.parchment} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="600" height="520" fill="url(#animatedHeaderAmbient)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: config.background,
  },
  scrollContent: {
    paddingHorizontal: config.horizontalInset,
    paddingBottom: 120,
  },
  contentColumn: {
    width: "100%",
    maxWidth: config.contentMaxWidth,
    alignSelf: "center",
  },
  barSpacer: {
    height: config.barHeight + 10,
  },
  largeHeader: {
    minHeight: 98,
    justifyContent: "flex-end",
    gap: 5,
    paddingBottom: 18,
    transformOrigin: "left bottom",
    overflow: "hidden",
  },
  largeTitle: {
    color: config.title,
    fontFamily: config.fontFamily,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.35,
  },
  largeSubtitle: {
    color: config.subtitle,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  children: {
    gap: 24,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: config.barHeight,
    zIndex: 20,
  },
  chrome: {
    ...StyleSheet.absoluteFill,
    height: config.barHeight + 18,
    overflow: "hidden",
  },
  hairline: {
    position: "absolute",
    left: config.horizontalInset,
    right: config.horizontalInset,
    bottom: 17,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairlineStrong,
  },
  barContent: {
    width: "100%",
    maxWidth: config.contentMaxWidth + config.horizontalInset * 2,
    height: config.barHeight,
    alignSelf: "center",
    paddingHorizontal: config.horizontalInset,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  side: {
    width: 116,
    minHeight: 44,
    justifyContent: "center",
  },
  right: {
    alignItems: "flex-end",
  },
  smallTitleWrap: {
    position: "absolute",
    left: 112,
    right: 112,
    alignItems: "center",
    justifyContent: "center",
  },
  smallTitle: {
    color: config.title,
    fontFamily: config.titleFontFamily,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  smallSubtitle: {
    color: config.subtitle,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
  },
});

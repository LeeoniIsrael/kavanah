import { StyleSheet, Text } from "react-native";
import Animated from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { colors, fonts } from "@/design/theme";

import { animatedHeaderConfig as config } from "./conf";
import type { AnimatedHeaderScrollViewProps } from "./types";

export type {
  AnimatedHeaderScrollViewProps,
  BlurConfig,
  GradientConfig,
  MaskGradientColors,
} from "./types";

/**
 * The app's content scroller. Titles and toolbar actions now live in the native
 * Expo Router stack so iOS can supply its own navigation material.
 */
export function AnimatedHeaderScrollView(
  props: AnimatedHeaderScrollViewProps,
): React.JSX.Element {
  return (
    <Animated.ScrollView
      accessibilityLabel={`${props.largeTitle} screen`}
      automaticallyAdjustsScrollIndicatorInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.scrollContent, props.contentContainerStyle]}
      showsVerticalScrollIndicator={props.showsVerticalScrollIndicator ?? false}
      style={styles.scrollView}
    >
      <AmbientGlow />
      {props.subtitle ? (
        <Text style={[styles.subtitle, props.largeHeaderSubtitleStyle]}>
          {props.subtitle}
        </Text>
      ) : null}
      {props.children}
    </Animated.ScrollView>
  );
}

function AmbientGlow(): React.JSX.Element {
  return (
    <Svg
      pointerEvents="none"
      style={styles.ambientGlow}
      viewBox="0 0 600 520"
      preserveAspectRatio="xMidYMin slice"
    >
      <Defs>
        <RadialGradient id="screenAmbient" cx="50%" cy="0%" r="68%">
          <Stop offset="0" stopColor={colors.blue} stopOpacity="0.11" />
          <Stop offset="0.55" stopColor={colors.blue} stopOpacity="0.025" />
          <Stop offset="1" stopColor={colors.parchment} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="600" height="520" fill="url(#screenAmbient)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  ambientGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 520,
  },
  scrollView: {
    flex: 1,
    backgroundColor: config.background,
  },
  scrollContent: {
    width: "100%",
    maxWidth: config.contentMaxWidth,
    alignSelf: "center",
    gap: 24,
    paddingHorizontal: config.horizontalInset,
    paddingTop: 14,
    paddingBottom: 40,
  },
  subtitle: {
    color: config.subtitle,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
});

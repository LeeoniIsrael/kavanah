import { useThemedStyles, type ThemeColors } from "@/design/appearance";
import { fonts } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useState, type ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { animatedHeaderConfig as config } from "./conf";
import type { AnimatedHeaderScrollViewProps } from "./types";
export type {
  AnimatedHeaderScrollViewProps,
  BlurConfig,
  GradientConfig,
  MaskGradientColors,
} from "./types";

type SurfaceProps = Omit<AnimatedHeaderScrollViewProps, "children"> & {
  renderScroll: (header: ReactNode, scrollProps: ScrollViewProps) => ReactNode;
};

/** Shared chrome for a single ScrollView or a virtualized feed; never nest scroll owners. */
export function AnimatedHeaderSurface(props: SurfaceProps) {
  const styles = useThemedStyles(makeStyles);
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const offset = useSharedValue(0);
  const threshold = useSharedValue<number>(config.collapseDistance);
  const compact = useSharedValue(false);
  const [collapsed, setCollapsed] = useState(false);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      offset.value = Math.max(0, event.contentOffset.y);
      const next = offset.value >= threshold.value;
      if (next !== compact.value) {
        compact.value = next;
        runOnJS(setCollapsed)(next);
      }
    },
  });
  const largeStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? 1
      : interpolate(
          offset.value,
          [0, threshold.value],
          [1, 0],
          Extrapolation.CLAMP,
        ),
    transform: [
      {
        translateY: reduceMotion
          ? 0
          : Math.min(offset.value, threshold.value) * 0.12,
      },
    ],
  }));
  const smallStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? compact.value
        ? 1
        : 0
      : interpolate(
          offset.value,
          [Math.max(0, threshold.value - 24), threshold.value],
          [0, 1],
          Extrapolation.CLAMP,
        ),
    transform: [
      {
        translateY: reduceMotion
          ? 0
          : interpolate(
              offset.value,
              [Math.max(0, threshold.value - 24), threshold.value],
              [6, 0],
              Extrapolation.CLAMP,
            ),
      },
    ],
  }));
  const header = (
    <Animated.View
      style={[styles.header, largeStyle]}
      accessibilityElementsHidden={collapsed}
      importantForAccessibility={collapsed ? "no-hide-descendants" : "auto"}
    >
      {props.leftComponent}
      <View style={styles.titles}>
        <Text
          accessibilityRole="header"
          onLayout={(event) => {
            threshold.set(event.nativeEvent.layout.height + 12);
          }}
          style={[styles.title, props.largeHeaderTitleStyle]}
        >
          {props.largeTitle}
        </Text>
        {props.subtitle && (
          <Text style={[styles.subtitle, props.largeHeaderSubtitleStyle]}>
            {props.subtitle}
          </Text>
        )}
      </View>
      {props.rightComponent}
    </Animated.View>
  );
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      {props.renderScroll(header, {
        onScroll,
        scrollEventThrottle: 16,
        accessibilityLabel: `${props.largeTitle} screen`,
        automaticallyAdjustsScrollIndicatorInsets: true,
        contentInsetAdjustmentBehavior: "automatic",
        keyboardShouldPersistTaps: "handled",
        keyboardDismissMode: "interactive",
        contentContainerStyle: [styles.content, props.contentContainerStyle],
        showsVerticalScrollIndicator:
          props.showsVerticalScrollIndicator ?? false,
      })}
      <Animated.View
        pointerEvents={collapsed ? "auto" : "none"}
        accessibilityElementsHidden={!collapsed}
        importantForAccessibility={collapsed ? "auto" : "no-hide-descendants"}
        style={[
          styles.compact,
          { top: insets.top, left: insets.left, right: insets.right },
          smallStyle,
        ]}
      >
        <View style={styles.compactRow}>
          <View style={styles.action}>{props.leftComponent}</View>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[styles.smallTitle, props.smallHeaderTitleStyle]}
          >
            {props.largeTitle}
          </Text>
          <View style={styles.action}>{props.rightComponent}</View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

export function AnimatedHeaderScrollView({
  children,
  ...props
}: AnimatedHeaderScrollViewProps) {
  return (
    <AnimatedHeaderSurface
      {...props}
      renderScroll={(header, scrollProps) => (
        <Animated.ScrollView {...scrollProps}>
          {header}
          {children}
        </Animated.ScrollView>
      )}
    />
  );
}
const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.parchment },
    content: {
      width: "100%",
      maxWidth: config.contentMaxWidth,
      alignSelf: "center",
      gap: 24,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 40,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    titles: { flex: 1, gap: 8 },
    title: {
      color: colors.ink,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      fontSize: 38,
      lineHeight: 46,
    },
    subtitle: {
      color: colors.inkMuted,
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 22,
    },
    compact: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.parchment,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    compactRow: {
      width: "100%",
      maxWidth: config.contentMaxWidth,
      alignSelf: "center",
      minHeight: config.barHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 24,
      paddingVertical: 6,
    },
    action: {
      minWidth: 44,
      minHeight: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    smallTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: fonts.semibold,
      fontSize: 17,
      lineHeight: 23,
      color: colors.ink,
    },
  });

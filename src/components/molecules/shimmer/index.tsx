import { LinearGradient } from "expo-linear-gradient";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

import type {
  ShimmerDirection,
  ShimmerGroupProps,
  ShimmerPreset,
  ShimmerProps,
} from "./types";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const PRESET_COLORS: Record<Exclude<ShimmerPreset, "custom">, string[]> = {
  dark: ["#1A1A1E", "#34343C", "#1A1A1E"],
  light: ["#E4E4E7", "#FAFAFA", "#E4E4E7"],
  twitter: ["#17202A", "#243447", "#17202A"],
  neutral: [colors.mineral, "#3A3A43", colors.mineral],
};

type GroupContextValue = Pick<
  ShimmerProps,
  | "isLoading"
  | "shimmerColors"
  | "duration"
  | "variant"
  | "direction"
  | "preset"
  | "opacity"
> & { grouped: boolean };

const ShimmerGroupContext = createContext<GroupContextValue>({
  grouped: false,
});

function isHorizontal(direction: ShimmerDirection): boolean {
  return direction === "leftToRight" || direction === "rightToLeft";
}

function gradientPoints(direction: ShimmerDirection): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  switch (direction) {
    case "rightToLeft":
      return { start: { x: 1, y: 0.5 }, end: { x: 0, y: 0.5 } };
    case "topToBottom":
      return { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } };
    case "bottomToTop":
      return { start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } };
    default:
      return { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };
  }
}

/** A content-shaped loading placeholder with a restrained light sweep. */
export function Shimmer({
  isLoading: localIsLoading,
  shimmerColors: localShimmerColors,
  duration: localDuration,
  className,
  style,
  variant: localVariant,
  direction: localDirection,
  preset: localPreset,
  opacity: localOpacity,
  children,
  accessibilityLabel = "Loading content",
}: ShimmerProps): React.JSX.Element | null {
  const group = useContext(ShimmerGroupContext);
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const isLoading = localIsLoading ?? group.isLoading ?? true;
  const duration = Math.max(300, localDuration ?? group.duration ?? 1200);
  const variant = localVariant ?? group.variant ?? "shimmer";
  const direction = localDirection ?? group.direction ?? "leftToRight";
  const preset = localPreset ?? group.preset ?? "neutral";
  const opacity = Math.min(
    1,
    Math.max(0, localOpacity ?? group.opacity ?? 0.78),
  );
  const shimmerColors =
    localShimmerColors ??
    group.shimmerColors ??
    (preset === "custom" ? PRESET_COLORS.neutral : PRESET_COLORS[preset]);
  const palette =
    shimmerColors.length >= 2 ? shimmerColors : PRESET_COLORS.neutral;
  const points = gradientPoints(direction);
  const horizontal = isHorizontal(direction);
  const reverse = direction === "rightToLeft" || direction === "bottomToTop";
  const distance = horizontal ? layout.width : layout.height;

  useEffect(() => {
    cancelAnimation(progress);
    if (!isLoading || reduceMotion) {
      progress.value = 0;
      return;
    }

    if (variant === "pulse") {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.cubic),
          }),
          withTiming(0, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.cubic),
          }),
        ),
        -1,
      );
    } else {
      progress.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
        -1,
        false,
      );
    }

    return () => cancelAnimation(progress);
  }, [duration, isLoading, progress, reduceMotion, variant]);

  const animatedStyle = useAnimatedStyle(() => {
    if (variant === "pulse") {
      return { opacity: reduceMotion ? opacity : 0.48 + progress.value * 0.34 };
    }
    const travel = (progress.value * 3 - 2) * distance * (reverse ? -1 : 1);
    return {
      opacity,
      transform: horizontal
        ? [{ translateX: travel }]
        : [{ translateY: travel }],
    };
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  if (!isLoading) return children ? <>{children}</> : null;

  return (
    <View
      accessible={!group.grouped}
      accessibilityElementsHidden={group.grouped}
      {...(group.grouped
        ? {}
        : { accessibilityLabel, accessibilityRole: "progressbar" as const })}
      {...(className ? { className } : {})}
      importantForAccessibility={group.grouped ? "no-hide-descendants" : "auto"}
      onLayout={handleLayout}
      style={[
        styles.placeholder,
        { backgroundColor: palette[0] ?? colors.mineral },
        style,
      ]}
    >
      {variant === "shimmer" && !reduceMotion ? (
        <AnimatedLinearGradient
          colors={palette as [string, string, ...string[]]}
          end={points.end}
          pointerEvents="none"
          start={points.start}
          style={[
            styles.sweep,
            horizontal
              ? { height: "100%", width: Math.max(layout.width * 2, 1) }
              : { height: Math.max(layout.height * 2, 1), width: "100%" },
            animatedStyle,
          ]}
        />
      ) : (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: palette[1] ?? palette[0] },
            animatedStyle,
          ]}
        />
      )}
    </View>
  );
}

/** Shares motion and color settings across a related skeleton composition. */
export function ShimmerGroup({
  children,
  style,
  accessibilityLabel = "Loading content",
  ...props
}: ShimmerGroupProps): React.JSX.Element {
  const value = useMemo<GroupContextValue>(
    () => ({ ...props, grouped: true }),
    [props],
  );
  const isLoading = props.isLoading ?? true;

  if (!isLoading) return <>{children}</>;

  return (
    <ShimmerGroupContext.Provider value={value}>
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityValue={{ text: "In progress" }}
        style={style}
      >
        {children}
      </View>
    </ShimmerGroupContext.Provider>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    overflow: "hidden",
  },
  sweep: {
    left: 0,
    position: "absolute",
    top: 0,
  },
});

export type {
  ShimmerDirection,
  ShimmerGroupProps,
  ShimmerPreset,
  ShimmerProps,
} from "./types";

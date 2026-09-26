import { useEffect, useId } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type PulsingDotsProps = {
  dotCount?: number;
  radius?: number;
  spacing?: number;
  duration?: number;
  color?: string;
  gradient?: { from: string; to: string }[];
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  decorative?: boolean;
};

function PulseDot({
  index,
  radius,
  duration,
  color,
  gradient,
  reduceMotion,
}: {
  index: number;
  radius: number;
  duration: number;
  color: string;
  gradient?: { from: string; to: string };
  reduceMotion: boolean;
}): React.JSX.Element {
  const opacity = useSharedValue(reduceMotion ? 0.7 : 0.3);
  const gradientId = `pulse-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    cancelAnimation(opacity);
    if (reduceMotion) {
      opacity.value = 0.7;
      return;
    }
    opacity.value = 0.3;
    opacity.value = withDelay(
      index * Math.min(180, duration / 4),
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [duration, index, opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const diameter = radius * 2;
  return (
    <Animated.View
      style={[{ width: diameter, height: diameter }, animatedStyle]}
    >
      <Svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
      >
        {gradient ? (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={gradient.from} />
              <Stop offset="100%" stopColor={gradient.to} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle
          cx={radius}
          cy={radius}
          r={radius}
          fill={gradient ? `url(#${gradientId})` : color}
        />
      </Svg>
    </Animated.View>
  );
}

/** Indeterminate progress with a gentle, sequential opacity pulse. */
export function PulsingDots({
  dotCount = 3,
  radius = 3,
  spacing = 5,
  duration = 800,
  color = colors.blue,
  gradient,
  style,
  accessibilityLabel = "Loading",
  decorative = false,
}: PulsingDotsProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const count = Math.max(1, Math.min(12, Math.floor(dotCount)));
  const safeRadius = Math.max(1, radius);
  return (
    <View
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
      {...(decorative
        ? {}
        : {
            accessibilityLabel,
            accessibilityRole: "progressbar" as const,
            accessibilityValue: { text: "In progress" },
          })}
      style={[styles.container, { columnGap: Math.max(0, spacing) }, style]}
    >
      {Array.from({ length: count }, (_, index) => (
        <PulseDot
          key={index}
          index={index}
          radius={safeRadius}
          duration={Math.max(180, duration)}
          color={color}
          gradient={gradient?.[index] ?? gradient?.[0]}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 18,
  },
});

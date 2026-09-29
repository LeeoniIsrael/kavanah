import { useThemeColors } from "@/design/appearance";
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useReducedMotion } from "@/hooks/useReducedMotion";

import type { CircleLoadingIndicatorProps } from "./types";

const DOT_COUNT = 3;

function WaveDot({
  color,
  delay,
  diameter,
  duration,
  reduceMotion,
}: {
  color: string;
  delay: number;
  diameter: number;
  duration: number;
  reduceMotion: boolean;
}): React.JSX.Element {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }

    const wave = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          duration,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(progress, {
          duration,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    const animation = Animated.sequence([Animated.delay(delay), wave]);
    animation.start();

    return () => animation.stop();
  }, [delay, duration, progress, reduceMotion]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -diameter * 0.425],
  });

  return (
    <Animated.View
      style={{
        height: diameter,
        transform: [{ translateY }],
        width: diameter,
      }}
    >
      <Svg
        height={diameter}
        width={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
      >
        <Circle
          cx={diameter / 2}
          cy={diameter / 2}
          fill={color}
          r={diameter / 2}
        />
      </Svg>
    </Animated.View>
  );
}

/** Three dots rising in sequence to communicate indeterminate progress. */
export function CircleLoadingIndicator({
  accessibilityLabel = "Loading",
  dotColor,
  dotRadius = 3,
  dotSpacing = 5,
  duration = 500,
  style,
}: CircleLoadingIndicatorProps): React.JSX.Element {
  const colors = useThemeColors();
  dotColor ??= colors.blue;

  const reduceMotion = useReducedMotion();
  const safeRadius = Math.max(1, dotRadius);
  const safeDuration = Math.max(180, duration);
  const diameter = safeRadius * 2;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      accessibilityRole="progressbar"
      accessibilityValue={{ text: "In progress" }}
      style={[
        styles.container,
        {
          width: diameter * DOT_COUNT + Math.max(0, dotSpacing) * (DOT_COUNT - 1),
          columnGap: Math.max(0, dotSpacing),
          minHeight: diameter * 1.85,
          paddingTop: diameter * 0.425,
        },
        style,
      ]}
    >
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <WaveDot
          key={index}
          color={dotColor}
          delay={(safeDuration / DOT_COUNT) * index}
          diameter={diameter}
          duration={safeDuration}
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
    alignSelf: "center",
    flexShrink: 0,
  },
});

export type { CircleLoadingIndicatorProps } from "./types";

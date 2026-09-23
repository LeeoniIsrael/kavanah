import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "@/design/theme";
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
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          duration: duration / 2,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          duration: duration / 2,
          easing: Easing.in(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.delay(duration - delay),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [delay, duration, progress, reduceMotion]);

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -diameter * 0.72],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  return (
    <Animated.View
      style={{
        height: diameter,
        opacity,
        transform: [{ translateY }, { scale }],
        width: diameter,
      }}
    >
      <Svg height={diameter} width={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
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
  dotColor = colors.blue,
  dotRadius = 3,
  dotSpacing = 5,
  duration = 500,
  style,
}: CircleLoadingIndicatorProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const safeRadius = Math.max(1, dotRadius);
  const safeDuration = Math.max(180, duration);
  const diameter = safeRadius * 2;

  return (
    <View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      accessibilityValue={{ text: "In progress" }}
      style={[
        styles.container,
        { columnGap: Math.max(0, dotSpacing), minHeight: diameter * 1.75 },
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
  },
});

export type { CircleLoadingIndicatorProps } from "./types";

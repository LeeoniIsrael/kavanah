import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";
import { BrandMark } from "@/components/BrandMark";
import { colors } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** UI-thread motion, with a quiet resting state and no simulated progress. */
export function AssistantMark({ busy }: { busy: boolean }) {
  const reduced = useReducedMotion();
  const turn = useSharedValue(0);
  const activity = useSharedValue(0);
  useEffect(() => {
    activity.value = withTiming(busy ? 1 : 0, { duration: reduced ? 0 : 420 });
    cancelAnimation(turn);
    if (busy && !reduced) {
      turn.value = 0;
      turn.value = withRepeat(
        withTiming(1, { duration: 2800, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      turn.value = withTiming(0, {
        duration: reduced ? 0 : 520,
        easing: Easing.out(Easing.cubic),
      });
    }
    return () => cancelAnimation(turn);
  }, [busy, reduced, activity, turn]);
  const markStyle = useAnimatedStyle(() => ({
    opacity: 1 - activity.value * 0.82,
    transform: [{ scale: 1 - activity.value * 0.3 }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    opacity: activity.value,
    borderRadius: interpolate(
      Math.sin(turn.value * Math.PI * 4) * 0.5 + 0.5,
      [0, 1],
      [10, 22],
    ),
    transform: [
      { rotate: `${turn.value * 360}deg` },
      {
        scale: interpolate(
          Math.cos(turn.value * Math.PI * 4),
          [-1, 1],
          [0.82, 1],
        ),
      },
    ],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    opacity: activity.value * 0.65,
    borderRadius: interpolate(turn.value, [0, 0.5, 1], [16, 7, 16]),
    transform: [{ rotate: `${-turn.value * 360}deg` }],
  }));
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={s.mark}
    >
      <Animated.View style={markStyle}>
        <BrandMark size={30} />
      </Animated.View>
      <Animated.View style={[s.orbit, orbitStyle]} />
      <Animated.View style={[s.inner, innerStyle]} />
    </View>
  );
}

export function AssistantBeam({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const reduced = useReducedMotion();
  const phase = useSharedValue(0);
  const visibility = useSharedValue(0);
  const radius = 24;
  const perimeter = Math.max(
    1,
    2 * (size.width + size.height - 4) - (8 - 2 * Math.PI) * radius,
  );
  useEffect(() => {
    visibility.value = withTiming(active ? 1 : 0, {
      duration: reduced ? 0 : 260,
    });
    cancelAnimation(phase);
    if (active && !reduced)
      phase.value = withRepeat(
        withTiming(1, { duration: 3400, easing: Easing.linear }),
        -1,
        false,
      );
    else phase.value = 0;
    return () => cancelAnimation(phase);
  }, [active, reduced, phase, visibility]);
  const beamProps = useAnimatedProps(() => ({
    strokeDashoffset: -phase.value * perimeter,
    opacity: visibility.value,
  }));
  return (
    <View
      onLayout={({ nativeEvent: { layout } }) =>
        setSize({ width: layout.width, height: layout.height })
      }
      style={s.composer}
    >
      {children}
      {size.width > 0 && (
        <Svg
          pointerEvents="none"
          accessible={false}
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
        >
          <Rect
            x={1}
            y={1}
            width={size.width - 2}
            height={size.height - 2}
            rx={radius}
            fill="none"
            stroke={colors.hairlineStrong}
            strokeWidth={1}
          />
          <AnimatedRect
            animatedProps={beamProps}
            x={1}
            y={1}
            width={size.width - 2}
            height={size.height - 2}
            rx={radius}
            fill="none"
            stroke={colors.blue}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={[perimeter * 0.12, perimeter * 0.88]}
          />
          <AnimatedRect
            animatedProps={beamProps}
            x={1}
            y={1}
            width={size.width - 2}
            height={size.height - 2}
            rx={radius}
            fill="none"
            stroke="#D9DEFF"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeDasharray={[perimeter * 0.035, perimeter * 0.965]}
          />
        </Svg>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  mark: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  orbit: {
    position: "absolute",
    width: 40,
    height: 40,
    borderWidth: 1.8,
    borderColor: colors.blue,
    borderCurve: "continuous",
  },
  inner: {
    position: "absolute",
    width: 29,
    height: 29,
    borderWidth: 1.2,
    borderColor: "#D9DEFF",
    borderCurve: "continuous",
  },
  composer: {
    borderRadius: 25,
    borderCurve: "continuous",
    backgroundColor: colors.vellum,
    overflow: "hidden",
  },
});

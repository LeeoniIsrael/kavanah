import type { PropsWithChildren } from "react";
import { useRef } from "react";
import { Animated, Easing, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { confirmHaptic, softHaptic, successHaptic, tapHaptic } from "@/services/haptics";

type HapticTone = "selection" | "soft" | "confirm" | "success" | "none";

type Props = PropsWithChildren<
  Omit<PressableProps, "style"> & {
    style?: StyleProp<ViewStyle>;
    pressedScale?: number;
    haptic?: boolean | HapticTone;
  }
>;

export function AnimatedPressable({ children, onPress, style, pressedScale = 0.985, haptic = "soft", ...props }: Props): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  const animateTo = (value: number) => {
    if (reduceMotion) {
      scale.setValue(1);
      lift.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(scale, {
        toValue: value,
        useNativeDriver: true,
        duration: motion.pressMs,
        easing: Easing.bezier(...motion.standard)
      }),
      Animated.timing(lift, {
        toValue: value === 1 ? 0 : 1.5,
        useNativeDriver: true,
        duration: motion.pressMs,
        easing: Easing.bezier(...motion.standard)
      })
    ]).start();
  };

  const playHaptic = async () => {
    if (haptic === false || haptic === "none") return;
    if (haptic === true || haptic === "selection") return tapHaptic();
    if (haptic === "confirm") return confirmHaptic();
    if (haptic === "success") return successHaptic();
    return softHaptic();
  };

  return (
    <Pressable
      {...props}
      onPress={async (event) => {
        await playHaptic();
        onPress?.(event);
      }}
      onPressIn={(event) => {
        animateTo(pressedScale);
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        props.onPressOut?.(event);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }, { translateY: lift }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

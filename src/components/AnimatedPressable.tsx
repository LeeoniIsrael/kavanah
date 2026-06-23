import type { PropsWithChildren } from "react";
import { useRef } from "react";
import { Animated, Easing, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { motion } from "@/design/theme";
import { tapHaptic } from "@/services/haptics";

type Props = PropsWithChildren<
  Omit<PressableProps, "style"> & {
    style?: StyleProp<ViewStyle>;
    pressedScale?: number;
    haptic?: boolean;
  }
>;

export function AnimatedPressable({ children, onPress, style, pressedScale = 0.975, haptic = true, ...props }: Props): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.timing(scale, {
      toValue: value,
      useNativeDriver: true,
      duration: motion.pressMs,
      easing: Easing.bezier(...motion.standard)
    }).start();
  };

  return (
    <Pressable
      {...props}
      onPress={async (event) => {
        if (haptic) {
          await tapHaptic();
        }
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
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

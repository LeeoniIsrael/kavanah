import type { PropsWithChildren } from "react";
import { useRef } from "react";
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

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
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 28,
      bounciness: 4
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

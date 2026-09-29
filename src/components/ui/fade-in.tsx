import { useEffect, useState, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** A short, native opacity reveal. Mount with a new key to replay for a new view. */
export function FadeIn({
  children,
  style,
  ready = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  ready?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion || !ready) {
      opacity.setValue(ready ? 1 : 0);
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, ready, reduceMotion]);

  return (
    <Animated.View
      style={[style, { opacity: reduceMotion && ready ? 1 : opacity }]}
    >
      {children}
    </Animated.View>
  );
}

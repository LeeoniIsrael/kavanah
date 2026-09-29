import { useFocusEffect } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import { contentMotion } from "@/design/contentMotion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Native tabs keep their state; replay the same reveal on every return. */
export function NavigationFade({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  useFocusEffect(
    useCallback(() => {
      opacity.setValue(reducedMotion ? 1 : 0);
      if (reducedMotion) return;
      const animation = Animated.timing(opacity, {
        toValue: 1,
        duration: contentMotion.duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start();
      return () => {
        animation.stop();
        opacity.setValue(1);
      };
    }, [opacity, reducedMotion]),
  );
  return (
    <Animated.View style={{ flex: 1, opacity: reducedMotion ? 1 : opacity }}>
      {children}
    </Animated.View>
  );
}

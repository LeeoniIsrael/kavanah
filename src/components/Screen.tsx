import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Screen({ children }: PropsWithChildren): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: reduceMotion ? 0 : motion.navigationMs,
        easing: Easing.bezier(...motion.standard),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: reduceMotion ? 0 : motion.navigationMs,
        easing: Easing.bezier(...motion.standard),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, reduceMotion, translateY]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="px-5 pt-5 pb-[120px]"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          className="w-full max-w-[600px] self-center gap-6"
          style={[{ opacity, transform: [{ translateY }] }]}
        >
          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

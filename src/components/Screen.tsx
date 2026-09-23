import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

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
      <Svg
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
        viewBox="0 0 600 900"
        preserveAspectRatio="xMidYMin slice"
      >
        <Defs>
          <RadialGradient id="ambient" cx="50%" cy="0%" r="68%">
            <Stop offset="0" stopColor="#7C8CFF" stopOpacity="0.11" />
            <Stop offset="0.55" stopColor="#7C8CFF" stopOpacity="0.025" />
            <Stop offset="1" stopColor="#121214" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="600" height="520" fill="url(#ambient)" />
      </Svg>
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

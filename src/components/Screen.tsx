import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, motion, spacing } from "@/design/theme";

export function Screen({ children }: PropsWithChildren): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.navigationMs,
        easing: Easing.bezier(...motion.standard),
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.navigationMs,
        easing: Easing.bezier(...motion.standard),
        useNativeDriver: true,
      })
    ]).start();
  }, [opacity, translateY]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.stack, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.parchment
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 132
  },
  stack: {
    gap: spacing.xl
  }
});

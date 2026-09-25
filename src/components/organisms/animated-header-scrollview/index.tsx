import { Platform, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "@/design/theme";
import { animatedHeaderConfig as config } from "./conf";
import type { AnimatedHeaderScrollViewProps } from "./types";
export type {
  AnimatedHeaderScrollViewProps,
  BlurConfig,
  GradientConfig,
  MaskGradientColors,
} from "./types";

/** One title, one inset owner, and one scroll surface across the library/settings. */
export function AnimatedHeaderScrollView(props: AnimatedHeaderScrollViewProps) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <Animated.ScrollView
        accessibilityLabel={`${props.largeTitle} screen`}
        automaticallyAdjustsScrollIndicatorInsets
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[styles.content, props.contentContainerStyle]}
        showsVerticalScrollIndicator={
          props.showsVerticalScrollIndicator ?? false
        }
      >
        <View style={styles.header}>
          {props.leftComponent}
          <View style={styles.titles}>
            <Text
              accessibilityRole="header"
              style={[styles.title, props.largeHeaderTitleStyle]}
            >
              {props.largeTitle}
            </Text>
            {props.subtitle && (
              <Text style={[styles.subtitle, props.largeHeaderSubtitleStyle]}>
                {props.subtitle}
              </Text>
            )}
          </View>
          {props.rightComponent}
        </View>
        {props.children}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parchment },
  content: {
    width: "100%",
    maxWidth: config.contentMaxWidth,
    alignSelf: "center",
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  titles: { flex: 1, gap: 8 },
  title: {
    color: colors.ink,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 38,
    lineHeight: 46,
  },
  subtitle: {
    color: colors.inkMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
});

import { BlurView } from "expo-blur";
import { Search, X } from "@/components/ui/icons";
import { useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { fonts, palettes } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type PrayerSearchBarProps = {
  active: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onActivate: () => void;
  onCancel: () => void;
};

/** A single search control for both the resting and focused prayer views. */
export function PrayerSearchBar({
  active,
  value,
  onChangeText,
  onActivate,
  onCancel,
}: PrayerSearchBarProps): React.JSX.Element {
  const inputRef = useRef<TextInput>(null);
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? active
        ? 1
        : 0
      : withSpring(active ? 1 : 0, { damping: 19, stiffness: 170 });
    if (active) {
      const timer = setTimeout(
        () => inputRef.current?.focus(),
        reduceMotion ? 0 : 220,
      );
      return () => clearTimeout(timer);
    }
    inputRef.current?.blur();
  }, [active, progress, reduceMotion]);

  const barStyle = useAnimatedStyle(() => ({
    borderColor: progress.value > 0.5 ? colors.blue : colors.hairlineStrong,
    transform: [{ scale: 1 + progress.value * 0.012 }],
  }));
  const cancelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(active ? 1 : 0, { duration: reduceMotion ? 0 : 220 }),
    transform: [
      {
        translateX: withTiming(active ? 0 : 10, {
          duration: reduceMotion ? 0 : 220,
        }),
      },
    ],
  }));

  const contents = (
    <View style={[styles.content, !active && styles.centered]}>
      <Search size={18} color={active ? colors.blue : colors.inkMuted} />
      {active ? (
        <TextInput
          ref={inputRef}
          accessibilityLabel="Search prayers"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeText}
          onSubmitEditing={() => inputRef.current?.blur()}
          placeholder="Find a prayer..."
          placeholderTextColor={colors.inkMuted}
          returnKeyType="search"
          selectionColor={colors.blue}
          style={[styles.input, { color: colors.ink }]}
          value={value}
        />
      ) : (
        <Text
          style={[styles.placeholder, { color: colors.inkMuted }]}
          numberOfLines={1}
        >
          {value || "Find a prayer..."}
        </Text>
      )}
      {active && value.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => {
            onChangeText("");
            inputRef.current?.focus();
          }}
          style={[styles.clear, { backgroundColor: colors.mineral }]}
        >
          <X size={16} color={colors.inkMuted} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.row}>
      <Animated.View
        style={[styles.bar, { backgroundColor: colors.vellum }, barStyle]}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={38}
            tint={
              colors.parchment === palettes.dark.parchment ? "dark" : "light"
            }
            style={styles.blur}
          >
            {active ? (
              contents
            ) : (
              <Pressable
                onPress={onActivate}
                accessibilityRole="search"
                style={styles.hitArea}
              >
                {contents}
              </Pressable>
            )}
          </BlurView>
        ) : active ? (
          contents
        ) : (
          <Pressable
            onPress={onActivate}
            accessibilityRole="search"
            style={styles.hitArea}
          >
            {contents}
          </Pressable>
        )}
      </Animated.View>
      {active ? (
        <Animated.View style={cancelStyle}>
          <Pressable
            accessibilityLabel="Cancel search"
            accessibilityRole="button"
            onPress={onCancel}
            hitSlop={8}
          >
            <Text style={[styles.cancel, { color: colors.blue }]}>Cancel</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  bar: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
  },
  blur: { overflow: "hidden", borderRadius: 18 },
  hitArea: { minHeight: 58, justifyContent: "center" },
  content: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  centered: { justifyContent: "center" },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  placeholder: {
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  clear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: { fontFamily: fonts.medium, fontSize: 15 },
});

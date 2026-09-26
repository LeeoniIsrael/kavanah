import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Search, X } from "@/components/ui/icons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useThemeColors } from "@/design/appearance";

const AnimatedView = Animated.View;

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  inputProps?: Omit<TextInputProps, "value" | "onChangeText" | "placeholder">;
  style?: ViewStyle;
};

/** Shared, theme-aware search field with a focus reveal and a cancel action. */
export function SearchBar({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  inputProps,
  style,
}: SearchBarProps): React.JSX.Element {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const progress = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    progress.value = reduceMotion
      ? focused ? 1 : 0
      : withSpring(focused ? 1 : 0, { damping: 22, stiffness: 210 });
  }, [focused, progress, reduceMotion]);

  const cancelWrapStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, 60]),
  }));
  const cancelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: interpolate(progress.value, [0, 1], [8, 0]) }],
  }));
  const clearStyle = useAnimatedStyle(() => ({
    opacity: withTiming(value.length ? 1 : 0, { duration: reduceMotion ? 0 : 140 }),
    transform: [{ scale: reduceMotion ? (value.length ? 1 : 0.8) : withSpring(value.length ? 1 : 0.8) }],
  }));

  const cancel = () => {
    onChangeText("");
    inputRef.current?.blur();
  };

  return (
    <View style={[styles.row, style]}>
      <AnimatedView style={styles.bar}>
        <BlurView intensity={18} tint="systemMaterial" style={styles.blur}>
          <View
            style={[
              styles.content,
              {
                backgroundColor: colors.vellum,
                justifyContent: focused ? "flex-start" : "center",
              },
            ]}
          >
            <Search size={20} color={colors.inkMuted} />
            <TextInput
              ref={inputRef}
              accessibilityLabel={accessibilityLabel}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.inkMuted}
              selectionColor={colors.blue}
              returnKeyType="done"
              autoCorrect={false}
              autoCapitalize="none"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={() => inputRef.current?.blur()}
              style={[styles.input, { color: colors.ink, fontFamily: "Manrope_400Regular" }]}
              {...inputProps}
            />
            <AnimatedView style={clearStyle} pointerEvents={value ? "auto" : "none"}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={10}
                onPress={() => onChangeText("")}
                style={styles.iconButton}
              >
                <X size={18} color={colors.inkMuted} />
              </Pressable>
            </AnimatedView>
          </View>
        </BlurView>
      </AnimatedView>
      <AnimatedView style={[styles.cancelWrap, cancelWrapStyle, cancelStyle]} pointerEvents={focused ? "auto" : "none"}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
          onPress={cancel}
          style={styles.cancelButton}
        >
          <Text style={[styles.cancelText, { color: colors.blue, fontFamily: "Manrope_500Medium" }]}>Cancel</Text>
        </Pressable>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: "100%", minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12 },
  bar: { flex: 1, minWidth: 0 },
  blur: { borderRadius: 18, overflow: "hidden" },
  content: { minHeight: 56, borderRadius: 18, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 },
  input: { flex: 1, minWidth: 0, minHeight: 52, fontSize: 17, lineHeight: 25, paddingVertical: 0 },
  iconButton: { width: 36, height: 44, alignItems: "center", justifyContent: "center" },
  cancelWrap: { width: 60, height: 44, overflow: "hidden" },
  cancelButton: { width: 60, height: 44, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 16, lineHeight: 22 },
});

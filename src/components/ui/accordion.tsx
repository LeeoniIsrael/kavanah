import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { ChevronDown, Plus } from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
import { fonts, geometry } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { tapHaptic } from "@/services/haptics";

export type AccordionValue = string | string[] | null;
type RootProps = PropsWithChildren<{
  type?: "single" | "multiple";
  value?: AccordionValue;
  defaultValue?: AccordionValue;
  onValueChange?: (value: AccordionValue) => void;
  collapsible?: boolean;
  gap?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}>;
const RootContext = createContext<{
  open: string[];
  toggle: (id: string) => void;
  radius: number;
} | null>(null);
const ItemContext = createContext<{
  isOpen: boolean;
  toggle: () => void;
  icon: "chevron" | "cross";
} | null>(null);
function useItem() {
  const value = useContext(ItemContext);
  if (!value)
    throw new Error("Accordion.Trigger and Content require an Accordion.Item.");
  return value;
}
const values = (value: AccordionValue): string[] =>
  value === null ? [] : Array.isArray(value) ? value : [value];
function Root({
  children,
  type = "single",
  value,
  defaultValue = null,
  onValueChange,
  collapsible = true,
  gap = 8,
  radius = geometry.radius.surface,
  style,
}: RootProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value === undefined ? internal : value;
  const context = useMemo(() => {
    const open =
      type === "single" ? values(current).slice(0, 1) : values(current);
    return {
      open,
      radius,
      toggle: (id: string) => {
        const closing = open.includes(id);
        if (closing && !collapsible && open.length === 1) return;
        const next = closing
          ? open.filter((item) => item !== id)
          : type === "single"
            ? [id]
            : [...open, id];
        const result = type === "single" ? (next[0] ?? null) : next;
        if (value === undefined) setInternal(result);
        onValueChange?.(result);
        void tapHaptic();
      },
    };
  }, [current, type, radius, collapsible, value, onValueChange]);
  return (
    <RootContext.Provider value={context}>
      <View style={[{ gap }, style]}>{children}</View>
    </RootContext.Provider>
  );
}
function Item({
  children,
  value,
  icon = "chevron",
  style,
}: PropsWithChildren<{
  value: string;
  icon?: "chevron" | "cross";
  style?: StyleProp<ViewStyle>;
}>) {
  const root = useContext(RootContext);
  const colors = useThemeColors();
  if (!root) throw new Error("Accordion.Item requires Accordion.Root.");
  return (
    <ItemContext.Provider
      value={{
        isOpen: root.open.includes(value),
        toggle: () => root.toggle(value),
        icon,
      }}
    >
      <View
        style={[
          {
            backgroundColor: colors.vellum,
            borderRadius: root.radius,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </View>
    </ItemContext.Provider>
  );
}
function useProgress(open: boolean) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    progress.value = reduced
      ? open
        ? 1
        : 0
      : withTiming(open ? 1 : 0, {
          duration: 240,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
  }, [open, progress, reduced]);
  return progress;
}
function Indicator() {
  const { isOpen, icon } = useItem();
  const colors = useThemeColors();
  const progress = useProgress(isOpen);
  const style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${progress.value * (icon === "cross" ? 45 : 180)}deg` },
    ],
  }));
  const Glyph = icon === "cross" ? Plus : ChevronDown;
  return (
    <Animated.View style={style} accessible={false}>
      <Glyph size={16} color={colors.inkMuted} />
    </Animated.View>
  );
}
type TriggerProps = PropsWithChildren<{
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  indicator?: boolean;
  onPress?: () => void;
}>;
function TriggerBase({
  children,
  style,
  contentStyle,
  indicator = true,
  onPress,
  ...props
}: TriggerProps) {
  const { isOpen, toggle } = useItem();
  return (
    <Button
      {...props}
      variant="ghost"
      size="content"
      withPressAnimation={false}
      accessibilityState={{ expanded: isOpen }}
      onPress={() => {
        onPress?.();
        toggle();
      }}
      style={[styles.trigger, style]}
    >
      <View style={[styles.triggerContent, contentStyle]}>{children}</View>
      {indicator ? <Indicator /> : null}
    </Button>
  );
}
function Label({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  const colors = useThemeColors();
  return (
    <Text
      variant="body"
      style={[
        {
          flex: 1,
          fontSize: 17,
          lineHeight: 24,
          fontFamily: fonts.semibold,
          color: colors.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
function Icon({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <View
      style={[
        { width: 24, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      {children}
    </View>
  );
}
/** One natural-height subtree: remeasures on text scaling, width and async content changes. */
export function AccordionReveal({
  open,
  children,
  style,
}: PropsWithChildren<{ open: boolean; style?: StyleProp<ViewStyle> }>) {
  const progress = useProgress(open);
  const height = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value * progress.value,
    opacity: progress.value,
  }));
  return (
    <Animated.View
      style={[styles.clip, animatedStyle]}
      pointerEvents={open ? "auto" : "none"}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
    >
      <View
        style={[styles.measure, style]}
        onLayout={({ nativeEvent }) => {
          height.value = nativeEvent.layout.height;
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}
function Content({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { isOpen } = useItem();
  return (
    <AccordionReveal open={isOpen} style={[styles.content, style]}>
      {typeof children === "string" ? (
        <Text variant="body" style={{ fontSize: 14, lineHeight: 22 }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </AccordionReveal>
  );
}
export const Accordion = Object.assign(Root, {
  Root,
  Item,
  Trigger: Object.assign(TriggerBase, { Label, Icon, Indicator }),
  Content,
});
const styles = StyleSheet.create({
  trigger: {
    minHeight: 52,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  triggerContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clip: { overflow: "hidden" },
  measure: { position: "absolute", top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
});

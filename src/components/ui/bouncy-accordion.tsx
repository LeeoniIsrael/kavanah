import { ChevronDown } from "lucide-react-native";
import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { colors, fonts, geometry, spacing } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type TBouncyAccordionValue = string | null;

type RootProps = PropsWithChildren<{
  value?: TBouncyAccordionValue;
  defaultValue?: TBouncyAccordionValue;
  onValueChange?: (value: TBouncyAccordionValue) => void;
  collapsible?: boolean;
  gap?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}>;

type RootContextValue = {
  gap: number;
  openValue: TBouncyAccordionValue;
  radius: number;
  toggle: (value: string) => void;
};

type ItemContextValue = {
  isOpen: boolean;
  progress: Animated.Value;
  toggle: () => void;
};

const RootContext = createContext<RootContextValue | null>(null);
const ItemContext = createContext<ItemContextValue | null>(null);

function useRootContext(): RootContextValue {
  const context = useContext(RootContext);
  if (!context)
    throw new Error(
      "BouncyAccordion.Item must be inside BouncyAccordion.Root.",
    );
  return context;
}

function useItemContext(): ItemContextValue {
  const context = useContext(ItemContext);
  if (!context)
    throw new Error(
      "BouncyAccordion content must be inside BouncyAccordion.Item.",
    );
  return context;
}

function Root({
  children,
  value,
  defaultValue = null,
  onValueChange,
  collapsible = true,
  gap = spacing.sm,
  radius = geometry.radius.surface,
  style,
}: RootProps): React.JSX.Element {
  const [internalValue, setInternalValue] =
    useState<TBouncyAccordionValue>(defaultValue);
  const isControlled = value !== undefined;
  const openValue = isControlled ? value : internalValue;

  const context = useMemo<RootContextValue>(
    () => ({
      gap,
      openValue,
      radius,
      toggle: (nextValue) => {
        const next = openValue === nextValue && collapsible ? null : nextValue;
        if (!isControlled) setInternalValue(next);
        if (next !== openValue) onValueChange?.(next);
      },
    }),
    [collapsible, gap, isControlled, onValueChange, openValue, radius],
  );

  return (
    <RootContext.Provider value={context}>
      <View style={[styles.root, { borderRadius: radius }, style]}>
        {children}
      </View>
    </RootContext.Provider>
  );
}

type ItemProps = PropsWithChildren<{
  value: string;
  style?: StyleProp<ViewStyle>;
}>;

function Item({ children, value, style }: ItemProps): React.JSX.Element {
  const { gap, openValue, radius, toggle } = useRootContext();
  const isOpen = openValue === value;
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(isOpen ? 1 : 0);
      return;
    }

    Animated.spring(progress, {
      toValue: isOpen ? 1 : 0,
      stiffness: isOpen ? 265 : 320,
      damping: isOpen ? 20 : 27,
      mass: 0.82,
      overshootClamping: false,
      restDisplacementThreshold: 0.5,
      restSpeedThreshold: 0.5,
      useNativeDriver: false,
    }).start();
  }, [isOpen, progress, reduceMotion]);

  const context = useMemo<ItemContextValue>(
    () => ({ isOpen, progress, toggle: () => toggle(value) }),
    [isOpen, progress, toggle, value],
  );
  const animatedGap = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, gap],
    extrapolate: "clamp",
  });

  return (
    <ItemContext.Provider value={context}>
      <Animated.View
        style={[
          styles.item,
          { borderRadius: isOpen ? radius : 0, marginVertical: animatedGap },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </ItemContext.Provider>
  );
}

type TriggerProps = PropsWithChildren<
  Omit<PressableProps, "children" | "onPress" | "style"> & {
    style?: StyleProp<ViewStyle>;
  }
>;

function TriggerBase({
  children,
  style,
  ...props
}: TriggerProps): React.JSX.Element {
  const { isOpen, progress, toggle } = useItemContext();
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
    extrapolate: "clamp",
  });

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ ...props.accessibilityState, expanded: isOpen }}
      onPress={toggle}
      style={({ pressed }) => [
        styles.trigger,
        pressed && styles.triggerPressed,
        style,
      ]}
    >
      <View style={styles.triggerContent}>{children}</View>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <ChevronDown size={18} strokeWidth={2.2} color={colors.inkMuted} />
      </Animated.View>
    </Pressable>
  );
}

function TriggerIcon({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>): React.JSX.Element {
  return <View style={[styles.icon, style]}>{children}</View>;
}

function TriggerLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}): React.JSX.Element {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

type ContentProps = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;

function Content({ children, style }: ContentProps): React.JSX.Element {
  const { isOpen, progress } = useItemContext();
  const [contentHeight, setContentHeight] = useState(0);
  const handleLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight !== contentHeight) setContentHeight(nextHeight);
  };
  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-spacing.sm, 0],
  });

  return (
    <Animated.View
      accessibilityElementsHidden={!isOpen}
      importantForAccessibility={isOpen ? "auto" : "no-hide-descendants"}
      pointerEvents={isOpen ? "auto" : "none"}
      style={[styles.contentClip, { height, opacity }]}
    >
      <Animated.View
        onLayout={handleLayout}
        style={[styles.content, { transform: [{ translateY }] }, style]}
      >
        {typeof children === "string" ? (
          <Text style={styles.body}>{children}</Text>
        ) : (
          children
        )}
      </Animated.View>
    </Animated.View>
  );
}

const Trigger = Object.assign(TriggerBase, {
  Icon: TriggerIcon,
  Label: TriggerLabel,
});

export const BouncyAccordion = { Root, Item, Trigger, Content };

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    backgroundColor: colors.parchment,
    borderColor: colors.hairlineStrong,
    borderWidth: StyleSheet.hairlineWidth,
  },
  item: {
    overflow: "hidden",
    backgroundColor: colors.vellum,
    borderBottomColor: colors.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trigger: {
    minHeight: 66,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  triggerPressed: { opacity: 0.72 },
  triggerContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: geometry.radius.control - 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.goldSoft,
  },
  label: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  contentClip: { overflow: "hidden" },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingLeft: 62,
  },
  body: {
    color: colors.inkMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
});

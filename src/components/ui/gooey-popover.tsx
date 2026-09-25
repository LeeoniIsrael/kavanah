import {
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@/design/appearance";
// Adapted from Reacticx's Gooey Popover (MIT), customized for Kavanah.
// See docs/third-party-notices.md for the upstream copyright and license.
import {
  Blur,
  Canvas,
  ColorMatrix,
  Group,
  Paint,
  RoundedRect,
} from "@shopify/react-native-skia";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Dimensions,
  Text as NativeText,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type SharedValue,
  type WithSpringConfig,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { softHaptic } from "@/services/haptics";

type PopoverSide = "top" | "bottom";
type PopoverAlign = "start" | "center" | "end";
type Size = { width: number; height: number };
type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};
type Geometry = {
  layerWidth: number;
  layerHeight: number;
  left: number;
  top: number;
  trigger: Rect;
  panel: Rect;
};

type GooeyPopoverRootProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  openSpringConfig?: WithSpringConfig;
  closeSpringConfig?: WithSpringConfig;
  onOpenChange?: (open: boolean) => void;
  side?: PopoverSide;
  align?: PopoverAlign;
  sideOffset?: number;
  panelRadius?: number;
  gooStrength?: number;
  color?: string;
  dismissOnOutsidePress?: boolean;
  style?: StyleProp<ViewStyle>;
};

type GooeyPopoverTriggerProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressScale?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
};

type GooeyPopoverContentProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  progress: SharedValue<number>;
  side: PopoverSide;
  align: PopoverAlign;
  gap: number;
  panelRadius: number;
  gooStrength: number;
  color: string;
  dismissOnOutsidePress: boolean;
  triggerSize: Size;
  setTriggerSize: (size: Size) => void;
  triggerScale: SharedValue<number>;
  reduceMotion: boolean;
};

const OPEN_SPRING: WithSpringConfig = {
  stiffness: 150,
  damping: 19,
  mass: 0.42,
};
const CLOSE_SPRING: WithSpringConfig = {
  stiffness: 180,
  damping: 22,
  mass: 0.38,
};
const PRESS_IN_SPRING: WithSpringConfig = {
  stiffness: 420,
  damping: 28,
  mass: 0.48,
};
const PRESS_OUT_SPRING: WithSpringConfig = {
  stiffness: 280,
  damping: 18,
  mass: 0.48,
};
const GOO_MATRIX = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 22, -11,
];
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_PANEL_WIDTH = Math.min(SCREEN_WIDTH - 48, 304);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error(`${component} must be rendered inside GooeyPopover.Root.`);
  }
  return context;
}

function buildGeometry(
  trigger: Size,
  content: Size,
  side: PopoverSide,
  align: PopoverAlign,
  gap: number,
  panelRadius: number,
): Geometry {
  const panelY =
    side === "bottom" ? trigger.height + gap : -(gap + content.height);
  const panelX =
    align === "start"
      ? 0
      : align === "end"
        ? trigger.width - content.width
        : (trigger.width - content.width) / 2;
  const left = Math.min(0, panelX);
  const top = Math.min(0, panelY);

  return {
    layerWidth: Math.max(trigger.width, panelX + content.width) - left,
    layerHeight: Math.max(trigger.height, panelY + content.height) - top,
    left,
    top,
    trigger: {
      x: -left,
      y: -top,
      width: trigger.width,
      height: trigger.height,
      radius: Math.min(trigger.height / 2, panelRadius),
    },
    panel: {
      x: panelX - left,
      y: panelY - top,
      width: content.width,
      height: content.height,
      radius: panelRadius,
    },
  };
}

function interpolateRect(geometry: Geometry, progress: number): Rect {
  "worklet";
  const start = geometry.trigger;
  const end = geometry.panel;
  const mix = (a: number, b: number) => a + (b - a) * progress;
  return {
    x: mix(start.x, end.x),
    y: mix(start.y, end.y),
    width: mix(start.width, end.width),
    height: mix(start.height, end.height),
    radius: mix(start.radius, end.radius),
  };
}

function Root({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "center",
  sideOffset = 12,
  panelRadius = 20,
  gooStrength = 8,
  color,
  dismissOnOutsidePress = true,
  closeSpringConfig = CLOSE_SPRING,
  openSpringConfig = OPEN_SPRING,
  style,
}: GooeyPopoverRootProps): React.JSX.Element {
  const colors = useThemeColors();
  color ??= colors.mineral;
  const styles = useThemedStyles(makestyles);

  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(defaultOpen ? 1 : 0);
  const triggerScale = useSharedValue(1);
  const [triggerSize, setTriggerSize] = useState<Size>({ width: 0, height: 0 });

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = open ? 1 : 0;
      return;
    }
    progress.value = withSpring(
      open ? 1 : 0,
      open ? openSpringConfig : closeSpringConfig,
    );
  }, [closeSpringConfig, open, openSpringConfig, progress, reduceMotion]);

  const value = useMemo<PopoverContextValue>(
    () => ({
      open,
      setOpen,
      toggle,
      progress,
      side,
      align,
      gap: sideOffset,
      panelRadius,
      gooStrength,
      color,
      dismissOnOutsidePress,
      triggerSize,
      setTriggerSize,
      triggerScale,
      reduceMotion,
    }),
    [
      align,
      color,
      dismissOnOutsidePress,
      gooStrength,
      open,
      panelRadius,
      progress,
      reduceMotion,
      setOpen,
      side,
      sideOffset,
      toggle,
      triggerScale,
      triggerSize,
    ],
  );

  return (
    <PopoverContext.Provider value={value}>
      <View style={[styles.root, style]}>
        {open && dismissOnOutsidePress ? (
          <Pressable
            accessibilityLabel="Close popover"
            accessibilityRole="button"
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />
        ) : null}
        {children}
      </View>
    </PopoverContext.Provider>
  );
}

function Trigger({
  children,
  style,
  pressScale = 0.94,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
}: GooeyPopoverTriggerProps): React.JSX.Element {
  const styles = useThemedStyles(makestyles);

  const { toggle, open, setTriggerSize, triggerScale, reduceMotion } =
    usePopoverContext("GooeyPopover.Trigger");
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
  }));
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setTriggerSize({ width, height });
    },
    [setTriggerSize],
  );

  return (
    <AnimatedPressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, expanded: open }}
      disabled={disabled}
      onLayout={onLayout}
      onPress={() => {
        void softHaptic();
        toggle();
      }}
      onPressIn={() => {
        if (!reduceMotion) {
          triggerScale.value = withSpring(pressScale, PRESS_IN_SPRING);
        }
      }}
      onPressOut={() => {
        triggerScale.value = reduceMotion ? 1 : withSpring(1, PRESS_OUT_SPRING);
      }}
      style={[styles.trigger, style, animatedStyle]}
    >
      {typeof children === "string" ? (
        <NativeText style={styles.triggerText}>{children}</NativeText>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

function Content({
  children,
  style,
  textStyle,
}: GooeyPopoverContentProps): React.JSX.Element {
  const styles = useThemedStyles(makestyles);

  const {
    progress,
    side,
    align,
    gap,
    panelRadius,
    gooStrength,
    color,
    open,
    triggerSize,
    triggerScale,
  } = usePopoverContext("GooeyPopover.Content");
  const [contentSize, setContentSize] = useState<Size>({ width: 0, height: 0 });
  const geometry = useMemo(
    () =>
      buildGeometry(triggerSize, contentSize, side, align, gap, panelRadius),
    [align, contentSize, gap, panelRadius, side, triggerSize],
  );
  const ready = geometry.layerWidth > 0 && contentSize.width > 0;
  const animatedRect = useDerivedValue(() =>
    interpolateRect(geometry, progress.value),
  );
  const triggerCenterX = geometry.trigger.x + geometry.trigger.width / 2;
  const triggerCenterY = geometry.trigger.y + geometry.trigger.height / 2;
  const triggerX = useDerivedValue(
    () => triggerCenterX - (geometry.trigger.width * triggerScale.value) / 2,
  );
  const triggerY = useDerivedValue(
    () => triggerCenterY - (geometry.trigger.height * triggerScale.value) / 2,
  );
  const triggerWidth = useDerivedValue(
    () => geometry.trigger.width * triggerScale.value,
  );
  const triggerHeight = useDerivedValue(
    () => geometry.trigger.height * triggerScale.value,
  );
  const triggerRadius = useDerivedValue(
    () => geometry.trigger.radius * triggerScale.value,
  );
  const rectX = useDerivedValue(() => animatedRect.value.x);
  const rectY = useDerivedValue(() => animatedRect.value.y);
  const rectWidth = useDerivedValue(() => animatedRect.value.width);
  const rectHeight = useDerivedValue(() => animatedRect.value.height);
  const rectRadius = useDerivedValue(() => animatedRect.value.radius);
  const clipStyle = useAnimatedStyle(() => {
    const rect = interpolateRect(geometry, progress.value);
    return {
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
      borderRadius: rect.radius,
    };
  }, [geometry]);
  const contentStyle = useAnimatedStyle(() => {
    const rect = interpolateRect(geometry, progress.value);
    return {
      left: geometry.panel.x - rect.x,
      top: geometry.panel.y - rect.y,
      opacity: interpolate(progress.value, [0, 0.48, 1], [0, 0.18, 1]),
    };
  }, [geometry]);
  const body =
    typeof children === "string" ? (
      <NativeText style={[styles.contentText, textStyle]}>
        {children}
      </NativeText>
    ) : (
      children
    );

  return (
    <>
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={styles.measure}
      >
        <View
          style={[styles.panel, style]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setContentSize((current) =>
              Math.abs(current.width - width) < 0.5 &&
              Math.abs(current.height - height) < 0.5
                ? current
                : { width, height },
            );
          }}
        >
          {body}
        </View>
      </View>

      {ready ? (
        <Canvas
          pointerEvents="none"
          style={[
            styles.gooLayer,
            {
              left: geometry.left,
              top: geometry.top,
              width: geometry.layerWidth,
              height: geometry.layerHeight,
            },
          ]}
        >
          <Group
            layer={
              <Paint>
                <Blur blur={gooStrength} />
                <ColorMatrix matrix={GOO_MATRIX} />
              </Paint>
            }
          >
            <RoundedRect
              x={triggerX}
              y={triggerY}
              width={triggerWidth}
              height={triggerHeight}
              r={triggerRadius}
              color={color}
            />
            <RoundedRect
              x={rectX}
              y={rectY}
              width={rectWidth}
              height={rectHeight}
              r={rectRadius}
              color={color}
            />
          </Group>
        </Canvas>
      ) : null}

      <View
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? "auto" : "no-hide-descendants"}
        pointerEvents={open ? "box-none" : "none"}
        style={[
          styles.contentLayer,
          {
            left: geometry.left,
            top: geometry.top,
            width: geometry.layerWidth,
            height: geometry.layerHeight,
          },
        ]}
      >
        <Animated.View style={[styles.clip, clipStyle]}>
          <Animated.View style={[styles.panel, contentStyle, style]}>
            {body}
          </Animated.View>
        </Animated.View>
      </View>
    </>
  );
}

type GooeyInfoPopoverProps = {
  title: string;
  body: string;
  trigger: ReactNode;
  accessibilityLabel: string;
  side?: PopoverSide;
  align?: PopoverAlign;
  color?: string;
  triggerStyle?: StyleProp<ViewStyle>;
};

function GooeyInfoPopover({
  title,
  body,
  trigger,
  accessibilityLabel,
  side = "bottom",
  align = "center",
  color,
  triggerStyle,
}: GooeyInfoPopoverProps): React.JSX.Element {
  const colors = useThemeColors();
  color ??= colors.mineral;
  const styles = useThemedStyles(makestyles);

  return (
    <Root side={side} align={align} color={color} gooStrength={7}>
      <Trigger
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens a short explanation"
        style={triggerStyle}
      >
        {trigger}
      </Trigger>
      <Content style={styles.infoPanel}>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.infoBody}>{body}</Text>
        </View>
      </Content>
    </Root>
  );
}

const GooeyPopover = { Root, Trigger, Content };

const makestyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { position: "relative" },
    backdrop: {
      position: "absolute",
      left: -SCREEN_WIDTH,
      top: -SCREEN_HEIGHT,
      width: SCREEN_WIDTH * 3,
      height: SCREEN_HEIGHT * 3,
      zIndex: 20,
    },
    trigger: { zIndex: 1 },
    triggerText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
    // Keep the goo behind the trigger content. The trigger is intentionally
    // visible while it morphs so labels and icons do not disappear beneath the
    // animated canvas.
    gooLayer: { position: "absolute", zIndex: 0 },
    contentLayer: { position: "absolute", zIndex: 30 },
    clip: { position: "absolute", overflow: "hidden" },
    panel: {
      position: "absolute",
      maxWidth: MAX_PANEL_WIDTH,
      padding: 16,
    },
    contentText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
    measure: {
      position: "absolute",
      left: 0,
      top: 0,
      opacity: 0,
      zIndex: -2,
    },
    infoPanel: { width: 272, padding: 18 },
    infoContent: { gap: 5 },
    infoTitle: {
      color: colors.ink,
      fontFamily: "Manrope_700Bold",
      fontSize: 15,
      lineHeight: 20,
    },
    infoBody: {
      color: colors.inkMuted,
      fontFamily: "Manrope_400Regular",
      fontSize: 13,
      lineHeight: 19,
    },
  });

export { GooeyInfoPopover, GooeyPopover };
export type {
  GooeyInfoPopoverProps,
  GooeyPopoverContentProps,
  GooeyPopoverRootProps,
  GooeyPopoverTriggerProps,
  PopoverAlign,
  PopoverSide,
};

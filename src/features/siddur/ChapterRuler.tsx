/* eslint-disable react-hooks/refs -- PanResponder reads these refs only in touch callbacks. */
import { useEffect, useRef, useState } from "react";
import { PanResponder, View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { tapHaptic } from "@/services/haptics";
import type { SiddurNode } from "./model";

const TICK_STEP = 12;
const VISIBLE_TICKS = 43;

function RulerTick({
  value,
  total,
  center,
  cursor,
  colors,
}: {
  value: number;
  total: number;
  center: number;
  cursor: SharedValue<number>;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(value - cursor.value);
    return {
      transform: [{ translateX: center + (value - cursor.value) * TICK_STEP }],
      height: interpolate(
        distance,
        [0, 0.5, 1.5, 4, 10],
        [35, 31, 23, 15, 9],
        Extrapolation.CLAMP,
      ),
      width: interpolate(distance, [0, 1], [2.5, 1], Extrapolation.CLAMP),
      opacity: interpolate(
        distance,
        [0, 2, 10, 18],
        [1, 0.9, 0.62, 0.22],
        Extrapolation.CLAMP,
      ),
      backgroundColor: interpolateColor(
        distance,
        [0, 2, 8],
        [colors.blue, colors.inkMuted, colors.hairlineStrong],
      ),
    };
  });
  if (value < 0 || value >= total) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", left: 0, bottom: 0, borderRadius: 2 },
        style,
      ]}
    />
  );
}

export function ChapterRuler({
  sections,
  index,
  onCommit,
}: {
  sections: SiddurNode[];
  index: number;
  onCommit: (index: number) => void;
}) {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(windowWidth - 48);
  const [target, setTarget] = useState(index);
  const [active, setActive] = useState(false);
  const cursor = useSharedValue(index);
  const current = useRef(index);
  const start = useRef(index);
  const total = useRef(sections.length);
  const callback = useRef(onCommit);
  const lastHaptic = useRef(0);

  useEffect(() => {
    if (!active) {
      current.current = index;
      cursor.value = reduceMotion
        ? index
        : withTiming(index, { duration: 160 });
    }
  }, [index, active, cursor, reduceMotion]);
  useEffect(() => {
    total.current = sections.length;
    callback.current = onCommit;
  }, [sections.length, onCommit]);

  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = current.current;
        setTarget(current.current);
        setActive(true);
      },
      onPanResponderMove: (_, gesture) => {
        const value = Math.max(
          0,
          Math.min(total.current - 1, start.current - gesture.dx / TICK_STEP),
        );
        cursor.value = value;
        const next = Math.round(value);
        if (next !== current.current) {
          current.current = next;
          setTarget(next);
          const now = Date.now();
          if (now - lastHaptic.current > 45) {
            lastHaptic.current = now;
            void tapHaptic();
          }
        }
      },
      onPanResponderRelease: () => {
        const exact = current.current;
        cursor.value = reduceMotion
          ? exact
          : withSpring(exact, { damping: 22, stiffness: 280 });
        setActive(false);
        callback.current(exact);
      },
      onPanResponderTerminate: () => {
        cursor.value = start.current;
        current.current = start.current;
        setActive(false);
        setTarget(start.current);
      },
    }),
  );
  if (!sections.length) return null;
  const shownTarget = active ? target : index;
  const first = Math.max(
    0,
    Math.min(
      sections.length - VISIBLE_TICKS,
      shownTarget - Math.floor(VISIBLE_TICKS / 2),
    ),
  );

  return (
    <View
      accessibilityLabel="Chapter ruler. Drag to choose a section"
      style={{
        paddingTop: 6,
        paddingBottom: 2,
        backgroundColor: colors.parchment,
      }}
      {...pan.panHandlers}
    >
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ height: 42, overflow: "hidden" }}
      >
        {Array.from(
          { length: Math.min(sections.length, VISIBLE_TICKS) },
          (_, i) => first + i,
        ).map((value) => (
          <RulerTick
            key={value}
            value={value}
            total={sections.length}
            center={width / 2}
            cursor={cursor}
            colors={colors}
          />
        ))}
      </View>
      <Text
        numberOfLines={1}
        style={{
          color: active ? colors.ink : colors.inkMuted,
          textAlign: "center",
          fontSize: 12,
          marginTop: 2,
        }}
      >
        {active
          ? sections[shownTarget]?.titleEn
          : `Section ${shownTarget + 1} of ${sections.length}`}
      </Text>
    </View>
  );
}

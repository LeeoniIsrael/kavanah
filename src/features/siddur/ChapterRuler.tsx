/* eslint-disable react-hooks/refs -- PanResponder callbacks read these refs only during touch events. */
import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import type { SiddurNode } from "./model";
import { rulerTarget } from "./navigation";
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
  const [target, setTarget] = useState(index);
  const [active, setActive] = useState(false);
  const [labelFade] = useState(() => new Animated.Value(1));
  const current = useRef(index);
  const start = useRef(index);
  const total = useRef(sections.length);
  const callback = useRef(onCommit);
  useEffect(() => {
    current.current = index;
  }, [index, active]);
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
        setActive(true);
      },
      onPanResponderMove: (_, g) => {
        const next = rulerTarget(start.current, g.dx, total.current);
        if (next !== current.current) {
          current.current = next;
          setTarget(next);
        }
      },
      onPanResponderRelease: () => {
        const exact = current.current;
        setActive(false);
        callback.current(exact);
      },
      onPanResponderTerminate: () => {
        setActive(false);
        setTarget(index);
      },
    }),
  );
  const shownTarget = active ? target : index;
  useEffect(() => {
    labelFade.setValue(0);
    Animated.timing(labelFade, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }, [shownTarget, labelFade]);
  if (!sections.length) return null;
  const progress = (shownTarget / Math.max(1, sections.length - 1)) * 100;
  return (
    <View
      accessibilityLabel="Chapter ruler. Drag to choose a section"
      style={{
        paddingHorizontal: 22,
        paddingTop: 10,
        paddingBottom: 13,
        backgroundColor: colors.vellum,
        borderTopWidth: 1,
        borderColor: colors.hairline,
      }}
      {...pan.panHandlers}
    >
      <Animated.View
        style={{
          height: 29,
          alignItems: "center",
          opacity: labelFade,
          transform: [
            {
              translateY: labelFade.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 0],
              }),
            },
          ],
        }}
      >
        <Text
          numberOfLines={1}
          style={{ color: colors.ink, fontWeight: "600" }}
        >
          {sections[shownTarget]?.titleEn}
        </Text>
      </Animated.View>
      <View
        style={{
          height: 25,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          overflow: "hidden",
          transform: [{ scale: active ? 1.08 : 1 }],
        }}
      >
        <LinearGradient
          pointerEvents="none"
          colors={
            active
              ? [colors.vellum, colors.blueSoft, colors.blueSoft, colors.vellum]
              : [colors.vellum, colors.mineral, colors.mineral, colors.vellum]
          }
          locations={[0, 0.3, 0.7, 1]}
          style={{ position: "absolute", left: 0, right: 0, height: 25 }}
        />
        {Array.from({ length: 29 }, (_, i) => {
          const n = shownTarget + i - 14;
          const distance = Math.abs(i - 14);
          return (
            <View
              key={i}
              style={{
                width: i === 14 ? 2 : 1,
                height: i === 14 ? 23 : i % 5 === 0 ? 14 : 8,
                backgroundColor:
                  i === 14
                    ? colors.blue
                    : distance <= 3
                      ? colors.inkMuted
                      : distance <= 7
                        ? colors.mineralDark
                        : colors.hairlineStrong,
                opacity: n < 0 || n >= sections.length ? 0.15 : 1,
              }}
            />
          );
        })}
      </View>
      <View
        style={{
          height: 3,
          marginTop: 5,
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: colors.mineral,
        }}
      >
        <LinearGradient
          colors={[colors.blueSoft, colors.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: "100%", width: `${progress}%` }}
        />
      </View>
      <Text
        style={{ textAlign: "center", color: colors.inkMuted, fontSize: 13, marginTop: 5 }}
      >
        Section {shownTarget + 1} of {sections.length}
      </Text>
    </View>
  );
}

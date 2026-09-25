import { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Quote,
  X,
} from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
import { fonts, motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type GuidedPrayerToken = {
  id: string;
  hebrew: string;
  transliteration: string;
  translation: string;
};
type Props = {
  prayerTitle: string;
  tokens: GuidedPrayerToken[];
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  onQuote: (token: GuidedPrayerToken) => void;
};
export function GuidedPrayer({
  prayerTitle,
  tokens,
  visible,
  onClose,
  onComplete,
  onQuote,
}: Props): React.JSX.Element | null {
  const colors = useThemeColors(),
    insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [reveal] = useState(() => new Animated.Value(1));
  const scroll = useRef<ScrollView>(null);
  const reduceMotion = useReducedMotion();
  const safeIndex = Math.min(index, Math.max(tokens.length - 1, 0));
  const token = tokens[safeIndex],
    isLast = safeIndex === tokens.length - 1;
  useEffect(() => {
    // A newly opened prayer always starts at its first source passage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible) setIndex(0);
  }, [prayerTitle, visible]);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    reveal.setValue(reduceMotion ? 1 : 0);
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: reduceMotion ? 0 : motion.stateMs,
      easing: Easing.bezier(...motion.standard),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, reveal, safeIndex, visible]);
  if (!visible || !token) return null;
  return (
    <View
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 40,
          paddingTop: insets.top,
          backgroundColor: colors.parchment,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 24,
          paddingVertical: 12,
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Close guided reading"
          onPress={onClose}
        >
          <X size={20} color={colors.ink} />
        </Button>
        <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
          <Text variant="caption" style={{ color: colors.inkMuted }}>
            Guided reading
          </Text>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 17,
              lineHeight: 24,
              textAlign: "center",
              color: colors.ink,
            }}
          >
            {prayerTitle}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>
      {tokens.length > 1 ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: 12, gap: 8 }}>
          <Text variant="caption" style={{ color: colors.inkMuted }}>
            Passage {safeIndex + 1} of {tokens.length}
          </Text>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 1,
              max: tokens.length,
              now: safeIndex + 1,
            }}
            accessibilityLabel="Reading position"
            style={{
              height: 3,
              borderRadius: 2,
              backgroundColor: colors.mineral,
            }}
          >
            <View
              style={{
                height: 3,
                borderRadius: 2,
                width: `${((safeIndex + 1) / tokens.length) * 100}%`,
                backgroundColor: colors.blue,
              }}
            />
          </View>
        </View>
      ) : null}
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 28,
        }}
        showsVerticalScrollIndicator
      >
        <Animated.View
          style={{ opacity: reveal, gap: 28 }}
          accessibilityLiveRegion="polite"
        >
          {token.hebrew ? (
            <Text
              selectable
              style={{
                fontFamily: fonts.hebrew,
                fontSize: 30,
                lineHeight: 49,
                fontWeight: "400",
                writingDirection: "rtl",
                textAlign: "right",
                color: colors.ink,
              }}
            >
              {token.hebrew}
            </Text>
          ) : null}
          {token.transliteration ? (
            <View
              style={{
                padding: 20,
                borderRadius: 26,
                backgroundColor: colors.vellum,
                gap: 10,
              }}
            >
              <Text variant="caption" style={{ color: colors.inkMuted }}>
                Pronunciation
              </Text>
              <Text
                selectable
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 18,
                  lineHeight: 29,
                  color: colors.ink,
                }}
              >
                {token.transliteration}
              </Text>
            </View>
          ) : null}
          {token.translation ? (
            <View style={{ gap: 10 }}>
              <Text variant="caption" style={{ color: colors.inkMuted }}>
                Meaning
              </Text>
              <Text
                selectable
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 17,
                  lineHeight: 28,
                  color: colors.ink,
                }}
              >
                {token.translation}
              </Text>
            </View>
          ) : null}
          <Button
            variant="ghost"
            size="content"
            onPress={() => onQuote(token)}
            style={{
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 10,
            }}
          >
            <Quote size={20} color={colors.blue} />
            <Text style={{ color: colors.blue }}>Choose a quote</Text>
          </Button>
        </Animated.View>
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.hairline,
          backgroundColor: colors.parchment,
        }}
      >
        {safeIndex > 0 ? (
          <Button
            variant="secondary"
            size="icon"
            accessibilityLabel="Previous passage"
            haptic="selection"
            onPress={() => setIndex((value) => Math.max(value - 1, 0))}
          >
            <ChevronLeft size={20} color={colors.ink} />
          </Button>
        ) : null}
        <Button
          style={{ flex: 1, minHeight: 52 }}
          accessibilityLabel={isLast ? "Finish guided reading" : "Next passage"}
          haptic={isLast ? "none" : "selection"}
          onPress={() =>
            isLast
              ? onComplete()
              : setIndex((value) => Math.min(value + 1, tokens.length - 1))
          }
        >
          <Text style={{ color: colors.onAccent }}>
            {isLast ? "Finish prayer" : "Next passage"}
          </Text>
          {isLast ? (
            <Check size={20} color={colors.onAccent} />
          ) : (
            <ChevronRight size={20} color={colors.onAccent} />
          )}
        </Button>
      </View>
    </View>
  );
}

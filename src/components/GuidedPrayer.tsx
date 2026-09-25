import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Quote,
  X,
} from "@/components/ui/icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { motion } from "@/design/theme";
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
  const colors = useThemeColors();

  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const reveal = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();
  const safeIndex = Math.min(index, Math.max(tokens.length - 1, 0));
  const token = tokens[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === tokens.length - 1;

  useEffect(() => {
    if (visible) setIndex(0);
  }, [prayerTitle, visible]);

  useEffect(() => {
    reveal.setValue(reduceMotion ? 1 : 0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: reduceMotion ? 0 : motion.stateMs,
      easing: Easing.bezier(...motion.standard),
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, reveal, safeIndex]);

  if (!visible || !token) return null;

  const goBack = () => setIndex((current) => Math.max(current - 1, 0));
  const goForward = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((current) => Math.min(current + 1, tokens.length - 1));
  };

  return (
    <View
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      accessibilityViewIsModal
      className="absolute left-0 right-0 top-0 bottom-0 z-[40] bg-background"
    >
      <View className="min-h-[76px] px-6 flex-row items-center gap-3">
        <Button
          variant="ghost"
          size="content"
          accessibilityLabel="Close guided reading"
          accessibilityRole="button"
          haptic="selection"
          onPress={onClose}
          pressedScale={0.96}
          className="w-11 h-11 rounded-md items-center justify-center border border-hairlineStrong bg-mineral"
        >
          <X size={20} color={colors.ink} />
        </Button>
        <View className="flex-1 items-center gap-0.5">
          <Text className="text-[11px] leading-[15px] font-medium text-muted-foreground font-label">
            Guided reading
          </Text>
          <Text
            numberOfLines={1}
            className="text-[14px] leading-[18px] font-semibold max-w-full text-foreground font-heading"
          >
            {prayerTitle}
          </Text>
        </View>
        <View className="w-11" />
      </View>

      <View
        accessibilityLabel={`${Math.round(((safeIndex + 1) / tokens.length) * 100)} percent complete`}
        accessibilityRole="progressbar"
        className="mx-6 flex-row gap-1.5"
      >
        {tokens.map((item, itemIndex) => (
          <View
            key={item.id}
            className={cn(
              "h-[3px] flex-1 rounded-full",
              itemIndex <= safeIndex ? "bg-primary" : "bg-mineral",
            )}
          />
        ))}
      </View>

      <ScrollView
        contentContainerClassName="grow justify-center px-6 py-10"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          accessibilityLiveRegion="polite"
          className="gap-8"
          style={[
            {
              opacity: reveal,
              transform: [
                {
                  translateY: reveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {token.hebrew ? (
            <View className="items-center gap-3">
              <View className="self-center rounded-full border border-hairlineStrong px-3 py-1">
                <Text className="text-[11px] leading-[15px] font-medium text-muted-foreground font-label">
                  Line {safeIndex + 1} of {tokens.length}
                </Text>
              </View>
              <Text
                selectable
                className="font-hebrew-heading font-semibold text-center text-[38px] leading-[58px] text-foreground"
                style={styles.hebrew}
              >
                {token.hebrew}
              </Text>
            </View>
          ) : null}
          {token.transliteration ? (
            <View className="gap-3 rounded-lg bg-card px-5 py-5">
              <Text className="text-[12px] leading-[16px] font-semibold text-primary font-label">
                Read aloud
              </Text>
              <Text
                variant="section"
                selectable
                className="text-[22px] leading-[31px] text-foreground"
              >
                {token.transliteration}
              </Text>
            </View>
          ) : null}
          {token.translation ? (
            <View className="gap-2 border-l-2 border-l-hairlineStrong pl-4">
              <Text className="text-[12px] leading-[16px] font-semibold text-muted-foreground font-label">
                Hold the meaning
              </Text>
              <Text
                variant="body"
                selectable
                className="text-[18px] leading-[27px] text-foreground"
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
              minHeight: 48,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.25)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Quote size={20} color={colors.ink} />
            <Text style={{ color: colors.white }}>
              Choose a quote from this line
            </Text>
          </Button>
        </Animated.View>
      </ScrollView>

      <View className="min-h-[88px] px-6 pt-3 pb-4 flex-row items-center gap-3 border-t border-t-hairline">
        <Button
          variant="outline"
          size="content"
          accessibilityLabel="Previous line"
          accessibilityRole="button"
          disabled={isFirst}
          haptic="selection"
          onPress={goBack}
          pressedScale={0.96}
          className={cn(
            "w-12 h-12 rounded-md items-center justify-center border border-hairlineStrong bg-mineral",
            isFirst && "opacity-[0.28]",
          )}
        >
          <ChevronLeft size={16} color={colors.ink} />
        </Button>
        <Button
          variant="default"
          size="content"
          accessibilityLabel={isLast ? "Finish guided reading" : "Next line"}
          accessibilityRole="button"
          haptic={isLast ? "none" : "selection"}
          onPress={goForward}
          pressedScale={0.98}
          className="flex-1 min-h-12 rounded-md flex-row items-center justify-center gap-2 bg-primary"
        >
          <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-primary-foreground font-heading">
            {isLast ? "Finish" : "Next line"}
          </Text>
          {isLast ? (
            <Check size={20} color={colors.onAccent} />
          ) : (
            <ChevronRight size={16} color={colors.onAccent} />
          )}
        </Button>
      </View>
    </View>
  );
}

// Native text direction and platform-only values cannot be expressed as layout utilities.
const styles = {
  hebrew: {
    writingDirection: "rtl",
  },
} as const;

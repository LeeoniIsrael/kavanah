import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { colors, motion } from "@/design/theme";
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
};

export function GuidedPrayer({
  prayerTitle,
  tokens,
  visible,
  onClose,
}: Props): React.JSX.Element | null {
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
      onClose();
      return;
    }
    setIndex((current) => Math.min(current + 1, tokens.length - 1));
  };

  return (
    <View
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      accessibilityViewIsModal
      className="absolute left-0 right-0 top-0 bottom-0 z-[40] bg-card"
    >
      <View className="min-h-[72px] px-6 flex-row items-center gap-3">
        <Button
          variant="ghost"
          size="content"
          accessibilityLabel="Close guided reading"
          accessibilityRole="button"
          haptic="selection"
          onPress={onClose}
          pressedScale={0.94}
          className="w-11 h-11 rounded-md items-center justify-center bg-glass border border-hairline shadow-card"
        >
          <X size={18} color={colors.ink} />
        </Button>
        <View className="flex-1 items-center gap-[2px]">
          <Text
            numberOfLines={1}
            className="text-[12px] leading-[16px] font-medium tracking-normal max-w-full text-foreground font-label"
          >
            {prayerTitle}
          </Text>
          <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-inkFaint font-label">
            {safeIndex + 1} of {tokens.length}
          </Text>
        </View>
        <View className="w-11" />
      </View>

      <View
        accessibilityLabel={`${Math.round(((safeIndex + 1) / tokens.length) * 100)} percent complete`}
        accessibilityRole="progressbar"
        className="h-[2px] mx-6 bg-hairline"
      >
        <View
          className="h-[2px] bg-primary"
          style={[{ width: `${((safeIndex + 1) / tokens.length) * 100}%` }]}
        />
      </View>

      <ScrollView
        contentContainerClassName="grow justify-center px-6 py-12"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          accessibilityLiveRegion="polite"
          className="gap-12"
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
            <Text
              selectable
              className="font-hebrew-heading font-semibold text-right text-[36px] leading-[55px] text-foreground"
              style={styles.hebrew}
            >
              {token.hebrew}
            </Text>
          ) : null}
          {token.transliteration ? (
            <View className="gap-2">
              <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-inkFaint font-label">
                Say it
              </Text>
              <Text
                variant="section"
                selectable
                className="text-[20px] leading-[29px] text-foreground"
              >
                {token.transliteration}
              </Text>
            </View>
          ) : null}
          {token.translation ? (
            <View className="gap-2">
              <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-inkFaint font-label">
                Meaning
              </Text>
              <Text
                variant="body"
                selectable
                className="text-[18px] leading-[27px] text-muted-foreground"
              >
                {token.translation}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View className="min-h-[84px] px-6 pt-2 pb-4 flex-row items-center gap-3 border-t border-t-hairline bg-glass">
        <Button
          variant="outline"
          size="content"
          accessibilityLabel="Previous line"
          accessibilityRole="button"
          disabled={isFirst}
          haptic="selection"
          onPress={goBack}
          pressedScale={0.94}
          className={cn(
            "w-11 h-11 rounded-md items-center justify-center border border-hairlineStrong bg-card",
            isFirst && "opacity-[0.28]",
          )}
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Button>
        <Button
          variant="default"
          size="content"
          accessibilityLabel={isLast ? "Finish guided reading" : "Next line"}
          accessibilityRole="button"
          haptic={isLast ? "success" : "selection"}
          onPress={goForward}
          pressedScale={0.98}
          className="flex-1 min-h-12 rounded-md flex-row items-center justify-center gap-2 bg-primary shadow-card"
        >
          <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-white font-heading">
            {isLast ? "Done" : "Next"}
          </Text>
          {isLast ? (
            <Check size={18} color={colors.white} />
          ) : (
            <ChevronRight size={18} color={colors.white} />
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

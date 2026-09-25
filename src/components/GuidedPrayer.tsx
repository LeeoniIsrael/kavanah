import { useEffect, useRef, useState } from "react";
import { Animated, Easing, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Check,
  Bookmark,
  BookmarkCheck,
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
  onDetails: () => void;
  onBookmark: () => void;
  bookmarked: boolean;
  reviewPending: boolean;
  onQuote: (token: GuidedPrayerToken) => void;
};
export function GuidedPrayer({
  prayerTitle,
  tokens,
  visible,
  onClose,
  onComplete,
  onQuote,
  onDetails,
  onBookmark,
  bookmarked,
  reviewPending,
}: Props): React.JSX.Element | null {
  const colors = useThemeColors(),
    insets = useSafeAreaInsets();
  const [reveal] = useState(() => new Animated.Value(1));
  const scroll = useRef<FlatList<GuidedPrayerToken>>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    scroll.current?.scrollToOffset({ offset: 0, animated: false });
    reveal.setValue(reduceMotion ? 1 : 0);
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: reduceMotion ? 0 : motion.stateMs,
      easing: Easing.bezier(...motion.standard),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, reveal, prayerTitle, visible]);
  if (!visible || !tokens.length) return null;
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
          accessibilityLabel="Close without logging a prayer"
          onPress={onClose}
        >
          <X size={20} color={colors.ink} />
        </Button>
        <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
          <Text variant="caption" style={{ color: colors.inkMuted }}>
            Prayer
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
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={
            bookmarked ? "Remove bookmark" : "Bookmark prayer"
          }
          onPress={onBookmark}
        >
          {bookmarked ? (
            <BookmarkCheck size={20} color={colors.blue} />
          ) : (
            <Bookmark size={20} color={colors.ink} />
          )}
        </Button>
      </View>
      <Button
        variant="ghost"
        size="content"
        onPress={onDetails}
        style={{ alignSelf: "center", minHeight: 44, marginBottom: 4 }}
      >
        <Text variant="caption" style={{ color: colors.inkMuted }}>
          {reviewPending
            ? "Text review pending · Source & options"
            : "Source & options"}
        </Text>
      </Button>
      <Animated.View style={{ flex: 1, opacity: reveal }}>
        <FlatList
          ref={scroll}
          data={tokens}
          keyExtractor={(item) => item.id}
          initialNumToRender={3}
          windowSize={5}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 28,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 36 }} />}
          renderItem={({ item: token }) => (
            <View style={{ gap: 24 }}>
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
            </View>
          )}
        />
      </Animated.View>
      <View
        style={{
          flexDirection: "column",
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
        <Text
          variant="caption"
          style={{ color: colors.inkMuted, textAlign: "center" }}
        >
          Finish saves this prayer. Closing won’t log it.
        </Text>
        <Button
          style={{ alignSelf: "stretch", minHeight: 52 }}
          accessibilityLabel="Finish prayer and save to activity"
          haptic="none"
          onPress={onComplete}
        >
          <Text style={{ color: colors.onAccent }}>Finish prayer</Text>
          <Check size={20} color={colors.onAccent} />
        </Button>
      </View>
    </View>
  );
}

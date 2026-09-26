import {
  PrayerConversation,
  PrayerExplanation,
} from "@/components/PrayerExplanation";
import type { ReadingGuide } from "@/data/prayerReadingGuide";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { InlineQuoteText } from "@/components/InlineQuoteText";
import { Check, Bookmark, BookmarkCheck, X } from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
import { fonts, motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { QuoteSource } from "@/store/socialStore";

export type GuidedPrayerToken = {
  id: string;
  hebrew: string;
  transliteration: string;
  translation: string;
  translationLanguage?: string;
};
type Props = {
  completionBlockedReason?: string | undefined;
  prayerTitle: string;
  guide?: ReadingGuide | undefined;
  scopeNote?: string | undefined;
  explanationContext?: string[] | undefined;
  language?: string;
  onGuideSource?: () => void;
  tokens: GuidedPrayerToken[];
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  onDetails: () => void;
  onBookmark: () => void;
  bookmarked: boolean;
  reviewPending: boolean;
  quoteSource?: Omit<QuoteSource, "language" | "text"> | undefined;
  onSaveQuote: (source: QuoteSource, start: number, end: number) => boolean;
};
export function GuidedPrayer({
  completionBlockedReason,
  prayerTitle,
  guide,
  scopeNote,
  explanationContext,
  language = "English",
  onGuideSource,
  tokens,
  visible,
  onClose,
  onComplete,
  quoteSource,
  onSaveQuote,
  onDetails,
  onBookmark,
  bookmarked,
  reviewPending,
}: Props): React.JSX.Element | null {
  const colors = useThemeColors(),
    insets = useSafeAreaInsets();
  const [reveal] = useState(() => new Animated.Value(1));
  const [activeQuoteField, setActiveQuoteField] = useState("");
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
    <PrayerConversation
      key={explanationContext?.[7] ?? prayerTitle}
      context={explanationContext ?? []}
      language={language}
      title={prayerTitle}
    >
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
            accessibilityLabel="Close without logging a prayer"
            onPress={onClose}
          >
            <X size={20} color={colors.ink} />
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
        {explanationContext ? (
          <View style={{ paddingHorizontal: 24 }}>
            <PrayerExplanation />
          </View>
        ) : null}
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
            ListHeaderComponent={
              <View style={{ gap: 16, paddingBottom: 24 }}>
                {quoteSource ? (
                  <Text
                    style={{
                      color: colors.inkMuted,
                      fontSize: 13,
                      lineHeight: 20,
                    }}
                  >
                    Tap the first word in the pronunciation or Hebrew, then tap
                    the last word.
                  </Text>
                ) : null}
                {guide?.before ? (
                  <View style={{ gap: 8 }}>
                    <Text
                      style={{ color: colors.blue, fontFamily: fonts.semibold }}
                    >
                      Before you say it
                    </Text>
                    <Text
                      style={{
                        color: colors.ink,
                        fontSize: 16,
                        lineHeight: 25,
                      }}
                    >
                      {guide.before}
                    </Text>
                  </View>
                ) : null}
                {scopeNote ? (
                  <Text
                    style={{
                      color: colors.inkMuted,
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                  >
                    {scopeNote}
                  </Text>
                ) : null}
              </View>
            }
            ListFooterComponent={
              guide?.after || guide?.source ? (
                <View style={{ gap: 10, paddingTop: 24 }}>
                  {guide.after ? (
                    <>
                      <Text
                        style={{
                          color: colors.blue,
                          fontFamily: fonts.semibold,
                        }}
                      >
                        After you say it
                      </Text>
                      <Text
                        style={{
                          color: colors.ink,
                          fontSize: 16,
                          lineHeight: 25,
                        }}
                      >
                        {guide.after}
                      </Text>
                    </>
                  ) : null}
                  {guide.source && onGuideSource ? (
                    <Button
                      variant="ghost"
                      size="content"
                      onPress={onGuideSource}
                      style={{ minHeight: 44, justifyContent: "flex-start" }}
                    >
                      <Text style={{ color: colors.blue }}>
                        Instructions & source
                      </Text>
                    </Button>
                  ) : null}
                </View>
              ) : null
            }
            ItemSeparatorComponent={() => <View style={{ height: 36 }} />}
            renderItem={({ item: token }) => (
              <View style={{ gap: 24 }}>
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
                      Say these words
                    </Text>
                    {quoteSource ? (
                      <InlineQuoteText
                        active={
                          activeQuoteField === `${token.id}:transliteration`
                        }
                        fieldId={`${token.id}:transliteration`}
                        onActivate={setActiveQuoteField}
                        onSave={onSaveQuote}
                        source={{
                          ...quoteSource,
                          text: token.transliteration,
                          language: "transliteration",
                        }}
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 25,
                          lineHeight: 39,
                          color: colors.ink,
                        }}
                      />
                    ) : (
                      <Text
                        selectable
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 25,
                          lineHeight: 39,
                          color: colors.ink,
                        }}
                      >
                        {token.transliteration}
                      </Text>
                    )}
                  </View>
                ) : null}
                {token.translation ? (
                  <View style={{ gap: 10 }}>
                    <Text variant="caption" style={{ color: colors.inkMuted }}>
                      Translation · {token.translationLanguage ?? language}
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
                {token.hebrew ? (
                  quoteSource ? (
                    <InlineQuoteText
                      active={activeQuoteField === `${token.id}:hebrew`}
                      fieldId={`${token.id}:hebrew`}
                      onActivate={setActiveQuoteField}
                      onSave={onSaveQuote}
                      source={{
                        ...quoteSource,
                        text: token.hebrew,
                        language: "he",
                      }}
                      style={{
                        fontFamily: fonts.hebrew,
                        fontSize: 25,
                        lineHeight: 40,
                        fontWeight: "400",
                        writingDirection: "rtl",
                        textAlign: "right",
                        color: colors.ink,
                      }}
                    />
                  ) : (
                    <Text
                      selectable
                      style={{
                        fontFamily: fonts.hebrew,
                        fontSize: 25,
                        lineHeight: 40,
                        fontWeight: "400",
                        writingDirection: "rtl",
                        textAlign: "right",
                        color: colors.ink,
                      }}
                    >
                      {token.hebrew}
                    </Text>
                  )
                ) : null}
                {explanationContext && tokens.length > 1 ? (
                  <PrayerExplanation
                    passage={
                      tokens.length > 1
                        ? token.translation || token.hebrew
                        : undefined
                    }
                  />
                ) : null}
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
            {completionBlockedReason ??
              "Finish saves this prayer. Closing won’t log it."}
          </Text>
          <Button
            style={{ alignSelf: "stretch", minHeight: 52 }}
            accessibilityLabel="Finish prayer and save to activity"
            haptic="none"
            disabled={Boolean(completionBlockedReason)}
            onPress={onComplete}
          >
            <Text style={{ color: colors.onAccent }}>Finish prayer</Text>
            <Check size={20} color={colors.onAccent} />
          </Button>
        </View>
      </View>
    </PrayerConversation>
  );
}

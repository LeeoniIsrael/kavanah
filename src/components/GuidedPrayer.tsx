import { Linking } from "react-native";
import type { PrayerToken } from "@/types/prayer";
import { prayerTokenStep } from "@/data/prayerSteps";
import {
  TefillinPreparation,
  type TefillinBlessingCustom,
} from "@/components/TefillinPreparation";
import {
  PrayerConversation,
  PrayerExplanation,
} from "@/components/PrayerExplanation";
import type { ReadingGuide } from "@/data/prayerReadingGuide";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  type FlatList,
  StyleSheet,
  View,
} from "react-native";
import Reanimated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { InlineQuoteText } from "@/components/InlineQuoteText";
import { Check, Bookmark, BookmarkCheck, X } from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
import { fonts, motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { QuoteSource } from "@/store/socialStore";

export type GuidedPrayerToken = PrayerToken & { translationLanguage?: string };
type Props = {
  practice?: "tefillin" | undefined;
  completionBlockedReason?: string | undefined;
  startedAt: number;
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
  practice,
  completionBlockedReason,
  startedAt,
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
  const [blessingCustom, setBlessingCustom] =
    useState<TefillinBlessingCustom>("compare");
  const [activeQuoteField, setActiveQuoteField] = useState("");
  const [clockTick, setClockTick] = useState(Date.now);
  const scroll = useRef<FlatList<GuidedPrayerToken>>(null);
  const reduceMotion = useReducedMotion();
  const scrollOffset = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const onReaderScroll = useAnimatedScrollHandler((event) => {
    scrollOffset.set(event.contentOffset.y);
  });
  const markerStyle = useAnimatedStyle(() => {
    const width = trackWidth.value;
    const viewport = viewportHeight.value;
    const content = contentHeight.value;
    const ready = width > 0 && viewport > 0 && content > 0;
    const thumb = Math.min(
      width,
      Math.max(24, (width * viewport) / Math.max(content, viewport, 1)),
    );
    const distance = Math.max(0, content - viewport);
    const progress =
      distance > 0
        ? Math.min(1, Math.max(0, scrollOffset.value / distance))
        : 0;
    return {
      opacity: ready ? 1 : 0,
      width: thumb,
      transform: [{ translateX: progress * (width - thumb) }],
    };
  });
  useEffect(() => {
    scrollOffset.set(0);
  }, [prayerTitle, visible, scrollOffset]);
  const elapsedSeconds = Math.max(
    0,
    Math.floor((clockTick - startedAt) / 1000),
  );
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedTime =
    elapsedHours > 0
      ? `${elapsedHours}:${String(elapsedMinutes % 60).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`
      : `${elapsedMinutes}:${String(elapsedSeconds % 60).padStart(2, "0")}`;
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => setClockTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [visible]);
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
            <Text
              variant="caption"
              accessibilityLabel={`Elapsed prayer time ${elapsedTime}`}
              style={{
                color: colors.inkMuted,
                fontVariant: ["tabular-nums"],
              }}
            >
              {elapsedTime} elapsed
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
              ? "Text & pronunciation review pending · Source & options"
              : "Source & options"}
          </Text>
        </Button>
        {explanationContext ? (
          <View style={{ paddingHorizontal: 24 }}>
            <PrayerExplanation />
          </View>
        ) : null}
        <Animated.View style={{ flex: 1, opacity: reveal }}>
          <Reanimated.FlatList
            onScroll={onReaderScroll}
            scrollEventThrottle={16}
            onLayout={(event) => {
              viewportHeight.set(event.nativeEvent.layout.height);
            }}
            onContentSizeChange={(_, height) => {
              contentHeight.set(height);
            }}
            ref={scroll}
            data={tokens.filter(
              (token) =>
                !(
                  practice === "tefillin" &&
                  blessingCustom === "one" &&
                  token.id === "tefillin-7"
                ),
            )}
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
                {quoteSource && !practice ? (
                  <Text
                    style={{
                      color: colors.inkMuted,
                      fontSize: 13,
                      lineHeight: 20,
                    }}
                  >
                    Tap a word in the pronunciation or Hebrew, then tap the last
                    word to keep it as your weekly quote.
                  </Text>
                ) : null}
                {practice === "tefillin" ? (
                  <TefillinPreparation
                    custom={blessingCustom}
                    onChange={setBlessingCustom}
                  />
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
                  {guide.links?.map((link) => (
                    <Button
                      key={link.url}
                      variant="ghost"
                      size="content"
                      accessibilityRole="link"
                      onPress={() => {
                        void Linking.openURL(link.url);
                      }}
                      style={{ minHeight: 44, justifyContent: "flex-start" }}
                    >
                      <Text style={{ color: colors.blue, flexShrink: 1 }}>
                        {link.title}
                      </Text>
                    </Button>
                  ))}
                  {!guide.links?.length && guide.source && onGuideSource ? (
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
            renderItem={({ item: token }) => {
              const step = prayerTokenStep(token);
              const skipHeadBlessing =
                practice === "tefillin" &&
                blessingCustom === "one" &&
                token.id === "tefillin-5";
              if (token.kind === "instruction" || skipHeadBlessing)
                return (
                  <View style={{ gap: 10 }}>
                    <Text
                      style={{
                        color: colors.blue,
                        fontFamily: fonts.semibold,
                        fontSize: 20,
                        lineHeight: 28,
                      }}
                    >
                      {step?.title ?? "What to do"}
                    </Text>
                    <Text variant="caption" style={{ color: colors.inkMuted }}>
                      Direction · not recited
                    </Text>
                    <Text
                      style={{
                        color: colors.ink,
                        fontSize: 16,
                        lineHeight: 25,
                      }}
                    >
                      {skipHeadBlessing
                        ? "Secure the arm box and wind seven turns around the forearm according to your custom, black side outward. Without unrelated speech, place the head box centrally above your original hairline, never on the forehead. Keep the knot at the back of the head. Secure it without another blessing, then finish the hand wraps."
                        : token.translation}
                    </Text>
                  </View>
                );
              return (
                <View style={{ gap: 24 }}>
                  {step ? (
                    <View style={{ gap: 10 }}>
                      <Text
                        style={{
                          color: colors.blue,
                          fontFamily: fonts.semibold,
                          fontSize: 20,
                          lineHeight: 28,
                        }}
                      >
                        {step.title}
                      </Text>
                      <Text
                        style={{
                          color: colors.ink,
                          fontSize: 16,
                          lineHeight: 25,
                        }}
                      >
                        {step.body}
                      </Text>
                    </View>
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
                      <Text
                        variant="caption"
                        style={{ color: colors.inkMuted }}
                      >
                        Pronunciation · draft
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
                      <Text
                        variant="caption"
                        style={{ color: colors.inkMuted }}
                      >
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
              );
            }}
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
            backgroundColor: colors.parchment,
          }}
        >
          <View
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onLayout={(event) => {
              trackWidth.set(event.nativeEvent.layout.width);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 24,
              right: 24,
              height: 2,
            }}
          >
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0.75,
                height: StyleSheet.hairlineWidth,
                backgroundColor: colors.hairline,
              }}
            />
            {/* Direct UI-thread tracking has no trailing spring or autonomous motion,
                including with Reduce Motion enabled. */}
            <Reanimated.View
              style={[
                { height: 2, borderRadius: 1, backgroundColor: colors.blue },
                markerStyle,
              ]}
            />
          </View>
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

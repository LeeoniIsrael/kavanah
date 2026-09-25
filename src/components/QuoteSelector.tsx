import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@/design/appearance";
import { fonts } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { confirmHaptic, successHaptic } from "@/services/haptics";
import { selectedQuote } from "@/services/socialPolicy";
import { useSocialStore, type QuoteSource } from "@/store/socialStore";
import { Check, Quote, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import type { GestureResponderEvent } from "react-native";
import { Animated, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Box = { x: number; y: number; width: number; height: number };
export function QuoteSelector({
  source,
  onClose,
  onViewCircle,
}: {
  source: QuoteSource;
  onClose: () => void;
  onViewCircle: () => void;
}) {
  const colors = useThemeColors();
  const s = useThemedStyles(makes);

  const insets = useSafeAreaInsets();
  const words = source.text.trim().split(/\s+/u);
  const [range, setRange] = useState<[number, number]>([
    0,
    Math.min(words.length - 1, 59),
  ]);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [animation] = useState(() => new Animated.Value(0));
  const reduceMotion = useReducedMotion();
  const wordBoxes = useRef<Record<number, Box>>({});
  const gestureAnchor = useRef(0);
  const lastWord = useRef(-1);
  const field = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });
  const setWeeklyQuote = useSocialStore((s) => s.setWeeklyQuote);
  const quote = selectedQuote(source.text, ...range);
  const [low, high] = [Math.min(...range), Math.max(...range)];
  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: reduceMotion ? 0 : 220,
      useNativeDriver: true,
    }).start();
  }, [animation, reduceMotion]);
  const wordAt = (x: number, y: number): number | null => {
    let nearest: number | null = null;
    let distance = Infinity;
    for (const [id, box] of Object.entries(wordBoxes.current)) {
      const dx = Math.max(box.x - x, 0, x - box.x - box.width);
      const dy = Math.max(box.y - y, 0, y - box.y - box.height);
      const next = dx * dx + dy * dy * 4;
      if (next < distance) {
        distance = next;
        nearest = Number(id);
      }
    }
    return nearest;
  };
  const selectionHandlers = {
    onStartShouldSetResponderCapture: () => !saved,
    onStartShouldSetResponder: () => !saved,
    onMoveShouldSetResponder: () => !saved,
    onResponderGrant: (event: GestureResponderEvent) => {
      const { pageX, pageY } = event.nativeEvent;
      field.current?.measureInWindow((x, y) => {
        origin.current = { x, y };
        const word = wordAt(pageX - x, pageY - y);
        if (word === null) return;
        gestureAnchor.current = word;
        lastWord.current = word;
        if (anchor !== null) {
          setRange([anchor, word]);
          setAnchor(null);
        } else {
          setRange([word, word]);
          setAnchor(word);
        }
        void confirmHaptic();
      });
    },
    onResponderMove: (event: GestureResponderEvent) => {
      const word = wordAt(
        event.nativeEvent.pageX - origin.current.x,
        event.nativeEvent.pageY - origin.current.y,
      );
      if (word !== null && word !== lastWord.current) {
        lastWord.current = word;
        setRange([gestureAnchor.current, word]);
        setAnchor(null);
      }
    },
    onResponderTerminationRequest: () => false,
  };
  return (
    <Animated.View
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        s.overlay,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [reduceMotion ? 0 : 14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* The overlay fills the reader's entire frame, including its padding.
          Read the modal provider's insets explicitly; a nested native SafeAreaView
          can report zero for this absolute overlay and place Close under the clock. */}
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <View style={s.header}>
          <Quote size={22} color={colors.blue} />
          <Text style={s.heading}>Quote of the week</Text>
          <Button
            variant="ghost"
            size="content"
            accessibilityLabel="Close quote selection"
            accessibilityHint="Returns to the prayer without adding this selection"
            hitSlop={4}
            onPress={onClose}
            style={s.iconButton}
          >
            <X color={colors.ink} size={22} />
          </Button>
        </View>
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>
            {saved ? "A line to carry with you." : "Keep the words that stay."}
          </Text>
          <Text style={s.help}>
            {saved
              ? "Your quote is in Circle. You can replace it anytime this week."
              : "Slide across the words, or tap the first and last word. Only the highlighted words will appear."}
          </Text>
          {!saved ? (
            <>
              <View
                ref={field}
                collapsable={false}
                {...selectionHandlers}
                style={[
                  s.words,
                  source.language === "he" && { flexDirection: "row-reverse" },
                ]}
              >
                {words.map((word, index) => (
                  <Text
                    key={index}
                    onLayout={(e) => {
                      wordBoxes.current[index] = e.nativeEvent.layout;
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${word}, word ${index + 1}`}
                    accessibilityState={{
                      selected: index >= low && index <= high,
                    }}
                    onPress={() => {
                      if (anchor === null) {
                        setRange([index, index]);
                        setAnchor(index);
                      } else {
                        setRange([anchor, index]);
                        setAnchor(null);
                      }
                    }}
                    style={[
                      s.word,
                      source.language === "he" && { fontFamily: fonts.hebrew },
                      index >= low && index <= high && s.selected,
                    ]}
                  >
                    {word}
                  </Text>
                ))}
              </View>
              <View style={s.row}>
                <Text style={s.meta}>
                  {high - low + 1} {high === low ? "word" : "words"} selected ·
                  up to 60
                </Text>
                <Button
                  variant="ghost"
                  size="content"
                  onPress={() => {
                    setRange([0, Math.min(words.length - 1, 59)]);
                    setAnchor(null);
                  }}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text style={{ color: colors.blue, fontSize: 13 }}>
                    Select line
                  </Text>
                </Button>
              </View>
            </>
          ) : (
            <View style={s.confirmed}>
              <Check color={colors.blue} size={28} />
              <Text style={s.savedQuote}>{quote}</Text>
            </View>
          )}
          <Text style={s.source}>{source.title}</Text>
          <Text style={s.meta}>{source.sourceRef}</Text>
          {!saved && (
            <Text style={s.meta}>
              This replaces your current quote for the week. Your source is
              included automatically. No caption needed.
            </Text>
          )}
        </ScrollView>
        <View style={s.footer}>
          <Button
            variant="ghost"
            size="content"
            onPress={onClose}
            style={{
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.ink }}>
              {saved ? "Keep praying" : "Cancel"}
            </Text>
          </Button>
          <Button
            size="content"
            disabled={!quote}
            onPress={() => {
              if (saved) {
                onViewCircle();
                return;
              }
              if (setWeeklyQuote(source, ...range)) {
                setSaved(true);
                void successHaptic();
              }
            }}
            style={[s.primary, !quote && { opacity: 0.4 }]}
          >
            <Text style={s.primaryText}>
              {saved ? "View in Circle" : "Add to my weekly quote"}
            </Text>
          </Button>
        </View>
      </View>
    </Animated.View>
  );
}
const makes = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: { zIndex: 80, backgroundColor: colors.parchment },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 24,
      paddingTop: 8,
    },
    heading: {
      flex: 1,
      color: colors.ink,
      fontFamily: fonts.semibold,
      fontSize: 17,
    },
    iconButton: {
      backgroundColor: colors.mineral,
      borderRadius: 22,
      flexShrink: 0,
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    content: { padding: 24, gap: 18 },
    title: {
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      color: colors.ink,
      fontSize: 32,
      lineHeight: 40,
    },
    help: { color: colors.inkMuted, fontSize: 14, lineHeight: 23 },
    words: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      paddingVertical: 16,
    },
    word: {
      paddingHorizontal: 5,
      paddingVertical: 7,
      fontSize: 22,
      lineHeight: 30,
      borderRadius: 7,
      color: colors.ink,
      backgroundColor: colors.vellum,
    },
    selected: { backgroundColor: colors.blue, color: colors.onAccent },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      alignItems: "center",
    },
    meta: { fontSize: 12, lineHeight: 19, color: colors.inkMuted },
    source: { color: colors.ink, fontSize: 15, fontFamily: fonts.semibold },
    footer: { padding: 24, paddingTop: 12 },
    primary: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: colors.blue,
      justifyContent: "center",
      alignItems: "center",
      padding: 12,
    },
    primaryText: {
      fontFamily: fonts.semibold,
      color: colors.onAccent,
      fontSize: 15,
    },
    confirmed: {
      padding: 24,
      backgroundColor: colors.blueSoft,
      borderRadius: 24,
      gap: 20,
    },
    savedQuote: {
      color: colors.ink,
      fontSize: 25,
      lineHeight: 36,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
  });

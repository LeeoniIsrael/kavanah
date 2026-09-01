import { Check, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Body, SectionTitle } from "@/components/Text";
import { colors, fonts, grid, motion, radii, shadows, spacing, type } from "@/design/theme";
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

export function GuidedPrayer({ prayerTitle, tokens, visible, onClose }: Props): React.JSX.Element | null {
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
      useNativeDriver: true
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
    <View accessibilityViewIsModal style={styles.root}>
      <View style={styles.header}>
        <AnimatedPressable accessibilityLabel="Close guided reading" accessibilityRole="button" haptic="selection" onPress={onClose} pressedScale={0.94} style={styles.iconButton}>
          <X size={18} color={colors.ink} />
        </AnimatedPressable>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.title}>{prayerTitle}</Text>
          <Text style={styles.position}>{safeIndex + 1} of {tokens.length}</Text>
        </View>
        <View style={styles.headerBalance} />
      </View>

      <View accessibilityLabel={`${Math.round(((safeIndex + 1) / tokens.length) * 100)} percent complete`} accessibilityRole="progressbar" style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((safeIndex + 1) / tokens.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            styles.phrase,
            {
              opacity: reveal,
              transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }]
            }
          ]}
        >
          {token.hebrew ? <Text selectable style={styles.hebrew}>{token.hebrew}</Text> : null}
          {token.transliteration ? (
            <View style={styles.supportingText}>
              <Text style={styles.label}>Say it</Text>
              <SectionTitle selectable style={styles.transliteration}>{token.transliteration}</SectionTitle>
            </View>
          ) : null}
          {token.translation ? (
            <View style={styles.supportingText}>
              <Text style={styles.label}>Meaning</Text>
              <Body selectable style={styles.translation}>{token.translation}</Body>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedPressable
          accessibilityLabel="Previous line"
          accessibilityRole="button"
          disabled={isFirst}
          haptic="selection"
          onPress={goBack}
          pressedScale={0.94}
          style={[styles.backButton, isFirst && styles.disabledButton]}
        >
          <ChevronLeft size={20} color={colors.ink} />
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel={isLast ? "Finish guided reading" : "Next line"}
          accessibilityRole="button"
          haptic={isLast ? "success" : "selection"}
          onPress={goForward}
          pressedScale={0.98}
          style={styles.nextButton}
        >
          <Text style={styles.nextText}>{isLast ? "Done" : "Next"}</Text>
          {isLast ? <Check size={18} color={colors.white} /> : <ChevronRight size={18} color={colors.white} />}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    backgroundColor: colors.vellum
  },
  header: {
    minHeight: 72,
    paddingHorizontal: grid.margin,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  iconButton: {
    width: grid.touch,
    height: grid.touch,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.floating
  },
  headerCopy: {
    flex: 1,
    alignItems: "center",
    gap: 2
  },
  title: {
    ...type.caption,
    maxWidth: "100%",
    color: colors.ink
  },
  position: {
    ...type.caption,
    color: colors.inkFaint
  },
  headerBalance: {
    width: grid.touch
  },
  progressTrack: {
    height: 2,
    marginHorizontal: grid.margin,
    backgroundColor: colors.hairline
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.blue
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: grid.margin,
    paddingVertical: spacing.xxxl
  },
  phrase: {
    gap: spacing.xxxl
  },
  hebrew: {
    fontFamily: fonts.hebrewSemibold,
    fontWeight: "600",
    textAlign: "right",
    writingDirection: "rtl",
    fontSize: 36,
    lineHeight: 55,
    color: colors.ink
  },
  supportingText: {
    gap: spacing.sm
  },
  label: {
    ...type.caption,
    color: colors.inkFaint
  },
  transliteration: {
    fontSize: 20,
    lineHeight: 29,
    color: colors.ink
  },
  translation: {
    fontSize: 18,
    lineHeight: 27,
    color: colors.inkMuted
  },
  footer: {
    minHeight: 84,
    paddingHorizontal: grid.margin,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.glass
  },
  backButton: {
    width: grid.touch,
    height: grid.touch,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.vellum
  },
  disabledButton: {
    opacity: 0.28
  },
  nextButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.blue,
    ...shadows.pressed
  },
  nextText: {
    ...type.body,
    fontWeight: "600",
    color: colors.white
  }
});

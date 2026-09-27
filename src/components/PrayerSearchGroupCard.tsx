import { useEffect, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { PrayerCard } from "@/components/PrayerCard";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { ChevronDown, ChevronRight } from "@/components/ui/icons";
import { useInterfaceStyles } from "@/design/layout";
import { useThemeColors } from "@/design/appearance";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { PrayerSearchGroup } from "@/services/prayerSearchGroups";

export function PrayerSearchGroupCard({
  group,
  onOpen,
}: {
  group: PrayerSearchGroup;
  onOpen: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ui = useInterfaceStyles();
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  useEffect(() => {
    // Animate on the UI thread; a second tap reverses from the current position.
    progress.value = reduceMotion
      ? expanded
        ? 1
        : 0
      : withTiming(expanded ? 1 : 0, {
          duration: expanded ? 340 : 260,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
  }, [expanded, progress, reduceMotion]);

  const revealStyle = useAnimatedStyle(() => ({
    height: contentHeight.value * progress.value,
    opacity: progress.value,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return (
    <PrayerCard
      prayer={group.prayer}
      selected={false}
      onPress={() => onOpen(group.prayer.id)}
      footer={
        group.editions.length > 0 ? (
          <View style={{ marginHorizontal: 20 }}>
            <Button
              variant="ghost"
              size="content"
              accessibilityLabel={`Other editions of ${group.prayer.title}`}
              accessibilityHint="Shows or hides the other prayer books and sections."
              accessibilityState={{ expanded }}
              onPress={() => {
                Keyboard.dismiss();
                setExpanded((value) => !value);
              }}
              withPressAnimation={false}
              style={[styles.disclosure, { borderTopColor: colors.hairline }]}
            >
              <Text style={[ui.caption, { color: colors.blue, flex: 1 }]}>
                Other editions · {group.editions.length}
              </Text>
              <Animated.View style={chevronStyle}>
                <ChevronDown size={16} color={colors.blue} />
              </Animated.View>
            </Button>
            <Animated.View
              style={[styles.reveal, revealStyle]}
              pointerEvents={expanded ? "auto" : "none"}
              accessibilityElementsHidden={!expanded}
              importantForAccessibility={
                expanded ? "auto" : "no-hide-descendants"
              }
            >
              <View
                // Measure natural height even while clipped, including Dynamic Type
                // and newly arrived search results. No fixed-height list or nested scroll.
                style={styles.editions}
                onLayout={({ nativeEvent }) => {
                  contentHeight.value = nativeEvent.layout.height;
                }}
              >
                <Text style={[ui.caption, { paddingBottom: 8 }]}>
                  Choose a prayer book. Wording and placement may differ.
                </Text>
                {group.editions.map(({ prayer }, index) => (
                  <Button
                    key={prayer.id}
                    variant="ghost"
                    size="content"
                    onPress={() => onOpen(prayer.id)}
                    style={[
                      styles.edition,
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.hairline,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={ui.itemTitle}>
                        {prayer.sourceMetadata?.work ??
                          prayer.hebrewReview.sourceTitle}
                      </Text>
                      <Text style={ui.caption}>
                        {prayer.sourceMetadata?.path.join(" › ") ||
                          prayer.sefariaRef}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.inkMuted} />
                  </Button>
                ))}
              </View>
            </Animated.View>
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  disclosure: {
    minHeight: 52,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reveal: { overflow: "hidden" },
  editions: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
  },
  edition: {
    minHeight: 44,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

import { BlurView } from "expo-blur";
import { ChevronRight } from "@/components/ui/icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { PrayerSearchBar } from "@/components/PrayerSearchBar";
import { PrayerSearchGroupCard } from "@/components/PrayerSearchGroupCard";
import { PrayerSearchSkeleton } from "@/components/LoadingSkeletons";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { palettes } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { PrayerSearchGroup } from "@/services/prayerSearchGroups";

type Props = {
  visible: boolean;
  query: string;
  results: PrayerSearchGroup[];
  searching: boolean;
  onChangeText: (query: string) => void;
  onClose: () => void;
  onOpenPrayer: (id: string) => void;
};

export function PrayerSearchOverlay({
  visible,
  query,
  results,
  searching,
  onChangeText,
  onClose,
  onOpenPrayer,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const reveal = useRef(new Animated.Value(0)).current;
  const hasQuery = query.trim().length > 0;
  const visibleResults = results.slice(0, hasQuery ? 18 : 12);

  useEffect(() => {
    if (!visible) return;
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: reduceMotion ? 0 : 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, reveal, visible]);

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      statusBarTranslucent
      onRequestClose={close}
    >
      <View
        style={[
          styles.screen,
          Platform.OS !== "ios" && { backgroundColor: colors.parchment },
        ]}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={72}
            tint={
              colors.parchment === palettes.dark.parchment ? "dark" : "light"
            }
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                colors.parchment === palettes.dark.parchment
                  ? "rgba(14, 20, 28, 0.82)"
                  : "rgba(247, 248, 250, 0.84)",
            },
          ]}
        />
        <SafeAreaProvider>
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <Animated.View
              style={{
                opacity: reveal,
                transform: [
                  {
                    translateY: reveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [reduceMotion ? 0 : 18, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.searchHeader}>
                <PrayerSearchBar
                  active
                  value={query}
                  onChangeText={onChangeText}
                  onActivate={() => undefined}
                  onCancel={close}
                />
              </View>
              <View style={styles.intro}>
                <Text
                  variant="caption"
                  style={{ color: colors.blue, letterSpacing: 2, fontSize: 11 }}
                >
                  PRAYER LIBRARY
                </Text>
                <Text
                  variant="title"
                  style={{ color: colors.ink, fontSize: 30, lineHeight: 36 }}
                >
                  {hasQuery ? "Find your prayer" : "What’s on your heart?"}
                </Text>
                <Text
                  variant="body"
                  style={{
                    color: colors.inkMuted,
                    fontSize: 14,
                    lineHeight: 21,
                  }}
                >
                  {hasQuery
                    ? "Prayers that speak to your search."
                    : "Browse the collection or begin with a moment below."}
                </Text>
              </View>
            </Animated.View>
            <Animated.ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsContent}
              style={{ opacity: reveal }}
            >
              {!hasQuery ? (
                <View style={styles.suggestions}>
                  {["Travel", "Healing", "Gratitude", "Shema"].map((term) => (
                    <Pressable
                      key={term}
                      accessibilityRole="button"
                      accessibilityLabel={`Search for ${term}`}
                      onPress={() => onChangeText(term)}
                      style={[
                        styles.suggestion,
                        {
                          borderColor: colors.hairlineStrong,
                          backgroundColor: colors.vellum,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.ink, fontSize: 13 }}>
                        {term}
                      </Text>
                      <ChevronRight size={15} color={colors.blue} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <View style={styles.sectionHeader}>
                <Text
                  variant="caption"
                  style={{ color: colors.inkMuted, flex: 1 }}
                >
                  {searching
                    ? "Searching prayers"
                    : hasQuery
                      ? "Results"
                      : "Explore prayers"}
                </Text>
                <Text
                  variant="body"
                  style={{ color: colors.inkMuted, fontSize: 12 }}
                >
                  {results.length} {results.length === 1 ? "prayer" : "prayers"}
                </Text>
              </View>
              {searching && visibleResults.length === 0 ? (
                <PrayerSearchSkeleton />
              ) : visibleResults.length > 0 ? (
                visibleResults.map((result) => (
                  <PrayerSearchGroupCard
                    key={result.prayer.id}
                    group={result}
                    onOpen={onOpenPrayer}
                  />
                ))
              ) : (
                <Card>
                  <Text variant="body">
                    No matching prayers yet. Try another word or a broader
                    intention.
                  </Text>
                </Card>
              )}
            </Animated.ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  searchHeader: { paddingHorizontal: 22, paddingTop: 18 },
  intro: { paddingHorizontal: 24, paddingTop: 34, paddingBottom: 28, gap: 7 },
  resultsContent: { paddingHorizontal: 22, paddingBottom: 48, gap: 10 },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    paddingBottom: 19,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 5,
  },
});

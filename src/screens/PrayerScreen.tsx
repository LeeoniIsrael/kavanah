import { Bookmark, BookmarkCheck, MessageCircle, RefreshCw, Send, Search, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Card } from "@/components/Card";
import { PrayerCard } from "@/components/PrayerCard";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, grid, radii, shadows, spacing, type } from "@/design/theme";
import { createAssistantStream, type AssistantMessage } from "@/services/assistantService";
import { confirmHaptic } from "@/services/haptics";
import { localizeHebrewTransliteration, translatePrayerText } from "@/services/localizationService";
import { usePrayerStore } from "@/store/prayerStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { PrayerToken } from "@/types/prayer";

type LocalizedToken = PrayerToken & {
  localizedTranslation: string;
  localizedTransliteration: string;
};

export function PrayerScreen(): React.JSX.Element {
  const { prayers, results, selectedPrayerId, query, isSyncing, isSearchingRemote, bookmarkedPrayerIds, setQuery, searchRemote, selectPrayer, toggleBookmark, sync } = usePrayerStore();
  const primaryLanguageCode = useSettingsStore((state) => state.primaryLanguageCode);
  const [readerOpen, setReaderOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [isAssistantStreaming, setIsAssistantStreaming] = useState(false);
  const [localizedTokens, setLocalizedTokens] = useState<LocalizedToken[]>([]);
  const selected = prayers.find((prayer) => prayer.id === selectedPrayerId) ?? prayers[0];
  const bookmarkedPrayers = bookmarkedPrayerIds.map((id) => prayers.find((prayer) => prayer.id === id)).filter((prayer): prayer is NonNullable<typeof prayer> => Boolean(prayer));
  const selectedBookmarked = selected ? bookmarkedPrayerIds.includes(selected.id) : false;
  const showResults = query.trim().length > 0;
  const visibleResults = showResults ? results : [];
  const bookmarkReveal = useRef(new Animated.Value(showResults ? 0 : 1)).current;

  useEffect(() => {
    const handle = setTimeout(() => {
      void searchRemote(query);
    }, 450);
    return () => clearTimeout(handle);
  }, [query, searchRemote]);

  useEffect(() => {
    Animated.timing(bookmarkReveal, {
      toValue: showResults ? 0 : 1,
      duration: showResults ? 220 : 280,
      easing: showResults ? Easing.out(Easing.cubic) : Easing.bezier(0.2, 0.9, 0.25, 1),
      useNativeDriver: false
    }).start();
  }, [bookmarkReveal, showResults]);

  useEffect(() => {
    let cancelled = false;

    async function localizeSelectedPrayer(): Promise<void> {
      if (!selected) {
        setLocalizedTokens([]);
        return;
      }

      setLocalizedTokens(selected.tokens.map((token) => ({ ...token, localizedTranslation: token.translation, localizedTransliteration: token.transliteration })));

      const tokens = await Promise.all(
        selected.tokens.map(async (token) => ({
          ...token,
          localizedTransliteration: localizeHebrewTransliteration(token.transliteration, primaryLanguageCode),
          localizedTranslation: primaryLanguageCode === "he" && token.hebrew ? token.hebrew : await translatePrayerText(token.translation, primaryLanguageCode)
        }))
      );

      if (!cancelled) {
        setLocalizedTokens(tokens);
      }
    }

    void localizeSelectedPrayer();

    return () => {
      cancelled = true;
    };
  }, [primaryLanguageCode, selected]);

  const openPrayer = (id: string) => {
    void selectPrayer(id);
    setAssistantOpen(false);
    setAssistantInput("");
    setAssistantMessages([]);
    setReaderOpen(true);
  };

  const askAboutSelectedPrayer = async () => {
    if (!selected || !assistantInput.trim() || isAssistantStreaming) {
      return;
    }

    void confirmHaptic();
    const clean = assistantInput.trim();
    setAssistantInput("");
    setAssistantOpen(true);
    setIsAssistantStreaming(true);

    const userMessage: AssistantMessage = { id: `${Date.now()}-user`, role: "user", content: clean, createdAt: new Date().toISOString() };
    const assistantId = `${Date.now()}-assistant`;
    setAssistantMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() }]);

    const context = [
      `${selected.title}: ${selected.summary}`,
      `Sefaria reference: ${selected.sefariaRef}`,
      `Primary language: ${primaryLanguageCode}`,
      ...localizedTokens.flatMap((token) => [`Hebrew: ${token.hebrew}`, `Transliteration: ${token.localizedTransliteration}`, `Translation: ${token.localizedTranslation}`])
    ].filter(Boolean);

    for await (const chunk of createAssistantStream(clean, context)) {
      setAssistantMessages((current) => current.map((message) => (message.id === assistantId ? { ...message, content: `${message.content}${chunk}` } : message)));
    }
    setIsAssistantStreaming(false);
  };

  return (
    <Screen>
      <View style={styles.searchBox}>
        <Search size={18} color={colors.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="travel, shema, protection..."
          style={styles.searchInput}
          placeholderTextColor={colors.inkMuted}
        />
        <AnimatedPressable accessibilityRole="button" onPress={() => void sync()} disabled={isSyncing} style={styles.refreshButton}>
          <RefreshCw size={18} color={isSyncing || isSearchingRemote ? colors.inkMuted : colors.ink} />
        </AnimatedPressable>
      </View>

      <Animated.View
        pointerEvents={showResults ? "none" : "auto"}
        style={[
          styles.bookmarkMotion,
          {
            opacity: bookmarkReveal,
            maxHeight: bookmarkReveal.interpolate({ inputRange: [0, 1], outputRange: [0, 320] }),
            marginBottom: bookmarkReveal.interpolate({ inputRange: [0, 1], outputRange: [0, spacing.md] }),
            transform: [{ translateY: bookmarkReveal.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }]
          }
        ]}
      >
        <Card accent="gold" style={styles.bookmarkShelf}>
          <View style={styles.sectionHeader}>
            <View>
              <Label>Bookmarked</Label>
              <SectionTitle>Saved prayers</SectionTitle>
            </View>
            <BookmarkCheck size={20} color={colors.gold} />
          </View>
          <View style={styles.bookmarkList}>
            {bookmarkedPrayers.length > 0 ? (
              bookmarkedPrayers.map((prayer) => (
                <AnimatedPressable key={prayer.id} onPress={() => void openPrayer(prayer.id)} style={styles.bookmarkChip}>
                  <SectionTitle style={styles.bookmarkChipText}>{prayer.title}</SectionTitle>
                  <Body numberOfLines={2} style={styles.bookmarkChipMeta}>
                    {prayer.useCase || prayer.category}
                  </Body>
                </AnimatedPressable>
              ))
            ) : (
              <Body>Tap the bookmark on any prayer to keep it here.</Body>
            )}
          </View>
        </Card>
      </Animated.View>

      {showResults ? (
        <View style={styles.resultStack}>
          <View style={styles.resultHeader}>
            <Label>{isSearchingRemote ? "Searching Sefaria" : "Results"}</Label>
            <Body style={styles.resultCount}>{visibleResults.length} found</Body>
          </View>
          {visibleResults.length > 0 ? (
            visibleResults.map((result) => <PrayerCard key={result.prayer.id} prayer={result.prayer} selected={false} onPress={() => void openPrayer(result.prayer.id)} />)
          ) : (
            <Card accent="none">
              <Body>Keep typing. Matches appear here as the search gets clearer.</Body>
            </Card>
          )}
        </View>
      ) : null}

      <Modal visible={readerOpen && Boolean(selected)} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setReaderOpen(false)}>
        <SafeAreaView style={styles.readerSafeArea}>
          {selected ? (
            <View style={styles.readerChrome} pointerEvents="box-none">
              <AnimatedPressable accessibilityLabel="Close prayer" accessibilityRole="button" onPress={() => setReaderOpen(false)} pressedScale={0.94} style={styles.floatingClose}>
                <X size={17} color={colors.ink} />
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityLabel={selectedBookmarked ? "Remove bookmark" : "Bookmark prayer"}
                accessibilityRole="button"
                onPress={() => toggleBookmark(selected.id)}
                pressedScale={0.94}
                style={[styles.floatingBookmark, selectedBookmarked && styles.floatingBookmarkActive]}
              >
                {selectedBookmarked ? <BookmarkCheck size={17} color={colors.white} /> : <Bookmark size={17} color={colors.gold} />}
              </AnimatedPressable>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={styles.readerContent} showsVerticalScrollIndicator={false}>
            {selected ? (
              <View style={styles.reader}>
                <View style={styles.readerHeader}>
                  <View style={styles.readerMetaRow}>
                    <Text style={styles.readerMeta}>{selected.source}</Text>
                    <Text style={styles.readerMeta}>{primaryLanguageCode}</Text>
                  </View>
                  <Display style={styles.readerDisplay}>{selected.title}</Display>
                  <Body style={styles.readerSummary}>{selected.summary}</Body>
                </View>
                <View style={styles.askCard}>
                  <View style={styles.askHeader}>
                    <View style={styles.askIcon}>
                      <MessageCircle size={18} color={colors.blue} />
                    </View>
                    <View style={styles.askTitle}>
                      <SectionTitle style={styles.askTitleText}>Ask about this prayer</SectionTitle>
                      <Body style={styles.askSubtitle}>Uses this text as context.</Body>
                    </View>
                  </View>
                  {assistantOpen ? (
                    <View style={styles.assistantThread}>
                      {assistantMessages.length > 0 ? (
                        assistantMessages.map((message) => (
                          <View key={message.id} style={[styles.assistantBubble, message.role === "user" ? styles.assistantUserBubble : styles.assistantAnswerBubble]}>
                            <Body style={message.role === "user" ? styles.assistantUserText : styles.assistantAnswerText}>{message.content}</Body>
                          </View>
                        ))
                      ) : (
                        <Body>Ask for meaning, context, how it is used, or a simple two-sentence takeaway.</Body>
                      )}
                    </View>
                  ) : null}
                  <View style={styles.askComposer}>
                    <TextInput
                      value={assistantInput}
                      onChangeText={setAssistantInput}
                      placeholder="What does this mean?"
                      placeholderTextColor={colors.inkMuted}
                      style={styles.askInput}
                      multiline
                    />
                    <AnimatedPressable
                      accessibilityRole="button"
                      onPress={() => void askAboutSelectedPrayer()}
                      disabled={!assistantInput.trim() || isAssistantStreaming}
                      style={[styles.askSend, (!assistantInput.trim() || isAssistantStreaming) && styles.askSendDisabled]}
                    >
                      <Send size={17} color={colors.white} />
                    </AnimatedPressable>
                  </View>
                </View>
                {(localizedTokens.length > 0 ? localizedTokens : selected.tokens.map((token) => ({ ...token, localizedTranslation: token.translation, localizedTransliteration: token.transliteration }))).map((token) => (
                  <View key={token.id} style={styles.token}>
                    {token.hebrew ? <SectionTitle style={styles.hebrew}>{token.hebrew}</SectionTitle> : null}
                    {token.localizedTransliteration ? (
                      <View style={styles.transliterationBlock}>
                        <Text style={styles.readerMeta}>Transliteration</Text>
                        <SectionTitle style={styles.transliteration}>{token.localizedTransliteration}</SectionTitle>
                      </View>
                    ) : null}
                    <View style={styles.translationBlock}>
                      <Text style={styles.readerMeta}>Translation</Text>
                      <Body>{token.localizedTranslation}</Body>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.vellum,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm
  },
  searchInput: {
    ...type.body,
    flex: 1,
    minHeight: 56,
    color: colors.ink
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.parchment
  },
  resultStack: {
    gap: spacing.md
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  resultCount: {
    fontSize: 13,
    lineHeight: 18
  },
  bookmarkMotion: {
    overflow: "hidden"
  },
  bookmarkShelf: {
    gap: spacing.md,
    backgroundColor: colors.white
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  bookmarkList: {
    gap: spacing.sm
  },
  bookmarkChip: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.parchment,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  bookmarkChipText: {
    fontSize: 16,
    lineHeight: 21
  },
  bookmarkChipMeta: {
    fontSize: 12,
    lineHeight: 17
  },
  readerSafeArea: {
    flex: 1,
    backgroundColor: colors.parchment
  },
  readerChrome: {
    position: "absolute",
    top: spacing.lg,
    left: grid.margin,
    right: grid.margin,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    pointerEvents: "box-none"
  },
  readerContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xxxl
  },
  reader: {
    gap: spacing.xl
  },
  readerHeader: {
    gap: spacing.sm,
    paddingBottom: spacing.md
  },
  floatingClose: {
    width: grid.touch,
    height: grid.touch,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.floating
  },
  floatingBookmark: {
    width: grid.touch,
    height: grid.touch,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.floating
  },
  floatingBookmarkActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  readerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  readerMeta: {
    ...type.caption,
    color: colors.inkFaint
  },
  readerDisplay: {
    fontSize: 42,
    lineHeight: 47
  },
  readerSummary: {
    color: colors.inkFaint,
    maxWidth: 320
  },
  askCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.pressed
  },
  askHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  askIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueSoft
  },
  askTitle: {
    flex: 1,
    gap: 2
  },
  askTitleText: {
    fontSize: 17,
    lineHeight: 22
  },
  askSubtitle: {
    fontSize: 13,
    lineHeight: 18
  },
  assistantThread: {
    gap: spacing.sm
  },
  assistantBubble: {
    maxWidth: "92%",
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  assistantUserBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.ink
  },
  assistantAnswerBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.blueSoft
  },
  assistantUserText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20
  },
  assistantAnswerText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20
  },
  askComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.vellum,
    padding: spacing.sm
  },
  askInput: {
    ...type.body,
    flex: 1,
    minHeight: 40,
    maxHeight: 116,
    color: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  askSend: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue
  },
  askSendDisabled: {
    opacity: 0.42
  },
  token: {
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: spacing.xl
  },
  hebrew: {
    textAlign: "right",
    fontSize: 31,
    lineHeight: 46,
    color: colors.ink
  },
  transliterationBlock: {
    gap: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.blue,
    paddingLeft: spacing.md
  },
  transliteration: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink
  },
  translationBlock: {
    gap: spacing.xs
  }
});

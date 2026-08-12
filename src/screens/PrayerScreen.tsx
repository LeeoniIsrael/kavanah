import { Bookmark, BookmarkCheck, BookmarkMinus, MessageCircle, RefreshCw, Send, Search, ShieldCheck, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AssistantResponseText } from "@/components/AssistantResponseText";
import { Card } from "@/components/Card";
import { PrayerCard } from "@/components/PrayerCard";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, fonts, grid, radii, shadows, spacing, type } from "@/design/theme";
import { createAssistantStream, type AssistantMessage } from "@/services/assistantService";
import { confirmHaptic } from "@/services/haptics";
import { localizeHebrewTransliteration, translatePrayerText } from "@/services/localizationService";
import { usePrayerStore } from "@/store/prayerStore";
import { CURRENT_ASSISTANT_CONSENT_VERSION, useSettingsStore } from "@/store/settingsStore";
import type { PrayerToken } from "@/types/prayer";

type LocalizedToken = PrayerToken & {
  localizedTranslation: string;
  localizedTransliteration: string;
};

export function PrayerScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { prayers, results, selectedPrayerId, query, isSyncing, isSearchingRemote, bookmarkedPrayerIds, setQuery, searchRemote, selectPrayer, toggleBookmark, sync } = usePrayerStore();
  const primaryLanguageCode = useSettingsStore((state) => state.primaryLanguageCode);
  const assistantConsentVersion = useSettingsStore((state) => state.assistantConsentVersion);
  const setAssistantConsent = useSettingsStore((state) => state.setAssistantConsent);
  const [readerOpen, setReaderOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [isAssistantStreaming, setIsAssistantStreaming] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
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

    if (assistantConsentVersion !== CURRENT_ASSISTANT_CONSENT_VERSION) {
      void confirmHaptic();
      setConsentModalOpen(true);
      return;
    }

    await submitAssistantQuestion(assistantInput.trim());
  };

  const submitAssistantQuestion = async (clean: string) => {
    if (!selected || !clean || isAssistantStreaming) return;

    void confirmHaptic();
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

    try {
      for await (const chunk of createAssistantStream(clean, context)) {
        setAssistantMessages((current) => current.map((message) => (message.id === assistantId ? { ...message, content: `${message.content}${chunk}` } : message)));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "The assistant could not answer right now.";
      setAssistantMessages((current) => current.map((item) => (item.id === assistantId ? { ...item, content: message } : item)));
    } finally {
      setIsAssistantStreaming(false);
    }
  };

  return (
    <Screen>
      <View style={styles.prayerDiscovery}>
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
                <View key={prayer.id} style={styles.bookmarkChip}>
                  <View style={styles.bookmarkChipMainSlot}>
                    <AnimatedPressable accessibilityLabel={`Open ${prayer.title}`} accessibilityRole="button" onPress={() => void openPrayer(prayer.id)} style={styles.bookmarkChipMain}>
                      <SectionTitle style={styles.bookmarkChipText}>{prayer.title}</SectionTitle>
                      <Body numberOfLines={2} style={styles.bookmarkChipMeta}>
                        {prayer.useCase || prayer.category}
                      </Body>
                    </AnimatedPressable>
                  </View>
                  <View style={styles.removeBookmarkSlot}>
                    <AnimatedPressable accessibilityLabel={`Remove ${prayer.title} from bookmarks`} accessibilityRole="button" haptic="confirm" onPress={() => toggleBookmark(prayer.id)} pressedScale={0.96} style={styles.removeBookmarkButton}>
                      <BookmarkMinus size={18} color={colors.blue} />
                    </AnimatedPressable>
                  </View>
                </View>
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
      </View>

      <Modal visible={readerOpen && Boolean(selected)} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setReaderOpen(false)}>
        <SafeAreaView style={styles.readerSafeArea}>
          {selected ? (
            <View style={[styles.readerChrome, { top: insets.top + spacing.lg }]} pointerEvents="box-none">
              <AnimatedPressable accessibilityLabel="Close prayer" accessibilityRole="button" onPress={() => setReaderOpen(false)} pressedScale={0.94} style={styles.floatingClose}>
                <X size={17} color={colors.ink} />
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityLabel={selectedBookmarked ? "Remove bookmark" : "Bookmark prayer"}
                accessibilityRole="button"
                haptic="confirm"
                onPress={() => toggleBookmark(selected.id)}
                pressedScale={0.94}
                style={[styles.floatingBookmark, selectedBookmarked && styles.floatingBookmarkActive]}
              >
                {selectedBookmarked ? <BookmarkCheck size={17} color={colors.white} /> : <Bookmark size={17} color={colors.gold} />}
              </AnimatedPressable>
            </View>
          ) : null}
          <ScrollView
            contentContainerStyle={[styles.readerContent, { paddingTop: insets.top + grid.touch + spacing.xxl }]}
            showsVerticalScrollIndicator={false}
          >
            {selected ? (
              <View style={styles.reader}>
                <View style={styles.readerHeader}>
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
                            {message.role === "user" ? (
                              <Body style={styles.assistantUserText}>{message.content}</Body>
                            ) : (
                              <AssistantResponseText content={message.content} style={styles.assistantAnswerText} />
                            )}
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
          {consentModalOpen ? (
            <View style={styles.consentBackdrop}>
              <View style={styles.consentSheet}>
                <View style={styles.consentMark}><ShieldCheck size={21} color={colors.blue} /></View>
                <SectionTitle>Before your first question</SectionTitle>
                <Body>Your question, this prayer text, language, and source reference are sent to OpenAI through Kavanah. Contact details are removed first. Do not include anything private.</Body>
                <Body style={styles.consentNote}>Answers are educational and are not binding halachic rulings.</Body>
                <View style={styles.consentActions}>
                  <View style={styles.consentSecondarySlot}>
                    <AnimatedPressable accessibilityRole="button" onPress={() => setConsentModalOpen(false)} style={styles.consentSecondary}>
                      <Text style={styles.consentSecondaryText}>Not now</Text>
                    </AnimatedPressable>
                  </View>
                  <View style={styles.consentPrimarySlot}>
                    <AnimatedPressable
                      accessibilityRole="button"
                      onPress={() => {
                        const question = assistantInput.trim();
                        setAssistantConsent(true);
                        setConsentModalOpen(false);
                        void submitAssistantQuestion(question);
                      }}
                      style={styles.consentPrimary}
                    >
                      <Text style={styles.consentPrimaryText}>Allow and ask</Text>
                    </AnimatedPressable>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  prayerDiscovery: {
    gap: spacing.xl
  },
  searchBox: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.lg,
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
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mineral
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
    gap: spacing.lg,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    shadowOpacity: 0,
    elevation: 0
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  bookmarkList: {
    borderTopWidth: 1,
    borderTopColor: colors.hairlineStrong
  },
  bookmarkChip: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden"
  },
  bookmarkChipMainSlot: {
    flex: 1
  },
  bookmarkChipMain: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.lg
  },
  bookmarkChipText: {
    fontSize: 16,
    lineHeight: 21
  },
  bookmarkChipMeta: {
    fontSize: 12,
    lineHeight: 17
  },
  removeBookmarkButton: {
    width: grid.touch,
    height: grid.touch,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mineral
  },
  removeBookmarkSlot: {
    width: grid.touch + spacing.sm,
    alignItems: "flex-start"
  },
  readerSafeArea: {
    flex: 1,
    backgroundColor: colors.vellum
  },
  readerChrome: {
    position: "absolute",
    left: grid.margin,
    right: grid.margin,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    pointerEvents: "box-none"
  },
  readerContent: {
    paddingHorizontal: 22,
    paddingBottom: 72
  },
  reader: {
    gap: spacing.xxl
  },
  readerHeader: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline
  },
  floatingClose: {
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
  floatingBookmark: {
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
  floatingBookmarkActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  readerMeta: {
    ...type.caption,
    color: colors.inkFaint
  },
  readerDisplay: {
    fontSize: 38,
    lineHeight: 42
  },
  readerSummary: {
    color: colors.inkFaint,
    maxWidth: 320
  },
  askCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.mineral,
    borderWidth: 0
  },
  askHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  askIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.vellum
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
    maxWidth: "94%",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  assistantUserBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.ink
  },
  assistantAnswerBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.vellum
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
    borderRadius: radii.md,
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
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue
  },
  askSendDisabled: {
    opacity: 0.42
  },
  token: {
    gap: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: spacing.xl
  },
  hebrew: {
    fontFamily: fonts.hebrewSemibold,
    fontWeight: "600",
    textAlign: "right",
    fontSize: 33,
    lineHeight: 50,
    color: colors.ink
  },
  transliterationBlock: {
    gap: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
    paddingLeft: spacing.md
  },
  transliteration: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink
  },
  translationBlock: {
    gap: spacing.xs
  },
  consentBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    justifyContent: "flex-end",
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    backgroundColor: "rgba(11, 13, 16, 0.28)"
  },
  consentSheet: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    ...shadows.floating
  },
  consentMark: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueSoft
  },
  consentNote: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted
  },
  consentActions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  consentSecondarySlot: {
    flex: 1
  },
  consentPrimarySlot: {
    flex: 1.4
  },
  consentSecondary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.hairlineStrong
  },
  consentSecondaryText: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink
  },
  consentPrimary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.blue
  },
  consentPrimaryText: {
    ...type.body,
    fontWeight: "600",
    color: colors.white
  }
});

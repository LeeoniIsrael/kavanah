import { usePracticeAvailability } from "@/hooks/usePracticeAvailability";
import { prayerReadingGuide, prayerScopeNote } from "@/data/prayerReadingGuide";
import { findLanguage } from "@/data/languages";
import { PrayerCompletionPrompt } from "@/components/PrayerCompletionPrompt";
import { groupPrayerSearchResults } from "@/services/prayerSearchGroups";
import { PrayerSearchGroupCard } from "@/components/PrayerSearchGroupCard";
import {
  siddurBooks,
  siddurEntries,
  fitsDailyView,
  type SiddurBook,
} from "@/services/siddur";
import { writeSocialData } from "@/services/socialStorage";
import { SiddurExperience } from "@/features/siddur/SiddurExperience";
import { createIndexedPrayer } from "@/services/prayerService";
import { habitForPrayer } from "@/services/practiceHabit";
import { SectionHeading } from "@/components/ui/section-heading";
import { QuoteSelector } from "@/components/QuoteSelector";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { cn } from "@/lib/utils";
import type { QuoteSource } from "@/store/socialStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Bookmark,
  BookmarkCheck,
  BookmarkMinus,
  CircleHelp,
  ExternalLink,
  MoonStar,
  Quote,
  RefreshCw,
  Search,
  X,
} from "@/components/ui/icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import {
  GuidedPrayer,
  type GuidedPrayerToken,
} from "@/components/GuidedPrayer";
import {
  PrayerSearchSkeleton,
  PrayerTextSkeleton,
} from "@/components/LoadingSkeletons";
import {
  PracticeStoryComposer,
  type PracticeStoryMoment,
} from "@/components/PracticeStoryComposer";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GooeyInfoPopover } from "@/components/ui/gooey-popover";
import { spacing } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { buildPrayerAssistantContext } from "@/services/assistantContext";
import { confirmHaptic, successHaptic } from "@/services/haptics";
import {
  localizeHebrewTransliteration,
  translatePrayerText,
} from "@/services/localizationService";
import { getPrayerFocusSetup } from "@/services/prayerFocus";
import { usePrayerStore } from "@/store/prayerStore";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useSocialStore } from "@/store/socialStore";
import { useStreakStore } from "@/store/streakStore";
import type { HebrewContentKind, PrayerToken } from "@/types/prayer";

type LocalizedToken = PrayerToken & {
  localizedTranslation: string;
  localizedTransliteration: string;
};

type LocalizedPrayer = {
  prayerId: string;
  tokens: LocalizedToken[];
};

function hebrewContentLabel(kind: HebrewContentKind): string {
  if (kind === "complete") return "Hebrew review pending";
  if (kind === "excerpt") return "Draft excerpt";
  if (kind === "collection") return "Service collection";
  if (kind === "missing") return "Text being prepared";
  return "Unreviewed library text";
}

function hebrewReviewMessage(kind: HebrewContentKind): string {
  if (kind === "complete")
    return "The full Hebrew is present and awaiting final rabbinic approval.";
  if (kind === "excerpt")
    return "This is a clearly marked excerpt, not yet the complete prayer.";
  if (kind === "collection")
    return "This entry represents a full service whose sections must be reviewed individually.";
  if (kind === "missing")
    return "Kavanah will not invent or silently substitute sacred text while the canonical Hebrew is being prepared.";
  return "This text came from a live library search and is outside Kavanah's reviewed catalog.";
}

export function PrayerScreen(): React.JSX.Element {
  const availability = usePracticeAvailability();
  const colors = useThemeColors();

  const router = useRouter();
  const params = useLocalSearchParams<{
    prayerId?: string;
    query?: string;
  }>();
  const {
    prayers,
    results,
    selectedPrayerId,
    query,
    isSyncing,
    isSearchingRemote,
    loadingPrayerId,
    prayerLoadError,
    bookmarkedPrayerIds,
    setQuery,
    searchRemote,
    selectPrayer,
    toggleBookmark,
    recordCompletion,
    sync,
  } = usePrayerStore();
  const shareAfterPrayer = useSettingsStore((state) => state.shareAfterPrayer);
  const setShareAfterPrayer = useSettingsStore(
    (state) => state.setShareAfterPrayer,
  );
  const pendingShare = useRef<PracticeStoryMoment | null>(null);
  const completeHabit = useStreakStore((state) => state.completeHabit);
  const recordSocialPrayer = useSocialStore((state) => state.recordPrayer);
  const [quoteSource, setQuoteSource] = useState<QuoteSource | null>(null);
  const primaryLanguageCode = useSettingsStore(
    (state) => state.primaryLanguageCode,
  );
  const prayerFocusEnabled = useSettingsStore(
    (state) => state.prayerFocusEnabled,
  );
  const prayerSession = useRef<{ startedAt: Date; completed: boolean } | null>(
    null,
  );
  const [readerOpen, setReaderOpen] = useState(false);
  const [focusPromptOpen, setFocusPromptOpen] = useState(false);
  const [focusPromptMessage, setFocusPromptMessage] = useState("");
  const [guidedPrayerOpen, setGuidedPrayerOpen] = useState(false);
  const [completionMoment, setCompletionMoment] =
    useState<PracticeStoryMoment | null>(null);
  const [shareMoment, setShareMoment] = useState<PracticeStoryMoment | null>(
    null,
  );
  const [localizedPrayer, setLocalizedPrayer] =
    useState<LocalizedPrayer | null>(null);
  const reduceMotion = useReducedMotion();
  const selected =
    prayers.find((prayer) => prayer.id === selectedPrayerId) ?? prayers[0];
  const selectedPractice = selected ? habitForPrayer(selected) : undefined;
  const bookmarkedPrayers = bookmarkedPrayerIds
    .map((id) => prayers.find((prayer) => prayer.id === id))
    .filter((prayer): prayer is NonNullable<typeof prayer> => Boolean(prayer));
  const selectedBookmarked = selected
    ? bookmarkedPrayerIds.includes(selected.id)
    : false;
  const selectedLoading = selected ? loadingPrayerId === selected.id : false;
  const localizedTokens =
    localizedPrayer && localizedPrayer.prayerId === selected?.id
      ? localizedPrayer.tokens
      : [];
  const showResults = query.trim().length > 0;
  const groupedResults = groupPrayerSearchResults(results);
  const visibleResults = showResults ? groupedResults.slice(0, 18) : [];
  const [bookmarkReveal] = useState(
    () => new Animated.Value(showResults ? 0 : 1),
  );
  const focusSetup = getPrayerFocusSetup();
  const [libraryView, setLibraryView] = useState<"siddur" | "search">("siddur");

  useEffect(() => {
    const linkedQuery = params.query?.trim();
    if (linkedQuery) {
      setQuery(linkedQuery);
      // A new external route must reveal its requested search results.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLibraryView("search");
    }
    const linkedPrayerId = params.prayerId?.trim();
    if (linkedPrayerId) {
      void selectPrayer(linkedPrayerId);
      // Deep-link navigation resets the reader and assistant as one transition.
      setGuidedPrayerOpen(true);

      prayerSession.current = { startedAt: new Date(), completed: false };
      setReaderOpen(true);
      setFocusPromptMessage("");
      setFocusPromptOpen(false);
    }
  }, [
    prayerFocusEnabled,
    params.prayerId,
    params.query,
    selectPrayer,
    setQuery,
  ]);

  useEffect(() => {
    if (focusPromptOpen) void confirmHaptic();
  }, [focusPromptOpen]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void searchRemote(query);
    }, 450);
    return () => clearTimeout(handle);
  }, [query, searchRemote]);

  useEffect(() => {
    Animated.timing(bookmarkReveal, {
      toValue: showResults ? 0 : 1,
      duration: reduceMotion ? 0 : showResults ? 220 : 280,
      easing: showResults
        ? Easing.out(Easing.cubic)
        : Easing.bezier(0.2, 0.9, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [bookmarkReveal, reduceMotion, showResults]);

  useEffect(() => {
    let cancelled = false;

    async function localizeSelectedPrayer(): Promise<void> {
      if (!selected) {
        setLocalizedPrayer(null);
        return;
      }

      setLocalizedPrayer({
        prayerId: selected.id,
        tokens: selected.tokens.map((token) => ({
          ...token,
          localizedTranslation: token.translation,
          localizedTransliteration: token.transliteration,
        })),
      });

      const tokens = await Promise.all(
        selected.tokens.map(async (token) => ({
          ...token,
          localizedTransliteration: localizeHebrewTransliteration(
            token.transliteration,
            primaryLanguageCode,
          ),
          localizedTranslation:
            primaryLanguageCode === "he" && token.hebrew
              ? token.hebrew
              : await translatePrayerText(
                  token.translation,
                  primaryLanguageCode,
                ),
        })),
      );

      if (!cancelled) {
        setLocalizedPrayer({ prayerId: selected.id, tokens });
      }
    }

    void localizeSelectedPrayer();

    return () => {
      cancelled = true;
    };
  }, [primaryLanguageCode, selected]);

  const openPrayer = (id: string) => {
    void selectPrayer(id);
    setGuidedPrayerOpen(true);

    prayerSession.current = { startedAt: new Date(), completed: false };
    setReaderOpen(true);
    setFocusPromptMessage("");
    setFocusPromptOpen(false);
  };

  const prayerIdentity = usePrayerIdentityStore((state) => state.identity);
  const sourceBook = selected?.sourceMetadata?.work;
  const orderedSections =
    sourceBook && siddurBooks.includes(sourceBook as SiddurBook)
      ? siddurEntries(sourceBook as SiddurBook).filter((entry) =>
          fitsDailyView(entry, prayerIdentity),
        )
      : [];
  const sectionIndex = orderedSections.findIndex(
    (entry) => entry.id === selected?.id,
  );
  const turnSection = (offset: number) => {
    const entry = orderedSections[sectionIndex + offset];
    if (!entry) return;
    const prayer = createIndexedPrayer(entry);
    usePrayerStore.setState((state) => ({
      prayers: state.prayers.some((item) => item.id === prayer.id)
        ? state.prayers
        : [...state.prayers, prayer],
    }));
    writeSocialData("siddur.place", entry.id);
    openPrayer(entry.id);
  };
  const closeReader = () => {
    setCompletionMoment(null);
    setQuoteSource(null);
    setGuidedPrayerOpen(false);
    setFocusPromptOpen(false);
    setReaderOpen(false);
    if (params.prayerId) {
      router.setParams({ prayerId: "" });
    }
  };

  const openFocusSettings = async () => {
    setFocusPromptOpen(false);
    router.push("/focus-setup");
  };

  const readerTokens =
    localizedTokens.length > 0
      ? localizedTokens
      : (selected?.tokens.map((token) => ({
          ...token,
          localizedTranslation: token.translation,
          localizedTransliteration: token.transliteration,
        })) ?? []);
  const guidedTokens: GuidedPrayerToken[] = readerTokens.map((token) => ({
    id: token.id,
    hebrew: token.hebrew,
    transliteration: token.localizedTransliteration,
    translation: token.localizedTranslation,
    translationLanguage:
      primaryLanguageCode !== "en" &&
      primaryLanguageCode !== "he" &&
      token.localizedTranslation === token.translation
        ? "English (translation unavailable)"
        : findLanguage(primaryLanguageCode).name,
  }));

  const startGuidedPrayer = () => {
    setGuidedPrayerOpen(true);
  };

  const completeGuidedPrayer = () => {
    if (
      !selected ||
      selectedLoading ||
      !readerTokens.length ||
      prayerSession.current?.completed
    )
      return;
    const completedAt = new Date();
    const startedAt = prayerSession.current?.startedAt;
    const habit = selectedPractice;

    const completion = recordCompletion(
      selected,
      completedAt,
      startedAt,
      "reader",
      habit,
    );
    if (!completion) return;
    if (prayerSession.current) prayerSession.current.completed = true;
    if (habit) completeHabit(habit, completedAt);
    const streak = habit
      ? (useStreakStore.getState().habits.find((item) => item.habit === habit)
          ?.streak ?? 0)
      : 0;
    recordSocialPrayer({
      id: completion.id,
      ...(startedAt ? { startedAt } : {}),
      prayerId: selected.id,
      title: selected.title,
      completedAt,
      streak,
      ...(habit ? { practiceKey: habit } : {}),
    });
    if (shareAfterPrayer) {
      setCompletionMoment({
        prayerTitle: selected.title,
        ...(habit ? { habit } : {}),
        streak,
        completedAt,
      });
    } else {
      setCompletionMoment(null);
      closeReader();
    }
    void successHaptic();
  };

  return (
    <Screen largeTitle="Prayer" subtitle="Your siddur and prayers, together.">
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: "row",
          gap: 6,
          padding: 5,
          borderRadius: 20,
          backgroundColor: colors.mineral,
        }}
      >
        {(["siddur", "search"] as const).map((view) => (
          <Button
            key={view}
            variant="ghost"
            accessibilityRole="tab"
            accessibilityState={{ selected: libraryView === view }}
            onPress={() => setLibraryView(view)}
            style={{
              flex: 1,
              borderRadius: 16,
              backgroundColor:
                libraryView === view ? colors.blue : "transparent",
            }}
          >
            <Text
              style={{
                color: libraryView === view ? colors.onAccent : colors.ink,
              }}
            >
              {view === "siddur" ? "Siddur" : "Find a prayer"}
            </Text>
          </Button>
        ))}
      </View>
      {libraryView === "siddur" ? (
        <SiddurExperience />
      ) : (
        <View className="gap-6">
          <View
            style={{
              backgroundColor: colors.vellum,
              borderCurve: "continuous",
            }}
            className="min-h-[62px] flex-row items-center gap-3 overflow-hidden rounded-lg pl-5 pr-2"
          >
            <Search size={20} color={colors.inkMuted} />
            <Input
              accessibilityLabel="Search prayers"
              value={query}
              onChangeText={setQuery}
              placeholders={[
                "Search for travel…",
                "Search for Shema…",
                "Search for protection…",
              ]}
              className="h-auto min-h-[56px] flex-1 w-auto border-0 bg-transparent dark:bg-transparent px-0 shadow-none"
              placeholderTextColor={colors.inkMuted}
            />
            <Button
              variant="secondary"
              size="content"
              accessibilityLabel="Refresh prayer library"
              accessibilityRole="button"
              onPress={() => void sync()}
              disabled={isSyncing}
              isLoading={isSyncing}
              className="w-11 h-11 rounded-full items-center justify-center bg-muted"
            >
              <RefreshCw
                size={20}
                color={
                  isSyncing || isSearchingRemote ? colors.inkMuted : colors.ink
                }
              />
            </Button>
          </View>

          {!showResults && (
            <Animated.View
              pointerEvents="auto"
              className="overflow-hidden"
              style={[
                {
                  opacity: bookmarkReveal,
                  maxHeight: bookmarkReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 320],
                  }),
                  marginBottom: bookmarkReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, spacing.md],
                  }),
                  transform: [
                    {
                      translateY: bookmarkReveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-12, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Card className="gap-4 bg-[transparent] border-[0px] px-0 py-2 shadow-none">
                <View className="flex-row items-center justify-between gap-3">
                  <View>
                    <Text variant="caption">Bookmarked</Text>
                    <Text variant="section">Saved prayers</Text>
                  </View>
                  <BookmarkCheck size={20} color={colors.gold} />
                </View>
                <View className="gap-2">
                  {bookmarkedPrayers.length > 0 ? (
                    bookmarkedPrayers.map((prayer) => (
                      <View
                        key={prayer.id}
                        className="rounded-md bg-card flex-row items-center overflow-hidden"
                      >
                        <View className="flex-1">
                          <Button
                            variant="ghost"
                            size="content"
                            accessibilityLabel={`Open ${prayer.title}`}
                            accessibilityRole="button"
                            onPress={() => void openPrayer(prayer.id)}
                            className="px-4 py-4"
                          >
                            <Text
                              variant="section"
                              className="text-[16px] leading-[21px]"
                            >
                              {prayer.title}
                            </Text>
                            <Text
                              variant="body"
                              numberOfLines={2}
                              className="text-[12px] leading-[17px]"
                            >
                              {prayer.useCase || prayer.category}
                            </Text>
                          </Button>
                        </View>
                        <View className="w-[52px] items-start">
                          <Button
                            variant="secondary"
                            size="content"
                            accessibilityLabel={`Remove ${prayer.title} from bookmarks`}
                            accessibilityRole="button"
                            haptic="confirm"
                            onPress={() => toggleBookmark(prayer.id)}
                            pressedScale={0.96}
                            className="w-11 h-11 rounded-full items-center justify-center bg-muted"
                          >
                            <BookmarkMinus size={20} color={colors.blue} />
                          </Button>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text variant="body">
                      Tap the bookmark on any prayer to keep it here.
                    </Text>
                  )}
                </View>
              </Card>
            </Animated.View>
          )}

          {showResults ? (
            <View className="gap-3">
              <SectionHeading
                title={isSearchingRemote ? "Searching prayers" : "Results"}
                detail={`${groupedResults.length} ${groupedResults.length === 1 ? "prayer" : "prayers"}`}
              />
              {isSearchingRemote && visibleResults.length === 0 ? (
                <PrayerSearchSkeleton />
              ) : visibleResults.length > 0 ? (
                visibleResults.map((result) => (
                  <PrayerSearchGroupCard
                    key={result.prayer.id}
                    group={result}
                    onOpen={(id) => void openPrayer(id)}
                  />
                ))
              ) : (
                <Card>
                  <Text variant="body">
                    Keep typing. Matches appear here as the search gets clearer.
                  </Text>
                </Card>
              )}
            </View>
          ) : null}
        </View>
      )}

      <Modal
        visible={readerOpen && Boolean(selected)}
        onDismiss={() => {
          if (pendingShare.current) {
            setShareMoment(pendingShare.current);
            pendingShare.current = null;
          }
        }}
        animationType={reduceMotion ? "none" : "slide"}
        presentationStyle="fullScreen"
        onRequestClose={closeReader}
      >
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.parchment }}>
            {selected ? (
              <View
                className="z-[10] flex-row justify-between"
                style={{
                  marginHorizontal: 24,
                  paddingTop: 8,
                  paddingBottom: 12,
                }}
                pointerEvents="box-none"
              >
                <Button
                  variant="ghost"
                  size="content"
                  accessibilityLabel="Close prayer"
                  accessibilityRole="button"
                  onPress={closeReader}
                  pressedScale={0.96}
                  className="w-11 h-11 rounded-md items-center justify-center bg-glass"
                >
                  <X size={20} color={colors.ink} />
                </Button>
                <Button
                  variant="ghost"
                  size="content"
                  accessibilityLabel="Finish prayer"
                  disabled={
                    selectedLoading || !availability(selectedPractice).allowed
                  }
                  onPress={completeGuidedPrayer}
                  style={{
                    minHeight: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.mineral,
                    paddingHorizontal: 20,
                    marginLeft: "auto",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ color: colors.ink }}>Finish prayer</Text>
                </Button>
                <Button
                  variant="default"
                  size="content"
                  accessibilityLabel={
                    selectedBookmarked ? "Remove bookmark" : "Bookmark prayer"
                  }
                  accessibilityRole="button"
                  haptic="confirm"
                  onPress={() => toggleBookmark(selected.id)}
                  pressedScale={0.96}
                  className={cn(
                    "w-11 h-11 rounded-md items-center justify-center bg-glass",
                    selectedBookmarked && "bg-primary",
                  )}
                >
                  {selectedBookmarked ? (
                    <BookmarkCheck size={16} color={colors.onAccent} />
                  ) : (
                    <Bookmark size={16} color={colors.gold} />
                  )}
                </Button>
              </View>
            ) : null}
            {sectionIndex >= 0 ? (
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 24,
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <Button
                  variant="ghost"
                  disabled={sectionIndex === 0}
                  onPress={() => turnSection(-1)}
                  accessibilityLabel="Previous siddur section"
                >
                  <Text>Previous</Text>
                </Button>
                <Button
                  variant="ghost"
                  onPress={closeReader}
                  style={{ flex: 1 }}
                >
                  <Text>Contents</Text>
                </Button>
                <Button
                  variant="ghost"
                  disabled={sectionIndex === orderedSections.length - 1}
                  onPress={() => turnSection(1)}
                  accessibilityLabel="Next siddur section"
                >
                  <Text>Next</Text>
                </Button>
              </View>
            ) : null}
            <ScrollView
              key={sectionIndex >= 0 ? selected?.id : "prayer-reader"}
              automaticallyAdjustKeyboardInsets
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerClassName={cn("px-[22px] pb-[72px]")}
              contentContainerStyle={[{ paddingTop: spacing.lg }]}
              showsVerticalScrollIndicator={false}
            >
              {selected ? (
                <View className="gap-8">
                  <View className="gap-3 pb-4 border-b border-b-hairline">
                    <Text
                      variant="display"
                      className="text-[38px] leading-[42px]"
                    >
                      {selected.title}
                    </Text>
                    <Text variant="body" className="text-inkFaint max-w-80">
                      {selected.summary}
                    </Text>
                  </View>
                  {selected.hebrewReview.status !== "approved" ? (
                    <View className="flex-row gap-3 py-2">
                      <View className="w-[2px] bg-gold" />
                      <View className="flex-1 gap-1">
                        <View className="z-20 flex-row items-center justify-between gap-3">
                          <Text variant="caption" className="flex-1">
                            {hebrewContentLabel(
                              selected.hebrewReview.contentKind,
                            )}
                          </Text>
                          <GooeyInfoPopover
                            accessibilityLabel="About Hebrew text review"
                            title="Why this label appears"
                            body="Sacred text is shown with its review status and source. Kavanah never fills missing Hebrew with generated text."
                            side="bottom"
                            align="end"
                            triggerStyle={{
                              alignItems: "center",
                              backgroundColor: colors.mineral,
                              borderRadius: 22,
                              height: 44,
                              justifyContent: "center",
                              width: 44,
                            }}
                            trigger={
                              <CircleHelp size={16} color={colors.blue} />
                            }
                          />
                        </View>
                        <Text
                          variant="body"
                          className="text-muted-foreground text-[14px] leading-[20px]"
                        >
                          {hebrewReviewMessage(
                            selected.hebrewReview.contentKind,
                          )}
                        </Text>
                        <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-inkFaint font-label">
                          {selected.hebrewReview.sourceTitle} ·{" "}
                          {selected.hebrewReview.sourceRef}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  <View className="gap-1 border-l-[2px] border-l-gold pl-3 py-1">
                    <Text variant="caption">Kavanah</Text>
                    <Text
                      variant="body"
                      className="text-foreground max-w-[330px]"
                    >
                      Pause for one breath. Bring to mind why you opened this
                      prayer.
                    </Text>
                  </View>
                  {!selectedLoading && guidedTokens.length > 0 ? (
                    <Button onPress={startGuidedPrayer}>
                      <Text>Return to prayer</Text>
                    </Button>
                  ) : null}
                  {selectedLoading ? (
                    <View className="min-h-24 border-t border-t-hairline border-b border-b-hairline">
                      <PrayerTextSkeleton />
                    </View>
                  ) : null}
                  {!selectedLoading && prayerLoadError ? (
                    <View className="gap-2 border-l-[2px] border-l-gold pl-4 py-2">
                      <Text variant="caption">Source access</Text>
                      <Text variant="section">
                        This text stays with its publisher
                      </Text>
                      <Text variant="body" className="text-muted-foreground">
                        {prayerLoadError}
                      </Text>
                      <Button
                        variant="default"
                        size="content"
                        accessibilityLabel={`Open ${selected.title} on Sefaria`}
                        accessibilityRole="link"
                        onPress={() =>
                          void Linking.openURL(selected.hebrewReview.sourceUrl)
                        }
                        className="min-h-11 self-start flex-row items-center gap-2 rounded-md bg-primary px-4 py-2"
                      >
                        <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-primary-foreground font-heading">
                          Open on Sefaria
                        </Text>
                        <ExternalLink size={16} color={colors.onAccent} />
                      </Button>
                    </View>
                  ) : null}
                  {readerTokens.map((token) => (
                    <View
                      key={token.id}
                      className="gap-6 border-t border-t-hairline pt-6"
                    >
                      {token.hebrew ? (
                        <Text
                          variant="section"
                          accessibilityHint="Hold to choose a Hebrew quote"
                          onLongPress={() =>
                            setQuoteSource({
                              prayerId: selected.id,
                              title: selected.title,
                              text: token.hebrew,
                              sourceRef: selected.hebrewReview.sourceRef,
                              sourceUrl: selected.hebrewReview.sourceUrl,
                              language: "he",
                            })
                          }
                          className="font-hebrew-heading font-semibold text-right text-[33px] leading-[50px] text-foreground"
                        >
                          {token.hebrew}
                        </Text>
                      ) : null}
                      {token.localizedTransliteration ? (
                        <View className="gap-1 border-l-[2px] border-l-gold pl-3">
                          <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-inkFaint font-label">
                            Transliteration
                          </Text>
                          <Text
                            variant="section"
                            className="text-[17px] leading-[24px] text-foreground"
                          >
                            {token.localizedTransliteration}
                          </Text>
                        </View>
                      ) : null}
                      <View className="gap-1">
                        <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-inkFaint font-label">
                          Translation
                        </Text>
                        <Text
                          variant="body"
                          onLongPress={() =>
                            setQuoteSource({
                              prayerId: selected.id,
                              title: selected.title,
                              text: token.localizedTranslation,
                              sourceRef: selected.hebrewReview.sourceRef,
                              sourceUrl: selected.hebrewReview.sourceUrl,
                              language: primaryLanguageCode,
                            })
                          }
                        >
                          {token.localizedTranslation}
                        </Text>
                        {token.localizedTranslation.trim() ? (
                          <Button
                            variant="ghost"
                            size="content"
                            accessibilityLabel={`Choose a quote from line ${readerTokens.indexOf(token) + 1}`}
                            onPress={() =>
                              setQuoteSource({
                                prayerId: selected.id,
                                title: selected.title,
                                text: token.localizedTranslation,
                                sourceRef: selected.hebrewReview.sourceRef,
                                sourceUrl: selected.hebrewReview.sourceUrl,
                                language: primaryLanguageCode,
                              })
                            }
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              minHeight: 44,
                              alignSelf: "flex-start",
                            }}
                          >
                            <Quote size={16} color={colors.blue} />
                            <Text style={{ fontSize: 13, color: colors.blue }}>
                              Choose a quote
                            </Text>
                          </Button>
                        ) : null}
                      </View>
                    </View>
                  ))}
                  {selected.sourceMetadata?.sourceVersion ? (
                    <View className="gap-1 border-t border-t-hairline pt-4">
                      <Text variant="caption">Text source</Text>
                      <Text variant="body" className="text-foreground">
                        {selected.sourceMetadata.work}
                      </Text>
                      <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground font-label">
                        {selected.sourceMetadata.sourceVersion.versionTitle} ·{" "}
                        {selected.sourceMetadata.sourceVersion.license}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
            {focusPromptOpen ? (
              <View
                accessibilityViewIsModal
                className="absolute left-0 right-0 top-0 bottom-0 z-[30] justify-end p-3 bg-[rgba(17,20,18,0.32)]"
              >
                <Card className="p-6 gap-4 rounded-lg bg-card shadow-card">
                  <View className="w-11 h-11 rounded-sm items-center justify-center bg-primary">
                    <MoonStar size={20} color={colors.onAccent} />
                  </View>
                  <View className="gap-1">
                    <Text variant="caption">Prayer Focus</Text>
                    <Text
                      variant="section"
                      className="text-[21px] leading-[27px]"
                    >
                      Begin without interruption
                    </Text>
                    <Text variant="body" className="text-muted-foreground">
                      Quiet the phone before the first word. Kavanah cannot
                      change system Focus without your approval.
                    </Text>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Button
                        variant="outline"
                        size="content"
                        accessibilityRole="button"
                        onPress={() => setFocusPromptOpen(false)}
                        className="min-h-[50px] items-center justify-center rounded-md border border-hairlineStrong bg-card"
                      >
                        <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
                          Continue
                        </Text>
                      </Button>
                    </View>
                    <View className="flex-1">
                      <Button
                        variant="default"
                        size="content"
                        accessibilityRole="button"
                        haptic="confirm"
                        onPress={() => void openFocusSettings()}
                        className="min-h-[50px] px-2 items-center justify-center rounded-md bg-primary"
                      >
                        <Text
                          numberOfLines={2}
                          className="text-[12px] leading-[16px] font-medium tracking-normal text-primary-foreground text-center font-label"
                        >
                          {focusSetup.actionLabel}
                        </Text>
                      </Button>
                    </View>
                  </View>
                  {focusPromptMessage ? (
                    <Text
                      variant="body"
                      className="text-danger text-[13px] leading-[18px]"
                    >
                      {focusPromptMessage}
                    </Text>
                  ) : null}
                </Card>
              </View>
            ) : null}
            <GuidedPrayer
              prayerTitle={selected?.title ?? "Prayer"}
              guide={selected ? prayerReadingGuide(selected) : undefined}
              scopeNote={selected ? prayerScopeNote(selected) : undefined}
              language={findLanguage(primaryLanguageCode).name}
              explanationContext={
                selected
                  ? buildPrayerAssistantContext(
                      selected,
                      primaryLanguageCode,
                      readerTokens,
                    )
                  : undefined
              }
              onGuideSource={() => {
                const url = selected
                  ? prayerReadingGuide(selected).source
                  : undefined;
                if (url) void Linking.openURL(url);
              }}
              tokens={guidedTokens}
              visible={guidedPrayerOpen && !selectedLoading && !prayerLoadError}
              onClose={closeReader}
              onDetails={() => setGuidedPrayerOpen(false)}
              onBookmark={() => selected && toggleBookmark(selected.id)}
              bookmarked={selectedBookmarked}
              reviewPending={selected?.hebrewReview.status !== "approved"}
              completionBlockedReason={availability(selectedPractice).reason}
              onComplete={completeGuidedPrayer}
              onQuote={(token) => {
                if (selected)
                  setQuoteSource({
                    prayerId: selected.id,
                    title: selected.title,
                    text: token.translation || token.hebrew,
                    sourceRef: selected.hebrewReview.sourceRef,
                    sourceUrl: selected.hebrewReview.sourceUrl,
                    language: token.translation ? primaryLanguageCode : "he",
                  });
              }}
            />
            {completionMoment ? (
              <PrayerCompletionPrompt
                enabled={shareAfterPrayer}
                onEnabledChange={setShareAfterPrayer}
                onShare={() => {
                  if (Platform.OS === "ios")
                    pendingShare.current = completionMoment;
                  else setShareMoment(completionMoment);
                  setCompletionMoment(null);
                  closeReader();
                }}
                onDismiss={() => {
                  setCompletionMoment(null);
                  closeReader();
                }}
              />
            ) : null}
            {quoteSource && (
              <QuoteSelector
                source={quoteSource}
                onClose={() => setQuoteSource(null)}
                onViewCircle={() => {
                  closeReader();
                  router.push("/circle");
                }}
              />
            )}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
      <PracticeStoryComposer
        moment={shareMoment}
        onClose={() => setShareMoment(null)}
      />
    </Screen>
  );
}

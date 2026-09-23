import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from "@react-navigation/native";
import {
  Bookmark,
  BookmarkCheck,
  BookmarkMinus,
  BookOpenCheck,
  ChevronRight,
  ExternalLink,
  MoonStar,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Modal,
  ScrollView,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  GuidedPrayer,
  type GuidedPrayerToken,
} from "@/components/GuidedPrayer";
import { PrayerCard } from "@/components/PrayerCard";
import { PrayerAssistantPanel } from "@/components/PrayerAssistantPanel";
import {
  PracticeStoryComposer,
  type PracticeStoryMoment,
} from "@/components/PracticeStoryComposer";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colors, grid, spacing } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { RootTabParamList } from "@/navigation/RootNavigator";
import { buildPrayerAssistantContext } from "@/services/assistantContext";
import {
  createAssistantStream,
  type AssistantMessage,
} from "@/services/assistantService";
import { confirmHaptic } from "@/services/haptics";
import {
  localizeHebrewTransliteration,
  translatePrayerText,
} from "@/services/localizationService";
import {
  getPrayerFocusSetup,
  openPrayerFocusSetup,
} from "@/services/prayerFocus";
import { usePrayerStore } from "@/store/prayerStore";
import { useStreakStore, type StreakHabit } from "@/store/streakStore";
import { useSocialStore } from "@/store/socialStore";
import {
  CURRENT_ASSISTANT_CONSENT_VERSION,
  useSettingsStore,
} from "@/store/settingsStore";
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
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NavigationProp<RootTabParamList, "Prayer">>();
  const route = useRoute<RouteProp<RootTabParamList, "Prayer">>();
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
  const completeHabit = useStreakStore((state) => state.completeHabit);
  const publishMilestone = useSocialStore((state) => state.publishMilestone);
  const primaryLanguageCode = useSettingsStore(
    (state) => state.primaryLanguageCode,
  );
  const assistantConsentVersion = useSettingsStore(
    (state) => state.assistantConsentVersion,
  );
  const setAssistantConsent = useSettingsStore(
    (state) => state.setAssistantConsent,
  );
  const prayerFocusEnabled = useSettingsStore(
    (state) => state.prayerFocusEnabled,
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
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<
    AssistantMessage[]
  >([]);
  const [isAssistantStreaming, setIsAssistantStreaming] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [localizedPrayer, setLocalizedPrayer] =
    useState<LocalizedPrayer | null>(null);
  const reduceMotion = useReducedMotion();
  const selected =
    prayers.find((prayer) => prayer.id === selectedPrayerId) ?? prayers[0];
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
  const visibleResults = showResults ? results.slice(0, 18) : [];
  const bookmarkReveal = useRef(
    new Animated.Value(showResults ? 0 : 1),
  ).current;
  const focusSetup = getPrayerFocusSetup();

  useEffect(() => {
    const linkedQuery = route.params?.query?.trim();
    if (linkedQuery) setQuery(linkedQuery);
    const linkedPrayerId = route.params?.prayerId?.trim();
    if (linkedPrayerId) {
      void selectPrayer(linkedPrayerId);
      setGuidedPrayerOpen(false);
      setAssistantOpen(false);
      setAssistantInput("");
      setAssistantMessages([]);
      setReaderOpen(true);
      setFocusPromptMessage("");
      setFocusPromptOpen(false);
    }
  }, [
    prayerFocusEnabled,
    route.params?.prayerId,
    route.params?.query,
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
    setGuidedPrayerOpen(false);
    setAssistantOpen(false);
    setAssistantInput("");
    setAssistantMessages([]);
    setReaderOpen(true);
    setFocusPromptMessage("");
    setFocusPromptOpen(false);
  };

  const closeReader = () => {
    setGuidedPrayerOpen(false);
    setFocusPromptOpen(false);
    setReaderOpen(false);
    if (route.params?.prayerId) {
      navigation.setParams({ prayerId: "" });
    }
  };

  const openFocusSettings = async () => {
    const opened = await openPrayerFocusSetup();
    if (opened) {
      setFocusPromptOpen(false);
      return;
    }
    setFocusPromptMessage(
      "Open your device settings and choose Focus or Do Not Disturb.",
    );
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
  }));

  const startGuidedPrayer = () => {
    setGuidedPrayerOpen(true);
    if (prayerFocusEnabled) void openPrayerFocusSetup();
  };

  const completeGuidedPrayer = () => {
    if (!selected) return;
    const completedAt = new Date();
    recordCompletion(selected, completedAt);
    const habit = habitForPrayer(selected);
    if (habit) completeHabit(habit, completedAt);
    const streak = habit
      ? (useStreakStore.getState().habits.find((item) => item.habit === habit)
          ?.streak ?? 0)
      : 0;
    if (habit && [3, 7, 18, 40, 100].includes(streak)) {
      publishMilestone(habit, streak);
    }
    setGuidedPrayerOpen(false);
    setCompletionMoment({
      ...(habit ? { habit } : {}),
      prayerTitle: selected.title,
      streak,
      completedAt,
    });
    void confirmHaptic();
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

    const userMessage: AssistantMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: clean,
      createdAt: new Date().toISOString(),
    };
    const assistantId = `${Date.now()}-assistant`;
    setAssistantMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      },
    ]);

    const context = buildPrayerAssistantContext(
      selected,
      primaryLanguageCode,
      localizedTokens,
    );

    try {
      for await (const chunk of createAssistantStream(clean, context)) {
        setAssistantMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: `${message.content}${chunk}` }
              : message,
          ),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The assistant could not answer right now.";
      setAssistantMessages((current) =>
        current.map((item) =>
          item.id === assistantId ? { ...item, content: message } : item,
        ),
      );
    } finally {
      setIsAssistantStreaming(false);
    }
  };

  return (
    <Screen largeTitle="Prayers" subtitle="Find a prayer for this moment.">
      <View className="gap-6">
        <View className="min-h-[62px] flex-row items-center gap-3 rounded-lg border border-hairline bg-card pl-5 pr-2">
          <Search size={18} color={colors.inkMuted} />
          <Input
            accessibilityLabel="Search prayers"
            value={query}
            onChangeText={setQuery}
            placeholders={[
              "Search for travel…",
              "Search for Shema…",
              "Search for protection…",
            ]}
            className="h-auto min-h-[56px] flex-1 w-auto border-0 bg-transparent px-0 shadow-none"
            placeholderTextColor={colors.inkMuted}
          />
          <Button
            variant="secondary"
            size="content"
            accessibilityLabel="Refresh prayer library"
            accessibilityRole="button"
            onPress={() => void sync()}
            disabled={isSyncing}
            className="w-11 h-11 rounded-full items-center justify-center bg-muted"
          >
            <RefreshCw
              size={18}
              color={
                isSyncing || isSearchingRemote ? colors.inkMuted : colors.ink
              }
            />
          </Button>
        </View>

        <Animated.View
          pointerEvents={showResults ? "none" : "auto"}
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
            <View className="border-t border-t-hairlineStrong">
              {bookmarkedPrayers.length > 0 ? (
                bookmarkedPrayers.map((prayer) => (
                  <View
                    key={prayer.id}
                    className="border-b border-b-hairline flex-row items-center overflow-hidden"
                  >
                    <View className="flex-1">
                      <Button
                        variant="ghost"
                        size="content"
                        accessibilityLabel={`Open ${prayer.title}`}
                        accessibilityRole="button"
                        onPress={() => void openPrayer(prayer.id)}
                        className="px-1 py-4"
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
                        <BookmarkMinus size={18} color={colors.blue} />
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

        {showResults ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text variant="caption">
                {isSearchingRemote ? "Searching Sefaria" : "Results"}
              </Text>
              <Text variant="body" className="text-[13px] leading-[18px]">
                {visibleResults.length} found
              </Text>
            </View>
            {visibleResults.length > 0 ? (
              visibleResults.map((result) => (
                <PrayerCard
                  key={result.prayer.id}
                  prayer={result.prayer}
                  selected={false}
                  onPress={() => void openPrayer(result.prayer.id)}
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

      <Modal
        visible={readerOpen && Boolean(selected)}
        animationType={reduceMotion ? "none" : "slide"}
        presentationStyle="fullScreen"
        onRequestClose={closeReader}
      >
        <SafeAreaView className="flex-1 bg-background">
          {selected ? (
            <View
              className="absolute left-6 right-6 z-[10] flex-row justify-between"
              style={{ top: insets.top + spacing.lg }}
              pointerEvents="box-none"
            >
              <Button
                variant="ghost"
                size="content"
                accessibilityLabel="Close prayer"
                accessibilityRole="button"
                onPress={closeReader}
                pressedScale={0.94}
                className="w-11 h-11 rounded-md items-center justify-center bg-glass border border-hairline shadow-card"
              >
                <X size={17} color={colors.ink} />
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
                pressedScale={0.94}
                className={cn(
                  "w-11 h-11 rounded-md items-center justify-center bg-glass border border-hairline shadow-card",
                  selectedBookmarked && "bg-primary border-primary",
                )}
              >
                {selectedBookmarked ? (
                  <BookmarkCheck size={17} color={colors.white} />
                ) : (
                  <Bookmark size={17} color={colors.gold} />
                )}
              </Button>
            </View>
          ) : null}
          <ScrollView
            contentContainerClassName={cn("px-[22px] pb-[72px]")}
            contentContainerStyle={[
              { paddingTop: insets.top + grid.touch + spacing.xxl },
            ]}
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
                      <Text variant="caption">
                        {hebrewContentLabel(selected.hebrewReview.contentKind)}
                      </Text>
                      <Text
                        variant="body"
                        className="text-muted-foreground text-[14px] leading-[20px]"
                      >
                        {hebrewReviewMessage(selected.hebrewReview.contentKind)}
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
                  <Button
                    variant="ghost"
                    size="content"
                    accessibilityHint="Shows one prayer line at a time"
                    accessibilityLabel="Start guided reading"
                    accessibilityRole="button"
                    haptic="confirm"
                    onPress={startGuidedPrayer}
                    className="min-h-[74px] flex-row items-center gap-3 py-3 border-t border-b border-hairline"
                  >
                    <View className="w-[42px] h-[42px] rounded-sm items-center justify-center bg-accent">
                      <BookOpenCheck size={19} color={colors.blue} />
                    </View>
                    <View className="flex-1 gap-[2px]">
                      <Text
                        variant="section"
                        className="text-[17px] leading-[22px]"
                      >
                        Read line by line
                      </Text>
                      <Text
                        variant="body"
                        className="text-[13px] leading-[18px] text-muted-foreground"
                      >
                        Hebrew, pronunciation, and meaning at your pace.
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.inkMuted} />
                  </Button>
                ) : null}
                {selectedLoading ? (
                  <View className="min-h-24 flex-row items-center gap-3 border-t border-t-hairline border-b border-b-hairline py-4">
                    <ActivityIndicator size="small" color={colors.blue} />
                    <View className="flex-1 gap-1">
                      <Text
                        variant="section"
                        className="text-[17px] leading-[22px]"
                      >
                        Preparing the text
                      </Text>
                      <Text
                        variant="body"
                        className="text-[14px] leading-[20px] text-muted-foreground"
                      >
                        Loading a reusable Hebrew edition and translation from
                        Sefaria.
                      </Text>
                    </View>
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
                      <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-white font-heading">
                        Open on Sefaria
                      </Text>
                      <ExternalLink size={16} color={colors.white} />
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
                      <Text variant="body">{token.localizedTranslation}</Text>
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
                <PrayerAssistantPanel
                  input={assistantInput}
                  isOpen={assistantOpen}
                  isStreaming={isAssistantStreaming}
                  messages={assistantMessages}
                  onChangeInput={setAssistantInput}
                  onSubmit={() => void askAboutSelectedPrayer()}
                />
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
                  <MoonStar size={22} color={colors.white} />
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
                    Quiet the phone before the first word. Kavanah cannot change
                    system Focus without your approval.
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
                        className="text-[12px] leading-[16px] font-medium tracking-normal text-white text-center font-label"
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
          {consentModalOpen ? (
            <View className="absolute left-0 right-0 top-0 bottom-0 z-[30] justify-end p-3 pb-12 bg-[rgba(11,13,16,0.28)]">
              <View className="p-4 pb-6 gap-2 rounded-lg bg-card shadow-card border border-hairline">
                <View className="w-11 h-11 rounded-full items-center justify-center bg-accent">
                  <ShieldCheck size={21} color={colors.blue} />
                </View>
                <Text variant="section">Before your first question</Text>
                <Text variant="body">
                  Your question, this prayer text, language, source reference,
                  and review status are sent to OpenAI through Kavanah. Display
                  translations are identified as unreviewed. Contact details are
                  removed first. Do not include anything private.
                </Text>
                <Text
                  variant="body"
                  className="text-[13px] leading-[19px] text-muted-foreground"
                >
                  Answers are educational and are not binding halachic rulings.
                </Text>
                <View className="flex-row items-stretch gap-2 mt-2">
                  <View className="flex-1">
                    <Button
                      variant="ghost"
                      size="content"
                      accessibilityRole="button"
                      onPress={() => setConsentModalOpen(false)}
                      className="min-h-12 items-center justify-center rounded-md border border-hairlineStrong"
                    >
                      <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
                        Not now
                      </Text>
                    </Button>
                  </View>
                  <View className="flex-[1.4]">
                    <Button
                      variant="default"
                      size="content"
                      accessibilityRole="button"
                      onPress={() => {
                        const question = assistantInput.trim();
                        setAssistantConsent(true);
                        setConsentModalOpen(false);
                        void submitAssistantQuestion(question);
                      }}
                      className="min-h-12 items-center justify-center rounded-full bg-primary"
                    >
                      <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-white font-heading">
                        Allow and ask
                      </Text>
                    </Button>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
          <GuidedPrayer
            prayerTitle={selected?.title ?? "Prayer"}
            tokens={guidedTokens}
            visible={guidedPrayerOpen}
            onClose={() => setGuidedPrayerOpen(false)}
            onComplete={completeGuidedPrayer}
          />
          {completionMoment ? (
            <View
              accessibilityViewIsModal
              className="absolute left-0 right-0 top-0 bottom-0 z-[50] justify-end p-3 bg-[rgba(17,20,18,0.36)]"
            >
              <Card className="p-6 gap-5 rounded-xl bg-card shadow-card">
                <View className="w-12 h-12 rounded-full items-center justify-center bg-primary">
                  <BookOpenCheck size={23} color={colors.white} />
                </View>
                <View className="gap-1">
                  <Text variant="caption">Prayer complete</Text>
                  <Text
                    variant="section"
                    className="text-[24px] leading-[30px]"
                  >
                    Beautiful work showing up.
                  </Text>
                  <Text variant="body" className="text-muted-foreground">
                    {completionMoment.habit
                      ? `Saved to your history and today's ${completionMoment.habit} practice.`
                      : "Saved to your private prayer history."}
                  </Text>
                </View>
                <View className="gap-3">
                  <Button
                    variant="default"
                    size="content"
                    accessibilityRole="button"
                    onPress={() => {
                      setShareMoment(completionMoment);
                      setCompletionMoment(null);
                      closeReader();
                    }}
                    className="min-h-[52px] rounded-md flex-row items-center justify-center gap-2 bg-primary"
                  >
                    <Share2 size={18} color={colors.white} />
                    <Text className="text-[16px] leading-[22px] font-semibold text-white font-heading">
                      Share this moment
                    </Text>
                  </Button>
                  <Button
                    variant="ghost"
                    size="content"
                    accessibilityRole="button"
                    onPress={() => {
                      setCompletionMoment(null);
                      closeReader();
                    }}
                    className="min-h-11 items-center justify-center"
                  >
                    <Text variant="section" className="text-[15px]">
                      Done
                    </Text>
                  </Button>
                </View>
              </Card>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
      <PracticeStoryComposer
        moment={shareMoment}
        onClose={() => setShareMoment(null)}
      />
    </Screen>
  );
}

function habitForPrayer(prayer: {
  id: string;
  title: string;
  category: string;
  tags: string[];
}): StreakHabit | undefined {
  const searchable =
    `${prayer.id} ${prayer.title} ${prayer.tags.join(" ")}`.toLowerCase();
  if (prayer.category === "tefillin" || searchable.includes("tefillin"))
    return "tefillin";
  if (
    prayer.category === "study" ||
    searchable.includes("study") ||
    searchable.includes("learning")
  )
    return "study";
  if (
    searchable.includes("shacharit") ||
    searchable.includes("morning service")
  )
    return "shacharit";
  if (searchable.includes("mincha") || searchable.includes("afternoon service"))
    return "mincha";
  if (
    searchable.includes("maariv") ||
    searchable.includes("arvit") ||
    searchable.includes("evening service")
  )
    return "maariv";
  return undefined;
}

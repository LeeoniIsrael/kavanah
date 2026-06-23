import { Bookmark, BookmarkCheck, RefreshCw, Search, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Card } from "@/components/Card";
import { PrayerCard } from "@/components/PrayerCard";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, radii, spacing, type } from "@/design/theme";
import { usePrayerStore } from "@/store/prayerStore";

export function PrayerScreen(): React.JSX.Element {
  const { prayers, results, selectedPrayerId, query, isSyncing, isSearchingRemote, bookmarkedPrayerIds, setQuery, searchRemote, selectPrayer, toggleBookmark, sync } = usePrayerStore();
  const [readerOpen, setReaderOpen] = useState(false);
  const selected = prayers.find((prayer) => prayer.id === selectedPrayerId) ?? prayers[0];
  const bookmarkedPrayers = bookmarkedPrayerIds.map((id) => prayers.find((prayer) => prayer.id === id)).filter((prayer): prayer is NonNullable<typeof prayer> => Boolean(prayer));
  const selectedBookmarked = selected ? bookmarkedPrayerIds.includes(selected.id) : false;
  const showResults = query.trim().length > 0;
  const visibleResults = showResults ? results : [];

  useEffect(() => {
    const handle = setTimeout(() => {
      void searchRemote(query);
    }, 450);
    return () => clearTimeout(handle);
  }, [query, searchRemote]);

  const openPrayer = async (id: string) => {
    await selectPrayer(id);
    setReaderOpen(true);
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
                <Body style={styles.bookmarkChipMeta}>{prayer.category}</Body>
              </AnimatedPressable>
            ))
          ) : (
            <Body>Tap the bookmark on any prayer to keep it here.</Body>
          )}
        </View>
      </Card>

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

      <Modal visible={readerOpen && Boolean(selected)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReaderOpen(false)}>
        <SafeAreaView style={styles.readerSafeArea}>
          <ScrollView contentContainerStyle={styles.readerContent} showsVerticalScrollIndicator={false}>
            {selected ? (
              <Card accent="gold" style={styles.reader}>
                <View style={styles.readerHeaderRow}>
                  <AnimatedPressable accessibilityRole="button" onPress={() => setReaderOpen(false)} style={styles.closeButton}>
                    <X size={20} color={colors.ink} />
                  </AnimatedPressable>
                  <AnimatedPressable accessibilityRole="button" onPress={() => toggleBookmark(selected.id)} style={[styles.readerBookmark, selectedBookmarked && styles.readerBookmarkActive]}>
                    {selectedBookmarked ? <BookmarkCheck size={21} color={colors.white} /> : <Bookmark size={21} color={colors.gold} />}
                  </AnimatedPressable>
                </View>
                <View style={styles.readerHeader}>
                  <Label>{selected.source}</Label>
                  <Display style={styles.readerDisplay}>{selected.title}</Display>
                  <Body>{selected.summary}</Body>
                </View>
                {selected.tokens.map((token) => (
                  <View key={token.id} style={styles.token}>
                    {token.hebrew ? <SectionTitle style={styles.hebrew}>{token.hebrew}</SectionTitle> : null}
                    {token.transliteration ? (
                      <View style={styles.transliterationPill}>
                        <SectionTitle style={styles.transliteration}>{token.transliteration}</SectionTitle>
                      </View>
                    ) : null}
                    <Body>{token.translation}</Body>
                  </View>
                ))}
              </Card>
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
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueSoft
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
  bookmarkShelf: {
    gap: spacing.md
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
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  bookmarkChipText: {
    fontSize: 16,
    lineHeight: 21
  },
  bookmarkChipMeta: {
    fontSize: 12,
    lineHeight: 17,
    textTransform: "capitalize"
  },
  readerSafeArea: {
    flex: 1,
    backgroundColor: colors.parchment
  },
  readerContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl
  },
  reader: {
    gap: spacing.lg,
    padding: spacing.xl
  },
  readerHeaderRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    justifyContent: "space-between"
  },
  readerHeader: {
    gap: 4
  },
  closeButton: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.vellum,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  readerBookmark: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.goldSoft
  },
  readerBookmarkActive: {
    backgroundColor: colors.gold
  },
  readerDisplay: {
    fontSize: 34,
    lineHeight: 39
  },
  token: {
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: spacing.lg
  },
  hebrew: {
    textAlign: "right",
    fontSize: 28,
    lineHeight: 42,
    color: colors.ink
  },
  transliterationPill: {
    alignSelf: "flex-start",
    borderRadius: radii.md,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  transliteration: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink
  }
});

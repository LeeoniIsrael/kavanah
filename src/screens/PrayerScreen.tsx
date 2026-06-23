import { Bookmark, BookmarkCheck, RefreshCw, Search } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Card } from "@/components/Card";
import { PrayerCard } from "@/components/PrayerCard";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, radii, spacing, type } from "@/design/theme";
import { usePrayerStore } from "@/store/prayerStore";

export function PrayerScreen(): React.JSX.Element {
  const { prayers, results, selectedPrayerId, query, isSyncing, isSearchingRemote, bookmarkedPrayerIds, setQuery, searchRemote, selectPrayer, toggleBookmark, sync } = usePrayerStore();
  const selected = prayers.find((prayer) => prayer.id === selectedPrayerId) ?? prayers[0];
  const bookmarkedPrayers = bookmarkedPrayerIds.map((id) => prayers.find((prayer) => prayer.id === id)).filter((prayer): prayer is NonNullable<typeof prayer> => Boolean(prayer));
  const selectedBookmarked = selected ? bookmarkedPrayerIds.includes(selected.id) : false;

  useEffect(() => {
    const handle = setTimeout(() => {
      void searchRemote(query);
    }, 450);
    return () => clearTimeout(handle);
  }, [query, searchRemote]);

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.lightLine} />
        <Label>Intent search</Label>
        <Display>Find the words</Display>
        <Body>Search by need, phrase, English, Hebrew, or transliteration.</Body>
      </View>

      <Card accent="gold" style={styles.bookmarkShelf}>
        <View style={styles.sectionHeader}>
          <View>
            <Label>Bookmarked</Label>
            <SectionTitle>Ready when you are</SectionTitle>
          </View>
          <BookmarkCheck size={20} color={colors.gold} />
        </View>
        <View style={styles.bookmarkList}>
          {bookmarkedPrayers.length > 0 ? (
            bookmarkedPrayers.map((prayer) => (
              <AnimatedPressable key={prayer.id} onPress={() => void selectPrayer(prayer.id)} style={[styles.bookmarkChip, prayer.id === selectedPrayerId && styles.bookmarkChipSelected]}>
                <SectionTitle style={styles.bookmarkChipText}>{prayer.title}</SectionTitle>
                <Body style={styles.bookmarkChipMeta}>{prayer.category}</Body>
              </AnimatedPressable>
            ))
          ) : (
            <Body>Tap the bookmark on any prayer to keep it here.</Body>
          )}
        </View>
      </Card>

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

      <View style={styles.resultStack}>
        {results.map((result) => (
          <PrayerCard key={result.prayer.id} prayer={result.prayer} selected={result.prayer.id === selectedPrayerId} onPress={() => selectPrayer(result.prayer.id)} />
        ))}
      </View>

      {selected ? (
        <Card accent="gold" style={styles.reader}>
          <View style={styles.readerHeaderRow}>
            <View style={styles.readerHeader}>
              <Label>{selected.source}</Label>
              <SectionTitle style={styles.readerTitle}>{selected.title}</SectionTitle>
              <Body>{selected.summary}</Body>
            </View>
            <AnimatedPressable accessibilityRole="button" onPress={() => toggleBookmark(selected.id)} style={[styles.readerBookmark, selectedBookmarked && styles.readerBookmarkActive]}>
              {selectedBookmarked ? <BookmarkCheck size={21} color={colors.white} /> : <Bookmark size={21} color={colors.gold} />}
            </AnimatedPressable>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  lightLine: {
    width: 64,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.blue,
    marginBottom: spacing.sm
  },
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
  bookmarkChipSelected: {
    borderColor: "rgba(181,138,42,0.45)",
    backgroundColor: colors.goldSoft
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
  reader: {
    gap: spacing.lg,
    padding: spacing.xl
  },
  readerHeaderRow: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-start"
  },
  readerHeader: {
    flex: 1,
    gap: 4
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
  readerTitle: {
    fontSize: 25,
    lineHeight: 31
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

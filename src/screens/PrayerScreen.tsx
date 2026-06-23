import { RefreshCw, Search } from "lucide-react-native";
import { StyleSheet, TextInput, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Card } from "@/components/Card";
import { PrayerCard } from "@/components/PrayerCard";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, radii, spacing, type } from "@/design/theme";
import { usePrayerStore } from "@/store/prayerStore";

export function PrayerScreen(): React.JSX.Element {
  const { prayers, results, selectedPrayerId, query, isSyncing, setQuery, selectPrayer, sync } = usePrayerStore();
  const selected = prayers.find((prayer) => prayer.id === selectedPrayerId) ?? prayers[0];

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.lightLine} />
        <Label>Intent search</Label>
        <Display>Find the words</Display>
        <Body>Search by need, phrase, English, Hebrew, or transliteration.</Body>
      </View>

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
          <RefreshCw size={18} color={isSyncing ? colors.inkMuted : colors.ink} />
        </AnimatedPressable>
      </View>

      <View style={styles.resultStack}>
        {results.map((result) => (
          <PrayerCard key={result.prayer.id} prayer={result.prayer} selected={result.prayer.id === selectedPrayerId} onPress={() => selectPrayer(result.prayer.id)} />
        ))}
      </View>

      {selected ? (
        <Card accent="gold" style={styles.reader}>
          <View style={styles.readerHeader}>
            <Label>{selected.source}</Label>
            <SectionTitle style={styles.readerTitle}>{selected.title}</SectionTitle>
          </View>
          {selected.tokens.map((token) => (
            <View key={token.id} style={styles.token}>
              <SectionTitle style={styles.hebrew}>{token.hebrew}</SectionTitle>
              <View style={styles.transliterationPill}>
                <SectionTitle style={styles.transliteration}>{token.transliteration}</SectionTitle>
              </View>
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
  reader: {
    gap: spacing.lg,
    padding: spacing.xl
  },
  readerHeader: {
    gap: 4
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

import { RefreshCw, Search } from "lucide-react-native";
import { Pressable, TextInput, View } from "react-native";

import { PrayerCard } from "@/components/PrayerCard";
import { Screen } from "@/components/Screen";
import { Body, Label, Title } from "@/components/Text";
import { usePrayerStore } from "@/store/prayerStore";

export function PrayerScreen(): React.JSX.Element {
  const { prayers, results, selectedPrayerId, query, isSyncing, setQuery, selectPrayer, sync } = usePrayerStore();
  const selected = prayers.find((prayer) => prayer.id === selectedPrayerId) ?? prayers[0];

  return (
    <Screen>
      <View className="gap-2">
        <Label>Intent search</Label>
        <Title>Find the words</Title>
        <Body>Search by need, phrase, English, Hebrew, or transliteration.</Body>
      </View>

      <View className="flex-row items-center gap-3 rounded-lg border border-ink/10 bg-white px-4">
        <Search size={18} color="#6B7280" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="travel, shema, protection..."
          className="h-14 flex-1 text-base text-ink"
          placeholderTextColor="#8A8F98"
        />
        <Pressable accessibilityRole="button" onPress={() => void sync()} disabled={isSyncing}>
          <RefreshCw size={18} color={isSyncing ? "#8A8F98" : "#111827"} />
        </Pressable>
      </View>

      <View className="gap-3">
        {results.map((result) => (
          <PrayerCard key={result.prayer.id} prayer={result.prayer} selected={result.prayer.id === selectedPrayerId} onPress={() => selectPrayer(result.prayer.id)} />
        ))}
      </View>

      {selected ? (
        <View className="gap-5 rounded-lg bg-white p-5">
          <View>
            <Label>{selected.source}</Label>
            <Body className="text-2xl font-semibold text-ink">{selected.title}</Body>
          </View>
          {selected.tokens.map((token) => (
            <View key={token.id} className="gap-2 border-t border-ink/10 pt-5">
              <Body className="text-right text-2xl leading-10 text-ink">{token.hebrew}</Body>
              <Body className="font-medium text-ink">{token.transliteration}</Body>
              <Body>{token.translation}</Body>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

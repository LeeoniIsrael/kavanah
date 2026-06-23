import { Pressable, View } from "react-native";

import { Body, Label } from "@/components/Text";
import type { PrayerText } from "@/types/prayer";

type Props = {
  prayer: PrayerText;
  selected: boolean;
  onPress: () => void;
};

export function PrayerCard({ prayer, selected, onPress }: Props): React.JSX.Element {
  return (
    <Pressable onPress={onPress} className={`rounded-lg border p-4 ${selected ? "border-ink bg-white" : "border-ink/10 bg-white/50"}`}>
      <View className="gap-1">
        <Label>{prayer.category}</Label>
        <Body className="text-lg font-semibold text-ink">{prayer.title}</Body>
        <Body className="text-sm">{prayer.tokens[0]?.translation ?? prayer.sefariaRef}</Body>
      </View>
    </Pressable>
  );
}

import { Check, Snowflake } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Body, Label, Title } from "@/components/Text";
import { useStreakStore, type StreakHabit } from "@/store/streakStore";

const habitLabels: Record<StreakHabit, string> = {
  shacharit: "Shacharit",
  mincha: "Mincha",
  maariv: "Maariv",
  tefillin: "Tefillin",
  study: "Study"
};

export function HomeScreen(): React.JSX.Element {
  const { habits, completeHabit, useFreeze: consumeFreeze } = useStreakStore();

  return (
    <Screen>
      <View className="gap-2">
        <Label>Today</Label>
        <Title>Kavanah</Title>
        <Body>A quiet dashboard for prayer, time, learning, and consistency.</Body>
      </View>

      <View className="gap-3">
        {habits.map((habit) => (
          <View key={habit.habit} className="rounded-lg border border-ink/10 bg-white p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Body className="font-semibold text-ink">{habitLabels[habit.habit]}</Body>
                <Body className="text-sm">{habit.streak} day streak · {habit.freezes} freezes</Body>
              </View>
              <View className="flex-row gap-2">
                <Pressable accessibilityRole="button" onPress={() => consumeFreeze(habit.habit)} className="h-11 w-11 items-center justify-center rounded-full bg-mist">
                  <Snowflake size={18} color="#111827" />
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => completeHabit(habit.habit)} className="h-11 w-11 items-center justify-center rounded-full bg-ink">
                  <Check size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
            {habit.badges.length > 0 ? <Body className="mt-3 text-sm text-clay">{habit.badges.join(" · ")}</Body> : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

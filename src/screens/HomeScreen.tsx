import { Check, Snowflake } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, radii, spacing, type } from "@/design/theme";
import { confirmHaptic } from "@/services/haptics";
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
  const totalStreak = habits.reduce((sum, habit) => sum + habit.streak, 0);
  const leadingHabit = habits.reduce<(typeof habits)[number] | null>((best, habit) => (!best || habit.streak > best.streak ? habit : best), null);

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.lightLine} />
        <Label>Morning intention</Label>
        <Display>Kavanah</Display>
        <Body style={styles.heroCopy}>A calm place to begin, return, and keep the small promises that shape the day.</Body>
      </View>

      <Card accent="gold" style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Label>Today’s rhythm</Label>
            <SectionTitle>{leadingHabit ? habitLabels[leadingHabit.habit] : "Prayer"}</SectionTitle>
          </View>
          <View style={styles.scoreMark}>
            <Text style={styles.scoreNumber}>{totalStreak}</Text>
            <Text style={styles.scoreLabel}>days</Text>
          </View>
        </View>
        <Body>Mark only what is true. A streak should feel like evidence, not pressure.</Body>
      </Card>

      <View style={styles.habitStack}>
        {habits.map((habit) => (
          <Card key={habit.habit} accent={habit.habit === "tefillin" ? "blue" : "olive"} style={styles.habitCard}>
            <View style={styles.habitTop}>
              <View style={styles.habitText}>
                <SectionTitle>{habitLabels[habit.habit]}</SectionTitle>
                <Body>{habit.streak} day streak · {habit.freezes} freezes left</Body>
              </View>
              <View style={styles.actions}>
                <AnimatedPressable
                  accessibilityRole="button"
                  onPress={() => {
                    consumeFreeze(habit.habit);
                    void confirmHaptic();
                  }}
                  style={styles.iconButtonQuiet}
                >
                  <Snowflake size={18} color={colors.blue} />
                </AnimatedPressable>
                <AnimatedPressable
                  accessibilityRole="button"
                  onPress={() => {
                    completeHabit(habit.habit);
                    void confirmHaptic();
                  }}
                  style={styles.iconButton}
                >
                  <Check size={18} color={colors.white} />
                </AnimatedPressable>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(habit.streak * 9, 100)}%` }]} />
            </View>
            {habit.badges.length > 0 ? <Body style={styles.badges}>{habit.badges.join(" · ")}</Body> : null}
          </Card>
        ))}
      </View>
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
    backgroundColor: colors.gold,
    marginBottom: spacing.sm
  },
  heroCopy: {
    maxWidth: 310
  },
  summaryCard: {
    gap: spacing.md
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  scoreMark: {
    minWidth: 78,
    height: 78,
    borderRadius: radii.xl,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  scoreNumber: {
    ...type.data,
    color: colors.white
  },
  scoreLabel: {
    ...type.caption,
    color: colors.goldSoft,
    textTransform: "uppercase"
  },
  habitStack: {
    gap: spacing.md
  },
  habitCard: {
    gap: spacing.md
  },
  habitTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg
  },
  habitText: {
    flex: 1,
    gap: 4
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink
  },
  iconButtonQuiet: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueSoft
  },
  progressTrack: {
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.oliveSoft,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.pill,
    backgroundColor: colors.olive
  },
  badges: {
    color: colors.rose
  }
});

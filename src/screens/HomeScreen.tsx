import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { CalendarDays, Check, ChevronRight, MapPin, Search } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, radii, shadows, spacing, type } from "@/design/theme";
import type { RootTabParamList } from "@/navigation/RootNavigator";
import { confirmHaptic } from "@/services/haptics";
import { usePrayerStore } from "@/store/prayerStore";
import { useStreakStore, type StreakHabit } from "@/store/streakStore";
import { useZmanimStore } from "@/store/zmanimStore";
import type { Zman } from "@/types/zmanim";

type Navigation = BottomTabNavigationProp<RootTabParamList>;

const habitLabels: Record<StreakHabit, string> = {
  shacharit: "Shacharit",
  mincha: "Mincha",
  maariv: "Maariv",
  tefillin: "Tefillin",
  study: "Study"
};

const prayerMomentByZman: Partial<Record<Zman["key"], { query: string; label: string; helper: string }>> = {
  alotHashachar: { query: "modeh ani", label: "Begin", helper: "Modeh Ani" },
  sunrise: { query: "shacharit", label: "Morning prayer", helper: "Shacharit" },
  latestShema: { query: "shema", label: "Say Shema", helper: "Latest Shema" },
  latestTefilah: { query: "shacharit", label: "Open Shacharit", helper: "Latest Tefilah" },
  minchaGedolah: { query: "mincha", label: "Open Mincha", helper: "Afternoon prayer" },
  minchaKetana: { query: "mincha", label: "Open Mincha", helper: "Preferred window" },
  sunset: { query: "maariv", label: "Evening prayer", helper: "Maariv" },
  candleLighting: { query: "candle lighting", label: "Light candles", helper: "Shabbat" },
  havdalah: { query: "havdalah", label: "Havdalah", helper: "Close Shabbat" }
};

const shortcuts = [
  { label: "Prayer", query: "health" },
  { label: "Food", query: "food blessing" },
  { label: "Safety", query: "protection" }
];

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Navigation>();
  const { habits, completeHabit } = useStreakStore();
  const { zmanim, location, isLoading, refresh } = useZmanimStore();
  const { prayers, bookmarkedPrayerIds, setQuery } = usePrayerStore();
  const now = useMemo(() => new Date(), []);
  const nextZman = useMemo(() => findNextZman(zmanim, now), [zmanim, now]);
  const nextMoment = nextZman ? prayerMomentByZman[nextZman.key] ?? { query: nextZman.title, label: nextZman.title, helper: "Next moment" } : null;
  const completedToday = habits.filter((habit) => habit.completedDates.includes(formatDateKey(now)));
  const bookmark = bookmarkedPrayerIds.map((id) => prayers.find((prayer) => prayer.id === id)).find(Boolean);

  const openPrayerSearch = (query: string) => {
    setQuery(query);
    navigation.navigate("Prayer");
  };

  const markHabit = (habit: StreakHabit) => {
    completeHabit(habit);
    void confirmHaptic();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Label>{formatHebrewDate(now)}</Label>
          <Display>Today</Display>
        </View>
        <AnimatedPressable accessibilityRole="button" onPress={() => navigation.navigate("Zmanim")} style={styles.iconButton}>
          <CalendarDays size={19} color={colors.ink} />
        </AnimatedPressable>
      </View>

      <View style={styles.primaryPanel}>
        <View style={styles.panelTop}>
          <View style={styles.pulse} />
          <Text style={styles.panelMeta}>{nextZman ? timeUntil(nextZman.time) : "Location needed"}</Text>
        </View>
        <SectionTitle style={styles.panelTitle}>{nextZman ? nextZman.title : "Set your location"}</SectionTitle>
        <Text style={styles.panelTime}>{nextZman ? formatTime(nextZman.time) : "Local zmanim are off"}</Text>
        <Body style={styles.panelBody}>{nextZman ? `${nextMoment?.helper ?? "Next prayer moment"} · ${location?.label ?? "local time"}` : "Enable location once to calculate prayer times and Shabbat reminders."}</Body>
        <View style={styles.panelActions}>
          {nextMoment ? (
            <AnimatedPressable accessibilityRole="button" onPress={() => openPrayerSearch(nextMoment.query)} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>{nextMoment.label}</Text>
              <ChevronRight size={17} color={colors.white} />
            </AnimatedPressable>
          ) : (
            <AnimatedPressable accessibilityRole="button" onPress={() => void refresh()} disabled={isLoading} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>{isLoading ? "Finding" : "Use location"}</Text>
              <MapPin size={17} color={colors.white} />
            </AnimatedPressable>
          )}
          <AnimatedPressable accessibilityRole="button" onPress={() => navigation.navigate("Zmanim")} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Times</Text>
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.shortcutRow}>
        {shortcuts.map((shortcut) => (
          <View key={shortcut.label} style={styles.shortcutSlot}>
            <AnimatedPressable accessibilityRole="button" onPress={() => openPrayerSearch(shortcut.query)} style={styles.shortcut}>
              <Text style={styles.shortcutText}>{shortcut.label}</Text>
            </AnimatedPressable>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle style={styles.sectionTitle}>Momentum</SectionTitle>
          <Text style={styles.sectionMeta}>{completedToday.length}/5 today</Text>
        </View>
        <View style={styles.habitList}>
          {habits.map((habit) => {
            const complete = habit.completedDates.includes(formatDateKey(now));
            return (
              <AnimatedPressable key={habit.habit} accessibilityRole="button" onPress={() => markHabit(habit.habit)} style={styles.habitRow}>
                <View>
                  <Text style={styles.habitName}>{habitLabels[habit.habit]}</Text>
                  <Text style={styles.habitDetail}>{habit.streak} day streak</Text>
                </View>
                <View style={[styles.checkCircle, complete && styles.checkCircleDone]}>{complete ? <Check size={14} color={colors.white} /> : null}</View>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Saved</Text>
          <Text style={styles.infoTitle}>{bookmark?.title ?? "No prayer saved"}</Text>
          <Text style={styles.infoBody} numberOfLines={2}>
            {bookmark?.useCase ?? "Bookmark what you return to often."}
          </Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Ask</Text>
          <Text style={styles.infoTitle}>Today</Text>
          <Text style={styles.infoBody} numberOfLines={2}>
            Prayer, timing, or meaning.
          </Text>
        </View>
      </View>

      <AnimatedPressable accessibilityRole="button" onPress={() => openPrayerSearch("today")} style={styles.commandStrip}>
        <Search size={18} color={colors.blue} />
        <Text style={styles.commandText}>Search prayers for today</Text>
        <ChevronRight size={18} color={colors.inkMuted} />
      </AnimatedPressable>
    </Screen>
  );
}

function findNextZman(zmanim: Zman[], now: Date): Zman | null {
  return zmanim.find((zman) => zman.time.getTime() > now.getTime()) ?? zmanim[0] ?? null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function timeUntil(date: Date): string {
  const diff = Math.max(date.getTime() - Date.now(), 0);
  const totalMinutes = Math.round(diff / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

function formatHebrewDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric" }).format(date);
  } catch {
    return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  }
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  headerCopy: {
    gap: spacing.xs
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  primaryPanel: {
    borderRadius: radii.xl,
    backgroundColor: colors.ink,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.card
  },
  panelTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.blue
  },
  panelMeta: {
    ...type.caption,
    color: "rgba(255,255,255,0.66)"
  },
  panelTitle: {
    color: colors.white
  },
  panelTime: {
    ...type.display,
    fontSize: 40,
    lineHeight: 45,
    color: colors.white
  },
  panelBody: {
    color: "rgba(255,255,255,0.70)"
  },
  panelActions: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    marginTop: spacing.xs
  },
  primaryAction: {
    minHeight: 44,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  primaryActionText: {
    ...type.caption,
    color: colors.white
  },
  secondaryAction: {
    minHeight: 44,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryActionText: {
    ...type.caption,
    color: colors.white
  },
  shortcutRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  shortcutSlot: {
    flex: 1
  },
  shortcut: {
    minHeight: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  shortcutText: {
    ...type.caption,
    color: colors.ink
  },
  section: {
    gap: spacing.md
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26
  },
  sectionMeta: {
    ...type.caption,
    color: colors.inkMuted
  },
  habitList: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden"
  },
  habitRow: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline
  },
  habitName: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink
  },
  habitDetail: {
    ...type.caption,
    color: colors.inkMuted
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: "center",
    justifyContent: "center"
  },
  checkCircleDone: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  infoGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  infoBlock: {
    flex: 1,
    minHeight: 132,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    gap: spacing.xs
  },
  infoLabel: {
    ...type.caption,
    color: colors.inkMuted
  },
  infoTitle: {
    ...type.section,
    color: colors.ink
  },
  infoBody: {
    ...type.caption,
    color: colors.inkMuted,
    lineHeight: 18
  },
  commandStrip: {
    minHeight: 58,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  commandText: {
    ...type.body,
    flex: 1,
    fontWeight: "600",
    color: colors.ink
  }
});

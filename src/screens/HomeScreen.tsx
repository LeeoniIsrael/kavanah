import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { BookOpenText, CalendarDays, Check, ChevronRight, MapPin, Moon, Search, Snowflake, Sparkles, Sunrise, Waves } from "lucide-react-native";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, radii, spacing, type } from "@/design/theme";
import type { RootTabParamList } from "@/navigation/RootNavigator";
import { confirmHaptic } from "@/services/haptics";
import { usePrayerStore } from "@/store/prayerStore";
import { useStreakStore, type HabitProgress, type StreakHabit } from "@/store/streakStore";
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
  alotHashachar: { query: "modeh ani", label: "Begin gently", helper: "Modeh Ani" },
  sunrise: { query: "shacharit", label: "Open morning prayer", helper: "Shacharit" },
  latestShema: { query: "shema", label: "Say Shema", helper: "Latest Shema" },
  latestTefilah: { query: "shacharit", label: "Open Shacharit", helper: "Latest Tefilah" },
  minchaGedolah: { query: "mincha", label: "Open Mincha", helper: "Afternoon prayer" },
  minchaKetana: { query: "mincha", label: "Open Mincha", helper: "Preferred Mincha window" },
  sunset: { query: "maariv", label: "Open Maariv", helper: "Evening prayer" },
  candleLighting: { query: "candle lighting", label: "Open candles", helper: "Shabbat candles" },
  havdalah: { query: "havdalah", label: "Open Havdalah", helper: "Close Shabbat" }
};

const quickActions = [
  { label: "Prayer", query: "health", icon: BookOpenText, accent: colors.blue, helper: "Find what fits" },
  { label: "Food", query: "food blessing", icon: Sparkles, accent: colors.gold, helper: "Meals" },
  { label: "Protect", query: "protection", icon: Waves, accent: colors.olive, helper: "Travel/safety" }
];

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Navigation>();
  const { habits, completeHabit, useFreeze: consumeFreeze } = useStreakStore();
  const { zmanim, location, isLoading, refresh } = useZmanimStore();
  const { prayers, bookmarkedPrayerIds, setQuery } = usePrayerStore();
  const arc = useRef(new Animated.Value(0)).current;

  const now = useMemo(() => new Date(), []);
  const nextZman = useMemo(() => findNextZman(zmanim, now), [zmanim, now]);
  const nextMoment = nextZman ? prayerMomentByZman[nextZman.key] ?? { query: nextZman.title, label: "See this moment", helper: nextZman.title } : null;
  const hebrewDate = useMemo(() => formatHebrewDate(now), [now]);
  const leadingHabit = useMemo(() => habits.reduce<HabitProgress | null>((best, habit) => (!best || habit.streak > best.streak ? habit : best), null), [habits]);
  const completedToday = habits.filter((habit) => habit.completedDates.includes(formatDateKey(now)));
  const bookmark = bookmarkedPrayerIds.map((id) => prayers.find((prayer) => prayer.id === id)).find(Boolean);

  useEffect(() => {
    Animated.timing(arc, {
      toValue: nextZman ? progressThroughDay(nextZman.time) : 0.18,
      duration: 680,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: false
    }).start();
  }, [arc, nextZman]);

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
        <View>
          <Label>{hebrewDate}</Label>
          <Display style={styles.display}>Today</Display>
        </View>
        <AnimatedPressable accessibilityRole="button" onPress={() => navigation.navigate("Zmanim")} style={styles.headerButton}>
          <CalendarDays size={19} color={colors.ink} />
        </AnimatedPressable>
      </View>

      <Card accent="blue" style={styles.nowCard}>
        <View style={styles.nowLayout}>
          <View style={styles.dayArc}>
            <Sunrise size={17} color={colors.gold} />
            <View style={styles.arcRail}>
              <Animated.View style={[styles.arcFill, { height: arc.interpolate({ inputRange: [0, 1], outputRange: ["14%", "92%"] }) }]} />
              <Animated.View style={[styles.arcDot, { top: arc.interpolate({ inputRange: [0, 1], outputRange: ["14%", "92%"] }) }]} />
            </View>
            <Moon size={17} color={colors.blue} />
          </View>
          <View style={styles.nowText}>
            <Label>Now</Label>
            <SectionTitle style={styles.nowTitle}>{nextZman ? nextZman.title : "Local times are off"}</SectionTitle>
            <Text style={[styles.nowTime, !nextZman && styles.nowSetupText]}>{nextZman ? formatTime(nextZman.time) : "Set location"}</Text>
            <Body>{nextZman ? `${timeUntil(nextZman.time)} · ${nextMoment?.helper ?? "Next prayer moment"}` : "Enable local zmanim once, then this card becomes your daily compass."}</Body>
            <View style={styles.nowActions}>
              {nextMoment ? (
                <AnimatedPressable accessibilityRole="button" onPress={() => openPrayerSearch(nextMoment.query)} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{nextMoment.label}</Text>
                  <ChevronRight size={17} color={colors.white} />
                </AnimatedPressable>
              ) : (
                <AnimatedPressable accessibilityRole="button" onPress={() => void refresh()} disabled={isLoading} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{isLoading ? "Finding..." : "Use my location"}</Text>
                  <MapPin size={17} color={colors.white} />
                </AnimatedPressable>
              )}
              <AnimatedPressable accessibilityRole="button" onPress={() => navigation.navigate("Zmanim")} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>All times</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.quickGrid}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <View key={action.label} style={styles.quickColumn}>
              <AnimatedPressable accessibilityRole="button" onPress={() => openPrayerSearch(action.query)} style={styles.quickCard}>
                <View style={[styles.quickIcon, { backgroundColor: `${action.accent}1F` }]}>
                  <Icon size={18} color={action.accent} />
                </View>
                <SectionTitle style={styles.quickTitle}>{action.label}</SectionTitle>
                <Body style={styles.quickHelper}>{action.helper}</Body>
              </AnimatedPressable>
            </View>
          );
        })}
      </View>

      <Card accent="olive" style={styles.streakCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Label>Momentum</Label>
            <SectionTitle>{completedToday.length > 0 ? `${completedToday.length} completed today` : "A clean start"}</SectionTitle>
          </View>
          <Text style={styles.streakNumber}>{leadingHabit?.streak ?? 0}</Text>
        </View>
        <View style={styles.habitRail}>
          {habits.map((habit) => {
            const complete = habit.completedDates.includes(formatDateKey(now));
            return (
              <AnimatedPressable key={habit.habit} accessibilityRole="button" onPress={() => markHabit(habit.habit)} style={[styles.habitPill, complete && styles.habitPillDone]}>
                <Text style={[styles.habitPillText, complete && styles.habitPillTextDone]}>{habitLabels[habit.habit]}</Text>
                {complete ? <Check size={13} color={colors.white} /> : null}
              </AnimatedPressable>
            );
          })}
        </View>
        <View style={styles.freezeRow}>
          <Snowflake size={15} color={colors.blue} />
          <Body style={styles.freezeText}>{leadingHabit ? `${habitLabels[leadingHabit.habit]} leads with ${leadingHabit.streak} days · ${leadingHabit.freezes} freezes left` : "Track only what is true today."}</Body>
          {leadingHabit ? (
            <AnimatedPressable accessibilityRole="button" onPress={() => consumeFreeze(leadingHabit.habit)} style={styles.freezeButton}>
              <Text style={styles.freezeButtonText}>Freeze</Text>
            </AnimatedPressable>
          ) : null}
        </View>
      </Card>

      <View style={styles.overviewRow}>
        <Card accent="gold" style={styles.overviewCard}>
          <Label>Calendar</Label>
          <SectionTitle style={styles.compactTitle}>{location ? location.label : "Local calendar"}</SectionTitle>
          <Body numberOfLines={2}>{nextZman ? `${nextZman.title} at ${formatTime(nextZman.time)}` : "Add location to show Shabbat, Havdalah, and daily zmanim."}</Body>
        </Card>
        <Card accent="rose" style={styles.overviewCard}>
          <Label>Saved</Label>
          <SectionTitle style={styles.compactTitle}>{bookmark?.title ?? "No saved prayer"}</SectionTitle>
          <Body numberOfLines={2}>{bookmark?.useCase ?? "Bookmark prayers you return to often."}</Body>
        </Card>
      </View>

      <AnimatedPressable accessibilityRole="button" onPress={() => openPrayerSearch("today")} style={styles.askStrip}>
        <Search size={18} color={colors.blue} />
        <View style={styles.askText}>
          <SectionTitle style={styles.askTitle}>Ask about today</SectionTitle>
          <Body style={styles.askBody}>Prayer, timing, meaning, or what to say next.</Body>
        </View>
        <ChevronRight size={18} color={colors.inkMuted} />
      </AnimatedPressable>
    </Screen>
  );
}

function findNextZman(zmanim: Zman[], now: Date): Zman | null {
  return zmanim.find((zman) => zman.time.getTime() > now.getTime()) ?? zmanim[0] ?? null;
}

function progressThroughDay(date: Date): number {
  return Math.min(Math.max((date.getHours() * 60 + date.getMinutes()) / 1440, 0), 1);
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  display: {
    fontSize: 38,
    lineHeight: 42
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.vellum,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  nowCard: {
    padding: spacing.xl
  },
  nowLayout: {
    flexDirection: "row",
    gap: spacing.lg
  },
  dayArc: {
    width: 38,
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: 2,
    paddingBottom: 2
  },
  arcRail: {
    width: 2,
    flex: 1,
    minHeight: 176,
    borderRadius: radii.pill,
    backgroundColor: colors.blueSoft,
    overflow: "visible"
  },
  arcFill: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.blue
  },
  arcDot: {
    position: "absolute",
    left: -6,
    width: 14,
    height: 14,
    marginTop: -7,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.vellum
  },
  nowText: {
    flex: 1,
    gap: spacing.sm
  },
  nowTitle: {
    fontSize: 24,
    lineHeight: 29
  },
  nowTime: {
    ...type.display,
    fontSize: 48,
    lineHeight: 52,
    color: colors.ink
  },
  nowSetupText: {
    fontSize: 40,
    lineHeight: 44
  },
  nowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: "wrap"
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.ink
  },
  primaryButtonText: {
    ...type.caption,
    color: colors.white,
    textTransform: "uppercase"
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueSoft
  },
  secondaryButtonText: {
    ...type.caption,
    color: colors.blue,
    textTransform: "uppercase"
  },
  quickGrid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  quickColumn: {
    flex: 1
  },
  quickCard: {
    minHeight: 126,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: "rgba(255,255,255,0.64)",
    padding: spacing.md,
    gap: spacing.xs
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs
  },
  quickTitle: {
    fontSize: 15,
    lineHeight: 20
  },
  quickHelper: {
    fontSize: 12,
    lineHeight: 17
  },
  streakCard: {
    gap: spacing.md
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  streakNumber: {
    ...type.data,
    width: 54,
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.oliveSoft,
    color: colors.olive,
    textAlign: "center",
    lineHeight: 54
  },
  habitRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  habitPill: {
    minHeight: 38,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.vellum,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  habitPillDone: {
    backgroundColor: colors.olive,
    borderColor: colors.olive
  },
  habitPillText: {
    ...type.caption,
    color: colors.ink,
    textTransform: "uppercase"
  },
  habitPillTextDone: {
    color: colors.white
  },
  freezeRow: {
    minHeight: 46,
    borderRadius: radii.md,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  freezeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  freezeButton: {
    borderRadius: radii.pill,
    backgroundColor: colors.vellum,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  freezeButtonText: {
    ...type.caption,
    color: colors.blue,
    textTransform: "uppercase"
  },
  overviewRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  overviewCard: {
    flex: 1,
    minHeight: 158,
    gap: spacing.sm
  },
  compactTitle: {
    fontSize: 17,
    lineHeight: 22
  },
  askStrip: {
    minHeight: 72,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.vellum,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  askText: {
    flex: 1
  },
  askTitle: {
    fontSize: 16,
    lineHeight: 21
  },
  askBody: {
    fontSize: 13,
    lineHeight: 18
  }
});

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { formatISO } from "date-fns";
import { CalendarDays, Check, ChevronRight, MapPin, Plus, Search, SlidersHorizontal } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const habitDetails: Record<StreakHabit, { name: string; description: string }> = {
  shacharit: { name: "Shacharit", description: "The morning prayer service" },
  mincha: { name: "Mincha", description: "The afternoon prayer service" },
  maariv: { name: "Maariv", description: "The evening prayer service" },
  tefillin: { name: "Tefillin", description: "Prayer straps worn on weekday mornings" },
  study: { name: "Daily study", description: "A little Torah or Jewish learning" }
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
  const { habits, enabledHabits, setHabitEnabled, toggleHabit } = useStreakStore();
  const { zmanim, location, isLoading, refresh } = useZmanimStore();
  const { prayers, bookmarkedPrayerIds, setQuery } = usePrayerStore();
  const [practiceEditorOpen, setPracticeEditorOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const nextZman = useMemo(() => findNextZman(zmanim, now), [zmanim, now]);
  const nextMoment = nextZman ? prayerMomentByZman[nextZman.key] ?? { query: nextZman.title, label: nextZman.title, helper: "Next moment" } : null;
  const activeHabits = habits.filter((habit) => enabledHabits.includes(habit.habit));
  const completedToday = activeHabits.filter((habit) => habit.completedDates.includes(formatDateKey(now)));
  const bookmark = bookmarkedPrayerIds.map((id) => prayers.find((prayer) => prayer.id === id)).find(Boolean);

  const openPrayerSearch = (query: string) => {
    setQuery(query);
    navigation.navigate("Prayer");
  };

  const togglePractice = (habit: StreakHabit) => {
    toggleHabit(habit);
    void confirmHaptic();
  };

  const closePracticeEditor = () => {
    void confirmHaptic();
    setPracticeEditorOpen(false);
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
          <SectionTitle style={styles.sectionTitle}>Daily practice</SectionTitle>
          <View style={styles.sectionControls}>
            <Text style={styles.sectionMeta}>{activeHabits.length > 0 ? `${completedToday.length}/${activeHabits.length} today` : "Optional"}</Text>
            <AnimatedPressable accessibilityLabel="Choose daily practices" accessibilityRole="button" onPress={() => setPracticeEditorOpen(true)} pressedScale={0.94} style={styles.editPracticesButton}>
              <SlidersHorizontal size={16} color={colors.ink} />
            </AnimatedPressable>
          </View>
        </View>
        {activeHabits.length > 0 ? (
          <View style={styles.habitList}>
            {activeHabits.map((habit, index) => {
              const complete = habit.completedDates.includes(formatDateKey(now));
              const details = habitDetails[habit.habit];
              const streakLabel = `${habit.streak} ${habit.streak === 1 ? "day" : "days"}`;
              return (
                <AnimatedPressable key={habit.habit} accessibilityRole="checkbox" accessibilityLabel={`${details.name}. ${details.description}`} accessibilityHint={complete ? "Marks this practice incomplete" : "Marks this practice complete"} accessibilityState={{ checked: complete }} onPress={() => togglePractice(habit.habit)} style={[styles.habitRow, index === activeHabits.length - 1 && styles.lastHabitRow]}>
                  <View style={styles.habitCopy}>
                    <Text style={styles.habitName}>{details.name}</Text>
                    <Text style={styles.habitDescription}>{details.description}</Text>
                    <Text style={styles.habitDetail}>{streakLabel} in a row</Text>
                  </View>
                  <View style={[styles.checkCircle, complete && styles.checkCircleDone]}>{complete ? <Check size={14} color={colors.white} /> : null}</View>
                </AnimatedPressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyPractices}>
            <View style={styles.emptyPracticeCopy}>
              <Text style={styles.emptyPracticeTitle}>Nothing to keep up with</Text>
              <Text style={styles.emptyPracticeBody}>Add a practice whenever it feels useful.</Text>
            </View>
            <AnimatedPressable accessibilityRole="button" onPress={() => setPracticeEditorOpen(true)} style={styles.choosePracticesButton}>
              <Plus size={16} color={colors.blue} />
              <Text style={styles.choosePracticesText}>Choose</Text>
            </AnimatedPressable>
          </View>
        )}
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

      <Modal animationType="fade" onRequestClose={closePracticeEditor} onShow={() => void confirmHaptic()} statusBarTranslucent transparent visible={practiceEditorOpen}>
        <View style={styles.editorRoot}>
          <Pressable accessibilityLabel="Close practice chooser" accessibilityRole="button" onPress={closePracticeEditor} style={styles.editorBackdrop} />
          <SafeAreaView edges={["bottom"]} style={styles.editorSafeArea}>
            <View style={styles.editorSheet}>
              <View style={styles.editorHandle} />
              <View style={styles.editorHeader}>
                <View style={styles.editorHeading}>
                  <SectionTitle>Choose your practices</SectionTitle>
                  <Body>Keep only what feels meaningful right now. You can change this anytime.</Body>
                </View>
                <AnimatedPressable accessibilityRole="button" haptic={false} onPress={closePracticeEditor} style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </AnimatedPressable>
              </View>
              <View style={styles.practiceChoices}>
                {habits.map((habit, index) => {
                  const details = habitDetails[habit.habit];
                  const selected = enabledHabits.includes(habit.habit);
                  return (
                    <AnimatedPressable key={habit.habit} accessibilityHint={selected ? "Removes this from Today" : "Adds this to Today"} accessibilityLabel={`${details.name}. ${details.description}`} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => setHabitEnabled(habit.habit, !selected)} style={[styles.practiceChoice, index === habits.length - 1 && styles.lastPracticeChoice]}>
                      <View style={styles.practiceChoiceCopy}>
                        <Text style={styles.practiceChoiceName}>{details.name}</Text>
                        <Text style={styles.practiceChoiceDescription}>{details.description}</Text>
                      </View>
                      <View style={[styles.choiceCircle, selected && styles.choiceCircleSelected]}>{selected ? <Check size={14} color={colors.white} /> : null}</View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
  return formatISO(date, { representation: "date" });
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
  sectionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  editPracticesButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  habitList: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden"
  },
  habitRow: {
    minHeight: 82,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline
  },
  lastHabitRow: {
    borderBottomWidth: 0
  },
  habitCopy: {
    flex: 1
  },
  habitName: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink
  },
  habitDescription: {
    ...type.caption,
    color: colors.ink,
    marginTop: 1
  },
  habitDetail: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 2
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
  emptyPractices: {
    minHeight: 92,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.lg
  },
  emptyPracticeCopy: {
    flex: 1,
    gap: 2
  },
  emptyPracticeTitle: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink
  },
  emptyPracticeBody: {
    ...type.caption,
    color: colors.inkMuted
  },
  choosePracticesButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.blueSoft
  },
  choosePracticesText: {
    ...type.caption,
    color: colors.blue
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
  },
  editorRoot: {
    flex: 1,
    justifyContent: "flex-end"
  },
  editorBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 13, 16, 0.30)"
  },
  editorSafeArea: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: "hidden",
    ...shadows.floating
  },
  editorSheet: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.lg
  },
  editorHandle: {
    width: 36,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.hairlineStrong,
    alignSelf: "center"
  },
  editorHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg
  },
  editorHeading: {
    flex: 1,
    gap: spacing.xs
  },
  doneButton: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  doneButtonText: {
    ...type.body,
    fontWeight: "600",
    color: colors.blue
  },
  practiceChoices: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline
  },
  practiceChoice: {
    minHeight: 68,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline
  },
  lastPracticeChoice: {
    borderBottomWidth: 0
  },
  practiceChoiceCopy: {
    flex: 1
  },
  practiceChoiceName: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink
  },
  practiceChoiceDescription: {
    ...type.caption,
    color: colors.inkMuted
  },
  choiceCircle: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: "center",
    justifyContent: "center"
  },
  choiceCircleSelected: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  }
});

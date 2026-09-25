import { Screen } from "@/components/Screen";
import { AppGlassSurface } from "@/components/AppGlassSurface";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Text } from "@/components/ui/text";
import {
  useAppColorScheme,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@/design/appearance";
import { cn } from "@/lib/utils";
import { formatISO } from "date-fns";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import {
  BellRing,
  BookOpen,
  CalendarDays,
  ChartColumn,
  ChevronRight,
  Heart,
  MapPin,
  Navigation as NavigationIcon,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Utensils,
  X,
} from "@/components/ui/icons";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CommunityFeed } from "@/components/CommunityFeed";
import { Checkbox } from "@/components/organisms/check-box";
import { PracticeStoryComposer } from "@/components/PracticeStoryComposer";
import { Button } from "@/components/ui/button";
import { StateBounce } from "@/components/ui/motion-feedback";
import { motion } from "@/design/theme";
import { useCurrentDate } from "@/hooks/useCurrentDate";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { confirmHaptic, successHaptic } from "@/services/haptics";
import { scheduleTravelPrayerNotification } from "@/services/notifications";
import {
  calculateCurrentRun,
  calculatePracticeStats,
  type PracticeStats,
} from "@/services/practiceStats";
import { usePrayerStore } from "@/store/prayerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useStreakStore, type StreakHabit } from "@/store/streakStore";
import { useZmanimStore } from "@/store/zmanimStore";
import type { Zman } from "@/types/zmanim";

const habitDetails: Record<StreakHabit, { name: string; description: string }> =
  {
    shacharit: { name: "Shacharit", description: "The morning prayer service" },
    mincha: { name: "Mincha", description: "The afternoon prayer service" },
    maariv: { name: "Maariv", description: "The evening prayer service" },
    tefillin: {
      name: "Tefillin",
      description: "Prayer straps worn on weekday mornings",
    },
    study: {
      name: "Daily study",
      description: "A little Torah or Jewish learning",
    },
  };

const prayerMomentByZman: Partial<
  Record<Zman["key"], { query: string; label: string; helper: string }>
> = {
  alotHashachar: { query: "modeh ani", label: "Begin", helper: "Modeh Ani" },
  sunrise: { query: "shacharit", label: "Morning prayer", helper: "Shacharit" },
  latestShema: { query: "shema", label: "Say Shema", helper: "Latest Shema" },
  latestTefilah: {
    query: "shacharit",
    label: "Open Shacharit",
    helper: "Latest Tefilah",
  },
  minchaGedolah: {
    query: "mincha",
    label: "Open Mincha",
    helper: "Afternoon prayer",
  },
  minchaKetana: {
    query: "mincha",
    label: "Open Mincha",
    helper: "Preferred window",
  },
  sunset: { query: "maariv", label: "Evening prayer", helper: "Maariv" },
  candleLighting: {
    query: "candle lighting",
    label: "Light candles",
    helper: "Shabbat",
  },
  havdalah: { query: "havdalah", label: "Havdalah", helper: "Close Shabbat" },
};

const shortcuts = [
  { label: "Healing", query: "health", icon: Heart },
  { label: "Blessings", query: "food blessing", icon: Utensils },
  { label: "Protection", query: "protection", icon: ShieldCheck },
];

export function HomeScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const homeStyles = useThemedStyles(makehomeStyles);

  const router = useRouter();
  const { habits, enabledHabits, setHabitEnabled, toggleHabit } =
    useStreakStore();
  const { upcomingZmanim, location, isLoading, error, refresh } =
    useZmanimStore();
  const { setQuery } = usePrayerStore();
  const reduceMotion = useReducedMotion();
  const [practiceEditorOpen, setPracticeEditorOpen] = useState(false);
  const [practiceStatsOpen, setPracticeStatsOpen] = useState(false);
  const [travelPromptOpen, setTravelPromptOpen] = useState(false);
  const [travelScheduling, setTravelScheduling] = useState(false);
  const [travelStatus, setTravelStatus] = useState("");
  const [shareHabit, setShareHabit] = useState<StreakHabit | null>(null);
  const [sharePromptHabit, setSharePromptHabit] = useState<StreakHabit | null>(
    null,
  );
  const setTravelNotificationsEnabled = useSettingsStore(
    (state) => state.setTravelNotificationsEnabled,
  );
  useEffect(() => {
    if (travelPromptOpen || practiceEditorOpen || practiceStatsOpen)
      void confirmHaptic();
  }, [travelPromptOpen, practiceEditorOpen, practiceStatsOpen]);
  const now = useCurrentDate();
  const nextZman = useMemo(
    () => findNextZman(upcomingZmanim, now),
    [upcomingZmanim, now],
  );
  const nextMoment = nextZman
    ? (prayerMomentByZman[nextZman.key] ?? {
        query: nextZman.title,
        label: nextZman.title,
        helper: "Next moment",
      })
    : null;
  const activeHabits = habits.filter((habit) =>
    enabledHabits.includes(habit.habit),
  );
  const completedToday = activeHabits.filter((habit) =>
    habit.completedDates.includes(formatDateKey(now)),
  );
  const shareablePractice =
    completedToday.find((habit) => habit.habit === "tefillin") ??
    completedToday[0];
  const practiceStats = useMemo(
    () => calculatePracticeStats(habits, now),
    [habits, now],
  );

  const openPrayerSearch = (query: string) => {
    setQuery(query);
    router.push({ pathname: "/prayer", params: { query } });
  };

  const togglePractice = (habit: StreakHabit) => {
    const wasComplete = habits
      .find((item) => item.habit === habit)
      ?.completedDates.includes(formatDateKey(now));
    toggleHabit(habit);
    if (!wasComplete) setSharePromptHabit(habit);
  };

  const openStoryComposer = (habit: StreakHabit) => {
    setSharePromptHabit(null);
    setTimeout(() => setShareHabit(habit), reduceMotion ? 0 : 80);
  };

  const closePracticeEditor = () => {
    void confirmHaptic();
    setPracticeEditorOpen(false);
  };

  const closePracticeStats = () => {
    void confirmHaptic();
    setPracticeStatsOpen(false);
  };

  const openTravelPrayer = () => {
    setTravelPromptOpen(false);
    setQuery("travel");
    router.push({
      pathname: "/prayer",
      params: { prayerId: "tefilat-haderech", query: "travel" },
    });
  };

  const scheduleTravelReminder = async () => {
    if (travelScheduling) return;
    setTravelScheduling(true);
    try {
      const scheduled = await scheduleTravelPrayerNotification(5);
      if (!scheduled) {
        setTravelStatus(
          "Enable notifications on a physical device to use reminders.",
        );
        return;
      }

      setTravelNotificationsEnabled(true);
      setTravelStatus("Reminder set for 5 minutes from now.");
      setTravelPromptOpen(false);
      void successHaptic();
    } catch {
      setTravelStatus(
        "The reminder could not be set. Check notification access and try again.",
      );
    } finally {
      setTravelScheduling(false);
    }
  };

  return (
    <Screen
      largeTitle="Today"
      subtitle={formatHebrewDate(now)}
      rightComponent={
        <Button
          variant="ghost"
          size="content"
          accessibilityLabel="Open local prayer times"
          onPress={() => router.push("/zmanim")}
          style={homeStyles.calendar}
        >
          <CalendarDays size={20} color={colors.inkMuted} />
        </Button>
      }
    >
      <View style={homeStyles.moment}>
        <View style={homeStyles.momentTop}>
          <Text style={homeStyles.momentLabel}>
            {nextZman ? `In ${timeUntil(nextZman.time)}` : "Prayer for today"}
          </Text>
        </View>
        <Text variant="title" style={homeStyles.momentTitle}>
          {nextZman ? nextZman.title : "A moment of intention."}
        </Text>
        {nextZman ? (
          <Text style={homeStyles.time}>{formatTime(nextZman.time)}</Text>
        ) : null}
        <Text style={homeStyles.momentDescription}>
          {nextZman
            ? `${nextMoment?.helper ?? "Next prayer moment"} in ${location?.label ?? "your location"}.`
            : "Find your words. Begin where you are."}
        </Text>
        <Button
          size="content"
          onPress={() => openPrayerSearch(nextMoment?.query ?? "")}
          style={homeStyles.primaryAction}
          backgroundColor={colors.ink}
          borderRadius={16}
        >
          <BookOpen size={20} color={colors.onAccent} />
          <Text style={homeStyles.primaryLabel}>
            {nextMoment?.label ?? "Find a prayer"}
          </Text>
          <ChevronRight size={16} color={colors.onAccent} />
        </Button>
      </View>

      <Button
        variant="ghost"
        size="content"
        accessibilityLabel={
          nextZman
            ? "View all local prayer times"
            : "Set location for local prayer times"
        }
        onPress={() => (nextZman ? router.push("/zmanim") : void refresh())}
        disabled={isLoading}
        style={homeStyles.locationRow}
      >
        <MapPin size={16} color={colors.inkMuted} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={homeStyles.locationTitle}>
            {nextZman
              ? (location?.label ?? "Local prayer times")
              : "Prayer times, wherever you are"}
          </Text>
          <Text style={homeStyles.locationCaption}>
            {isLoading
              ? "Finding your location…"
              : nextZman
                ? "View today’s times"
                : error
                  ? "Location unavailable. Tap to try again."
                  : "Set your location to see local times"}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.inkMuted} />
      </Button>

      <View style={homeStyles.shortcuts}>
        {shortcuts.map(({ label, query, icon: Icon }) => (
          <Button
            key={label}
            variant="ghost"
            size="content"
            onPress={() => openPrayerSearch(query)}
            style={homeStyles.shortcut}
            backgroundColor={colors.vellum}
            borderRadius={16}
          >
            <Icon size={20} color={colors.inkMuted} />
            <Text style={homeStyles.shortcutLabel}>{label}</Text>
          </Button>
        ))}
      </View>

      <View className="gap-3">
        <View className="z-20 flex-row items-center justify-between">
          <Text variant="section" className="text-[20px] leading-[26px]">
            Daily practice
          </Text>
          <View className="flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="content"
              accessibilityLabel={`View practice summary, ${completedToday.length} of ${activeHabits.length} completed today`}
              onPress={() => setPracticeStatsOpen(true)}
              style={{
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: 8,
              }}
            >
              <Text style={homeStyles.practiceCount}>
                {activeHabits.length > 0
                  ? `${completedToday.length} of ${activeHabits.length}`
                  : "Optional"}
              </Text>
            </Button>
            <Button
              variant="ghost"
              size="content"
              accessibilityLabel="Choose daily practices"
              accessibilityRole="button"
              onPress={() => setPracticeEditorOpen(true)}
              pressedScale={0.96}
              className="w-11 h-11 rounded-md items-center justify-center bg-card border border-hairline"
            >
              <SlidersHorizontal size={16} color={colors.ink} />
            </Button>
          </View>
        </View>
        {activeHabits.length > 0 ? (
          <Card className="p-0 gap-0 overflow-hidden rounded-lg bg-card">
            {activeHabits.map((habit, index) => {
              const complete = habit.completedDates.includes(
                formatDateKey(now),
              );
              const details = habitDetails[habit.habit];
              const currentStreak = calculateCurrentRun(
                habit.completedDates,
                now,
              );
              const streakLabel = `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`;
              return (
                <Button
                  variant="ghost"
                  size="content"
                  key={habit.habit}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${details.name}. ${details.description}`}
                  accessibilityHint={
                    complete
                      ? "Marks this practice incomplete"
                      : "Marks this practice complete"
                  }
                  accessibilityState={{ checked: complete }}
                  haptic={complete ? "selection" : "success"}
                  onPress={() => togglePractice(habit.habit)}
                  className={cn(
                    "min-h-[72px] px-5 py-4 flex-row items-center justify-between gap-3 border-b border-hairline",
                    index === activeHabits.length - 1 && "border-b-0",
                  )}
                >
                  <View className="flex-1 gap-1">
                    <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
                      {details.name}
                    </Text>
                    <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground mt-[2px] font-label">
                      {complete
                        ? "Completed today"
                        : currentStreak > 0
                          ? `${streakLabel} of practice`
                          : details.description}
                    </Text>
                  </View>
                  <StateBounce trigger={complete}>
                    <Checkbox checked={complete} size={24} stroke={1.75} />
                  </StateBounce>
                </Button>
              );
            })}
          </Card>
        ) : (
          <View className="min-h-[92px] px-4 py-3 flex-row items-center gap-4 border-t border-b border-hairline">
            <View className="flex-1 gap-[2px]">
              <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
                Nothing to keep up with
              </Text>
              <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground font-label">
                Add a practice whenever it feels useful.
              </Text>
            </View>
            <Button
              variant="secondary"
              size="content"
              accessibilityRole="button"
              onPress={() => setPracticeEditorOpen(true)}
              className="min-h-10 px-3 rounded-md flex-row items-center gap-1 bg-accent"
            >
              <Plus size={16} color={colors.blue} />
              <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-primary font-label">
                Choose
              </Text>
            </Button>
          </View>
        )}
        <Button
          variant="ghost"
          size="content"
          accessibilityLabel={`Overall practice. ${formatOverallSummary(practiceStats)}`}
          accessibilityRole="button"
          onPress={() => setPracticeStatsOpen(true)}
          className="min-h-[60px] px-1 flex-row items-center gap-3"
        >
          <ChartColumn size={20} color={colors.blue} />
          <View className="flex-1">
            <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
              Your practice
            </Text>
            <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground font-label">
              {formatOverallSummary(practiceStats)}
            </Text>
          </View>
          <ChevronRight size={16} color={colors.inkMuted} />
        </Button>
        {shareablePractice ? (
          <PracticeSharePrompt
            label={habitDetails[shareablePractice.habit].name}
            onPress={() => setSharePromptHabit(shareablePractice.habit)}
          />
        ) : null}
      </View>

      <CommunityFeed />

      <Button
        variant="outline"
        size="content"
        accessibilityRole="button"
        onPress={() => openPrayerSearch("")}
        className="min-h-[58px] rounded-md border-[0px] bg-card px-4 flex-row items-center gap-3 shadow-card"
      >
        <Search size={20} color={colors.blue} />
        <Text className="text-[16px] leading-[22px] font-semibold tracking-normal flex-1 text-foreground font-heading">
          Browse the prayer library
        </Text>
        <ChevronRight size={16} color={colors.inkMuted} />
      </Button>

      <Button
        variant="ghost"
        size="content"
        accessibilityLabel="Long trip travel prayer"
        accessibilityRole="button"
        onPress={() => setTravelPromptOpen(true)}
        className="min-h-[76px] px-4 py-3 rounded-lg bg-blueSoft flex-row items-center gap-3"
      >
        <View className="w-10 h-10 rounded-sm items-center justify-center bg-primary">
          <NavigationIcon size={20} color={colors.onAccent} />
        </View>
        <View className="flex-1 gap-[2px]">
          <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
            Long trip?
          </Text>
          <Text className="text-[12px] leading-[18px] font-medium tracking-normal text-inkMuted font-label">
            {travelStatus ||
              "Open or schedule the travel prayer without sharing your route."}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.inkMuted} />
      </Button>

      <Dialog open={travelPromptOpen} onOpenChange={setTravelPromptOpen}>
        <DialogContent
          overlayClassName="justify-end p-0"
          className="max-w-[560px] rounded-b-none border-b-0 p-0"
          showClose={false}
        >
          <SafeAreaView
            edges={["bottom"]}
            className="bg-card rounded-tl-lg rounded-tr-lg overflow-hidden shadow-card"
          >
            <View className="px-6 pt-2 pb-4 gap-4">
              <View className="flex-row items-center justify-between">
                <View className="w-[42px] h-[42px] rounded-sm items-center justify-center bg-accent">
                  <NavigationIcon size={20} color={colors.blue} />
                </View>
                <Button
                  variant="secondary"
                  size="content"
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                  haptic="selection"
                  onPress={() => setTravelPromptOpen(false)}
                  className="w-11 h-11 rounded-sm items-center justify-center bg-muted"
                >
                  <X size={20} color={colors.inkMuted} />
                </Button>
              </View>
              <View className="gap-2">
                <Text
                  className="font-hebrew-heading text-[28px] leading-[38px] text-foreground text-right"
                  style={styles.travelHebrew}
                >
                  תפילת הדרך
                </Text>
                <DialogTitle className="text-[21px] leading-[27px]">
                  Traveling for over an hour?
                </DialogTitle>
                <DialogDescription>
                  Maps cannot share route duration with Kavanah. Start this
                  private reminder in one tap.
                </DialogDescription>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    variant="outline"
                    size="content"
                    accessibilityRole="button"
                    haptic="confirm"
                    onPress={openTravelPrayer}
                    className="w-full min-h-[50px] rounded-md flex-row items-center justify-center gap-2 border border-hairlineStrong bg-card"
                  >
                    <NavigationIcon size={16} color={colors.ink} />
                    <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-foreground font-label">
                      Open now
                    </Text>
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    variant="default"
                    size="content"
                    accessibilityRole="button"
                    disabled={travelScheduling}
                    isLoading={travelScheduling}
                    loadingLabel="Setting"
                    haptic="confirm"
                    onPress={() => void scheduleTravelReminder()}
                    className={cn(
                      "w-full min-h-[50px] rounded-md flex-row items-center justify-center gap-2 bg-primary",
                      travelScheduling && "opacity-[0.55]",
                    )}
                  >
                    <BellRing size={16} color={colors.onAccent} />
                    <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-primary-foreground font-label">
                      Remind in 5 min
                    </Text>
                  </Button>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={16} color={colors.olive} />
                <Text className="text-[12px] leading-[17px] font-medium tracking-normal flex-1 text-muted-foreground font-label">
                  Only read when stopped, or ask a passenger to read it.
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </DialogContent>
      </Dialog>

      <Dialog open={practiceEditorOpen} onOpenChange={setPracticeEditorOpen}>
        <DialogContent
          overlayClassName="justify-end p-0"
          className="max-w-[560px] rounded-b-none border-b-0 p-0"
          showClose={false}
        >
          <SafeAreaView
            edges={["bottom"]}
            className="bg-card rounded-tl-lg rounded-tr-lg overflow-hidden shadow-card"
          >
            <View className="px-6 pt-2 pb-4 gap-4">
              <View className="flex-row items-start gap-4">
                <View className="flex-1 gap-1">
                  <DialogTitle>Choose your practices</DialogTitle>
                  <DialogDescription>
                    Keep only what feels meaningful right now. You can change
                    this anytime.
                  </DialogDescription>
                </View>
                <Button
                  variant="ghost"
                  size="content"
                  accessibilityRole="button"
                  haptic="selection"
                  onPress={closePracticeEditor}
                  className="min-h-11 justify-center px-2"
                >
                  <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-primary font-heading">
                    Done
                  </Text>
                </Button>
              </View>
              <View className="border-t border-t-hairline">
                {habits.map((habit, index) => {
                  const details = habitDetails[habit.habit];
                  const selected = enabledHabits.includes(habit.habit);
                  return (
                    <Button
                      variant="ghost"
                      size="content"
                      key={habit.habit}
                      accessibilityHint={
                        selected
                          ? "Removes this from Today"
                          : "Adds this to Today"
                      }
                      accessibilityLabel={`${details.name}. ${details.description}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      onPress={() => setHabitEnabled(habit.habit, !selected)}
                      className={cn(
                        "min-h-[68px] py-2 flex-row items-center gap-4 border-b border-b-hairline",
                        index === habits.length - 1 && "border-b-[0px]",
                      )}
                    >
                      <View className="flex-1">
                        <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
                          {details.name}
                        </Text>
                        <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground font-label">
                          {details.description}
                        </Text>
                      </View>
                      <Checkbox checked={selected} size={24} stroke={1.75} />
                    </Button>
                  );
                })}
              </View>
            </View>
          </SafeAreaView>
        </DialogContent>
      </Dialog>

      <Dialog open={practiceStatsOpen} onOpenChange={setPracticeStatsOpen}>
        <DialogContent
          overlayClassName="justify-end p-0"
          className="max-w-[560px] rounded-b-none border-b-0 p-0"
          showClose={false}
        >
          <SafeAreaView
            edges={["bottom"]}
            className="bg-card rounded-tl-lg rounded-tr-lg overflow-hidden shadow-card"
          >
            <View className="px-6 pt-2 pb-4 gap-4">
              <View className="flex-row items-start gap-4">
                <View className="flex-1 gap-1">
                  <DialogTitle>Your practice</DialogTitle>
                  <DialogDescription>
                    Every practice you mark complete counts here, even if it is
                    no longer on Today.
                  </DialogDescription>
                </View>
                <Button
                  variant="ghost"
                  size="content"
                  accessibilityRole="button"
                  haptic="selection"
                  onPress={closePracticeStats}
                  className="min-h-11 justify-center px-2"
                >
                  <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-primary font-heading">
                    Done
                  </Text>
                </Button>
              </View>
              <View className="border-t border-t-hairline">
                <PracticeStatRow
                  label="Current run"
                  value={formatCount(practiceStats.currentRun, "day")}
                />
                <PracticeStatRow
                  label="This week"
                  value={formatCount(practiceStats.thisWeek, "practice")}
                />
                <PracticeStatRow
                  label="This month"
                  value={formatCount(practiceStats.thisMonth, "practice")}
                />
                <PracticeStatRow
                  label="This year"
                  value={formatCount(practiceStats.thisYear, "practice")}
                />
                <PracticeStatRow
                  label="All time"
                  value={formatCount(practiceStats.allTime, "practice")}
                  last
                />
              </View>
              <Text variant="body" className="text-[12px] leading-[18px]">
                A run counts consecutive days with at least one completed
                practice. The current day remains open until midnight.
              </Text>
            </View>
          </SafeAreaView>
        </DialogContent>
      </Dialog>

      <PracticeStoryComposer
        moment={
          shareHabit
            ? {
                habit: shareHabit,
                streak: calculateCurrentRun(
                  habits.find((habit) => habit.habit === shareHabit)
                    ?.completedDates ?? [],
                  now,
                ),
                completedAt: now,
              }
            : null
        }
        onClose={() => setShareHabit(null)}
      />
      <ShareMomentPrompt
        habit={sharePromptHabit}
        onDismiss={() => setSharePromptHabit(null)}
        onShare={openStoryComposer}
      />
    </Screen>
  );
}

function ShareMomentPrompt({
  habit,
  onDismiss,
  onShare,
}: {
  habit: StreakHabit | null;
  onDismiss: () => void;
  onShare: (habit: StreakHabit) => void;
}): React.JSX.Element | null {
  const scheme = useAppColorScheme();
  const colors = useThemeColors();

  const [progress] = useState(() => new Animated.Value(0));
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!habit) return;
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      damping: 19,
      stiffness: 230,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [habit, progress]);

  const close = (afterClose = onDismiss) => {
    if (reduceMotion) {
      afterClose();
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      easing: Easing.bezier(...motion.standard),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) afterClose();
    });
  };

  if (!habit) return null;
  const label = habitDetails[habit].name;

  return (
    <Modal
      transparent
      animationType="none"
      onRequestClose={() => close()}
      statusBarTranslucent
      visible
    >
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0"
          style={[StyleSheet.absoluteFill, { opacity: progress }]}
        >
          <BlurView
            intensity={80}
            tint={scheme}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(18, 31, 52, 0.2)" },
            ]}
          />
        </Animated.View>
        <Pressable
          accessibilityLabel="Dismiss share prompt"
          accessibilityRole="button"
          className="absolute inset-0"
          onPress={() => close()}
        />
        <Animated.View
          className="w-full max-w-[368px] overflow-hidden rounded-xl shadow-floating"
          style={{
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ],
          }}
        >
          <AppGlassSurface
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View className="items-center px-6 pt-7 pb-5 gap-3">
            <View className="w-12 h-12 rounded-full items-center justify-center bg-accent border border-hairline">
              <Share2 size={20} color={colors.blue} />
            </View>
            <View className="items-center gap-1">
              <Text className="text-[21px] leading-[27px] font-semibold tracking-normal text-foreground font-heading">
                Share this moment
              </Text>
              <Text className="text-[13px] leading-[19px] text-center text-muted-foreground font-body">
                You completed {label}. Turn it into a private story, only if it
                feels right.
              </Text>
            </View>
          </View>
          <View className="px-4 pb-4 gap-2">
            <Button
              variant="default"
              size="content"
              accessibilityLabel={`Create a story for ${label}`}
              haptic="confirm"
              onPress={() => close(() => onShare(habit))}
              className="min-h-[52px] rounded-md bg-primary items-center justify-center"
            >
              <Text className="text-[15px] leading-[20px] font-semibold text-primary-foreground font-heading">
                Create story
              </Text>
            </Button>
            <Button
              variant="ghost"
              size="content"
              accessibilityLabel="Not now"
              haptic="selection"
              onPress={() => close()}
              className="min-h-[44px] rounded-md items-center justify-center"
            >
              <Text className="text-[14px] leading-[19px] font-medium text-muted-foreground font-heading">
                Not now
              </Text>
            </Button>
            <Button
              variant="ghost"
              size="content"
              accessibilityLabel="Close share prompt"
              accessibilityRole="button"
              haptic="selection"
              onPress={() => close()}
              className="self-center mt-1 w-11 h-11 rounded-full items-center justify-center bg-black/10 border border-hairline"
            >
              <X size={20} color={colors.inkMuted} />
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function PracticeSharePrompt({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  const [reveal] = useState(() => new Animated.Value(0));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: reduceMotion ? 0 : motion.stateMs,
      easing: Easing.bezier(...motion.standard),
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, reveal]);

  return (
    <Animated.View
      style={{
        opacity: reveal,
        transform: [
          {
            translateY: reveal.interpolate({
              inputRange: [0, 1],
              outputRange: [6, 0],
            }),
          },
        ],
      }}
    >
      <Button
        variant="secondary"
        size="content"
        accessibilityLabel={`Share ${label} as a story`}
        accessibilityRole="button"
        haptic="confirm"
        onPress={onPress}
        className="min-h-[66px] px-2 flex-row items-center gap-3 rounded-md bg-accent"
      >
        <View className="w-9 h-9 rounded-sm items-center justify-center bg-card">
          <Share2 size={16} color={colors.blue} />
        </View>
        <View className="flex-1 gap-[1px]">
          <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
            Share this moment
          </Text>
          <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground font-label">
            A private story for {label}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.inkMuted} />
      </Button>
    </Animated.View>
  );
}

function PracticeStatRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}): React.JSX.Element {
  return (
    <View
      className={cn(
        "min-h-[54px] flex-row items-center justify-between gap-4 border-b border-b-hairline",
        last && "border-b-[0px]",
      )}
    >
      <Text className="text-[16px] leading-[22px] font-normal tracking-normal text-foreground font-body">
        {label}
      </Text>
      <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
        {value}
      </Text>
    </View>
  );
}

function findNextZman(zmanim: Zman[], now: Date): Zman | null {
  return zmanim.find((zman) => zman.time.getTime() > now.getTime()) ?? null;
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
    return new Intl.DateTimeFormat("en-u-ca-hebrew", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
}

function formatDateKey(date: Date): string {
  return formatISO(date, { representation: "date" });
}

function formatOverallSummary(stats: PracticeStats): string {
  if (stats.allTime === 0) {
    return "No activity recorded yet";
  }
  const run =
    stats.currentRun > 0
      ? `${stats.currentRun} ${stats.currentRun === 1 ? "day" : "days"} in a row`
      : "No current run";
  return `${stats.thisWeek} this week, ${run}`;
}

function formatCount(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

// Native text direction and platform-only values cannot be expressed as layout utilities.
const styles = {
  travelHebrew: {
    writingDirection: "rtl",
  },
} as const;

// Home uses an editorial title and a single emphasized prayer surface.
const makehomeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    calendar: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    moment: {
      padding: 24,
      borderRadius: 24,
      backgroundColor: colors.blueSoft,
      gap: 14,
    },
    momentTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    momentLabel: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.inkMuted,
      flex: 1,
    },
    momentTitle: {
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.7,
      color: colors.ink,
    },
    time: {
      fontSize: 42,
      lineHeight: 50,
      letterSpacing: -1.5,
      color: colors.ink,
      fontVariant: ["tabular-nums"],
    },
    momentDescription: { fontSize: 15, lineHeight: 23, color: colors.inkMuted },
    primaryAction: {
      minHeight: 52,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    primaryLabel: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.onAccent,
      fontFamily: "Manrope_600SemiBold",
    },
    locationRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    locationTitle: { fontSize: 13, lineHeight: 19, color: colors.ink },
    locationCaption: { fontSize: 12, lineHeight: 18, color: colors.inkMuted },
    practiceCount: { fontSize: 12, lineHeight: 18, color: colors.inkMuted },
    shortcuts: { flexDirection: "row", gap: 10, paddingBottom: 8 },
    shortcut: {
      flex: 1,
      minHeight: 68,
      paddingVertical: 14,
      paddingHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    shortcutLabel: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.ink,
      fontFamily: "Manrope_500Medium",
    },
  });

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AppGlassSurface } from "@/components/AppGlassSurface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { formatISO } from "date-fns";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import {
  BellRing,
  ChartColumn,
  ChevronRight,
  MapPin,
  Navigation as NavigationIcon,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PracticeStoryComposer } from "@/components/PracticeStoryComposer";
import { CommunityFeed } from "@/components/CommunityFeed";
import { HomeNextMomentSkeleton } from "@/components/LoadingSkeletons";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/organisms/check-box";
import { GooeyInfoPopover } from "@/components/ui/gooey-popover";
import { StateBounce, StatusPulse } from "@/components/ui/motion-feedback";
import { colors, motion } from "@/design/theme";
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
import { getPrayerCompletionDeadline } from "@/services/prayerCompletion";
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
  { label: "Prayer", query: "health" },
  { label: "Food", query: "food blessing" },
  { label: "Safety", query: "protection" },
];

export function HomeScreen(): React.JSX.Element {
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

  const openPrayerSearch = (query: string, completionDeadline?: Date) => {
    setQuery(query);
    router.push({
      pathname: "/prayer",
      params: {
        query,
        ...(completionDeadline
          ? { completionDeadline: completionDeadline.toISOString() }
          : {}),
      },
    });
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
    >
      <Card className="relative overflow-hidden rounded-xl bg-accent p-6 gap-3 border-hairline">
        {isLoading && !nextZman && !error ? (
          <HomeNextMomentSkeleton />
        ) : (
          <>
            <View className="flex-row items-center gap-2">
              <StatusPulse active={Boolean(nextZman)}>
                <View className="w-[6px] h-[6px] rounded-full bg-primary" />
              </StatusPulse>
              <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground font-label">
                {nextZman ? timeUntil(nextZman.time) : "Location needed"}
              </Text>
            </View>
            <Text variant="section" className="text-foreground">
              {nextZman ? nextZman.title : "Prayer times near you"}
            </Text>
            {nextZman ? (
              <Text className="text-[52px] leading-[54px] font-normal tracking-[-1.8px] text-foreground font-body">
                {formatTime(nextZman.time)}
              </Text>
            ) : null}
            <Text variant="body" className="text-muted-foreground">
              {nextZman
                ? `${nextMoment?.helper ?? "Next prayer moment"} at ${location?.label ?? "your local time"}`
                : error
                  ? "Prayer times are unavailable. Try your location again."
                  : "Find local prayer times and Shabbat reminders."}
            </Text>
            <View className="flex-row gap-2 flex-wrap mt-1">
              {nextMoment ? (
                <Button
                  variant="default"
                  size="content"
                  accessibilityRole="button"
                  onPress={() =>
                    openPrayerSearch(
                      nextMoment.query,
                      getPrayerCompletionDeadline(nextZman, upcomingZmanim),
                    )
                  }
                  className="min-h-11 rounded-full px-4 bg-card flex-row items-center gap-1 border border-hairline"
                >
                  <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-primary font-label">
                    {nextMoment.label}
                  </Text>
                  <ChevronRight size={17} color={colors.blue} />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="content"
                  accessibilityRole="button"
                  onPress={() => void refresh()}
                  disabled={isLoading}
                  isLoading={isLoading}
                  loadingLabel="Finding"
                  className="min-h-11 rounded-full px-4 bg-card flex-row items-center gap-1 border border-hairline"
                >
                  <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-primary font-label">
                    Use location
                  </Text>
                  <MapPin size={17} color={colors.blue} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="content"
                accessibilityRole="button"
                onPress={() => router.push("/zmanim")}
                className="min-h-11 rounded-full px-4 bg-secondary items-center justify-center border border-hairline"
              >
                <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-foreground font-label">
                  Times
                </Text>
              </Button>
            </View>
          </>
        )}
      </Card>

      <View className="gap-3 flex-row">
        {shortcuts.map((shortcut) => (
          <View key={shortcut.label} className="flex-1">
            <Button
              variant="ghost"
              size="content"
              accessibilityRole="button"
              onPress={() => openPrayerSearch(shortcut.query)}
              className="min-h-[52px] rounded-full bg-card items-center justify-center"
            >
              <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-foreground font-label">
                {shortcut.label}
              </Text>
            </Button>
          </View>
        ))}
      </View>

      <View className="gap-3">
        <View className="z-20 flex-row items-center justify-between">
          <Text variant="section" className="text-[20px] leading-[26px]">
            Daily practice
          </Text>
          <View className="flex-row items-center gap-2">
            <GooeyInfoPopover
              accessibilityLabel="About today’s practice count"
              title="A gentle count, not a score"
              body="This resets each day and stays on this device. Choose only the practices that help you return with intention."
              side="bottom"
              align="end"
              color={colors.blueSoft}
              triggerStyle={{ minHeight: 44, justifyContent: "center" }}
              trigger={
                <Badge variant="secondary">
                  <Text>
                    {activeHabits.length > 0
                      ? `${completedToday.length}/${activeHabits.length} today`
                      : "Optional"}
                  </Text>
                </Badge>
              }
            />
            <Button
              variant="ghost"
              size="content"
              accessibilityLabel="Choose daily practices"
              accessibilityRole="button"
              onPress={() => setPracticeEditorOpen(true)}
              pressedScale={0.94}
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
                    "min-h-[76px] px-5 py-4 flex-row items-center justify-between gap-3 border-b border-hairline",
                    index === activeHabits.length - 1 && "border-b-0",
                  )}
                >
                  <View className="flex-1 gap-1">
                    <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
                      {details.name}
                    </Text>
                    <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground mt-[2px] font-label">
                      {streakLabel}
                    </Text>
                  </View>
                  <StateBounce trigger={complete}>
                    <Checkbox checked={complete} size={32} stroke={2.5} />
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
          className="min-h-[52px] px-4 flex-row items-center gap-3 border-t border-t-hairline"
        >
          <ChartColumn size={18} color={colors.blue} />
          <View className="flex-1">
            <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
              Overall
            </Text>
            <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground font-label">
              {formatOverallSummary(practiceStats)}
            </Text>
          </View>
          <ChevronRight size={17} color={colors.inkMuted} />
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
        onPress={() => openPrayerSearch("today")}
        className="min-h-[58px] rounded-md border-[0px] bg-card px-4 flex-row items-center gap-3 shadow-card"
      >
        <Search size={18} color={colors.blue} />
        <Text className="text-[16px] leading-[22px] font-semibold tracking-normal flex-1 text-foreground font-heading">
          Search prayers for today
        </Text>
        <ChevronRight size={18} color={colors.inkMuted} />
      </Button>

      <Button
        variant="ghost"
        size="content"
        accessibilityLabel="Long trip travel prayer"
        accessibilityRole="button"
        onPress={() => setTravelPromptOpen(true)}
        className="min-h-[76px] px-4 py-3 rounded-lg bg-foreground flex-row items-center gap-3 shadow-card"
      >
        <View className="w-10 h-10 rounded-sm items-center justify-center bg-primary">
          <NavigationIcon size={19} color={colors.white} />
        </View>
        <View className="flex-1 gap-[2px]">
          <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-white font-heading">
            Long trip?
          </Text>
          <Text className="text-[12px] leading-[18px] font-medium tracking-normal text-[rgba(255,255,255,0.66)] font-label">
            {travelStatus ||
              "Open or schedule the travel prayer without sharing your route."}
          </Text>
        </View>
        <ChevronRight size={18} color="rgba(255,255,255,0.58)" />
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
                  <X size={18} color={colors.inkMuted} />
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
                    <NavigationIcon size={17} color={colors.ink} />
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
                    <BellRing size={17} color={colors.white} />
                    <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-white font-label">
                      Remind in 5 min
                    </Text>
                  </Button>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={15} color={colors.olive} />
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
                      <Checkbox checked={selected} size={26} stroke={2.25} />
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
  const progress = useRef(new Animated.Value(0)).current;
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
            tint="dark"
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
              <Share2 size={21} color={colors.blue} />
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
              <Text className="text-[15px] leading-[20px] font-semibold text-white font-heading">
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
              <X size={18} color={colors.inkMuted} />
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
  const reveal = useRef(new Animated.Value(0)).current;
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
          <Share2 size={17} color={colors.blue} />
        </View>
        <View className="flex-1 gap-[1px]">
          <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
            Share this moment
          </Text>
          <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground font-label">
            A private story for {label}
          </Text>
        </View>
        <ChevronRight size={17} color={colors.inkMuted} />
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

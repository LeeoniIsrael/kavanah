import { ActivityTiming } from "@/components/ActivityTiming";
import { CircleFriends } from "@/screens/PeopleScreen";
import { usePrayerStore } from "@/store/prayerStore";
import { useStreakStore } from "@/store/streakStore";
import { buildActivityDays } from "@/services/activityCalendar";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { useInterfaceStyles } from "@/design/layout";
import { AnimatedHeaderSurface } from "@/components/organisms/animated-header-scrollview";
import Animated from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@/design/appearance";
import { fonts } from "@/design/theme";
import { useCurrentDate } from "@/hooks/useCurrentDate";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { weekKey, type PrayerSharing } from "@/services/socialPolicy";
import { useSocialStore } from "@/store/socialStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronRight,
  Check,
  ShieldCheck,
  Info,
  SlidersHorizontal,
  X,
} from "@/components/ui/icons";
import { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const modes: { id: PrayerSharing; title: string; detail: string }[] = [
  {
    id: "off",
    title: "Keep prayers private",
    detail: "No automatic prayer updates.",
  },
  {
    id: "first-ever",
    title: "First prayer ever",
    detail: "A single update for your very first prayer. Never repeats.",
  },
  {
    id: "every",
    title: "Every prayer",
    detail: "An update each time you finish a prayer.",
  },
];
export function CircleScreen(): React.JSX.Element {
  const colors = useThemeColors(),
    s = useThemedStyles(makes),
    ui = useInterfaceStyles();
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const selected = section === "friends" ? "friends" : "activity";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const history = usePrayerStore((state) => state.history);
  const prayers = usePrayerStore((state) => state.prayers);
  const habits = useStreakStore((state) => state.habits);
  const posts = useSocialStore((state) => state.posts);
  const now = useCurrentDate();
  const weeklyQuote = posts.find(
    (p) => p.kind === "quote" && p.week === weekKey(now),
  );
  const entries = useMemo(
    () =>
      Object.entries(buildActivityDays(history, habits, prayers))
        .sort(([a], [b]) => b.localeCompare(a))
        .flatMap(([day, items]) => items.map((item) => ({ ...item, day }))),
    [history, habits, prayers],
  );
  const tabs = (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        gap: 4,
        padding: 4,
        borderRadius: 20,
        backgroundColor: colors.mineral,
      }}
    >
      {(["activity", "friends"] as const).map((tab) => (
        <Button
          key={tab}
          variant="ghost"
          size="content"
          haptic="selection"
          accessibilityRole="tab"
          accessibilityState={{ selected: selected === tab }}
          onPress={() => router.setParams({ section: tab })}
          style={{
            flex: 1,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 16,
            backgroundColor: selected === tab ? colors.blue : "transparent",
          }}
        >
          <Text
            style={[
              ui.itemTitle,
              { color: selected === tab ? colors.onAccent : colors.ink },
            ]}
          >
            {tab === "activity" ? "Your activity" : "Friends"}
          </Text>
        </Button>
      ))}
    </View>
  );
  const openPrayers = () =>
    router.push({ pathname: "/prayer", params: { prayerId: "modeh-ani" } });
  const lead = (
    <View style={ui.feature}>
      <Text style={ui.itemTitle}>Your quote of the week</Text>
      <Text
        style={[
          weeklyQuote ? ui.editorial : ui.body,
          weeklyQuote?.language === "he" && {
            fontFamily: fonts.hebrew,
            writingDirection: "rtl",
            textAlign: "right",
          },
        ]}
      >
        {weeklyQuote
          ? `“${weeklyQuote.quote}”`
          : "Find a line in a prayer. Hold it, choose your words, and share it with your circle."}
      </Text>
      {weeklyQuote && <Text style={ui.caption}>{weeklyQuote.practice}</Text>}
      <Button variant="secondary" onPress={openPrayers}>
        <Text>
          {weeklyQuote ? "Choose a different quote" : "Choose in prayer"}
        </Text>
      </Button>
      <Button variant="ghost" onPress={() => setSettingsOpen(true)}>
        <Text>Sharing preferences</Text>
      </Button>
    </View>
  );
  return (
    <View style={s.screen}>
      {selected === "friends" ? (
        <CircleFriends tabs={tabs} lead={lead} />
      ) : (
        <AnimatedHeaderSurface
          largeTitle="Circle"
          rightComponent={
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Sharing preferences"
              onPress={() => setSettingsOpen(true)}
            >
              <SlidersHorizontal size={20} color={colors.ink} />
            </Button>
          }
          subtitle="Prayer, shared simply."
          contentContainerStyle={{ gap: 0 }}
          renderScroll={(header, scrollProps) => (
            <Animated.FlatList
              {...scrollProps}
              data={entries}
              keyExtractor={(item) => `${item.day}:${item.id}`}
              initialNumToRender={8}
              windowSize={5}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListHeaderComponent={
                <View style={{ gap: 24, paddingBottom: 24 }}>
                  {header}
                  {tabs}
                  <ActivityCalendar />
                  <View
                    style={[
                      s.row,
                      { flexWrap: "wrap", alignItems: "baseline" },
                    ]}
                  >
                    <Text style={ui.sectionTitle}>Prayer history</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={ui.caption}>{entries.length} completed</Text>
                  </View>
                </View>
              }
              renderItem={({ item }) => {
                const canRead = Boolean(
                  item.prayerId &&
                  prayers.some((prayer) => prayer.id === item.prayerId),
                );
                const content = (
                  <>
                    <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                      <Text style={ui.itemTitle}>{item.title}</Text>
                      <Text style={ui.caption}>
                        {new Date(`${item.day}T12:00:00`).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </Text>
                      <ActivityTiming
                        startedAt={item.startedAt}
                        completedAt={item.completedAt}
                        durationSeconds={item.durationSeconds}
                      />
                    </View>
                    {canRead ? (
                      <ChevronRight size={16} color={colors.inkMuted} />
                    ) : null}
                  </>
                );
                const style = [
                  ui.surface,
                  {
                    flexDirection: "row" as const,
                    alignItems: "center" as const,
                    gap: 16,
                  },
                ];
                return canRead ? (
                  <Button
                    variant="ghost"
                    size="content"
                    style={style}
                    accessibilityLabel={`Read ${item.title}`}
                    onPress={() =>
                      router.push({
                        pathname: "/prayer",
                        params: { prayerId: item.prayerId! },
                      })
                    }
                  >
                    {content}
                  </Button>
                ) : (
                  <View style={style}>{content}</View>
                );
              }}
              ListEmptyComponent={
                <View style={ui.surface}>
                  <Text style={ui.itemTitle}>Your practice starts here</Text>
                  <Text style={ui.body}>
                    Finish a prayer or check in on Home. It appears here even
                    when sharing is off.
                  </Text>
                  <Button onPress={openPrayers}>
                    <Text>Open a prayer</Text>
                  </Button>
                </View>
              }
              ListFooterComponent={
                <View style={s.notice}>
                  <ShieldCheck size={16} color={colors.inkMuted} />
                  <Text style={[ui.caption, { flex: 1 }]}>
                    Your private history on this device. Add friends and see
                    shared updates in Friends.
                  </Text>
                </View>
              }
            />
          )}
        />
      )}
      <SharingSettings
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}
export function SharingSettings({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const s = useThemedStyles(makes);
  const ui = useInterfaceStyles();

  const preferences = useSocialStore((s) => s.preferences);
  const setPreferences = useSocialStore((s) => s.setPreferences);
  const reduceMotion = useReducedMotion();
  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={s.screen}>
          <View style={[s.row, { padding: 24 }]}>
            <Text style={[s.section, { flex: 1 }]}>
              What your profile shares
            </Text>
            <Button
              variant="ghost"
              size="content"
              accessibilityLabel="Close sharing preferences"
              onPress={onClose}
              style={s.iconButton}
            >
              <X color={colors.ink} size={20} />
            </Button>
          </View>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 32,
              gap: 24,
            }}
          >
            <Text style={s.muted}>
              Choose once. Kavanah creates simple updates from your completed
              prayers. Changes save immediately.
            </Text>
            <View style={{ gap: 12 }}>
              <Text style={s.heading}>Prayer updates</Text>
              <View accessibilityRole="radiogroup" style={s.options}>
                {modes.map((mode) => (
                  <Button
                    key={mode.id}
                    variant="ghost"
                    size="content"
                    haptic="selection"
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: preferences.prayers === mode.id,
                    }}
                    onPress={() =>
                      setPreferences({ ...preferences, prayers: mode.id })
                    }
                    style={[
                      s.option,
                      preferences.prayers === mode.id && s.selectedOption,
                    ]}
                  >
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={ui.itemTitle}>{mode.title}</Text>
                      <Text style={ui.caption}>{mode.detail}</Text>
                    </View>
                    <View
                      style={[
                        s.radio,
                        preferences.prayers === mode.id && {
                          backgroundColor: colors.blue,
                          borderColor: colors.blue,
                        },
                      ]}
                    >
                      {preferences.prayers === mode.id && (
                        <Check size={16} color={colors.onAccent} />
                      )}
                    </View>
                  </Button>
                ))}
              </View>
            </View>
            <View style={s.milestoneOption}>
              <View style={{ flex: 1, gap: 7 }}>
                <Text style={s.heading}>Streak milestones</Text>
                <Text style={ui.caption}>
                  After your first prayer, share milestones at 3, 7, 18, 40, and
                  100 days.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Share streak milestones"
                value={preferences.milestones}
                onValueChange={(milestones) =>
                  setPreferences({ ...preferences, milestones })
                }
                trackColor={{ false: colors.mineral, true: colors.blue }}
                thumbColor={colors.white}
              />
            </View>
            <View style={s.rule}>
              <Info size={20} color={colors.blue} />
              <Text style={[s.muted, { flex: 1 }]}>
                Only new completions create updates. Changing these choices
                never posts your past activity.
              </Text>
            </View>
            <Text style={ui.caption}>
              Weekly quotes are always your choice. Select exact words in a
              prayer; captions and free-form posts are not part of Circle.
            </Text>
          </ScrollView>
          <View style={{ padding: 24, paddingTop: 12 }}>
            <Button size="content" onPress={onClose} style={s.primary}>
              <Text style={s.primaryText}>Done</Text>
            </Button>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
const makes = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.parchment },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    section: {
      fontFamily: fonts.semibold,
      fontSize: 20,
      lineHeight: 28,
      color: colors.ink,
    },
    heading: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      lineHeight: 24,
      color: colors.ink,
    },
    muted: { fontSize: 14, lineHeight: 22, color: colors.inkMuted },
    iconButton: {
      width: 44,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    primary: {
      backgroundColor: colors.blue,
      borderRadius: 18,
      minHeight: 50,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: {
      color: colors.onAccent,
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
    },
    notice: {
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairlineStrong,
      flexDirection: "row",
      gap: 10,
    },
    options: { gap: 10 },
    option: {
      borderWidth: 1,
      borderColor: colors.hairlineStrong,
      backgroundColor: colors.vellum,
      borderRadius: 18,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    selectedOption: {
      backgroundColor: colors.blueSoft,
      borderColor: colors.blue,
    },
    radio: {
      width: 24,
      height: 24,
      borderWidth: 1.75,
      borderColor: colors.inkMuted,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    milestoneOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingVertical: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
    },
    rule: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  });

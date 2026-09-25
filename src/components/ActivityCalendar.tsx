import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { addMonths, format, isSameMonth, startOfMonth } from "date-fns";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { ChevronLeft, ChevronRight } from "./ui/icons";
import { useThemeColors } from "@/design/appearance";
import { useInterfaceStyles } from "@/design/layout";
import { useCurrentDate } from "@/hooks/useCurrentDate";
import { usePrayerStore } from "@/store/prayerStore";
import { useStreakStore } from "@/store/streakStore";
import {
  buildActivityDays,
  calendarDayKey,
  calendarWeeks,
  currentActivityStreak,
} from "@/services/activityCalendar";

export function ActivityCalendar() {
  const colors = useThemeColors();
  const { fontScale } = useWindowDimensions();
  const ui = useInterfaceStyles();
  const now = useCurrentDate();
  const [month, setMonth] = useState(() => startOfMonth(now));
  const [selected, setSelected] = useState(() => calendarDayKey(now));
  const [width, setWidth] = useState(308);
  const history = usePrayerStore((s) => s.history);
  const prayers = usePrayerStore((s) => s.prayers);
  const habits = useStreakStore((s) => s.habits);
  const days = useMemo(
    () => buildActivityDays(history, habits, prayers),
    [history, habits, prayers],
  );
  const weeks = useMemo(() => calendarWeeks(month), [month]);
  const entries = days[selected] ?? [];
  const streak = currentActivityStreak(days, now);
  const monthPrefix = format(month, "yyyy-MM");
  const activeDays = Object.keys(days).filter((day) =>
    day.startsWith(monthPrefix),
  ).length;
  const cell = Math.max(44, 34 * fontScale + 10, width / 7);
  const today = calendarDayKey(now);
  const shades = [
    colors.parchment,
    `${colors.blue}26`,
    `${colors.blue}66`,
    colors.blue,
  ];
  const changeMonth = (direction: number) => {
    const next = addMonths(month, direction);
    setMonth(next);
    setSelected(isSameMonth(next, now) ? today : calendarDayKey(next));
  };
  return (
    <View style={ui.surface}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Previous month"
          haptic="selection"
          onPress={() => changeMonth(-1)}
        >
          <ChevronLeft color={colors.ink} size={16} />
        </Button>
        <Text
          accessibilityRole="header"
          style={[ui.itemTitle, { flex: 1, textAlign: "center" }]}
        >
          {format(month, "MMMM yyyy")}
        </Text>
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Next month"
          haptic="selection"
          disabled={isSameMonth(month, now)}
          onPress={() => changeMonth(1)}
        >
          <ChevronRight color={colors.ink} size={16} />
        </Button>
      </View>
      <Text style={ui.caption}>
        {activeDays} active {activeDays === 1 ? "day" : "days"} this month ·{" "}
        {streak} day current streak
      </Text>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
        >
          <View style={{ width: cell * 7 }}>
            <View style={{ flexDirection: "row" }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
                <Text
                  key={i}
                  style={[
                    ui.caption,
                    { width: cell, textAlign: "center", paddingBottom: 8 },
                  ]}
                  accessible={false}
                >
                  {label}
                </Text>
              ))}
            </View>
            {weeks.map((week, index) => (
              <View key={index} style={{ flexDirection: "row" }}>
                {week.map((date) => {
                  const key = calendarDayKey(date),
                    count = days[key]?.length ?? 0;
                  const inMonth = isSameMonth(date, month),
                    future = key > today;
                  const level = Math.min(count, 3);
                  return (
                    <Button
                      key={key}
                      variant="ghost"
                      size="content"
                      haptic="selection"
                      disabled={!inMonth || future}
                      accessibilityRole="button"
                      accessibilityState={{ selected: key === selected }}
                      accessibilityLabel={`${format(date, "EEEE, MMMM d, yyyy")}, ${count} ${count === 1 ? "activity" : "activities"}${key === today ? ", today" : ""}`}
                      onPress={() => setSelected(key)}
                      style={{
                        width: cell,
                        height: cell,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: cell - 10,
                          height: cell - 10,
                          borderRadius: 8,
                          backgroundColor: shades[level],
                          opacity: !inMonth || future ? 0.25 : 1,
                          borderWidth:
                            key === selected ? 2 : key === today ? 1 : 0,
                          borderColor: colors.ink,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: level === 3 ? colors.onAccent : colors.ink,
                          }}
                        >
                          {date.getDate()}
                        </Text>
                      </View>
                    </Button>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 6,
        }}
        accessible
        accessibilityLabel="Shading indicates no activity, one, two, or three or more activities"
      >
        <Text style={ui.caption}>Less</Text>
        {shades.map((color, i) => (
          <View
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: color,
            }}
          />
        ))}
        <Text style={ui.caption}>More</Text>
      </View>
      <View
        style={{
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.hairline,
          paddingTop: 16,
          gap: 10,
        }}
        accessibilityLiveRegion="polite"
      >
        <Text style={ui.itemTitle}>
          {format(new Date(`${selected}T12:00:00`), "EEEE, MMMM d")}
        </Text>
        {entries.length ? (
          entries.map((entry) => (
            <View key={entry.id} style={{ gap: 2 }}>
              <Text style={ui.body}>{entry.title}</Text>
              <Text style={ui.caption}>
                {entry.completedAt
                  ? `Completed ${format(new Date(entry.completedAt), "h:mm a")}${entry.durationSeconds !== undefined ? ` · ${entry.durationSeconds < 60 ? `${entry.durationSeconds}s` : `${Math.floor(entry.durationSeconds / 60)}m ${entry.durationSeconds % 60}s`}` : ""}`
                  : "Daily check-in"}
              </Text>
            </View>
          ))
        ) : (
          <Text style={ui.body}>
            {selected === today
              ? "Your completed prayers will appear here."
              : "No activity recorded for this day."}
          </Text>
        )}
      </View>
      <Text style={ui.caption}>
        Saved prayers and daily check-ins. Private, even when sharing is off.
      </Text>
    </View>
  );
}

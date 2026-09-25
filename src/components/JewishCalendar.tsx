import { useMemo, useState } from "react";
import { ScrollView, Switch, View, useWindowDimensions } from "react-native";
import { addMonths, format, isSameMonth, startOfMonth } from "date-fns";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { ChevronLeft, ChevronRight } from "./ui/icons";
import { useThemeColors } from "@/design/appearance";
import { useInterfaceStyles } from "@/design/layout";
import { useCurrentDate } from "@/hooks/useCurrentDate";
import { useSettingsStore } from "@/store/settingsStore";
import { calendarDayKey, calendarWeeks } from "@/services/activityCalendar";
import { jewishCalendarDay } from "@/services/jewishCalendar";

export function JewishCalendarView() {
  const colors = useThemeColors(),
    ui = useInterfaceStyles(),
    now = useCurrentDate();
  const { fontScale } = useWindowDimensions();
  const [month, setMonth] = useState(() => startOfMonth(now));
  const [selected, setSelected] = useState(now);
  const [width, setWidth] = useState(308);
  const inIsrael = useSettingsStore((s) => s.calendarInIsrael);
  const setInIsrael = useSettingsStore((s) => s.setCalendarInIsrael);
  const weeks = useMemo(
    () =>
      calendarWeeks(month).map((week) =>
        week.map((date) => jewishCalendarDay(date, inIsrael)),
      ),
    [month, inIsrael],
  );
  const day = jewishCalendarDay(selected, inIsrael);
  const holidays = weeks
    .flat()
    .filter((d) => isSameMonth(d.date, month) && d.events.length);
  const cell = Math.max(44, 34 * fontScale + 10, width / 7);
  const select = (date: Date) => {
    setSelected(date);
    setMonth(startOfMonth(date));
  };
  return (
    <>
      <View style={ui.surface}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel="Previous month"
            haptic="selection"
            onPress={() => select(addMonths(month, -1))}
          >
            <ChevronLeft size={20} color={colors.ink} />
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
            onPress={() => select(addMonths(month, 1))}
          >
            <ChevronRight size={20} color={colors.ink} />
          </Button>
        </View>
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <ScrollView
            horizontal
            bounces={false}
            showsHorizontalScrollIndicator={false}
          >
            <View style={{ width: cell * 7 }}>
              <View style={{ flexDirection: "row" }}>
                {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
                  <Text
                    key={i}
                    accessible={false}
                    style={[
                      ui.caption,
                      { width: cell, textAlign: "center", paddingBottom: 8 },
                    ]}
                  >
                    {label}
                  </Text>
                ))}
              </View>
              {weeks.map((week, i) => (
                <View key={i} style={{ flexDirection: "row" }}>
                  {week.map((d) => {
                    const active =
                      calendarDayKey(d.date) === calendarDayKey(selected);
                    const today =
                      calendarDayKey(d.date) === calendarDayKey(now);
                    return (
                      <Button
                        key={calendarDayKey(d.date)}
                        variant="ghost"
                        size="content"
                        haptic="selection"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`${format(d.date, "EEEE, MMMM d")}, ${d.hebrewDate}${today ? ", today" : ""}${d.events.length ? `, ${d.events.join(", ")}` : ""}`}
                        onPress={() => select(d.date)}
                        style={{
                          width: cell,
                          height: cell + 8,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            width: cell - 4,
                            height: cell + 4,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 3,
                            backgroundColor: active
                              ? colors.blue
                              : "transparent",
                            borderWidth: today ? 1 : 0,
                            borderColor: colors.blue,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              color: active
                                ? colors.onAccent
                                : isSameMonth(d.date, month)
                                  ? colors.ink
                                  : colors.inkMuted,
                            }}
                          >
                            {d.date.getDate()}
                          </Text>
                          <View
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: d.events.length
                                ? active
                                  ? colors.onAccent
                                  : colors.blue
                                : "transparent",
                            }}
                          />
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
            justifyContent: "space-between",
          }}
        >
          <Text style={ui.caption}>• Holiday or observance</Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => select(now)}
            accessibilityLabel="Return to today"
          >
            <Text style={{ color: colors.blue }}>Today</Text>
          </Button>
        </View>
      </View>
      <View style={ui.feature} accessibilityLiveRegion="polite">
        <Text style={ui.caption}>{format(selected, "EEEE, MMMM d")}</Text>
        <Text style={ui.editorial}>{day.hebrewDate}</Text>
        {day.events.map((event) => (
          <Text key={event} style={ui.itemTitle}>
            {event}
          </Text>
        ))}
        {day.parsha ? (
          <Text style={ui.body}>Torah reading · {day.parsha}</Text>
        ) : null}
        {day.omer > 0 ? (
          <Text style={ui.body}>Day {day.omer} of the Omer</Text>
        ) : null}
        {!day.events.length && !day.parsha && day.omer < 1 ? (
          <Text style={ui.body}>No holiday on this date.</Text>
        ) : null}
        <Text style={ui.caption}>
          Hebrew dates begin the evening before. Dates here refer to the
          daytime; fast start times vary.
        </Text>
      </View>
      <View style={ui.surface}>
        <Text accessibilityRole="header" style={ui.sectionTitle}>
          This month
        </Text>
        {holidays.length ? (
          holidays.map((d) => (
            <Button
              key={calendarDayKey(d.date)}
              variant="ghost"
              size="content"
              onPress={() => select(d.date)}
              accessibilityLabel={`${format(d.date, "MMMM d")}, ${d.events.join(", ")}`}
              style={{ paddingVertical: 12, gap: 4 }}
            >
              <Text style={ui.caption}>{format(d.date, "EEE, MMM d")}</Text>
              <Text style={ui.itemTitle}>{d.events.join(" · ")}</Text>
            </Button>
          ))
        ) : (
          <Text style={ui.body}>No holidays this month.</Text>
        )}
      </View>
      <View style={ui.surface}>
        <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={ui.itemTitle}>Observe in Israel</Text>
            <Text style={ui.caption}>
              {inIsrael
                ? "Israel holiday schedule"
                : "Diaspora holiday schedule"}
            </Text>
          </View>
          <Switch
            value={inIsrael}
            onValueChange={setInIsrael}
            accessibilityLabel="Observe holidays in Israel"
            trackColor={{ false: colors.mineral, true: colors.blue }}
          />
        </View>
        <Text style={ui.caption}>
          Includes festivals, fasts, Rosh Chodesh and modern Israeli
          observances. Calculated on your device.
        </Text>
      </View>
    </>
  );
}

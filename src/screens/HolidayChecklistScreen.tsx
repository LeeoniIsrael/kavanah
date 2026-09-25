import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { format, isValid, parseISO } from "date-fns";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Check, X } from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
import { useInterfaceStyles } from "@/design/layout";
import { useCurrentDate } from "@/hooks/useCurrentDate";
import { useSettingsStore } from "@/store/settingsStore";
import { useReminderStore } from "@/store/reminderStore";
import {
  checklistItems,
  holidayOn,
  upcomingHolidays,
} from "@/services/reminderPlan";

export function HolidayChecklistScreen() {
  const colors = useThemeColors(),
    ui = useInterfaceStyles(),
    router = useRouter(),
    now = useCurrentDate();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const israel = useSettingsStore((s) => s.calendarInIsrael);
  const { checklists, toggleTask, error } = useReminderStore();
  const upcoming = upcomingHolidays(now, israel, 365).filter(
    (h) => h.kind === "festival",
  );
  const selected =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) && isValid(parseISO(date))
      ? holidayOn(parseISO(date), israel)
      : null;
  const holiday = selected ?? upcoming[0];
  const tasks = holiday ? checklistItems(holiday.title) : [];
  const done = holiday ? (checklists[holiday.key] ?? []) : [];
  return (
    <Screen
      largeTitle="Prepare gently"
      subtitle="A little preparation. More room for the day."
      rightComponent={
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Close holiday checklist"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/zmanim?section=calendar")
          }
        >
          <X size={20} color={colors.ink} />
        </Button>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {upcoming.slice(0, 8).map((h) => (
            <Button
              key={h.key}
              variant={h.key === holiday?.key ? "default" : "secondary"}
              size="sm"
              accessibilityState={{ selected: h.key === holiday?.key }}
              onPress={() => router.setParams({ date: h.key })}
            >
              <Text>
                {h.title} · {format(h.date, "MMM d")}
              </Text>
            </Button>
          ))}
        </View>
      </ScrollView>
      {holiday ? (
        <>
          <View style={ui.feature}>
            <Text style={ui.caption}>
              {format(holiday.date, "EEEE, MMMM d, yyyy")}
            </Text>
            <Text style={ui.editorial}>{holiday.title}</Text>
            <Text style={ui.body}>
              {tasks.filter((t) => done.includes(t)).length} of {tasks.length}{" "}
              ready
            </Text>
            <Text style={ui.caption}>
              A personal planning aid. Follow your own customs.
            </Text>
          </View>
          <View style={ui.surface}>
            {tasks.map((task) => (
              <Button
                key={task}
                variant="ghost"
                size="content"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done.includes(task) }}
                accessibilityLabel={task}
                haptic="selection"
                onPress={() => toggleTask(holiday.key, task)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingVertical: 14,
                }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    backgroundColor: done.includes(task)
                      ? colors.blue
                      : colors.mineral,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {done.includes(task) ? (
                    <Check size={16} color={colors.onAccent} />
                  ) : null}
                </View>
                <Text style={[ui.itemTitle, { flex: 1 }]}>{task}</Text>
              </Button>
            ))}
          </View>
        </>
      ) : (
        <Text style={ui.body}>No upcoming festival found.</Text>
      )}
      {error ? (
        <Text accessibilityRole="alert" style={ui.body}>
          {error}
        </Text>
      ) : null}
      <Button variant="secondary" onPress={() => router.push("/notifications")}>
        <Text>Customize reminders</Text>
      </Button>
      <Text style={ui.caption}>
        Your checklist saves on this device. Each holiday has its own list.
      </Text>
    </Screen>
  );
}

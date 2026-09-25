import { useState } from "react";
import { Linking, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { X, ChevronRight } from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
import { useInterfaceStyles } from "@/design/layout";
import { useReminderStore } from "@/store/reminderStore";
import { useSettingsStore } from "@/store/settingsStore";
import {
  prayerReminders,
  timedReminders,
  validTime,
  type ReminderPreferences,
} from "@/services/reminderPlan";
import {
  requestReminderPermission,
  sendTestReminder,
  syncReminders,
} from "@/services/reminderScheduler";
import { requestZmanimLocation } from "@/services/location";

export function ReminderToggle({
  title,
  detail,
  value,
  onChange,
  disabled = false,
}: {
  title: string;
  detail?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const ui = useInterfaceStyles();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        minHeight: 52,
      }}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={ui.itemTitle}>{title}</Text>
        {detail ? <Text style={ui.caption}>{detail}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={title}
        checked={value}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </View>
  );
}
function ValueField({
  label,
  value,
  onChange,
  time = false,
  max = 120,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  time?: boolean;
  max?: number;
}) {
  const colors = useThemeColors(),
    ui = useInterfaceStyles();
  const [draft, setDraft] = useState(value),
    [invalid, setInvalid] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);
  if (previousValue !== value) {
    setPreviousValue(value);
    setDraft(value);
    setInvalid(false);
  }
  const commit = () => {
    const normalized = draft.trim();
    const valid = time
      ? validTime(normalized)
      : /^\d+$/.test(normalized) && Number(normalized) <= max;
    setInvalid(!valid);
    if (valid) onChange(normalized);
  };
  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          minHeight: 48,
        }}
      >
        <Text style={[ui.body, { flex: 1 }]}>{label}</Text>
        <TextInput
          accessibilityLabel={`${label}${time ? ", 24-hour time" : ""}`}
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType={time ? "numbers-and-punctuation" : "number-pad"}
          returnKeyType="done"
          selectTextOnFocus
          maxLength={time ? 5 : 3}
          style={[
            ui.itemTitle,
            {
              minWidth: 88,
              minHeight: 44,
              textAlign: "center",
              padding: 10,
              borderRadius: 12,
              backgroundColor: colors.mineral,
            },
          ]}
        />
      </View>
      {invalid ? (
        <Text accessibilityRole="alert" style={ui.caption}>
          {time
            ? "Use 24-hour time, like 08:30 or 19:00."
            : `Enter a number from 0 to ${max}.`}
        </Text>
      ) : null}
    </View>
  );
}
export function NotificationSettingsScreen() {
  const router = useRouter(),
    ui = useInterfaceStyles(),
    colors = useThemeColors();
  const {
    prefs,
    update,
    location,
    setLocation,
    status,
    error,
    syncing,
    preview,
  } = useReminderStore();
  const inIsrael = useSettingsStore((s) => s.calendarInIsrael),
    setInIsrael = useSettingsStore((s) => s.setCalendarInIsrael);
  const [working, setWorking] = useState(false),
    [message, setMessage] = useState("");
  const locate = async () => {
    setWorking(true);
    setMessage("");
    try {
      setLocation(await requestZmanimLocation());
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Location unavailable. Please try again.",
      );
    } finally {
      setWorking(false);
    }
  };
  const enable = async (value: boolean) => {
    if (!value) {
      update({ enabled: false });
      return;
    }
    setWorking(true);
    setMessage("");
    try {
      if (await requestReminderPermission()) {
        update({ enabled: true });
        if (!location) setLocation(await requestZmanimLocation());
      } else
        setMessage(
          "Allow notifications in device settings, then turn reminders on.",
        );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Could not enable reminders. Please try again.",
      );
    } finally {
      setWorking(false);
    }
  };
  const testReminder = async () => {
    setWorking(true);
    try {
      setMessage(
        (await sendTestReminder())
          ? "Test scheduled for five seconds from now."
          : "Allow notifications in device settings to receive a test.",
      );
    } catch {
      setMessage("The test could not be sent. Please try again.");
    } finally {
      setWorking(false);
    }
  };
  const preset = (kind: "morning" | "prayers" | "holidays") => {
    const prayers = { ...prefs.prayers };
    for (const row of prayerReminders)
      prayers[row.id] = {
        ...prayers[row.id],
        enabled:
          kind === "prayers" ||
          (kind === "morning" &&
            (row.id === "tefillin" || row.id === "shacharit")),
      };
    update({
      prayers,
      holidays: { ...prefs.holidays, enabled: kind === "holidays" },
      checklist: { ...prefs.checklist, enabled: kind === "holidays" },
    });
    setMessage("Choices saved. You can adjust each one below.");
  };
  const holidayChange = (change: Partial<ReminderPreferences["holidays"]>) =>
    update({ holidays: { ...prefs.holidays, ...change } });
  return (
    <Screen
      largeTitle="Notifications"
      subtitle="A gentle nudge. On your terms."
      rightComponent={
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Close notification settings"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/profile")
          }
        >
          <X size={20} color={colors.ink} />
        </Button>
      }
    >
      <View style={ui.feature}>
        <ReminderToggle
          title="Allow reminders"
          detail="Only the reminders you choose."
          value={prefs.enabled}
          disabled={working}
          onChange={(v) => void enable(v)}
        />
        <Text style={ui.body} accessibilityLiveRegion="polite">
          {working
            ? "Updating…"
            : syncing
              ? "Updating your reminders…"
              : status}
        </Text>
        {message || error ? (
          <Text style={ui.body} accessibilityRole="alert">
            {error || message}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => void Linking.openSettings()}
          >
            <Text style={{ color: colors.blue }}>Device settings</Text>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={working}
            onPress={() => void testReminder()}
          >
            <Text style={{ color: colors.blue }}>Send a test</Text>
          </Button>
          {error ? (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => void syncReminders()}
            >
              <Text>Retry</Text>
            </Button>
          ) : null}
        </View>
      </View>
      <View style={ui.surface}>
        <Text style={ui.sectionTitle}>Start simply</Text>
        <Text style={ui.body}>
          Choose a starting point, then make it yours.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(
            [
              ["morning", "Morning"],
              ["prayers", "Daily prayers"],
              ["holidays", "Holidays"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant="secondary"
              size="sm"
              onPress={() => preset(key)}
            >
              <Text>{label}</Text>
            </Button>
          ))}
        </View>
        <Text style={ui.caption}>
          Presets replace the prayer and holiday choices below. They don’t turn
          notifications on.
        </Text>
      </View>
      <Text style={ui.sectionTitle}>Your daily rhythm</Text>
      {prayerReminders.map((row) => {
        const setting = prefs.prayers[row.id];
        const change = (v: Partial<typeof setting>) =>
          update({
            prayers: { ...prefs.prayers, [row.id]: { ...setting, ...v } },
          });
        return (
          <View key={row.id} style={ui.surface}>
            <ReminderToggle
              title={row.title}
              detail={
                setting.enabled
                  ? `${setting.time} · ${setting.days.length} days a week`
                  : row.body
              }
              value={setting.enabled}
              onChange={(enabled) => change({ enabled })}
            />
            {setting.enabled ? (
              <>
                <ValueField
                  label="At (24-hour time)"
                  value={setting.time}
                  time
                  onChange={(time) => change({ time })}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d, i) => (
                        <Button
                          key={d}
                          variant={
                            setting.days.includes(i) ? "default" : "secondary"
                          }
                          size="sm"
                          accessibilityLabel={`${row.title} on ${d}`}
                          accessibilityState={{
                            selected: setting.days.includes(i),
                          }}
                          onPress={() =>
                            change({
                              days: setting.days.includes(i)
                                ? setting.days.filter((day) => day !== i)
                                : [...setting.days, i],
                            })
                          }
                          style={{ minWidth: 44 }}
                        >
                          <Text>{d}</Text>
                        </Button>
                      ),
                    )}
                  </View>
                </ScrollView>
                {!setting.days.length ? (
                  <Text style={ui.caption}>
                    Choose at least one day to receive this reminder.
                  </Text>
                ) : null}
                {row.id === "tefillin" ? (
                  <>
                    <Text style={ui.caption}>
                      Sent only between local sunrise and sunset. Always skips
                      Shabbat and major holidays.
                    </Text>
                    <ReminderToggle
                      title="Skip Chol HaMoed"
                      detail="Keep this on if that is your custom."
                      value={prefs.skipCholHamoed}
                      onChange={(skipCholHamoed) => update({ skipCholHamoed })}
                    />
                  </>
                ) : null}
                <Text style={ui.caption}>
                  Skipped when you’ve already marked this practice done.
                </Text>
              </>
            ) : null}
          </View>
        );
      })}
      <View style={ui.surface}>
        <Text style={ui.sectionTitle}>Follow local prayer times</Text>
        <Text style={ui.body}>
          These adjust with the sun. Clock reminders above stay at the time you
          choose.
        </Text>
        {timedReminders.map((row) => {
          const setting = prefs.zmanim[row.id];
          return (
            <View key={row.id} style={{ gap: 8, paddingVertical: 8 }}>
              <ReminderToggle
                title={row.title}
                detail={row.method}
                value={setting.enabled}
                onChange={(enabled) =>
                  update({
                    zmanim: {
                      ...prefs.zmanim,
                      [row.id]: { ...setting, enabled },
                    },
                  })
                }
              />
              {setting.enabled ? (
                <ValueField
                  label="Minutes before · 0 means at the time"
                  value={String(setting.lead)}
                  onChange={(lead) =>
                    update({
                      zmanim: {
                        ...prefs.zmanim,
                        [row.id]: { ...setting, lead: Number(lead) },
                      },
                    })
                  }
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={ui.surface}>
        <ReminderToggle
          title="Upcoming holidays"
          detail="One heads-up for each holiday start."
          value={prefs.holidays.enabled}
          onChange={(enabled) => holidayChange({ enabled })}
        />
        {prefs.holidays.enabled ? (
          <>
            <ValueField
              label="Days before the start"
              max={14}
              value={String(prefs.holidays.lead)}
              onChange={(lead) => holidayChange({ lead: Number(lead) })}
            />
            <ValueField
              label="Send at (24-hour time)"
              time
              value={prefs.holidays.time}
              onChange={(time) => holidayChange({ time })}
            />
            <ReminderToggle
              title="Festivals"
              value={prefs.holidays.festivals}
              onChange={(festivals) => holidayChange({ festivals })}
            />
            <ReminderToggle
              title="Fast days"
              value={prefs.holidays.fasts}
              onChange={(fasts) => holidayChange({ fasts })}
            />
            <ReminderToggle
              title="Rosh Chodesh"
              value={prefs.holidays.roshChodesh}
              onChange={(roshChodesh) => holidayChange({ roshChodesh })}
            />
            <Text style={ui.caption}>
              For evening-start holidays, advance notice counts back from that
              evening’s date. Minor fasts use the daytime date.
            </Text>
          </>
        ) : null}
      </View>
      <View style={ui.surface}>
        <ReminderToggle
          title="Holiday preparation"
          detail="A checklist reminder, once per festival."
          value={prefs.checklist.enabled}
          onChange={(enabled) =>
            update({ checklist: { ...prefs.checklist, enabled } })
          }
        />
        {prefs.checklist.enabled ? (
          <>
            <ValueField
              label="Days before the start"
              max={14}
              value={String(prefs.checklist.lead)}
              onChange={(lead) =>
                update({
                  checklist: { ...prefs.checklist, lead: Number(lead) },
                })
              }
            />
            <ValueField
              label="Send at (24-hour time)"
              time
              value={prefs.checklist.time}
              onChange={(time) =>
                update({ checklist: { ...prefs.checklist, time } })
              }
            />
            <Text style={ui.caption}>
              No reminder if you’ve finished the checklist.
            </Text>
          </>
        ) : null}
        <Button
          variant="secondary"
          onPress={() => router.push("/holiday-checklist")}
        >
          <Text>Open holiday checklist</Text>
          <ChevronRight size={16} color={colors.ink} />
        </Button>
      </View>
      <View style={ui.surface}>
        <Text style={ui.sectionTitle}>Keep it quiet</Text>
        <ReminderToggle
          title="Play a sound"
          value={prefs.sound}
          onChange={(sound) => update({ sound })}
        />
        <ReminderToggle
          title="Quiet hours"
          detail="Reminders in this window are skipped, never delayed."
          value={prefs.quiet}
          onChange={(quiet) => update({ quiet })}
        />
        {prefs.quiet ? (
          <>
            <ValueField
              label="From (24-hour time)"
              time
              value={prefs.quietStart}
              onChange={(quietStart) => update({ quietStart })}
            />
            <ValueField
              label="Until (24-hour time)"
              time
              value={prefs.quietEnd}
              onChange={(quietEnd) => update({ quietEnd })}
            />
            {prefs.quietStart === prefs.quietEnd ? (
              <Text style={ui.caption}>
                Matching times silence reminders all day.
              </Text>
            ) : null}
          </>
        ) : null}
        <ReminderToggle
          title="Quiet on Shabbat & holidays"
          detail="Sunset to nightfall on Shabbat and major holidays."
          value={prefs.pauseHolyDays}
          onChange={(pauseHolyDays) => update({ pauseHolyDays })}
        />
      </View>
      <View style={ui.surface}>
        <Text style={ui.sectionTitle}>Location & observance</Text>
        <Text style={ui.body}>
          {location?.label ??
            "Location needed for accurate times and quiet days."}
        </Text>
        <Button
          variant="secondary"
          isLoading={working}
          onPress={() => void locate()}
        >
          <Text>{location ? "Update location" : "Set location"}</Text>
        </Button>
        <ReminderToggle
          title="Observe in Israel"
          detail={
            inIsrael ? "Israel holiday schedule" : "Diaspora holiday schedule"
          }
          value={inIsrael}
          onChange={setInIsrael}
        />
        <Text style={ui.caption}>
          Update your location when traveling. Reminders use your device’s time
          zone. All choices save automatically.
        </Text>
      </View>
      {preview.length ? (
        <View style={ui.surface}>
          <Text style={ui.sectionTitle}>Coming up</Text>
          {preview.map((p, i) => (
            <View key={i} style={{ gap: 3, paddingVertical: 6 }}>
              <Text style={ui.itemTitle}>{p.title}</Text>
              <Text style={ui.caption}>
                {format(new Date(p.date), "EEE, MMM d · h:mm a")}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={ui.caption}>
        Reminders are scheduled on this device, up to 30 days ahead within the
        device’s pending-notification limit. Open Kavanah regularly to refill
        them. System Focus and notification settings can silence delivery.
      </Text>
    </Screen>
  );
}

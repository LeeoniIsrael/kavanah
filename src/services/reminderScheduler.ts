import { localWritesSuspended } from "@/services/mmkv";
import { accountScope, isCurrentAccountScope } from "./accountScope";
import { habitForPrayer } from "./practiceHabit";
import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";
import { format } from "date-fns";
import { buildReminderPlan } from "./reminderPlan";
import { useReminderStore } from "@/store/reminderStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useZmanimStore } from "@/store/zmanimStore";
import { useStreakStore } from "@/store/streakStore";
import { usePrayerStore } from "@/store/prayerStore";

export async function requestReminderPermission() {
  if (Platform.OS === "web") return false;
  await setupChannels();
  let permission = await Notifications.getPermissionsAsync();
  if (!allows(permission) && permission.canAskAgain)
    permission = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
  return allows(permission);
}
export async function sendTestReminder(): Promise<boolean> {
  const scope = accountScope();
  if (!scope.owner || !(await requestReminderPermission()) || !isCurrentAccountScope(scope)) return false;
  const sound = useReminderStore.getState().prefs.sound;
  let sent = false;
  const pending = queue.catch(() => undefined).then(async () => {
    if (!isCurrentAccountScope(scope) || localWritesSuspended()) return;
    await Notifications.cancelScheduledNotificationAsync("kavanah-notification-test");
    if (!isCurrentAccountScope(scope) || localWritesSuspended()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: "kavanah-notification-test",
      content: {
        title: "Kavanah", body: "A gentle reminder, just as you chose.",
        sound: sound ? "default" : false,
        data: { type: "practice-reminder", url: "kavanah://notifications" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + 5000), channelId: sound ? "practice-sound" : "practice-quiet",
      },
    });
    sent = true;
  });
  queue = pending.catch(() => undefined);
  await pending;
  return sent && isCurrentAccountScope(scope);
}

const allows = (p: Notifications.NotificationPermissionsStatus) =>
  p.granted ||
  p.status === "granted" ||
  p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
async function setupChannels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("practice-quiet", {
    name: "Quiet practice reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: [0],
  });
  await Notifications.setNotificationChannelAsync("practice-sound", {
    name: "Practice reminders with sound",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });
}
const owned = (n: Notifications.NotificationRequest) =>
  n.identifier.startsWith("kavanah-reminder:") ||
  n.content.data?.type === "zman";
// Serialize native queue edits. Rapid preference changes always finish with the latest state.
let queue = Promise.resolve();
export function syncReminders(): Promise<void> {
  queue = queue.catch(() => undefined).then(reconcile);
  return queue;
}
async function reconcile() {
  if (Platform.OS === "web") {
    useReminderStore.setState({ syncing: false, scheduled: 0, preview: [], status: "Reminders are available in the iOS and Android app." });
    return;
  }
  if (localWritesSuspended()) return;
  const scope = accountScope();
  const current = () => isCurrentAccountScope(scope) && !localWritesSuspended();
  const state = useReminderStore.getState(),
    prefs = state.prefs;
  useReminderStore.setState({ syncing: true, error: null });
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const permission = await Notifications.getPermissionsAsync();
    const active =
      current() && prefs.enabled && allows(permission) && Boolean(state.location);
    const completed: Record<string, string[]> = Object.fromEntries(
      useStreakStore
        .getState()
        .habits.map((h) => [h.habit, [...h.completedDates]]),
    );
    for (const h of usePrayerStore.getState().history) {
      const prayer = usePrayerStore
        .getState()
        .prayers.find((p) => p.id === h.prayerId);
      const habit = prayer ? habitForPrayer(prayer) : undefined;
      if (habit)
        (completed[habit] ??= []).push(
          format(new Date(h.completedAt), "yyyy-MM-dd"),
        );
    }
    const plan = active
      ? buildReminderPlan(
          prefs,
          state.location!,
          useSettingsStore.getState().calendarInIsrael,
          new Date(),
          completed,
          state.checklists,
        )
      : [];
    const capacity = Math.max(0, 60 - existing.filter((n) => !owned(n)).length);
    const desired = plan.slice(0, capacity);
    const fingerprint = (p: (typeof desired)[number]) =>
      JSON.stringify([
        p.date.toISOString(),
        p.title,
        p.body,
        p.url,
        prefs.sound,
      ]);
    const wanted = new Map(desired.map((p) => [p.id, fingerprint(p)]));
    for (const n of existing.filter(owned))
      if (
        !wanted.has(n.identifier) ||
        wanted.get(n.identifier) !== n.content.data?.fingerprint
      )
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
    if (active) await setupChannels();
    for (const p of desired) {
      if (!current()) return;
      if (
        existing.some(
          (n) =>
            n.identifier === p.id &&
            n.content.data?.fingerprint === fingerprint(p),
        )
      )
        continue;
      await Notifications.scheduleNotificationAsync({
        identifier: p.id,
        content: {
          title: p.title,
          body: p.body,
          sound: prefs.sound ? "default" : false,
          data: {
            type: "practice-reminder",
            url: p.url,
            fingerprint: fingerprint(p),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: p.date,
          channelId: prefs.sound ? "practice-sound" : "practice-quiet",
        },
      });
    }
    const until =
      plan.length > capacity && desired.length
        ? desired[desired.length - 1]!.date
        : new Date(Date.now() + 29 * 86400000);
    if (!current() && scope.owner) return;
    useReminderStore.setState({
      scheduled: desired.length,
      preview: desired
        .slice(0, 4)
        .map((p) => ({ title: p.title, date: p.date.toISOString() })),
      status: !prefs.enabled
        ? "Reminders are off."
        : !allows(permission)
          ? "Notifications are off in device settings."
          : !state.location
            ? "Set your location to schedule reminders."
            : !desired.length
              ? "No reminders scheduled. Choose a reminder below or check your quiet hours."
              : `${desired.length} reminders scheduled through ${format(until, "MMM d")}. Open Kavanah regularly to keep them current.`,
    });
  } catch {
    if (!current()) return;
    useReminderStore.setState({
      error:
        "Reminders could not be updated. Please retry; previous reminders may still be scheduled.",
    });
  } finally {
    if (current() || !scope.owner) useReminderStore.setState({ syncing: false });
  }
}
export function startReminderScheduling() {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void syncReminders();
    }, 250);
  };
  const stopPrefs = useReminderStore.subscribe((a, b) => {
    if (
      a.prefs !== b.prefs ||
      a.location !== b.location ||
      a.checklists !== b.checklists
    )
      schedule();
  });
  const stopSettings = useSettingsStore.subscribe((a, b) => {
    if (a.calendarInIsrael !== b.calendarInIsrael) schedule();
  });
  const stopZman = useZmanimStore.subscribe((a, b) => {
    if (a.location && a.location !== b.location)
      useReminderStore.getState().setLocation(a.location);
  });
  const stopHabits = useStreakStore.subscribe((a, b) => {
    if (a.habits !== b.habits) schedule();
  });
  const stopHistory = usePrayerStore.subscribe((a, b) => {
    if (a.history !== b.history) schedule();
  });
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") schedule();
  });
  const daily = setInterval(schedule, 60 * 60 * 1000);
  if (useZmanimStore.getState().location)
    useReminderStore
      .getState()
      .setLocation(useZmanimStore.getState().location!);
  schedule();
  return () => {
    clearTimeout(timer);
    clearInterval(daily);
    stopPrefs();
    stopSettings();
    stopZman();
    stopHabits();
    stopHistory();
    subscription.remove();
  };
}

export function cancelLocalRemindersForDeletion(): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();
  const pending = queue.catch(() => undefined).then(async () => {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of notifications) {
      if (owned(notification) || notification.identifier === "kavanah-notification-test" || notification.content.data?.type === "travel-prayer")
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  });
  // New reconciliations must wait for cancellation as well as earlier schedules.
  queue = pending.catch(() => undefined);
  return pending;
}

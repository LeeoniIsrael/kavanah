import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { userStorage } from "@/services/mmkv";
import type { Zman } from "@/types/zmanim";

const TRAVEL_CATEGORY_ID = "travel_prayer";
const TRAVEL_NOTIFICATION_KEY = "notifications.travel-prayer-id";
const OPEN_TRAVEL_PRAYER_ACTION = "OPEN_TRAVEL_PRAYER";
export const TRAVEL_PRAYER_URL =
  "kavanah://prayer?query=travel&prayerId=tefilat-haderech";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldPlaySound: Boolean(notification.request.content.sound),
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function initializeNotifications(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }
  const existing = await Notifications.getPermissionsAsync();
  const finalStatus =
    existing.status === "granted"
      ? existing.status
      : (await Notifications.requestPermissionsAsync()).status;
  return finalStatus === "granted";
}

export async function scheduleZmanNotifications(zmanim: Zman[]): Promise<void> {
  const allowed = await initializeNotifications();
  if (!allowed) {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => notification.content.data?.type === "zman")
      .map((notification) =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier),
      ),
  );
  const now = Date.now();
  await Promise.all(
    zmanim.map(async (zman) => {
      const triggerAt =
        zman.time.getTime() - zman.notificationLeadMinutes * 60_000;
      if (triggerAt <= now) {
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: zman.title,
          body: `${zman.title} is in ${zman.notificationLeadMinutes} minutes.`,
          data: { type: "zman" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(triggerAt),
        },
      });
    }),
  );
}

/** Retire the manual reminder flow without touching zmanim or other notifications. */
export async function retireTravelPrayerReminders(): Promise<void> {
  if (!Device.isDevice) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const legacyId = userStorage.getString(TRAVEL_NOTIFICATION_KEY);
  const identifiers = new Set(
    scheduled
      .filter(
        (notification) =>
          notification.content.data?.type === "travel-prayer" ||
          notification.content.categoryIdentifier === TRAVEL_CATEGORY_ID,
      )
      .map((notification) => notification.identifier),
  );
  if (legacyId) identifiers.add(legacyId);
  await Promise.all(
    [...identifiers].map((id) =>
      Notifications.cancelScheduledNotificationAsync(id),
    ),
  );
  // Clear only after cancellation succeeds; a failed cleanup retries next launch.
  userStorage.set(TRAVEL_NOTIFICATION_KEY, "");
  userStorage.set("settings.travel-notifications", "false");
}

export function getNotificationNavigationUrl(
  response: Notifications.NotificationResponse,
): string | null {
  const type = response.notification.request.content.data?.type;
  const action = response.actionIdentifier;
  if (
    type === "practice-reminder" &&
    action === Notifications.DEFAULT_ACTION_IDENTIFIER
  ) {
    const url = response.notification.request.content.data?.url;
    if (
      typeof url === "string" &&
      /^kavanah:\/\/(?:prayer|zmanim|holiday-checklist|notifications)(?:\?|$)/.test(
        url,
      )
    )
      return url;
    return null;
  }
  if (
    type !== "travel-prayer" ||
    (action !== Notifications.DEFAULT_ACTION_IDENTIFIER &&
      action !== OPEN_TRAVEL_PRAYER_ACTION)
  ) {
    return null;
  }
  return TRAVEL_PRAYER_URL;
}

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { userStorage } from "@/services/mmkv";
import type { Zman } from "@/types/zmanim";

const TRAVEL_CATEGORY_ID = "travel_prayer";
const TRAVEL_CHANNEL_ID = "travel-prayer";
const TRAVEL_NOTIFICATION_KEY = "notifications.travel-prayer-id";
const OPEN_TRAVEL_PRAYER_ACTION = "OPEN_TRAVEL_PRAYER";
export const TRAVEL_PRAYER_URL = "kavanah://prayer?query=travel&prayerId=tefilat-haderech";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function initializeNotifications(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }
  await configureNotificationCategories();
  const existing = await Notifications.getPermissionsAsync();
  const finalStatus = existing.status === "granted" ? existing.status : (await Notifications.requestPermissionsAsync()).status;
  return finalStatus === "granted";
}

export async function configureNotificationCategories(): Promise<void> {
  if (!Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(TRAVEL_CHANNEL_ID, {
      name: "Travel prayer reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180],
      lightColor: "#1F5EFF"
    });
  }

  await Notifications.setNotificationCategoryAsync(TRAVEL_CATEGORY_ID, [
    {
      identifier: OPEN_TRAVEL_PRAYER_ACTION,
      buttonTitle: "Open prayer",
      options: { opensAppToForeground: true }
    },
    {
      identifier: "NOT_NOW",
      buttonTitle: "Not now",
      options: { opensAppToForeground: false }
    }
  ]);
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
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier))
  );
  const now = Date.now();
  await Promise.all(
    zmanim.map(async (zman) => {
      const triggerAt = zman.time.getTime() - zman.notificationLeadMinutes * 60_000;
      if (triggerAt <= now) {
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: zman.title,
          body: `${zman.title} is in ${zman.notificationLeadMinutes} minutes.`,
          data: { type: "zman" }
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(triggerAt) }
      });
    })
  );
}

export async function scheduleTravelPrayerNotification(delayMinutes = 5): Promise<boolean> {
  const allowed = await initializeNotifications();
  if (!allowed) return false;

  await cancelTravelPrayerNotification();
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Ready for תפילת הדרך?",
      body: "Open the travel prayer when stopped, or ask a passenger to read it.",
      categoryIdentifier: TRAVEL_CATEGORY_ID,
      data: { type: "travel-prayer", url: TRAVEL_PRAYER_URL },
      interruptionLevel: "active"
    },
    trigger: Platform.OS === "android"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.round(delayMinutes * 60)),
          channelId: TRAVEL_CHANNEL_ID
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.round(delayMinutes * 60))
        }
  });
  userStorage.set(TRAVEL_NOTIFICATION_KEY, identifier);
  return true;
}

export async function cancelTravelPrayerNotification(): Promise<void> {
  const identifier = userStorage.getString(TRAVEL_NOTIFICATION_KEY);
  if (!identifier) return;

  await Notifications.cancelScheduledNotificationAsync(identifier);
  userStorage.set(TRAVEL_NOTIFICATION_KEY, "");
}

export function getNotificationNavigationUrl(response: Notifications.NotificationResponse): string | null {
  const type = response.notification.request.content.data?.type;
  const action = response.actionIdentifier;
  if (type !== "travel-prayer" || (action !== Notifications.DEFAULT_ACTION_IDENTIFIER && action !== OPEN_TRAVEL_PRAYER_ACTION)) {
    return null;
  }
  return TRAVEL_PRAYER_URL;
}

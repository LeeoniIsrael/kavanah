import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import type { Zman } from "@/types/zmanim";

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
  const existing = await Notifications.getPermissionsAsync();
  const finalStatus = existing.status === "granted" ? existing.status : (await Notifications.requestPermissionsAsync()).status;
  return finalStatus === "granted";
}

export async function scheduleZmanNotifications(zmanim: Zman[]): Promise<void> {
  const allowed = await initializeNotifications();
  if (!allowed) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
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
          body: `${zman.title} is in ${zman.notificationLeadMinutes} minutes.`
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(triggerAt) }
      });
    })
  );
}

/* eslint-disable import/first */

type MockScheduledNotification = {
  identifier: string;
  content: { data: { type: string } };
};

const scheduleNotificationAsync = jest.fn(async () => "travel-notification");
const cancelScheduledNotificationAsync = jest.fn(async () => undefined);
const getAllScheduledNotificationsAsync = jest.fn<Promise<MockScheduledNotification[]>, []>(async () => []);

jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("react-native", () => ({
  Linking: { openURL: jest.fn(async () => undefined) },
  Platform: { OS: "ios" }
}));
jest.mock("expo-notifications", () => ({
  AndroidImportance: { HIGH: 4 },
  DEFAULT_ACTION_IDENTIFIER: "expo.modules.notifications.actions.DEFAULT",
  SchedulableTriggerInputTypes: { DATE: "date", TIME_INTERVAL: "timeInterval" },
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  cancelScheduledNotificationAsync,
  clearLastNotificationResponseAsync: jest.fn(async () => undefined),
  getAllScheduledNotificationsAsync,
  getLastNotificationResponseAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  scheduleNotificationAsync,
  setNotificationCategoryAsync: jest.fn(async () => undefined),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  setNotificationHandler: jest.fn()
}));

import type { NotificationResponse } from "expo-notifications";

import { getNotificationNavigationUrl, scheduleTravelPrayerNotification, scheduleZmanNotifications, TRAVEL_PRAYER_URL } from "@/services/notifications";
import type { Zman } from "@/types/zmanim";

describe("notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllScheduledNotificationsAsync.mockResolvedValue([]);
  });

  it("schedules a private travel-prayer reminder with direct prayer navigation", async () => {
    await expect(scheduleTravelPrayerNotification(5)).resolves.toBe(true);

    expect(scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.objectContaining({
        categoryIdentifier: "travel_prayer",
        data: { type: "travel-prayer", url: TRAVEL_PRAYER_URL }
      }),
      trigger: {
        type: "timeInterval",
        seconds: 300
      }
    }));
  });

  it("replaces zman reminders without deleting a pending travel reminder", async () => {
    getAllScheduledNotificationsAsync.mockResolvedValue([
      scheduledNotification("old-zman", "zman"),
      scheduledNotification("travel", "travel-prayer")
    ]);

    const future = new Date(Date.now() + 3_600_000);
    const zman: Zman = {
      key: "sunrise",
      title: "Sunrise",
      time: future,
      notificationLeadMinutes: 5,
      method: "Local astronomical sunrise"
    };
    await scheduleZmanNotifications([zman]);

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("old-zman");
    expect(cancelScheduledNotificationAsync).not.toHaveBeenCalledWith("travel");
  });

  it("opens the travel prayer from the notification and its primary action", () => {
    expect(getNotificationNavigationUrl(notificationResponse("expo.modules.notifications.actions.DEFAULT"))).toBe(TRAVEL_PRAYER_URL);
    expect(getNotificationNavigationUrl(notificationResponse("OPEN_TRAVEL_PRAYER"))).toBe(TRAVEL_PRAYER_URL);
  });

  it("keeps Not now dismissive and ignores unrelated notifications", () => {
    expect(getNotificationNavigationUrl(notificationResponse("NOT_NOW"))).toBeNull();
    expect(getNotificationNavigationUrl(notificationResponse("expo.modules.notifications.actions.DEFAULT", "zman"))).toBeNull();
  });
});

function scheduledNotification(identifier: string, type: string): MockScheduledNotification {
  return {
    identifier,
    content: { data: { type } }
  };
}

function notificationResponse(actionIdentifier: string, type = "travel-prayer"): NotificationResponse {
  return {
    actionIdentifier,
    notification: {
      request: {
        content: { data: { type } }
      }
    }
  } as unknown as NotificationResponse;
}

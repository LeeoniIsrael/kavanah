/* eslint-disable import/first */
import type { PlannedReminder } from "../reminderPlan";
const mockNative: {
  identifier: string;
  content: { data: Record<string, unknown> };
}[] = [];
let mockGranted = true;
const mockSchedule = jest.fn(async (request) => {
  mockNative.push({ identifier: request.identifier, content: request.content });
  return request.identifier;
});
const mockCancel = jest.fn(async (id: string) => {
  const index = mockNative.findIndex((n) => n.identifier === id);
  if (index >= 0) mockNative.splice(index, 1);
});
let mockPlan: PlannedReminder[] = [];
const mockState = {
  prefs: { enabled: true, sound: false },
  location: { latitude: 40, longitude: -74, label: "NY" },
  checklists: {},
  error: null as string | null,
  status: "",
  scheduled: 0,
  syncing: false,
};
jest.mock("expo-notifications", () => ({
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockNative]),
  getPermissionsAsync: jest.fn(async () => ({
    granted: mockGranted,
    status: mockGranted ? "granted" : "denied",
  })),
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DATE: "date" },
  scheduleNotificationAsync: mockSchedule,
  cancelScheduledNotificationAsync: mockCancel,
}));
jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
  AppState: { addEventListener: jest.fn() },
}));
jest.mock("@/store/reminderStore", () => ({
  useReminderStore: {
    getState: () => mockState,
    setState: (change: object) => Object.assign(mockState, change),
  },
}));
jest.mock("@/store/settingsStore", () => ({
  useSettingsStore: { getState: () => ({ calendarInIsrael: false }) },
}));
jest.mock("@/store/zmanimStore", () => ({ useZmanimStore: {} }));
jest.mock("@/store/prayerStore", () => ({
  usePrayerStore: { getState: () => ({ history: [], prayers: [] }) },
}));
jest.mock("@/store/streakStore", () => ({
  useStreakStore: { getState: () => ({ habits: [] }) },
}));
jest.mock("../reminderPlan", () => ({ buildReminderPlan: () => mockPlan }));
import { syncReminders } from "../reminderScheduler";
const planned = (i: number): PlannedReminder => ({
  id: `kavanah-reminder:${i}`,
  date: new Date(Date.now() + (i + 1) * 3600000),
  title: "Mincha",
  body: "A moment for prayer.",
  url: "kavanah://prayer?query=mincha",
});
describe("native reminder reconciliation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNative.length = 0;
    mockGranted = true;
    mockPlan = [planned(0)];
    mockState.prefs = { enabled: true, sound: false };
    mockState.error = null;
  });
  it("cancels disabled and legacy reminders without touching unrelated requests", async () => {
    mockNative.push(
      { identifier: "kavanah-reminder:old", content: { data: {} } },
      { identifier: "legacy", content: { data: { type: "zman" } } },
      { identifier: "unrelated", content: { data: { type: "else" } } },
    );
    mockState.prefs.enabled = false;
    await syncReminders();
    expect(mockNative.map((n) => n.identifier)).toEqual(["unrelated"]);
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(mockState.scheduled).toBe(0);
  });
  it("does not duplicate unchanged schedules", async () => {
    await syncReminders();
    await syncReminders();
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockCancel).not.toHaveBeenCalled();
  });
  it("reschedules changed times or sound", async () => {
    await syncReminders();
    mockState.prefs.sound = true;
    await syncReminders();
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });
  it("clears pending reminders when OS permission is revoked", async () => {
    await syncReminders();
    mockGranted = false;
    await syncReminders();
    expect(mockNative).toHaveLength(0);
    expect(mockState.status).toContain("device settings");
  });
  it("caps the native queue with room for unrelated notifications", async () => {
    mockPlan = Array.from({ length: 90 }, (_, i) => planned(i));
    mockNative.push({ identifier: "other", content: { data: {} } });
    await syncReminders();
    expect(mockState.scheduled).toBe(59);
    expect(mockNative.length).toBe(60);
  });
  it("recovers after a partial native failure", async () => {
    mockSchedule.mockRejectedValueOnce(new Error("native failed"));
    await syncReminders();
    expect(mockState.error).toContain("could not be updated");
    await syncReminders();
    expect(mockState.error).toBeNull();
    expect(mockNative).toHaveLength(1);
  });
  it("serializes rapid on/off updates and ends with no pending reminders", async () => {
    const first = syncReminders();
    mockState.prefs = { enabled: false, sound: false };
    await Promise.all([first, syncReminders()]);
    expect(mockNative).toHaveLength(0);
  });
});

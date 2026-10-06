/* eslint-disable import/first */
const mockSignOut = jest.fn();
const mockCancel = jest.fn();
const mockSiddurClear = jest.fn();
const mockOwner = jest.fn();
const mockStores: Record<string, { setState: jest.Mock }> = {};
function mockStore(name: string) {
  return (mockStores[name] ??= { setState: jest.fn() });
}
jest.mock("../network/client", () => ({
  circleClient: {
    auth: { signOut: (...args: unknown[]) => mockSignOut(...args) },
  },
}));
jest.mock("../network/outbox", () => ({
  setOutboxOwner: (...args: unknown[]) => mockOwner(...args),
}));
jest.mock("../reminderScheduler", () => ({
  cancelLocalRemindersForDeletion: () => mockCancel(),
}));
jest.mock("@/features/siddur/cache", () => ({
  clearSiddurPersonalData: () => mockSiddurClear(),
}));
jest.mock("@/store/circleAccountStore", () => ({
  loadCircleAccount: jest.fn(async () => undefined),
}));
jest.mock("@/store/settingsStore", () => ({
  useSettingsStore: mockStore("settings"),
}));
jest.mock("@/store/reminderStore", () => ({
  useReminderStore: mockStore("reminders"),
}));
jest.mock("@/store/prayerStore", () => ({
  usePrayerStore: mockStore("prayers"),
}));
jest.mock("@/store/prayerIdentityStore", () => ({
  usePrayerIdentityStore: mockStore("identity"),
}));
jest.mock("@/store/socialStore", () => ({
  useSocialStore: mockStore("social"),
}));
jest.mock("@/store/streakStore", () => ({
  useStreakStore: mockStore("streaks"),
}));
jest.mock("@/store/authStore", () => ({ useAuthStore: mockStore("auth") }));
jest.mock("@/store/zmanimStore", () => ({
  useZmanimStore: mockStore("zmanim"),
  invalidateLocationRequests: jest.fn(),
}));
jest.mock("@/design/appearance", () => ({
  useAppearanceStore: mockStore("appearance"),
}));
import { userStorage } from "../mmkv";
import { File, Paths } from "expo-file-system";
import {
  clearLocalData,
  finishLocalDataDeletion,
  useLocalDataDeletion,
} from "../localDataDeletion";
beforeEach(() => {
  finishLocalDataDeletion();
  userStorage.clearAll();
  mockSignOut.mockReset().mockResolvedValue({ error: null });
  mockCancel.mockReset().mockResolvedValue(undefined);
  mockSiddurClear.mockReset().mockResolvedValue(undefined);
  for (const store of Object.values(mockStores)) store.setState.mockClear();
});
test("clears owned local records and photos, cancels reminders and resets sensitive state", async () => {
  userStorage.set("history", "private");
  const photo = new File(Paths.document, "profile-photo-local.jpg");
  photo.write("photo");
  const history = new File(Paths.document, "prayers.history.v1.json");
  history.write("private");
  const unrelated = new File(Paths.document, "unrelated.txt");
  unrelated.write("keep");
  await clearLocalData();
  expect(useLocalDataDeletion.getState().status).toBe("done");
  expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
  expect(mockCancel).toHaveBeenCalledTimes(1);
  expect(mockSiddurClear).toHaveBeenCalledTimes(1);
  expect(photo.exists).toBe(false);
  expect(history.exists).toBe(false);
  expect(unrelated.exists).toBe(true);
  expect(userStorage.getString("history")).toBeUndefined();
  expect(mockStores.settings!.setState).toHaveBeenCalledWith(
    expect.objectContaining({ assistantConsentVersion: 0 }),
  );
  expect(mockStores.prayers!.setState).toHaveBeenCalledWith(
    expect.objectContaining({ history: [], bookmarkedPrayerIds: [] }),
  );
  userStorage.set("history", "late write");
  expect(userStorage.getString("history")).toBeUndefined();
});
test("a storage failure remains visible and never reports deletion success", async () => {
  mockSiddurClear.mockRejectedValueOnce(new Error("Disk unavailable"));
  userStorage.set("history", "private");
  await clearLocalData();
  expect(useLocalDataDeletion.getState().status).toBe("error");
  expect(userStorage.getString("history")).toBe("private");
  await clearLocalData();
  expect(useLocalDataDeletion.getState().status).toBe("done");
});

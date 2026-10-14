import { setAccountScope } from "../accountScope";
import { userStorage } from "../mmkv";
import { readSocialData, writeSocialData, removeAccountLocalData } from "../socialStorage";
import { File, Paths } from "expo-file-system";
import { usePrayerStore } from "@/store/prayerStore";
import { useStreakStore } from "@/store/streakStore";
import { useSocialStore } from "@/store/socialStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useReminderStore } from "@/store/reminderStore";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";
jest.mock("../network/client", () => ({ circleClient: null }));
jest.mock("../location", () => ({ requestZmanimLocation: jest.fn() }));
jest.mock("../network/outbox", () => ({ queueCircle: jest.fn() }));

beforeEach(() => { userStorage.clearAll(); setAccountScope(null); });
const anyData = (_v: unknown): _v is unknown => true;

test("account switching clears memory, separates disk history/preferences, and restores the returning owner", () => {
  setAccountScope("alice");
  writeSocialData("prayers.history.v1", [{ id: "alice-history", prayerId: "shema", prayerTitle: "Alice private", completedAt: "2026-10-13T12:00:00Z", source: "reader" }]);
  usePrayerStore.getState().toggleBookmark("alice-only");
  useSettingsStore.getState().setPrimaryLanguageCode("he");
  useSettingsStore.getState().setAssistantConsent(true);
  useReminderStore.getState().toggleTask("2026-10-13", "Alice task");
  useSocialStore.getState().saveProfile({ displayName: "Alice", handle: "alice", bio: "Private bio", isPrivate: true, shareMilestones: false });
  useStreakStore.getState().setHabitEnabled("study", false);
  setAccountScope("bob");
  expect(usePrayerStore.getState().history).toEqual([]);
  expect(usePrayerStore.getState().query).toBe("");
  expect(usePrayerStore.getState().results.length).toBeGreaterThan(0);
  expect(usePrayerStore.getState().bookmarkedPrayerIds).not.toContain("alice-only");
  expect(useSocialStore.getState().profile).toBeNull();
  expect(useSettingsStore.getState().assistantConsentVersion).toBe(0);
  expect(useSettingsStore.getState().primaryLanguageCode).toBe("en");
  expect(useReminderStore.getState().checklists).toEqual({});
  expect(useStreakStore.getState().enabledHabits).toContain("study");
  expect(usePrayerIdentityStore.getState().completed).toBe(false);
  usePrayerStore.getState().toggleBookmark("bob-only");
  setAccountScope(null);
  expect(readSocialData("prayers.bookmarks", anyData)).toBeNull();
  writeSocialData("prayers.bookmarks", ["signed-out-write"]);
  setAccountScope("alice");
  expect(usePrayerStore.getState().history[0]?.id).toBe("alice-history");
  expect(usePrayerStore.getState().bookmarkedPrayerIds).toContain("alice-only");
  expect(usePrayerStore.getState().bookmarkedPrayerIds).not.toContain("bob-only");
  expect(useSettingsStore.getState().primaryLanguageCode).toBe("he");
  expect(useReminderStore.getState().checklists["2026-10-13"]).toEqual(["Alice task"]);
});

test("legacy ownerless records stay preserved and hidden instead of being adopted by a new account", () => {
  userStorage.set("prayers.bookmarks", JSON.stringify(["legacy-private"]));
  const file = new File(Paths.document, "prayers.bookmarks.json");
  file.write(JSON.stringify(["legacy-private"]));
  setAccountScope("new-account");
  expect(usePrayerStore.getState().bookmarkedPrayerIds).not.toContain("legacy-private");
  expect(file.exists).toBe(true);
  expect(userStorage.getString("prayers.bookmarks")).toContain("legacy-private");
});

test("removing one account's local records preserves the other account and quarantined legacy data", () => {
  setAccountScope("delete-alice"); writeSocialData("prayers.bookmarks", ["A"]);
  setAccountScope("keep-bob"); writeSocialData("prayers.bookmarks", ["B"]);
  removeAccountLocalData("delete-alice");
  expect(readSocialData("prayers.bookmarks", anyData)).toEqual(["B"]);
  setAccountScope("delete-alice");
  expect(readSocialData("prayers.bookmarks", anyData)).toBeNull();
});

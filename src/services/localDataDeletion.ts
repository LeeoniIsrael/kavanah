import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { cacheStorage, userStorage, suspendLocalWrites } from "./mmkv";
import { circleClient } from "./network/client";
import { setOutboxOwner } from "./network/outbox";
import { loadCircleAccount } from "@/store/circleAccountStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useReminderStore } from "@/store/reminderStore";
import { usePrayerStore } from "@/store/prayerStore";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";
import { useSocialStore } from "@/store/socialStore";
import { useStreakStore } from "@/store/streakStore";
import { useAuthStore } from "@/store/authStore";
import {
  useZmanimStore,
  invalidateLocationRequests,
} from "@/store/zmanimStore";
import { useAppearanceStore } from "@/design/appearance";
import { defaultReminders } from "./reminderPlan";
import { cancelLocalRemindersForDeletion } from "./reminderScheduler";
import { clearSiddurPersonalData } from "@/features/siddur/cache";

export const useLocalDataDeletion = create<{
  status: "idle" | "clearing" | "done" | "error";
}>(() => ({ status: "idle" }));
export function finishLocalDataDeletion(): void {
  suspendLocalWrites(false);
  useLocalDataDeletion.setState({ status: "idle" });
}
// Local reset intentionally leaves the cloud account intact. Cloud deletion has
// its own authenticated RPC and confirmation; signed-in users see both choices.
export async function clearLocalData(): Promise<void> {
  if (useLocalDataDeletion.getState().status === "clearing") return;
  useLocalDataDeletion.setState({ status: "clearing" });
  suspendLocalWrites(true);
  setOutboxOwner(null);
  invalidateLocationRequests();
  try {
    if (circleClient) {
      const { error } = await circleClient.auth.signOut({ scope: "local" });
      if (error) throw error;
    }
    await loadCircleAccount(null);
    await cancelLocalRemindersForDeletion();
    if (Platform.OS !== "web") {
      await clearSiddurPersonalData();
      // Delete only app-owned legacy records and photos, not an open MMKV/SQLite file.
      const owned =
        /^(?:(?:circle|social|settings|reminders|prayer|prayers|streaks|siddur|onboarding)\..+\.json|profile-photo-.+\.jpg)$/;
      for (const file of new Directory(Paths.document).list()) {
        if (file instanceof File && owned.test(file.name)) file.delete();
      }
      for (const file of new Directory(Paths.cache).list()) file.delete();
      await SecureStore.deleteItemAsync("kavanah.biometric-lock-enabled");
      await SecureStore.deleteItemAsync("kavanah.installation-id");
      // Keep the encryption key for the now-empty, still-open MMKV file. It is
      // device-only and contains no history; deleting it would strand the file.
    } else {
      const storage = globalThis.localStorage;
      for (const name of Object.keys(storage ?? {}))
        if (name.startsWith("kavanah.")) storage.removeItem(name);
    }
    userStorage.clearAll();
    cacheStorage.clearAll();
    usePrayerIdentityStore.setState({ identity: null, completed: false });
    usePrayerStore.setState({
      history: [],
      bookmarkedPrayerIds: [],
      query: "",
    });
    useSocialStore.setState({
      profile: null,
      preferences: { prayers: "off", milestones: false },
      posts: [],
      seenEvents: [],
      seenDays: [],
      hasPrayedEver: false,
    });
    useAppearanceStore.setState({ preference: "system" });
    useStreakStore.setState({
      enabledHabits: ["shacharit", "mincha", "maariv", "tefillin", "study"],
      habits: ["shacharit", "mincha", "maariv", "tefillin", "study"].map(
        (habit) => ({
          habit: habit as
            "shacharit" | "mincha" | "maariv" | "tefillin" | "study",
          streak: 0,
          freezes: 2,
          completedDates: [],
          badges: [],
        }),
      ),
    });
    useSettingsStore.setState({
      primaryLanguageCode: "en",
      assistantConsentVersion: 0,
      zmanNotificationsEnabled: false,
      shareAfterPrayer: true,
      prayerFocusEnabled: false,
      calendarInIsrael: false,
    });
    useReminderStore.setState({
      prefs: defaultReminders(),
      location: null,
      checklists: {},
      preview: [],
      scheduled: 0,
    });
    useZmanimStore.setState({
      location: null,
      locationCheckedAt: null,
      zmanim: [],
      upcomingZmanim: [],
      isLoading: false,
      error: null,
    });
    useAuthStore.setState({ biometricLockEnabled: false });
    useLocalDataDeletion.setState({ status: "done" });
  } catch {
    // Keep the reset screen open so stale readers cannot restore deleted state.
    useLocalDataDeletion.setState({ status: "error" });
  }
}

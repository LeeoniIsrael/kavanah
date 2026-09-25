import { Linking, Platform } from "react-native";

export const PRAYER_FOCUS_SHORTCUT_NAME = "Kavanah Prayer Focus";
export type PrayerFocusSetup = {
  actionLabel: string;
  body: string;
  steps: string[];
};
export function getPrayerFocusSetup(): PrayerFocusSetup {
  if (Platform.OS === "ios")
    return {
      actionLabel: "Configure in Shortcuts",
      body: "Add our ready-made shortcut once. It turns on Do Not Disturb for 15 minutes, then expires automatically. You can change the duration in Shortcuts.",
      steps: [
        "Review and tap Add Shortcut. If a share sheet appears first, choose Shortcuts.",
        "Return here and tap Start Prayer Focus when you’re ready.",
      ],
    };
  if (Platform.OS === "android")
    return {
      actionLabel: "Open Do Not Disturb",
      body: "Choose the people, alarms and apps that may interrupt prayer.",
      steps: [
        "Choose what may interrupt you in Do Not Disturb settings.",
        "Turn it on before prayer and off when you finish.",
      ],
    };
  return {
    actionLabel: "Open settings",
    body: "Use your device’s Focus or Do Not Disturb control before prayer.",
    steps: [],
  };
}

/** Presents the signed workflow, never an empty Shortcuts library. Dismissal is not installation. */
export async function openPrayerFocusSetup(): Promise<boolean> {
  try {
    if (Platform.OS === "ios") {
      const Sharing = await import("expo-sharing");
      if (!(await Sharing.isAvailableAsync())) return false;
      const { File, Paths } = await import("expo-file-system");
      const { prayerFocusShortcutBase64 } =
        await import("@/data/shortcuts/prayerFocus");
      const file = new File(
        Paths.cache,
        `${PRAYER_FOCUS_SHORTCUT_NAME}.shortcut`,
      );
      if (!file.exists) file.create();
      file.write(prayerFocusShortcutBase64, { encoding: "base64" });
      try {
        await Linking.openURL(file.uri);
        return true;
      } catch {
        /* Use the documented document-sharing fallback below. */
      }
      await Sharing.shareAsync(file.uri, {
        UTI: "com.apple.shortcut",
        mimeType: "application/octet-stream",
        dialogTitle: "Add Kavanah Prayer Focus",
      });
      return true;
    }
    if (Platform.OS === "android")
      await Linking.sendIntent("android.settings.ZEN_MODE_SETTINGS");
    else await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}
export function prayerFocusRunUrl(returnUrl: string): string {
  const callback = (result: string) =>
    `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}result=${result}`;
  return `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(PRAYER_FOCUS_SHORTCUT_NAME)}&x-success=${encodeURIComponent(callback("finished"))}&x-cancel=${encodeURIComponent(callback("cancelled"))}&x-error=${encodeURIComponent(callback("error"))}`;
}
export async function runPrayerFocusShortcut(): Promise<boolean> {
  if (Platform.OS !== "ios") return openPrayerFocusSetup();
  try {
    const { createURL } = await import("expo-linking");
    await Linking.openURL(prayerFocusRunUrl(createURL("/focus-setup")));
    return true;
  } catch {
    return false;
  }
}

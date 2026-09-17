import { Linking, Platform } from "react-native";

export type PrayerFocusSetup = {
  actionLabel: string;
  body: string;
  steps: string[];
};

export function getPrayerFocusSetup(): PrayerFocusSetup {
  if (Platform.OS === "ios") {
    return {
      actionLabel: "Open Shortcuts",
      body: "Apple requires you to approve Focus changes. A personal automation can turn Do Not Disturb on when Kavanah opens and off when it closes.",
      steps: [
        "Choose Automation, then App and Kavanah.",
        "Select Is Opened and add Set Focus: Do Not Disturb On.",
        "Add a second Is Closed automation to turn it off."
      ]
    };
  }

  if (Platform.OS === "android") {
    return {
      actionLabel: "Open Do Not Disturb",
      body: "Android keeps Do Not Disturb under your control. Choose the people, alarms, and apps that may interrupt prayer.",
      steps: [
        "Open Do Not Disturb settings.",
        "Choose what may interrupt you.",
        "Turn it on before prayer and off when you finish."
      ]
    };
  }

  return {
    actionLabel: "Open settings",
    body: "Use your device's Focus or Do Not Disturb control before beginning a prayer.",
    steps: ["Open device settings.", "Turn on Focus or Do Not Disturb.", "Return to Kavanah when the phone is quiet."]
  };
}

export async function openPrayerFocusSetup(): Promise<boolean> {
  try {
    if (Platform.OS === "ios") {
      await Linking.openURL("shortcuts://");
      return true;
    }

    if (Platform.OS === "android") {
      await Linking.sendIntent("android.settings.ZEN_MODE_SETTINGS");
      return true;
    }

    await Linking.openSettings();
    return true;
  } catch {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }
}

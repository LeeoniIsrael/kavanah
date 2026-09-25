import { useState } from "react";
import { Platform, View } from "react-native";
import { Text } from "./ui/text";
import { Button } from "./ui/button";
import { useInterfaceStyles } from "@/design/layout";
import {
  getPrayerFocusSetup,
  openPrayerFocusSetup,
  runPrayerFocusShortcut,
} from "@/services/prayerFocus";

export function PrayerFocusSetupContent({
  result,
}: {
  result?: string | undefined;
}) {
  const ui = useInterfaceStyles(),
    setup = getPrayerFocusSetup();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const install = async () => {
    setBusy(true);
    try {
      const opened = await openPrayerFocusSetup();
      setMessage(
        opened
          ? Platform.OS === "ios"
            ? "If Shortcuts wasn’t listed, choose Save to Files, then open the saved shortcut to add it."
            : "Return here when you’re ready to pray."
          : "Setup couldn’t open. Make sure Shortcuts is installed, then try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const start = async () => {
    setBusy(true);
    try {
      if (!(await runPrayerFocusShortcut()))
        setMessage(
          "The shortcut couldn’t start. Add it first and keep its name: Kavanah Prayer Focus.",
        );
    } finally {
      setBusy(false);
    }
  };
  const callbackMessage =
    result === "finished"
      ? "The shortcut finished. Your Do Not Disturb settings control which people and apps can reach you."
      : result === "cancelled"
        ? "Cancelled. You can continue without starting Focus."
        : result === "error"
          ? "The shortcut couldn’t finish. Add Kavanah Prayer Focus, then try again."
          : "";
  return (
    <View style={{ gap: 24 }}>
      <View style={ui.feature}>
        <Text style={ui.editorial}>
          {Platform.OS === "ios" ? "15 quiet minutes" : "A quieter prayer"}
        </Text>
        <Text style={ui.body}>{setup.body}</Text>
        {Platform.OS === "ios" ? (
          <Text style={ui.caption}>
            Uses Do Not Disturb, replacing any active Focus. Your allowed
            contacts, apps and alarms keep their existing settings.
          </Text>
        ) : null}
      </View>
      <View style={{ gap: 16 }}>
        {setup.steps.map((step, index) => (
          <View
            key={step}
            style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
          >
            <Text style={ui.caption}>{index + 1}</Text>
            <Text style={[ui.body, { flex: 1 }]}>{step}</Text>
          </View>
        ))}
      </View>
      <Button disabled={busy} isLoading={busy} onPress={() => void install()}>
        <Text>{setup.actionLabel}</Text>
      </Button>
      {Platform.OS === "ios" ? (
        <>
          <Button
            variant="secondary"
            disabled={busy}
            onPress={() => void start()}
          >
            <Text>Start Prayer Focus</Text>
          </Button>
          <Text style={ui.caption}>
            Already added it? Use Start Prayer Focus. You can stop it early in
            Control Center → Focus.
          </Text>
        </>
      ) : null}
      {message || callbackMessage ? (
        <Text style={ui.body} accessibilityLiveRegion="polite">
          {message || callbackMessage}
        </Text>
      ) : null}
      {Platform.OS === "ios" ? (
        <View style={ui.surface}>
          <Text style={ui.itemTitle}>Want it automatic?</Text>
          <Text style={ui.body}>
            Apple keeps app-open automations on your device; they can’t be
            bundled into this shortcut.
          </Text>
          <Text style={ui.body}>
            In Settings → Focus, choose a Focus → Add Schedule → App → Kavanah.
            That Focus follows when you use Kavanah, without building Shortcuts
            actions.
          </Text>
          <Text style={ui.caption}>
            In Expo Go previews, the app appears as Expo Go. The installed
            Kavanah app has its own entry.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

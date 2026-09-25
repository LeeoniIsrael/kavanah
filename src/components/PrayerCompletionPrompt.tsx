import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { useInterfaceStyles } from "@/design/layout";
import { useThemeColors } from "@/design/appearance";

export function PrayerCompletionPrompt({
  onShare,
  onDismiss,
  enabled,
  onEnabledChange,
}: {
  onShare: () => void;
  onDismiss: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const ui = useInterfaceStyles();
  const colors = useThemeColors();
  return (
    <View
      accessibilityViewIsModal
      style={{
        position: "absolute",
        zIndex: 50,
        inset: 0,
        justifyContent: "flex-end",
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.4)",
      }}
    >
      <Card style={{ gap: 20, padding: 24 }}>
        <View style={{ gap: 8 }}>
          <Text style={ui.itemTitle}>Share this prayer?</Text>
          <Text style={ui.body}>
            Your prayer is saved. Share a moment if you’d like.
          </Text>
        </View>
        <Button
          onPress={onShare}
          style={{
            minHeight: 52,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[ui.itemTitle, { color: colors.onAccent }]}>Share</Text>
        </Button>
        <Button
          variant="ghost"
          onPress={onDismiss}
          style={{
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={ui.itemTitle}>Not now</Text>
        </Button>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Text style={[ui.caption, { flex: 1 }]}>Ask after each prayer</Text>
          <Switch
            accessibilityLabel="Ask to share after each prayer"
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        </View>
      </Card>
    </View>
  );
}

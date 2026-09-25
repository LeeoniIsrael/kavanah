import { Text } from "@/components/ui/text";
import { useInterfaceStyles } from "@/design/layout";
import { View } from "react-native";
import type { Zman } from "@/types/zmanim";

export function ZmanRow({
  zman,
  last = false,
}: {
  zman: Zman;
  last?: boolean;
}): React.JSX.Element {
  const ui = useInterfaceStyles();
  return (
    <View style={[ui.row, !last && ui.separator]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={ui.itemTitle}>{zman.title}</Text>
        <Text style={ui.caption}>
          {zman.method} · {zman.notificationLeadMinutes} min reminder
        </Text>
      </View>
      <Text
        style={[
          ui.itemTitle,
          { textAlign: "right", fontVariant: ["tabular-nums"], flexShrink: 0 },
        ]}
      >
        {zman.time.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

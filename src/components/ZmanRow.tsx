import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Accordion } from "@/components/ui/accordion";
import { useInterfaceStyles } from "@/design/layout";
import { zmanimGuide, explainZmanMethod } from "@/data/zmanimGuide";
import type { Zman } from "@/types/zmanim";

export function ZmanRow({
  zman,
  last = false,
}: {
  zman: Zman;
  last?: boolean;
}): React.JSX.Element {
  const ui = useInterfaceStyles();
  const guide = zmanimGuide[zman.key];
  return (
    <Accordion gap={0} style={!last && ui.separator}>
      <Accordion.Item
        value={zman.key}
        style={{ backgroundColor: "transparent" }}
      >
        <Accordion.Trigger
          indicator={false}
          accessibilityLabel={`${guide.title}, ${zman.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. ${guide.summary}`}
          accessibilityHint="Tap for an explanation and calculation details"
          contentStyle={{
            flexDirection: "column",
            alignItems: "stretch",
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              flexWrap: "wrap",
              columnGap: 16,
              rowGap: 4,
            }}
          >
            <Text
              style={[
                ui.itemTitle,
                { flexGrow: 1, flexShrink: 1, flexBasis: 160 },
              ]}
            >
              {guide.title}
            </Text>
            <Text
              style={[
                ui.itemTitle,
                { fontVariant: ["tabular-nums"], marginLeft: "auto" },
              ]}
            >
              {zman.time.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <Text style={ui.body}>{guide.summary}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={[ui.caption, { flex: 1 }]}>{guide.traditional}</Text>
            <Accordion.Trigger.Indicator />
          </View>
        </Accordion.Trigger>
        <Accordion.Content style={{ gap: 12 }}>
          <Text style={ui.body}>{guide.detail}</Text>
          <Text style={ui.caption}>{explainZmanMethod(zman.method)}</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

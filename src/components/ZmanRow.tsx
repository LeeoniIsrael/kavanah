import { useState } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
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
  const ui = useInterfaceStyles(),
    colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const guide = zmanimGuide[zman.key];
  return (
    <View style={!last && ui.separator}>
      <Button
        variant="ghost"
        size="content"
        accessibilityLabel={`${guide.title}, ${zman.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. ${guide.summary}`}
        accessibilityHint="Tap for an explanation and calculation details"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={{
          padding: 20,
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
          <View
            style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
          >
            <ChevronDown size={16} color={colors.inkMuted} />
          </View>
        </View>
      </Button>
      {expanded ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
          <Text style={ui.body}>{guide.detail}</Text>
          <Text style={ui.caption}>{explainZmanMethod(zman.method)}</Text>
        </View>
      ) : null}
    </View>
  );
}

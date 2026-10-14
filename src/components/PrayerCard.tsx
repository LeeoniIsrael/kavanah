import { useInterfaceStyles } from "@/design/layout";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { View } from "react-native";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PrayerText } from "@/types/prayer";
import { ChevronRight } from "@/components/ui/icons";

type Props = {
  prayer: PrayerText;
  selected: boolean;
  onPress: () => void;
  footer?: ReactNode;
};

export function PrayerCard({
  prayer,
  selected,
  onPress,
  footer,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const ui = useInterfaceStyles();

  return (
    <Card
      style={[
        ui.surface,
        { padding: 0, gap: 0 },
        selected && { backgroundColor: colors.blueSoft },
      ]}
    >
      <Button
        variant="ghost"
        size="content"
        accessibilityLabel={`Open ${prayer.title}`}
        onPress={onPress}
        style={{ padding: 20, borderRadius: ui.surface.borderRadius }}
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-1 gap-2">
            <Text style={ui.itemTitle}>{prayer.title}</Text>

            <View className="flex-row flex-wrap items-center gap-2">
              <Text style={[ui.caption, { textTransform: "capitalize" }]}>
                {prayer.category}
              </Text>
              <Text style={ui.caption}>
                · {contentLabel(prayer.hebrewReview.contentKind)}
              </Text>
            </View>
            <Text style={ui.body}>{prayer.useCase || prayer.summary}</Text>
          </View>
          <ChevronRight
            size={16}
            color={selected ? colors.blue : colors.mineralDark}
          />
        </View>
      </Button>
      {footer}
    </Card>
  );
}

function contentLabel(kind: PrayerText["hebrewReview"]["contentKind"]): string {
  if (kind === "complete") return "complete Hebrew";
  if (kind === "excerpt") return "excerpt";
  if (kind === "collection") return "service";
  if (kind === "missing") return "in preparation";
  return "library result";
}

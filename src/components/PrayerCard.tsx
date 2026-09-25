import { useInterfaceStyles } from "@/design/layout";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import type { PrayerText } from "@/types/prayer";
import { ChevronRight } from "@/components/ui/icons";

type Props = {
  prayer: PrayerText;
  selected: boolean;
  onPress: () => void;
};

export function PrayerCard({
  prayer,
  selected,
  onPress,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const ui = useInterfaceStyles();

  return (
    <Button
      variant="ghost"
      size="content"
      onPress={onPress}
      style={[ui.surface, selected && { backgroundColor: colors.blueSoft }]}
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
  );
}

function contentLabel(kind: PrayerText["hebrewReview"]["contentKind"]): string {
  if (kind === "complete") return "complete Hebrew";
  if (kind === "excerpt") return "excerpt";
  if (kind === "collection") return "service";
  if (kind === "missing") return "in preparation";
  return "library result";
}

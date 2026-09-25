import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { cn } from "@/lib/utils";
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

  return (
    <Button
      variant="ghost"
      size="content"
      onPress={onPress}
      className={cn("rounded-lg bg-card p-5", selected && "bg-accent")}
    >
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text
              variant="caption"
              className="font-label text-muted-foreground"
            >
              {prayer.category}
            </Text>
            <Badge variant="secondary">
              <Text>{contentLabel(prayer.hebrewReview.contentKind)}</Text>
            </Badge>
          </View>
          <Text variant="section" className="text-[18px] leading-[23px]">
            {prayer.title}
          </Text>
          <Text
            variant="body"
            numberOfLines={3}
            className="font-body text-muted-foreground text-[14px] leading-[21px]"
          >
            {prayer.useCase || prayer.summary}
          </Text>
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

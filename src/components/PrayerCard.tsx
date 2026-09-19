import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { colors } from "@/design/theme";
import type { PrayerText } from "@/types/prayer";
import { ChevronRight } from "lucide-react-native";

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
  return (
    <Button
      variant="ghost"
      size="content"
      onPress={onPress}
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        selected && "bg-accent border-primary",
      )}
    >
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text variant="caption">{prayer.category}</Text>
            <Badge variant="outline">
              <Text>{contentLabel(prayer.hebrewReview.contentKind)}</Text>
            </Badge>
          </View>
          <Text variant="section" className="text-[18px] leading-[23px]">
            {prayer.title}
          </Text>
          <Text
            variant="body"
            numberOfLines={3}
            className="text-foreground text-[15px] leading-[21px]"
          >
            {prayer.useCase || prayer.summary}
          </Text>
          <Text
            variant="body"
            numberOfLines={1}
            className="text-muted-foreground text-[12px] leading-[17px]"
          >
            {prayer.summary || prayer.sefariaRef}
          </Text>
        </View>
        <ChevronRight
          size={18}
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

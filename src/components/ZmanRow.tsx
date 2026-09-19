import { Text } from "@/components/ui/text";
import { View } from "react-native";

import type { Zman } from "@/types/zmanim";

export function ZmanRow({ zman }: { zman: Zman }): React.JSX.Element {
  return (
    <View className="min-h-[72px] flex-row items-center justify-between gap-4 border-b border-b-hairline px-1 py-3">
      <View className="flex-1">
        <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading">
          {zman.title}
        </Text>
        <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground mt-[2px] font-label">
          {zman.method} · {zman.notificationLeadMinutes} min reminder
        </Text>
      </View>
      <Text className="text-[17px] leading-[22px] font-semibold tracking-normal text-foreground min-w-[84px] text-right font-heading">
        {zman.time.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

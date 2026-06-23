import { View } from "react-native";

import { Body } from "@/components/Text";
import type { Zman } from "@/types/zmanim";

export function ZmanRow({ zman }: { zman: Zman }): React.JSX.Element {
  return (
    <View className="flex-row items-center justify-between border-b border-ink/10 py-4">
      <Body className="font-semibold text-ink">{zman.title}</Body>
      <Body className="text-ink">{zman.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Body>
    </View>
  );
}

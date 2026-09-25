import { View } from "react-native";
import { Text } from "./text";
import { useInterfaceStyles } from "@/design/layout";
import type { ReactNode } from "react";

export function SectionHeading({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  const s = useInterfaceStyles();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Text accessibilityRole="header" style={[s.sectionTitle, { flex: 1 }]}>
        {title}
      </Text>
      {detail && <Text style={s.caption}>{detail}</Text>}
      {action}
    </View>
  );
}

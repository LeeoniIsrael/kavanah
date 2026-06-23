import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, type } from "@/design/theme";
import type { Zman } from "@/types/zmanim";

export function ZmanRow({ zman }: { zman: Zman }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.name}>{zman.title}</Text>
        <Text style={styles.lead}>{zman.notificationLeadMinutes} min reminder</Text>
      </View>
      <Text style={styles.time}>{zman.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  name: {
    ...type.body,
    fontWeight: "600",
    color: colors.ink
  },
  lead: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 2
  },
  time: {
    ...type.section,
    color: colors.ink,
    minWidth: 84,
    textAlign: "right"
  }
});

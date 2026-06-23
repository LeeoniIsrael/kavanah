import { StyleSheet, View } from "react-native";

import { Body, SectionTitle } from "@/components/Text";
import { colors, spacing } from "@/design/theme";
import type { Zman } from "@/types/zmanim";

export function ZmanRow({ zman }: { zman: Zman }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View>
        <SectionTitle style={styles.name}>{zman.title}</SectionTitle>
        <Body style={styles.lead}>{zman.notificationLeadMinutes} minute reminder</Body>
      </View>
      <SectionTitle style={styles.time}>{zman.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</SectionTitle>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: spacing.lg
  },
  name: {
    fontSize: 16,
    lineHeight: 22
  },
  lead: {
    fontSize: 13,
    lineHeight: 18
  },
  time: {
    fontSize: 19,
    color: colors.blue
  }
});

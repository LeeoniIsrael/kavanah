import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Body, SectionTitle } from "@/components/Text";
import { colors, radii, spacing, type } from "@/design/theme";
import type { PrayerText } from "@/types/prayer";

type Props = {
  prayer: PrayerText;
  selected: boolean;
  onPress: () => void;
};

export function PrayerCard({ prayer, selected, onPress }: Props): React.JSX.Element {
  return (
    <AnimatedPressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.meta}>{prayer.category}</Text>
          <SectionTitle style={styles.title}>{prayer.title}</SectionTitle>
          <Body numberOfLines={3} style={styles.useCase}>
            {prayer.useCase || prayer.summary}
          </Body>
          <Body numberOfLines={1} style={styles.source}>
            {prayer.summary || prayer.sefariaRef}
          </Body>
        </View>
        <View style={[styles.dot, selected && styles.selectedDot]} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    padding: spacing.lg
  },
  selected: {
    backgroundColor: colors.vellum,
    borderColor: colors.blue
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  text: {
    flex: 1,
    gap: spacing.xs
  },
  meta: {
    ...type.caption,
    color: colors.inkMuted
  },
  title: {
    fontSize: 18,
    lineHeight: 23
  },
  useCase: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21
  },
  source: {
    color: colors.inkMuted,
    fontSize: 12,
    lineHeight: 17
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  selectedDot: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  }
});

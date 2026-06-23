import { StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Body, Label, SectionTitle } from "@/components/Text";
import { colors, radii, spacing } from "@/design/theme";
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
          <Label>{prayer.category}</Label>
          <SectionTitle>{prayer.title}</SectionTitle>
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
    backgroundColor: "rgba(255,255,255,0.62)",
    padding: spacing.lg
  },
  selected: {
    backgroundColor: colors.vellum,
    borderColor: "rgba(181,138,42,0.45)"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  text: {
    flex: 1,
    gap: 4
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
    width: 11,
    height: 11,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  selectedDot: {
    backgroundColor: colors.gold,
    borderColor: colors.gold
  }
});

import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radii, shadows, spacing } from "@/design/theme";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  accent?: "gold" | "olive" | "blue" | "rose" | "none";
}>;

export function Card({ children, style, accent = "none" }: Props): React.JSX.Element {
  return <View style={[styles.card, accent !== "none" && styles.accentCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: radii.lg,
    backgroundColor: colors.vellum,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg
  },
  accentCard: {
    ...shadows.card
  }
});

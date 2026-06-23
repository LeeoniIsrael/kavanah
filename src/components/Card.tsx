import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radii, shadows, spacing } from "@/design/theme";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  accent?: "gold" | "olive" | "blue" | "rose" | "none";
}>;

const accentColor = {
  gold: colors.gold,
  olive: colors.olive,
  blue: colors.blue,
  rose: colors.rose,
  none: "transparent"
};

export function Card({ children, style, accent = "gold" }: Props): React.JSX.Element {
  return (
    <View style={[styles.card, shadows.card, style]}>
      {accent !== "none" ? <View style={[styles.lightLine, { backgroundColor: accentColor[accent] }]} /> : null}
      {children}
    </View>
  );
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
  lightLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3
  }
});

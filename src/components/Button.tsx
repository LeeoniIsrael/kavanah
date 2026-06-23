import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { colors, radii, spacing, type } from "@/design/theme";

type Props = {
  label: string;
  icon?: ReactNode;
  tone?: "ink" | "quiet" | "gold";
  disabled?: boolean;
  onPress: () => void;
};

export function Button({ label, icon, tone = "ink", disabled = false, onPress }: Props): React.JSX.Element {
  return (
    <AnimatedPressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, styles[tone], disabled && styles.disabled]}>
      <View style={styles.content}>
        {icon}
        <Text style={[styles.label, tone === "quiet" && styles.quietLabel]}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  ink: {
    backgroundColor: colors.ink
  },
  quiet: {
    backgroundColor: colors.vellum,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  gold: {
    backgroundColor: colors.goldSoft
  },
  disabled: {
    opacity: 0.52
  },
  label: {
    ...type.body,
    color: colors.white,
    fontWeight: "700"
  },
  quietLabel: {
    color: colors.ink
  }
});

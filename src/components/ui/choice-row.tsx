import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@/design/appearance";
import { fonts, geometry } from "@/design/theme";
import { Check } from "@/components/ui/icons";
import { StyleSheet, View } from "react-native";

/** A standalone choice keeps its selection inside the same continuous corners. */
export function ChoiceRow({
  title,
  detail,
  selected,
  onPress,
}: {
  title: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const s = useThemedStyles(makes);

  return (
    <Button
      variant="ghost"
      haptic="selection"
      size="content"
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}, ${detail}`}
      onPress={onPress}
      style={[s.row, selected && s.selected]}
    >
      <View style={s.copy}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.detail}>{detail}</Text>
      </View>
      <View style={s.check}>
        {selected && <Check size={20} color={colors.blue} />}
      </View>
    </Button>
  );
}
const makes = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      minHeight: 72,
      paddingHorizontal: 18,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      borderRadius: geometry.radius.control,
      borderCurve: "continuous",
      backgroundColor: colors.vellum,
      overflow: "hidden",
    },
    selected: { backgroundColor: colors.blueSoft },
    copy: { flex: 1, gap: 4 },
    title: {
      fontFamily: fonts.semibold,
      color: colors.ink,
      fontSize: 17,
      lineHeight: 24,
    },
    detail: { color: colors.inkMuted, fontSize: 14, lineHeight: 21 },
    check: { width: 24, alignItems: "center" },
  });

import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { ChoiceRow } from "@/components/ui/choice-row";
import { useThemeColors } from "@/design/appearance";
import { useInterfaceStyles } from "@/design/layout";

export type TefillinBlessingCustom = "compare" | "two" | "one";
export function TefillinPreparation({
  custom,
  onChange,
}: {
  custom: TefillinBlessingCustom;
  onChange: (custom: TefillinBlessingCustom) => void;
}) {
  const colors = useThemeColors();
  const ui = useInterfaceStyles();
  return (
    <View style={{ gap: 20 }}>
      <Card style={{ padding: 20, gap: 16 }}>
        <Text style={ui.sectionTitle}>The order at a glance</Text>
        {[
          ["1", "Arm", "Position the box, bless, then secure it."],
          [
            "2",
            "Head",
            "Center above the hairline. Bless only as your custom requires.",
          ],
          ["3", "Hand", "Complete your finger and hand wraps."],
          ["4", "Read", "Follow the passages below while wearing tefillin."],
        ].map(([number, title, detail]) => (
          <View
            key={number}
            style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.vellum,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.blue }}>{number}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={ui.itemTitle}>{title}</Text>
              <Text style={ui.body}>{detail}</Text>
            </View>
          </View>
        ))}
      </Card>
      <View style={{ gap: 10 }}>
        <Text style={ui.sectionTitle}>Your blessing custom</Text>
        <Text style={ui.body}>
          This changes the head blessing shown below. It does not choose your
          wrapping pattern or prayer tradition.
        </Text>
        <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
          <ChoiceRow
            title="Compare the customs"
            detail="Show the conditional passages with their directions"
            selected={custom === "compare"}
            onPress={() => onChange("compare")}
          />
          <ChoiceRow
            title="Two blessings"
            detail="Common Ashkenazi practice"
            selected={custom === "two"}
            onPress={() => onChange("two")}
          />
          <ChoiceRow
            title="One blessing"
            detail="Sephardi, Chabad and some Ashkenazi practices"
            selected={custom === "one"}
            onPress={() => onChange("one")}
          />
        </View>
        <Text style={ui.caption}>
          If you are unsure, compare the directions and ask which custom your
          family or community follows. These choices assume no interruption
          between the arm and head tefillin.
        </Text>
      </View>
    </View>
  );
}

import { Keyboard, StyleSheet, View } from "react-native";
import { Accordion } from "@/components/ui/accordion";
import { PrayerCard } from "@/components/PrayerCard";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { ChevronRight } from "@/components/ui/icons";
import { useInterfaceStyles } from "@/design/layout";
import { useThemeColors } from "@/design/appearance";
import type { PrayerSearchGroup } from "@/services/prayerSearchGroups";

export function PrayerSearchGroupCard({
  group,
  onOpen,
}: {
  group: PrayerSearchGroup;
  onOpen: (id: string) => void;
}) {
  const ui = useInterfaceStyles();
  const colors = useThemeColors();
  return (
    <PrayerCard
      prayer={group.prayer}
      selected={false}
      onPress={() => onOpen(group.prayer.id)}
      footer={
        group.editions.length > 0 ? (
          <Accordion style={{ marginHorizontal: 20 }}>
            <Accordion.Item
              value="editions"
              style={{ backgroundColor: "transparent" }}
            >
              <Accordion.Trigger
                accessibilityLabel={`Other editions of ${group.prayer.title}`}
                accessibilityHint="Shows or hides the other prayer books and sections."
                onPress={() => Keyboard.dismiss()}
                style={[styles.disclosure, { borderTopColor: colors.hairline }]}
              >
                <Text style={[ui.caption, { color: colors.blue, flex: 1 }]}>
                  Other editions · {group.editions.length}
                </Text>
              </Accordion.Trigger>
              <Accordion.Content
                style={{ paddingHorizontal: 0, paddingBottom: 8 }}
              >
                <Text style={[ui.caption, { paddingBottom: 8 }]}>
                  Choose a prayer book. Wording and placement may differ.
                </Text>
                {group.editions.map(({ prayer }, index) => (
                  <Button
                    key={prayer.id}
                    variant="ghost"
                    size="content"
                    onPress={() => onOpen(prayer.id)}
                    style={[
                      styles.edition,
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.hairline,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={ui.itemTitle}>
                        {prayer.sourceMetadata?.work ??
                          prayer.hebrewReview.sourceTitle}
                      </Text>
                      <Text style={ui.caption}>
                        {prayer.sourceMetadata?.path.join(" › ") ||
                          prayer.sefariaRef}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.inkMuted} />
                  </Button>
                ))}
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  disclosure: {
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  edition: {
    minHeight: 44,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

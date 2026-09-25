import { useState } from "react";
import { View } from "react-native";
import { PrayerCard } from "@/components/PrayerCard";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { ChevronDown, ChevronRight } from "@/components/ui/icons";
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
  const [expanded, setExpanded] = useState(false);
  const ui = useInterfaceStyles();
  const colors = useThemeColors();
  return (
    <View>
      <PrayerCard
        prayer={group.prayer}
        selected={false}
        onPress={() => onOpen(group.prayer.id)}
      />
      {group.editions.length > 0 ? (
        <>
          <Button
            variant="ghost"
            size="content"
            accessibilityLabel={`Other editions of ${group.prayer.title}`}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((value) => !value)}
            style={{
              minHeight: 44,
              paddingHorizontal: 20,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={[ui.caption, { color: colors.blue }]}>
              Other editions
            </Text>
            <ChevronDown
              size={16}
              color={colors.blue}
              style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
            />
          </Button>
          {expanded ? (
            <View style={ui.surface}>
              <Text style={ui.caption}>
                Choose a prayer book. Wording and placement may differ.
              </Text>
              {group.editions.map(({ prayer }) => (
                <Button
                  key={prayer.id}
                  variant="ghost"
                  size="content"
                  onPress={() => onOpen(prayer.id)}
                  style={{
                    minHeight: 44,
                    paddingVertical: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
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
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

import { Bell, MapPin, RefreshCw } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { ZmanRow } from "@/components/ZmanRow";
import { colors, radii, shadows, spacing, type } from "@/design/theme";
import { useZmanimStore } from "@/store/zmanimStore";

export function ZmanimScreen(): React.JSX.Element {
  const { location, zmanim, isLoading, refresh } = useZmanimStore();
  const nextZman = zmanim.find((zman) => zman.time.getTime() > Date.now()) ?? zmanim[0];

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Label>Local time</Label>
          <Display>Zmanim</Display>
        </View>
        <AnimatedPressable accessibilityRole="button" onPress={() => void refresh()} disabled={isLoading} style={styles.iconButton}>
          <RefreshCw size={19} color={isLoading ? colors.inkMuted : colors.ink} />
        </AnimatedPressable>
      </View>

      <View style={styles.nextPanel}>
        <View style={styles.panelMetaRow}>
          <View style={styles.blueDot} />
          <Text style={styles.panelMeta}>Next</Text>
        </View>
        <SectionTitle style={styles.panelTitle}>{nextZman?.title ?? "Calculating times"}</SectionTitle>
        <Text style={styles.panelTime}>{nextZman ? formatTime(nextZman.time) : "--:--"}</Text>
        <Body style={styles.panelBody}>{location?.label ?? "Set location to calculate precise local zmanim."}</Body>
      </View>

      <View style={styles.locationStrip}>
        <MapPin size={18} color={colors.blue} />
        <Text style={styles.locationText}>{location?.label ?? "Location unavailable"}</Text>
        <AnimatedPressable accessibilityRole="button" onPress={() => void refresh()} disabled={isLoading} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>{isLoading ? "Finding" : "Update"}</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.list}>
        {zmanim.length > 0 ? (
          zmanim.map((zman) => <ZmanRow key={zman.key} zman={zman} />)
        ) : (
          <View style={styles.emptyState}>
            <SectionTitle>Waiting for local times</SectionTitle>
            <Body>Use your location once and Kavanah will calculate today’s zmanim on device.</Body>
          </View>
        )}
      </View>

      <View style={styles.notice}>
        <Bell size={18} color={colors.blue} />
        <Body style={styles.noticeText}>Reminders stay local for zmanim, candle lighting, Havdalah, and tefillin.</Body>
      </View>
    </Screen>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  nextPanel: {
    borderRadius: radii.xl,
    backgroundColor: colors.ink,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.card
  },
  panelMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.blue
  },
  panelMeta: {
    ...type.caption,
    color: "rgba(255,255,255,0.66)"
  },
  panelTitle: {
    color: colors.white
  },
  panelTime: {
    ...type.display,
    fontSize: 54,
    lineHeight: 58,
    color: colors.white
  },
  panelBody: {
    color: "rgba(255,255,255,0.70)"
  },
  locationStrip: {
    minHeight: 58,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  locationText: {
    ...type.body,
    flex: 1,
    color: colors.ink
  },
  smallButton: {
    minHeight: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center"
  },
  smallButtonText: {
    ...type.caption,
    color: colors.blue
  },
  list: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden"
  },
  emptyState: {
    gap: spacing.sm,
    padding: spacing.xl
  },
  notice: {
    minHeight: 58,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  }
});

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
  const { location, zmanim, upcomingZmanim, isLoading, error, refresh } = useZmanimStore();
  const nextZman = upcomingZmanim[0];

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
        <View style={styles.dayRail}><View style={styles.dayMarker} /></View>
        <View style={styles.panelMetaRow}>
          <View style={styles.blueDot} />
          <Text style={styles.panelMeta}>Next</Text>
        </View>
        <SectionTitle style={styles.panelTitle}>{nextZman?.title ?? "Calculating times"}</SectionTitle>
        <Text style={styles.panelTime}>{nextZman ? formatTime(nextZman.time) : "--:--"}</Text>
        <Body style={styles.panelBody}>{nextZman ? `${formatDay(nextZman.time)} · ${location?.label ?? "local time"}` : error ?? "Set location to calculate precise local zmanim."}</Body>
      </View>

      <View style={styles.locationStrip}>
        <MapPin size={18} color={colors.blue} />
        <Text style={styles.locationText}>{error ?? location?.label ?? "Location unavailable"}</Text>
        <AnimatedPressable accessibilityRole="button" onPress={() => void refresh()} disabled={isLoading} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>{isLoading ? "Finding" : "Update"}</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.list}>
        {zmanim.length > 0 ? (
          <>
            <Label style={styles.listLabel}>Today</Label>
            {zmanim.map((zman) => <ZmanRow key={zman.key} zman={zman} />)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <SectionTitle>Waiting for local times</SectionTitle>
            <Body>{error ?? "Use your location once and Kavanah will calculate today’s zmanim on device."}</Body>
          </View>
        )}
      </View>

      <View style={styles.notice}>
        <Bell size={18} color={colors.blue} />
        <Body style={styles.noticeText}>Reminders stay on this device. Shabbat candle lighting appears on Friday; Havdalah appears on Saturday.</Body>
      </View>
    </Screen>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDay(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString([], { weekday: "long" });
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
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  nextPanel: {
    position: "relative",
    borderRadius: radii.lg,
    backgroundColor: colors.vellum,
    paddingVertical: spacing.xl,
    paddingLeft: spacing.xxxl,
    paddingRight: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.pressed
  },
  dayRail: {
    position: "absolute",
    top: spacing.xl,
    bottom: spacing.xl,
    left: spacing.xl,
    width: 1,
    backgroundColor: colors.mineral
  },
  dayMarker: {
    position: "absolute",
    top: 8,
    left: -4,
    width: 9,
    height: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.vellum
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
    backgroundColor: colors.gold
  },
  panelMeta: {
    ...type.caption,
    color: colors.gold
  },
  panelTitle: {
    color: colors.ink
  },
  panelTime: {
    ...type.display,
    fontSize: 52,
    lineHeight: 55,
    color: colors.ink
  },
  panelBody: {
    color: colors.inkMuted
  },
  locationStrip: {
    minHeight: 58,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.xs,
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
    borderRadius: radii.md,
    backgroundColor: colors.mineral,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center"
  },
  smallButtonText: {
    ...type.caption,
    color: colors.blue
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.hairlineStrong
  },
  listLabel: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs
  },
  emptyState: {
    gap: spacing.sm,
    padding: spacing.xl
  },
  notice: {
    minHeight: 58,
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
    paddingHorizontal: spacing.md,
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

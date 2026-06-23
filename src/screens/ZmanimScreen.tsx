import { Bell, MapPin, RefreshCw } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { ZmanRow } from "@/components/ZmanRow";
import { colors, radii, spacing } from "@/design/theme";
import { useZmanimStore } from "@/store/zmanimStore";

export function ZmanimScreen(): React.JSX.Element {
  const { location, zmanim, isLoading, refresh } = useZmanimStore();
  const nextZman = zmanim.find((zman) => zman.time.getTime() > Date.now()) ?? zmanim[0];

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.lightLine} />
        <Label>Local calendar</Label>
        <Display>Zmanim</Display>
        <Body>Precise daily times, tuned to where you are.</Body>
      </View>

      <Card accent="blue" style={styles.nowCard}>
        <View style={styles.locationRow}>
          <View style={styles.locationLabel}>
            <MapPin size={18} color={colors.blue} />
            <Body style={styles.locationText}>{location?.label ?? "Finding location"}</Body>
          </View>
          <AnimatedPressable accessibilityRole="button" onPress={() => void refresh()} disabled={isLoading} style={styles.refreshButton}>
            <RefreshCw size={18} color={isLoading ? colors.inkMuted : colors.ink} />
          </AnimatedPressable>
        </View>
        <View style={styles.nextBlock}>
          <Label>Next</Label>
          <SectionTitle style={styles.nextTitle}>{nextZman?.title ?? "Loading times"}</SectionTitle>
          <Display style={styles.nextTime}>{nextZman ? nextZman.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--"}</Display>
        </View>
      </Card>

      <Card accent="none" style={styles.listCard}>
        {zmanim.map((zman) => (
          <ZmanRow key={zman.key} zman={zman} />
        ))}
      </Card>

      <Card accent="gold" style={styles.notice}>
        <Bell size={18} color={colors.gold} />
        <Body style={styles.noticeText}>Local reminders are scheduled on device for zmanim, candle lighting, Havdalah, and tefillin.</Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  lightLine: {
    width: 64,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.blue,
    marginBottom: spacing.sm
  },
  nowCard: {
    gap: spacing.xl,
    padding: spacing.xl
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  locationLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  locationText: {
    color: colors.ink
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueSoft
  },
  nextBlock: {
    gap: spacing.xs
  },
  nextTitle: {
    color: colors.blue
  },
  nextTime: {
    fontSize: 52,
    lineHeight: 58
  },
  listCard: {
    paddingVertical: 0
  },
  notice: {
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

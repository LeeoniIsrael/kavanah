import { StyleSheet, View } from "react-native";

import { Shimmer, ShimmerGroup } from "@/components/molecules/shimmer";
import { colors } from "@/design/theme";

const CONTENT_COLORS = [colors.mineral, "#40404A", colors.mineral];
const ACCENT_COLORS = ["#24283A", "#3A405D", "#24283A"];
const ON_PRIMARY_COLORS = [
  "rgba(255,255,255,0.16)",
  "rgba(255,255,255,0.38)",
  "rgba(255,255,255,0.16)",
];

export function HomeNextMomentSkeleton(): React.JSX.Element {
  return (
    <ShimmerGroup
      accessibilityLabel="Finding your next prayer time"
      shimmerColors={ACCENT_COLORS}
      style={styles.heroGroup}
    >
      <Shimmer style={styles.kicker} />
      <Shimmer style={styles.title} />
      <Shimmer style={styles.homeTime} />
      <Shimmer style={styles.copy} />
      <View style={styles.actionRow}>
        <Shimmer style={styles.pill} />
        <Shimmer style={styles.shortPill} />
      </View>
    </ShimmerGroup>
  );
}

export function ZmanimHeroSkeleton(): React.JSX.Element {
  return (
    <ShimmerGroup
      accessibilityLabel="Calculating the next prayer time"
      shimmerColors={ON_PRIMARY_COLORS}
      style={styles.heroGroup}
    >
      <Shimmer style={styles.kicker} />
      <Shimmer style={styles.title} />
      <Shimmer style={styles.zmanTime} />
      <Shimmer style={styles.copy} />
    </ShimmerGroup>
  );
}

export function ZmanimListSkeleton(): React.JSX.Element {
  return (
    <ShimmerGroup
      accessibilityLabel="Loading today’s prayer times"
      shimmerColors={CONTENT_COLORS}
      style={styles.listGroup}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <View key={index} style={styles.listRow}>
          <View style={styles.listCopy}>
            <Shimmer
              style={[styles.rowTitle, index % 2 ? styles.rowTitleShort : null]}
            />
            <Shimmer style={styles.rowMeta} />
          </View>
          <Shimmer style={styles.rowTime} />
        </View>
      ))}
    </ShimmerGroup>
  );
}

export function PrayerTextSkeleton(): React.JSX.Element {
  return (
    <ShimmerGroup
      accessibilityLabel="Preparing the prayer text"
      shimmerColors={CONTENT_COLORS}
      style={styles.prayerGroup}
    >
      <View style={styles.prayerHeading}>
        <Shimmer style={styles.prayerIcon} />
        <View style={styles.prayerCopy}>
          <Shimmer style={styles.prayerTitle} />
          <Shimmer style={styles.prayerLine} />
          <Shimmer style={styles.prayerLineShort} />
        </View>
      </View>
    </ShimmerGroup>
  );
}

export function PrayerSearchSkeleton(): React.JSX.Element {
  return (
    <ShimmerGroup
      accessibilityLabel="Searching the prayer library"
      shimmerColors={CONTENT_COLORS}
      style={styles.searchGroup}
    >
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} style={styles.searchCard}>
          <Shimmer
            style={[
              styles.searchTitle,
              index === 1 ? styles.rowTitleShort : null,
            ]}
          />
          <Shimmer style={styles.searchLine} />
          <Shimmer style={styles.searchLineShort} />
        </View>
      ))}
    </ShimmerGroup>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  copy: {
    borderRadius: 6,
    height: 14,
    width: "76%",
  },
  heroGroup: {
    gap: 12,
  },
  homeTime: {
    borderRadius: 10,
    height: 52,
    width: "48%",
  },
  kicker: {
    borderRadius: 5,
    height: 12,
    width: 72,
  },
  listCopy: {
    flex: 1,
    gap: 8,
  },
  listGroup: {
    paddingHorizontal: 4,
  },
  listRow: {
    alignItems: "center",
    borderBottomColor: colors.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 16,
    minHeight: 72,
    paddingVertical: 14,
  },
  pill: {
    borderRadius: 22,
    height: 44,
    width: 118,
  },
  prayerCopy: {
    flex: 1,
    gap: 8,
  },
  prayerGroup: {
    paddingVertical: 16,
  },
  prayerHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  prayerIcon: {
    borderRadius: 12,
    height: 42,
    width: 42,
  },
  prayerLine: {
    borderRadius: 5,
    height: 12,
    width: "94%",
  },
  prayerLineShort: {
    borderRadius: 5,
    height: 12,
    width: "68%",
  },
  prayerTitle: {
    borderRadius: 6,
    height: 18,
    width: "48%",
  },
  rowMeta: {
    borderRadius: 5,
    height: 11,
    width: "68%",
  },
  rowTime: {
    borderRadius: 6,
    height: 20,
    width: 76,
  },
  rowTitle: {
    borderRadius: 6,
    height: 16,
    width: "54%",
  },
  rowTitleShort: {
    width: "42%",
  },
  searchCard: {
    backgroundColor: colors.vellum,
    borderColor: colors.hairline,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  searchGroup: {
    gap: 12,
  },
  searchLine: {
    borderRadius: 5,
    height: 12,
    width: "88%",
  },
  searchLineShort: {
    borderRadius: 5,
    height: 12,
    width: "64%",
  },
  searchTitle: {
    borderRadius: 6,
    height: 18,
    width: "52%",
  },
  shortPill: {
    borderRadius: 22,
    height: 44,
    width: 74,
  },
  title: {
    borderRadius: 7,
    height: 22,
    width: "58%",
  },
  zmanTime: {
    borderRadius: 10,
    height: 58,
    width: "56%",
  },
});

import { CircleLoadingIndicator } from "@/components/molecules/circle-loader";

// One status per loading region, with space reserved for the arriving content.
export function HomeNextMomentSkeleton() {
  return (
    <CircleLoadingIndicator
      accessibilityLabel="Finding your next prayer time"
      style={{ minHeight: 160 }}
    />
  );
}
export function ZmanimHeroSkeleton() {
  return (
    <CircleLoadingIndicator
      accessibilityLabel="Calculating the next prayer time"
      style={{ minHeight: 160 }}
    />
  );
}
export function ZmanimListSkeleton() {
  return (
    <CircleLoadingIndicator
      accessibilityLabel="Loading today’s prayer times"
      style={{ minHeight: 180 }}
    />
  );
}
export function PrayerTextSkeleton() {
  return (
    <CircleLoadingIndicator
      accessibilityLabel="Preparing the prayer text"
      style={{ minHeight: 120 }}
    />
  );
}
export function PrayerSearchSkeleton() {
  return (
    <CircleLoadingIndicator
      accessibilityLabel="Searching the prayer library"
      style={{ minHeight: 160 }}
    />
  );
}

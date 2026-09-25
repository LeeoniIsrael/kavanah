import { format, startOfWeek } from "date-fns";

export type PrayerSharing = "off" | "first-daily" | "every";
export type SharingPreferences = {
  prayers: PrayerSharing;
  milestones: boolean;
};
export const STREAK_MILESTONES = [3, 7, 18, 40, 100] as const;
export const dayKey = (date: Date) => format(date, "yyyy-MM-dd");
export const weekKey = (date: Date) =>
  dayKey(startOfWeek(date, { weekStartsOn: 1 }));
export function shouldSharePrayer(
  mode: PrayerSharing,
  firstToday: boolean,
): boolean {
  return mode === "every" || (mode === "first-daily" && firstToday);
}
export function selectedQuote(
  text: string,
  start: number,
  end: number,
): string | null {
  const words = text.trim().split(/\s+/u);
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  if (
    !text.trim() ||
    !Number.isInteger(low) ||
    !Number.isInteger(high) ||
    low < 0 ||
    high >= words.length ||
    high - low >= 60
  )
    return null;
  return words.slice(low, high + 1).join(" ");
}

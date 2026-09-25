import type { FeedPost } from "@/store/socialStore";
import {
  addDays,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import type { PrayerHistoryEntry } from "@/store/prayerStore";
import type { HabitProgress } from "@/store/streakStore";
import type { PrayerText } from "@/types/prayer";
import { habitForPrayer } from "./practiceHabit";

export type CalendarActivity = {
  id: string;
  title: string;
  prayerId?: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
};
export type ActivityDays = Record<string, CalendarActivity[]>;
const names = {
  shacharit: "Shacharit",
  mincha: "Mincha",
  maariv: "Maariv",
  tefillin: "Tefillin",
  study: "Daily study",
};
export const calendarDayKey = (date: Date) => format(date, "yyyy-MM-dd");

/** Recover known completions from older installs whose Expo history was memory-only. */
export function recoverPrayerHistory(
  history: PrayerHistoryEntry[],
  posts: FeedPost[],
): PrayerHistoryEntry[] {
  const recovered = new Map(
    history
      .filter(
        (entry) =>
          !(
            entry.source === "imported-activity" &&
            entry.id.startsWith("checkin:")
          ),
      )
      .map((entry) => [entry.id, entry]),
  );
  for (const post of posts) {
    if (post.kind !== "prayer" || !isValid(parseISO(post.createdAt))) continue;
    const id = post.id.replace(/^prayer:/, "");
    if (id.startsWith("checkin:") || recovered.has(id)) continue;
    recovered.set(id, {
      id,
      prayerId: post.prayerId,
      prayerTitle: post.practice,
      completedAt: post.createdAt,
      source: "imported-activity",
      ...(post.startedAt ? { startedAt: post.startedAt } : {}),
      ...(post.durationSeconds !== undefined
        ? { durationSeconds: post.durationSeconds }
        : {}),
    });
  }
  return [...recovered.values()].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  );
}

export function buildActivityDays(
  history: PrayerHistoryEntry[],
  habits: HabitProgress[],
  prayers: PrayerText[],
): ActivityDays {
  const days: ActivityDays = {};
  const covered = new Set<string>();
  const seen = new Set<string>();
  const library = new Map(prayers.map((p) => [p.id, p]));
  for (const entry of [...history].sort(
    (a, b) =>
      Number(a.id.startsWith("checkin:")) - Number(b.id.startsWith("checkin:")),
  )) {
    const date = parseISO(entry.completedAt);
    if (!isValid(date) || seen.has(entry.id)) continue;
    seen.add(entry.id);
    const day = calendarDayKey(date);
    const prayer = library.get(entry.prayerId);
    const habit = habitForPrayer(
      prayer ?? {
        id: entry.prayerId,
        title: entry.prayerTitle,
        category: "",
        tags: [],
      },
    );
    if (
      habit &&
      entry.id.startsWith("checkin:") &&
      covered.has(`${day}:${habit}`)
    )
      continue;
    if (habit) covered.add(`${day}:${habit}`);
    (days[day] ??= []).push({
      id: entry.id,
      title: entry.prayerTitle,
      prayerId: entry.prayerId,
      ...(entry.startedAt ? { startedAt: entry.startedAt } : {}),
      completedAt: entry.completedAt,
      ...(entry.durationSeconds !== undefined
        ? { durationSeconds: entry.durationSeconds }
        : {}),
    });
  }
  for (const habit of habits)
    for (const day of habit.completedDates) {
      if (!isValid(parseISO(day)) || covered.has(`${day}:${habit.habit}`))
        continue;
      covered.add(`${day}:${habit.habit}`);
      (days[day] ??= []).push({
        id: `checkin:${habit.habit}:${day}`,
        title: names[habit.habit],
      });
    }
  return days;
}

/** Monday-first whole weeks, including muted adjacent-month cells. */
export function calendarWeeks(month: Date): Date[][] {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const weeks: Date[][] = [];
  for (let start = first; start < nextMonth; start = addDays(start, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(start, index)));
  }
  return weeks;
}

/** A streak remains current until today has elapsed, so yesterday can anchor it. */
export function currentActivityStreak(days: ActivityDays, now: Date): number {
  let day = startOfDay(now);
  if (!days[calendarDayKey(day)]?.length) day = subDays(day, 1);
  let streak = 0;
  while (days[calendarDayKey(day)]?.length) {
    streak++;
    day = subDays(day, 1);
  }
  return streak;
}

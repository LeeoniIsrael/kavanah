import { formatISO, startOfMonth, startOfWeek, startOfYear, subDays } from "date-fns";

import type { HabitProgress } from "@/store/streakStore";

export type PracticeStats = {
  currentRun: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  allTime: number;
};

export function calculatePracticeStats(habits: HabitProgress[], now: Date): PracticeStats {
  const completionDates = habits.flatMap((habit) => habit.completedDates);
  return {
    currentRun: calculateCurrentRun(completionDates, now),
    thisWeek: countSince(completionDates, startOfWeek(now, { weekStartsOn: 0 }), now),
    thisMonth: countSince(completionDates, startOfMonth(now), now),
    thisYear: countSince(completionDates, startOfYear(now), now),
    allTime: completionDates.length
  };
}

export function calculateCurrentRun(completedDates: string[], now: Date): number {
  const completed = new Set(completedDates);
  const today = formatDateKey(now);
  const yesterday = formatDateKey(subDays(now, 1));
  let cursor = completed.has(today) ? now : completed.has(yesterday) ? subDays(now, 1) : null;
  let run = 0;

  while (cursor && completed.has(formatDateKey(cursor))) {
    run += 1;
    cursor = subDays(cursor, 1);
  }

  return run;
}

function countSince(completedDates: string[], start: Date, end: Date): number {
  const startKey = formatDateKey(start);
  const endKey = formatDateKey(end);
  return completedDates.filter((date) => date >= startKey && date <= endKey).length;
}

function formatDateKey(date: Date): string {
  return formatISO(date, { representation: "date" });
}

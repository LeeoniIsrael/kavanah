import { calculateCurrentRun, calculatePracticeStats } from "@/services/practiceStats";
import type { HabitProgress } from "@/store/streakStore";

const habits: HabitProgress[] = [
  { habit: "shacharit", streak: 3, freezes: 2, completedDates: ["2025-12-31", "2026-06-01", "2026-06-20", "2026-06-21", "2026-06-22"], badges: ["3 days"] },
  { habit: "study", streak: 2, freezes: 2, completedDates: ["2026-06-21", "2026-06-22"], badges: [] }
];

describe("practice statistics", () => {
  it("counts completions across week, month, year, and all time", () => {
    const stats = calculatePracticeStats(habits, new Date("2026-06-22T12:00:00"));

    expect(stats).toEqual({
      currentRun: 3,
      thisWeek: 4,
      thisMonth: 6,
      thisYear: 6,
      allTime: 7
    });
  });

  it("keeps a run active through the following day and resets after a missed day", () => {
    const dates = ["2026-06-20", "2026-06-21", "2026-06-22"];

    expect(calculateCurrentRun(dates, new Date("2026-06-23T12:00:00"))).toBe(3);
    expect(calculateCurrentRun(dates, new Date("2026-06-24T12:00:00"))).toBe(0);
  });
});

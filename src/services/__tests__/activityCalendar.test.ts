import {
  buildActivityDays,
  recoverPrayerHistory,
  calendarDayKey,
  calendarWeeks,
  currentActivityStreak,
} from "../activityCalendar";
import type { PrayerHistoryEntry } from "@/store/prayerStore";
import type { HabitProgress } from "@/store/streakStore";
const completion = (
  id: string,
  day: string,
  prayerId = "shacharit",
): PrayerHistoryEntry => ({
  id,
  prayerId,
  prayerTitle: prayerId,
  completedAt: new Date(`${day}T10:00:00`).toISOString(),
  source: "reader",
});
const habit = (dates: string[]): HabitProgress => ({
  habit: "shacharit",
  streak: 0,
  freezes: 2,
  completedDates: dates,
  badges: [],
});
test("counts distinct sessions without double counting their daily habit credit", () => {
  const entry = completion("one", "2026-09-24");
  const days = buildActivityDays(
    [entry, entry, completion("two", "2026-09-24")],
    [habit(["2026-09-24", "2026-09-25"])],
    [],
  );
  expect(days["2026-09-24"]).toHaveLength(2);
  expect(days["2026-09-25"]?.[0]?.title).toBe("Shacharit");
});
test("uses the local completion day, not the UTC date", () => {
  const entry = completion("late", "2026-09-24");
  entry.completedAt = new Date(2026, 8, 24, 23, 59).toISOString();
  expect(Object.keys(buildActivityDays([entry], [], []))).toEqual([
    "2026-09-24",
  ]);
});
test("calendar includes leap day and complete Monday-first weeks", () => {
  const weeks = calendarWeeks(new Date(2024, 1, 1));
  expect(weeks[0]?.[0]?.getDay()).toBe(1);
  expect(weeks.every((week) => week.length === 7)).toBe(true);
  expect(weeks.flat().map(calendarDayKey)).toContain("2024-02-29");
  expect(calendarWeeks(new Date(2026, 2, 1))).toHaveLength(6);
});
test("current streak can end yesterday, and stops at a missed day", () => {
  const days = buildActivityDays(
    [],
    [habit(["2026-09-21", "2026-09-23", "2026-09-24"])],
    [],
  );
  expect(currentActivityStreak(days, new Date(2026, 8, 25))).toBe(2);
  expect(currentActivityStreak(days, new Date(2026, 8, 26))).toBe(0);
});
test("history works independently of feed sharing and ignores invalid timestamps", () => {
  const entry = completion("private", "2026-09-24", "modeh-ani");
  expect(
    buildActivityDays(
      [entry, { ...entry, id: "bad", completedAt: "invalid" }],
      [],
      [],
    )["2026-09-24"],
  ).toHaveLength(1);
});

test("recovers legacy prayer posts without counting quotes, milestones, or existing sessions twice", () => {
  const entry = completion("one", "2026-09-24");
  const base = {
    prayerId: "shacharit",
    practice: "Shacharit",
    createdAt: entry.completedAt,
  };
  const recovered = recoverPrayerHistory(
    [entry],
    [
      { ...base, id: "prayer:one", kind: "prayer" },
      { ...base, id: "prayer:two", kind: "prayer" },
      { ...base, id: "quote", kind: "quote" },
      { ...base, id: "prayer:checkin:shacharit:2026-09-24", kind: "prayer" },
      { ...base, id: "milestone", kind: "milestone" },
    ],
  );
  expect(recovered).toHaveLength(2);
  expect(recovered.find((item) => item.id === "two")?.source).toBe(
    "imported-activity",
  );
});

import { formatISO, isSameDay, parseISO, subDays } from "date-fns";
import { create } from "zustand";

import { readJson, userStorage, writeJson } from "@/services/mmkv";

export type StreakHabit = "shacharit" | "mincha" | "maariv" | "tefillin" | "study";

export type HabitProgress = {
  habit: StreakHabit;
  streak: number;
  freezes: number;
  completedDates: string[];
  badges: string[];
};

type StreakState = {
  habits: HabitProgress[];
  completeHabit: (habit: StreakHabit, date?: Date) => void;
  toggleHabit: (habit: StreakHabit, date?: Date) => void;
  useFreeze: (habit: StreakHabit, date?: Date) => void;
};

const STORAGE_KEY = "streaks.v1";
const habitKeys: StreakHabit[] = ["shacharit", "mincha", "maariv", "tefillin", "study"];

const initialHabits: HabitProgress[] = habitKeys.map((habit) => ({
  habit,
  streak: 0,
  freezes: 2,
  completedDates: [],
  badges: []
}));

function isHabitProgressArray(value: unknown): value is HabitProgress[] {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && typeof (item as { habit?: unknown }).habit === "string");
}

const persisted = readJson(userStorage, STORAGE_KEY, isHabitProgressArray) ?? initialHabits;

export const useStreakStore = create<StreakState>((set) => ({
  habits: persisted,
  completeHabit: (habit, date = new Date()) =>
    set((state) => persist(updateHabit(state.habits, habit, date, false))),
  toggleHabit: (habit, date = new Date()) =>
    set((state) => persist(toggleHabit(state.habits, habit, date))),
  useFreeze: (habit, date = new Date()) =>
    set((state) => persist(updateHabit(state.habits, habit, date, true)))
}));

function updateHabit(habits: HabitProgress[], habit: StreakHabit, date: Date, consumeFreeze: boolean): { habits: HabitProgress[] } {
  const iso = formatISO(date, { representation: "date" });
  const updated = habits.map((entry) => {
    if (entry.habit !== habit) {
      return entry;
    }
    if (entry.completedDates.includes(iso)) {
      return entry;
    }
    const completedDates = [...entry.completedDates, iso].sort();
    const streak = calculateStreak(completedDates);
    const freezes = consumeFreeze ? Math.max(entry.freezes - 1, 0) : entry.freezes;
    const badges = Array.from(new Set([...entry.badges, ...milestones(streak)]));
    return { ...entry, streak, freezes, badges, completedDates };
  });
  return { habits: updated };
}

function toggleHabit(habits: HabitProgress[], habit: StreakHabit, date: Date): { habits: HabitProgress[] } {
  const iso = formatISO(date, { representation: "date" });
  const entry = habits.find((item) => item.habit === habit);

  if (!entry?.completedDates.includes(iso)) {
    return updateHabit(habits, habit, date, false);
  }

  return {
    habits: habits.map((item) => {
      if (item.habit !== habit) {
        return item;
      }
      const completedDates = item.completedDates.filter((completedDate) => completedDate !== iso);
      return { ...item, completedDates, streak: calculateStreak(completedDates) };
    })
  };
}

function calculateStreak(completedDates: string[]): number {
  const dates = Array.from(new Set(completedDates)).sort();
  if (dates.length === 0) {
    return 0;
  }

  let streak = 1;
  for (let index = dates.length - 1; index > 0; index -= 1) {
    const currentDate = dates[index];
    const previousDate = dates[index - 1];
    if (!currentDate || !previousDate) {
      break;
    }
    const current = parseISO(currentDate);
    const previous = parseISO(previousDate);
    if (!isSameDay(previous, subDays(current, 1))) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function persist(state: { habits: HabitProgress[] }): { habits: HabitProgress[] } {
  writeJson(userStorage, STORAGE_KEY, state.habits);
  return state;
}

function milestones(streak: number): string[] {
  return [3, 7, 18, 40, 100].filter((milestone) => streak >= milestone).map((milestone) => `${milestone} days`);
}

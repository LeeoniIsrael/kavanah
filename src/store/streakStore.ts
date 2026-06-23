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
    const lastDate = entry.completedDates.at(-1);
    const continued = lastDate ? isSameDay(parseISO(lastDate), subDays(date, 1)) : false;
    const streak = continued || entry.streak === 0 ? entry.streak + 1 : 1;
    const freezes = consumeFreeze ? Math.max(entry.freezes - 1, 0) : entry.freezes;
    const badges = Array.from(new Set([...entry.badges, ...milestones(streak)]));
    return { ...entry, streak, freezes, badges, completedDates: [...entry.completedDates, iso] };
  });
  return { habits: updated };
}

function persist(state: { habits: HabitProgress[] }): { habits: HabitProgress[] } {
  writeJson(userStorage, STORAGE_KEY, state.habits);
  return state;
}

function milestones(streak: number): string[] {
  return [3, 7, 18, 40, 100].filter((milestone) => streak >= milestone).map((milestone) => `${milestone} days`);
}

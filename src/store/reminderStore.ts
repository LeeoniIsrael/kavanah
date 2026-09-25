import { create } from "zustand";
import { readSocialData, writeSocialData } from "@/services/socialStorage";
import {
  defaultReminders,
  validTime,
  type ReminderPreferences,
} from "@/services/reminderPlan";
import type { GeoPoint } from "@/types/zmanim";

const KEY = "reminders.v1";
export function isReminderPreferences(
  value: unknown,
): value is ReminderPreferences {
  if (!value || typeof value !== "object") return false;
  const p = value as ReminderPreferences,
    defaults = defaultReminders();
  return (
    [
      p.enabled,
      p.sound,
      p.quiet,
      p.pauseHolyDays,
      p.skipCholHamoed,
      p.holidays?.enabled,
      p.holidays?.festivals,
      p.holidays?.fasts,
      p.holidays?.roshChodesh,
      p.checklist?.enabled,
    ].every((v) => typeof v === "boolean") &&
    [p.quietStart, p.quietEnd, p.holidays.time, p.checklist.time].every(
      validTime,
    ) &&
    [p.holidays.lead, p.checklist.lead].every(
      (v) => Number.isInteger(v) && v >= 0 && v <= 14,
    ) &&
    Object.keys(defaults.prayers).every((id) => {
      const r = p.prayers?.[id as keyof typeof p.prayers];
      return (
        r &&
        typeof r.enabled === "boolean" &&
        validTime(r.time) &&
        Array.isArray(r.days) &&
        r.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      );
    }) &&
    Object.keys(defaults.zmanim).every((id) => {
      const r = p.zmanim?.[id as keyof typeof p.zmanim];
      return (
        r &&
        typeof r.enabled === "boolean" &&
        Number.isInteger(r.lead) &&
        r.lead >= 0 &&
        r.lead <= 120
      );
    })
  );
}
const isChecklists = (v: unknown): v is Record<string, string[]> =>
  Boolean(
    v &&
    typeof v === "object" &&
    Object.values(v).every(
      (a) => Array.isArray(a) && a.every((x) => typeof x === "string"),
    ),
  );
const isLocation = (v: unknown): v is GeoPoint => {
  const p = v as GeoPoint;
  return Boolean(
    p &&
    typeof p.label === "string" &&
    Number.isFinite(p.latitude) &&
    Math.abs(p.latitude) <= 90 &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.longitude) <= 180,
  );
};
type ReminderState = {
  prefs: ReminderPreferences;
  location: GeoPoint | null;
  checklists: Record<string, string[]>;
  status: string;
  error: string | null;
  syncing: boolean;
  scheduled: number;
  preview: { title: string; date: string }[];
  update: (change: Partial<ReminderPreferences>) => void;
  setLocation: (location: GeoPoint) => void;
  toggleTask: (date: string, item: string) => void;
};
export const useReminderStore = create<ReminderState>((set, get) => ({
  prefs: readSocialData(KEY, isReminderPreferences) ?? defaultReminders(),
  location: readSocialData("reminders.location", isLocation),
  checklists: readSocialData("reminders.checklists", isChecklists) ?? {},
  status: "Reminders are off.",
  error: null,
  syncing: false,
  scheduled: 0,
  preview: [],
  update: (change) => {
    const prefs = { ...get().prefs, ...change };
    if (!isReminderPreferences(prefs)) return;
    try {
      writeSocialData(KEY, prefs);
      set({ prefs, error: null });
    } catch {
      set({ error: "Your changes could not be saved. Please try again." });
    }
  },
  setLocation: (location) => {
    try {
      writeSocialData("reminders.location", location);
      set({ location, error: null });
    } catch {
      set({ error: "Your location could not be saved. Please try again." });
    }
  },
  toggleTask: (date, item) => {
    const current = get().checklists[date] ?? [];
    const checklists = {
      ...get().checklists,
      [date]: current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item],
    };
    try {
      writeSocialData("reminders.checklists", checklists);
      set({ checklists, error: null });
    } catch {
      set({ error: "Your checklist could not be saved." });
    }
  },
}));

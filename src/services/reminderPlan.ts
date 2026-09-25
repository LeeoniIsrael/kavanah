import { addDays, format, startOfDay } from "date-fns";
import {
  ComplexZmanimCalendar,
  GeoLocation,
  JewishCalendar,
} from "kosher-zmanim";
import { jewishCalendarDay } from "./jewishCalendar";
import type { GeoPoint } from "@/types/zmanim";

export const prayerReminders = [
  {
    id: "tefillin",
    title: "Wrap tefillin",
    body: "A moment to wrap tefillin.",
    time: "08:00",
    prayer: "tefillin-blessing",
  },
  {
    id: "shacharit",
    title: "Shacharit",
    body: "Time for morning prayer.",
    time: "08:15",
    prayer: "shacharit",
  },
  {
    id: "mincha",
    title: "Mincha",
    body: "A moment for afternoon prayer.",
    time: "14:00",
    prayer: "mincha",
  },
  {
    id: "maariv",
    title: "Maariv",
    body: "Time for evening prayer.",
    time: "20:30",
    prayer: "maariv",
  },
] as const;
export type PrayerReminderId = (typeof prayerReminders)[number]["id"];
export const timedReminders = [
  {
    id: "shema",
    title: "Morning Shema deadline",
    method: "Morning declaration of faith · Sunrise-to-sunset calculation",
  },
  {
    id: "tefilah",
    title: "Morning prayer deadline",
    method: "Morning Amidah (standing prayer) · Sunrise-to-sunset calculation",
  },
  {
    id: "mincha",
    title: "Afternoon prayer begins",
    method: "Earliest Mincha · Opens after midday",
  },
  {
    id: "maariv",
    title: "Nightfall",
    method: "After sunset, when evening prayer can begin · 8.5° calculation",
  },
  {
    id: "candles",
    title: "Shabbat candle lighting",
    method: "18 minutes before sunset",
  },
] as const;
export type TimedReminderId = (typeof timedReminders)[number]["id"];
export type ReminderPreferences = {
  enabled: boolean;
  sound: boolean;
  quiet: boolean;
  quietStart: string;
  quietEnd: string;
  pauseHolyDays: boolean;
  skipCholHamoed: boolean;
  prayers: Record<
    PrayerReminderId,
    { enabled: boolean; time: string; days: number[] }
  >;
  zmanim: Record<TimedReminderId, { enabled: boolean; lead: number }>;
  holidays: {
    enabled: boolean;
    lead: number;
    time: string;
    festivals: boolean;
    fasts: boolean;
    roshChodesh: boolean;
  };
  checklist: { enabled: boolean; lead: number; time: string };
};
export function defaultReminders(): ReminderPreferences {
  return {
    enabled: false,
    sound: false,
    quiet: true,
    quietStart: "22:00",
    quietEnd: "07:00",
    pauseHolyDays: true,
    skipCholHamoed: true,
    prayers: Object.fromEntries(
      prayerReminders.map((p) => [
        p.id,
        { enabled: false, time: p.time, days: [0, 1, 2, 3, 4, 5, 6] },
      ]),
    ) as ReminderPreferences["prayers"],
    zmanim: Object.fromEntries(
      timedReminders.map((p) => [
        p.id,
        {
          enabled: false,
          lead: p.id === "mincha" || p.id === "maariv" ? 0 : 15,
        },
      ]),
    ) as ReminderPreferences["zmanim"],
    holidays: {
      enabled: false,
      lead: 3,
      time: "09:00",
      festivals: true,
      fasts: false,
      roshChodesh: false,
    },
    checklist: { enabled: false, lead: 7, time: "18:00" },
  };
}
export const validTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function atTime(date: Date, time: string) {
  const result = new Date(date);
  const [h, m] = time.split(":").map(Number);
  result.setHours(h ?? 0, m ?? 0, 0, 0);
  return result;
}
export function inQuietHours(date: Date, prefs: ReminderPreferences) {
  if (!prefs.quiet) return false;
  const value = format(date, "HH:mm"),
    start = prefs.quietStart,
    end = prefs.quietEnd;
  return (
    start === end ||
    (start < end
      ? value >= start && value < end
      : value >= start || value < end)
  );
}
const jewish = (date: Date, israel: boolean) => {
  const c = new JewishCalendar(date);
  c.setInIsrael(israel);
  return c;
};
export type HolidayOccurrence = {
  date: Date;
  key: string;
  title: string;
  kind: "festival" | "fast" | "roshChodesh";
  beginsEvening: boolean;
};
export function holidayOn(
  date: Date,
  israel: boolean,
): HolidayOccurrence | null {
  const c = jewish(date, israel),
    previous = jewish(addDays(date, -1), israel),
    id = c.getYomTovIndex();
  const festivals = [
    JewishCalendar.ROSH_HASHANA,
    JewishCalendar.YOM_KIPPUR,
    JewishCalendar.SUCCOS,
    JewishCalendar.SHEMINI_ATZERES,
    JewishCalendar.SIMCHAS_TORAH,
    JewishCalendar.PESACH,
    JewishCalendar.SHAVUOS,
    JewishCalendar.CHANUKAH,
    JewishCalendar.PURIM,
  ];
  const kind = festivals.includes(id)
    ? "festival"
    : c.isTaanis()
      ? "fast"
      : c.isRoshChodesh()
        ? "roshChodesh"
        : null;
  if (
    !kind ||
    (id !== -1 && id === previous.getYomTovIndex()) ||
    (kind === "roshChodesh" && previous.isRoshChodesh())
  )
    return null;
  const names = jewishCalendarDay(date, israel).events;
  return {
    date,
    key: format(date, "yyyy-MM-dd"),
    title: names.join(" · ") || "Rosh Chodesh",
    kind,
    beginsEvening: kind !== "fast" || id === JewishCalendar.TISHA_BEAV,
  };
}
export function upcomingHolidays(now: Date, israel: boolean, days = 90) {
  return Array.from({ length: days }, (_, i) =>
    holidayOn(addDays(startOfDay(now), i), israel),
  ).filter((h): h is HolidayOccurrence => h !== null);
}
export function checklistItems(title: string): string[] {
  const common = [
    "Check local holiday times",
    "Plan meals and arrangements",
    "Set aside prayer or reading time",
  ];
  if (/Pesach/.test(title))
    return [
      "Plan cleaning and chametz arrangements",
      "Prepare matzah and the seder",
      ...common,
    ];
  if (/Sukkot|Succos/.test(title))
    return ["Arrange a sukkah", "Arrange a lulav and etrog", ...common];
  if (/Chanukah/.test(title))
    return ["Prepare a menorah and candles or oil", ...common];
  if (/Purim/.test(title))
    return [
      "Find a Megillah reading",
      "Plan gifts, charity and the festive meal",
      ...common,
    ];
  if (/Kippur|fast|Tammuz|Teves|Gedalia|Av/.test(title))
    return [
      "Plan ahead for the fast",
      "Confirm any health needs with your clinician",
      ...common,
    ];
  return common;
}
export type PlannedReminder = {
  id: string;
  date: Date;
  title: string;
  body: string;
  url: string;
};
export function buildReminderPlan(
  prefs: ReminderPreferences,
  location: GeoPoint,
  israel: boolean,
  now: Date,
  completed: Record<string, string[]> = {},
  checklists: Record<string, string[]> = {},
) {
  if (!prefs.enabled) return [];
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const geo = new GeoLocation(
    location.label,
    location.latitude,
    location.longitude,
    location.altitudeMeters ?? 0,
    zone,
  );
  const cache = new Map<string, ComplexZmanimCalendar>();
  const astro = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    if (!cache.has(key)) {
      const c = new ComplexZmanimCalendar(geo);
      c.setDate(date);
      cache.set(key, c);
    }
    return cache.get(key)!;
  };
  const asDate = (value: { toJSDate(): Date } | null) => {
    const d = value?.toJSDate();
    return d && Number.isFinite(d.getTime()) ? d : null;
  };
  const holy = (date: Date) =>
    date.getDay() === 6 || jewish(date, israel).isYomTovAssurBemelacha();
  const duringHoly = (date: Date) => {
    const calendar = astro(date),
      sunset = asDate(calendar.getSunset()),
      night = asDate(calendar.getTzais());
    if (holy(date) && (!night || date < night)) return true;
    return holy(addDays(date, 1)) && (!sunset || date >= sunset);
  };
  const plan: PlannedReminder[] = [];
  const end = addDays(startOfDay(now), 30);
  const add = (
    id: string,
    date: Date | null,
    title: string,
    body: string,
    url: string,
  ) => {
    if (
      !date ||
      date <= now ||
      date >= end ||
      inQuietHours(date, prefs) ||
      (prefs.pauseHolyDays && duringHoly(date))
    )
      return;
    plan.push({
      id: `kavanah-reminder:${id}:${format(date, "yyyy-MM-dd")}`,
      date,
      title,
      body,
      url,
    });
  };
  for (let i = 0; i < 30; i++) {
    const date = addDays(startOfDay(now), i),
      key = format(date, "yyyy-MM-dd"),
      c = jewish(date, israel),
      a = astro(date);
    for (const prayer of prayerReminders) {
      const setting = prefs.prayers[prayer.id];
      if (
        !setting.enabled ||
        !setting.days.includes(date.getDay()) ||
        completed[prayer.id]?.includes(key)
      )
        continue;
      const time = atTime(date, setting.time);
      if (prayer.id === "tefillin") {
        const rise = asDate(a.getSunrise()),
          sunset = asDate(a.getSunset());
        if (
          date.getDay() === 6 ||
          c.isYomTovAssurBemelacha() ||
          (prefs.skipCholHamoed && c.isCholHamoed()) ||
          !rise ||
          !sunset ||
          time < rise ||
          time >= sunset
        )
          continue;
      }
      add(
        prayer.id,
        time,
        prayer.title,
        prayer.body,
        `kavanah://prayer?query=${prayer.id}&prayerId=${prayer.prayer}`,
      );
    }
    const times = {
      shema: asDate(a.getSofZmanShmaGRA()),
      tefilah: asDate(a.getSofZmanTfilaGRA()),
      mincha: asDate(a.getMinchaGedola(a.getSunrise(), a.getSunset())),
      maariv: asDate(a.getTzais()),
      candles: date.getDay() === 5 ? asDate(a.getCandleLighting()) : null,
    };
    for (const row of timedReminders) {
      const setting = prefs.zmanim[row.id],
        time = times[row.id];
      if (!setting.enabled || !time) continue;
      add(
        `zman-${row.id}`,
        new Date(time.getTime() - setting.lead * 60_000),
        row.title,
        setting.lead
          ? `${row.title} in ${setting.lead} minutes.`
          : `${row.title} is now.`,
        "kavanah://zmanim",
      );
    }
  }
  for (const h of upcomingHolidays(now, israel, 46)) {
    const anchor = h.beginsEvening ? addDays(h.date, -1) : h.date;
    const allowed =
      h.kind === "festival"
        ? prefs.holidays.festivals
        : h.kind === "fast"
          ? prefs.holidays.fasts
          : prefs.holidays.roshChodesh;
    if (prefs.holidays.enabled && allowed)
      add(
        `holiday-${h.key}`,
        atTime(addDays(anchor, -prefs.holidays.lead), prefs.holidays.time),
        h.title,
        `${h.title} ${h.beginsEvening ? "begins" : "is"} ${format(anchor, "EEE, MMM d")}${h.beginsEvening ? " evening" : ""}.`,
        `kavanah://zmanim?section=calendar&date=${h.key}`,
      );
    if (
      prefs.checklist.enabled &&
      h.kind === "festival" &&
      !checklistItems(h.title).every((item) =>
        checklists[h.key]?.includes(item),
      )
    )
      add(
        `prepare-${h.key}`,
        atTime(addDays(anchor, -prefs.checklist.lead), prefs.checklist.time),
        `Prepare for ${h.title}`,
        "Your holiday checklist is ready.",
        `kavanah://holiday-checklist?date=${h.key}`,
      );
  }
  return plan.sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id),
  );
}

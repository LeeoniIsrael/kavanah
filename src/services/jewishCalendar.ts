import { HebrewDateFormatter, JewishCalendar } from "kosher-zmanim";

const formatter = new HebrewDateFormatter();
formatter.setHebrewFormat(false);
const names: Record<string, string> = {
  "Rosh Hashana": "Rosh Hashanah",
  Succos: "Sukkot",
  "Chol Hamoed Succos": "Chol HaMoed Sukkot",
  "Hoshana Rabba": "Hoshana Rabbah",
  "Shemini Atzeres": "Shemini Atzeret",
  "Simchas Torah": "Simchat Torah",
  "Erev Succos": "Erev Sukkot",
  Shavuos: "Shavuot",
  "Erev Shavuos": "Erev Shavuot",
};

/** Civil dates denote the daytime Hebrew date, not the date after sunset. */
export function jewishCalendarDay(date: Date, inIsrael: boolean) {
  const calendar = new JewishCalendar(
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12),
  );
  calendar.setInIsrael(inIsrael);
  calendar.setUseModernHolidays(true);
  const raw = formatter.formatYomTov(calendar);
  const events = raw ? [names[raw] ?? raw] : [];
  if (
    calendar.isRoshChodesh() &&
    !events.some((name) => name.includes("Rosh Chodesh"))
  )
    events.push("Rosh Chodesh");
  if (inIsrael && calendar.getYomTovIndex() === JewishCalendar.SHEMINI_ATZERES)
    events.push("Simchat Torah");
  return {
    date,
    hebrewDate: formatter.format(calendar),
    hebrewDay: calendar.getJewishDayOfMonth(),
    events,
    parsha: formatter.formatParsha(calendar),
    omer: calendar.getDayOfOmer(),
  };
}

/** Upcoming summary only; past days remain selectable in the calendar. */
export function remainingHolidayDays<
  T extends { date: Date; events: string[] },
>(days: T[], month: Date, now: Date): T[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return days.filter(
    (day) =>
      day.date.getFullYear() === month.getFullYear() &&
      day.date.getMonth() === month.getMonth() &&
      day.date >= today &&
      day.events.length > 0,
  );
}

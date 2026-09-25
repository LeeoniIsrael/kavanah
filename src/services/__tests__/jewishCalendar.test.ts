import { jewishCalendarDay } from "../jewishCalendar";
const day = (date: string, israel = false) =>
  jewishCalendarDay(new Date(`${date}T12:00:00`), israel);
describe("Jewish calendar", () => {
  it("crosses the Hebrew new year correctly", () => {
    expect(day("2026-09-12").hebrewDate).toBe("1 Tishrei, 5787");
    expect(day("2026-09-12").events).toContain("Rosh Hashanah");
    expect(day("2026-09-21").events).toContain("Yom Kippur");
  });
  it("handles leap-year Adar II", () => {
    expect(day("2027-03-23").hebrewDate).toBe("14 Adar II, 5787");
    expect(day("2027-03-23").events).toContain("Purim");
  });
  it("uses the appropriate Simchat Torah day", () => {
    expect(day("2026-10-03", true).events).toContain("Simchat Torah");
    expect(day("2026-10-03").events).not.toContain("Simchat Torah");
    expect(day("2026-10-04").events).toContain("Simchat Torah");
    expect(day("2026-10-04", true).events).not.toContain("Simchat Torah");
  });
  it("shows Rosh Chodesh alongside Chanukah", () => {
    const result = day("2026-12-10");
    expect(result.events).toContain("Rosh Chodesh");
    expect(result.events.some((event) => /Chanukah/.test(event))).toBe(true);
  });
  it("keeps civil calendar dates independent of the time of day", () => {
    expect(jewishCalendarDay(new Date(2026, 8, 12, 23), false).hebrewDate).toBe(
      day("2026-09-12").hebrewDate,
    );
  });
});

import { remainingHolidayDays } from "../jewishCalendar";
it("shows only remaining September dates, retaining today", () => {
  const now = new Date(2026, 8, 25, 23);
  const days = [
    day("2026-09-21"),
    day("2026-09-25"),
    day("2026-09-26"),
    day("2026-10-03"),
  ];
  const result = remainingHolidayDays(days, now, now);
  expect(result.some((d) => d.events.includes("Yom Kippur"))).toBe(false);
  expect(result.map((d) => d.date.getDate())).toContain(26);
  const today = { date: new Date(2026, 8, 25), events: ["Today"] };
  expect(remainingHolidayDays([today], now, now)).toEqual([today]);
});
it("keeps future-month holidays and leaves past months out of the upcoming list", () => {
  const now = new Date(2026, 8, 25);
  expect(
    remainingHolidayDays([day("2026-10-03")], new Date(2026, 9, 1), now),
  ).toHaveLength(1);
  expect(
    remainingHolidayDays(
      [day("2026-09-21")],
      new Date(2026, 8, 1),
      new Date(2026, 9, 1),
    ),
  ).toHaveLength(0);
});

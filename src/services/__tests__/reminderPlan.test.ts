import {
  buildReminderPlan,
  defaultReminders,
  holidayOn,
  inQuietHours,
  atTime,
  checklistItems,
} from "../reminderPlan";
const location = { latitude: 40.7128, longitude: -74.006, label: "New York" };
const day = (value: string) => new Date(`${value}T12:00:00`);
const enabled = () => {
  const p = defaultReminders();
  p.enabled = true;
  p.quiet = false;
  p.pauseHolyDays = false;
  return p;
};
describe("custom reminders", () => {
  it("defaults to no notifications", () =>
    expect(
      buildReminderPlan(defaultReminders(), location, false, day("2026-09-01")),
    ).toEqual([]));
  it("supports overnight and same-day quiet windows with an exclusive end", () => {
    const p = defaultReminders();
    expect(inQuietHours(atTime(day("2026-09-01"), "23:00"), p)).toBe(true);
    expect(inQuietHours(atTime(day("2026-09-01"), "07:00"), p)).toBe(false);
    p.quietStart = "12:00";
    p.quietEnd = "14:00";
    expect(inQuietHours(atTime(day("2026-09-01"), "13:00"), p)).toBe(true);
    expect(inQuietHours(atTime(day("2026-09-01"), "11:00"), p)).toBe(false);
  });
  it("obeys chosen weekdays and suppresses already-completed prayer days", () => {
    const p = enabled();
    p.prayers.shacharit = { enabled: true, time: "08:15", days: [1] };
    const plan = buildReminderPlan(p, location, false, day("2026-09-01"), {
      shacharit: ["2026-09-07"],
    });
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every((n) => n.date.getDay() === 1)).toBe(true);
    expect(plan.some((n) => n.date.getDate() === 7)).toBe(false);
  });
  it("never sends tefillin on Shabbat or Rosh Hashanah even with holy-day quiet off", () => {
    const p = enabled();
    p.prayers.tefillin.enabled = true;
    p.prayers.tefillin.time = "12:00";
    const plan = buildReminderPlan(p, location, false, day("2026-09-01"));
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.some((n) => n.date.getDay() === 6)).toBe(false);
    expect(plan.some((n) => n.date.getDate() === 13)).toBe(false);
    expect(plan.some((n) => n.date.getDate() === 21)).toBe(false);
  });
  it("does not invent a tefillin time when there is no sunrise", () => {
    const p = enabled();
    p.prayers.tefillin.enabled = true;
    expect(
      buildReminderPlan(
        p,
        { latitude: 89, longitude: 0, label: "Polar" },
        false,
        day("2026-12-01"),
      ),
    ).toEqual([]);
  });
  it("uses the evening start for festival notice and a daytime date for minor fasts", () => {
    const p = enabled();
    p.holidays = {
      enabled: true,
      lead: 1,
      time: "09:00",
      festivals: true,
      fasts: true,
      roshChodesh: false,
    };
    const plan = buildReminderPlan(p, location, false, day("2026-09-01"));
    const rh = plan.find((n) => n.title === "Rosh Hashanah")!;
    expect(rh.date.getDate()).toBe(10);
    expect(rh.body).toContain("Sep 11 evening");
    const fast = holidayOn(day("2026-09-14"), false)!;
    expect(fast.kind).toBe("fast");
    expect(fast.beginsEvening).toBe(false);
  });
  it("deduplicates two-day Rosh Hashanah and honors Israel's Simchat Torah", () => {
    expect(holidayOn(day("2026-09-13"), false)).toBeNull();
    expect(holidayOn(day("2026-10-03"), true)?.title).toContain(
      "Simchat Torah",
    );
    expect(holidayOn(day("2026-10-04"), true)).toBeNull();
  });
  it("skips completed preparation checklists", () => {
    const p = enabled();
    p.checklist.enabled = true;
    const plan = buildReminderPlan(
      p,
      location,
      false,
      day("2026-09-01"),
      {},
      { "2026-09-12": checklistItems("Rosh Hashanah") },
    );
    expect(plan.some((n) => n.id.includes("prepare-2026-09-12"))).toBe(false);
    expect(plan.some((n) => n.title.includes("Yom Kippur"))).toBe(true);
  });
  it("quiet Shabbat extends through Saturday nightfall and starts Friday sunset", () => {
    const p = enabled();
    p.pauseHolyDays = true;
    p.prayers.maariv = { enabled: true, time: "18:00", days: [6] };
    expect(buildReminderPlan(p, location, false, day("2026-09-01"))).toEqual(
      [],
    );
    p.prayers.maariv = { enabled: true, time: "23:00", days: [5] };
    expect(buildReminderPlan(p, location, false, day("2026-09-01"))).toEqual(
      [],
    );
  });
  it("produces deterministic identifiers and no past dates", () => {
    const p = enabled();
    p.prayers.mincha.enabled = true;
    const now = day("2026-09-01");
    const a = buildReminderPlan(p, location, false, now),
      b = buildReminderPlan(p, location, false, now);
    expect(a).toEqual(b);
    expect(new Set(a.map((n) => n.id)).size).toBe(a.length);
    expect(a.every((n) => n.date > now)).toBe(true);
  });
});

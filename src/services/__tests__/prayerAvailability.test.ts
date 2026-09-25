import { ComplexZmanimCalendar, GeoLocation } from "kosher-zmanim";
import {
  practiceAvailability,
  timedPracticeForPrayer,
} from "../prayerAvailability";
const location = { latitude: 40.7128, longitude: -74.006, label: "New York" };
const calendar = new ComplexZmanimCalendar(
  new GeoLocation(
    location.label,
    location.latitude,
    location.longitude,
    0,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ),
);
calendar.setDate(new Date(2026, 8, 24, 12));
const sunset = calendar.getSeaLevelSunset()!.toJSDate();
const start = calendar.getMisheyakir11Degrees()!.toJSDate();
const noon = calendar.getChatzos()!.toJSDate();
it("closes tefillin exactly at sunset, not a fixed clock time", () => {
  expect(
    practiceAvailability("tefillin", new Date(+sunset - 1), location).allowed,
  ).toBe(true);
  expect(practiceAvailability("tefillin", sunset, location).allowed).toBe(
    false,
  );
  expect(
    practiceAvailability("tefillin", new Date(+sunset + 3600000), location)
      .allowed,
  ).toBe(false);
});
it("does not offer tefillin before the calculated morning start", () => {
  expect(
    practiceAvailability("tefillin", new Date(+start - 1), location).allowed,
  ).toBe(false);
  expect(practiceAvailability("tefillin", start, location).allowed).toBe(true);
});
it("blocks tefillin on Shabbat and major festivals", () => {
  for (const date of [new Date(2026, 8, 19, 12), new Date(2026, 8, 21, 12)]) {
    expect(practiceAvailability("tefillin", date, location).reason).toMatch(
      /Shabbat or major holidays/,
    );
  }
});
it("uses midday for Shacharit, keeping the later permissible morning window", () => {
  expect(
    practiceAvailability("shacharit", new Date(+noon - 1), location).allowed,
  ).toBe(true);
  expect(practiceAvailability("shacharit", noon, location).allowed).toBe(false);
});
it("keeps night prayer and untimed blessings available after sunset", () => {
  expect(practiceAvailability("maariv", sunset, location).allowed).toBe(true);
  expect(practiceAvailability(undefined, sunset, null).allowed).toBe(true);
  expect(practiceAvailability("study", sunset, null).allowed).toBe(true);
});
it("requires real location and declines unavailable polar times", () => {
  expect(practiceAvailability("tefillin", noon, null).allowed).toBe(false);
  expect(
    practiceAvailability("tefillin", new Date(2026, 5, 23, 12), {
      latitude: 89,
      longitude: 0,
      label: "North",
    }).allowed,
  ).toBe(false);
});
it("does not turn source editions and individual blessings into service deadlines", () => {
  expect(
    timedPracticeForPrayer({ id: "modeh-ani", title: "Modeh Ani" }),
  ).toBeUndefined();
  expect(
    timedPracticeForPrayer({ id: "sefaria-shacharit-shema", title: "Shema" }),
  ).toBeUndefined();
  expect(
    timedPracticeForPrayer({
      id: "tefillin-blessing",
      title: "Blessing for Tefillin",
    }),
  ).toBe("tefillin");
});

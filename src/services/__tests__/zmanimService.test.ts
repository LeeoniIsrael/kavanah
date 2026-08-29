import { calculateZmanim, calculateZmanimRange } from "@/services/zmanimService";

const mockCalendarState = { date: new Date() };

jest.mock("kosher-zmanim", () => ({
  GeoLocation: class GeoLocation {},
  ComplexZmanimCalendar: class ComplexZmanimCalendar {
    setDate(date: Date) {
      mockCalendarState.date = date;
    }

    getSunrise() { return at(6, 17); }
    getSunset() { return at(19, 41); }
    getAlosHashachar() { return at(4, 52); }
    getSofZmanShmaGRA() { return at(9, 38); }
    getSofZmanTfilaGRA() { return at(10, 45); }
    getMinchaGedola() { return at(13, 2); }
    getMinchaKetana() { return at(16, 24); }
    getCandleLighting() { return at(19, 23); }
    getTzais() { return at(20, 18); }
  }
}));

describe("zmanim calculations", () => {
  const location = { latitude: 40.7128, longitude: -74.006, label: "New York" };

  it("uses calculated Luxon-like values instead of fixed fallback times", async () => {
    const zmanim = await calculateZmanim(location, new Date(2026, 7, 27, 12));
    expect(zmanim.find((zman) => zman.key === "sunrise")?.time.getHours()).toBe(6);
    expect(zmanim.find((zman) => zman.key === "sunrise")?.time.getMinutes()).toBe(17);
    expect(zmanim.find((zman) => zman.key === "minchaGedolah")?.time.getMinutes()).toBe(2);
  });

  it("shows candle lighting only on Friday and Havdalah only on Saturday", async () => {
    const thursday = await calculateZmanim(location, new Date(2026, 7, 27, 12));
    const friday = await calculateZmanim(location, new Date(2026, 7, 28, 12));
    const saturday = await calculateZmanim(location, new Date(2026, 7, 29, 12));

    expect(thursday.map((zman) => zman.key)).not.toContain("candleLighting");
    expect(thursday.map((zman) => zman.key)).not.toContain("havdalah");
    expect(friday.map((zman) => zman.key)).toContain("candleLighting");
    expect(friday.map((zman) => zman.key)).not.toContain("havdalah");
    expect(saturday.map((zman) => zman.key)).toContain("havdalah");
    expect(saturday.map((zman) => zman.key)).not.toContain("candleLighting");
  });

  it("caps reminder schedules at seven days", async () => {
    const schedule = await calculateZmanimRange(location, new Date(2026, 7, 27, 12), 20);
    const dates = new Set(schedule.map((zman) => zman.time.toDateString()));
    expect(dates.size).toBe(7);
  });
});

function at(hours: number, minutes: number) {
  const value = new Date(mockCalendarState.date);
  value.setHours(hours, minutes, 0, 0);
  return { toJSDate: () => value };
}

import { addDays, addMinutes, setHours, setMinutes, setSeconds } from "date-fns";

import type { GeoPoint, Zman } from "@/types/zmanim";

export async function calculateZmanim(location: GeoPoint, date = new Date()): Promise<Zman[]> {
  const { ComplexZmanimCalendar, GeoLocation } = await import("kosher-zmanim");
  const geoLocation = new GeoLocation(location.label, location.latitude, location.longitude, location.altitudeMeters ?? 0, Intl.DateTimeFormat().resolvedOptions().timeZone);
  const calendar = new ComplexZmanimCalendar(geoLocation);
  calendar.setDate(date);

  const rawSunrise = calendar.getSunrise();
  const rawSunset = calendar.getSunset();
  const sunrise = coerceDate(rawSunrise) ?? at(date, 6, 0);
  const sunset = coerceDate(rawSunset) ?? at(date, 20, 0);

  const daily: Zman[] = [
    { key: "alotHashachar", title: "Alot HaShachar", time: coerceDate(calendar.getAlosHashachar()) ?? addMinutes(sunrise, -72), notificationLeadMinutes: 10, method: "Dawn at 16.1°" },
    { key: "sunrise", title: "Sunrise", time: sunrise, notificationLeadMinutes: 5, method: "Local astronomical sunrise" },
    { key: "latestShema", title: "Latest Shema", time: coerceDate(calendar.getSofZmanShmaGRA()) ?? addMinutes(sunrise, 180), notificationLeadMinutes: 20, method: "GRA" },
    { key: "latestTefilah", title: "Latest Tefilah", time: coerceDate(calendar.getSofZmanTfilaGRA()) ?? addMinutes(sunrise, 240), notificationLeadMinutes: 20, method: "GRA" },
    { key: "minchaGedolah", title: "Mincha Gedolah", time: coerceDate(calendar.getMinchaGedola(rawSunrise, rawSunset)) ?? addMinutes(sunrise, 390), notificationLeadMinutes: 15, method: "GRA" },
    { key: "minchaKetana", title: "Mincha Ketana", time: coerceDate(calendar.getMinchaKetana(rawSunrise, rawSunset)) ?? addMinutes(sunrise, 570), notificationLeadMinutes: 15, method: "GRA" },
    { key: "sunset", title: "Sunset", time: sunset, notificationLeadMinutes: 10, method: "Local astronomical sunset" }
  ];

  if (date.getDay() === 5) {
    daily.push({
      key: "candleLighting",
      title: "Shabbat Candle Lighting",
      time: coerceDate(calendar.getCandleLighting()) ?? addMinutes(sunset, -18),
      notificationLeadMinutes: 30,
      method: "18 minutes before sea-level sunset"
    });
  }

  if (date.getDay() === 6) {
    daily.push({
      key: "havdalah",
      title: "Havdalah",
      time: coerceDate(calendar.getTzais()) ?? addMinutes(sunset, 42),
      notificationLeadMinutes: 10,
      method: "Nightfall at 8.5°"
    });
  }

  return daily.sort((left, right) => left.time.getTime() - right.time.getTime());
}

export async function calculateZmanimRange(location: GeoPoint, startDate = new Date(), days = 7): Promise<Zman[]> {
  const safeDays = Math.max(1, Math.min(days, 7));
  const schedule = await Promise.all(
    Array.from({ length: safeDays }, (_, index) => calculateZmanim(location, addDays(startDate, index)))
  );
  return schedule.flat().sort((left, right) => left.time.getTime() - right.time.getTime());
}

function coerceDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "object" && value !== null && "toJSDate" in value && typeof value.toJSDate === "function") {
    const date = value.toJSDate() as unknown;
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  return null;
}

function at(date: Date, hour: number, minute: number): Date {
  return setSeconds(setMinutes(setHours(date, hour), minute), 0);
}

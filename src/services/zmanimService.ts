import { addMinutes, setHours, setMinutes, setSeconds } from "date-fns";

import type { GeoPoint, Zman } from "@/types/zmanim";

export async function calculateZmanim(location: GeoPoint, date = new Date()): Promise<Zman[]> {
  const { ComplexZmanimCalendar, GeoLocation } = await import("kosher-zmanim");
  const geoLocation = new GeoLocation(location.label, location.latitude, location.longitude, location.altitudeMeters ?? 0, Intl.DateTimeFormat().resolvedOptions().timeZone);
  const calendar = new ComplexZmanimCalendar(geoLocation);
  calendar.setDate(date);

  const sunrise = coerceDate(calendar.getSunrise()) ?? at(date, 6, 0);
  const sunset = coerceDate(calendar.getSunset()) ?? at(date, 20, 0);
  const candleLighting = addMinutes(sunset, -18);
  const havdalah = addMinutes(sunset, 42);

  return [
    { key: "alotHashachar", title: "Alot HaShachar", time: coerceDate(calendar.getAlosHashachar()) ?? addMinutes(sunrise, -72), notificationLeadMinutes: 10 },
    { key: "sunrise", title: "Sunrise", time: sunrise, notificationLeadMinutes: 5 },
    { key: "latestShema", title: "Latest Shema", time: coerceDate(calendar.getSofZmanShmaGRA()) ?? addMinutes(sunrise, 180), notificationLeadMinutes: 20 },
    { key: "latestTefilah", title: "Latest Tefilah", time: coerceDate(calendar.getSofZmanTfilaGRA()) ?? addMinutes(sunrise, 240), notificationLeadMinutes: 20 },
    { key: "minchaGedolah", title: "Mincha Gedolah", time: coerceDate(calendar.getMinchaGedola(sunrise, sunset)) ?? addMinutes(sunrise, 390), notificationLeadMinutes: 15 },
    { key: "minchaKetana", title: "Mincha Ketana", time: coerceDate(calendar.getMinchaKetana(sunrise, sunset)) ?? addMinutes(sunrise, 570), notificationLeadMinutes: 15 },
    { key: "sunset", title: "Sunset", time: sunset, notificationLeadMinutes: 10 },
    { key: "candleLighting", title: "Candle Lighting", time: candleLighting, notificationLeadMinutes: 30 },
    { key: "havdalah", title: "Havdalah", time: havdalah, notificationLeadMinutes: 10 }
  ];
}

function coerceDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function at(date: Date, hour: number, minute: number): Date {
  return setSeconds(setMinutes(setHours(date, hour), minute), 0);
}

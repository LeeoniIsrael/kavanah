import {
  ComplexZmanimCalendar,
  GeoLocation,
  JewishCalendar,
} from "kosher-zmanim";
import type { GeoPoint } from "@/types/zmanim";

export type TimedPractice = "tefillin" | "shacharit" | "mincha" | "maariv";
export type Availability = { allowed: boolean; reason?: string };
// Match the practice itself, never a source path or a broad search tag.
export function timedPracticeForPrayer(prayer: {
  id: string;
  title: string;
}): TimedPractice | undefined {
  const title = prayer.title.toLowerCase();
  if (/\btefillin\b/.test(title) || prayer.id === "tefillin-blessing")
    return "tefillin";
  if (/^(shacharit|morning service|morning prayer)$/.test(title))
    return "shacharit";
  if (/^(mincha|afternoon service|afternoon prayer)$/.test(title))
    return "mincha";
  if (/^(maariv|arvit|evening service|evening prayer)$/.test(title))
    return "maariv";
  return undefined;
}

export function practiceAvailability(
  practice: string | undefined,
  now: Date,
  location: GeoPoint | null,
  inIsrael = false,
): Availability {
  if (!practice || practice === "study") return { allowed: true };
  if (!location)
    return {
      allowed: false,
      reason: "Update your location in Prayer times to check availability.",
    };
  const unavailable = {
    allowed: false,
    reason:
      "Local times are unavailable. Update your location in Prayer times.",
  };
  try {
    const calendar = new ComplexZmanimCalendar(
      new GeoLocation(
        location.label,
        location.latitude,
        location.longitude,
        0,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      ),
    );
    calendar.setDate(now);
    const day = new JewishCalendar(now);
    day.setInIsrael(inIsrael);
    if (practice === "tefillin" && day.isAssurBemelacha())
      return {
        allowed: false,
        reason: "Tefillin aren’t worn on Shabbat or major holidays.",
      };
    const dawn = calendar.getAlosHashachar()?.toMillis();
    const sunset = calendar.getSeaLevelSunset()?.toMillis();
    const start =
      practice === "tefillin"
        ? calendar.getMisheyakir11Degrees()?.toMillis()
        : practice === "mincha"
          ? calendar.getMinchaGedola()?.toMillis()
          : practice === "maariv"
            ? calendar
                .getPlagHamincha(calendar.getSunrise(), calendar.getSunset())
                ?.toMillis()
            : dawn;
    const end =
      practice === "shacharit" ? calendar.getChatzos()?.toMillis() : sunset;
    if (!start || !end || !dawn || !Number.isFinite(start + end + dawn))
      return unavailable;
    const time = now.getTime();
    // Early Maariv is custom-dependent; don't block it after plag. Shema is still repeated at nightfall.
    if (practice === "maariv")
      return time < dawn || time >= start
        ? { allowed: true }
        : { allowed: false, reason: "Evening prayer is not available yet." };
    if (time < start)
      return {
        allowed: false,
        reason: `Available from ${new Date(start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} at your location.`,
      };
    if (time >= end)
      return {
        allowed: false,
        reason:
          practice === "shacharit"
            ? "Morning prayer logging closes at local midday."
            : "Today’s logging window closed at local sunset.",
      };
    return { allowed: true };
  } catch {
    return unavailable;
  }
}

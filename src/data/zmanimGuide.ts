import type { ZmanKey } from "@/types/zmanim";

// Definitions: Chabad's Zmanim Briefly Defined and Explained and About Our
// Zmanim Calculations. Calculation names match the existing kosher-zmanim calls.
export const zmanimGuide: Record<
  ZmanKey,
  { title: string; traditional: string; summary: string; detail: string }
> = {
  alotHashachar: {
    title: "Dawn",
    traditional: "Alot HaShachar",
    summary: "First light before sunrise.",
    detail:
      "A time marker used for some daytime observances. It is not the usual time to begin every morning practice: tallit and tefillin have a separate earliest time, which is not shown here.",
  },
  sunrise: {
    title: "Sunrise",
    traditional: "HaNetz HaChamah",
    summary: "The sun rises above the horizon.",
    detail:
      "Sunrise is the ideal time to begin the morning Amidah, the central standing prayer, for those who time their service to sunrise.",
  },
  latestShema: {
    title: "Morning Shema deadline",
    traditional: "Sof Zman Kriat Shema",
    summary: "The morning time limit for reciting Shema.",
    detail:
      "Shema is the declaration of God's oneness. This is the end of its prescribed morning period, not a start time. Missing it does not mean you should abandon the rest of your prayer.",
  },
  latestTefilah: {
    title: "Morning prayer deadline",
    traditional: "Sof Zman Tefilah",
    summary: "The regular time limit for the morning Amidah.",
    detail:
      "The Amidah is the central standing prayer in Shacharit, the morning service. This deadline marks its regular time; later prayer has different rules. It is not a deadline for every blessing you say in the morning.",
  },
  minchaGedolah: {
    title: "Afternoon prayer begins",
    traditional: "Mincha Gedolah",
    summary: "The earliest time for Mincha, the afternoon service.",
    detail:
      "This is an opening time, not a deadline. It begins half a seasonal hour after midday. A seasonal hour is one twelfth of the calculated daytime, so it is not always 60 minutes.",
  },
  minchaKetana: {
    title: "Later afternoon prayer",
    traditional: "Mincha Ketana",
    summary: "A later window for Mincha, preferred in many traditions.",
    detail:
      "Mincha Gedolah and Mincha Ketana are two time markers for the same afternoon prayer—not two separate services. The preferred time depends on your custom and circumstances.",
  },
  sunset: {
    title: "Sunset",
    traditional: "Shkiah",
    summary: "The start of twilight—not yet nightfall.",
    detail:
      "Sunset and nightfall are different. Many prayer and Shabbat rules depend on this distinction. Do not use sunset as the end of Shabbat.",
  },
  candleLighting: {
    title: "Shabbat candle lighting",
    traditional: "Hadlakat Nerot",
    summary: "Light Shabbat candles before sunset on Friday.",
    detail:
      "This app uses an 18-minute lead before sunset. Some communities use a different lead time; follow your local community's candle-lighting time.",
  },
  havdalah: {
    title: "Shabbat ends",
    traditional: "Havdalah",
    summary: "Nightfall marks the time for Havdalah.",
    detail:
      "Havdalah is the ceremony separating Shabbat from the new week. This app uses an 8.5° nightfall calculation. Communities may observe a later ending time.",
  },
};
export function explainZmanMethod(method: string): string {
  if (method === "GRA")
    return "Vilna Gaon method (GRA): divide sunrise to sunset into 12 seasonal hours.";
  if (method === "Dawn at 16.1°")
    return "Dawn calculation: the sun is 16.1° below the horizon.";
  if (method === "Nightfall at 8.5°")
    return "Nightfall calculation: the sun is 8.5° below the horizon.";
  return method;
}

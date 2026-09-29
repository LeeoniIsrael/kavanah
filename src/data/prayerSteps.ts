import type { PrayerToken } from "@/types/prayer";
// Cues are tied to captured source addresses, never inferred from the prayer text.
const shema: Record<string, { title: string; body: string }> = {
  "3": {
    title: "Begin · Shema Yisrael",
    body: "Cover your eyes for this first verse.",
  },
  "5": {
    title: "Quietly · Baruch shem",
    body: "Pause briefly, then say this response quietly.",
  },
  "6": {
    title: "Continue · Ve’ahavta",
    body: "Uncover your eyes. Read the rest of the first paragraph.",
  },
  "7": {
    title: "Next · Vehayah im shamoa",
    body: "Read the second paragraph in full.",
  },
  "8": {
    title: "Next · Vayomer",
    body: "Read the third paragraph, including the remembrance of the Exodus.",
  },
  "10": {
    title: "Continue · Emet",
    body: "Join this word to the end of the preceding paragraph without a pause.",
  },
  "12": {
    title: "For the prayer leader",
    body: "This repetition is marked for the chazan in the source. Follow your community’s practice.",
  },
};
export function prayerTokenStep(
  token: PrayerToken,
): PrayerToken["readingStep"] {
  if (token.readingStep) return token.readingStep;
  if (token.id.startsWith("shema-")) return shema[token.id.slice(6)];
  const ashkenaz =
    "sefaria-siddur-ashkenaz-weekday-maariv-keri-at-shema-al-hamita-";
  const sefard = "sefaria-siddur-sefard-bedtime-shema-";
  const prefix = token.id.startsWith(ashkenaz)
    ? ashkenaz
    : token.id.startsWith(sefard)
      ? sefard
      : undefined;
  if (!prefix) return undefined;
  const n = Number(token.id.slice(prefix.length));
  if (n === 1)
    return {
      title: "First · Forgiveness",
      body: "Begin the bedtime sequence with these words.",
    };
  if (n === 2)
    return {
      title: "Then · Hamapil",
      body: "This edition places the sleep blessing here. If your custom puts it last, return to it after the other passages.",
    };
  const map =
    prefix === ashkenaz
      ? { 4: "3", 6: "5", 7: "6", 8: "7", 9: "8" }
      : { 5: "3", 7: "5", 8: "6" };
  const key = (map as Record<number, string>)[n];
  if (key) return shema[key];
  if (n === (prefix === ashkenaz ? 10 : 9))
    return {
      title: "Continue · Bedtime verses",
      body: "Continue with the verses in this edition. Follow the printed directions where a passage is repeated.",
    };
  return undefined;
}

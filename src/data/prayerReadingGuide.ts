import type { PrayerText } from "@/types/prayer";
export type ReadingGuide = { before: string; after?: string; source?: string };
const guides: Record<string, ReadingGuide> = {
  "modeh-ani": {
    before:
      "When you wake up, say the words below. You may say Modeh Ani before washing your hands.",
    after:
      "Next, wash your hands for the morning: use a cup to pour water over the right hand, then the left, three times on each hand, alternating. The timing of the handwashing blessing follows your custom; it is a separate blessing, not part of Modeh Ani.",
    source:
      "https://www.chabad.org/library/article_cdo/aid/260663/jewish/The-Laws-Upon-Awakening-in-the-Morning.htm",
  },
  "asher-yatzar": {
    before:
      "After using the bathroom, wash your hands and leave the bathroom before saying Asher Yatzar. This washing does not have its own handwashing blessing.",
    source:
      "https://www.chabad.org/library/article_cdo/aid/3268369/jewish/Shulchan-Aruch-Chapter-7-Laws-Relating-to-Recitation-of-Blessing-Asher-Yatzar-after-Relieving-Oneself-in-Course-of-Day.htm",
  },
  hamotzi: {
    before:
      "Before a bread meal, ritually wash your hands, say the handwashing blessing when required, and dry them. Then hold the bread and say the blessing below. The washing blessing is separate and is not included here.",
    after:
      "Eat some bread immediately after the blessing, before speaking about other things.",
    source:
      "https://www.chabad.org/library/article_cdo/aid/278542/jewish/Hamotzi-Blessing-on-Bread.htm",
  },
  shema: {
    before:
      "For the first verse, it is customary to cover your eyes with your right hand to focus. The complete Shema continues beyond the verses shown here; this excerpt does not replace the full reading.",
    source:
      "https://www.chabad.org/library/article_cdo/aid/705353/jewish/The-Shema.htm",
  },
  "tefillin-blessing": {
    before:
      "Place the arm tefillin on your bare upper arm. Say this blessing before tightening it. Then tighten the strap and put on the head tefillin without unrelated conversation. Wrapping and additional blessings differ by custom; this is the arm blessing, not the full wrapping guide.",
    source:
      "https://www.chabad.org/library/article_cdo/aid/272666/jewish/Guide.htm",
  },
  "tallit-blessing": {
    before:
      "Hold the tallit (prayer shawl) ready to put on. Say the blessing below, then wrap yourself in it. The way you wrap it follows your community’s custom.",
    source:
      "https://www.chabad.org/library/article_cdo/aid/530125/jewish/How-to-Put-on-a-Tallit-or-Tzitzit-Blessings-and-Instructions.htm",
  },
};
export function prayerReadingGuide(prayer: PrayerText): ReadingGuide {
  // Only attach instructions to identified entries, never to a fuzzy title match.
  const known = guides[prayer.id];
  if (known) return known;
  if (prayer.title === "Amidah" && prayer.sourceMetadata)
    return {
      before:
        "For the silent Amidah, stand with your feet together if you can, facing Jerusalem. Many communities take three steps back, then three forward before beginning. Say the words quietly. Bows and additions depend on the service and your custom; follow the directions in your prayer book.",
      after:
        "Only after completing the full Amidah and its concluding requests: it is customary to take three steps back, then say Oseh shalom while bowing. Follow your community’s order; do not do this at the end of an individual blessing.",
      source:
        "https://www.chabad.org/library/article_cdo/aid/3834226/jewish/What-Is-the-Amidah.htm",
    };
  return {
    before: prayer.useCase || prayer.summary,
  };
}
export function prayerScopeNote(prayer: PrayerText): string | undefined {
  const { contentKind, notes } = prayer.hebrewReview;
  if (contentKind === "excerpt")
    return `Excerpt only — this is not the full prayer. ${notes ?? "Open Source & options for the full source."}`;
  if (contentKind === "collection")
    return "This is a service overview, not a complete step-by-step service. Open Siddur to follow the prayer book in order.";
  if (contentKind === "remote-unreviewed")
    return "Prayer-book section. Ritual instructions and text have not yet been reviewed in Kavanah.";
  return undefined;
}

import type { PrayerText } from "@/types/prayer";
export type ReadingGuide = {
  before: string;
  after?: string;
  source?: string;
  links?: { title: string; url: string }[];
};
const guides: Record<string, ReadingGuide> = {
  tefillin: {
    before:
      "Use this guide on weekdays, after the earliest tefillin time (misheyakir) and before sunset. Tefillin are not worn on Shabbat or major festivals; Chol HaMoed and Tisha B’Av follow community practice. Start with clean hands and a clean body. If you are new to wrapping, have someone familiar with your custom fit your knots and show you the pattern.",
    after:
      "If you are praying Shacharit, keep the tefillin on through the service, including the Amidah; this guide is not the full morning service. On Rosh Chodesh, remove them before Musaf. When you have finished: unwind the finger straps, remove the head tefillin first, then remove the arm tefillin and put both away carefully. If there was an interruption, a missing box or a special circumstance, follow guidance for that case before repeating a blessing.",
    source:
      "https://www.chabad.org/library/article_cdo/aid/272666/jewish/Guide.htm",
    links: [
      {
        title: "Shema openings & endings by custom",
        url: "https://www.chabad.org/library/article_cdo/aid/7331312/jewish/Why-Do-We-Repeat-the-Final-Words-of-the-Shema.htm",
      },
      {
        title: "Watch the wrapping steps · Chabad custom",
        url: "https://www.chabad.org/library/article_cdo/aid/272666/jewish/Guide.htm",
      },
      {
        title: "Placement, blessings & removal",
        url: "https://www.chabad.org/library/article_cdo/aid/7264099/jewish/What-You-Need-to-Know-About-Putting-On-and-Taking-Off-Tefillin.htm",
      },
      {
        title: "Kadesh & Vehayah · Sephardic practice",
        url: "https://sephardic.org/halachot/chapter_detail/17/reciting-the-four-parshiyot",
      },
      {
        title: "Prayer text · Metsudah / Sefaria (CC BY)",
        url: "https://www.sefaria.org/Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Tefillin",
      },
      {
        title: "Full Shema text · Metsudah / Sefaria (CC BY)",
        url: "https://www.sefaria.org/Siddur_Ashkenaz,_Weekday,_Shacharit,_Blessings_of_the_Shema,_Shema",
      },
    ],
  },
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
      "Begin with the opening verse, then say Baruch shem quietly. Continue through Ve’ahavta, Vehayah im shamoa and Vayomer; do not stop after Shema Yisrael. Cover your eyes for the first verse. The opening El melech ne’eman and the leader’s final repetition follow the printed Ashkenazi directions for praying alone or with a minyan.",
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
  if (
    prayer.id ===
      "sefaria-siddur-ashkenaz-weekday-maariv-keri-at-shema-al-hamita" ||
    prayer.id === "sefaria-siddur-sefard-bedtime-shema"
  )
    return {
      before:
        "When you are ready to sleep, begin with the forgiveness prayer. This edition places Hamapil before Shema; other customs place it at the end. Follow your established order. Read the Shema paragraphs and the additional verses included below, following the printed repetition directions. Bedtime Shema is separate from Maariv.",
      after:
        "After finishing the bedtime prayers, settle down to sleep and avoid unnecessary conversation. If you have not yet fulfilled the evening Shema, its three paragraphs and timing still matter; use the full Shema entry and your community’s guidance.",
      source:
        "https://www.chabad.org/library/article_cdo/aid/3694182/jewish/Why-Say-Shema-at-Bedtime.htm",
    };
  if (
    prayer.id ===
    "sefaria-siddur-ashkenaz-weekday-shacharit-preparatory-prayers-tzitzit"
  )
    return {
      before:
        "This is the blessing for a tallit katan (the smaller tzitzit garment), not the wrapping blessing for a tallit gadol. Whether to say a separate blessing here depends on your practice and whether you will shortly say the tallit gadol blessing. Follow your custom before saying God’s name.",
      after:
        "Continue with your morning preparations. If you wear a tallit gadol and tefillin, put on the tallit gadol first, using its own blessing.",
      source:
        "https://www.chabad.org/library/article_cdo/aid/530125/jewish/How-to-Put-on-a-Tallit-or-Tzitzit-Blessings-and-Instructions.htm",
    };
  const path = prayer.sourceMetadata?.path ?? [];
  if (
    prayer.id ===
    "sefaria-siddur-ashkenaz-weekday-shacharit-preparatory-prayers-netilat-yadayim"
  )
    return {
      before:
        "This entry is the morning handwashing blessing. After waking, use a cup to pour over the right hand, then the left, alternating three times on each. Say the blessing at the point your custom prescribes; some delay it until after using the bathroom and washing again. Do not repeat the morning blessing for ordinary bathroom washing.",
      after:
        "If you used the bathroom, say Asher Yatzar outside it after washing. Continue with the morning blessings in your siddur.",
      source:
        "https://www.chabad.org/library/article_cdo/aid/260663/jewish/The-Laws-Upon-Awakening-in-the-Morning.htm",
    };
  if (prayer.sourceMetadata && /kaddish/i.test(prayer.title))
    return {
      before:
        "Kaddish is a congregational prayer in these siddur traditions. Say the appropriate form at its designated place with a minyan, following the leader and the printed response directions. When praying alone, omit Kaddish; reading this entry does not create a minyan.",
      after:
        "Continue with the next part of the service. The Half Kaddish, Mourner’s Kaddish and Kaddish DeRabbanan serve different places and purposes; do not substitute one for another.",
      source:
        "https://www.chabad.org/library/article_cdo/aid/371098/jewish/The-Recitation-of-Kaddish.htm",
    };
  if (path.includes("Blessings of the Shema") && prayer.id !== "shema")
    return {
      before: `This is a section of ${path.includes("Maariv") ? "the evening" : "the morning"} service, not a standalone replacement for Shema and its blessings. Follow this edition in Siddur: the opening blessings, all three paragraphs of Shema, then the concluding blessing or blessings. Morning and evening wording differ. Barchu is said with a minyan; omit it when praying alone.`,
      after:
        "Continue in the prayer book’s order. During Shacharit, proceed from the blessing of redemption directly to the Amidah without unrelated conversation.",
      source:
        "https://ph.yhb.org.il/en/category/tefila/16-birkot-keriat-shema/",
    };
  if (path.includes("Amidah") && prayer.title !== "Amidah")
    return {
      before:
        "This is one section of the Amidah. Begin the complete Amidah in Siddur and read its blessings in order; do not begin or finish the whole prayer at this isolated section. Stand with feet together if able, face Jerusalem, and say the silent prayer quietly. Congregational responses and seasonal additions follow the printed directions and your custom.",
      after:
        "Continue to the next Amidah section. Take the concluding steps back only after the full Amidah and its final requests, not after this individual blessing.",
      source:
        "https://www.chabad.org/library/article_cdo/aid/3834226/jewish/What-Is-the-Amidah.htm",
    };
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
  if (prayer.practice === "tefillin")
    return "Practice guide with custom-dependent passages. Uses captured Ashkenazi text; introductory Leshem yichud is not included. Text and pronunciation review remain pending.";
  const { contentKind, notes } = prayer.hebrewReview;
  if (contentKind === "excerpt")
    return `Excerpt only — this is not the full prayer. ${notes ?? "Open Source & options for the full source."}`;
  if (contentKind === "collection")
    return "This is a service overview, not a complete step-by-step service. Open Siddur to follow the prayer book in order.";
  if (contentKind === "remote-unreviewed")
    return "Prayer-book section. Ritual instructions and text have not yet been reviewed in Kavanah.";
  if (prayer.research)
    return "Pronunciation is a machine-generated learning aid and has not been checked by a Hebrew expert.";
  return undefined;
}

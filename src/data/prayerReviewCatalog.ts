import type { HebrewReview } from "@/types/prayer";

type ReviewSeed = Pick<HebrewReview, "contentKind" | "tradition" | "sourceTitle" | "sourceRef"> & {
  notes?: string;
};

const reviewSeeds: Record<string, ReviewSeed> = {
  "modeh-ani": complete("common", "Siddur Sefard", "Upon Arising, Modeh Ani"),
  shema: excerpt("scriptural", "Torah", "Deuteronomy 6:4-9", "The app currently includes only the declaration and first verse of Ve'ahavta."),
  "tefillin-blessing": complete("ashkenaz", "Siddur Ashkenaz", "Weekday Shacharit, Tefillin"),
  "tallit-blessing": complete("ashkenaz", "Siddur Ashkenaz", "Weekday Shacharit, Preparatory Prayers, Tallit"),
  "asher-yatzar": excerpt("ashkenaz", "Siddur Ashkenaz", "Berachot, Asher Yatzar", "Only the concluding blessing is bundled."),
  "torah-blessings": excerpt("ashkenaz", "Siddur Ashkenaz", "Weekday Shacharit, Birchot HaTorah", "Only the first blessing is bundled."),
  "tefilat-haderech": excerpt("ashkenaz", "Siddur Ashkenaz", "Prayers for Special Occasions, Traveler's Prayer"),
  "psalm-121": excerpt("scriptural", "Tanakh", "Psalms 121", "Only verses 1-2 are bundled."),
  "psalm-23": excerpt("scriptural", "Tanakh", "Psalms 23", "Only verse 1 is bundled."),
  "mi-sheberach": excerpt("varies", "Communal liturgy", "Mi Sheberach for Healing", "Wording and name insertion vary by community."),
  hamotzi: complete("common", "Siddur Ashkenaz", "Berachot, HaMotzi"),
  "birkat-hamazon": excerpt("ashkenaz", "Birkat Hamazon", "Blessing on the Food", "Only the first blessing's closing formula is bundled."),
  "borei-nefashot": excerpt("ashkenaz", "Siddur Ashkenaz", "Berachot, Borei Nefashot", "Only the opening clause is bundled."),
  shehecheyanu: complete("common", "Siddur Sefard", "Blessings, Shehecheyanu"),
  "bedtime-shema": excerpt("sefard", "Siddur Sefard", "Bedtime Shema", "Only one concluding verse is bundled."),
  "kaddish-yatom": excerpt("ashkenaz", "Siddur Ashkenaz", "Kaddish, Mourner's Kaddish", "Only the opening sentence is bundled."),
  aleinu: excerpt("ashkenaz", "Siddur Ashkenaz", "Shabbat Maariv, Aleinu", "Only the opening phrase is bundled."),
  "adon-olam": excerpt("ashkenaz", "Siddur Ashkenaz", "Shabbat Maariv, Adon Olam", "Only the opening stanza is bundled."),
  shacharit: collection("ashkenaz", "Siddur Ashkenaz", "Weekday Shacharit"),
  mincha: collection("ashkenaz", "Siddur Ashkenaz", "Weekday Minchah"),
  maariv: collection("ashkenaz", "Siddur Ashkenaz", "Weekday Maariv"),
  "kiddush-friday-night": excerpt("ashkenaz", "Siddur Ashkenaz", "Shabbat, Friday Night Kiddush", "Only the concluding blessing is bundled."),
  havdalah: excerpt("ashkenaz", "Siddur Ashkenaz", "Shabbat, Havdalah", "Only the concluding blessing is bundled."),
  "candle-lighting": complete("common", "Siddur Sefard", "Shabbat Candle Lighting"),
  "chanukah-candles": missing("ashkenaz", "Siddur Ashkenaz", "Festivals, Chanukah Candle Blessings"),
  "counting-omer": missing("varies", "Siddur Ashkenaz", "Festivals, Counting of the Omer"),
  vidui: excerpt("ashkenaz", "Siddur Ashkenaz", "Weekday Shacharit, Vidui", "Only the opening five words of Ashamnu are bundled."),
  "prayer-for-livelihood": missing("sefard", "Siddur Sefard", "Various Prayers, Prayer for Livelihood"),
  "ana-bekoach": excerpt("common", "Communal liturgy", "Ana Bekoach", "Only the first line is bundled."),
  nishmat: excerpt("ashkenaz", "Siddur Ashkenaz", "Shabbat Shacharit, Nishmat", "Only the opening phrase is bundled."),
  "el-malei-rachamim": excerpt("varies", "Memorial liturgy", "El Malei Rachamim", "The complete text requires a memorial-name form and communal variant."),
  "prayer-state-israel": excerpt("modern-israeli", "Siddur Ashkenaz", "Communal Prayers, Prayer for the State of Israel", "Only the opening phrase is bundled."),
  "idf-prayer": excerpt("modern-israeli", "Communal liturgy", "Prayer for the Welfare of Israel's Soldiers", "The bundled wording is an unreviewed paraphrased excerpt.")
};

export function getPendingHebrewReview(prayerId: string): HebrewReview {
  const seed = reviewSeeds[prayerId];
  if (!seed) {
    return {
      contentKind: "remote-unreviewed",
      status: "pending",
      tradition: "varies",
      sourceTitle: "Sefaria search result",
      sourceRef: prayerId,
      sourceUrl: "https://www.sefaria.org/",
      licenseStatus: "verification-required",
      notes: "Remote library result. Not part of Kavanah's rabbinically reviewed catalog."
    };
  }

  return {
    ...seed,
    status: "pending",
    sourceUrl: `https://www.sefaria.org/${encodeURIComponent(seed.sourceRef.replaceAll(" ", "_"))}`,
    licenseStatus: "verification-required"
  };
}

function complete(tradition: ReviewSeed["tradition"], sourceTitle: string, sourceRef: string): ReviewSeed {
  return { contentKind: "complete", tradition, sourceTitle, sourceRef };
}

function excerpt(tradition: ReviewSeed["tradition"], sourceTitle: string, sourceRef: string, notes?: string): ReviewSeed {
  return notes
    ? { contentKind: "excerpt", tradition, sourceTitle, sourceRef, notes }
    : { contentKind: "excerpt", tradition, sourceTitle, sourceRef };
}

function collection(tradition: ReviewSeed["tradition"], sourceTitle: string, sourceRef: string): ReviewSeed {
  return { contentKind: "collection", tradition, sourceTitle, sourceRef, notes: "This is a service collection, not a single prayer." };
}

function missing(tradition: ReviewSeed["tradition"], sourceTitle: string, sourceRef: string): ReviewSeed {
  return { contentKind: "missing", tradition, sourceTitle, sourceRef, notes: "No Hebrew text is currently bundled." };
}

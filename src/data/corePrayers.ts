import type { PrayerText } from "@/types/prayer";

const now = "2026-06-22T00:00:00.000Z";

export const corePrayers: PrayerText[] = [
  {
    id: "shema",
    title: "Shema",
    sefariaRef: "Deuteronomy 6:4-9",
    category: "daily",
    source: "local-cache",
    updatedAt: now,
    tokens: [
      {
        id: "shema-1",
        hebrew: "שמע ישראל, יהוה אלהינו, יהוה אחד",
        translation: "Hear, Israel: Adonai is our God, Adonai is One.",
        transliteration: "Shema Yisrael, Adonai Eloheinu, Adonai Echad."
      },
      {
        id: "shema-2",
        hebrew: "ואהבת את יהוה אלהיך בכל לבבך ובכל נפשך ובכל מאדך",
        translation: "You shall love Adonai your God with all your heart, soul, and might.",
        transliteration: "Ve'ahavta et Adonai Elohecha bechol levavcha uvechol nafshecha uvechol me'odecha."
      }
    ]
  },
  {
    id: "tefilat-haderech",
    title: "Tefilat HaDerech",
    sefariaRef: "Siddur Ashkenaz, Weekday, Prayers for Special Occasions, Traveler's Prayer",
    category: "travel",
    source: "local-cache",
    updatedAt: now,
    tokens: [
      {
        id: "road-1",
        hebrew: "יהי רצון מלפניך יהוה אלהינו ואלהי אבותינו שתוליכנו לשלום",
        translation: "May it be Your will, Adonai our God and God of our ancestors, that You lead us in peace.",
        transliteration: "Yehi ratzon milfanecha Adonai Eloheinu v'Elohei avoteinu shetolicheinu l'shalom."
      },
      {
        id: "road-2",
        hebrew: "ותצעידנו לשלום ותדריכנו לשלום",
        translation: "Guide our steps in peace and direct us in peace.",
        transliteration: "Vetatz'ideinu l'shalom vetadrichenu l'shalom."
      }
    ]
  },
  {
    id: "idf-prayer",
    title: "Prayer for the IDF",
    sefariaRef: "Prayer for the Welfare of the Israel Defense Forces",
    category: "nation",
    source: "local-cache",
    updatedAt: now,
    tokens: [
      {
        id: "idf-1",
        hebrew: "מי שברך אבותינו אברהם יצחק ויעקב",
        translation: "May the One who blessed our ancestors Abraham, Isaac, and Jacob bless the defenders of Israel.",
        transliteration: "Mi sheberach avoteinu Avraham, Yitzchak v'Yaakov."
      },
      {
        id: "idf-2",
        hebrew: "הקדוש ברוך הוא ישמור ויציל את חיילינו",
        translation: "May the Holy One guard and rescue our soldiers.",
        transliteration: "HaKadosh Baruch Hu yishmor veyatzil et chayaleinu."
      }
    ]
  }
];

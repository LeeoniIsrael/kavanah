import type { PrayerCategory, PrayerText, PrayerToken } from "@/types/prayer";

const now = "2026-06-22T00:00:00.000Z";

type PrayerSeed = {
  id: string;
  title: string;
  sefariaRef: string;
  category: PrayerCategory;
  summary: string;
  useCase: string;
  aliases: string[];
  tags: string[];
  lines: Pick<PrayerToken, "hebrew" | "translation" | "transliteration">[];
};

const seeds: PrayerSeed[] = [
  {
    id: "modeh-ani",
    title: "Modeh Ani",
    sefariaRef: "Siddur Sefard, Upon Arising, Modeh Ani",
    category: "thanks",
    summary: "First waking words of gratitude for restored life.",
    useCase: "Use this immediately after waking up, before the day starts, to begin with gratitude.",
    aliases: ["wake up", "morning gratitude", "thanks", "thank you"],
    tags: ["morning", "gratitude", "daily"],
    lines: [
      {
        hebrew: "מודה אני לפניך מלך חי וקיים שהחזרת בי נשמתי בחמלה רבה אמונתך",
        translation: "I thank You, living and enduring King, for restoring my soul with compassion; great is Your faithfulness.",
        transliteration: "Modeh ani lefanecha, Melech chai vekayam, shehechezarta bi nishmati bechemlah, rabah emunatecha."
      }
    ]
  },
  {
    id: "shema",
    title: "Shema",
    sefariaRef: "Deuteronomy 6:4-9",
    category: "daily",
    summary: "The central declaration of Jewish faith and covenantal attention.",
    useCase: "Use this morning or evening when you want the core Jewish declaration of faith and focus.",
    aliases: ["hear israel", "adonai echad", "acceptance of heaven"],
    tags: ["morning", "evening", "faith", "protection"],
    lines: [
      {
        hebrew: "שמע ישראל יהוה אלהינו יהוה אחד",
        translation: "Hear, Israel: Adonai is our God, Adonai is One.",
        transliteration: "Shema Yisrael, Adonai Eloheinu, Adonai Echad."
      },
      {
        hebrew: "ואהבת את יהוה אלהיך בכל לבבך ובכל נפשך ובכל מאדך",
        translation: "You shall love Adonai your God with all your heart, soul, and might.",
        transliteration: "Ve'ahavta et Adonai Elohecha bechol levavcha uvechol nafshecha uvechol me'odecha."
      }
    ]
  },
  {
    id: "tefillin-blessing",
    title: "Blessing for Tefillin",
    sefariaRef: "Tefillin",
    category: "tefillin",
    summary: "The blessing recited when wrapping tefillin.",
    useCase: "Use this on weekday mornings when you are putting on tefillin.",
    aliases: ["wrap tefillin", "tfellin", "tefilin", "phylacteries"],
    tags: ["morning", "mitzvah", "weekday", "bookmark"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה אלהינו מלך העולם אשר קדשנו במצותיו וצונו להניח תפילין",
        translation: "Blessed are You, Adonai our God, Sovereign of the universe, who sanctified us with commandments and commanded us to lay tefillin.",
        transliteration: "Baruch atah Adonai Eloheinu Melech ha'olam, asher kidshanu bemitzvotav vetzivanu lehaniach tefillin."
      }
    ]
  },
  {
    id: "tallit-blessing",
    title: "Blessing for Tallit",
    sefariaRef: "Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Tallit",
    category: "daily",
    summary: "The blessing recited when wrapping in a tallit.",
    useCase: "Use this before wrapping yourself in a tallit or prayer shawl.",
    aliases: ["tzitzit", "tallis", "prayer shawl"],
    tags: ["morning", "mitzvah", "weekday", "shabbat"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה אלהינו מלך העולם אשר קדשנו במצותיו וצונו להתעטף בציצית",
        translation: "Blessed are You, Adonai our God, Sovereign of the universe, who sanctified us with commandments and commanded us to wrap ourselves in tzitzit.",
        transliteration: "Baruch atah Adonai Eloheinu Melech ha'olam, asher kidshanu bemitzvotav vetzivanu lehit'atef batzitzit."
      }
    ]
  },
  {
    id: "asher-yatzar",
    title: "Asher Yatzar",
    sefariaRef: "Olat Reiyah, Netilat Yadayim and Asher Yatzar",
    category: "health",
    summary: "A blessing of gratitude for the body’s intricate function.",
    useCase: "Use this after using the bathroom or when giving thanks for your body working properly.",
    aliases: ["bathroom blessing", "body", "health", "healing"],
    tags: ["health", "daily", "thanks"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה רופא כל בשר ומפליא לעשות",
        translation: "Blessed are You, Adonai, healer of all flesh, who acts wondrously.",
        transliteration: "Baruch atah Adonai, rofe chol basar umafli la'asot."
      }
    ]
  },
  {
    id: "torah-blessings",
    title: "Blessings for Torah Study",
    sefariaRef: "Morning Blessings",
    category: "study",
    summary: "Blessings before engaging in Torah learning.",
    useCase: "Use this before Torah learning, Jewish study, or beginning a serious learning session.",
    aliases: ["study", "learning", "school", "yeshiva", "success in studies"],
    tags: ["study", "morning", "success"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה אלהינו מלך העולם אשר קדשנו במצותיו וצונו לעסוק בדברי תורה",
        translation: "Blessed are You, Adonai our God, Sovereign of the universe, who sanctified us with commandments and commanded us to engage with words of Torah.",
        transliteration: "Baruch atah Adonai Eloheinu Melech ha'olam, asher kidshanu bemitzvotav vetzivanu la'asok bedivrei Torah."
      }
    ]
  },
  {
    id: "tefilat-haderech",
    title: "Tefilat HaDerech",
    sefariaRef: "Siddur Ashkenaz, Weekday, Prayers for Special Occasions, Traveler's Prayer",
    category: "travel",
    summary: "A prayer for safety, peace, and arrival while traveling.",
    useCase: "Use this when leaving on a trip, flight, drive, or journey outside your usual area.",
    aliases: ["travelers prayer", "road", "flight", "trip", "journey", "driving"],
    tags: ["travel", "safety", "protection"],
    lines: [
      {
        hebrew: "יהי רצון מלפניך יהוה אלהינו ואלהי אבותינו שתוליכנו לשלום",
        translation: "May it be Your will, Adonai our God and God of our ancestors, that You lead us in peace.",
        transliteration: "Yehi ratzon milfanecha Adonai Eloheinu v'Elohei avoteinu shetolicheinu l'shalom."
      },
      {
        hebrew: "ותצעידנו לשלום ותדריכנו לשלום",
        translation: "Guide our steps in peace and direct us in peace.",
        transliteration: "Vetatz'ideinu l'shalom vetadrichenu l'shalom."
      }
    ]
  },
  {
    id: "psalm-121",
    title: "Psalm 121",
    sefariaRef: "Psalms 121",
    category: "protection",
    summary: "A psalm for protection, journeys, and watchfulness.",
    useCase: "Use this when you want protection while traveling, commuting, or feeling exposed.",
    aliases: ["song of ascents", "help", "mountains", "safety", "protection"],
    tags: ["travel", "safety", "protection"],
    lines: [
      {
        hebrew: "אשא עיני אל ההרים מאין יבא עזרי",
        translation: "I lift my eyes to the mountains; from where will my help come?",
        transliteration: "Esa einai el heharim, me'ayin yavo ezri."
      },
      {
        hebrew: "עזרי מעם יהוה עשה שמים וארץ",
        translation: "My help comes from Adonai, maker of heaven and earth.",
        transliteration: "Ezri me'im Adonai, oseh shamayim va'aretz."
      }
    ]
  },
  {
    id: "psalm-23",
    title: "Psalm 23",
    sefariaRef: "Psalms 23",
    category: "protection",
    summary: "A psalm of trust, comfort, and steadiness in fear.",
    useCase: "Use this for comfort during fear, grief, uncertainty, illness, or emotional heaviness.",
    aliases: ["shepherd", "comfort", "fear", "valley", "safety"],
    tags: ["protection", "health", "mourning"],
    lines: [
      {
        hebrew: "יהוה רעי לא אחסר",
        translation: "Adonai is my shepherd; I shall not lack.",
        transliteration: "Adonai ro'i lo echsar."
      }
    ]
  },
  {
    id: "mi-sheberach",
    title: "Mi Sheberach for Healing",
    sefariaRef: "Mi Sheberach",
    category: "health",
    summary: "A prayer asking for complete healing of body and spirit.",
    useCase: "Use this when praying for someone who is sick, recovering, or in need of healing.",
    aliases: ["refuah", "healing", "sick", "hospital", "health"],
    tags: ["health", "healing", "community"],
    lines: [
      {
        hebrew: "מי שברך אבותינו אברהם יצחק ויעקב הוא יברך וירפא את החולה",
        translation: "May the One who blessed our ancestors Abraham, Isaac, and Jacob bless and heal the one who is ill.",
        transliteration: "Mi sheberach avoteinu Avraham, Yitzchak v'Yaakov, hu yevarech veyerappe et hacholeh."
      }
    ]
  },
  {
    id: "hamotzi",
    title: "HaMotzi",
    sefariaRef: "Olat Reiyah, Hamotzi",
    category: "food",
    summary: "The blessing before eating bread.",
    useCase: "Use this before eating bread or a meal centered around bread.",
    aliases: ["bread", "meal", "food", "before eating"],
    tags: ["food", "thanks", "daily"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה אלהינו מלך העולם המוציא לחם מן הארץ",
        translation: "Blessed are You, Adonai our God, Sovereign of the universe, who brings forth bread from the earth.",
        transliteration: "Baruch atah Adonai Eloheinu Melech ha'olam, hamotzi lechem min ha'aretz."
      }
    ]
  },
  {
    id: "birkat-hamazon",
    title: "Birkat Hamazon",
    sefariaRef: "Birkat Hamazon",
    category: "food",
    summary: "Grace after meals, recited after eating bread.",
    useCase: "Use this after eating a bread meal, traditionally after you have washed and eaten bread.",
    aliases: ["benching", "after meal", "grace after meals", "food"],
    tags: ["food", "thanks", "meal"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה הזן את הכל",
        translation: "Blessed are You, Adonai, who nourishes all.",
        transliteration: "Baruch atah Adonai, hazan et hakol."
      }
    ]
  },
  {
    id: "borei-nefashot",
    title: "Borei Nefashot",
    sefariaRef: "Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Brachot Achronot, Borei Nefashot",
    category: "food",
    summary: "After-blessing for many foods and drinks.",
    useCase: "Use this after many snacks, drinks, fruits, vegetables, meat, fish, eggs, or dairy.",
    aliases: ["after blessing", "snack", "drink", "food"],
    tags: ["food", "thanks"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה בורא נפשות רבות וחסרונן",
        translation: "Blessed are You, Adonai, creator of many living beings and their needs.",
        transliteration: "Baruch atah Adonai, borei nefashot rabot vechesronan."
      }
    ]
  },
  {
    id: "shehecheyanu",
    title: "Shehecheyanu",
    sefariaRef: "Siddur Sefard, Blessings, Shehecheyanu",
    category: "thanks",
    summary: "Blessing for arriving at a new or special moment.",
    useCase: "Use this for a new experience, milestone, holiday, special purchase, or first-time moment.",
    aliases: ["new", "first time", "holiday", "milestone", "thanks"],
    tags: ["thanks", "holiday", "success"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה אלהינו מלך העולם שהחיינו וקימנו והגיענו לזמן הזה",
        translation: "Blessed are You, Adonai our God, Sovereign of the universe, who has kept us alive, sustained us, and brought us to this time.",
        transliteration: "Baruch atah Adonai Eloheinu Melech ha'olam, shehecheyanu vekiyemanu vehigiyanu lazman hazeh."
      }
    ]
  },
  {
    id: "bedtime-shema",
    title: "Bedtime Shema",
    sefariaRef: "Siddur Sefard, Bedtime Shema",
    category: "sleep",
    summary: "Night prayer before sleep, with protection and forgiveness themes.",
    useCase: "Use this before going to sleep, especially when you want protection and peace at night.",
    aliases: ["night", "sleep", "before bed", "fear", "protection"],
    tags: ["sleep", "protection", "daily"],
    lines: [
      {
        hebrew: "בידך אפקיד רוחי פדיתה אותי יהוה אל אמת",
        translation: "Into Your hand I entrust my spirit; You have redeemed me, Adonai, God of truth.",
        transliteration: "Beyadcha afkid ruchi, paditah oti Adonai El emet."
      }
    ]
  },
  {
    id: "kaddish-yatom",
    title: "Mourner’s Kaddish",
    sefariaRef: "Siddur Ashkenaz, Kaddish, Orphan's Kaddish",
    category: "mourning",
    summary: "A mourner’s prayer magnifying and sanctifying God’s name.",
    useCase: "Use this when mourning, observing yahrzeit, or saying Kaddish with a minyan.",
    aliases: ["mourner kaddish", "death", "yahrzeit", "mourning", "memorial"],
    tags: ["mourning", "community", "daily"],
    lines: [
      {
        hebrew: "יתגדל ויתקדש שמיה רבא",
        translation: "May His great name be magnified and sanctified.",
        transliteration: "Yitgadal veyitkadash shemei raba."
      }
    ]
  },
  {
    id: "aleinu",
    title: "Aleinu",
    sefariaRef: "Aleinu",
    category: "daily",
    summary: "Concluding prayer expressing responsibility and hope.",
    useCase: "Use this near the end of a prayer service or as a daily statement of purpose.",
    aliases: ["end of service", "closing prayer", "daily"],
    tags: ["daily", "shacharit", "mincha", "maariv"],
    lines: [
      {
        hebrew: "עלינו לשבח לאדון הכל",
        translation: "It is upon us to praise the Master of all.",
        transliteration: "Aleinu leshabeach la'Adon hakol."
      }
    ]
  },
  {
    id: "adon-olam",
    title: "Adon Olam",
    sefariaRef: "Olat Reiyah, Adon Olam",
    category: "daily",
    summary: "A hymn of trust in God’s sovereignty and care.",
    useCase: "Use this as a closing hymn, morning song, bedtime song, or simple expression of trust.",
    aliases: ["song", "hymn", "morning", "bedtime"],
    tags: ["daily", "thanks", "protection"],
    lines: [
      {
        hebrew: "אדון עולם אשר מלך בטרם כל יציר נברא",
        translation: "Master of the universe, who reigned before any creature was created.",
        transliteration: "Adon olam asher malach, beterem kol yetzir nivra."
      }
    ]
  },
  {
    id: "shacharit",
    title: "Shacharit",
    sefariaRef: "Siddur Ashkenaz, Weekday, Shacharit",
    category: "daily",
    summary: "The weekday morning prayer service.",
    useCase: "Use this for the full weekday morning service.",
    aliases: ["morning prayer", "shaharit", "morning service"],
    tags: ["daily", "morning", "service"],
    lines: []
  },
  {
    id: "mincha",
    title: "Mincha",
    sefariaRef: "Siddur Ashkenaz, Weekday, Minchah",
    category: "daily",
    summary: "The afternoon prayer service.",
    useCase: "Use this for the afternoon prayer service, usually from after midday until sunset.",
    aliases: ["afternoon prayer", "minchah"],
    tags: ["daily", "afternoon", "service"],
    lines: []
  },
  {
    id: "maariv",
    title: "Maariv",
    sefariaRef: "Siddur Ashkenaz, Weekday, Maariv",
    category: "daily",
    summary: "The evening prayer service.",
    useCase: "Use this for the evening or nighttime prayer service.",
    aliases: ["arvit", "evening prayer", "night service"],
    tags: ["daily", "evening", "service"],
    lines: []
  },
  {
    id: "kiddush-friday-night",
    title: "Friday Night Kiddush",
    sefariaRef: "Kiddush",
    category: "shabbat",
    summary: "Sanctification over wine at the entrance of Shabbat.",
    useCase: "Use this at the Friday night Shabbat table over wine or grape juice.",
    aliases: ["kiddush", "wine", "friday night", "shabbos"],
    tags: ["shabbat", "food", "holiday"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה מקדש השבת",
        translation: "Blessed are You, Adonai, who sanctifies Shabbat.",
        transliteration: "Baruch atah Adonai, mekadesh haShabbat."
      }
    ]
  },
  {
    id: "havdalah",
    title: "Havdalah",
    sefariaRef: "Siddur Ashkenaz, Shabbat, Havdalah",
    category: "shabbat",
    summary: "The ceremony separating Shabbat from the week.",
    useCase: "Use this after Shabbat ends, with wine, spices, and a braided candle.",
    aliases: ["end shabbat", "motzei shabbat", "wine spices candle"],
    tags: ["shabbat", "transition", "holiday"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה המבדיל בין קדש לחול",
        translation: "Blessed are You, Adonai, who separates between sacred and ordinary.",
        transliteration: "Baruch atah Adonai, hamavdil bein kodesh lechol."
      }
    ]
  },
  {
    id: "candle-lighting",
    title: "Shabbat Candle Lighting",
    sefariaRef: "Siddur Sefard, Shabbat Candle Lighting",
    category: "shabbat",
    summary: "Blessing recited when lighting Shabbat candles.",
    useCase: "Use this before Shabbat begins when lighting Shabbat candles.",
    aliases: ["candles", "candle lighting", "shabbat candles", "friday"],
    tags: ["shabbat", "home", "holiday"],
    lines: [
      {
        hebrew: "ברוך אתה יהוה אלהינו מלך העולם אשר קדשנו במצותיו וצונו להדליק נר של שבת",
        translation: "Blessed are You, Adonai our God, Sovereign of the universe, who sanctified us with commandments and commanded us to kindle the Shabbat light.",
        transliteration: "Baruch atah Adonai Eloheinu Melech ha'olam, asher kidshanu bemitzvotav vetzivanu lehadlik ner shel Shabbat."
      }
    ]
  },
  {
    id: "chanukah-candles",
    title: "Chanukah Candle Blessings",
    sefariaRef: "Siddur Ashkenaz, Festivals, Chanukah, Service for Lighting Chanukah Candles, Blessings on Chanukah Candles",
    category: "holiday",
    summary: "Blessings for lighting Chanukah candles.",
    useCase: "Use this during Chanukah when lighting the menorah.",
    aliases: ["hanukkah", "chanuka", "menorah", "candles"],
    tags: ["holiday", "candles", "thanks"],
    lines: []
  },
  {
    id: "counting-omer",
    title: "Counting the Omer",
    sefariaRef: "Omer",
    category: "holiday",
    summary: "Blessing and count recited during the Omer period.",
    useCase: "Use this each night during the Omer period between Pesach and Shavuot.",
    aliases: ["omer", "sefira", "count"],
    tags: ["holiday", "time", "counting"],
    lines: []
  },
  {
    id: "vidui",
    title: "Vidui",
    sefariaRef: "Siddur Ashkenaz, Weekday, Shacharit, Post Amidah, Vidui and 13 Middot",
    category: "repentance",
    summary: "Confessional prayer used in repentance and reflection.",
    useCase: "Use this for confession, teshuva, forgiveness, Yom Kippur, or serious self-reflection.",
    aliases: ["confession", "teshuva", "repentance", "forgiveness"],
    tags: ["repentance", "weekday", "yom kippur"],
    lines: [
      {
        hebrew: "אשמנו בגדנו גזלנו דברנו דופי",
        translation: "We have been guilty; we have betrayed; we have robbed; we have spoken falsely.",
        transliteration: "Ashamnu, bagadnu, gazalnu, dibarnu dofi."
      }
    ]
  },
  {
    id: "prayer-for-livelihood",
    title: "Prayer for Livelihood",
    sefariaRef: "Siddur Sefard, Various Prayers & Segulot, Prayer for Livelihood",
    category: "success",
    summary: "A prayer for honest livelihood and material stability.",
    useCase: "Use this when praying for work, income, a job, business stability, or honest success.",
    aliases: ["parnasa", "parnassah", "work", "job", "money", "success"],
    tags: ["success", "livelihood", "work"],
    lines: []
  },
  {
    id: "ana-bekoach",
    title: "Ana Bekoach",
    sefariaRef: "Ana Bekoach",
    category: "protection",
    summary: "A mystical prayer associated with strength, transition, and protection.",
    useCase: "Use this for strength, protection, transitions, or moments when you feel spiritually stuck.",
    aliases: ["ana bekoach", "strength", "protection", "kabbalah"],
    tags: ["protection", "daily", "shabbat"],
    lines: [
      {
        hebrew: "אנא בכח גדלת ימינך תתיר צרורה",
        translation: "Please, by the power of Your great right hand, release the bound.",
        transliteration: "Ana bechoach gedulat yemincha, tatir tzerurah."
      }
    ]
  },
  {
    id: "nishmat",
    title: "Nishmat Kol Chai",
    sefariaRef: "Nishmat",
    category: "thanks",
    summary: "A sweeping prayer of gratitude recited on Shabbat and festivals.",
    useCase: "Use this for deep gratitude, especially on Shabbat or festivals.",
    aliases: ["nishmat", "gratitude", "thanks", "shabbat"],
    tags: ["thanks", "shabbat", "holiday"],
    lines: [
      {
        hebrew: "נשמת כל חי תברך את שמך יהוה אלהינו",
        translation: "The soul of every living being shall bless Your name, Adonai our God.",
        transliteration: "Nishmat kol chai tevarech et shimcha, Adonai Eloheinu."
      }
    ]
  },
  {
    id: "el-malei-rachamim",
    title: "El Malei Rachamim",
    sefariaRef: "El Malei Rachamim",
    category: "mourning",
    summary: "Memorial prayer asking for compassionate rest for the departed.",
    useCase: "Use this at memorials, funerals, Yizkor, or when praying for someone who has died.",
    aliases: ["memorial", "yizkor", "mourning", "funeral"],
    tags: ["mourning", "memorial"],
    lines: [
      {
        hebrew: "אל מלא רחמים שוכן במרומים",
        translation: "God full of compassion, who dwells on high.",
        transliteration: "El malei rachamim, shochen bamromim."
      }
    ]
  },
  {
    id: "prayer-state-israel",
    title: "Prayer for the State of Israel",
    sefariaRef: "State of Israel",
    category: "nation",
    summary: "Prayer for the welfare and flourishing of the State of Israel.",
    useCase: "Use this when praying for Israel’s safety, leaders, people, and future.",
    aliases: ["israel", "state", "medinat yisrael", "country"],
    tags: ["nation", "community", "protection"],
    lines: [
      {
        hebrew: "אבינו שבשמים צור ישראל וגואלו ברך את מדינת ישראל",
        translation: "Our Father in heaven, Rock and Redeemer of Israel, bless the State of Israel.",
        transliteration: "Avinu shebashamayim, tzur Yisrael vego'alo, barech et Medinat Yisrael."
      }
    ]
  },
  {
    id: "idf-prayer",
    title: "Prayer for the IDF",
    sefariaRef: "Prayer for the Welfare of the Israel Defense Forces",
    category: "nation",
    summary: "Prayer for the safety and courage of Israel’s defenders.",
    useCase: "Use this when praying for IDF soldiers and Israel’s defenders.",
    aliases: ["idf", "soldiers", "army", "tzahal", "protection"],
    tags: ["nation", "safety", "protection"],
    lines: [
      {
        hebrew: "מי שברך אבותינו אברהם יצחק ויעקב",
        translation: "May the One who blessed our ancestors Abraham, Isaac, and Jacob bless the defenders of Israel.",
        transliteration: "Mi sheberach avoteinu Avraham, Yitzchak v'Yaakov."
      },
      {
        hebrew: "הקדוש ברוך הוא ישמור ויציל את חיילינו",
        translation: "May the Holy One guard and rescue our soldiers.",
        transliteration: "HaKadosh Baruch Hu yishmor veyatzil et chayaleinu."
      }
    ]
  }
];

export const corePrayers: PrayerText[] = seeds.map((seed) => ({
  id: seed.id,
  title: seed.title,
  sefariaRef: seed.sefariaRef,
  category: seed.category,
  summary: seed.summary,
  useCase: seed.useCase,
  aliases: seed.aliases,
  tags: seed.tags,
  source: "local-cache",
  updatedAt: now,
  tokens: seed.lines.map((line, index) => ({
    id: `${seed.id}-${index}`,
    ...line
  }))
}));

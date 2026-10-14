# Kavanah prayer dictionary: source research and coverage

Research date: 27 September 2026. This is a research collection, not a claim that every Jewish prayer has been found or that these renderings have rabbinic approval.

## The central finding

Kavanah needs a **large, edition-specific, pronunciation-first library**, with a smaller exact list controlling what the app may publish. A search result, a prayer-book heading, a reusable license, a complete prayer, and a reviewed pronunciation are five different things. The data in this package distinguishes them.

The part that can be bounded and completed here is **all 150 chapters of the Jewish Book of Psalms**. This package contains all 2,527 verses in pointed Hebrew and JPS 1917 English, preserves an accented Hebrew source for pronunciation, and supplies machine pronunciation drafts wherever the parser can safely produce one. It also captures the section structure of **all 46 non-commentary works classified as Liturgy in the retrieved Sefaria catalog**, plus reusable text editions where available. This is a substantial collection, not a complete enumeration of Jewish liturgical creativity.

The National Library of Israel describes a collection covering thousands of prayers and poems and more than one hundred traditions. Open Siddur includes historical, contemporary, communal, and vernacular prayer. A finite Sefaria export therefore cannot establish “every recorded and digitally available prayer.” Some texts are available only in scans; others have no English translation, no pointed text, or no established permission to redistribute them. New prayers continue to be composed. [NLI's description](https://www.nli.org.il/he/discover/music/jewish-music/piyut/about), [Open Siddur's prayer list](https://opensiddur.org/prayers/list-of-prayers/).

## What was actually researched

1. Inspected Kavanah's current prayer types, source index, source retrieval service, and existing Hebrew review packet. The existing index reports 2,263 entries across 47 works. The older review packet explicitly excludes English and transliteration from its Hebrew review scope.
2. Retrieved Sefaria's live catalog, raw schemas, and version metadata for the 46 non-commentary Liturgy works. Retained work and edition boundaries.
3. Retrieved 80 reusable liturgical edition exports. When a generated export URL returned 404, checked the public export bucket's actual filenames and version metadata. Preserved the initial failures rather than pretending every constructed URL worked.
4. Retrieved three Psalm versions: Hebrew with vowels, Hebrew with cantillation, and JPS 1917 English. Checked all chapter and verse counts against one another. Selected source versions explicitly; did not use a default “best available” translation that might silently change.
5. Added 37 selected biblical prayer and blessing passages outside Psalms, including Moses, Miriam, Hannah, David, Solomon, Elijah, Hezekiah, Jonah, Daniel, Ezra, Nehemiah, and others. This supplementary selection is not a complete classification of every biblical speech to God.
6. Researched documented healing-Psalm collections, ritual use, language and rite distinctions, and wider sources for traditions underrepresented in the machine-readable corpus.
7. Generated transparent pronunciation drafts, preserving source text and withholding unresolved cases. No cantor or rabbi was contacted; no human approval is implied.

The machine-generated `data/coverage-summary.json` and `data/work-coverage.json` give the actual import counts. Count **source sections**, **distinct prayer families**, **edition variants**, **verses**, and **approved entries** separately. An entire Amidah under one heading is not one small prayer; a word-by-word linear edition is not thousands of different prayers.

## How to organize the app

Use multiple need-based tags per prayer. Keep service position, occasion, rite, source language, and pronunciation tradition in separate fields. A person can search “I am scared” without changing the prayer's identity or falsely claiming a particular chapter was historically prescribed for anxiety.

| Bucket | Include | Editorial boundary |
|---|---|---|
| Health and healing | Refaenu, Mi Sheberach for a person who is ill, Moses' prayer for Miriam, prayer before medicine, documented healing Psalm sets | Keep requests for healing separate from gratitude after recovery. |
| Wellness and emotional steadiness | Psalms of fear, hope, loneliness, rest, and consolation; Elohai Neshamah; attributed contemporary prayers | A thematic association is not a universal ritual prescription. |
| Opportunity and work | Prayer for livelihood, Birkat HaShanim, Parashat HaMan, Psalms 90, 127, 128, prayers for wisdom and ethical action | “Opportunity” is a modern search category, not an ancient liturgical title. No promises of wealth or employment. |
| Provision and financial strain | Livelihood petitions, Psalms 23, 34, 37, 65, 67, 104, 112, 127, 128, 145; food blessings | Distinguish a petition from a blessing that belongs to eating or a service. |
| Gratitude and joy | Modeh Ani, Modim, Nishmat, Psalm 100, Hallel, HaGomel, Shehecheyanu, HaTov VeHaMetiv | HaGomel and occasion-specific blessings require their own usage conditions. |
| Safety and protection | Psalms 20, 27, 46, 91, 121; Hashkivenu; particular communal petitions | Preserve difficult verses and the scope of the named custom. |
| Travel | Tefilat HaDerech and variants; Psalm 121; relevant thanksgiving after travel | Flight, road, overnight, and same-day return instructions vary. |
| Sleep and nighttime | Bedtime Shema, HaMapil, forgiveness preface, Hashkivenu, Psalms 4, 91, 134 | Bedtime Shema is a sequence, not simply the first verse of Shema. |
| Repentance and forgiveness | Hashivenu, Selach Lanu, Vidui, Ashamnu, Al Chet, Selichot, Tachanun, Tashlich, Tikkun HaKlali | Aramaic passages, Thirteen Attributes, fasting, calendar and minyan conditions need review. |
| Grief and remembrance | Kaddish variants, El Malei Rachamim, Yizkor, Tziduk HaDin, funeral and cemetery texts, kinnot | Kaddish, Yizkor and El Malei are different texts with different functions. |
| Relationships and peace at home | Blessing of children, marriage blessings, Psalms 128 and 133, attributed household prayers | Avoid inventing a single universal “relationship prayer.” |
| Fertility, pregnancy and birth | Hannah passages, Mi Sheberach variants, childbirth prayers, tkhines, Zeved HaBat | Preserve original language and gendered wording; adaptations need their own records. |
| Children and parenting | Blessing of children, Tefillat HaShelah, Brit Milah, naming, Pidyon HaBen, Bar/Bat Mitzvah texts | Biblical blessing, service text, ceremony and private petition are separate types. |
| Learning and wisdom | Torah blessings, Atah Chonen, prayers entering/leaving the study hall, Hadran, Psalms 19 and 119 | Study passages and legal discussions are not all prayers. |
| Justice and ethical speech | Hashivah Shofteinu, Elohai Netzor, Psalms 15, 34, 72, 82, 101, 141 | Preserve the full petition; distinguish thematic application from fixed use. |
| Community, Israel and peace | Sim Shalom, Shalom Rav, Oseh Shalom, Acheinu, Yekum Purkan, government/Israel/soldier/captive prayers | Document authorship, community, exact wording and date for modern prayers. |
| Shabbat and home practice | Candles, Kabbalat Shabbat, service texts, Kiddush, meals, zemirot, Havdalah | Do not flatten alternate Shabbat/holiday formulas into one text. |
| Festivals and seasons | Machzor, Haggadah, Hallel, Omer, Selichot, Hoshanot, Hanukkah, Purim, dew/rain | Keep Israel/diaspora, date, rite, and full/partial versions explicit. |
| Food, fragrance and nature | Before/after eating, Birkat HaMazon, fragrances, rainbow, thunder/lightning, trees, moon, sun | Each blessing has a specific occasion; broad nature tags do not authorize recitation. |
| Ritual and milestones | Tallit, tefillin, washing, mezuzah, challah, immersion of utensils, wedding and birth rituals | Keep instructions outside spoken prayer text. |
| Devotion and historic collections | Piyyutim, Perek Shirah, Keter Malkhut, Leshon Chakhamim, Ma'avar Yabbok, Tikkun Chatzot | Collections may mix prayer, commentary, ritual instruction and esoteric material. |

All 150 Psalms receive an editorial theme in `data/psalm-themes.tsv`. The full register gives every number, rather than only popular chapters. Documented healing uses are additionally recorded as named source-backed associations. Machine-assigned liturgy bucket tags are discovery aids pending editorial review; they are not production recommendations.

## Health: source-backed selections and important differences

Chabad's healing collection specifies the following sequence: **20, 6, 9, 13, 16, 17, 18, 22, 23, 28, 30, 31, 32, 33, 37, 38, 39, 41, 49, 55, 56, 69, 86, 88, 89, 90, 91, 102, 103, 104, 107, 116, 118, 142, 143, 148**. Preserve that order and attribution. [Source](https://www.chabad.org/library/article_cdo/aid/1228223/jewish/Psalms-and-Jewish-Prayer-for-Healing.htm).

A separate Chabad guide gives a short set of **20, 30, 121, 130, 142** and a longer list that differs from the first source. Preserve separate collection IDs. This demonstrates why a list should not be labeled “the Jewish healing Psalms” without specifying its source. [Source](https://www.chabad.org/library/article_cdo/aid/6873805/jewish/WhatYou-Need-to-Know-About-Visiting-the-Sick.htm).

The first source also describes selecting Psalm 119's eight-verse letter stanzas for a person's Hebrew name, and an additional letter sequence. Store stanza ranges and the exact custom; never invent a person's Hebrew name or maternal name from an English name. Psalm 119's 22 stanzas are all available because the entire chapter is included. This is a collection-building feature, not 22 additional Psalms.

Core healing families to review first:

- **Refaenu**, the healing blessing within the weekday Amidah. It is a service section, not automatically a freestanding blessing for every occasion. [Ashkenaz source](https://www.sefaria.org/Siddur_Ashkenaz%2C_Weekday%2C_Maariv%2C_Amidah%2C_Healing).
- **Mi Sheberach for the sick**: separate the traditional Torah-service forms, singular/plural and gender variants, and contemporary adaptations. An English song with this name is not interchangeable with every traditional form.
- **El na refa na lah**, from Numbers 12:13. “Lah” refers to Miriam; changes to “lo” or “lahem” are adaptations and must not replace the biblical source record.
- **Prayer for Taking Medicine**, separately indexed in Siddur Edot HaMizrach.
- **Asher Yatzar**, gratitude for bodily functioning in its actual ritual setting. It should not be renamed a generic healing petition. [Usage source](https://www.chabad.org/library/article_cdo/aid/3268369/jewish/Shulchan-Aruch-Chapter-7-Laws-Relating-to-Recitation-of-Blessing-Asher-Yatzar-after-Relieving-Oneself-in-Course-of-Day.htm).
- **Birkat HaGomel**, thanksgiving associated with deliverance, including certain recovery contexts; review tradition-specific conditions.
- **Jeremiah 17:14**, a biblical request for healing, and **Isaiah 38:9–20**, thanksgiving after illness.
- Historical and contemporary prayers for caregivers, distress, pregnancy and recovery. Rabbi Elliot Kukla's prayer for mental illness is an attributed English original with its own license, not an ancient Hebrew prayer. [Source](https://opensiddur.org/prayers/life-cycle/living/well-being-health-and-caregiving/a-prayer-of-healing-for-mental-illness-by-elliot-kukla/).

## Wellness: organize by experience, preserve the text

Useful editorial routes include fear (27, 56, 91), feeling abandoned (13, 22, 42, 43), betrayal (55), restlessness (4, 77, 131), grief (23, 39, 90, 130), and gratitude after difficulty (30, 40, 107, 116, 118). These are thematic readings of the chapters, not sourced claims that every community prescribes these lists.

Psalm 88 does not end with an easy resolution. Psalm 137 includes harsh language of vengeance. Do not remove such verses and label the result a complete Psalm; offer context or a separately identified excerpt. A compassionate search interface must not rewrite the source to force a cheerful ending.

Elohai Neshamah, Modeh Ani, Hashkivenu and Yedid Nefesh offer different forms of renewal, trust and devotion. Their placement and wording remain attached to their editions. Contemporary prayers from Reform, Conservative/Masorti, Reconstructionist, Renewal and other communities belong in clearly attributed records; do not silently relabel one movement's formulation as universal. [Reform prayer library](https://reformjudaism.org/beliefs-practices/spirituality-prayers-blessings), [Rabbinical Assembly's Lev Shalem material](https://www.rabbinicalassembly.org/look-inside-siddur-lev-shalem).

## Opportunity, livelihood and decisions

The strongest catalog strategy is to recognize ordinary user phrases such as “job interview,” “looking for work,” “money stress,” and “making a decision,” then route to reviewed prayers about **livelihood, wisdom, honest effort, sufficient provision, and hope**. These are search aliases, not invented ancient titles.

Review these families first:

- **Birkat HaShanim / Barech Aleinu / Barchenu**, keeping seasonal and rite variants.
- **Tefillah leParnassah**, preserving the exact version and any accompanying instructions.
- **Parashat HaMan**, a biblical reading and its associated customary use, not a promise of income. Distinguish the ordinary manna passage from special Tuesday-Beshalach collections.
- **Atah Chonen**, for understanding; **Shema Koleinu**, the general petition within the Amidah; **Elohai Netzor**, for speech and conduct.
- **Psalm 90**, especially its closing petition concerning human work; **127**, effort and dependence; **128**, work and household blessing; **145**, provision. Keep whole-chapter records separate from verse excerpts such as 90:17 or 145:16.
- **Proverbs 30:7–9**, sufficient provision and integrity; **I Kings 3:6–9**, Solomon's request for discernment; **Nehemiah 1:5–11**, a petition preceding an undertaking.
- Attributed workplace and livelihood prayers in Open Siddur, including vernacular texts. The archive explicitly spans multiple languages and historical settings. [Labor, fulfillment and parnasah collection](https://opensiddur.org/shared/prayers/life-cycle/living/work/?language=eng&language_name=English).

Avoid claims such as “Psalm X guarantees a new job,” numerological assignments without a named source, or commercial devotional pages repackaged as universally accepted Jewish practice. Historical segulah collections can be researched as such, with authorship, edition, context and community attached.

## Full service and occasion inventory

The generated registers retain all retrieved headings and numbered sections, including the following families. This checklist helps prevent a large but unbalanced “needs” dictionary from overlooking everyday prayer.

**Waking and preparation:** Modeh/Modah Ani; Netilat Yadayim; Asher Yatzar; Elohai Neshamah; each of the morning blessings; Torah blessings and following passages; tallit/tzitzit; tefillin and accompanying passages; Ma Tovu; Adon Olam; Yigdal; Akedah; Leolam Yehei Adam; korbanot; the incense passage; Eizehu Mekoman; Rabbi Yishmael's baraita; Ana BeKoach; preparatory intentions particular to an edition.

**Praise and Shema:** Baruch She'amar; Hodu; Mizmor LeTodah; Yehi Chevod; Ashrei; Psalms 146–150; Vayevarech David; Az Yashir; Yishtabach; Barechu; Yotzer Or; Ahavah Rabbah/Ahavat Olam; Shema's three biblical paragraphs and liturgical additions; Emet VeYatziv; evening Maariv Aravim, Ahavat Olam, Emet VeEmunah and Hashkivenu; region-specific additional evening passages.

**Amidah:** introductory verse; Avot; Gevurot; Kedushat HaShem and Kedushah forms; understanding; repentance; forgiveness; redemption; healing; livelihood/year; gathering exiles; justice; against wrongdoing/opponents; the righteous; Jerusalem; Davidic hope; hearing prayer; restoration of service; thanksgiving/Modim and Modim DeRabbanan; peace; Elohai Netzor and concluding passages. Keep Shabbat, festival, Rosh Chodesh, Musaf, High Holy Day and Ne'ilah forms separately. Track Yaaleh VeYavo, Al HaNissim, Aneinu, Nachem, seasonal rain/dew wording, and the Ten Days of Repentance changes in their actual editions.

**After Amidah and Torah service:** Tachanun; Vidui; Thirteen Attributes; Monday/Thursday additions; Avinu Malkeinu; El Erech Appayim; Vayehi Binsoa; Berich Shemei; Torah/Haftarah blessings; Mi Sheberach variants; HaGomel; Yekum Purkan; congregational/civic prayers; raising and returning the Torah; Uva LeTzion; Lamnatzeach; Shir Shel Yom; Barchi Nafshi; Psalm 27 customs; Aleinu; Ein Keloheinu; Pitum HaKetoret; remembrance/faith passages; Kaddish variants.

**Shabbat at home and synagogue:** candle blessings; Yedid Nefesh; Kabbalat Shabbat Psalms; Lecha Dodi; Bameh Madlikin; Veshamru; Vayechulu; Magen Avot/Me'ein Sheva; Shalom Aleichem; Eshet Chayil; blessing children; evening/daytime Kiddush; meal-specific Aramaic introductions where used; zemirot; Nishmat; Shochen Ad; Musaf; Mincha; Tzidkatecha; third-meal material; Vihi Noam; Veyiten Lecha; Havdalah; Motzaei Shabbat songs; Melaveh Malkah; Gott fun Avraham in its actual language.

**Meals and occasional blessings:** washing; HaMotzi; Mezonot; HaGafen; HaEtz; HaAdamah; SheHaKol; Birkat HaMazon and zimmun variants; Me'ein Shalosh/Al HaMichyah and wine/fruit variants; Borei Nefashot; fragrance categories; Shehecheyanu; HaTov VeHaMetiv; Dayan HaEmet; lightning/thunder; rainbow; ocean and other natural phenomena; trees; moon; sun; seeing particular people/places as present in the selected siddur. Compound headings in the source must be split and reviewed before becoming individual app entries.

**Festivals and annual cycle:** Rosh Chodesh and Birkat HaChodesh; complete/abridged Hallel; festival Kiddush and Amidah; Eruv Tavshilin; bedikat/biur chametz and nullification; the Haggadah's complete sequence and post-Seder songs; counting the Omer including variable day/week forms; Shavuot and Akdamut/Azharot traditions; sukkah/lulav; Ushpizin; Hoshanot and Hoshana Rabbah; rain/dew prayers; Simchat Torah/Hakafot; Hanukkah candle blessings, HaNerot Hallalu, Maoz Tzur, Al HaNissim; Purim Megillah blessings and related piyyutim; fast-day prayers; Tisha B'Av and kinnot.

**High Holy Days:** Selichot by rite and day; Avinu Malkeinu; Rosh Hashanah services; shofar blessings and associated verses; Malchuyot, Zichronot and Shofarot; Unetaneh Tokef and other piyyutim; Tashlich; Kol Nidrei; Vidui/Ashamnu/Al Chet; Yom Kippur Avodah; Eleh Ezkerah and other martyrdom texts; Yizkor; Ne'ilah; closing declarations. A named piyyut has variants; a list of headings alone is not a complete machzor.

**Life cycle and personal prayer:** birth/naming and recovery blessings; Brit Milah; Pidyon HaBen; Zeved HaBat; Bar/Bat Mitzvah; betrothal and Sheva Berachot; household dedications; immersion and mitzvah blessings; study-hall prayer and Hadran; travel; medicine; livelihood; Tefillat HaShelah; illness and visiting; end-of-life Vidui; funeral, burial and cemetery texts; mourning, memorial and anniversary prayer; communal calamity, captivity and deliverance; contemporary prayers for experiences inadequately represented in older prayerbooks.

**Historic and devotional collections:** all 150 Psalms; Tikkun HaKlali as a sequence; Tikkun Rachel/Leah; Perek Shirah; Seder Ma'amadot; Keter Malkhut; Leshon Chakhamim; Ma'aneh Lashon; Ma'avar Yabbok; piyyutim, pizmonim and baqashot; women's tkhines; local and family customs. Some of these works contain extensive instructions and study, which must be classified rather than published as recitable prayers.

## Text and edition policy

The Psalm Hebrew is the edition Sefaria labels **Tanach with Nikkud**, with a parallel **Tanach with Ta'amei Hamikra** snapshot. Both cite tanach.us and are reported as public domain. The English is **The Holy Scriptures: A New Translation (JPS 1917)**, also reported as public domain. Preserve the translation's historical language. A modernized English rendering would be a new adaptation requiring separate attribution and review.

For liturgy, selected editions include public-domain texts, Sefaria Community Translation/CC0, Metsudah editions reported as CC-BY, and CC-BY-SA editions. An English translation may have a different license from its Hebrew source. The exact selected edition is recorded independently for every language and section; no section is silently assembled from several Hebrew editions. When multiple versions exist, the import currently chooses the section with the greatest number of nonempty segments. This maximizes research coverage; it is **not** a scholarly ranking or a production-edition decision.

Sefaria instructs users to check licensing at the edition level. Open Siddur likewise distinguishes licenses and exceptional materials. Public access alone is insufficient evidence of redistribution rights. This package records what the providers report; ambiguous license versions, attribution and ShareAlike obligations need resolution for the actual app distribution. [Sefaria data-use documentation](https://developers.sefaria.org/docs/usage-of-our-name-and-logo), [Open Siddur copyright policy](https://opensiddur.org/about-this-project/policies/copyright-policy/).

Koren, ArtScroll, Kehot, CCAR, Rabbinical Assembly and other contemporary published translations cannot be assumed reusable because they can be read online. Their works remain useful reference targets. This package does not copy rights-unknown versions into the corpus. NLI recordings need separate recording and performance permissions; permission for a text does not imply permission for an audio recording.

## Traditions still requiring targeted expansion

| Tradition or collection | What this package establishes | Remaining work |
|---|---|---|
| Ashkenaz, including Lita/Polin Selichot | Several digitized works and reusable editions retrieved | Choose complete editions; distinguish eastern/western/local customs and wording. |
| Nusach Sefard | Separate siddur and linear sources retrieved | Do not label as the prayer rite of all Sephardi Jews. |
| Edot HaMizrach | Siddur and Selichot sources retrieved; important holiday rights/text gaps recorded | Not a substitute for every Moroccan, Syrian, Iraqi, Persian, Turkish or other local rite. |
| Chabad/Ari | Catalog references, limited reusable text, and a Ma'aneh Lashon edition | Obtain appropriate complete siddur Hebrew and English rights and expert review. |
| Spanish-Portuguese / Western Sephardi | Scope acknowledged; not fully ingested | Select and compare actual editions and pronunciation conventions. |
| Italian and Romaniote | Scope acknowledged; not fully ingested | Research community editions, manuscripts, scans and translations. |
| Yemenite Baladi and Shami | Scope acknowledged; not fully ingested | Distinguish rites, pronunciation, texts and transliteration conventions. |
| Beta Israel | Scope acknowledged; not a Hebrew-siddur substitute | Research Ge'ez prayer with community expertise and preserve original language. |
| Karaite | Outside the ingested rabbinic-siddur corpus | Treat as a distinct Jewish tradition if included in product scope; obtain relevant sources. |
| Reform, Conservative/Masorti, Reconstructionist, Renewal | Reference sources located; no universal replacement edition | Obtain exact text and translation permissions; label authored adaptations and inclusive-language variants. |
| Yiddish tkhines; Ladino, Judeo-Arabic, French and other vernacular prayers | Source collections identified | Transcribe original languages; do not back-translate into “original Hebrew.” |
| Piyyut, pizmon and baqashot repertoires | Several works ingested; NLI identified as a major additional collection | Item-by-item authorship, tradition, variants, translations and rights. |
| Modern life situations | Attributed examples and collections identified | Expand with source-backed prayers; modern compositions remain modern. |

Open Siddur's tkhine materials illustrate the issue: some English translations explicitly lack a firmly identified original or an available transcription. A webpage headed “Source (Hebrew)” is not enough to establish that the work was originally Hebrew. [Tkhine example and source caveats](https://opensiddur.org/prayers/life-cycle/living/pregnancy/a-prayer-for-a-woman-before-giving-birth-from-the-seder-tkhines-ca-1640-1720/), [Der Tekhines Proyekt](https://opensiddur.org/profile/der-tekhines-proyekt/).

## What “verified” may mean

- **Source matched:** exact edition and source snapshot are known; identifiers and available text are recorded.
- **Structurally checked:** chapter/verse counts or section boundaries have passed specified checks.
- **Editorially reviewed:** actual Hebrew, English alignment, pronunciation, instructions, variants and use have been examined and the reviewer is recorded.
- **Approved for Kavanah:** the exact version and content hash are authorized for publication, with rights and rendering checked.

Only the last state belongs in the production allowlist. This research establishes the first two where stated. It does not manufacture the latter two. The provided approval manifest is deliberately empty. The Codex prompt therefore prepares import and review machinery but blocks a destructive cutover until there are actual approved entries.

## First review queue

Prioritize complete Psalm chapters used across several buckets; Modeh Ani; the complete Shema sequence; Asher Yatzar; Elohai Neshamah; Refaenu in context; Mi Sheberach; Tefilat HaDerech; Hashkivenu and the bedtime sequence; livelihood prayers; Torah blessings; food blessings; Kiddush/Havdalah; and the most requested mourning texts. Then expand the same exact-review process to full service and festival editions. This is sequencing, not permission to discard the broader research inventory.

The primary product metric should be **complete approved texts with usable pronunciation**, not raw title count. The approval record must cover all three renderings; the existing Hebrew-only review process is insufficient for the requested pronunciation-first dictionary.

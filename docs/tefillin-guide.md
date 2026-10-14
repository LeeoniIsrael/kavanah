# Prayer practice guides

Find a prayer now includes **Tefillin**, also searchable as tefilin, tfilin, תפילין, and putting on tefillin. The retired `tefillin-blessing` bookmark resolves to the complete practice guide.

The sequence covers preparation and timing, arm placement and blessing, head placement and custom-dependent blessing/response, Umechochmatecha and Ve’erastich as customary additions, Kadesh (Exodus 13:1–10), Vehayah ki yevi’acha (13:11–16), and Shema with Baruch shem, Ve’ahavta, Vehayah im shamoa, Vayomer and Emet. It explains custom-dependent Shema openings/endings, continuation into Shacharit, and removal. It is not a full Shacharit service or a claim of rabbinic approval. The captured Ashkenazi text is identified as such; choosing one blessing does not change the text’s nusach or select a wrapping pattern. The unaligned introductory Leshem yichud remains excluded and is disclosed.

The native reader uses shared Card, ChoiceRow, typography and semantic colors for an at-a-glance sequence and blessing choices. Action cues remain distinct from recited Hebrew, pronunciation and translation. No anatomical wrapping animation was shipped: a generated hand/strap illustration could teach an incorrect custom or placement. A clearly labeled Chabad demonstration is linked instead. No new animation or dependencies were added.

Shema and both included Bedtime Shema editions have passage cues. Bedtime search now surfaces the full Ashkenazi sequence, including Hamapil, rather than an isolated opening verse. The morning washing, tzitzit, Kaddish, Shema-blessing and Amidah-section guides identify their occasion, sequence and conditional/congregational scope. Other excluded source sections remain excluded; this change does not certify the entire research catalog as complete.

## Source preservation

`scripts/importPracticeGuides.py` is called by the offline catalog importer. It selects explicit addresses from the existing captured liturgy corpus and reuses the exact three text fields. No sacred text or pronunciation is reconstructed. Every tefillin token carries its original source reference. All text retains its pending review status.

- [Metsudah / Sefaria tefillin section, CC BY](https://www.sefaria.org/Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Tefillin)
- [Metsudah / Sefaria Shema section, CC BY](https://www.sefaria.org/Siddur_Ashkenaz,_Weekday,_Shacharit,_Blessings_of_the_Shema,_Shema)
- [Chabad placement and wrapping demonstration](https://www.chabad.org/library/article_cdo/aid/272666/jewish/Guide.htm)
- [Placement, blessings, timing and prayer context](https://www.chabad.org/library/article_cdo/aid/7264099/jewish/What-You-Need-to-Know-About-Putting-On-and-Taking-Off-Tefillin.htm)
- [Removal and special days](https://www.chabad.org/library/article_cdo/aid/81815/jewish/Some-Laws-of-Tefillin.htm)
- [Sephardic practice for the four passages](https://sephardic.org/halachot/chapter_detail/17/reciting-the-four-parshiyot)
- [Shema openings and endings by custom](https://www.chabad.org/library/article_cdo/aid/7331312/jewish/Why-Do-We-Repeat-the-Final-Words-of-the-Shema.htm)

## Verification

Typecheck and targeted lint pass. Catalog/search/Siddur/source-preservation tests and native reader tests cover inclusion, order, unchanged text, aliases, legacy bookmark resolution, conditional blessing choices, instruction labeling and completion behavior. A widget availability test covers the Expo Go native-module guard added after preview exposed a pre-existing missing-widget-module error.

Native preview: `/tmp/kavanah-tefillin-preview`, containing the current source and existing tracked user edits, with dependencies inside that checkout; Metro at `http://127.0.0.1:8081`, iPhone 17 Pro / iOS 26.0. The Documents checkout stalled on cloud-backed files. Dark native guide and rounded choices were visually inspected, and live source edits appeared through Fast Refresh. Touch-driven scrolling/selection and accessibility settings could not be checked while the Mac was locked. No test completions were logged. All temporary rendering overrides were removed before commit. Pronunciation and ritual text still need expert review.

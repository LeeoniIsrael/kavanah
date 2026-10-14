# Pronunciation-first transliteration

## Proposed learner format

Use short syllables, ordinary Latin letters, and uppercase for a reviewed stressed syllable. A hyphen means “continue this word”; a space means “new word.” Avoid long chains such as `aaaaa` or `eeeeee`: they suggest a tune or duration that the text does not prescribe.

The illustrative opening of Shema is:

**sh’MAH yis-rah-EL, ah-doh-NAI eh-loh-HEY-noo, ah-doh-NAI eh-KHAHD.**

This is the opening verse, not the complete Shema. The complete liturgical unit normally includes the three biblical paragraphs, Baruch Shem, and edition-specific framing. The English/Hebrew source for the example is Deuteronomy 6:4; use the selected siddur for its complete liturgical form.

The apostrophe in `sh’MAH` indicates a very light connecting sound. `sheh-MAH` is a possible beginner coaching form, but teachers should decide which spelling best fits the chosen pronunciation. This is precisely why a consistent scheme and human listening review matter.

| Spelling | Learner cue |
|---|---|
| ah | vowel in “father” |
| eh | vowel in “bed” |
| e | a very light connecting vowel in the machine draft; vocal sheva needs word-by-word review |
| ee | vowel in “see”; do not stretch it |
| oh | vowel in “go,” kept short and clean |
| oo | vowel in “food”; do not stretch it |
| ey | vowel sound in “they” where that pronunciation is intended |
| ai | vowel in “eye” |
| kh | the rough sound in Scottish “loch”; not English “ch” in “chair” |
| ts | ending sound of “cats” |
| sh | sound in “ship” |
| g | always hard, as in “go” |
| r | readable English approximation; a teacher/audio can demonstrate the selected community's r |
| CAPITALS | main stress, not volume or duration |

The first draft uses a modern-Israeli-oriented learner pronunciation. This is a product default, not a claim that it represents every Sephardi, Mizrahi, Ashkenazi or Yemenite pronunciation. **Textual rite and pronunciation are separate dimensions.** The user can eventually read an Ashkenaz text with an Israeli pronunciation or select another pronunciation profile, if both have been reviewed.

## Why automatic transliteration cannot certify the dictionary

The package uses `hebrew-transliteration@2.10.1` with an explicit custom schema. Its underlying syllabification handles many vowel and consonant distinctions; its documentation states that accurate stress marking depends on cantillation. The source of this tool and its behavior are documented in the [maintainer's repository](https://github.com/charlesLoder/hebrew-transliteration). The generated schema is stored in `data/transliteration-report.json`.

Draft generation is useful for coverage but needs attention to:

- vocal versus silent sheva;
- qamats qatan and other context-dependent vowels;
- shuruk/holam and consonantal vav;
- alef and ayin vowel boundaries;
- gutturals and furtive patach;
- dagesh and community-dependent consonant sounds;
- main stress, secondary marks, and cantillation peculiarities in Psalms;
- maqqef and real word boundaries;
- ketiv/qere and other reading conventions;
- Divine Names, including the reading of the four-letter Name after Adonai;
- abbreviations, acrostics, supplied vowels and optional words;
- Hebrew versus Aramaic, especially Kaddish, Berich Shemei, Akdamut and Zohar passages;
- instructions, quotations and commentary mixed into a printed prayer section.

The code does not infer a complete vocalization for an unpointed passage. It withholds drafts for insufficiently vocalized or unresolved input. Some partially vocalized passages can pass the mechanical threshold, so **even a produced draft is not proof of correctness**. All generated drafts are blocked from publication.

For Psalms, the original written Hebrew remains intact. A separate `readingHebrew` field selects the source's bracketed qere for pronunciation. `qereTransformations` records every selection. Extraordinary dots and inverted-nun manuscript markers are preserved in the original and omitted only from the speech input. These operations must remain visible to reviewers.

For unaccented siddur text, the machine draft generally leaves stress unmarked. Divine Name readings carry a fixed display convention. Do not treat a lowercase output as final learner copy, or blindly capitalize the last syllable of every word. Source meteg alone does not automatically establish main stress.

## Required final data shape

Each published segment should carry separate exact fields:

```json
{
  "segmentId": "stable-identifier",
  "sourceLanguage": "he",
  "hebrewSource": "source spelling preserved",
  "hebrewDisplay": "reviewed screen spelling",
  "spokenReading": "reviewed qere and Divine Name convention",
  "english": "exact attributed translation",
  "transliterationSimple": "reviewed hyphenated learner text",
  "pronunciationTradition": "explicit profile",
  "instructions": [],
  "speaker": "individual-or-leader-or-congregation",
  "optionalCondition": null,
  "reviewStatus": "pending",
  "contentSha256": "hash of all published content and relevant conditions"
}
```

Use an original-language field for Aramaic and vernacular prayers; “Hebrew” should not be a catch-all for Hebrew-script languages. English originals need no transliteration. A new Hebrew translation of an English original must be labeled a translation, never a recovered original.

## Reviewer workflow

1. Select one source edition and pronunciation profile for the complete prayer or explicitly marked excerpt.
2. Separate spoken text, instructions, alternate forms, quotations and optional inserts.
3. Confirm the original language, source wording, vowels, punctuation, qere and Divine Name treatment.
4. Align the English to the correct Hebrew segments by meaning; equal array lengths alone do not prove alignment. Preserve notes separately.
5. Read every word aloud from Hebrew and compare the learner spelling. A second reader should follow the learner spelling without seeing the Hebrew.
6. Test the result with a beginning reader. Record repeated misreadings and revise the spelling convention consistently.
7. Add audio only with verified text match, performer permission and recording rights. Tag audio by the same text version and pronunciation profile.
8. Record reviewer, date, exact edition, pronunciation profile and content hash. A text or pronunciation edit invalidates that approval.

Suggested acceptance cases include `Adonai`, `Eloheinu`, `Yisrael`, `baruch`, `melech`, `ruach`, `kol`, `Shema`, a Hebrew/Aramaic Kaddish comparison, a nonfinal stressed word, a qere verse, a feminine/masculine name placeholder, and a seasonal insert. These are linguistic review cases, not just software string tests.

No pronunciation in this package has been certified by a cantor or rabbinic reviewer. The manually written Shema example demonstrates the intended format; it is not a signed-off production prayer.

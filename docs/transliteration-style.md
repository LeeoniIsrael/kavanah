# Prayer transliteration

Use connected, familiar words, with natural pauses, throughout the published
catalog. The owner's reference is:

```text
Modeh Ani Lefanecha,
melech chai ve kayam,
shehech-zarta bee, nishmati, b'chemla,
Rabah Emunatecha
```

- Use `ch`, `sh`, and `tz`: Baruch, Shema, mitzvot.
- Use ordinary vowels within words: melech, nishmati, kayam. Retain `bee`
  for the standalone word in the example, and familiar endings such as `modeh`.
- Remove automatic syllable hyphens and uppercase stress. Use occasional
  reading aids such as `shehech-zarta` and `b'chemla`.
- Separate a vocal `ve` prefix; preserve the different sounds of `va` and `u`.
- Use sentence capitals and familiar capitalization of names. Modeh Ani uses
  the owner's exact casing and line breaks when the source phrase matches.
- Break at existing clause punctuation; never insert pauses by word count.
  Keep different editions, extra passages and source token boundaries intact.

`scripts/readableTransliteration.py` formats the captured pronunciation drafts
at the end of `scripts/importResearchCatalog.py`, including practice guides.
It does not edit Hebrew, translations, source snapshots, instructions or review
status. The formatter runs once per imported catalog; the style version prevents
double conversion. Run `python3 scripts/importResearchCatalog.py` to regenerate
and `python3 -m unittest discover -s scripts -p 'test_readable_transliteration.py'`
to check the reference wording, distinct variants and complete catalog coverage.

These are spelling and presentation conventions, not a new pronunciation review.
Existing machine-draft limitations (including sheva, qamats, and Aramaic) remain
recorded in the research metadata.

## Verification

September 28, 2026: all 561 published entries use this style; 9,115 recitable
passages changed. Compared the complete catalog before/after: only
transliteration and style metadata changed. Repeated imports produce identical
catalogs and report hashes. Four formatter checks, 28 catalog/service/Siddur
checks, seven native reader interaction checks, typecheck and targeted lint pass.

Native iPhone 17 Pro (iOS 26.0) inspection confirmed the exact Modeh Ani wording,
explicit phrase breaks with natural wrapping, readable dark appearance, and
selection across a line break. Both the native quote reader and Siddur HTML
preserve newlines. No animation or preview-only override was introduced.
Runtime: `/private/tmp/kavanah-tefillin-preview`, `http://localhost:8081`, with
dependencies inside that checkout and the intended source changes copied in.
Metro reported running and the app loaded. The shared preview stopped before
the final bottom-scrolling check could finish; that check remains unverified.

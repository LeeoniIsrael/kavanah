# Prayer times: beginner language

Prayer times use familiar English titles first, retain traditional names, and show a short purpose on every row. Tapping the row reveals context and the calculation method. Home and reminder settings use the same terminology. The tab is named Times; the page introduces the traditional term Zmanim.

The guide distinguishes opening times from deadlines, explains that Mincha Gedolah and Mincha Ketana refer to the same afternoon service, and distinguishes sunset from the end of Shabbat. It does not change calculation or reminder scheduling logic. Local customs can differ, including candle-lighting lead times and Shabbat end calculations.

## Sources

- [Chabad: Zmanim briefly defined](https://www.chabad.org/library/article_cdo/aid/134527/jewish/Zmanim-Briefly-Defined-and-Explained.htm)
- [Chabad: calculation methods](https://www.chabad.org/library/article_cdo/aid/3209349/jewish/About-Our-Zmanim-Calculations.htm)
- [Chabad: times for each prayer](https://www.chabad.org/library/article_cdo/aid/7092405/jewish/What-You-Need-to-Know-About-the-Times-for-Each-Prayer.htm)
- [KosherJava ZmanimCalendar reference](https://kosherjava.com/zmanim/docs/api/com/kosherjava/zmanim/ZmanimCalendar.html)

## Verification

TypeScript and targeted ESLint checks passed. Existing zmanim and reminder-plan suites passed (13 tests). Native iPhone 17 Pro / iOS 26 screenshots verified the loaded hero, plain-English rows, time alignment, and expanded explanation with simulated New York GPS. Temporary scroll and expansion overrides were removed. Mac lock prevented direct tap verification; expanded visual state was inspected through a temporary source edit and Fast Refresh. Metro serves the edited checkout at /private/tmp/kavanah-clean-launch-20260924 on port 8081.

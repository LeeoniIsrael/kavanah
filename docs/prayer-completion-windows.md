# Prayer completion windows

The checklist and reader use the same gate, including a second check inside both stores at completion time. A blocked reader remains readable and closable, but cannot create history or trigger the completion share prompt. Existing completed checkmarks can still be undone.

Rules implemented:
- Tefillin: calculated misheyakir (11°) until sea-level sunset, excluding Shabbat and major work-prohibited festivals. Chol HaMoed customs differ and are not universally blocked.
- Shacharit: dawn until halachic midday. The earlier preferred prayer deadline does not become a hard prohibition.
- Mincha: mincha gedolah until sunset (the app's normal logging window).
- Maariv: early evening from plag, and after midnight until dawn. Early Maariv requires appropriate practice; this availability is not a ruling that every time within the window is appropriate.
- Other prayers/learning are not inferred to be prohibited from broad search categories or source paths. Individual Shema passages and general blessings remain readable/loggable.

These are ordinary-practice app logging windows, not exhaustive rulings: twilight, emergency, make-up prayer, fast-day, custom-specific and other exceptional cases need rabbinic review. In particular, some authorities allow tefillin without a blessing between sunset and nightfall; the requested sunset cutoff deliberately does not support that exception. Do not market these guards as rabbinically approved.

Calculations use actual coordinates and device timezone with kosher-zmanim, independent of the display service's estimated fallbacks. Missing/polar calculation results and location older than one hour block timed logging with an explanation. Location refreshes on screen entry/foreground when older than 45 minutes; Prayer times > Update refreshes immediately. Devices should have automatic timezone enabled. Reading and untimed prayers do not need location.

The holiday summary excludes civil dates before today, includes today through the civil day, and excludes adjacent-month grid cells. Past dates remain selectable in the calendar. A different selected month is labeled by its month/year, and past months have no upcoming summary entries.

Sources consulted:
- https://www.chabad.org/library/article_cdo/aid/7264099/jewish/What-You-Need-to-Know-About-Putting-On-and-Taking-Off-Tefillin.htm
- https://www.chabad.org/library/article_cdo/aid/5397906/jewish/Why-No-Tefillin-at-Night-or-on-Shabbat.htm
- https://www.chabad.org/library/article_cdo/aid/7092405/jewish/What-You-Need-to-Know-About-the-Times-for-Each-Prayer.htm
- https://www.chabad.org/library/article_cdo/aid/144443/jewish/Plag-Hamincha.htm

Verification: calculation boundary tests, calendar date regression tests, store-level write rejection/undo tests, and reader interaction tests. Physical-phone visual verification was unavailable in this task; Metro was left serving the same working checkout for the user's Expo Go connection.

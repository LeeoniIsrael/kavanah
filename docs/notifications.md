# Local reminders

## What ships

- Opt-in reminders for tefillin, Shacharit, Mincha, Maariv, local Shema/Tefilah deadlines, Mincha opening, nightfall, and Friday candle lighting.
- Per-prayer time and weekdays; per-zman advance minutes; holiday categories, advance days and delivery time; separate festival checklist reminders.
- Sound, overnight quiet hours, Shabbat/Yom Tov quiet, Chol HaMoed tefillin preference, and shared Israel/diaspora observance.
- Persisted per-occurrence preparation checklists, suppression after completing a checklist, and cancellation of same-day clock reminders after recorded practice completion.
- An explicit Send a test action with a five-second delay. OS permission is requested only by enabling reminders or asking for a test.

## Scheduling contract

`reminderPlan.ts` is a pure date/calendar planner using the existing kosher-zmanim library. It generates the next 30 days in the device's current time zone, using the saved location. Festival notices count back from the civil date of the starting evening; minor fast notices use the daytime date. Multi-day starts are deduplicated. No push token, backend job, or notification service is required.

`reminderScheduler.ts` serializes native queue reconciliation, uses stable identifiers and content/time fingerprints, and changes only Kavanah reminder requests and legacy zman requests. It reserves headroom below iOS's pending-notification ceiling, subtracts unrelated requests from the available budget, and schedules the earliest remaining reminders. The UI reports the scheduled count and horizon; with many categories on, that horizon is shorter than 30 days. The queue refills at launch, foreground, hourly while running, and after preference, location, calendar-observance, checklist, or recorded-practice changes. There is no guaranteed background refill when the app is not opened; the UI says so. Errors remain visible and can be retried. Turning off a category removes its outstanding alerts; turning off all reminders clears them all. The separate explicit test request is not an automatic reminder.

Update location in settings or Zmanim when traveling. Coordinates and reminder choices stay on-device. Foreground reconciliation adjusts schedules to the current device time zone; it does not silently request new location permissions. Local date triggers already queued cannot react to travel or preference changes while the app remains closed. OS Focus, permissions, Android power management, and notification settings can affect delivery. No exact-alarm entitlement is added; Android does not promise exact-to-the-minute delivery.

## Validation and remaining device QA

Automated tests cover date boundaries, leap-calendar holiday behavior through existing calendar tests, Israel/diaspora, daylight/polar conditions, quiet windows, weekday/completion filters, completed checklists, persistence validation, idempotent native queue reconciliation, permission revocation, legacy cancellation, partial-failure retry, queue capacity, and allowed tap destinations. iOS Simulator screenshots check settings/checklist layout. Before release, verify background delivery and cold-start taps on a physical iPhone, sound/Focus behavior, permission denial and recovery, DST/time-zone travel, and Android delivery/reboot behavior. Simulator rendering and mocked native queue tests do not establish physical-device delivery.

API references: [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [Apple local notification scheduling](https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app).

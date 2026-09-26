# Kavanah

Kavanah is a calm, local-first Jewish prayer companion for iOS and Android. Its purpose is simple: remove friction between a person and prayer, without pretending to replace a siddur, community, Torah learning, or qualified rabbinic guidance.

The project is pre-release (`0.2.0`). It is not yet ready for App Store submission because the Hebrew prayer catalog is awaiting rabbinic approval and several production safeguards remain open.

## What Works Today

- Intent-based prayer search with plain-language descriptions and bookmarks.
- Hebrew text, primary-language translation, and script-aware transliteration.
- A full-screen prayer reader with a brief intention cue and unobtrusive close control.
- An optional Prayer Focus pause before the siddur opens, with direct setup paths for iPhone Focus automation and Android Do Not Disturb.
- On-device zmanim calculation for a seven-day window using the device location.
- Local reminders for upcoming zmanim.
- A private long-trip prompt that opens or schedules Tefilat HaDerech, with a `kavanah://prayer?query=travel&prayerId=tefilat-haderech` automation link.
- Optional daily-practice tracking with user-selected priorities and local statistics.
- Optional biometric app lock.
- A consent-gated, source-bounded prayer assistant through the Kavanah server.
- Offline bundled prayer access and graceful network fallbacks.

## Content Status

The approved-core workflow currently contains 33 entries. All Hebrew entries are marked `pending` for rabbinic review: 6 complete candidates, 21 excerpts, 3 service collections, and 3 entries with no bundled Hebrew. Beyond that core, Kavanah indexes every available non-commentary section in Sefaria's Liturgy catalog plus all 150 Psalms: 2,263 searchable sections across 47 source works. Of those, 1,564 have a reusable Hebrew edition available for licensed in-app loading; 699 remain source links because no commercially reusable Hebrew edition is currently listed.

Source-backed Hebrew candidates and the complete source-library inventory live in [docs/rabbinic-hebrew-review.md](docs/rabbinic-hebrew-review.md). The first section contains exact Hebrew candidates for approval. The comprehensive appendix is a coverage and triage index, not blanket rabbinic approval.

For a rabbi reviewing on a phone, tablet, or printed copy, use the polished [Hebrew prayer review PDF](output/pdf/Kavanah-Hebrew-Prayer-Review.pdf). It contains 30 source-backed candidates with approval checkboxes and correction space; translations and transliterations are intentionally excluded.

Do not change an entry to `approved` or promote generated candidates into runtime content without a named reviewer, review date, exact source edition, and explicit approval. Translations and transliterations need separate qualified language review; they are never represented as rabbinically approved.

## Run Locally

Requirements:

- Node.js 22 LTS recommended. Node 23 is not supported by several current Expo dependencies.
- npm.
- Expo Go for quick UI review, or an Expo development build for MMKV and complete notification behavior.
- Xcode for the iOS simulator or Android Studio for an Android emulator.

```bash
npm ci
npm start
```

Then scan the terminal QR code with Expo Go, or press `i` for the iOS simulator. Expo Go intentionally uses in-memory storage because native MMKV is unavailable there; use a development build when testing persistence.

## Important Commands

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npx expo-doctor
npm run prayers:source
npm run prayers:review
```

## Assistant Setup

The mobile app defaults to the Kavanah HTTPS gateway. Production secrets belong only in the server environment:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
EXPO_PUBLIC_ASSISTANT_API_URL=https://your-domain.example/api/assistant
```

The app removes recognizable email addresses, phone numbers, and common street-address patterns before transport. The backend moderates questions, limits output, disables OpenAI storage, and labels review status in the model context. The current in-memory daily request limit is not sufficient for a multi-instance public launch; use a shared durable limiter and a hard provider budget before release.

## Architecture

See [docs/architecture.md](docs/architecture.md) for data flow, trust boundaries, storage behavior, and external-service details.

The main layers are:

- `src/screens` and `src/components`: four-tab React Native UI.
- `src/store`: Zustand state and local persistence boundaries.
- `src/services`: prayer search, localization, zmanim, notifications, assistant transport, privacy helpers, and network policy.
- `src/data`: bundled prayer catalog, language definitions, and review provenance.
- `api/assistant.js`: serverless assistant gateway.

## Privacy

Kavanah has no account system, analytics SDK, advertising, or cloud sync. Precise coordinates are used on device and are not sent to the assistant. Assistant use is optional and consent-gated. Review [docs/privacy-policy.md](docs/privacy-policy.md), [docs/terms-of-use.md](docs/terms-of-use.md), and [SECURITY.md](SECURITY.md) before changing data flows.

Travel reminders are intentionally user-triggered. Mobile operating systems do not let Kavanah inspect route duration inside Apple Maps, Google Maps, or Waze. The custom URL above can be used from iPhone Shortcuts or an Android automation, while route details remain outside Kavanah.

Prayer Focus is also user-controlled. iOS does not let Kavanah silently switch system Focus; the app links to Shortcuts so the user can approve an app-open automation. Android links to the system Do Not Disturb controls. Kavanah never claims that system Focus changed unless the operating system did it.

## Release

Use `eas.json` for development, preview, and production builds. Before TestFlight, complete [docs/release-checklist.md](docs/release-checklist.md) and resolve all `NOW` work in [docs/product-backlog.md](docs/product-backlog.md).

## Current Limitations

- No Hebrew prayer is rabbinically approved in runtime yet.
- Translation providers are free, unofficial production dependencies and must be replaced with licensed or reviewed content.
- User MMKV data is not encrypted at rest yet.
- Expo Go does not persist MMKV data and cannot fully test notifications.
- Assistant request limits are process-local and can be bypassed by reinstalling or changing installation IDs.
- TLS pinning and production crash reporting are not implemented.
- Zmanim methods are shown, but local custom and rabbinic method selection are not implemented.
- Service collections need section-level content design; they must not be presented as complete single prayers.

## Circle backend

Circle's managed Postgres schema, security rules, and authenticated API are in `supabase/`. The app includes optional email-code accounts, approved connections, invitations, and a shared prayer feed. Backend configuration is required before accounts are offered; the app keeps private prayer usable without it.

See [backend deployment and operating guide](docs/social-backend.md) and [release checklist](docs/release-checklist.md). Run `npm run test:backend` for PostgreSQL policy/API tests and `npm run release:check` for the release configuration gate. No cloud project is provisioned just by cloning this repository.

### First-run sign-in and prayer view

The first launch shows a short animated welcome, then offers Apple (iOS), Google, email code, phone code, or local exploration. Account sign-in uses the existing Supabase project. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in a private `.env`, enable Apple, Google, email OTP, and phone OTP in Supabase Auth, and allow `kavanah://auth` (plus development redirect URLs) in Auth redirect settings. Configure Google OAuth credentials in Google Cloud and the Supabase Google provider, Apple sign-in capability/provider in Apple Developer and Supabase, and an SMS provider in Supabase before testing each method. Email OTP templates must contain `{{ .Token }}`. Do not put provider secrets in Expo variables.

The selected daily prayer view is saved locally and, after sign-in, to the user's Supabase Auth metadata. The three plain-language community choices map to the corresponding indexed siddur. The woman's daily view omits selected ritual-specific sections as a navigation default; this is not a religious ruling. Text and practice guidance remain under review, and users can change their choice in Profile. Account deletion and Circle setup remain available through the existing Circle screen.

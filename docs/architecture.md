# Kavanah Architecture

## Product Boundary

Kavanah is a local-first prayer utility. App access requires a non-anonymous Supabase account; prayer and zmanim calculations still use local data after sign-in. Circle enrollment and sharing remain optional. Owner evidence verifies the installed base/account-only schema and the deployed gateway's disabled state; hosted behavioral and native operational acceptance remain pending. The optional assistant remains a separate serverless service. There is no advertising or analytics SDK.

## Runtime Shape

```text
React Native screens and components
              |
         Zustand stores
              |
    -------------------------
    |           |           |
 local data   services   secure preferences
 MMKV/memory    |        SecureStore/biometrics
                |
        HTTPS external services
```

Expo Router's root layout loads fonts, safe-area context, the app error boundary, privacy providers, and the navigation theme. Protected route groups require a restored non-anonymous session and completed onboarding; sign-out revokes access immediately. The entry screen handles restoration/loading/retry and keeps policies/local deletion accessible before sign-in. The `(tabs)` route group exposes Home, Prayer, Times, Circle, and Profile through platform-native tabs, with a native stack inside each tab. Circle's account actions remain unavailable without backend configuration. The assistant lives inside a selected prayer instead of occupying its own tab.

## State and Storage

- `prayerStore`: bundled/cache prayer data, search results, reader selection, and bookmarks.
- `zmanimStore`: permission state, in-memory location, today display, and a seven-day upcoming schedule.
- `streakStore`: enabled practices, completion dates, milestones, and optional freezes.
- `settingsStore`: language, assistant consent version, and notification preference.
- `authStore`: biometric-lock preference and unlock behavior.
- `circleAccountStore` and `socialStore`: required Supabase session and optional Circle profile state, sharing preferences, and a local account-scoped outbox.

`src/services/mmkv.ts` creates separate `kavanah.user` and `kavanah.cache` stores in development/release builds. Expo Go falls back to memory because MMKV requires native code. Native user MMKV now migrates to `kavanah.user.secure-v1` using a random device-only SecureStore key. Release builds stop writing plaintext JSON mirrors. SQLite reader annotations and photos remain outside that encryption; do not claim that all local data is encrypted. Expo Go/web do not provide the native protection. Migration and interrupted-reset device tests remain release gates.

The biometric preference and account credentials use `expo-secure-store`. A legacy installation ID may remain until local reset; the assistant now uses a server-verified account hash. Biometric lock protects app access but is not equivalent to encrypting the MMKV database.

## Prayer Content and Provenance

`corePrayers.ts` is the runtime fallback catalog. Every prayer includes:

- searchable title, aliases, category, summary, and use case;
- Hebrew, display translation, and display transliteration tokens;
- source reference and license status;
- content scope, tradition, and Hebrew review status.

All current Hebrew review statuses are `pending`. Generated source-backed candidates remain separate in `generatedHebrewCandidates.json` and are rendered into `docs/rabbinic-hebrew-review.md`. The runtime must not silently replace its text with a remote or generated version before approval.

Sefaria name search can surface additional references. Those are explicitly `remote-unreviewed`, hydrate only when opened, and are not equivalent to approved prayer content.

## Localization

English display translations are bundled. Other languages are cached after translation and Hebrew pronunciation is adapted to the selected writing system when supported. The current free translation endpoints are suitable for prototyping, not production licensing or accuracy guarantees. A fallback always keeps the original display text available.

## Zmanim

`kosher-zmanim` calculates solar and halachic times locally from precise coordinates. The service normalizes both JavaScript `Date` values and Luxon-style `toJSDate()` values returned by the library. It calculates seven days so reminders continue across midnight.

The current method set includes 16.1-degree alot, Gra latest Shema/Tefilah, fixed-minute mincha definitions, sunset, Friday candle lighting, and Saturday 8.5-degree tzeit for Havdalah. Method labels remain visible because communities and authorities differ. User-selectable methods are not implemented.

If location permission is denied, the app reports that times are unavailable. It never substitutes another city.

## Notifications

Notifications are local and opt-in from Settings. Permission is requested in context after the user enables zmanim reminders. Scheduling replaces Kavanah's existing scheduled reminders with upcoming seven-day values. Expo Go cannot validate the complete native behavior; use a development build and physical device.

## Assistant Trust Boundary

The prayer reader builds a labeled context containing:

- app-authored purpose and summary;
- exact Hebrew review status and content scope;
- tradition, source reference, and license status;
- Hebrew prayer text;
- display translation/transliteration explicitly marked unreviewed.

The client sends its Supabase access token and both client and server redact recognizable PII. The server verifies the account with Supabase Auth, rejects anonymous/missing/deleted identities, validates bounded input, reserves durable PostgreSQL allowance before moderation/generation, limits output, streams text, sets `store: false`, cancels on deadline/disconnect, and returns no internal provider error details. Supplied prayer provenance is untrusted; the server never treats a client review label as authenticated approval.

Known backend limits:

- Account authentication is verified server-side on every assistant request. Per-account quota subjects are keyed hashes of the verified user ID; client installation/user IDs cannot change them. Global daily/lifetime caps still apply.
- Shared IP/account buckets, 60-second concurrency leases, duplicate UUIDs, and global counters are PostgreSQL transactions restricted to the server role.
- Redaction is best effort and cannot guarantee removal of all sensitive text.
- Structured outcomes and `/api/health` are implemented; dashboards, alert delivery, actual provider limits, and device crash reporting require owner setup.
- See `production-operations.md` for enabling the service and the separate hosting/database cost controls.

## Network Policy

`secureFetch` blocks non-HTTPS endpoints, enforces timeouts, retries only network errors and recoverable HTTP statuses (`408`, `429`, and `5xx`), and immediately rejects ordinary client errors. Local HTTP is permitted only for the assistant during development. Managed JavaScript does not provide certificate pinning or a TLS 1.3 guarantee.

## Reliability and Accessibility

- `AppErrorBoundary` offers calm in-app recovery from render failures.
- Startup and empty states communicate what is happening.
- Interactive controls use 44-point or larger targets where practical, accessibility labels, and consistent haptic tones.
- App and modal motion respects the operating-system reduced-motion preference.
- Hebrew has a dedicated font and right-aligned reader treatment.

Dynamic Type, VoiceOver reading order, Android TalkBack, full RTL layout, and iPad split-size behavior still require device QA.

## Deployment

The October 9 [infrastructure decision](infrastructure-decision.md) recommends retaining Supabase Pro with reviewed fixed compute, Spend Cap enabled and paid AI disabled while completing the release gates. It compares alternatives and defines upgrade/migration triggers; selecting a managed provider does not establish application readiness.

- Mobile: Expo SDK 57 and EAS profiles in `eas.json`.
- Assistant: Vercel serverless function configured by `vercel.json`.
- Required accounts / optional Circle: Supabase Auth, PostgREST RPC, PostgreSQL migrations, and the invitation endpoint. See `docs/social-backend.md` for the deployment and acceptance contract.
- Required production secret: `OPENAI_API_KEY` on the backend only.
- Required mobile environment: `EXPO_PUBLIC_ASSISTANT_API_URL` in EAS.

Production submission remains blocked until content review, licensed localization, hosted acceptance of the implemented durable assistant limits, stable legal/support URLs, device testing, dependency review, and recovery/privacy gaps are closed. See `production-readiness-audit.md` for the current verdict and evidence.

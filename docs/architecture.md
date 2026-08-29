# Kavanah Architecture

## Product Boundary

Kavanah is a local-first prayer utility. The launch architecture deliberately has no accounts, cloud profile, advertising, analytics, or social feed. The only user-initiated external processing is prayer search/localization and the optional assistant.

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

`App.tsx` loads fonts, safe-area context, the app error boundary, privacy providers, and the tab navigator. `RootNavigator` exposes Home, Prayer, Zmanim, and Profile. The assistant intentionally lives inside a selected prayer instead of occupying its own tab.

## State and Storage

- `prayerStore`: bundled/cache prayer data, search results, reader selection, and bookmarks.
- `zmanimStore`: permission state, in-memory location, today display, and a seven-day upcoming schedule.
- `streakStore`: enabled practices, completion dates, milestones, and optional freezes.
- `settingsStore`: language, assistant consent version, and notification preference.
- `authStore`: biometric-lock preference and unlock behavior only. There is no account/session flow.

`src/services/mmkv.ts` creates separate `kavanah.user` and `kavanah.cache` stores in development/release builds. Expo Go falls back to memory because MMKV requires native code. User MMKV data is currently not encrypted at rest. This must be resolved before claims of encrypted local data are made.

The biometric preference and pseudonymous assistant installation ID use `expo-secure-store`. Biometric lock protects app access but is not equivalent to encrypting the MMKV database.

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

The client redacts recognizable PII and sends a pseudonymous installation ID from SecureStore. `api/assistant.js` validates request shape, runs OpenAI moderation, applies a short source-bounded prompt, limits output, streams text, sets `store: false`, and returns no internal provider error details.

Known backend limits:

- Rate limiting is process memory, not shared durable state.
- The installation ID is not authenticated and can be regenerated.
- Redaction is best effort and cannot guarantee removal of all sensitive text.
- No production observability or budget circuit breaker exists.

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

- Mobile: Expo SDK 54 and EAS profiles in `eas.json`.
- Assistant: Vercel serverless function configured by `vercel.json`.
- Required production secret: `OPENAI_API_KEY` on the backend only.
- Required mobile environment: `EXPO_PUBLIC_ASSISTANT_API_URL` in EAS.

Production submission remains blocked until content review, licensed localization, durable assistant limits, stable legal/support URLs, device testing, and privacy/security gaps are closed.

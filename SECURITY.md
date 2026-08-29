# Kavanah Security Model

Kavanah is designed around data minimization: precise location is used on device for zmanim, the current release has no accounts, and assistant inputs are redacted before external transport.

## Implemented Controls

- HTTPS-only requests are enforced by `secureFetch`.
- Optional biometric unlock is implemented with `expo-local-authentication`, with its preference stored in `expo-secure-store`.
- The pseudonymous assistant installation ID is stored in `expo-secure-store`.
- MMKV separates user state from cached public text data. User MMKV values are not encrypted at rest yet and must not be described as encrypted.
- Email addresses, phone numbers, street addresses, and precise coordinates are masked before assistant use.
- Zmanim and tefillin reminders are scheduled as local notifications.

## Release Hardening

The following are known release gaps, not implemented controls:

- Replace process-memory assistant rate limits with shared durable enforcement and a hard provider budget.
- Encrypt or further minimize local user history and add a clear-local-data control.
- Add privacy-safe crash reporting that excludes prayer questions, coordinates, and religious activity.
- Treat client PII redaction as best effort; never promise that all sensitive text can be detected.

Expo managed JavaScript cannot fully enforce TLS 1.3 negotiation or certificate pinning by itself. Production release builds should add native network security configuration during the config-plugin or prebuild phase:

- iOS: App Transport Security with TLS 1.3-capable endpoints, plus certificate or public-key pinning in the native networking layer.
- Android: Network Security Config disallowing cleartext traffic, with certificate pins for primary endpoints.
- Future account backend: short-lived access tokens, refresh-token rotation, audience and issuer validation, complete account deletion, and no precise location logging.

## Primary External Endpoints

- `https://www.sefaria.org` for public Jewish text synchronization.
- The prayer assistant uses the Kavanah-controlled `api/assistant.js` HTTPS gateway for moderation, request limits, prompt enforcement, and source-bounded responses. The OpenAI key remains server-side.

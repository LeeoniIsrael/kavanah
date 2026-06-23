# Kavanah Security Model

Kavanah is designed around data minimization: precise location is used on device for zmanim, OAuth tokens are stored in native secure storage, and assistant inputs are redacted before external transport.

## Implemented Controls

- HTTPS-only requests are enforced by `secureFetch`.
- OAuth token material is stored with `expo-secure-store`.
- Optional biometric unlock is implemented with `expo-local-authentication`.
- MMKV separates user state from cached public text data.
- Email addresses, phone numbers, street addresses, and precise coordinates are masked before assistant use.
- Zmanim and tefillin reminders are scheduled as local notifications.

## Release Hardening

Expo managed JavaScript cannot fully enforce TLS 1.3 negotiation or certificate pinning by itself. Production release builds should add native network security configuration during the config-plugin or prebuild phase:

- iOS: App Transport Security with TLS 1.3-capable endpoints, plus certificate or public-key pinning in the native networking layer.
- Android: Network Security Config disallowing cleartext traffic, with certificate pins for primary endpoints.
- Backend: short-lived access tokens, refresh-token rotation, audience and issuer validation, and no precise location logging.

## Primary External Endpoints

- `https://www.sefaria.org` for public Jewish text synchronization.
- Future LLM gateway should be a Kavanah-controlled HTTPS endpoint that performs server-side source retrieval, audit logging without PII, and prompt enforcement.

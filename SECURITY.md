# Kavanah security model

Core prayer access is local-first. Circle accounts and the assistant are optional. Religious activity, audience/community preferences, questions, location, photos, and annotations can be sensitive even without a real name.

## Repository-enforced controls

- Supabase JWT ownership, explicit RLS, denied direct writes, private-schema isolation, fixed-path definer RPCs, bounded/keyset feeds, database write quotas, unique event constraints, and authenticated cascading account deletion.
- Shared locks for connection approval/request/block races and the 200-contact cap. Completion retries keep their event IDs and originating account.
- The assistant fails closed until its server-only configuration and durable admission RPC work. Global daily/lifetime request caps, IP/installation quotas, concurrency leases, payload/output caps, deadlines, cancellation, duplicate UUIDs, moderation, and no automatic paid retries precede generation.
- Server-only OpenAI/Supabase credentials. Public Supabase publishable keys are identifiers, not an authorization boundary. Never put server secrets in `EXPO_PUBLIC_*`.
- Native user MMKV uses a random SecureStore key; legacy MMKV and plaintext mirrors migrate before removal. SQLite annotations/photos remain protected by the OS rather than by MMKV encryption. Expo Go/browser previews have different storage guarantees.
- Optional biometric app access, contextual location/notification/photo permission prompts, assistant consent version 2, no analytics/advertising SDK, best-effort client/server PII redaction.
- In-app local-data clearing, account-specific file cleanup, safe account switching during deletion, bounded outbox batches, HTTPS/deadline/response-size policies, privacy-safe server outcome logging, and escaped/offline reader HTML.

## Boundaries and launch gates

No claim of complete PII detection, authenticated source provenance, regulatory compliance, or absolute security is made. Request caps constrain assistant work, not all hosting/database traffic. Secrets, edge limits, Supabase Auth/email/SMS settings, backup restores, monitoring delivery, moderation staffing, native migration/accessibility QA, licenses, and legal/business details require deployment evidence. See [audit](docs/production-readiness-audit.md) and [operations](docs/production-operations.md).

Use supported OS TLS verification. Certificate pinning is not implemented and is not automatically required: introducing it without a rotation/recovery plan can cause outages. Native network, backup, and device protection settings need release-build verification.

TODO(owner): provide a private security-reporting contact. Do not post tokens, questions, religious activity, or identifying evidence to public GitHub issues.

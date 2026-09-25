# Circle backend and production handoff

Status: implemented and tested locally; **not provisioned or verified in a hosted Supabase project**. This document is not a launch approval. The current Expo preview has no Supabase configuration and deliberately keeps social accounts unavailable.

## Architecture

Kavanah uses Expo → Supabase Auth + HTTPS PostgREST RPC → managed PostgreSQL. There is no custom always-on application server, Redis, load balancer, media pipeline, or realtime subscription for Circle. The existing Vercel assistant remains separate; its deployment/rate limiting still needs production review.

- Auth: verified email codes, no password database or address-book permissions. Native sessions use Keychain/Keystore through Expo SecureStore. Web sessions are memory-only. Biometric locking remains a separate local feature.
- Profiles: unique normalized handle and display name, private by default. Exact-handle requests avoid a browsable public directory. Names are visible to accepted connections and pending request participants. A person who knows a handle can request a connection; that limited discoverability is intentional.
- Connections: mutual approval, removal, and bilateral blocking. A circle supports 200 accepted/pending connections per account, enforced under database locks. No unilateral following. Requests are visible in-app; remote push is not implemented.
- Activity: completion events, selected weekly quotes, and streak milestones. No arbitrary post body or caption endpoint exists. Prayer names and quote passages come from the server catalog. Core English/Hebrew passages can be quoted; remote/unreviewed translations cannot be uploaded as arbitrary text. Expand the catalog only after content/license review.
- Sharing: off by default. First-ever means the first completion on this account, respecting the device's already-prayed flag at enrollment. Turning sharing on later never announces a private earlier prayer. First-ever status, completion idempotency, and milestone uniqueness survive post removal and device changes. Server streak milestones are consecutive active days across prayers, not independent per-habit streaks.
- Private completions begin syncing after enrollment. Joining never uploads past local history or prior posts. Local calendar data is retained independently; restoring the full private calendar on a second device is not implemented yet.
- Time: UTC start and completion instants; day boundaries use the account's validated IANA timezone chosen at enrollment. Timing is self-reported, not proof of physical prayer. Future timestamps and sessions over 24 hours are rejected. Offline completions have a 30-day acceptance window. Travel-timezone changes are not currently exposed.
- Feed: 20 updates/page, timestamp+UUID keyset cursor; at most 50 requested by the API. Reads fetch recent rows per accepted contact using `(owner, created_at, id)` indexes. No global timeline scan, offset pagination, N+1 author lookup, or fan-out writes. The mobile screen replaces the previous page to bound memory; Refresh returns to newest.
- Writes: all client table mutations are denied. Authenticated, narrowly scoped SQL functions validate input. Private tables are excluded from the API schema and have no client table grants. Definer functions fix `search_path` and expose no dynamic client SQL.
- Abuse controls: shared database counters, not process-local counters. Per account/hour: 20 connection requests, 120 completions, 20 quote changes, 10 reports, 60 preference/connection changes. Supabase Auth's separate email/IP controls must be configured before launch. These are a starting policy, not a load-test result.
- Offline: durable account-scoped outbox, serialized consent changes before later completions, explicit JWT binding to the originating account, retry on foreground/manual retry. No automatic backfill of anonymous/device-only activity. A rejected content change can be skipped explicitly; failed sharing-preference changes cannot be skipped ahead of later uploads. A permanently rejected completion remains in local activity. Unsent changes resume only when their account signs back in.
- Invitations: a native share sheet; the user chooses recipients and sends. No automatic messages, address-book upload, rewards, tracking, or referral leaderboard. `api/invite.js` renders a lightweight landing page with a handle, an installed-app link, and a real App Store link only when configured. The invitation is not a credential and never auto-accepts a connection.
- Safety: report queue in `private.reports`, block/remove controls, in-app irreversible account deletion. Deletion cascades through profile, private completions, activity, connections, blocks, counters, and reports; it clears the account's local outbox/profile cache and signs out. Local device practice remains intentionally separate. Backups retain deleted records until their retention window expires.

## Cost and scaling

Use a dedicated Supabase project in the owner’s organization, near the initial audience. Start with a single primary region; indexes and bounded feeds matter more here than a fleet of load balancers. No photo uploads keeps storage/egress predictable.

As checked September 25, 2026, [Supabase Pro](https://supabase.com/pricing) starts at $25/month for one Micro project, with 100,000 monthly active users, 8 GB database disk, 250 GB egress, and seven days of daily backups. Overage, SMTP, domains, Apple membership, assistant AI, and any added monitoring are separate. Free projects can pause after inactivity and lack automatic backups, so Free is suitable for development, not this public launch. No plan was purchased.

Track p95 feed latency, Postgres CPU/connections, disk growth, error rate, email delivery, auth throttles, report age, and retry backlog. Measure 100/500/1,000 concurrent sessions with realistic private circles before claiming capacity. At sustained database pressure, tune plans/indexes, archive old private completion data under an explicit retention policy, then increase compute. Add read replicas or feed materialization only after measurements justify the complexity. Unlimited API requests do not mean unlimited compute.

## Deploy in the owner's account

1. Create a Supabase project (region and billing require the owner's choice). Enable organization MFA, spend cap, and least-privilege team access. Keep staging and production separate.
2. Use Node 24 LTS. Install the Supabase CLI, then `supabase login` and `supabase link --project-ref YOUR_PROJECT_REF`. Never commit CLI tokens, database passwords, or service-role keys.
3. Review the migrations, run `npm run test:backend`, then `supabase db push`. This applies the schema and generated catalog. `npm run backend:catalog` regenerates the catalog for review; it is not a content approval.
4. In hosted Auth, use custom SMTP with a verified sending domain. Set the email OTP templates (both new-user confirmation and magic-link sign-in) to include `{{ .Token }}`; the app verifies codes rather than browser links. Local template configuration alone does not configure hosted email. Set sensible expiry, resend/IP limits and bot protections; disable unused anonymous/provider sign-in. Verify real delivery to multiple mail providers. See [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless).
5. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the EAS production environment. Only the publishable key belongs in an app bundle; never a service-role/secret key. Keep the `private` schema excluded from exposed schemas. Run the hosted database advisor and verify grants/RLS after deployment.
6. Deploy `api/invite.js` with the existing Vercel project, configure `APP_STORE_URL` when the actual listing exists, and set `EXPO_PUBLIC_INVITE_URL` to its HTTPS URL. Verify sharing, Safari landing, installed-app opening, missing-app behavior, and incoming-handle prefill. Universal links/deferred install attribution are not implemented; a new user can keep the shared handle and enter it after install.
7. Assign an operator and a private support address. Review `private.reports` at least daily, remove violating posts, suspend abusive accounts in `private.suspensions` (immediate feed/write restriction) and through Auth admin tools, and record resolutions. Set the real support contact in the store listing and policy. No staffed moderation operation is implied by a report table.
8. Restore a staging backup and verify deletion behavior, including restoring exclusions for deleted accounts. Run two-account tests on real devices over the hosted API: email delivery, empty account, private first prayer, every prayer, milestones, quotes, pending/accepted/blocked connections, pagination, sign-out/offline/reinstall, expired tokens, report handling, and deletion. Database unit tests do not exercise email delivery, PostgREST deployment configuration, Apple hardware, or operational staffing.
9. Run `npm run release:check`, complete `docs/release-checklist.md`, build signed TestFlight binaries, and test VoiceOver/Dynamic Type/keyboard/offline behavior. Only then evaluate production readiness.

## Operator queries (Supabase SQL editor only)

```sql
select r.id, r.target, r.activity_id, r.reason, r.created_at
from private.reports r where reviewed_at is null order by created_at;
-- Inspect the referenced activity/profile with authorized staff access.
-- Remove confirmed violating content by its exact UUID, then mark the report reviewed.
-- Immediate restriction, after verifying the exact account and evidence:
-- insert into private.suspensions(user_id, reason) values ('REPLACE_WITH_UUID', 'Operator decision') on conflict(user_id) do nothing;
-- Remove suspension to reinstate; account deletion remains available while suspended.
-- Do not paste identifying report contents into public GitHub issues.
```

User-generated profile names still need moderation even though feed captions are unavailable. [Apple requires UGC safeguards](https://developer.apple.com/app-store/review/guidelines/#user-generated-content) and [in-app account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app). Implementation is one part of compliance; policies and actual operation must match it.

## Validation and current limits

`npm run test:backend` executes the real migrations in PostgreSQL via PGlite, with isolated auth roles and JWT subjects. It tests RLS/private grants, forged writes/quotes, duplicate completion, first-ever semantics, milestone computation, approval, blocking, keyset feed visibility, and deletion cascades. Outbox tests cover account isolation, retry identity, consent ordering, and in-flight account switches.

Not yet verified: live Supabase provisioning, custom SMTP/OTP, HTTPS API round trips between devices, production load/backups, operational moderation, or TestFlight/App Review. Native preview was inspected without a configured cloud backend; the Mac remained locked, preventing touch-driven checks. Do not call this ready for real users until these gates are closed.

# Production operations and recovery

October 6, 2026. This is a deployment contract, not evidence that the hosted services have been configured. No provider credentials were available during this audit. Complete the acceptance checks below before public launch.

## Deploy the safeguards

1. Review and back up the existing Supabase project. Apply all repository migrations in order, including `202610060001_production_safeguards.sql`, through the normal migration process. Do not paste a service-role key into the mobile environment or source control.
2. In Supabase API settings, expose only the schemas needed by Circle (`public`); exclude `private` and the unused `graphql_public`. Disable automatic exposure of new tables so future objects require explicit reviewed grants. The repository's local API configuration caps returned rows at 200. Verify the hosted equivalent, grants, RLS, and database advisor. The assistant admission functions are executable by `service_role` only; `anon` and `authenticated` must be denied.
3. In Vercel's server environment set `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5.6-luna`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a cryptographically random `ASSISTANT_RATE_LIMIT_SECRET` of at least 32 characters. Use a restricted OpenAI project key. The Supabase service-role credential is powerful: restrict team/environment access and rotate it through a tested rollout.
4. Choose explicit positive integer `ASSISTANT_DAILY_REQUEST_LIMIT` (at most 10,000) and `ASSISTANT_TOTAL_REQUEST_LIMIT` (at most 100,000) using current OpenAI pricing and an owner-approved allowance. There are deliberately no permissive defaults. The total counts all admitted attempts, including moderation rejection, upstream failure, and disconnect. It survives deployments and midnight and is never automatically refunded. Raising the configured total intentionally authorizes more work; it does not reset the stored count.
5. Leave `ASSISTANT_ENABLED=false` while applying the migration and deploying the gateway. Missing/invalid configuration or unavailable admission storage produces an unavailable/error response with no OpenAI calls. Verify this using an isolated staging project and staging provider key before setting `ASSISTANT_ENABLED=true`. For an incident, set it back to `false` and deploy; also revoke the provider key if deployment is unavailable. In-flight calls can continue until their deadline/provider cancellation takes effect.
6. Verify Vercel overwrites `x-vercel-forwarded-for` for direct and proxied traffic on the actual deployment. The gateway accepts that header only when `VERCEL=1`, otherwise the socket peer address. It never trusts client `x-forwarded-for`. Another host requires a verified adapter; do not silently trust forwarded headers there. Test IPv4/IPv6 and malformed/forged headers.
7. Set the mobile HTTPS assistant URL and rebuild. Older clients can omit a request UUID; new clients send one for deduplication. Native user-data migration requires a signed development/release build, not Expo Go.
8. The Vercel configuration explicitly disables an Expo build for the API deployment. `npm run build` is a separate mobile/web bundle verification command. Do not publish `dist/` to the API project accidentally; mobile bundles belong in the native release, and a web deployment needs its own review.

### SQL editor deployment for the verified existing project

When CLI access is unavailable, [docs/sql/production-safeguards.sql](sql/production-safeguards.sql) is the generated, single-transaction version of the October 6 migration. It has five-second lock and thirty-second statement limits, records the migration version if the existing Supabase CLI history table is present, and notifies PostgREST on commit. An error rolls back the transaction; repeat application fails instead of resetting counters. Run the complete file once in a new SQL editor query, then verify the table/RPC grants and hosted behavior. This applies only the new safeguards; it assumes the original Circle schema/catalog/grant migrations already exist. The assistant still needs its gateway rollout and explicit allowance before activation.

Regenerate with `node scripts/backend/deploymentSql.mjs`; `npm run test:backend` verifies that the file matches the canonical migration and tests rollback/history behavior. If the project has no CLI migration history table, this script does not invent one. Before introducing CLI migrations later, reconcile all already-applied versions using Supabase's supported migration-history repair workflow rather than replaying them.

After applying, run [the read-only verification](sql/verify-production-safeguards.sql) in a separate query. Expect six PASS rows: all 15 tables' RLS/client grants and the five changed routines' exact source fingerprints, fixed search paths and execution grants. The check makes no provider call or allowance reservation. It does not prove cross-user policy behavior, JWT/API deployment or native sign-in; the two-account acceptance tests remain necessary. Its generated expectations are checked in the backend test runner, including deliberate grant/RLS/function-code regressions.

### Owner-supplied dashboard evidence — October 8, 2026

- Scheduled-backup screenshot lists daily physical backups; the newest shown was October 6, 2026 at 04:48:13 UTC (12:48:13 a.m. Eastern). A current restore drill remains outstanding.
- The Point in time tab shows an available add-on and an Enable button: PITR is disabled. Enabling it and its additional cost remain an owner recovery/budget decision.
- The metadata query shows all three public Circle tables installed with RLS enabled, anonymous SELECT denied, authenticated SELECT granted and direct authenticated INSERT/UPDATE/DELETE denied.
- Before deployment, all nine original private tables existed with no anonymous/authenticated read or authenticated write grants; RLS was disabled there and all three assistant tables were absent. This establishes the starting state, not proof of cross-user policy behavior.
- The owner then supplied the SQL editor result `Production safeguards applied`, confirming the single-transaction script reached its post-commit status.
- The follow-up installed-state screenshot shows all six PASS rows: all 15 expected tables match RLS/client grants, and all five changed functions match their source fingerprints, fixed search paths and role grants. Hosted Data API schema exposure/row limits and account/API behavior still require verification. Backup restoration, provider usage controls and native acceptance remain open.
- The Data API Settings screenshot shows a Max rows field of 200, extra search path `public, extensions`, automatic exposure of new tables enabled, and an exposed-schema selector reporting two of three schemas. The open-menu follow-up confirms `public` and `graphql_public` selected, with `private` excluded. The application uses PostgREST table/RPC calls and has no GraphQL integration. The owner subsequently reports completing the requested changes: only `public` exposed, automatic new-table exposure disabled, Max rows retained at 200, and settings saved/refreshed. These changes are owner-reported; actual authenticated/API access still requires testing. The earlier table/function selectors displayed zero of 15 tables and zero of 16 functions and have not been changed as part of these instructions.
- The Auth Providers screenshot shows Email, Apple and Google enabled; Phone and the other visible providers are disabled. Anonymous sign-in status is outside this screenshot. The checked-in preview/production build profiles enable the Apple UI; email/Google/phone UI flags remain optional and could be supplied through external build configuration. No existing provider has been disabled during this review. Before launch, reconcile intended sign-in methods and existing identities, then verify delivery quotas, server-side Auth rate limits and provider flows; hiding a UI option does not disable its Auth endpoint.

### Enforced assistant bounds

| Scope | Bound |
| --- | --- |
| All admitted work | Explicit daily cap and non-resetting lifetime cap |
| Global burst | 30 admissions/minute |
| Active work across all instances | 5 leases; each expires after 60 seconds if cleanup fails |
| One installation | 10/day and 1 active request |
| One connection IP | 30/day and 2 active requests |
| Request | 64 KiB JSON; 1,000-character question; 18 context items; 1,400 characters/item; 18,000 total context characters |
| Provider output | 350 tokens; 256 KiB maximum provider body/stream |
| Execution | 25 seconds for admission, moderation and streaming; 2 seconds for lease cleanup; Vercel maximum 30 seconds |
| Retry behavior | No automatic OpenAI retries or refunds; client POST requests are not automatically replayed |
| Duplicate request UUID | Rejected while its record is retained, including after lease release |

The installation identifier is not authentication. Attackers can rotate IDs and IPs and exhaust the public assistant's quota; the global caps still stop further admitted work. Prayer reading remains available. Anonymous assistance is a product tradeoff, not an authenticated entitlement.

A conservative upper estimate for generation is `N × (66,000 × input_price_per_million + 350 × output_price_per_million) / 1,000,000`, where N is the remaining lifetime allowance. This deliberately uses a pessimistic input-byte/token ceiling including the system prompt; actual tokenization is usually smaller. Verify current model availability, pricing, moderation charges, currency/tax and provider billing semantics before choosing N. The count is a work limit, not an exact dollar meter or cancellation guarantee.

## Provider hard limits and abuse controls

- **Vercel:** configure edge firewall rules/rate limits for `/api/assistant` before invocation, plus public invitation and health routes. Test that rejected requests do not reach the function. Keep 64 KiB request rejection at the gateway; the platform can parse larger bodies before it runs. Configure supported spending-triggered project pausing/hard usage limits and test the actual pause behavior. If the plan offers only alerts, it has no proven bill ceiling: use a provider with enforceable limits or keep the paid endpoint disabled. Record the plan, scope, pause delay and resume authority. Budget alerts alone are insufficient.
- **Supabase:** enable the applicable organization spend cap, verify what it covers, and document fixed compute and excluded charges. Require admin MFA/least-privilege access, limit Auth signup/token/OTP/IP traffic, keep unused anonymous/email/phone providers disabled, and configure bot protection through a supported Auth flow before enabling costly OTP delivery. Verify PostgREST statement timeouts, max rows and database connection/compute limits. Database admission attempts themselves use compute even when OpenAI allowance is denied.
- **OpenAI:** use a dedicated project/key, model permissions and provider rate limits. Verify whether the account has an enforceable hard credit/spend ceiling. Treat soft budgets as alerts. Keep the repository lifetime cap and kill switch even with provider controls.
- **Email/SMS:** none are sent by application cron or marketing code. If enabled through Supabase Auth, use verified transactional SMTP/SMS services with provider delivery quotas, bot/IP protection, and a hard delivery/spend stop. Keep marketing separate; enabling phone sign-in is not marketing consent.
- **Web/CDN:** native assets are delivered through signed builds. A future public web export is about 10 MB of JavaScript before transfer compression and needs caching/bandwidth controls. SQLite on web needs the appropriate cross-origin isolation headers; a successful export does not prove browser runtime support. The invitation page has security headers and no tracking, but is dynamic and still invokes hosting resources.
- **EAS/GitHub:** restrict build/deploy access. CI has a 15-minute timeout and read-only GitHub permissions. Repeated commits/builds can consume build minutes or paid EAS credits; set account-level quotas/concurrency/billing controls. No application path triggers EAS builds.

## Retention and monitoring

The assistant tables contain keyed IP/installation hashes, request UUIDs, short concurrency leases and aggregate counters, not prompts. Admission prunes previous-day buckets and request records older than two days. With no subsequent admission, records can remain. Before launch, enable and verify a scheduled cleanup through Supabase's supported scheduler (for example, enable `pg_cron`, then schedule the following once daily under an authorized operator role):

```sql
select cron.schedule('kavanah-assistant-retention', '15 3 * * *', $job$
  delete from private.assistant_buckets where day < (now() at time zone 'UTC')::date;
  delete from private.assistant_requests where created_at < now() - interval '2 days';
$job$);
-- Verify one active job with this name and inspect job-run failures.
```

Do not delete/reset `private.assistant_budget` as part of retention. Finalize provider log/backup retention and private support contact in the policy. Cloud practice is currently retained until account deletion; choosing an additional automatic retention window is a business/legal decision.

`/api/health` is a cheap liveness/configuration check and makes no database/OpenAI request. It does not establish provider connectivity. Route structured `assistant_request` outcomes and cleanup failures to a private log dashboard: watch errors/timeouts, p95 duration, budget/rate exhaustion and cleanup failures. Never add prompts, raw IPs, installation hashes, tokens or arbitrary exception messages to logs. Configure actual alerts and an on-call owner; a log statement alone sends no notification. Review Circle report age and outbox failures. Native release crash reporting remains unconfigured; review its data collection before adding it.

## Backup and recovery

Critical cloud data comprises Auth users/identities, Circle profiles/settings/connections, private completions, activity, reports/suspensions and the assistant budget. Git contains schema/catalog/configuration, not these records. No Supabase Storage buckets or cloud photo uploads exist in this repository. Local photos, practice and SQLite annotations are device-only and cannot be restored from Supabase.

Before launch:

1. Verify the actual project plan, successful daily backups, retention, encryption, access controls, and PITR availability/RPO against the owner's tolerance for losing religious-practice data. Do not infer an enabled restore strategy from a historical Pro-plan statement. Enable PITR if the required RPO needs it and approve its additional cost.
2. Keep an encrypted, access-controlled backup/export strategy for Auth data and application schemas, including `private`, roles/grants and migration history. Verify that the chosen backup includes Auth; schema-only dumps are not user backups. Keep deployment secrets in a secrets manager with a separate recovery process, never Git.
3. Perform an isolated restoration into a new private project/database. Keep external sending, signup and the assistant disabled. Apply/check necessary migrations and grants, run policy tests with two test identities, and verify relationships, row counts, catalog, account deletion, blocking and feed pagination. Record a dated restore result and actual RPO/RTO; no restore drill was performed during this audit.
4. Before restoring into service, preserve and reconcile deletions after the snapshot using trusted operator/provider records. Do not resurrect deleted users, posts or sharing choices. If a reliable deletion record cannot be obtained, public restoration remains blocked pending a privacy-safe reconciliation plan.
5. Keep the assistant disabled after a restore. Its snapshot may contain an older spending count. Reconcile the consumed allowance from trusted usage records and set the stored total to at least that conservative floor. If prior consumption is uncertain, set the total to the configured lifetime limit and authorize a new allowance only after review. Never reset it to zero to recover availability.
6. Test the private restored API without routing production traffic, then perform an owner-approved cutover. Retain a rollback path that preserves writes made after cutover. Monitor errors and confirm current backup jobs again.

For native release QA, verify encrypted-MMKV migration on existing installs, cold restart, missing/locked key behavior, Android backup exclusion, clear-local-data partial failures/retry, late location/picker callbacks, sign-out, cloud deletion during account switching and reminder cancellation. The current app intentionally keeps public downloaded siddur text when clearing personal local data. OS backups, exported Photos and content shared to other apps need their own deletion handling/disclosure.

Local reset waits for pending personal SQLite writes before clearing records. Supabase local sign-out can still require a reachable Auth service; if it fails, reset reports partial failure and stays on the retry screen with writes blocked. Test offline and expired-session behavior on the signed build; do not claim deletion completed while this screen reports an error.

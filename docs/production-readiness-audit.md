# Production-readiness audit

October 6, 2026. Repository assessment and implemented remediation; not a certification or evidence of hosted deployment. **Verdict: NOT READY for a public production launch.** The local-first architecture is preserved. The main code safeguards are implemented and tested, but content approval, hosted acceptance, native-device QA, dependency review, recovery verification and owner/legal decisions remain blocking.

## Architecture and scope

Kavanah 0.2.0 is an Expo SDK 57 / React Native 0.86 / React 19 prayer companion using Expo Router, Zustand and NativeWind. Core prayer reading, practice tracking and zmanim work without an account. Native releases use MMKV, SQLite and app-local files; credentials and security preferences use OS SecureStore. Expo Go and browser previews have different storage guarantees.

Optional Circle uses Supabase Auth, PostgreSQL and PostgREST RPC. Apple sign-in is configured in EAS; email, phone and Google are feature/configuration gated. The Vercel assistant makes OpenAI moderation and streamed Responses requests. The other public routes are an invitation page and a new health endpoint. Mobile releases use EAS; repository CI uses GitHub Actions. No production provider credentials were available, so no migration, dashboard change or live-provider acceptance is claimed.

Public text comes from bundled catalogs and Sefaria. Non-English localization uses Google's unofficial translation endpoint and MyMemory fallback. Expo location/reverse-geocoding supplies coordinates; kosher-zmanim calculates times locally. Notifications are local OS schedules. Photos are picked/captured locally and exported only through user-selected OS destinations. Other native SDKs provide biometrics, fonts, browser authentication, clipboard, sharing, media-library access, WebView reading, animation and graphics.

No payment provider, subscription billing, advertising, analytics/tracking SDK, marketing email/SMS sender, Supabase Storage bucket, cloud photo upload, server queue, cloud worker, server cron or realtime subscription is defined. The Circle outbox is a device-local queue. The foreground reminder reconciler runs hourly, with a finite seven-day schedule. A retention cron is documented for owner configuration; it has not been installed.

### Major flows and trust boundaries

1. Onboarding saves local prayer identity/community preferences; reading uses bundled or cached text. Remote search/text downloads are bounded HTTPS reads and retain licensing/review labels.
2. Completing a practice updates device history. Enrolled Circle users optionally enqueue account-bound commands; the server derives the owner from `auth.uid()`, validates catalog/event/time values and applies sharing choices. Previous local history is not uploaded on enrollment.
3. Joining Circle authenticates with a configured provider, creates a constrained unique handle/profile, then requests/accepts connections. Reads pass database policies; writes pass constrained RPCs. Blocking revokes visibility and removes the connection. Feed pages use a stable keyset cursor.
4. Optional assistance requires versioned user consent. The client sends a bounded question/context and installation/request identifiers. The server validates and redacts, reserves durable shared allowance, then calls moderation and generation. Client identifiers are abuse signals, not authenticated authorization.
5. Optional location computes times locally; local reminders require contextual permission. Photo/story flows use contextual picker/share actions and clean temporary capture files.
6. Cloud account deletion uses an authenticated database function deleting `auth.users` with related-record cascades. Local reset is a separate confirmation that clears personal device records, signs out and cancels reminders, with visible failure/retry states.

## Prioritized findings and disposition

| Priority | Finding | Disposition |
| --- | --- | --- |
| CRITICAL | Process-local assistant quotas could be bypassed across instances/restarts; no durable overall allowance | Fixed with transactional PostgreSQL admission, mandatory daily/lifetime caps, global/IP/installation/concurrency bounds, duplicate UUIDs and a fail-closed kill switch |
| CRITICAL | Provider requests/streams could remain active or be repeated without firm bounds | Fixed execution/body/output limits, abort on disconnect, bounded client networking, no automatic paid retry or POST replay; hosting admission/bill caps still require external setup |
| CRITICAL | Native personal MMKV and JSON mirrors lacked the claimed storage protection | Added device-key encrypted MMKV migration and stopped native plaintext mirrors; missing-key files are preserved. SQLite annotations/photos remain outside this encryption and require a threat-model/device review |
| CRITICAL | Concurrent connection/request/block operations could violate block or connection-cap invariants | Fixed stable pair locking and post-lock authorization checks; real multi-connection PostgreSQL tests pass |
| CRITICAL | Hosted policies, backup restore and deletion reconciliation could not be established | Local policy/migration tests pass; actual provider configuration and an isolated restore drill remain launch blockers |
| HIGH | Data removal had incomplete local cleanup and competing asynchronous writes | Added clear-local-data flow, SQLite cleanup, file/session/reminder removal, write suspension, late-callback invalidation, deduplicated cloud deletion and account-switch protection |
| HIGH | Offline outbox and some query/response processing could grow without limits | Bounded queue and flush batches, reserved consent update capacity, response limits, bounded schema traversal, indexed/chunked local search and bounded milestone history scan |
| HIGH | SDK dependency advisories remain unresolved | Safe patch updates applied. Final npm audit: 54 high, 21 moderate, zero critical entries. Require advisory reachability review and supported upstream upgrades; no forced SDK downgrade or disabled test |
| HIGH | Native accessibility and storage/permission behavior have no release-device acceptance | Reader zoom restored, shared semantic controls retained, test harness repaired; VoiceOver/TalkBack, Dynamic Type, modal focus, RTL, contrast and release storage QA remain required |
| HIGH | Prayer approval, translation terms, artwork rights, audience and policy owner are unresolved | Unverified approval/privacy wording corrected; explicit draft/TODOs retained. Qualified content/legal/owner review required |
| MEDIUM | Failures were difficult to diagnose without exposing internal details | Added sanitized gateway outcomes/latency/request IDs and cheap health check; production alerts and native crash reporting remain unconfigured |
| MEDIUM | CI omitted important checks and build/runtime mocks were incompatible | Added full type/unit/database/concurrency/API/UI/lint/platform-export gates; repaired native test mappings and SQLite WASM export |
| MEDIUM | Licenses were not accessible from the app | Preserved exact installed Manrope/Noto/Lucide notices and bundled them alongside the existing Gooey Popover notice; exposed policies/notices in Profile |
| LOW | Translation cache rewrites and sequential search may grow costly on device | Documented scale limits; defer a broader storage/search redesign until measured |

## Database and API controls

The repository defines three public tables: `circle_profiles`, `circle_connections`, `circle_activity`. All have RLS and explicit authenticated SELECT visibility. Anonymous reads and direct client INSERT/UPDATE/DELETE grants are denied. Profiles are visible to their owner/connection participants; connection rows to their participants; activity to permitted accepted connections/owner. Block/suspension checks participate in visibility. No exposed views are defined.

The nine original private tables are `settings`, `blocks`, `catalog`, `passages`, `sessions`, `milestones`, `reports`, `rate_limits`, `suspensions`. Client table privileges were already revoked; the migration adds defense-in-depth RLS to each. The three new assistant tables have RLS and no client grants. No client policies are added to these tables because client access is deliberately through fixed-search-path definer functions. Private schema exposure is removed from local API configuration; the hosted schema list must be checked independently.

Reviewed all Circle RPCs: join/profile, preferences, settings, request, connection actions, completion, quote, remove, report, delete-account and feed. They derive identity server-side, constrain input, limit writes, use owner/event/pair uniqueness, restrict quote text to catalog passages, enforce ownership for removal and cascade account records. New assistant reserve/finish functions are executable only by the server role. Supabase's service-role credential remains server-only and bypasses RLS by design; it must be guarded operationally.

Reviewed all repository HTTP endpoints:

| Endpoint | Enforcement | Remaining boundary |
| --- | --- | --- |
| POST `/api/assistant` | Strict input/body sizes, trusted-host IP adapter, shared admission, moderation, limits/deadlines, sanitized failures, no cache | Anonymous quota exhaustion remains possible; edge WAF/usage limits and verified proxy behavior required |
| `/api/invite` | Constrained handle and App Store URL, escaped output, CSP/referrer/nosniff headers, no database or paid API | Public dynamic function can consume hosting invocations/bandwidth; edge protection required |
| GET/HEAD `/api/health` | No provider/database calls, minimal non-secret config status, method restrictions | Liveness is not dependency connectivity or an alerting system |

No obvious committed server secret was found in the inspected tree/configuration. Public Expo variables contain public identifiers, not service-role credentials. This inspection does not prove the absence of secrets from every historical Git object or hosted build. Raw production errors, prompts, credentials and personal context are excluded from added application logs.

## Data inventory and minimization

| Data | Purpose/location | Access, recipients and retention |
| --- | --- | --- |
| Language, community/audience, onboarding choices, appearance, Focus/security/reminder preferences | Local personalization; MMKV/SecureStore | Device user; until local reset. Optional account metadata also reaches Supabase; review duplicated metadata and the sensitive-practice implications |
| Prayer completion IDs/dates, durations, streaks, checklist state, bookmarks | Practice experience; native encrypted MMKV and legacy migration | Device user; until reset. Post-enrollment completion data reaches Supabase only through optional account flow |
| Reader bookmarks, annotations and position | SQLite reader personalization | Device user; until reset; not encrypted by the new MMKV key |
| Coordinates, city/timezone and reminder schedule | Local zmanim/notifications; memory and saved reminder location | Device/OS location and reverse-geocoding services; not sent to Circle/OpenAI; removed by local reset |
| Chosen photos and rendered stories | Local profile/story UX; app document/cache files | Device and user-selected export destination; no cloud upload. App-local copies removed on reset; exported copies are outside app control |
| Auth identifiers/email/provider metadata and session | Optional account authentication; Supabase Auth / SecureStore | Provider and authorized operators; active account deletion/sign-out. Provider logs/backups have separately configured retention |
| Handle/name/timezone, connections, sharing choices, completions, activity/quotes | Circle social experience; PostgreSQL | Owner/authorized connection participants under policy; active records cascade on account deletion, individual activity removal supported |
| Blocks, reports, suspensions and abuse counters | Safety/moderation; private PostgreSQL | Authorized operators/functions. Operational review, retention and private contact still need owner decisions |
| Assistant question, public prayer context and language | Optional answer; transient gateway/OpenAI processing | OpenAI and hosting; no prompt storage in admission tables; provider processing/log retention must be finalized; redaction is best effort |
| Assistant connection IP and installation ID | Abuse admission | Server receives originals; Supabase stores keyed hashes/UUIDs and counters. OpenAI receives an installation hash as `safety_identifier`. Daily buckets/two-day request records are pruned on admission; idle cleanup needs scheduler; total counter is aggregate |
| Public reference/search text, translation passages/language, device IP | Content retrieval/localization | Sefaria, Google translation and MyMemory; cached locally; provider terms/retention outside repository control |

No address book, payment credentials, advertising ID or marketing audience is collected by these flows. Permissions remain contextual. Do not treat religious activity or pseudonymous hashes as anonymous/non-sensitive data. Retention periods and subprocessors are not invented; unresolved provider/business facts remain explicit policy TODOs.

## Existing protections verified

Local database tests exercise anonymous denial, cross-user visibility, blocked access, direct-write denial, RPC authorization, sharing preference ordering, duplicate events, handle/pair uniqueness, server catalog quote validation and cascading account deletion. Existing feed pagination, indexes, account-bound outbox, opt-in sharing controls, finite reminders, HTTPS transport, contextual device permissions and escaped invitation/reader text are retained.

Core reading remains usable when backend or assistant fails. No paid upgrade, checkout, cancellation, subscription, marketing signup or bulk send flow was found, so refund/price/unsubscribe/SMS-marketing controls are not applicable to the current product. No advertising/tracking initialization was found; no cosmetic cookie banner was added. A future web deployment or added tracking/provider changes requires a new consent review. No fake testimonials/counts were introduced. Unsupported privacy/content approval wording was corrected; broader theological/accuracy decisions remain with the owner and reviewers.

## Cost exposure and safeguards

| Feature/provider | Potential charges | Implemented bounds / required external control |
| --- | --- | --- |
| OpenAI assistant/moderation | Tokens and attempted provider calls | Mandatory durable daily/lifetime admission caps, 350 output tokens, bounded input, no paid retries, 25-second deadline, concurrency leases and kill switch; confirm model pricing/account hard limits |
| Vercel assistant/invite/health | Requests, function duration and network traffic, including rejected abuse | Short bounded assistant execution and cheap other routes; edge rate limiting/WAF and enforceable spending pause required; application admission cannot cap pre-handler hosting charges |
| Supabase Auth/PostgREST/database | Compute, storage, egress, rejected abuse, backups/PITR | RPC quotas, 200 connections, feed max 50/local max rows 200, indexes, atomicity and bounded client requests; hosted spend cap, timeouts, Auth/IP limits, backup allowance and monitored growth required |
| Optional Auth email/SMS | OTP delivery and abuse when provider enabled | Feature/configuration gated, no application marketing sender; keep unused providers disabled, configure provider/Auth bot limits and hard delivery ceilings |
| Sefaria/Google/MyMemory | Provider quotas/terms and device network use; a future paid contract could incur charges | Caching, bounded GET retries/timeouts/payloads, original-text fallback; no repository paid key/billing integration; approve terms/rights before release |
| EAS, GitHub CI, store/CDN distribution | Build minutes/credits and transfer traffic | No runtime build trigger; CI 15-minute timeout/read-only permissions; account build/concurrency/usage controls required |
| Local notifications/photos/SQLite | Device resources, no application cloud sender/storage bill | Finite reminder plan, temporary capture cleanup, bounded reads; manual exported files outside app control |

No function/self-invocation chain or server event-trigger retry loop was found. Automatic network retries are bounded to at most three retries and safe reads; side-effecting POSTs are not replayed. Outbox flush processes at most 25 commands and does not recursively drain forever. The local queue accepts at most 500 normal commands plus reserved consent-update capacity. Admission failures remain consumed once reserved; cleanup failure only extends a lease to its expiry, not an allowance refund.

## Scalability and recovery limits

Circle is stateless at the API boundary and uses server identity/constraints with indexed keyset pagination. Connection capacity is intentionally 200. The assistant serializes a small budget row to make global counters correct; admission throughput is intentionally 30/minute and active generation five, so it is not an unconstrained 10,000-user assistant. Scale this only alongside a new paid-work allowance and measured database capacity.

Public read traffic still needs provider edge controls. Private rate-limit/history tables can grow with accounts; a retention/index/size plan is required before significant growth. Local practice arrays and translation-cache object rewrites grow over years. Siddur search now bounds memory to 200-row chunks/50 results but remains a sequential scan; use measured indexing/full-text work later. Web bundles are about 10 MB before transfer compression and successful export does not establish browser SQLite isolation/runtime support. Connection pooling is managed by Supabase/PostgREST; the app does not open direct database connections. The test-only `pg` dependency does not create runtime database clients.

Cloud backup/PITR, Auth coverage, encrypted access/retention and an isolated restore must be verified. There are no cloud storage buckets in the repository. Device-only data has no app-managed cloud backup; Android backup is disabled in configuration, and device-only encryption keys may not restore across devices. Restore must reconcile deletions/sharing choices and preserve a conservative assistant spending count. See [production operations and recovery](production-operations.md) for the exact acceptance and rollback steps.

## Validation and limitations

- Type checker passed; full lint passed with 14 existing warnings and no errors.
- Unit tests: 152 across 34 suites, including missing-key preservation and in-flight SQLite deletion ordering. UI component tests: 14 across four iOS Jest suites.
- Database migration/policy runner: 61 checks plus invitation checks passed against PGlite.
- Independent PostgreSQL connections passed concurrent daily/lifetime admission, duplicate-request, duplicate-completion, block/request ordering and connection-cap tests. Local test server used PostgreSQL 18; CI is configured for PostgreSQL 17. Hosted PostgREST/Supabase Auth acceptance is still required.
- Gateway tests: 10 passed, including disabled/misconfigured operation, invalid inputs, spoofed IP handling, fail-closed limiter, caps, moderation failure, redaction, failed stream, disconnect and deadline termination.
- iOS, Android and web Expo exports passed. These are bundles, not signed native builds or device/browser acceptance.
- Release configuration check fails as intended in this environment: production Supabase URL/public key, invitation URL and App Store URL are absent. No dummy settings were supplied to claim a release pass.
- Dependency audit remains failing: 75 reported vulnerable package entries (54 high, 21 moderate), many representing shared transitive advisory chains. Zero critical entries does not mean all runtime paths are secure.

No hosted database, production credentials, actual provider hard caps, restore drill, physical device, iOS simulator, browser runtime, screen-reader acceptance or owner/legal approval was available. Tests use isolated databases/mocks where appropriate; passing them does not establish those external facts.

## Launch decisions and exact external work

Follow [production-operations.md](production-operations.md): apply migrations and verify hosted schema/grants/RLS with two users; configure restricted server credentials and explicit allowance; verify trusted proxy behavior and fail-closed staging; install/test edge and provider hard usage controls; limit Auth/OTP delivery; configure retention, private dashboards/alerts and moderation ownership; enable/restore appropriate backups/PITR; and perform signed-device accessibility/storage/deletion QA. Do not enable the assistant before these admission and spend controls are accepted.

Owner/legal review must supply the responsible business and private support/deletion contact, intended countries/age audience, sensitive religious-data basis/retention, subprocessors/regions/backups, stable public policy URLs, content/artwork/translation rights and rabbinic approval. Draft policies are for qualified review, not legal advice. A fake age checkbox, blanket compliance claim or soft budget alert cannot close these gates.

The architecture can support a constrained beta after the applicable content, legal, hosted safety and native acceptance gates are closed. The current repository alone does not justify a production-ready verdict.

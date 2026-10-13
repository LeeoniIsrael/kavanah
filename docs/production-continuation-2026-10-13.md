# Production hardening continuation — October 13, 2026

**Verdict: NOT READY.** This continues the existing audit at `d366382` on `work`; it is not a replacement audit or a launch certification. AI remains disabled by the established release decision. No provider configuration, production database, DNS, agreement, purchase, or App Store submission was changed in this continuation.

## Checkout and preservation

- Original checkout: `/Users/leeoniisrael/Documents/kavanah`, branch `codex/radiant-home`, commit `319b076`. It has many untracked duplicate files. None were changed, deleted, staged, or copied into this continuation.
- Isolated continuation: `/Users/leeoniisrael/Documents/Codex/2026-10-13/task-2/kavanah`, cloned from the existing `work` branch. The audit documents and existing tests were reviewed before editing. No additional `.agents` skills were present; the local Codex memories directory was empty.
- Node: checksum-verified 24.21.0 from nodejs.org, installed only in the task's adjacent `tooling` directory. System Node is 23.10.0, including the misleading `node@22` symlink; it was not changed. Dependencies were installed from the lockfile without lifecycle scripts. No development server or simulator was started.
- Publication is held for the coordinating task's authority. The repository's post-commit hook pushes automatically; a local-only commit must suppress that hook for that invocation while retaining `.githooks` as the configured hooks path. No claim of completed GitHub preservation should be made until push is authorized and verified.

## Implemented fixes

1. **Stop copying another person's prayer identity into a new cloud account.** Sign-in previously uploaded device-wide audience/community preferences when the arriving account had no prayer metadata. Sign-in now performs no such upload. Preferences from the arriving account replace unowned or differently owned local preferences before its session becomes visible to navigation. Missing/invalid metadata clears the previous onboarding flag. Successful explicit preference saves record their account owner, allowing the same account's local choice to survive a stale cached auth token. Local reset also clears this owner. Same-account profile reloads retain newly saved preferences.
2. **Patch the critical Handlebars advisory.** Update only its locked transitive version from 4.7.9 to 4.7.10, within ts-jest's declared range. No SDK downgrade or forced dependency override was applied.
3. **Repair the edge-probe lint regression.** Existing scripts used Node globals without ESLint declarations. Qualify AbortSignal through globalThis and explicitly import/bind test globals. The seven isolated probe tests still pass; this continuation did not send an edge-load burst to production.

The preference fix is deliberately narrower than full device-history isolation. Prayer history, streaks, social history, bookmarks, annotations, reader positions, reminder/checklist state and other device-wide records still need account ownership and migration work. Passing the new tests does not close that privacy gate. Existing legacy data was not silently deleted or assigned to a newly signed-in person.

## Recovery and real PostgreSQL evidence

Initial Docker context: `desktop-linux`, endpoint `unix:///Users/leeoniisrael/.docker/run/docker.sock`; the engine/socket was absent. Starting the already-installed Docker Desktop in the background succeeded. Verified engine **25.0.3**, system **Docker Desktop**, with a local Unix socket. No agreement or settings screen was accepted. Docker startup automatically resumed existing OnHand containers; they were not individually modified or stopped.

The existing synthetic concurrency harness passed on PostgreSQL 17 in a separate container:

- Image: `public.ecr.aws/supabase/postgres:17.11.0.002`, digest `sha256:0450166354dc9c1d25f0322ac8b580774d4fb0184d2b087f6e4fe9499c66cf53`.
- Container: `kavanah-audit-20261013`; `--network none`, no published ports, `--cpus 1`, `--memory 512m`, temporary `/tmp` database storage, read-only task mount, and `--rm`.
- A fresh `initdb` used only synthetic records and local trust authentication inside the isolated container. It did not run the image's hosted/Supabase initialization scripts. The harness connected to loopback inside that container, not a host/OnHand database.
- Passed concurrent caps, request deduplication, block/request races, duplicate completions and Circle capacity checks. The named container was verified absent after completion.
- The Linux Node binary required the image's Nix dynamic loader; the first attempt could not start Node and was automatically removed. The second attempt passed. There was no production data in either attempt.

**This was not a fresh-export restore or a scheduled-backup restore.** No production export or authorized database connection was available in either inspected checkout. Fresh-export recovery remains blocked on privately obtaining the export/connection and agreeing its access-controlled, non-synced local destination and disposal. Keep any real personal data outside the source tree, Git, logs and reports. Restore with networking disabled before inspecting or executing recovered database code. Establish source PostgreSQL version/extension compatibility first. Continue the Auth/private-schema, row-count/relationship, RLS, deletion reconciliation, conservative assistant-budget and RPO/RTO checks in `production-operations.md`. Scheduled physical-backup recovery remains a separate gate.

## Dependency review

Fresh npm audit before remediation: **77 affected package entries: 1 critical, 54 high, 22 moderate**. After the compatible Handlebars patch: **76 entries: 0 critical, 54 high, 22 moderate**. Counts include inherited advisory chains, not 76 distinct root vulnerabilities. Audit still exits nonzero. No risk acceptance is implied.

| Root package | Inspected reachability / disposition |
| --- | --- |
| Handlebars 4.7.9 → 4.7.10 | `ts-jest` development dependency. Patched. [AST type confusion advisory](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), [inline embedding advisory](https://github.com/advisories/GHSA-xw65-4hp5-5hc7), [own-property bypass](https://github.com/advisories/GHSA-p8wg-vrv2-v86f). |
| decode-uri-component 0.2.2 | `expo-router → query-string`; installed router path/query code imports it. Treat as a reachable runtime URL-parser risk, not a dev-only finding. [Patched in 0.5.0](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), outside the installed parent's declared range. Requires a compatible router/upstream upgrade or validated targeted mitigation and native/web hostile-link tests. No forced override applied. |
| braces 3.0.3 | Pattern/build/test dependency chains; no direct app/API import identified. [No patched version listed](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Avoid untrusted build patterns; finish bundle/reachability review rather than declaring exempt from the dependency-tree label. |
| node-forge 1.4.0 | Expo development certificate/signing dependency chains. [No patched version listed](https://github.com/advisories/GHSA-86w9-cpqp-85rv). Signing verification requires further review; no runtime safety claim based solely on its development-oriented use. |
| postcss-selector-parser 6.1.4 | Tailwind/PostCSS/NativeWind build chain; trusted repository styles in this app. [Patched in 7.1.6](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), a major-version change relative to the installed parent range. Supported styling-tool upgrade and output comparison remain. |
| sprintf-js 1.0.3 | `argparse` help formatter in tooling. [No patched version listed](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). Format-string control needs final reachability review. |
| uuid 7.0.3 | `xcode` project-generation dependency; inspected call is `uuid.v4()` without an output buffer. [Advisory targets v3/v5/v6 output-buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq). That inspected call does not meet the exploit precondition; this is a scoped finding, not whole-tree clearance. |

## Validation

Local logs are adjacent to the checkout in the task folder; they contain no production exports or credentials.

| Check | Result |
| --- | --- |
| Baseline unit suite | 170 tests / 38 suites passed, before edits |
| Final unit suite | 177 tests / 38 suites passed, followed by two additional crash/restart cases passing in the 12-test preference suite (179 total test cases) |
| TypeScript | Passed |
| Lint | Passed with 14 existing warnings, zero errors |
| PGlite database/security harness | 77 checks plus deployment/rollback/restore-inspection regressions passed |
| Real PostgreSQL concurrency | Passed inside the network-disabled synthetic container |
| Assistant API tests | 15 passed; mocked providers, no paid calls |
| Edge-probe tests | 7 passed; isolated stubs, no production burst |
| iOS component tests | 24 tests / 6 suites passed; not device acceptance |
| iOS/Android/web exports | Passed; bundles are not signed device builds |
| Release configuration | Correctly blocked: Supabase URL/public key, invitation URL and App Store URL absent; no dummy values added |
| npm security audit | Fails: 54 high and 22 moderate package entries remain |

## Remaining gates and exact next work

1. **Recovery:** privately provide a fresh authorized logical export or database connection, approve its secure local handling/disposal, and complete isolated restoration/acceptance. Then separately establish scheduled-backup recovery and owner-approved RPO/RTO. No paid clone is authorized or required for the local drill.
2. **Device privacy:** implement and review account-specific MMKV/SQLite/reminder/history isolation, including legacy records with unknown ownership, async writes/readers during switches, cold restart, failed migration and reset. Do not adopt legacy history into the next account or silently erase it.
3. **Dependencies:** resolve the reachable URL-decoder advisory and finish documented review/upstream upgrade of remaining chains; preserve SDK compatibility and retest signed/native/web behavior.
4. **Hosted two-account acceptance:** use explicitly authorized disposable test identities to verify sign-in, sharing, blocking, syncing, pagination, account switching and deletion against the actual service. Creating/mutating these production records needs the coordinating task's exact approval; local synthetic tests do not substitute.
5. **Signed-device QA:** supply release configuration and approved signing/build access, then verify storage migration, permissions, notifications, offline/error recovery, deletion, accessibility, RTL and physical-device behavior. No new account/security settings or paid build purchase was made here.
6. **Operations and release:** confirm current provider costs/controls, alerts, retention and support ownership; finalize content/translation/artwork rights, policies, audience and store disclosures. Rabbi review remains necessary alongside these gates. Any production migration/deploy, security setting, purchase, new agreement or App Store submission requires its exact approval.
7. **Repository publication:** review the local commit and authorize publication to an agreed non-production review branch, including any preview-build side effects. A draft PR may then be created and attached; no main merge or deployment is authorized by this report.

The coordinating task reports that Namecheap shows `kavanah.app` ACTIVE and VerifyContacts reports no eligible domains for verification, with no DNS/settings changes. This is attributed parent evidence only; it is not proof of DNS routing, TLS, privacy-policy hosting or application readiness.

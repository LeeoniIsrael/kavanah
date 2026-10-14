# Local UI and privacy integration

Evidence date: October 14, 2026 UTC. **NOT READY for production.** This is a local merge candidate, not a published revision or signed-device acceptance result. AI remains disabled. No hosted migrations, signing changes, App Group changes, production writes or new Expo builds were performed for this integration.

## Source selection

The previous preview `8f19427d-4bd8-46e0-97af-ab966029f39b` used audit revision `6b4ced14ab32696da88ceed668bee6c319867824` and omitted 61 commits on the owner's radiant UI branch. Its missing interface changes are explained by source selection; OTA behavior was not established as the cause. It must not be used to accept the integrated UI.

This work combines that audit revision with `319b076115aa2d5a9f6258576f0c579c3e061b5b` (`codex/radiant-home`) on `codex/local-ui-hardening-integration`. The original checkout and its untracked files were preserved. HomeScreen, PrayerScreen and GuidedPrayer match the radiant branch. The merge retains the account-only access and privacy protections from the audit branch.

## Decisions for overlapping files

| File | Integration decision |
| --- | --- |
| `api/assistant.js` | Preserve authentication, moderation, admission and spending limits; use the bundled canonical prayer context and reject unknown IDs before fetch. Keep AI disabled. |
| `app.json` | Retain hardened identity/configuration and radiant widget configuration; set visible iOS build number 5. New native signing coverage remains unverified. |
| `app/(tabs)/_layout.tsx` | Retain radiant tab presentation and navigation changes. Account access is enforced above this layout. |
| `app/_layout.tsx` | Keep the account gate and authenticated notification routing; mount account-aware widget synchronization. |
| `docs/design-system.md` | Preserve the radiant interface guidance; native visual verification remains outstanding. |
| `jest.ui.config.cjs` | Preserve UI mocks needed by the merged motion, icon and widget components. |
| `package.json`, `package-lock.json` | Add radiant UI/widget dependencies while retaining decoder, parser and UUID security overrides and audit test scripts. |
| `scripts/backend/test.mjs` | Retain security/deployment tests; verify unique migration versions, catalog reproducibility, rollback and unchanged installed safeguards after the catalog migration. |
| `src/components/PracticeStoryComposer.tsx` | Keep account-scope guards and capture cleanup; incorporate fade scrolling and safe user-facing errors. |
| `src/components/PrayerExplanation.tsx` | Preserve updated catalog/source presentation and shared UI behavior. |
| `src/components/ProfilePhoto.tsx` | Keep owner-scoped photo operations and suspended-write checks; use the radiant loader. |
| `src/components/molecules/circle-loader/index.tsx` | Preserve three-dot loading presentation with reduced-motion support. |
| `src/components/ui/bouncy-accordion.tsx` | Preserve shared accordion behavior and accessibility/motion handling. |
| `src/features/siddur/SiddurExperience.tsx` | Combine reader/search refinements with account-scope checks, screenshot cleanup and restricted WebView navigation. |
| `src/features/siddur/__tests__/siddur.test.ts` | Cover bundled catalog behavior alongside preserved reader safety checks. |
| `src/features/siddur/cache.ts` | Keep account-scoped personal SQLite data; search public bundled catalog text for the new reader. |
| `src/features/siddur/readerHtml.ts` | Keep CSP/escaping and zoom accessibility while restoring three text modes, transliteration and source-review status. |
| `src/features/siddur/sefaria.ts` | Use the offline research provider and retain bounded recursive text processing. |
| `src/providers/AppProviders.tsx` | Keep reset, storage and session lifecycle safeguards; use the radiant loading indicator. |
| `src/screens/NotificationSettingsScreen.tsx` | Keep account guards; restore animated settings sections and safe errors. |
| `src/screens/OnboardingScreen.tsx` | Keep mandatory accounts, availability checks and exclusive actions; restore explicit terms checkbox, policy links and new presentation. No agreement was accepted by this work. |
| `src/screens/PeopleScreen.tsx` | Retain local sign-out and accurate deletion consent; restore Friends presentation and SMS composer launch. Messages require user interaction. |
| `src/screens/ProfileScreen.tsx` | Keep account deletion/reset/policy controls; restore privacy panel and updated layout. |
| `src/services/network/client.ts` | Keep expected-user checks and pinned authorization; expose only intentional friendly errors. |
| `src/services/network/outbox.ts` | Keep generation/owner isolation; sanitize visible error text. |
| `src/services/onboardingAuth.ts` | Bind terms metadata writes to the session returned by that sign-in attempt; keep Apple nonce and email-only scope. |
| `src/store/circleAccountStore.ts` | Keep account epochs, local sign-out and deletion isolation; preserve actionable local-cleanup failure messages. |
| `src/store/prayerStore.ts` | Keep account-scoped history/bookmarks and async guards; resolve canonical catalog IDs and use empty initial bookmarks. |

Additional regression coverage checks terms writes against the initiating session, widget clearing on sign-out/reset, and accurate privacy/deletion copy. The widget receives personal location/timeline data only for a ready authenticated account and clears persisted content on cleanup.

## Migration correction

The UI branch had a second `202609270001` migration version. The research catalog is now `202610140001_research_catalog.sql`, after the existing production and account safeguards. The generator and documentation use that name. Its previously stale text snapshot was regenerated from the current bundled catalog, including current transliteration and the Tefillin entry; this is not content approval.

Tests compare pre-existing public/private function definitions and ACLs, policies, table RLS/grants and triggers before and after this migration. Injected failure rolls back the new column and catalog transaction. Both installed-safeguard verification sets still pass, and the two new active-prayer triggers are present. The backend test also checks that generated SQL exactly matches the bundled catalog. No hosted migration ledger has been read or altered here; deployment requires a fresh target/ledger review and separate authorization.

## Validation and limits

- Clean locked dependency installation completed with install scripts disabled.
- TypeScript passed. Unit tests: 230 across 45 suites. iOS component tests: 53 across 13 suites. Watchman was disabled for the final test run because the sandbox blocked its socket.
- Lint: zero errors, 31 warnings. The warnings remain visible rather than being treated as a clean warning-free run.
- Backend: 79 synthetic database/security checks plus migration ordering, reproducibility, rollback, installed-verification and recovery-inventory checks. Real PostgreSQL concurrency covers caps, deduplication, block/request races, duplicate completions and Circle capacity.
- API suite: 17 tests passed, including unknown catalog rejection and canonical context. Decoder/parser/UUID and edge-probe regression suites passed.
- iOS, Android and web JavaScript exports passed before final commit. A post-commit export/config check must record the final revision; exports do not prove native compilation or installation.
- Six browser-rendered reader captures cover English, Hebrew and transliteration in light/dark modes at 390×844. They were visually inspected for readability, overflow, RTL and visible review status. They use browser fonts and do not establish native controls, VoiceOver, Dynamic Type or physical-device behavior.
- The integration dependency audit reports 61 affected entries: 56 high, five moderate, zero critical. Decoder/parser/UUID fixes remain, but remaining advisories are an open release gate.

Supporting local logs and six render captures are beside this worktree in the task workspace (`integration-*-final.log`, `integration-api.log`, `integration-tools.log`, `integration-export.log`, `integration-audit.json`, `integration-render-evidence/`). Do not upload private environment files, dumps, credentials or unrestricted diagnostic logs.

## Build identity and next approval

The app displays “UI + privacy integration”, build number and abbreviated source revision on onboarding and Profile. `app.config.js` resolves an exact Git revision or EAS build revision. `eas.json` uses local version sourcing so the intended iOS build 5 is not replaced by the prior remote build counter. This change does not modify Expo's remote counter.

The restored widget declares App Group `group.com.leeoniisrael.kavanah` and extension bundle `com.leeoniisrael.kavanah.ExpoWidgetsTarget`. Native configuration introspection succeeded, but existing Apple capability and provisioning coverage has not been established. No capability, credential, profile, push permission, device registration or App Group change is authorized by this local integration. Keep the widget unless the owner explicitly chooses to defer it.

Next steps require exact scope: publication of the reviewed merge commit; verification of existing signing coverage (or explicit approval for identified missing capabilities); and a separately reconciled single included preview-build authorization after fresh quota/archive checks. The earlier authorization used by build `8f19427d` cannot be reused. No build is authorized by this document. Installation, hosted fixture writes, production deployment and App Store submission remain separate actions.

## Remaining readiness gates

Fresh real-export restore and scheduled-backup recovery; live two-account hosted acceptance; same-device A→B→A privacy and interrupted reset/deletion; signed-device UI/accessibility/permissions/offline QA; native widget/signing review; remaining dependency advisories; rabbinic/language/source-rights review; final legal/moderation/operations ownership; real invitation/store/policy URLs and release configuration. See [release gates](release-checklist.md). Passing local checks does not close these gates.

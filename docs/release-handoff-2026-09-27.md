# App Store release handoff — September 27, 2026

**Status: not ready to submit.** This is a decision and evidence log, not a claim of content, security, or App Store approval. The checked source is GitHub `main` at `eb390bd` before this handoff edit. The older Codex worktree at `.codex/worktrees/50c1/kavanah` is not the current `main` source; its Git metadata points to cloud-backed Documents files that timed out during this audit.

## Publication decision

The owner selected **Circle accounts and a database for version 1**. Provision a separate owner-controlled production Supabase project, then complete the hosted, operational, and device gates in `social-backend.md` and `release-checklist.md`. The migrations and local tests are implementation evidence, not hosted acceptance evidence. The existing Free project is named Kavanah Development and must not be treated as production merely because its database branch is labeled `main PRODUCTION` in the Supabase interface.

Version 1 also requires an approved edition and exact prayer text, qualified review of translations/transliterations and licenses, stable legal/support pages, physical-device accessibility and notification checks, privacy labels, Apple signing, and TestFlight. The current `0.2.0` version and content status must not be represented as a release candidate.

## Evidence gathered in this audit

- GitHub `main` cloned cleanly at `eb390bd`; `git push --dry-run origin main` succeeded with `Everything up-to-date` before edits. The repository hook path was set to `.githooks` in the recovered checkout.
- `node --check api/assistant.js` and `node --check api/invite.js` passed.
- `npm run release:check` failed because Supabase URL/key, invitation URL, and actual App Store URL are absent and the available Node is 23 rather than the required 24. This configuration gate requires Circle; it does not establish that a local-first candidate is ready.
- `npm ci --ignore-scripts` could not complete because the volume ran out of space. The partial dependency directory created by this attempt was removed. TypeScript, lint, Jest, backend tests, Expo doctor, and native builds were **not** rerun in this audit.
- The initial audit did not establish whether a hosted Supabase project existed. SMTP delivery, production Circle credentials, two-account API tests, moderation operation, backup restore, physical-device runs, TestFlight builds, and App Store Connect submission were not verified.

## September 27 follow-up: Circle included in version 1

The owner chose Circle and a database for the first release, and confirmed that prayer content needs approval. A logged-in Supabase dashboard shows one **Kavanah Development** project on the Free plan in `us-east-1` (North Virginia). Read-only queries found 3 public Circle tables, 9 private tables, 11 public Circle functions, 2,296 catalog rows, 62 passages, and 3 public RLS policies. The three public Circle tables had RLS enabled but still granted direct write privileges to `authenticated`; no write policies existed. A corrective migration and local regression checks were prepared. `npm run test:backend` passed 35 database/security checks after the migration. The grant fix was applied to the development project in its SQL editor and read back: `authenticated` retains `SELECT` but has no direct `INSERT`, `UPDATE`, or `DELETE` on these three tables. This development project is not a production acceptance result. The security advisor showed 0 errors and 11 warnings for the intentionally callable `SECURITY DEFINER` Circle RPCs; each warning still needs scope review, not automatic dismissal.

## Owner inputs and evidence needed

| Decision or evidence | Why it is needed | Acceptance artifact |
| --- | --- | --- |
| Production Supabase region and billing | Circle requires an owner-controlled production service | Separate project with backups, spending controls, and recorded region |
| Named reviewer and approved source edition | All core Hebrew entries are still marked pending | Signed or dated exact-text review with corrections applied |
| Translation rights and reviewer | Current localization uses unofficial endpoints | License records and reviewed text per shipped language |
| Apple Developer and App Store Connect access | Signing, TestFlight, listing, and submission require the owner's team | Verified bundle ownership, signing, test build, listing draft |
| Circle operator, private support contact, region, backup retention, budget | Required if Circle is included | Hosted runbook, tested account deletion, backup restore, alert and report handling records |
| Public legal and support URLs | Needed for the listing and in-app links | Stable HTTPS pages with current processor details and contact |

## Next executable sequence

1. Choose the production database region and plan; finish exact-text and language review in parallel. Keep unapproved text labeled pending.
2. Free enough disk space and use Node 24 LTS. In a clean current-main checkout run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npm run test:backend`, `npx expo-doctor`, and `npm run release:check` with the chosen production configuration. Record failures and fixes.
3. For Circle scope, follow `social-backend.md` in staging, including OTP/provider setup, RLS/grant checks, two real accounts, report handling, deletion, backup restoration, and load tests. Repeat accepted configuration in production.
4. Build an internal iOS candidate, then run the physical-device matrix in `release-checklist.md` and capture App Privacy, permissions, accessibility, offline, and account behavior evidence. Prepare screenshots and listing copy from that exact candidate.
5. Present the final binary, listing, privacy disclosures, content approvals, and open risk log for owner approval before external TestFlight distribution or App Store submission.

# App Store release handoff — September 27, 2026

**Status: not ready to submit.** This is a decision and evidence log, not a claim of content, security, or App Store approval. The checked source is GitHub `main` at `eb390bd` before this handoff edit. The older Codex worktree at `.codex/worktrees/50c1/kavanah` is not the current `main` source; its Git metadata points to cloud-backed Documents files that timed out during this audit.

## Publication decision

Choose one release scope before building a candidate:

1. **Local-first release:** keep Circle sign-in and sharing unavailable, remove Circle entry points from the candidate or make their unavailable state explicit, and audit the binary for unused account permissions and disclosures. The assistant still needs a durable request limit and budget control if enabled.
2. **Circle release:** provision separate owner-controlled staging and production Supabase projects, then complete the hosted, operational, and device gates in `social-backend.md` and `release-checklist.md`. The migrations and local tests are implementation evidence, not hosted acceptance evidence.

Either scope still requires an approved edition and exact prayer text, qualified review of translations/transliterations and licenses, stable legal/support pages, physical-device accessibility and notification checks, privacy labels, Apple signing, and TestFlight. The current `0.2.0` version and content status must not be represented as a release candidate.

## Evidence gathered in this audit

- GitHub `main` cloned cleanly at `eb390bd`; `git push --dry-run origin main` succeeded with `Everything up-to-date` before edits. The repository hook path was set to `.githooks` in the recovered checkout.
- `node --check api/assistant.js` and `node --check api/invite.js` passed.
- `npm run release:check` failed because Supabase URL/key, invitation URL, and actual App Store URL are absent and the available Node is 23 rather than the required 24. This configuration gate requires Circle; it does not establish that a local-first candidate is ready.
- `npm ci --ignore-scripts` could not complete because the volume ran out of space. The partial dependency directory created by this attempt was removed. TypeScript, lint, Jest, backend tests, Expo doctor, and native builds were **not** rerun in this audit.
- No hosted Supabase project, SMTP delivery, production Circle credentials, two-account API test, moderation operator, backup restore, physical-device run, TestFlight build, or App Store Connect submission was verified.

## Owner inputs and evidence needed

| Decision or evidence | Why it is needed | Acceptance artifact |
| --- | --- | --- |
| Launch scope: local-first or Circle | Determines backend, account, review, and disclosure work | Recorded release scope and candidate build configuration |
| Named reviewer and approved source edition | All core Hebrew entries are still marked pending | Signed or dated exact-text review with corrections applied |
| Translation rights and reviewer | Current localization uses unofficial endpoints | License records and reviewed text per shipped language |
| Apple Developer and App Store Connect access | Signing, TestFlight, listing, and submission require the owner's team | Verified bundle ownership, signing, test build, listing draft |
| Circle operator, private support contact, region, backup retention, budget | Required if Circle is included | Hosted runbook, tested account deletion, backup restore, alert and report handling records |
| Public legal and support URLs | Needed for the listing and in-app links | Stable HTTPS pages with current processor details and contact |

## Next executable sequence

1. Confirm scope and content edition; finish exact-text and language review. Keep unapproved text labeled pending.
2. Free enough disk space and use Node 24 LTS. In a clean current-main checkout run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npm run test:backend`, `npx expo-doctor`, and `npm run release:check` with the chosen production configuration. Record failures and fixes.
3. For Circle scope, follow `social-backend.md` in staging, including OTP/provider setup, RLS/grant checks, two real accounts, report handling, deletion, backup restoration, and load tests. Repeat accepted configuration in production.
4. Build an internal iOS candidate, then run the physical-device matrix in `release-checklist.md` and capture App Privacy, permissions, accessibility, offline, and account behavior evidence. Prepare screenshots and listing copy from that exact candidate.
5. Present the final binary, listing, privacy disclosures, content approvals, and open risk log for owner approval before external TestFlight distribution or App Store submission.

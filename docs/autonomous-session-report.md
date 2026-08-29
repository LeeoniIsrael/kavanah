# Autonomous Improvement Session Report

Date: August 29, 2026

## WHAT I FOUND

- Zmanim values from `kosher-zmanim` were Luxon-style objects, but the app accepted only JavaScript `Date` or number values. Every displayed time could silently fall back to a hard-coded estimate.
- Candle lighting and Havdalah were shown on every day instead of Friday and Saturday respectively.
- Denied location permission silently substituted New York, creating dangerously misleading local times.
- The prayer reader put a large AI card before the prayer text.
- Machine display translations were sent to the assistant under a blanket "verified context" label even while all Hebrew review statuses were pending.
- Network requests retried nonrecoverable client errors and waited after the final attempt.
- Startup could be blank and render failures had no user recovery path.
- Motion did not respect the operating-system reduced-motion preference.
- Expo SDK 54 patch versions were out of alignment.
- Root font imports bundled every available font weight instead of the five used by the interface.
- An unused Apple token flow stored unverified client credentials despite the product having no account system.
- The repository had no README or architecture/backlog handoff.

## WHAT I FIXED

- Normalized Luxon and `Date` zmanim values and validated real calculations.
- Limited candle lighting to Friday and Havdalah to Saturday.
- Replaced false location fallback with a clear unavailable state.
- Calculated a seven-day schedule so local reminders survive midnight.
- Moved assistant interaction below the prayer text.
- Labeled Hebrew review, source, translation, and transliteration trust levels exactly.
- Added assistant connection and stream-idle timeouts.
- Restricted HTTP retries to network failures, `408`, `429`, and `5xx`.
- Removed the unfinished account/session flow and unused standalone assistant screen.
- Aligned Expo SDK 54 packages; Expo doctor now passes all checks.
- Narrowed font imports to the exact weights used by Kavanah.

## WHAT I IMPROVED

- Made the no-location home state smaller, clearer, and honest.
- Added accessibility labels to icon-only search, refresh, calendar, unlock, and assistant controls.
- Matched haptic feedback to completing versus undoing a daily practice.
- Added reduced-motion handling to presses, screen entry, bookmark disclosure, and modals.
- Added an intention cue before prayer text without collecting a reflection or adding another workflow.
- Clarified assistant consent and privacy language in the prayer reader, Settings, and policy.
- Added intentional loading feedback for secure preference hydration.

## WHAT I ADDED

- App-level render error recovery.
- A pure prayer-assistant context builder with trust-label tests.
- Focused network retry tests.
- Accurate zmanim tests covering weekdays and Shabbat boundaries.
- README, architecture documentation, prioritized product backlog, and this report.

## WHAT I TESTED

- Strict TypeScript checking.
- ESLint across TypeScript and TSX.
- 10 Jest suites and 30 tests.
- JavaScript syntax for the serverless assistant gateway.
- Live assistant gateway validation and request-shape rejection after deployment.
- Expo doctor: 17 of 17 checks pass.
- iOS Simulator launch and a clean Metro rebuild on Expo SDK 54.
- Real New York zmanim output for August 29, 2026, including Saturday-only Havdalah.
- Visual inspection of the home empty state on an iPhone 17 Pro simulator.

Expo Go warns that notification behavior is incomplete; a development build and physical-device pass are still required.

## RESEARCH / PRODUCT INSIGHTS

- Permission prompts are most understandable when triggered by the feature that needs them. Kavanah already requests location from the local-times action and notifications from the Settings toggle; preserve this behavior.
- Apple expects useful, concise notifications and in-app control. Kavanah needs granular reminder selection before public launch rather than an all-times default.
- Apple requires account deletion when account creation exists. Removing the incomplete account path is safer and simpler until sync provides real user value and complete deletion.
- The most mission-aligned interaction is often shorter: find the right prayer, establish intention, read, and leave. Ratings, social sharing, and engagement loops would make this product worse.

Primary references:

- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/design/human-interface-guidelines/privacy
- https://developer.apple.com/design/human-interface-guidelines/notifications

## IMPORTANT TECHNICAL DECISIONS

- Keep precise location and zmanim computation on device.
- Never substitute a default city for denied or failed location.
- Keep assistant help inside a selected prayer and below the prayer text.
- Treat review status as data that travels with content, not a documentation note.
- Keep generated Hebrew candidates out of runtime until explicit approval.
- Launch without accounts; add sync only with server verification, export, and deletion.
- Do not force the npm audit suggestion to Expo SDK 57 during an SDK 54 stabilization pass. The offered remediation is a major framework migration and requires a dedicated test cycle.

## KNOWN ISSUES

- All 33 runtime Hebrew entries are still pending rabbinic review.
- Most runtime entries are excerpts; three are service collections and three have no bundled Hebrew.
- Display translations/transliterations are not qualified-language reviewed.
- Translation uses free endpoints without a production license/SLA.
- User MMKV data is not encrypted at rest.
- Assistant rate limits are process-local; installation IDs are pseudonymous but not authenticated.
- Redaction is best effort and cannot remove every kind of private information.
- TLS pinning, a TLS 1.3 guarantee, and privacy-safe crash reporting are absent.
- Notification selection is all-or-nothing and Expo Go cannot fully test it.
- Manual city entry, nusach selection, holiday-aware liturgy, and user-selectable zmanim methods are absent.
- Current npm audit advisories resolve only through a major Expo/React Native change; they need a planned SDK migration, not `--force`.
- Two unrelated untracked duplicate files remain in the working directory and were intentionally not committed: `src/providers/AppProviders 2.tsx` and `src/services/assistantService 2.ts`.

## NEXT 5 HIGHEST-VALUE IMPROVEMENTS

1. Complete the rabbinic approval workflow for exact Hebrew runtime content and separate full services from single prayers.
2. Replace machine translation at read time with reviewed, licensed, downloadable language packs.
3. Add shared assistant rate limiting, a hard cost ceiling, and privacy-safe operational monitoring.
4. Encrypt or minimize local practice history and add a clear-local-data control.
5. Run development-build and TestFlight QA across physical devices, accessibility modes, denied permissions, offline behavior, and notifications.

## REVOLUTIONARY / EXPERIMENTAL IDEAS WORTH EXPLORING

- A fully local Moment Resolver that maps ordinary language to reviewed prayers without sending distress, gratitude, or uncertainty to a server.
- Named, versioned community source packs that make nusach differences transparent instead of hiding them.
- A reviewed One-Breath Kavanah prompt that appears only before reading and stores nothing.
- Completion by Disappearance: no rating, upsell, streak celebration, or feed after prayer - just a calm exit.
- On-device personal rhythm suggestions that never create a cloud behavioral profile and can be disabled in one control.

## HOW TO RUN AND TEST THE PROJECT

Use Node.js 22 LTS, then:

```bash
npm ci
npm start
```

Scan the QR code with Expo Go or press `i` for the iOS simulator. For persistent MMKV data and complete notification testing, create and run the EAS development build.

Run verification:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npx expo-doctor
node --check api/assistant.js
```

## SIGNIFICANT FILES CHANGED

- `src/services/zmanimService.ts`, `src/store/zmanimStore.ts`, `src/types/zmanim.ts`
- `src/screens/HomeScreen.tsx`, `src/screens/PrayerScreen.tsx`, `src/screens/ProfileScreen.tsx`, `src/screens/ZmanimScreen.tsx`
- `src/services/assistantContext.ts`, `src/services/assistantService.ts`, `api/assistant.js`
- `src/services/network.ts`, `src/services/location.ts`, `src/services/security.ts`
- `src/components/AppErrorBoundary.tsx`, `src/components/AnimatedPressable.tsx`, `src/components/Screen.tsx`
- `src/hooks/useReducedMotion.ts`, `src/providers/AppProviders.tsx`, `src/store/authStore.ts`
- `package.json`, `package-lock.json`, `app.json`
- `README.md`, `SECURITY.md`, and `docs/*`

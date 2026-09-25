# Circle

Circle is the dedicated social tab. Its quiet graphite surfaces, serif quote typography, and restrained indigo controls make the sharing choices explicit without a composer.

## Behavior

- Prayer updates default to private. Choose the first completed prayer of each local day or every completion. Streak milestones are an independent opt-in (3, 7, 18, 40, 100 days).
- Settings affect future completions only. Completion IDs prevent repeated events from creating duplicate updates. Removing a milestone does not repost it.
- Open a prayer and choose a quote from a line, or hold its Hebrew/translation. Drag across words or tap the first and last word. Save up to 60 contiguous source words, with attribution and no caption.
- Each Monday-based local week has one quote. Selecting another replaces that week's quote. Previous weeks remain in activity.
- The reader, guided reading, and completion panel all expose quote selection.
- Feed rendering is virtualized and stored activity is bounded. Settings and activity persist in app-scoped storage in Expo Go as well as native builds.

## Current boundary

There is no connected social backend. Circle activity is visible only on this device; the UI states this. It does not simulate followers or publish to other accounts. Legacy v1 posts are preserved in storage but excluded from this new source-only feed. Existing external photo-story export remains separate.

## Verification — September 24, 2026

- Runtime and edit checkout: `/private/tmp/kavanah-clean-launch-20260924`, Metro `exp://127.0.0.1:8081`.
- Visible iPhone 17 Pro, iOS 26, in Xcode Device Hub. Fast Refresh source changes appeared in the same live preview; no native rebuild required.
- Selected “great is Your faithfulness.” by finger drag, saved it, and verified it in Circle. Removed the verification quote and restored private sharing afterward.
- Guided Modeh Ani completion reached the social event ledger. First-daily correctly did not publish a second completion on an already-recorded day.
- TypeScript passes. Nine social policy/store and streak tests pass; focused lint for new Circle code passes.
- Broader lint of existing reader components still reports pre-existing React hook/ref issues in GuidedPrayer and PrayerScreen.

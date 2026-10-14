# Accordion audit

The supplied Reacticx accordion pattern is adapted into `src/components/ui/accordion.tsx`. It uses the app's Button, Text, semantic colors, rounded surfaces, Lucide icons, best-effort selection haptics, and existing Reanimated dependency. No native install is required. Height, opacity and chevrons animate on the UI thread; Reduced Motion immediately selects the final state. Blur and pop scaling are omitted to keep text legible and prevent neighboring content from overlapping.

## Integrated locations

| Area | Use |
| --- | --- |
| Profile → Data & privacy | Five single-open explanations: device storage, Circle, assistant, religious guidance, choices. The first remains open initially. |
| Prayer search | Other editions on every grouped result; source identity and direct prayer navigation stay intact. |
| Zmanim → Times | Each time's explanation and calculation method, independently expandable. Title, time and summary remain visible. |
| Notifications → Daily rhythm | Enabled reminder's clock, weekdays and applicable custom settings. |
| Notifications → Local prayer times | Enabled reminder's advance-notice field. |
| Notifications → Upcoming holidays | Enabled category's advance notice, clock and observance choices. |
| Notifications → Holiday preparation | Enabled checklist reminder's advance notice and clock. |
| Notifications → Quiet hours | Enabled window's clock fields and validation. |

Notification switches retain ownership of their settings; `AccordionReveal` only animates the existing enabled-state details. It does not toggle permissions, schedule work or add a second control.

## Reviewed and kept visible

- Home shortcuts, current practice and completion actions; Circle activity, history, friend requests and account actions.
- Prayer and siddur contents navigation, search, reading settings, prayer text, preparation instructions, reviewed-status notices, and source/license attribution. These are navigation, essential reading controls or disclosure obligations, rather than optional accordion bodies.
- Assistant conversations, consent, loading and failures; onboarding, profile settings, holidays and checklist tasks. Actions, errors and required guidance stay directly accessible.
- Calendar date selection, segmented tabs, sheets, popovers and scrolling headers retain their own interaction models.

## Reuse

Use `Accordion` (or `Accordion.Root`) with `Item`, `Trigger` and `Content`. `Trigger.Label`, `Trigger.Icon` and `Trigger.Indicator` compose rows. `type="multiple"` allows independent open sections. Single mode accepts a string or null; multiple mode accepts string arrays. `value` / `onValueChange` support externally owned state; `defaultValue` sets the initial state. `collapsible={false}` retains at least one already-open section. `icon="cross"` provides a plus-to-cross indicator. The old BouncyAccordion export delegates to this implementation.

Content is mounted once and measured at natural width, including async updates and larger text. Collapsed descendants are hidden from accessibility and pointer interaction. Do not put side effects in hidden body mounts; accordion visibility is not permission to perform work.

## Verification

September 29: typecheck, targeted lint and eight UI tests passed in the fully local `/private/tmp/kavanah-expo-go` checkout, synced with the intended source changes. Tests cover single/multiple and controlled state, noncollapsible/disabled triggers, hidden descendants, one mounted content tree, and prayer edition navigation/updates. Reduced Motion is exercised by the UI tests.

Native iPhone 17 Pro (iOS 26) inspection on Metro port 8081 confirmed rounded dark surfaces, long content clearance, single-open behavior, and expanded Zmanim detail/calculation text through actual taps. Fast Refresh delivered the shared component changes. A temporary isolated verification route was removed. Another concurrent development session restarted the shared simulator during follow-up verification; light appearance, larger system text, on-device Reduced Motion, and full Profile/reminder interaction checks remain unverified. No reminder or appearance preferences were changed for this task.

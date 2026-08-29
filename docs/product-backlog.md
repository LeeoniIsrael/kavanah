# Kavanah Product Backlog

Impact, effort, confidence, and mission alignment use High / Medium / Low. `NOW` items block a responsible public launch.

## NOW

| Work | User impact | Effort | Confidence | Mission alignment |
| --- | --- | --- | --- | --- |
| Complete rabbinic review of exact Hebrew runtime text, source edition, tradition, and whether each entry is complete or an excerpt | High | High | High | High |
| Separate service collections from single prayers; do not ship Shacharit, Mincha, or Maariv as empty/partial single entries | High | Medium | High | High |
| Review every translation and transliteration with qualified language reviewers and replace unofficial translation endpoints with licensed content | High | High | High | High |
| Replace process-memory assistant limits with a shared durable limiter, hard daily provider budget, and abuse controls that do not collect prayer content | High | Medium | High | High |
| Encrypt sensitive local user history or reduce stored detail; add an in-app clear-local-data control and verify uninstall behavior | High | Medium | High | High |
| Complete TestFlight device QA for notifications, offline mode, permissions, VoiceOver, Dynamic Type, reduced motion, RTL, iPad, and slow networks | High | Medium | High | High |
| Publish privacy, terms, and support at stable production URLs; finish App Store privacy labels and review metadata | High | Medium | High | High |

## NEXT

| Work | User impact | Effort | Confidence | Mission alignment |
| --- | --- | --- | --- | --- |
| Add explicit nusach and community-method selection so text and zmanim never imply one universal custom | High | High | High | High |
| Add granular reminder choices and quiet defaults instead of scheduling every supported zman | High | Medium | High | High |
| Add a reviewed Jewish calendar layer for holidays, fasts, Rosh Chodesh, parashah, candle lighting, and context-specific prayer changes | High | High | High | High |
| Add manual city selection as a privacy-friendly alternative when location permission is declined | Medium | Medium | High | High |
| Show a concise offline/source-status state in the reader without interrupting prayer | Medium | Low | High | High |
| Add privacy-preserving crash reporting that excludes assistant questions, coordinates, prayer history, and free text | Medium | Medium | High | Medium |

## LATER

| Work | User impact | Effort | Confidence | Mission alignment |
| --- | --- | --- | --- | --- |
| Optional encrypted sync with real server-side OIDC verification, recovery, export, and in-app account deletion | Medium | High | Medium | Medium |
| Downloadable reviewed language packs for reliable offline translation | High | High | High | High |
| User-selectable font size, Hebrew line spacing, and transliteration visibility | Medium | Medium | High | High |
| A private reflection journal with local encryption and explicit retention controls | Medium | High | Medium | High |
| Optional widgets and watch surfaces for the next prayer moment without engagement pressure | Medium | High | Medium | Medium |

## EXPERIMENTAL

| Idea | User impact | Effort | Confidence | Mission alignment |
| --- | --- | --- | --- | --- |
| Moment Resolver: fully local intent search that maps "I am scared," "I received good news," or "I am traveling" to reviewed prayers and explains why each fits | High | Medium | Medium | High |
| One-Breath Kavanah: a prayer-specific, reviewed intention prompt that disappears as soon as reading begins and stores nothing | High | Medium | Medium | High |
| Completion by Disappearance: after a prayer, the interface gently clears instead of demanding a rating, streak, share, or next action | Medium | Low | High | High |
| Personal rhythm without surveillance: on-device suggestions based only on local time and chosen practices, with no cloud profile and a visible off switch | Medium | Medium | Medium | High |
| Community source packs: signed, versioned prayer collections reviewed by named communities or rabbis, with transparent differences instead of one "correct" default | High | High | Medium | High |

## Product Rules

- No streak loss language, guilt, ranking, ads, or social comparison.
- Never make the assistant look like a posek or source text.
- Prefer a smaller reviewed library over a large uncertain library.
- Every permission is optional and requested at the moment its value is clear.
- A successful session may end with the user leaving the app sooner.

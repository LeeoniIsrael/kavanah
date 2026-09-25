# Kavanah interface contract

Use this contract for every UI change, including modals and secondary screens. The reference for this pass is [Apple Design Skill](https://github.com/dickwu/apple-design-skill), applied to React Native with the frontend-design skill. Apple principles inform the implementation; this is not a claim of complete HIG conformance.

## Direction

Prayer content comes first. Use the logo’s navy, warm editorial headings, and clear Manrope controls. Light is airy and calm; dark is focused and quiet. Motion should answer interaction or communicate real work, rather than decorate an idle screen.

- Light: canvas `#F7F8FA`, white surfaces, ink `#152137`, logo navy action `#0B1A3B`.
- Dark: canvas `#0E141C`, surfaces `#17212D`, ink `#E9EEF4`, readable blue action `#8DB6E8`.
- Use `useThemeColors` and `useThemedStyles` for native styles; utilities derive from the same semantic palettes. Use `onAccent` for content on an accent fill.
- Primary/secondary text and button labels must meet 4.5:1 contrast in both themes. Palette tests guard these pairs.
- Screen titles use Georgia at 38/46 on iOS. Input text uses Manrope at 17/25; supporting text uses 13–14/20–22. Preserve system text scaling.
- Standard page inset: 24. Controls: 44-point minimum target. Control radius: 18; content surface: 26; feature surface: 32. Circular icon controls remain circular.

## Surface rules

Use the shared Button, Card, ChoiceRow, and Screen components. Do not reintroduce square selection backgrounds or independently styled outlined cards.

- `ChoiceRow` contains its selected fill within continuous rounded corners and reports selection to assistive technology. Selection includes a check, not color alone.
- `Button` content sizing retains rounded corners by default. Use an explicit square corner only for a deliberate joined/grouped edge.
- `AppGlassSurface` applies layout and corner classes to a core View, with native glass/blur as a background layer. Never forward layout classes directly to a native material view that does not interpret them.
- `Card` clips child fills to its corners. Prefer a surface-color difference to a decorative border plus shadow.
- Use quiet separators inside a group when needed. Do not stack top/bottom rules between already separated cards.
- A focus outline or selected-state outline can communicate interaction; do not remove these merely for appearance.
- System tabs remain native. `Screen` owns a visible title, safe-area top inset, scrollable content, keyboard behavior, and consistent horizontal spacing. Avoid adding a second header or top inset.
- Sheets must retain an obvious close action and respect bottom safe areas. Do not crop labels into fixed-height rows at larger text sizes.

## Assistant

The assistant is a reading companion, not a generic chat dashboard.

Compact and regular widths use the same content hierarchy, constrained by the reader width:

    [transparent mark]  Go a little deeper.
                        Explore this prayer with Kavanah AI.
    [conversation, when present]
    ╭────────────────────────────────────╮
    │ Multiline question                 │
    │                                    │
    │ Context / real loading status  [↑] │
    ╰────────────────────────────────────╯
    Suggested questions
    Short accuracy note

`AssistantMotion` runs the beam and morphing rings on the UI thread using existing Reanimated/SVG dependencies. The beam follows the rounded rectangle rather than rotating a rectangle around it. Focus or streaming activates it. The transparent vector logo yields to orbiting rounded shapes during streaming and settles back on completion or failure. Reduced Motion makes the state static. Loading text and accessibility busy state communicate the same status without relying on animation. Never add a fake delay to display the loader.

Do not add model pickers, microphones, attachment buttons, or other controls unless they actually work. Keep existing consent and backend behavior. Remove repeated logos from message bubbles; distinguish the question by its surface and the answer by its explicit AI label.

## Apple guidance applied

- `layout.md › Visual hierarchy`: “Group related items to clearly express related information or functions.” Shared surfaces replace incidental outlines.
- `layout.md › Adaptability`: “Be prepared for text-size changes.” Flexible rows and scrolling preserve room for text.
- `accessibility.md › Vision`: text scaling, contrast, and non-color selection cues.
- `text-fields.md › Best practices`: clear field purpose and input feedback.
- `motion.md`: meaningful optional motion; reduced-motion alternative.
- `loading.md`: loading feedback reflects work, not simulated percentage completion.
- `generative-ai.md › Transparency`: identify AI and set expectations.

## Before shipping a UI change

Inspect the actual iOS preview from the checkout being edited. Check idle, focus, selected, loading, failure, and completed states relevant to the change. Verify a real source edit arrives through Fast Refresh. Check the screen bottom, long text, keyboard behavior, and larger text. Restore any test-only preview preferences. Do not substitute web screenshots for native verification.

September 24 verification: language selection, Profile header/settings, Home travel/action contrast, Zmanim single header and hero, prayer library search, reader safe areas and input, focus beam, controlled loading/idle transitions, and reduced-motion behavior inspected in the visible iPhone 17 Pro preview. No AI request or consent setting was changed for the visual loading test; the temporary loading override was removed. Native dependencies were unchanged. Older reader lint issues remain separate limitations.

## Prayer activity

Opening a reader starts elapsed wall-clock timing; Done records completion and closes the reader without an extra confirmation. Guided reading is optional and uses the same session. Store start, completion, and elapsed seconds; never invent durations for older entries or manual check-ins. First prayer means once ever, even across days, deleted posts, or bounded history. Milestones remain independently opt-in. Sharing choices save immediately.

Appearance defaults to System, persists on device, and may be overridden with Light or Dark in Profile. Native chrome, utility colors, SVG marks, modals, and inline styles must follow the same resolved scheme. Share artwork has its own fixed palette so exports do not change with device appearance.

## Icon and feedback contract

- Import interface glyphs from `@/components/ui/icons`. This curated Lucide catalog uses one rounded stroke family and a constant 1.75-point optical weight. Native tab symbols retain iOS rendering; brand marks and prayer artwork remain distinct.
- Use 16-point supporting/disclosure icons, 20-point control icons, and 24-point feature icons. Never resize a glyph to compensate for inconsistent padding. Decorative SVGs are hidden from accessibility; the enclosing control supplies its purpose and state.
- Icon-only controls have at least a 44-by-44-point target. The shared Button enforces this floor while preserving larger controls. Circular controls use a 22-point radius; grouped surfaces use the existing radius scale. Separators use `StyleSheet.hairlineWidth`.
- Navigation uses a restrained press response without haptics by default; native tab selection retains its selection tick. Explicit selection, completion, and confirmation feedback should occur once per action. Presses scale in place without vertical movement; Reduced Motion disables the transform. No idle icon animation.
- Checkbox outlines use readable secondary ink. Selected checkmarks use `onAccent`, never a hardcoded white that disappears against the dark theme's light blue.

September 25 icon pass: typecheck, targeted lint, and both-theme text/control contrast tests passed. Native dark captures inspected Home, Profile, Circle, and Prayer. Fast Refresh visibly updated the prayer search surface and shared glyphs from the live checkout. Interactive tap/scroll checks and a fresh light appearance capture remain pending because Device Hub reported the Mac locked. The user's Dark preference and device dark appearance were preserved. No native dependencies changed.

## Scrolling titles

Home, Prayer, Zmanim, Profile, and Circle use the shared large-to-compact header. `Screen` supplies the scroll view; Circle supplies its virtualized FlatList through `AnimatedHeaderSurface`. Do not nest these scroll containers. Reader and modal toolbars keep fixed close/Done actions.

The large editorial title scrolls with content and hands off to a centered 17-point compact title. The measured title height determines the handoff, including larger text. Compact chrome owns the top safe area, uses the resolved theme, and retains header actions. Scroll-linked transforms run on the UI thread; React updates only when the accessible header changes. Reduced Motion switches headers without translation or fading. The opaque surface also remains readable with reduced transparency.

September 25 verification: typecheck and targeted lint passed. Native expanded and programmatically scrolled compact states inspected on Home, Circle, and Profile in the live Expo preview. Temporary scroll offsets were removed and Home restored to its expanded state. Device Hub remained locked, so finger-driven scrolling and on-device accessibility toggles still need manual verification. No native dependency or rebuild was required.

## Cross-screen layout roles

Use `useInterfaceStyles` from `src/design/layout.ts` for neutral cards, emphasized cards, row spacing, section titles, item titles, body text, captions, and prominent time values. Neutral cards use 20-point padding and 26-point corners; emphasized cards use 24-point padding and 32-point corners. Section gaps are 24; list gaps are 12. Grouped rows share the outer card's corners and use straight internal separators. Card children do not add a second horizontal inset.

Typography roles are section 20/28, item title 17/24, body 14/22, caption 13/20, editorial feature 28/36, and prominent time 48/56. Explicit Text variants take precedence over inherited button typography; otherwise tappable descriptions become bold and headings shrink. Standard button labels still inherit their button context. Long prayer descriptions remain readable without a three-line cutoff.

September 25 consistency pass: compared native dark captures of all five main tabs, including the removed empty bookmarks gap in search results, aligned Zmanim rows, corrected Profile text inheritance, and shared Home/Circle feature geometry. Typecheck, targeted lint, and four light/dark contrast tests passed. Interactive testing remains limited by the locked Mac. Preview, appearance preference, and user activity were preserved.

## Activity calendar

Circle's Your activity section includes a Monday-first monthly contribution calendar. Cell intensity represents saved completed prayers and daily check-ins (0, 1, 2, 3+); quotes and milestone announcements are not completions. Tapping a date reveals the recorded prayers, completion times, and available durations. Future days are disabled; month navigation cannot move beyond the current month. Touch targets are at least 44 points and the grid can scroll horizontally at large text sizes or narrow widths.

Activity uses local completion dates and is independent of sharing choices. A reader completion and its corresponding daily habit credit count once. Current streak counts consecutive active days through today or yesterday. Legacy prayer posts can recover otherwise missing historical completions, without duplicating retained sessions. Prayer history and habit dates use the app-scoped durable storage fallback in Expo Go; prayer history retains the latest 5,000 sessions. No fake activity is generated.

Verified in native Circle with existing activity and day details. Typecheck, targeted lint, calendar edge-case tests, legacy recovery tests, and existing streak tests passed (10 tests). Interactive taps remain unverified while the Mac is locked; temporary preview scroll offsets were removed.

## Connected Circle

Circle and Profile lead to the same account/people screen. The former device-only profile editor is retired; its saved data is preserved and can prefill enrollment. Joining requires verified email and explicit enrollment. Existing device activity is never silently published. Shared feed and private device activity are labeled separately; removing a local item explains that a shared copy must be removed from Your people.

The people screen uses shared typography, surfaces, input, button, safe-area/header, and close controls. Account, loading, unconfigured, error, empty-feed, pending-request, report/block, sync-pending, and deletion states are explicit. Without hosted backend configuration, the preview clearly says accounts are unavailable instead of pretending to connect. Native Profile and this unconfigured state were inspected after a clean same-checkout Metro restart; authenticated and interactive states still require a hosted project and an unlocked device.

## Circle subtabs

Circle has two segmented subtabs under its shared title: Your activity and Friends. Your activity opens with the contribution calendar and a virtualized chronological prayer history built from recorded completions plus deduplicated daily check-ins. History is independent of sharing preferences. Friends contains account enrollment, adding a friend by handle, invitations, requests, shared activity, and the weekly quote. Sharing preferences remain available from the activity header. Existing `/people` and invitation links redirect to `/circle?section=friends` and retain the incoming handle. Both subtabs retain the native main tab bar; neither adds a second screen header or close button.

Verified both selected subtab states and the legacy `/people` redirect in native iPhone 17 Pro captures. A same-checkout Metro/Expo Go restart cleared a transient native-module startup failure; no dependency or native code changed. Typecheck, targeted lint, and six existing activity-calendar/history tests passed. Touch-driven verification remains limited by the locked Mac; live friend requests remain gated on the hosted backend configuration.

### Zmanim calendar

Zmanim uses Times / Calendar subtabs with the same segmented control treatment as Circle. Times retains today's local calculations and reminders. Calendar is an offline Gregorian month grid with Hebrew date details, holidays/fasts, Rosh Chodesh, modern Israeli observances, Shabbat readings and Omer counts from the existing kosher-zmanim library. Holiday dots are accompanied by accessible event labels and a textual monthly agenda. Previous/next month and Today provide navigation; adjacent-month days are selectable. Israel/diaspora observance is an explicit persisted preference (diaspora by default), independent of device location. Civil dates represent the daytime Hebrew date; the UI explains the previous-evening boundary and varying fast start times. Calendar browsing does not schedule notifications. Holiday candle-lighting/end times are not supplied by this calendar.

### Personal reminders

Profile → Notifications and the bell in Zmanim lead to one settings screen. All new categories default off; choices can be saved before enabling delivery. Morning, Daily prayers, and Holidays presets select categories without requesting permissions. Enabled categories reveal their time/day or advance-notice controls. Clock fields use explicit 24-hour labels and validation; deadline offsets accept 0–120 minutes, holiday notice 0–14 days. Switches, icon buttons, surfaces, typography, haptics, and motion reuse the shared system.

Notifications use short, neutral wording without streak pressure or captions. Sound is off by default. Quiet hours skip notifications instead of postponing time-sensitive alerts. Shabbat/major-holiday quiet runs from sunset until 8.5° nightfall. Tefillin always excludes Shabbat/major holidays and non-daylight clock times; Chol HaMoed exclusion is configurable. A user's fixed prayer times remain their choice. Astronomical alerts skip unavailable calculations rather than substitute estimated times.

Holiday preparation opens an occurrence-specific, locally saved checklist; completed lists suppress their preparation reminder. It is a personal planning aid, not a complete halachic guide. The calendar links festival starts to their checklists. Notification taps open only allowlisted in-app routes.

### Profile photo

Profile begins with a single portrait control. Its native action sheet offers Take photo, Choose photo, and Remove photo when present. The system picker provides a square crop; the portrait renders circularly. Loading and failures are explicit. Camera permission is requested only after Take photo; simulators explain their missing camera. Cancel leaves the saved portrait intact.

Photos are currently private to this device, explicitly labeled, and stored separately for each Circle account (or a local guest). A staged file is copied into durable app documents before replacing the previous photo. Removal deletes that file. No photo is uploaded or represented as visible to friends. Hosted avatar storage and cross-device synchronization are not implemented.

The live iPhone 17 Pro Profile layout and Fast Refresh were inspected. Typecheck and targeted lint passed. Camera capture, interactive picker cropping, and selection still need physical-device acceptance testing; the simulator cannot capture a live camera photo. Existing native image-picker dependency is reused.

### Siddur library preview

Prayer remains one bottom tab, with Siddur / Find a prayer inside it. The siddur view asks for a tradition once (Ashkenaz, Sefard, or Edot HaMizrach), then presents hierarchical service contents in the source schema's order. English/Hebrew section-title search ignores Hebrew vowel marks. Saved places use the reader's existing bookmark control and durable device storage. Continue reading restores the last section, not an invented printed page number. Previous/Next advances through the chosen work and resets the section scroll; Contents closes the reader. Search results are limited to 60 rendered rows with a refinement message.

The existing source-backed reader loads licensed sections on demand. This is a library preview, not a complete offline siddur or an approved gender-specific edition. The UI explicitly preserves pending rabbinic review; no prayers are rewritten, omitted by gender, or claimed approved. Sefaria's three schemas are recorded by `scripts/generateSiddurOrder.py`; tests require every indexed section exactly once (454/214/129). Source edition metadata and licensing remain handled by prayerService. A complete approved release requires a named edition, rights, documented review, men’s/women’s variants and instructions, calendar/locale conditions, and verified content completeness.

### Activity alignment

Prayer-history cards use one uninterrupted leading text column: title, date, then timing. Every card uses the shared 20-point surface inset, 6-point internal text gaps, and the list's 12-point spacing. A single 16-point trailing chevron indicates that the whole card opens a known prayer; non-navigable check-ins have no false affordance. Avoid icon-led titles with independently aligned footers or redundant Read prayer buttons.

Calendar details, history and connected prayer posts share ActivityTiming. Start time is shown when recorded; legacy completions retain their actual completion time. Missing durations are omitted rather than rendered as repeated failure text. Metadata wraps at large text sizes; durations use tabular figures and a shared trailing alignment. No stored timing or activity was changed. Native scrolled history with existing data was inspected; typecheck, targeted lint and six activity-calendar tests passed. Temporary preview scroll positioning was removed.

### Guided reader

Guided reading uses the resolved parchment surface, never a full-screen accent fill. Hebrew is regular-weight 30/49 in the shared Hebrew font with right-to-left alignment. Pronunciation uses 18/29 primary ink on the neutral surface; meaning uses 17/28 primary ink on parchment. One 24-point outer inset and 28-point section rhythm organize the reading column. Labels describe content directly: Pronunciation and Meaning.

The fixed header and footer sit outside a flexing ScrollView so long passages and Dynamic Type can scroll without being obscured by Finish. Every passage change resets scroll position. A single passage omits redundant progress chrome and the disabled previous control. Multi-passage prayers use a constant-size progress track and passage count. Reduced Motion removes the transition; ordinary passage changes use a short fade without translation. Close, quote selection and completion callbacks remain unchanged.

Modeh Ani was inspected in the native iPhone 17 Pro preview in both light and dark modes. Hebrew, pronunciation, meaning and the footer remained readable. Existing four theme contrast tests, typecheck and targeted lint passed. Temporary appearance/auto-open overrides were removed; saved appearance and prayer text were not changed.

### Direct prayer flow and completion intent

Opening a prayer from search, bookmarks, history or a deep link now opens the readable prayer immediately. The former guided layout is the primary reader; passages form a virtualized continuous list instead of requiring a tap per line. Its bookmark, persistent close, source/options link and footer remain accessible. Source review status stays visible; source details, the assistant and section navigation remain in the secondary options view with Return to prayer.

Timing starts on opening. Only Finish prayer explicitly records completion; opening, elapsed time, scrolling, bookmarking, source details and closing do not infer prayer. Finish uses the existing duplicate-completion guard, updates activity and exits without a second confirmation or share prompt. Source loading/error/empty states cannot log completion. The footer explains the distinction: Finish saves this prayer; closing does not log it. No time threshold hides the exit.

The native direct-open Modeh Ani screen was inspected. Three reader interaction tests verify no completion after waiting, close without completion, direct access to multiple passages, explicit finish, and bookmark/details without completion. Typecheck and targeted lint pass. The test renderer was aligned to the installed React version; production/native dependencies were unchanged.

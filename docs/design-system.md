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

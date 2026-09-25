# Kavanah interface contract

Use this contract for every UI change, including modals and secondary screens. The reference for this pass is [Apple Design Skill](https://github.com/dickwu/apple-design-skill), applied to React Native with the frontend-design skill. Apple principles inform the implementation; this is not a claim of complete HIG conformance.

## Direction

Prayer content comes first. Keep the dark reading environment, warm editorial headings, clear Manrope controls, and restrained periwinkle accents. Motion should answer interaction or communicate real work, rather than decorate an idle screen.

- Canvas `#121214`; surface `#1A1A1E`; raised surface `#242429`.
- Primary text `#F4F4F5`; secondary text `#A1A1AA`; action `#7C8CFF`.
- Text contrast on the standard surface: 15.78:1 primary, 6.77:1 secondary. Dark action text on periwinkle: 6.28:1.
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

September 24 verification: language selection, Profile header/settings, Home travel/action contrast, Zmanim single header and hero, prayer library search, reader safe areas and input, focus beam, controlled loading/idle transitions, and reduced-motion behavior inspected in the visible iPhone 17 Pro preview. No AI request or consent setting was changed for the visual loading test; the temporary loading override was removed. Native dependencies were unchanged. Existing app-wide dark-only appearance and older reader lint issues are separate limitations, not hidden by this pass.

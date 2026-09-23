# React Native Reusables UI

Kavanah uses NativeWind v4 / Tailwind v3 and locally owned React Native Reusables components. The existing Expo 54 app, React Navigation routes, stores, prayer services, notification handlers, and privacy/consent flows are retained.

## Components and styling

- `components.json` maps the Reusables registry to `src/components/ui` and `src/lib/utils` through the existing `@/*` TypeScript alias.
- `babel.config.js` enables the NativeWind JSX transform. `metro.config.js` imports `global.css` with `inlineRem: 16`.
- `App.tsx` imports CSS, applies the navigation theme, and mounts `PortalHost` for Home dialogs. This app uses React Navigation, so it has no Expo Router `_layout.tsx`.
- `global.css` defines the semantic light-theme variables. `tailwind.config.js` maps those variables, existing Kavanah colors, Manrope/Hebrew font families, spacing, radii, and shadows to utilities. The app retains its configured light appearance.
- `Text` includes Kavanah display, title, section, body, and caption variants. `Button` preserves action haptics and reduced-motion support; `size="content"` supports compound rows and stacked content. Use ordinary sizes for standard actions.
- Cards group surfaces; badges describe practice progress and prayer review metadata; switches expose controlled settings; tabs select a story layout. Home sheets use controlled Reusables dialogs. Full-screen reader/settings/story presentations retain native modals and their original state.
- `BouncyAccordion` provides controlled or uncontrolled single-item disclosure with spring opening, a collapsible mode, custom spacing/radius, reduced-motion support, and compound trigger/icon/label/content parts. Profile privacy details use it to keep long explanations scannable.
- Native `View`, `ScrollView`, and safe-area containers remain layout primitives. Native styles are limited to animated/interpolated values, viewport/safe-area dimensions, and Hebrew writing direction. React Navigation retains its native tab-bar style API.

Add a component with:

```sh
npx @react-native-reusables/cli@latest add <component> --styling-library nativewind
```

The initialization CLI's **Inspect project configuration** route was used for this existing app, rather than generating a replacement app. Its doctor assumes the stock template, including Expo Router and additional theme variables; those template checks do not describe this React Navigation/light-theme setup.

## Verification

```sh
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:ui
npx expo export --platform ios --output-dir /tmp/kavanah-ios-preview
```

UI regression tests cover enabled/disabled actions, practice checkbox accessibility, controlled input, switches, and story tabs. Simulator checks cover Home dialogs, prayer search/reading, guided reading, settings, and Zmanim. Simulator previews use Expo Go; MMKV persistence and complete notification behavior still require the existing native development build.

## Preview on Xcode 27

Xcode 27 presents simulators in **Device Hub**. Expo 54's automatic launcher may still look for the old `Simulator.app`. With an iPhone booted and the SDK 54 Expo Go app installed:

```sh
open /Applications/Xcode.app/Contents/Applications/DeviceHub.app
npm start
# In another terminal:
xcrun simctl openurl booted exp://127.0.0.1:8081
```

For earlier Xcode versions, `npx expo start --ios` works with the standard Simulator app.

# Widget font path correction

The single authorized preview build `79dc9d33-e094-4406-ac97-ea9b94c83b0a` ended **ERRORED** on October 14, 2026 at 12:23:51 UTC. Expo confirmed the intended source `7c57a9bacfeaef983db7567519002c2bffd454ba`, version 0.2.0 (5), but Xcode could not open four Manrope font files in `ExpoWidgetsTarget`. There is no installable artifact. The build consumed one included iOS build: final usage was 3/15, with zero overage cents. No retry was started.

The plugin passed no path when creating its Resources group. The installed node-xcode serialized that omission as `path = undefined;`. Local native generation reproduced references resolving to `ios/ExpoWidgetsTarget/undefined/Manrope_400Regular.ttf`, while the copied fonts were directly in `ios/ExpoWidgetsTarget/`. JavaScript exports and config introspection did not check this filesystem relationship.

The correction explicitly sets the Resources group's path to `.` for new and existing generated groups. Font bytes, UI, bundle IDs, App Group entitlements and signing configuration are unchanged.

`scripts/backend/checkWidgetFonts.cjs` reads the generated Xcode project, resolves actual parent-group paths from the widget target's resource phase, verifies that all four files exist and match their installed source bytes, and checks exactly one resource and UIAppFonts registration per font. It failed against the original prebuild with the missing `undefined/` path. It passed after correction and after a second prebuild. CI is configured to generate iOS without installing pods or signing, then run this check; that updated workflow has not run remotely yet.

Reproduce locally after generating iOS in a disposable checkout:

```sh
CI=1 EXPO_NO_DOTENV=1 node node_modules/expo/bin/cli prebuild --platform ios --no-install
node scripts/backend/checkWidgetFonts.cjs
```

The fix is a local follow-up, separate from the published integration revision. Full native compilation and device behavior remain unverified. Publishing this follow-up and consuming another included preview build each require renewed exact approval. Existing signing preflight found active main-app and widget profiles, both covering the same already-registered device and required App Group; no credential/capability changes were made. Do not reuse the authorization consumed by the failed build.

PR #3 remains draft. Its checks for `7c57a9b` passed except GitGuardian was neutral because the PR exceeded its scan size limit; a complete remote secret scan is not established. Local source/archive pattern screening found no candidates but is not proof of absence of secrets. Production remains **NOT READY**; all recovery, hosted/device acceptance, dependency, content/legal and operations gates remain applicable.

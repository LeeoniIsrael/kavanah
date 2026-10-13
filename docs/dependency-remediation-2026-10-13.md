# Targeted dependency remediation — October 13, 2026

This follow-up records local implementation after the candidate review in [the advisory disposition](tooling-advisory-disposition-2026-10-13.md). It is separate from the approved three-commit publication ending at `e24abe7`. No signed-build or launch acceptance is implied.

## PostCSS selector parser

Applied exact **7.1.6** child overrides only beneath the existing `tailwindcss` and `postcss-nested@6.2.0` consumers. Their parent versions and the NativeWind/Expo stack remain unchanged. npm rejects an exact-version override selector for the directly declared Tailwind dependency when it differs from that declaration's range; the parent-name scope preserves the declared Tailwind 3 range instead. The lockfile contains the two expected nested parser copies and no unrelated upgrade.

`test:parser-override` is included in CI. Its four tests verify both consumer resolutions, escaped/Hebrew/RTL/nested selector handling, the actual PostCSS → Tailwind → NativeWind native-style path, and parsing 100,000 flat classes in a separate process with a 256 MiB heap and five-second deadline. The hostile-input check passed in about 118 ms locally, including child startup; this is regression evidence, not a performance guarantee.

With the real override installed in the isolated QA checkout, complete repository CSS was byte-identical to the old-parser baseline for web (42,135 bytes) and iOS mode (34,872 bytes). Conversion through installed `react-native-css-interop` was also deeply equal: 405 web-mode and 407 iOS-mode style-rule entries. These comparisons cover the repository's current styles, not arbitrary future styles or physical-device appearance.

Unsigned native generation with the candidate dependency set used the public `expo-template-bare-minimum@57.0.30` template, offline, `--no-install`, and no private credentials. Both platforms generated successfully. The existing `expo-system-ui` user-interface-style warning occurred in both baseline and candidate; it is not claimed fixed. Native compilation, CocoaPods resolution, signing and device acceptance remain separate gates.

## UUID used by native project generation

Applied exact **11.1.1** only beneath `xcode@3.0.1`; no Expo, xcode or React Native version change. This preserves the CommonJS `uuid.v4()` API used by the installed native-project generator. `test:uuid-override` is included in CI: it checks the resolved package, generates 1,000 identifiers alongside existing IDs, and verifies that the patched v3/v5/v6 methods reject undersized output buffers.

The generated Xcode project passed parse → write → parse equality. All 38 references to its 32 objects resolved; adding a synthetic resource in memory produced 35 objects with 41 resolving references. Its baseline/candidate serialized files matched after normalizing random UUIDs. The other **24 iOS files** and all **42 Android files** were byte-identical. The first resource-add probe assumed a named Resources group absent from Expo's template; the probe was corrected to create that group first. No app/native-source fix was needed, and no generated files were committed.

The final lockfile passed a clean offline install with lifecycle scripts disabled. The fresh npm audit is now **59 affected package entries: 54 high, five moderate, zero critical**, down from 73 before these overrides. The parser and UUID advisories no longer appear; braces, node-forge and sprintf-js remain open. Audit still exits nonzero. Neither reduced counts nor passing unsigned generation constitutes signed-build or launch acceptance.

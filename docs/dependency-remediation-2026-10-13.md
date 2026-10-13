# Targeted dependency remediation — October 13, 2026

This follow-up records local implementation after the candidate review in [the advisory disposition](tooling-advisory-disposition-2026-10-13.md). It is separate from the approved three-commit publication ending at `e24abe7`. No signed-build or launch acceptance is implied.

## PostCSS selector parser

Applied exact **7.1.6** child overrides only beneath the existing `tailwindcss` and `postcss-nested@6.2.0` consumers. Their parent versions and the NativeWind/Expo stack remain unchanged. npm rejects an exact-version override selector for the directly declared Tailwind dependency when it differs from that declaration's range; the parent-name scope preserves the declared Tailwind 3 range instead. The lockfile contains the two expected nested parser copies and no unrelated upgrade.

`test:parser-override` is included in CI. Its four tests verify both consumer resolutions, escaped/Hebrew/RTL/nested selector handling, the actual PostCSS → Tailwind → NativeWind native-style path, and parsing 100,000 flat classes in a separate process with a 256 MiB heap and five-second deadline. The hostile-input check passed in about 118 ms locally, including child startup; this is regression evidence, not a performance guarantee.

With the real override installed in the isolated QA checkout, complete repository CSS was byte-identical to the old-parser baseline for web (42,135 bytes) and iOS mode (34,872 bytes). Conversion through installed `react-native-css-interop` was also deeply equal: 405 web-mode and 407 iOS-mode style-rule entries. These comparisons cover the repository's current styles, not arbitrary future styles or physical-device appearance.

Unsigned native generation with the candidate dependency set used the public `expo-template-bare-minimum@57.0.30` template, offline, `--no-install`, and no private credentials. Both platforms generated successfully. The existing `expo-system-ui` user-interface-style warning occurred in both baseline and candidate; it is not claimed fixed. Native compilation, CocoaPods resolution, signing and device acceptance remain separate gates.

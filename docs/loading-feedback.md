# Loading feedback

Use the shared `CircleLoadingIndicator` for app-owned indeterminate work: startup, prayer text and search, Siddur pages and downloads, location, account actions, photo preparation, sharing, and assistant replies. Loading replaces placeholders and status-only text with three solid dots moving in a staggered wave. Keep ready content and errors readable. Mount only while actual work is pending; never delay completion to show an animation.

The loader inherits the semantic theme color. Buttons use the foreground of their fill and preserve their resting width. Loading labels describe progress to accessibility APIs without adding visible text. Reduced Motion leaves three stationary dots; unmounting cancels the sequence. Native OS and Expo development UI remain platform-owned.

This supersedes the earlier shimmer and assistant orbit loading treatment. Assistant focus decoration remains separate from work status.

Validation: two focused UI tests cover the reduced-motion accessible busy state and submission blocking/restoration. Native iPhone 17 Pro inspection covered wave dots on light/dark surfaces and the actual Home location loading state. A temporary preview exposed and helped fix default-button foreground color selection. The shared simulator restarted during final inspection, limiting final button and system Reduced Motion verification. Temporary preview files and overrides were removed. Existing broad primitives tests fail before execution in the Reanimated worklets setup.

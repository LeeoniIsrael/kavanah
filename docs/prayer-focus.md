# Prayer Focus setup

Configure in Shortcuts exports the bundled, Apple-signed Kavanah Prayer Focus workflow. iOS opens its document handler when available; otherwise the native share sheet offers Shortcuts. Save to Files and opening the saved document is a secondary fallback. Dismissing either screen does not imply installation.

The workflow calculates the current time plus 15 minutes, then enables Do Not Disturb until that time. It replaces an existing Focus and respects the user’s Do Not Disturb exceptions. It does not restore a previously active Focus. Users can edit its duration in Shortcuts or stop Focus in Control Center.

Start Prayer Focus runs the named shortcut using Apple’s x-callback-url interface and returns to /focus-setup. Cancellation, errors and completion have separate messages. A completed callback is not proof that all notifications are silenced. Keep the shortcut name unchanged. Opening a prayer never installs or starts a shortcut automatically.

## Automatic app scheduling

Personal automation triggers cannot be included in a shared shortcut. The setup explains the simpler system option: Settings → Focus → choose a Focus → Add Schedule → App → Kavanah. Expo Go previews appear as Expo Go; production builds appear as Kavanah. No unsupported automation-creation URL is used.

## Rebuilding

Edit assets/shortcuts/PrayerFocus.json, then run `python3 scripts/shortcuts/build.py` on a Mac with Shortcuts installed and internet access. Apple’s signing command produces assets/shortcuts/Kavanah Prayer Focus.shortcut and the matching generated base64 module in src/data/shortcuts/prayerFocus.ts. Commit all three artifacts. The embedded module avoids an Expo Asset dependency during import.

The workflow contains no account identifiers, contacts, network requests, or app data. Signing validates the generic workflow through Apple. Runtime configuration shares only this bundled document with the destination the user chooses.

## Verification

Unit tests check the signed archive, embedded bytes, action ordering, duration token, import fallback, unavailable sharing, callback URLs, and Android settings intent. iOS 26 Simulator accepted the signed document and showed Add Shortcut; the share sheet also offered Shortcuts. Actual installation, timed Focus expiry and app-based scheduling still need physical-device acceptance testing. No installation or Focus activation is inferred from presenting the import screen.

References: [Apple personal automations](https://support.apple.com/en-nz/guide/shortcuts/apd690170742/ios), [Shortcuts command-line signing](https://support.apple.com/guide/shortcuts-mac/run-shortcuts-from-the-command-line-apd455c82f02/mac), [Focus schedules](https://support.apple.com/en-ie/guide/iphone/iph5c3f5b77b/27/ios/27).

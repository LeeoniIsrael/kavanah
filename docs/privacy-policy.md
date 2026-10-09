# Kavanah Privacy Policy

Updated October 8, 2026 — draft for owner and legal review; deployment, processor region, and private support contact must be confirmed before release.

Kavanah is designed to provide prayer text, local Jewish times, reminders, bookmarks, and private habit tracking while collecting as little personal information as possible.

## Information stored on your device

Kavanah stores prayer bookmarks, streak history, language preferences, reminder and Prayer Focus preferences, assistant consent, and security settings on your device. Precise location is used on your device to calculate local zmanim. Kavanah does not sell this information or use it for advertising.

## Location

Location access is optional. If allowed, Kavanah uses your current coordinates to calculate local solar and halachic times. Precise coordinates are not included in prayer-assistant requests. You can revoke location access in device settings. The operating system location and reverse-geocoding services may process coordinates under the device’s settings and their own terms. Kavanah does not send coordinates to Circle or the prayer assistant.

## Prayer assistant

The prayer assistant is optional and remains disabled until you allow it. When used, Kavanah sends your question, the selected prayer text, your chosen language, the prayer's source reference, and its review status through a Kavanah-controlled server to OpenAI for processing. Display translations and transliterations are explicitly identified to the assistant as not rabbinically reviewed. The app and server redact recognizable email addresses, phone numbers, and common street-address patterns where detected. This is best effort and cannot detect all identifying information. Do not submit private, confidential, medical, financial, or identifying information.

The assistant server receives your account access token, verifies your account with Supabase Auth, and processes the verified account ID and connection IP for abuse prevention. It stores keyed account/IP hashes, request identifiers, usage counters, and short-lived concurrency reservations in Supabase; it does not store questions or answers in those tables. OpenAI receives an account hash as a safety identifier, along with the question/context, but does not receive your access token or raw account ID. Hashes and request records are pruned on admitted requests after their enforcement window (daily hashes and two-day duplicate records); idle records can remain until the next admitted request or an operator cleanup. The lifetime counter contains no user identifiers. Hosting/provider access logs have separately configured retention.

Assistant requests are processed for the purpose of answering the question, preventing abuse, and maintaining service reliability. They are not used by Kavanah for advertising. OpenAI's API data handling and retention practices are described in [OpenAI's API data controls](https://developers.openai.com/api/docs/guides/your-data).

## Public text and translation services

Opening uncached library text or searching remote references contacts Sefaria directly with the requested reference or search term and the device connection IP. Non-English prayer display can send public prayer passages and the target language directly to Google's unofficial translation endpoint, with MyMemory (Translated) as a fallback. These services receive the device connection IP. Prayer questions, photos, and account credentials are not sent to translation services by this flow. Production rights, accuracy, and provider terms still require review.

## Notifications

Notifications are optional and are requested only after you enable zmanim reminders. Reminder schedules are created locally on your device. You can disable reminders in Kavanah or device settings.

## Story images

Creating a practice story is optional. A photo you choose stays on your device while Kavanah combines it with a story layout. Kavanah does not upload the photo, add your name, location, or prayer text, or publish it automatically. The finished image is shared only with the destination you choose in your device's system share sheet, and that destination's privacy terms then apply.

## Accounts

An account is required to use Kavanah. Supabase Auth processes your sign-in identifier, provider metadata, and selected prayer-view audience/community for account preferences. Native Apple sign-in requests email access; it does not request your full name. Joining Circle and sharing remain optional. If you join Circle, Supabase also processes your chosen display name/handle, timezone, connection requests, sharing preferences, prayer completion times and durations from enrollment onward, weekly quote selections, and moderation reports. This activity can reveal religious practice. Prior device history is not uploaded by joining. Prayer content and local zmanim remain available to signed-in users without joining Circle.

Updates are shared only with accepted connections according to your choices. Your handle lets people request a connection; names are visible to accepted connections and people involved in pending requests. Blocking removes the connection and prevents either person from reading the other’s updates. Kavanah does not upload your address book. Invitations use the system share sheet and are sent only by you through your chosen service. Invitation URLs include the handle you choose to share.

Cloud data is retained while your account exists unless you remove individual shared updates. Reports are available to authorized operators for safety review. Service providers also process security and delivery logs under their retention settings. Production processor region, backup retention, and support contact must be finalized before public release.

## Data deletion

Deleting Kavanah removes its local app-container data but does not delete a Circle cloud account. Use Profile → Account → Delete account (or Circle → Friends → Delete account) to remove the cloud profile, posts, completion records, connections, and associated records. Active data is deleted when this action succeeds; backup copies expire with the configured backup retention. Deleting your account signs you out and prevents app access until you sign in with an account. Device-only practice remains unless you clear local data; this option is also available on the sign-in screen. Operating-system secure storage can have different uninstall behavior by platform; Kavanah stores the biometric preference and account authentication credentials in operating-system secure storage. Older builds may also retain a pseudonymous installation ID until local reset; new assistant requests do not use it. Sign-out removes the app session. Assistant consent and reminders can be revoked inside Kavanah at any time. Profile → Privacy and data use → Clear local data removes local practice history, bookmarks, annotations, preferences, saved locations, and app-local photos, cancels reminders, clears unsent Circle changes, and signs out. Public downloaded siddur text remains available. This action does not delete a cloud account, images previously exported to Photos or another app, or provider/device backups. Native preference/activity MMKV storage uses a device-only encryption key; reader annotations and image files are not covered by that MMKV encryption. Expo Go and browser previews do not provide the native storage protections.

## Children

Owner review required: confirm the intended age audience and jurisdictions before publishing this draft. Child-directed use or knowingly collecting children’s account or religious-practice information requires qualified review and appropriate parental-consent handling. The application does not implement a parental-consent flow.

## Changes and contact

Material changes will be reflected in this policy and, when necessary, presented in the app for renewed consent. TODO(owner): provide a private support/deletion contact and identify the responsible business. Do not submit personal information or deletion evidence to the public GitHub issue tracker.

## Local reminders and preparation lists

Notification choices, a saved location for calculating times, and holiday checklist completion are stored on your device. Kavanah schedules these reminders locally and does not upload this information to a notification service. You can disable reminders or change their categories, times, quiet hours, and sound in Profile → Notifications. Changing or disabling a reminder reconciles its pending local alerts. Update the saved location when traveling, and open Kavanah regularly to renew the finite local schedule. System notification and Focus settings control delivery. An explicitly requested test notification is separate from automatic reminders.

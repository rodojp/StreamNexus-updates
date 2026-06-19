# StreamNexus Privacy Policy

Effective date: 2026-06-02
Last updated: 2026-06-20

[日本語版はこちら / Japanese translation](./privacy-policy.ja.md)

StreamNexus is a Windows desktop app for Twitch and YouTube stream monitoring, notifications, and multiview playback.
This Privacy Policy explains what information StreamNexus handles and how YouTube API Services data is used.

## 1. Scope

This policy applies to the StreamNexus desktop app, release distribution through this public release repository, and Twitch / Google / YouTube integrations.
StreamNexus shows a policy confirmation screen before users start initial setup or connect Twitch / YouTube.

## 2. Information StreamNexus Handles

StreamNexus may handle the following information and uses it only for the purposes listed below:

- Twitch and YouTube channel IDs, channel names, profile image URLs, live stream status, thumbnails, titles, scheduled or actual live times, watch URLs, and other public video metadata needed to show stream lists, notifications, history, and multiview playback.
- The user's YouTube subscriptions returned by YouTube API Services after OAuth consent. StreamNexus displays this information so the user can choose which channels to monitor.
- User-selected tracked channels, notification settings, multiview layout settings, audio settings, app preferences, and policy confirmation state.
- YouTube OAuth access token and refresh token issued by Google after user consent. These tokens are used only to call authorized YouTube API Services, refresh access, or revoke access.
- Local logs and health information needed for troubleshooting, such as app version, local runtime state, and non-secret diagnostic messages.

StreamNexus is designed not to intentionally store API keys, OAuth client secrets, or OAuth tokens in Git.

## 3. YouTube API Services

StreamNexus uses YouTube API Services. By using YouTube integration in StreamNexus, users also agree to:

- YouTube Terms of Service: <https://www.youtube.com/t/terms>
- Google Privacy Policy: <https://policies.google.com/privacy>

StreamNexus requests the following Google OAuth scope:

- `https://www.googleapis.com/auth/youtube.readonly`

StreamNexus uses this read-only scope to:

- Display the user's YouTube subscriptions inside StreamNexus.
- Check live stream status for tracked YouTube channels.
- Display public video metadata needed for stream monitoring, notifications, and multiview playback.

StreamNexus does not:

- Upload YouTube videos.
- Delete YouTube videos.
- Edit YouTube videos.
- Post comments.
- Manage playlists or channels.
- Sell YouTube API Services data.
- Use YouTube API Services data for advertising, credit scoring, or unrelated profiling.

## 4. Device Storage, Cookies, and Similar Technologies

StreamNexus is a desktop app and stores information on the user's device. This includes encrypted OAuth tokens, local SQLite data, local settings files, Electron session data, localStorage, and troubleshooting logs.

When users open Google OAuth pages, YouTube pages, YouTube embedded players, Twitch pages, or update/support pages, those third-party services may place, access, or recognize cookies, localStorage, session storage, device identifiers, or similar technologies in their own browser or WebView contexts. StreamNexus does not use these technologies for advertising or unrelated tracking.

## 5. Storage, Retention, and Protection

YouTube OAuth tokens are stored locally by StreamNexus and encrypted before being saved in app settings.
Tracked YouTube channels and public stream metadata may be stored locally to provide monitoring, notification, history, and multiview features.
YouTube API Services data that is displayed or stored by StreamNexus is refreshed, updated, or deleted within 30 days where required by the YouTube API Services Developer Policies.
Users can also delete locally stored YouTube authorized data at any time from StreamNexus settings.

StreamNexus uses security procedures to protect the confidentiality of Google user data handled by the app:

- YouTube OAuth access and refresh tokens are stored on the user's Windows device and encrypted before persistence.
- Local app data is protected by the user's Windows account and local file-system permissions.
- OAuth tokens are transmitted only to Google OAuth and YouTube API endpoints when needed for token exchange, token refresh, token revocation, and authorized YouTube API calls.
- StreamNexus uses HTTPS for communication with Google OAuth, YouTube API, update, and support endpoints.
- StreamNexus is designed not to intentionally store API keys, OAuth client secrets, OAuth tokens, or other sensitive credentials in Git.
- Local logs and health information are used for troubleshooting. Users should not publicly share logs that may contain personal data, account identifiers, tokens, or other sensitive information; such details should be redacted before sharing support material.

StreamNexus does not operate a production server that sells or redistributes YouTube API Services data.

## 6. Sharing

StreamNexus does not sell YouTube API Services data.
StreamNexus only shares information when required by user actions, app update delivery, video playback through the relevant platform, troubleshooting, security, or legal obligations.

## 7. Deletion, Disconnect, and Revocation

Users can disconnect YouTube from StreamNexus settings.
When the user disconnects YouTube, StreamNexus programmatically revokes the stored Google OAuth token and then clears the locally stored YouTube OAuth tokens used by the app.
If revocation fails because of a network or server error, StreamNexus keeps the local token so the user can retry revocation.

Users can also use the local YouTube Authorized Data deletion control in StreamNexus settings.
This local deletion removes StreamNexus's locally stored YouTube tracked channels, YouTube stream history, YouTube watch sessions, YouTube stream notes, YouTube claim history rows, and locally stored YouTube OAuth tokens.
This does not delete the user's YouTube account, videos, comments, playlists, channels, or YouTube-side subscriptions.

Users can also revoke StreamNexus access from Google's third-party app access page:

- <https://security.google.com/settings/security/permissions>

If a user wants all local StreamNexus data removed, they should disconnect YouTube, use the local YouTube Authorized Data deletion control, and delete StreamNexus's local app data from Windows.
If assistance is needed, the user can contact StreamNexus support using the contact information below.

## 8. Changes

StreamNexus may update this policy when app functionality, API usage, or compliance requirements change.
Material changes will be reflected on this page and, when appropriate, in release notes or the app UI.

## 9. Contact

For privacy questions, YouTube API Services data questions, data deletion assistance, app support, or security reports, contact:

- General contact: <info@stream-nexus.com>
- Privacy / YouTube API Services data / data deletion: <privacy@stream-nexus.com>
- App support: <support@stream-nexus.com>
- Security and vulnerability reports: <security@stream-nexus.com>
- GitHub support: <https://github.com/rodojp/StreamNexus-updates/issues>

# TwitchZ Privacy Policy

Effective date: 2026-06-02
Last updated: 2026-06-02

TwitchZ is a Windows desktop app for Twitch and YouTube stream monitoring, notifications, and multiview playback.
This Privacy Policy explains what information TwitchZ handles and how YouTube API Services data is used.

## 1. Scope

This policy applies to the TwitchZ desktop app, release distribution through `rodojp/twitchz-updates`, and Twitch / Google / YouTube integrations.
TwitchZ shows a policy confirmation screen before users start initial setup or connect Twitch / YouTube.

## 2. Information TwitchZ Handles

TwitchZ may handle the following information:

- Twitch and YouTube channel IDs, channel names, profile image URLs, live stream status, and public video metadata.
- User-selected tracked channels, notification settings, multiview settings, and app preferences.
- YouTube OAuth access token and refresh token issued by Google after user consent.
- Local logs and health information needed for troubleshooting. TwitchZ is designed not to intentionally store API keys, OAuth client secrets, or OAuth tokens in Git.

## 3. YouTube API Services

TwitchZ uses YouTube API Services. By using YouTube integration in TwitchZ, users also agree to:

- YouTube Terms of Service: <https://www.youtube.com/t/terms>
- Google Privacy Policy: <https://policies.google.com/privacy>

TwitchZ requests the following Google OAuth scope:

- `https://www.googleapis.com/auth/youtube.readonly`

TwitchZ uses this read-only scope to:

- Display the user's YouTube subscriptions inside TwitchZ.
- Check live stream status for tracked YouTube channels.
- Display public video metadata needed for stream monitoring, notifications, and multiview playback.

TwitchZ does not:

- Upload YouTube videos.
- Delete YouTube videos.
- Edit YouTube videos.
- Post comments.
- Manage playlists or channels.
- Sell YouTube API Services data.
- Use YouTube API Services data for advertising, credit scoring, or unrelated profiling.

## 4. Storage and Protection

YouTube OAuth tokens are stored locally by TwitchZ and encrypted before being saved in app settings.
Tracked YouTube channels and public stream metadata may be stored locally to provide monitoring, notification, history, and multiview features.

TwitchZ does not operate a production server that sells or redistributes YouTube API Services data.

## 5. Sharing

TwitchZ does not sell YouTube API Services data.
TwitchZ only shares information when required by user actions, app update delivery, video playback through the relevant platform, troubleshooting, security, or legal obligations.

## 6. Deletion, Disconnect, and Revocation

Users can disconnect YouTube from TwitchZ settings.
When the user disconnects YouTube, TwitchZ clears the locally stored YouTube OAuth tokens used by the app.

Users can remove tracked YouTube channels from the app's YouTube channel management UI.

Users can also revoke TwitchZ access from Google's third-party app access page:

- <https://security.google.com/settings/security/permissions>

If a user wants all local TwitchZ data removed, they should disconnect YouTube, remove tracked channels, and delete TwitchZ's local app data from Windows.
If assistance is needed, the user should contact the support email shown on the Google OAuth consent screen.

## 7. Changes

TwitchZ may update this policy when app functionality, API usage, or compliance requirements change.
Material changes will be reflected on this page and, when appropriate, in release notes or the app UI.

## 8. Contact

For privacy questions or data deletion assistance, contact the support email shown on the Google OAuth consent screen for TwitchZ.

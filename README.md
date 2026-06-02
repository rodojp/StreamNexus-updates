# StreamNexus

StreamNexus is a Windows desktop app for Twitch and YouTube stream monitoring, notifications, and multiview playback.
This repository hosts public release artifacts and compliance documents for StreamNexus.

利用を始める前に、以下の Privacy Policy と Terms of Service を確認してください。
YouTube 連携を使う場合は、Google Privacy Policy と YouTube Terms of Service も適用されます。

## Public URLs

- App home: <https://github.com/rodojp/StreamNexus-updates>
- Releases: <https://github.com/rodojp/StreamNexus-updates/releases>
- Privacy Policy: <https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.md>
- Privacy Policy, Japanese: <https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.ja.md>
- Terms of Service: <https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.md>
- Terms of Service, Japanese: <https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.ja.md>
- Google Privacy Policy: <https://policies.google.com/privacy>
- YouTube Terms of Service: <https://www.youtube.com/t/terms>

## Google / YouTube Integration

StreamNexus uses YouTube API Services only after the user explicitly authorizes Google OAuth.
The requested scope is read-only:

- `https://www.googleapis.com/auth/youtube.readonly`

StreamNexus uses this scope to show the user's YouTube subscriptions, live stream status, and public video metadata inside the app.
StreamNexus does not upload, delete, edit, or manage YouTube videos, comments, playlists, or channels.

## Before Using StreamNexus

The StreamNexus app shows a policy confirmation screen before the user starts initial setup or connects Twitch / YouTube.
Users must confirm the public Privacy Policy and Terms of Service before using app features.

## Disconnect and Revoke Access

Users can disconnect YouTube inside StreamNexus settings, and can also revoke access from Google's third-party app access page:

- <https://security.google.com/settings/security/permissions>

See [Privacy Policy](./privacy-policy.md) for details.

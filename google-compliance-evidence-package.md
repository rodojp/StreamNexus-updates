# StreamNexus Google Compliance Evidence Package

Last updated: 2026-06-04

[日本語版はこちら / Japanese translation](./google-compliance-evidence-package.ja.md)

This file is the working checklist for Google Cloud OAuth verification and YouTube API Services compliance evidence.
It is intended to sit beside the public Privacy Policy, Terms of Service, architecture document, screenshots, and demo video.

## 1. Diagram Assets

Use the raster files for submission attachments when Google asks for images.
The SVG files are retained as editable source.

| Evidence | PNG | JPEG | Source |
| --- | --- | --- | --- |
| Architecture diagram | [PNG](./assets/google-compliance/streamnexus-architecture.png) | [JPEG](./assets/google-compliance/streamnexus-architecture.jpg) | [SVG](./assets/google-compliance/streamnexus-architecture.svg) |
| OAuth user flow | [PNG](./assets/google-compliance/streamnexus-user-flow.png) | [JPEG](./assets/google-compliance/streamnexus-user-flow.jpg) | [SVG](./assets/google-compliance/streamnexus-user-flow.svg) |
| Revocation and local deletion flow | [PNG](./assets/google-compliance/streamnexus-revocation-deletion-flow.png) | [JPEG](./assets/google-compliance/streamnexus-revocation-deletion-flow.jpg) | [SVG](./assets/google-compliance/streamnexus-revocation-deletion-flow.svg) |

## 2. Google Cloud Console Values to Reconfirm

Before final submission, capture or verify these values in Google Cloud Console:

| Field | Expected StreamNexus value |
| --- | --- |
| App name | `StreamNexus` |
| App homepage | `https://github.com/rodojp/StreamNexus-updates` |
| Privacy Policy URL | `https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.md` |
| Terms of Service URL | `https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.md` |
| YouTube scope | `https://www.googleapis.com/auth/youtube.readonly` only |
| OAuth redirect URI | The localhost callback URI used by the packaged or dev app |
| OAuth client | Web application client ID `397918410949-ablo3jr6ulad92vpc08u8luph4i41lus.apps.googleusercontent.com`; do not show the client secret |
| Support email | The same support email shown on the Google OAuth consent screen |
| Branding | No app name containing `Twitch` or `YouTube`; public name should be `StreamNexus` |

## 3. Screenshot Checklist

Screenshots may be captured from the currently working development app if it uses the OAuth client and app name that will be submitted.
If a production OAuth client differs, recapture the OAuth consent screenshots with the production client before final submission.

Current app UI screenshots captured in this package:

- [01-policy-consent.png](./evidence/screenshots/01-policy-consent.png)
- [02-linked-accounts.png](./evidence/screenshots/02-linked-accounts.png)
- [03-youtube-link-button.png](./evidence/screenshots/03-youtube-link-button.png)
- [04-google-consent-app-name.png](./evidence/screenshots/04-google-consent-app-name.png)
- [05-google-consent-expanded-scopes.png](./evidence/screenshots/05-google-consent-expanded-scopes.png)
- [08-local-authorized-data-delete.png](./evidence/screenshots/08-local-authorized-data-delete.png)
- [10-google-cloud-branding-app-info.png](./evidence/screenshots/10-google-cloud-branding-app-info.png)
- [11-google-cloud-branding-terms.png](./evidence/screenshots/11-google-cloud-branding-terms.png)
- [12-google-cloud-data-access-scope-and-demo-video.png](./evidence/screenshots/12-google-cloud-data-access-scope-and-demo-video.png)
- [13-google-cloud-client-redirect-uri.png](./evidence/screenshots/13-google-cloud-client-redirect-uri.png)

Recommended remaining file names:

- `evidence/screenshots/06-youtube-subscriptions-or-channel-import.png`
- `evidence/screenshots/07-youtube-disconnect-confirmation.png`
- `evidence/screenshots/09-google-third-party-access-page.png`

Current screenshot limitations:

- Google Cloud Console Data Access currently still shows empty scope-justification and demo-video URL fields; do not submit until those fields are completed in Google Cloud Console.
- The screenshots committed here intentionally crop or redact account email, account avatar, and client secret values before public publication. The OAuth client ID may be shown because Google asks the demo video to identify the OAuth client, but the client secret must never be shown.

Each screenshot should show:

- The app name `StreamNexus` wherever Google shows the OAuth app name.
- The requested scope details expanded when possible.
- Public Privacy Policy and Terms links in the app before account linking.
- The YouTube disconnect control and local authorized-data deletion control in Settings.
- The Google third-party app access page where StreamNexus access can be removed.

## 4. Demo Video Storyboard

Recommended file name:

- `evidence/demo-video/streamnexus-google-compliance-demo.mp4`

Current generated video:

- [streamnexus-google-compliance-demo.mp4](./evidence/demo-video/streamnexus-google-compliance-demo.mp4)

Scope usage text to paste in Google Cloud Console:

```text
StreamNexus uses https://www.googleapis.com/auth/youtube.readonly only to let a signed-in user view their own YouTube account data inside the desktop app. After OAuth consent, StreamNexus reads YouTube account/subscription-related data to import or select channels, monitor live-stream status, and display public video/live metadata for notifications and multiview playback. The data is shown only in the app UI and stored locally so the user can manage monitored channels. StreamNexus does not upload, edit, delete, comment on, manage videos/playlists/channels, or share/sell/use YouTube data for advertising or AI training. More limited access is insufficient because API-key-only public data cannot identify the user's YouTube account or user-selected/subscribed channels. StreamNexus requests only youtube.readonly and provides disconnect, Google token revocation, and local YouTube authorized-data deletion controls.
```

Suggested recording flow:

1. Show app details: app name `StreamNexus`, OAuth client type `Web application`, OAuth client ID `397918410949-ablo3jr6ulad92vpc08u8luph4i41lus.apps.googleusercontent.com`, and requested scope `https://www.googleapis.com/auth/youtube.readonly`.
2. Start StreamNexus.
3. Show the pre-use policy confirmation screen.
4. Open Settings > Linked Accounts.
5. Click YouTube link.
6. Show Google OAuth consent screen with app name `StreamNexus`.
7. Expand the permission details and show the YouTube read-only access details.
8. Complete authorization if recording an end-to-end private demo.
9. Show a YouTube feature that uses authorized read-only data, such as subscription import, channel selection, live status monitoring, or public video/live metadata display.
10. Return to Settings > Linked Accounts.
11. Disconnect YouTube and show the confirmation.
12. Use the local authorized-data deletion control.
13. Show Google's third-party app access page, if requested by the reviewer.

## 5. Current Engineering Controls

- `POST /api/youtube/auth/logout` revokes the stored Google OAuth token via `https://oauth2.googleapis.com/revoke` before local token clearing.
- If revocation fails due to a network or server error, StreamNexus keeps local tokens so the user can retry instead of silently losing the revocation handle.
- `DELETE /api/youtube/authorized-data` revokes any remaining token, clears local tokens, and deletes local YouTube rows from SQLite.
- Local deletion targets: `tracked_channels`, `stream_history`, `watch_sessions`, `stream_notes`, and `claim_history` rows where `platform = 'youtube'`.
- The Settings screen explains that local deletion does not delete the user's YouTube account, videos, or YouTube-side subscriptions.

## 6. Final Submission Gate

Do not submit the package until these are complete:

- Google Cloud Console values match `StreamNexus`.
- OAuth consent screenshots use the same OAuth client intended for review.
- Scope screenshot is expanded and shows only the required YouTube read-only scope.
- Demo video includes app name, OAuth client ID, policy review, OAuth consent, YouTube feature usage, disconnect, and local deletion. If Google Cloud Console asks for a YouTube link, upload the local MP4 to the intended YouTube account as an unlisted video and paste that URL in Google Cloud Console.
- Google Cloud Console scope justification is filled in before submission.
- Privacy Policy and Terms URLs open without 404 from a non-authenticated browser session.

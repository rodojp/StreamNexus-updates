# StreamNexus Google / YouTube Review Demo Video Script

Last updated: 2026-06-11

## Recording Requirements

- Target length: approximately 6 to 8 minutes.
- Use a real screen recording of the submitted StreamNexus build. Static title cards may be used only as short transitions.
- Use the same Google Cloud project and OAuth client submitted for review.
- Set the Google OAuth consent screen language to English.
- Show the app name and OAuth client ID. Never show the OAuth client secret, access token, refresh token, or personal account details.
- Use a reviewer-safe Google/YouTube account with subscriptions suitable for demonstration.
- Record when at least one selected and tracked subscribed channel is live, or capture a real live transition and its notification history. Do not use mocked/debug-only output as the primary feature evidence.
- Blur account email, avatar, and unrelated personal data before upload.

The app repository includes an opt-in capture helper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/google-review-capture.ps1 -SeedSecureSettings
```

It builds the latest local source, launches StreamNexus with isolated app-data/backend/session paths, copies only the encrypted runtime settings needed for the OAuth client configuration, mutes app audio, and records the full desktop without audio. The raw recording is saved under `%TEMP%` by default. Review and redact the raw recording before copying a final edited video into this public repository.

## Screen Recording Storyboard

| Time | Screen action | English narration |
| --- | --- | --- |
| 0:00-0:25 | Show a short title card with `StreamNexus`, project ID `autogpt-385607`, OAuth client type, OAuth client ID, and `youtube.readonly`. | "This video demonstrates how StreamNexus uses the YouTube Data API and the YouTube read-only OAuth scope. StreamNexus is a Windows desktop application for stream monitoring, notifications, and multiview playback." |
| 0:25-0:50 | Open the owned-domain homepage, then open its Privacy Policy and Terms links. | "The StreamNexus homepage and privacy policy are hosted on a domain owned and verified by the developer. The privacy policy explains how Google and YouTube user data is accessed, stored locally, protected, and deleted." |
| 0:50-1:15 | Launch StreamNexus and show the pre-use policy confirmation screen. | "Before account linking, StreamNexus shows its policy notice and links to the Privacy Policy, Terms of Service, Google Privacy Policy, and YouTube Terms of Service." |
| 1:15-1:40 | Open Settings, Linked Accounts, and show YouTube as disconnected. Click the YouTube connect action. | "The user explicitly starts YouTube account linking from Linked Accounts. StreamNexus does not access the user's YouTube subscriptions before authorization." |
| 1:40-2:25 | Record the complete Google OAuth flow. Show `StreamNexus`, the complete consent screen, and expanded permission details in English. Complete authorization. | "StreamNexus requests only the YouTube read-only scope. This permits the app to view the user's YouTube account and subscriptions. It does not permit upload, edit, delete, comment, playlist management, or channel management actions." |
| 2:25-3:10 | Return to StreamNexus. Open YouTube Channel Manager, select the Subscriptions tab, and visibly load the user's subscription list. Page further if practical. | "After authorization, StreamNexus calls subscriptions.list with mine equal to true to display the authorized user's subscriptions. The app uses this data only so the user can choose channels to monitor." |
| 3:10-3:40 | Select one subscribed channel and add it to tracked channels. Show the tracked-channel list. | "The user explicitly selects which subscribed channels to track. StreamNexus does not automatically monitor every subscription. The selected channel ID, display name, and public profile metadata are stored locally." |
| 3:40-4:30 | Show a selected tracked YouTube channel that is live. Show its live card and refresh/status behavior. | "For tracked channels, StreamNexus checks public live-stream status. It uses low-quota candidate discovery and confirms live videos with public YouTube video metadata. When a selected channel changes to live, the local backend emits a stream-online event." |
| 4:30-5:10 | Show the resulting YouTube in-app toast, desktop notification or notification history. Open the notification or live card. | "The renderer turns the detected stream-online event into a user-facing notification. Depending on user settings, this can appear in notification history, an in-app toast, a desktop notification, or configured auto-open behavior." |
| 5:10-5:45 | Show the YouTube live card and open it in multiview or the relevant details view. Point to title, channel, thumbnail, start time, live status, watch URL, and available viewer information. | "StreamNexus displays public video and live metadata needed for monitoring, notifications, and playback. The app does not modify any YouTube content." |
| 5:45-6:25 | Return to Linked Accounts. Show the YouTube disconnect confirmation and complete disconnect. | "The user can disconnect YouTube in the app. StreamNexus programmatically revokes the Google OAuth token before clearing the locally stored token. If revocation fails, the token is retained so the user can retry." |
| 6:25-6:55 | Show the local YouTube Authorized Data deletion control and confirmation. Complete it with the reviewer-safe account if practical. | "The local Authorized Data deletion control removes locally stored YouTube tokens, tracked-channel rows, stream history, watch sessions, notes, and claim history. It does not delete the user's YouTube account, videos, or YouTube-side subscriptions." |
| 6:55-7:15 | Show the owned-domain Privacy Policy deletion section and, optionally, Google's third-party access page. | "Users can also remove StreamNexus access from Google's third-party access page. These controls and data-handling practices are documented in the StreamNexus Privacy Policy." |
| 7:15-7:35 | End card with owned-domain URLs, scope, and access-status statement. | "StreamNexus is not solely for the developer's internal or personal use. It is currently a private beta for approved external users and is planned for broader public availability after verification." |

## Required Visible Evidence

- [ ] Owned-domain homepage, Privacy Policy, and Terms.
- [ ] Pre-use policy notice.
- [ ] Linked Accounts YouTube connect action.
- [ ] Complete English Google OAuth consent screen.
- [ ] Expanded permission details showing read-only YouTube access.
- [ ] Actual Subscriptions tab loading authorized subscriptions.
- [ ] User selecting a subscribed channel to track.
- [ ] Actual tracked-channel live status.
- [ ] User-facing YouTube live notification or notification history.
- [ ] Public video/live metadata in StreamNexus.
- [ ] YouTube disconnect and Google token revocation explanation.
- [ ] Local YouTube Authorized Data deletion control.

## Do Not Use as Final Evidence

- The existing 60-second slideshow by itself.
- Source-code-only demonstrations.
- A mocked subscription list or mocked live status as the primary proof.
- A Google consent screen from a different OAuth project or client.
- A video with a non-English Google consent screen.
- Screens that expose secrets, OAuth tokens, or personal account data.

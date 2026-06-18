# Google / YouTube Review Response Drafts

Last updated: 2026-06-18

Replace every `<PLACEHOLDER>` before sending. Do not state that an action is complete until it has been verified.

## Current Readiness

- The owned-domain homepage, Privacy Policy, and Terms of Service are publicly accessible:
  - Homepage: <https://stream-nexus.com/>
  - Privacy Policy: <https://stream-nexus.com/privacy/>
  - Terms of Service: <https://stream-nexus.com/terms/>
- The homepage links to the same Privacy Policy URL intended for the OAuth consent screen.
- The root domain publishes a Google Search Console verification TXT record.
- The current demo recording is suitable for both review teams after it is uploaded as an accessible unlisted video.
- The current demo recording shows the complete OAuth consent screen and permission details in English.
- The current demo recording also shows YouTube disconnect, Google OAuth token revocation, and local YouTube Authorized Data deletion.
- As of 2026-06-18, the uploaded YouTube demo at `https://www.youtube.com/watch?v=VrA-SknfniM` has an English caption track.
- Before sending either reply, confirm the saved Google Cloud Console values and confirm that the Search Console verified owner account is also a Project Owner or Editor for project `autogpt-385607`.

## Draft A: YouTube API Services Team

Subject: Re: YouTube API Services review for project 397918410949

```text
Hello YouTube API Services Team,

Thank you for your response. We have prepared a detailed step-by-step screencast showing how StreamNexus uses YouTube API Services and have added English subtitles to the video:

https://www.youtube.com/watch?v=VrA-SknfniM

StreamNexus is a Windows desktop application for Twitch and YouTube stream monitoring, notifications, and multiview playback.

The YouTube API Client is not used solely for the developer's internal or personal use. It is currently distributed as a private beta to approved external users through an access gate, so it is not yet publicly accessible to everyone. Broader public availability is planned after verification and release readiness work is complete.

The YouTube API usage shown in the screencast is:

1. A user explicitly links their YouTube account through Google OAuth.
2. StreamNexus requests only https://www.googleapis.com/auth/youtube.readonly.
3. StreamNexus calls subscriptions.list with mine=true to display the authorized user's YouTube subscriptions.
4. The user explicitly selects which subscribed channels to track. StreamNexus does not automatically monitor every subscription.
5. StreamNexus checks the selected tracked channels for live-stream status and confirms candidate live videos using public YouTube video metadata.
6. StreamNexus informs the user through the tracked-channel live count and live-status channel cards shown in the screencast. When a selected tracked channel changes to live, StreamNexus can also provide an in-app notification, desktop notification, notification-history entry, or configured auto-open behavior.
7. StreamNexus displays public metadata needed for monitoring and playback, including the channel name, stream title, thumbnail, start time, live status, watch URL, and available viewer information.

StreamNexus does not upload, edit, delete, comment on, or manage YouTube videos, playlists, channels, or comments.

The screencast also demonstrates the in-app YouTube disconnect flow, Google OAuth token revocation, and local YouTube Authorized Data deletion control.

Approximate video guide:
- 0:00 - StreamNexus purpose and YouTube API Services scope.
- 0:07 - Owned-domain homepage, Privacy Policy, and Terms of Service.
- 0:17 - In-app policy notice and user-started YouTube account linking.
- 0:32 - Google OAuth flow for StreamNexus.
- 0:48 - English permission details for the YouTube read-only scope.
- 1:08 - Authorized subscriptions and user-selected channel tracking.
- 1:23 - YouTube live-status display, notification behavior, and public video metadata.
- 1:40 - Multiview playback using the public YouTube watch page/metadata.
- 1:52 - YouTube disconnect, Google OAuth token revocation, and local Authorized Data deletion.

Public launch timeline:
- 2026-06-18: StreamNexus is available as a private beta for approved external users. The owned-domain homepage, Privacy Policy, Terms of Service, and support pages are live at stream-nexus.com.
- 2026-06-18: English subtitles have been added to the submitted demo video for this follow-up response.
- 2026-06-30: We plan to complete the current reviewer-requested follow-up materials and Cloud Console review updates.
- 2026-09-30: We plan to continue private beta testing, stability improvements, installer and release checks, and any additional reviewer-requested compliance updates.
- 2026-11-30: We plan to prepare the public release candidate with the YouTube features shown in the screencast.
- 2026-12-31: Target public launch window for the Windows desktop app with the YouTube features shown in the screencast, including YouTube account linking, subscription display, selected-channel tracking, live-status monitoring, notifications, public video metadata display, and multiview playback. If Google OAuth verification or quota approval completes after this launch window, public launch will move to after the required approvals are granted.

Homepage: https://stream-nexus.com/
Privacy Policy: https://stream-nexus.com/privacy/

Please let us know if you need any additional information or reviewer access instructions.

Thank you,
StreamNexus Developer
```

## Draft B: Google Third Party Data Safety Team

Subject: Re: Verification request for project 397918410949 / autogpt-385607

```text
Hello Third Party Data Safety Team,

Thank you for your review. We updated the StreamNexus Privacy Policy for project 397918410949 (Project ID: autogpt-385607) to include explicit data protection mechanisms for Google user data and sensitive data.

Updated Privacy Policy:
https://stream-nexus.com/privacy/

English version:
https://stream-nexus.com/privacy/en/

The updated Privacy Policy now states that:

1. YouTube OAuth access and refresh tokens are stored on the user's Windows device and encrypted before persistence.
2. Local app data is protected by the user's Windows account and local file-system permissions.
3. OAuth tokens are transmitted only to Google OAuth and YouTube API endpoints when needed for token exchange, token refresh, token revocation, and authorized YouTube API calls.
4. StreamNexus uses HTTPS for communication with Google OAuth, YouTube API, update, and support endpoints.
5. StreamNexus is designed not to intentionally store API keys, OAuth client secrets, OAuth tokens, or other sensitive credentials in Git.
6. Local logs and health information are used only for troubleshooting, and users are instructed not to publicly share logs that may contain personal data, account identifiers, tokens, or other sensitive information.
7. Users can disconnect YouTube, revoke Google OAuth access, and delete locally stored YouTube Authorized Data.

The Privacy Policy URL remains:
https://stream-nexus.com/privacy/

We updated and resubmitted the app in Cloud Console with this Privacy Policy URL. Please continue the verification review.

Please let us know if any additional information is required.

Thank you,
StreamNexus Developer
```

## Pre-Send Checklist

- [ ] Every placeholder has been replaced.
- [ ] Owned-domain pages open without login in a private browser window.
- [ ] Search Console ownership is verified by the correct Cloud project Owner account.
- [ ] Google Cloud Console Branding values exactly match `https://stream-nexus.com/`, `https://stream-nexus.com/privacy/`, and `https://stream-nexus.com/terms/`.
- [ ] Google Cloud Console authorized domains contain `stream-nexus.com` and do not rely on `github.com`.
- [ ] The live Privacy Policy includes explicit Google user data protection mechanisms: encryption, local device storage, Windows account/file-system permissions, HTTPS, limited Google/YouTube endpoint transmission, credential handling, log handling, and deletion/revocation controls.
- [ ] Google Cloud Console has been updated and resubmitted after the Privacy Policy update.
- [ ] The final video URL is an accessible unlisted YouTube URL.
- [ ] English subtitles are uploaded to the YouTube video and visible from the YouTube player captions menu.
- [ ] The OAuth verification video uses the submitted OAuth client and shows the complete consent screen in English.
- [ ] The claims in each reply match what is actually shown in the linked video.
- [ ] If the launch date changes, update the public launch timeline before sending the YouTube API Services Team reply.
- [ ] Reviewer access instructions are included if the private-beta access gate blocks review.
- [ ] Reply is sent directly in each original reviewer email thread.

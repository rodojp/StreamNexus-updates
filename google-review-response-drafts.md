# Google / YouTube Review Response Drafts

Last updated: 2026-06-11

Replace every `<PLACEHOLDER>` before sending. Do not state that an action is complete until it has been verified.

## Draft A: YouTube API Services Team

Subject: Re: YouTube API Services review for project 397918410949

```text
Hello YouTube API Services Team,

Thank you for your response. We have prepared a new detailed screencast showing how StreamNexus uses YouTube API Services:

<UNLISTED_YOUTUBE_DEMO_VIDEO_URL>

StreamNexus is a Windows desktop application for Twitch and YouTube stream monitoring, notifications, and multiview playback.

The YouTube API Client is not used solely for the developer's internal or personal use. It is currently distributed as a private beta to approved external users through an access gate, so it is not yet publicly accessible to everyone. Broader public availability is planned after verification and release readiness work is complete.

The YouTube API usage shown in the screencast is:

1. A user explicitly links their YouTube account through Google OAuth.
2. StreamNexus requests only https://www.googleapis.com/auth/youtube.readonly.
3. StreamNexus calls subscriptions.list with mine=true to display the authorized user's YouTube subscriptions.
4. The user explicitly selects which subscribed channels to track. StreamNexus does not automatically monitor every subscription.
5. StreamNexus checks the selected tracked channels for live-stream status and confirms candidate live videos using public YouTube video metadata.
6. When a selected tracked channel changes to live, StreamNexus displays the live stream in the app and can provide an in-app notification, desktop notification, notification-history entry, or configured auto-open behavior.
7. StreamNexus displays public metadata needed for monitoring and playback, including the channel name, stream title, thumbnail, start time, live status, watch URL, and available viewer information.

StreamNexus does not upload, edit, delete, comment on, or manage YouTube videos, playlists, channels, or comments.

The screencast also demonstrates the in-app YouTube disconnect flow, Google OAuth token revocation, and local YouTube Authorized Data deletion control.

Homepage: <OWNED_DOMAIN_HOMEPAGE_URL>
Privacy Policy: <OWNED_DOMAIN_PRIVACY_POLICY_URL>

Please let us know if you need any additional information or reviewer access instructions.

Thank you,
<NAME>
```

## Draft B: Google Third Party Data Safety Team

Subject: Re: Verification request for project 397918410949 / autogpt-385607

```text
Hello Third Party Data Safety Team,

Thank you for your review. We have addressed the requested items for project 397918410949 (Project ID: autogpt-385607).

1. We moved the StreamNexus application homepage and Privacy Policy to a domain owned by the developer:
   Homepage: <OWNED_DOMAIN_HOMEPAGE_URL>
   Privacy Policy: <OWNED_DOMAIN_PRIVACY_POLICY_URL>
   Terms of Service: <OWNED_DOMAIN_TERMS_URL>

2. We verified ownership of <OWNED_DOMAIN> in Google Search Console using an account that is also a Project Owner for the Cloud project.

3. We updated the homepage, Privacy Policy, Terms of Service, and authorized domain values in Google Cloud Console.

4. We created a new detailed demo video that shows the complete OAuth grant process and the StreamNexus functionality that uses the requested YouTube read-only scope:
   <UNLISTED_YOUTUBE_DEMO_VIDEO_URL>

The video demonstrates the complete English OAuth consent screen, the authorized subscription list, user-selected channel tracking, YouTube live-status monitoring and notifications, public video/live metadata display, disconnect and token revocation, and local YouTube Authorized Data deletion.

Please continue the verification review. Let us know if any additional information or reviewer access instructions are required.

Thank you,
<NAME>
```

## Pre-Send Checklist

- [ ] Every placeholder has been replaced.
- [ ] Owned-domain pages open without login in a private browser window.
- [ ] Search Console ownership is verified by the correct Cloud project Owner account.
- [ ] Cloud Console Branding and authorized domain values match the live URLs.
- [ ] The final video URL is an accessible unlisted YouTube URL.
- [ ] The video uses the submitted OAuth client and shows the complete English consent screen.
- [ ] Reviewer access instructions are included if the private-beta access gate blocks review.
- [ ] Reply is sent directly in each original reviewer email thread.

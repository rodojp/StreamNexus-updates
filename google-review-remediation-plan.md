# Google / YouTube Review Remediation Plan

Last updated: 2026-06-11

## Purpose

This plan addresses the latest requests from:

- YouTube API Services Team: provide a detailed screencast of YouTube API usage and confirm who can access the API Client.
- Google Third Party Data Safety Team: move the homepage and Privacy Policy to an owned and verified domain, update Cloud Console, and provide a sufficient demo video.

## Current Audit Result

### Blocking: owned and verified domain

The current submission URLs do not satisfy the latest reviewer request:

- Homepage: `https://github.com/rodojp/StreamNexus-updates`
- Privacy Policy: `https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.md`
- Terms of Service: `https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.md`
- In-app links: `frontend/src/lib/complianceLinks.ts`

GitHub and GitHub Pages are third-party hosting domains. The public GitHub repository's About website field still points to `https://rodojp.github.io/StreamNexus-updates/`. The configured Cloudflare account currently has no Zones or Pages projects, so no owned-domain candidate was confirmed during this audit.

Required target shape:

- Homepage: `https://<owned-domain>/`
- Privacy Policy: `https://<owned-domain>/privacy/`
- Terms of Service: `https://<owned-domain>/terms/`

The pages must be public without login, use responsive HTML, identify StreamNexus, describe its functionality, and link to each other.

A static host such as Cloudflare Pages may be used after an owned custom domain is attached. Submit only the owned custom-domain URLs to Google, not a `pages.dev`, `github.io`, or repository URL.

### Blocking: insufficient demo video

The existing `streamnexus-google-compliance-demo.mp4` is a 60-second, 1920x1080 slideshow. It does not show an end-to-end screen recording of:

- the OAuth grant process;
- the actual subscription list being loaded;
- a user selecting a subscribed channel to track;
- the app detecting and notifying a live-stream status change;
- public video/live metadata displayed in the app.

It should be replaced with a narrated screen recording based on `google-review-demo-video-script.md`.

### Confirmed implementation behavior

- StreamNexus requests only `https://www.googleapis.com/auth/youtube.readonly`.
- The authorized subscription list is loaded with `subscriptions.list` using `part=snippet`, `mine=true`, and `maxResults=50`.
- The user chooses which subscription or searched channel to track. StreamNexus does not automatically monitor every subscription.
- Tracked-channel live status is checked locally. Candidate live videos are confirmed with public YouTube metadata, including `videos.list`.
- A newly detected YouTube live stream is broadcast as `stream.online`; the renderer can show notification history, in-app toast, desktop notification, and configured auto-open behavior.
- Public metadata displayed by the app includes channel name, title, thumbnail, start time, live status, watch URL, and available viewer information.
- In-app disconnect revokes the Google OAuth token before clearing local tokens.
- The local YouTube Authorized Data deletion control removes locally stored YouTube rows and tokens.

### Correct access-status statement

Do not describe the API Client as internal/self-use only or as already accessible to everyone.

Accurate current statement:

> StreamNexus is not used solely for the developer's internal or personal use. It is currently distributed as a private beta to approved external users through an access gate, and it is not yet publicly accessible to everyone. Broader public availability is planned after verification and release readiness work is complete.

## Required Execution Order

1. Acquire or identify a domain owned by the project owner.
2. Publish the homepage, Privacy Policy, and Terms of Service as HTML under that domain.
3. Verify domain ownership in Google Search Console using a Google account that is also a Project Owner for project `autogpt-385607`.
4. Update Google Cloud Console Branding:
   - homepage URL;
   - Privacy Policy URL;
   - Terms of Service URL;
   - authorized domain.
5. Update StreamNexus in-app compliance links and public compliance documents to the final owned-domain URLs.
6. Record a new detailed screencast from the same app build and OAuth project submitted for review.
7. Upload the video as an unlisted YouTube video and update the Demo Video URL in Cloud Console.
8. Save and resubmit the verification request.
9. Reply directly to both reviewer email threads using `google-review-response-drafts.md`.

## Domain Launch Checklist

- [ ] Domain registration is controlled by the project owner.
- [ ] HTTPS is enabled.
- [ ] Homepage identifies `StreamNexus` and describes stream monitoring, notifications, and multiview playback.
- [ ] Homepage links to the exact Privacy Policy URL submitted in Cloud Console.
- [ ] Privacy Policy is a dedicated HTML page on the same owned domain.
- [ ] Privacy Policy explains Google user data access, use, storage, sharing, protection, retention, and deletion.
- [ ] Terms of Service is a dedicated HTML page on the same owned domain.
- [ ] All pages open in a signed-out/private browser session without redirects to another domain.
- [ ] Search Console ownership is verified by a Cloud project Owner account.
- [ ] Cloud Console authorized domain and Branding URLs exactly match the published pages.
- [ ] `frontend/src/lib/complianceLinks.ts` uses the final owned-domain URLs.

## Submission Go/No-Go Gate

Do not reply that remediation is complete until all of the following are true:

- Owned-domain pages are live and verified.
- Cloud Console contains the new URLs and authorized domain.
- The new video shows real interactions, not only screenshots or slides.
- The video shows the complete English Google OAuth consent screen and requested scope.
- The video demonstrates subscription import, selected-channel monitoring, live notification behavior, and public metadata display.
- The video identifies the app name and OAuth client ID, but never exposes the OAuth client secret or tokens.
- The final unlisted YouTube video URL is entered in Cloud Console.

## Official References

- Verification requirements: <https://support.google.com/cloud/answer/13464321>
- App homepage requirements: <https://support.google.com/cloud/answer/13807376>
- App Privacy Policy requirements: <https://support.google.com/cloud/answer/13806988>
- Domain verification: <https://support.google.com/cloud/answer/13804266>
- OAuth Data Access and demo video guidance: <https://support.google.com/cloud/answer/15549135>
- YouTube quota and compliance audits: <https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits>
- YouTube API Services Developer Policies: <https://developers.google.com/youtube/terms/developer-policies>

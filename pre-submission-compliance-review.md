# StreamNexus Pre-Submission Compliance Review

Last updated: 2026-06-04

[日本語版はこちら / Japanese translation](./pre-submission-compliance-review.ja.md)

This is a non-lawyer, engineering-focused review for Google Cloud OAuth verification and YouTube API Services compliance audit preparation.
It is not legal advice and should not replace attorney review.

## 1. Review Verdict

VERDICT: REVISE BEFORE FINAL AUDIT SUBMISSION

StreamNexus has the core public policy pages, in-app policy links, pre-use policy confirmation, minimum YouTube read-only scope, and account disconnect UI in place.
The token revocation and local authorized-data deletion improvements are now implemented, but the package should still be revised before final audit submission in the following areas:

- Screenshot / demo video evidence captured from the exact production OAuth configuration.
- Final Google Cloud Console values, support email, authorized domains, and branding must be checked after the StreamNexus rename.
- GitHub repository metadata should not point reviewers to the retired GitHub Pages / deployments URL.

## 2. What Looks Ready

| Area | Evidence | Review result |
| --- | --- | --- |
| App name avoids Google / YouTube brand confusion | Product-facing name is `StreamNexus` | Looks appropriate for submission |
| Public homepage | `https://github.com/rodojp/StreamNexus-updates` | Ready as an interim public page |
| Public privacy policy | `privacy-policy.md` in public release repository | Ready for review |
| Public Terms of Service | `terms-of-service.md` in public release repository | Ready for review |
| Google Privacy Policy link | Policy docs, policy consent screen, settings screen | Ready |
| YouTube Terms link | Privacy Policy and Terms | Ready |
| Pre-use policy disclosure | `PolicyConsentScreen` appears before setup and account linking | Ready |
| Scope minimization | Only `https://www.googleapis.com/auth/youtube.readonly` is requested | Ready |
| YouTube write actions | No upload, edit, delete, comment, playlist, or channel management scope is requested | Ready |
| Token storage | YouTube access and refresh tokens are encrypted before local settings storage | Ready, assuming `SETTINGS_ENCRYPTION_KEY` is correctly provisioned |
| Programmatic token revocation | `POST /api/youtube/auth/logout` calls Google's token revoke endpoint before clearing local tokens | Implemented, screenshot/demo evidence pending |
| Local YouTube Authorized Data deletion | `DELETE /api/youtube/authorized-data` deletes local YouTube SQLite rows and clears tokens | Implemented, screenshot/demo evidence pending |
| Access Gate separation | Google ID token access gate is documented as separate from YouTube OAuth | Ready for supplemental explanation |

## 3. Required or Strongly Recommended Fixes

### Issue 1: Programmatic Google token revocation evidence still needs capture

Severity: Major

Current app behavior:

- In-app YouTube disconnect calls `POST /api/youtube/auth/logout`.
- The backend calls Google's OAuth token revocation endpoint before clearing locally stored YouTube access and refresh tokens.
- If revocation fails because of a network or server error, local tokens are kept so the user can retry.
- The app links users to Google's third-party app access page.

Policy concern:

- The YouTube API Services Developer Policies require an easy revocation path.
- When revocation happens through the API Client's mechanism, the API Client should programmatically revoke the token and delete Authorized Data connected to that consent.

Recommended remediation:

- Capture app screenshots and demo video showing the disconnect control and confirmation.
- Capture or provide test output showing revocation success and explicit failure handling.
- Confirm the Google consent screen app name and scope match the submitted OAuth configuration.

Suggested evidence after remediation:

- Integration test for token revoke request.
- Screenshot of in-app disconnect.
- Log or test output showing tokens are revoked or an explicit error is returned.

### Issue 2: Authorized Data deletion workflow evidence still needs capture

Severity: Major

Current app behavior:

- Users can use the local authorized-data deletion control from StreamNexus settings.
- The backend revokes any remaining token, clears local YouTube OAuth tokens, and deletes local YouTube rows from SQLite.
- Local deletion covers `tracked_channels`, `stream_history`, `watch_sessions`, `stream_notes`, and `claim_history` rows where `platform = 'youtube'`.
- The Privacy Policy describes the exact deletion behavior and clarifies that YouTube account data is not deleted.

Policy concern:

- YouTube policy expects Authorized Data to be deleted after revocation.
- A manual local-data deletion instruction is useful, but final audit evidence is stronger if the app has a clear first-party deletion action or documented deletion routine.

Recommended remediation:

- Capture the local deletion control in Settings.
- Capture the deletion confirmation text explaining that YouTube account, videos, and YouTube-side subscriptions are not deleted.
- Keep the integration test and Privacy Policy language available as supplemental evidence.

Suggested evidence after remediation:

- Screenshot of deletion / disconnect UI.
- Test proving token and relevant local YouTube authorized data are removed.
- Updated Privacy Policy language describing the exact deletion behavior.

### Issue 3: Google Cloud Console configuration must be verified after rename

Severity: Major

Review concern:

- The app name changed from TwitchZ to StreamNexus.
- OAuth consent screen app name, homepage, privacy policy, terms URL, support email, and authorized domain values must match the submitted app.
- Google's branding guidance warns against names that may be confused with Google or YouTube brands.

Recommended remediation:

- Confirm Google Cloud Console uses:
  - App name: `StreamNexus`
  - Homepage: `https://github.com/rodojp/StreamNexus-updates`
  - Privacy Policy: `https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.md`
  - Terms of Service: `https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.md`
  - Scope: `https://www.googleapis.com/auth/youtube.readonly`
  - Redirect URI: `http://localhost:5173/settings/youtube/callback`
- Capture evidence only after those values are live.

### Issue 4: Public GitHub URL is acceptable as an interim page, but a verified domain is safer

Severity: Minor

Review concern:

- Google OAuth branding and authorized domain requirements may be easier to satisfy with a domain controlled through Google Search Console.
- GitHub URLs are public and stable enough for interim docs, but ownership and authorized domain handling should be checked in Google Cloud Console.

Recommended remediation:

- Use the GitHub release repository for immediate submission only if Google Cloud Console accepts the domain configuration.
- Consider moving homepage, Privacy Policy, and Terms to a controlled domain before broader public release.

### Issue 5: Demo video and screenshots are still pending

Severity: Minor

Required evidence:

- End-to-end app flow.
- Policy consent screen.
- OAuth grant process.
- Complete Google consent screen.
- Expanded scope list.
- Feature using the requested scope.
- In-app disconnect and Google-side revocation page.

Recommended remediation:

- Capture screenshots and a short demo video from the same build and Google Cloud project submitted for review.

### Issue 6: Public repository metadata still appears to reference the retired GitHub Pages URL

Severity: Minor

Review concern:

- The public repository README uses `https://github.com/rodojp/StreamNexus-updates`.
- The GitHub repository About website field may still show `https://rodojp.github.io/StreamNexus-updates/`.
- The project decision is to stop using deployments / GitHub Pages.

Recommended remediation:

- Clear the GitHub repository About website field, or set it to `https://github.com/rodojp/StreamNexus-updates`.
- Confirm the Google Cloud Console homepage value matches the final public URL.

## 4. Submission Evidence Checklist

| Evidence item | Owner action | Status |
| --- | --- | --- |
| Public homepage URL | Confirm GitHub rename and README content | Ready |
| Privacy Policy URL | Confirm public URL opens without 404 | Ready |
| Terms URL | Confirm public URL opens without 404 | Ready |
| Japanese policy links | Confirm public URL opens without 404 | Ready |
| OAuth consent screen screenshot | Capture after Google Cloud rename | Pending |
| Expanded scopes screenshot | Capture with all scopes visible | Pending |
| In-app pre-use policy screen screenshot | Capture current app screen | Pending |
| Linked Accounts screen screenshot | Capture YouTube link / unlink state | Pending |
| Google third-party app access screenshot | Capture StreamNexus revoke page | Pending |
| Demo video | Record complete OAuth and feature flow | Pending |
| Token revocation implementation evidence | Implement and test | Pending |
| Authorized data deletion evidence | Implement or document exact procedure | Pending |
| GitHub repository About URL | Clear retired GitHub Pages URL or replace with GitHub repository URL | Pending |

## 5. Recommended Scope Justification Text

Use this as draft text for Google Cloud Console scope justification.

```text
StreamNexus requests https://www.googleapis.com/auth/youtube.readonly to let a user view their own YouTube subscriptions inside the desktop app, select channels to monitor, and display live stream status and public video metadata for notifications and multiview playback. StreamNexus does not upload, edit, delete, comment on, or manage YouTube videos, playlists, channels, or comments. The app uses the minimum read-only scope needed for the user-facing subscription import and stream monitoring features.
```

## 6. Recommended Demo Video Script

1. Open StreamNexus.
2. Show the pre-use policy consent screen with Privacy Policy, Terms, Google Privacy Policy, and Japanese links.
3. Confirm policy review.
4. Open settings and show Linked Accounts.
5. Click YouTube link.
6. Show Google OAuth consent screen with `StreamNexus`.
7. Expand permissions and show the read-only YouTube scope.
8. Complete consent.
9. Return to StreamNexus and show subscription/channel selection or YouTube live monitoring behavior.
10. Return to Linked Accounts and show YouTube disconnect.
11. Open Google's third-party access settings page and show where StreamNexus access can be removed.

## 7. Recommended Screenshot Names

- `01-streamnexus-policy-consent.png`
- `02-linked-accounts-youtube-disconnected.png`
- `03-google-oauth-consent-streamnexus.png`
- `04-google-oauth-expanded-scopes.png`
- `05-youtube-feature-using-readonly-scope.png`
- `06-linked-accounts-youtube-disconnect.png`
- `07-google-third-party-access-revoke.png`

## 8. Final Legal Review Notes

- This review cannot determine whether the public policies are sufficient under every jurisdiction's privacy law.
- Before broad public release, have an attorney review the Privacy Policy, Terms of Service, support contact, deletion process, and any data retention claims.
- Do not submit screenshots or videos that still show the old `TwitchZ` app name unless the old name is intentionally part of historical release evidence.

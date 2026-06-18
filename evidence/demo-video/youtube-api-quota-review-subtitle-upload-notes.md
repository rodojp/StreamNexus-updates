# YouTube API Quota Review Subtitle Upload Notes

Last updated: 2026-06-18

Upload `youtube-api-quota-review-subtitles-en.srt` to the submitted demo video before replying to the YouTube API Services Team.

Video URL:

- <https://www.youtube.com/watch?v=VrA-SknfniM>

Local verification on 2026-06-18:

- `yt-dlp --dump-json --skip-download https://www.youtube.com/watch?v=VrA-SknfniM`
- `duration`: `125`
- `subtitles`: empty
- `automatic_captions`: empty

Recommended YouTube Studio steps:

1. Open YouTube Studio.
2. Open the uploaded demo video.
3. Go to `Subtitles`.
4. Add language `English`.
5. Upload `youtube-api-quota-review-subtitles-en.srt`.
6. Publish the subtitle track.
7. Reopen the public/unlisted video URL in a private browser window and confirm that English captions are selectable from the player captions menu.

Do not send the quota response until the captions are visible in the YouTube player.

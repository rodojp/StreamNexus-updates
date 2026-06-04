# Google Cloud / YouTube API 提出メモ

このメモは StreamNexus の Google Cloud OAuth verification / YouTube API Services compliance 提出用に、公開 URL、OAuth スクリーンショット、削除・取り消し証跡をそろえるための作業リストです。

## 公開 URL 方針

GitHub Pages / deployments は使わず、公開配布リポジトリ `rodojp/StreamNexus-updates` の通常ファイル URL を固定 URL として使う。

- Homepage:
  - `https://github.com/rodojp/StreamNexus-updates`
- Releases:
  - `https://github.com/rodojp/StreamNexus-updates/releases`
- Privacy Policy:
  - `https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.md`
  - Japanese: `https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.ja.md`
- Terms of Service:
  - `https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.md`
  - Japanese: `https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.ja.md`

注記: 製品名と公開配布 repo URL は `StreamNexus` / `rodojp/StreamNexus-updates` に統一済み。一般公開や brand verification 前には、所有確認できる独自ドメインへ移すことも検討する。

`docs/compliance/privacy-policy.md`、`docs/compliance/privacy-policy.ja.md`、`docs/compliance/terms-of-service.md`、`docs/compliance/terms-of-service.ja.md`、`docs/compliance/streamnexus-updates-readme.md` は、`StreamNexus-updates` 側に置く文面の正本候補として管理する。

`README.md` のトップにアプリ概要、利用前の Privacy Policy / Terms 確認、YouTube API Services 利用、Google Privacy Policy / YouTube Terms of Service / 取り消し URL へのリンクを置く。

GitHub repository の About website 欄に `https://rodojp.github.io/StreamNexus-updates/` などの GitHub Pages URL が残っている場合は、空欄にするか `https://github.com/rodojp/StreamNexus-updates` へ変更する。deployments / GitHub Pages は現在の提出 URL として使わない。

## 監査補足資料

Google Cloud / YouTube API compliance audit 向けには、次の補足資料も提出・参照候補にする。

- Architecture and user flows:
  - `google-compliance-architecture-and-flows.md`
  - Japanese: `google-compliance-architecture-and-flows.ja.md`
- Pre-submission compliance review:
  - `pre-submission-compliance-review.md`
  - Japanese: `pre-submission-compliance-review.ja.md`
- Evidence package checklist and raster diagrams:
  - `google-compliance-evidence-package.md`
  - Japanese: `google-compliance-evidence-package.ja.md`
  - `assets/google-compliance/*.png`
  - `assets/google-compliance/*.jpg`

`pre-submission-compliance-review.md` は正式な法務意見ではなく、提出前の技術・コンプライアンス観点レビューとして扱う。
アプリ内 YouTube 連携解除時の Google token programmatic revocation と、YouTube Authorized Data の削除 workflow は実装済みのため、最終監査提出前は screenshot / demo video evidence と Google Cloud Console 値の一致確認を追跡する。

## Google OAuth consent screen に入れる値

- App name:
  - `StreamNexus`
- App domain / Homepage:
  - `https://github.com/rodojp/StreamNexus-updates`
- Privacy Policy:
  - `https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.md`
- Terms of Service:
  - `https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.md`
- Authorized redirect URI:
  - `http://localhost:5173/settings/youtube/callback`
- Scope:
  - `https://www.googleapis.com/auth/youtube.readonly`

サポートメールは、公開提出前に実運用で受け取れるメールアドレスへ統一する。
Privacy Policy の Contact セクションも、Google OAuth consent screen と同じサポートメールが分かる表現にする。

## 提出用スクリーンショット

### 1. Consent Screen

アプリ内の設定画面で YouTube の「連携する」を押し、Google 公式のログイン・承認画面を表示する。

撮影時に確認すること:

- 上部に `StreamNexus` が表示されている。
- Google アカウント選択または承認画面であることが分かる。
- ブラウザ URL が Google の OAuth 画面であることが分かる。

### 2. Scopes

Google の同意画面で権限詳細を開き、要求スコープが見える状態で撮影する。

撮影時に確認すること:

- `youtube.readonly` 相当の読み取り専用権限だけが表示されている。
- 投稿、削除、編集、コメント投稿、チャンネル管理などの権限が表示されていない。

### 3. Revocation

次のどちらか、できれば両方を撮影する。

- StreamNexus の設定画面で、YouTube が「連携済み」かつ「解除」ボタンが見える状態。
- StreamNexus の連携解除 confirmation が、Google OAuth token を取り消すことを示している状態。
- Google のサードパーティ製アプリとサービス画面で、StreamNexus のアクセス権を削除できる状態。

Google 側の取り消し URL:

- `https://security.google.com/settings/security/permissions`

### 4. Local YouTube Authorized Data deletion

StreamNexus の設定画面で、local YouTube Authorized Data deletion control を撮影する。

撮影時に確認すること:

- local deletion control が Settings / Linked Accounts に表示されている。
- confirmation が、YouTube account、動画、YouTube 側の登録チャンネル本体を削除しないことを示している。
- 実装上は `DELETE /api/youtube/authorized-data` が残っている token の revocation、local token clearing、SQLite の YouTube rows 削除を行う。

## Privacy Policy に明記していること

- YouTube API Services を使用すること。
- Google Privacy Policy へのリンク。
- YouTube Terms of Service へのリンク。
- 要求スコープが `https://www.googleapis.com/auth/youtube.readonly` であること。
- 利用目的が登録チャンネル、ライブ状態、公開動画メタデータの表示・通知・マルチビュー支援であること。
- 動画投稿、削除、編集、コメント投稿、チャンネル管理を行わないこと。
- YouTube OAuth token をローカルで暗号化保存すること。
- アプリ内 YouTube 連携解除で Google token revocation と local token deletion を実行すること。
- local YouTube Authorized Data deletion control が、ローカル保存された YouTube data と token を削除すること。
- Google のサードパーティ製アプリとサービス画面から取り消せること。

## リポジトリ側で残す確認

- `backend-ts/src/youtubeOAuthApi.ts` の scope が `youtube.readonly` のみであること。
- `backend-ts/src/youtubeOAuthApi.ts` に Google token revoke endpoint 呼び出しがあること。
- `backend-ts/src/routes/youtubeAuthRoutes.ts` に `/api/youtube/auth/logout` があること。
- `backend-ts/src/routes/youtubeCatalogRoutes.ts` に `/api/youtube/authorized-data` があること。
- `frontend/src/features/settings/components/LinkedAccountsSettingsSection.tsx` に YouTube の「解除」と local deletion 導線があること。
- `frontend/src/features/settings/hooks/useSettingsModalYouTubeAuth.ts` で解除時に `youtubeApiClient.logout()` を呼ぶこと。
- `frontend/src/features/settings/hooks/useSettingsModalYouTubeAuth.ts` で local deletion 時に `youtubeApiClient.deleteAuthorizedData()` を呼ぶこと。
- `frontend/src/features/setup/PolicyConsentScreen.tsx` で、初回セットアップや OAuth 連携より前に Privacy Policy / Terms of Service 確認を促すこと。

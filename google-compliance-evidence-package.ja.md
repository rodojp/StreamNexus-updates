# StreamNexus Google コンプライアンス提出証跡パッケージ

最終更新日: 2026-06-04

[English version](./google-compliance-evidence-package.md)

このファイルは、Google Cloud OAuth verification と YouTube API Services compliance review に向けた証跡チェックリストです。
公開 Privacy Policy、Terms of Service、アーキテクチャ資料、スクリーンショット、デモ動画と一緒に使います。

## 1. 図版アセット

Google へ画像添付を求められた場合は PNG または JPEG を使います。
SVG は編集用ソースとして残します。

| 証跡 | PNG | JPEG | Source |
| --- | --- | --- | --- |
| アーキテクチャ図 | [PNG](./assets/google-compliance/streamnexus-architecture.png) | [JPEG](./assets/google-compliance/streamnexus-architecture.jpg) | [SVG](./assets/google-compliance/streamnexus-architecture.svg) |
| OAuth ユーザーフロー図 | [PNG](./assets/google-compliance/streamnexus-user-flow.png) | [JPEG](./assets/google-compliance/streamnexus-user-flow.jpg) | [SVG](./assets/google-compliance/streamnexus-user-flow.svg) |
| 連携解除・ローカル削除フロー図 | [PNG](./assets/google-compliance/streamnexus-revocation-deletion-flow.png) | [JPEG](./assets/google-compliance/streamnexus-revocation-deletion-flow.jpg) | [SVG](./assets/google-compliance/streamnexus-revocation-deletion-flow.svg) |

## 2. Google Cloud Console で再確認する値

最終提出前に、Google Cloud Console で以下を確認または撮影してください。

| 項目 | StreamNexus として期待する値 |
| --- | --- |
| App name | `StreamNexus` |
| App homepage | `https://github.com/rodojp/StreamNexus-updates` |
| Privacy Policy URL | `https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.md` |
| Terms of Service URL | `https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.md` |
| YouTube scope | `https://www.googleapis.com/auth/youtube.readonly` のみ |
| OAuth redirect URI | packaged app または dev app が使う localhost callback URI |
| Support email | Google OAuth consent screen に表示される support email と同一 |
| Branding | app name に `Twitch` または `YouTube` を含めず、公開名称を `StreamNexus` にする |

## 3. スクリーンショットチェックリスト

提出する OAuth client と app name が同じであれば、現在ログイン済みの開発用アプリから撮影して構いません。
production OAuth client が異なる場合は、最終提出前に production client で OAuth consent のスクリーンショットを撮り直してください。

この package に含めた現在のアプリ UI スクリーンショット:

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

残りの推奨ファイル名:

- `evidence/screenshots/06-youtube-subscriptions-or-channel-import.png`
- `evidence/screenshots/07-youtube-disconnect-confirmation.png`
- `evidence/screenshots/09-google-third-party-access-page.png`

現在のスクリーンショット上の制限:

- Google Cloud Console の Data Access では、scope justification と demo video URL がまだ空欄です。提出前に Google Cloud Console 側で入力してください。
- 公開 repo に置くため、account email、account avatar、client ID、client secret は切り出しまたは黒塗りしています。

各スクリーンショットで確認したい点:

- Google が OAuth app name を表示する箇所で `StreamNexus` が見えること。
- 可能な限り scope details を展開して撮影すること。
- アカウント連携前に Privacy Policy と Terms のリンクがアプリ内に表示されること。
- Settings で YouTube 連携解除と local authorized-data deletion の操作が見えること。
- Google のサードパーティ製アプリ管理画面で StreamNexus のアクセスを削除できること。

## 4. デモ動画ストーリーボード

推奨ファイル名:

- `evidence/demo-video/streamnexus-google-compliance-demo.mp4`

現在生成済みの動画:

- [streamnexus-google-compliance-demo.mp4](./evidence/demo-video/streamnexus-google-compliance-demo.mp4)

推奨撮影順:

1. StreamNexus を起動する。
2. 利用前ポリシー確認画面を表示する。
3. Settings > Linked Accounts を開く。
4. YouTube link をクリックする。
5. Google OAuth consent screen で app name `StreamNexus` を表示する。
6. permission details を展開し、`youtube.readonly` を表示する。
7. 認可を完了する。
8. 登録チャンネル取り込みやチャンネル選択など、認可済み read-only data を使う YouTube 機能を表示する。
9. Settings > Linked Accounts に戻る。
10. YouTube 連携解除の確認を表示する。
11. local authorized-data deletion control を実行する。
12. reviewer に求められた場合は、Google のサードパーティ製アプリ管理画面も表示する。

## 5. 現在のエンジニアリング制御

- `POST /api/youtube/auth/logout` は local token clearing 前に `https://oauth2.googleapis.com/revoke` で保存済み Google OAuth token を取り消します。
- network error や server error で revocation に失敗した場合、StreamNexus は再試行できるように local token を保持します。
- `DELETE /api/youtube/authorized-data` は残っている token の revocation、local token clearing、SQLite の YouTube data 削除を行います。
- local deletion 対象は `platform = 'youtube'` の `tracked_channels`、`stream_history`、`watch_sessions`、`stream_notes`、`claim_history` です。
- Settings では、local deletion がユーザーの YouTube account、動画、YouTube 側の登録チャンネル本体を削除しないことを説明します。

## 6. 最終提出ゲート

以下が完了するまで提出しないでください。

- Google Cloud Console の値が `StreamNexus` と一致している。
- OAuth consent のスクリーンショットが review に出す OAuth client と同じ設定で撮影されている。
- scope screenshot が展開済みで、必要な YouTube read-only scope のみを示している。
- demo video に policy review、OAuth consent、YouTube 機能利用、disconnect、local deletion が含まれている。Google Cloud Console が YouTube link を求める場合は、local MP4 を提出に使う YouTube account へ upload し、その URL を Google Cloud Console に貼り付ける。
- Google Cloud Console の scope justification を提出前に入力している。
- Privacy Policy と Terms の URL が未ログインブラウザから 404 にならず開ける。

# StreamNexus 提出前コンプライアンスレビュー

最終更新日: 2026-06-02

[English version](./pre-submission-compliance-review.md)

この文書は、Google Cloud OAuth verification および YouTube API Services compliance audit に向けた、エンジニアリング観点の提出前レビューです。
正式な法務意見ではなく、弁護士レビューの代替にはなりません。

## 1. レビュー結論

VERDICT: REVISE BEFORE FINAL AUDIT SUBMISSION

StreamNexus は、公開ポリシーページ、アプリ内ポリシーリンク、利用前ポリシー確認、YouTube 読み取り専用 scope、アカウント連携解除 UI について、提出に向けた土台ができています。
ただし、最終監査提出前には次の改善を推奨します。

- アプリ内 YouTube 連携解除時の Google token programmatic revocation。
- 連携解除または削除依頼後のローカル YouTube Authorized Data 削除 workflow の明確化。
- production OAuth 設定と同一状態での screenshot / demo video 撮影。
- StreamNexus への名称変更後、Google Cloud Console の値、support email、authorized domains、branding の再確認。
- GitHub repository metadata が、停止済みの GitHub Pages / deployments URL を指していないことの確認。

## 2. 準備できている点

| 領域 | 証跡 | レビュー結果 |
| --- | --- | --- |
| Google / YouTube brand との混同回避 | ユーザー向け名称は `StreamNexus` | 提出向けとして妥当 |
| 公開 homepage | `https://github.com/rodojp/StreamNexus-updates` | 暫定公開ページとして準備済み |
| 公開 privacy policy | 公開 repository の `privacy-policy.md` | レビュー可能 |
| 公開 Terms of Service | 公開 repository の `terms-of-service.md` | レビュー可能 |
| Google Privacy Policy link | policy docs、policy consent screen、settings screen | 準備済み |
| YouTube Terms link | Privacy Policy と Terms | 準備済み |
| 利用前 disclosure | setup / account linking 前に `PolicyConsentScreen` を表示 | 準備済み |
| scope minimization | `https://www.googleapis.com/auth/youtube.readonly` のみ要求 | 準備済み |
| YouTube 書き込み操作 | upload、edit、delete、comment、playlist、channel 管理 scope なし | 準備済み |
| token storage | YouTube access / refresh token を暗号化して local settings に保存 | `SETTINGS_ENCRYPTION_KEY` 運用が正しければ準備済み |
| Access Gate の分離 | Google ID token access gate は YouTube OAuth と別物として説明可能 | 補足資料として準備済み |

## 3. 必須または強く推奨する改善

### Issue 1: Google token の programmatic revocation が未実装

重大度: Major

現在の挙動:

- アプリ内 YouTube 連携解除は `POST /api/youtube/auth/logout` を呼びます。
- backend はローカル保存された YouTube access / refresh token を消去します。
- アプリは Google のサードパーティ製アプリとサービス画面へのリンクを表示します。

ポリシー上の懸念:

- YouTube API Services Developer Policies は、ユーザーが簡単に authorization consent を取り消せる導線を求めています。
- アプリ側の仕組みで revocation する場合、API Client は token を programmatically revoke し、その consent に紐づく Authorized Data を削除することが期待されます。

推奨対応:

- ローカル token 消去前に Google OAuth token revocation endpoint を呼ぶ backend 処理を追加する。
- revocation 失敗時は UI と log で明示的に扱う。
- revoke 成功または local disconnect 後に、該当 authorization に紐づく YouTube Authorized Data の local cleanup を実行する。

対応後の証跡候補:

- token revoke request の unit / integration test。
- アプリ内 disconnect の screenshot。
- token が revoke された、または明示的 error が返ることを示す test / log。

### Issue 2: Authorized Data deletion workflow の明確化が必要

重大度: Major

現在の挙動:

- ユーザーは追跡 YouTube チャンネルを削除できます。
- ユーザーは Windows から StreamNexus の local app data を削除できます。
- Privacy Policy は削除支援の問い合わせ先として Google OAuth consent screen の support email を案内しています。

ポリシー上の懸念:

- YouTube policy では、revocation 後の Authorized Data 削除が求められます。
- local app data の手動削除案内は有用ですが、最終監査ではアプリ内の明確な削除 action または運用手順がある方が強いです。

推奨対応:

- StreamNexus が YouTube Authorized Data と扱う対象を定義する。
  - OAuth tokens。
  - subscription 由来の channel entries。
  - authorized subscription import に由来する stored local data。
- local SQLite と settings から YouTube Authorized Data を削除する cleanup action を追加または明文化する。
- 公開 video metadata やユーザー作成 note を保持する場合は、authorized user data と切り分ける根拠を明文化する。

対応後の証跡候補:

- deletion / disconnect UI の screenshot。
- token と関連 local YouTube Authorized Data が削除される test。
- 実際の削除挙動に合わせた Privacy Policy 更新。

### Issue 3: rename 後の Google Cloud Console 設定確認が必要

重大度: Major

レビュー上の懸念:

- アプリ名は TwitchZ から StreamNexus に変更されています。
- OAuth consent screen の app name、homepage、privacy policy、terms URL、support email、authorized domain は、提出するアプリと一致している必要があります。
- Google の branding guidance では、Google や YouTube の brand と混同し得る名前を避ける必要があります。

推奨対応:

- Google Cloud Console で次を確認する。
  - App name: `StreamNexus`
  - Homepage: `https://github.com/rodojp/StreamNexus-updates`
  - Privacy Policy: `https://github.com/rodojp/StreamNexus-updates/blob/main/privacy-policy.md`
  - Terms of Service: `https://github.com/rodojp/StreamNexus-updates/blob/main/terms-of-service.md`
  - Scope: `https://www.googleapis.com/auth/youtube.readonly`
  - Redirect URI: `http://localhost:5173/settings/youtube/callback`
- 上記が反映された状態でのみ証跡を撮影する。

### Issue 4: GitHub URL は暫定公開ページとして有用だが、所有確認済み domain の方が安全

重大度: Minor

レビュー上の懸念:

- Google OAuth branding と authorized domain 要件は、Google Search Console で所有確認できる domain の方が運用しやすい可能性があります。
- GitHub URL は暫定公開先としては使いやすいですが、Google Cloud Console 側で domain 設定を受け付けるか確認が必要です。

推奨対応:

- Google Cloud Console が GitHub URL の設定を受け付ける場合は、直近提出では GitHub release repository を使う。
- 広く公開する前に、homepage、Privacy Policy、Terms を所有確認済み domain へ移すことを検討する。

### Issue 5: Demo video と screenshot が未撮影

重大度: Minor

必要な証跡:

- アプリの end-to-end flow。
- policy consent screen。
- OAuth grant process。
- complete Google consent screen。
- expanded scope list。
- requested scope を使う機能。
- in-app disconnect と Google 側 revocation page。

推奨対応:

- 提出する Google Cloud project と同じ設定・同じ build で screenshot と短い demo video を撮影する。

### Issue 6: 公開 repository metadata が停止済み GitHub Pages URL を参照している可能性

重大度: Minor

レビュー上の懸念:

- 公開 repository README は `https://github.com/rodojp/StreamNexus-updates` を使っています。
- 一方で、GitHub repository の About website 欄には `https://rodojp.github.io/StreamNexus-updates/` が表示されている可能性があります。
- 現在の方針では deployments / GitHub Pages は使用しません。

推奨対応:

- GitHub repository の About website 欄を空にするか、`https://github.com/rodojp/StreamNexus-updates` に変更する。
- Google Cloud Console の homepage 値も、最終的な公開 URL と一致していることを確認する。

## 4. 提出証跡チェックリスト

| 証跡 | 作業 | 状態 |
| --- | --- | --- |
| Public homepage URL | GitHub rename と README 内容を確認 | 準備済み |
| Privacy Policy URL | 公開 URL が 404 ではないことを確認 | 準備済み |
| Terms URL | 公開 URL が 404 ではないことを確認 | 準備済み |
| 日本語 policy links | 公開 URL が 404 ではないことを確認 | 準備済み |
| OAuth consent screen screenshot | Google Cloud rename 後に撮影 | 未完了 |
| Expanded scopes screenshot | 全 scope が見える状態で撮影 | 未完了 |
| アプリ内 policy screen screenshot | 現行 app screen を撮影 | 未完了 |
| Linked Accounts screen screenshot | YouTube link / unlink state を撮影 | 未完了 |
| Google third-party app access screenshot | StreamNexus の revoke page を撮影 | 未完了 |
| Demo video | OAuth と機能 flow を通しで録画 | 未完了 |
| Token revocation 実装証跡 | 実装と test | 未完了 |
| Authorized data deletion 証跡 | 実装または exact procedure の文書化 | 未完了 |
| GitHub repository About URL | 停止済み GitHub Pages URL を削除または GitHub repository URL へ変更 | 未完了 |

## 5. Scope justification の草案

Google Cloud Console の scope justification には、次の英文を草案として使えます。

```text
StreamNexus requests https://www.googleapis.com/auth/youtube.readonly to let a user view their own YouTube subscriptions inside the desktop app, select channels to monitor, and display live stream status and public video metadata for notifications and multiview playback. StreamNexus does not upload, edit, delete, comment on, or manage YouTube videos, playlists, channels, or comments. The app uses the minimum read-only scope needed for the user-facing subscription import and stream monitoring features.
```

## 6. Demo video の撮影台本

1. StreamNexus を開く。
2. 利用前ポリシー確認画面で Privacy Policy、Terms、Google Privacy Policy、日本語リンクを表示する。
3. ポリシー確認を完了する。
4. settings を開き、Linked Accounts を表示する。
5. YouTube 連携を押す。
6. Google OAuth consent screen で `StreamNexus` が表示されていることを示す。
7. 権限詳細を展開し、YouTube 読み取り専用 scope を表示する。
8. 同意を完了する。
9. StreamNexus に戻り、登録チャンネル取得や YouTube live monitoring の動作を示す。
10. Linked Accounts に戻り、YouTube disconnect を表示する。
11. Google の third-party access settings page を開き、StreamNexus access を削除できる場所を示す。

## 7. Screenshot ファイル名案

- `01-streamnexus-policy-consent.png`
- `02-linked-accounts-youtube-disconnected.png`
- `03-google-oauth-consent-streamnexus.png`
- `04-google-oauth-expanded-scopes.png`
- `05-youtube-feature-using-readonly-scope.png`
- `06-linked-accounts-youtube-disconnect.png`
- `07-google-third-party-access-revoke.png`

## 8. 最終法務レビューの注意

- このレビューでは、各国の privacy law に対して公開 policy が十分かどうかまでは判断できません。
- 広く一般公開する前に、Privacy Policy、Terms of Service、support contact、削除 process、data retention claims は弁護士に確認してもらうことを推奨します。
- 旧 `TwitchZ` 名が表示される screenshot / video は、歴史的リリース証跡として意図していない限り提出しないでください。

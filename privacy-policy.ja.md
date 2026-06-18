# StreamNexus プライバシーポリシー

発効日: 2026-06-02
最終更新日: 2026-06-18

[English version](./privacy-policy.md)

StreamNexus は、Twitch と YouTube の配信監視、通知、マルチビュー再生を行う Windows デスクトップアプリです。
このプライバシーポリシーは、StreamNexus が取り扱う情報と、YouTube API Services のデータ利用方法を説明します。

## 1. 適用範囲

このポリシーは、StreamNexus デスクトップアプリ、この公開リリースリポジトリによる配布、および Twitch / Google / YouTube 連携に適用されます。
StreamNexus は、ユーザーが初期設定を開始する前、または Twitch / YouTube を連携する前に、ポリシー確認画面を表示します。

## 2. StreamNexus が取り扱う情報

StreamNexus は、以下の情報を取り扱う場合があります。

- Twitch および YouTube のチャンネル ID、チャンネル名、プロフィール画像 URL、ライブ配信状態、公開動画メタデータ。
- ユーザーが選択した追跡チャンネル、通知設定、マルチビュー設定、アプリ設定。
- ユーザーの同意後に Google から発行される YouTube OAuth アクセストークンおよびリフレッシュトークン。
- トラブルシューティングに必要なローカルログおよびヘルス情報。StreamNexus は、API キー、OAuth クライアントシークレット、OAuth トークンを Git に意図的に保存しない設計です。

## 3. YouTube API Services

StreamNexus は YouTube API Services を使用します。StreamNexus の YouTube 連携を利用する場合、ユーザーには以下も適用されます。

- YouTube 利用規約: <https://www.youtube.com/t/terms>
- Google プライバシーポリシー: <https://policies.google.com/privacy>

StreamNexus は、以下の Google OAuth スコープを要求します。

- `https://www.googleapis.com/auth/youtube.readonly`

StreamNexus は、この読み取り専用スコープを以下の目的で使用します。

- StreamNexus 内でユーザーの YouTube 登録チャンネルを表示するため。
- 追跡対象の YouTube チャンネルのライブ配信状態を確認するため。
- 配信監視、通知、マルチビュー再生に必要な公開動画メタデータを表示するため。

StreamNexus は、以下を行いません。

- YouTube 動画のアップロード。
- YouTube 動画の削除。
- YouTube 動画の編集。
- コメントの投稿。
- プレイリストまたはチャンネルの管理。
- YouTube API Services データの販売。
- 広告、信用評価、または無関係なプロファイリングのための YouTube API Services データの利用。

## 4. 保存と保護

YouTube OAuth トークンは StreamNexus によってローカルに保存され、アプリ設定へ保存される前に暗号化されます。
追跡対象の YouTube チャンネルおよび公開配信メタデータは、監視、通知、履歴、マルチビュー機能を提供するためにローカルへ保存される場合があります。

StreamNexus は、アプリが取り扱う Google ユーザーデータの機密性を保護するため、以下の保護手段を使用します。

- YouTube OAuth アクセストークンおよびリフレッシュトークンは、ユーザーの Windows 端末上に保存され、永続化前に暗号化されます。
- ローカルアプリデータは、ユーザーの Windows アカウントおよびローカルファイルシステム権限によって保護されます。
- OAuth トークンは、トークン交換、トークン更新、トークン取り消し、および認可済み YouTube API 呼び出しに必要な場合に限り、Google OAuth および YouTube API エンドポイントへ送信されます。
- StreamNexus は、Google OAuth、YouTube API、アップデート、サポート関連のエンドポイントとの通信に HTTPS を使用します。
- StreamNexus は、API キー、OAuth クライアントシークレット、OAuth トークン、その他の機密認証情報を Git に意図的に保存しない設計です。
- ローカルログおよびヘルス情報はトラブルシューティングのために使用されます。個人データ、アカウント識別子、トークン、その他の機密情報を含む可能性があるログを公開共有しないでください。サポート目的で共有する場合は、該当情報を削除またはマスクしてください。

StreamNexus は、YouTube API Services データを販売または再配布する本番サーバーを運用しません。

## 5. 共有

StreamNexus は YouTube API Services データを販売しません。
StreamNexus は、ユーザー操作、アプリ更新配信、該当プラットフォームでの動画再生、トラブルシューティング、セキュリティ、または法的義務に必要な場合に限り、情報を共有します。

## 6. 削除、連携解除、取り消し

ユーザーは StreamNexus の設定から YouTube 連携を解除できます。
ユーザーが YouTube 連携を解除すると、StreamNexus は保存済み Google OAuth token を programmatically revoke し、その後アプリが使用していたローカル保存済み YouTube OAuth token を削除します。
network error や server error により revocation に失敗した場合、StreamNexus は再試行できるように local token を保持します。

ユーザーは、StreamNexus の設定から local YouTube Authorized Data deletion control を使用できます。
この local deletion は、StreamNexus がローカルに保存した YouTube 追跡チャンネル、YouTube 配信履歴、YouTube 視聴セッション、YouTube 配信メモ、YouTube claim history rows、およびローカル保存済み YouTube OAuth token を削除します。
これはユーザーの YouTube アカウント、動画、コメント、プレイリスト、チャンネル、YouTube 側の登録チャンネル本体を削除しません。

ユーザーは、Google のサードパーティ製アプリのアクセス管理ページから StreamNexus のアクセス権を取り消すこともできます。

- <https://security.google.com/settings/security/permissions>

すべてのローカル StreamNexus データを削除したい場合、ユーザーは YouTube 連携を解除し、local YouTube Authorized Data deletion control を使用し、Windows 上の StreamNexus ローカルアプリデータを削除してください。
支援が必要な場合は、StreamNexus の Google OAuth 同意画面に表示されるサポートメールへ連絡してください。

## 7. 変更

StreamNexus は、アプリ機能、API 利用、またはコンプライアンス要件が変わった場合、このポリシーを更新することがあります。
重要な変更はこのページに反映し、必要に応じてリリースノートまたはアプリ UI でも案内します。

## 8. 連絡先

プライバシーに関する質問またはデータ削除の支援が必要な場合は、StreamNexus の Google OAuth 同意画面に表示されるサポートメールへ連絡してください。

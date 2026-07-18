# StreamNexus 問い合わせフォーム設定

この問い合わせフォームは Cloudflare Workers、Static Assets、D1、R2、Turnstile を使います。

## 構成

- `/contact/` と `/contact/en/`: 静的フォームページ
- `/api/contact/config`: Turnstile site key を返す API
- `/api/contact`: Turnstile と添付ファイルを検証し、問い合わせ内容を D1、添付を非公開 R2 に保存する API
- `CONTACT_DB`: 問い合わせ保存用 D1 binding
- `CONTACT_ATTACHMENTS`: 添付ファイル保存用 R2 binding
- Cron Trigger: 毎日、90日を過ぎた添付と保持期限を過ぎた対応完了済み問い合わせを削除

## Cloudflare 側で必要な設定

### 1. Turnstile widget を作成

Cloudflare Dashboard で Turnstile widget を作成し、hostname に `stream-nexus.com` を追加します。

作成後、以下を設定します。

- `TURNSTILE_SITE_KEY`: 公開 site key
- `TURNSTILE_SECRET_KEY`: secret key

`TURNSTILE_SECRET_KEY` は secret として保存してください。

```powershell
npx wrangler secret put TURNSTILE_SECRET_KEY
```

`TURNSTILE_SITE_KEY` は Dashboard の Worker 設定、または `wrangler.jsonc` の `vars` へ追加できます。
このリポジトリの `wrangler.jsonc` は `keep_vars: true` を指定しているため、Dashboard で設定した環境変数は deploy 時に保持されます。

### 2. D1

`wrangler.jsonc` には `CONTACT_DB` binding を定義しています。
Wrangler の自動プロビジョニングが有効な環境では、deploy 時に D1 が作成されます。

自動作成を使わない場合は、Dashboard または Wrangler で D1 database を作成し、`database_id` を `wrangler.jsonc` に追加してください。

### 3. 非公開 R2 bucket

`wrangler.jsonc` の `CONTACT_ATTACHMENTS` binding は `stream-nexus-contact-attachments` bucket を参照します。
初回 deploy 前に bucket を作成してください。

```powershell
npx wrangler r2 bucket create stream-nexus-contact-attachments
```

この bucket に `r2.dev` 公開アクセスやカスタム公開ドメインを設定しないでください。
Worker binding だけからアクセスします。

Worker の日次処理とは別に、R2 側にも90日の Lifecycle ruleを設定し、削除処理停止時の安全策にします。

```powershell
npx wrangler r2 bucket lifecycle add stream-nexus-contact-attachments --expire-days 90
npx wrangler r2 bucket lifecycle list stream-nexus-contact-attachments
```

### 4. 保存データ

D1 には以下を保存します。

- 問い合わせID
- 受付日時
- 言語
- 種別
- 名前
- 返信先メール
- 本文
- User-Agent
- Cloudflare Ray ID
- 対応ステータス
- 添付のR2 object key、元ファイル名、形式、サイズ、SHA-256、削除期限

添付本体はD1へ入れず、非公開R2へ保存します。自動返信と管理画面は未実装です。

## 添付ファイルの安全制限

- 最大3ファイル
- 1ファイル最大5MiB
- 1問い合わせ合計最大10MiB
- 許可形式: PNG、JPEG、WebP、TXT、LOG、JSON
- 画像はマジックバイト、テキストはUTF-8、JSONは構文を検証
- ZIP、実行ファイル、HTML、SVG、Office文書などは拒否
- object keyには利用者のファイル名を使わず、問い合わせIDとランダムIDを使用

`CONTACT_ATTACHMENT_STORAGE_LIMIT_BYTES` の既定値とコード上の絶対上限は `8589934592` bytes（8GiB）です。
アップロード前にD1の単一条件付き更新で容量を予約するため、同時送信が重なってもこの上限を超えてR2へ保存しません。
環境変数には8GiB以下の値だけが反映され、8GiBを超える値はコード側で8GiBへ制限されます。

## 無料枠での運用方針

問い合わせ通知は現在未実装です。問い合わせは D1 に保存し、Cloudflare Dashboard の D1 Studio で確認します。

Cloudflare Email Service は、確認済み宛先への送信であれば Workers Free でも利用できます。通知先は `support@stream-nexus.com`、`security@stream-nexus.com`、`privacy@stream-nexus.com`、`info@stream-nexus.com` の運用方針確定後に実装します。

送信完了画面では参照IDを表示し、返信が必要な場合は `support@stream-nexus.com` から連絡する旨を案内します。

## 保持期限の自動適用

`wrangler.jsonc` の Cron Trigger は毎日 03:17 UTC に実行されます。`CONTACT_RETENTION_DAYS` の既定値は180日です。

添付ファイルの `CONTACT_ATTACHMENT_RETENTION_DAYS` は最大90日です。問い合わせが `new` または `in_progress` でも、添付は送信から90日以内にR2とD1から削除され、使用量カウンターを減算します。R2 Lifecycle ruleも同じ90日を上限として適用します。

自動削除の対象は次の条件を両方満たす問い合わせだけです。

- `status = 'closed'`
- `created_at` が保持期限より古い

`new` または `in_progress` の問い合わせ本文は、保持期限を過ぎても自動削除しません。完了済み問い合わせに添付メタデータが残っている場合は、添付削除を先に完了してから本文を削除します。実行結果には保持日数、削除件数、解放容量だけを記録し、問い合わせ本文やメールアドレスはログへ出力しません。

## エラー監視

`wrangler.jsonc` で Workers Logs を有効化しています。
問い合わせ API の実行状況は Cloudflare Dashboard の以下で確認します。

- `Workers & Pages` → `stream-nexus` → `Observability`
- Query Builder で `$workers.event.response.status >= 500` を条件にすると、問い合わせ API のサーバー側エラーを絞り込めます。
- `$workers.event.request.path = "/api/contact"` を追加すると、問い合わせ送信 API だけを確認できます。

問い合わせ API で予期しない例外が発生した場合は、個人情報を含めずに以下の情報だけを `console.error` に記録します。

- event
- path
- method
- Cloudflare Ray ID
- errorName
- errorMessage

Turnstile 失敗、入力不備、404 などの通常の 4xx 応答は、個別の個人情報ログを出さず、invocation log のステータスで確認します。

容量の現在値はD1 Studioで確認できます。

```sql
SELECT
  used_bytes,
  ROUND(used_bytes / 1024.0 / 1024.0, 2) AS used_mib,
  ROUND(used_bytes * 100.0 / 8589934592, 4) AS percent_of_hard_limit
FROM contact_attachment_storage
WHERE id = 1;
```

## 問い合わせ確認用 SQL

最新の問い合わせを確認します。

```sql
SELECT
  created_at,
  category,
  name,
  email,
  substr(message, 1, 120) AS message_preview,
  status,
  id
FROM contact_messages
ORDER BY created_at DESC
LIMIT 50;
```

未対応の問い合わせだけを確認します。

```sql
SELECT
  created_at,
  category,
  name,
  email,
  substr(message, 1, 120) AS message_preview,
  id
FROM contact_messages
WHERE status = 'new'
ORDER BY created_at DESC;
```

対応中・完了に変更する場合は、D1 Studio で該当 `id` を確認してから実行します。

```sql
UPDATE contact_messages
SET status = 'in_progress'
WHERE id = 'REFERENCE_ID';

UPDATE contact_messages
SET status = 'closed'
WHERE id = 'REFERENCE_ID';
```

180日より古い完了済み問い合わせを削除する場合の例です。

```sql
DELETE FROM contact_messages
WHERE status = 'closed'
  AND created_at < datetime('now', '-180 days');
```

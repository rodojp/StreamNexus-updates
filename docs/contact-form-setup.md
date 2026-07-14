# StreamNexus 問い合わせフォーム設定

この問い合わせフォームは Cloudflare Workers、Static Assets、D1、Turnstile を使う最小構成です。

## 構成

- `/contact/` と `/contact/en/`: 静的フォームページ
- `/api/contact/config`: Turnstile site key を返す API
- `/api/contact`: Turnstile を検証し、問い合わせ内容を D1 に保存する API
- `CONTACT_DB`: 問い合わせ保存用 D1 binding
- Cron Trigger: 毎日、保持期限を過ぎた対応完了済み問い合わせを削除

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

### 3. 保存データ

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

添付ファイル、自動返信、管理画面は初期版では未実装です。

## 無料枠での運用方針

問い合わせ通知は現在未実装です。問い合わせは D1 に保存し、Cloudflare Dashboard の D1 Studio で確認します。

Cloudflare Email Service は、確認済み宛先への送信であれば Workers Free でも利用できます。通知先は `support@stream-nexus.com`、`security@stream-nexus.com`、`privacy@stream-nexus.com`、`info@stream-nexus.com` の運用方針確定後に実装します。

送信完了画面では参照IDを表示し、返信が必要な場合は `support@stream-nexus.com` から連絡する旨を案内します。

## 保持期限の自動適用

`wrangler.jsonc` の Cron Trigger は毎日 03:17 UTC に実行されます。`CONTACT_RETENTION_DAYS` の既定値は180日です。

自動削除の対象は次の条件を両方満たす問い合わせだけです。

- `status = 'closed'`
- `created_at` が保持期限より古い

`new` または `in_progress` の問い合わせは、保持期限を過ぎても自動削除しません。実行結果には保持日数と削除件数だけを記録し、問い合わせ本文やメールアドレスはログへ出力しません。

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

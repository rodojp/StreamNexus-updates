# StreamNexus 問い合わせフォーム設定

この問い合わせフォームは Cloudflare Workers、Static Assets、D1、Turnstile を使う最小構成です。

## 構成

- `/contact/` と `/contact/en/`: 静的フォームページ
- `/api/contact/config`: Turnstile site key を返す API
- `/api/contact`: Turnstile を検証し、問い合わせ内容を D1 に保存する API
- `CONTACT_DB`: 問い合わせ保存用 D1 binding

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

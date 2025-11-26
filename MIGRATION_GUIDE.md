# Cloudflare Pages への移行ガイド

このプロジェクトを Vercel から Cloudflare Pages に移行するための手順です。

## 1. 準備

### 必要なもの
- Cloudflare アカウント
- GitHub リポジトリへのアクセス権

### プロジェクト設定の更新
`package.json` に以下の変更を加えました（既に適用済みです）：
- `devDependencies` に `@cloudflare/next-on-pages` を追加
- `scripts` に `"pages:build": "npx @cloudflare/next-on-pages"` を追加

## 2. Cloudflare Pages へのデプロイ

1. **Cloudflare Dashboard** にログインします。
2. 左側のメニューから **Workers & Pages** を選択し、**Create Application** をクリックします。
3. **重要**: ここで **Pages** タブを選択してください（デフォルトは Workers になっている場合があります）。
4. **Connect to Git** をクリックします。
5. GitHub アカウントを連携し、このリポジトリ (`shogi-online`) を選択します。
6. **Set up builds and deployments** 画面で以下のように設定します：
   - **Framework preset**: `None` を選択してください。
     - **注意**: `Next.js` が選択されていると「Output directory」が表示されない場合があります。必ず `None` に切り替えてください。
   - **Build command**: `npx @cloudflare/next-on-pages` (または `npm run pages:build`)
   - **Output directory**: `.vercel/output/static` (この欄が表示されたら入力してください)
5. **Environment variables (advanced)** を展開し、以下の環境変数を設定します（Vercelで使用していたものと同じ値）：
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `GMAIL_USER`
   - `GMAIL_PASS`
6. **Save and Deploy** をクリックします。

### 既にプロジェクトを作成済みの場合の設定変更
もし既にプロジェクトを作成してしまい、ビルドエラーになっている場合は以下の手順で設定を修正します：

1. Cloudflare Dashboard で対象の Pages プロジェクトを開きます。
2. 上部タブの **Settings** をクリックします。
3. 左メニューの **Builds & deployments** を選択します。
4. **Build configuration** セクションの **Edit configuration** ボタンをクリックします。
5. **Framework preset** のメニューがない場合は無視してください。以下の2項目を直接書き換えて保存します：
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`
6. **Deployments** タブに戻り、最新のデプロイの三点リーダーメニューから **Retry deployment** を選択します。

## 3. 注意点: メール送信機能 (Nodemailer) について

現在、お問い合わせフォーム (`src/app/api/contact/route.ts`) は `nodemailer` と Gmail SMTP を使用しています。
Cloudflare Workers (Pages Functions) の Edge Runtime では、標準の SMTP ポート接続が制限されている場合があり、`nodemailer` が正常に動作しない可能性があります。

### 推奨される解決策

もしデプロイ後にメール送信がエラーになる場合は、以下のいずれかの方法で対応してください：

#### A. HTTP API ベースのメールサービスを使用する (推奨)
Resend, SendGrid, Mailgun などのサービスは HTTP API を提供しており、Edge Runtime から問題なく利用できます。
例 (Resend):
```typescript
import { Resend } from 'resend';
const resend = new Resend('re_123456789');

await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'zangecreate@gmail.com',
  subject: 'Contact Form',
  html: '<p>Message...</p>'
});
```

#### B. Cloudflare Email Workers を使用する
Cloudflare の Email Routing 機能と Workers を組み合わせてメールを処理する方法です。

#### C. Node.js Runtime を強制する (非推奨・Pagesでは難しい場合あり)
Next.js の API Route 設定で `runtime: 'nodejs'` を指定しても、Cloudflare Pages 上では完全にサポートされない場合があります。

## 4. 動作確認

デプロイ完了後、発行された URL (例: `https://shogi-online.pages.dev`) にアクセスし、以下の機能を確認してください：
- トップページの表示
- 各ゲームページへの遷移
- Firebase Realtime Database との連携（ゲームの動作）
- お問い合わせフォームの送信（※上記メールの問題に注意）

## 5. カスタムドメインの設定 (オプション)

「無効なネームサーバー」というエラーが出る場合、ドメインのネームサーバー設定が完了していません。
ドメインを取得したサービス（レジストラ）の管理画面で設定を変更する必要があります。

### 一般的な手順
1. Cloudflare Dashboard で **Websites** を選択し、**Add a Site** をクリックしてドメインを入力します。
2. 表示される Cloudflare のネームサーバー（例: `bob.ns.cloudflare.com`, `lola.ns.cloudflare.com`）をメモします。
3. ドメインを購入したサービスの管理画面にログインします。
4. 対象ドメインの「ネームサーバー設定」または「DNS設定」を探します。
5. 現在のネームサーバーを削除し、Cloudflare で表示された2つのネームサーバーを入力します。
6. Cloudflare Pages の設定画面に戻り、**Custom domains** タブでドメインを接続します。

### 主なサービスの操作方法例

#### お名前.com (Onamae.com)
1. 「お名前.com Navi」にログイン。
2. 「ドメイン設定」>「ネームサーバーの設定」>「ネームサーバーの変更」を選択。
3. 対象ドメインを選択し、「他のネームサーバーを利用」タブをクリック。
4. ネームサーバー1, 2 に Cloudflare の値を入力して保存。

#### Google Domains
1. Google Domains にログインし、対象ドメインを選択。
2. 左メニューの「DNS」をクリック。
3. 「カスタム ネームサーバー」タブを選択。
4. 「ネームサーバーを管理」をクリックし、Cloudflare の値を入力して保存。
5. 「これらの設定に切り替える」をクリックして有効化。

#### GoDaddy
1. GoDaddy にログインし、ドメインのポートフォリオに移動。
2. 対象ドメインの「DNS」>「ネームサーバー」を選択。
3. 「ネームサーバーの変更」をクリックし、「自分のネームサーバーを使用する」を選択。
4. Cloudflare の値を入力して保存。

**注意**: 設定変更が世界中に反映されるまで、数時間〜最大24時間かかる場合があります。気長にお待ちください。

## 6. Vercel側の処理 (推奨)

Cloudflare への移行が完了し、動作確認ができたら、Vercel 側の設定を整理することをお勧めします。
**必須ではありません**が、将来的なトラブルを防ぐために推奨されます。

1. **ドメインの削除**:
   - Vercel Dashboard で対象プロジェクトを開きます。
   - **Settings** > **Domains** に移動します。
   - 移行したドメインの **Edit** > **Remove** をクリックして削除します。
   - *理由*: ネームサーバーを変更した時点で Vercel からは配信されなくなりますが、設定を残しておくと「所有権の競合」などの警告が出続けることがあります。

2. **プロジェクトの削除 (任意)**:
   - Cloudflare で完全に運用するようになれば、Vercel 上のプロジェクト自体を削除しても問題ありません。
   - バックアップとしてしばらく残しておき、問題なければ **Settings** > **General** > **Delete Project** から削除します。




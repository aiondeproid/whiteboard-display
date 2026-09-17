# 社内掲示板（PDF掲示板 表示専用アプリ）

社内の部署ごとに共有されているPDF資料を一覧・閲覧できる、表示専用のNext.jsアプリケーションです。資料のアップロード・公開管理は別リポジトリの「編集アプリ」が担当し、本アプリは公開された資料を読み取り専用で表示します。

## デモ

- デモURL: `[デプロイ後にURLを記載]`
- 本アプリに認証機能はなく、誰でもアクセスすると資料一覧を閲覧できる仕様です（デモアカウントはありません）。

## 要件定義

- 社内の掲示物（PDF）を部署ごとに分類し、一覧表示できること
- 各資料はサムネイル・タイトル・公開日を一覧上で確認できること
- 資料をクリックするとPDFビューアで内容を閲覧できること
- 資料の公開/非公開は編集アプリ側の`visible`フラグで制御し、本アプリは`visible = true`の資料のみを表示すること
- 表示対象の掲示板は環境変数（`DISPLAY_BOARD_ID`）で1つに固定すること
- 資料の実体（PDFファイル）はSupabase Storageに保存し、閲覧時のみ有効期限付きの署名付きURLを発行すること
- 資料の編集・アップロード・削除機能は持たない（読み取り専用）こと

## 機能一覧

- **資料一覧表示**: 部署（`departments`）ごとに、公開中（`visible = true`）の資料をグルーピングして一覧表示
- **PDFサムネイル表示**: 一覧画面で各資料の1ページ目をサムネイルとして表示
- **資料詳細・PDFビューア**: 資料をクリックすると詳細ページでPDF全体を閲覧可能
- **署名付きURLによる安全な配信**: Supabase Storageの資料に対し、有効期限（5分間）付きの署名付きURLを都度発行
- **ダークモード対応**: OSのカラースキームに応じたライト/ダーク表示

## 使用フレームワーク・ライブラリ

| 種別 | 技術 |
| --- | --- |
| フレームワーク | [Next.js](https://nextjs.org/) 16 (App Router) |
| 言語 | TypeScript |
| UIライブラリ | React 19 |
| スタイリング | Tailwind CSS 4 |
| PDF表示 | [react-pdf](https://github.com/wojtekmaj/react-pdf) |
| バックエンドSDK | [@supabase/supabase-js](https://github.com/supabase/supabase-js) |
| Lint | ESLint 9 (eslint-config-next) |
| デプロイ先 | Vercel |

## 使用外部API・サービス

| サービス | 用途 |
| --- | --- |
| [Supabase](https://supabase.com/) | 資料メタデータ（`boards` / `departments` / `documents`）のDB、PDF実体を保存するStorage、署名付きURLの発行 |

## Getting Started

### 1. 環境変数の設定

`.env.local` を作成し、以下を設定してください（実際の値はSupabaseの管理画面から取得します）。

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DISPLAY_BOARD_ID=
```

### 2. 開発サーバーの起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開くと確認できます。

## デプロイ

[Vercel](https://vercel.com/) へのデプロイを想定しています。上記の環境変数をVercelのプロジェクト設定にも登録してください。

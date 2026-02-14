# Auto Post Blog

AIを活用した自動ブログ記事生成・投稿システム

## プロジェクトの目標

**複数の特化ブログを作成し、収益化を実現する**

- ジャンル特化型ブログを複数運営（グルメ、ガジェット、旅行、買い物など）
- AIによる記事生成の自動化で、質の高いコンテンツを効率的に量産
- 各ブログで広告収入やアフィリエイト収益を獲得
- real-voice.comドメイン配下で統一ブランドを構築

## アーキテクチャ

```
┌─────────────────────┐
│  投稿フォーム       │  ← ユーザーが体験を入力
│  (Cloudflare Workers)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AIインタビュー     │  ← 追加質問を生成
│  (Workers AI)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  記事生成           │  ← Markdownで記事を作成
│  (Workers AI)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub自動投稿     │  ← 各ブログのリポジトリへ
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  特化ブログ群 (Cloudflare Pages)    │
├─────────────────────────────────────┤
│  • food.real-voice.com              │
│  • gadget.real-voice.com            │
│  • travel.real-voice.com            │
│  • shopping.real-voice.com          │
└─────────────────────────────────────┘
```

## 主な機能

### 📝 AIインタビュー形式の記事生成

- 初回フォーム入力（ジャンル、日付、タイトル案、本文、画像、費用、星評価）
- AIが追加質問を動的に生成（text/select/image形式）
- ユーザーの回答を基に、より詳細で魅力的な記事を自動生成

### ⭐ 星評価システム

- 1-5星の評価を各記事に追加
- 記事ページと一覧ページで視覚的に表示
- 評価でフィルタリング可能

### 🔍 高度な検索・フィルタリング

- テキスト検索（タイトル・カテゴリ）
- 年月フィルター
- 評価フィルター（5星、4星以上、3星以上）
- リアルタイムで絞り込み

### 📱 Sveltia CMS統合

- `/admin/`からブラウザで記事を編集・管理
- GitHub OAuth認証
- Markdownエディタ、画像アップロード対応
- AI生成記事の手動修正が可能

## ディレクトリ構成

```
aouto-post-blog/
├── apps/
│   └── worker/           # 投稿フォーム & AI処理
│       ├── src/
│       │   ├── routes/   # フォーム、API
│       │   ├── services/ # AI生成、GitHub投稿
│       │   └── views/    # UI
│       └── public/       # 静的ファイル
├── packages/
│   └── shared/           # 共通設定・型定義
└── blog-*/               # 各ブログリポジトリ（別管理）
```

## 技術スタック

- **フロントエンド**: Hono + JSX, htmx
- **バックエンド**: Cloudflare Workers
- **AI**: Workers AI (Llama 4 Scout)
- **ストレージ**: KV Namespace (セッション管理)
- **ブログ**: Astro + Cloudflare Pages
- **CMS**: Sveltia CMS
- **認証**: GitHub OAuth

## セットアップ

### 1. 投稿システムのデプロイ

```bash
cd apps/worker
npm install
npm run deploy
```

### 2. 環境変数の設定

Cloudflare Dashboardで以下を設定：
- `GITHUB_TOKEN`: GitHubのPersonal Access Token（repo権限）
- `SESSIONS`: KV Namespace

### 3. ブログのデプロイ

各ブログリポジトリをCloudflare Pagesに接続：
- `blog-food` → food.real-voice.com
- `blog-gadget` → gadget.real-voice.com
- `blog-travel` → travel.real-voice.com
- `blog-shopping` → shopping.real-voice.com

## 収益化戦略

1. **Google AdSense** - 各ブログに広告を配置
2. **Amazonアフィリエイト** - 商品レビュー記事にリンク
3. **A8.net等のASP** - ジャンル特化の案件を掲載
4. **独自商品・サービス** - 将来的に展開可能

## ライセンス

Private - 個人プロジェクト

## バージョン

現在: v0.1.5

詳細は [DESIGN.md](./DESIGN.md) を参照

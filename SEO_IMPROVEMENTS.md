# SEO改善タスクリスト

このドキュメントは、Google AdSense収益最大化のために必要なSEO改善項目をまとめたものです。

**ステータス**: ✅ すべて完了（2026-02-14）

## 🚨 最優先（Googleインデックス・基本SEO）

### 1. メタディスクリプション・OGタグの実装
- [x] 各記事ページに`<meta name="description">`を追加
- [x] OGP（Open Graph Protocol）タグの実装
  - [x] `og:title`
  - [x] `og:description`
  - [x] `og:image`
  - [x] `og:type`
  - [x] `og:url`
- [x] Twitter Cardタグの実装
  - [x] `twitter:card`
  - [x] `twitter:title`
  - [x] `twitter:description`
  - [x] `twitter:image`
- [x] AIで記事生成時に要約（description）も自動生成

**影響**: Google検索結果での表示品質向上、SNSシェア時の見栄え改善

---

### 2. sitemap.xml / robots.txt の実装
- [x] `@astrojs/sitemap`インテグレーションをインストール
- [x] astro.config.mjsにsitemap設定を追加
- [x] robots.txtファイルの作成
- [x] 全ブログ（food, gadget, travel, shopping, template）に適用

**影響**: Googleクローラーの効率向上、インデックス速度の改善

---

### 3. 構造化データ（JSON-LD）の実装
- [x] `Article`スキーマの実装
  - [x] headline（タイトル）
  - [x] datePublished（投稿日）
  - [x] dateModified（更新日）
  - [x] author（著者情報）
  - [x] image（記事画像）
- [x] `Review`スキーマの実装（星評価がある場合）
  - [x] itemReviewed
  - [x] reviewRating
  - [x] author
- [x] `BreadcrumbList`スキーマの実装

**影響**: リッチスニペット表示、検索結果で星評価・価格表示、CTR大幅向上

---

### 4. canonical URLの実装
- [x] 各ページに`<link rel="canonical">`を追加
- [x] astro.config.mjsの`site`設定を各ブログの実際のURLに更新

**影響**: 重複コンテンツペナルティの回避

---

## 🔥 高優先（検索順位に直結）

### 5. h1タグの重複問題を修正
- [x] BaseLayout.astroのヘッダー部分を修正
  - [x] サイト名の`<h1>`を`<div>`または`<p>`に変更
  - [x] 記事タイトルのみが`<h1>`になるよう確保
- [x] 全ブログに適用

**影響**: SEO基本ルール遵守、検索エンジン評価の改善

---

### 6. 内部リンク構造の強化
- [x] 関連記事表示機能の実装
  - [x] カテゴリが同じ記事を表示
  - [x] 評価が近い記事を表示
- [x] パンくずリストの実装
- [ ] カテゴリページの作成（将来の拡張）
- [ ] タグページの作成（将来の拡張）

**影響**: サイト内回遊率向上、ページビュー増加、滞在時間延長

---

### 7. alt属性の最適化
- [x] AI生成時に画像の内容説明もプロンプトに含める
- [x] 画像ごとに適切なaltテキストを自動生成
- [x] generator.tsでalt情報を含めるよう修正

**影響**: 画像検索からの流入増加、アクセシビリティ向上

---

### 8. ページ読み込み速度の最適化
- [x] 画像の遅延読み込み（lazy loading）を有効化
- [x] Astroの画像最適化設定を強化
  - [x] WebP形式への変換
  - [x] 適切なサイズへのリサイズ
- [x] CSSインライン化の検討
- [x] 不要なJavaScript削減

**影響**: Core Web Vitals改善、モバイル検索順位向上

---

## 🌟 中優先（UX・回遊率向上）

### 9. トップページのコンテンツ追加
- [x] サイト紹介文を追加（SEOキーワードを含む）
- [x] 各ブログのテーマに合わせた説明文
- [x] h2見出しでキーワードを含める

**影響**: トップページの検索順位向上、ブランド認知

---

### 10. 投稿者情報・E-E-A-Tの強化
- [x] 著者プロフィールセクションの追加
- [x] 専門性・経験の明記
- [ ] SNSリンクの追加（信頼性向上）（将来の拡張）

**影響**: Googleの品質評価向上、特にYMYL領域での順位改善

---

### 11. 更新日時の記録
- [x] content.config.tsに`updatedDate`フィールド追加
- [x] PostLayoutで更新日を表示
- [x] AI再生成時に更新日を自動設定

**影響**: 鮮度の高いコンテンツとして評価

---

### 12. RSS/Atomフィードの実装
- [x] `@astrojs/rss`インテグレーションをインストール
- [x] `/rss.xml`エンドポイントの作成
- [x] 全ブログに適用

**影響**: 外部サイトからの被リンク機会、購読者獲得

---

## 📋 追加検討項目

- [ ] Google Analytics導入
- [ ] Google Search Console設定
- [ ] カテゴリ・タグページのメタ情報最適化
- [ ] 404ページのカスタマイズ
- [ ] ページネーションのSEO対応

---

## 実装対象ブログ

- `/Users/s22561/dev/blog-template` （テンプレート）
- `/Users/s22561/dev/blog-food` （本音の食レポ）
- `/Users/s22561/dev/blog-gadget` （本音のガジェットレビュー）
- `/Users/s22561/dev/blog-travel` （本音の旅行記）
- `/Users/s22561/dev/blog-shopping` （本音の買い物記録）

すべての変更はテンプレートに適用し、各ブログに展開する方針とします。

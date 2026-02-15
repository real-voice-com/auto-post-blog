# Claude Code Skills 使用ガイド

このプロジェクトにインストールされているClaude Code Skillsの使用方法です。

## 📚 インストール済みスキル一覧

### グローバルスキル（どこでも使用可能）

#### 1. commit-ja
**用途**: 日本語でConventional Commits形式のコミットメッセージを生成してコミット

**使い方**:
```bash
# Claude Codeで以下のように指示
"commit-jaスキルを使ってコミットして"
```

**利点**:
- 日本語で自然なコミットメッセージ
- Conventional Commits準拠
- 変更内容を自動分析

---

#### 2. lint-fix-parallel
**用途**: TypeScriptのlintとtypecheckを実行し、自動修正可能なものを修正、残りを並列処理で修正

**使い方**:
```bash
"lint-fix-parallelスキルでコード品質を改善して"
```

**利点**:
- 自動修正による時間短縮
- 並列処理で高速化
- エラーを体系的に解決

---

#### 3. pr-create
**用途**: Pull Requestを作成。変更内容を分析してPR説明を生成

**使い方**:
```bash
"pr-createスキルでPRを作成して"
```

**利点**:
- 変更内容の自動分析
- 適切なPR説明文生成
- テストプラン提案

---

#### 4. prd-create
**用途**: プロダクト要件定義書（PRD）を作成。ユーザーと対話しながら情報収集

**使い方**:
```bash
"prd-createスキルで新機能のPRDを作成して"
```

**利点**:
- Mermaid図を含む視覚的なPRD
- 対話的な情報収集
- 構造化された要件定義

---

#### 5. skill-creator
**用途**: 新しいClaude Code スキルを作成

**使い方**:
```bash
"skill-creatorで新しいスキルを作成して"
```

**利点**:
- 適切なスキル構造
- テンプレート提供
- ベストプラクティス準拠

---

#### 6. wrangler-tunnel
**用途**: Cloudflare Workers開発用。wrangler dev --remoteでBasic認証付きトンネルを起動

**使い方**:
```bash
"wrangler-tunnelでトンネルを起動して"
```

**利点**:
- スマホなど外部デバイスから確認可能
- Basic認証でセキュア
- リモート環境でのテスト

---

#### 7. cloudflare
**用途**: Cloudflareプラットフォーム全般（Workers, Pages, KV, D1, R2, Workers AI等）

**使い方**:
```bash
"cloudflareスキルを使ってWorkers AIを実装して"
```

**利点**:
- 包括的なCloudflare知識
- ベストプラクティス
- 最新のAPI対応

---

#### 8. wrangler
**用途**: Cloudflare Workers CLI（デプロイ、開発、管理）

**使い方**:
```bash
"wranglerスキルでWorkerをデプロイして"
```

**利点**:
- 正しいコマンド構文
- エラー対処法
- 最適な開発フロー

---

#### 9. web-perf
**用途**: Chrome DevTools MCPを使用したWebパフォーマンス分析

**使い方**:
```bash
"web-perfスキルでページのパフォーマンスを分析して"
```

**利点**:
- Core Web Vitals測定
- ボトルネック特定
- 最適化提案

---

#### 10. astro
**用途**: Astroプロジェクトのベストプラクティス、CLI、設定

**使い方**:
```bash
"astroスキルを使って新しいコンポーネントを作成して"
```

**利点**:
- Astro特有の最適化
- 正しいプロジェクト構造
- パフォーマンス重視の実装

---

#### 11. seo-audit
**用途**: SEOの監査、レビュー、診断

**使い方**:
```bash
"seo-auditスキルでサイトのSEOを診断して"
```

**利点**:
- 技術的SEO問題の発見
- オンページSEO改善提案
- 検索順位向上のヒント

---

#### 12. programmatic-seo
**用途**: テンプレートとデータを使った大規模SEOページ生成

**使い方**:
```bash
"programmatic-seoスキルで都道府県別ページを生成して"
```

**利点**:
- 規模のあるSEO対策
- テンプレート自動生成
- データ駆動型ページ作成

---

#### 13. seo
**用途**: 検索エンジン最適化全般

**使い方**:
```bash
"seoスキルでメタタグを最適化して"
```

**利点**:
- 包括的なSEO知識
- 構造化データ実装
- サイトマップ最適化

---

#### 14. find-skills
**用途**: 新しいスキルを発見・インストール

**使い方**:
```bash
"find-skillsで画像処理のスキルを探して"
```

**利点**:
- スキルの発見
- インストール支援
- 機能拡張

---

## 🎯 プロジェクト固有スキル（各ブログディレクトリで使用）

各ブログ（blog-template, blog-food, blog-gadget, blog-travel, blog-shopping）には以下のスキルがインストールされています：

1. **astro** - Astro開発のベストプラクティス
2. **cloudflare** - Cloudflare統合
3. **web-perf** - パフォーマンス分析
4. **seo-audit** - SEO監査
5. **programmatic-seo** - 大規模SEO
6. **seo** - SEO最適化

**使い方**:
```bash
# ブログディレクトリ内で
cd /Users/s22561/dev/blog-food
# Claude Codeに指示
"seoスキルでこのブログのメタタグを改善して"
```

---

## 💡 実用例

### 例1: 新機能を開発してPRを作成
```bash
# 1. 機能開発
"astroスキルを使って新しいカテゴリページを作成して"

# 2. コード品質チェック
"lint-fix-parallelでコードを整理して"

# 3. コミット
"commit-jaスキルでコミットして"

# 4. PR作成
"pr-createスキルでPRを作成して"
```

### 例2: SEO改善
```bash
# 1. 診断
"seo-auditスキルで現状を診断して"

# 2. 改善実装
"seoスキルで問題を修正して"

# 3. パフォーマンス確認
"web-perfスキルでCore Web Vitalsを測定して"
```

### 例3: Workers開発
```bash
# 1. 開発環境起動
"wrangler-tunnelで開発サーバーを起動して"

# 2. Workers AI実装
"cloudflareスキルを使ってWorkers AI機能を追加して"

# 3. デプロイ
"wranglerスキルでデプロイして"
```

### 例4: 大規模コンテンツ生成
```bash
# 1. PRD作成
"prd-createスキルで都道府県別ページの要件定義を作成して"

# 2. 実装
"programmatic-seoスキルで47都道府県分のページを生成して"

# 3. SEO確認
"seo-auditスキルで生成されたページをチェックして"
```

---

## 🔧 スキルの管理

### スキル一覧確認
```bash
# グローバルスキル
ls ~/.agents/skills/

# プロジェクト固有スキル
ls .agents/skills/
```

### 新しいスキルを追加
```bash
# グローバル
npx skills add <skill-name>

# プロジェクト固有
cd /path/to/project
npx skills add <skill-name>
```

### スキル検索
```bash
"find-skillsで〇〇のスキルを探して"
```

---

## 📝 ベストプラクティス

1. **適切なスキルを選択**
   - タスクに最も関連するスキルを使用
   - 複数のスキルを組み合わせて使用可能

2. **プロジェクト固有 vs グローバル**
   - ブログ開発: プロジェクト固有スキルを使用
   - ワークフロー系: グローバルスキルを使用

3. **スキルの更新**
   - 定期的にスキルをアップデート
   - 新しいスキルを探索

4. **ドキュメント参照**
   - 各スキルのREADMEを確認
   - 最新の使用方法を把握

---

## 🚀 このプロジェクトでの推奨ワークフロー

### ブログ記事の改善
1. `seo-audit` で問題点を特定
2. `seo` で改善実装
3. `web-perf` でパフォーマンス確認
4. `commit-ja` でコミット

### 新機能開発
1. `prd-create` で要件定義
2. `astro` / `cloudflare` で実装
3. `lint-fix-parallel` でコード品質確保
4. `commit-ja` でコミット
5. `pr-create` でPR作成

### デプロイ
1. `wrangler` でWorkerデプロイ
2. Cloudflare Pagesで自動デプロイ（git push時）
3. `web-perf` で本番環境確認

---

**更新日**: 2026年2月14日
**対象プロジェクト**: aouto-post-blog

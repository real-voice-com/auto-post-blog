import type { FC } from "hono/jsx";
import { GENRES } from "@auto-post-blog/shared";

export const PostForm: FC = () => {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      hx-post="/api/submit/interview"
      hx-target="#result"
      hx-swap="innerHTML"
      hx-encoding="multipart/form-data"
      hx-indicator="#spinner"
    >
      {/* ジャンル選択 */}
      <fieldset>
        <legend>ジャンル (必須)</legend>
        <div class="genre-grid">
          {Object.entries(GENRES).map(([key, config]) => (
            <label class="genre-card">
              <input type="radio" name="genre" value={key} required />
              <span>{config.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 日付 */}
      <div class="field">
        <label for="date">日付</label>
        <input type="date" id="date" name="date" value={today} required />
      </div>

      {/* タイトル案 */}
      <div class="field">
        <label for="titleDraft">タイトル案</label>
        <input
          type="text"
          id="titleDraft"
          name="titleDraft"
          placeholder="XX駅のマックで飲んだコーラのレビュー"
          required
        />
      </div>

      {/* 内容 */}
      <div class="field">
        <label for="text">内容</label>
        <textarea
          id="text"
          name="text"
          rows={8}
          placeholder={
            "・Lサイズ100円キャンペーン中\n・氷多め最高\n・ポテトもセットで頼んだ"
          }
          required
        />
      </div>

      {/* 評価 */}
      <fieldset>
        <legend>総合評価 (必須)</legend>
        <div class="rating-input">
          {[1, 2, 3, 4, 5].map((star) => (
            <label class="star-label" key={star}>
              <input
                type="radio"
                name="rating"
                value={star}
                required
                onclick={`document.querySelectorAll('.star-label').forEach((el, i) => { el.classList.toggle('active', i < this.value); })`}
              />
              <span class="star">★</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 費用明細 */}
      <fieldset>
        <legend>費用 (必須)</legend>
        <div id="expense-rows">
          <div class="expense-row">
            <input type="text" name="expense_name[]" placeholder="項目" required />
            <input
              type="number"
              name="expense_amount[]"
              placeholder="金額"
              min="0"
              required
              oninput="updateTotal()"
            />
          </div>
        </div>
        <button type="button" class="btn-secondary" onclick="addExpenseRow()">
          + 項目を追加
        </button>
        <div class="expense-total">
          合計: <span id="expense-total-display">0</span> 円
        </div>
      </fieldset>

      {/* 画像アップロード */}
      <div class="field">
        <label for="images">画像を追加 (自動圧縮: 各400KB以下)</label>
        <input
          type="file"
          id="images"
          name="images"
          accept="image/jpeg,image/png,image/webp"
          multiple
        />
        <div id="image-preview" class="image-preview" />
      </div>

      {/* 送信 */}
      <button type="submit" class="btn-primary" hx-disabled-elt="this">
        インタビュー開始
      </button>
      <div id="spinner" class="htmx-indicator">
        <span class="spinner" />
        AI がインタビュー質問を生成中...
      </div>
      <div
        id="debug-log"
        style="margin-top: 1rem; padding: 1rem; background: #f0f0f0; border-radius: 4px; font-family: monospace; font-size: 0.875rem; white-space: pre-wrap; display: none;"
      />
      <div id="result" />
    </form>
  );
};

import type { FC } from "hono/jsx";

export const SuccessResult: FC<{ articleUrl: string }> = ({ articleUrl }) => {
  const url = new URL(articleUrl);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;

  return (
    <div class="result success">
      <p>投稿完了！</p>
      <a href={articleUrl} target="_blank" rel="noopener" class="article-link">
        <img
          src={faviconUrl}
          alt=""
          class="favicon"
          width="16"
          height="16"
          loading="lazy"
          onerror="this.style.display='none'"
        />
        <span>{articleUrl}</span>
      </a>
    </div>
  );
};

export const ErrorResult: FC<{ error: string }> = ({ error }) => (
  <div class="result error">
    <p>エラーが発生しました</p>
    <p>{error}</p>
  </div>
);

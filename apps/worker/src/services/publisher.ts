import type { GeneratedArticle, SubmitImage } from "@auto-post-blog/shared";

interface PublishInput {
  token: string;
  repo: string;
  article: GeneratedArticle;
  images: SubmitImage[];
  date: string;
}

const GITHUB_API = "https://api.github.com";

async function githubFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "auto-post-blog",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return response.json();
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function publishToGitHub(input: PublishInput): Promise<{
  commitSha: string;
  articlePath: string;
}> {
  const { token, repo, article, images, date } = input;
  const [year, month] = date.split("-");
  const branch = "main";

  // 1. HEAD の SHA を取得
  const ref = await githubFetch<{ object: { sha: string } }>(
    `/repos/${repo}/git/refs/heads/${branch}`,
    token
  );
  const headSha = ref.object.sha;

  // 2. HEAD コミットの tree SHA を取得
  const headCommit = await githubFetch<{
    sha: string;
    tree: { sha: string };
  }>(`/repos/${repo}/git/commits/${headSha}`, token);
  const baseTreeSha = headCommit.tree.sha;

  // 3. 画像の blob を作成
  const imageBlobs: Array<{ path: string; sha: string }> = [];
  for (const image of images) {
    const blob = await githubFetch<{ sha: string }>(`/repos/${repo}/git/blobs`, token, {
      method: "POST",
      body: JSON.stringify({
        content: arrayBufferToBase64(image.data),
        encoding: "base64",
      }),
    });
    imageBlobs.push({
      path: `src/assets/images/${year}/${month}/${image.filename}`,
      sha: blob.sha,
    });
  }

  // 4. Markdown の blob を作成
  const mdBlob = await githubFetch<{ sha: string }>(`/repos/${repo}/git/blobs`, token, {
    method: "POST",
    body: JSON.stringify({
      content: article.markdown,
      encoding: "utf-8",
    }),
  });

  // 5. 新しい tree を作成（MD + 画像を一括）
  const articlePath = `src/content/posts/${article.slug}.md`;
  const treeItems = [
    {
      path: articlePath,
      mode: "100644" as const,
      type: "blob" as const,
      sha: mdBlob.sha,
    },
    ...imageBlobs.map((img) => ({
      path: img.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: img.sha,
    })),
  ];

  const newTree = await githubFetch<{ sha: string }>(
    `/repos/${repo}/git/trees`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    }
  );

  // 6. コミット作成
  const newCommit = await githubFetch<{ sha: string }>(
    `/repos/${repo}/git/commits`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        message: `Add post: ${article.slug}`,
        tree: newTree.sha,
        parents: [headSha],
      }),
    }
  );

  // 7. ブランチ参照を更新
  await githubFetch(`/repos/${repo}/git/refs/heads/${branch}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      sha: newCommit.sha,
    }),
  });

  return {
    commitSha: newCommit.sha,
    articlePath,
  };
}

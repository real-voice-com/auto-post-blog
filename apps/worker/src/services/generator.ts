import type {
  Genre,
  Tone,
  Expenses,
  SubmitImage,
  GeneratedArticle,
} from "@auto-post-blog/shared";

const MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

export interface InterviewAnswer {
  question: string;
  answer: string;
}

interface GenerateInput {
  genre: Genre;
  date: string;
  titleDraft: string;
  text: string;
  rating: number;
  expenses: Expenses;
  images: SubmitImage[];
  tone: Tone;
  interviewAnswers?: InterviewAnswer[];
}

function buildSystemPrompt(tone: Tone, genre: Genre): string {
  const toneInstruction =
    tone === "technical"
      ? "技術的で正確な文体で書いてください。専門用語は適切に使い、読者が学べる内容にしてください。"
      : "カジュアルで親しみやすい文体で書いてください。読者が楽しめるような表現を使ってください。";

  // 著者情報をジャンルに応じて設定
  const authorContext = (() => {
    switch (genre) {
      case "food":
        return "著者「おおいし」は24歳の都内エンジニア。週1回のプライベート外食と週1-2回の会社飲み会で都内の飲食店を実体験。梅、うどん、スイーツ、牡蠣が好物。お酒好きだが弱め。「提供スピード」「店員さんの対応」「コスパ」など、実際に食べた人だけが分かる生の声を大切にしている。";
      case "gadget":
        return "著者「おおいし」は24歳の都内IT企業エンジニア、高専卒。現在は1K賃貸住まいだが、建築中の新居（22歳で購入した戸建て）への引っ越しに向けてガジェット選定中。エンジニア視点での技術的な評価と、限られた予算・スペースでの実用性を重視。";
      case "travel":
        return "著者「おおいし」は24歳エンジニア、熊本出身で現在は東京在住。旅行頻度は高くない、ごく一般的な旅行者。年に数回の旅行だからこそ感じる新鮮な驚きや発見を大切にする。友人や恋人との旅行スタイルが中心。";
      case "shopping":
        return "著者「おおいし」は24歳エンジニア。22歳で戸建てを購入し、現在新居建築中。記念コイン、日用品、ファッション、おもちゃ、ぬいぐるみ、ガチャガチャ、時計など、ジャンル問わず「気になったもの」を購入。日用品→コスパ重視、おもちゃ・ぬいぐるみ→可愛さ・情緒性重視。";
      default:
        return "著者「おおいし」は24歳の都内エンジニア。22歳で戸建て購入、現在新居建築中。熊本出身、高専卒。一般的な大衆の正直な意見を大切に、実際に使用・体験したものだけを忖度なしでレビュー。";
    }
  })();

  return `あなたはブログ記事を生成するAIライターです。
${toneInstruction}

## 著者情報
${authorContext}

この著者の視点と価値観を意識して、記事を執筆してください。
ユーザーから提供される情報（テキスト、画像、費用明細）をもとに、
frontmatter付きのMarkdown記事を1つ生成してください。

## 出力フォーマット (厳守)

---
title: "AIが考えた正式なタイトル"
description: "記事の要約（100-160文字程度、検索結果に表示される説明文）"
slug: "title-in-english-lowercase-with-hyphens"
date: YYYY-MM-DD
category: "カテゴリ名"
tags: ["タグ1", "タグ2", "タグ3"]
image: "../../assets/images/YYYY/MM/最初の画像ファイル名"
rating: 評価(1-5の数値)
totalCost: 合計金額(数値)
---

(記事本文 - 自然な日本語で1000〜2000文字程度。SEO対策として、読者が知りたい情報を網羅的に記載)

## かかった費用

| 項目 | 金額 |
|------|------|
| 項目名 | ¥金額 |
| **合計** | **¥合計金額** |

## ルール
- titleはタイトル案をベースにSEOを意識して改善すること
- descriptionは記事の内容を100-160文字程度で要約すること（Google検索結果に表示されるため重要）
- slugはtitleの内容を英語に翻訳し、小文字のハイフン区切りで記述すること（例: "tokyo-ramen-tour"）
- dateはユーザー指定値をそのまま使うこと
- ratingはユーザー指定値をそのまま数値で記述すること(1-5の整数)
- categoryとtagsはテキストと画像から判断して生成すること
- **画像がある場合、必ず記事本文内でMarkdown記法で埋め込むこと**
  - 画像パスは \`../../assets/images/YYYY/MM/画像ファイル名\` の形式で記述すること
  - 複数画像がある場合は、すべての画像を記事の適切な位置に配置すること
  - 画像には適切な説明文（alt属性）を付けること
  - 画像から読み取れる情報を記事に盛り込むこと
- 費用明細はユーザー入力をそのままテーブルに配置すること
- frontmatterのimageは最初の画像のパスを設定すること（画像がない場合は省略）
- Markdown以外のテキストは出力しないこと（説明文や前置きは不要）
- インタビューの補足情報が提供された場合、Q&A形式・「質問への回答」などの見出し・フォーマットを記事内に一切含めないこと。あくまで記事の品質を高める参考情報として自然な文体に溶け込ませること`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function buildUserContent(
  input: GenerateInput
): Array<{ type: string; text?: string; image_url?: { url: string } }> {
  const content: Array<{
    type: string;
    text?: string;
    image_url?: { url: string };
  }> = [];

  const expenseText = input.expenses.items
    .map((item) => `- ${item.name}: ¥${item.amount}`)
    .join("\n");

  // 日付から年月を抽出 (YYYY-MM-DD -> YYYY/MM)
  const [year, month] = input.date.split("-");
  const imagePath = `../../assets/images/${year}/${month}`;

  const imageInfoText =
    input.images.length > 0
      ? `画像: ${input.images.length}枚\n画像パス: ${imagePath}\n画像ファイル名:\n${input.images.map((img, i) => `  ${i + 1}. ${img.filename} → ![説明文](${imagePath}/${img.filename})`).join("\n")}\n\n**これらの画像をすべて記事本文内の適切な位置に配置してください**`
      : "画像: なし";

  const interviewText =
    input.interviewAnswers && input.interviewAnswers.length > 0
      ? `\n\n## 追加情報（参考のみ・記事には直接掲載しないこと）\n以下はより良い記事を書くための補足情報です。Q&A形式や「質問への回答」などの見出しとして記事に掲載せず、内容を自然な文体の記事本文に活かしてください。\n${input.interviewAnswers.map((qa) => `- ${qa.question}：${qa.answer}`).join("\n")}`
      : "";

  content.push({
    type: "text",
    text: `ジャンル: ${input.genre}
日付: ${input.date}
タイトル案: ${input.titleDraft}
総合評価: ${input.rating}/5 (★の数で表記)

内容:
${input.text}

費用明細:
${expenseText}
合計: ¥${input.expenses.total}

${imageInfoText}${interviewText}`,
  });

  for (const image of input.images) {
    const base64 = arrayBufferToBase64(image.data);
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${image.contentType};base64,${base64}`,
      },
    });
  }

  return content;
}

function extractSlug(markdown: string, date: string): string {
  // Try to extract slug from frontmatter first
  const slugMatch = markdown.match(/^slug:\s*["']?(.+?)["']?\s*$/m);
  if (slugMatch) {
    const slug = slugMatch[1].trim();
    // Sanitize: lowercase, only alphanumeric and hyphens
    const sanitized = slug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60);
    return `${date}-${sanitized}`;
  }

  // Fallback: extract from title (old behavior)
  const titleMatch = markdown.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch ? titleMatch[1] : "untitled";

  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return `${date}-${sanitized || "untitled"}`;
}

export async function generateArticle(
  ai: Ai,
  input: GenerateInput
): Promise<GeneratedArticle> {
  const messages = [
    { role: "system" as const, content: buildSystemPrompt(input.tone, input.genre) },
    { role: "user" as const, content: buildUserContent(input) },
  ];

  const response = await ai.run(MODEL, {
    messages,
    max_tokens: 4096,
    temperature: 0.7,
  });

  // Handle different response formats
  let markdown: string;
  if (typeof response === "string") {
    markdown = response;
  } else if (response && typeof response === "object" && "response" in response) {
    const responseData = (response as { response: unknown }).response;
    if (typeof responseData === "string") {
      markdown = responseData;
    } else if (typeof responseData === "object" && responseData !== null) {
      // If response is an object, try to extract markdown from it
      markdown = JSON.stringify(responseData);
    } else {
      console.error("Unexpected response.response format:", typeof responseData);
      throw new Error("AIが予期しない形式のレスポンスを返しました");
    }
  } else {
    console.error("Unexpected response format:", response);
    throw new Error("AIが予期しない形式のレスポンスを返しました");
  }

  if (!markdown || markdown.trim().length === 0) {
    throw new Error("AIが空のレスポンスを返しました");
  }

  // モデルが ```markdown で囲んだ場合に除去
  const cleaned = markdown
    .replace(/^```(?:markdown)?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  const slug = extractSlug(cleaned, input.date);

  return { markdown: cleaned, slug };
}

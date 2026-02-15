import type { Genre, Tone } from "@auto-post-blog/shared";

const MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

interface InterviewInput {
  genre: Genre;
  titleDraft: string;
  text: string;
  tone: Tone;
}

export interface InterviewQuestion {
  id: string;
  type: "text" | "select" | "image";
  label: string;
  placeholder?: string;
  options?: string[];
  multiple?: boolean;
  required?: boolean;
}

function buildInterviewerPrompt(tone: Tone): string {
  const toneInstruction =
    tone === "technical"
      ? "技術的で詳細な情報を引き出す質問をしてください。"
      : "読者が楽しめるエピソードや感想を引き出す質問をしてください。";

  return `あなたは優秀なインタビュアーです。
${toneInstruction}

ユーザーが提供した記事の下書き情報を読み、より良い記事を書くために3〜5個の追加質問を生成してください。

## 質問の目的
- 記事の内容を深掘りする
- 具体的なエピソードや詳細を引き出す
- 読者が知りたい情報を補完する
- SEO対策として有用なキーワードを引き出す

## 出力フォーマット（厳守）
以下のJSON形式で質問を出力してください。説明文や前置きは不要です。

{
  "questions": [
    {
      "id": "q1",
      "type": "text",
      "label": "質問文",
      "placeholder": "回答のヒント（任意）",
      "required": false
    },
    {
      "id": "q2",
      "type": "select",
      "label": "質問文",
      "options": ["選択肢1", "選択肢2", "選択肢3"],
      "required": false
    },
    {
      "id": "q3",
      "type": "image",
      "label": "追加で撮影してほしい写真の説明",
      "multiple": true,
      "required": false
    }
  ]
}

## typeの種類
- "text": 自由記述（textarea）
- "select": 選択肢から選ぶ（select）
- "image": 画像を追加アップロード（file input）

## ルール
- 質問は3〜5個にすること
- 各質問は簡潔で明確にすること（labelは1文で）
- yes/noで答えられる質問は避けること
- 具体的な情報を引き出せる質問にすること
- type="text"の場合、placeholderで回答のヒントを提供すること
- type="select"の場合、適切な選択肢を3〜5個提供すること
- type="image"の場合、どんな写真が欲しいか具体的に説明すること
- すべての質問はrequired=falseにすること（任意回答）
- JSON以外のテキストは出力しないこと`;
}

export async function generateInterviewQuestions(
  ai: Ai,
  input: InterviewInput
): Promise<InterviewQuestion[]> {
  const messages = [
    {
      role: "system" as const,
      content: buildInterviewerPrompt(input.tone),
    },
    {
      role: "user" as const,
      content: `ジャンル: ${input.genre}
タイトル案: ${input.titleDraft}

内容:
${input.text}`,
    },
  ];

  const response = await ai.run(MODEL, {
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  // Handle different response formats
  let parsed: { questions?: InterviewQuestion[] };

  if (response && typeof response === "object" && "response" in response) {
    const responseData = (response as { response: unknown }).response;

    // Check if response is already an object with questions
    if (
      typeof responseData === "object" &&
      responseData !== null &&
      "questions" in responseData
    ) {
      parsed = responseData as { questions?: InterviewQuestion[] };
    } else if (typeof responseData === "string") {
      // If it's a string, try to parse it
      const jsonText = responseData
        .trim()
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      try {
        parsed = JSON.parse(jsonText) as { questions?: InterviewQuestion[] };
      } catch {
        console.error("Failed to parse JSON string response");
        return generateFallbackQuestions(input.genre);
      }
    } else {
      console.error("Unexpected response.response format:", typeof responseData);
      return generateFallbackQuestions(input.genre);
    }
  } else {
    console.error("Unexpected response format:", response);
    return generateFallbackQuestions(input.genre);
  }

  return parsed.questions || [];
}

function generateFallbackQuestions(genre: Genre): InterviewQuestion[] {
  const questionsByGenre: Record<Genre, InterviewQuestion[]> = {
    travel: [
      {
        id: "q1",
        type: "text",
        label: "その場所を選んだ理由は何ですか？",
        placeholder: "きっかけや決め手を教えてください",
        required: false,
      },
      {
        id: "q2",
        type: "text",
        label: "一番印象に残ったシーンや瞬間を教えてください",
        placeholder: "具体的なエピソードがあれば",
        required: false,
      },
      {
        id: "q3",
        type: "select",
        label: "誰と行きましたか？",
        options: ["一人で", "友人と", "家族と", "恋人と", "その他"],
        required: false,
      },
    ],
    food: [
      {
        id: "q1",
        type: "text",
        label: "その料理の味を詳しく教えてください",
        placeholder: "甘い・辛い・濃厚など、具体的に",
        required: false,
      },
      {
        id: "q2",
        type: "text",
        label: "お店の雰囲気やサービスはどうでしたか？",
        placeholder: "店内の様子や接客について",
        required: false,
      },
      {
        id: "q3",
        type: "image",
        label: "お店の外観や料理の写真があれば追加してください",
        multiple: true,
        required: false,
      },
    ],
    gadget: [
      {
        id: "q1",
        type: "text",
        label: "実際に使ってみて、期待以上だった点は何ですか？",
        placeholder: "具体的な使用シーンとともに",
        required: false,
      },
      {
        id: "q2",
        type: "text",
        label: "改善してほしい点や不満な点はありますか？",
        placeholder: "正直な感想をお願いします",
        required: false,
      },
      {
        id: "q3",
        type: "select",
        label: "どんな人におすすめできますか？",
        options: [
          "初心者向け",
          "中級者向け",
          "上級者向け",
          "誰にでもおすすめ",
          "特定の用途に限る",
        ],
        required: false,
      },
    ],
    shopping: [
      {
        id: "q1",
        type: "text",
        label: "購入の決め手は何でしたか？",
        placeholder: "価格、機能、デザインなど",
        required: false,
      },
      {
        id: "q2",
        type: "text",
        label: "実際に使ってみた感想を教えてください",
        placeholder: "良かった点、気になった点など",
        required: false,
      },
      {
        id: "q3",
        type: "image",
        label: "商品の写真があれば追加してください",
        multiple: true,
        required: false,
      },
    ],
  };

  return questionsByGenre[genre] || questionsByGenre.shopping;
}

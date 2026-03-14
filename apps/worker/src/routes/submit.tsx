import { Hono } from "hono";
import type { Env } from "../types";
import {
  GENRES,
  type Genre,
  type Expenses,
  type SubmitImage,
} from "@auto-post-blog/shared";
import { generateArticle, type InterviewAnswer } from "../services/generator";
import { publishToGitHub } from "../services/publisher";
import { SuccessResult, ErrorResult } from "../views/result";
import {
  generateInterviewQuestions,
  type InterviewQuestion,
} from "../services/interviewer";
import { fetchAmazonOGP } from '../services/amazon-ogp';
import type { AmazonProductInfo } from '../services/amazon-ogp';

const app = new Hono<{ Bindings: Env }>();

// Step 1: Generate interview questions and save session
app.post("/submit/interview", async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });

    const genre = body["genre"] as string;
    const titleDraft = body["titleDraft"] as string;
    const text = body["text"] as string;
    const date = body["date"] as string;
    const rating = Number(body["rating"]);

    if (!genre || !(genre in GENRES)) {
      return c.html(<ErrorResult error="無効なジャンルです" />, 400);
    }

    if (!titleDraft || !text || !date) {
      return c.html(<ErrorResult error="日付、タイトル案、内容は必須です" />, 400);
    }

    if (!rating || rating < 1 || rating > 5) {
      return c.html(<ErrorResult error="評価は1〜5の星で選択してください" />, 400);
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Save all form data to KV
    const sessionData: {
      genre: string;
      date: string;
      titleDraft: string;
      text: string;
      rating: number;
      expenses: Record<string, unknown>;
      images: unknown[];
      amazonLinks?: Array<{url: string; label: string}>;
    } = {
      genre,
      date,
      titleDraft,
      text,
      rating,
      expenses: {},
      images: [],
    };

    // Parse expenses
    const rawNames = body["expense_name[]"];
    const rawAmounts = body["expense_amount[]"];
    const expenseNames = Array.isArray(rawNames) ? rawNames : [rawNames];
    const expenseAmounts = Array.isArray(rawAmounts) ? rawAmounts : [rawAmounts];

    const expenseItems = expenseNames
      .filter((name): name is string => typeof name === "string")
      .map((name, i) => ({
        name,
        amount: Number(expenseAmounts[i]),
      }))
      .filter((item) => item.name && !isNaN(item.amount));

    if (expenseItems.length === 0) {
      return c.html(<ErrorResult error="費用を1つ以上入力してください" />, 400);
    }

    sessionData.expenses = {
      items: expenseItems,
      total: expenseItems.reduce((sum: number, item) => sum + item.amount, 0),
    };

    // Parse images
    const rawImages = body["images"];
    const imageFiles: File[] = [];
    if (rawImages) {
      if (Array.isArray(rawImages)) {
        imageFiles.push(...rawImages.filter((f): f is File => f instanceof File));
      } else if (rawImages instanceof File && rawImages.size > 0) {
        imageFiles.push(rawImages);
      }
    }

    // Convert images to base64 (chunk-based to avoid stack overflow)
    const images: Array<{ filename: string; contentType: string; data: string }> = [];
    for (const file of imageFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convert to base64 in chunks to avoid stack overflow
      let base64 = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        base64 += String.fromCharCode(...chunk);
      }
      base64 = btoa(base64);

      images.push({
        filename: file.name,
        contentType: file.type,
        data: base64,
      });
    }
    sessionData.images = images;

    // Parse Amazon links
    const rawAmazonLabels = body["amazon_label[]"];
    const rawAmazonUrls = body["amazon_url[]"];
    const amazonLabels = Array.isArray(rawAmazonLabels) ? rawAmazonLabels : rawAmazonLabels ? [rawAmazonLabels] : [];
    const amazonUrls = Array.isArray(rawAmazonUrls) ? rawAmazonUrls : rawAmazonUrls ? [rawAmazonUrls] : [];

    const amazonLinks = amazonUrls
      .map((url, i) => ({
        url: typeof url === 'string' ? url.trim() : '',
        label: typeof amazonLabels[i] === 'string' ? (amazonLabels[i] as string).trim() : '',
      }))
      .filter(link => link.url.length > 0);

    if (amazonLinks.length > 0) {
      sessionData.amazonLinks = amazonLinks;
    }

    // Save to KV with 1 hour expiration
    await c.env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(sessionData), {
      expirationTtl: 86400, // 24時間（送信成功時に明示削除）
    });

    // Generate interview questions
    const genreConfig = GENRES[genre as Genre];
    const questions = await generateInterviewQuestions(c.env.AI, {
      genre: genre as Genre,
      titleDraft,
      text,
      tone: genreConfig.tone,
    });

    return c.html(
      <InterviewQuestionsView questions={questions} sessionId={sessionId} />
    );
  } catch (error) {
    console.error("Interview generation error:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return c.html(<ErrorResult error={message} />, 500);
  }
});

// Step 2: Generate article with interview responses
app.post("/submit/generate", async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });

    const sessionId = body["sessionId"] as string;
    if (!sessionId) {
      return c.html(<ErrorResult error="セッションIDが見つかりません" />, 400);
    }

    // Retrieve session data from KV
    const sessionDataStr = await c.env.SESSIONS.get(`session:${sessionId}`);
    if (!sessionDataStr) {
      return c.html(
        <ErrorResult error="セッションが期限切れです。最初からやり直してください" />,
        400
      );
    }

    const sessionData = JSON.parse(sessionDataStr) as {
      genre: string;
      date: string;
      titleDraft: string;
      text: string;
      rating: number;
      expenses: Expenses;
      images: Array<{ filename: string; contentType: string; data: string }>;
      amazonLinks?: Array<{url: string; label: string}>;
    };

    // Parse interview answers
    const interviewAnswers: InterviewAnswer[] = [];
    const additionalImages: File[] = [];

    Object.keys(body).forEach((key) => {
      // Text/Select answers
      const answerMatch = key.match(/^interview_answer\[(.+)\]$/);
      if (answerMatch) {
        const questionId = answerMatch[1];
        const typeKey = `interview_type[${questionId}]`;
        const questionType = body[typeKey] as string;
        const answer = body[key] as string;

        if (questionType && answer && answer.trim()) {
          // For text/select, save the answer with a generated label
          interviewAnswers.push({
            question: `質問${questionId}への回答`,
            answer: answer.trim(),
          });
        }
      }

      // Image answers
      const imageMatch = key.match(/^interview_image\[(.+)\]$/);
      if (imageMatch) {
        const files = body[key];
        if (files) {
          if (Array.isArray(files)) {
            additionalImages.push(...files.filter((f): f is File => f instanceof File));
          } else if (files instanceof File && files.size > 0) {
            additionalImages.push(files);
          }
        }
      }
    });

    // Convert base64 images back to SubmitImage format (initial images)
    const images: SubmitImage[] = sessionData.images.map((img) => {
      // Decode base64 in chunks to avoid stack overflow
      const binaryString = atob(img.data);
      const bytes = new Uint8Array(binaryString.length);

      const chunkSize = 8192;
      for (let i = 0; i < binaryString.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, binaryString.length);
        for (let j = i; j < end; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
      }

      return {
        filename: img.filename,
        contentType: img.contentType,
        data: bytes.buffer,
      };
    });

    // Add additional images from interview
    for (const file of additionalImages) {
      const arrayBuffer = await file.arrayBuffer();
      images.push({
        filename: file.name,
        contentType: file.type,
        data: arrayBuffer,
      });
    }

    // Fetch Amazon OGP info
    const rawAmazonLinks = sessionData.amazonLinks || [];
    const amazonProductInfos: AmazonProductInfo[] = await Promise.all(
      rawAmazonLinks.map(link => fetchAmazonOGP(
        link.url,
        link.label,
        c.env.AMAZON_ACCESS_KEY,
        c.env.AMAZON_SECRET_KEY,
        c.env.AMAZON_ASSOCIATE_TAG,
      ))
    );

    // Generate article
    const genreConfig = GENRES[sessionData.genre as Genre];
    const article = await generateArticle(c.env.AI, {
      genre: sessionData.genre as Genre,
      date: sessionData.date,
      titleDraft: sessionData.titleDraft,
      text: sessionData.text,
      rating: sessionData.rating,
      expenses: sessionData.expenses,
      images,
      tone: genreConfig.tone,
      interviewAnswers: interviewAnswers.length > 0 ? interviewAnswers : undefined,
      amazonLinks: amazonProductInfos.length > 0 ? amazonProductInfos : undefined,
    });

    // Publish to GitHub
    await publishToGitHub({
      token: c.env.GITHUB_TOKEN,
      repo: genreConfig.repo,
      article,
      images,
      date: sessionData.date,
    });

    // Clean up session
    await c.env.SESSIONS.delete(`session:${sessionId}`);

    // Success response
    const articleUrl = `https://${genreConfig.domain}/posts/${article.slug}/`;
    return c.html(<SuccessResult articleUrl={articleUrl} />);
  } catch (error) {
    console.error("Submit generate error:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return c.html(<ErrorResult error={message} />, 500);
  }
});

interface InterviewQuestionsViewProps {
  questions: InterviewQuestion[];
  sessionId: string;
}

const InterviewQuestionsView: React.FC<InterviewQuestionsViewProps> = ({
  questions,
  sessionId,
}) => {
  return (
    <div class="interview-section">
      <h2>📝 記事をより良くするための追加質問</h2>
      <p class="interview-intro">
        AIが記事の内容を深掘りするための質問を生成しました。
        <br />
        回答することで、より詳細で魅力的な記事が生成されます。すべて任意です。
      </p>

      <form
        hx-post="/api/submit/generate"
        hx-target="#result"
        hx-swap="innerHTML"
        hx-indicator="#spinner"
        hx-encoding="multipart/form-data"
      >
        <input type="hidden" name="sessionId" value={String(sessionId)} />

        <div class="interview-questions">
          {(questions as Array<InterviewQuestion>).map((q, index) => (
            <div class="interview-question" key={String(q.id)}>
              <input
                type="hidden"
                name={`interview_type[${String(q.id)}]`}
                value={String(q.type)}
              />
              <label for={`answer-${String(q.id)}`}>
                <strong>質問 {index + 1}:</strong> {String(q.label)}
              </label>

              {q.type === "text" && (
                <textarea
                  id={`answer-${String(q.id)}`}
                  name={`interview_answer[${String(q.id)}]`}
                  rows={3}
                  placeholder={q.placeholder || "できるだけ具体的に回答してください..."}
                  required={q.required || false}
                />
              )}

              {q.type === "select" && (
                <select
                  id={`answer-${String(q.id)}`}
                  name={`interview_answer[${String(q.id)}]`}
                  required={q.required || false}
                >
                  <option value="">選択してください</option>
                  {q.options?.map((option) => (
                    <option value={String(option)} key={String(option)}>
                      {String(option)}
                    </option>
                  ))}
                </select>
              )}

              {q.type === "image" && (
                <input
                  type="file"
                  id={`answer-${String(q.id)}`}
                  name={`interview_image[${String(q.id)}]`}
                  accept="image/jpeg,image/png,image/webp"
                  multiple={q.multiple || false}
                  required={q.required || false}
                />
              )}
            </div>
          ))}
        </div>

        <div class="interview-actions">
          <button type="submit" class="btn-primary" hx-disabled-elt="this">
            回答して記事を生成
          </button>
        </div>
      </form>

      <div id="spinner" class="htmx-indicator">
        <span class="spinner" />
        AI が記事を生成中...
      </div>
    </div>
  );
};

export { app as submitRoute };

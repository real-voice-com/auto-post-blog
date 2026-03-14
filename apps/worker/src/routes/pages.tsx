import { Hono } from "hono";
import type { Env } from "../types";
import { Layout } from "../views/layout";
import { PostForm } from "../views/form";
import {
  generateInterviewQuestions,
  type InterviewQuestion,
} from "../services/interviewer";
import { GENRES, type Genre } from "@auto-post-blog/shared";

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const sessionId = c.req.query("session");

  // セッションIDがある場合はインタビュー画面を復元
  if (sessionId) {
    const sessionDataStr = await c.env.SESSIONS.get(`session:${sessionId}`);
    if (sessionDataStr) {
      try {
        const sessionData = JSON.parse(sessionDataStr) as {
          genre: string;
          date: string;
          titleDraft: string;
          text: string;
          rating: number;
        };

        const genreConfig = GENRES[sessionData.genre as Genre];
        const questions = await generateInterviewQuestions(c.env.AI, {
          genre: sessionData.genre as Genre,
          titleDraft: sessionData.titleDraft,
          text: sessionData.text,
          tone: genreConfig.tone,
        });

        return c.html(
          <Layout>
            <PostForm restoredSessionId={sessionId} restoredInterview={<RestoredInterviewView questions={questions} sessionId={sessionId} />} />
          </Layout>
        );
      } catch {
        // セッションデータが壊れていたら通常フォームを表示
      }
    }
  }

  return c.html(
    <Layout>
      <PostForm />
    </Layout>
  );
});

interface RestoredInterviewViewProps {
  questions: InterviewQuestion[];
  sessionId: string;
}

const RestoredInterviewView: React.FC<RestoredInterviewViewProps> = ({
  questions,
  sessionId,
}) => (
  <div class="interview-section">
    <div class="interview-restored-notice">
      セッションを復元しました。引き続き回答できます。
    </div>
    <h2>追加インタビュー</h2>
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
              />
            )}
            {q.type === "select" && (
              <select
                id={`answer-${String(q.id)}`}
                name={`interview_answer[${String(q.id)}]`}
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

export { app as pagesRoute };

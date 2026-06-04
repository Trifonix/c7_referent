import type { ParsedArticle } from "@/lib/parseArticle";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/owl-alpha";
const MAX_CONTENT_CHARS = 12000;

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY не задан в .env.local");
  }
  return key;
}

async function chatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "c7_referent",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(120000),
  });

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenRouter: HTTP ${response.status}`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenRouter вернул пустой ответ");
  }

  return text;
}

export async function translateArticle(article: ParsedArticle): Promise<string> {
  if (!article.title && !article.content) {
    throw new Error("Нет текста для перевода");
  }

  const title = article.title ?? "Untitled";
  const content = (article.content ?? "").slice(0, MAX_CONTENT_CHARS);
  const truncated = (article.content?.length ?? 0) > MAX_CONTENT_CHARS;

  const userPrompt = [
    `Title: ${title}`,
    article.date ? `Date: ${article.date}` : null,
    "",
    "Content:",
    content,
    truncated ? "\n[Note: article was truncated due to length limits]" : null,
  ]
    .filter(Boolean)
    .join("\n");

  return chatCompletion(
    "You are a professional translator. Translate English articles into fluent, natural Russian. " +
      "Preserve the structure: first output the translated title as a single line, then a blank line, " +
      "then the full translated article text. Do not add commentary or explanations.",
    userPrompt,
  );
}

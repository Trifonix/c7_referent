import type { ParsedArticle } from "@/lib/parseArticle";
import { getAppUrl, getOpenRouterApiKey } from "@/lib/env";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/owl-alpha";
const MAX_CONTENT_CHARS = 12000;

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

function assertArticleHasText(article: ParsedArticle): void {
  if (!article.title && !article.content) {
    throw new Error("Нет текста для обработки");
  }
}

export function buildArticlePrompt(article: ParsedArticle, extra?: string): string {
  const title = article.title ?? "Untitled";
  const content = (article.content ?? "").slice(0, MAX_CONTENT_CHARS);
  const truncated = (article.content?.length ?? 0) > MAX_CONTENT_CHARS;

  return [
    `Title: ${title}`,
    article.date ? `Date: ${article.date}` : null,
    "",
    "Content:",
    content,
    truncated ? "\n[Note: article was truncated due to length limits]" : null,
    extra,
  ]
    .filter(Boolean)
    .join("\n");
}

async function chatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenRouterApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getAppUrl(),
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

export async function summarizeArticle(article: ParsedArticle): Promise<string> {
  assertArticleHasText(article);

  return chatCompletion(
    "You are an expert editor. Based only on the provided English article, write a concise summary in Russian. " +
      "Explain what the article is about in 2–4 short paragraphs. Do not invent facts. " +
      "Do not add commentary, greetings, or meta-text — only the summary.",
    buildArticlePrompt(article),
  );
}

export async function extractTheses(article: ParsedArticle): Promise<string> {
  assertArticleHasText(article);

  return chatCompletion(
    "You are an expert analyst. Based only on the provided English article, extract the key theses in Russian. " +
      "Output a bulleted list of 5–10 concise points. Each point should capture one important idea. " +
      "Do not invent facts. Do not add commentary — only the list.",
    buildArticlePrompt(article),
  );
}

export async function generateTelegramPost(
  article: ParsedArticle,
  sourceUrl: string,
): Promise<string> {
  assertArticleHasText(article);

  return chatCompletion(
    "You are a social media editor. Based only on the provided English article, write a ready-to-publish Telegram post in Russian. " +
      "Include: a catchy headline, 2–3 short paragraphs, a link to the source at the end, and moderate use of emojis (1–3). " +
      "Do not invent facts. Do not add commentary — only the post text.",
    buildArticlePrompt(article, `\nSource URL: ${sourceUrl}`),
  );
}

export async function translateArticle(article: ParsedArticle): Promise<string> {
  assertArticleHasText(article);

  return chatCompletion(
    "You are a professional translator. Translate English articles into fluent, natural Russian. " +
      "Preserve the structure: first output the translated title as a single line, then a blank line, " +
      "then the full translated article text. Do not add commentary or explanations.",
    buildArticlePrompt(article),
  );
}

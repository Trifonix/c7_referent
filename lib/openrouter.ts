import type { ParsedArticle } from "@/lib/parseArticle";
import { getAppUrl, getOpenRouterApiKey } from "@/lib/env";
import { AppError } from "@/lib/errors";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/owl-alpha";
const MAX_CONTENT_CHARS = 12000;

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

function assertArticleHasText(article: ParsedArticle): void {
  if (!article.title && !article.content) {
    throw new AppError("ARTICLE_PARSE_FAILED");
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
  let response: Response;

  try {
    response = await fetch(OPENROUTER_URL, {
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
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new AppError("AI_TIMEOUT");
    }
    throw new AppError("AI_REQUEST_FAILED");
  }

  let data: ChatCompletionResponse;

  try {
    data = (await response.json()) as ChatCompletionResponse;
  } catch {
    throw new AppError("AI_REQUEST_FAILED");
  }

  if (!response.ok) {
    throw new AppError("AI_REQUEST_FAILED");
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AppError("AI_EMPTY_RESPONSE");
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

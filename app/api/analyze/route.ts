import { NextResponse } from "next/server";
import { fetchAndParseArticle } from "@/lib/parseArticle";
import {
  extractTheses,
  generateTelegramPost,
  summarizeArticle,
  translateArticle,
} from "@/lib/openrouter";
import { generateArticleIllustration } from "@/lib/illustration";
import { AppError, getHttpStatus } from "@/lib/errors";

type Action = "summary" | "theses" | "telegram" | "translate" | "illustration";

const AI_ACTIONS: Action[] = [
  "summary",
  "theses",
  "telegram",
  "translate",
  "illustration",
];

export const maxDuration = 300;

async function runAiAction(
  action: Action,
  article: Awaited<ReturnType<typeof fetchAndParseArticle>>,
  url: string,
) {
  switch (action) {
    case "summary":
      return { text: await summarizeArticle(article) };
    case "theses":
      return { text: await extractTheses(article) };
    case "telegram":
      return { text: await generateTelegramPost(article, url) };
    case "translate":
      return { text: await translateArticle(article) };
    case "illustration":
      return { illustration: await generateArticleIllustration(article) };
  }
}

function errorJson(code: AppError["code"], status?: number) {
  return NextResponse.json({ code }, { status: status ?? getHttpStatus(code) });
}

export async function POST(request: Request) {
  let body: { url?: string; action?: Action };

  try {
    body = await request.json();
  } catch {
    return errorJson("INVALID_JSON");
  }

  const { url, action = "summary" } = body;

  if (!url || typeof url !== "string") {
    return errorJson("URL_REQUIRED");
  }

  if (!AI_ACTIONS.includes(action)) {
    return errorJson("UNKNOWN_ACTION");
  }

  try {
    new URL(url);
  } catch {
    return errorJson("INVALID_URL");
  }

  try {
    const article = await fetchAndParseArticle(url);

    if (!article.title && !article.content) {
      return errorJson("ARTICLE_PARSE_FAILED");
    }

    const result = await runAiAction(action, article, url);

    if (action === "illustration") {
      return NextResponse.json({
        image: result.illustration!.image,
        prompt: result.illustration!.prompt,
      });
    }

    return NextResponse.json({ text: result.text! });
  } catch (err) {
    if (err instanceof AppError) {
      return errorJson(err.code);
    }
    return errorJson("UNKNOWN");
  }
}

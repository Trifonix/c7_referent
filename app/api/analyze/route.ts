import { NextResponse } from "next/server";
import { fetchAndParseArticle } from "@/lib/parseArticle";
import {
  extractTheses,
  generateTelegramPost,
  summarizeArticle,
  translateArticle,
} from "@/lib/openrouter";

type Action = "summary" | "theses" | "telegram" | "translate";

const AI_ACTIONS: Action[] = ["summary", "theses", "telegram", "translate"];

// Перевод и генерация могут занимать до ~1 мин (очередь бесплатной модели).
export const maxDuration = 300;

async function runAiAction(action: Action, article: Awaited<ReturnType<typeof fetchAndParseArticle>>, url: string) {
  switch (action) {
    case "summary":
      return summarizeArticle(article);
    case "theses":
      return extractTheses(article);
    case "telegram":
      return generateTelegramPost(article, url);
    case "translate":
      return translateArticle(article);
  }
}

export async function POST(request: Request) {
  let body: { url?: string; action?: Action };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { url, action = "summary" } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Не указан URL" }, { status: 400 });
  }

  if (!AI_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Некорректный URL" }, { status: 400 });
  }

  try {
    const article = await fetchAndParseArticle(url);

    if (!article.title && !article.content) {
      return NextResponse.json(
        { error: "Не удалось извлечь заголовок и контент статьи" },
        { status: 422 },
      );
    }

    const text = await runAiAction(action, article, url);
    return NextResponse.json({ text });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Ошибка при обработке статьи";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { fetchAndParseArticle } from "@/lib/parseArticle";
import { translateArticle } from "@/lib/openrouter";

type Action = "summary" | "theses" | "telegram" | "translate";

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

    if (action === "translate") {
      const text = await translateArticle(article);
      return NextResponse.json({ text });
    }

    return NextResponse.json(article);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Ошибка при обработке статьи";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

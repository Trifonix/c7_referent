import { NextResponse } from "next/server";
import { fetchAndParseArticle } from "@/lib/parseArticle";

export async function POST(request: Request) {
  let body: { url?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { url } = body;

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

    return NextResponse.json(article);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Ошибка при парсинге статьи";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

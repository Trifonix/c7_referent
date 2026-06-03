import { NextResponse } from "next/server";

type Action = "summary" | "theses" | "telegram";

const PLACEHOLDERS: Record<Action, (url: string) => string> = {
  summary: (url) =>
    `[Заглушка] Кратко о статье по адресу:\n${url}\n\nЗдесь будет ответ AI на запрос «О чем статья?».`,
  theses: (url) =>
    `[Заглушка] Тезисы по статье:\n${url}\n\n• Тезис 1\n• Тезис 2\n• Тезис 3\n\nПодключите парсинг и AI для реальной генерации.`,
  telegram: (url) =>
    `[Заглушка] Пост для Telegram\n\n📰 Новая статья: ${url}\n\nКраткий анонс и ссылка появятся после подключения AI.`,
};

export async function POST(request: Request) {
  let body: { url?: string; action?: Action };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { url, action } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Не указан URL" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Некорректный URL" }, { status: 400 });
  }

  if (!action || !(action in PLACEHOLDERS)) {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }

  await new Promise((r) => setTimeout(r, 600));

  return NextResponse.json({ text: PLACEHOLDERS[action](url) });
}

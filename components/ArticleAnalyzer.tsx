"use client";

import { useState } from "react";

type Action = "summary" | "theses" | "telegram";

const ACTIONS: { id: Action; label: string }[] = [
  { id: "summary", label: "О чем статья?" },
  { id: "theses", label: "Тезисы" },
  { id: "telegram", label: "Пост для Telegram" },
];

export default function ArticleAnalyzer() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: Action) {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Введите URL англоязычной статьи");
      setResult(null);
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError("Укажите корректный URL (например, https://example.com/article)");
      setResult(null);
      return;
    }

    setError(null);
    setLoading(true);
    setActiveAction(action);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, action }),
      });

      const data = (await response.json()) as { text?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось выполнить запрос");
      }

      setResult(data.text ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  const activeLabel = ACTIONS.find((a) => a.id === activeAction)?.label;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          c7_referent
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Парсинг англоязычной статьи и генерация ответа с помощью AI
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label htmlFor="article-url" className="block text-sm font-medium text-slate-700">
          URL статьи
        </label>
        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          disabled={loading}
          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
        />

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {ACTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleAction(id)}
              disabled={loading}
              className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section
        className="mt-6 min-h-[12rem] rounded-2xl border border-slate-200 bg-slate-50 p-6"
        aria-live="polite"
        aria-busy={loading}
      >
        <h2 className="text-sm font-medium text-slate-700">Результат</h2>

        {loading && (
          <div className="mt-4 flex items-center gap-3 text-slate-600">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
            <span className="text-sm">
              Генерация{activeLabel ? `: «${activeLabel}»` : ""}…
            </span>
          </div>
        )}

        {!loading && result === null && !error && (
          <p className="mt-4 text-sm text-slate-500">
            Введите URL и нажмите одну из кнопок — здесь появится ответ.
          </p>
        )}

        {!loading && result !== null && (
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {result}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";

type Action = "summary" | "theses" | "telegram" | "translate";

const LOADING_LABELS: Record<Action, string> = {
  summary: "Генерация краткого содержания",
  theses: "Выделение тезисов",
  telegram: "Создание поста",
  translate: "Перевод статьи через AI",
};

const ACTIONS: {
  id: Action;
  label: string;
  description: string;
  btn: string;
  ring: string;
  stagger: string;
}[] = [
  {
    id: "summary",
    label: "О чем статья?",
    description: "Краткое содержание",
    btn: "bg-violet-600 hover:bg-violet-500 hover:shadow-violet-500/40 focus-visible:ring-violet-400",
    ring: "ring-violet-400/60",
    stagger: "stagger-1",
  },
  {
    id: "theses",
    label: "Тезисы",
    description: "Ключевые пункты",
    btn: "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/40 focus-visible:ring-emerald-400",
    ring: "ring-emerald-400/60",
    stagger: "stagger-2",
  },
  {
    id: "telegram",
    label: "Пост для Telegram",
    description: "Готовый пост",
    btn: "bg-cyan-600 hover:bg-cyan-500 hover:shadow-cyan-500/40 focus-visible:ring-cyan-400",
    ring: "ring-cyan-400/60",
    stagger: "stagger-3",
  },
  {
    id: "translate",
    label: "Перевод",
    description: "На русский язык",
    btn: "bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-400/40 focus-visible:ring-amber-300",
    ring: "ring-amber-300/70",
    stagger: "stagger-4",
  },
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

  const activeMeta = ACTIONS.find((a) => a.id === activeAction);
  const loadingLabel = activeAction ? LOADING_LABELS[activeAction] : "Обработка";

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <header className="animate-fade-in-up mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-violet-300 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          AI Article Tool
        </div>
        <h1 className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          c7_referent
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          Парсинг англоязычной статьи и генерация ответа с помощью AI
        </p>
      </header>

      {/* Карточка ввода */}
      <div className="animate-fade-in-up stagger-1 rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-white to-indigo-50 p-6 shadow-2xl shadow-indigo-950/40 sm:p-7">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/30">
            1
          </span>
          <div>
            <label htmlFor="article-url" className="block text-sm font-semibold text-slate-900">
              URL статьи
            </label>
            <p className="text-xs text-slate-500">Вставьте ссылку на англоязычную публикацию</p>
          </div>
        </div>

        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          disabled={loading}
          className="w-full rounded-xl border-2 border-indigo-200 bg-white px-4 py-3.5 text-slate-900 shadow-inner shadow-indigo-100/50 placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {error && (
          <p
            className="animate-fade-in mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Выберите действие
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACTIONS.map(({ id, label, description, btn, ring, stagger }) => {
              const isActive = loading && activeAction === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleAction(id)}
                  disabled={loading}
                  className={`animate-fade-in-up ${stagger} group relative overflow-hidden rounded-xl px-4 py-3.5 text-left font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${btn} ${isActive ? `ring-2 ${ring}` : ""}`}
                >
                  <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="animate-shimmer absolute inset-0" />
                  </span>
                  <span className="relative block text-sm font-semibold">{label}</span>
                  <span
                    className={`relative mt-0.5 block text-xs ${id === "translate" ? "text-slate-800/70" : "text-white/75"}`}
                  >
                    {description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Блок результата */}
      <section
        className="animate-fade-in-up stagger-3 mt-6 overflow-hidden rounded-2xl border border-teal-500/25 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-6 shadow-2xl shadow-black/50 sm:p-7"
        aria-live="polite"
        aria-busy={loading}
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/30">
            2
          </span>
          <div>
            <h2 className="text-sm font-semibold text-teal-300">Результат</h2>
            <p className="text-xs text-slate-500">Ответ появится здесь после обработки</p>
          </div>
        </div>

        {loading && (
          <div className="animate-fade-in mt-2 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-10 w-10 shrink-0">
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-400" />
                <span className="absolute inset-2 animate-spin rounded-full border-2 border-violet-400/20 border-b-violet-400 [animation-direction:reverse] [animation-duration:1.5s]" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{loadingLabel}</p>
                <p className="text-xs text-slate-500">
                  {activeMeta?.label ?? "Обработка"} — это может занять до минуты
                </p>
                <div className="mt-2 flex gap-1.5">
                  <span className="loading-dot h-1.5 w-1.5 rounded-full bg-teal-400" />
                  <span className="loading-dot h-1.5 w-1.5 rounded-full bg-teal-400" />
                  <span className="loading-dot h-1.5 w-1.5 rounded-full bg-teal-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && result === null && !error && (
          <div className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/40 px-5 py-10 text-center">
            <p className="text-sm text-slate-500">
              Введите URL и нажмите одну из кнопок
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Краткое содержание, тезисы, пост или перевод
            </p>
          </div>
        )}

        {!loading && result !== null && (
          <div className="animate-fade-in mt-2 max-h-[32rem] overflow-y-auto rounded-xl border border-teal-500/20 bg-slate-950/60 p-5 text-sm leading-relaxed text-slate-200 shadow-inner">
            {result}
          </div>
        )}
      </section>
    </div>
  );
}

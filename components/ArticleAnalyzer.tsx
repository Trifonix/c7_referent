"use client";

import { Check, Copy, Download, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { type ErrorCode, isErrorCode } from "@/lib/errors";
import { cn } from "@/lib/utils";

type Action = "summary" | "theses" | "telegram" | "translate" | "illustration";

type AppResult =
  | { type: "text"; content: string }
  | { type: "image"; imageUrl: string; prompt: string };

const PROCESS_STEPS: Record<Action, string[]> = {
  summary: [
    "Загружаю статью…",
    "Извлекаю заголовок и текст…",
    "Генерирую краткое содержание…",
  ],
  theses: [
    "Загружаю статью…",
    "Извлекаю заголовок и текст…",
    "Выделяю ключевые тезисы…",
  ],
  telegram: [
    "Загружаю статью…",
    "Извлекаю заголовок и текст…",
    "Создаю пост для Telegram…",
  ],
  translate: [
    "Загружаю статью…",
    "Извлекаю заголовок и текст…",
    "Перевожу статью на русский…",
  ],
  illustration: [
    "Загружаю статью…",
    "Создаю промпт для изображения…",
    "Генерирую иллюстрацию…",
  ],
};

const ACTIONS: {
  id: Action;
  label: string;
  description: string;
  title: string;
  btn: string;
  ring: string;
  stagger: string;
}[] = [
  {
    id: "summary",
    label: "О чем статья?",
    description: "Краткое содержание",
    title: "AI составит краткое содержание статьи на русском языке",
    btn: "bg-violet-600 hover:bg-violet-500 hover:shadow-violet-500/40 focus-visible:ring-violet-400",
    ring: "ring-violet-400/60",
    stagger: "stagger-1",
  },
  {
    id: "theses",
    label: "Тезисы",
    description: "Ключевые пункты",
    title: "AI выделит ключевые тезисы статьи в виде списка на русском",
    btn: "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/40 focus-visible:ring-emerald-400",
    ring: "ring-emerald-400/60",
    stagger: "stagger-2",
  },
  {
    id: "telegram",
    label: "Пост для Telegram",
    description: "Готовый пост",
    title: "AI подготовит готовый пост для Telegram-канала со ссылкой на источник",
    btn: "bg-cyan-600 hover:bg-cyan-500 hover:shadow-cyan-500/40 focus-visible:ring-cyan-400",
    ring: "ring-cyan-400/60",
    stagger: "stagger-3",
  },
  {
    id: "translate",
    label: "Перевод",
    description: "На русский язык",
    title: "AI переведёт заголовок и текст статьи на русский язык",
    btn: "bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-400/40 focus-visible:ring-amber-300",
    ring: "ring-amber-300/70",
    stagger: "stagger-4",
  },
  {
    id: "illustration",
    label: "Иллюстрация",
    description: "Изображение по теме",
    title: "AI создаст промпт по статье и сгенерирует иллюстрацию через Hugging Face",
    btn: "bg-rose-600 hover:bg-rose-500 hover:shadow-rose-500/40 focus-visible:ring-rose-400",
    ring: "ring-rose-400/60",
    stagger: "stagger-5",
  },
];

const secondaryBtnClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function ArticleAnalyzer() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AppResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [processStatus, setProcessStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading || !activeAction) {
      setProcessStatus(null);
      return;
    }

    const steps = PROCESS_STEPS[activeAction];
    let stepIndex = 0;
    setProcessStatus(steps[0]);

    const interval = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setProcessStatus(steps[stepIndex]);
    }, 2500);

    return () => clearInterval(interval);
  }, [loading, activeAction]);

  useEffect(() => {
    if (result && !loading) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result, loading]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  function handleClear() {
    setUrl("");
    setResult(null);
    setError(null);
    setLoading(false);
    setActiveAction(null);
    setProcessStatus(null);
    setCopied(false);
  }

  async function handleCopy() {
    if (!result) return;
    const text = result.type === "text" ? result.content : result.prompt;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError("UNKNOWN");
    }
  }

  function handleDownloadImage() {
    if (!result || result.type !== "image") return;
    const link = document.createElement("a");
    link.href = result.imageUrl;
    link.download = "illustration.png";
    link.click();
  }

  async function handleAction(action: Action) {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("URL_REQUIRED");
      setResult(null);
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError("INVALID_URL");
      setResult(null);
      return;
    }

    setError(null);
    setLoading(true);
    setActiveAction(action);
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, action }),
      });

      const data = (await response.json()) as {
        text?: string;
        image?: string;
        prompt?: string;
        code?: string;
      };

      if (!response.ok) {
        setError(isErrorCode(data.code) ? data.code : "UNKNOWN");
        return;
      }

      if (data.image) {
        setResult({
          type: "image",
          imageUrl: data.image,
          prompt: data.prompt ?? "",
        });
      } else {
        setResult({ type: "text", content: data.text ?? "" });
      }
    } catch {
      setError("NETWORK_ERROR");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  const activeMeta = ACTIONS.find((a) => a.id === activeAction);
  const hasContent = Boolean(url || result || error || loading);

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-3xl overflow-x-hidden">
      <header className="animate-fade-in-up mb-8 text-center sm:mb-10">
        <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-violet-300 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          AI Article Tool
        </div>
        <h1 className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text px-4 text-2xl font-bold tracking-tight text-transparent sm:text-3xl lg:text-4xl">
          c7_referent
        </h1>
        <p className="mx-auto mt-3 max-w-md px-4 text-sm leading-relaxed text-slate-400">
          Парсинг англоязычной статьи и генерация ответа с помощью AI
        </p>
      </header>

      {/* Карточка ввода */}
      <div className="animate-fade-in-up stagger-1 rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-white to-indigo-50 p-4 shadow-2xl shadow-indigo-950/40 sm:p-6 lg:p-7">
        <div className="mb-4 flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/30">
            1
          </span>
          <label htmlFor="article-url" className="min-w-0 text-sm font-semibold text-slate-900">
            URL статьи
          </label>
        </div>

        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Введите URL статьи, например: https://example.com/article"
          disabled={loading}
          className="w-full min-w-0 rounded-xl border-2 border-indigo-200 bg-white px-4 py-3 text-base text-slate-900 shadow-inner shadow-indigo-100/50 placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5 sm:text-sm"
        />
        <p className="mt-2 break-words text-xs text-slate-500">
          Укажите ссылку на англоязычную статью
        </p>

        {error && <ErrorAlert code={error} className="mt-3" />}

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Выберите действие
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap xl:flex-nowrap">
            {ACTIONS.map(({ id, label, description, title, btn, ring, stagger }) => {
              const isActive = loading && activeAction === id;

              return (
                <button
                  key={id}
                  type="button"
                  title={title}
                  onClick={() => handleAction(id)}
                  disabled={loading}
                  className={cn(
                    "animate-fade-in-up group relative min-w-0 flex-1 overflow-hidden rounded-xl px-4 py-3.5 text-left font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:min-w-[calc(50%-0.375rem)] xl:min-w-0",
                    stagger,
                    btn,
                    isActive && `ring-2 ${ring}`,
                  )}
                >
                  <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="animate-shimmer absolute inset-0" />
                  </span>
                  <span className="relative block break-words text-sm font-semibold">{label}</span>
                  <span
                    className={cn(
                      "relative mt-0.5 block break-words text-xs",
                      id === "translate" ? "text-slate-800/70" : "text-white/75",
                    )}
                  >
                    {description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || !hasContent}
            className={cn(
              secondaryBtnClass,
              "w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400 sm:w-auto",
            )}
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
            Очистить
          </button>
        </div>
      </div>

      {/* Блок текущего процесса */}
      {loading && processStatus && (
        <div
          className="animate-fade-in mt-4 flex min-w-0 items-start gap-3 rounded-xl border border-violet-500/30 bg-violet-950/40 px-4 py-3 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <span className="mt-0.5 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-medium text-violet-200">{processStatus}</p>
            {activeMeta && (
              <p className="mt-0.5 break-words text-xs text-slate-500">
                {activeMeta.label} — это может занять до минуты
              </p>
            )}
          </div>
        </div>
      )}

      {/* Блок результата */}
      <section
        ref={resultRef}
        className="animate-fade-in-up stagger-3 mt-6 scroll-mt-6 overflow-hidden rounded-2xl border border-teal-500/25 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-4 shadow-2xl shadow-black/50 sm:scroll-mt-8 sm:p-6 lg:p-7"
        aria-live="polite"
        aria-busy={loading}
      >
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/30">
              2
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-teal-300">Результат</h2>
              <p className="break-words text-xs text-slate-500">
                Ответ появится здесь после обработки
              </p>
            </div>
          </div>

          {!loading && result !== null && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  secondaryBtnClass,
                  "w-full shrink-0 border-teal-500/40 bg-teal-950/60 text-teal-200 hover:bg-teal-900/60 focus-visible:ring-teal-400 focus-visible:ring-offset-slate-900 sm:w-auto",
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" aria-hidden />
                    {result.type === "image" ? "Копировать промпт" : "Копировать"}
                  </>
                )}
              </button>
              {result.type === "image" && (
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className={cn(
                    secondaryBtnClass,
                    "w-full shrink-0 border-teal-500/40 bg-teal-950/60 text-teal-200 hover:bg-teal-900/60 focus-visible:ring-teal-400 focus-visible:ring-offset-slate-900 sm:w-auto",
                  )}
                >
                  <Download className="h-4 w-4 shrink-0" aria-hidden />
                  Скачать
                </button>
              )}
            </div>
          )}
        </div>

        {!loading && result === null && !error && (
          <div className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/40 px-4 py-10 text-center sm:px-5">
            <p className="break-words text-sm text-slate-500">
              Введите URL и нажмите одну из кнопок
            </p>
            <p className="mt-1 break-words text-xs text-slate-600">
              Краткое содержание, тезисы, пост, перевод или иллюстрация
            </p>
          </div>
        )}

        {!loading && result !== null && result.type === "text" && (
          <div className="animate-fade-in mt-2 max-h-[32rem] overflow-y-auto overflow-x-hidden rounded-xl border border-teal-500/20 bg-slate-950/60 p-4 text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-200 shadow-inner sm:p-5">
            {result.content}
          </div>
        )}

        {!loading && result !== null && result.type === "image" && (
          <div className="animate-fade-in mt-2 space-y-3">
            <div className="overflow-hidden rounded-xl border border-teal-500/20 bg-slate-950/60 p-3 shadow-inner sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.imageUrl}
                alt="Сгенерированная иллюстрация по теме статьи"
                className="mx-auto max-h-[32rem] w-full rounded-lg object-contain"
              />
            </div>
            {result.prompt && (
              <p className="break-words px-1 text-xs leading-relaxed text-slate-500">
                <span className="font-medium text-slate-400">Промпт: </span>
                {result.prompt}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { AppError } from "@/lib/errors";

export type ParsedArticle = {
  date: string | null;
  title: string | null;
  content: string | null;
};

const CONTENT_SELECTORS = [
  "article",
  '[role="article"]',
  "main article",
  ".post-content",
  ".entry-content",
  ".article-content",
  ".article-body",
  ".post-body",
  ".content-body",
  ".story-body",
  ".post",
  ".content",
  "main",
];

const NOISE_SELECTORS =
  "script, style, noscript, nav, aside, footer, header, .sidebar, .comments, .advertisement, .ad, [role='navigation'], [role='banner'], [role='complementary']";

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractTitle($: CheerioAPI): string | null {
  const metaTitle =
    $('meta[property="og:title"]').attr("content") ??
    $('meta[name="twitter:title"]').attr("content") ??
    $('meta[name="title"]').attr("content");

  if (metaTitle?.trim()) {
    return normalizeText(metaTitle);
  }

  const articleH1 = $("article h1").first().text();
  if (articleH1?.trim()) {
    return normalizeText(articleH1);
  }

  const h1 = $("h1").first().text();
  if (h1?.trim()) {
    return normalizeText(h1);
  }

  const docTitle = $("title").first().text();
  return docTitle?.trim() ? normalizeText(docTitle) : null;
}

function extractDate($: CheerioAPI): string | null {
  const metaDate =
    $('meta[property="article:published_time"]').attr("content") ??
    $('meta[property="og:article:published_time"]').attr("content") ??
    $('meta[name="article:published_time"]').attr("content") ??
    $('meta[name="pubdate"]').attr("content") ??
    $('meta[name="date"]').attr("content") ??
    $('meta[itemprop="datePublished"]').attr("content");

  if (metaDate?.trim()) {
    return metaDate.trim();
  }

  const timeDatetime = $("time[datetime]").first().attr("datetime");
  if (timeDatetime?.trim()) {
    return timeDatetime.trim();
  }

  const itempropDate = $('[itemprop="datePublished"]').first().attr("datetime") ??
    $('[itemprop="datePublished"]').first().text();
  if (itempropDate?.trim()) {
    return normalizeText(itempropDate);
  }

  for (const selector of [".published", ".post-date", ".entry-date", ".article-date", ".date"]) {
    const text = $(selector).first().text();
    if (text?.trim()) {
      return normalizeText(text);
    }
  }

  return null;
}

function extractTextFromSelection($el: ReturnType<CheerioAPI>): string {
  const clone = $el.clone();
  clone.find(NOISE_SELECTORS).remove();
  return normalizeText(clone.text());
}

function extractContent($: CheerioAPI): string | null {
  let bestText: string | null = null;
  let bestLen = 0;

  for (const selector of CONTENT_SELECTORS) {
    $(selector).each((_, el) => {
      const text = extractTextFromSelection($(el));
      if (text.length < 100) return;
      if (text.length > bestLen) {
        bestText = text;
        bestLen = text.length;
      }
    });
    if (bestLen >= 500) break;
  }

  if (bestText) {
    return bestText;
  }

  const body = $("body");
  if (body.length === 0) return null;

  const bodyText = extractTextFromSelection(body);
  return bodyText.length > 0 ? bodyText.slice(0, 15000) : null;
}

export async function fetchAndParseArticle(url: string): Promise<ParsedArticle> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new AppError("ARTICLE_FETCH_FAILED");
  }

  if (!response.ok) {
    throw new AppError("ARTICLE_FETCH_FAILED");
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  return {
    date: extractDate($),
    title: extractTitle($),
    content: extractContent($),
  };
}

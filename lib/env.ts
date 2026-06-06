function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getOpenRouterApiKey(): string {
  const key = normalizeEnvValue(
    process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY,
  );

  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY не задан. Локально добавьте его в .env.local. " +
        "На Vercel: Settings → Environment Variables → имя OPENROUTER_API_KEY, " +
        "окружения Production / Preview / Development, затем Redeploy.",
    );
  }

  return key;
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

import { AppError } from "@/lib/errors";

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
    throw new AppError("AI_CONFIG_MISSING");
  }

  return key;
}

export function getHuggingFaceApiKey(): string {
  const key = normalizeEnvValue(
    process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN,
  );

  if (!key) {
    throw new AppError("IMAGE_CONFIG_MISSING");
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

export function getHuggingFaceModel(): string {
  return (
    normalizeEnvValue(process.env.HUGGINGFACE_MODEL) ??
    "black-forest-labs/FLUX.1-schnell"
  );
}

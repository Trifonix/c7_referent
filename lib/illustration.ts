import type { ParsedArticle } from "@/lib/parseArticle";
import { generateImage } from "@/lib/huggingface";
import { generateImagePrompt } from "@/lib/openrouter";

export type IllustrationResult = {
  image: string;
  prompt: string;
};

export async function generateArticleIllustration(
  article: ParsedArticle,
): Promise<IllustrationResult> {
  const prompt = await generateImagePrompt(article);
  const { dataUrl } = await generateImage(prompt);
  return { image: dataUrl, prompt };
}

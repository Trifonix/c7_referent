import {
  InferenceClient,
  InferenceClientProviderApiError,
} from "@huggingface/inference";
import { getHuggingFaceApiKey, getHuggingFaceModel } from "@/lib/env";
import { AppError } from "@/lib/errors";

export async function generateImage(
  prompt: string,
): Promise<{ dataUrl: string; mimeType: string }> {
  const client = new InferenceClient(getHuggingFaceApiKey());

  try {
    const result = await client.textToImage(
      {
        model: getHuggingFaceModel(),
        inputs: prompt,
      },
      {
        outputType: "dataUrl",
      },
    );

    if (typeof result !== "string" || !result.startsWith("data:image/")) {
      throw new AppError("IMAGE_GENERATION_FAILED");
    }

    const mimeMatch = result.match(/^data:(image\/[^;]+);/);
    return {
      dataUrl: result,
      mimeType: mimeMatch?.[1] ?? "image/png",
    };
  } catch (err) {
    if (err instanceof AppError) throw err;

    if (err instanceof InferenceClientProviderApiError) {
      const status = err.httpResponse?.status;
      const body =
        typeof err.httpResponse?.body === "string"
          ? err.httpResponse.body.toLowerCase()
          : "";

      if (status === 503 || body.includes("loading")) {
        throw new AppError("IMAGE_MODEL_LOADING");
      }
    }

    if (err instanceof Error && err.name === "TimeoutError") {
      throw new AppError("IMAGE_TIMEOUT");
    }

    throw new AppError("IMAGE_GENERATION_FAILED");
  }
}

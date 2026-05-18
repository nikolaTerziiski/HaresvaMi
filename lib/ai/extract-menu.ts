import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildMenuExtractionPrompt } from "./prompts";
import {
  insertAiUsageEvent,
  readGeminiTokenUsage,
  type TokenUsage,
} from "@/lib/ai/usage-logging";

const MENU_MODEL = "gemini-2.5-flash";

export interface ExtractedMenuItem {
  name_bg: string;
  category: string | null;
  price: number | null;
  description_bg: string | null;
}

export interface MenuExtractionResult {
  items: ExtractedMenuItem[];
  error?: string;
}

export async function extractMenu(
  mimeType: string,
  base64Data: string,
  restaurantId: string,
): Promise<MenuExtractionResult> {
  const apiKey =
    process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MENU_MODEL });

  const prompt = buildMenuExtractionPrompt();

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    const usage: TokenUsage = readGeminiTokenUsage(
      result.response.usageMetadata as Parameters<
        typeof readGeminiTokenUsage
      >[0],
    );

    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const parsed = JSON.parse(cleanedText) as MenuExtractionResult;

    await insertAiUsageEvent({
      restaurantId,
      eventType: "menu_extraction",
      model: MENU_MODEL,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      success: !parsed.error,
      failureReason: parsed.error ?? null,
    }).catch((logError) => {
      console.error("Failed to log AI usage event:", logError);
    });

    if (parsed.error) {
      return { items: [], error: parsed.error };
    }

    return { items: parsed.items || [] };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to parse menu from image";

    await insertAiUsageEvent({
      restaurantId,
      eventType: "menu_extraction",
      model: MENU_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      success: false,
      failureReason: message.slice(0, 500),
    }).catch((logError) => {
      console.error("Failed to log AI usage event:", logError);
    });

    console.error("Error extracting menu:", error);
    return { items: [], error: "Failed to parse menu from image" };
  }
}

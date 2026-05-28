import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildMenuExtractionPrompt, buildMultiFileMenuPrompt } from "./prompts";
import {
  insertAiUsageEvent,
  readGeminiTokenUsage,
  type TokenUsage,
} from "@/lib/ai/usage-logging";
import {
  RawResponseSchema,
  processRawItems,
} from "@/lib/ai/menu-import-internal";
import type { MenuImportResult } from "@/lib/menu/import-types";

const MENU_MODEL = "gemini-2.5-flash-lite";

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

// ---------------------------------------------------------------------------
// Multi-file extraction (Phase 1+)
// ---------------------------------------------------------------------------

export async function extractMenuFromFiles(input: {
  files: { mimeType: string; base64Data: string; fileName: string }[];
  restaurantId: string;
  existingItems: { id: string; name_bg: string }[];
}): Promise<MenuImportResult> {
  const { files, restaurantId, existingItems } = input;

  const apiKey =
    process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MENU_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const fileNames = files.map((f) => f.fileName);
  const prompt = buildMultiFileMenuPrompt(fileNames);

  const fileParts = files.map((f) => ({
    inlineData: {
      mimeType: f.mimeType,
      data: f.base64Data,
    },
  }));

  // Throws on Gemini API failure — caller (route) catches and returns 502.
  const geminiResult = await model.generateContent([prompt, ...fileParts]);

  const responseText = geminiResult.response.text();
  const usage: TokenUsage = readGeminiTokenUsage(
    geminiResult.response.usageMetadata as Parameters<
      typeof readGeminiTokenUsage
    >[0],
  );

  // Parse and validate — salvage partial results on schema errors
  const warnings: string[] = [];
  let rawItems: import("@/lib/ai/menu-import-internal").RawItem[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    // Try stripping markdown fences that slipped through
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    parsed = JSON.parse(cleaned); // throws if still invalid → route gets 502
  }

  const validated = RawResponseSchema.safeParse(parsed);
  if (validated.success) {
    rawItems = validated.data.items;
  } else {
    // Try to salvage item-level: parse as any[] and filter valid ones
    const rawAny = (parsed as { items?: unknown[] })?.items;
    if (Array.isArray(rawAny)) {
      for (const candidate of rawAny) {
        const itemResult =
          RawResponseSchema.shape.items.element.safeParse(candidate);
        if (itemResult.success) {
          rawItems.push(itemResult.data);
        } else {
          warnings.push(`Пропуснат невалиден запис от AI отговора.`);
        }
      }
    } else {
      warnings.push("AI отговорът не съдържа списък с ястия.");
    }
  }

  const result = processRawItems({
    rawItems,
    existingItems,
    totalFiles: files.length,
    warnings,
  });

  // Log usage ONCE, best-effort
  await insertAiUsageEvent({
    restaurantId,
    eventType: "menu_extraction",
    model: MENU_MODEL,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    success: true,
  }).catch((logError) => {
    console.error("Failed to log AI usage event:", logError);
  });

  return result;
}

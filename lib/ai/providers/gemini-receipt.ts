import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

import {
  readGeminiTokenUsage,
  type TokenUsage,
} from "@/lib/ai/usage-logging";

export const PRIMARY_RECEIPT_MODEL = "gemini-2.5-flash-lite";
export const RETRY_RECEIPT_MODEL = "gemini-2.5-flash";

export type ExtractedReceiptItem = {
  raw_text: string;
  menu_item_id: string | null;
  menu_item_name: string | null;
  quantity: number;
  matched_via: "alias" | "fuzzy_match" | "unknown";
};

export type ReceiptExtraction = {
  confidence: number;
  items: ExtractedReceiptItem[];
  error?: string;
};

export type GeminiReceiptResult =
  | {
      ok: true;
      extraction: ReceiptExtraction;
      usage: TokenUsage;
      model: string;
    }
  | {
      ok: false;
      error: string;
      usage: TokenUsage;
      model: string;
    };

function cleanJsonResponse(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("```json")) {
    return trimmed.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  }

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  return trimmed;
}

function parseReceiptExtraction(text: string): ReceiptExtraction {
  const parsed = JSON.parse(
    cleanJsonResponse(text),
  ) as Partial<ReceiptExtraction>;

  return {
    confidence:
      typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0,
    items: Array.isArray(parsed.items) ? parsed.items : [],
    error: parsed.error,
  };
}

export async function callGeminiForReceipt(input: {
  model: string;
  prompt: string;
  imageBuffer: Buffer;
  mimeType: string;
}): Promise<GeminiReceiptResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error: "missing_gemini_api_key",
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      model: input.model,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: input.model });
    const result = await model.generateContent([
      input.prompt,
      {
        inlineData: {
          data: input.imageBuffer.toString("base64"),
          mimeType: input.mimeType,
        },
      },
    ]);
    const usage = readGeminiTokenUsage(result.response.usageMetadata);
    const extraction = parseReceiptExtraction(result.response.text());

    if (extraction.error) {
      return {
        ok: false,
        error: extraction.error,
        usage,
        model: input.model,
      };
    }

    return {
      ok: true,
      extraction,
      usage,
      model: input.model,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "gemini_failed",
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      model: input.model,
    };
  }
}

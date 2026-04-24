import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import {
  consumeAiScanCredit,
  canScanReceipt,
  type EntitlementResult,
} from "@/lib/billing/entitlements";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { buildReceiptExtractionPrompt } from "@/lib/ai/prompts";
import {
  insertAiUsageEvent,
  readGeminiTokenUsage,
  type TokenUsage,
} from "@/lib/ai/usage-logging";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const PRIMARY_RECEIPT_MODEL = "gemini-2.5-flash-lite";
const RETRY_RECEIPT_MODEL = "gemini-2.5-flash";
const LOW_CONFIDENCE_THRESHOLD = 0.65;
const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 20;

type ReceiptPayload = {
  restaurantId: string | null;
  imagePath: string | null;
  imageBuffer: Buffer | null;
  mimeType: string | null;
};

type ExtractedReceiptItem = {
  raw_text: string;
  menu_item_id: string | null;
  menu_item_name: string | null;
  quantity: number;
  matched_via: "alias" | "fuzzy_match" | "unknown";
};

type ReceiptExtraction = {
  confidence: number;
  items: ExtractedReceiptItem[];
  error?: string;
};

type GeminiReceiptResult =
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

function entitlementResponse(entitlement: EntitlementResult) {
  return {
    reason: entitlement.reason,
    used: entitlement.used,
    limit: entitlement.limit,
    remaining: entitlement.remaining,
    upgradeTarget: entitlement.upgradeTarget,
  };
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function decodeBase64Image(value: string) {
  const match = value.match(/^data:[^;]+;base64,(.*)$/);
  return Buffer.from(match?.[1] ?? value, "base64");
}

function extractClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function getReceiptRateLimitPerMinute() {
  const value = Number(process.env.EXTRACT_RECEIPT_RATE_LIMIT_PER_MINUTE);

  return Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : DEFAULT_RATE_LIMIT_PER_MINUTE;
}

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

async function readPayload(request: NextRequest): Promise<ReceiptPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    return {
      restaurantId: stringValue(formData.get("restaurant_id")),
      imagePath: stringValue(formData.get("image_path")),
      imageBuffer:
        file instanceof File ? Buffer.from(await file.arrayBuffer()) : null,
      mimeType:
        file instanceof File
          ? file.type || stringValue(formData.get("mime_type"))
          : stringValue(formData.get("mime_type")),
    };
  }

  const body = (await request.json().catch(() => ({}))) as {
    restaurant_id?: string;
    restaurantId?: string;
    image_path?: string;
    imagePath?: string;
    image_base64?: string;
    imageBase64?: string;
    mime_type?: string;
    mimeType?: string;
  };

  const imageBase64 = body.image_base64 ?? body.imageBase64;

  return {
    restaurantId: body.restaurant_id ?? body.restaurantId ?? null,
    imagePath: body.image_path ?? body.imagePath ?? null,
    imageBuffer: imageBase64 ? decodeBase64Image(imageBase64) : null,
    mimeType: body.mime_type ?? body.mimeType ?? null,
  };
}

async function loadReceiptImage(payload: ReceiptPayload) {
  if (payload.imageBuffer) {
    return {
      buffer: payload.imageBuffer,
      mimeType: payload.mimeType ?? "image/jpeg",
    };
  }

  if (!payload.imagePath) {
    throw new Error("No receipt image provided.");
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.storage
    .from("receipt-images")
    .download(payload.imagePath);

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to load receipt image.");
  }

  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    mimeType: data.type || payload.mimeType || "image/jpeg",
  };
}

async function readReceiptContext(restaurantId: string) {
  const supabase = createSupabaseServiceClient();
  const [menuResult, aliasesResult] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, name_bg")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .is("deleted_at", null),
    supabase
      .from("receipt_aliases")
      .select("alias, menu_item_id")
      .eq("restaurant_id", restaurantId),
  ]);

  if (menuResult.error) {
    throw new Error(`Unable to read menu items: ${menuResult.error.message}`);
  }

  if (aliasesResult.error) {
    throw new Error(`Unable to read receipt aliases: ${aliasesResult.error.message}`);
  }

  return {
    menu: menuResult.data ?? [],
    aliases: aliasesResult.data ?? [],
  };
}

function parseReceiptExtraction(text: string): ReceiptExtraction {
  const parsed = JSON.parse(cleanJsonResponse(text)) as Partial<ReceiptExtraction>;

  return {
    confidence:
      typeof parsed.confidence === "number" &&
      Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0,
    items: Array.isArray(parsed.items) ? parsed.items : [],
    error: parsed.error,
  };
}

async function callGeminiForReceipt(input: {
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

async function logReceiptScan(input: {
  restaurantId: string;
  eventType: "receipt_scan_attempt" | "receipt_scan_success" | "receipt_scan_failed";
  model: string;
  usage?: TokenUsage;
  success: boolean;
  failureReason?: string | null;
}) {
  const usage = input.usage ?? {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  };

  await insertAiUsageEvent({
    restaurantId: input.restaurantId,
    eventType: input.eventType,
    model: input.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    success: input.success,
    failureReason: input.failureReason ?? null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await readPayload(request);

    if (!payload.restaurantId) {
      return NextResponse.json(
        { error: "restaurant_id is required" },
        { status: 400 },
      );
    }

    const rateLimit = checkRateLimit({
      key: `extract-receipt:${payload.restaurantId}:${extractClientIp(request)}`,
      limit: getReceiptRateLimitPerMinute(),
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      );

      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        },
      );
    }

    const entitlement = await canScanReceipt(payload.restaurantId);

    if (!entitlement.allowed) {
      return NextResponse.json(entitlementResponse(entitlement), {
        status: 402,
      });
    }

    const [{ buffer, mimeType }, context] = await Promise.all([
      loadReceiptImage(payload),
      readReceiptContext(payload.restaurantId),
    ]);

    if (context.menu.length === 0) {
      return NextResponse.json(
        { error: "no_menu_items_configured" },
        { status: 422 },
      );
    }

    const prompt = buildReceiptExtractionPrompt(context.menu, context.aliases);

    await logReceiptScan({
      restaurantId: payload.restaurantId,
      eventType: "receipt_scan_attempt",
      model: PRIMARY_RECEIPT_MODEL,
      success: true,
    });

    let result = await callGeminiForReceipt({
      model: PRIMARY_RECEIPT_MODEL,
      prompt,
      imageBuffer: buffer,
      mimeType,
    });
    let retryCount = 0;

    if (
      result.ok &&
      result.extraction.confidence < LOW_CONFIDENCE_THRESHOLD
    ) {
      retryCount = 1;
      await logReceiptScan({
        restaurantId: payload.restaurantId,
        eventType: "receipt_scan_failed",
        model: result.model,
        usage: result.usage,
        success: false,
        failureReason: `low_confidence; retry_count=${retryCount}; retry_model=${RETRY_RECEIPT_MODEL}; confidence=${result.extraction.confidence}`,
      });

      result = await callGeminiForReceipt({
        model: RETRY_RECEIPT_MODEL,
        prompt,
        imageBuffer: buffer,
        mimeType,
      });
    }

    if (!result.ok) {
      await logReceiptScan({
        restaurantId: payload.restaurantId,
        eventType: "receipt_scan_failed",
        model: result.model,
        usage: result.usage,
        success: false,
        failureReason:
          retryCount > 0
            ? `${result.error}; retry_count=${retryCount}; model_used=${result.model}`
            : result.error,
      });

      return NextResponse.json(
        {
          error: result.error,
          retryCount,
          model: result.model,
        },
        { status: 422 },
      );
    }

    const consumed = await consumeAiScanCredit(payload.restaurantId);

    if (!consumed.allowed) {
      return NextResponse.json(entitlementResponse(consumed), {
        status: 402,
      });
    }

    await logReceiptScan({
      restaurantId: payload.restaurantId,
      eventType: "receipt_scan_success",
      model: result.model,
      usage: result.usage,
      success: true,
      failureReason:
        retryCount > 0
          ? `retry_count=${retryCount}; model_used=${result.model}`
          : null,
    });

    return NextResponse.json({
      items: result.extraction.items,
      confidence: result.extraction.confidence,
      model: result.model,
      retryCount,
      usage: {
        used: consumed.used,
        limit: consumed.limit,
        remaining: consumed.remaining,
      },
    });
  } catch (error) {
    console.error("API Error in /extract-receipt:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

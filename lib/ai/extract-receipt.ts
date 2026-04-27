import "server-only";

import {
  canScanReceipt,
  consumeAiScanCredit,
  type EntitlementResult,
} from "@/lib/billing/entitlements";
import { buildReceiptExtractionPrompt } from "@/lib/ai/prompts/receipt-extraction";
import {
  callGeminiForReceipt,
  PRIMARY_RECEIPT_MODEL,
  RETRY_RECEIPT_MODEL,
} from "@/lib/ai/providers/gemini-receipt";
import { insertAiUsageEvent, type TokenUsage } from "@/lib/ai/usage-logging";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const LOW_CONFIDENCE_THRESHOLD = 0.65;

export type ReceiptExtractionPayload = {
  restaurantId: string;
  imagePath: string | null;
  imageBuffer: Buffer | null;
  mimeType: string | null;
};

export type ReceiptExtractionApiResult = {
  status: number;
  body: Record<string, unknown>;
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

async function loadReceiptImage(payload: ReceiptExtractionPayload) {
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
    throw new Error(
      `Unable to read receipt aliases: ${aliasesResult.error.message}`,
    );
  }

  return {
    menu: menuResult.data ?? [],
    aliases: aliasesResult.data ?? [],
  };
}

async function logReceiptScan(input: {
  restaurantId: string;
  eventType:
    | "receipt_scan_attempt"
    | "receipt_scan_success"
    | "receipt_scan_failed";
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

export async function extractReceipt(
  payload: ReceiptExtractionPayload,
): Promise<ReceiptExtractionApiResult> {
  const entitlement = await canScanReceipt(payload.restaurantId);

  if (!entitlement.allowed) {
    return {
      status: 402,
      body: entitlementResponse(entitlement),
    };
  }

  const [{ buffer, mimeType }, context] = await Promise.all([
    loadReceiptImage(payload),
    readReceiptContext(payload.restaurantId),
  ]);

  if (context.menu.length === 0) {
    return {
      status: 422,
      body: { error: "no_menu_items_configured" },
    };
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

  if (result.ok && result.extraction.confidence < LOW_CONFIDENCE_THRESHOLD) {
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

    return {
      status: 422,
      body: {
        error: result.error,
        retryCount,
        model: result.model,
      },
    };
  }

  const consumed = await consumeAiScanCredit(payload.restaurantId);

  if (!consumed.allowed) {
    return {
      status: 402,
      body: entitlementResponse(consumed),
    };
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

  return {
    status: 200,
    body: {
      items: result.extraction.items,
      confidence: result.extraction.confidence,
      model: result.model,
      retryCount,
      usage: {
        used: consumed.used,
        limit: consumed.limit,
        remaining: consumed.remaining,
      },
    },
  };
}

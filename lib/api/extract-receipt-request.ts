import { NextRequest } from "next/server";

import { checkRateLimit, type RateLimitResult } from "@/lib/api/rate-limit";
import type { ReceiptExtractionPayload } from "@/lib/ai/extract-receipt";

const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 20;

export type ParsedReceiptExtractionRequest = Omit<
  ReceiptExtractionPayload,
  "restaurantId"
> & {
  restaurantId: string | null;
};

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

export async function readReceiptExtractionRequest(
  request: NextRequest,
): Promise<ParsedReceiptExtractionRequest> {
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

export function checkReceiptExtractionRateLimit(
  request: NextRequest,
  restaurantId: string,
): RateLimitResult {
  return checkRateLimit({
    key: `extract-receipt:${restaurantId}:${extractClientIp(request)}`,
    limit: getReceiptRateLimitPerMinute(),
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
}

export function receiptRateLimitExceededResponse(rateLimit: RateLimitResult) {
  const retryAfter = Math.max(
    1,
    Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
  );

  return {
    status: 429,
    body: {
      error: "rate_limit_exceeded",
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      retryAfter,
    },
    headers: {
      "Retry-After": String(retryAfter),
      "X-RateLimit-Limit": String(rateLimit.limit),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
    },
  };
}

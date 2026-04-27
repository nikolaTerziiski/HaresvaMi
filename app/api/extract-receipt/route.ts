import { NextRequest, NextResponse } from "next/server";

import {
  checkReceiptExtractionRateLimit,
  readReceiptExtractionRequest,
  receiptRateLimitExceededResponse,
} from "@/lib/api/extract-receipt-request";
import { extractReceipt } from "@/lib/ai/extract-receipt";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await readReceiptExtractionRequest(request);

    if (!payload.restaurantId) {
      return NextResponse.json(
        { error: "restaurant_id is required" },
        { status: 400 },
      );
    }

    const rateLimit = checkReceiptExtractionRateLimit(
      request,
      payload.restaurantId,
    );

    if (!rateLimit.allowed) {
      const response = receiptRateLimitExceededResponse(rateLimit);

      return NextResponse.json(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    const result = await extractReceipt({
      restaurantId: payload.restaurantId,
      imagePath: payload.imagePath,
      imageBuffer: payload.imageBuffer,
      mimeType: payload.mimeType,
    });

    return NextResponse.json(result.body, { status: result.status });
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

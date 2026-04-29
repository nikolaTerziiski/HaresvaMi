import { NextRequest, NextResponse } from "next/server";

import {
  checkReceiptExtractionRateLimit,
  readReceiptExtractionRequest,
  receiptRateLimitExceededResponse,
} from "@/lib/api/extract-receipt-request";
import { extractReceipt } from "@/lib/ai/extract-receipt";
import { authorizeKioskOrOwnerRestaurant } from "@/lib/kiosk/authorization";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await readReceiptExtractionRequest(request);
    const authorization = await authorizeKioskOrOwnerRestaurant(
      request,
      payload.restaurantId,
    );

    if (!authorization.ok) {
      return NextResponse.json(authorization.body, {
        status: authorization.status,
      });
    }

    const rateLimit = checkReceiptExtractionRateLimit(
      request,
      authorization.restaurantId,
    );

    if (!rateLimit.allowed) {
      const response = receiptRateLimitExceededResponse(rateLimit);

      return NextResponse.json(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    const result = await extractReceipt({
      restaurantId: authorization.restaurantId,
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

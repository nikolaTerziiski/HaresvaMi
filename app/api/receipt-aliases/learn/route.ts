import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { authorizeKioskOrOwnerRestaurant } from "@/lib/kiosk/authorization";
import {
  learnReceiptAliases,
  receiptAliasLearnSchema,
  ReceiptAliasLearningError,
  responseForReceiptAliasLearningError,
} from "@/lib/receipt-aliases/learn";

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeKioskOrOwnerRestaurant(request);

    if (!authorization.ok) {
      return NextResponse.json(authorization.body, {
        status: authorization.status,
      });
    }

    const payload = receiptAliasLearnSchema.parse(await request.json());
    const result = await learnReceiptAliases({
      restaurantId: authorization.restaurantId,
      aliases: payload.aliases,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "invalid_receipt_alias_payload",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (error instanceof ReceiptAliasLearningError) {
      const response = responseForReceiptAliasLearningError(error);
      return NextResponse.json(response.body, { status: response.status });
    }

    console.error("API Error in /receipt-aliases/learn:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to learn receipt aliases.",
      },
      { status: 500 },
    );
  }
}

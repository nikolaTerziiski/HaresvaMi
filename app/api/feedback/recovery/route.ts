import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { canUseReputation } from "@/lib/billing/entitlements";
import { recoveryCommentSchema } from "@/lib/feedback/schema";
import { saveRecoveryComment } from "@/lib/feedback/recovery";
import { authorizeKioskOrOwnerRestaurant } from "@/lib/kiosk/authorization";

export async function POST(request: NextRequest) {
  try {
    const body = recoveryCommentSchema.parse(await request.json());
    const authorization = await authorizeKioskOrOwnerRestaurant(
      request,
      body.restaurantId,
    );

    if (!authorization.ok) {
      return NextResponse.json(authorization.body, {
        status: authorization.status,
      });
    }

    if (!(await canUseReputation(body.restaurantId))) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const result = await saveRecoveryComment({
      restaurantId: authorization.restaurantId,
      sessionId: body.sessionId,
      comment: body.comment,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "session_not_found",
          message: "No matching feedback session.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "invalid_recovery_payload",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("API Error in /feedback/recovery:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save recovery comment.",
      },
      { status: 500 },
    );
  }
}

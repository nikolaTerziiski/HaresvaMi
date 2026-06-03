import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { canUseReputation } from "@/lib/billing/entitlements";
import { recoveryCommentSchema } from "@/lib/feedback/schema";
import { saveRecoveryComment } from "@/lib/feedback/recovery";
import { authorizeKioskOrOwnerRestaurant } from "@/lib/kiosk/authorization";
import { checkRateLimit } from "@/lib/api/rate-limit";

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

    const rateLimit = checkRateLimit({
      key: `feedback-recovery:${authorization.restaurantId}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      );
      return NextResponse.json(
        {
          error: "rate_limited",
          message: "Too many recovery attempts. Please slow down.",
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
      { error: "internal_error", message: "Unable to save recovery comment." },
      { status: 500 },
    );
  }
}

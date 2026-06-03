import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  responseForFeedbackSubmitError,
  submitFeedback,
  FeedbackSubmitError,
} from "@/lib/feedback/submit-feedback";
import { feedbackSubmissionSchema } from "@/lib/feedback/schema";
import { authorizeKioskOrOwnerRestaurant } from "@/lib/kiosk/authorization";
import { checkRateLimit } from "@/lib/api/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const payload = feedbackSubmissionSchema.parse(await request.json());
    const authorization = await authorizeKioskOrOwnerRestaurant(
      request,
      payload.restaurantId,
    );

    if (!authorization.ok) {
      return NextResponse.json(authorization.body, {
        status: authorization.status,
      });
    }

    const rateLimit = checkRateLimit({
      key: `feedback-submit:${authorization.restaurantId}`,
      limit: 60,
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
          message: "Too many feedback submissions. Please slow down.",
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

    const result = await submitFeedback({
      ...payload,
      restaurantId: authorization.restaurantId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "invalid_feedback_payload",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (error instanceof FeedbackSubmitError) {
      const response = responseForFeedbackSubmitError(error);
      return NextResponse.json(response.body, { status: response.status });
    }

    console.error("API Error in /feedback:", error);

    return NextResponse.json(
      { error: "internal_error", message: "Unable to submit feedback." },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  responseForFeedbackSubmitError,
  submitFeedback,
  FeedbackSubmitError,
} from "@/lib/feedback/submit-feedback";
import { feedbackSubmissionSchema } from "@/lib/feedback/schema";
import { authorizeKioskOrOwnerRestaurant } from "@/lib/kiosk/authorization";

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
      {
        error:
          error instanceof Error ? error.message : "Unable to submit feedback.",
      },
      { status: 500 },
    );
  }
}

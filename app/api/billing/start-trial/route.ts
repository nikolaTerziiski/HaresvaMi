import { NextResponse } from "next/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import {
  startInternalTrial,
  StartTrialError,
  statusForStartTrialError,
} from "@/lib/billing/trial";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!restaurant) {
      return NextResponse.json(
        { error: "restaurant_not_found" },
        { status: 404 },
      );
    }

    const billingState = await startInternalTrial({
      restaurantId: restaurant.id,
      ownerId: user.id,
    });

    return NextResponse.json(billingState);
  } catch (error) {
    if (error instanceof StartTrialError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: statusForStartTrialError(error) },
      );
    }

    console.error("API Error in /billing/start-trial:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to start trial.",
      },
      { status: 500 },
    );
  }
}

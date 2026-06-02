import { NextResponse } from "next/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import {
  startInternalTrial,
  StartTrialError,
  statusForStartTrialError,
} from "@/lib/billing/trial";

export const runtime = "nodejs";

function messageForStartTrialError(error: StartTrialError) {
  switch (error.code) {
    case "restaurant_not_found":
      return "Не намерихме ресторанта за този акаунт.";
    case "not_free_tier":
      return "Пробният период е само за ресторанти на безплатен план.";
    case "trial_already_used":
      return "Пробният период вече е използван за този ресторант.";
    case "menu_incomplete":
      return "Добави поне 5 активни продукта в менюто, преди да стартираш Pro пробния период.";
  }
}

export async function POST() {
  try {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "Влез в акаунта си, за да стартираш пробния период.",
        },
        { status: 401 },
      );
    }

    if (!restaurant) {
      return NextResponse.json(
        {
          error: "restaurant_not_found",
          message: "Първо създай ресторант, после стартирай пробния период.",
        },
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
          message: messageForStartTrialError(error),
        },
        { status: statusForStartTrialError(error) },
      );
    }

    console.error("API Error in /billing/start-trial:", error);

    return NextResponse.json(
      {
        error: "trial_start_failed",
        message: "Не успяхме да стартираме пробния период. Опитай отново.",
      },
      { status: 500 },
    );
  }
}

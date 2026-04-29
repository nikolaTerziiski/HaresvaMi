import { NextRequest, NextResponse } from "next/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import {
  createKioskSession,
  KioskSessionError,
  listKioskSessions,
} from "@/lib/kiosk/session-token";

export const runtime = "nodejs";

function statusForKioskSessionError(error: KioskSessionError) {
  if (error.code === "restaurant_not_found") return 404;
  if (error.code === "invalid_expiry" || error.code === "invalid_token") {
    return 400;
  }

  return 500;
}

async function getOwnerRestaurant() {
  const { user, restaurant } = await getCurrentOwnerState();

  if (!user) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  if (!restaurant) {
    return {
      response: NextResponse.json(
        { error: "restaurant_not_found" },
        { status: 404 },
      ),
    };
  }

  return { user, restaurant };
}

async function readCreateBody(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    label?: unknown;
  };

  if (body.label !== undefined && typeof body.label !== "string") {
    return {
      error: NextResponse.json(
        { error: "invalid_label", message: "label must be a string." },
        { status: 400 },
      ),
    };
  }

  return {
    label: typeof body.label === "string" ? body.label : undefined,
  };
}

export async function GET() {
  try {
    const owner = await getOwnerRestaurant();

    if ("response" in owner) {
      return owner.response;
    }

    const sessions = await listKioskSessions({
      restaurantId: owner.restaurant.id,
      ownerId: owner.user.id,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    if (error instanceof KioskSessionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: statusForKioskSessionError(error) },
      );
    }

    console.error("API Error in /kiosk/sessions:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load kiosk sessions.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const owner = await getOwnerRestaurant();

    if ("response" in owner) {
      return owner.response;
    }

    const body = await readCreateBody(request);

    if ("error" in body) {
      return body.error;
    }

    const { token, session } = await createKioskSession({
      restaurantId: owner.restaurant.id,
      ownerId: owner.user.id,
      label: body.label,
    });

    return NextResponse.json(
      {
        session,
        setupUrl: `/kiosk/connect?token=${encodeURIComponent(token)}`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof KioskSessionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: statusForKioskSessionError(error) },
      );
    }

    console.error("API Error in /kiosk/sessions:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create kiosk session.",
      },
      { status: 500 },
    );
  }
}

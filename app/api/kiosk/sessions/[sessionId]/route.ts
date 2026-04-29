import { NextRequest, NextResponse } from "next/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import {
  KioskSessionError,
  revokeKioskSession,
} from "@/lib/kiosk/session-token";

export const runtime = "nodejs";

type SessionRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

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

async function revokeSession(context: SessionRouteContext) {
  try {
    const owner = await getOwnerRestaurant();

    if ("response" in owner) {
      return owner.response;
    }

    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id_required" },
        { status: 400 },
      );
    }

    const session = await revokeKioskSession(sessionId, owner.user.id);

    if (!session) {
      return NextResponse.json(
        { error: "kiosk_session_not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof KioskSessionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: statusForKioskSessionError(error) },
      );
    }

    console.error("API Error in /kiosk/sessions/[sessionId]:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to revoke kiosk session.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  _request: NextRequest,
  context: SessionRouteContext,
) {
  return revokeSession(context);
}

export async function DELETE(
  _request: NextRequest,
  context: SessionRouteContext,
) {
  return revokeSession(context);
}

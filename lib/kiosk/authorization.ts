import "server-only";

import type { NextRequest } from "next/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import {
  KIOSK_SESSION_COOKIE,
  verifyKioskToken,
} from "@/lib/kiosk/session-token";

type AuthorizationSource = "kiosk" | "owner";

type AuthorizedRestaurantResult =
  | {
      ok: true;
      restaurantId: string;
      source: AuthorizationSource;
    }
  | {
      ok: false;
      status: 401 | 403 | 404;
      body: {
        error: string;
        message: string;
      };
    };

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const [scheme, token] = authorization?.split(/\s+/, 2) ?? [];

  return scheme?.toLowerCase() === "bearer" ? token : null;
}

function kioskTokenFromRequest(request: NextRequest) {
  return (
    request.cookies.get(KIOSK_SESSION_COOKIE)?.value ??
    request.headers.get("x-kiosk-token") ??
    bearerToken(request)
  )?.trim();
}

function unauthorized(invalidKioskToken: boolean): AuthorizedRestaurantResult {
  if (invalidKioskToken) {
    return {
      ok: false,
      status: 401,
      body: {
        error: "invalid_kiosk_access",
        message: "Таблетната сесия е невалидна или изтекла.",
      },
    };
  }

  return {
    ok: false,
    status: 401,
    body: {
      error: "unauthorized",
      message: "Необходим е свързан таблет или вход като собственик.",
    },
  };
}

export async function authorizeKioskOrOwnerRestaurant(
  request: NextRequest,
  requestedRestaurantId?: string | null,
): Promise<AuthorizedRestaurantResult> {
  const kioskToken = kioskTokenFromRequest(request);
  let invalidKioskToken = false;

  if (kioskToken) {
    const verification = await verifyKioskToken(kioskToken);

    if (verification.valid) {
      return {
        ok: true,
        restaurantId: verification.session.restaurant_id,
        source: "kiosk",
      };
    }

    invalidKioskToken = true;
  }

  const { user, restaurant } = await getCurrentOwnerState();

  if (!user) {
    return unauthorized(invalidKioskToken);
  }

  if (!restaurant) {
    return {
      ok: false,
      status: 404,
      body: {
        error: "restaurant_not_found",
        message: "Не намерихме ресторант към този собственик.",
      },
    };
  }

  if (requestedRestaurantId && requestedRestaurantId !== restaurant.id) {
    return {
      ok: false,
      status: 403,
      body: {
        error: "restaurant_forbidden",
        message: "Нямаш достъп до този ресторант.",
      },
    };
  }

  return {
    ok: true,
    restaurantId: restaurant.id,
    source: "owner",
  };
}

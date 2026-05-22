import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "@/lib/validations/push";

export const runtime = "nodejs";

/**
 * POST /api/push/subscribe
 *
 * Upserts a Web Push subscription for the authenticated restaurant owner.
 * Body must match PushSubscriptionJSON (endpoint, keys.p256dh, keys.auth).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = pushSubscribeSchema.parse(body);

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

    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          restaurant_id: restaurant.id,
          user_id: user.id,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          expiration_time: input.expirationTime ?? null,
          user_agent: input.userAgent ?? null,
          last_used_at: null,
        },
        {
          onConflict: "endpoint",
        },
      )
      .select("id")
      .single();

    if (error) {
      console.error("API Error upserting push subscription:", error);
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_payload", issues: error.issues },
        { status: 400 },
      );
    }

    console.error("API Error in POST /api/push/subscribe:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save push subscription.",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/push/subscribe
 *
 * Removes a Web Push subscription for the authenticated owner.
 * Body: { endpoint: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const input = pushUnsubscribeSchema.parse(body);

    const { user } = await getCurrentOwnerState();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Use the user-scoped server client so RLS enforces user_id = auth.uid()
    const { createSupabaseServerClient } =
      await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", input.endpoint)
      .eq("user_id", user.id);

    if (error) {
      console.error("API Error deleting push subscription:", error);
      return NextResponse.json(
        { error: "Failed to delete subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_payload", issues: error.issues },
        { status: 400 },
      );
    }

    console.error("API Error in DELETE /api/push/subscribe:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete push subscription.",
      },
      { status: 500 },
    );
  }
}

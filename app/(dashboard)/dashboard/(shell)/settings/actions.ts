"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import { hasProAccess } from "@/lib/billing/entitlements-core";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { googleReviewUrlSchema } from "@/lib/validations/restaurant";

export async function saveGoogleReviewUrl(input: {
  url: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { user, restaurant } = await getCurrentOwnerState();

  if (!user || !restaurant) {
    return { ok: false, error: "unauthenticated" };
  }

  if (!hasProAccess(restaurant)) {
    return { ok: false, error: "locked" };
  }

  const result = googleReviewUrlSchema.safeParse(input.url);

  if (!result.success) {
    return { ok: false, error: "invalid" };
  }

  const url = result.data;
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("restaurants")
    .update({ google_review_url: url === "" ? null : url })
    .eq("id", restaurant.id);

  if (error) {
    return { ok: false, error: "server" };
  }

  revalidatePath("/dashboard/settings");

  return { ok: true };
}

export async function disconnectTelegram(): Promise<{ ok: boolean }> {
  const { user, restaurant } = await getCurrentOwnerState();

  if (!user || !restaurant) {
    return { ok: false };
  }

  const supabase = createSupabaseServiceClient();

  await supabase
    .from("telegram_links")
    .delete()
    .eq("restaurant_id", restaurant.id);

  revalidatePath("/dashboard/settings");

  return { ok: true };
}

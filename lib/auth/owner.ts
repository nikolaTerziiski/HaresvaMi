import "server-only";

import type { User } from "@supabase/supabase-js";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OwnerRestaurant = {
  id: string;
  name: string;
  slug: string;
  language_default: Locale | null;
  customer_languages: string[] | null;
};

export async function getCurrentOwnerState() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && userError.name !== "AuthSessionMissingError") {
    throw new Error(`Unable to read the current auth user: ${userError.message}`);
  }

  if (!user) {
    return {
      user: null,
      restaurant: null,
    };
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, slug, language_default, customer_languages")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (restaurantError) {
    throw new Error(
      `Unable to read the current owner's restaurant: ${restaurantError.message}`,
    );
  }

  return {
    user,
    restaurant: (restaurant as OwnerRestaurant | null) ?? null,
  };
}

export function getOwnerDestination(restaurant: OwnerRestaurant | null) {
  return restaurant ? "/dashboard" : "/dashboard/onboarding";
}

export function getOwnerLanguage(user: User | null): Locale {
  const language = user?.user_metadata?.language;

  if (typeof language === "string" && isLocale(language)) {
    return language;
  }

  return defaultLocale;
}

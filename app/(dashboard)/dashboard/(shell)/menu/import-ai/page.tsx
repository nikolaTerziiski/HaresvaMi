import { redirect } from "next/navigation";

import { MenuImportFlow } from "@/components/dashboard/menu/import/MenuImportFlow";
import { canExtractMenu } from "@/lib/billing/entitlements";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Импорт на меню с AI | HaresvaMi" };

export default async function MenuImportPage() {
  const { user, restaurant } = await getCurrentOwnerState();
  if (!user || !restaurant) redirect("/dashboard/onboarding");

  const entitlement = await canExtractMenu(restaurant.id);
  // Don't 404 if not allowed — render the tier-locked card via flow

  // Load existing items (lightweight) for the review screen's duplicate display
  const supabase = await createSupabaseServerClient();
  const { data: existingItems } = await supabase
    .from("menu_items")
    .select("id, name_bg, category")
    .eq("restaurant_id", restaurant.id)
    .is("deleted_at", null);

  const safeExistingItems = (existingItems ?? []).filter(
    (item): item is { id: string; name_bg: string; category: string } =>
      typeof item.id === "string" &&
      typeof item.name_bg === "string" &&
      typeof item.category === "string",
  );

  return (
    <MenuImportFlow
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      entitlement={entitlement}
      existingItems={safeExistingItems}
    />
  );
}

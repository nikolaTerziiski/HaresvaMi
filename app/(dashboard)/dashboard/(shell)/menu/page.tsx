import { redirect } from "next/navigation";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { canExtractMenu } from "@/lib/billing/entitlements";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MenuManager } from "@/components/dashboard/menu/MenuManager";
import { DASHBOARD_PAGE_FULL_CLASS } from "@/components/dashboard/shell/page-frame";

export const metadata = {
  title: "Меню | Haresva Mi",
};

export default async function MenuPage() {
  const { user, restaurant } = await getCurrentOwnerState();

  if (!user) {
    redirect("/login");
  }

  if (!restaurant) {
    redirect("/dashboard/onboarding");
  }

  const supabase = await createSupabaseServerClient();
  const [menuResult, menuImportEntitlement] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, name_bg, category, price, description_bg, sort_order")
      .eq("restaurant_id", restaurant.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    canExtractMenu(restaurant.id),
  ]);

  const { data: menuItems, error } = menuResult;

  if (error) {
    console.error("Error fetching menu items:", error);
  }

  return (
    // Full-bleed: the category board needs horizontal room (documented exception).
    <div className={DASHBOARD_PAGE_FULL_CLASS}>
      <MenuManager
        restaurantId={restaurant.id}
        initialItems={menuItems || []}
        menuImportEntitlement={menuImportEntitlement}
      />
    </div>
  );
}

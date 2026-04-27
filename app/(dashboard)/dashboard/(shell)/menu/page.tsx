import { redirect } from "next/navigation";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MenuManager } from "@/components/dashboard/menu/MenuManager";

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
  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("id, name_bg, category, price, description_bg, sort_order")
    .eq("restaurant_id", restaurant.id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching menu items:", error);
  }

  return (
    <div className="flex h-full w-full">
      <MenuManager
        restaurantId={restaurant.id}
        initialItems={menuItems || []}
      />
    </div>
  );
}

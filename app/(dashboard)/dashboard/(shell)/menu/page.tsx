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
  const { count, error } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching menu items count:", error);
  }

  return (
    <div className="flex h-full w-full">
      <MenuManager 
        restaurantId={restaurant.id} 
        initialItemsCount={count || 0} 
      />
    </div>
  );
}

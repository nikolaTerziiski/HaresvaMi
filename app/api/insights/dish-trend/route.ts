import { NextRequest, NextResponse } from "next/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadDishWeeklyTrend } from "@/lib/insights/trends";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function GET(request: NextRequest) {
  try {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const menuItemId = searchParams.get("menuItemId");

    if (!menuItemId || !/^[0-9a-f-]{36}$/.test(menuItemId)) {
      return NextResponse.json(
        { error: "menuItemId is required and must be a UUID" },
        { status: 400 },
      );
    }

    const weeksBackParam = searchParams.get("weeksBack");
    const weeksBack = weeksBackParam
      ? clamp(parseInt(weeksBackParam, 10), 4, 26)
      : 12;

    const supabase = await createSupabaseServerClient();
    const { data: menuItem } = await supabase
      .from("menu_items")
      .select("id")
      .eq("id", menuItemId)
      .eq("restaurant_id", restaurant.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 },
      );
    }

    const trend = await loadDishWeeklyTrend({
      restaurantId: restaurant.id,
      menuItemId,
      weeksBack,
    });

    return NextResponse.json({ trend });
  } catch (error) {
    console.error("API Error in GET /api/insights/dish-trend:", error);
    return NextResponse.json(
      { error: "Unable to load dish trend." },
      { status: 500 },
    );
  }
}

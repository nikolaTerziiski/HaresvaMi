import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { KioskScanScreen } from "@/components/kiosk/KioskScanScreen";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { canScanReceipt } from "@/lib/billing/entitlements";
import {
  KIOSK_SESSION_COOKIE,
  verifyKioskToken,
} from "@/lib/kiosk/session-token";
import type {
  EntitlementResult,
  KioskMenuItem,
  KioskRestaurant,
} from "@/lib/kiosk/types";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const EMPTY_ENTITLEMENT: EntitlementResult = {
  allowed: false,
  reason: "restaurant_not_found",
  limit: 0,
  used: 0,
  remaining: 0,
  upgradeTarget: null,
};

function KioskAccessError() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <section className="max-w-[560px] rounded-3xl border border-[var(--rule)] bg-[var(--paper)] p-10">
        <p className="m-0 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--accent)]">
          HaresvaMi
        </p>
        <h1 className="mt-3 mb-4 font-[var(--f-display)] text-[48px] font-normal leading-none text-[var(--ink)]">
          Таблетът не е свързан.
        </h1>
        <p className="m-0 text-[18px] leading-[1.55] text-[var(--ink-2)]">
          Отвори връзката за таблет от dashboard-а.
        </p>
      </section>
    </div>
  );
}

async function resolveRestaurantId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(KIOSK_SESSION_COOKIE)?.value;

  if (token) {
    try {
      const verification = await verifyKioskToken(token);

      return verification.valid ? verification.session.restaurant_id : null;
    } catch (error) {
      console.error("Unable to verify kiosk session:", error);
      return null;
    }
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const { restaurant } = await getCurrentOwnerState();

  return restaurant?.id ?? null;
}

async function loadKioskRestaurant(restaurantId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load kiosk restaurant: ${error.message}`);
  }

  return data as KioskRestaurant | null;
}

async function loadKioskMenu(restaurantId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name_bg, category, price")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name_bg", { ascending: true });

  if (error) {
    throw new Error(`Unable to load kiosk menu: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name_bg,
    category: item.category,
    price: item.price,
  })) satisfies KioskMenuItem[];
}

export default async function KioskScanPage() {
  const restaurantId = await resolveRestaurantId();

  if (!restaurantId) {
    return <KioskAccessError />;
  }

  const [restaurant, entitlement, menuItems] = await Promise.all([
    loadKioskRestaurant(restaurantId),
    canScanReceipt(restaurantId),
    loadKioskMenu(restaurantId),
  ]);

  if (!restaurant) {
    return <KioskAccessError />;
  }

  const t = await getTranslations("kiosk.scan");

  return (
    <KioskScanScreen
      restaurant={restaurant}
      menuItems={menuItems}
      initialEntitlement={entitlement ?? EMPTY_ENTITLEMENT}
      copy={{
        scanEyebrow: t("scanEyebrow"),
        title: t("title"),
        subtitle: t("subtitle"),
        remainingScansLabel: t("remainingScansLabel"),
        scanButton: t("scanButton"),
        scanAgain: t("scanAgain"),
        processing: t("processing"),
        exhaustedTitle: t("exhaustedTitle"),
        exhaustedBody: t("exhaustedBody"),
        manualButton: t("manualButton"),
        manualTitle: t("manualTitle"),
        manualBody: t("manualBody"),
        manualSearch: t("manualSearch"),
        noMenuTitle: t("noMenuTitle"),
        noMenuBody: t("noMenuBody"),
        selectedCountLabel: t("selectedCountLabel"),
        continueWithSelection: t("continueWithSelection"),
        chooseAtLeastOne: t("chooseAtLeastOne"),
        extractedTitle: t("extractedTitle"),
        extractedBody: t("extractedBody"),
        useExtracted: t("useExtracted"),
        useManual: t("useManual"),
        scanFailed: t("scanFailed"),
        readyTitle: t("readyTitle"),
        readyBody: t("readyBody"),
        editSelection: t("editSelection"),
        startCustomerStep: t("startCustomerStep"),
        customerTitle: t("customerTitle"),
        customerBody: t("customerBody"),
        overallLike: t("overallLike"),
        overallDislike: t("overallDislike"),
        chooseOverall: t("chooseOverall"),
        savingFeedback: t("savingFeedback"),
        feedbackFailed: t("feedbackFailed"),
        feedbackLimitReached: t("feedbackLimitReached"),
        finish: t("finish"),
        thanksTitle: t("thanksTitle"),
        thanksBody: t("thanksBody"),
        reset: t("reset"),
        ownerUpgradeHint: t("ownerUpgradeHint"),
      }}
    />
  );
}

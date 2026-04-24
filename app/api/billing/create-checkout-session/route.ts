import { NextResponse } from "next/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import { getStripeClient, getStripeProPriceId } from "@/lib/billing/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RestaurantBillingRow = {
  id: string;
  owner_id: string;
  name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
};

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is required.");
  }

  return appUrl.replace(/\/$/, "");
}

function isMissingStripeResource(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "resource_missing"
  );
}

async function loadOwnerRestaurant(input: {
  restaurantId: string;
  ownerId: string;
}) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id, owner_id, name, stripe_customer_id, stripe_subscription_id, subscription_status",
    )
    .eq("id", input.restaurantId)
    .eq("owner_id", input.ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load restaurant billing state: ${error.message}`);
  }

  return data as RestaurantBillingRow | null;
}

async function createOrReuseCustomer(input: {
  restaurant: RestaurantBillingRow;
  ownerEmail?: string;
}) {
  const stripe = getStripeClient();
  const metadata = {
    restaurant_id: input.restaurant.id,
    owner_id: input.restaurant.owner_id,
  };

  if (input.restaurant.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(
        input.restaurant.stripe_customer_id,
      );

      if (!("deleted" in customer && customer.deleted)) {
        return customer.id;
      }
    } catch (error) {
      if (!isMissingStripeResource(error)) {
        throw error;
      }
    }
  }

  const customer = await stripe.customers.create({
    email: input.ownerEmail,
    name: input.restaurant.name,
    metadata,
  });

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("restaurants")
    .update({ stripe_customer_id: customer.id })
    .eq("id", input.restaurant.id)
    .eq("owner_id", input.restaurant.owner_id);

  if (error) {
    throw new Error(`Unable to save Stripe customer id: ${error.message}`);
  }

  return customer.id;
}

export async function POST() {
  try {
    const { user, restaurant: ownerRestaurant } = await getCurrentOwnerState();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!ownerRestaurant) {
      return NextResponse.json(
        { error: "restaurant_not_found" },
        { status: 404 },
      );
    }

    const restaurant = await loadOwnerRestaurant({
      restaurantId: ownerRestaurant.id,
      ownerId: user.id,
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "restaurant_not_found" },
        { status: 404 },
      );
    }

    if (
      restaurant.stripe_subscription_id &&
      ["active", "trialing", "past_due"].includes(
        restaurant.subscription_status ?? "",
      )
    ) {
      return NextResponse.json(
        { error: "subscription_already_exists" },
        { status: 409 },
      );
    }

    const stripe = getStripeClient();
    const proPriceId = getStripeProPriceId();
    const appUrl = getAppUrl();
    const customerId = await createOrReuseCustomer({
      restaurant,
      ownerEmail: user.email ?? undefined,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: restaurant.id,
      line_items: [
        {
          price: proPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        restaurant_id: restaurant.id,
      },
      subscription_data: {
        metadata: {
          restaurant_id: restaurant.id,
        },
      },
      success_url: `${appUrl}/dashboard/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/settings?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error("Stripe checkout session did not return a URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("API Error in /billing/create-checkout-session:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create checkout.",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import {
  getStripeClient,
  getStripeWebhookSecret,
} from "@/lib/billing/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type LocalSubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "paused";

type RestaurantBillingUpdate = {
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: LocalSubscriptionStatus;
  current_period_ends_at?: string | null;
  tier?: "free" | "pro";
};

type RestaurantSelector = {
  restaurantId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
};

function stripeObjectId(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }

  return null;
}

function unixToIso(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function periodAccessEnded(periodEnd: string | null) {
  return !periodEnd || new Date(periodEnd).getTime() <= Date.now();
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status,
): LocalSubscriptionStatus {
  if (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "canceled" ||
    status === "paused"
  ) {
    return status;
  }

  if (status === "unpaid") {
    return "past_due";
  }

  return "canceled";
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const itemPeriodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");
  const periodEnd =
    itemPeriodEnds.length > 0
      ? Math.max(...itemPeriodEnds)
      : ((subscription as Stripe.Subscription & { current_period_end?: number })
          .current_period_end ??
        subscription.trial_end ??
        subscription.cancel_at ??
        subscription.ended_at);

  return unixToIso(periodEnd);
}

function getSubscriptionRestaurantId(subscription: Stripe.Subscription) {
  return subscription.metadata.restaurant_id ?? null;
}

function getSessionRestaurantId(session: Stripe.Checkout.Session) {
  return session.metadata?.restaurant_id ?? session.client_reference_id ?? null;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  return (
    stripeObjectId(invoice.parent?.subscription_details?.subscription) ??
    stripeObjectId((invoice as Stripe.Invoice & { subscription?: unknown }).subscription)
  );
}

function getInvoiceRestaurantId(invoice: Stripe.Invoice) {
  return invoice.parent?.subscription_details?.metadata?.restaurant_id ?? null;
}

async function updateRestaurantBilling(
  selector: RestaurantSelector,
  update: RestaurantBillingUpdate,
) {
  if (
    !selector.restaurantId &&
    !selector.stripeSubscriptionId &&
    !selector.stripeCustomerId
  ) {
    console.warn("Stripe webhook could not identify a restaurant to update.");
    return;
  }

  const supabase = createSupabaseServiceClient();
  let query = supabase.from("restaurants").update(update);

  if (selector.restaurantId) {
    query = query.eq("id", selector.restaurantId);
  } else if (selector.stripeSubscriptionId) {
    query = query.eq("stripe_subscription_id", selector.stripeSubscriptionId);
  } else if (selector.stripeCustomerId) {
    query = query.eq("stripe_customer_id", selector.stripeCustomerId);
  }

  const { data, error } = await query.select("id").maybeSingle();

  if (error) {
    throw new Error(`Unable to update restaurant billing state: ${error.message}`);
  }

  if (!data) {
    console.warn("Stripe webhook matched no restaurant.", {
      restaurantId: selector.restaurantId,
      stripeSubscriptionId: selector.stripeSubscriptionId,
      stripeCustomerId: selector.stripeCustomerId,
    });
  }
}

async function retrieveSubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  return stripe.subscriptions.retrieve(subscriptionId);
}

async function applySubscriptionState(
  subscription: Stripe.Subscription,
  overrideStatus?: LocalSubscriptionStatus,
) {
  const customerId = stripeObjectId(subscription.customer);
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const subscriptionStatus =
    overrideStatus ?? mapSubscriptionStatus(subscription.status);
  const update: RestaurantBillingUpdate = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscriptionStatus,
    current_period_ends_at: periodEnd,
  };

  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    update.tier = "pro";
  } else if (
    subscriptionStatus === "canceled" &&
    periodAccessEnded(periodEnd)
  ) {
    update.tier = "free";
  }

  await updateRestaurantBilling(
    {
      restaurantId: getSubscriptionRestaurantId(subscription),
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
    },
    update,
  );
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  const customerId = stripeObjectId(session.customer);
  const subscriptionId = stripeObjectId(session.subscription);

  await updateRestaurantBilling(
    {
      restaurantId: getSessionRestaurantId(session),
      stripeCustomerId: customerId,
    },
    {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    },
  );

  if (subscriptionId) {
    await applySubscriptionState(await retrieveSubscription(subscriptionId));
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  await applySubscriptionState(await retrieveSubscription(subscriptionId));
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  const customerId = stripeObjectId(invoice.customer);

  if (subscriptionId) {
    const subscription = await retrieveSubscription(subscriptionId);
    await applySubscriptionState(subscription, "past_due");
    return;
  }

  await updateRestaurantBilling(
    {
      restaurantId: getInvoiceRestaurantId(invoice),
      stripeCustomerId: customerId,
    },
    {
      stripe_customer_id: customerId,
      subscription_status: "past_due",
    },
  );
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await applySubscriptionState(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await applySubscriptionState(
        event.data.object as Stripe.Subscription,
        "canceled",
      );
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      break;
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "missing_stripe_signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return NextResponse.json(
      { error: "invalid_stripe_signature" },
      { status: 400 },
    );
  }

  try {
    await handleStripeEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("API Error in /webhooks/stripe:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process Stripe webhook.",
      },
      { status: 500 },
    );
  }
}

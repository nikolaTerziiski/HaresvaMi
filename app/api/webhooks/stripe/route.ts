import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripeClient, getStripeWebhookSecret } from "@/lib/billing/stripe";
import { handleStripeWebhookEvent } from "@/lib/billing/stripe-webhook";

export const runtime = "nodejs";

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
    await handleStripeWebhookEvent(event);

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

import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  stripeClient ??= new Stripe(secretKey);

  return stripeClient;
}

export function getStripeProPriceId() {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error("STRIPE_PRO_PRICE_ID is required.");
  }

  return priceId;
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required.");
  }

  return webhookSecret;
}

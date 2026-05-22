/**
 * Server-only module for sending Web Push notifications.
 * No Next.js imports. Pure Node.js / web-push.
 *
 * VAPID keys are lazily validated on first send so module-level import never
 * throws in dev environments where keys are not yet configured.
 */

import webpush from "web-push";

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

export type SendResult =
  | { ok: true }
  | { ok: false; gone: boolean; reason: string };

let vapidConfigured = false;

function ensureVapidConfigured(): void {
  if (vapidConfigured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT env vars must all be set before sending push notifications.",
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

/**
 * Send a Web Push notification to a single subscription endpoint.
 *
 * Returns { ok: true } on success.
 * Returns { ok: false, gone: true } when the endpoint is gone (HTTP 404/410)
 * — the caller should delete that subscription row.
 * Returns { ok: false, gone: false } for transient failures.
 */
export async function sendPush(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<SendResult> {
  ensureVapidConfigured();

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      { TTL: 86400 }, // 24 hours
    );

    return { ok: true };
  } catch (err) {
    const statusCode =
      err != null && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : undefined;

    const gone = statusCode === 404 || statusCode === 410;
    const reason = err instanceof Error ? err.message : "Unknown push error";

    return { ok: false, gone, reason };
  }
}

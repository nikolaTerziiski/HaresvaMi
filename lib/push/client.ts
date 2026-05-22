/**
 * lib/push/client.ts
 * Browser-only push notification helpers. No React — keep this as a pure
 * helper module. Import from client components or hooks only (never from
 * server-side code).
 */

/** Convert a base64url string to a Uint8Array (needed for VAPID public key). */
export function base64UrlToUint8Array(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    buffer[i] = raw.charCodeAt(i);
  }

  return buffer;
}

/** True when the current browser environment supports push notifications. */
export function isPushSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Returns the current notification permission or 'unsupported' on SSR. */
export function getNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

/** Requests notification permission from the user. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";

  return Notification.requestPermission();
}

/** Returns the active PushSubscription for this SW registration, or null. */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

type SubscribeResult =
  | { ok: true; endpoint: string }
  | { ok: false; reason: string };

/**
 * Subscribes the current browser to push notifications.
 * Registers the SW if needed, creates a PushManager subscription using the
 * VAPID public key, then POSTs the subscription to /api/push/subscribe.
 */
export async function subscribePush(): Promise<SubscribeResult> {
  if (!isPushSupported()) {
    return { ok: false, reason: "push_not_supported" };
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidKey) {
    return { ok: false, reason: "vapid_key_missing" };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const applicationServerKey = base64UrlToUint8Array(vapidKey)
      .buffer as ArrayBuffer;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const json = subscription.toJSON() as {
      endpoint: string;
      keys?: { p256dh?: string; auth?: string };
      expirationTime?: number | null;
    };

    const body = {
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      },
      expirationTime: json.expirationTime ?? null,
      userAgent: navigator.userAgent,
    };

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      return { ok: false, reason: data.error ?? "server_error" };
    }

    return { ok: true, endpoint: json.endpoint };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return { ok: false, reason: message };
  }
}

/** Unsubscribes from push notifications locally and removes from server. */
export async function unsubscribePush(): Promise<void> {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // Silently ignore — best-effort cleanup
  }
}

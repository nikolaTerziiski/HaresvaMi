import "server-only";

import { buildLowRatingPushPayload } from "@/lib/push/payload";
import { sendPush } from "@/lib/push/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/send";

/**
 * Build a generic BG-language low-rating alert message.
 * Does NOT include any PII (no customer names, comments, emails, UUIDs).
 */
export function buildLowRatingAlertMessage(
  restaurantName: string,
  dashboardUrl: string,
): string {
  return `⚠️ Нов отрицателен отзив в „${restaurantName}". Виж таблото: ${dashboardUrl}`;
}

/**
 * Send a low-rating alert to all Telegram chats linked to the restaurant.
 * Swallows all errors — must never throw or affect the feedback save flow.
 */
export async function sendLowRatingAlert({
  restaurantId,
  restaurantName,
}: {
  restaurantId: string;
  restaurantName: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient();

    const { data: links } = await supabase
      .from("telegram_links")
      .select("chat_id")
      .eq("restaurant_id", restaurantId);

    if (links && links.length > 0) {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/feedback`;
      const text = buildLowRatingAlertMessage(restaurantName, dashboardUrl);

      await Promise.all(
        links.map((link) =>
          sendTelegramMessage(link.chat_id, text).catch((err) =>
            console.error("sendTelegramMessage failed", link.chat_id, err),
          ),
        ),
      );
    }
  } catch (err) {
    console.error("sendLowRatingAlert failed", err);
  }

  // Web-push block — independently fire-and-forget; errors never affect Telegram.
  try {
    const supabase = createSupabaseServiceClient();

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("restaurant_id", restaurantId);

    const subs = subscriptions ?? [];
    if (subs.length === 0) return;

    const payload = buildLowRatingPushPayload(restaurantName);
    const now = new Date();
    const successIds: string[] = [];
    const goneIds: string[] = [];

    for (const sub of subs) {
      const result = await sendPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
      );

      if (result.ok) {
        successIds.push(sub.id);
      } else if (result.gone) {
        goneIds.push(sub.id);
      }
    }

    if (goneIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", goneIds);
    }

    if (successIds.length > 0) {
      await supabase
        .from("push_subscriptions")
        .update({ last_used_at: now.toISOString() })
        .in("id", successIds);
    }
  } catch (err) {
    console.error("low-rating push failed", err);
  }
}

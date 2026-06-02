import "server-only";

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

    if (!links || links.length === 0) return;

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/feedback`;
    const text = buildLowRatingAlertMessage(restaurantName, dashboardUrl);

    await Promise.all(
      links.map((link) =>
        sendTelegramMessage(link.chat_id, text).catch((err) =>
          console.error("sendTelegramMessage failed", link.chat_id, err),
        ),
      ),
    );
  } catch (err) {
    console.error("sendLowRatingAlert failed", err);
  }
}

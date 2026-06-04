import type { PushPayload } from "@/lib/push/server";

const BODY_MAX_CHARS = 240;

/**
 * Construct a push notification payload for the weekly insight.
 *
 * The body is truncated to 240 characters. Only the restaurant name and
 * summary text are included — no PII such as owner emails, user IDs, or
 * restaurant IDs leak into the notification body.
 */
export function buildInsightPayload(
  restaurantName: string,
  summaryText: string,
): PushPayload {
  const body =
    summaryText.length > BODY_MAX_CHARS
      ? summaryText.substring(0, BODY_MAX_CHARS)
      : summaryText;

  return {
    title: restaurantName,
    body,
    url: "/dashboard/insights",
    tag: "weekly-insight",
  };
}

/**
 * Construct a push notification payload for a low-rating alert.
 *
 * Only the restaurant name is included — no PII such as customer comments,
 * owner emails, user IDs, or restaurant IDs leak into the notification body.
 */
export function buildLowRatingPushPayload(restaurantName: string): PushPayload {
  return {
    title: "Нов отрицателен отзив",
    body: `„${restaurantName}" получи нисък рейтинг. Виж таблото.`,
    url: "/dashboard/feedback",
    tag: "low-rating",
  };
}

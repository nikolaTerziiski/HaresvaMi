/**
 * Server-only module for sending Telegram messages via the Bot API.
 * If TELEGRAM_BOT_TOKEN is not configured, all sends are no-ops.
 */

export async function sendTelegramMessage(
  chatId: number,
  text: string,
): Promise<{ ok: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    // Missing token — silently skip (dev environment without Telegram configured)
    return { ok: false };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      },
    );

    if (!response.ok) {
      return { ok: false };
    }

    return { ok: true };
  } catch {
    return { ok: false };
  }
}

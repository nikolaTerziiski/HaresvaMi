import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyLinkToken } from "@/lib/telegram/link-token";
import { sendTelegramMessage } from "@/lib/telegram/send";

type TelegramUpdate = {
  message?: {
    chat: { id: number };
    from?: { username?: string };
    text?: string;
  };
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Always return 200 to Telegram — never let errors propagate back
  try {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (webhookSecret) {
      const incomingSecret = request.headers.get(
        "x-telegram-bot-api-secret-token",
      );
      if (incomingSecret !== webhookSecret) {
        return NextResponse.json({ ok: false }, { status: 401 });
      }
    }

    const update = (await request
      .json()
      .catch(() => null)) as TelegramUpdate | null;

    if (!update?.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    const startMatch = message.text?.match(/^\/start (.+)$/);

    if (!startMatch) {
      return NextResponse.json({ ok: true });
    }

    const payload = startMatch[1].trim();
    const verification = verifyLinkToken(payload);

    if (!verification.valid) {
      await sendTelegramMessage(
        message.chat.id,
        "Връзката е невалидна или е изтекла. Моля, генерирайте нова от таблото.",
      );
      return NextResponse.json({ ok: true });
    }

    const supabase = createSupabaseServiceClient();

    await supabase.from("telegram_links").upsert(
      {
        restaurant_id: verification.restaurantId,
        chat_id: message.chat.id,
        username: message.from?.username ?? null,
        linked_by: null,
      },
      { onConflict: "restaurant_id,chat_id" },
    );

    await sendTelegramMessage(
      message.chat.id,
      "✅ Успешно! Telegram е свързан с вашия ресторант в HaresvaMi. Ще получавате сигнали при отрицателни отзиви.",
    );
  } catch (err) {
    console.error("telegram webhook error", err);
  }

  return NextResponse.json({ ok: true });
}

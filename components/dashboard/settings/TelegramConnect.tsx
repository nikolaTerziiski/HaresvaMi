"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { disconnectTelegram } from "@/app/(dashboard)/dashboard/(shell)/settings/actions";

type TelegramConnectProps = {
  connected: boolean;
  username?: string | null;
  connectUrl: string;
};

export function TelegramConnect({
  connected,
  username,
  connectUrl,
}: TelegramConnectProps) {
  const t = useTranslations("dashboard.settings.telegram");
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDisconnect() {
    setDisconnecting(true);
    setError(null);

    try {
      const result = await disconnectTelegram();

      if (!result.ok) {
        setError(t("error"));
      }
    } catch {
      setError(t("error"));
    } finally {
      setDisconnecting(false);
    }
  }

  if (connected) {
    return (
      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,var(--paper))] px-3 py-1.5 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]">
            {t("connected")}
          </span>
          {username ? (
            <span className="text-[14px] text-[var(--ink-2)]">
              {t("connectedAs", { username })}
            </span>
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg px-4 py-3 text-[13px] leading-[1.5] text-[var(--bad)]"
            style={{
              border:
                "1px solid color-mix(in srgb, var(--bad) 20%, transparent)",
              background: "color-mix(in srgb, var(--bad) 8%, var(--paper))",
            }}
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="inline-flex w-fit rounded-lg border border-[var(--rule)] bg-transparent px-5 py-2.5 text-[14px] font-medium text-[var(--ink-2)] transition hover:border-[var(--bad)] hover:text-[var(--bad)] disabled:pointer-events-none disabled:opacity-60"
        >
          {t("disconnect")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      <p className="text-[14px] text-[var(--ink-mute)]">{t("notConnected")}</p>

      {connectUrl ? (
        <a
          href={connectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit rounded-lg bg-[var(--accent)] px-5 py-3 text-[14px] font-medium text-white no-underline transition hover:brightness-95"
        >
          {t("connect")}
        </a>
      ) : (
        // Telegram bot not configured (no NEXT_PUBLIC_TELEGRAM_BOT_USERNAME) — avoid a dead link
        <button
          type="button"
          disabled
          className="inline-flex w-fit cursor-not-allowed rounded-lg border border-[var(--rule)] bg-transparent px-5 py-3 text-[14px] font-medium text-[var(--ink-mute)]"
        >
          {t("connect")}
        </button>
      )}

      <p className="text-[13px] leading-[1.5] text-[var(--ink-mute)]">
        {t("help")}
      </p>
    </div>
  );
}

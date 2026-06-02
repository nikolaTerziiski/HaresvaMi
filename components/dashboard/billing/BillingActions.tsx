"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type BillingActionsProps = {
  canStartTrial: boolean;
  canUpgradeToPro: boolean;
};

type ErrorPayload = {
  error?: string;
  message?: string;
};

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.message ?? payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function BillingActions({
  canStartTrial,
  canUpgradeToPro,
}: BillingActionsProps) {
  const t = useTranslations("dashboard.billing.actions");
  const [pendingAction, setPendingAction] = useState<
    "trial" | "checkout" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function startTrial() {
    setPendingAction("trial");
    setError(null);

    try {
      const response = await fetch("/api/billing/start-trial", {
        method: "POST",
      });

      if (!response.ok) {
        setError(await readErrorMessage(response, t("genericError")));
        return;
      }

      window.location.reload();
    } catch {
      setError(t("genericError"));
    } finally {
      setPendingAction(null);
    }
  }

  async function openCheckout() {
    setPendingAction("checkout");
    setError(null);

    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | ({ url?: string } & ErrorPayload)
        | null;

      if (!response.ok) {
        setError(payload?.message ?? payload?.error ?? t("genericError"));
        return;
      }

      if (!payload?.url) {
        setError(t("checkoutMissingUrl"));
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setError(t("genericError"));
    } finally {
      setPendingAction(null);
    }
  }

  const isPending = pendingAction !== null;

  return (
    <div className="flex flex-col items-start justify-center gap-3">
      {canStartTrial ? (
        <button
          type="button"
          onClick={startTrial}
          disabled={isPending}
          className="inline-flex rounded-lg bg-[var(--accent)] px-5 py-3 text-[14px] font-medium text-white transition hover:brightness-95 disabled:pointer-events-none disabled:opacity-60"
        >
          {pendingAction === "trial" ? t("startTrialLoading") : t("startTrial")}
        </button>
      ) : null}
      {canUpgradeToPro ? (
        <button
          type="button"
          onClick={openCheckout}
          disabled={isPending}
          className="inline-flex rounded-lg border border-[var(--ink)] bg-transparent px-5 py-3 text-[14px] font-medium text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:pointer-events-none disabled:opacity-60"
        >
          {pendingAction === "checkout" ? t("upgradeLoading") : t("upgrade")}
        </button>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="m-0 max-w-[340px] rounded-lg border border-[color-mix(in_oklab,var(--bad)_35%,var(--rule))] bg-[color-mix(in_oklab,var(--bad)_8%,var(--paper))] px-3 py-2 text-[13px] leading-[1.5] text-[var(--plum)]"
        >
          {error}
        </p>
      ) : null}
      <p className="m-0 max-w-[300px] text-[13px] leading-[1.5] text-[var(--ink-mute)]">
        {t("note")}
      </p>
    </div>
  );
}

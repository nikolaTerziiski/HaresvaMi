import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import { canScanReceipt } from "@/lib/billing/entitlements";
import {
  getPlanLimits,
  isPlanTier,
  type PlanTier,
} from "@/lib/billing/plans";
import { getActiveScanCreditSummary, getMonthlyUsage } from "@/lib/billing/usage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "План и лимити | HaresvaMi",
};

const SUBSCRIPTION_STATUSES = [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "paused",
] as const;

type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

type UsageMeterProps = {
  title: string;
  value: string;
  helper: string;
  ratio: number;
};

function normalizeTier(tier: string | null | undefined): PlanTier {
  return tier && isPlanTier(tier) ? tier : "free";
}

function normalizeSubscriptionStatus(
  status: string | null | undefined,
): SubscriptionStatus {
  return SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatus)
    ? (status as SubscriptionStatus)
    : "none";
}

function isPast(value: string | null | undefined) {
  return value ? new Date(value).getTime() <= Date.now() : false;
}

function formatBillingDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    timeZone: "Europe/Sofia",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("bg-BG").format(value);
}

function usageRatio(used: number, limit: number) {
  return limit > 0 ? Math.min(1, used / limit) : 0;
}

function UsageMeter({ title, value, helper, ratio }: UsageMeterProps) {
  return (
    <article className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6">
      <p className="m-0 text-[13px] font-medium text-[var(--ink-mute)]">
        {title}
      </p>
      <p className="mt-3 mb-4 font-[var(--f-display)] text-[34px] font-normal leading-none text-[var(--ink)]">
        {value}
      </p>
      <div className="h-[4px] overflow-hidden rounded-full bg-[var(--rule)]">
        <span
          className="block h-full bg-[var(--accent)]"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="m-0 mt-4 text-[13px] leading-[1.5] text-[var(--ink-2)]">
        {helper}
      </p>
    </article>
  );
}

export default async function SettingsBillingPage() {
  const { user, restaurant } = await getCurrentOwnerState();

  if (!user) {
    redirect("/login");
  }

  if (!restaurant) {
    redirect("/dashboard/onboarding");
  }

  const t = await getTranslations("dashboard.billing");
  const supabase = await createSupabaseServerClient();

  const [billingResult, usage, creditSummary, scanEntitlement] =
    await Promise.all([
      supabase
        .from("restaurants")
        .select(
          "tier, subscription_status, trial_started_at, trial_ends_at, trial_used_at",
        )
        .eq("id", restaurant.id)
        .maybeSingle(),
      getMonthlyUsage(restaurant.id),
      getActiveScanCreditSummary(restaurant.id),
      canScanReceipt(restaurant.id),
    ]);

  if (billingResult.error) {
    throw new Error(
      `Unable to read restaurant billing state: ${billingResult.error.message}`,
    );
  }

  const billing = billingResult.data;
  const tier = normalizeTier(billing?.tier);
  const status = normalizeSubscriptionStatus(billing?.subscription_status);
  const limits = getPlanLimits(tier);
  const trialEndsAt = billing?.trial_ends_at ?? null;
  const trialExpired = status === "trialing" && isPast(trialEndsAt);
  const canStartTrial =
    tier === "free" &&
    status === "none" &&
    !billing?.trial_started_at &&
    !billing?.trial_used_at;
  const canUpgradeToPro = tier === "free" || trialExpired;
  const scansExhausted = scanEntitlement.remaining <= 0;

  return (
    <div className="mx-auto max-w-5xl px-10 py-10 pb-20 max-md:px-6 max-md:py-8">
      <section className="max-w-[620px]">
        <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 mb-4 font-[var(--f-display)] text-[44px] font-normal leading-[1.02] text-[var(--ink)] max-md:text-[34px]">
          {t("title")}
        </h1>
        <p className="m-0 text-[16px] leading-[1.55] text-[var(--ink-mute)]">
          {t("subtitle")}
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-7">
        <div className="grid grid-cols-[1.3fr_1fr] gap-8 max-[820px]:grid-cols-1">
          <div>
            <p className="m-0 text-[13px] font-medium text-[var(--ink-mute)]">
              {t("currentPlan")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="m-0 font-[var(--f-display)] text-[38px] font-normal leading-none text-[var(--ink)]">
                {t(`plans.${tier}`)}
              </h2>
              <span className="rounded-full border border-[var(--rule)] px-3 py-1 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                {t(`statuses.${status}`)}
              </span>
            </div>
            {status === "trialing" && trialEndsAt ? (
              <p className="mt-5 mb-0 text-[14px] leading-[1.55] text-[var(--ink-2)]">
                {t("trialEnds", { date: formatBillingDate(trialEndsAt) })}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-start justify-center gap-3">
            {canStartTrial ? (
              <button
                type="button"
                className="inline-flex rounded-lg bg-[var(--accent)] px-5 py-3 text-[14px] font-medium text-white transition hover:brightness-95"
              >
                {t("actions.startTrial")}
              </button>
            ) : null}
            {canUpgradeToPro ? (
              <button
                type="button"
                className="inline-flex rounded-lg border border-[var(--ink)] bg-transparent px-5 py-3 text-[14px] font-medium text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--paper)]"
              >
                {t("actions.upgrade")}
              </button>
            ) : null}
            <p className="m-0 max-w-[300px] text-[13px] leading-[1.5] text-[var(--ink-mute)]">
              {t("actions.note")}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-5 max-[980px]:grid-cols-1">
        <UsageMeter
          title={t("usage.feedbackTitle")}
          value={t("usage.usedOfLimit", {
            used: formatNumber(usage.feedbackCount),
            limit: formatNumber(limits.feedbackPerMonth),
          })}
          helper={t("usage.feedbackHelper", { period: usage.period })}
          ratio={usageRatio(usage.feedbackCount, limits.feedbackPerMonth)}
        />
        <UsageMeter
          title={t("usage.scansTitle")}
          value={t("usage.usedOfLimit", {
            used: formatNumber(usage.aiScanCount),
            limit: formatNumber(scanEntitlement.limit),
          })}
          helper={t("usage.scansHelper", { period: usage.period })}
          ratio={usageRatio(usage.aiScanCount, scanEntitlement.limit)}
        />
        <UsageMeter
          title={t("usage.creditsTitle")}
          value={formatNumber(scanEntitlement.remaining)}
          helper={t("usage.creditsHelper", {
            grants: formatNumber(creditSummary.remaining),
          })}
          ratio={usageRatio(
            scanEntitlement.remaining,
            Math.max(scanEntitlement.limit, scanEntitlement.remaining),
          )}
        />
      </section>

      <section
        className={[
          "mt-5 rounded-lg border p-6",
          scansExhausted
            ? "border-[var(--accent)] bg-[var(--paper)]"
            : "border-[var(--rule)] bg-[var(--paper)]",
        ].join(" ")}
      >
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 max-[760px]:grid-cols-1">
          <div>
            <h2 className="m-0 font-[var(--f-display)] text-[30px] font-normal leading-tight text-[var(--ink)]">
              {scansExhausted
                ? t("scanLimit.exhaustedTitle")
                : t("scanLimit.availableTitle")}
            </h2>
            <p className="mt-3 mb-0 max-w-[680px] text-[14px] leading-[1.6] text-[var(--ink-2)]">
              {scansExhausted
                ? t("scanLimit.exhaustedBody", {
                    used: formatNumber(scanEntitlement.used),
                    limit: formatNumber(scanEntitlement.limit),
                  })
                : t("scanLimit.availableBody", {
                    remaining: formatNumber(scanEntitlement.remaining),
                    limit: formatNumber(scanEntitlement.limit),
                  })}
            </p>
            <p className="mt-2 mb-0 text-[13px] leading-[1.55] text-[var(--ink-mute)]">
              {t("scanLimit.manualFallback")}
            </p>
          </div>
          {scansExhausted && canUpgradeToPro ? (
            <button
              type="button"
              className="inline-flex rounded-lg bg-[var(--accent)] px-5 py-3 text-[14px] font-medium text-white transition hover:brightness-95"
            >
              {t("actions.upgrade")}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

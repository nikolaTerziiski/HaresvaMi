import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

const USAGE_TIME_ZONE = "Europe/Sofia";

export type MonthlyUsage = {
  period: string;
  feedbackCount: number;
  aiScanCount: number;
};

export type ScanCreditSummary = {
  granted: number;
  used: number;
  remaining: number;
};

export type ActiveScanCreditGrant = {
  id: string;
  creditsGranted: number;
  creditsUsed: number;
  remaining: number;
  expiresAt: string | null;
  createdAt: string;
};

export function getCurrentUsagePeriod(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: USAGE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  if (!year || !month) {
    throw new Error("Unable to calculate current usage period.");
  }

  return `${year}-${month}`;
}

export async function getMonthlyUsage(
  restaurantId: string,
): Promise<MonthlyUsage> {
  const supabase = createSupabaseServiceClient();
  const period = getCurrentUsagePeriod();

  const { data, error } = await supabase
    .from("usage_counters")
    .select("feedback_count, receipt_scans_count")
    .eq("restaurant_id", restaurantId)
    .eq("period", period)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to read monthly usage: ${error.message}`);
  }

  return {
    period,
    feedbackCount: data?.feedback_count ?? 0,
    aiScanCount: data?.receipt_scans_count ?? 0,
  };
}

async function incrementMonthlyUsage(
  restaurantId: string,
  delta: { feedback?: number; aiScans?: number },
): Promise<MonthlyUsage> {
  const supabase = createSupabaseServiceClient();
  const current = await getMonthlyUsage(restaurantId);
  const next = {
    feedback_count: current.feedbackCount + (delta.feedback ?? 0),
    receipt_scans_count: current.aiScanCount + (delta.aiScans ?? 0),
  };

  const { data, error } = await supabase
    .from("usage_counters")
    .upsert(
      {
        restaurant_id: restaurantId,
        period: current.period,
        ...next,
      },
      { onConflict: "restaurant_id,period" },
    )
    .select("feedback_count, receipt_scans_count")
    .single();

  if (error) {
    throw new Error(`Unable to update monthly usage: ${error.message}`);
  }

  return {
    period: current.period,
    feedbackCount: data.feedback_count,
    aiScanCount: data.receipt_scans_count,
  };
}

export async function incrementFeedbackUsage(
  restaurantId: string,
): Promise<MonthlyUsage> {
  return incrementMonthlyUsage(restaurantId, { feedback: 1 });
}

export async function incrementAiScanUsage(
  restaurantId: string,
): Promise<MonthlyUsage> {
  return incrementMonthlyUsage(restaurantId, { aiScans: 1 });
}

export async function getActiveScanCreditGrants(
  restaurantId: string,
  at = new Date(),
): Promise<ActiveScanCreditGrant[]> {
  const supabase = createSupabaseServiceClient();
  const timestamp = at.toISOString();

  const { data, error } = await supabase
    .from("scan_credit_grants")
    .select(
      "id, credits_granted, credits_used, expires_at, created_at",
    )
    .eq("restaurant_id", restaurantId)
    .lte("starts_at", timestamp)
    .or(`expires_at.is.null,expires_at.gt.${timestamp}`)
    .order("expires_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to read scan credits: ${error.message}`);
  }

  return (data ?? [])
    .map((grant) => {
      const remaining = grant.credits_granted - grant.credits_used;

      return {
        id: grant.id,
        creditsGranted: grant.credits_granted,
        creditsUsed: grant.credits_used,
        remaining,
        expiresAt: grant.expires_at,
        createdAt: grant.created_at,
      };
    })
    .filter((grant) => grant.remaining > 0);
}

export async function getActiveScanCreditSummary(
  restaurantId: string,
  at = new Date(),
): Promise<ScanCreditSummary> {
  const grants = await getActiveScanCreditGrants(restaurantId, at);

  return grants.reduce(
    (summary, grant) => ({
      granted: summary.granted + grant.creditsGranted,
      used: summary.used + grant.creditsUsed,
      remaining: summary.remaining + grant.remaining,
    }),
    { granted: 0, used: 0, remaining: 0 },
  );
}

export async function consumeActiveScanCreditGrant(
  restaurantId: string,
  at = new Date(),
): Promise<boolean> {
  const grants = await getActiveScanCreditGrants(restaurantId, at);
  const grant = grants[0];

  if (!grant) {
    return false;
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("scan_credit_grants")
    .update({ credits_used: grant.creditsUsed + 1 })
    .eq("id", grant.id)
    .eq("restaurant_id", restaurantId)
    .eq("credits_used", grant.creditsUsed);

  if (error) {
    throw new Error(`Unable to consume scan credit grant: ${error.message}`);
  }

  return true;
}

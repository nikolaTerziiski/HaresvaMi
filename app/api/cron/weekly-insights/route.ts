import { NextRequest, NextResponse } from "next/server";

import { runWeeklyInsightsCron } from "@/lib/insights/cron";

export const runtime = "nodejs";
// Vercel cron jobs time out after 300 s (Pro) — set max to match.
export const maxDuration = 300;

/**
 * GET /api/cron/weekly-insights
 *
 * Called by Vercel Cron on the schedule defined in vercel.json:
 *   "0 7 * * 1" — Mondays at 07:00 UTC (09:00 or 10:00 Europe/Sofia, DST-dependent).
 *
 * Vercel sends a GET request with Authorization: Bearer <CRON_SECRET>.
 * Set CRON_SECRET in Vercel project environment variables and enable Cron on
 * the Vercel dashboard (requires Vercel Pro for custom schedules).
 *
 * In development (NODE_ENV !== 'production') requests from localhost are
 * permitted without the secret so developers can trigger the job manually.
 */
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const host = request.headers.get("host") ?? "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.");

  if (!isDev || !isLocalhost) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!cronSecret || providedSecret !== cronSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runWeeklyInsightsCron();

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      push_sent: result.pushSent,
      push_pruned: result.pushPruned,
    });
  } catch (error) {
    console.error("API Error in /api/cron/weekly-insights:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Cron job failed.",
      },
      { status: 500 },
    );
  }
}

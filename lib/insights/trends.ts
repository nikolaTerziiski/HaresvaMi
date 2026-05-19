import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  loadInsightSessions,
  loadInsightMenuItems,
} from "@/lib/insights/queries";

const PAGE_SIZE = 1000;
const SESSION_ID_CHUNK_SIZE = 500;

export type DishTrendPoint = {
  weekStart: string;
  avgRating: number | null;
  sampleCount: number;
};

export type DishCandidate = {
  menuItemId: string;
  name: string;
  sampleCount: number;
};

function isoWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sofiaWeekMonday(now: Date): Date {
  const sofiaStr = now.toLocaleString("en-US", { timeZone: "Europe/Sofia" });
  const sofiaDate = new Date(sofiaStr);
  return isoWeekMonday(sofiaDate);
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function weekStartKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00.000+03:00`;
}

export async function loadDishWeeklyTrend(input: {
  restaurantId: string;
  menuItemId: string;
  weeksBack?: number;
}): Promise<DishTrendPoint[]> {
  const weeksBack = input.weeksBack ?? 12;
  const now = new Date();
  const currentMonday = sofiaWeekMonday(now);
  const windowStart = addWeeks(currentMonday, -(weeksBack - 1));
  const windowEnd = addWeeks(currentMonday, 1);

  const sessions = await loadInsightSessions({
    restaurantId: input.restaurantId,
    from: windowStart.toISOString(),
    to: windowEnd.toISOString(),
  });

  if (sessions.length === 0) {
    return buildEmptyBuckets(currentMonday, weeksBack);
  }

  const sessionIds = sessions.map((s) => s.id);
  const sessionCompletedAt = new Map(
    sessions.map((s) => [s.id, s.completed_at]),
  );

  const supabase = await createSupabaseServerClient();
  const ratings: Array<{ session_id: string; rating: number }> = [];

  for (
    let index = 0;
    index < sessionIds.length;
    index += SESSION_ID_CHUNK_SIZE
  ) {
    const chunk = sessionIds.slice(index, index + SESSION_ID_CHUNK_SIZE);
    let fromIndex = 0;

    while (true) {
      const { data, error } = await supabase
        .from("feedback_ratings")
        .select("session_id, rating")
        .in("session_id", chunk)
        .eq("menu_item_id", input.menuItemId)
        .range(fromIndex, fromIndex + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Unable to load dish trend ratings: ${error.message}`);
      }

      const page = data ?? [];
      ratings.push(...page);

      if (page.length < PAGE_SIZE) break;
      fromIndex += PAGE_SIZE;
    }
  }

  const buckets = new Map<string, { sum: number; count: number }>();

  for (let week = 0; week < weeksBack; week++) {
    const monday = addWeeks(windowStart, week);
    buckets.set(weekStartKey(monday), { sum: 0, count: 0 });
  }

  for (const rating of ratings) {
    const completedAt = sessionCompletedAt.get(rating.session_id);
    if (!completedAt) continue;

    const ratingDate = new Date(completedAt);
    const sofiaStr = ratingDate.toLocaleString("en-US", {
      timeZone: "Europe/Sofia",
    });
    const monday = isoWeekMonday(new Date(sofiaStr));
    const key = weekStartKey(monday);

    if (buckets.has(key)) {
      const bucket = buckets.get(key)!;
      bucket.sum += rating.rating;
      bucket.count += 1;
    }
  }

  return Array.from(buckets.entries()).map(([weekStart, bucket]) => ({
    weekStart,
    avgRating:
      bucket.count > 0
        ? Math.round((bucket.sum / bucket.count) * 10) / 10
        : null,
    sampleCount: bucket.count,
  }));
}

function buildEmptyBuckets(
  currentMonday: Date,
  weeksBack: number,
): DishTrendPoint[] {
  const windowStart = addWeeks(currentMonday, -(weeksBack - 1));
  return Array.from({ length: weeksBack }, (_, week) => ({
    weekStart: weekStartKey(addWeeks(windowStart, week)),
    avgRating: null,
    sampleCount: 0,
  }));
}

export async function loadDishCandidates(
  restaurantId: string,
): Promise<DishCandidate[]> {
  const now = new Date();
  const currentMonday = sofiaWeekMonday(now);
  const windowStart = addWeeks(currentMonday, -11);
  const windowEnd = addWeeks(currentMonday, 1);

  const [sessions, menuItems] = await Promise.all([
    loadInsightSessions({
      restaurantId,
      from: windowStart.toISOString(),
      to: windowEnd.toISOString(),
    }),
    loadInsightMenuItems(restaurantId),
  ]);

  const activeItems = menuItems.filter((item) => !item.deleted_at);

  if (sessions.length === 0) {
    return activeItems
      .map((item) => ({
        menuItemId: item.id,
        name: item.name_bg,
        sampleCount: 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "bg-BG"));
  }

  const sessionIds = sessions.map((s) => s.id);
  const supabase = await createSupabaseServerClient();
  const countByItem = new Map<string, number>();

  for (
    let index = 0;
    index < sessionIds.length;
    index += SESSION_ID_CHUNK_SIZE
  ) {
    const chunk = sessionIds.slice(index, index + SESSION_ID_CHUNK_SIZE);
    let fromIndex = 0;

    while (true) {
      const { data, error } = await supabase
        .from("feedback_ratings")
        .select("menu_item_id")
        .in("session_id", chunk)
        .range(fromIndex, fromIndex + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Unable to load dish candidates: ${error.message}`);
      }

      const page = data ?? [];

      for (const row of page) {
        countByItem.set(
          row.menu_item_id,
          (countByItem.get(row.menu_item_id) ?? 0) + 1,
        );
      }

      if (page.length < PAGE_SIZE) break;
      fromIndex += PAGE_SIZE;
    }
  }

  return activeItems
    .map((item) => ({
      menuItemId: item.id,
      name: item.name_bg,
      sampleCount: countByItem.get(item.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.sampleCount - a.sampleCount || a.name.localeCompare(b.name, "bg-BG"),
    );
}

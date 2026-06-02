import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

type SaveRecoveryCommentInput = {
  restaurantId: string;
  sessionId: string;
  comment: string;
};

export async function saveRecoveryComment({
  restaurantId,
  sessionId,
  comment,
}: SaveRecoveryCommentInput): Promise<{ ok: boolean }> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("feedback_sessions")
    .update({ recovery_comment: comment })
    .eq("id", sessionId)
    .eq("restaurant_id", restaurantId)
    .eq("overall_rating", "dislike")
    .not("completed_at", "is", null)
    .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to save recovery comment:", error);
    return { ok: false };
  }

  if (!data) {
    return { ok: false };
  }

  return { ok: true };
}

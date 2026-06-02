export type Sentiment = "happy" | "unhappy" | "neutral";

/**
 * Classify the overall sentiment of a feedback submission.
 *
 * Priority order:
 *  1. overallRating "like"    → "happy"  (regardless of star ratings)
 *  2. overallRating "dislike" → "unhappy" (overrides even 5-star ratings)
 *  3. No overallRating (null / undefined):
 *       - empty ratings array         → "neutral"
 *       - average >= 4.5              → "happy"
 *       - average <= 2.5              → "unhappy"
 *       - otherwise                   → "neutral"
 */
export function classifyFeedbackSentiment(
  overallRating: "like" | "dislike" | null | undefined,
  ratings: number[],
): Sentiment {
  if (overallRating === "like") return "happy";
  if (overallRating === "dislike") return "unhappy";

  if (ratings.length === 0) return "neutral";

  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

  if (average >= 4.5) return "happy";
  if (average <= 2.5) return "unhappy";
  return "neutral";
}

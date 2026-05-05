import type { EntitlementResult } from "@/lib/billing/entitlements-core";
import type { FeedbackSubmissionInput } from "@/lib/feedback/schema";

type FeedbackSubmitErrorCode =
  | "invalid_menu_items"
  | "empty_feedback"
  | "feedback_limit_reached";

export class FeedbackSubmitError extends Error {
  constructor(
    public readonly code: FeedbackSubmitErrorCode,
    message: string,
    public readonly entitlement?: EntitlementResult,
  ) {
    super(message);
    this.name = "FeedbackSubmitError";
  }
}

export function assertFeedbackHasContent(input: FeedbackSubmissionInput) {
  if (Object.keys(input.ratings).length > 0 || input.overallRating) {
    return;
  }

  throw new FeedbackSubmitError(
    "empty_feedback",
    "Feedback needs at least one dish rating or an overall rating.",
  );
}

export function assertRatingsBelongToSelectedItems(
  input: FeedbackSubmissionInput,
) {
  const itemIds = new Set(input.items.map((item) => item.id));
  const referencedIds = [
    ...Object.keys(input.ratings),
    ...Object.keys(input.comments),
  ];
  const invalidIds = referencedIds.filter((id) => !itemIds.has(id));

  if (invalidIds.length > 0) {
    throw new FeedbackSubmitError(
      "invalid_menu_items",
      "Feedback references items that are not selected.",
    );
  }
}

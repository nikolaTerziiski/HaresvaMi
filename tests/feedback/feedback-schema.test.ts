import assert from "node:assert/strict";
import test from "node:test";

import { feedbackSubmissionSchema } from "@/lib/feedback/schema";
import {
  assertFeedbackHasContent,
  assertRatingsBelongToSelectedItems,
  FeedbackSubmitError,
} from "@/lib/feedback/validation";

const restaurantId = "11111111-1111-4111-8111-111111111111";
const itemId = "22222222-2222-4222-8222-222222222222";
const otherItemId = "33333333-3333-4333-8333-333333333333";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    restaurantId,
    items: [
      {
        id: itemId,
        name: "Кебапче",
      },
    ],
    ...overrides,
  };
}

function assertFeedbackError(
  error: unknown,
  code: FeedbackSubmitError["code"],
) {
  assert.ok(error instanceof FeedbackSubmitError);
  assert.equal(error.code, code);
}

test("valid payload with one item rating passes", () => {
  const parsed = feedbackSubmissionSchema.parse(
    payload({
      ratings: {
        [itemId]: 5,
      },
    }),
  );

  assert.equal(parsed.ratings[itemId], 5);
  assert.equal(parsed.items[0]?.id, itemId);
});

test("valid payload with only overallRating passes", () => {
  const parsed = feedbackSubmissionSchema.parse(
    payload({
      overallRating: "like",
    }),
  );

  assert.equal(parsed.overallRating, "like");
  assert.deepEqual(parsed.ratings, {});
});

test("item rating must be 1-5", () => {
  assert.equal(
    feedbackSubmissionSchema.safeParse(
      payload({
        ratings: {
          [itemId]: 0,
        },
      }),
    ).success,
    false,
  );
  assert.equal(
    feedbackSubmissionSchema.safeParse(
      payload({
        ratings: {
          [itemId]: 6,
        },
      }),
    ).success,
    false,
  );
});

test("menu item id must be uuid", () => {
  assert.equal(
    feedbackSubmissionSchema.safeParse(
      payload({
        items: [
          {
            id: "not-a-uuid",
            name: "Кебапче",
          },
        ],
      }),
    ).success,
    false,
  );
});

test("comments max length is 500", () => {
  assert.equal(
    feedbackSubmissionSchema.safeParse(
      payload({
        comments: {
          [itemId]: "a".repeat(500),
        },
        overallRating: "like",
      }),
    ).success,
    true,
  );
  assert.equal(
    feedbackSubmissionSchema.safeParse(
      payload({
        comments: {
          [itemId]: "a".repeat(501),
        },
        overallRating: "like",
      }),
    ).success,
    false,
  );
});

test("customerLanguage defaults to bg", () => {
  const parsed = feedbackSubmissionSchema.parse(
    payload({
      overallRating: "dislike",
    }),
  );

  assert.equal(parsed.customerLanguage, "bg");
});

test("items array must contain at least one item", () => {
  assert.equal(
    feedbackSubmissionSchema.safeParse(
      payload({
        items: [],
        overallRating: "like",
      }),
    ).success,
    false,
  );
});

test("feedback with no ratings and no overall rating fails", () => {
  const parsed = feedbackSubmissionSchema.parse(payload());

  assert.throws(
    () => assertFeedbackHasContent(parsed),
    (error) => {
      assertFeedbackError(error, "empty_feedback");
      return true;
    },
  );
});

test("ratings referencing non-selected items fail", () => {
  const parsed = feedbackSubmissionSchema.parse(
    payload({
      ratings: {
        [otherItemId]: 4,
      },
    }),
  );

  assert.throws(
    () => assertRatingsBelongToSelectedItems(parsed),
    (error) => {
      assertFeedbackError(error, "invalid_menu_items");
      return true;
    },
  );
});

test("comments referencing non-selected items fail", () => {
  const parsed = feedbackSubmissionSchema.parse(
    payload({
      comments: {
        [otherItemId]: "Не беше за това ястие.",
      },
      overallRating: "like",
    }),
  );

  assert.throws(
    () => assertRatingsBelongToSelectedItems(parsed),
    (error) => {
      assertFeedbackError(error, "invalid_menu_items");
      return true;
    },
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import { recoveryCommentSchema } from "@/lib/feedback/schema";

const restaurantId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    restaurantId,
    sessionId,
    comment: "Храната беше студена.",
    ...overrides,
  };
}

test("valid recovery comment passes", () => {
  const parsed = recoveryCommentSchema.parse(payload());
  assert.equal(parsed.restaurantId, restaurantId);
  assert.equal(parsed.sessionId, sessionId);
  assert.equal(parsed.comment, "Храната беше студена.");
});

test("comment is trimmed", () => {
  const parsed = recoveryCommentSchema.parse(payload({ comment: "  hello  " }));
  assert.equal(parsed.comment, "hello");
});

test("empty comment fails", () => {
  assert.equal(
    recoveryCommentSchema.safeParse(payload({ comment: "" })).success,
    false,
  );
});

test("whitespace-only comment fails", () => {
  assert.equal(
    recoveryCommentSchema.safeParse(payload({ comment: "   " })).success,
    false,
  );
});

test("comment over 1000 chars fails", () => {
  assert.equal(
    recoveryCommentSchema.safeParse(payload({ comment: "a".repeat(1001) }))
      .success,
    false,
  );
});

test("comment at exactly 1000 chars passes", () => {
  assert.equal(
    recoveryCommentSchema.safeParse(payload({ comment: "a".repeat(1000) }))
      .success,
    true,
  );
});

test("non-uuid restaurantId fails", () => {
  assert.equal(
    recoveryCommentSchema.safeParse(payload({ restaurantId: "not-a-uuid" }))
      .success,
    false,
  );
});

test("non-uuid sessionId fails", () => {
  assert.equal(
    recoveryCommentSchema.safeParse(payload({ sessionId: "not-a-uuid" }))
      .success,
    false,
  );
});

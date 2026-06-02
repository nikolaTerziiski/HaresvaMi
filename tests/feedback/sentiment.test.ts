import assert from "node:assert/strict";
import test from "node:test";

import { classifyFeedbackSentiment } from "@/lib/feedback/sentiment";

test("like overrides low star ratings → happy", () => {
  assert.equal(classifyFeedbackSentiment("like", [1, 2]), "happy");
});

test("dislike overrides high star ratings → unhappy", () => {
  assert.equal(classifyFeedbackSentiment("dislike", [5, 5]), "unhappy");
});

test("null overallRating with avg 4.5 → happy", () => {
  assert.equal(classifyFeedbackSentiment(null, [5, 4]), "happy");
});

test("null overallRating with avg 2.5 → unhappy", () => {
  assert.equal(classifyFeedbackSentiment(null, [3, 2]), "unhappy");
});

test("null overallRating with avg 3.5 → neutral", () => {
  assert.equal(classifyFeedbackSentiment(null, [4, 3]), "neutral");
});

test("null overallRating with empty ratings → neutral", () => {
  assert.equal(classifyFeedbackSentiment(null, []), "neutral");
});

test("undefined overallRating with all 5s → happy", () => {
  assert.equal(classifyFeedbackSentiment(undefined, [5, 5, 5]), "happy");
});

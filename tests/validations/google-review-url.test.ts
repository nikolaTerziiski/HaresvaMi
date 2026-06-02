import assert from "node:assert/strict";
import test from "node:test";

import { googleReviewUrlSchema } from "@/lib/validations/restaurant";

function accepts(url: string) {
  const result = googleReviewUrlSchema.safeParse(url);
  assert.equal(
    result.success,
    true,
    `Expected "${url}" to be accepted but it was rejected`,
  );
}

function rejects(url: string) {
  const result = googleReviewUrlSchema.safeParse(url);
  assert.equal(
    result.success,
    false,
    `Expected "${url}" to be rejected but it was accepted`,
  );
  if (!result.success) {
    const messages = result.error.issues.map((e) => e.message);
    assert.ok(
      messages.includes("invalid"),
      `Expected rejection message "invalid" but got: ${messages.join(", ")}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Accepted URLs
// ---------------------------------------------------------------------------

test("accepts empty string (field is optional)", () => {
  accepts("");
});

test("accepts g.page short link", () => {
  accepts("https://g.page/r/abc");
});

test("accepts search.google.com review URL", () => {
  accepts("https://search.google.com/local/writereview?placeid=X");
});

test("accepts maps.app.goo.gl short link", () => {
  accepts("https://maps.app.goo.gl/xyz");
});

test("accepts www.google.com URL", () => {
  accepts("https://www.google.com/maps/place/someplace");
});

test("accepts maps.google.com URL", () => {
  accepts("https://maps.google.com/maps?cid=12345");
});

// ---------------------------------------------------------------------------
// Rejected URLs
// ---------------------------------------------------------------------------

test("rejects arbitrary external domain", () => {
  rejects("https://evil.com");
});

test("rejects domain with google.com as a query parameter (URL parameter injection)", () => {
  rejects("https://evil.com?x=google.com");
});

test("rejects http (non-https) g.page URL", () => {
  rejects("http://g.page/x");
});

test("rejects plain non-URL string", () => {
  rejects("not-a-url");
});

test("rejects empty-ish non-URL string with a space", () => {
  rejects("javascript:alert(1)");
});

test("rejects a URL that has google.com in the path but not the hostname", () => {
  rejects("https://evil.com/google.com/review");
});

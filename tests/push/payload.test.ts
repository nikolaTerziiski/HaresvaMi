import assert from "node:assert/strict";
import test from "node:test";

import { buildInsightPayload } from "@/lib/push/payload";

test("payload title is the restaurant name", () => {
  const payload = buildInsightPayload("Механа Белия Лебед", "Добра седмица!");
  assert.equal(payload.title, "Механа Белия Лебед");
});

test("payload url is /dashboard/insights", () => {
  const payload = buildInsightPayload("Ресторант", "Текст");
  assert.equal(payload.url, "/dashboard/insights");
});

test("payload tag is weekly-insight", () => {
  const payload = buildInsightPayload("Ресторант", "Текст");
  assert.equal(payload.tag, "weekly-insight");
});

test("body under 240 chars is not truncated", () => {
  const short = "Кебапчето е добро тази седмица.";
  const payload = buildInsightPayload("Ресторант", short);
  assert.equal(payload.body, short);
});

test("body over 240 chars is truncated to 240", () => {
  const long = "А".repeat(300);
  const payload = buildInsightPayload("Ресторант", long);
  assert.equal(payload.body.length, 240);
  assert.equal(payload.body, long.substring(0, 240));
});

test("body exactly 240 chars is not truncated", () => {
  const exact = "Б".repeat(240);
  const payload = buildInsightPayload("Ресторант", exact);
  assert.equal(payload.body.length, 240);
  assert.equal(payload.body, exact);
});

test("no PII in body: restaurant_id not included", () => {
  const restaurantId = "550e8400-e29b-41d4-a716-446655440000";
  const summary = "Имаш добри отзиви тази седмица.";
  const payload = buildInsightPayload("Механа Тест", summary);
  assert.ok(
    !payload.body.includes(restaurantId),
    "restaurant_id must not appear in body",
  );
});

test("no PII in body: owner email not included when summary is clean", () => {
  const ownerEmail = "owner@example.com";
  const summary = "Отличен резултат за Шопската!";
  const payload = buildInsightPayload("Ресторант Слънце", summary);
  assert.ok(
    !payload.body.includes(ownerEmail),
    "owner email must not appear in body",
  );
});

test("no PII in body: title contains only restaurant name", () => {
  const payload = buildInsightPayload("Ресторант Слънце", "Кебапчето е добро.");
  assert.ok(!payload.title.includes("@"), "title must not look like an email");
  assert.ok(
    !/[0-9a-f]{8}-[0-9a-f]{4}/.test(payload.title),
    "title must not look like a UUID",
  );
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0016_restaurants_update_column_grants.sql",
);
const sql = readFileSync(migrationPath, "utf8");
const compactSql = sql.replace(/\s+/g, " ");

function hasStatement(pattern: RegExp): boolean {
  return pattern.test(compactSql);
}

test("0016 migration file exists and is non-empty", () => {
  assert.ok(sql.length > 0, "migration file must not be empty");
});

test("0016 REVOKEs UPDATE from authenticated", () => {
  assert.ok(
    hasStatement(
      /REVOKE\s+UPDATE\s+ON\s+public\.restaurants\s+FROM\s+authenticated/i,
    ),
    "must REVOKE UPDATE from authenticated",
  );
});

test("0016 REVOKEs UPDATE from anon", () => {
  assert.ok(
    hasStatement(
      /REVOKE\s+UPDATE\s+ON\s+public\.restaurants\s+FROM[\w\s,]*anon/i,
    ),
    "must REVOKE UPDATE from anon",
  );
});

test("0016 GRANTs UPDATE on name column", () => {
  assert.ok(
    hasStatement(
      /GRANT\s+UPDATE\s*\([^)]*\bname\b[^)]*\)\s+ON\s+public\.restaurants/i,
    ),
    "must GRANT UPDATE including name column",
  );
});

test("0016 GRANTs UPDATE on city, address, phone columns", () => {
  const grantMatch = compactSql.match(
    /GRANT\s+UPDATE\s*\(([^)]+)\)\s+ON\s+public\.restaurants/i,
  );
  assert.ok(
    grantMatch,
    "must have a GRANT UPDATE (...) ON public.restaurants statement",
  );
  const grantedCols = grantMatch![1];
  assert.ok(/\bcity\b/.test(grantedCols), "must grant city");
  assert.ok(/\baddress\b/.test(grantedCols), "must grant address");
  assert.ok(/\bphone\b/.test(grantedCols), "must grant phone");
});

test("0016 GRANTs UPDATE on language_default and customer_languages", () => {
  const grantMatch = compactSql.match(
    /GRANT\s+UPDATE\s*\(([^)]+)\)\s+ON\s+public\.restaurants/i,
  );
  assert.ok(
    grantMatch,
    "must have a GRANT UPDATE (...) ON public.restaurants statement",
  );
  const grantedCols = grantMatch![1];
  assert.ok(
    /\blanguage_default\b/.test(grantedCols),
    "must grant language_default",
  );
  assert.ok(
    /\bcustomer_languages\b/.test(grantedCols),
    "must grant customer_languages",
  );
});

test("0016 GRANTs UPDATE on logo_url, google_review_url, google_place_id", () => {
  const grantMatch = compactSql.match(
    /GRANT\s+UPDATE\s*\(([^)]+)\)\s+ON\s+public\.restaurants/i,
  );
  assert.ok(
    grantMatch,
    "must have a GRANT UPDATE (...) ON public.restaurants statement",
  );
  const grantedCols = grantMatch![1];
  assert.ok(/\blogo_url\b/.test(grantedCols), "must grant logo_url");
  assert.ok(
    /\bgoogle_review_url\b/.test(grantedCols),
    "must grant google_review_url",
  );
  assert.ok(
    /\bgoogle_place_id\b/.test(grantedCols),
    "must grant google_place_id",
  );
});

test("0016 does NOT grant tier column", () => {
  const grantMatch = compactSql.match(
    /GRANT\s+UPDATE\s*\(([^)]+)\)\s+ON\s+public\.restaurants/i,
  );
  assert.ok(
    grantMatch,
    "must have a GRANT UPDATE (...) ON public.restaurants statement",
  );
  const grantedCols = grantMatch![1];
  assert.doesNotMatch(grantedCols, /\btier\b/, "must NOT grant tier");
});

test("0016 does NOT grant subscription_status column", () => {
  const grantMatch = compactSql.match(
    /GRANT\s+UPDATE\s*\(([^)]+)\)\s+ON\s+public\.restaurants/i,
  );
  assert.ok(
    grantMatch,
    "must have a GRANT UPDATE (...) ON public.restaurants statement",
  );
  const grantedCols = grantMatch![1];
  assert.doesNotMatch(
    grantedCols,
    /\bsubscription_status\b/,
    "must NOT grant subscription_status",
  );
});

test("0016 does NOT grant stripe_customer_id column", () => {
  const grantMatch = compactSql.match(
    /GRANT\s+UPDATE\s*\(([^)]+)\)\s+ON\s+public\.restaurants/i,
  );
  assert.ok(
    grantMatch,
    "must have a GRANT UPDATE (...) ON public.restaurants statement",
  );
  const grantedCols = grantMatch![1];
  assert.doesNotMatch(
    grantedCols,
    /\bstripe_customer_id\b/,
    "must NOT grant stripe_customer_id",
  );
});

test("0016 does NOT grant stripe_subscription_id column", () => {
  const grantMatch = compactSql.match(
    /GRANT\s+UPDATE\s*\(([^)]+)\)\s+ON\s+public\.restaurants/i,
  );
  assert.ok(
    grantMatch,
    "must have a GRANT UPDATE (...) ON public.restaurants statement",
  );
  const grantedCols = grantMatch![1];
  assert.doesNotMatch(
    grantedCols,
    /\bstripe_subscription_id\b/,
    "must NOT grant stripe_subscription_id",
  );
});

test("0016 does NOT grant trial_ends_at column", () => {
  const grantMatch = compactSql.match(
    /GRANT\s+UPDATE\s*\(([^)]+)\)\s+ON\s+public\.restaurants/i,
  );
  assert.ok(
    grantMatch,
    "must have a GRANT UPDATE (...) ON public.restaurants statement",
  );
  const grantedCols = grantMatch![1];
  assert.doesNotMatch(
    grantedCols,
    /\btrial_ends_at\b/,
    "must NOT grant trial_ends_at",
  );
});

test("0016 does NOT grant current_period_ends_at column", () => {
  const grantMatch = compactSql.match(
    /GRANT\s+UPDATE\s*\(([^)]+)\)\s+ON\s+public\.restaurants/i,
  );
  assert.ok(
    grantMatch,
    "must have a GRANT UPDATE (...) ON public.restaurants statement",
  );
  const grantedCols = grantMatch![1];
  assert.doesNotMatch(
    grantedCols,
    /\bcurrent_period_ends_at\b/,
    "must NOT grant current_period_ends_at",
  );
});

test("0016 ALTERs the owners_update_own_restaurant policy with WITH CHECK", () => {
  assert.ok(
    hasStatement(
      /ALTER\s+POLICY\s+"owners_update_own_restaurant"\s+ON\s+public\.restaurants/i,
    ),
    "must ALTER POLICY owners_update_own_restaurant",
  );
  assert.ok(
    hasStatement(/WITH\s+CHECK\s*\(\s*auth\.uid\(\)\s*=\s*owner_id\s*\)/i),
    "must have WITH CHECK (auth.uid() = owner_id)",
  );
});

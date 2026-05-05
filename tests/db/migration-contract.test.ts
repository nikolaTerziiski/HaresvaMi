import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

type Migration = {
  name: string;
  sql: string;
};

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const migrations = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map<Migration>((name) => ({
    name,
    sql: readFileSync(join(migrationsDir, name), "utf8"),
  }));

const allSql = migrations.map((migration) => migration.sql).join("\n");
const compactSql = allSql.replace(/\s+/g, " ");

const publicFeedbackWritePolicies = [
  "public_create_sessions",
  "public_update_recent_sessions",
  "public_create_ratings",
];

function hasStatement(sql: string, pattern: RegExp) {
  return pattern.test(sql.replace(/\s+/g, " "));
}

test("migrations do not contain naked prose lines known to break SQL", () => {
  const nakedProseLine =
    /^\s*(Apply|Run this|Owners?|Anonymous|Kiosk|No public|Application writes|Stores|Raw tokens|One per owner|Dishes|Learned dictionary|One receipt|Per-item|Tracks|Paid plans|Trial)\b/i;
  const offenders = migrations.flatMap((migration) =>
    migration.sql
      .split(/\r?\n/)
      .map((line, index) => ({
        location: `${migration.name}:${index + 1}`,
        line: line.trim(),
      }))
      .filter(({ line }) => line.length > 0)
      .filter(({ line }) => !line.startsWith("--"))
      .filter(({ line }) => nakedProseLine.test(line)),
  );

  assert.deepEqual(offenders, []);
});

test("restaurants tier constraint includes free, starter, and pro", () => {
  assert.match(
    compactSql,
    /CHECK\s*\(\s*tier\s+IN\s*\(\s*'free'\s*,\s*'starter'\s*,\s*'pro'\s*\)\s*\)/i,
  );
});

test("kiosk_sessions table exists", () => {
  assert.ok(
    hasStatement(allSql, /CREATE\s+TABLE\s+public\.kiosk_sessions\s*\(/i),
  );
});

test("kiosk_sessions token_hash is unique", () => {
  assert.ok(hasStatement(allSql, /token_hash\s+TEXT\s+UNIQUE\s+NOT\s+NULL/i));
});

test("public feedback insert and update policies are absent in final migration state", () => {
  const activePolicies = new Set<string>();

  for (const migration of migrations) {
    for (const policyName of publicFeedbackWritePolicies) {
      if (
        hasStatement(
          migration.sql,
          new RegExp(`CREATE\\s+POLICY\\s+"${policyName}"`, "i"),
        )
      ) {
        activePolicies.add(policyName);
      }

      if (
        hasStatement(
          migration.sql,
          new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+"${policyName}"`, "i"),
        )
      ) {
        activePolicies.delete(policyName);
      }
    }
  }

  assert.deepEqual([...activePolicies].sort(), []);
});

test("RLS is enabled for kiosk_sessions", () => {
  assert.ok(
    hasStatement(
      allSql,
      /ALTER\s+TABLE\s+public\.kiosk_sessions\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY\s*;/i,
    ),
  );
});

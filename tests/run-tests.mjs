import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const testsDir = join(process.cwd(), "tests");

function findTestFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return findTestFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".test.ts")
      ? [relative(process.cwd(), entryPath)]
      : [];
  });
}

if (!existsSync(testsDir)) {
  console.error("Could not find tests directory.");
  process.exit(1);
}

const testFiles = findTestFiles(testsDir).sort();

if (testFiles.length === 0) {
  console.error("Could not find any *.test.ts files.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...testFiles],
  {
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);

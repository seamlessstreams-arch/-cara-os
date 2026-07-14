#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: no member-level `as Type` casts in seed files.
//
// A seed record ending `} as RestraintRecord` hides its missing required
// fields from tsc — that exact pattern kept /api/v1/restraint-intelligence
// dead (500) through the entire 1178→0 type-baseline burn-down, because the
// one cast concealed the one crash. Seed literals must type-check as plain
// typed declarations so an incomplete record is a build-visible error.
//
// Allowed: `as const`, `satisfies`, and whole-file idioms outside seed files.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const SEED_FILE_PATTERNS = [/^seed.*\.ts$/, /-seeds?\.ts$/];
const roots = ["src/lib"];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      yield* walk(full);
    } else if (SEED_FILE_PATTERNS.some((re) => re.test(entry.name))) {
      yield full;
    }
  }
}

const violations = [];
for (const root of roots) {
  for (const file of walk(root)) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const m = line.match(/\}\s+as\s+([A-Z][A-Za-z0-9_]*)\s*[,;)\]]?\s*$/);
      if (m && m[1] !== "const") {
        violations.push(`${file}:${i + 1}  } as ${m[1]}`);
      }
    });
  }
}

if (violations.length > 0) {
  console.error("Seed-cast guard FAILED — member-level casts hide incomplete seed records from tsc:");
  for (const v of violations) console.error("  " + v);
  console.error("Declare the array/record with an explicit type annotation instead, and complete the record.");
  process.exit(1);
}
console.log("Seed-cast guard passed: no member-level casts in seed files.");

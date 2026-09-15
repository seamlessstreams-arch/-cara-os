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
//
// Second check, added after the behaviour-log incident: a WHOLE-ARRAY
// terminator, `] as BehaviourEntry[];`, hides exactly the same class and this
// guard could not see it — partly because it only matched `} as Type` on a
// member, and partly because store.ts is not named like a seed file and was
// never scanned at all. 17 seeded behaviour rows carried words their own type
// does not admit (direction "concerning" for "concern", intensity "medium" /
// "severe" for "moderate" / "critical"), which made the home's own
// high/critical counter read 5 where the truth is 9. Three sanctions rows said
// reward_type "activity" where SRRewardType says "activity_reward", so the
// Type column on /sanctions-rewards rendered blank for them.
//
// The two checks keep separate scopes on purpose. Member-level casts are
// checked in seed-named files only; store.ts carries 425 of them and burning
// those down is its own piece of work. Whole-array terminators are checked in
// store.ts too, where the count is now zero and can stay there.
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

// store.ts holds the seed collections but is not named like a seed file, so the
// member check never reached it. Its `const db = {` CRUD surface below is a
// different thing — those casts build a record from partial input and are the
// create API's problem, not seed data's — so only the seed region above it is
// in scope here.
function seedRegionEnd(text) {
  const i = text.search(/^(export )?const db = \{/m);
  return i === -1 ? text.length : text.slice(0, i).split("\n").length;
}

const memberFiles = [...new Set([...roots.flatMap((r) => [...walk(r)]), "src/lib/db/store.ts"])];
for (const file of memberFiles) {
  {
    const text = fs.readFileSync(file, "utf8");
    const limit = file.endsWith("db/store.ts") ? seedRegionEnd(text) : Infinity;
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (i >= limit) return;
      const m = line.match(/\}\s+as\s+([A-Z][A-Za-z0-9_]*)\s*[,;)\]]?\s*$/);
      if (m && m[1] !== "const") {
        violations.push(`${file}:${i + 1}  } as ${m[1]}`);
      }
    });
  }
}

// ── Whole-array terminators: `] as SomeType[];` ─────────────────────────────
// Wider scope than the member check: store.ts holds most of the seed data and
// does not match the seed-file naming patterns.
const ARRAY_CAST_FILES = ["src/lib/db/store.ts"];
for (const root of roots) for (const file of walk(root)) ARRAY_CAST_FILES.push(file);

const arrayCastViolations = [];
for (const file of [...new Set(ARRAY_CAST_FILES)]) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const m = line.match(/^\s*\]\s+as\s+([A-Z][A-Za-z0-9_]*)\[\]\s*;\s*$/);
    if (m) arrayCastViolations.push(`${file}:${i + 1}  ] as ${m[1]}[]`);
  });
}

if (violations.length > 0 || arrayCastViolations.length > 0) {
  if (violations.length > 0) {
    console.error("Seed-cast guard FAILED — member-level casts hide incomplete seed records from tsc:");
    for (const v of violations) console.error("  " + v);
    console.error("Declare the array/record with an explicit type annotation instead, and complete the record.");
  }
  if (arrayCastViolations.length > 0) {
    console.error("Seed-cast guard FAILED — a whole-array cast hides every row in the array from tsc:");
    for (const v of arrayCastViolations) console.error("  " + v);
    console.error("Annotate the declaration instead (`const X: Row[] = [`), or assign to an already-typed");
    console.error("property and drop the cast, so each row is checked against the type it claims to be.");
  }
  process.exit(1);
}
console.log(
  `Seed-cast guard passed: no member-level casts in seed files, no whole-array casts in ${new Set(ARRAY_CAST_FILES).size} seed/store file(s).`,
);

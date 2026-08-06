#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
// CARA — DAL ADOPTION GUARD
//
// The DAL migration programme (#841–#847) moved every migratable API route onto
// the dual-mode `dal.<collection>` layer. Exactly EIGHT routes legitimately
// still call getStore() — each for a structural reason documented in the
// allowlist below. This guard pins that set: a NEW route calling getStore()
// (or a new call creeping into a migrated route) fails CI with instructions.
//
// Comment mentions of "getStore" don't count — only code-level calls do.
// ══════════════════════════════════════════════════════════════════════════════
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Route files allowed to call getStore(), with the structural reason.
const ALLOW = new Map([
  ["src/app/api/v1/self-healing/route.ts", "applyRepair(store) mutates arbitrary collections by design"],
  ["src/app/api/v1/cara/route.ts", "buildAskSnapshot boundary (full-Store builders downstream)"],
  ["src/app/api/v1/cara/chat/route.ts", "buildAskSnapshot boundary (full-Store builders downstream)"],
  ["src/app/api/v1/org-learning-report/route.ts", "buildOrgLearningInputFromStore is typed to the full Store"],
  ["src/app/api/v1/org-learning-report/export/route.ts", "buildOrgLearningInputFromStore is typed to the full Store (same boundary as the sibling route)"],
  ["src/app/api/v1/institutional-self-check/route.ts", "builders typed to the full Store"],
  ["src/app/api/v1/plan-currency/route.ts", "dynamic-key access — collections not statically known"],
  ["src/app/api/v1/shift-briefing/route.ts", "dynamic-key access — collections not statically known"],
  ["src/app/api/cara/system-health/route.ts", "getStore() != null is the liveness probe itself"],
]);

function stripCommentsAndStrings(src) {
  // Order matters: block comments, then line comments, then string/template
  // literals (so a "//" inside a string can't hide code after it).
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
}

const routes = execSync('find src/app/api -name route.ts', { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .map((p) => p.replace(/^\.\//, ""));

const offenders = [];
for (const file of routes) {
  const code = stripCommentsAndStrings(fs.readFileSync(path.resolve(file), "utf8"));
  if (/\bgetStore\s*\(/.test(code) && !ALLOW.has(file)) offenders.push(file);
}

const missing = [...ALLOW.keys()].filter((f) => !fs.existsSync(f));

if (offenders.length === 0 && missing.length === 0) {
  console.log(
    `check-dal-adoption: no route outside the ${ALLOW.size}-route allowlist calls getStore() ✓`,
  );
  process.exit(0);
}

if (offenders.length) {
  console.error("check-dal-adoption: routes calling getStore() outside the allowlist:\n");
  for (const f of offenders) console.error(`  ✗ ${f}`);
  console.error(
    "\nAPI routes read and write through the dual-mode dal (`import { dal } from \"@/lib/db\"`)\n" +
      "so a Supabase table landing changes only the DAL block. Compose the collections the\n" +
      "route needs via `Promise.all([dal.<col>.findAll(), …])` (see #841/#844/#847 recipes in\n" +
      "the repo history). If the route is GENUINELY structural (full-Store builder, dynamic\n" +
      "keys, store-mutating repair), add it to the allowlist here WITH its reason.",
  );
}
if (missing.length) {
  console.error("\ncheck-dal-adoption: allowlisted files that no longer exist (prune the list):");
  for (const f of missing) console.error(`  – ${f}`);
}
process.exit(1);

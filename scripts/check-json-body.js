#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: API routes must not parse JSON bodies raw.
//
// `await req.json()` throws on malformed JSON, which surfaces as an unhandled
// 500. The platform idiom is readJsonBody (src/lib/http/read-json.ts): empty
// body → {}, malformed → a 400 the handler returns. 685 routes use it; this
// guard keeps new routes from regressing to the raw call.
//
// Allowed:
//   • `await req.json().catch(...)` — explicit inline fallback;
//   • the legacy allowlisted files below, each verified to wrap the call in a
//     try/catch with deliberate semantics (zod-parse → 400, or default-false).
//     Do not add to this list — use readJsonBody in new code.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const LEGACY_ALLOWLIST = new Set([
  "src/app/api/v1/comms/messages/[id]/receipt/route.ts",
  "src/app/api/cara/ofsted-readiness/route.ts",
  "src/app/api/cara/signals/generate/route.ts",
  "src/app/api/cara/ai-review/route.ts",
  "src/app/api/cara/mock-inspection/start/route.ts",
]);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith(".ts")) yield full;
  }
}

const violations = [];
for (const file of walk("src/app/api")) {
  const rel = file.split(path.sep).join("/");
  if (LEGACY_ALLOWLIST.has(rel)) continue;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const m = line.match(/await\s+(req|request)\s*\.json\(\)/);
    if (m && !/\.json\(\)\s*\.catch\(/.test(line)) {
      violations.push(`${rel}:${i + 1}  ${line.trim().slice(0, 90)}`);
    }
  });
}

if (violations.length > 0) {
  console.error("JSON-body guard FAILED — raw req.json() throws a 500 on malformed bodies:");
  for (const v of violations) console.error("  " + v);
  console.error("Use readJsonBody from @/lib/http/read-json (empty → {}, malformed → returned 400).");
  process.exit(1);
}
console.log("JSON-body guard passed: no unguarded req.json() in API routes.");

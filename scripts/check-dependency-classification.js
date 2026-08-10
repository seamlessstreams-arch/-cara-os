#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: shipped code must not import a devDependency.
//
// `docx` sat in devDependencies while six src/lib/**-docx.ts modules imported
// it at module top level, behind seven LIVE export routes (reg44-report,
// inspection-intelligence, org-learning-report, strategy-discussion,
// staff-practice-skills, cpie/child-twin, compliance-documents). It worked only
// because Vercel installs devDependencies during the build and Next traces the
// import into the function bundle — a production-only install (npm ci
// --omit=dev) would have left every DOCX export throwing at first request.
//
// Nothing else catches this. tsc resolves the types either way, the 115k-test
// suite runs with everything installed, and `next build` bundles it happily.
// The failure only appears in a production install, which is the worst place to
// find out. So it gets a guard.
//
// Scope is src/ minus tests. scripts/ and e2e/ are build- and test-time code
// and may import devDependencies freely (qrcode and @playwright/test do).
//
// `import type { X } from "pkg"` is allowed: type-only imports are erased
// before the module is ever resolved at runtime, so they cost nothing in
// production. Value imports of the same package are not.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const dev = new Set(Object.keys(pkg.devDependencies || {}));

// Strip `import type ...` statements first so their specifiers never reach the
// value-import matcher below.
const TYPE_ONLY = /\bimport\s+type\s[\s\S]*?from\s*["'][^"']+["']/g;
const VALUE_IMPORT = /(?:\bfrom|\bimport\(|\brequire\()\s*["']([^"'.][^"']*)["']/g;

// "@scope/name/deep/path" -> "@scope/name";  "name/deep/path" -> "name"
function packageOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      yield* walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) {
      yield full;
    }
  }
}

const violations = [];
for (const file of walk("src")) {
  const rel = file.split(path.sep).join("/");
  const source = fs.readFileSync(file, "utf8").replace(TYPE_ONLY, "");
  const seen = new Set();
  for (const m of source.matchAll(VALUE_IMPORT)) {
    const name = packageOf(m[1]);
    if (dev.has(name) && !seen.has(name)) {
      seen.add(name);
      violations.push(`${rel}  imports "${m[1]}"  (${name} is a devDependency)`);
    }
  }
}

if (violations.length > 0) {
  console.error("Dependency-classification guard FAILED — shipped code imports devDependencies:");
  for (const v of violations) console.error("  " + v);
  console.error(
    "\nA production install (npm ci --omit=dev) would not have these, so the route\n" +
      "throws at first request. Move the package to dependencies, or make the\n" +
      "import type-only if that is all it was."
  );
  process.exit(1);
}
console.log(`Dependency-classification guard passed: no devDependency imported by shipped src/ code (${dev.size} dev packages checked).`);

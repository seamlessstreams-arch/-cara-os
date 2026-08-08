#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: "use client" files must not import server-only Supabase modules.
//
// The bug class this pins shut: 105 *-service.ts files were once stamped
// "use client" while importing the SERVICE-ROLE Supabase client — authorised
// callers 500'd (the tell: 403 for unauth + 500 for authorised). The class was
// burned to zero; a generation step re-stamping the pragma could silently
// reopen it. This guard makes the closure structural.
//
// A violation is: a top-of-file "use client" directive AND a value import of a
// server-only module (or a literal SUPABASE_SERVICE_ROLE_KEY reference).
// `import type` is erased at build time and stays allowed.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const SERVER_ONLY_MODULES = [
  "@/lib/supabase/server",
  "@/lib/supabase/document-storage",
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) yield full;
  }
}

function hasUseClientDirective(source) {
  // The directive must appear before any statement; scan the first lines,
  // skipping blanks and comments.
  const lines = source.split("\n").slice(0, 30);
  let inBlockComment = false;
  for (const raw of lines) {
    let line = raw.trim();
    if (inBlockComment) {
      if (line.includes("*/")) { line = line.slice(line.indexOf("*/") + 2).trim(); inBlockComment = false; }
      else continue;
    }
    if (!line) continue;
    if (line.startsWith("//")) continue;
    if (line.startsWith("/*")) { if (!line.includes("*/")) inBlockComment = true; continue; }
    return /^["']use client["'];?$/.test(line);
  }
  return false;
}

const violations = [];
for (const file of walk("src")) {
  const rel = file.split(path.sep).join("/");
  const source = fs.readFileSync(file, "utf8");
  if (!hasUseClientDirective(source)) continue;

  for (const mod of SERVER_ONLY_MODULES) {
    // Value imports only — `import type` is erased and harmless.
    const valueImport = new RegExp(
      String.raw`^import\s+(?!type\b)[^;]*?from\s+["']${mod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
      "m",
    );
    if (valueImport.test(source)) {
      violations.push(`${rel}  imports ${mod}`);
    }
  }
  // The env READ is the dangerous shape (undefined in the browser → lying UI,
  // or a key leak if ever inlined). The var's NAME in setup-instruction copy
  // is fine.
  if (/process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(source)) {
    violations.push(`${rel}  reads process.env.SUPABASE_SERVICE_ROLE_KEY`);
  }
}

if (violations.length > 0) {
  console.error('use-client/server guard FAILED — a "use client" file pulls server-only Supabase code into the browser bundle (the 500-for-authorised-callers class):');
  for (const v of violations) console.error("  " + v);
  console.error("Remove the pragma, or move the server access behind an API route.");
  process.exit(1);
}
console.log('use-client/server guard passed: no "use client" file imports server-only Supabase modules.');

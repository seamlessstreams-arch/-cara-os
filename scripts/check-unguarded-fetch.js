#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: no query or mutation may swallow an HTTP error.
//
// fetch() RESOLVES on a 4xx/5xx. A queryFn/mutationFn written
// fetch(url).then((r) => r.json()) therefore parses the ERROR BODY as its
// result: a rejected save ran onSuccess and showed "recorded" (LADO
// referrals, Reg 35, DoL — #911), and a failing read rendered as an empty
// page indistinguishable from "no records" (#912). 412 sites were swept onto
// the api.* client, which throws on non-2xx; this keeps the next one out.
//
// A queryFn/mutationFn window that calls fetch( is a violation UNLESS it
// visibly handles failure: it checks .ok / throws, routes through api.* /
// apiFetch, or calls an in-file helper whose own body checks .ok (jfetch,
// json, oversightJson, named fetchers). Raw fetch outside query/mutation
// functions (downloads, blobs, third-party calls) is out of scope.
//
// Fix: api.get/post/put/patch/delete from @/hooks/use-api — or apiFetch when
// custom headers are needed.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const DIRS = ["src/app/(platform)", "src/components", "src/hooks"];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      yield* walk(full);
    } else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) {
      yield full;
    }
  }
}

// Function names in this file whose body visibly checks res.ok — calling one
// of them counts as handling the failure.
function okCheckingHelpers(text) {
  // Nested braces defeat a regex body-capture (jfetch's .ok sits past an
  // inner `});`), so just test a fixed window from each definition.
  const names = new Set();
  const defs = /(?:function (\w+)\s*(?:<[^>]*>)?\s*\(|const (\w+)\s*=\s*async)/g;
  let m;
  while ((m = defs.exec(text))) {
    const win = text.slice(m.index, m.index + 700);
    if (/\.ok\b/.test(win) && /throw/.test(win)) names.add(m[1] ?? m[2]);
  }
  return names;
}

const violations = [];
for (const dir of DIRS) {
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, "utf8");
    if (!text.includes("fetch(")) continue;
    const helpers = okCheckingHelpers(text);
    const rel = file.split(path.sep).join("/");
    for (const kind of ["queryFn", "mutationFn"]) {
      let idx = -1;
      while ((idx = text.indexOf(kind, idx + 1)) !== -1) {
        const win = text.slice(idx, idx + 600);
        const f = win.indexOf("fetch(");
        if (f === -1) continue;
        const apiPos = win.search(/\bapi(?:Fetch)?\s*[.<(]/);
        if (apiPos !== -1 && apiPos < f) continue;
        if (/\.ok\b/.test(win) || /\bthrow\b/.test(win)) continue;
        if ([...helpers].some((h) => win.includes(h))) continue;
        const line = text.slice(0, idx).split("\n").length;
        violations.push(`${rel}:${line}`);
      }
    }
  }
}

if (violations.length) {
  console.error(
    `check-unguarded-fetch: ${violations.length} query/mutation function(s) can swallow an HTTP error.\n` +
      `fetch() resolves on a 4xx/5xx, so the error body parses as the result —\n` +
      `a failed save looks recorded, a failed read looks empty. Use api.get/post/…\n` +
      `from @/hooks/use-api (or apiFetch for custom headers), or check res.ok and throw.\n`
  );
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("check-unguarded-fetch: every query/mutation fetch handles HTTP failure.");

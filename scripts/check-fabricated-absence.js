#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// GUARD — A FAILED READ IS NOT AN EMPTY COLLECTION
//
// `const { data, isLoading } = useThings()` then `const rows = data?.data ?? []`
// then `rows.length === 0 ? <EmptyState title="No things yet" />`.
//
// When that query FAILS, `data` is undefined, so `rows` is empty, so the page
// states that nothing was recorded — having never successfully looked. On
// /welfare-checks that renders "No welfare checks recorded yet" on the screen
// that evidences Reg 34 night supervision. It is the fabricate-on-empty
// prohibition applied to ABSENCE, and it is the quietest form of it: no number
// is invented, no record is invented, only the claim that there is nothing.
//
// The query client's cache-level onError is the backstop (a toast), but a toast
// does not unsay the sentence in the body of the page. The page has to know.
//
// ── The rule ────────────────────────────────────────────────────────────────
//
// A .tsx file that renders <EmptyState> and destructures a TanStack query must
// not destructure that query BLIND — the destructure has to take one of
// `isError` / `error` / `status` / `isSuccess`, which is the only way the file
// can tell "none" from "could not look".
//
// Structural, not textual: it does not try to adjudicate what an empty state
// SAYS, only whether the file is capable of knowing. Fix it by taking isError
// and passing it to EmptyState's `error` prop, or by branching on it directly.
//
// Query hooks are resolved transitively: a local `function useDrafts() { return
// useQuery(...) }` counts, because destructuring THAT is destructuring a query.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

// Files still carrying the bug. Every one is a page that will state an absence
// it has not verified. This list may only ever get SHORTER.
const BASELINE = new Set(require("./fabricated-absence-baseline.json"));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      walk(p, out);
    } else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) {
      out.push(p);
    }
  }
  return out;
}

/** Hook names whose return value IS a query result, resolved across the repo. */
function collectQueryHooks(files) {
  const hooks = new Set(["useQuery", "useSuspenseQuery", "useInfiniteQuery"]);
  // A wrapper is a `use*` that returns useQuery(...) within its first ~900
  // chars — enough for the option object, short enough not to run past the
  // function into an unrelated later hook in the same file.
  const asFn = /(?:export\s+)?function\s+(use[A-Z]\w*)\s*[<(][\s\S]{0,900}?\breturn\s+useQuery\s*[<(]/g;
  const asArrow = /(?:export\s+)?const\s+(use[A-Z]\w*)\s*=\s*\([^)]*\)\s*=>\s*useQuery\s*[<(]/g;
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    if (!src.includes("useQuery")) continue;
    let m;
    asFn.lastIndex = 0;
    while ((m = asFn.exec(src))) hooks.add(m[1]);
    asArrow.lastIndex = 0;
    while ((m = asArrow.exec(src))) hooks.add(m[1]);
  }
  return hooks;
}

const ERROR_SIGNALS = new Set(["isError", "error", "status", "isSuccess"]);

function blindDestructures(src, hookAlternation) {
  const re = new RegExp(String.raw`const\s*\{([^}]*)\}\s*=\s*(${hookAlternation})\s*[<(]`, "g");
  const found = [];
  let m;
  while ((m = re.exec(src))) {
    const keys = m[1]
      .split(",")
      .map((s) => s.split(":")[0].trim())
      .filter(Boolean);
    if (!keys.some((k) => ERROR_SIGNALS.has(k))) {
      found.push({ hook: m[2], line: src.slice(0, m.index).split("\n").length });
    }
  }
  return found;
}

function main() {
  const files = walk(SRC);
  const hooks = collectQueryHooks(files);
  // Longest first so `useDraftsList` is matched before `useDrafts`.
  const alternation = [...hooks].sort((a, b) => b.length - a.length).join("|");

  const offenders = [];
  for (const f of files) {
    if (!f.endsWith(".tsx")) continue;
    const src = fs.readFileSync(f, "utf8");
    if (!src.includes("<EmptyState")) continue;
    const blind = blindDestructures(src, alternation);
    if (blind.length) offenders.push({ rel: path.relative(ROOT, f), blind });
  }

  // Non-vacuity: if the scan finds nothing at all, the regexes have rotted and
  // the guard is passing because it stopped looking, not because the bug is
  // gone. There is at least one EmptyState + query page in this repo.
  const scanned = files.filter(
    (f) => f.endsWith(".tsx") && fs.readFileSync(f, "utf8").includes("<EmptyState"),
  ).length;
  if (scanned === 0) {
    console.error("check-fabricated-absence: found no EmptyState files at all — the scan is broken.");
    process.exit(1);
  }
  if (hooks.size < 10) {
    console.error(
      `check-fabricated-absence: resolved only ${hooks.size} query hooks — the wrapper regex has rotted.`,
    );
    process.exit(1);
  }

  const current = new Set(offenders.map((o) => o.rel));
  const newOnes = offenders.filter((o) => !BASELINE.has(o.rel));
  const fixed = [...BASELINE].filter((b) => !current.has(b));

  if (newOnes.length) {
    console.error(
      `\ncheck-fabricated-absence: ${newOnes.length} file(s) render an empty state from a query they cannot tell failed.\n` +
        "A failed read is not an empty collection — saying \"none recorded\" without a successful read\n" +
        "is a fabricated absence. Take `isError` from the query and pass it to EmptyState's `error` prop\n" +
        "(with `onRetry` and a `noun`), or branch on it before the empty state.\n",
    );
    for (const o of newOnes) {
      for (const b of o.blind) console.error(`  ${o.rel}:${b.line}  blind ${b.hook}(...) destructure`);
    }
    console.error("");
    process.exit(1);
  }

  if (fixed.length) {
    console.error(
      `\ncheck-fabricated-absence: ${fixed.length} baselined file(s) are now clean. Remove them from\n` +
        "scripts/fabricated-absence-baseline.json so they cannot regress:\n",
    );
    for (const f of fixed) console.error(`  ${f}`);
    console.error("");
    process.exit(1);
  }

  console.log(
    `check-fabricated-absence: ${scanned} empty-state screens scanned, ${hooks.size} query hooks resolved — ` +
      `${offenders.length} still baselined, 0 new ✓`,
  );
}

main();

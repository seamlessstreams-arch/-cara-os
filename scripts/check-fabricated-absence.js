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
//
// ── What it deliberately does NOT flag ──────────────────────────────────────
//
// A blind destructure only matters if the failed read actually becomes an empty
// LIST. Three collapses count, and they are checked explicitly:
//
//   const rows = data?.x ?? []            // later fallback
//   const { data: rows = [] } = useX()    // destructure default
//   useState<T[]>([]) + useEffect(setX)   // hydrated local state (reg-44)
//
// A query whose data falls back to a SCALAR is out of class — `useHomeName`
// returning "This home" is a display fallback, not a claim that nothing exists.
// So is a page that early-returns on `!data` before the empty state can render
// (/complaints-clock, /dashboard/staff both do). Requiring a real collapse is
// what keeps this guard on the defect instead of making every query in every
// file carry an unused isError.
//
// KNOWN GAP, stated rather than implied: a collapse expressed some fourth way —
// say a multi-line `useMemo` that returns [] on no data — will not be caught.
// The three above are what this repo actually contains, verified by census.
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

/**
 * The bug needs BOTH halves:
 *   1. a query destructured without any error signal, AND
 *   2. its data collapsed to an empty ARRAY — `rows = data?.x ?? []`.
 *
 * The second half is what turns "the read failed" into "the list is empty",
 * which is what the empty state then reports as an absence. A query whose data
 * falls back to a scalar is not in this class: `useHomeName` returning "This
 * home" on failure is a display fallback, not a claim that nothing exists.
 * Requiring both halves is what keeps the guard on the actual defect instead of
 * making every query in the file carry an unused isError.
 */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function collapsesToEmptyArray(src, binding) {
  return new RegExp(String.raw`\b${esc(binding)}\b[^;\n]{0,80}(\?\?|\|\|)\s*\[\s*\]`).test(src);
}

/**
 * The second shape, and the one /quality/reg-44 has: the query is not read
 * directly, it HYDRATES local state that was initialised empty.
 *
 *   const [visits, setVisits] = useState<Reg44Visit[]>([]);
 *   useEffect(() => { if (apiData?.persisted) setVisits(...) }, [apiData]);
 *   {visits.length === 0 ? <EmptyState title="No visits recorded" /> : …}
 *
 * A failed read never calls the setter, so `visits` stays `[]` and the page
 * states an absence — on a statutory screen. Matched by SETTER NAME, not by
 * proximity: the data binding must reach a `setX(` whose `useState` initialiser
 * is an empty array, which is a real correspondence rather than a guess.
 */
function hydratesEmptyState(src, binding) {
  const setters = new Set();
  const decl = /const\s*\[\s*\w+\s*,\s*(set\w+)\s*\]\s*=\s*useState\s*(?:<[^>]*>)?\s*\(\s*\[\s*\]\s*\)/g;
  let m;
  while ((m = decl.exec(src))) setters.add(m[1]);
  if (setters.size === 0) return false;

  // Each effect that mentions the binding — does it feed one of those setters?
  const effect = new RegExp(
    String.raw`useEffect\(\s*\(\)\s*=>\s*\{([\s\S]{0,1500}?)\}\s*,\s*\[[^\]]*\b${esc(binding)}\b[^\]]*\]`,
    "g",
  );
  while ((m = effect.exec(src))) {
    for (const s of setters) if (m[1].includes(`${s}(`)) return true;
  }
  return false;
}

/**
 * `{ data: records = [], isLoading }` — key `data`, binding `records`, and the
 * collapse to an empty array happens right there in the destructure default,
 * which is the commonest form of it in this repo. Split key / alias / default
 * separately or the default is read as part of the alias.
 */
function parseEntries(inner) {
  // Commas inside a default like `= { a, b }` would split wrongly; array and
  // object defaults are matched as a unit first.
  return inner
    .split(/,(?![^[{(]*[\]})])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const eq = s.indexOf("=");
      const decl = (eq === -1 ? s : s.slice(0, eq)).trim();
      const def = eq === -1 ? "" : s.slice(eq + 1).trim();
      const colon = decl.indexOf(":");
      const key = (colon === -1 ? decl : decl.slice(0, colon)).trim();
      const binding = (colon === -1 ? decl : decl.slice(colon + 1)).trim();
      return { key, binding, def };
    });
}

/**
 * The text from a destructure to the end of its enclosing top-level function.
 *
 * Scope matters because `data` is the commonest binding name in the repo: a
 * whole-file search for `data ... ?? []` matches a SIBLING component that takes
 * `data` as a prop, and flags a hook that never touches a list. /buildings is
 * exactly that — `useHomeName` returns a string, while `DashboardTab({ data })`
 * three hundred lines below does the `?? []`. Different `data`, same word.
 */
function enclosingScope(src, index) {
  const rest = src.slice(index);
  const next = rest.slice(1).search(/\n(?:export\s+)?(?:default\s+)?(?:function|const|class)\s/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

function blindDestructures(src, hookAlternation) {
  const re = new RegExp(String.raw`const\s*\{([^}]*)\}\s*=\s*(${hookAlternation})\s*[<(]`, "g");
  const found = [];
  let m;
  while ((m = re.exec(src))) {
    const scope = enclosingScope(src, m.index);
    const entries = parseEntries(m[1]);
    if (entries.some((e) => ERROR_SIGNALS.has(e.key))) continue;

    // Only the `data` binding can collapse into a list.
    const dataEntry = entries.find((e) => e.key === "data");
    if (!dataEntry) continue;
    const collapses =
      /^\[\s*\]$/.test(dataEntry.def) ||
      collapsesToEmptyArray(scope, dataEntry.binding) ||
      // Hydration is looked for across the whole file: the useState and the
      // useEffect are in the SAME component as the destructure, but the setter
      // declaration may sit above it.
      hydratesEmptyState(src, dataEntry.binding);
    if (!collapses) continue;

    found.push({ hook: m[2], line: src.slice(0, m.index).split("\n").length });
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

  if (process.env.FABRICATED_ABSENCE_JSON) {
    fs.writeFileSync(process.env.FABRICATED_ABSENCE_JSON, JSON.stringify(offenders, null, 1));
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

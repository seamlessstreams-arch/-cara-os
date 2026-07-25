#!/usr/bin/env node
/*
 * check-hook-refs.js — every useXxx() call must resolve to an import or a
 * local definition in the same file.
 *
 * The class this guards (it broke production twice during the hook-inlining
 * programme, batches 327–376 and 377–426): a wrapper hook is deleted from
 * src/hooks, but the call site is left referring to it. Two shapes:
 *
 *   1. Path rewrite instead of inline — the symbol survives, only the module
 *      specifier is swapped:
 *
 *        import { useIncidents } from "@tanstack/react-query";   // never exported there
 *
 *   2. Deleted with no replacement — the call site keeps calling a hook that
 *      now exists nowhere:
 *
 *        const q = useCaraSafeguardingFlags({ homeId });         // not imported, not defined
 *
 * WHY A DEDICATED GUARD — `tsc --noEmit` DOES NOT CATCH EITHER SHAPE HERE.
 * It reported 0 errors on all 16 broken files while `next build` failed with
 * 29 Turbopack errors and a prerender crash. Every agent that inlined a hook,
 * ran tsc, saw green and deleted the file was reading an instrument that was
 * not measuring anything. `next build` is the real gate — but it costs ~3
 * minutes and only surfaces ONE failure per run (the build exits at the first
 * prerender crash). This guard runs in well under a second and reports the
 * COMPLETE set in one pass.
 *
 * SCOPE / matching:
 *   - .ts/.tsx under src/, excluding tests (a test's own local helper and
 *     vitest's vi.useFakeTimers() are both correct patterns, not phantoms).
 *   - A "call" is a bare `useXxx(` — member calls (`vi.useFakeTimers()`,
 *     `React.useState()`) are skipped, since the receiver supplies the binding.
 *   - Occurrences inside comments and string/template literals are stripped
 *     before matching, so prose like "reads via useIncidents()" never trips it.
 *   - Resolution = named/default/namespace import in the file, OR a local
 *     function/const/let/var declaration, OR a destructure that binds the name.
 *
 * When this fails: the hook was deleted without being inlined at that call
 * site. Paste the hook body in as a local function AND add whatever new
 * imports that body needs (useQuery/useMutation/useQueryClient, api, types) —
 * do not "fix" it by re-pointing the import at another module.
 */
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const ROOT = path.join(REPO, "src");

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "__tests__", "__mocks__"]);
const isTest = (p) => /\.(test|spec)\.tsx?$/.test(p) || p.includes(`${path.sep}__tests__${path.sep}`);

/** Blank out comments and string/template literals so prose never matches. */
function stripNonCode(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "/" && next === "/") {
      while (i < n && src[i] !== "\n") { out += " "; i++; }
    } else if (c === "/" && next === "*") {
      out += "  "; i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) { out += src[i] === "\n" ? "\n" : " "; i++; }
      out += "  "; i += 2;
    } else if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      out += " "; i++;
      while (i < n && src[i] !== quote) {
        if (src[i] === "\\") { out += "  "; i += 2; continue; }
        out += src[i] === "\n" ? "\n" : " ";
        i++;
      }
      out += " "; i++;
    } else {
      out += c; i++;
    }
  }
  return out;
}

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, acc); }
    else if (/\.tsx?$/.test(e.name) && !isTest(p)) acc.push(p);
  }
  return acc;
}

/*
 * Shape 1 (path rewrite) is invisible to the resolve check below — the symbol
 * IS imported, just from a module that never exported it. Catching it needs
 * the exporter's surface. @tanstack/react-query is where every one of these
 * landed (it is the module the inlined body imports from, so it is what a
 * careless rewrite reaches for), and its export surface is small and stable,
 * so we can assert against it directly.
 */
const RQ_EXPORTS = new Set([
  "useQuery", "useQueries", "useInfiniteQuery", "useMutation", "useMutationState",
  "useQueryClient", "useIsFetching", "useIsMutating", "useSuspenseQuery",
  "useSuspenseQueries", "useSuspenseInfiniteQuery", "usePrefetchQuery",
  "usePrefetchInfiniteQuery",
  "QueryClient", "QueryClientProvider", "QueryCache", "MutationCache",
  "QueryErrorResetBoundary", "useQueryErrorResetBoundary", "HydrationBoundary",
  "Hydrate", "dehydrate", "hydrate", "keepPreviousData", "replaceEqualDeep",
  "matchQuery", "notifyManager", "onlineManager", "focusManager", "skipToken",
  "infiniteQueryOptions", "queryOptions", "isServer", "isCancelledError",
  "CancelledError", "defaultShouldDehydrateQuery", "streamedQuery",
  // type-only exports are matched case-insensitively below via the Use*/Query* prefixes
]);
const isLikelyRqType = (n) =>
  /^(Use|Query|Mutation|Infinite|Fetch|Default|Omit|Data|Enabled|Notify|Resolved|Skip|Placeholder|Get|Set|With|Register|Override|NoInfer|Distributive|Thrown|Streamed)/.test(n);

const offenders = [];
const badImports = [];
const files = walk(ROOT, []);

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const code = stripNonCode(raw);

  // ── Shape 1: symbol imported from @tanstack/react-query that it never exports
  for (const m of raw.matchAll(/import[^;]*?\{([^}]*)\}[^;]*?from\s*["']@tanstack\/react-query["']/gs)) {
    const line = raw.slice(0, m.index).split("\n").length;
    for (const part of m[1].split(",")) {
      const isType = /^\s*type\s+/.test(part);
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (!name) continue;
      if (RQ_EXPORTS.has(name)) continue;
      if (isType && isLikelyRqType(name)) continue;
      badImports.push({ loc: `${path.relative(REPO, file)}:${line}`, name });
    }
  }

  // Bare `useXxx(` — the preceding char must not be `.` (member call) or an
  // identifier char (e.g. `abuseXxx(`).
  const called = new Map(); // name -> first line number
  for (const m of code.matchAll(/(^|[^.\w$])(use[A-Z][A-Za-z0-9_$]*)\s*\(/g)) {
    const name = m[2];
    if (called.has(name)) continue;
    called.set(name, code.slice(0, m.index).split("\n").length);
  }
  if (called.size === 0) continue;

  const bound = new Set();

  // Named imports: any `{ a, b as c }` block in an import statement.
  for (const m of raw.matchAll(/import[^;]*?\{([^}]*)\}[^;]*?from\s*["']/gs)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop().trim();
      if (name) bound.add(name);
    }
  }
  // Default and namespace imports.
  for (const m of raw.matchAll(/import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s*(?:,|from)/g)) bound.add(m[1]);
  for (const m of raw.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)/g)) bound.add(m[1]);

  // Local declarations.
  for (const m of code.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(use[A-Z][\w$]*)/g)) bound.add(m[1]);
  for (const m of code.matchAll(/(?:export\s+)?(?:const|let|var)\s+(use[A-Z][\w$]*)\s*[=:]/g)) bound.add(m[1]);
  // Destructured bindings — `const { useFoo } = …`.
  for (const m of code.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
    for (const part of m[1].split(",")) {
      const name = part.split(":").pop().trim().replace(/^\.\.\./, "");
      if (/^use[A-Z]/.test(name)) bound.add(name);
    }
  }

  for (const [name, line] of called) {
    if (!bound.has(name)) {
      offenders.push({ loc: `${path.relative(REPO, file)}:${line}`, name });
    }
  }
}

let failed = false;

if (badImports.length > 0) {
  failed = true;
  console.error(
    `check-hook-refs: ${badImports.length} symbol(s) imported from "@tanstack/react-query" ` +
      `that it does not export.\n` +
      `This is a hook inlined by rewriting the import PATH while keeping the symbol — the hook\n` +
      `body was never pasted in. Inline the body as a local function instead:\n`,
  );
  for (const o of badImports) console.error(`  ✖ ${o.loc}  { ${o.name} }`);
  console.error("");
}

if (offenders.length > 0) {
  failed = true;
  console.error(
    `check-hook-refs: ${offenders.length} hook call(s) that resolve to nothing — ` +
      `neither imported nor defined in the file.\n` +
      `This is what a deleted-but-not-inlined hook looks like. tsc does NOT catch it; ` +
      `it fails the production\nbuild. Inline the hook body as a local function and add ` +
      `the imports that body needs — do not\nre-point the import at another module:\n`,
  );
  for (const o of offenders) console.error(`  ✖ ${o.loc}  ${o.name}()`);
}

if (failed) process.exit(1);

console.log(
  `check-hook-refs: every hook call resolves and every react-query import is real ` +
    `(${files.length} files scanned) ✓`,
);

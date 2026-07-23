#!/usr/bin/env node
/*
 * check-api-contracts.js — every endpoint a hook calls must exist, answer the
 * shape the hook declares, and support the method the hook uses.
 *
 * The class this guards (it has now bitten four times, three of them on the
 * live tenant, and it is INVISIBLE at runtime because it degrades to empty
 * rather than throwing):
 *
 *   1. SHAPE. `useRota` declared `api.get<RotaResponse>("/rota")` where
 *      RotaResponse is `{ shifts, leave, meta }`. There was no /api/v1/rota
 *      route, so the request fell through to the catch-all dispatcher, which
 *      answers `{ data, meta: { total } }`. `data.shifts` was therefore always
 *      undefined and defaulted to [] — the rota grid rendered EMPTY in demo and
 *      live no matter what was scheduled, and the open-shift panel (and the
 *      buttons inside it) never appeared at all. Nothing errored.
 *
 *   2. METHOD. A dedicated route file SHADOWS the dispatcher for its path. If
 *      it exports only GET, every POST/PATCH the UI sends 405s before any
 *      handler logic runs — which is exactly how "add a staff member"
 *      (/api/v1/staff) and the documents upload (/api/v1/documents) were dead.
 *
 *   3. MISSING. A hook calling a path that is neither a dedicated route nor a
 *      SLUG_MAP entry is a 404 — a feature wired to nothing.
 *
 * WHAT IT CHECKS: for every api.get/post/patch/delete in src/hooks, resolve the
 * path to either a dedicated route file (honouring [dynamic] segments) or the
 * dispatcher via SLUG_MAP, then assert:
 *   - the path resolves at all                          → MISSING ENDPOINT
 *   - a dedicated route exports the method being called → METHOD NOT EXPORTED
 *   - a dispatcher-served GET declares only keys the dispatcher can return
 *     (data / meta)                                     → SHAPE MISMATCH
 *
 * Only top-level keys of the declared response type are compared, and only when
 * that type can be resolved (an inline object literal, or an interface/type
 * declared in the same hook file). Anything unresolvable is skipped rather than
 * guessed at — this guard reports things that are certainly wrong, not things
 * that might be.
 *
 * When this fails: add the missing route, add the missing method export, or fix
 * the declared type to match what the endpoint really returns. Do NOT silence it
 * by widening the hook's type to `any` — that reinstates the exact silence this
 * guard exists to break.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HOOKS_DIR = path.join(ROOT, "src", "hooks");
const API_V1 = path.join(ROOT, "src", "app", "api", "v1");
const DISPATCHER = path.join(API_V1, "[...slug]", "route.ts");

// Paths a hook may legitimately call that this guard cannot resolve statically.
// Every entry needs a comment saying why.
const ALLOWLIST = new Set([]);

/*
 * KNOWN-BROKEN BASELINE — currently EMPTY, and it should stay that way.
 *
 * It held 13 entries when the guard landed (2026-07-23) and was burned down to
 * zero the same day: 9 turned out to be the guard's own false positives (it
 * matched `care-events/[id]` ahead of `care-events/notifications` — fixed in
 * routeFor by preferring static segments, the way Next.js resolves), and the
 * real 4 were fixed — three missing per-record workforce [id] PATCH routes
 * (appraisals, competency-profiles, development-plans) and the welfare-checks
 * response shape.
 *
 * THIS LIST MAY ONLY SHRINK. A fixed entry left here fails the guard as a stale
 * entry, so it cannot rot into a permanent excuse. Never add to it to make a
 * build pass — fix the endpoint instead.
 *
 * Key: "KIND|hook file|METHOD /path"
 */
const BASELINE = new Set([]);

// The dispatcher's response envelope — `{ data, meta }` for list/detail reads.
const DISPATCHER_KEYS = new Set(["data", "meta"]);

function fail(msg) {
  console.error(`check-api-contracts: ${msg}`);
  process.exit(1);
}

// ── SLUG_MAP keys (which bare paths the dispatcher can serve) ────────────────
if (!fs.existsSync(DISPATCHER)) fail(`dispatcher not found at ${DISPATCHER}`);
const dispatcherSrc = fs.readFileSync(DISPATCHER, "utf8");
const slugMapBlock = dispatcherSrc.match(/const SLUG_MAP[^{]*\{([\s\S]*?)\n\};/);
if (!slugMapBlock) fail("could not parse SLUG_MAP from the dispatcher — parser needs updating.");
const SLUGS = new Set([...slugMapBlock[1].matchAll(/^\s*"([a-z0-9-]+)":/gm)].map((m) => m[1]));
if (SLUGS.size === 0) fail("parsed zero SLUG_MAP entries — parser needs updating.");

// ── Dedicated route files, as segment patterns ───────────────────────────────
const routes = []; // { segments: string[], methods: Set<string> }
(function walk(dir, segs) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith("[...")) continue; // the catch-all, handled separately
      walk(path.join(dir, entry.name), [...segs, entry.name]);
    } else if (entry.name === "route.ts") {
      const src = fs.readFileSync(path.join(dir, "route.ts"), "utf8");
      // Both declaration styles: `export async function GET(…)` and the wrapped
      // `export const GET = withShiftAccess(…)` used by access-guarded routes.
      const methods = new Set([
        ...[...src.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]),
        ...[...src.matchAll(/export\s+(?:const|let|var)\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]),
      ]);
      routes.push({ segments: segs, methods });
    }
  }
})(API_V1, []);

/**
 * Match request segments against a route's segments, honouring [param].
 * Next.js resolves a STATIC segment ahead of a dynamic one, so when several
 * routes match, pick the most static. Taking the first match instead made
 * `care-events/[id]` (GET, PATCH) swallow `/care-events/notifications` (GET,
 * POST) and report a POST handler that exists as missing — nine false
 * positives, which is exactly how a guard loses its credibility.
 */
function routeFor(segments) {
  const matches = routes.filter(
    (r) =>
      r.segments.length === segments.length &&
      r.segments.every((seg, i) => seg.startsWith("[") || seg === segments[i]),
  );
  if (matches.length === 0) return undefined;
  const dynamicCount = (r) => r.segments.filter((s) => s.startsWith("[")).length;
  return matches.reduce((best, r) => (dynamicCount(r) < dynamicCount(best) ? r : best));
}

// ── Resolve a declared response type to its top-level keys ───────────────────
/** Top-level keys of an inline object-literal type, ignoring nested braces. */
function keysOfLiteral(body) {
  const keys = [];
  let depth = 0;
  let token = "";
  for (const ch of body) {
    if (ch === "{" || ch === "[" || ch === "(") depth++;
    else if (ch === "}" || ch === "]" || ch === ")") depth--;
    else if (depth === 0 && (ch === ";" || ch === ",")) {
      const m = token.match(/([a-zA-Z_][\w]*)\s*\??\s*:/);
      if (m) keys.push(m[1]);
      token = "";
      continue;
    }
    token += ch;
  }
  const m = token.match(/([a-zA-Z_][\w]*)\s*\??\s*:/);
  if (m) keys.push(m[1]);
  return keys;
}

/** Resolve `T` to top-level keys: inline literal, or a type/interface in `src`. */
function resolveKeys(typeText, src) {
  const t = typeText.trim();
  if (t.startsWith("{")) return keysOfLiteral(t.slice(1, -1));
  if (/^[A-Z][\w]*$/.test(t)) {
    const decl = src.match(new RegExp(`(?:interface|type)\\s+${t}\\s*(?:=\\s*)?\\{`));
    if (!decl) return null;
    const start = src.indexOf("{", decl.index);
    let depth = 0;
    for (let i = start; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) return keysOfLiteral(src.slice(start + 1, i));
      }
    }
  }
  return null; // generic, union, imported, or otherwise not statically resolvable
}

/**
 * Read the string/template literal starting at `open` (the quote char index),
 * returning its raw text with `${…}` interpolations collapsed to `*`.
 * Brace-balanced, so nested templates and quotes inside an interpolation
 * (`${qs ? `?${qs}` : ""}`) don't truncate the path.
 */
function readLiteral(src, open) {
  const quote = src[open];
  let out = "";
  for (let i = open + 1; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\\") { i++; continue; }
    if (ch === quote) return out;
    if (quote === "`" && ch === "$" && src[i + 1] === "{") {
      let depth = 1;
      i += 2;
      while (i < src.length && depth > 0) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") depth--;
        i++;
      }
      i--;
      out += "*";
      continue;
    }
    out += ch;
  }
  return out;
}

/**
 * Split a call path into segments.
 * A `*` that is a whole segment is a path parameter (`/young-people/${id}/…`).
 * A `*` merely SUFFIXING a segment came from a query interpolation
 * (`/artifacts${query}`, where query is "?a=b") — strip it, it is not path.
 */
function segmentsOf(rawPath) {
  const clean = rawPath.split("?")[0].replace(/^\/+|\/+$/g, "");
  if (!clean) return null;
  return clean
    .split("/")
    .filter(Boolean)
    .map((seg) => (seg !== "*" ? seg.replace(/\*+$/, "") : seg))
    .filter(Boolean);
}

// ── Scan the hooks ───────────────────────────────────────────────────────────
const findings = [];
for (const file of fs.readdirSync(HOOKS_DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))) {
  if (file.includes(".test.")) continue;
  const src = fs.readFileSync(path.join(HOOKS_DIR, file), "utf8");

  // api.get<T>("/path")  /  api.post<T>(`/path/${id}`, body)
  const re = /api\.(get|post|put|patch|delete)\s*<([\s\S]*?)>\s*\(\s*(?=[`"'])/g;
  for (const m of [...src.matchAll(re)]) {
    const [, method, typeText] = m;
    const rawPath = readLiteral(src, m.index + m[0].length);
    if (!rawPath.startsWith("/")) continue;
    const segments = segmentsOf(rawPath);
    if (!segments) continue;
    const display = "/" + segments.join("/");
    if (ALLOWLIST.has(display)) continue;

    const dedicated = routeFor(segments);
    const line = src.slice(0, m.index).split("\n").length;
    const where = `src/hooks/${file}:${line}`;

    if (dedicated) {
      if (!dedicated.methods.has(method.toUpperCase())) {
        findings.push({
          kind: "METHOD NOT EXPORTED",
          where,
          call: `${method.toUpperCase()} ${display}`,
          detail: `${method.toUpperCase()} ${display} — the dedicated route exports only ${[...dedicated.methods].join(", ") || "nothing"}. A dedicated route shadows the dispatcher, so this call 405s.`,
        });
      }
      continue; // shape of a dedicated route is its own business
    }

    // No dedicated route → the dispatcher must be able to serve it.
    if (!SLUGS.has(segments[0])) {
      findings.push({
        kind: "MISSING ENDPOINT",
        where,
        call: `${method.toUpperCase()} ${display}`,
        detail: `${method.toUpperCase()} ${display} — no route file and no SLUG_MAP entry for "${segments[0]}". This request 404s.`,
      });
      continue;
    }

    if (method === "get") {
      const keys = resolveKeys(typeText, src);
      if (!keys || keys.length === 0) continue; // unresolvable → skip, don't guess
      const unknown = keys.filter((k) => !DISPATCHER_KEYS.has(k));
      if (unknown.length > 0) {
        findings.push({
          kind: "SHAPE MISMATCH",
          where,
          call: `GET ${display}`,
          detail: `GET ${display} is served by the dispatcher, which returns { data, meta } — but the hook declares { ${keys.join(", ")} }. ${unknown.map((k) => `\`${k}\``).join(", ")} will always be undefined.`,
        });
      }
    }
  }
}

// ── Split against the baseline ───────────────────────────────────────────────
const seen = new Set();
const fresh = [];
for (const f of findings) {
  const key = `${f.kind}|${f.where.replace(/:\d+$/, "")}|${f.call}`;
  seen.add(key);
  if (!BASELINE.has(key)) fresh.push(f);
}
const stale = [...BASELINE].filter((k) => !seen.has(k));

if (fresh.length > 0) {
  console.error(
    `check-api-contracts: ${fresh.length} NEW endpoint contract problem(s).\n` +
      "These fail silently at runtime — the UI degrades to empty instead of erroring:\n",
  );
  for (const f of fresh) {
    console.error(`  ✗ [${f.kind}] ${f.where}`);
    console.error(`      ${f.detail}`);
  }
  console.error("\nAdd the route, export the method, or correct the declared type. See this file's header.");
  console.error("Do NOT add these to BASELINE — it may only shrink.");
  process.exit(1);
}

if (stale.length > 0) {
  console.error(
    `check-api-contracts: ${stale.length} stale BASELINE entr${stale.length === 1 ? "y" : "ies"} — ` +
      "these are FIXED. Delete them from BASELINE in this file so the list keeps shrinking:\n",
  );
  for (const k of stale) console.error(`  • ${k}`);
  process.exit(1);
}

const baselineNote = BASELINE.size > 0 ? ` (${BASELINE.size} known-broken in baseline)` : "";
console.log(`check-api-contracts: no new endpoint contract problems${baselineNote} ✓`);

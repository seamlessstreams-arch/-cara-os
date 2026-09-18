#!/usr/bin/env node
/*
 * check-ui-wiring.js — every link goes somewhere and every API call lands.
 *
 * Two classes this guards, both invisible at build time and both found by
 * hand on 18 Sep 2026:
 *
 *   1. DEAD LINK. An href / router.push / redirect to an app path with no
 *      page.tsx behind it. Next.js happily renders the 404.
 *   2. DEAD CALL. A fetch / api.<method> / ilFetch to a path that resolves to
 *      no route file, no SLUG_MAP entry and no home-intelligence engine — or
 *      to a dedicated route that does not export the method used. The
 *      quality/cara-toolkit/missing-absconding page had fetched a route that
 *      never existed; the rota's "offer shift" POSTed to a route that had
 *      GET/PATCH only (405). Nothing errored in CI either time.
 *
 * check-api-contracts.js covers src/hooks; this covers every client file.
 * Not a ratchet: the count is 0 and stays 0.
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "src/app");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(f, out); } else out.push(f);
  }
  return out;
}
const toPattern = (rel) => "/" + rel.split("/").slice(0, -1).filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith("@")).join("/");
function matcher(pattern) {
  const segs = pattern.split("/").filter(Boolean);
  return (url) => {
    const u = url.split("/").filter(Boolean);
    let i = 0;
    for (const s of segs) {
      if (/^\[\[\.\.\..*\]\]$/.test(s)) return true;
      if (/^\[\.\.\..*\]$/.test(s)) return i < u.length;
      if (i >= u.length) return false;
      if (/^\[.*\]$/.test(s)) { i++; continue; }
      if (s !== u[i]) return false;
      i++;
    }
    return i === u.length;
  };
}

const appFiles = walk(APP);
const pages = [...new Set(appFiles.filter((f) => /\/page\.tsx?$/.test(f)).map((f) => toPattern(path.relative(APP, f))))].map((p) => matcher(p));
const apis = appFiles.filter((f) => /\/route\.ts$/.test(f)).map((f) => {
  const src = fs.readFileSync(f, "utf8");
  const methods = new Set([...src.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]).concat([...src.matchAll(/export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1])));
  const pattern = toPattern(path.relative(APP, f));
  return { pattern, m: matcher(pattern), methods, dyn: (pattern.match(/\[/g) || []).length };
});
const catchAllSrc = fs.readFileSync(path.join(APP, "api/v1/[...slug]/route.ts"), "utf8");
const slugMap = new Set([...catchAllSrc.matchAll(/^\s*"([a-z0-9-]+)":\s*"/gm)].map((m) => m[1]));
const homeEngines = new Set([...fs.readFileSync(path.join(ROOT, "src/lib/intelligence-api/home-dispatcher.ts"), "utf8").matchAll(/^  "([a-z0-9-]+)": async/gm)].map((m) => m[1]));

const srcFiles = walk(path.join(ROOT, "src")).filter((f) => /\.(tsx|ts)$/.test(f) && !/__tests__|\.test\.|\.spec\./.test(f));
const problems = [];

// ── 1. links ────────────────────────────────────────────────────────────────
const linkRe = /(?:href|to)=\{?\s*["'`](\/[^"'`\s]*?)["'`]|(?:router\.(?:push|replace)|redirect|permanentRedirect)\(\s*["'`](\/[^"'`\s]*?)["'`]|href=\{`(\/[^`]*?)`\}|router\.(?:push|replace)\(`(\/[^`]*?)`/g;
for (const f of srcFiles) {
  const s = fs.readFileSync(f, "utf8");
  let m;
  while ((m = linkRe.exec(s))) {
    let t = m[1] || m[2] || m[3] || m[4];
    if (!t || t.startsWith("/api/") || t.startsWith("//")) continue;
    t = t.split("?")[0].split("#")[0];
    if (!t || /\.(png|svg|jpg|jpeg|pdf|ico|webp|css|js|json|txt|xml|webmanifest)$/.test(t)) continue;
    if (/\$\{[^}]*\/[^}]*\}/.test(t)) continue; // a computed path (e.g. `${type}s/${id}`) — cannot be resolved statically
    const norm = t.replace(/\$\{[^}]*\}/g, "x");
    if (!pages.some((pm) => pm(norm))) problems.push(`DEAD LINK  ${t}  ${path.relative(ROOT, f)}:${s.slice(0, m.index).split("\n").length}`);
  }
}

// ── 2. api calls ────────────────────────────────────────────────────────────
const callPatterns = [
  { re: /fetch\(\s*[`"'](\/api\/[^`"'\s?]*)[^)]*?\)/gs, base: "", method: (m) => (m[0].match(/method:\s*["'](\w+)["']/) || [])[1] || "GET", idx: 1 },
  { re: /\bapi\.(get|post|patch|put|delete|del)\s*(?:<[^>]*>)?\(\s*[`"'](\/[^`"'\s?]*)/g, base: "/api/v1", method: (m) => ({ get: "GET", post: "POST", patch: "PATCH", put: "PUT", delete: "DELETE", del: "DELETE" })[m[1]], idx: 2 },
  { re: /\bilFetch\s*(?:<[^>]*>)?\(\s*[`"'](\/[^`"'\s?]*)[^)]*?\)/gs, base: "/api/intelligence", method: (m) => (m[0].match(/method:\s*["'](\w+)["']/) || [])[1] || "GET", idx: 1 },
];
const seen = new Set();
for (const f of srcFiles) {
  if (f.includes(`${path.sep}app${path.sep}api${path.sep}`)) continue;
  const s = fs.readFileSync(f, "utf8");
  for (const p of callPatterns) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(s))) {
      const raw = m[p.idx];
      if (!raw) continue;
      let full = raw.startsWith("/api/") ? raw : p.base + raw;
      full = full.replace(/\/\$\{[^}]*\}/g, "/x");
      const cut = full.indexOf("${"); if (cut >= 0) full = full.slice(0, cut);
      const url = full.split("?")[0].replace(/\/$/, "");
      const method = p.method(m).toUpperCase();
      const key = `${method} ${url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const where = `${path.relative(ROOT, f)}:${s.slice(0, m.index).split("\n").length}`;
      const dedicated = apis.filter((a) => a.pattern !== "/api/v1/[...slug]" && a.m(url)).sort((a, b) => a.dyn - b.dyn)[0];
      if (dedicated) {
        if (!dedicated.methods.has(method)) problems.push(`METHOD NOT EXPORTED  ${key}  → ${dedicated.pattern} exports [${[...dedicated.methods].join(",")}]  ${where}`);
        continue;
      }
      if (url.startsWith("/api/v1/")) {
        const slug = url.split("/")[3] || "";
        if (slugMap.has(slug)) continue;
        if (slug.startsWith("home-") && homeEngines.has(slug.slice(5)) && method === "GET") continue;
      }
      problems.push(`MISSING ROUTE  ${key}  ${where}`);
    }
  }
}

if (problems.length) {
  console.error(`check-ui-wiring: ${problems.length} problem(s)\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log(`check-ui-wiring: ${seen.size} distinct API calls and every internal link resolve ✓`);

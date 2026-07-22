#!/usr/bin/env node
/*
 * live-fiction-crawl.mjs — the go-live acceptance test, in CI.
 *
 * THE CLASS: demo fiction reaching a live tenant. The seeded demo world
 * (Chamberlain House, Alex T, Casey L, …) lives in ≥5 layers — the main
 * store, two parallel stores, client-side DEMO_ arrays, service fallbacks —
 * and each layer is gated separately (isLiveTenant() / demoSeed()). The
 * static guards (check-demo-seed, check-seed-refs) prove the KNOWN patterns
 * are gated; they cannot prove that no NEW render path leaks. Only actually
 * rendering the app as a live tenant can — pages here are client-rendered,
 * so a curl of the HTML shell proves nothing (it always looks empty).
 *
 * THE TEST: against a build produced with NEXT_PUBLIC_CARA_MODE=live and NO
 * Supabase keys — the worst-case misconfigured live tenant, where every
 * `if (!supabaseEnabled)` fallback fires and every gate is under maximum
 * pressure — drive a real browser over every page that has ever carried
 * demo fiction plus the core record surfaces, and assert:
 *   1. none of the demo world's distinctive tokens render anywhere;
 *   2. no page throws an uncaught exception (an empty store must not crash).
 *
 * This found 2 leaks the static guard passed (#764). It is the backstop the
 * guards are measured against.
 *
 * Usage:
 *   node scripts/live-fiction-crawl.mjs           # boots `next start` on :3100
 *                                                 # (expects a live-mode build in .next)
 *   BASE_URL=https://… node scripts/…             # crawl an existing deployment
 *                                                 # (used to prove the detector fires
 *                                                 #  on the seeded public demo)
 */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

// Distinctive demo-world tokens (the #764 proven list). Deliberately specific —
// "Alex T", not "Alex" — so a live tenant's own legitimate content can never
// false-positive.
const FICTION = [
  "Chamberlain", "Alex T", "Casey L", "Jordan H", "Willow Lodge",
  "Sarah Mitchell", "Jayden", "Amara", "yp_alex",
];

// Every page that has ever carried demo fiction (the #763 demoSeed set + the
// two page-level-gated wholly-demo pages) plus the core record surfaces the
// main/parallel stores feed. Dynamic routes ([id]) are excluded — they need a
// record to exist, and a live tenant has none.
const ROUTES = [
  // core record surfaces (main store)
  "/dashboard", "/incidents", "/young-people", "/staff", "/daily-log",
  "/safeguarding", "/tasks", "/calendar", "/rota", "/comms", "/handover",
  // shift mode renders children's names (the face-to-face timer) off the main
  // store, so it is a fiction surface; it also paints a top-level live clock.
  "/shift-mode",
  // parallel intelligence-store consumers (#762)
  "/complaints", "/interventions", "/voice",
  // client-side DEMO_ pages (#763/#764) + page-level-gated demo pages
  "/admissions/workflow", "/candidate-portal", "/communications",
  "/dashboard/cross-home-intelligence", "/direct-work", "/forms/builder",
  "/operations", "/professional-contact",
  "/cara/governance/approvals", "/cara/governance/audit", "/cara/reg45",
  "/cara/reports/new",
  "/cara-studio/audit", "/cara-studio/care-graph", "/cara-studio/child-voice",
  "/cara-studio/contradictions", "/cara-studio/decision-support",
  "/cara-studio/evidence", "/cara-studio/formulations", "/cara-studio/history",
  "/cara-studio/learning-studio", "/cara-studio/management-oversight",
  "/cara-studio/practice-intelligence", "/cara-studio/regulation-intelligence",
  "/cara-studio/role-versions", "/cara-studio/session-builder",
  "/cara-studio/therapeutic-profile", "/cara-studio/training-curriculum",
  // honest-status page (must render, no fiction, in every mode)
  "/data-persistence",
];

const PORT = 3100;
const BASE = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const external = !!process.env.BASE_URL;

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`server did not answer at ${url} within ${timeoutMs / 1000}s`);
}

let server = null;
if (!external) {
  // The build must already exist (CI builds with NEXT_PUBLIC_CARA_MODE=live
  // first). Start it with the same live env — NEXT_PUBLIC_* is baked into the
  // client bundle at build time, but server components read process.env at
  // request time, so both sides must agree.
  server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env: { ...process.env, NEXT_PUBLIC_CARA_MODE: "live", NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
    // Own process group, so finish() can kill `next start` AND its workers with
    // one group-signal. Without this, the workers outlive the crawl and hang it.
    detached: true,
  });
  server.stdout.on("data", () => {});
  server.stderr.on("data", (d) => process.stderr.write(d));
  log(`· started next start (pid ${server.pid}), waiting for ${BASE} …`);
  await waitForServer(BASE);
}

const browser = await chromium.launch();

// Crawl N routes at once. Serially this took 28 min on one CI run and 42 min on
// the next — variance that was about to blow a 45-minute timeout, and chasing it
// with a bigger number would only have hidden the real problem: 44 routes were
// being walked one at a time, each paying a cold server-render plus a settle.
// The work is almost entirely WAITING (server response, hydration), not local
// CPU, so it parallelises well. Each worker owns its own page and its own
// pageerror handler, so an error is always attributed to the route that caused
// it — a single shared page could not do that once requests interleave.
const CONCURRENCY = Number(process.env.CRAWL_CONCURRENCY ?? 6);

const failures = []; // fatal: { route, kind: "fiction"|"error"|"load"|"config", detail }
const warnings = []; // non-fatal: recoverable React hydration mismatches

// React hydration-mismatch codes (#418/#421/#422/#423/#425): the server HTML
// differs from the first client render, so React discards the server markup and
// re-renders on the client. The page still ends up correct (our fiction check
// reads the RECOVERED DOM) — these are a real but SEPARATE quality concern from
// "does demo fiction leak", and are not caused by the empty live store (they're
// time-rendering divergences that occur in demo mode too). Report, don't fail.
const isHydrationMismatch = (s) =>
  /Minified React error #4(18|21|22|23|25)\b/.test(s) ||
  /react\.dev\/errors\/4(18|21|22|23|25)\b/.test(s) ||
  /Hydration failed|did not match|Text content does not match/i.test(s);

// Hand each worker the next route off a shared cursor — keeps every worker busy
// even though page cost varies wildly (a heavy dashboard vs a thin status page).
let cursor = 0;
async function worker() {
  const page = await browser.newPage();
  // Attribution must be per-page: `route` is captured in this worker's closure,
  // so an error can never be mis-blamed on whatever another worker is loading.
  let current = "";
  page.on("pageerror", (err) => {
    const detail = String(err).slice(0, 200);
    (isHydrationMismatch(detail) ? warnings : failures).push({
      route: current, kind: isHydrationMismatch(detail) ? "hydration" : "error", detail,
    });
  });

  while (cursor < ROUTES.length) {
    const route = ROUTES[cursor++];
    current = route;
    await visit(page, route);
  }
  await page.close();
}

async function visit(page, route) {
  const url = `${BASE}${route}`;
  try {
    // NOT networkidle. This app polls in the background (React Query refetch,
    // realtime hooks), so networkidle never settles and every such page burned
    // its FULL timeout — measured at 27+ min for this crawl on CI, which is
    // 43 pages x 45s, i.e. the run died on the job timeout before finishing.
    // domcontentloaded returns as soon as the HTML is parsed; `load` is then
    // best-effort (never block on a poller), and the settle below is what
    // actually matters, because the assertion reads the HYDRATED DOM.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForLoadState("load", { timeout: 8_000 }).catch(() => {});
  } catch (e) {
    if (!String(e).includes("Timeout")) {
      failures.push({ route, kind: "load", detail: String(e).slice(0, 200) });
      return;
    }
  }
  // Let client hydration paint, then read the RENDERED text — the whole point
  // over curl. This wait is load-bearing: read too early and the page is still
  // an empty shell, which would make the fiction check pass VACUOUSLY. The
  // emptiness sentinel below is what stops that failure mode being silent.
  await page.waitForTimeout(1_200);
  const text = await page.evaluate(() => document.body?.innerText ?? "");
  // Empty-render sentinel: a page that painted nothing trivially contains no
  // fiction, so a silent empty render would turn this crawl green for the
  // worst possible reason. Every real page here paints shell chrome (nav,
  // title) far above this bound, so tripping it means the settle above is too
  // short for this runner, or the route genuinely failed to render.
  if (text.trim().length < 120) {
    failures.push({
      route, kind: "vacuous",
      detail: `rendered only ${text.trim().length} chars — page did not paint, so its "no fiction" result is meaningless`,
    });
  }
  // Non-vacuous-run sentinel: this crawl only proves anything against a
  // keys-absent live build. If Supabase keys leak into the environment the
  // status page reads "Durable mode" (and auth gates start answering) — the
  // fiction assertion would then pass vacuously against login shells.
  if (route === "/data-persistence" && !external && text.includes("Durable mode")) {
    failures.push({
      route, kind: "config",
      detail: "status page reports Durable mode — Supabase keys are present; this crawl must run against a keys-absent live build",
    });
  }
  for (const token of FICTION) {
    if (text.includes(token)) {
      const at = text.indexOf(token);
      failures.push({
        route, kind: "fiction",
        detail: `"${token}" → …${text.slice(Math.max(0, at - 40), at + 60).replace(/\s+/g, " ")}…`,
      });
    }
  }
  log(`  ${failures.some((f) => f.route === route) ? "✖" : "✔"} ${route}`);
}

// Run the pool. Workers share the cursor, so a slow route delays only itself.
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, ROUTES.length) }, () => worker()),
);

await browser.close();

// Exit for real, killing the WHOLE server process tree. This is not a tidy-up
// nicety — it is why every CI run was discarded. `next start` (spawned via npx)
// forks worker children; a bare server.kill() SIGTERMs only the npx parent, the
// workers survive, and their piped stdio keeps this Node event loop open. So on
// success the crawl printed its verdict in ~3 min and then the process HUNG for
// the rest of the job, every time, until the 90-min timeout cancelled it — the
// pass thrown away not by the crawl being slow (it never was) but by the process
// refusing to die. Local BASE_URL runs spawn no server (server=null) and exit
// cleanly, which is exactly why this never reproduced off-CI. `process.exit`
// after a group-kill guarantees we leave the moment the result is known.
function finish(code) {
  if (server?.pid) {
    try { process.kill(-server.pid, "SIGKILL"); } // negative pid = the whole group
    catch { try { server.kill("SIGKILL"); } catch { /* already gone */ } }
  }
  process.exit(code);
}

// De-dupe warnings by route+code (React can fire the same mismatch twice).
const seen = new Set();
const uniqWarnings = warnings.filter((w) => {
  const k = `${w.route}|${w.detail.slice(0, 60)}`;
  return seen.has(k) ? false : (seen.add(k), true);
});
if (uniqWarnings.length > 0) {
  log(`\n· ${uniqWarnings.length} recoverable hydration mismatch(es) (reported, non-fatal — a separate concern from demo fiction):`);
  for (const w of uniqWarnings) log(`    ⚠ ${w.route}\n        ${w.detail}`);
}

if (failures.length > 0) {
  console.error(`\nlive-fiction-crawl: ${failures.length} FATAL failure(s) — demo fiction or a genuine crash on a live tenant:\n`);
  for (const f of failures) console.error(`  ✖ [${f.kind}] ${f.route}\n      ${f.detail}`);
  finish(1);
}
log(`\nlive-fiction-crawl: ${ROUTES.length} pages rendered as a live tenant — no demo fiction, no crashes ✓`);
finish(0);

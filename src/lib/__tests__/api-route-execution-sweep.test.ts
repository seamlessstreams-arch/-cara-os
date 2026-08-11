import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Executes every static GET route handler in-process.
//
// Nothing else in the pipeline does this. tsc type-checks route modules but
// never runs them; `next build` prerenders PAGES, and API routes are dynamic
// (ƒ), so their handlers are never invoked at build time; the rest of the suite
// covers engines and a handful of named routes. A handler could therefore throw
// on its very first request and every gate would still be green.
//
// It found one on the run that introduced it: staff-training-compliance-
// intelligence read a `const` from inside a closure ~30 lines before that const
// was declared, so it threw ReferenceError on every request and the page at
// /intelligence/cara/staff-training-compliance was dead in production. tsc
// permits that shape — a block-scoped read inside a closure is legal at compile
// time because the compiler cannot know when the closure runs.
//
// Scope: GET handlers. Static routes are called bare; dynamic ([param]) routes
// are called with a probe id that deliberately matches nothing, so a 404 is the
// expected answer and any crash in param parsing, lookup or not-found handling
// still surfaces. Non-GET handlers need per-route fixture bodies and are left
// to their own tests.
//
// 4xx is FINE and expected — ~350 routes legitimately demand a childId, a date
// range, or a POST. This asserts only that a handler RESPONDS rather than
// exploding, and that it does not 5xx for reasons other than the documented
// "Supabase not configured" refusal, which is honest degradation in demo mode.
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "../../..");
const API_DIR = path.join(ROOT, "src/app/api");

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name === "route.ts") yield full;
  }
}

const allGetRoutes = [...walk(API_DIR)]
  .filter((f) => /export (async function|function|const) GET/.test(fs.readFileSync(f, "utf8")))
  .sort();

const staticRoutes = allGetRoutes.filter((f) => !f.includes("["));
const dynamicRoutes = allGetRoutes.filter((f) => f.includes("["));

// Build the URL and the params object a dynamic route expects. Next passes
// params as a PROMISE, and catch-all segments as an array — a harness that gets
// either shape wrong reports crashes that belong to the harness, not the app.
function probeFor(file: string): { urlPath: string; params: Record<string, string | string[]> } {
  const params: Record<string, string | string[]> = {};
  const segments = path
    .relative(path.join(ROOT, "src/app"), path.dirname(file))
    .split(path.sep)
    .map((segment) => {
      const match = /^\[(\.\.\.)?(.+)\]$/.exec(segment);
      if (!match) return segment;
      const name = match[2];
      params[name] = match[1] ? [PROBE_ID] : PROBE_ID;
      return PROBE_ID;
    });
  return { urlPath: "/" + segments.join("/"), params };
}

const PROBE_ID = "probe-nonexistent-id";

// A 503 that names the missing Supabase configuration is the correct answer for
// a persistence-backed feature running in demo mode, not a failure.
const SUPABASE_REQUIRED = /persistence is not configured|supabaseRequired|database not available/i;

describe("API route execution sweep", () => {
  it("has routes to sweep", () => {
    // If a refactor moves route files, the sweep must fail loudly rather than
    // silently pass over an empty list.
    expect(staticRoutes.length).toBeGreaterThan(500);
    expect(dynamicRoutes.length).toBeGreaterThan(50);
  });

  async function sweep(files: string[], dynamic: boolean) {
    const threw: string[] = [];
    const failed: string[] = [];

    for (const file of files) {
      const { urlPath, params } = dynamic
        ? probeFor(file)
        : {
            urlPath:
              "/" + path.relative(path.join(ROOT, "src/app"), path.dirname(file)).split(path.sep).join("/"),
            params: {},
          };
      const spec =
        "@/" + path.relative(path.join(ROOT, "src"), file).split(path.sep).join("/").replace(/\.ts$/, "");

      try {
        const mod = (await import(/* @vite-ignore */ spec)) as {
          GET: (r: NextRequest, ctx?: { params: Promise<Record<string, string | string[]>> }) => Promise<Response>;
        };
        const req = new NextRequest("http://localhost" + urlPath);
        const res = dynamic ? await mod.GET(req, { params: Promise.resolve(params) }) : await mod.GET(req);
        if (res.status >= 500) {
          const body = await res.text().catch(() => "");
          if (!SUPABASE_REQUIRED.test(body)) {
            failed.push(`${urlPath} -> ${res.status} ${body.slice(0, 120)}`);
          }
        }
      } catch (e) {
        threw.push(`${urlPath} -> ${(e as Error)?.message?.slice(0, 140)}`);
      }
    }

    expect({ threw, failed }).toEqual({ threw: [], failed: [] });
  }

  it("every static GET route responds without throwing", { timeout: 600_000 }, async () => {
    await sweep(staticRoutes, false);
  });

  it("every dynamic GET route responds without throwing", { timeout: 600_000 }, async () => {
    await sweep(dynamicRoutes, true);
  });
});

// ─── POST with an empty body ────────────────────────────────────────────────
//
// readJsonBody proves a body is valid JSON. It does not prove the body SAYS
// anything, and 47 handlers went straight from a parsed `{}` into
// `create({ field: body.field ?? default })` and answered 201 — writing records
// that assert things nobody recorded. contact-logs wrote outcome "positive"
// with safeguarding_concern false; care-plans wrote an active plan with
// child_id ""; pi-debriefs wrote technique_used "team_teach_holding", a
// physical restraint technique, for an incident that did not exist.
//
// A 4xx here is the correct answer. A 201 means a record was written from
// nothing, so any route that still does it has to be listed below with a
// reason — which is what stops the next one arriving unnoticed.

const POST_EMPTY_BODY_ALLOWED = new Set([
  // Analysis endpoints: they run over the whole home and treat child_id as an
  // OPTIONAL narrowing filter, so a bodyless call is the normal invocation.
  "/api/cara-studio/contradictions",
  "/api/cara-studio/early-warnings",
  "/api/cara-studio/gaps",
  "/api/cara-studio/home-dynamics",
  "/api/cara-studio/safeguarding-patterns",
  "/api/v1/cara-studio/annex-a-snapshot",
  "/api/v1/cara-studio/care-graph",
  "/api/v1/cara-studio/decision-support",
  "/api/v1/cara-studio/home-dynamics",
  "/api/v1/cara-studio/reg45-evidence",
  "/api/v1/cara-studio/reg45-reports",
  "/api/v1/cara-studio/safeguarding-patterns",
]);

const postRoutes = [...walk(API_DIR)]
  .filter((f) => /export (async function|function|const) POST/.test(fs.readFileSync(f, "utf8")))
  .sort();

describe("POST handlers reject a body that says nothing", () => {
  it("no unlisted route creates a record from {}", { timeout: 900_000 }, async () => {
    const created: string[] = [];

    for (const file of postRoutes) {
      const { urlPath, params } = file.includes("[")
        ? probeFor(file)
        : {
            urlPath:
              "/" + path.relative(path.join(ROOT, "src/app"), path.dirname(file)).split(path.sep).join("/"),
            params: {},
          };
      if (POST_EMPTY_BODY_ALLOWED.has(urlPath)) continue;
      const spec =
        "@/" + path.relative(path.join(ROOT, "src"), file).split(path.sep).join("/").replace(/\.ts$/, "");

      try {
        const mod = (await import(/* @vite-ignore */ spec)) as {
          POST: (r: NextRequest, ctx?: { params: Promise<Record<string, string | string[]>> }) => Promise<Response>;
        };
        const req = new NextRequest("http://localhost" + urlPath, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        });
        const res = file.includes("[")
          ? await mod.POST(req, { params: Promise.resolve(params) })
          : await mod.POST(req);
        if (res.status === 201) created.push(urlPath);
      } catch {
        // Throwing is covered by the GET sweep's sibling concern; this leg is
        // only about silently writing a record.
      }
    }

    expect(created).toEqual([]);
  });
});

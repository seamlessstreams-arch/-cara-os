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
// Scope: static routes only. Dynamic ([param]) routes need real params, and
// non-GET handlers need bodies; both are left to their own tests.
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

const routes = [...walk(API_DIR)]
  .filter((f) => !f.includes("["))
  .filter((f) => /export (async function|function|const) GET/.test(fs.readFileSync(f, "utf8")))
  .sort();

// A 503 that names the missing Supabase configuration is the correct answer for
// a persistence-backed feature running in demo mode, not a failure.
const SUPABASE_REQUIRED = /persistence is not configured|supabaseRequired/i;

describe("API route execution sweep", () => {
  it("has routes to sweep", () => {
    // If a refactor moves route files, the sweep must fail loudly rather than
    // silently pass over an empty list.
    expect(routes.length).toBeGreaterThan(500);
  });

  it("every static GET route responds without throwing", { timeout: 600_000 }, async () => {
    const threw: string[] = [];
    const failed: string[] = [];

    for (const file of routes) {
      const urlPath =
        "/" + path.relative(path.join(ROOT, "src/app"), path.dirname(file)).split(path.sep).join("/");
      const spec =
        "@/" + path.relative(path.join(ROOT, "src"), file).split(path.sep).join("/").replace(/\.ts$/, "");

      try {
        const mod = (await import(/* @vite-ignore */ spec)) as {
          GET: (r: NextRequest) => Promise<Response>;
        };
        const res = await mod.GET(new NextRequest("http://localhost" + urlPath));
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
  });
});

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import fs from "node:fs";
import { GET } from "../v1/[...slug]/route";

// The sweep in percent-range.test.ts skips any route whose path contains a
// dynamic segment, which excludes the whole /api/v1/[...slug] dispatcher — the
// 423 collections it serves were never reached. Same rule, applied there: a
// field named like a rate must carry a value inside 0–100.

const RATE_NAME = /(_rate|_pct|_percent|percentage|_score|Rate$|Pct$|Percentage$|Score$)/;
// A difference is legitimately negative, and a change legitimately exceeds 100.
const IS_DIFFERENCE = /(delta|change|diff|variance|trend|swing|movement|shift)/i;

function slugs(): string[] {
  const src = fs.readFileSync("src/app/api/v1/[...slug]/route.ts", "utf8");
  const i = src.indexOf("const SLUG_MAP");
  const block = src.slice(i, src.indexOf("};", i));
  return [...block.matchAll(/^\s*"?([a-z0-9-]+)"?:/gm)].map((m) => m[1]);
}

function offenders(node: unknown, at: string, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.slice(0, 30).forEach((v, i) => offenders(v, `${at}[${i}]`, found));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (typeof v === "number" && RATE_NAME.test(k) && !IS_DIFFERENCE.test(k) && (v < 0 || v > 100)) {
        found.push(`${at}.${k} = ${v}`);
      }
      offenders(v, `${at}.${k}`, found);
    }
  }
  return found;
}

describe("the dispatcher's collections emit percentages inside 0-100", () => {
  const all = slugs();

  it("resolved the dispatcher's slug map", () => {
    expect(all.length).toBeGreaterThan(200);
  });

  it("emits no out-of-range percentage", async () => {
    const bad: string[] = [];
    let probed = 0;
    for (const slug of all) {
      const req = new NextRequest(`http://localhost/api/v1/${slug}?homeId=home_oak`);
      let res: Response;
      try {
        res = await GET(req, { params: Promise.resolve({ slug: [slug] }) });
      } catch {
        continue; // a collection needing more than a bare list is not a finding
      }
      if (res.status >= 400) continue;
      probed++;
      bad.push(...offenders(await res.json(), slug));
    }
    // Non-vacuity: a sweep that probed nothing proves nothing.
    expect(probed).toBeGreaterThan(150);
    if (bad.length) console.log("OUT OF RANGE:\n" + bad.slice(0, 40).join("\n"));
    expect(bad).toEqual([]);
  }, 600_000);
});

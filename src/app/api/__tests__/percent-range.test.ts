import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// A percentage is a claim with a range. A swapped rate(), a double-counted
// numerator or a stray *100 all show up the same way: a field named like a
// rate carrying a value outside 0–100. This executes every GET route against
// the seed and inspects the numbers it actually emits, rather than the shape
// of the code that produced them.

const RATE_NAME = /(_rate|_pct|_percent|percentage|_score|Rate$|Pct$|Percentage$|Score$)/;
// A delta, change, variance or trend is a DIFFERENCE — legitimately negative,
// and a change can legitimately exceed 100% (a fivefold rise is 500%). Only a
// level is bounded to 0–100.
const IS_DIFFERENCE = /(delta|change|diff|variance|trend|swing|movement|shift)/i;

function routeFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__") continue;
      routeFiles(p, out);
    } else if (e.name === "route.ts") out.push(p);
  }
  return out;
}

function offenders(node: unknown, at: string, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.slice(0, 40).forEach((v, i) => offenders(v, `${at}[${i}]`, found));
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

describe("every percentage a GET route emits is inside 0–100", () => {
  const files = routeFiles("src/app/api").filter((f) => !f.includes("[")); // skip dynamic params
  it("has routes to probe", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("emits no out-of-range percentage", async () => {
    const bad: string[] = [];
    let probed = 0;
    for (const file of files) {
      let mod: Record<string, unknown>;
      try {
        mod = await import(pathToFileURL(path.resolve(file)).href);
      } catch {
        continue; // not importable in this harness — not a finding
      }
      const GET = mod.GET as ((r: NextRequest) => Promise<Response>) | undefined;
      if (typeof GET !== "function") continue;
      const url = "http://localhost/" + file.replace("src/app/", "").replace("/route.ts", "");
      try {
        const res = await GET(new NextRequest(url + "?homeId=home_oak&home_id=home_oak"));
        if (!res || typeof res.json !== "function") continue;
        probed++;
        const body = await res.json();
        bad.push(...offenders(body, file.replace("src/app/api/", "")));
      } catch {
        continue; // a route that needs params it did not get is not a finding
      }
    }
    // Non-vacuity: the sweep must actually have executed a meaningful number.
    expect(probed).toBeGreaterThan(30);
    if (bad.length) console.log("OUT OF RANGE:\n" + bad.slice(0, 40).join("\n"));
    expect(bad).toEqual([]);
  }, 600_000);
});

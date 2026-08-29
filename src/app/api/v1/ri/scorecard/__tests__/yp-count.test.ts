import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { getStore } from "@/lib/db/store";

// `ypCount` was the literal 3. Every per-child figure in the RI scorecard
// divides by it — `coverage = yps / ypCount` — so with a fourth child admitted
// coverage exceeds 1 and pushes the wellbeing score toward its 92 cap. It was
// right only for as long as the home held exactly three children.

const ROUTE = fs.readFileSync("src/app/api/v1/ri/scorecard/route.ts", "utf8");

describe("the RI scorecard counts the children the home actually has", () => {
  it("no longer hardcodes the count", () => {
    expect(ROUTE).not.toMatch(/ypCount:\s*\d+/);
    expect(ROUTE).toMatch(/ypCount:\s*currentChildren/);
  });

  it("derives it from current young people", () => {
    expect(ROUTE).toMatch(/youngPeople\.filter\(\(yp\) => yp\.status === "current"\)\.length/);
  });

  it("the seed's count is what the old literal happened to match — so the bug was invisible", () => {
    const current = getStore().youngPeople.filter((yp) => yp.status === "current").length;
    expect(current).toBe(3);
  });
});

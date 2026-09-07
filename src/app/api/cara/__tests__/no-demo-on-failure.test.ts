import { describe, it, expect } from "vitest";
import fs from "node:fs";

// `cara_audit_events`, `cara_sessions` and `cara_outputs` have no migration, so
// on live these queries fail. Each route answered the failure with demo
// content — invented audit events, invented history, invented pending
// approvals — which the pages render exactly as they render real data.
//
// Demo data when there is NO database is a different thing and stays: with
// nothing to read, the dev fixture is the documented behaviour.

const ROUTES = {
  audit: "src/app/api/cara/audit/route.ts",
  history: "src/app/api/cara/history/route.ts",
  pending: "src/app/api/cara/pending/route.ts",
} as const;

describe("a failed cara read never answers with invented records", () => {
  for (const [name, path] of Object.entries(ROUTES)) {
    it(`${name}: the error branch returns a storage failure, not demo data`, () => {
      const src = fs.readFileSync(path, "utf8");
      const errIdx = src.indexOf("if (error) {");
      expect(errIdx).toBeGreaterThan(0);
      // Only the branch itself — a wider window runs into the getDemo*
      // function DEFINITION that follows, which is not a return.
      const branch = src.slice(errIdx, src.indexOf("\n  }", errIdx));
      expect(branch).toMatch(/storageFailure\(/);
      expect(branch).not.toMatch(/getDemo/);
    });

    it(`${name}: still serves demo data when there is no database`, () => {
      const src = fs.readFileSync(path, "utf8");
      expect(src).toMatch(/getDemo\w*\(\)/);
    });
  }

  it("the history timeline distinguishes a failed load from an empty one", () => {
    const src = fs.readFileSync("src/components/cara/cara-history-timeline.tsx", "utf8");
    expect(src).toMatch(/isError/);
    expect(src.indexOf("if (isError)")).toBeLessThan(src.indexOf("entries.length === 0"));
  });

  it("the pending banner does not vanish when it cannot load", () => {
    const src = fs.readFileSync("src/components/cara/cara-pending-banner.tsx", "utf8");
    expect(src).toMatch(/isError/);
    expect(src.indexOf("if (isError)")).toBeLessThan(src.indexOf("return null"));
  });
});

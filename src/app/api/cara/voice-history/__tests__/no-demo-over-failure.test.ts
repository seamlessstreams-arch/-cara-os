import { describe, it, expect } from "vitest";
import fs from "node:fs";

// `cara_sessions` has no migration, so on live the session query fails. The
// route used to fall through to DEMO_HISTORY — invented reflections about a
// child called "Jake" — and the Voice Intelligence dashboard rendered them as
// this home's own. The meta said source:"demo", but the page reads only
// `data`, and a caveat nobody reads is not a caveat.

const ROUTE = fs.readFileSync("src/app/api/cara/voice-history/route.ts", "utf8");
const PAGE = fs.readFileSync("src/app/(platform)/dashboard/voice-intelligence/page.tsx", "utf8");

describe("voice history never shows invented sessions as real", () => {
  it("a failed query answers with a storage failure, not demo data", () => {
    const errorBranch = ROUTE.slice(ROUTE.indexOf("if (error) {"));
    expect(errorBranch.slice(0, 700)).toMatch(/storageFailure\("Voice history"/);
    expect(errorBranch.slice(0, 700)).not.toMatch(/Fall through to demo/);
  });

  it("the catch does not fall through to demo data either", () => {
    const catchBranch = ROUTE.slice(ROUTE.indexOf("] Database error:"));
    expect(catchBranch.slice(0, 400)).toMatch(/storageFailure/);
  });

  it("demo history is still served when there is no database at all", () => {
    // Legitimate: with Supabase off there is nothing to read, and the demo
    // record is the documented dev behaviour.
    expect(ROUTE).toMatch(/source:\s*"demo"/);
  });

  it("the page tells a failed load apart from an empty one", () => {
    expect(PAGE).toMatch(/historyError/);
    // The "none yet" copy must sit behind the error branch, not in front of it.
    // Match the rendered string, not the comment above loadHistory that quotes it.
    const rendered = PAGE.indexOf("No voice sessions yet. Record or paste");
    expect(rendered).toBeGreaterThan(0);
    expect(PAGE.indexOf("historyError ?")).toBeLessThan(rendered);
  });
});

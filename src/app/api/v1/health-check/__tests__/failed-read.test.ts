import { describe, it, expect } from "vitest";
import fs from "node:fs";

// This route answers `assessed: false` with "No records yet" when every source
// comes back empty. `safeList` swallowed a rejection into [], so a database
// outage produced exactly that answer — on the public deploy probe, a failed
// read read as a home with nothing on file.

const SRC = fs.readFileSync("src/app/api/v1/health-check/route.ts", "utf8");

describe("health-check tells a failed read apart from an empty home", () => {
  it("records that a source read failed rather than discarding it", () => {
    const guard = SRC.slice(SRC.indexOf("async function safeList"));
    expect(guard.slice(0, 400)).toMatch(/readFailed = true/);
  });

  it("answers 503 with a note saying so, not 'No records yet'", () => {
    const branch = SRC.slice(SRC.indexOf("if (failedThisRequest)"));
    expect(branch.slice(0, 900)).toMatch(/could not be read/);
    expect(branch.slice(0, 900)).toMatch(/status: 503/);
    expect(branch.slice(0, 900)).not.toMatch(/No records yet/);
  });

  it("scores nothing when it could not read — no zeros, no invented risk level", () => {
    const branch = SRC.slice(SRC.indexOf("if (failedThisRequest)"), SRC.indexOf("const hasData"));
    expect(branch).toMatch(/overall: null/);
    expect(branch).toMatch(/risk_level: null/);
    expect(branch).not.toMatch(/overall: 0/);
  });

  it("resets the flag per request — module scope outlives one invocation", () => {
    expect(SRC).toMatch(/readFailed = false;/);
    expect(SRC.indexOf("const failedThisRequest")).toBeLessThan(SRC.indexOf("if (failedThisRequest)"));
  });

  it("still reports an genuinely empty home as unassessed, not as a failure", () => {
    expect(SRC).toMatch(/No records yet/);
  });
});

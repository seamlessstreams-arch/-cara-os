// ══════════════════════════════════════════════════════════════════════════════
// CARA OS — AI GATEWAY BYPASS GUARD (vitest wrapper)
//
// Runs scripts/check-ai-gateway.js inside the test suite so CI fails if any
// code sends content to an AI provider without going through the AI Gateway.
// See that script for the rules and the allowlisted provider-seam files.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

describe("AI Gateway bypass guard", () => {
  it("no code calls an AI provider directly outside the gateway's provider seam", { timeout: 60000 }, () => {
    const script = path.join(process.cwd(), "scripts", "check-ai-gateway.js");
    let output = "";
    let failed = false;
    try {
      output = execFileSync("node", [script], { encoding: "utf8" });
    } catch (err) {
      failed = true;
      const e = err as { stdout?: string; stderr?: string };
      output = `${e.stdout ?? ""}\n${e.stderr ?? ""}`;
    }
    expect(failed, `check-ai-gateway reported violations:\n${output}`).toBe(false);
    expect(output).toContain("AI Gateway bypass check passed");
  });
});

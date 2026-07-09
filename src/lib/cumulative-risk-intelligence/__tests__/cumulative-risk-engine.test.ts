// Integration test: REAL store → cumulative risk intelligence builder.
// Confirms the pure builder produces the exact `data` shape the cockpit consumes.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildCumulativeRiskIntelligence } from "../cumulative-risk-engine";

const CUMULATIVE_SIGNALS = ["escalating", "concerning", "stable", "improving"] as const;

describe("buildCumulativeRiskIntelligence", () => {
  const result = buildCumulativeRiskIntelligence(getStore());

  it("returns a summary object", () => {
    expect(result.summary).toBeDefined();
    expect(typeof result.summary).toBe("object");
    expect(typeof result.summary.escalatingCount).toBe("number");
    expect(typeof result.summary.urgentSupervisionCount).toBe("number");
    expect(typeof result.summary.mostCommonWorseningSignal).toBe("string");
  });

  it("returns childProfiles as an array", () => {
    expect(Array.isArray(result.childProfiles)).toBe(true);
  });

  it("gives every profile a valid cumulative signal", () => {
    for (const profile of result.childProfiles) {
      expect(CUMULATIVE_SIGNALS).toContain(profile.signal);
    }
  });
});

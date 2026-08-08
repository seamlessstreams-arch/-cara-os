import { describe, expect, it } from "vitest";
import { scoreReadiness, type ReadinessInputs } from "../ofsted-readiness";

const EMPTY: ReadinessInputs = {
  goldenThread: [],
  openSignals: [],
  childVoice: [],
  aiRuns: [],
  supervisions: [],
  training: [],
  todayIso: "2026-08-08",
};

describe("scoreReadiness — fabricate-on-empty is closed", () => {
  it("does NOT score a perfect safeguarding mark from zero evidence", () => {
    // The old engine did `100 - highRiskOpen*12`, so an empty home (0 high
    // risks) scored a fabricated 100 on safeguarding.
    const r = scoreReadiness(EMPTY);
    expect(r.safeguardingScore).toBe(0);
  });

  it("does NOT hand out the old hardcoded workforce 70 with no records", () => {
    const r = scoreReadiness(EMPTY);
    expect(r.workforceScore).toBe(0);
  });

  it("an all-empty home scores near zero overall, not a fabricated middle", () => {
    const r = scoreReadiness(EMPTY);
    expect(r.overall).toBe(0);
  });
});

describe("scoreReadiness — real evidence scores honestly", () => {
  it("keeps the safeguarding 100-minus logic once the home is recording", () => {
    const recording = { ...EMPTY, goldenThread: [{ management_oversight_present: true }] };
    expect(scoreReadiness(recording).safeguardingScore).toBe(100); // recording, no high risks
    const withRisk = { ...recording, openSignals: [{ risk_level: "high" }, { risk_level: "critical" }] };
    expect(scoreReadiness(withRisk).safeguardingScore).toBe(100 - 2 * 12);
  });

  it("computes workforce from supervision cadence + training validity", () => {
    const r = scoreReadiness({
      ...EMPTY,
      supervisions: Array.from({ length: 12 }, () => ({ status: "completed" })), // full cadence → 100
      training: [
        { status: "valid", expiry_date: "2027-01-01" },
        { status: "valid", expiry_date: "2027-01-01" },
        { status: "expired", expiry_date: "2025-01-01" }, // 2/3 valid ≈ 67
      ],
    });
    // (100 + 67) / 2 ≈ 83
    expect(r.workforceScore).toBeGreaterThanOrEqual(80);
    expect(r.workforceScore).toBeLessThanOrEqual(85);
    expect(r.evidenceStrength.completedSupervisions).toBe(12);
    expect(r.evidenceStrength.validTraining).toBe(2);
  });

  it("treats expired-by-date training as invalid even if status isn't 'expired'", () => {
    const r = scoreReadiness({
      ...EMPTY,
      training: [{ status: "active", expiry_date: "2025-01-01" }], // in the past → invalid
    });
    expect(r.evidenceStrength.validTraining).toBe(0);
    expect(r.workforceScore).toBe(0); // 0 valid of 1, no supervisions
  });

  it("flags weak workforce evidence in missingEvidence", () => {
    expect(scoreReadiness(EMPTY).missingEvidence).toContain(
      "Workforce evidence (supervision and training) is weaker than expected.",
    );
  });
});

import { describe, it, expect } from "vitest";
import { scanEvidenceGaps, type EvidenceGapScanInput } from "../evidence-gap-scanner";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

const emptyInput: EvidenceGapScanInput = {
  homeId: "home-1",
  children: [],
  incidents: [],
  reg44: [],
  reg45: [],
  riskAssessments: [],
  placementPlans: [],
  staffSupervisions: [],
  training: [],
  complaints: [],
  patterns: [],
};

describe("scanEvidenceGaps", () => {
  it("returns no gaps when all data is healthy", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      children: [{ id: "c1", name: "Alex", lastKeyWorkDate: daysAgo(5), lastVoiceDate: daysAgo(10) }],
      incidents: [{ id: "i1", childId: "c1", date: daysAgo(3), hasOversight: true, hasFollowUp: true, severity: "low" }],
      reg44: [{ lastVisitDate: daysAgo(20), overdueActions: 0 }],
      reg45: [{ lastReviewDate: daysAgo(90) }],
      staffSupervisions: [{ staffId: "s1", staffName: "Jo", lastDate: daysAgo(10), frequencyWeeks: 4 }],
      training: [{ staffId: "s1", staffName: "Jo", expiryDate: daysAgo(-30), course: "Safeguarding" }],
      complaints: [{ id: "comp1", status: "closed", openedDate: daysAgo(50) }],
      patterns: [{ id: "p1", hasLearningReview: true }],
    };
    const result = scanEvidenceGaps(input);
    expect(result.totalGaps).toBe(0);
    expect(result.criticalCount).toBe(0);
  });

  it("flags no_recent_key_work when >14 days since last session", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      children: [{ id: "c1", name: "Sam", lastKeyWorkDate: daysAgo(20) }],
    };
    const result = scanEvidenceGaps(input);
    expect(result.gaps.some((g) => g.type === "no_recent_key_work")).toBe(true);
    expect(result.gaps[0].severity).toBe("medium");
  });

  it("escalates key work to high when >30 days", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      children: [{ id: "c1", name: "Sam", lastKeyWorkDate: daysAgo(35) }],
    };
    const result = scanEvidenceGaps(input);
    const gap = result.gaps.find((g) => g.type === "no_recent_key_work");
    expect(gap?.severity).toBe("high");
  });

  it("flags no_child_voice when >30 days", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      children: [{ id: "c1", name: "Kai", lastKeyWorkDate: daysAgo(5), lastVoiceDate: daysAgo(40) }],
    };
    const result = scanEvidenceGaps(input);
    expect(result.gaps.some((g) => g.type === "no_child_voice")).toBe(true);
  });

  it("marks child voice gap as critical when >60 days", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      children: [{ id: "c1", name: "Kai", lastKeyWorkDate: daysAgo(5), lastVoiceDate: daysAgo(70) }],
    };
    const result = scanEvidenceGaps(input);
    const gap = result.gaps.find((g) => g.type === "no_child_voice");
    expect(gap?.severity).toBe("critical");
  });

  it("flags incident_no_oversight when >2 days without oversight", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      incidents: [{ id: "i1", childId: "c1", date: daysAgo(5), hasOversight: false, hasFollowUp: true, severity: "low" }],
    };
    const result = scanEvidenceGaps(input);
    expect(result.gaps.some((g) => g.type === "incident_no_oversight")).toBe(true);
  });

  it("marks serious incident without oversight as critical", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      incidents: [{ id: "i1", childId: "c1", date: daysAgo(4), hasOversight: false, hasFollowUp: true, severity: "serious" }],
    };
    const result = scanEvidenceGaps(input);
    const gap = result.gaps.find((g) => g.type === "incident_no_oversight");
    expect(gap?.severity).toBe("critical");
  });

  it("flags reg44_overdue when >35 days since last visit", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      reg44: [{ lastVisitDate: daysAgo(40), overdueActions: 0 }],
    };
    const result = scanEvidenceGaps(input);
    expect(result.gaps.some((g) => g.type === "reg44_overdue")).toBe(true);
  });

  it("flags reg45_missing when >180 days since last review", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      reg45: [{ lastReviewDate: daysAgo(200) }],
    };
    const result = scanEvidenceGaps(input);
    const gap = result.gaps.find((g) => g.type === "reg45_missing");
    expect(gap).toBeDefined();
    expect(gap?.severity).toBe("critical");
  });

  it("flags supervision_overdue based on frequency", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      staffSupervisions: [{ staffId: "s1", staffName: "Tom", lastDate: daysAgo(50), frequencyWeeks: 4 }],
    };
    const result = scanEvidenceGaps(input);
    expect(result.gaps.some((g) => g.type === "supervision_overdue")).toBe(true);
  });

  it("flags training_expired when expiry is in the past", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      training: [{ staffId: "s1", staffName: "Emma", expiryDate: daysAgo(10), course: "Fire Safety" }],
    };
    const result = scanEvidenceGaps(input);
    expect(result.gaps.some((g) => g.type === "training_expired")).toBe(true);
  });

  it("flags complaint_not_closed when open >28 days", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      complaints: [{ id: "comp1", status: "open", openedDate: daysAgo(35) }],
    };
    const result = scanEvidenceGaps(input);
    expect(result.gaps.some((g) => g.type === "complaint_not_closed")).toBe(true);
  });

  it("flags repeated_pattern_no_review", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      patterns: [{ id: "p1", hasLearningReview: false }],
    };
    const result = scanEvidenceGaps(input);
    expect(result.gaps.some((g) => g.type === "repeated_pattern_no_review")).toBe(true);
  });

  it("correctly sums gapsByType", () => {
    const input: EvidenceGapScanInput = {
      ...emptyInput,
      children: [
        { id: "c1", name: "A", lastKeyWorkDate: daysAgo(20), lastVoiceDate: daysAgo(5) },
        { id: "c2", name: "B", lastKeyWorkDate: daysAgo(25), lastVoiceDate: daysAgo(5) },
      ],
    };
    const result = scanEvidenceGaps(input);
    expect(result.gapsByType["no_recent_key_work"]).toBe(2);
    expect(result.totalGaps).toBe(2);
  });
});

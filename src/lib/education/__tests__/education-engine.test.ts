// ══════════════════════════════════════════════════════════════════════════════
// Education Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getPlacementLabel,
  getAttainmentLabel,
  getRatingLabel,
  evaluateEducationQuality,
  evaluateEducationCompliance,
  evaluateEducationPolicy,
  evaluateStaffEducationReadiness,
  buildChildEducationProfiles,
  generateEducationIntelligence,
} from "../education-engine";
import type {
  EducationRecord,
  EducationPolicy,
  StaffEducationTraining,
} from "../education-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<EducationRecord> = {}): EducationRecord {
  return {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    termDate: "2026-04-01",
    placement: "mainstream_school",
    attainment: "expected",
    pepReviewedThisTerm: true,
    attendanceAbove95: true,
    pupilPremiumAllocated: true,
    designatedTeacherEngaged: true,
    exclusionThisTerm: false,
    virtualSchoolInvolved: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<EducationPolicy> = {}): EducationPolicy {
  return {
    id: "pol-001",
    educationStrategy: true,
    pepComplianceFramework: true,
    attendanceMonitoring: true,
    exclusionPrevention: true,
    pupilPremiumTracking: true,
    schoolLiaisonProtocol: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffEducationTraining> = {}): StaffEducationTraining {
  return {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    educationRegulations: true,
    pepProcess: true,
    attendanceSupport: true,
    senAwareness: true,
    virtualSchoolLiaison: true,
    educationAdvocacy: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("label functions", () => {
  it("getPlacementLabel returns correct labels", () => {
    expect(getPlacementLabel("mainstream_school")).toBe("Mainstream School");
    expect(getPlacementLabel("special_school")).toBe("Special School");
    expect(getPlacementLabel("alternative_provision")).toBe("Alternative Provision");
    expect(getPlacementLabel("neet")).toBe("NEET");
    expect(getPlacementLabel("awaiting_placement")).toBe("Awaiting Placement");
  });

  it("getAttainmentLabel returns correct labels", () => {
    expect(getAttainmentLabel("exceeding")).toBe("Exceeding");
    expect(getAttainmentLabel("expected")).toBe("Expected");
    expect(getAttainmentLabel("developing")).toBe("Developing");
    expect(getAttainmentLabel("below_expected")).toBe("Below Expected");
    expect(getAttainmentLabel("not_assessed")).toBe("Not Assessed");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateEducationQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEducationQuality", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateEducationQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.attainmentRate).toBe(0);
    expect(result.attendanceRate).toBe(0);
    expect(result.noExclusionRate).toBe(0);
    expect(result.designatedTeacherRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("scores maximum for perfect records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-002" })];
    const result = evaluateEducationQuality(records);
    expect(result.attainmentRate).toBe(100);
    expect(result.attendanceRate).toBe(100);
    expect(result.noExclusionRate).toBe(100);
    expect(result.designatedTeacherRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("counts exceeding as positive attainment", () => {
    const records = [makeRecord({ attainment: "exceeding" })];
    const result = evaluateEducationQuality(records);
    expect(result.attainmentRate).toBe(100);
  });

  it("counts expected as positive attainment", () => {
    const records = [makeRecord({ attainment: "expected" })];
    const result = evaluateEducationQuality(records);
    expect(result.attainmentRate).toBe(100);
  });

  it("does not count developing as positive attainment", () => {
    const records = [makeRecord({ attainment: "developing" })];
    const result = evaluateEducationQuality(records);
    expect(result.attainmentRate).toBe(0);
  });

  it("does not count below_expected as positive attainment", () => {
    const records = [makeRecord({ attainment: "below_expected" })];
    const result = evaluateEducationQuality(records);
    expect(result.attainmentRate).toBe(0);
  });

  it("calculates attendance rate correctly", () => {
    const records = [
      makeRecord({ attendanceAbove95: true }),
      makeRecord({ id: "rec-002", attendanceAbove95: false }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.attendanceRate).toBe(50);
  });

  it("calculates no-exclusion rate correctly", () => {
    const records = [
      makeRecord({ exclusionThisTerm: false }),
      makeRecord({ id: "rec-002", exclusionThisTerm: true }),
      makeRecord({ id: "rec-003", exclusionThisTerm: false }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.noExclusionRate).toBe(67);
  });

  it("calculates designated teacher rate correctly", () => {
    const records = [
      makeRecord({ designatedTeacherEngaged: true }),
      makeRecord({ id: "rec-002", designatedTeacherEngaged: false }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.designatedTeacherRate).toBe(50);
  });

  it("generates strength for high attainment", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `rec-${i}` }));
    const result = evaluateEducationQuality(records);
    expect(result.strengths.some((s) => s.includes("attainment"))).toBe(true);
  });

  it("generates concern for low attendance", () => {
    const records = [
      makeRecord({ attendanceAbove95: false }),
      makeRecord({ id: "rec-002", attendanceAbove95: false }),
      makeRecord({ id: "rec-003", attendanceAbove95: false }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.concerns.some((c) => c.includes("Attendance"))).toBe(true);
  });

  it("score is capped at 25", () => {
    const records = [makeRecord()];
    const result = evaluateEducationQuality(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateEducationCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEducationCompliance", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateEducationCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.pepRate).toBe(0);
    expect(result.pupilPremiumRate).toBe(0);
    expect(result.virtualSchoolRate).toBe(0);
    expect(result.placementDiversityRatio).toBe(0);
    expect(result.score).toBe(0);
  });

  it("scores maximum for perfect records", () => {
    // Need all 8 placement types for max diversity
    const placements = [
      "mainstream_school", "special_school", "alternative_provision",
      "home_education", "pupil_referral_unit", "further_education",
      "awaiting_placement", "neet",
    ] as const;
    const records = placements.map((p, i) => makeRecord({ id: `rec-${i}`, placement: p }));
    const result = evaluateEducationCompliance(records);
    expect(result.pepRate).toBe(100);
    expect(result.pupilPremiumRate).toBe(100);
    expect(result.virtualSchoolRate).toBe(100);
    expect(result.placementDiversityRatio).toBe(1);
    expect(result.score).toBe(25);
  });

  it("calculates PEP rate correctly", () => {
    const records = [
      makeRecord({ pepReviewedThisTerm: true }),
      makeRecord({ id: "rec-002", pepReviewedThisTerm: false }),
    ];
    const result = evaluateEducationCompliance(records);
    expect(result.pepRate).toBe(50);
  });

  it("calculates pupil premium rate correctly", () => {
    const records = [
      makeRecord({ pupilPremiumAllocated: true }),
      makeRecord({ id: "rec-002", pupilPremiumAllocated: false }),
      makeRecord({ id: "rec-003", pupilPremiumAllocated: true }),
    ];
    const result = evaluateEducationCompliance(records);
    expect(result.pupilPremiumRate).toBe(67);
  });

  it("calculates virtual school rate correctly", () => {
    const records = [
      makeRecord({ virtualSchoolInvolved: false }),
    ];
    const result = evaluateEducationCompliance(records);
    expect(result.virtualSchoolRate).toBe(0);
  });

  it("calculates placement diversity ratio correctly", () => {
    const records = [
      makeRecord({ placement: "mainstream_school" }),
      makeRecord({ id: "rec-002", placement: "special_school" }),
    ];
    const result = evaluateEducationCompliance(records);
    expect(result.uniquePlacements).toBe(2);
    expect(result.placementDiversityRatio).toBe(0.25);
  });

  it("generates strength for high PEP compliance", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `rec-${i}` }));
    const result = evaluateEducationCompliance(records);
    expect(result.strengths.some((s) => s.includes("PEP"))).toBe(true);
  });

  it("generates concern for low pupil premium", () => {
    const records = [
      makeRecord({ pupilPremiumAllocated: false }),
      makeRecord({ id: "rec-002", pupilPremiumAllocated: false }),
      makeRecord({ id: "rec-003", pupilPremiumAllocated: false }),
    ];
    const result = evaluateEducationCompliance(records);
    expect(result.concerns.some((c) => c.includes("Pupil Premium"))).toBe(true);
  });

  it("score is capped at 25", () => {
    const records = [makeRecord()];
    const result = evaluateEducationCompliance(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateEducationPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEducationPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateEducationPolicy(null);
    expect(result.score).toBe(0);
    expect(result.educationStrategy).toBe(false);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("scores 25 for all-true policy", () => {
    const result = evaluateEducationPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("weights educationStrategy at 4 points", () => {
    const base = evaluateEducationPolicy(makePolicy({ educationStrategy: false }));
    const full = evaluateEducationPolicy(makePolicy());
    expect(full.score - base.score).toBe(4);
  });

  it("weights pepComplianceFramework at 4 points", () => {
    const base = evaluateEducationPolicy(makePolicy({ pepComplianceFramework: false }));
    const full = evaluateEducationPolicy(makePolicy());
    expect(full.score - base.score).toBe(4);
  });

  it("weights attendanceMonitoring at 4 points", () => {
    const base = evaluateEducationPolicy(makePolicy({ attendanceMonitoring: false }));
    const full = evaluateEducationPolicy(makePolicy());
    expect(full.score - base.score).toBe(4);
  });

  it("weights exclusionPrevention at 4 points", () => {
    const base = evaluateEducationPolicy(makePolicy({ exclusionPrevention: false }));
    const full = evaluateEducationPolicy(makePolicy());
    expect(full.score - base.score).toBe(4);
  });

  it("weights pupilPremiumTracking at 3 points", () => {
    const base = evaluateEducationPolicy(makePolicy({ pupilPremiumTracking: false }));
    const full = evaluateEducationPolicy(makePolicy());
    expect(full.score - base.score).toBe(3);
  });

  it("weights schoolLiaisonProtocol at 3 points", () => {
    const base = evaluateEducationPolicy(makePolicy({ schoolLiaisonProtocol: false }));
    const full = evaluateEducationPolicy(makePolicy());
    expect(full.score - base.score).toBe(3);
  });

  it("weights regularReview at 3 points", () => {
    const base = evaluateEducationPolicy(makePolicy({ regularReview: false }));
    const full = evaluateEducationPolicy(makePolicy());
    expect(full.score - base.score).toBe(3);
  });

  it("generates strength for complete policy", () => {
    const result = evaluateEducationPolicy(makePolicy());
    expect(result.strengths.some((s) => s.includes("7/7"))).toBe(true);
  });

  it("generates concern for missing education strategy", () => {
    const result = evaluateEducationPolicy(makePolicy({ educationStrategy: false }));
    expect(result.concerns.some((c) => c.includes("education strategy"))).toBe(true);
  });

  it("generates concern for missing PEP framework", () => {
    const result = evaluateEducationPolicy(makePolicy({ pepComplianceFramework: false }));
    expect(result.concerns.some((c) => c.includes("PEP compliance framework"))).toBe(true);
  });

  it("scores 0 for all-false policy", () => {
    const result = evaluateEducationPolicy(makePolicy({
      educationStrategy: false,
      pepComplianceFramework: false,
      attendanceMonitoring: false,
      exclusionPrevention: false,
      pupilPremiumTracking: false,
      schoolLiaisonProtocol: false,
      regularReview: false,
    }));
    expect(result.score).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffEducationReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffEducationReadiness", () => {
  it("returns 0 for empty training array", () => {
    const result = evaluateStaffEducationReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("scores maximum for fully trained staff", () => {
    const training = [makeTraining(), makeTraining({ id: "tr-002", staffId: "staff-tom", staffName: "Tom" })];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.score).toBe(25);
  });

  it("calculates education regulations rate correctly", () => {
    const training = [
      makeTraining({ educationRegulations: true }),
      makeTraining({ id: "tr-002", staffId: "s2", staffName: "B", educationRegulations: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.educationRegulationsRate).toBe(50);
  });

  it("calculates PEP process rate correctly", () => {
    const training = [
      makeTraining({ pepProcess: true }),
      makeTraining({ id: "tr-002", staffId: "s2", staffName: "B", pepProcess: false }),
      makeTraining({ id: "tr-003", staffId: "s3", staffName: "C", pepProcess: true }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.pepProcessRate).toBe(67);
  });

  it("uses correct weight order: 6+5+5+4+3+2", () => {
    // Staff with only educationRegulations true (weight 6)
    const training1 = [makeTraining({
      educationRegulations: true,
      pepProcess: false,
      attendanceSupport: false,
      senAwareness: false,
      virtualSchoolLiaison: false,
      educationAdvocacy: false,
    })];
    const r1 = evaluateStaffEducationReadiness(training1);
    expect(r1.score).toBe(6);

    // Staff with only pepProcess true (weight 5)
    const training2 = [makeTraining({
      educationRegulations: false,
      pepProcess: true,
      attendanceSupport: false,
      senAwareness: false,
      virtualSchoolLiaison: false,
      educationAdvocacy: false,
    })];
    const r2 = evaluateStaffEducationReadiness(training2);
    expect(r2.score).toBe(5);

    // Staff with only educationAdvocacy true (weight 2)
    const training3 = [makeTraining({
      educationRegulations: false,
      pepProcess: false,
      attendanceSupport: false,
      senAwareness: false,
      virtualSchoolLiaison: false,
      educationAdvocacy: true,
    })];
    const r3 = evaluateStaffEducationReadiness(training3);
    expect(r3.score).toBe(2);
  });

  it("generates strength for high training rates", () => {
    const training = [makeTraining()];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates concern for low training rates", () => {
    const training = [makeTraining({
      educationRegulations: false,
      pepProcess: false,
      attendanceSupport: false,
      senAwareness: false,
      virtualSchoolLiaison: false,
      educationAdvocacy: false,
    })];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("score is capped at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildEducationProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildEducationProfiles", () => {
  it("returns empty array for no records", () => {
    const result = buildChildEducationProfiles([]);
    expect(result).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex" }),
      makeRecord({ id: "rec-002", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "rec-003", childId: "c2", childName: "Jordan" }),
    ];
    const result = buildChildEducationProfiles(records);
    expect(result).toHaveLength(2);
    expect(result.find((p) => p.childId === "c1")!.totalRecords).toBe(2);
    expect(result.find((p) => p.childId === "c2")!.totalRecords).toBe(1);
  });

  it("calculates attainment rate per child", () => {
    const records = [
      makeRecord({ childId: "c1", attainment: "expected" }),
      makeRecord({ id: "rec-002", childId: "c1", attainment: "below_expected" }),
    ];
    const result = buildChildEducationProfiles(records);
    expect(result[0].attainmentRate).toBe(50);
  });

  it("calculates attendance rate per child", () => {
    const records = [
      makeRecord({ childId: "c1", attendanceAbove95: true }),
      makeRecord({ id: "rec-002", childId: "c1", attendanceAbove95: false }),
      makeRecord({ id: "rec-003", childId: "c1", attendanceAbove95: true }),
    ];
    const result = buildChildEducationProfiles(records);
    expect(result[0].attendanceRate).toBe(67);
  });

  it("counts exclusions per child", () => {
    const records = [
      makeRecord({ childId: "c1", exclusionThisTerm: true }),
      makeRecord({ id: "rec-002", childId: "c1", exclusionThisTerm: true }),
      makeRecord({ id: "rec-003", childId: "c1", exclusionThisTerm: false }),
    ];
    const result = buildChildEducationProfiles(records);
    expect(result[0].exclusionCount).toBe(2);
  });

  it("freq score: >=10 records -> 2", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "c1" }),
    );
    const result = buildChildEducationProfiles(records);
    // freq=2, rate1=3, rate2=3, noExclusion=2 = 10
    expect(result[0].educationScore).toBe(10);
  });

  it("freq score: >=5 records -> 1", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "c1" }),
    );
    const result = buildChildEducationProfiles(records);
    // freq=1, rate1=3, rate2=3, noExclusion=2 = 9
    expect(result[0].educationScore).toBe(9);
  });

  it("freq score: <5 records -> 0", () => {
    const records = [makeRecord({ childId: "c1" })];
    const result = buildChildEducationProfiles(records);
    // freq=0, rate1=3, rate2=3, noExclusion=2 = 8
    expect(result[0].educationScore).toBe(8);
  });

  it("noExclusion bonus: 0 exclusions -> 2", () => {
    const records = [makeRecord({ childId: "c1", exclusionThisTerm: false })];
    const result = buildChildEducationProfiles(records);
    // includes noExclusion bonus of 2
    expect(result[0].educationScore).toBeGreaterThanOrEqual(2);
  });

  it("noExclusion bonus: any exclusion -> 0", () => {
    const records = [makeRecord({ childId: "c1", exclusionThisTerm: true })];
    const result = buildChildEducationProfiles(records);
    // freq=0, rate1=3, rate2=3, noExclusion=0 = 6
    expect(result[0].educationScore).toBe(6);
  });

  it("score capped at 10", () => {
    const records = Array.from({ length: 15 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "c1" }),
    );
    const result = buildChildEducationProfiles(records);
    expect(result[0].educationScore).toBeLessThanOrEqual(10);
  });

  it("rate1 returns 0 for low attainment", () => {
    const records = [
      makeRecord({ childId: "c1", attainment: "below_expected" }),
      makeRecord({ id: "rec-002", childId: "c1", attainment: "not_assessed" }),
      makeRecord({ id: "rec-003", childId: "c1", attainment: "developing" }),
      makeRecord({ id: "rec-004", childId: "c1", attainment: "below_expected" }),
    ];
    const result = buildChildEducationProfiles(records);
    // attainmentRate = 0%, rate1Score = 0
    expect(result[0].attainmentRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateEducationIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateEducationIntelligence", () => {
  it("returns full intelligence with all sections", () => {
    const records = [makeRecord()];
    const result = generateEducationIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.rating).toBeDefined();
    expect(result.educationQuality).toBeDefined();
    expect(result.educationCompliance).toBeDefined();
    expect(result.educationPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("overall score is sum of four evaluators capped at 100", () => {
    const records = [makeRecord()];
    const result = generateEducationIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    const sum = Math.round(
      result.educationQuality.score +
      result.educationCompliance.score +
      result.educationPolicy.score +
      result.staffReadiness.score,
    );
    expect(result.overallScore).toBe(Math.min(100, sum));
  });

  it("returns outstanding for perfect inputs", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `rec-${i}` }));
    const result = generateEducationIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for empty inputs", () => {
    const result = generateEducationIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("generates exactly 7 regulatory links", () => {
    const result = generateEducationIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Reg 8 in regulatory links", () => {
    const result = generateEducationIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 8"))).toBe(true);
  });

  it("includes Virtual School Head in regulatory links", () => {
    const result = generateEducationIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Virtual School Head"))).toBe(true);
  });

  it("includes PEP requirements in regulatory links", () => {
    const result = generateEducationIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("PEP"))).toBe(true);
  });

  it("generates strengths for high-scoring evaluators", () => {
    const records = [makeRecord()];
    const result = generateEducationIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low-scoring evaluators", () => {
    const result = generateEducationIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT action when policy is null", () => {
    const result = generateEducationIntelligence(
      [makeRecord()], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action when no staff training", () => {
    const result = generateEducationIntelligence(
      [makeRecord()], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("generates action for low attainment rate", () => {
    const records = [
      makeRecord({ attainment: "below_expected" }),
      makeRecord({ id: "rec-002", attainment: "developing" }),
      makeRecord({ id: "rec-003", attainment: "not_assessed" }),
    ];
    const result = generateEducationIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("Attainment rate"))).toBe(true);
  });

  it("generates action for low PEP compliance", () => {
    const records = [
      makeRecord({ pepReviewedThisTerm: false }),
      makeRecord({ id: "rec-002", pepReviewedThisTerm: false }),
      makeRecord({ id: "rec-003", pepReviewedThisTerm: false }),
    ];
    const result = generateEducationIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("PEP compliance"))).toBe(true);
  });

  it("generates no-action message when all is well", () => {
    const records = [makeRecord()];
    const result = generateEducationIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("includes child profiles in output", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex" }),
      makeRecord({ id: "rec-002", childId: "c2", childName: "Jordan" }),
    ];
    const result = generateEducationIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  it("has assessedAt timestamp", () => {
    const result = generateEducationIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.assessedAt).toBeDefined();
    expect(typeof result.assessedAt).toBe("string");
  });
});

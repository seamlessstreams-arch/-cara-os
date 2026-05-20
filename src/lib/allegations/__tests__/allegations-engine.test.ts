import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getAllegationCategoryLabel,
  getAllegationOutcomeLabel,
  getRatingLabel,
  evaluateAllegationQuality,
  evaluateAllegationCompliance,
  evaluateAllegationPolicy,
  evaluateStaffAllegationReadiness,
  buildChildAllegationProfiles,
  generateAllegationsIntelligence,
} from "../allegations-engine";
import type {
  AllegationRecord,
  AllegationPolicy,
  StaffAllegationTraining,
} from "../allegations-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<AllegationRecord> = {}): AllegationRecord {
  return {
    id: "rec-1",
    childId: "child-1",
    childName: "Test Child",
    reportDate: "2026-03-15",
    category: "physical_abuse",
    ladoReferralMade: true,
    ofstedNotified: true,
    childSupportOffered: true,
    staffSupportProvided: true,
    documentationComplete: true,
    timelyInvestigation: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<AllegationPolicy> = {}): AllegationPolicy {
  return {
    id: "pol-1",
    allegationsPolicy: true,
    ladoReferralProtocol: true,
    ofstedNotificationProcedure: true,
    dbsReferralGuidance: true,
    childProtectionFramework: true,
    whistleblowingPolicy: true,
    reviewSchedule: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffAllegationTraining> = {}): StaffAllegationTraining {
  return {
    id: "t-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    safeguardingKnowledge: true,
    allegationProcedures: true,
    ladoProcess: true,
    investigationSkills: true,
    childProtection: true,
    recordKeeping: true,
    ...overrides,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => { expect(pct(5, 0)).toBe(0); });
  it("returns 100 for equal num and den", () => { expect(pct(10, 10)).toBe(100); });
  it("returns 50 for half", () => { expect(pct(5, 10)).toBe(50); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
  it("returns 0 for 0 numerator", () => { expect(pct(0, 10)).toBe(0); });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ── Label Helpers ──────────────────────────────────────────────────────────

describe("getAllegationCategoryLabel", () => {
  it("returns human-readable labels", () => {
    expect(getAllegationCategoryLabel("physical_abuse")).toBe("Physical Abuse");
    expect(getAllegationCategoryLabel("emotional_abuse")).toBe("Emotional Abuse");
    expect(getAllegationCategoryLabel("sexual_abuse")).toBe("Sexual Abuse");
    expect(getAllegationCategoryLabel("neglect")).toBe("Neglect");
    expect(getAllegationCategoryLabel("inappropriate_restraint")).toBe("Inappropriate Restraint");
    expect(getAllegationCategoryLabel("professional_boundary")).toBe("Professional Boundary");
    expect(getAllegationCategoryLabel("failure_to_safeguard")).toBe("Failure to Safeguard");
    expect(getAllegationCategoryLabel("whistleblowing_concern")).toBe("Whistleblowing Concern");
  });
});

describe("getAllegationOutcomeLabel", () => {
  it("returns human-readable labels", () => {
    expect(getAllegationOutcomeLabel("substantiated")).toBe("Substantiated");
    expect(getAllegationOutcomeLabel("unsubstantiated")).toBe("Unsubstantiated");
    expect(getAllegationOutcomeLabel("unfounded")).toBe("Unfounded");
    expect(getAllegationOutcomeLabel("malicious")).toBe("Malicious");
    expect(getAllegationOutcomeLabel("ongoing")).toBe("Ongoing");
  });
});

describe("getRatingLabel", () => {
  it("formats rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
});

// ── Evaluator 1: Allegation Quality ────────────────────────────────────────

describe("evaluateAllegationQuality", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateAllegationQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalAllegations).toBe(0);
    expect(result.ladoReferralRate).toBe(0);
  });

  it("returns max score for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const result = evaluateAllegationQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalAllegations).toBe(2);
    expect(result.ladoReferralRate).toBe(100);
    expect(result.ofstedNotifiedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ ladoReferralMade: false, ofstedNotified: false, childSupportOffered: false, staffSupportProvided: false })];
    const result = evaluateAllegationQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates mixed rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", ladoReferralMade: true, ofstedNotified: false, childSupportOffered: true, staffSupportProvided: false }),
      makeRecord({ id: "r2", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: false, staffSupportProvided: false }),
    ];
    const result = evaluateAllegationQuality(records);
    expect(result.ladoReferralRate).toBe(100);
    expect(result.ofstedNotifiedRate).toBe(50);
    expect(result.childSupportRate).toBe(50);
    expect(result.staffSupportRate).toBe(0);
  });

  it("applies correct weights (7+6+6+6=25)", () => {
    const records = [makeRecord({ ofstedNotified: false, childSupportOffered: false, staffSupportProvided: false })];
    const result = evaluateAllegationQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("caps score at 25", () => {
    const result = evaluateAllegationQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 2: Allegation Compliance ─────────────────────────────────────

describe("evaluateAllegationCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateAllegationCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.documentationRate).toBe(0);
  });

  it("calculates documentation and timely rates", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyInvestigation: true }),
      makeRecord({ id: "r2", documentationComplete: true, timelyInvestigation: false }),
      makeRecord({ id: "r3", documentationComplete: false, timelyInvestigation: false }),
    ];
    const result = evaluateAllegationCompliance(records);
    expect(result.documentationRate).toBe(67);
    expect(result.timelyInvestigationRate).toBe(33);
  });

  it("calculates category diversity correctly", () => {
    const records = [makeRecord({ category: "physical_abuse" })];
    const result = evaluateAllegationCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13);
  });

  it("returns high diversity for many categories", () => {
    const categories: Array<AllegationRecord["category"]> = [
      "physical_abuse", "emotional_abuse", "sexual_abuse", "neglect",
      "inappropriate_restraint", "professional_boundary", "failure_to_safeguard", "whistleblowing_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateAllegationCompliance(records);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("applies correct weights (8+7+5+5=25)", () => {
    const categories: Array<AllegationRecord["category"]> = [
      "physical_abuse", "emotional_abuse", "sexual_abuse", "neglect",
      "inappropriate_restraint", "professional_boundary", "failure_to_safeguard", "whistleblowing_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateAllegationCompliance(records);
    expect(result.overallScore).toBe(25);
  });
});

// ── Evaluator 3: Allegation Policy ─────────────────────────────────────────

describe("evaluateAllegationPolicy", () => {
  it("returns zeros for null policy", () => {
    const result = evaluateAllegationPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.allegationsPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateAllegationPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateAllegationPolicy(makePolicy({
      allegationsPolicy: false, ladoReferralProtocol: false, ofstedNotificationProcedure: false,
      dbsReferralGuidance: false, childProtectionFramework: false, whistleblowingPolicy: false, reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("weights first 4 at 4 points each", () => {
    const result = evaluateAllegationPolicy(makePolicy({
      allegationsPolicy: true, ladoReferralProtocol: false, ofstedNotificationProcedure: false,
      dbsReferralGuidance: false, childProtectionFramework: false, whistleblowingPolicy: false, reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    const result = evaluateAllegationPolicy(makePolicy({
      allegationsPolicy: false, ladoReferralProtocol: false, ofstedNotificationProcedure: false,
      dbsReferralGuidance: false, childProtectionFramework: true, whistleblowingPolicy: true, reviewSchedule: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("handles partial policy (first 4 only = 16)", () => {
    const result = evaluateAllegationPolicy(makePolicy({
      childProtectionFramework: false, whistleblowingPolicy: false, reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(16);
    expect(result.rating).toBe("good");
  });

  it("preserves boolean values in result", () => {
    const result = evaluateAllegationPolicy(makePolicy({ allegationsPolicy: true, ladoReferralProtocol: false }));
    expect(result.allegationsPolicy).toBe(true);
    expect(result.ladoReferralProtocol).toBe(false);
  });
});

// ── Evaluator 4: Staff Readiness ───────────────────────────────────────────

describe("evaluateStaffAllegationReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffAllegationReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for all-true staff", () => {
    const staff = [makeTraining(), makeTraining({ id: "t-2", staffId: "staff-2" })];
    const result = evaluateStaffAllegationReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeTraining({
      safeguardingKnowledge: false, allegationProcedures: false, ladoProcess: false,
      investigationSkills: false, childProtection: false, recordKeeping: false,
    })];
    const result = evaluateStaffAllegationReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2=25)", () => {
    const staff = [makeTraining({
      allegationProcedures: false, ladoProcess: false, investigationSkills: false,
      childProtection: false, recordKeeping: false,
    })];
    const result = evaluateStaffAllegationReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("only recordKeeping true gives weight-2 score", () => {
    const staff = [makeTraining({
      safeguardingKnowledge: false, allegationProcedures: false, ladoProcess: false,
      investigationSkills: false, childProtection: false, recordKeeping: true,
    })];
    const result = evaluateStaffAllegationReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      makeTraining({ id: "t-1", safeguardingKnowledge: true, allegationProcedures: true, ladoProcess: false, investigationSkills: false, childProtection: false, recordKeeping: false }),
      makeTraining({ id: "t-2", staffId: "s-2", safeguardingKnowledge: true, allegationProcedures: false, ladoProcess: true, investigationSkills: false, childProtection: false, recordKeeping: false }),
    ];
    const result = evaluateStaffAllegationReadiness(staff);
    expect(result.safeguardingKnowledgeRate).toBe(100);
    expect(result.allegationProceduresRate).toBe(50);
    expect(result.ladoProcessRate).toBe(50);
  });
});

// ── Child Profiles ─────────────────────────────────────────────────────────

describe("buildChildAllegationProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildAllegationProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildAllegationProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "c1")?.totalRecords).toBe(2);
  });

  it("scores frequency: >=10→2, >=5→1, <5→0", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", ladoReferralMade: false, childSupportOffered: false }),
    );
    const profiles = buildChildAllegationProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores rate1 (ladoReferralRate): >=80→3", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", ladoReferralMade: i < 4, childSupportOffered: false }),
    );
    const profiles = buildChildAllegationProfiles(recs);
    // freq=1, rate1(80%)=3, rate2(0%)=0, diversity(1)=0 → 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("scores diversity: >=4→2, >=2→1", () => {
    const categories: Array<AllegationRecord["category"]> = [
      "physical_abuse", "emotional_abuse", "sexual_abuse", "neglect",
    ];
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: cat, ladoReferralMade: false, childSupportOffered: false }),
    );
    const profiles = buildChildAllegationProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps at 10", () => {
    const categories: Array<AllegationRecord["category"]> = [
      "physical_abuse", "emotional_abuse", "sexual_abuse", "neglect",
    ];
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: categories[i % 4] }),
    );
    const profiles = buildChildAllegationProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("2 categories gives diversity 1", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", category: "physical_abuse", ladoReferralMade: false, childSupportOffered: false }),
      makeRecord({ id: "r2", childId: "c1", category: "neglect", ladoReferralMade: false, childSupportOffered: false }),
    ];
    const profiles = buildChildAllegationProfiles(recs);
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });
});

// ── Additional Quality Edge Cases ──────────────────────────────────────────

describe("evaluateAllegationQuality — additional", () => {
  it("single record with only ladoReferralMade true gives weight-7 score", () => {
    const records = [makeRecord({ ofstedNotified: false, childSupportOffered: false, staffSupportProvided: false })];
    const result = evaluateAllegationQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("handles large record sets", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `r-${i}`, ladoReferralMade: i % 2 === 0 }),
    );
    const result = evaluateAllegationQuality(records);
    expect(result.ladoReferralRate).toBe(50);
    expect(result.totalAllegations).toBe(100);
  });

  it("rating maps correctly for low score", () => {
    const records = [makeRecord({ ladoReferralMade: false, ofstedNotified: false, childSupportOffered: false, staffSupportProvided: false })];
    const result = evaluateAllegationQuality(records);
    expect(result.rating).toBe("inadequate");
  });
});

// ── Additional Compliance Edge Cases ──────────────────────────────────────

describe("evaluateAllegationCompliance — additional", () => {
  it("two categories gives 25% diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "physical_abuse" }),
      makeRecord({ id: "r2", category: "emotional_abuse" }),
    ];
    const result = evaluateAllegationCompliance(records);
    expect(result.categoryDiversityRatio).toBe(25);
  });

  it("all compliance false with single category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyInvestigation: false, childSupportOffered: false })];
    const result = evaluateAllegationCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyInvestigationRate).toBe(0);
    expect(result.overallScore).toBe(1); // only diversity 13% × 5 = 0.65 → 1
  });
});

// ── Additional Policy Edge Cases ──────────────────────────────────────────

describe("evaluateAllegationPolicy — additional", () => {
  it("single middle policy gives 4 points", () => {
    const result = evaluateAllegationPolicy(makePolicy({
      allegationsPolicy: false, ladoReferralProtocol: false, ofstedNotificationProcedure: true,
      dbsReferralGuidance: false, childProtectionFramework: false, whistleblowingPolicy: false, reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("rating for score 9 → 36 → inadequate", () => {
    const result = evaluateAllegationPolicy(makePolicy({
      allegationsPolicy: false, ladoReferralProtocol: false, ofstedNotificationProcedure: false,
      dbsReferralGuidance: false, childProtectionFramework: true, whistleblowingPolicy: true, reviewSchedule: true,
    }));
    expect(result.overallScore).toBe(9);
    expect(result.rating).toBe("inadequate");
  });
});

// ── Additional Staff Edge Cases ───────────────────────────────────────────

describe("evaluateStaffAllegationReadiness — additional", () => {
  it("3 staff with mixed skills", () => {
    const staff = [
      makeTraining({ id: "t-1", staffId: "s1" }),
      makeTraining({ id: "t-2", staffId: "s2", safeguardingKnowledge: false, allegationProcedures: false }),
      makeTraining({ id: "t-3", staffId: "s3", ladoProcess: false, investigationSkills: false, childProtection: false, recordKeeping: false }),
    ];
    const result = evaluateStaffAllegationReadiness(staff);
    expect(result.totalStaff).toBe(3);
    expect(result.safeguardingKnowledgeRate).toBe(67);
  });
});

// ── Additional Child Profile Edge Cases ───────────────────────────────────

describe("buildChildAllegationProfiles — additional", () => {
  it("rate2 childSupportRate 60% → 2 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", ladoReferralMade: false, childSupportOffered: i < 3 }),
    );
    const profiles = buildChildAllegationProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(60%)=2, diversity(1)=0 → 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("preserves child name from first record", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex Updated" }),
    ];
    const profiles = buildChildAllegationProfiles(recs);
    expect(profiles[0].childName).toBe("Alex");
  });

  it("rate1 40% → 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", ladoReferralMade: i < 2, childSupportOffered: false }),
    );
    const profiles = buildChildAllegationProfiles(recs);
    // freq=1, rate1(40%)=1, rate2(0%)=0, diversity(1)=0 → 2
    expect(profiles[0].overallScore).toBe(2);
  });
});

// ── Master Generator ───────────────────────────────────────────────────────

describe("generateAllegationsIntelligence", () => {
  it("returns correct structure with all data", () => {
    const result = generateAllegationsIntelligence([makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.allegationQuality).toBeDefined();
    expect(result.allegationCompliance).toBeDefined();
    expect(result.allegationPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("sums 4 evaluator scores", () => {
    const result = generateAllegationsIntelligence([makeRecord()], makePolicy(), [makeTraining()], "h", "s", "e");
    const expectedTotal = result.allegationQuality.overallScore + result.allegationCompliance.overallScore + result.allegationPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedTotal));
  });

  it("caps overall score at 100", () => {
    const result = generateAllegationsIntelligence([makeRecord()], makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns inadequate for empty data", () => {
    const result = generateAllegationsIntelligence([], null, [], "h", "s", "e");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for metrics >= 80%", () => {
    const categories: Array<AllegationRecord["category"]> = [
      "physical_abuse", "emotional_abuse", "sexual_abuse", "neglect",
      "inappropriate_restraint", "professional_boundary", "failure_to_safeguard", "whistleblowing_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateAllegationsIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low metrics", () => {
    const records = [makeRecord({
      ladoReferralMade: false, ofstedNotified: false, childSupportOffered: false,
      staffSupportProvided: false, documentationComplete: false, timelyInvestigation: false,
    })];
    const result = generateAllegationsIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateAllegationsIntelligence([makeRecord()], null, [makeTraining()], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when staff is empty", () => {
    const result = generateAllegationsIntelligence([makeRecord()], makePolicy(), [], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
    ];
    const result = generateAllegationsIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.childProfiles).toHaveLength(2);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateAllegationsIntelligence([], null, [], "h", "s", "e");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 37");
  });

  it("no areas for improvement when all metrics high", () => {
    const categories: Array<AllegationRecord["category"]> = [
      "physical_abuse", "emotional_abuse", "sexual_abuse", "neglect",
      "inappropriate_restraint", "professional_boundary", "failure_to_safeguard", "whistleblowing_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateAllegationsIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty childProfiles when no records", () => {
    const result = generateAllegationsIntelligence([], makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.childProfiles).toHaveLength(0);
  });

  it("returns outstanding for fully compliant data", () => {
    const categories: Array<AllegationRecord["category"]> = [
      "physical_abuse", "emotional_abuse", "sexual_abuse", "neglect",
      "inappropriate_restraint", "professional_boundary", "failure_to_safeguard", "whistleblowing_concern",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateAllegationsIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBe(100);
  });

  it("generates actions for low metrics (<50%)", () => {
    const records = [makeRecord({
      ladoReferralMade: false, ofstedNotified: false, childSupportOffered: false,
      documentationComplete: false, timelyInvestigation: false,
    })];
    const staff = [makeTraining({ ladoProcess: false })];
    const result = generateAllegationsIntelligence(records, makePolicy(), staff, "h", "s", "e");
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("no strengths when all metrics are low", () => {
    const records = [makeRecord({
      ladoReferralMade: false, ofstedNotified: false, childSupportOffered: false,
      staffSupportProvided: false, documentationComplete: false, timelyInvestigation: false,
    })];
    const staff = [makeTraining({
      safeguardingKnowledge: false, allegationProcedures: false, ladoProcess: false,
      investigationSkills: false, childProtection: false, recordKeeping: false,
    })];
    const result = generateAllegationsIntelligence(records, null, staff, "h", "s", "e");
    expect(result.strengths).toHaveLength(0);
  });

  it("handles mixed children and categories in profiles", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex", category: "physical_abuse" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex", category: "neglect" }),
      makeRecord({ id: "r3", childId: "c2", childName: "Jordan", category: "sexual_abuse" }),
    ];
    const result = generateAllegationsIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.childProfiles).toHaveLength(2);
    const alex = result.childProfiles.find(p => p.childId === "c1");
    expect(alex?.categoriesCovered).toHaveLength(2);
  });
});

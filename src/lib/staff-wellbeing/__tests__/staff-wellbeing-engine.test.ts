import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getStaffWellbeingCategoryLabel,
  getStaffWellbeingOutcomeLabel,
  getRatingLabel,
  evaluateWellbeingQuality,
  evaluateWellbeingCompliance,
  evaluateWellbeingPolicy,
  evaluateStaffWellbeingReadiness,
  buildStaffWellbeingProfiles,
  generateStaffWellbeingIntelligence,
} from "../staff-wellbeing-engine";
import type {
  StaffWellbeingRecord,
  StaffWellbeingPolicy,
  StaffWellbeingTraining,
} from "../staff-wellbeing-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<StaffWellbeingRecord> = {}): StaffWellbeingRecord {
  return {
    id: "rec-1",
    homeId: "oak-house",
    date: "2026-03-15",
    staffId: "staff-1",
    staffName: "Test Staff",
    category: "supervision_support",
    outcome: "thriving",
    supervisionReceived: true,
    wellbeingChecked: true,
    debriefOffered: true,
    supportAccessed: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<StaffWellbeingPolicy> = {}): StaffWellbeingPolicy {
  return {
    staffWellbeingPolicy: true,
    supervisionFramework: true,
    debriefingProtocol: true,
    employeeAssistanceProgramme: true,
    workloadManagementPolicy: true,
    sicknessAbsencePolicy: true,
    recognitionScheme: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffWellbeingTraining> = {}): StaffWellbeingTraining {
  return {
    staffId: "staff-1",
    supervisionDelivery: true,
    wellbeingAssessment: true,
    debriefingSkills: true,
    stressManagement: true,
    teamBuilding: true,
    conflictMediation: true,
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

describe("getStaffWellbeingCategoryLabel", () => {
  it("returns human-readable labels", () => {
    expect(getStaffWellbeingCategoryLabel("supervision_support")).toBe("Supervision Support");
    expect(getStaffWellbeingCategoryLabel("workload_management")).toBe("Workload Management");
    expect(getStaffWellbeingCategoryLabel("emotional_wellbeing")).toBe("Emotional Wellbeing");
    expect(getStaffWellbeingCategoryLabel("professional_development")).toBe("Professional Development");
    expect(getStaffWellbeingCategoryLabel("team_cohesion")).toBe("Team Cohesion");
    expect(getStaffWellbeingCategoryLabel("work_life_balance")).toBe("Work Life Balance");
    expect(getStaffWellbeingCategoryLabel("resilience_support")).toBe("Resilience Support");
    expect(getStaffWellbeingCategoryLabel("recognition_reward")).toBe("Recognition Reward");
  });
});

describe("getStaffWellbeingOutcomeLabel", () => {
  it("returns human-readable labels", () => {
    expect(getStaffWellbeingOutcomeLabel("thriving")).toBe("Thriving");
    expect(getStaffWellbeingOutcomeLabel("managing")).toBe("Managing");
    expect(getStaffWellbeingOutcomeLabel("struggling")).toBe("Struggling");
    expect(getStaffWellbeingOutcomeLabel("at_risk")).toBe("At Risk");
    expect(getStaffWellbeingOutcomeLabel("on_leave")).toBe("On Leave");
  });
});

describe("getRatingLabel", () => {
  it("formats rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
});

// ── Evaluator 1: Wellbeing Quality ─────────────────────────────────────────

describe("evaluateWellbeingQuality", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateWellbeingQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalRecords).toBe(0);
    expect(result.supervisionReceivedRate).toBe(0);
  });

  it("returns max score for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const result = evaluateWellbeingQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalRecords).toBe(2);
    expect(result.supervisionReceivedRate).toBe(100);
    expect(result.wellbeingCheckedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ supervisionReceived: false, wellbeingChecked: false, debriefOffered: false, supportAccessed: false })];
    const result = evaluateWellbeingQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates mixed rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", supervisionReceived: true, wellbeingChecked: false, debriefOffered: true, supportAccessed: false }),
      makeRecord({ id: "r2", supervisionReceived: true, wellbeingChecked: true, debriefOffered: false, supportAccessed: false }),
    ];
    const result = evaluateWellbeingQuality(records);
    expect(result.supervisionReceivedRate).toBe(100);
    expect(result.wellbeingCheckedRate).toBe(50);
    expect(result.debriefOfferedRate).toBe(50);
    expect(result.supportAccessedRate).toBe(0);
  });

  it("applies correct weights (7+6+6+6=25)", () => {
    const records = [makeRecord({ wellbeingChecked: false, debriefOffered: false, supportAccessed: false })];
    const result = evaluateWellbeingQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("caps score at 25", () => {
    const result = evaluateWellbeingQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 2: Wellbeing Compliance ──────────────────────────────────────

describe("evaluateWellbeingCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateWellbeingCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.documentationRate).toBe(0);
  });

  it("calculates documentation and timely rates", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r2", documentationComplete: true, timelyRecording: false }),
      makeRecord({ id: "r3", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateWellbeingCompliance(records);
    expect(result.documentationRate).toBe(67);
    expect(result.timelyRecordingRate).toBe(33);
  });

  it("calculates category diversity correctly", () => {
    const records = [makeRecord({ category: "supervision_support" })];
    const result = evaluateWellbeingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13);
  });

  it("returns high diversity for many categories", () => {
    const categories: Array<StaffWellbeingRecord["category"]> = [
      "supervision_support", "workload_management", "emotional_wellbeing", "professional_development",
      "team_cohesion", "work_life_balance", "resilience_support", "recognition_reward",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateWellbeingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("applies correct weights (8+7+5+5=25)", () => {
    const categories: Array<StaffWellbeingRecord["category"]> = [
      "supervision_support", "workload_management", "emotional_wellbeing", "professional_development",
      "team_cohesion", "work_life_balance", "resilience_support", "recognition_reward",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateWellbeingCompliance(records);
    expect(result.overallScore).toBe(25);
  });
});

// ── Evaluator 3: Wellbeing Policy ──────────────────────────────────────────

describe("evaluateWellbeingPolicy", () => {
  it("returns zeros for null policy", () => {
    const result = evaluateWellbeingPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.staffWellbeingPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateWellbeingPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateWellbeingPolicy(makePolicy({
      staffWellbeingPolicy: false, supervisionFramework: false, debriefingProtocol: false,
      employeeAssistanceProgramme: false, workloadManagementPolicy: false, sicknessAbsencePolicy: false, recognitionScheme: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("weights first 4 at 4 points each", () => {
    const result = evaluateWellbeingPolicy(makePolicy({
      staffWellbeingPolicy: true, supervisionFramework: false, debriefingProtocol: false,
      employeeAssistanceProgramme: false, workloadManagementPolicy: false, sicknessAbsencePolicy: false, recognitionScheme: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    const result = evaluateWellbeingPolicy(makePolicy({
      staffWellbeingPolicy: false, supervisionFramework: false, debriefingProtocol: false,
      employeeAssistanceProgramme: false, workloadManagementPolicy: true, sicknessAbsencePolicy: true, recognitionScheme: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("handles partial policy (first 4 only = 16)", () => {
    const result = evaluateWellbeingPolicy(makePolicy({
      workloadManagementPolicy: false, sicknessAbsencePolicy: false, recognitionScheme: false,
    }));
    expect(result.overallScore).toBe(16);
    expect(result.rating).toBe("good");
  });

  it("preserves boolean values in result", () => {
    const result = evaluateWellbeingPolicy(makePolicy({ staffWellbeingPolicy: true, supervisionFramework: false }));
    expect(result.staffWellbeingPolicy).toBe(true);
    expect(result.supervisionFramework).toBe(false);
  });
});

// ── Evaluator 4: Staff Readiness ───────────────────────────────────────────

describe("evaluateStaffWellbeingReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffWellbeingReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for all-true staff", () => {
    const staff = [makeTraining(), makeTraining({ staffId: "staff-2" })];
    const result = evaluateStaffWellbeingReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeTraining({
      supervisionDelivery: false, wellbeingAssessment: false, debriefingSkills: false,
      stressManagement: false, teamBuilding: false, conflictMediation: false,
    })];
    const result = evaluateStaffWellbeingReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2=25)", () => {
    const staff = [makeTraining({
      wellbeingAssessment: false, debriefingSkills: false, stressManagement: false,
      teamBuilding: false, conflictMediation: false,
    })];
    const result = evaluateStaffWellbeingReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("only conflictMediation true gives weight-2 score", () => {
    const staff = [makeTraining({
      supervisionDelivery: false, wellbeingAssessment: false, debriefingSkills: false,
      stressManagement: false, teamBuilding: false, conflictMediation: true,
    })];
    const result = evaluateStaffWellbeingReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      makeTraining({ staffId: "s1", supervisionDelivery: true, wellbeingAssessment: true, debriefingSkills: false, stressManagement: false, teamBuilding: false, conflictMediation: false }),
      makeTraining({ staffId: "s2", supervisionDelivery: true, wellbeingAssessment: false, debriefingSkills: true, stressManagement: false, teamBuilding: false, conflictMediation: false }),
    ];
    const result = evaluateStaffWellbeingReadiness(staff);
    expect(result.supervisionDeliveryRate).toBe(100);
    expect(result.wellbeingAssessmentRate).toBe(50);
    expect(result.debriefingSkillsRate).toBe(50);
  });
});

// ── Staff Profiles ─────────────────────────────────────────────────────────

describe("buildStaffWellbeingProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildStaffWellbeingProfiles([])).toEqual([]);
  });

  it("groups by staffId", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s2", staffName: "Tom" }),
      makeRecord({ id: "r3", staffId: "s1", staffName: "Sarah" }),
    ];
    const profiles = buildStaffWellbeingProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.staffId === "s1")?.totalRecords).toBe(2);
  });

  it("scores frequency: >=10 gives 2, >=5 gives 1, <5 gives 0", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", supervisionReceived: false, wellbeingChecked: false }),
    );
    const profiles = buildStaffWellbeingProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores rate1 (supervisionReceivedRate): >=80 gives 3", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", supervisionReceived: i < 4, wellbeingChecked: false }),
    );
    const profiles = buildStaffWellbeingProfiles(recs);
    // freq=1, rate1(80%)=3, rate2(0%)=0, diversity(1)=0 -> 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("scores diversity: >=4 gives 2, >=2 gives 1", () => {
    const categories: Array<StaffWellbeingRecord["category"]> = [
      "supervision_support", "workload_management", "emotional_wellbeing", "professional_development",
    ];
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", category: cat, supervisionReceived: false, wellbeingChecked: false }),
    );
    const profiles = buildStaffWellbeingProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps at 10", () => {
    const categories: Array<StaffWellbeingRecord["category"]> = [
      "supervision_support", "workload_management", "emotional_wellbeing", "professional_development",
    ];
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", category: categories[i % 4] }),
    );
    const profiles = buildStaffWellbeingProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("2 categories gives diversity 1", () => {
    const recs = [
      makeRecord({ id: "r1", staffId: "s1", category: "supervision_support", supervisionReceived: false, wellbeingChecked: false }),
      makeRecord({ id: "r2", staffId: "s1", category: "workload_management", supervisionReceived: false, wellbeingChecked: false }),
    ];
    const profiles = buildStaffWellbeingProfiles(recs);
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });
});

// ── Additional Quality Edge Cases ──────────────────────────────────────────

describe("evaluateWellbeingQuality — additional", () => {
  it("single record with only supervisionReceived true gives weight-7 score", () => {
    const records = [makeRecord({ wellbeingChecked: false, debriefOffered: false, supportAccessed: false })];
    const result = evaluateWellbeingQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("handles large record sets", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `r-${i}`, supervisionReceived: i % 2 === 0 }),
    );
    const result = evaluateWellbeingQuality(records);
    expect(result.supervisionReceivedRate).toBe(50);
    expect(result.totalRecords).toBe(100);
  });

  it("rating maps correctly for low score", () => {
    const records = [makeRecord({ supervisionReceived: false, wellbeingChecked: false, debriefOffered: false, supportAccessed: false })];
    const result = evaluateWellbeingQuality(records);
    expect(result.rating).toBe("inadequate");
  });
});

// ── Additional Compliance Edge Cases ───────────────────────────────────────

describe("evaluateWellbeingCompliance — additional", () => {
  it("two categories gives 25% diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "supervision_support" }),
      makeRecord({ id: "r2", category: "workload_management" }),
    ];
    const result = evaluateWellbeingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(25);
  });

  it("all compliance false with single category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, supervisionReceived: false })];
    const result = evaluateWellbeingCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.overallScore).toBe(1); // only diversity 13% x 5 = 0.65 -> 1
  });
});

// ── Additional Policy Edge Cases ───────────────────────────────────────────

describe("evaluateWellbeingPolicy — additional", () => {
  it("single middle policy gives 4 points", () => {
    const result = evaluateWellbeingPolicy(makePolicy({
      staffWellbeingPolicy: false, supervisionFramework: false, debriefingProtocol: true,
      employeeAssistanceProgramme: false, workloadManagementPolicy: false, sicknessAbsencePolicy: false, recognitionScheme: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("rating for score 9 -> 36 -> inadequate", () => {
    const result = evaluateWellbeingPolicy(makePolicy({
      staffWellbeingPolicy: false, supervisionFramework: false, debriefingProtocol: false,
      employeeAssistanceProgramme: false, workloadManagementPolicy: true, sicknessAbsencePolicy: true, recognitionScheme: true,
    }));
    expect(result.overallScore).toBe(9);
    expect(result.rating).toBe("inadequate");
  });
});

// ── Additional Staff Readiness Edge Cases ──────────────────────────────────

describe("evaluateStaffWellbeingReadiness — additional", () => {
  it("3 staff with mixed skills", () => {
    const staff = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", supervisionDelivery: false, wellbeingAssessment: false }),
      makeTraining({ staffId: "s3", debriefingSkills: false, stressManagement: false, teamBuilding: false, conflictMediation: false }),
    ];
    const result = evaluateStaffWellbeingReadiness(staff);
    expect(result.totalStaff).toBe(3);
    expect(result.supervisionDeliveryRate).toBe(67);
  });
});

// ── Additional Staff Profile Edge Cases ────────────────────────────────────

describe("buildStaffWellbeingProfiles — additional", () => {
  it("rate2 wellbeingCheckedRate 60% gives 2 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", supervisionReceived: false, wellbeingChecked: i < 3 }),
    );
    const profiles = buildStaffWellbeingProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(60%)=2, diversity(1)=0 -> 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("preserves staff name from first record", () => {
    const recs = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s1", staffName: "Sarah Updated" }),
    ];
    const profiles = buildStaffWellbeingProfiles(recs);
    expect(profiles[0].staffName).toBe("Sarah");
  });

  it("rate1 40% gives 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", supervisionReceived: i < 2, wellbeingChecked: false }),
    );
    const profiles = buildStaffWellbeingProfiles(recs);
    // freq=1, rate1(40%)=1, rate2(0%)=0, diversity(1)=0 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });
});

// ── Master Generator ───────────────────────────────────────────────────────

describe("generateStaffWellbeingIntelligence", () => {
  it("returns correct structure with all data", () => {
    const result = generateStaffWellbeingIntelligence([makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.wellbeingQuality).toBeDefined();
    expect(result.wellbeingCompliance).toBeDefined();
    expect(result.wellbeingPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.staffProfiles).toBeDefined();
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("sums 4 evaluator scores", () => {
    const result = generateStaffWellbeingIntelligence([makeRecord()], makePolicy(), [makeTraining()], "h", "s", "e");
    const expectedTotal = result.wellbeingQuality.overallScore + result.wellbeingCompliance.overallScore + result.wellbeingPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedTotal));
  });

  it("caps overall score at 100", () => {
    const result = generateStaffWellbeingIntelligence([makeRecord()], makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns inadequate for empty data", () => {
    const result = generateStaffWellbeingIntelligence([], null, [], "h", "s", "e");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for metrics >= 80%", () => {
    const categories: Array<StaffWellbeingRecord["category"]> = [
      "supervision_support", "workload_management", "emotional_wellbeing", "professional_development",
      "team_cohesion", "work_life_balance", "resilience_support", "recognition_reward",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateStaffWellbeingIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low metrics", () => {
    const records = [makeRecord({
      supervisionReceived: false, wellbeingChecked: false, debriefOffered: false,
      supportAccessed: false, documentationComplete: false, timelyRecording: false,
    })];
    const result = generateStaffWellbeingIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateStaffWellbeingIntelligence([makeRecord()], null, [makeTraining()], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when staff is empty", () => {
    const result = generateStaffWellbeingIntelligence([makeRecord()], makePolicy(), [], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("builds staff profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s2", staffName: "Tom" }),
    ];
    const result = generateStaffWellbeingIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.staffProfiles).toHaveLength(2);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateStaffWellbeingIntelligence([], null, [], "h", "s", "e");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 31");
  });

  it("no areas for improvement when all metrics high", () => {
    const categories: Array<StaffWellbeingRecord["category"]> = [
      "supervision_support", "workload_management", "emotional_wellbeing", "professional_development",
      "team_cohesion", "work_life_balance", "resilience_support", "recognition_reward",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateStaffWellbeingIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty staffProfiles when no records", () => {
    const result = generateStaffWellbeingIntelligence([], makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.staffProfiles).toHaveLength(0);
  });

  it("returns outstanding for fully compliant data", () => {
    const categories: Array<StaffWellbeingRecord["category"]> = [
      "supervision_support", "workload_management", "emotional_wellbeing", "professional_development",
      "team_cohesion", "work_life_balance", "resilience_support", "recognition_reward",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateStaffWellbeingIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBe(100);
  });

  it("generates actions for low metrics (<50%)", () => {
    const records = [makeRecord({
      supervisionReceived: false, wellbeingChecked: false, debriefOffered: false,
      documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeTraining({ debriefingSkills: false })];
    const result = generateStaffWellbeingIntelligence(records, makePolicy(), staff, "h", "s", "e");
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("no strengths when all metrics are low", () => {
    const records = [makeRecord({
      supervisionReceived: false, wellbeingChecked: false, debriefOffered: false,
      supportAccessed: false, documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeTraining({
      supervisionDelivery: false, wellbeingAssessment: false, debriefingSkills: false,
      stressManagement: false, teamBuilding: false, conflictMediation: false,
    })];
    const result = generateStaffWellbeingIntelligence(records, null, staff, "h", "s", "e");
    expect(result.strengths).toHaveLength(0);
  });

  it("handles mixed staff and categories in profiles", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah", category: "supervision_support" }),
      makeRecord({ id: "r2", staffId: "s1", staffName: "Sarah", category: "workload_management" }),
      makeRecord({ id: "r3", staffId: "s2", staffName: "Tom", category: "emotional_wellbeing" }),
    ];
    const result = generateStaffWellbeingIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.staffProfiles).toHaveLength(2);
    const sarah = result.staffProfiles.find(p => p.staffId === "s1");
    expect(sarah?.categoriesCovered).toHaveLength(2);
  });
});

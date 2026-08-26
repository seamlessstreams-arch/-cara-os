import { describe, it, expect } from "vitest";
import {
  evaluateCarePlanningQuality,
  evaluateCarePlanningCompliance,
  evaluateCarePlanningPolicyCompliance,
  evaluateStaffCarePlanningCompetency,
  buildChildCarePlanningProfiles,
  generateCarePlanningIntelligenceReport,
  getRating,
  getCarePlanningCategoryLabel,
  getCarePlanningOutcomeLabel,
  getCarePlanningRatingLabel,
  type CarePlanningRecord,
  type CarePlanningPolicy,
  type StaffCarePlanningCompetency,
  type CarePlanningCategory,
} from "../care-planning-intelligence-engine";

function rec(overrides: Partial<CarePlanningRecord> = {}): CarePlanningRecord {
  return {
    id: "rec-1", homeId: "home-oak-house", date: "2025-06-15", childId: "child-alex", childName: "Alex",
    category: "care_plan_creation", outcome: "plan_fully_implemented",
    childViewIncorporated: true, measurableOutcomesSet: true, multiAgencyInputIncluded: true, reviewDateSet: true,
    documentationComplete: true, timelyRecording: true,
    ...overrides,
  };
}

function fullPolicy(): CarePlanningPolicy {
  return { carePlanningPolicy: true, placementPlanPolicy: true, reviewSchedulePolicy: true, multiAgencyPlanningPolicy: true, riskIntegrationPolicy: true, childParticipationPolicy: true, transitionPlanningPolicy: true };
}

function staffMember(overrides: Partial<StaffCarePlanningCompetency> = {}): StaffCarePlanningCompetency {
  return { staffId: "staff-sarah", carePlanWritingSkills: true, outcomeFocusedPlanning: true, multiAgencyCoordination: true, childParticipationSkills: true, riskAssessmentIntegration: true, reviewFacilitationSkills: true, ...overrides };
}

const ALL_CATEGORIES: CarePlanningCategory[] = ["care_plan_creation", "care_plan_review", "placement_plan", "risk_assessment_integration", "health_plan", "education_plan", "contact_plan", "transition_plan"];

// ── pct ─────────────────────────────────────────────────────────────────────


// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60 and < 80", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40 and < 60", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(0)).toBe("inadequate"); expect(getRating(39)).toBe("inadequate"); });
});

// ── Label functions ─────────────────────────────────────────────────────────

describe("getCarePlanningCategoryLabel", () => {
  it.each(ALL_CATEGORIES)("returns a label for %s", (cat) => { expect(getCarePlanningCategoryLabel(cat)).toBeTruthy(); });
  it("returns Care Plan Creation for care_plan_creation", () => { expect(getCarePlanningCategoryLabel("care_plan_creation")).toBe("Care Plan Creation"); });
  it("returns Transition Plan for transition_plan", () => { expect(getCarePlanningCategoryLabel("transition_plan")).toBe("Transition Plan"); });
});

describe("getCarePlanningOutcomeLabel", () => {
  it("returns correct labels", () => {
    expect(getCarePlanningOutcomeLabel("plan_fully_implemented")).toBe("Plan Fully Implemented");
    expect(getCarePlanningOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
  it("returns Plan Not Implemented", () => { expect(getCarePlanningOutcomeLabel("plan_not_implemented")).toBe("Plan Not Implemented"); });
  it("returns Plan Requires Update", () => { expect(getCarePlanningOutcomeLabel("plan_requires_update")).toBe("Plan Requires Update"); });
  it("returns Plan Partially Implemented", () => { expect(getCarePlanningOutcomeLabel("plan_partially_implemented")).toBe("Plan Partially Implemented"); });
});

describe("getCarePlanningRatingLabel", () => {
  it("returns correct labels", () => {
    expect(getCarePlanningRatingLabel("outstanding")).toBe("Outstanding");
    expect(getCarePlanningRatingLabel("inadequate")).toBe("Inadequate");
  });
  it("returns Good", () => { expect(getCarePlanningRatingLabel("good")).toBe("Good"); });
  it("returns Requires Improvement", () => { expect(getCarePlanningRatingLabel("requires_improvement")).toBe("Requires Improvement"); });
});

// ── Evaluator 1: Quality ────────────────────────────────────────────────────

describe("evaluateCarePlanningQuality", () => {
  it("returns zeros for empty", () => {
    const r = evaluateCarePlanningQuality([]);
    expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0);
  });

  it("scores max for all-true", () => {
    const r = evaluateCarePlanningQuality([rec(), rec({ id: "r2" })]);
    expect(r.overallScore).toBe(25); expect(r.totalRecords).toBe(2);
  });

  it("scores 0 for all-false", () => {
    const r = evaluateCarePlanningQuality([rec({ childViewIncorporated: false, measurableOutcomesSet: false, multiAgencyInputIncluded: false, reviewDateSet: false })]);
    expect(r.overallScore).toBe(0);
  });

  it("weight 7 for childViewIncorporated", () => {
    const r = evaluateCarePlanningQuality([rec({ measurableOutcomesSet: false, multiAgencyInputIncluded: false, reviewDateSet: false })]);
    expect(r.overallScore).toBe(7);
  });

  it("weight 6 for measurableOutcomesSet", () => {
    const r = evaluateCarePlanningQuality([rec({ childViewIncorporated: false, multiAgencyInputIncluded: false, reviewDateSet: false })]);
    expect(r.overallScore).toBe(6);
  });

  it("weight 6 for multiAgencyInputIncluded", () => {
    const r = evaluateCarePlanningQuality([rec({ childViewIncorporated: false, measurableOutcomesSet: false, reviewDateSet: false })]);
    expect(r.overallScore).toBe(6);
  });

  it("weight 6 for reviewDateSet", () => {
    const r = evaluateCarePlanningQuality([rec({ childViewIncorporated: false, measurableOutcomesSet: false, multiAgencyInputIncluded: false })]);
    expect(r.overallScore).toBe(6);
  });

  it("computes mixed rates", () => {
    const records = [rec({ measurableOutcomesSet: false }), rec({ id: "r2", childViewIncorporated: false })];
    const r = evaluateCarePlanningQuality(records);
    expect(r.childViewIncorporatedRate).toBe(50);
    expect(r.measurableOutcomesSetRate).toBe(50);
  });

  it("caps at 25", () => {
    expect(evaluateCarePlanningQuality([rec()]).overallScore).toBeLessThanOrEqual(25);
  });

  it("verifies 7+6+6+6 = 25", () => {
    const r = evaluateCarePlanningQuality([rec()]);
    expect(r.overallScore).toBe(25);
  });

  it("half rates give half score", () => {
    const records = [
      rec({ childViewIncorporated: true, measurableOutcomesSet: true, multiAgencyInputIncluded: true, reviewDateSet: true }),
      rec({ id: "r2", childViewIncorporated: false, measurableOutcomesSet: false, multiAgencyInputIncluded: false, reviewDateSet: false }),
    ];
    const r = evaluateCarePlanningQuality(records);
    expect(r.overallScore).toBe(12.5);
  });

  it("returns correct rates for 3 out of 4 true", () => {
    const r = evaluateCarePlanningQuality([rec({ reviewDateSet: false })]);
    expect(r.childViewIncorporatedRate).toBe(100);
    expect(r.measurableOutcomesSetRate).toBe(100);
    expect(r.multiAgencyInputIncludedRate).toBe(100);
    expect(r.reviewDateSetRate).toBe(0);
  });
});

// ── Evaluator 2: Compliance ─────────────────────────────────────────────────

describe("evaluateCarePlanningCompliance", () => {
  it("returns zeros for empty", () => {
    const r = evaluateCarePlanningCompliance([]);
    expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0);
    expect(r.categoryDiversityRatio).toBe(0); expect(r.uniqueCategories).toBe(0);
  });

  it("scores max for full diversity + all true", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const r = evaluateCarePlanningCompliance(records);
    expect(r.overallScore).toBe(25);
    expect(r.uniqueCategories).toBe(8);
    expect(r.categoryDiversityRatio).toBe(1);
  });

  it("computes categoryDiversityRatio correctly", () => {
    const records = [rec({ category: "care_plan_creation" }), rec({ id: "r2", category: "health_plan" }), rec({ id: "r3", category: "contact_plan" })];
    const r = evaluateCarePlanningCompliance(records);
    expect(r.uniqueCategories).toBe(3);
    expect(r.categoryDiversityRatio).toBe(Math.round((3 / 8) * 100) / 100);
  });

  it("weight 8 for documentationCompleteRate", () => {
    const records = [rec({ timelyRecording: false, childViewIncorporated: false })];
    const r = evaluateCarePlanningCompliance(records);
    expect(r.overallScore).toBeGreaterThanOrEqual(8);
  });

  it("all-false gives near-zero", () => {
    const records = [rec({ documentationComplete: false, timelyRecording: false, childViewIncorporated: false })];
    const r = evaluateCarePlanningCompliance(records);
    expect(r.overallScore).toBeLessThan(1);
  });

  it("weight 7 for timelyRecordingRate", () => {
    const records = [rec({ documentationComplete: false, childViewIncorporated: false })];
    const r = evaluateCarePlanningCompliance(records);
    // timelyRecording=true(7) + categoryDiversityRatio(1/8)*5
    expect(r.overallScore).toBeGreaterThanOrEqual(7);
  });

  it("weight 5 for childViewIncorporatedRate in compliance", () => {
    const records = [rec({ documentationComplete: false, timelyRecording: false })];
    const r = evaluateCarePlanningCompliance(records);
    // childView=true(5) + categoryDiversity(1/8)*5
    expect(r.overallScore).toBeGreaterThanOrEqual(5);
  });

  it("diversity of 1 category is 0.13", () => {
    const records = [rec()];
    const r = evaluateCarePlanningCompliance(records);
    expect(r.categoryDiversityRatio).toBe(Math.round((1 / 8) * 100) / 100);
  });

  it("diversity of 4 categories", () => {
    const records = ALL_CATEGORIES.slice(0, 4).map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const r = evaluateCarePlanningCompliance(records);
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
});

// ── Evaluator 3: Policy ─────────────────────────────────────────────────────

describe("evaluateCarePlanningPolicyCompliance", () => {
  it("returns 0 for null", () => {
    const r = evaluateCarePlanningPolicyCompliance(null);
    expect(r.overallScore).toBe(0);
    expect(r.carePlanningPolicy).toBe(false);
  });

  it("scores max for full policy", () => {
    expect(evaluateCarePlanningPolicyCompliance(fullPolicy()).overallScore).toBe(25);
  });

  it("scores 0 for all-false", () => {
    expect(evaluateCarePlanningPolicyCompliance({ carePlanningPolicy: false, placementPlanPolicy: false, reviewSchedulePolicy: false, multiAgencyPlanningPolicy: false, riskIntegrationPolicy: false, childParticipationPolicy: false, transitionPlanningPolicy: false }).overallScore).toBe(0);
  });

  it("weight 4 for carePlanningPolicy", () => {
    const r = evaluateCarePlanningPolicyCompliance({ ...fullPolicy(), placementPlanPolicy: false, reviewSchedulePolicy: false, multiAgencyPlanningPolicy: false, riskIntegrationPolicy: false, childParticipationPolicy: false, transitionPlanningPolicy: false });
    expect(r.overallScore).toBe(4);
  });

  it("weight 4 for placementPlanPolicy", () => {
    const r = evaluateCarePlanningPolicyCompliance({ ...fullPolicy(), carePlanningPolicy: false, reviewSchedulePolicy: false, multiAgencyPlanningPolicy: false, riskIntegrationPolicy: false, childParticipationPolicy: false, transitionPlanningPolicy: false });
    expect(r.overallScore).toBe(4);
  });

  it("weight 4 for reviewSchedulePolicy", () => {
    const r = evaluateCarePlanningPolicyCompliance({ ...fullPolicy(), carePlanningPolicy: false, placementPlanPolicy: false, multiAgencyPlanningPolicy: false, riskIntegrationPolicy: false, childParticipationPolicy: false, transitionPlanningPolicy: false });
    expect(r.overallScore).toBe(4);
  });

  it("weight 4 for multiAgencyPlanningPolicy", () => {
    const r = evaluateCarePlanningPolicyCompliance({ ...fullPolicy(), carePlanningPolicy: false, placementPlanPolicy: false, reviewSchedulePolicy: false, riskIntegrationPolicy: false, childParticipationPolicy: false, transitionPlanningPolicy: false });
    expect(r.overallScore).toBe(4);
  });

  it("weight 3 for riskIntegrationPolicy", () => {
    const r = evaluateCarePlanningPolicyCompliance({ ...fullPolicy(), carePlanningPolicy: false, placementPlanPolicy: false, reviewSchedulePolicy: false, multiAgencyPlanningPolicy: false, childParticipationPolicy: false, transitionPlanningPolicy: false });
    expect(r.overallScore).toBe(3);
  });

  it("weight 3 for childParticipationPolicy", () => {
    const r = evaluateCarePlanningPolicyCompliance({ ...fullPolicy(), carePlanningPolicy: false, placementPlanPolicy: false, reviewSchedulePolicy: false, multiAgencyPlanningPolicy: false, riskIntegrationPolicy: false, transitionPlanningPolicy: false });
    expect(r.overallScore).toBe(3);
  });

  it("weight 3 for transitionPlanningPolicy", () => {
    const r = evaluateCarePlanningPolicyCompliance({ ...fullPolicy(), carePlanningPolicy: false, placementPlanPolicy: false, reviewSchedulePolicy: false, multiAgencyPlanningPolicy: false, riskIntegrationPolicy: false, childParticipationPolicy: false });
    expect(r.overallScore).toBe(3);
  });

  it("sums: 4+4+4+4+3+3+3 = 25", () => {
    expect(evaluateCarePlanningPolicyCompliance(fullPolicy()).overallScore).toBe(25);
  });

  it("reflects booleans in result", () => {
    const p = { ...fullPolicy(), transitionPlanningPolicy: false };
    const r = evaluateCarePlanningPolicyCompliance(p);
    expect(r.transitionPlanningPolicy).toBe(false);
    expect(r.carePlanningPolicy).toBe(true);
  });

  it("partial policy scores correctly", () => {
    const p = { ...fullPolicy(), riskIntegrationPolicy: false, childParticipationPolicy: false, transitionPlanningPolicy: false };
    const r = evaluateCarePlanningPolicyCompliance(p);
    expect(r.overallScore).toBe(16); // 4+4+4+4=16
  });
});

// ── Evaluator 4: Staff Competency ──────────────────────────────────────────

describe("evaluateStaffCarePlanningCompetency", () => {
  it("returns zeros for empty", () => {
    const r = evaluateStaffCarePlanningCompetency([]);
    expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0);
  });

  it("scores max for all-skilled", () => {
    const r = evaluateStaffCarePlanningCompetency([staffMember(), staffMember({ staffId: "s2" })]);
    expect(r.overallScore).toBe(25); expect(r.totalStaff).toBe(2);
  });

  it("scores 0 for all-unskilled", () => {
    const r = evaluateStaffCarePlanningCompetency([staffMember({ carePlanWritingSkills: false, outcomeFocusedPlanning: false, multiAgencyCoordination: false, childParticipationSkills: false, riskAssessmentIntegration: false, reviewFacilitationSkills: false })]);
    expect(r.overallScore).toBe(0);
  });

  it("weight 6 for carePlanWritingSkills", () => {
    const r = evaluateStaffCarePlanningCompetency([staffMember({ outcomeFocusedPlanning: false, multiAgencyCoordination: false, childParticipationSkills: false, riskAssessmentIntegration: false, reviewFacilitationSkills: false })]);
    expect(r.overallScore).toBe(6);
  });

  it("weight 5 for outcomeFocusedPlanning", () => {
    const r = evaluateStaffCarePlanningCompetency([staffMember({ carePlanWritingSkills: false, multiAgencyCoordination: false, childParticipationSkills: false, riskAssessmentIntegration: false, reviewFacilitationSkills: false })]);
    expect(r.overallScore).toBe(5);
  });

  it("weight 5 for multiAgencyCoordination", () => {
    const r = evaluateStaffCarePlanningCompetency([staffMember({ carePlanWritingSkills: false, outcomeFocusedPlanning: false, childParticipationSkills: false, riskAssessmentIntegration: false, reviewFacilitationSkills: false })]);
    expect(r.overallScore).toBe(5);
  });

  it("weight 4 for childParticipationSkills", () => {
    const r = evaluateStaffCarePlanningCompetency([staffMember({ carePlanWritingSkills: false, outcomeFocusedPlanning: false, multiAgencyCoordination: false, riskAssessmentIntegration: false, reviewFacilitationSkills: false })]);
    expect(r.overallScore).toBe(4);
  });

  it("weight 3 for riskAssessmentIntegration", () => {
    const r = evaluateStaffCarePlanningCompetency([staffMember({ carePlanWritingSkills: false, outcomeFocusedPlanning: false, multiAgencyCoordination: false, childParticipationSkills: false, reviewFacilitationSkills: false })]);
    expect(r.overallScore).toBe(3);
  });

  it("weight 2 for reviewFacilitationSkills", () => {
    const r = evaluateStaffCarePlanningCompetency([staffMember({ carePlanWritingSkills: false, outcomeFocusedPlanning: false, multiAgencyCoordination: false, childParticipationSkills: false, riskAssessmentIntegration: false })]);
    expect(r.overallScore).toBe(2);
  });

  it("computes mixed rates", () => {
    const s = [staffMember({ reviewFacilitationSkills: false }), staffMember({ staffId: "s2", carePlanWritingSkills: false, reviewFacilitationSkills: false })];
    const r = evaluateStaffCarePlanningCompetency(s);
    expect(r.carePlanWritingSkillsRate).toBe(50);
    expect(r.reviewFacilitationSkillsRate).toBe(0);
  });

  it("sums: 6+5+5+4+3+2 = 25", () => {
    expect(evaluateStaffCarePlanningCompetency([staffMember()]).overallScore).toBe(25);
  });

  it("half rates give half score", () => {
    const s = [
      staffMember(),
      staffMember({ staffId: "s2", carePlanWritingSkills: false, outcomeFocusedPlanning: false, multiAgencyCoordination: false, childParticipationSkills: false, riskAssessmentIntegration: false, reviewFacilitationSkills: false }),
    ];
    const r = evaluateStaffCarePlanningCompetency(s);
    expect(r.overallScore).toBe(12.5);
  });
});

// ── Child Profiles ──────────────────────────────────────────────────────────

describe("buildChildCarePlanningProfiles", () => {
  it("returns empty for no records", () => { expect(buildChildCarePlanningProfiles([])).toEqual([]); });

  it("groups by childId", () => {
    const records = [rec(), rec({ id: "r2", childId: "child-jordan", childName: "Jordan" }), rec({ id: "r3" })];
    const profiles = buildChildCarePlanningProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "child-alex")?.totalRecords).toBe(2);
  });

  it("freq >= 10 gives 2", () => {
    const records = Array.from({ length: 10 }, (_, i) => rec({ id: `r-${i}` }));
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.overallScore).toBe(8); // freq=2 + rate1=3 + rate2=3 + div=0
  });

  it("freq >= 5 < 10 gives 1", () => {
    const records = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}` }));
    expect(buildChildCarePlanningProfiles(records)[0].overallScore).toBe(7);
  });

  it("freq < 5 gives 0", () => {
    const p = buildChildCarePlanningProfiles([rec()]);
    expect(p[0].overallScore).toBe(6); // freq=0 + rate1=3 + rate2=3 + div=0
  });

  it("diversity >= 4 gives 2", () => {
    const records = ALL_CATEGORIES.slice(0, 4).map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.categoriesCovered).toHaveLength(4);
    expect(p.overallScore).toBe(8); // freq=0 + rate1=3 + rate2=3 + div=2
  });

  it("diversity >= 2 < 4 gives 1", () => {
    const records = [rec({ category: "care_plan_creation" }), rec({ id: "r2", category: "health_plan" })];
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.categoriesCovered).toHaveLength(2);
    expect(p.overallScore).toBe(7); // freq=0 + rate1=3 + rate2=3 + div=1
  });

  it("diversity < 2 gives 0", () => {
    const records = [rec({ category: "care_plan_creation" })];
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.categoriesCovered).toHaveLength(1);
  });

  it("caps at 10", () => {
    const records = Array.from({ length: 12 }, (_, i) => rec({ id: `r-${i}`, category: ALL_CATEGORIES[i % 8] }));
    expect(buildChildCarePlanningProfiles(records)[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("scores 0 for all-false", () => {
    const records = [rec({ childViewIncorporated: false, measurableOutcomesSet: false })];
    expect(buildChildCarePlanningProfiles(records)[0].overallScore).toBe(0);
  });

  it("rate1 >= 80 gives 3", () => {
    const records = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, childViewIncorporated: true, measurableOutcomesSet: false }));
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.childViewIncorporatedRate).toBe(100);
  });

  it("rate1 >= 60 < 80 gives 2", () => {
    const records = [
      rec({ id: "r1", childViewIncorporated: true, measurableOutcomesSet: false }),
      rec({ id: "r2", childViewIncorporated: true, measurableOutcomesSet: false }),
      rec({ id: "r3", childViewIncorporated: true, measurableOutcomesSet: false }),
      rec({ id: "r4", childViewIncorporated: false, measurableOutcomesSet: false }),
      rec({ id: "r5", childViewIncorporated: false, measurableOutcomesSet: false }),
    ];
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.childViewIncorporatedRate).toBe(60);
    // freq=1 + rate1=2 + rate2=0 + div=0 = 3
    expect(p.overallScore).toBe(3);
  });

  it("rate1 >= 40 < 60 gives 1", () => {
    const records = [
      rec({ id: "r1", childViewIncorporated: true, measurableOutcomesSet: false }),
      rec({ id: "r2", childViewIncorporated: true, measurableOutcomesSet: false }),
      rec({ id: "r3", childViewIncorporated: false, measurableOutcomesSet: false }),
      rec({ id: "r4", childViewIncorporated: false, measurableOutcomesSet: false }),
      rec({ id: "r5", childViewIncorporated: false, measurableOutcomesSet: false }),
    ];
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.childViewIncorporatedRate).toBe(40);
    // freq=1 + rate1=1 + rate2=0 + div=0 = 2
    expect(p.overallScore).toBe(2);
  });

  it("rate1 < 40 gives 0", () => {
    const records = [
      rec({ id: "r1", childViewIncorporated: true, measurableOutcomesSet: false }),
      rec({ id: "r2", childViewIncorporated: false, measurableOutcomesSet: false }),
      rec({ id: "r3", childViewIncorporated: false, measurableOutcomesSet: false }),
      rec({ id: "r4", childViewIncorporated: false, measurableOutcomesSet: false }),
      rec({ id: "r5", childViewIncorporated: false, measurableOutcomesSet: false }),
    ];
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.childViewIncorporatedRate).toBe(20);
    // freq=1 + rate1=0 + rate2=0 + div=0 = 1
    expect(p.overallScore).toBe(1);
  });

  it("rate2 scoring thresholds", () => {
    // 80% measurableOutcomesSet -> rate2=3
    const records = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, childViewIncorporated: false, measurableOutcomesSet: i < 4 }));
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.measurableOutcomesSetRate).toBe(80);
    // freq=1 + rate1=0 + rate2=3 + div=0 = 4
    expect(p.overallScore).toBe(4);
  });

  it("computes childViewIncorporatedRate correctly", () => {
    const records = [rec({ childViewIncorporated: true }), rec({ id: "r2", childViewIncorporated: false }), rec({ id: "r3", childViewIncorporated: true })];
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.childViewIncorporatedRate).toBe(67);
  });

  it("computes measurableOutcomesSetRate correctly", () => {
    const records = [rec({ measurableOutcomesSet: true }), rec({ id: "r2", measurableOutcomesSet: false })];
    const p = buildChildCarePlanningProfiles(records)[0];
    expect(p.measurableOutcomesSetRate).toBe(50);
  });
});

// ── Orchestrator ────────────────────────────────────────────────────────────

describe("generateCarePlanningIntelligenceReport", () => {
  const base = { homeId: "home-oak-house", periodStart: "2025-01-01", periodEnd: "2025-12-31" };

  it("produces complete report", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat, childId: i < 4 ? "child-alex" : "child-jordan", childName: i < 4 ? "Alex" : "Jordan" }));
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember(), staffMember({ staffId: "s2" })] });
    expect(r.homeId).toBe("home-oak-house");
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
    expect(r.childProfiles).toHaveLength(2);
    expect(r.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("handles empty data", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
    expect(r.areasForImprovement.some((a) => a.includes("No care planning records"))).toBe(true);
    expect(r.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("filters by period", () => {
    const records = [rec({ date: "2025-06-15" }), rec({ id: "r2", date: "2024-01-01" })];
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.carePlanningQuality.totalRecords).toBe(1);
  });

  it("score = sum of 4 evaluators capped at 100", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    const expected = Math.min(100, Math.round(r.carePlanningQuality.overallScore + r.carePlanningCompliance.overallScore + r.carePlanningPolicy.overallScore + r.staffCompetency.overallScore));
    expect(r.overallScore).toBe(expected);
  });

  it("rating matches thresholds", () => {
    const records = [rec()];
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.rating).toBe(getRating(r.overallScore));
  });

  it("generates no-actions message when all good", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.actions).toContain("No immediate actions required. Care planning operating within expected standards.");
  });

  it("always includes regulatory links", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 14"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Care planning"))).toBe(true);
  });

  it("generates actions for low child view incorporation", () => {
    const records = [rec({ childViewIncorporated: false, measurableOutcomesSet: false })];
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.actions.some((a) => a.includes("Child view incorporation at 0%"))).toBe(true);
  });

  it("generates action for low score children", () => {
    const records = [rec({ childViewIncorporated: false, measurableOutcomesSet: false })];
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.actions.some((a) => a.includes("child(ren) with low care planning scores"))).toBe(true);
  });

  it("includes strengths for high quality", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
    expect(r.strengths.some((s) => s.includes("quality is strong"))).toBe(true);
  });

  it("includes areas for improvement when quality low", () => {
    const records = [rec({ childViewIncorporated: false, measurableOutcomesSet: false, multiAgencyInputIncluded: false, reviewDateSet: false, documentationComplete: false, timelyRecording: false })];
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: null, staff: [] });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
    expect(r.areasForImprovement.some((a) => a.includes("No care planning policy"))).toBe(true);
  });

  it("generates URGENT action for no policy", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [rec()], policy: null, staff: [staffMember()] });
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("No care planning policy"))).toBe(true);
  });

  it("generates URGENT action for no staff records", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [rec()], policy: fullPolicy(), staff: [] });
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("No staff care planning competency"))).toBe(true);
  });

  it("generates HIGH action for low measurable outcomes", () => {
    const records = [rec({ measurableOutcomesSet: false })];
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.actions.some((a) => a.includes("Measurable outcomes at 0%"))).toBe(true);
  });

  it("generates HIGH action for low documentation", () => {
    const records = [rec({ documentationComplete: false })];
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.actions.some((a) => a.includes("Documentation rate at 0%"))).toBe(true);
  });

  it("generates MEDIUM action for low timely recording", () => {
    const records = [rec({ timelyRecording: false })];
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.actions.some((a) => a.includes("Timely recording at 0%"))).toBe(true);
  });

  it("generates MEDIUM action for low staff writing skills", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [rec()], policy: fullPolicy(), staff: [staffMember({ carePlanWritingSkills: false })] });
    expect(r.actions.some((a) => a.includes("Care plan writing skills at 0%"))).toBe(true);
  });

  it("includes regulatory links for CHR 2015 Reg 36", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 36"))).toBe(true);
  });

  it("includes regulatory links for Children Act 1989", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes regulatory links for Working Together 2023", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
  });

  it("includes regulatory links for NMS 2", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 2"))).toBe(true);
  });

  it("includes regulatory links for Quality Standards", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("Quality Standards 2015"))).toBe(true);
  });

  it("includes regulatory links for SCCIF", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("strength for child view >= 90%", () => {
    const records = Array.from({ length: 10 }, (_, i) => rec({ id: `r-${i}`, childViewIncorporated: true }));
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.strengths.some((s) => s.includes("Child view incorporation rate at 100%"))).toBe(true);
  });

  it("strength for measurable outcomes >= 90%", () => {
    const records = Array.from({ length: 10 }, (_, i) => rec({ id: `r-${i}`, measurableOutcomesSet: true }));
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.strengths.some((s) => s.includes("Measurable outcomes setting at 100%"))).toBe(true);
  });

  it("area for child view < 80%", () => {
    const records = [rec({ childViewIncorporated: false }), rec({ id: "r2", childViewIncorporated: false }), rec({ id: "r3" })];
    const r = generateCarePlanningIntelligenceReport({ ...base, records, policy: fullPolicy(), staff: [staffMember()] });
    expect(r.areasForImprovement.some((a) => a.includes("Child view incorporation"))).toBe(true);
  });

  it("area for no staff training", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [rec()], policy: fullPolicy(), staff: [] });
    expect(r.areasForImprovement.some((a) => a.includes("No staff care planning competency records"))).toBe(true);
  });

  it("preserves periodStart and periodEnd", () => {
    const r = generateCarePlanningIntelligenceReport({ ...base, records: [], policy: null, staff: [] });
    expect(r.periodStart).toBe("2025-01-01");
    expect(r.periodEnd).toBe("2025-12-31");
  });
});

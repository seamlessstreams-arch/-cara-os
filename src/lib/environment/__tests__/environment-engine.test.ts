// ══════════════════════════════════════════════════════════════════════════════
// Environment Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getEnvironmentCategoryLabel,
  getEnvironmentOutcomeLabel,
  getRatingLabel,
  evaluateEnvironmentQuality,
  evaluateEnvironmentCompliance,
  evaluateEnvironmentPolicy,
  evaluateStaffEnvironmentReadiness,
  buildChildEnvironmentProfiles,
  generateEnvironmentIntelligence,
} from "../environment-engine";
import type {
  EnvironmentRecord,
  EnvironmentPolicy,
  StaffEnvironmentTraining,
  EnvironmentCategory,
} from "../environment-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<EnvironmentRecord> = {}): EnvironmentRecord {
  return {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-03-15",
    category: "bedroom_personalisation",
    adequate: true,
    childInvolved: true,
    actionTaken: true,
    documented: true,
    timelyCompletion: true,
    childFeedbackSought: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<EnvironmentPolicy> = {}): EnvironmentPolicy {
  return {
    id: "pol-001",
    environmentPolicy: true,
    bedroomStandards: true,
    communalSpaceGuidelines: true,
    outdoorAreaMaintenance: true,
    healthSafetyCompliance: true,
    accessibilityPlan: true,
    regularInspectionSchedule: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffEnvironmentTraining> = {}): StaffEnvironmentTraining {
  return {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    environmentalAwareness: true,
    healthSafetyKnowledge: true,
    maintenanceSkills: true,
    childParticipation: true,
    riskAssessment: true,
    infectionControl: true,
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

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
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
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getEnvironmentCategoryLabel", () => {
  it("returns correct label for bedroom_personalisation", () => {
    expect(getEnvironmentCategoryLabel("bedroom_personalisation")).toBe("Bedroom Personalisation");
  });

  it("returns correct label for communal_spaces", () => {
    expect(getEnvironmentCategoryLabel("communal_spaces")).toBe("Communal Spaces");
  });

  it("returns correct label for outdoor_areas", () => {
    expect(getEnvironmentCategoryLabel("outdoor_areas")).toBe("Outdoor Areas");
  });

  it("returns correct label for safety_compliance", () => {
    expect(getEnvironmentCategoryLabel("safety_compliance")).toBe("Safety Compliance");
  });

  it("returns correct label for cleanliness_hygiene", () => {
    expect(getEnvironmentCategoryLabel("cleanliness_hygiene")).toBe("Cleanliness & Hygiene");
  });

  it("returns correct label for maintenance_repairs", () => {
    expect(getEnvironmentCategoryLabel("maintenance_repairs")).toBe("Maintenance & Repairs");
  });

  it("returns correct label for accessibility", () => {
    expect(getEnvironmentCategoryLabel("accessibility")).toBe("Accessibility");
  });

  it("returns correct label for sensory_environment", () => {
    expect(getEnvironmentCategoryLabel("sensory_environment")).toBe("Sensory Environment");
  });
});

describe("getEnvironmentOutcomeLabel", () => {
  it("returns correct label for fully_met", () => {
    expect(getEnvironmentOutcomeLabel("fully_met")).toBe("Fully Met");
  });

  it("returns correct label for partially_met", () => {
    expect(getEnvironmentOutcomeLabel("partially_met")).toBe("Partially Met");
  });

  it("returns correct label for not_met", () => {
    expect(getEnvironmentOutcomeLabel("not_met")).toBe("Not Met");
  });

  it("returns correct label for in_progress", () => {
    expect(getEnvironmentOutcomeLabel("in_progress")).toBe("In Progress");
  });

  it("returns correct label for not_applicable", () => {
    expect(getEnvironmentOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });

  it("returns correct label for deferred", () => {
    expect(getEnvironmentOutcomeLabel("deferred")).toBe("Deferred");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns correct label for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns correct label for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: evaluateEnvironmentQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEnvironmentQuality", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateEnvironmentQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.adequateRate).toBe(0);
    expect(result.childInvolvedRate).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.childFeedbackSoughtRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns perfect score for all-true records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateEnvironmentQuality(records);
    expect(result.adequateRate).toBe(100);
    expect(result.childInvolvedRate).toBe(100);
    expect(result.documentedRate).toBe(100);
    expect(result.childFeedbackSoughtRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates partial scores correctly", () => {
    const records = [
      makeRecord({ id: "r1", adequate: true, childInvolved: true, documented: true, childFeedbackSought: true }),
      makeRecord({ id: "r2", adequate: false, childInvolved: false, documented: false, childFeedbackSought: false }),
    ];
    const result = evaluateEnvironmentQuality(records);
    expect(result.adequateRate).toBe(50);
    expect(result.childInvolvedRate).toBe(50);
    expect(result.documentedRate).toBe(50);
    expect(result.childFeedbackSoughtRate).toBe(50);
    // (50/100)*7 + (50/100)*6 + (50/100)*6 + (50/100)*6 = 3.5+3+3+3 = 12.5
    expect(result.score).toBe(12.5);
  });

  it("caps score at 25", () => {
    const records = [makeRecord()];
    const result = evaluateEnvironmentQuality(records);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBe(25);
  });

  it("includes strengths when rates are high", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateEnvironmentQuality(records);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("includes concerns when rates are low", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        adequate: false,
        childInvolved: false,
        documented: false,
        childFeedbackSought: false,
      }),
    );
    const result = evaluateEnvironmentQuality(records);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.adequateRate).toBe(0);
  });

  it("returns concern message for empty records", () => {
    const result = evaluateEnvironmentQuality([]);
    expect(result.concerns.length).toBe(1);
    expect(result.concerns[0]).toContain("cannot be assessed");
  });

  it("handles single record correctly", () => {
    const result = evaluateEnvironmentQuality([makeRecord()]);
    expect(result.totalRecords).toBe(1);
    expect(result.adequateRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: evaluateEnvironmentCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEnvironmentCompliance", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateEnvironmentCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.actionTakenRate).toBe(0);
    expect(result.timelyCompletionRate).toBe(0);
    expect(result.adequateRate).toBe(0);
    expect(result.categoryDiversityRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns perfect score for all-true records across all categories", () => {
    const categories: EnvironmentCategory[] = [
      "bedroom_personalisation", "communal_spaces", "outdoor_areas",
      "safety_compliance", "cleanliness_hygiene", "maintenance_repairs",
      "accessibility", "sensory_environment",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateEnvironmentCompliance(records);
    expect(result.actionTakenRate).toBe(100);
    expect(result.timelyCompletionRate).toBe(100);
    expect(result.adequateRate).toBe(100);
    expect(result.categoryDiversityRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates diversity rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", category: "bedroom_personalisation" }),
      makeRecord({ id: "r2", category: "communal_spaces" }),
      makeRecord({ id: "r3", category: "outdoor_areas" }),
      makeRecord({ id: "r4", category: "safety_compliance" }),
    ];
    const result = evaluateEnvironmentCompliance(records);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRate).toBe(50);
  });

  it("calculates partial compliance scores", () => {
    const records = [
      makeRecord({ id: "r1", actionTaken: true, timelyCompletion: true, adequate: true }),
      makeRecord({ id: "r2", actionTaken: false, timelyCompletion: false, adequate: false }),
    ];
    const result = evaluateEnvironmentCompliance(records);
    expect(result.actionTakenRate).toBe(50);
    expect(result.timelyCompletionRate).toBe(50);
    expect(result.adequateRate).toBe(50);
  });

  it("caps score at 25", () => {
    const categories: EnvironmentCategory[] = [
      "bedroom_personalisation", "communal_spaces", "outdoor_areas",
      "safety_compliance", "cleanliness_hygiene", "maintenance_repairs",
      "accessibility", "sensory_environment",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateEnvironmentCompliance(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        actionTaken: false,
        timelyCompletion: false,
        adequate: false,
      }),
    );
    const result = evaluateEnvironmentCompliance(records);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("includes strengths when rates are high", () => {
    const categories: EnvironmentCategory[] = [
      "bedroom_personalisation", "communal_spaces", "outdoor_areas",
      "safety_compliance", "cleanliness_hygiene", "maintenance_repairs",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateEnvironmentCompliance(records);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("returns concern message for empty records", () => {
    const result = evaluateEnvironmentCompliance([]);
    expect(result.concerns.length).toBe(1);
    expect(result.concerns[0]).toContain("compliance cannot be assessed");
  });

  it("counts unique categories correctly for duplicates", () => {
    const records = [
      makeRecord({ id: "r1", category: "bedroom_personalisation" }),
      makeRecord({ id: "r2", category: "bedroom_personalisation" }),
      makeRecord({ id: "r3", category: "communal_spaces" }),
    ];
    const result = evaluateEnvironmentCompliance(records);
    expect(result.uniqueCategories).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: evaluateEnvironmentPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEnvironmentPolicy", () => {
  it("returns 0 score and all false for null policy", () => {
    const result = evaluateEnvironmentPolicy(null);
    expect(result.score).toBe(0);
    expect(result.environmentPolicy).toBe(false);
    expect(result.bedroomStandards).toBe(false);
    expect(result.communalSpaceGuidelines).toBe(false);
    expect(result.outdoorAreaMaintenance).toBe(false);
    expect(result.healthSafetyCompliance).toBe(false);
    expect(result.accessibilityPlan).toBe(false);
    expect(result.regularInspectionSchedule).toBe(false);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully compliant policy", () => {
    const result = evaluateEnvironmentPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("weights 4-point booleans correctly", () => {
    // Only the four 4-point booleans
    const result = evaluateEnvironmentPolicy(makePolicy({
      healthSafetyCompliance: false,
      accessibilityPlan: false,
      regularInspectionSchedule: false,
    }));
    expect(result.score).toBe(16); // 4+4+4+4 = 16
  });

  it("weights 3-point booleans correctly", () => {
    // Only the three 3-point booleans
    const result = evaluateEnvironmentPolicy(makePolicy({
      environmentPolicy: false,
      bedroomStandards: false,
      communalSpaceGuidelines: false,
      outdoorAreaMaintenance: false,
    }));
    expect(result.score).toBe(9); // 3+3+3 = 9
  });

  it("reports concerns for missing components", () => {
    const result = evaluateEnvironmentPolicy(makePolicy({
      environmentPolicy: false,
      accessibilityPlan: false,
    }));
    expect(result.concerns.some((c) => c.includes("environment policy"))).toBe(true);
    expect(result.concerns.some((c) => c.includes("accessibility plan"))).toBe(true);
  });

  it("reports strength for 5+ components", () => {
    const result = evaluateEnvironmentPolicy(makePolicy({
      regularInspectionSchedule: false,
      accessibilityPlan: false,
    }));
    expect(result.strengths.some((s) => s.includes("5/7"))).toBe(true);
  });

  it("reports 7/7 strength for all components", () => {
    const result = evaluateEnvironmentPolicy(makePolicy());
    expect(result.strengths.some((s) => s.includes("7/7"))).toBe(true);
  });

  it("returns all concerns when all policies false", () => {
    const result = evaluateEnvironmentPolicy(makePolicy({
      environmentPolicy: false,
      bedroomStandards: false,
      communalSpaceGuidelines: false,
      outdoorAreaMaintenance: false,
      healthSafetyCompliance: false,
      accessibilityPlan: false,
      regularInspectionSchedule: false,
    }));
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBe(7);
  });

  it("increments score by 4 for environmentPolicy alone", () => {
    const result = evaluateEnvironmentPolicy(makePolicy({
      bedroomStandards: false,
      communalSpaceGuidelines: false,
      outdoorAreaMaintenance: false,
      healthSafetyCompliance: false,
      accessibilityPlan: false,
      regularInspectionSchedule: false,
    }));
    expect(result.score).toBe(4);
  });

  it("increments score by 3 for regularInspectionSchedule alone", () => {
    const result = evaluateEnvironmentPolicy(makePolicy({
      environmentPolicy: false,
      bedroomStandards: false,
      communalSpaceGuidelines: false,
      outdoorAreaMaintenance: false,
      healthSafetyCompliance: false,
      accessibilityPlan: false,
    }));
    expect(result.score).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: evaluateStaffEnvironmentReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffEnvironmentReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffEnvironmentReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.environmentalAwarenessRate).toBe(0);
    expect(result.healthSafetyKnowledgeRate).toBe(0);
    expect(result.maintenanceSkillsRate).toBe(0);
    expect(result.childParticipationRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.infectionControlRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully trained staff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = evaluateStaffEnvironmentReadiness(training);
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("calculates partial rates correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", environmentalAwareness: true, healthSafetyKnowledge: false }),
      makeTraining({ id: "t2", staffId: "s2", environmentalAwareness: false, healthSafetyKnowledge: true }),
    ];
    const result = evaluateStaffEnvironmentReadiness(training);
    expect(result.environmentalAwarenessRate).toBe(50);
    expect(result.healthSafetyKnowledgeRate).toBe(50);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffEnvironmentReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        environmentalAwareness: false,
        healthSafetyKnowledge: false,
        maintenanceSkills: false,
        childParticipation: false,
        riskAssessment: false,
        infectionControl: false,
      }),
      makeTraining({
        id: "t2",
        staffId: "s2",
        environmentalAwareness: false,
        healthSafetyKnowledge: false,
        maintenanceSkills: false,
        childParticipation: false,
        riskAssessment: false,
        infectionControl: false,
      }),
    ];
    const result = evaluateStaffEnvironmentReadiness(training);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("weights skills correctly: awareness=6, hsk=5, maintenance=5, participation=4, risk=3, infection=2", () => {
    // Single staff with only awareness true
    const t1 = [makeTraining({
      environmentalAwareness: true,
      healthSafetyKnowledge: false,
      maintenanceSkills: false,
      childParticipation: false,
      riskAssessment: false,
      infectionControl: false,
    })];
    const r1 = evaluateStaffEnvironmentReadiness(t1);
    expect(r1.score).toBe(6);

    // Single staff with only healthSafetyKnowledge true
    const t2 = [makeTraining({
      environmentalAwareness: false,
      healthSafetyKnowledge: true,
      maintenanceSkills: false,
      childParticipation: false,
      riskAssessment: false,
      infectionControl: false,
    })];
    const r2 = evaluateStaffEnvironmentReadiness(t2);
    expect(r2.score).toBe(5);

    // Single staff with only infectionControl true
    const t3 = [makeTraining({
      environmentalAwareness: false,
      healthSafetyKnowledge: false,
      maintenanceSkills: false,
      childParticipation: false,
      riskAssessment: false,
      infectionControl: true,
    })];
    const r3 = evaluateStaffEnvironmentReadiness(t3);
    expect(r3.score).toBe(2);
  });

  it("weights maintenanceSkills at 5", () => {
    const training = [makeTraining({
      environmentalAwareness: false,
      healthSafetyKnowledge: false,
      maintenanceSkills: true,
      childParticipation: false,
      riskAssessment: false,
      infectionControl: false,
    })];
    const result = evaluateStaffEnvironmentReadiness(training);
    expect(result.score).toBe(5);
  });

  it("weights childParticipation at 4", () => {
    const training = [makeTraining({
      environmentalAwareness: false,
      healthSafetyKnowledge: false,
      maintenanceSkills: false,
      childParticipation: true,
      riskAssessment: false,
      infectionControl: false,
    })];
    const result = evaluateStaffEnvironmentReadiness(training);
    expect(result.score).toBe(4);
  });

  it("weights riskAssessment at 3", () => {
    const training = [makeTraining({
      environmentalAwareness: false,
      healthSafetyKnowledge: false,
      maintenanceSkills: false,
      childParticipation: false,
      riskAssessment: true,
      infectionControl: false,
    })];
    const result = evaluateStaffEnvironmentReadiness(training);
    expect(result.score).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Environment Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildEnvironmentProfiles", () => {
  it("returns empty array for no records", () => {
    const profiles = buildChildEnvironmentProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildEnvironmentProfiles(records);
    expect(profiles.length).toBe(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.totalRecords).toBe(2);
  });

  it("calculates frequency score: 0 for < 5 records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildEnvironmentProfiles(records);
    // freq=0, rate1=3 (100%>=80), rate2=3 (100%>=80), diversity=0 (1 cat) = 6
    expect(profiles[0].environmentScore).toBe(6);
  });

  it("calculates frequency score: 1 for 5-9 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildEnvironmentProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 (1 cat) = 7
    expect(profiles[0].environmentScore).toBe(7);
  });

  it("calculates frequency score: 2 for >= 10 records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildEnvironmentProfiles(records);
    // freq=2, rate1=3, rate2=3, diversity=0 (1 cat) = 8
    expect(profiles[0].environmentScore).toBe(8);
  });

  it("caps environmentScore at 10", () => {
    const categories: EnvironmentCategory[] = [
      "bedroom_personalisation", "communal_spaces", "outdoor_areas",
      "safety_compliance", "cleanliness_hygiene", "maintenance_repairs",
      "accessibility", "sensory_environment",
    ];
    // 10 records, all adequate, all childInvolved, 8 categories
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-alex",
        childName: "Alex",
        category: categories[i % categories.length],
      }),
    );
    const profiles = buildChildEnvironmentProfiles(records);
    // freq=2, rate1=3, rate2=3, diversity=2 = 10 (capped)
    expect(profiles[0].environmentScore).toBe(10);
  });

  it("calculates diversity bonus: 0 for 1 category", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "bedroom_personalisation" }),
    ];
    const profiles = buildChildEnvironmentProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(1);
  });

  it("calculates diversity bonus: 1 for 2-3 categories", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "bedroom_personalisation" }),
      makeRecord({ id: "r2", childId: "c1", childName: "A", category: "communal_spaces" }),
    ];
    const profiles = buildChildEnvironmentProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(2);
    // freq=0, rate1=3, rate2=3, div=1 = 7
    expect(profiles[0].environmentScore).toBe(7);
  });

  it("calculates diversity bonus: 2 for 4+ categories", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "bedroom_personalisation" }),
      makeRecord({ id: "r2", childId: "c1", childName: "A", category: "communal_spaces" }),
      makeRecord({ id: "r3", childId: "c1", childName: "A", category: "outdoor_areas" }),
      makeRecord({ id: "r4", childId: "c1", childName: "A", category: "safety_compliance" }),
    ];
    const profiles = buildChildEnvironmentProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(4);
    // freq=0, rate1=3, rate2=3, div=2 = 8
    expect(profiles[0].environmentScore).toBe(8);
  });

  it("calculates rate1 threshold: 0 when adequateRate < 40%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        adequate: i === 0,
      }),
    );
    const profiles = buildChildEnvironmentProfiles(records);
    // 1/5 = 20% adequate -> rate1=0
    expect(profiles[0].adequateRate).toBe(20);
  });

  it("calculates rate2 threshold: 0 when childInvolvedRate < 40%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        childInvolved: i === 0,
      }),
    );
    const profiles = buildChildEnvironmentProfiles(records);
    expect(profiles[0].childInvolvedRate).toBe(20);
  });

  it("preserves child name from records", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex Thompson" })];
    const profiles = buildChildEnvironmentProfiles(records);
    expect(profiles[0].childName).toBe("Alex Thompson");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Generator: generateEnvironmentIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateEnvironmentIntelligence", () => {
  const categories: EnvironmentCategory[] = [
    "bedroom_personalisation", "communal_spaces", "outdoor_areas",
    "safety_compliance", "cleanliness_hygiene", "maintenance_repairs",
    "accessibility", "sensory_environment",
  ];

  function makePerfectRecords(count: number): EnvironmentRecord[] {
    return Array.from({ length: count }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: i < count / 2 ? "child-alex" : "child-jordan",
        childName: i < count / 2 ? "Alex" : "Jordan",
        date: "2026-03-15",
        category: categories[i % categories.length],
      }),
    );
  }

  it("produces a complete intelligence result", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateEnvironmentIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.rating).toBeDefined();
    expect(result.environmentQuality).toBeDefined();
    expect(result.environmentCompliance).toBeDefined();
    expect(result.environmentPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("achieves 100 overall score with perfect data", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateEnvironmentIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 overall score with empty data and no policy", () => {
    const result = generateEnvironmentIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateEnvironmentIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateEnvironmentIntelligence(
      [makeRecord()], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT actions when no staff training", () => {
    const result = generateEnvironmentIntelligence(
      [makeRecord()], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("includes strengths for high-scoring evaluators (score >= 20)", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining()];

    const result = generateEnvironmentIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.strengths.some((s) => s.includes("strong"))).toBe(true);
  });

  it("includes areas for improvement for low-scoring evaluators (score < 15)", () => {
    const result = generateEnvironmentIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.areasForImprovement.some((a) => a.includes("needs improvement"))).toBe(true);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateEnvironmentIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("filters records to period", () => {
    const records = [
      makeRecord({ id: "r1", date: "2025-12-01" }), // before period
      makeRecord({ id: "r2", date: "2026-03-15" }), // in period
      makeRecord({ id: "r3", date: "2026-06-01" }), // after period
    ];

    const result = generateEnvironmentIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.environmentQuality.totalRecords).toBe(1);
  });

  it("builds child profiles from period-filtered records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex", date: "2026-03-15" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan", date: "2026-03-15" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex", date: "2025-06-01" }), // outside period
    ];

    const result = generateEnvironmentIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.childProfiles.length).toBe(2);
    const alex = result.childProfiles.find((p) => p.childId === "c1");
    expect(alex!.totalRecords).toBe(1);
  });

  it("generates conditional actions when rates are below 50%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        date: "2026-03-15",
        adequate: false,
        childInvolved: false,
        actionTaken: false,
        timelyCompletion: false,
        documented: false,
        childFeedbackSought: false,
      }),
    );

    const result = generateEnvironmentIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("adequacy rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Child involvement rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Action taken rate"))).toBe(true);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateEnvironmentIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.assessedAt).toBeDefined();
    expect(typeof result.assessedAt).toBe("string");
  });

  it("generates no-action message when everything is perfect", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateEnvironmentIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("generates rating of good for score between 60-79", () => {
    // Records with some failures to get a score around 60-79
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        date: "2026-03-15",
        childId: i < 4 ? "child-alex" : "child-jordan",
        childName: i < 4 ? "Alex" : "Jordan",
        category: categories[i % categories.length],
        adequate: i < 6,
        childInvolved: i < 5,
        documented: i < 6,
        childFeedbackSought: i < 5,
        actionTaken: i < 6,
        timelyCompletion: i < 6,
      }),
    );

    const result = generateEnvironmentIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    // With mostly good data + full policy + full training, expect good-to-outstanding
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
  });

  it("handles both URGENT actions simultaneously (no policy + no staff)", () => {
    const records = [makeRecord({ date: "2026-03-15" })];

    const result = generateEnvironmentIntelligence(
      records, null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    const urgentActions = result.actions.filter((a) => a.includes("URGENT"));
    expect(urgentActions.length).toBe(2);
  });
});

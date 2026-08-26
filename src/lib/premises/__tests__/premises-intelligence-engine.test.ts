import { describe, it, expect } from "vitest";
import {
  getRating,
  getPremisesIntelligenceCategoryLabel,
  getPremisesIntelligenceOutcomeLabel,
  getRatingLabel,
  evaluatePremisesQuality,
  evaluatePremisesCompliance,
  evaluatePremisesPolicy,
  evaluateStaffPremisesReadiness,
  buildAreaProfiles,
  generatePremisesIntelligenceReport,
} from "../premises-intelligence-engine";
import type {
  PremisesIntelligenceRecord,
  PremisesIntelligencePolicy,
  StaffPremisesTraining,
  PremisesIntelligenceCategory,
  PremisesIntelligenceOutcome,
  PremisesIntelligenceRating,
} from "../premises-intelligence-engine";

// ── Helpers ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<PremisesIntelligenceRecord> = {}): PremisesIntelligenceRecord {
  return {
    id: "pr-1",
    homeId: "home-oak",
    date: "2026-03-15",
    staffId: "staff-sarah",
    staffName: "Sarah",
    category: "fire_safety_check",
    outcome: "fully_compliant",
    hazardIdentified: true,
    riskMitigated: true,
    maintenanceCompleted: true,
    childFriendlyAssessed: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makeFullRecords(count: number, overrides: Partial<PremisesIntelligenceRecord> = {}): PremisesIntelligenceRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeRecord({ id: `pr-${i}`, ...overrides })
  );
}

function makeAllTruePolicy(): PremisesIntelligencePolicy {
  return {
    healthSafetyPolicy: true,
    fireSafetyPolicy: true,
    maintenanceSchedulePolicy: true,
    bedroomStandardsPolicy: true,
    securityPolicy: true,
    accessibilityPolicy: true,
    environmentalSustainabilityPolicy: true,
  };
}

function makeAllFalsePolicy(): PremisesIntelligencePolicy {
  return {
    healthSafetyPolicy: false,
    fireSafetyPolicy: false,
    maintenanceSchedulePolicy: false,
    bedroomStandardsPolicy: false,
    securityPolicy: false,
    accessibilityPolicy: false,
    environmentalSustainabilityPolicy: false,
  };
}

function makeStaff(overrides: Partial<StaffPremisesTraining> = {}): StaffPremisesTraining {
  return {
    staffId: "staff-1",
    healthSafetyKnowledge: true,
    fireSafetyTraining: true,
    maintenanceSkills: true,
    riskAssessmentSkills: true,
    firstAidTraining: true,
    accessibilityAwareness: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// pct()
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// getRating()
// ═══════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Label Functions
// ═══════════════════════════════════════════════════════════════════════════

describe("getPremisesIntelligenceCategoryLabel", () => {
  const cases: [PremisesIntelligenceCategory, string][] = [
    ["fire_safety_check", "Fire Safety Check"],
    ["health_safety_inspection", "Health & Safety Inspection"],
    ["maintenance_repair", "Maintenance & Repair"],
    ["bedroom_standard", "Bedroom Standard"],
    ["communal_area_check", "Communal Area Check"],
    ["garden_outdoor_area", "Garden & Outdoor Area"],
    ["security_assessment", "Security Assessment"],
    ["accessibility_review", "Accessibility Review"],
  ];
  it.each(cases)("maps %s → %s", (cat, label) => {
    expect(getPremisesIntelligenceCategoryLabel(cat)).toBe(label);
  });
});

describe("getPremisesIntelligenceOutcomeLabel", () => {
  const cases: [PremisesIntelligenceOutcome, string][] = [
    ["fully_compliant", "Fully Compliant"],
    ["minor_issues", "Minor Issues"],
    ["significant_issues", "Significant Issues"],
    ["non_compliant", "Non-Compliant"],
    ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("maps %s → %s", (outcome, label) => {
    expect(getPremisesIntelligenceOutcomeLabel(outcome)).toBe(label);
  });
});

describe("getRatingLabel", () => {
  const cases: [PremisesIntelligenceRating, string][] = [
    ["outstanding", "Outstanding"],
    ["good", "Good"],
    ["requires_improvement", "Requires Improvement"],
    ["inadequate", "Inadequate"],
  ];
  it.each(cases)("maps %s → %s", (r, label) => {
    expect(getRatingLabel(r)).toBe(label);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Evaluator 1: Quality (0-25)
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluatePremisesQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluatePremisesQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.hazardIdentifiedRate).toBeNull();
    expect(result.riskMitigatedRate).toBeNull();
    expect(result.maintenanceCompletedRate).toBeNull();
    expect(result.childFriendlyAssessedRate).toBeNull();
  });

  it("returns 25 for all-perfect records", () => {
    const records = makeFullRecords(5);
    const result = evaluatePremisesQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(5);
    expect(result.hazardIdentifiedRate).toBe(100);
    expect(result.riskMitigatedRate).toBe(100);
    expect(result.maintenanceCompletedRate).toBe(100);
    expect(result.childFriendlyAssessedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = makeFullRecords(3, {
      hazardIdentified: false,
      riskMitigated: false,
      maintenanceCompleted: false,
      childFriendlyAssessed: false,
    });
    const result = evaluatePremisesQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("scores first boolean (hazardIdentified) at weight 7", () => {
    const records = makeFullRecords(1, {
      hazardIdentified: true,
      riskMitigated: false,
      maintenanceCompleted: false,
      childFriendlyAssessed: false,
    });
    const result = evaluatePremisesQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("scores second boolean (riskMitigated) at weight 6", () => {
    const records = makeFullRecords(1, {
      hazardIdentified: false,
      riskMitigated: true,
      maintenanceCompleted: false,
      childFriendlyAssessed: false,
    });
    const result = evaluatePremisesQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("scores third boolean (maintenanceCompleted) at weight 6", () => {
    const records = makeFullRecords(1, {
      hazardIdentified: false,
      riskMitigated: false,
      maintenanceCompleted: true,
      childFriendlyAssessed: false,
    });
    const result = evaluatePremisesQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("scores fourth boolean (childFriendlyAssessed) at weight 6", () => {
    const records = makeFullRecords(1, {
      hazardIdentified: false,
      riskMitigated: false,
      maintenanceCompleted: false,
      childFriendlyAssessed: true,
    });
    const result = evaluatePremisesQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("calculates partial rates correctly", () => {
    const records = [
      makeRecord({ id: "a", hazardIdentified: true, riskMitigated: true, maintenanceCompleted: true, childFriendlyAssessed: true }),
      makeRecord({ id: "b", hazardIdentified: false, riskMitigated: false, maintenanceCompleted: false, childFriendlyAssessed: false }),
    ];
    const result = evaluatePremisesQuality(records);
    expect(result.hazardIdentifiedRate).toBe(50);
    expect(result.riskMitigatedRate).toBe(50);
    expect(result.maintenanceCompletedRate).toBe(50);
    expect(result.childFriendlyAssessedRate).toBe(50);
    // (50/100)*7 + (50/100)*6 + (50/100)*6 + (50/100)*6 = 3.5 + 3 + 3 + 3 = 12.5
    expect(result.overallScore).toBe(12.5);
  });

  it("caps score at 25", () => {
    const records = makeFullRecords(100);
    const result = evaluatePremisesQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single record", () => {
    const records = [makeRecord()];
    const result = evaluatePremisesQuality(records);
    expect(result.totalRecords).toBe(1);
    expect(result.overallScore).toBe(25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Evaluator 2: Compliance (0-25)
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluatePremisesCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluatePremisesCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationCompleteRate).toBeNull();
    expect(result.timelyRecordingRate).toBeNull();
    expect(result.hazardIdentifiedRate).toBeNull();
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("scores documentation at weight 8", () => {
    const records = makeFullRecords(1, {
      documentationComplete: true,
      timelyRecording: false,
      hazardIdentified: false,
      category: "fire_safety_check",
    });
    const result = evaluatePremisesCompliance(records);
    // (100/100)*8 + 0 + 0 + (1/8)*5 = 8 + 0.625 = 8.625 → round to 8.6
    const categoryRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((8 + categoryRatio * 5) * 10) / 10;
    expect(result.overallScore).toBe(expected);
  });

  it("scores timely recording at weight 7", () => {
    const records = makeFullRecords(1, {
      documentationComplete: false,
      timelyRecording: true,
      hazardIdentified: false,
      category: "fire_safety_check",
    });
    const result = evaluatePremisesCompliance(records);
    const categoryRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((7 + categoryRatio * 5) * 10) / 10;
    expect(result.overallScore).toBe(expected);
  });

  it("scores hazardIdentified at weight 5", () => {
    const records = makeFullRecords(1, {
      documentationComplete: false,
      timelyRecording: false,
      hazardIdentified: true,
      category: "fire_safety_check",
    });
    const result = evaluatePremisesCompliance(records);
    const categoryRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((5 + categoryRatio * 5) * 10) / 10;
    expect(result.overallScore).toBe(expected);
  });

  it("returns max 25 for perfect compliance with full category diversity", () => {
    const allCategories: PremisesIntelligenceCategory[] = [
      "fire_safety_check", "health_safety_inspection", "maintenance_repair", "bedroom_standard",
      "communal_area_check", "garden_outdoor_area", "security_assessment", "accessibility_review",
    ];
    const records = allCategories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat, documentationComplete: true, timelyRecording: true, hazardIdentified: true })
    );
    const result = evaluatePremisesCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.uniqueCategories).toBe(8);
    expect(result.categoryDiversityRatio).toBe(1);
  });

  it("calculates categoryDiversityRatio correctly for 4/8 categories", () => {
    const cats: PremisesIntelligenceCategory[] = ["fire_safety_check", "health_safety_inspection", "maintenance_repair", "bedroom_standard"];
    const records = cats.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluatePremisesCompliance(records);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRatio).toBe(0.5);
  });

  it("handles single-category records", () => {
    const records = makeFullRecords(5, { category: "security_assessment" });
    const result = evaluatePremisesCompliance(records);
    expect(result.uniqueCategories).toBe(1);
    expect(result.categoryDiversityRatio).toBe(0.13);
  });

  it("caps score at 25", () => {
    const allCategories: PremisesIntelligenceCategory[] = [
      "fire_safety_check", "health_safety_inspection", "maintenance_repair", "bedroom_standard",
      "communal_area_check", "garden_outdoor_area", "security_assessment", "accessibility_review",
    ];
    const records = allCategories.flatMap((cat, i) =>
      makeFullRecords(10, { category: cat }).map((r, j) => ({ ...r, id: `r-${i}-${j}` }))
    );
    const result = evaluatePremisesCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Evaluator 3: Policy (0-25)
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluatePremisesPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluatePremisesPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.healthSafetyPolicy).toBe(false);
    expect(result.fireSafetyPolicy).toBe(false);
    expect(result.maintenanceSchedulePolicy).toBe(false);
    expect(result.bedroomStandardsPolicy).toBe(false);
    expect(result.securityPolicy).toBe(false);
    expect(result.accessibilityPolicy).toBe(false);
    expect(result.environmentalSustainabilityPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluatePremisesPolicy(makeAllTruePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluatePremisesPolicy(makeAllFalsePolicy());
    expect(result.overallScore).toBe(0);
  });

  it("healthSafetyPolicy weighted at 4", () => {
    const policy = { ...makeAllFalsePolicy(), healthSafetyPolicy: true };
    const result = evaluatePremisesPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("fireSafetyPolicy weighted at 4", () => {
    const policy = { ...makeAllFalsePolicy(), fireSafetyPolicy: true };
    const result = evaluatePremisesPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("maintenanceSchedulePolicy weighted at 4", () => {
    const policy = { ...makeAllFalsePolicy(), maintenanceSchedulePolicy: true };
    const result = evaluatePremisesPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("bedroomStandardsPolicy weighted at 4", () => {
    const policy = { ...makeAllFalsePolicy(), bedroomStandardsPolicy: true };
    const result = evaluatePremisesPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("securityPolicy weighted at 3", () => {
    const policy = { ...makeAllFalsePolicy(), securityPolicy: true };
    const result = evaluatePremisesPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("accessibilityPolicy weighted at 3", () => {
    const policy = { ...makeAllFalsePolicy(), accessibilityPolicy: true };
    const result = evaluatePremisesPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("environmentalSustainabilityPolicy weighted at 3", () => {
    const policy = { ...makeAllFalsePolicy(), environmentalSustainabilityPolicy: true };
    const result = evaluatePremisesPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("weights sum to 25 (4+4+4+4+3+3+3)", () => {
    const result = evaluatePremisesPolicy(makeAllTruePolicy());
    expect(result.overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3);
  });

  it("reflects individual boolean values correctly", () => {
    const policy = { ...makeAllTruePolicy(), accessibilityPolicy: false };
    const result = evaluatePremisesPolicy(policy);
    expect(result.accessibilityPolicy).toBe(false);
    expect(result.overallScore).toBe(22);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Readiness (0-25)
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateStaffPremisesReadiness", () => {
  it("returns 0 for empty staff array", () => {
    const result = evaluateStaffPremisesReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.healthSafetyKnowledgeRate).toBeNull();
    expect(result.fireSafetyTrainingRate).toBeNull();
    expect(result.maintenanceSkillsRate).toBeNull();
    expect(result.riskAssessmentSkillsRate).toBeNull();
    expect(result.firstAidTrainingRate).toBeNull();
    expect(result.accessibilityAwarenessRate).toBeNull();
  });

  it("returns 25 for all-true staff", () => {
    const staff = [makeStaff()];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(1);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeStaff({
      healthSafetyKnowledge: false,
      fireSafetyTraining: false,
      maintenanceSkills: false,
      riskAssessmentSkills: false,
      firstAidTraining: false,
      accessibilityAwareness: false,
    })];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("healthSafetyKnowledge weighted at 6", () => {
    const staff = [makeStaff({
      healthSafetyKnowledge: true,
      fireSafetyTraining: false,
      maintenanceSkills: false,
      riskAssessmentSkills: false,
      firstAidTraining: false,
      accessibilityAwareness: false,
    })];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("fireSafetyTraining weighted at 5", () => {
    const staff = [makeStaff({
      healthSafetyKnowledge: false,
      fireSafetyTraining: true,
      maintenanceSkills: false,
      riskAssessmentSkills: false,
      firstAidTraining: false,
      accessibilityAwareness: false,
    })];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("maintenanceSkills weighted at 5", () => {
    const staff = [makeStaff({
      healthSafetyKnowledge: false,
      fireSafetyTraining: false,
      maintenanceSkills: true,
      riskAssessmentSkills: false,
      firstAidTraining: false,
      accessibilityAwareness: false,
    })];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("riskAssessmentSkills weighted at 4", () => {
    const staff = [makeStaff({
      healthSafetyKnowledge: false,
      fireSafetyTraining: false,
      maintenanceSkills: false,
      riskAssessmentSkills: true,
      firstAidTraining: false,
      accessibilityAwareness: false,
    })];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBe(4);
  });

  it("firstAidTraining weighted at 3", () => {
    const staff = [makeStaff({
      healthSafetyKnowledge: false,
      fireSafetyTraining: false,
      maintenanceSkills: false,
      riskAssessmentSkills: false,
      firstAidTraining: true,
      accessibilityAwareness: false,
    })];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBe(3);
  });

  it("accessibilityAwareness weighted at 2", () => {
    const staff = [makeStaff({
      healthSafetyKnowledge: false,
      fireSafetyTraining: false,
      maintenanceSkills: false,
      riskAssessmentSkills: false,
      firstAidTraining: false,
      accessibilityAwareness: true,
    })];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("weights sum to 25 (6+5+5+4+3+2)", () => {
    const staff = [makeStaff()];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2);
  });

  it("calculates partial rates for mixed staff", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2", healthSafetyKnowledge: false, accessibilityAwareness: false }),
    ];
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.totalStaff).toBe(2);
    expect(result.healthSafetyKnowledgeRate).toBe(50);
    expect(result.accessibilityAwarenessRate).toBe(50);
    // (50/100)*6 + (100/100)*5 + (100/100)*5 + (100/100)*4 + (100/100)*3 + (50/100)*2
    // = 3 + 5 + 5 + 4 + 3 + 1 = 21
    expect(result.overallScore).toBe(21);
  });

  it("caps score at 25", () => {
    const staff = Array.from({ length: 100 }, (_, i) => makeStaff({ staffId: `s-${i}` }));
    const result = evaluateStaffPremisesReadiness(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Area Profiles
// ═══════════════════════════════════════════════════════════════════════════

describe("buildAreaProfiles", () => {
  it("returns empty array for empty records", () => {
    expect(buildAreaProfiles([])).toEqual([]);
  });

  it("groups records by category", () => {
    const records = [
      makeRecord({ id: "a", category: "fire_safety_check" }),
      makeRecord({ id: "b", category: "bedroom_standard" }),
      makeRecord({ id: "c", category: "fire_safety_check" }),
    ];
    const profiles = buildAreaProfiles(records);
    expect(profiles).toHaveLength(2);
    const fire = profiles.find((p) => p.category === "fire_safety_check")!;
    expect(fire.totalRecords).toBe(2);
    const bedroom = profiles.find((p) => p.category === "bedroom_standard")!;
    expect(bedroom.totalRecords).toBe(1);
  });

  it("includes correct category label", () => {
    const records = [makeRecord({ id: "a", category: "garden_outdoor_area" })];
    const profiles = buildAreaProfiles(records);
    expect(profiles[0].categoryLabel).toBe("Garden & Outdoor Area");
  });

  it("frequency score: 0 for <5 records", () => {
    const records = makeFullRecords(4, { category: "fire_safety_check" }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const profiles = buildAreaProfiles(records);
    // freq=0, rate1=3 (100% hazardIdentified), rate2=3 (100% maintenanceCompleted), riskBonus=2 (100% riskMitigated) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("frequency score: 1 for 5-9 records", () => {
    const records = makeFullRecords(5, { category: "fire_safety_check" }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const profiles = buildAreaProfiles(records);
    // freq=1, rate1=3, rate2=3, riskBonus=2 = 9
    expect(profiles[0].overallScore).toBe(9);
  });

  it("frequency score: 2 for >=10 records", () => {
    const records = makeFullRecords(10, { category: "fire_safety_check" }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const profiles = buildAreaProfiles(records);
    // freq=2, rate1=3, rate2=3, riskBonus=2 = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("rate1 (hazardIdentifiedRate): 3 at >=80%, 2 at >=60%, 1 at >=40%, 0 below", () => {
    // 80% = 3
    const r80 = makeFullRecords(5, { category: "fire_safety_check" }).map((r, i) => ({
      ...r, id: `r-${i}`, hazardIdentified: i < 4, // 4/5 = 80%
    }));
    const p80 = buildAreaProfiles(r80);
    expect(p80[0].hazardIdentifiedRate).toBe(80);

    // 60% = 2
    const r60 = makeFullRecords(5, { category: "fire_safety_check" }).map((r, i) => ({
      ...r, id: `r-${i}`, hazardIdentified: i < 3, // 3/5 = 60%
    }));
    const p60 = buildAreaProfiles(r60);
    expect(p60[0].hazardIdentifiedRate).toBe(60);
  });

  it("rate2 (maintenanceCompletedRate): tiered scoring", () => {
    // All maintenance = 100% → rate2=3
    const r100 = makeFullRecords(5, { category: "fire_safety_check" }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const p100 = buildAreaProfiles(r100);
    expect(p100[0].maintenanceCompletedRate).toBe(100);
  });

  it("riskBonus: 0 for <40%, 1 for 40-79%, 2 for >=80%", () => {
    // 100% → 2
    const r100 = [makeRecord({ id: "a", category: "fire_safety_check", riskMitigated: true })];
    const p100 = buildAreaProfiles(r100);
    expect(p100[0].riskMitigatedRate).toBe(100);

    // 0% → 0
    const r0 = [makeRecord({ id: "a", category: "fire_safety_check", riskMitigated: false, hazardIdentified: false, maintenanceCompleted: false })];
    const p0 = buildAreaProfiles(r0);
    expect(p0[0].riskMitigatedRate).toBe(0);
    // freq=0, rate1=0, rate2=0, riskBonus=0 = 0
    expect(p0[0].overallScore).toBe(0);
  });

  it("caps at 10", () => {
    // 10+ records, all true → freq=2, rate1=3, rate2=3, riskBonus=2 = 10
    const records = makeFullRecords(15, { category: "fire_safety_check" }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const profiles = buildAreaProfiles(records);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("handles multiple categories with different scores", () => {
    const records = [
      // fire_safety_check — all perfect
      makeRecord({ id: "a", category: "fire_safety_check" }),
      // bedroom_standard — all false quality booleans
      makeRecord({ id: "b", category: "bedroom_standard", hazardIdentified: false, riskMitigated: false, maintenanceCompleted: false, childFriendlyAssessed: false }),
    ];
    const profiles = buildAreaProfiles(records);
    const fire = profiles.find((p) => p.category === "fire_safety_check")!;
    const bedroom = profiles.find((p) => p.category === "bedroom_standard")!;
    expect(fire.overallScore).toBeGreaterThan(bedroom.overallScore);
    expect(bedroom.overallScore).toBe(0);
  });

  it("tracks rates correctly per area", () => {
    const records = [
      makeRecord({ id: "a", category: "security_assessment", hazardIdentified: true, maintenanceCompleted: true, riskMitigated: true }),
      makeRecord({ id: "b", category: "security_assessment", hazardIdentified: false, maintenanceCompleted: false, riskMitigated: false }),
    ];
    const profiles = buildAreaProfiles(records);
    expect(profiles[0].hazardIdentifiedRate).toBe(50);
    expect(profiles[0].maintenanceCompletedRate).toBe(50);
    expect(profiles[0].riskMitigatedRate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Orchestrator
// ═══════════════════════════════════════════════════════════════════════════

describe("generatePremisesIntelligenceReport", () => {
  it("produces outstanding result for perfect data", () => {
    const allCategories: PremisesIntelligenceCategory[] = [
      "fire_safety_check", "health_safety_inspection", "maintenance_repair", "bedroom_standard",
      "communal_area_check", "garden_outdoor_area", "security_assessment", "accessibility_review",
    ];
    const records = allCategories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, date: "2026-03-15", category: cat })
    );
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-12-31");
  });

  it("produces inadequate result for empty data", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("filters records by period", () => {
    const records = [
      makeRecord({ id: "in", date: "2026-06-15" }),
      makeRecord({ id: "out", date: "2025-01-01" }),
    ];
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.premisesQuality.totalRecords).toBe(1);
  });

  it("includes all four evaluator results", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.premisesQuality).toBeDefined();
    expect(result.premisesCompliance).toBeDefined();
    expect(result.premisesPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
  });

  it("includes area profiles", () => {
    const records = [
      makeRecord({ id: "a", category: "fire_safety_check" }),
      makeRecord({ id: "b", category: "bedroom_standard" }),
    ];
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.areaProfiles).toHaveLength(2);
  });

  it("overall score = sum of 4 evaluators, capped at 100", () => {
    const allCategories: PremisesIntelligenceCategory[] = [
      "fire_safety_check", "health_safety_inspection", "maintenance_repair", "bedroom_standard",
      "communal_area_check", "garden_outdoor_area", "security_assessment", "accessibility_review",
    ];
    const records = allCategories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat })
    );
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    const expected = Math.min(100, Math.round(
      result.premisesQuality.overallScore +
      result.premisesCompliance.overallScore +
      result.premisesPolicy.overallScore +
      result.staffReadiness.overallScore
    ));
    expect(result.overallScore).toBe(expected);
  });

  it("generates strengths for outstanding rating", () => {
    const allCategories: PremisesIntelligenceCategory[] = [
      "fire_safety_check", "health_safety_inspection", "maintenance_repair", "bedroom_standard",
      "communal_area_check", "garden_outdoor_area", "security_assessment", "accessibility_review",
    ];
    const records = allCategories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement when no records", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.areasForImprovement.some((a) => a.includes("No premises records"))).toBe(true);
  });

  it("generates actions when policy is null", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates actions when staff is empty", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: makeAllTruePolicy(),
      staff: [],
    });
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("includes regulatory links", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 25"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 26"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 24"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("generates no-action message when everything is good", () => {
    const allCategories: PremisesIntelligenceCategory[] = [
      "fire_safety_check", "health_safety_inspection", "maintenance_repair", "bedroom_standard",
      "communal_area_check", "garden_outdoor_area", "security_assessment", "accessibility_review",
    ];
    const records = allCategories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("flags low hazard identification actions", () => {
    const records = makeFullRecords(10, {
      hazardIdentified: false,
      maintenanceCompleted: false,
    }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("Hazard identification"))).toBe(true);
  });

  it("identifies low-score areas for action", () => {
    const records = [
      makeRecord({
        id: "a", category: "accessibility_review",
        hazardIdentified: false, riskMitigated: false, maintenanceCompleted: false, childFriendlyAssessed: false,
        documentationComplete: false, timelyRecording: false,
      }),
    ];
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    // Area score: freq=0, rate1=0, rate2=0, riskBonus=0 = 0 → <=3 → flagged
    expect(result.actions.some((a) => a.includes("area(s) with low premises scores"))).toBe(true);
  });

  it("flags low maintenance completion", () => {
    const records = makeFullRecords(10, {
      maintenanceCompleted: false,
    }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("Maintenance completion"))).toBe(true);
  });

  it("flags low documentation rate", () => {
    const records = makeFullRecords(10, {
      documentationComplete: false,
    }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("Documentation rate"))).toBe(true);
  });

  it("flags low timely recording rate", () => {
    const records = makeFullRecords(10, {
      timelyRecording: false,
    }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("Timely recording"))).toBe(true);
  });

  it("flags low staff health & safety knowledge", () => {
    const staff = [
      makeStaff({ staffId: "s1", healthSafetyKnowledge: false }),
      makeStaff({ staffId: "s2", healthSafetyKnowledge: false }),
      makeStaff({ staffId: "s3", healthSafetyKnowledge: false }),
    ];
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: makeAllTruePolicy(),
      staff,
    });
    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("Health & safety knowledge"))).toBe(true);
  });

  it("area profiles are built from period-filtered records only", () => {
    const records = [
      makeRecord({ id: "in", date: "2026-06-15", category: "fire_safety_check" }),
      makeRecord({ id: "out", date: "2025-01-01", category: "bedroom_standard" }),
    ];
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.areaProfiles).toHaveLength(1);
    expect(result.areaProfiles[0].category).toBe("fire_safety_check");
  });

  it("strengths mention quality when quality score >= 20", () => {
    const allCategories: PremisesIntelligenceCategory[] = [
      "fire_safety_check", "health_safety_inspection", "maintenance_repair", "bedroom_standard",
      "communal_area_check", "garden_outdoor_area", "security_assessment", "accessibility_review",
    ];
    const records = allCategories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.strengths.some((s) => s.includes("Premises quality is strong"))).toBe(true);
  });

  it("strengths mention compliance when compliance score >= 20", () => {
    const allCategories: PremisesIntelligenceCategory[] = [
      "fire_safety_check", "health_safety_inspection", "maintenance_repair", "bedroom_standard",
      "communal_area_check", "garden_outdoor_area", "security_assessment", "accessibility_review",
    ];
    const records = allCategories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.strengths.some((s) => s.includes("Premises compliance is strong"))).toBe(true);
  });

  it("strengths mention policy when policy score >= 20", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.strengths.some((s) => s.includes("Premises policy framework is robust"))).toBe(true);
  });

  it("strengths mention staff readiness when staff score >= 20", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.strengths.some((s) => s.includes("Staff premises readiness is strong"))).toBe(true);
  });

  it("areas for improvement mention inadequate rating", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("areas for improvement mention no policy", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: null,
      staff: [makeStaff()],
    });
    expect(result.areasForImprovement.some((a) => a.includes("No premises policy"))).toBe(true);
  });

  it("areas for improvement mention no staff training", () => {
    const result = generatePremisesIntelligenceReport({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: makeAllTruePolicy(),
      staff: [],
    });
    expect(result.areasForImprovement.some((a) => a.includes("No staff premises training"))).toBe(true);
  });
});

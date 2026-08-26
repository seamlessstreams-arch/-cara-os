import { describe, it, expect } from "vitest";
import {
  generateEnvironmentalRiskComplianceIntelligence,
  evaluateRiskAssessmentCoverage,
  evaluateSafetyCheckCompliance,
  evaluateRemediationEffectiveness,
  evaluateStaffSafetyReadiness,
  buildAreaRiskProfiles,
  getRating,
  getHazardTypeLabel,
  getRiskLevelLabel,
  getCheckStatusLabel,
  getAreaTypeLabel,
  getRemediationStatusLabel,
  getRatingLabel,
} from "../environmental-risk-compliance-engine";
import type {
  RiskAssessment,
  SafetyCheck,
  RemediationAction,
  StaffSafetyTraining,
} from "../environmental-risk-compliance-engine";

// -- Factories ----------------------------------------------------------------

function mkAssessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    id: "ra-1",
    areaType: "bedroom",
    areaName: "Alex's Bedroom",
    assessmentDate: "2026-04-01",
    assessedBy: "Sarah Johnson",
    hazardType: "window_restrictor",
    riskLevel: "high",
    mitigationInPlace: true,
    mitigationDescription: "Window restrictors fitted",
    nextReviewDate: "2026-07-01",
    reviewCurrent: true,
    ...overrides,
  };
}

function mkCheck(overrides: Partial<SafetyCheck> = {}): SafetyCheck {
  return {
    id: "sc-1",
    areaType: "bathroom",
    areaName: "Main Bathroom",
    checkDate: "2026-05-01",
    checkedBy: "Sarah Johnson",
    checkType: "water_temperature",
    status: "compliant",
    reading: 43.2,
    notes: "Within safe range",
    actionRequired: false,
    actionCompleted: false,
    ...overrides,
  };
}

function mkRemediation(overrides: Partial<RemediationAction> = {}): RemediationAction {
  return {
    id: "rem-1",
    assessmentId: "ra-1",
    hazardType: "structural",
    areaType: "garden",
    description: "Fix garden gate",
    assignedTo: "Tom Richards",
    targetDate: "2026-05-15",
    completionDate: "2026-05-12",
    status: "completed",
    verified: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffSafetyTraining> = {}): StaffSafetyTraining {
  return {
    id: "sst-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    ligatureAwareness: true,
    coshhTrained: true,
    fireSafetyTrained: true,
    waterSafetyTrained: true,
    manualHandling: true,
    riskAssessmentCompetent: true,
    ...overrides,
  };
}

// -- pct() helper -------------------------------------------------------------


// -- getRating() --------------------------------------------------------------

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
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// -- Label functions ----------------------------------------------------------

describe("label functions", () => {
  it("getHazardTypeLabel returns correct labels", () => {
    expect(getHazardTypeLabel("ligature_point")).toBe("Ligature Point");
    expect(getHazardTypeLabel("water_temperature")).toBe("Water Temperature");
    expect(getHazardTypeLabel("coshh")).toBe("COSHH");
    expect(getHazardTypeLabel("window_restrictor")).toBe("Window Restrictor");
    expect(getHazardTypeLabel("sharp_object")).toBe("Sharp Object");
    expect(getHazardTypeLabel("electrical")).toBe("Electrical");
    expect(getHazardTypeLabel("slip_trip")).toBe("Slip / Trip");
    expect(getHazardTypeLabel("fire_equipment")).toBe("Fire Equipment");
    expect(getHazardTypeLabel("structural")).toBe("Structural");
    expect(getHazardTypeLabel("other")).toBe("Other");
  });

  it("getRiskLevelLabel returns correct labels", () => {
    expect(getRiskLevelLabel("low")).toBe("Low");
    expect(getRiskLevelLabel("medium")).toBe("Medium");
    expect(getRiskLevelLabel("high")).toBe("High");
    expect(getRiskLevelLabel("critical")).toBe("Critical");
  });

  it("getCheckStatusLabel returns correct labels", () => {
    expect(getCheckStatusLabel("compliant")).toBe("Compliant");
    expect(getCheckStatusLabel("minor_issue")).toBe("Minor Issue");
    expect(getCheckStatusLabel("major_issue")).toBe("Major Issue");
    expect(getCheckStatusLabel("non_compliant")).toBe("Non-Compliant");
  });

  it("getAreaTypeLabel returns correct labels", () => {
    expect(getAreaTypeLabel("bedroom")).toBe("Bedroom");
    expect(getAreaTypeLabel("bathroom")).toBe("Bathroom");
    expect(getAreaTypeLabel("kitchen")).toBe("Kitchen");
    expect(getAreaTypeLabel("communal")).toBe("Communal");
    expect(getAreaTypeLabel("garden")).toBe("Garden");
    expect(getAreaTypeLabel("utility")).toBe("Utility");
    expect(getAreaTypeLabel("office")).toBe("Office");
    expect(getAreaTypeLabel("corridor")).toBe("Corridor");
  });

  it("getRemediationStatusLabel returns correct labels", () => {
    expect(getRemediationStatusLabel("completed")).toBe("Completed");
    expect(getRemediationStatusLabel("in_progress")).toBe("In Progress");
    expect(getRemediationStatusLabel("planned")).toBe("Planned");
    expect(getRemediationStatusLabel("overdue")).toBe("Overdue");
    expect(getRemediationStatusLabel("not_started")).toBe("Not Started");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateRiskAssessmentCoverage -------------------------------------------

describe("evaluateRiskAssessmentCoverage", () => {
  it("returns 0 for empty assessments", () => {
    const r = evaluateRiskAssessmentCoverage([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalAssessments).toBe(0);
    expect(r.areasCovered).toBe(0);
    expect(r.areaCoverageRate).toBeNull();
    expect(r.reviewCurrentRate).toBeNull();
    expect(r.mitigationInPlaceRate).toBeNull();
    expect(r.highCriticalMitigatedRate).toBeNull();
  });

  it("returns totalAreas as 8", () => {
    const r = evaluateRiskAssessmentCoverage([]);
    expect(r.totalAreas).toBe(8);
  });

  it("counts unique area types covered", () => {
    const assessments = [
      mkAssessment({ id: "1", areaType: "bedroom", areaName: "Bed 1" }),
      mkAssessment({ id: "2", areaType: "bedroom", areaName: "Bed 2" }),
      mkAssessment({ id: "3", areaType: "bathroom", areaName: "Bath 1" }),
    ];
    const r = evaluateRiskAssessmentCoverage(assessments);
    expect(r.areasCovered).toBe(2);
  });

  it("calculates reviewCurrentRate correctly", () => {
    const assessments = [
      mkAssessment({ id: "1", reviewCurrent: true }),
      mkAssessment({ id: "2", reviewCurrent: false }),
    ];
    const r = evaluateRiskAssessmentCoverage(assessments);
    expect(r.reviewCurrentRate).toBe(50);
  });

  it("calculates mitigationInPlaceRate correctly", () => {
    const assessments = [
      mkAssessment({ id: "1", mitigationInPlace: true }),
      mkAssessment({ id: "2", mitigationInPlace: false }),
      mkAssessment({ id: "3", mitigationInPlace: true }),
    ];
    const r = evaluateRiskAssessmentCoverage(assessments);
    expect(r.mitigationInPlaceRate).toBe(67);
  });

  it("calculates highCriticalMitigatedRate — all mitigated", () => {
    const assessments = [
      mkAssessment({ id: "1", riskLevel: "high", mitigationInPlace: true }),
      mkAssessment({ id: "2", riskLevel: "critical", mitigationInPlace: true }),
    ];
    const r = evaluateRiskAssessmentCoverage(assessments);
    expect(r.highCriticalMitigatedRate).toBe(100);
  });

  it("calculates highCriticalMitigatedRate — none high/critical", () => {
    const assessments = [
      mkAssessment({ id: "1", riskLevel: "low", mitigationInPlace: false }),
    ];
    const r = evaluateRiskAssessmentCoverage(assessments);
    expect(r.highCriticalMitigatedRate).toBeNull(); // pct(0,0) = 0
  });

  it("calculates highCriticalMitigatedRate — partial", () => {
    const assessments = [
      mkAssessment({ id: "1", riskLevel: "high", mitigationInPlace: true }),
      mkAssessment({ id: "2", riskLevel: "critical", mitigationInPlace: false }),
    ];
    const r = evaluateRiskAssessmentCoverage(assessments);
    expect(r.highCriticalMitigatedRate).toBe(50);
  });

  it("caps score at 25", () => {
    // All 8 area types, all current, all mitigated, all high mitigated
    const areas: Array<"bedroom" | "bathroom" | "kitchen" | "communal" | "garden" | "utility" | "office" | "corridor"> =
      ["bedroom", "bathroom", "kitchen", "communal", "garden", "utility", "office", "corridor"];
    const assessments = areas.map((a, i) =>
      mkAssessment({ id: `ra-${i}`, areaType: a, areaName: a, riskLevel: "high", mitigationInPlace: true, reviewCurrent: true }),
    );
    const r = evaluateRiskAssessmentCoverage(assessments);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives higher score for full area coverage", () => {
    const single = evaluateRiskAssessmentCoverage([mkAssessment()]);
    const areas: Array<"bedroom" | "bathroom" | "kitchen" | "communal" | "garden" | "utility" | "office" | "corridor"> =
      ["bedroom", "bathroom", "kitchen", "communal", "garden", "utility", "office", "corridor"];
    const full = evaluateRiskAssessmentCoverage(
      areas.map((a, i) => mkAssessment({ id: `ra-${i}`, areaType: a, areaName: a })),
    );
    expect(full.overallScore).toBeGreaterThan(single.overallScore);
  });
});

// -- evaluateSafetyCheckCompliance --------------------------------------------

describe("evaluateSafetyCheckCompliance", () => {
  it("returns 0 for empty checks", () => {
    const r = evaluateSafetyCheckCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalChecks).toBe(0);
    expect(r.compliantRate).toBeNull();
    expect(r.nonCompliantCount).toBe(0);
    expect(r.actionRequiredCompletedRate).toBeNull();
    expect(r.checkFrequencyAdequate).toBe(false);
  });

  it("calculates compliantRate for all-compliant checks", () => {
    const checks = [mkCheck({ id: "1" }), mkCheck({ id: "2" }), mkCheck({ id: "3" })];
    const r = evaluateSafetyCheckCompliance(checks);
    expect(r.compliantRate).toBe(100);
  });

  it("counts non-compliant checks", () => {
    const checks = [
      mkCheck({ id: "1", status: "compliant" }),
      mkCheck({ id: "2", status: "non_compliant" }),
      mkCheck({ id: "3", status: "non_compliant" }),
    ];
    const r = evaluateSafetyCheckCompliance(checks);
    expect(r.nonCompliantCount).toBe(2);
  });

  it("calculates compliantRate with mixed statuses", () => {
    const checks = [
      mkCheck({ id: "1", status: "compliant" }),
      mkCheck({ id: "2", status: "minor_issue" }),
      mkCheck({ id: "3", status: "compliant" }),
    ];
    const r = evaluateSafetyCheckCompliance(checks);
    expect(r.compliantRate).toBe(67);
  });

  it("calculates actionRequiredCompletedRate", () => {
    const checks = [
      mkCheck({ id: "1", actionRequired: true, actionCompleted: true }),
      mkCheck({ id: "2", actionRequired: true, actionCompleted: false }),
      mkCheck({ id: "3", actionRequired: false, actionCompleted: false }),
    ];
    const r = evaluateSafetyCheckCompliance(checks);
    expect(r.actionRequiredCompletedRate).toBe(50);
  });

  it("returns 0 actionRequiredCompletedRate when no actions required", () => {
    const checks = [mkCheck({ id: "1", actionRequired: false })];
    const r = evaluateSafetyCheckCompliance(checks);
    expect(r.actionRequiredCompletedRate).toBeNull(); // pct(0,0) = 0
  });

  it("checkFrequencyAdequate is true for >= 10 checks", () => {
    const checks = Array.from({ length: 10 }, (_, i) => mkCheck({ id: `sc-${i}` }));
    const r = evaluateSafetyCheckCompliance(checks);
    expect(r.checkFrequencyAdequate).toBe(true);
  });

  it("checkFrequencyAdequate is false for < 10 checks", () => {
    const checks = Array.from({ length: 9 }, (_, i) => mkCheck({ id: `sc-${i}` }));
    const r = evaluateSafetyCheckCompliance(checks);
    expect(r.checkFrequencyAdequate).toBe(false);
  });

  it("gives bonus for zero non-compliant checks", () => {
    const compliant = evaluateSafetyCheckCompliance(
      Array.from({ length: 10 }, (_, i) => mkCheck({ id: `sc-${i}` })),
    );
    const withNonCompliant = evaluateSafetyCheckCompliance(
      Array.from({ length: 10 }, (_, i) =>
        mkCheck({ id: `sc-${i}`, status: i === 0 ? "non_compliant" : "compliant" }),
      ),
    );
    expect(compliant.overallScore).toBeGreaterThan(withNonCompliant.overallScore);
  });

  it("caps score at 25", () => {
    const checks = Array.from({ length: 15 }, (_, i) => mkCheck({ id: `sc-${i}` }));
    const r = evaluateSafetyCheckCompliance(checks);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives partial frequency score for 5-9 checks", () => {
    const fiveChecks = evaluateSafetyCheckCompliance(
      Array.from({ length: 5 }, (_, i) => mkCheck({ id: `sc-${i}` })),
    );
    const fourChecks = evaluateSafetyCheckCompliance(
      Array.from({ length: 4 }, (_, i) => mkCheck({ id: `sc-${i}` })),
    );
    expect(fiveChecks.overallScore).toBeGreaterThan(fourChecks.overallScore);
  });
});

// -- evaluateRemediationEffectiveness -----------------------------------------

describe("evaluateRemediationEffectiveness", () => {
  it("returns 25 when empty and no assessments exist", () => {
    const r = evaluateRemediationEffectiveness([], false);
    expect(r.overallScore).toBe(25);
    expect(r.totalActions).toBe(0);
  });

  it("returns 0 when empty but assessments exist", () => {
    const r = evaluateRemediationEffectiveness([], true);
    expect(r.overallScore).toBe(0);
    expect(r.totalActions).toBe(0);
  });

  it("returns correct metrics for empty result", () => {
    const r = evaluateRemediationEffectiveness([], true);
    expect(r.completedOnTimeRate).toBeNull();
    expect(r.overdueRate).toBeNull();
    expect(r.verifiedRate).toBeNull();
    expect(r.inProgressCount).toBe(0);
  });

  it("calculates completedOnTimeRate correctly", () => {
    const actions = [
      mkRemediation({ id: "1", status: "completed", completionDate: "2026-05-10", targetDate: "2026-05-15" }),
      mkRemediation({ id: "2", status: "completed", completionDate: "2026-05-20", targetDate: "2026-05-15" }),
    ];
    const r = evaluateRemediationEffectiveness(actions, true);
    expect(r.completedOnTimeRate).toBe(50);
  });

  it("counts overdue actions", () => {
    const actions = [
      mkRemediation({ id: "1", status: "overdue" }),
      mkRemediation({ id: "2", status: "completed" }),
      mkRemediation({ id: "3", status: "overdue" }),
    ];
    const r = evaluateRemediationEffectiveness(actions, true);
    expect(r.overdueRate).toBe(67);
  });

  it("calculates verifiedRate", () => {
    const actions = [
      mkRemediation({ id: "1", verified: true }),
      mkRemediation({ id: "2", verified: false }),
    ];
    const r = evaluateRemediationEffectiveness(actions, true);
    expect(r.verifiedRate).toBe(50);
  });

  it("counts in-progress actions", () => {
    const actions = [
      mkRemediation({ id: "1", status: "in_progress" }),
      mkRemediation({ id: "2", status: "in_progress" }),
      mkRemediation({ id: "3", status: "completed" }),
    ];
    const r = evaluateRemediationEffectiveness(actions, true);
    expect(r.inProgressCount).toBe(2);
  });

  it("gives bonus for zero overdue", () => {
    const noOverdue = evaluateRemediationEffectiveness(
      [mkRemediation({ id: "1", status: "completed", verified: true })],
      true,
    );
    const withOverdue = evaluateRemediationEffectiveness(
      [mkRemediation({ id: "1", status: "overdue", verified: false, completionDate: null })],
      true,
    );
    expect(noOverdue.overallScore).toBeGreaterThan(withOverdue.overallScore);
  });

  it("gives in-progress tracking credit", () => {
    const withInProgress = evaluateRemediationEffectiveness(
      [mkRemediation({ id: "1", status: "in_progress", completionDate: null, verified: false })],
      true,
    );
    expect(withInProgress.overallScore).toBeGreaterThan(0);
  });

  it("caps score at 25", () => {
    const actions = [
      mkRemediation({ id: "1", status: "completed", completionDate: "2026-05-10", targetDate: "2026-05-15", verified: true }),
    ];
    const r = evaluateRemediationEffectiveness(actions, true);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("treats null completionDate as not on time", () => {
    const actions = [
      mkRemediation({ id: "1", status: "completed", completionDate: null }),
    ];
    const r = evaluateRemediationEffectiveness(actions, true);
    expect(r.completedOnTimeRate).toBe(0);
  });
});

// -- evaluateStaffSafetyReadiness ---------------------------------------------

describe("evaluateStaffSafetyReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffSafetyReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.ligatureAwarenessRate).toBeNull();
    expect(r.coshhTrainedRate).toBeNull();
    expect(r.fireSafetyRate).toBeNull();
    expect(r.waterSafetyRate).toBeNull();
    expect(r.riskAssessmentCompetentRate).toBeNull();
  });

  it("returns 100% rates when all staff fully trained", () => {
    const training = [mkTraining({ id: "1" }), mkTraining({ id: "2", staffId: "s2" })];
    const r = evaluateStaffSafetyReadiness(training);
    expect(r.ligatureAwarenessRate).toBe(100);
    expect(r.coshhTrainedRate).toBe(100);
    expect(r.fireSafetyRate).toBe(100);
    expect(r.waterSafetyRate).toBe(100);
    expect(r.riskAssessmentCompetentRate).toBe(100);
  });

  it("calculates partial rates correctly", () => {
    const training = [
      mkTraining({ id: "1", coshhTrained: false }),
      mkTraining({ id: "2", staffId: "s2" }),
    ];
    const r = evaluateStaffSafetyReadiness(training);
    expect(r.coshhTrainedRate).toBe(50);
    expect(r.ligatureAwarenessRate).toBe(100);
  });

  it("calculates ligatureAwarenessRate correctly", () => {
    const training = [
      mkTraining({ id: "1", ligatureAwareness: true }),
      mkTraining({ id: "2", staffId: "s2", ligatureAwareness: false }),
      mkTraining({ id: "3", staffId: "s3", ligatureAwareness: true }),
    ];
    const r = evaluateStaffSafetyReadiness(training);
    expect(r.ligatureAwarenessRate).toBe(67);
  });

  it("calculates fireSafetyRate correctly", () => {
    const training = [
      mkTraining({ id: "1", fireSafetyTrained: false }),
      mkTraining({ id: "2", staffId: "s2", fireSafetyTrained: false }),
    ];
    const r = evaluateStaffSafetyReadiness(training);
    expect(r.fireSafetyRate).toBe(0);
  });

  it("calculates waterSafetyRate correctly", () => {
    const training = [
      mkTraining({ id: "1", waterSafetyTrained: true }),
      mkTraining({ id: "2", staffId: "s2", waterSafetyTrained: false }),
    ];
    const r = evaluateStaffSafetyReadiness(training);
    expect(r.waterSafetyRate).toBe(50);
  });

  it("calculates riskAssessmentCompetentRate correctly", () => {
    const training = [
      mkTraining({ id: "1", riskAssessmentCompetent: true }),
      mkTraining({ id: "2", staffId: "s2", riskAssessmentCompetent: false }),
      mkTraining({ id: "3", staffId: "s3", riskAssessmentCompetent: false }),
      mkTraining({ id: "4", staffId: "s4", riskAssessmentCompetent: true }),
    ];
    const r = evaluateStaffSafetyReadiness(training);
    expect(r.riskAssessmentCompetentRate).toBe(50);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      mkTraining({ id: `sst-${i}`, staffId: `s-${i}` }),
    );
    const r = evaluateStaffSafetyReadiness(training);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives max score for all fully trained", () => {
    const training = [mkTraining()];
    const r = evaluateStaffSafetyReadiness(training);
    expect(r.overallScore).toBe(25);
  });

  it("gives 0 score when no one trained at all", () => {
    const training = [
      mkTraining({
        id: "1",
        ligatureAwareness: false,
        coshhTrained: false,
        fireSafetyTrained: false,
        waterSafetyTrained: false,
        riskAssessmentCompetent: false,
      }),
    ];
    const r = evaluateStaffSafetyReadiness(training);
    expect(r.overallScore).toBe(0);
  });
});

// -- buildAreaRiskProfiles ----------------------------------------------------

describe("buildAreaRiskProfiles", () => {
  it("returns empty array when no data", () => {
    const profiles = buildAreaRiskProfiles([], [], []);
    expect(profiles).toHaveLength(0);
  });

  it("creates profile per unique area name from assessments", () => {
    const assessments = [
      mkAssessment({ id: "1", areaName: "Kitchen", areaType: "kitchen" }),
      mkAssessment({ id: "2", areaName: "Kitchen", areaType: "kitchen" }),
      mkAssessment({ id: "3", areaName: "Bathroom", areaType: "bathroom" }),
    ];
    const profiles = buildAreaRiskProfiles(assessments, [], []);
    expect(profiles).toHaveLength(2);
  });

  it("includes areas from checks not in assessments", () => {
    const assessments = [mkAssessment({ areaName: "Kitchen", areaType: "kitchen" })];
    const checks = [mkCheck({ areaName: "Garden", areaType: "garden" })];
    const profiles = buildAreaRiskProfiles(assessments, checks, []);
    expect(profiles).toHaveLength(2);
    expect(profiles.map((p) => p.areaName)).toContain("Garden");
  });

  it("sets assessmentCoverage true when area has assessments", () => {
    const assessments = [mkAssessment({ areaName: "Kitchen", areaType: "kitchen" })];
    const profiles = buildAreaRiskProfiles(assessments, [], []);
    expect(profiles[0].assessmentCoverage).toBe(true);
  });

  it("sets checkCompliance true when all checks compliant or minor", () => {
    const checks = [
      mkCheck({ id: "1", areaName: "Bath", status: "compliant" }),
      mkCheck({ id: "2", areaName: "Bath", status: "minor_issue" }),
    ];
    const profiles = buildAreaRiskProfiles([], checks, []);
    expect(profiles[0].checkCompliance).toBe(true);
  });

  it("sets checkCompliance false when a check is non-compliant", () => {
    const checks = [
      mkCheck({ id: "1", areaName: "Bath", status: "compliant" }),
      mkCheck({ id: "2", areaName: "Bath", status: "non_compliant" }),
    ];
    const profiles = buildAreaRiskProfiles([], checks, []);
    expect(profiles[0].checkCompliance).toBe(false);
  });

  it("sets remediationClear true when no overdue", () => {
    const assessments = [mkAssessment({ areaName: "Kitchen", areaType: "kitchen" })];
    const remediations = [mkRemediation({ areaType: "kitchen", status: "completed" })];
    const profiles = buildAreaRiskProfiles(assessments, [], remediations);
    expect(profiles[0].remediationClear).toBe(true);
  });

  it("sets remediationClear false when overdue exists", () => {
    const assessments = [mkAssessment({ areaName: "Kitchen", areaType: "kitchen" })];
    const remediations = [mkRemediation({ areaType: "kitchen", status: "overdue" })];
    const profiles = buildAreaRiskProfiles(assessments, [], remediations);
    expect(profiles[0].remediationClear).toBe(false);
  });

  it("caps overallScore at 10", () => {
    const assessments = [mkAssessment({ areaName: "Bath", areaType: "bathroom" })];
    const checks = Array.from({ length: 5 }, (_, i) =>
      mkCheck({ id: `sc-${i}`, areaName: "Bath", areaType: "bathroom" }),
    );
    const profiles = buildAreaRiskProfiles(assessments, checks, []);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("gives partial credit when assessments but no checks", () => {
    const assessments = [mkAssessment({ areaName: "Kitchen", areaType: "kitchen" })];
    const profiles = buildAreaRiskProfiles(assessments, [], []);
    expect(profiles[0].overallScore).toBeGreaterThan(0);
  });

  it("counts assessment, check, and remediation totals per area", () => {
    const assessments = [
      mkAssessment({ id: "1", areaName: "Kitchen", areaType: "kitchen" }),
      mkAssessment({ id: "2", areaName: "Kitchen", areaType: "kitchen" }),
    ];
    const checks = [mkCheck({ id: "1", areaName: "Kitchen", areaType: "kitchen" })];
    const remediations = [mkRemediation({ id: "1", areaType: "kitchen" })];
    const profiles = buildAreaRiskProfiles(assessments, checks, remediations);
    expect(profiles[0].assessmentCount).toBe(2);
    expect(profiles[0].checkCount).toBe(1);
    expect(profiles[0].remediationCount).toBe(1);
  });
});

// -- generateEnvironmentalRiskComplianceIntelligence --------------------------

describe("generateEnvironmentalRiskComplianceIntelligence", () => {
  it("returns correct score for empty data (remediation=25, rest=0)", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.overallScore).toBe(25);
    expect(r.rating).toBe("inadequate");
    expect(r.riskAssessmentCoverage.overallScore).toBe(0);
    expect(r.safetyCheckCompliance.overallScore).toBe(0);
    // No assessments exist, so remediation gets 25
    expect(r.remediationEffectiveness.overallScore).toBe(25);
    expect(r.staffSafetyReadiness.overallScore).toBe(0);
  });

  it("returns correct homeId and period", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-06-01");
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-06-01");
  });

  it("caps overallScore at 100", () => {
    // Build data that would max out all evaluators
    const areas: Array<"bedroom" | "bathroom" | "kitchen" | "communal" | "garden" | "utility" | "office" | "corridor"> =
      ["bedroom", "bathroom", "kitchen", "communal", "garden", "utility", "office", "corridor"];
    const assessments = areas.map((a, i) =>
      mkAssessment({ id: `ra-${i}`, areaType: a, areaName: a, riskLevel: "high", reviewCurrent: true, mitigationInPlace: true }),
    );
    const checks = Array.from({ length: 15 }, (_, i) => mkCheck({ id: `sc-${i}` }));
    const remediations = [mkRemediation({ id: "1", status: "completed", verified: true })];
    const training = [mkTraining({ id: "1" })];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, checks, remediations, training, "test", "2026-01-01", "2026-05-18");
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("score never goes below 0", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence(
      [mkAssessment({ mitigationInPlace: false, reviewCurrent: false, riskLevel: "low" })],
      [mkCheck({ status: "non_compliant" })],
      [mkRemediation({ status: "overdue", completionDate: null, verified: false })],
      [mkTraining({ ligatureAwareness: false, coshhTrained: false, fireSafetyTrained: false, waterSafetyTrained: false, riskAssessmentCompetent: false })],
      "test",
      "2026-01-01",
      "2026-05-18",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("produces areaProfiles", () => {
    const assessments = [mkAssessment({ areaName: "Kitchen", areaType: "kitchen" })];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.areaProfiles).toHaveLength(1);
    expect(r.areaProfiles[0].areaName).toBe("Kitchen");
  });

  it("always has 7 regulatory links", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("regulatory links include CHR 2015 Reg 25", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 25"))).toBe(true);
  });

  it("regulatory links include COSHH Regulations 2002", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.regulatoryLinks.some((l) => l.includes("COSHH"))).toBe(true);
  });

  it("regulatory links include Fire Safety Order", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.regulatoryLinks.some((l) => l.includes("Fire Safety"))).toBe(true);
  });

  // Strengths tests
  it("strength: full area coverage", () => {
    const areas: Array<"bedroom" | "bathroom" | "kitchen" | "communal" | "garden" | "utility" | "office" | "corridor"> =
      ["bedroom", "bathroom", "kitchen", "communal", "garden", "utility", "office", "corridor"];
    const assessments = areas.map((a, i) => mkAssessment({ id: `ra-${i}`, areaType: a, areaName: a }));
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.strengths.some((s) => s.includes("all premises areas"))).toBe(true);
  });

  it("strength: all reviews current", () => {
    const assessments = [mkAssessment({ reviewCurrent: true })];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.strengths.some((s) => s.includes("current reviews"))).toBe(true);
  });

  it("strength: all mitigations in place", () => {
    const assessments = [mkAssessment({ mitigationInPlace: true })];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.strengths.some((s) => s.includes("Mitigations in place"))).toBe(true);
  });

  it("strength: high compliance rate", () => {
    const checks = Array.from({ length: 10 }, (_, i) => mkCheck({ id: `sc-${i}` }));
    const r = generateEnvironmentalRiskComplianceIntelligence([], checks, [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.strengths.some((s) => s.includes("compliance rate"))).toBe(true);
  });

  it("strength: no non-compliant checks", () => {
    const checks = [mkCheck()];
    const r = generateEnvironmentalRiskComplianceIntelligence([], checks, [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.strengths.some((s) => s.includes("No non-compliant"))).toBe(true);
  });

  it("strength: all staff ligature trained", () => {
    const training = [mkTraining()];
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], training, "test", "2026-01-01", "2026-05-18");
    expect(r.strengths.some((s) => s.includes("ligature awareness"))).toBe(true);
  });

  it("strength: all staff fire safety trained", () => {
    const training = [mkTraining()];
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], training, "test", "2026-01-01", "2026-05-18");
    expect(r.strengths.some((s) => s.includes("fire safety"))).toBe(true);
  });

  it("strength: no overdue remediations", () => {
    const remediations = [mkRemediation({ status: "completed" })];
    const r = generateEnvironmentalRiskComplianceIntelligence([mkAssessment()], [], remediations, [], "test", "2026-01-01", "2026-05-18");
    expect(r.strengths.some((s) => s.includes("No overdue"))).toBe(true);
  });

  // Areas for improvement tests
  it("improvement: no assessments", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.areasForImprovement.some((a) => a.includes("No risk assessments"))).toBe(true);
  });

  it("improvement: partial area coverage", () => {
    const assessments = [mkAssessment({ areaType: "bedroom" })];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.areasForImprovement.some((a) => a.includes("only cover"))).toBe(true);
  });

  it("improvement: low review current rate", () => {
    const assessments = [
      mkAssessment({ id: "1", reviewCurrent: false }),
      mkAssessment({ id: "2", reviewCurrent: false }),
      mkAssessment({ id: "3", reviewCurrent: true }),
    ];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.areasForImprovement.some((a) => a.includes("current reviews"))).toBe(true);
  });

  it("improvement: no safety checks when assessments exist", () => {
    const assessments = [mkAssessment()];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.areasForImprovement.some((a) => a.includes("No safety checks"))).toBe(true);
  });

  it("improvement: no training records", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.areasForImprovement.some((a) => a.includes("No staff safety training"))).toBe(true);
  });

  it("improvement: incomplete COSHH training", () => {
    const training = [
      mkTraining({ id: "1", coshhTrained: false }),
      mkTraining({ id: "2", staffId: "s2", coshhTrained: true }),
    ];
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], training, "test", "2026-01-01", "2026-05-18");
    expect(r.areasForImprovement.some((a) => a.includes("COSHH training"))).toBe(true);
  });

  // Actions tests
  it("action URGENT: high/critical unmitigated", () => {
    const assessments = [mkAssessment({ riskLevel: "critical", mitigationInPlace: false })];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("high/critical"))).toBe(true);
  });

  it("action URGENT: non-compliant checks", () => {
    const checks = [mkCheck({ status: "non_compliant" })];
    const r = generateEnvironmentalRiskComplianceIntelligence([], checks, [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("non-compliant"))).toBe(true);
  });

  it("action URGENT: overdue remediations", () => {
    const remediations = [mkRemediation({ status: "overdue", completionDate: null, verified: false })];
    const r = generateEnvironmentalRiskComplianceIntelligence([mkAssessment()], [], remediations, [], "test", "2026-01-01", "2026-05-18");
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("overdue"))).toBe(true);
  });

  it("action: complete risk assessments when none exist", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.actions.some((a) => a.includes("Complete risk assessments"))).toBe(true);
  });

  it("action: update overdue reviews", () => {
    const assessments = [
      mkAssessment({ id: "1", reviewCurrent: true }),
      mkAssessment({ id: "2", reviewCurrent: false }),
    ];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.actions.some((a) => a.includes("Update"))).toBe(true);
  });

  it("action: implement safety checks when none exist", () => {
    const assessments = [mkAssessment()];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.actions.some((a) => a.includes("Implement regular safety check"))).toBe(true);
  });

  it("action: arrange COSHH training", () => {
    const training = [mkTraining({ coshhTrained: false })];
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], training, "test", "2026-01-01", "2026-05-18");
    expect(r.actions.some((a) => a.includes("COSHH training"))).toBe(true);
  });

  it("action: arrange ligature training", () => {
    const training = [mkTraining({ ligatureAwareness: false })];
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], training, "test", "2026-01-01", "2026-05-18");
    expect(r.actions.some((a) => a.includes("ligature awareness training"))).toBe(true);
  });

  // Rating boundary tests
  it("rating outstanding for high-scoring data", () => {
    const areas: Array<"bedroom" | "bathroom" | "kitchen" | "communal" | "garden" | "utility" | "office" | "corridor"> =
      ["bedroom", "bathroom", "kitchen", "communal", "garden", "utility", "office", "corridor"];
    const assessments = areas.map((a, i) =>
      mkAssessment({ id: `ra-${i}`, areaType: a, areaName: a, riskLevel: "high", mitigationInPlace: true, reviewCurrent: true }),
    );
    const checks = Array.from({ length: 15 }, (_, i) => mkCheck({ id: `sc-${i}` }));
    const remediations = [mkRemediation()];
    const training = [mkTraining()];
    const r = generateEnvironmentalRiskComplianceIntelligence(assessments, checks, remediations, training, "test", "2026-01-01", "2026-05-18");
    expect(r.rating).toBe("outstanding");
  });

  it("rating inadequate for empty data (with remediation exception)", () => {
    // Empty data gives 0+0+25+0 = 25 which is inadequate
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.rating).toBe("inadequate");
  });

  // Integration: no strengths/actions on empty
  it("no strengths on empty data", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.strengths).toHaveLength(0);
  });

  it("has areas for improvement on empty data", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("has actions on empty data", () => {
    const r = generateEnvironmentalRiskComplianceIntelligence([], [], [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.actions.length).toBeGreaterThan(0);
  });

  // Overdue remediation areas for improvement
  it("improvement: overdue remediation rate", () => {
    const remediations = [mkRemediation({ status: "overdue", completionDate: null, verified: false })];
    const r = generateEnvironmentalRiskComplianceIntelligence([mkAssessment()], [], remediations, [], "test", "2026-01-01", "2026-05-18");
    expect(r.areasForImprovement.some((a) => a.includes("overdue"))).toBe(true);
  });

  // Non-compliant safety checks area for improvement
  it("improvement: non-compliant checks", () => {
    const checks = [mkCheck({ status: "non_compliant" })];
    const r = generateEnvironmentalRiskComplianceIntelligence([], checks, [], [], "test", "2026-01-01", "2026-05-18");
    expect(r.areasForImprovement.some((a) => a.includes("non-compliant"))).toBe(true);
  });
});

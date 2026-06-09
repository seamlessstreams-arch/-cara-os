// ==============================================================================
// TESTS — Water Safety & Legionella Intelligence Engine
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateTemperatureCompliance,
  evaluateLegionellaManagement,
  evaluateWaterSafetyPolicy,
  evaluateStaffWaterReadiness,
  buildWaterSafetyLocationProfiles,
  generateWaterSafetyLegionellaIntelligence,
  pct,
  getRating,
  getWaterSourceTypeLabel,
  getCheckOutcomeLabel,
  getRiskLevelLabel,
  getComplianceStatusLabel,
  getRatingLabel,
} from "../water-safety-legionella-engine";
import type {
  TemperatureCheck,
  LegionellaAssessment,
  WaterSafetyPolicy,
  StaffWaterSafetyTraining,
} from "../water-safety-legionella-engine";

// -- Test Fixtures --------------------------------------------------------------

const makeCheck = (
  overrides: Partial<TemperatureCheck> = {}
): TemperatureCheck => ({
  id: "tc-001",
  sourceType: "hot_tap",
  location: "Kitchen",
  checkDate: "2026-03-15",
  checkedBy: "Sarah Johnson",
  temperatureCelsius: 58,
  withinSafeRange: true,
  outcome: "pass",
  correctiveAction: false,
  ...overrides,
});

const makeAssessment = (
  overrides: Partial<LegionellaAssessment> = {}
): LegionellaAssessment => ({
  id: "la-001",
  assessmentDate: "2026-01-10",
  assessedBy: "Water Hygiene Services Ltd",
  riskLevel: "low",
  flushingScheduleInPlace: true,
  waterTreatmentActive: true,
  deadLegsIdentified: true,
  deadLegsRemoved: true,
  nextAssessmentDue: "2027-01-10",
  ...overrides,
});

const makePolicy = (
  overrides: Partial<WaterSafetyPolicy> = {}
): WaterSafetyPolicy => ({
  id: "wsp-001",
  policyReviewDate: "2026-01-05",
  policyCurrent: true,
  temperatureMonitoringSchedule: true,
  legionellaManagementPlan: true,
  scaldingPreventionMeasures: true,
  bathSupervisionProtocol: true,
  emergencyProcedures: true,
  recordKeepingSystem: true,
  ...overrides,
});

const makeTraining = (
  overrides: Partial<StaffWaterSafetyTraining> = {}
): StaffWaterSafetyTraining => ({
  id: "wst-001",
  staffId: "staff-001",
  staffName: "Sarah Johnson",
  legionellaAwareness: true,
  temperatureMonitoring: true,
  scaldingPrevention: true,
  bathSupervision: true,
  emergencyResponse: true,
  recordKeeping: true,
  ...overrides,
});

// ==============================================================================
// pct() helper
// ==============================================================================

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("returns 100 for equal values", () => {
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

// ==============================================================================
// getRating() helper
// ==============================================================================

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

// ==============================================================================
// Label getters
// ==============================================================================

describe("label getters", () => {
  it("getWaterSourceTypeLabel returns correct labels", () => {
    expect(getWaterSourceTypeLabel("hot_tap")).toBe("Hot Tap");
    expect(getWaterSourceTypeLabel("cold_tap")).toBe("Cold Tap");
    expect(getWaterSourceTypeLabel("bath")).toBe("Bath");
    expect(getWaterSourceTypeLabel("shower")).toBe("Shower");
    expect(getWaterSourceTypeLabel("storage_tank")).toBe("Storage Tank");
    expect(getWaterSourceTypeLabel("calorifier")).toBe("Calorifier");
    expect(getWaterSourceTypeLabel("dead_leg")).toBe("Dead Leg");
    expect(getWaterSourceTypeLabel("other")).toBe("Other");
  });

  it("getCheckOutcomeLabel returns correct labels", () => {
    expect(getCheckOutcomeLabel("pass")).toBe("Pass");
    expect(getCheckOutcomeLabel("minor_issue")).toBe("Minor Issue");
    expect(getCheckOutcomeLabel("major_issue")).toBe("Major Issue");
    expect(getCheckOutcomeLabel("fail")).toBe("Fail");
  });

  it("getRiskLevelLabel returns correct labels", () => {
    expect(getRiskLevelLabel("low")).toBe("Low");
    expect(getRiskLevelLabel("medium")).toBe("Medium");
    expect(getRiskLevelLabel("high")).toBe("High");
    expect(getRiskLevelLabel("very_high")).toBe("Very High");
  });

  it("getComplianceStatusLabel returns correct labels", () => {
    expect(getComplianceStatusLabel("compliant")).toBe("Compliant");
    expect(getComplianceStatusLabel("partially_compliant")).toBe(
      "Partially Compliant"
    );
    expect(getComplianceStatusLabel("non_compliant")).toBe("Non-Compliant");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe(
      "Requires Improvement"
    );
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ==============================================================================
// evaluateTemperatureCompliance
// ==============================================================================

describe("evaluateTemperatureCompliance", () => {
  it("returns 0 score for empty array", () => {
    const result = evaluateTemperatureCompliance([]);
    expect(result.score).toBe(0);
    expect(result.totalChecks).toBe(0);
    expect(result.passRate).toBe(0);
    expect(result.withinSafeRangeRate).toBe(0);
    expect(result.correctiveActionRate).toBe(0);
    expect(result.sourceTypeCoverage).toBe(0);
  });

  it("scores pass rate correctly — all pass", () => {
    const checks = [
      makeCheck({ id: "1" }),
      makeCheck({ id: "2" }),
      makeCheck({ id: "3" }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    expect(result.passRate).toBe(100);
    expect(result.passCount).toBe(3);
  });

  it("scores pass rate correctly — mixed", () => {
    const checks = [
      makeCheck({ id: "1", outcome: "pass" }),
      makeCheck({ id: "2", outcome: "minor_issue", correctiveAction: true }),
      makeCheck({ id: "3", outcome: "fail", correctiveAction: false }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    expect(result.passRate).toBe(33);
    expect(result.passCount).toBe(1);
  });

  it("calculates within safe range rate", () => {
    const checks = [
      makeCheck({ id: "1", withinSafeRange: true }),
      makeCheck({ id: "2", withinSafeRange: true }),
      makeCheck({ id: "3", withinSafeRange: false }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    expect(result.withinSafeRangeRate).toBe(67);
    expect(result.withinSafeRangeCount).toBe(2);
  });

  it("calculates corrective action rate when issues exist", () => {
    const checks = [
      makeCheck({
        id: "1",
        outcome: "minor_issue",
        correctiveAction: true,
      }),
      makeCheck({
        id: "2",
        outcome: "major_issue",
        correctiveAction: true,
      }),
      makeCheck({ id: "3", outcome: "fail", correctiveAction: false }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    expect(result.issueCount).toBe(3);
    expect(result.correctiveActionCount).toBe(2);
    expect(result.correctiveActionRate).toBe(67);
  });

  it("corrective action rate is 0 when no issues", () => {
    const checks = [makeCheck({ id: "1", outcome: "pass" })];
    const result = evaluateTemperatureCompliance(checks);
    expect(result.issueCount).toBe(0);
    expect(result.correctiveActionRate).toBe(0);
  });

  it("calculates source type coverage", () => {
    const checks = [
      makeCheck({ id: "1", sourceType: "hot_tap" }),
      makeCheck({ id: "2", sourceType: "cold_tap" }),
      makeCheck({ id: "3", sourceType: "bath" }),
      makeCheck({ id: "4", sourceType: "shower" }),
      makeCheck({ id: "5", sourceType: "storage_tank" }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    expect(result.sourceTypeCoverage).toBe(5);
  });

  it("groups by source type", () => {
    const checks = [
      makeCheck({ id: "1", sourceType: "hot_tap" }),
      makeCheck({ id: "2", sourceType: "hot_tap" }),
      makeCheck({ id: "3", sourceType: "cold_tap" }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    expect(result.bySourceType).toEqual({ hot_tap: 2, cold_tap: 1 });
  });

  it("groups by outcome", () => {
    const checks = [
      makeCheck({ id: "1", outcome: "pass" }),
      makeCheck({ id: "2", outcome: "pass" }),
      makeCheck({ id: "3", outcome: "minor_issue", correctiveAction: true }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    expect(result.byOutcome).toEqual({ pass: 2, minor_issue: 1 });
  });

  it("caps score at 25", () => {
    // Build a near-perfect scenario
    const checks = [
      makeCheck({ id: "1", sourceType: "hot_tap" }),
      makeCheck({ id: "2", sourceType: "cold_tap" }),
      makeCheck({ id: "3", sourceType: "bath" }),
      makeCheck({ id: "4", sourceType: "shower" }),
      makeCheck({ id: "5", sourceType: "storage_tank" }),
      makeCheck({ id: "6", sourceType: "calorifier" }),
      makeCheck({ id: "7", sourceType: "dead_leg" }),
      makeCheck({ id: "8", sourceType: "other" }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBeGreaterThan(0);
  });

  it("gives max score for perfect data", () => {
    // All 8 source types, all pass, all within safe range
    const checks = [
      makeCheck({ id: "1", sourceType: "hot_tap" }),
      makeCheck({ id: "2", sourceType: "cold_tap" }),
      makeCheck({ id: "3", sourceType: "bath" }),
      makeCheck({ id: "4", sourceType: "shower" }),
      makeCheck({ id: "5", sourceType: "storage_tank" }),
      makeCheck({ id: "6", sourceType: "calorifier" }),
      makeCheck({ id: "7", sourceType: "dead_leg" }),
      makeCheck({ id: "8", sourceType: "other" }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    // pass=7, safeRange=6, corrective=0 (no issues), coverage=6 => 19
    // No issues so correctiveActionRate is 0, which means corrective score is 0
    expect(result.score).toBe(19);
  });

  it("gives full score when issues have corrective actions and all types covered", () => {
    const checks = [
      makeCheck({ id: "1", sourceType: "hot_tap" }),
      makeCheck({ id: "2", sourceType: "cold_tap" }),
      makeCheck({ id: "3", sourceType: "bath" }),
      makeCheck({ id: "4", sourceType: "shower" }),
      makeCheck({ id: "5", sourceType: "storage_tank" }),
      makeCheck({ id: "6", sourceType: "calorifier" }),
      makeCheck({ id: "7", sourceType: "dead_leg" }),
      makeCheck({
        id: "8",
        sourceType: "other",
        outcome: "minor_issue",
        withinSafeRange: true,
        correctiveAction: true,
      }),
    ];
    const result = evaluateTemperatureCompliance(checks);
    // pass: 7/8 = 88% => round(0.88 * 7) = round(6.16) = 6
    // safeRange: 8/8 = 100% => 6
    // corrective: 1/1 = 100% => 6
    // coverage: 8/8 => 6
    // total = 6 + 6 + 6 + 6 = 24
    expect(result.score).toBe(24);
  });
});

// ==============================================================================
// evaluateLegionellaManagement
// ==============================================================================

describe("evaluateLegionellaManagement", () => {
  it("returns 0 score for empty array", () => {
    const result = evaluateLegionellaManagement([]);
    expect(result.score).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.lowRiskRate).toBe(0);
    expect(result.flushingScheduleRate).toBe(0);
    expect(result.waterTreatmentRate).toBe(0);
    expect(result.deadLegsManagementRate).toBe(0);
  });

  it("scores low risk rate correctly — all low", () => {
    const assessments = [
      makeAssessment({ id: "1", riskLevel: "low" }),
      makeAssessment({ id: "2", riskLevel: "low" }),
    ];
    const result = evaluateLegionellaManagement(assessments);
    expect(result.lowRiskRate).toBe(100);
    expect(result.lowRiskCount).toBe(2);
  });

  it("scores low risk rate correctly — mixed", () => {
    const assessments = [
      makeAssessment({ id: "1", riskLevel: "low" }),
      makeAssessment({ id: "2", riskLevel: "high" }),
    ];
    const result = evaluateLegionellaManagement(assessments);
    expect(result.lowRiskRate).toBe(50);
  });

  it("scores flushing schedule rate", () => {
    const assessments = [
      makeAssessment({ id: "1", flushingScheduleInPlace: true }),
      makeAssessment({ id: "2", flushingScheduleInPlace: false }),
    ];
    const result = evaluateLegionellaManagement(assessments);
    expect(result.flushingScheduleRate).toBe(50);
    expect(result.flushingScheduleCount).toBe(1);
  });

  it("scores water treatment rate", () => {
    const assessments = [
      makeAssessment({ id: "1", waterTreatmentActive: true }),
      makeAssessment({ id: "2", waterTreatmentActive: true }),
      makeAssessment({ id: "3", waterTreatmentActive: false }),
    ];
    const result = evaluateLegionellaManagement(assessments);
    expect(result.waterTreatmentRate).toBe(67);
  });

  it("scores dead legs management correctly", () => {
    const assessments = [
      makeAssessment({
        id: "1",
        deadLegsIdentified: true,
        deadLegsRemoved: true,
      }),
      makeAssessment({
        id: "2",
        deadLegsIdentified: true,
        deadLegsRemoved: false,
      }),
    ];
    const result = evaluateLegionellaManagement(assessments);
    expect(result.deadLegsIdentifiedCount).toBe(2);
    expect(result.deadLegsRemovedCount).toBe(1);
    expect(result.deadLegsManagementRate).toBe(50);
  });

  it("dead legs management rate is 0 when none identified", () => {
    const assessments = [
      makeAssessment({
        id: "1",
        deadLegsIdentified: false,
        deadLegsRemoved: false,
      }),
    ];
    const result = evaluateLegionellaManagement(assessments);
    expect(result.deadLegsManagementRate).toBe(0);
  });

  it("groups by risk level", () => {
    const assessments = [
      makeAssessment({ id: "1", riskLevel: "low" }),
      makeAssessment({ id: "2", riskLevel: "low" }),
      makeAssessment({ id: "3", riskLevel: "medium" }),
    ];
    const result = evaluateLegionellaManagement(assessments);
    expect(result.byRiskLevel).toEqual({ low: 2, medium: 1 });
  });

  it("caps score at 25", () => {
    const assessments = [makeAssessment()];
    const result = evaluateLegionellaManagement(assessments);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives maximum score for perfect data", () => {
    const assessments = [
      makeAssessment({
        id: "1",
        riskLevel: "low",
        flushingScheduleInPlace: true,
        waterTreatmentActive: true,
        deadLegsIdentified: true,
        deadLegsRemoved: true,
      }),
    ];
    const result = evaluateLegionellaManagement(assessments);
    // low risk: 7, flushing: 6, treatment: 6, dead legs: 6 = 25
    expect(result.score).toBe(25);
  });

  it("gives low score for poor data", () => {
    const assessments = [
      makeAssessment({
        id: "1",
        riskLevel: "very_high",
        flushingScheduleInPlace: false,
        waterTreatmentActive: false,
        deadLegsIdentified: true,
        deadLegsRemoved: false,
      }),
    ];
    const result = evaluateLegionellaManagement(assessments);
    expect(result.score).toBe(0);
  });
});

// ==============================================================================
// evaluateWaterSafetyPolicy
// ==============================================================================

describe("evaluateWaterSafetyPolicy", () => {
  it("returns 0 score for empty array", () => {
    const result = evaluateWaterSafetyPolicy([]);
    expect(result.score).toBe(0);
    expect(result.totalPolicies).toBe(0);
  });

  it("gives maximum score for fully complete policy", () => {
    const policies = [makePolicy()];
    const result = evaluateWaterSafetyPolicy(policies);
    // policyCurrent=5, tempSchedule=4, legionellaPlan=4, scalding=4,
    // bath=3, emergency=3, record=2 = 25
    expect(result.score).toBe(25);
  });

  it("scores individual fields correctly", () => {
    const policies = [
      makePolicy({
        policyCurrent: true,
        temperatureMonitoringSchedule: false,
        legionellaManagementPlan: false,
        scaldingPreventionMeasures: false,
        bathSupervisionProtocol: false,
        emergencyProcedures: false,
        recordKeepingSystem: false,
      }),
    ];
    const result = evaluateWaterSafetyPolicy(policies);
    expect(result.score).toBe(5); // Only policyCurrent = 5
  });

  it("counts each field correctly", () => {
    const policies = [
      makePolicy({ id: "1" }),
      makePolicy({
        id: "2",
        policyCurrent: false,
        temperatureMonitoringSchedule: false,
      }),
    ];
    const result = evaluateWaterSafetyPolicy(policies);
    expect(result.policyCurrentCount).toBe(1);
    expect(result.temperatureScheduleCount).toBe(1);
    expect(result.legionellaPlanCount).toBe(2);
  });

  it("returns 0 for completely empty policy", () => {
    const policies = [
      makePolicy({
        policyCurrent: false,
        temperatureMonitoringSchedule: false,
        legionellaManagementPlan: false,
        scaldingPreventionMeasures: false,
        bathSupervisionProtocol: false,
        emergencyProcedures: false,
        recordKeepingSystem: false,
      }),
    ];
    const result = evaluateWaterSafetyPolicy(policies);
    expect(result.score).toBe(0);
  });

  it("caps score at 25", () => {
    const policies = [makePolicy()];
    const result = evaluateWaterSafetyPolicy(policies);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles multiple policies with mixed coverage", () => {
    const policies = [
      makePolicy({ id: "1" }),
      makePolicy({
        id: "2",
        policyCurrent: true,
        temperatureMonitoringSchedule: true,
        legionellaManagementPlan: true,
        scaldingPreventionMeasures: false,
        bathSupervisionProtocol: false,
        emergencyProcedures: false,
        recordKeepingSystem: false,
      }),
    ];
    const result = evaluateWaterSafetyPolicy(policies);
    expect(result.totalPolicies).toBe(2);
    // policyCurrentRate: 100% => 5
    // tempScheduleRate: 100% => 4
    // legionellaPlanRate: 100% => 4
    // scaldingRate: 50% => round(0.5*4) = 2
    // bathRate: 50% => round(0.5*3) = 2
    // emergencyRate: 50% => round(0.5*3) = 2
    // recordRate: 50% => round(0.5*2) = 1
    // total = 5 + 4 + 4 + 2 + 2 + 2 + 1 = 20
    expect(result.score).toBe(20);
  });

  it("scores temperatureMonitoringSchedule only", () => {
    const policies = [
      makePolicy({
        policyCurrent: false,
        temperatureMonitoringSchedule: true,
        legionellaManagementPlan: false,
        scaldingPreventionMeasures: false,
        bathSupervisionProtocol: false,
        emergencyProcedures: false,
        recordKeepingSystem: false,
      }),
    ];
    const result = evaluateWaterSafetyPolicy(policies);
    expect(result.score).toBe(4);
  });

  it("scores bathSupervisionProtocol only", () => {
    const policies = [
      makePolicy({
        policyCurrent: false,
        temperatureMonitoringSchedule: false,
        legionellaManagementPlan: false,
        scaldingPreventionMeasures: false,
        bathSupervisionProtocol: true,
        emergencyProcedures: false,
        recordKeepingSystem: false,
      }),
    ];
    const result = evaluateWaterSafetyPolicy(policies);
    expect(result.score).toBe(3);
  });

  it("scores recordKeepingSystem only", () => {
    const policies = [
      makePolicy({
        policyCurrent: false,
        temperatureMonitoringSchedule: false,
        legionellaManagementPlan: false,
        scaldingPreventionMeasures: false,
        bathSupervisionProtocol: false,
        emergencyProcedures: false,
        recordKeepingSystem: true,
      }),
    ];
    const result = evaluateWaterSafetyPolicy(policies);
    expect(result.score).toBe(2);
  });
});

// ==============================================================================
// evaluateStaffWaterReadiness
// ==============================================================================

describe("evaluateStaffWaterReadiness", () => {
  it("returns 0 score for empty array", () => {
    const result = evaluateStaffWaterReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.legionellaAwarenessRate).toBe(0);
  });

  it("gives maximum score for fully trained staff", () => {
    const training = [makeTraining()];
    const result = evaluateStaffWaterReadiness(training);
    // legionella=6, temp=5, scalding=5, bath=4, emergency=3, record=2 = 25
    expect(result.score).toBe(25);
  });

  it("scores each field independently", () => {
    const training = [
      makeTraining({
        legionellaAwareness: true,
        temperatureMonitoring: false,
        scaldingPrevention: false,
        bathSupervision: false,
        emergencyResponse: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffWaterReadiness(training);
    expect(result.score).toBe(6); // Only legionellaAwareness = 6
  });

  it("calculates rates correctly for multiple staff", () => {
    const training = [
      makeTraining({
        id: "1",
        legionellaAwareness: true,
        temperatureMonitoring: true,
        scaldingPrevention: true,
        bathSupervision: true,
        emergencyResponse: true,
        recordKeeping: true,
      }),
      makeTraining({
        id: "2",
        staffId: "staff-002",
        legionellaAwareness: true,
        temperatureMonitoring: false,
        scaldingPrevention: true,
        bathSupervision: false,
        emergencyResponse: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffWaterReadiness(training);
    expect(result.totalStaff).toBe(2);
    expect(result.legionellaAwarenessRate).toBe(100);
    expect(result.temperatureMonitoringRate).toBe(50);
    expect(result.scaldingPreventionRate).toBe(100);
    expect(result.bathSupervisionRate).toBe(50);
    expect(result.emergencyResponseRate).toBe(50);
    expect(result.recordKeepingRate).toBe(50);
  });

  it("returns 0 for completely untrained staff", () => {
    const training = [
      makeTraining({
        legionellaAwareness: false,
        temperatureMonitoring: false,
        scaldingPrevention: false,
        bathSupervision: false,
        emergencyResponse: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffWaterReadiness(training);
    expect(result.score).toBe(0);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffWaterReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("counts legionella awareness correctly", () => {
    const training = [
      makeTraining({ id: "1", legionellaAwareness: true }),
      makeTraining({ id: "2", staffId: "s2", legionellaAwareness: false }),
      makeTraining({ id: "3", staffId: "s3", legionellaAwareness: true }),
    ];
    const result = evaluateStaffWaterReadiness(training);
    expect(result.legionellaAwarenessCount).toBe(2);
    expect(result.legionellaAwarenessRate).toBe(67);
  });

  it("counts bath supervision correctly", () => {
    const training = [
      makeTraining({ id: "1", bathSupervision: true }),
      makeTraining({ id: "2", staffId: "s2", bathSupervision: true }),
      makeTraining({ id: "3", staffId: "s3", bathSupervision: false }),
      makeTraining({ id: "4", staffId: "s4", bathSupervision: false }),
    ];
    const result = evaluateStaffWaterReadiness(training);
    expect(result.bathSupervisionCount).toBe(2);
    expect(result.bathSupervisionRate).toBe(50);
  });

  it("scores temperatureMonitoring only", () => {
    const training = [
      makeTraining({
        legionellaAwareness: false,
        temperatureMonitoring: true,
        scaldingPrevention: false,
        bathSupervision: false,
        emergencyResponse: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffWaterReadiness(training);
    expect(result.score).toBe(5);
  });

  it("scores emergencyResponse only", () => {
    const training = [
      makeTraining({
        legionellaAwareness: false,
        temperatureMonitoring: false,
        scaldingPrevention: false,
        bathSupervision: false,
        emergencyResponse: true,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffWaterReadiness(training);
    expect(result.score).toBe(3);
  });

  it("scores recordKeeping only", () => {
    const training = [
      makeTraining({
        legionellaAwareness: false,
        temperatureMonitoring: false,
        scaldingPrevention: false,
        bathSupervision: false,
        emergencyResponse: false,
        recordKeeping: true,
      }),
    ];
    const result = evaluateStaffWaterReadiness(training);
    expect(result.score).toBe(2);
  });
});

// ==============================================================================
// buildWaterSafetyLocationProfiles
// ==============================================================================

describe("buildWaterSafetyLocationProfiles", () => {
  it("returns empty array when both inputs are empty", () => {
    const result = buildWaterSafetyLocationProfiles([], []);
    expect(result).toEqual([]);
  });

  it("creates profiles grouped by location", () => {
    const checks = [
      makeCheck({ id: "1", location: "Kitchen" }),
      makeCheck({ id: "2", location: "Kitchen" }),
      makeCheck({ id: "3", location: "Bathroom" }),
    ];
    const result = buildWaterSafetyLocationProfiles(checks, []);
    expect(result.length).toBe(2);
    const kitchen = result.find((p) => p.location === "Kitchen");
    expect(kitchen).toBeDefined();
    expect(kitchen!.checkCount).toBe(2);
  });

  it("calculates pass rate per location", () => {
    const checks = [
      makeCheck({ id: "1", location: "Kitchen", outcome: "pass" }),
      makeCheck({
        id: "2",
        location: "Kitchen",
        outcome: "minor_issue",
        correctiveAction: true,
      }),
    ];
    const result = buildWaterSafetyLocationProfiles(checks, []);
    const kitchen = result.find((p) => p.location === "Kitchen");
    expect(kitchen!.passRate).toBe(50);
  });

  it("calculates average temperature per location", () => {
    const checks = [
      makeCheck({ id: "1", location: "Kitchen", temperatureCelsius: 58 }),
      makeCheck({ id: "2", location: "Kitchen", temperatureCelsius: 62 }),
    ];
    const result = buildWaterSafetyLocationProfiles(checks, []);
    const kitchen = result.find((p) => p.location === "Kitchen");
    expect(kitchen!.averageTemperature).toBe(60);
  });

  it("assigns assessments to all locations", () => {
    const checks = [
      makeCheck({ id: "1", location: "Kitchen" }),
      makeCheck({ id: "2", location: "Bathroom" }),
    ];
    const assessments = [makeAssessment({ id: "1" })];
    const result = buildWaterSafetyLocationProfiles(checks, assessments);
    for (const profile of result) {
      expect(profile.assessmentCount).toBe(1);
    }
  });

  it("includes latest risk level from assessments", () => {
    const checks = [makeCheck({ id: "1", location: "Kitchen" })];
    const assessments = [makeAssessment({ id: "1", riskLevel: "medium" })];
    const result = buildWaterSafetyLocationProfiles(checks, assessments);
    expect(result[0].latestRiskLevel).toBe("medium");
  });

  it("creates home-wide entry when only assessments exist", () => {
    const assessments = [makeAssessment({ id: "1" })];
    const result = buildWaterSafetyLocationProfiles([], assessments);
    expect(result.length).toBe(1);
    expect(result[0].location).toBe("Home-wide");
    expect(result[0].assessmentCount).toBe(1);
  });

  it("calculates location score within 0-10 range", () => {
    const checks = [
      makeCheck({ id: "1", location: "Kitchen" }),
    ];
    const assessments = [makeAssessment({ riskLevel: "low" })];
    const result = buildWaterSafetyLocationProfiles(checks, assessments);
    expect(result[0].score).toBeGreaterThanOrEqual(0);
    expect(result[0].score).toBeLessThanOrEqual(10);
  });

  it("gives high score for perfect location data", () => {
    const checks = [
      makeCheck({
        id: "1",
        location: "Kitchen",
        outcome: "pass",
        withinSafeRange: true,
      }),
    ];
    const assessments = [makeAssessment({ riskLevel: "low" })];
    const result = buildWaterSafetyLocationProfiles(checks, assessments);
    // passScore: 4, safeScore: 3, riskScore: 3 = 10
    expect(result[0].score).toBe(10);
  });

  it("gives low score for poor location data", () => {
    const checks = [
      makeCheck({
        id: "1",
        location: "Kitchen",
        outcome: "fail",
        withinSafeRange: false,
        correctiveAction: false,
      }),
    ];
    const assessments = [makeAssessment({ riskLevel: "very_high" })];
    const result = buildWaterSafetyLocationProfiles(checks, assessments);
    expect(result[0].score).toBe(0);
  });
});

// ==============================================================================
// generateWaterSafetyLegionellaIntelligence
// ==============================================================================

describe("generateWaterSafetyLegionellaIntelligence", () => {
  it("returns all required fields", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      [],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.assessedAt).toBe("2026-05-19");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.temperatureCompliance).toBeDefined();
    expect(result.legionellaManagement).toBeDefined();
    expect(result.waterSafetyPolicy).toBeDefined();
    expect(result.staffWaterReadiness).toBeDefined();
    expect(result.locationProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("sums evaluator scores for overall score", () => {
    const checks = [makeCheck()];
    const assessments = [makeAssessment()];
    const policies = [makePolicy()];
    const training = [makeTraining()];

    const result = generateWaterSafetyLegionellaIntelligence(
      checks,
      assessments,
      policies,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );

    const expectedSum =
      result.temperatureCompliance.score +
      result.legionellaManagement.score +
      result.waterSafetyPolicy.score +
      result.staffWaterReadiness.score;

    expect(result.overallScore).toBe(expectedSum);
  });

  it("caps overall score at 100", () => {
    const checks = [makeCheck()];
    const assessments = [makeAssessment()];
    const policies = [makePolicy()];
    const training = [makeTraining()];

    const result = generateWaterSafetyLegionellaIntelligence(
      checks,
      assessments,
      policies,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns inadequate rating for all empty data", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      [],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("returns outstanding rating for perfect data", () => {
    const checks = [
      makeCheck({ id: "1", sourceType: "hot_tap" }),
      makeCheck({ id: "2", sourceType: "cold_tap" }),
      makeCheck({ id: "3", sourceType: "bath" }),
      makeCheck({ id: "4", sourceType: "shower" }),
      makeCheck({ id: "5", sourceType: "storage_tank" }),
      makeCheck({ id: "6", sourceType: "calorifier" }),
      makeCheck({ id: "7", sourceType: "dead_leg" }),
      makeCheck({
        id: "8",
        sourceType: "other",
        outcome: "minor_issue",
        withinSafeRange: true,
        correctiveAction: true,
      }),
    ];
    const assessments = [makeAssessment()];
    const policies = [makePolicy()];
    const training = [makeTraining()];

    const result = generateWaterSafetyLegionellaIntelligence(
      checks,
      assessments,
      policies,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );

    // temp=24, legionella=25, policy=25, staff=25 = 99
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("populates regulatory links", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      [],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some((l) => l.includes("Health and Safety at Work Act 1974"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 25"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("L8 Approved Code of Practice"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("HSG274"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("COSHH"))).toBe(true);
  });

  it("generates strengths for good performance", () => {
    const checks = [
      makeCheck({ id: "1" }),
      makeCheck({ id: "2" }),
      makeCheck({ id: "3" }),
    ];
    const assessments = [makeAssessment()];
    const policies = [makePolicy()];
    const training = [makeTraining()];

    const result = generateWaterSafetyLegionellaIntelligence(
      checks,
      assessments,
      policies,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );

    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areasForImprovement for empty data", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      [],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(
      result.areasForImprovement.some((a) =>
        a.includes("No water temperature checks")
      )
    ).toBe(true);
    expect(
      result.areasForImprovement.some((a) =>
        a.includes("No legionella risk assessment")
      )
    ).toBe(true);
  });

  it("generates actions for empty data", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      [],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(result.actions.length).toBeGreaterThan(0);
    expect(
      result.actions.some((a) =>
        a.includes("temperature monitoring programme")
      )
    ).toBe(true);
  });

  it("identifies strength when all staff have legionella awareness", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1" }),
      makeTraining({ id: "2", staffId: "s2" }),
    ];
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      [],
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(
      result.strengths.some((s) => s.includes("legionella awareness"))
    ).toBe(true);
  });

  it("identifies strength when all dead legs managed", () => {
    const assessments = [
      makeAssessment({
        deadLegsIdentified: true,
        deadLegsRemoved: true,
      }),
    ];
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      assessments,
      [],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(
      result.strengths.some((s) => s.includes("dead legs"))
    ).toBe(true);
  });

  it("identifies area for improvement when pass rate is low", () => {
    const checks = [
      makeCheck({ id: "1", outcome: "fail", correctiveAction: false }),
      makeCheck({ id: "2", outcome: "fail", correctiveAction: false }),
      makeCheck({ id: "3", outcome: "pass" }),
    ];
    const result = generateWaterSafetyLegionellaIntelligence(
      checks,
      [],
      [],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(
      result.areasForImprovement.some((a) =>
        a.includes("pass rate is below acceptable")
      )
    ).toBe(true);
  });

  it("generates action for missing corrective actions", () => {
    const checks = [
      makeCheck({
        id: "1",
        outcome: "major_issue",
        correctiveAction: false,
      }),
    ];
    const result = generateWaterSafetyLegionellaIntelligence(
      checks,
      [],
      [],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(
      result.actions.some((a) =>
        a.includes("corrective actions")
      )
    ).toBe(true);
  });

  it("includes location profiles", () => {
    const checks = [
      makeCheck({ id: "1", location: "Kitchen" }),
      makeCheck({ id: "2", location: "Bathroom" }),
    ];
    const assessments = [makeAssessment()];

    const result = generateWaterSafetyLegionellaIntelligence(
      checks,
      assessments,
      [],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );

    expect(result.locationProfiles.length).toBe(2);
  });

  it("applies correct rating thresholds", () => {
    // Build scenarios that target specific score ranges
    // All empty = 0 = inadequate
    const r1 = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      [],
      [],
      "test",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(r1.rating).toBe("inadequate");
  });

  it("uses homeId from parameter", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      [],
      [],
      "elm-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(result.homeId).toBe("elm-house");
  });

  it("uses dates from parameters", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      [],
      [],
      "oak-house",
      "2025-06-01",
      "2025-12-31",
      "2025-12-31"
    );
    expect(result.periodStart).toBe("2025-06-01");
    expect(result.periodEnd).toBe("2025-12-31");
    expect(result.assessedAt).toBe("2025-12-31");
  });

  it("identifies policy strength for comprehensive policies", () => {
    const policies = [makePolicy()];
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      policies,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(
      result.strengths.some((s) =>
        s.includes("policies are comprehensive")
      )
    ).toBe(true);
  });

  it("identifies area for improvement for incomplete policies", () => {
    const policies = [
      makePolicy({
        policyCurrent: true,
        temperatureMonitoringSchedule: false,
        legionellaManagementPlan: false,
        scaldingPreventionMeasures: false,
        bathSupervisionProtocol: false,
        emergencyProcedures: false,
        recordKeepingSystem: false,
      }),
    ];
    const result = generateWaterSafetyLegionellaIntelligence(
      [],
      [],
      policies,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );
    expect(
      result.areasForImprovement.some((a) =>
        a.includes("policies are incomplete")
      )
    ).toBe(true);
  });
});

// ==============================================================================
// Integration: Chamberlain House Demo Scenario
// ==============================================================================

describe("Chamberlain House demo integration", () => {
  const demoChecks: TemperatureCheck[] = [
    makeCheck({
      id: "tc-001",
      sourceType: "hot_tap",
      location: "Kitchen",
      checkDate: "2026-01-15",
      checkedBy: "Sarah Johnson",
      temperatureCelsius: 58,
    }),
    makeCheck({
      id: "tc-002",
      sourceType: "hot_tap",
      location: "Kitchen",
      checkDate: "2026-02-15",
      checkedBy: "Tom Richards",
      temperatureCelsius: 57,
    }),
    makeCheck({
      id: "tc-003",
      sourceType: "cold_tap",
      location: "Kitchen",
      checkDate: "2026-02-15",
      checkedBy: "Lisa Williams",
      temperatureCelsius: 12,
    }),
    makeCheck({
      id: "tc-004",
      sourceType: "bath",
      location: "Main Bathroom",
      checkDate: "2026-01-20",
      temperatureCelsius: 44,
    }),
    makeCheck({
      id: "tc-005",
      sourceType: "shower",
      location: "Main Bathroom",
      checkDate: "2026-01-20",
      temperatureCelsius: 42,
    }),
    makeCheck({
      id: "tc-006",
      sourceType: "storage_tank",
      location: "Loft",
      checkDate: "2026-01-10",
      temperatureCelsius: 62,
    }),
    makeCheck({
      id: "tc-007",
      sourceType: "calorifier",
      location: "Plant Room",
      checkDate: "2026-02-10",
      temperatureCelsius: 63,
    }),
  ];

  const demoAssessments: LegionellaAssessment[] = [
    makeAssessment({
      id: "la-001",
      riskLevel: "low",
      flushingScheduleInPlace: true,
      waterTreatmentActive: true,
      deadLegsIdentified: true,
      deadLegsRemoved: true,
    }),
  ];

  const demoPolicies: WaterSafetyPolicy[] = [makePolicy()];

  const demoTraining: StaffWaterSafetyTraining[] = [
    makeTraining({ id: "wst-001", staffId: "staff-001", staffName: "Sarah Johnson" }),
    makeTraining({ id: "wst-002", staffId: "staff-002", staffName: "Tom Richards" }),
    makeTraining({ id: "wst-003", staffId: "staff-003", staffName: "Lisa Williams" }),
    makeTraining({ id: "wst-004", staffId: "staff-004", staffName: "Darren Laville" }),
  ];

  it("produces a complete intelligence result", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      demoChecks,
      demoAssessments,
      demoPolicies,
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(
      result.rating
    );
  });

  it("scores above 60 for the Chamberlain House demo (good+)", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      demoChecks,
      demoAssessments,
      demoPolicies,
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(60);
  });

  it("includes location profiles for demo data", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      demoChecks,
      demoAssessments,
      demoPolicies,
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );

    expect(result.locationProfiles.length).toBeGreaterThan(0);
    const kitchenProfile = result.locationProfiles.find(
      (p) => p.location === "Kitchen"
    );
    expect(kitchenProfile).toBeDefined();
  });

  it("has regulatory links covering all required legislation", () => {
    const result = generateWaterSafetyLegionellaIntelligence(
      demoChecks,
      demoAssessments,
      demoPolicies,
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19"
    );

    const linkText = result.regulatoryLinks.join(" ");
    expect(linkText).toContain("Health and Safety at Work Act 1974");
    expect(linkText).toContain("CHR 2015");
    expect(linkText).toContain("L8");
    expect(linkText).toContain("HSG274");
    expect(linkText).toContain("SCCIF");
    expect(linkText).toContain("NMS 10");
    expect(linkText).toContain("COSHH");
  });
});

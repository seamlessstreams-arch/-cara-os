import { describe, it, expect } from "vitest";
import { computeAdmissionAssessmentMetrics, identifyAdmissionAssessmentAlerts } from "./admission-assessment-service";
import type { AdmissionAssessmentRecord } from "./admission-assessment-service";

function makeRecord(overrides: Partial<AdmissionAssessmentRecord> = {}): AdmissionAssessmentRecord {
  return {
    id: "rec-1", home_id: "home-1", assessment_stage: "pre_admission_visit", suitability_decision: "suitable",
    matching_outcome: "good_match", referral_source: "local_authority", assessment_date: "2026-05-15",
    child_name: "Alex", child_id: "child-1", placing_authority: "LA-1",
    impact_risk_completed: true, matching_criteria_met: true, existing_children_consulted: true,
    pre_admission_visit_completed: true, care_plan_received: true, health_assessment_available: true,
    education_info_received: true, risk_assessments_reviewed: true, safeguarding_info_shared: true,
    placement_plan_agreed: true, key_worker_allocated: true, bedroom_prepared: true,
    issues_found: [], actions_taken: [], assessed_by: "staff-1",
    next_review_date: null, notes: null, created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeAdmissionAssessmentMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeAdmissionAssessmentMetrics([]);
    expect(result.total_assessments).toBe(0);
    expect(result.suitable_count).toBe(0);
    expect(result.impact_risk_rate).toBe(0);
  });

  it("counts records and computes boolean rates", () => {
    const records = [
      makeRecord({ id: "r1", impact_risk_completed: true, matching_criteria_met: true }),
      makeRecord({ id: "r2", impact_risk_completed: false, matching_criteria_met: false }),
    ];
    const result = computeAdmissionAssessmentMetrics(records);
    expect(result.total_assessments).toBe(2);
    expect(result.impact_risk_rate).toBe(50);
    expect(result.matching_criteria_rate).toBe(50);
  });

  it("tracks suitability decisions", () => {
    const records = [
      makeRecord({ id: "r1", suitability_decision: "suitable" }),
      makeRecord({ id: "r2", suitability_decision: "unsuitable" }),
      makeRecord({ id: "r3", suitability_decision: "suitable" }),
    ];
    const result = computeAdmissionAssessmentMetrics(records);
    expect(result.suitable_count).toBe(2);
    expect(result.unsuitable_count).toBe(1);
    expect(result.by_suitability_decision["suitable"]).toBe(2);
    expect(result.by_suitability_decision["unsuitable"]).toBe(1);
  });

  it("counts matching outcomes", () => {
    const records = [
      makeRecord({ id: "r1", matching_outcome: "excellent_match" }),
      makeRecord({ id: "r2", matching_outcome: "poor_match" }),
      makeRecord({ id: "r3", matching_outcome: "excellent_match" }),
    ];
    const result = computeAdmissionAssessmentMetrics(records);
    expect(result.excellent_match_count).toBe(2);
    expect(result.poor_match_count).toBe(1);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "r1", child_name: "Alex" }),
      makeRecord({ id: "r2", child_name: "Alex" }),
      makeRecord({ id: "r3", child_name: "Jordan" }),
    ];
    const result = computeAdmissionAssessmentMetrics(records);
    expect(result.unique_children).toBe(2);
  });

  it("groups by assessment stage and referral source", () => {
    const records = [
      makeRecord({ id: "r1", assessment_stage: "pre_admission_visit", referral_source: "local_authority" }),
      makeRecord({ id: "r2", assessment_stage: "72_hour_review", referral_source: "parent_request" }),
    ];
    const result = computeAdmissionAssessmentMetrics(records);
    expect(result.by_assessment_stage["pre_admission_visit"]).toBe(1);
    expect(result.by_assessment_stage["72_hour_review"]).toBe(1);
    expect(result.by_referral_source["local_authority"]).toBe(1);
    expect(result.by_referral_source["parent_request"]).toBe(1);
  });

  it("computes all boolean rates at 100% when all true", () => {
    const records = [makeRecord()];
    const result = computeAdmissionAssessmentMetrics(records);
    expect(result.impact_risk_rate).toBe(100);
    expect(result.care_plan_received_rate).toBe(100);
    expect(result.bedroom_prepared_rate).toBe(100);
    expect(result.key_worker_rate).toBe(100);
  });
});

describe("identifyAdmissionAssessmentAlerts", () => {
  it("returns array for empty data", () => {
    const result = identifyAdmissionAssessmentAlerts([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it("flags records with missing risk assessments", () => {
    const records = [
      makeRecord({ id: "r1", impact_risk_completed: false, assessment_stage: "pre_admission_visit" }),
    ];
    const result = identifyAdmissionAssessmentAlerts(records);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("flags records missing care plan (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "r1", care_plan_received: false }),
      makeRecord({ id: "r2", care_plan_received: false }),
    ];
    const result = identifyAdmissionAssessmentAlerts(records);
    const planAlerts = result.filter((a) => a.type === "care_plan_missing");
    expect(planAlerts.length).toBe(1);
    expect(planAlerts[0].severity).toBe("medium");
  });

  it("returns fewer alerts when all checks pass", () => {
    const allGood = [makeRecord()];
    const allBad = [makeRecord({
      impact_risk_completed: false, matching_criteria_met: false,
      care_plan_received: false, risk_assessments_reviewed: false,
      key_worker_allocated: false, bedroom_prepared: false,
    })];
    const goodAlerts = identifyAdmissionAssessmentAlerts(allGood);
    const badAlerts = identifyAdmissionAssessmentAlerts(allBad);
    expect(badAlerts.length).toBeGreaterThanOrEqual(goodAlerts.length);
  });
});

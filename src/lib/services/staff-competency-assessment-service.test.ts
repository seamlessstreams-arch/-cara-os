import { describe, it, expect } from "vitest";
import {
  computeStaffCompetencyMetrics,
  identifyStaffCompetencyAlerts,
} from "./staff-competency-assessment-service";
import type { StaffCompetencyAssessmentRecord } from "./staff-competency-assessment-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffCompetencyAssessmentRecord> = {}): StaffCompetencyAssessmentRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    competency_area: "safeguarding_knowledge",
    assessment_method: "direct_observation",
    competency_rating: "meets_expectations",
    action_required: "none",
    assessment_date: "2026-05-10",
    staff_name: "Emma Wilson",
    staff_role: "Residential Worker",
    assessor_name: "Team Leader",
    theory_demonstrated: true,
    practical_demonstrated: true,
    reflective_practice_shown: true,
    values_aligned: true,
    child_centred_approach: true,
    evidence_documented: true,
    development_plan_updated: true,
    staff_agreed_outcome: true,
    follow_up_date_set: true,
    competency_maintained: true,
    issues_found: [],
    actions_taken: [],
    next_assessment_date: null,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffCompetencyMetrics ---------------------------------------------

describe("computeStaffCompetencyMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeStaffCompetencyMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.exceeds_count).toBe(0);
    expect(m.meets_count).toBe(0);
    expect(m.developing_count).toBe(0);
    expect(m.below_count).toBe(0);
    expect(m.not_competent_count).toBe(0);
    expect(m.competency_maintained_rate).toBeNull();;
    expect(m.theory_demonstrated_rate).toBeNull();;
    expect(m.action_required_count).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("counts rating categories correctly", () => {
    const records = [
      makeRecord({ id: "1", competency_rating: "exceeds_expectations" }),
      makeRecord({ id: "2", competency_rating: "meets_expectations" }),
      makeRecord({ id: "3", competency_rating: "developing" }),
      makeRecord({ id: "4", competency_rating: "below_expectations" }),
      makeRecord({ id: "5", competency_rating: "not_yet_competent" }),
    ];
    const m = computeStaffCompetencyMetrics(records);
    expect(m.exceeds_count).toBe(1);
    expect(m.meets_count).toBe(1);
    expect(m.developing_count).toBe(1);
    expect(m.below_count).toBe(1);
    expect(m.not_competent_count).toBe(1);
  });

  it("counts action_required_count (excludes none)", () => {
    const records = [
      makeRecord({ id: "1", action_required: "none" }),
      makeRecord({ id: "2", action_required: "additional_training" }),
      makeRecord({ id: "3", action_required: "reassessment" }),
    ];
    const m = computeStaffCompetencyMetrics(records);
    expect(m.action_required_count).toBe(2);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", theory_demonstrated: true, evidence_documented: true }),
      makeRecord({ id: "2", theory_demonstrated: false, evidence_documented: false }),
    ];
    const m = computeStaffCompetencyMetrics(records);
    expect(m.theory_demonstrated_rate).toBe(50);
    expect(m.evidence_documented_rate).toBe(50);
  });

  it("builds breakdown records by area and method", () => {
    const records = [
      makeRecord({ id: "1", competency_area: "medication_administration", assessment_method: "direct_observation" }),
      makeRecord({ id: "2", competency_area: "medication_administration", assessment_method: "knowledge_test" }),
      makeRecord({ id: "3", competency_area: "first_aid", assessment_method: "direct_observation" }),
    ];
    const m = computeStaffCompetencyMetrics(records);
    expect(m.by_competency_area).toEqual({ medication_administration: 2, first_aid: 1 });
    expect(m.by_assessment_method).toEqual({ direct_observation: 2, knowledge_test: 1 });
  });
});

// -- identifyStaffCompetencyAlerts ---------------------------------------------

describe("identifyStaffCompetencyAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifyStaffCompetencyAlerts([])).toEqual([]);
  });

  it("returns empty array for safe records", () => {
    expect(identifyStaffCompetencyAlerts([makeRecord()])).toEqual([]);
  });

  it("fires critical alert for medication_administration + not_yet_competent", () => {
    const records = [
      makeRecord({ competency_area: "medication_administration", competency_rating: "not_yet_competent" }),
    ];
    const alerts = identifyStaffCompetencyAlerts(records);
    const match = alerts.find((a) => a.type === "medication_not_competent");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("does NOT fire medication_not_competent for other areas", () => {
    const records = [
      makeRecord({ competency_area: "first_aid", competency_rating: "not_yet_competent" }),
    ];
    const alerts = identifyStaffCompetencyAlerts(records);
    const match = alerts.find((a) => a.type === "medication_not_competent");
    expect(match).toBeUndefined();
  });

  it("fires high alert for below_expectations (threshold >= 1)", () => {
    const records = [makeRecord({ competency_rating: "below_expectations" })];
    const alerts = identifyStaffCompetencyAlerts(records);
    const match = alerts.find((a) => a.type === "below_expectations");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for evidence_not_documented (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "1", evidence_documented: false }),
      makeRecord({ id: "2", evidence_documented: false }),
    ];
    const alerts = identifyStaffCompetencyAlerts(records);
    const match = alerts.find((a) => a.type === "evidence_not_documented");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("does NOT fire evidence_not_documented with only 1 record", () => {
    const records = [makeRecord({ evidence_documented: false })];
    const alerts = identifyStaffCompetencyAlerts(records);
    const match = alerts.find((a) => a.type === "evidence_not_documented");
    expect(match).toBeUndefined();
  });

  it("fires medium alert for development_plan_not_updated (threshold >= 3)", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `r${i}`, development_plan_updated: false }),
    );
    const alerts = identifyStaffCompetencyAlerts(records);
    const match = alerts.find((a) => a.type === "development_plan_not_updated");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires medium alert for staff_not_agreed (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "1", staff_agreed_outcome: false }),
      makeRecord({ id: "2", staff_agreed_outcome: false }),
    ];
    const alerts = identifyStaffCompetencyAlerts(records);
    const match = alerts.find((a) => a.type === "staff_not_agreed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

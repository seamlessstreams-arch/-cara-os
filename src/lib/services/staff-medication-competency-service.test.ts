import { describe, it, expect } from "vitest";
import {
  computeStaffMedicationCompetencyMetrics,
  identifyStaffMedicationCompetencyAlerts,
} from "./staff-medication-competency-service";
import type { StaffMedicationCompetencyRecord } from "./staff-medication-competency-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffMedicationCompetencyRecord> = {}): StaffMedicationCompetencyRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    competency_type: "initial_assessment",
    assessment_outcome: "competent",
    medication_category: "oral_medication",
    training_provider: "in_house_trainer",
    assessment_date: "2026-04-01",
    staff_name: "Alice Smith",
    assessed_by: "Senior Nurse",
    theory_passed: true,
    practical_observed: true,
    error_procedure_known: true,
    storage_knowledge: true,
    controlled_drug_trained: true,
    side_effects_knowledge: true,
    consent_understanding: true,
    record_keeping_competent: true,
    emergency_response_trained: true,
    disposal_knowledge: true,
    child_specific_trained: true,
    refresher_scheduled: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffMedicationCompetencyMetrics ----------------------------------

describe("computeStaffMedicationCompetencyMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeStaffMedicationCompetencyMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.competent_count).toBe(0);
    expect(m.not_yet_competent_count).toBe(0);
    expect(m.requires_retraining_count).toBe(0);
    expect(m.suspended_count).toBe(0);
    expect(m.theory_passed_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts assessment outcomes correctly", () => {
    const records = [
      makeRecord({ id: "1", assessment_outcome: "competent" }),
      makeRecord({ id: "2", assessment_outcome: "not_yet_competent" }),
      makeRecord({ id: "3", assessment_outcome: "requires_retraining" }),
      makeRecord({ id: "4", assessment_outcome: "suspended" }),
      makeRecord({ id: "5", assessment_outcome: "competent_with_conditions" }),
    ];
    const m = computeStaffMedicationCompetencyMetrics(records);
    expect(m.total_assessments).toBe(5);
    expect(m.competent_count).toBe(1);
    expect(m.not_yet_competent_count).toBe(1);
    expect(m.requires_retraining_count).toBe(1);
    expect(m.suspended_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", theory_passed: true, practical_observed: true }),
      makeRecord({ id: "2", theory_passed: false, practical_observed: false }),
    ];
    const m = computeStaffMedicationCompetencyMetrics(records);
    expect(m.theory_passed_rate).toBe(50);
    expect(m.practical_observed_rate).toBe(50);
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Bob" }),
      makeRecord({ id: "3", staff_name: "Alice" }),
    ];
    const m = computeStaffMedicationCompetencyMetrics(records);
    expect(m.unique_staff).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", competency_type: "initial_assessment", medication_category: "controlled_drugs", training_provider: "pharmacy" }),
      makeRecord({ id: "2", competency_type: "annual_review", medication_category: "controlled_drugs", training_provider: "pharmacy" }),
      makeRecord({ id: "3", competency_type: "initial_assessment", medication_category: "oral_medication", training_provider: "in_house_trainer" }),
    ];
    const m = computeStaffMedicationCompetencyMetrics(records);
    expect(m.by_competency_type).toEqual({ initial_assessment: 2, annual_review: 1 });
    expect(m.by_medication_category).toEqual({ controlled_drugs: 2, oral_medication: 1 });
    expect(m.by_training_provider).toEqual({ pharmacy: 2, in_house_trainer: 1 });
  });

  it("returns 100% rates when all booleans true", () => {
    const records = [makeRecord({ id: "1" }), makeRecord({ id: "2" })];
    const m = computeStaffMedicationCompetencyMetrics(records);
    expect(m.error_procedure_rate).toBe(100);
    expect(m.storage_knowledge_rate).toBe(100);
    expect(m.controlled_drug_rate).toBe(100);
    expect(m.side_effects_rate).toBe(100);
    expect(m.consent_understanding_rate).toBe(100);
    expect(m.record_keeping_rate).toBe(100);
    expect(m.emergency_response_rate).toBe(100);
    expect(m.disposal_knowledge_rate).toBe(100);
    expect(m.child_specific_rate).toBe(100);
    expect(m.refresher_scheduled_rate).toBe(100);
  });
});

// -- identifyStaffMedicationCompetencyAlerts ----------------------------------

describe("identifyStaffMedicationCompetencyAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifyStaffMedicationCompetencyAlerts([])).toEqual([]);
  });

  it("returns no alerts for fully competent records", () => {
    const alerts = identifyStaffMedicationCompetencyAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical alert for suspended staff on controlled drugs", () => {
    const records = [
      makeRecord({ id: "r1", assessment_outcome: "suspended", medication_category: "controlled_drugs", staff_name: "Alice" }),
    ];
    const alerts = identifyStaffMedicationCompetencyAlerts(records);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe("suspended_controlled_drugs");
  });

  it("does NOT fire critical for suspended on non-controlled drugs", () => {
    const records = [
      makeRecord({ id: "r1", assessment_outcome: "suspended", medication_category: "oral_medication" }),
    ];
    const alerts = identifyStaffMedicationCompetencyAlerts(records);
    const critical = alerts.filter((a) => a.type === "suspended_controlled_drugs");
    expect(critical.length).toBe(0);
  });

  it("fires high alert when any staff not competent (>= 1)", () => {
    const records = [
      makeRecord({ id: "r1", assessment_outcome: "not_yet_competent" }),
    ];
    const alerts = identifyStaffMedicationCompetencyAlerts(records);
    const match = alerts.filter((a) => a.type === "not_competent");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires high alert for practical not observed (>= 1)", () => {
    const records = [
      makeRecord({ id: "r1", practical_observed: false }),
    ];
    const alerts = identifyStaffMedicationCompetencyAlerts(records);
    const match = alerts.filter((a) => a.type === "practical_not_observed");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires medium alert for no refresher only when >= 2", () => {
    const one = [makeRecord({ id: "r1", refresher_scheduled: false })];
    expect(identifyStaffMedicationCompetencyAlerts(one).filter((a) => a.type === "no_refresher_scheduled").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", refresher_scheduled: false }),
      makeRecord({ id: "r2", refresher_scheduled: false }),
    ];
    const alerts = identifyStaffMedicationCompetencyAlerts(two);
    const match = alerts.filter((a) => a.type === "no_refresher_scheduled");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("fires medium alert for error procedure unknown only when >= 2", () => {
    const one = [makeRecord({ id: "r1", error_procedure_known: false })];
    expect(identifyStaffMedicationCompetencyAlerts(one).filter((a) => a.type === "error_procedure_unknown").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", error_procedure_known: false }),
      makeRecord({ id: "r2", error_procedure_known: false }),
    ];
    const alerts = identifyStaffMedicationCompetencyAlerts(two);
    const match = alerts.filter((a) => a.type === "error_procedure_unknown");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });
});

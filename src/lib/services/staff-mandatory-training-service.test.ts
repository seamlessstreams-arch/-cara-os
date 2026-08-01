import { describe, it, expect } from "vitest";
import {
  computeMandatoryTrainingMetrics,
  identifyMandatoryTrainingAlerts,
} from "./staff-mandatory-training-service";
import type { StaffMandatoryTrainingRecord } from "./staff-mandatory-training-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffMandatoryTrainingRecord> = {}): StaffMandatoryTrainingRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    staff_name: "Alice Smith",
    staff_id: null,
    training_category: "safeguarding_level_3",
    compliance_status: "current",
    training_level: "intermediate",
    delivery_method: "classroom",
    session_date: "2026-04-01",
    recorded_by: "Manager A",
    training_title: "Safeguarding Level 3",
    provider_name: "Provider X",
    completion_date: "2026-04-01",
    expiry_date: "2027-04-01",
    certificate_reference: "CERT-001",
    cost: "150",
    staff_feedback: null,
    competence_assessment: null,
    refresher_due: null,
    manager_notes: null,
    approved_by: null,
    approved_at: null,
    certificate_held: true,
    competence_assessed: true,
    staff_attended: true,
    learning_objectives_met: true,
    applied_in_practice: true,
    refresher_scheduled: true,
    manager_verified: true,
    cost_approved: true,
    linked_to_development_plan: true,
    accessible_format: true,
    evaluation_completed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMandatoryTrainingMetrics ------------------------------------------

describe("computeMandatoryTrainingMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMandatoryTrainingMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.expiring_soon_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.current_count).toBe(0);
    expect(m.certificate_held_rate).toBeNull();;
    expect(m.competence_assessed_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts compliance statuses correctly", () => {
    const records = [
      makeRecord({ id: "1", compliance_status: "current" }),
      makeRecord({ id: "2", compliance_status: "expired" }),
      makeRecord({ id: "3", compliance_status: "expiring_soon" }),
      makeRecord({ id: "4", compliance_status: "not_started" }),
      makeRecord({ id: "5", compliance_status: "booked" }),
    ];
    const m = computeMandatoryTrainingMetrics(records);
    expect(m.total_records).toBe(5);
    expect(m.current_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.expiring_soon_count).toBe(1);
    expect(m.not_started_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", certificate_held: true, competence_assessed: true }),
      makeRecord({ id: "2", certificate_held: false, competence_assessed: false }),
    ];
    const m = computeMandatoryTrainingMetrics(records);
    expect(m.certificate_held_rate).toBe(50);
    expect(m.competence_assessed_rate).toBe(50);
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Bob" }),
      makeRecord({ id: "3", staff_name: "Alice" }),
    ];
    const m = computeMandatoryTrainingMetrics(records);
    expect(m.unique_staff).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", training_category: "first_aid", delivery_method: "e_learning", training_level: "foundation" }),
      makeRecord({ id: "2", training_category: "first_aid", delivery_method: "classroom", training_level: "advanced" }),
      makeRecord({ id: "3", training_category: "fire_safety", delivery_method: "classroom", training_level: "foundation" }),
    ];
    const m = computeMandatoryTrainingMetrics(records);
    expect(m.by_training_category).toEqual({ first_aid: 2, fire_safety: 1 });
    expect(m.by_delivery_method).toEqual({ e_learning: 1, classroom: 2 });
    expect(m.by_training_level).toEqual({ foundation: 2, advanced: 1 });
  });

  it("handles all-true boolean fields at 100%", () => {
    const records = [makeRecord({ id: "1" }), makeRecord({ id: "2" })];
    const m = computeMandatoryTrainingMetrics(records);
    expect(m.staff_attended_rate).toBe(100);
    expect(m.learning_objectives_rate).toBe(100);
    expect(m.applied_in_practice_rate).toBe(100);
    expect(m.refresher_scheduled_rate).toBe(100);
    expect(m.manager_verified_rate).toBe(100);
    expect(m.cost_approved_rate).toBe(100);
    expect(m.development_plan_rate).toBe(100);
    expect(m.accessible_format_rate).toBe(100);
    expect(m.evaluation_completed_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });
});

// -- identifyMandatoryTrainingAlerts ------------------------------------------

describe("identifyMandatoryTrainingAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifyMandatoryTrainingAlerts([])).toEqual([]);
  });

  it("returns no alerts for fully compliant records", () => {
    const records = [makeRecord()];
    const alerts = identifyMandatoryTrainingAlerts(records);
    // All booleans true, status current => no expired, competence assessed,
    // refresher scheduled, evaluation completed
    // But competence_assessed=true means no "no_competence_assessed" alert
    // refresher_scheduled=true means no "no_refresher_scheduled"
    // evaluation_completed=true means no "no_evaluation"
    // compliance_status=current means no "expired_training" or "expired_critical_training"
    expect(alerts).toEqual([]);
  });

  it("fires critical alert for expired safeguarding", () => {
    const records = [
      makeRecord({ id: "r1", compliance_status: "expired", training_category: "safeguarding_level_3", staff_name: "Alice" }),
    ];
    const alerts = identifyMandatoryTrainingAlerts(records);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe("expired_critical_training");
    expect(critical[0].record_id).toBe("r1");
  });

  it("fires critical alert for expired first_aid and physical_intervention", () => {
    const records = [
      makeRecord({ id: "r1", compliance_status: "expired", training_category: "first_aid" }),
      makeRecord({ id: "r2", compliance_status: "expired", training_category: "physical_intervention" }),
    ];
    const alerts = identifyMandatoryTrainingAlerts(records);
    const critical = alerts.filter((a) => a.type === "expired_critical_training");
    expect(critical.length).toBe(2);
  });

  it("fires high alert when any training is expired (>= 1)", () => {
    const records = [
      makeRecord({ id: "r1", compliance_status: "expired", training_category: "data_protection" }),
    ];
    const alerts = identifyMandatoryTrainingAlerts(records);
    const high = alerts.filter((a) => a.type === "expired_training");
    expect(high.length).toBe(1);
    expect(high[0].severity).toBe("high");
  });

  it("fires high alert when competence not assessed (>= 1)", () => {
    const records = [
      makeRecord({ id: "r1", competence_assessed: false }),
    ];
    const alerts = identifyMandatoryTrainingAlerts(records);
    const match = alerts.filter((a) => a.type === "no_competence_assessed");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires medium alert for no refresher scheduled only when >= 2", () => {
    const one = [makeRecord({ id: "r1", refresher_scheduled: false })];
    expect(identifyMandatoryTrainingAlerts(one).filter((a) => a.type === "no_refresher_scheduled").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", refresher_scheduled: false }),
      makeRecord({ id: "r2", refresher_scheduled: false }),
    ];
    const alerts = identifyMandatoryTrainingAlerts(two);
    const match = alerts.filter((a) => a.type === "no_refresher_scheduled");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("fires medium alert for no evaluation only when >= 2", () => {
    const one = [makeRecord({ id: "r1", evaluation_completed: false })];
    expect(identifyMandatoryTrainingAlerts(one).filter((a) => a.type === "no_evaluation").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", evaluation_completed: false }),
      makeRecord({ id: "r2", evaluation_completed: false }),
    ];
    const alerts = identifyMandatoryTrainingAlerts(two);
    const match = alerts.filter((a) => a.type === "no_evaluation");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });
});

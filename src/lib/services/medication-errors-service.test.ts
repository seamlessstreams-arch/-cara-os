import { describe, it, expect } from "vitest";
import {
  computeMedErrorMetrics,
  identifyMedErrorAlerts,
  type MedicationError,
} from "./medication-errors-service";

function makeError(overrides: Partial<MedicationError> = {}): MedicationError {
  return {
    id: "err-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    error_date: "2026-05-01",
    error_time: "08:00",
    error_type: "wrong_dose",
    error_severity: "no_harm",
    medication_name: "Paracetamol",
    reported_by: "Staff A",
    root_cause: "human_error",
    investigation_status: "closed",
    corrective_actions: ["Retrain staff"],
    actions_completed: true,
    child_harmed: false,
    medical_attention_required: false,
    parent_informed: true,
    social_worker_informed: true,
    ofsted_notified: false,
    duty_of_candour_applied: true,
    staff_involved: "Nurse B",
    lessons_learned: "Double-check dosage",
    policy_reviewed: true,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMedErrorMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMedErrorMetrics([]);
    expect(m.total_errors).toBe(0);
    expect(m.near_miss_count).toBe(0);
    expect(m.actual_error_count).toBe(0);
    expect(m.no_harm_count).toBe(0);
    expect(m.harm_caused_count).toBe(0);
    expect(m.severe_harm_count).toBe(0);
    expect(m.parent_informed_rate).toBeNull();;
    expect(m.duty_of_candour_rate).toBeNull();;
  });

  it("computes correct counts for populated data", () => {
    const errors = [
      makeError({ id: "e1", error_type: "near_miss", error_severity: "no_harm" }),
      makeError({ id: "e2", error_type: "wrong_dose", error_severity: "low_harm", child_harmed: true, medical_attention_required: true }),
      makeError({ id: "e3", error_type: "wrong_medication", error_severity: "severe_harm", child_harmed: true }),
      makeError({ id: "e4", error_severity: "death", investigation_status: "reported", parent_informed: false }),
    ];
    const m = computeMedErrorMetrics(errors);
    expect(m.total_errors).toBe(4);
    expect(m.near_miss_count).toBe(1);
    expect(m.actual_error_count).toBe(3);
    expect(m.no_harm_count).toBe(1);
    expect(m.harm_caused_count).toBe(3);
    expect(m.severe_harm_count).toBe(2); // severe_harm + death
    expect(m.child_harmed_count).toBe(2);
    expect(m.medical_attention_count).toBe(1);
    expect(m.open_investigations).toBe(1); // reported
    // parent_informed: 3 out of 4 = 75%
    expect(m.parent_informed_rate).toBe(75);
  });

  it("computes actions_outstanding correctly", () => {
    const errors = [
      makeError({ investigation_status: "actions_identified", actions_completed: false }),
      makeError({ id: "e2", investigation_status: "actions_identified", actions_completed: true }),
    ];
    const m = computeMedErrorMetrics(errors);
    expect(m.actions_outstanding).toBe(1);
  });

  it("builds breakdowns by_error_type and by_root_cause", () => {
    const errors = [
      makeError({ error_type: "wrong_dose", root_cause: "human_error" }),
      makeError({ id: "e2", error_type: "wrong_dose", root_cause: "training_gap" }),
      makeError({ id: "e3", error_type: "omission", root_cause: "training_gap" }),
    ];
    const m = computeMedErrorMetrics(errors);
    expect(m.by_error_type).toEqual({ wrong_dose: 2, omission: 1 });
    expect(m.by_root_cause).toEqual({ human_error: 1, training_gap: 2 });
  });
});

describe("identifyMedErrorAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyMedErrorAlerts([])).toEqual([]);
  });

  it("returns empty array when no alert conditions are met", () => {
    const errors = [makeError()];
    expect(identifyMedErrorAlerts(errors)).toEqual([]);
  });

  it("fires critical alert for severe_error (severe_harm or death)", () => {
    const errors = [makeError({ error_severity: "severe_harm" })];
    const alerts = identifyMedErrorAlerts(errors);
    const match = alerts.find((a) => a.type === "severe_error");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for parent_not_informed when child_harmed and parent not informed", () => {
    const errors = [makeError({ child_harmed: true, parent_informed: false })];
    const alerts = identifyMedErrorAlerts(errors);
    const match = alerts.find((a) => a.type === "parent_not_informed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for actions_outstanding", () => {
    const errors = [makeError({ investigation_status: "actions_identified", actions_completed: false })];
    const alerts = identifyMedErrorAlerts(errors);
    const match = alerts.find((a) => a.type === "actions_outstanding");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for training_gap_pattern when >= 2", () => {
    const errors = [
      makeError({ id: "e1", root_cause: "training_gap" }),
      makeError({ id: "e2", root_cause: "training_gap" }),
    ];
    const alerts = identifyMedErrorAlerts(errors);
    const match = alerts.find((a) => a.type === "training_gap_pattern");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("does not fire training_gap_pattern when only 1", () => {
    const errors = [makeError({ root_cause: "training_gap" })];
    const alerts = identifyMedErrorAlerts(errors);
    expect(alerts.find((a) => a.type === "training_gap_pattern")).toBeUndefined();
  });

  it("fires medium alert for not_investigated", () => {
    const errors = [makeError({ investigation_status: "reported" })];
    const alerts = identifyMedErrorAlerts(errors);
    const match = alerts.find((a) => a.type === "not_investigated");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

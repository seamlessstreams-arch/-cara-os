import { describe, it, expect } from "vitest";
import {
  computeMedicationSideEffectsMetrics,
  identifyMedicationSideEffectsAlerts,
  type MedicationSideEffectsRecord,
} from "./medication-side-effects-service";

function makeRecord(overrides: Partial<MedicationSideEffectsRecord> = {}): MedicationSideEffectsRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    side_effect_type: "drowsiness",
    severity: "mild",
    gp_response: "no_change_needed",
    medication_category: "antidepressant",
    reported_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    reported_by: "Staff A",
    child_informed: true,
    parent_informed: true,
    social_worker_informed: true,
    gp_contacted_promptly: true,
    pharmacy_consulted: true,
    medication_review_requested: true,
    daily_functioning_assessed: true,
    wellbeing_monitored: true,
    care_plan_updated: true,
    yellow_card_considered: false,
    staff_aware: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMedicationSideEffectsMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMedicationSideEffectsMetrics([]);
    expect(m.total_reports).toBe(0);
    expect(m.severe_count).toBe(0);
    expect(m.life_threatening_count).toBe(0);
    expect(m.gp_not_contacted_count).toBe(0);
    expect(m.awaiting_review_count).toBe(0);
    expect(m.child_informed_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "r1", severity: "severe", gp_response: "gp_not_contacted", child_name: "A" }),
      makeRecord({ id: "r2", severity: "life_threatening", gp_response: "awaiting_review", child_name: "B" }),
      makeRecord({ id: "r3", severity: "mild", child_name: "A", child_informed: false }),
    ];
    const m = computeMedicationSideEffectsMetrics(records);
    expect(m.total_reports).toBe(3);
    expect(m.severe_count).toBe(1);
    expect(m.life_threatening_count).toBe(1);
    expect(m.gp_not_contacted_count).toBe(1);
    expect(m.awaiting_review_count).toBe(1);
    expect(m.unique_children).toBe(2);
    // child_informed: 2/3 = 66.7
    expect(m.child_informed_rate).toBe(66.7);
  });

  it("builds breakdowns", () => {
    const records = [
      makeRecord({ side_effect_type: "drowsiness" }),
      makeRecord({ id: "r2", side_effect_type: "drowsiness" }),
      makeRecord({ id: "r3", side_effect_type: "nausea" }),
    ];
    const m = computeMedicationSideEffectsMetrics(records);
    expect(m.by_side_effect_type).toEqual({ drowsiness: 2, nausea: 1 });
  });
});

describe("identifyMedicationSideEffectsAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyMedicationSideEffectsAlerts([])).toEqual([]);
  });

  it("returns empty array when no alert conditions are met", () => {
    const records = [makeRecord()];
    expect(identifyMedicationSideEffectsAlerts(records)).toEqual([]);
  });

  it("fires critical alert for severe_no_gp_contact (severe without prompt GP contact)", () => {
    const records = [makeRecord({ severity: "severe", gp_contacted_promptly: false })];
    const alerts = identifyMedicationSideEffectsAlerts(records);
    const match = alerts.find((a) => a.type === "severe_no_gp_contact");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for life_threatening without GP contact", () => {
    const records = [makeRecord({ severity: "life_threatening", gp_contacted_promptly: false })];
    const alerts = identifyMedicationSideEffectsAlerts(records);
    const match = alerts.find((a) => a.type === "severe_no_gp_contact");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for gp_not_contacted when >= 1", () => {
    const records = [makeRecord({ gp_response: "gp_not_contacted" })];
    const alerts = identifyMedicationSideEffectsAlerts(records);
    const match = alerts.find((a) => a.type === "gp_not_contacted");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for no_medication_review when >= 1", () => {
    const records = [makeRecord({ medication_review_requested: false })];
    const alerts = identifyMedicationSideEffectsAlerts(records);
    const match = alerts.find((a) => a.type === "no_medication_review");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for wellbeing_not_monitored when >= 2", () => {
    // Only 1 — should NOT trigger
    expect(
      identifyMedicationSideEffectsAlerts([makeRecord({ wellbeing_monitored: false })])
        .find((a) => a.type === "wellbeing_not_monitored"),
    ).toBeUndefined();
    // 2 — should trigger
    const records = [
      makeRecord({ id: "r1", wellbeing_monitored: false }),
      makeRecord({ id: "r2", wellbeing_monitored: false }),
    ];
    const alerts = identifyMedicationSideEffectsAlerts(records);
    const match = alerts.find((a) => a.type === "wellbeing_not_monitored");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires medium alert for functioning_not_assessed when >= 2", () => {
    const records = [
      makeRecord({ id: "r1", daily_functioning_assessed: false }),
      makeRecord({ id: "r2", daily_functioning_assessed: false }),
    ];
    const alerts = identifyMedicationSideEffectsAlerts(records);
    const match = alerts.find((a) => a.type === "functioning_not_assessed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

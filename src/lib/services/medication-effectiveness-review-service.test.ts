import { describe, it, expect } from "vitest";
import {
  computeMedicationEffectivenessMetrics,
  identifyMedicationEffectivenessAlerts,
  type MedicationEffectivenessReviewRecord,
} from "./medication-effectiveness-review-service";

function makeRecord(overrides: Partial<MedicationEffectivenessReviewRecord> = {}): MedicationEffectivenessReviewRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    medication_category: "antidepressant",
    effectiveness_rating: "effective",
    adherence_level: "full_adherence",
    review_compliance: "fully_compliant",
    review_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    reviewed_by: "Staff A",
    child_views_sought: true,
    side_effects_monitored: true,
    prescriber_consulted: true,
    gp_informed: true,
    dosage_appropriate: true,
    consent_current: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    school_aware: true,
    storage_compliant: true,
    administration_correct: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: "2026-06-01",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMedicationEffectivenessMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMedicationEffectivenessMetrics([]);
    expect(m.total_reviews).toBe(0);
    expect(m.ineffective_count).toBe(0);
    expect(m.adverse_effects_count).toBe(0);
    expect(m.non_adherent_count).toBe(0);
    expect(m.overdue_review_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "r1", effectiveness_rating: "ineffective", adherence_level: "non_adherent", review_compliance: "significantly_overdue", child_name: "A" }),
      makeRecord({ id: "r2", effectiveness_rating: "adverse_effects", child_name: "B", side_effects_monitored: false, consent_current: false }),
      makeRecord({ id: "r3", effectiveness_rating: "effective", child_name: "A", storage_compliant: false, administration_correct: false }),
    ];
    const m = computeMedicationEffectivenessMetrics(records);
    expect(m.total_reviews).toBe(3);
    expect(m.ineffective_count).toBe(1);
    expect(m.adverse_effects_count).toBe(1);
    expect(m.non_adherent_count).toBe(1);
    expect(m.overdue_review_count).toBe(1);
    expect(m.unique_children).toBe(2);
    // side_effects_monitored: 2 out of 3 = 66.7
    expect(m.side_effects_rate).toBe(66.7);
  });

  it("builds by_medication_category breakdown", () => {
    const records = [
      makeRecord({ medication_category: "antidepressant" }),
      makeRecord({ id: "r2", medication_category: "antidepressant" }),
      makeRecord({ id: "r3", medication_category: "stimulant" }),
    ];
    const m = computeMedicationEffectivenessMetrics(records);
    expect(m.by_medication_category).toEqual({ antidepressant: 2, stimulant: 1 });
  });
});

describe("identifyMedicationEffectivenessAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyMedicationEffectivenessAlerts([])).toEqual([]);
  });

  it("returns empty array when no alert conditions are met", () => {
    const records = [makeRecord()];
    expect(identifyMedicationEffectivenessAlerts(records)).toEqual([]);
  });

  it("fires critical alert for adverse_no_prescriber", () => {
    const records = [
      makeRecord({ effectiveness_rating: "adverse_effects", prescriber_consulted: false }),
    ];
    const alerts = identifyMedicationEffectivenessAlerts(records);
    const match = alerts.find((a) => a.type === "adverse_no_prescriber");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for side_effects_not_monitored when >= 1", () => {
    const records = [makeRecord({ side_effects_monitored: false })];
    const alerts = identifyMedicationEffectivenessAlerts(records);
    const match = alerts.find((a) => a.type === "side_effects_not_monitored");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for consent_not_current when >= 1", () => {
    const records = [makeRecord({ consent_current: false })];
    const alerts = identifyMedicationEffectivenessAlerts(records);
    const match = alerts.find((a) => a.type === "consent_not_current");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for storage_not_compliant when >= 2", () => {
    // Only 1 — should NOT trigger
    expect(
      identifyMedicationEffectivenessAlerts([makeRecord({ storage_compliant: false })])
        .find((a) => a.type === "storage_not_compliant"),
    ).toBeUndefined();
    // 2 — should trigger
    const records = [
      makeRecord({ id: "r1", storage_compliant: false }),
      makeRecord({ id: "r2", storage_compliant: false }),
    ];
    const alerts = identifyMedicationEffectivenessAlerts(records);
    const match = alerts.find((a) => a.type === "storage_not_compliant");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires medium alert for administration_issues when >= 2", () => {
    const records = [
      makeRecord({ id: "r1", administration_correct: false }),
      makeRecord({ id: "r2", administration_correct: false }),
    ];
    const alerts = identifyMedicationEffectivenessAlerts(records);
    const match = alerts.find((a) => a.type === "administration_issues");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

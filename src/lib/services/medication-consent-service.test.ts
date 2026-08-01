import { describe, it, expect } from "vitest";
import {
  computeMedicationConsentMetrics,
  identifyMedicationConsentAlerts,
  type MedicationConsentRecord,
} from "./medication-consent-service";

function makeRecord(overrides: Partial<MedicationConsentRecord> = {}): MedicationConsentRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    consent_type: "parental_consent",
    consent_status: "active",
    medication_type: "prescribed_regular",
    consent_given_by: "parent_mother",
    consent_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    medication_name: "Ibuprofen",
    consent_documented: true,
    capacity_assessed: true,
    child_informed: true,
    side_effects_explained: true,
    alternatives_discussed: true,
    review_date_set: true,
    social_worker_notified: true,
    gp_consulted: true,
    restrictions_noted: false,
    self_admin_assessed: false,
    storage_confirmed: true,
    disposal_arranged: false,
    issues_found: [],
    actions_taken: [],
    recorded_by: "Staff A",
    review_date: "2026-06-01",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMedicationConsentMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMedicationConsentMetrics([]);
    expect(m.total_consents).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.withdrawn_count).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.consent_documented_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "r1", consent_status: "active", child_name: "A", consent_documented: true, child_informed: true, side_effects_explained: true, review_date_set: true }),
      makeRecord({ id: "r2", consent_status: "expired", child_name: "B", consent_documented: false, child_informed: false, side_effects_explained: false, review_date_set: false }),
      makeRecord({ id: "r3", consent_status: "withdrawn", child_name: "A", consent_documented: true, child_informed: true, side_effects_explained: true, review_date_set: true }),
      makeRecord({ id: "r4", consent_status: "refused", child_name: "C", consent_documented: true, child_informed: false, side_effects_explained: false, review_date_set: false }),
    ];
    const m = computeMedicationConsentMetrics(records);
    expect(m.total_consents).toBe(4);
    expect(m.active_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.withdrawn_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.unique_children).toBe(3);
    // consent_documented: 3 out of 4 = 75%
    expect(m.consent_documented_rate).toBe(75);
    // child_informed: 2 out of 4 = 50%
    expect(m.child_informed_rate).toBe(50);
  });

  it("computes breakdowns by consent_type and medication_type", () => {
    const records = [
      makeRecord({ consent_type: "parental_consent", medication_type: "controlled_drug" }),
      makeRecord({ id: "r2", consent_type: "parental_consent", medication_type: "controlled_drug" }),
      makeRecord({ id: "r3", consent_type: "gillick_competence", medication_type: "prescribed_regular" }),
    ];
    const m = computeMedicationConsentMetrics(records);
    expect(m.by_consent_type).toEqual({ parental_consent: 2, gillick_competence: 1 });
    expect(m.by_medication_type).toEqual({ controlled_drug: 2, prescribed_regular: 1 });
  });
});

describe("identifyMedicationConsentAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyMedicationConsentAlerts([])).toEqual([]);
  });

  it("returns empty array when no alert conditions are met", () => {
    const records = [makeRecord()];
    expect(identifyMedicationConsentAlerts(records)).toEqual([]);
  });

  it("fires critical alert for controlled_drug_no_consent", () => {
    const records = [
      makeRecord({ medication_type: "controlled_drug", consent_documented: false }),
    ];
    const alerts = identifyMedicationConsentAlerts(records);
    const match = alerts.find((a) => a.type === "controlled_drug_no_consent");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for expired_consent when >= 1 expired", () => {
    const records = [makeRecord({ consent_status: "expired" })];
    const alerts = identifyMedicationConsentAlerts(records);
    const match = alerts.find((a) => a.type === "expired_consent");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for child_not_informed when >= 1", () => {
    const records = [makeRecord({ child_informed: false })];
    const alerts = identifyMedicationConsentAlerts(records);
    const match = alerts.find((a) => a.type === "child_not_informed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for side_effects_not_explained when >= 2", () => {
    const records = [
      makeRecord({ id: "r1", side_effects_explained: false }),
    ];
    // Only 1 — should NOT trigger
    expect(identifyMedicationConsentAlerts(records).find((a) => a.type === "side_effects_not_explained")).toBeUndefined();

    // 2 — should trigger
    const records2 = [
      makeRecord({ id: "r1", side_effects_explained: false }),
      makeRecord({ id: "r2", side_effects_explained: false }),
    ];
    const alerts = identifyMedicationConsentAlerts(records2);
    const match = alerts.find((a) => a.type === "side_effects_not_explained");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires medium alert for no_review_date when >= 2", () => {
    const records = [
      makeRecord({ id: "r1", review_date_set: false }),
      makeRecord({ id: "r2", review_date_set: false }),
    ];
    const alerts = identifyMedicationConsentAlerts(records);
    const match = alerts.find((a) => a.type === "no_review_date");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

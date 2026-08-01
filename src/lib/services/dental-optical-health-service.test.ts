import { describe, it, expect } from "vitest";
import {
  computeDentalOpticalMetrics,
  identifyDentalOpticalAlerts,
  DentalOpticalHealthRecord,
} from "./dental-optical-health-service";

function makeRecord(overrides: Partial<DentalOpticalHealthRecord> = {}): DentalOpticalHealthRecord {
  return {
    id: "doh-1",
    home_id: "home-1",
    appointment_type: "dental_checkup",
    compliance_level: "fully_compliant",
    treatment_outcome: "completed_successfully",
    urgency_assessment: "routine",
    appointment_date: "2026-05-21",
    child_name: "Alice",
    child_id: "child-1",
    accompanied_by: "Staff A",
    appointment_attended: true,
    consent_obtained: true,
    child_prepared: true,
    anxiety_managed: true,
    treatment_explained: true,
    follow_up_booked: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    prescription_collected: true,
    pain_managed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── computeDentalOpticalMetrics ────────────────────────────────────────

describe("computeDentalOpticalMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeDentalOpticalMetrics([]);
    expect(m.total_appointments).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.appointment_attended_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("calculates correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ compliance_level: "non_compliant", appointment_attended: false }),
      makeRecord({ id: "doh-2", compliance_level: "refused", treatment_outcome: "treatment_refused", urgency_assessment: "emergency" }),
      makeRecord({ id: "doh-3", child_name: "Bob" }),
    ];
    const m = computeDentalOpticalMetrics(records);
    expect(m.total_appointments).toBe(3);
    expect(m.non_compliant_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.treatment_refused_count).toBe(1);
    expect(m.emergency_count).toBe(1); // emergency + urgent
    expect(m.unique_children).toBe(2); // Alice, Bob
    expect(m.appointment_attended_rate).toBe(66.7); // 2/3
  });

  it("produces correct breakdown maps", () => {
    const records = [
      makeRecord({ appointment_type: "dental_checkup" }),
      makeRecord({ id: "doh-2", appointment_type: "optical_exam" }),
    ];
    const m = computeDentalOpticalMetrics(records);
    expect(m.by_appointment_type["dental_checkup"]).toBe(1);
    expect(m.by_appointment_type["optical_exam"]).toBe(1);
  });
});

// ── identifyDentalOpticalAlerts ────────────────────────────────────────

describe("identifyDentalOpticalAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyDentalOpticalAlerts([])).toEqual([]);
  });

  it("alerts critical when treatment refused for emergency/urgent", () => {
    const records = [
      makeRecord({ treatment_outcome: "treatment_refused", urgency_assessment: "emergency", child_name: "Alice" }),
    ];
    const alerts = identifyDentalOpticalAlerts(records);
    const refused = alerts.find((a) => a.type === "refused_urgent");
    expect(refused).toBeDefined();
    expect(refused!.severity).toBe("critical");
  });

  it("also fires refused_urgent for urgent (not just emergency)", () => {
    const records = [
      makeRecord({ treatment_outcome: "treatment_refused", urgency_assessment: "urgent" }),
    ];
    const alerts = identifyDentalOpticalAlerts(records);
    expect(alerts.find((a) => a.type === "refused_urgent")).toBeDefined();
  });

  it("alerts high when >=1 appointment not attended", () => {
    const records = [makeRecord({ appointment_attended: false })];
    const alerts = identifyDentalOpticalAlerts(records);
    expect(alerts.find((a) => a.type === "not_attended")).toBeDefined();
  });

  it("alerts high when >=1 appointment has no consent", () => {
    const records = [makeRecord({ consent_obtained: false })];
    const alerts = identifyDentalOpticalAlerts(records);
    expect(alerts.find((a) => a.type === "no_consent")).toBeDefined();
  });

  it("alerts medium when >=2 appointments without follow-up booked", () => {
    const records = [
      makeRecord({ follow_up_booked: false }),
      makeRecord({ id: "doh-2", follow_up_booked: false }),
    ];
    const alerts = identifyDentalOpticalAlerts(records);
    expect(alerts.find((a) => a.type === "no_follow_up")).toBeDefined();
  });

  it("alerts medium when >=2 appointments where anxiety not managed", () => {
    const records = [
      makeRecord({ anxiety_managed: false }),
      makeRecord({ id: "doh-2", anxiety_managed: false }),
    ];
    const alerts = identifyDentalOpticalAlerts(records);
    expect(alerts.find((a) => a.type === "anxiety_not_managed")).toBeDefined();
  });
});

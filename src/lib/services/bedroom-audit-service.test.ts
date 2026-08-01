import { describe, it, expect } from "vitest";
import {
  computeBedroomAuditMetrics,
  identifyBedroomAuditAlerts,
  type BedroomAuditRecord,
} from "./bedroom-audit-service";

function makeRecord(overrides: Partial<BedroomAuditRecord> = {}): BedroomAuditRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    audit_type: "routine_inspection",
    audit_date: "2026-05-01",
    room_name: "Room 1",
    child_name: "Child A",
    room_condition: "good",
    personalisation_level: "some_personalisation",
    safety_rating: "safe",
    furniture_adequate: true,
    furniture_good_condition: true,
    bedding_clean: true,
    window_restrictors_fitted: true,
    lock_working: true,
    lighting_adequate: true,
    heating_adequate: true,
    ventilation_adequate: true,
    decoration_acceptable: true,
    child_consulted: true,
    privacy_respected: true,
    issues_found: [],
    actions_taken: [],
    audited_by: "Staff A",
    next_audit_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeBedroomAuditMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeBedroomAuditMetrics([]);
    expect(m.total_audits).toBe(0);
    expect(m.routine_inspection_count).toBe(0);
    expect(m.excellent_condition_rate).toBeNull();;
    expect(m.safe_rating_rate).toBeNull();;
    expect(m.furniture_adequate_rate).toBeNull();;
  });

  it("counts audit types correctly", () => {
    const records = [
      makeRecord({ id: "1", audit_type: "routine_inspection" }),
      makeRecord({ id: "2", audit_type: "routine_inspection" }),
      makeRecord({ id: "3", audit_type: "safety_check" }),
    ];
    const m = computeBedroomAuditMetrics(records);
    expect(m.total_audits).toBe(3);
    expect(m.routine_inspection_count).toBe(2);
    expect(m.safety_check_count).toBe(1);
    expect(m.by_audit_type).toEqual({ routine_inspection: 2, safety_check: 1 });
  });

  it("computes condition and personalisation breakdowns", () => {
    const records = [
      makeRecord({ id: "1", room_condition: "excellent", personalisation_level: "highly_personalised" }),
      makeRecord({ id: "2", room_condition: "poor", personalisation_level: "not_personalised" }),
      makeRecord({ id: "3", room_condition: "unacceptable", personalisation_level: "some_personalisation" }),
      makeRecord({ id: "4", room_condition: "excellent", personalisation_level: "highly_personalised" }),
    ];
    const m = computeBedroomAuditMetrics(records);
    expect(m.excellent_condition_rate).toBe(50);
    expect(m.poor_condition_count).toBe(1);
    expect(m.unacceptable_condition_count).toBe(1);
    expect(m.highly_personalised_rate).toBe(50);
    expect(m.not_personalised_count).toBe(1);
  });

  it("computes safety and boolean rates", () => {
    const records = [
      makeRecord({ id: "1", safety_rating: "safe", furniture_adequate: true, child_consulted: true }),
      makeRecord({ id: "2", safety_rating: "unsafe", furniture_adequate: false, child_consulted: false }),
    ];
    const m = computeBedroomAuditMetrics(records);
    expect(m.safe_rating_rate).toBe(50);
    expect(m.unsafe_count).toBe(1);
    expect(m.furniture_adequate_rate).toBe(50);
    expect(m.child_consulted_rate).toBe(50);
  });

  it("counts overdue audits based on next_audit_date", () => {
    const records = [
      makeRecord({ id: "1", next_audit_date: "2020-01-01" }),
      makeRecord({ id: "2", next_audit_date: "2099-01-01" }),
      makeRecord({ id: "3", next_audit_date: null }),
    ];
    const m = computeBedroomAuditMetrics(records);
    expect(m.audit_overdue_count).toBe(1);
  });
});

describe("identifyBedroomAuditAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyBedroomAuditAlerts([])).toEqual([]);
  });

  it("fires critical alert for unsafe bedroom", () => {
    const records = [makeRecord({ id: "r1", safety_rating: "unsafe", room_name: "Room X", audit_date: "2026-05-10" })];
    const alerts = identifyBedroomAuditAlerts(records);
    const unsafeAlert = alerts.find((a) => a.type === "unsafe_bedroom");
    expect(unsafeAlert).toBeDefined();
    expect(unsafeAlert!.severity).toBe("critical");
    expect(unsafeAlert!.id).toBe("r1");
  });

  it("fires high alert for unacceptable condition", () => {
    const records = [makeRecord({ id: "r2", room_condition: "unacceptable" })];
    const alerts = identifyBedroomAuditAlerts(records);
    const alert = alerts.find((a) => a.type === "unacceptable_condition");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("fires not_personalised alert when >= 1 room not personalised", () => {
    const records = [makeRecord({ personalisation_level: "not_personalised" })];
    const alerts = identifyBedroomAuditAlerts(records);
    const alert = alerts.find((a) => a.type === "not_personalised");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("fires child_not_consulted alert when >= 2 audits without consultation (with child_name)", () => {
    const records = [
      makeRecord({ id: "1", child_consulted: false, child_name: "Child A" }),
      makeRecord({ id: "2", child_consulted: false, child_name: "Child B" }),
    ];
    const alerts = identifyBedroomAuditAlerts(records);
    expect(alerts.find((a) => a.type === "child_not_consulted")).toBeDefined();
  });

  it("does NOT fire child_not_consulted when child_name is null", () => {
    const records = [
      makeRecord({ id: "1", child_consulted: false, child_name: null }),
      makeRecord({ id: "2", child_consulted: false, child_name: null }),
    ];
    const alerts = identifyBedroomAuditAlerts(records);
    expect(alerts.find((a) => a.type === "child_not_consulted")).toBeUndefined();
  });

  it("fires audit_overdue alert when >= 1 audit overdue", () => {
    const records = [makeRecord({ next_audit_date: "2020-01-01" })];
    const alerts = identifyBedroomAuditAlerts(records);
    expect(alerts.find((a) => a.type === "audit_overdue")).toBeDefined();
  });
});

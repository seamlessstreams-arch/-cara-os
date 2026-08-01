import { describe, it, expect } from "vitest";
import {
  computeShiftHandoverQualityMetrics,
  identifyShiftHandoverQualityAlerts,
  type ShiftHandoverQualityRecord,
} from "./shift-handover-quality-service";

function makeRecord(
  overrides: Partial<ShiftHandoverQualityRecord> = {},
): ShiftHandoverQualityRecord {
  return {
    id: overrides.id ?? "rec-1",
    home_id: "home-1",
    handover_type: "day_to_night",
    quality_rating: "good",
    completion_status: "fully_complete",
    handover_format: "face_to_face",
    handover_date: "2025-06-01",
    outgoing_staff: "Alice",
    incoming_staff: "Bob",
    medication_info_shared: true,
    safeguarding_updates: true,
    incident_continuity: true,
    care_plan_updates: true,
    risk_info_shared: true,
    appointments_communicated: true,
    behaviour_updates: true,
    emotional_wellbeing_noted: true,
    food_dietary_noted: true,
    contact_updates: true,
    key_tasks_identified: true,
    read_and_signed: true,
    issues_found: [],
    actions_taken: [],
    audited_by: "Manager",
    next_audit_date: null,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeShiftHandoverQualityMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeShiftHandoverQualityMetrics([]);
    expect(m.total_audits).toBe(0);
    expect(m.excellent_count).toBe(0);
    expect(m.good_count).toBe(0);
    expect(m.poor_count).toBe(0);
    expect(m.inadequate_count).toBe(0);
    expect(m.fully_complete_count).toBe(0);
    expect(m.incomplete_count).toBe(0);
    expect(m.medication_info_rate).toBeNull();;
    expect(m.safeguarding_updates_rate).toBeNull();;
    expect(m.read_and_signed_rate).toBeNull();;
  });

  it("counts quality ratings correctly", () => {
    const records = [
      makeRecord({ quality_rating: "excellent" }),
      makeRecord({ quality_rating: "excellent" }),
      makeRecord({ quality_rating: "good" }),
      makeRecord({ quality_rating: "poor" }),
      makeRecord({ quality_rating: "inadequate" }),
    ];
    const m = computeShiftHandoverQualityMetrics(records);
    expect(m.total_audits).toBe(5);
    expect(m.excellent_count).toBe(2);
    expect(m.good_count).toBe(1);
    expect(m.poor_count).toBe(1);
    expect(m.inadequate_count).toBe(1);
  });

  it("counts completion statuses correctly", () => {
    const records = [
      makeRecord({ completion_status: "fully_complete" }),
      makeRecord({ completion_status: "incomplete" }),
      makeRecord({ completion_status: "not_done" }),
    ];
    const m = computeShiftHandoverQualityMetrics(records);
    expect(m.fully_complete_count).toBe(1);
    expect(m.incomplete_count).toBe(2); // incomplete + not_done
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ medication_info_shared: true, safeguarding_updates: false }),
      makeRecord({ medication_info_shared: false, safeguarding_updates: false }),
    ];
    const m = computeShiftHandoverQualityMetrics(records);
    expect(m.medication_info_rate).toBe(50);
    expect(m.safeguarding_updates_rate).toBe(0);
  });

  it("computes breakdowns by type, rating, status, format", () => {
    const records = [
      makeRecord({ handover_type: "day_to_night", handover_format: "face_to_face" }),
      makeRecord({ handover_type: "day_to_night", handover_format: "telephone" }),
      makeRecord({ handover_type: "emergency_handover", handover_format: "telephone" }),
    ];
    const m = computeShiftHandoverQualityMetrics(records);
    expect(m.by_handover_type["day_to_night"]).toBe(2);
    expect(m.by_handover_type["emergency_handover"]).toBe(1);
    expect(m.by_handover_format["face_to_face"]).toBe(1);
    expect(m.by_handover_format["telephone"]).toBe(2);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("identifyShiftHandoverQualityAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifyShiftHandoverQualityAlerts([])).toEqual([]);
  });

  it("returns no alerts when all fields are compliant", () => {
    const alerts = identifyShiftHandoverQualityAlerts([makeRecord()]);
    // medication_info_shared=true => no medication_not_shared
    // risk_info_shared=true => no risk_not_shared
    // read_and_signed=true => no not_read_signed
    // care_plan_updates=true => no care_plan_not_shared
    // quality_rating=good => no inadequate_safeguarding_gap
    expect(alerts).toEqual([]);
  });

  it("fires critical alert for inadequate handover with safeguarding gap", () => {
    const rec = makeRecord({
      quality_rating: "inadequate",
      safeguarding_updates: false,
    });
    const alerts = identifyShiftHandoverQualityAlerts([rec]);
    const critical = alerts.filter((a) => a.type === "inadequate_safeguarding_gap");
    expect(critical.length).toBe(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires high alert when medication info not shared (>= 1)", () => {
    const rec = makeRecord({ medication_info_shared: false });
    const alerts = identifyShiftHandoverQualityAlerts([rec]);
    const med = alerts.filter((a) => a.type === "medication_not_shared");
    expect(med.length).toBe(1);
    expect(med[0].severity).toBe("high");
  });

  it("fires high alert when risk info not shared (>= 1)", () => {
    const rec = makeRecord({ risk_info_shared: false });
    const alerts = identifyShiftHandoverQualityAlerts([rec]);
    expect(alerts.some((a) => a.type === "risk_not_shared" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for not_read_signed when count >= 2", () => {
    const records = [
      makeRecord({ id: "r1", read_and_signed: false }),
      makeRecord({ id: "r2", read_and_signed: false }),
    ];
    const alerts = identifyShiftHandoverQualityAlerts(records);
    expect(alerts.some((a) => a.type === "not_read_signed" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire not_read_signed when count is 1", () => {
    const alerts = identifyShiftHandoverQualityAlerts([
      makeRecord({ read_and_signed: false }),
    ]);
    expect(alerts.some((a) => a.type === "not_read_signed")).toBe(false);
  });

  it("fires medium alert for care_plan_not_shared when count >= 3", () => {
    const records = [
      makeRecord({ id: "r1", care_plan_updates: false }),
      makeRecord({ id: "r2", care_plan_updates: false }),
      makeRecord({ id: "r3", care_plan_updates: false }),
    ];
    const alerts = identifyShiftHandoverQualityAlerts(records);
    expect(alerts.some((a) => a.type === "care_plan_not_shared")).toBe(true);
  });

  it("does NOT fire care_plan_not_shared when count is 2", () => {
    const records = [
      makeRecord({ id: "r1", care_plan_updates: false }),
      makeRecord({ id: "r2", care_plan_updates: false }),
    ];
    const alerts = identifyShiftHandoverQualityAlerts(records);
    expect(alerts.some((a) => a.type === "care_plan_not_shared")).toBe(false);
  });
});

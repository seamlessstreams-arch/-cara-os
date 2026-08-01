import { describe, it, expect } from "vitest";
import {
  computeHealthAppointmentMetrics,
  identifyHealthAppointmentAlerts,
  type HealthAppointmentRecord,
} from "./health-appointments-service";

function makeRecord(overrides: Partial<HealthAppointmentRecord> = {}): HealthAppointmentRecord {
  return {
    id: "appt-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    appointment_type: "gp_visit",
    appointment_date: "2026-05-21",
    appointment_status: "attended",
    appointment_outcome: "no_concerns",
    consent_status: "consent_given",
    child_accompanied: true,
    accompanied_by: "Staff A",
    child_views_captured: true,
    child_anxious: false,
    follow_up_date: null,
    follow_up_actions: [],
    health_plan_updated: true,
    social_worker_informed: true,
    parent_carer_informed: true,
    notes: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── computeHealthAppointmentMetrics ─────────────────────────────────────

describe("computeHealthAppointmentMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeHealthAppointmentMetrics([]);
    expect(result.total_appointments).toBe(0);
    expect(result.gp_count).toBe(0);
    expect(result.dental_count).toBe(0);
    expect(result.attended_rate).toBeNull();;
    expect(result.missed_count).toBe(0);
    expect(result.unique_children).toBe(0);
  });

  it("computes type counts and attendance rates", () => {
    const records = [
      makeRecord({ id: "a1", appointment_type: "gp_visit", appointment_status: "attended" }),
      makeRecord({ id: "a2", appointment_type: "dental_check", appointment_status: "attended" }),
      makeRecord({ id: "a3", appointment_type: "optician", appointment_status: "missed" }),
      makeRecord({ id: "a4", appointment_type: "camhs", appointment_status: "cancelled_by_child", child_name: "Ben" }),
      makeRecord({ id: "a5", appointment_type: "gp_visit", appointment_status: "pending" }),
    ];
    const result = computeHealthAppointmentMetrics(records);

    expect(result.total_appointments).toBe(5);
    expect(result.gp_count).toBe(2);
    expect(result.dental_count).toBe(1);
    expect(result.optician_count).toBe(1);
    expect(result.camhs_count).toBe(1);
    // 2/5 attended = 40%
    expect(result.attended_rate).toBe(40);
    expect(result.missed_count).toBe(1);
    // cancelled_by_child counts
    expect(result.cancelled_count).toBe(1);
    expect(result.pending_count).toBe(1);
    expect(result.unique_children).toBe(2);
  });

  it("counts follow-up overdue records", () => {
    const records = [
      makeRecord({ id: "a1", follow_up_date: "2025-01-01" }), // overdue
      makeRecord({ id: "a2", follow_up_date: "2099-01-01" }), // not overdue
      makeRecord({ id: "a3", follow_up_date: null }),          // no follow-up
    ];
    const result = computeHealthAppointmentMetrics(records);
    expect(result.follow_up_overdue_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "a1", child_accompanied: true, child_views_captured: true, health_plan_updated: true, social_worker_informed: true }),
      makeRecord({ id: "a2", child_accompanied: false, child_views_captured: false, health_plan_updated: false, social_worker_informed: false }),
    ];
    const result = computeHealthAppointmentMetrics(records);
    expect(result.child_accompanied_rate).toBe(50);
    expect(result.child_views_captured_rate).toBe(50);
    expect(result.health_plan_updated_rate).toBe(50);
    expect(result.social_worker_informed_rate).toBe(50);
  });
});

// ── identifyHealthAppointmentAlerts ─────────────────────────────────────

describe("identifyHealthAppointmentAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyHealthAppointmentAlerts([])).toEqual([]);
  });

  it("triggers consent_refused critical alert when not attended", () => {
    const records = [makeRecord({ consent_status: "consent_refused", appointment_status: "missed" })];
    const alerts = identifyHealthAppointmentAlerts(records);
    const cr = alerts.find((a) => a.type === "consent_refused");
    expect(cr).toBeDefined();
    expect(cr!.severity).toBe("critical");
  });

  it("does NOT trigger consent_refused when attended", () => {
    const records = [makeRecord({ consent_status: "consent_refused", appointment_status: "attended" })];
    const alerts = identifyHealthAppointmentAlerts(records);
    expect(alerts.find((a) => a.type === "consent_refused")).toBeUndefined();
  });

  it("triggers missed_appointments high alert when >= 1", () => {
    const records = [makeRecord({ appointment_status: "missed" })];
    const alerts = identifyHealthAppointmentAlerts(records);
    const missed = alerts.find((a) => a.type === "missed_appointments");
    expect(missed).toBeDefined();
    expect(missed!.severity).toBe("high");
  });

  it("triggers follow_up_overdue high alert when >= 1", () => {
    const records = [makeRecord({ follow_up_date: "2025-01-01" })];
    const alerts = identifyHealthAppointmentAlerts(records);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeDefined();
    expect(overdue!.severity).toBe("high");
  });

  it("triggers views_not_captured medium alert when >= 3 attended without views", () => {
    const records = [
      makeRecord({ id: "a1", appointment_status: "attended", child_views_captured: false }),
      makeRecord({ id: "a2", appointment_status: "attended", child_views_captured: false }),
      makeRecord({ id: "a3", appointment_status: "attended", child_views_captured: false }),
    ];
    const alerts = identifyHealthAppointmentAlerts(records);
    const views = alerts.find((a) => a.type === "views_not_captured");
    expect(views).toBeDefined();
    expect(views!.severity).toBe("medium");
  });

  it("triggers health_plan_not_updated medium alert when >= 2 attended with treatment but no plan update", () => {
    const records = [
      makeRecord({ id: "a1", appointment_status: "attended", appointment_outcome: "treatment_given", health_plan_updated: false }),
      makeRecord({ id: "a2", appointment_status: "attended", appointment_outcome: "referral_made", health_plan_updated: false }),
    ];
    const alerts = identifyHealthAppointmentAlerts(records);
    const hpu = alerts.find((a) => a.type === "health_plan_not_updated");
    expect(hpu).toBeDefined();
    expect(hpu!.severity).toBe("medium");
  });
});

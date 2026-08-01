import { describe, it, expect } from "vitest";
import {
  computeSupportPlanMetrics,
  identifySupportPlanAlerts,
} from "./staff-support-plan-service";
import type { StaffSupportPlanRecord } from "./staff-support-plan-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffSupportPlanRecord> = {}): StaffSupportPlanRecord {
  return {
    id: "sp-1",
    home_id: "home-1",
    staff_name: "Priya Patel",
    staff_id: "s-1",
    concern_area: "wellbeing",
    plan_status: "active",
    approval_status: "approved",
    supervision_frequency: "fortnightly",
    session_date: "2026-04-18",
    created_by: "Manager D",
    what_is_working_well: "Good relationships",
    what_we_are_worried_about: "Workload pressure",
    what_needs_to_improve: "Time management",
    support_being_offered: null,
    wellbeing_considerations: null,
    reasonable_adjustments: null,
    mentor_buddy: null,
    timescale: null,
    staff_response: null,
    approved_by: null,
    approved_at: null,
    what_working_well_recorded: true,
    concerns_documented: true,
    improvements_identified: true,
    support_offered: true,
    wellbeing_considered: true,
    adjustments_offered: true,
    mentor_assigned: true,
    staff_consulted: true,
    staff_agreed: true,
    review_date_set: true,
    approved_by_senior: true,
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

// -- computeSupportPlanMetrics ------------------------------------------------

describe("computeSupportPlanMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeSupportPlanMetrics([]);
    expect(m.total_plans).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.escalated_count).toBe(0);
    expect(m.pending_approval_count).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.working_well_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts statuses correctly", () => {
    const records = [
      makeRecord({ id: "1", plan_status: "active", approval_status: "pending" }),
      makeRecord({ id: "2", plan_status: "escalated", approval_status: "approved" }),
      makeRecord({ id: "3", plan_status: "completed", approval_status: "pending" }),
    ];
    const m = computeSupportPlanMetrics(records);
    expect(m.active_count).toBe(1);
    expect(m.escalated_count).toBe(1);
    expect(m.completed_count).toBe(1);
    expect(m.pending_approval_count).toBe(2);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", what_working_well_recorded: true, staff_consulted: false, wellbeing_considered: true }),
      makeRecord({ id: "2", what_working_well_recorded: false, staff_consulted: false, wellbeing_considered: false }),
    ];
    const m = computeSupportPlanMetrics(records);
    expect(m.working_well_rate).toBe(50);
    expect(m.staff_consulted_rate).toBe(0);
    expect(m.wellbeing_rate).toBe(50);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", concern_area: "wellbeing", plan_status: "active", approval_status: "approved", supervision_frequency: "weekly" }),
      makeRecord({ id: "2", concern_area: "attendance", plan_status: "completed", approval_status: "pending", supervision_frequency: "monthly" }),
    ];
    const m = computeSupportPlanMetrics(records);
    expect(m.by_concern_area).toEqual({ wellbeing: 1, attendance: 1 });
    expect(m.by_plan_status).toEqual({ active: 1, completed: 1 });
    expect(m.by_approval_status).toEqual({ approved: 1, pending: 1 });
    expect(m.by_supervision_frequency).toEqual({ weekly: 1, monthly: 1 });
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Priya" }),
      makeRecord({ id: "2", staff_name: "Quinn" }),
      makeRecord({ id: "3", staff_name: "Priya" }),
    ];
    const m = computeSupportPlanMetrics(records);
    expect(m.unique_staff).toBe(2);
  });
});

// -- identifySupportPlanAlerts ------------------------------------------------

describe("identifySupportPlanAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifySupportPlanAlerts([])).toEqual([]);
  });

  it("fires critical alert for escalated plan with pending approval", () => {
    const records = [makeRecord({ plan_status: "escalated", approval_status: "pending" })];
    const alerts = identifySupportPlanAlerts(records);
    const critical = alerts.filter((a) => a.type === "escalated_unapproved");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("does NOT fire critical alert for escalated plan that is approved", () => {
    const records = [makeRecord({ plan_status: "escalated", approval_status: "approved" })];
    const alerts = identifySupportPlanAlerts(records);
    expect(alerts.filter((a) => a.type === "escalated_unapproved")).toHaveLength(0);
  });

  it("fires high alert for staff not consulted (>= 1)", () => {
    const records = [makeRecord({ staff_consulted: false })];
    const alerts = identifySupportPlanAlerts(records);
    expect(alerts.some((a) => a.type === "no_staff_consulted" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for wellbeing not considered (>= 1)", () => {
    const records = [makeRecord({ wellbeing_considered: false })];
    const alerts = identifySupportPlanAlerts(records);
    expect(alerts.some((a) => a.type === "no_wellbeing_considered" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for no mentor assigned (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", mentor_assigned: false }),
      makeRecord({ id: "2", mentor_assigned: false }),
    ];
    const alerts = identifySupportPlanAlerts(records);
    expect(alerts.some((a) => a.type === "no_mentor_assigned" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire no_mentor_assigned at 1 record", () => {
    const records = [makeRecord({ mentor_assigned: false })];
    const alerts = identifySupportPlanAlerts(records);
    expect(alerts.some((a) => a.type === "no_mentor_assigned")).toBe(false);
  });

  it("fires medium alert for no adjustments offered (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", adjustments_offered: false }),
      makeRecord({ id: "2", adjustments_offered: false }),
    ];
    const alerts = identifySupportPlanAlerts(records);
    expect(alerts.some((a) => a.type === "no_adjustments_offered" && a.severity === "medium")).toBe(true);
  });

  it("returns no alerts for fully compliant plan", () => {
    const records = [makeRecord()];
    const alerts = identifySupportPlanAlerts(records);
    expect(alerts).toHaveLength(0);
  });
});

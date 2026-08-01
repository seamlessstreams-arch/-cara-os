import { describe, it, expect } from "vitest";
import {
  computeSupportActionMetrics,
  identifySupportActionAlerts,
} from "./staff-support-action-service";
import type { StaffSupportActionRecord } from "./staff-support-action-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffSupportActionRecord> = {}): StaffSupportActionRecord {
  return {
    id: "sa-1",
    home_id: "home-1",
    staff_name: "Nadia Khan",
    staff_id: "s-1",
    action_type: "training_course",
    action_outcome: "positive",
    completion_status: "completed",
    action_priority: "medium",
    session_date: "2026-04-12",
    recorded_by: "Manager C",
    action_description: "Manual handling training",
    evidence_of_need: "Observation notes",
    expected_outcome: null,
    actual_outcome: null,
    staff_feedback: null,
    manager_observation: null,
    barriers_encountered: null,
    follow_up_plan: null,
    linked_plan_id: null,
    approved_by: null,
    approved_at: null,
    next_review_date: null,
    notes: null,
    evidence_based: true,
    staff_consulted: true,
    staff_agreed: true,
    action_proportionate: true,
    cost_considered: true,
    timeline_set: true,
    success_criteria_set: true,
    follow_up_scheduled: true,
    manager_approved: true,
    impact_assessed: true,
    linked_to_plan: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeSupportActionMetrics ----------------------------------------------

describe("computeSupportActionMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeSupportActionMetrics([]);
    expect(m.total_actions).toBe(0);
    expect(m.overdue_count).toBe(0);
    expect(m.urgent_count).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.no_change_count).toBe(0);
    expect(m.evidence_based_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts statuses and priorities correctly", () => {
    const records = [
      makeRecord({ id: "1", completion_status: "overdue", action_priority: "urgent", action_outcome: "no_change" }),
      makeRecord({ id: "2", completion_status: "completed", action_priority: "high", action_outcome: "positive" }),
      makeRecord({ id: "3", completion_status: "overdue", action_priority: "medium", action_outcome: "no_change" }),
    ];
    const m = computeSupportActionMetrics(records);
    expect(m.overdue_count).toBe(2);
    expect(m.urgent_count).toBe(1);
    expect(m.completed_count).toBe(1);
    expect(m.no_change_count).toBe(2);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", evidence_based: true, staff_consulted: false, success_criteria_set: true }),
      makeRecord({ id: "2", evidence_based: false, staff_consulted: false, success_criteria_set: false }),
    ];
    const m = computeSupportActionMetrics(records);
    expect(m.evidence_based_rate).toBe(50);
    expect(m.staff_consulted_rate).toBe(0);
    expect(m.success_criteria_rate).toBe(50);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", action_type: "training_course", action_outcome: "positive", completion_status: "completed", action_priority: "medium" }),
      makeRecord({ id: "2", action_type: "mentoring_session", action_outcome: "neutral", completion_status: "planned", action_priority: "urgent" }),
    ];
    const m = computeSupportActionMetrics(records);
    expect(m.by_action_type).toEqual({ training_course: 1, mentoring_session: 1 });
    expect(m.by_action_outcome).toEqual({ positive: 1, neutral: 1 });
    expect(m.by_completion_status).toEqual({ completed: 1, planned: 1 });
    expect(m.by_action_priority).toEqual({ medium: 1, urgent: 1 });
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Nadia" }),
      makeRecord({ id: "2", staff_name: "Olga" }),
      makeRecord({ id: "3", staff_name: "Nadia" }),
    ];
    const m = computeSupportActionMetrics(records);
    expect(m.unique_staff).toBe(2);
  });
});

// -- identifySupportActionAlerts ----------------------------------------------

describe("identifySupportActionAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifySupportActionAlerts([])).toEqual([]);
  });

  it("fires critical alert for overdue urgent action", () => {
    const records = [makeRecord({ completion_status: "overdue", action_priority: "urgent" })];
    const alerts = identifySupportActionAlerts(records);
    const critical = alerts.filter((a) => a.type === "overdue_urgent");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("does NOT fire critical alert for overdue non-urgent action", () => {
    const records = [makeRecord({ completion_status: "overdue", action_priority: "high" })];
    const alerts = identifySupportActionAlerts(records);
    expect(alerts.filter((a) => a.type === "overdue_urgent")).toHaveLength(0);
  });

  it("fires high alert for staff not consulted (>= 1)", () => {
    const records = [makeRecord({ staff_consulted: false })];
    const alerts = identifySupportActionAlerts(records);
    expect(alerts.some((a) => a.type === "staff_not_consulted" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for no success criteria (>= 1)", () => {
    const records = [makeRecord({ success_criteria_set: false })];
    const alerts = identifySupportActionAlerts(records);
    expect(alerts.some((a) => a.type === "no_success_criteria" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for no follow-up (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", follow_up_scheduled: false }),
      makeRecord({ id: "2", follow_up_scheduled: false }),
    ];
    const alerts = identifySupportActionAlerts(records);
    expect(alerts.some((a) => a.type === "no_follow_up" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire no_follow_up at 1 record", () => {
    const records = [makeRecord({ follow_up_scheduled: false })];
    const alerts = identifySupportActionAlerts(records);
    expect(alerts.some((a) => a.type === "no_follow_up")).toBe(false);
  });

  it("fires medium alert for no impact assessed (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", impact_assessed: false }),
      makeRecord({ id: "2", impact_assessed: false }),
    ];
    const alerts = identifySupportActionAlerts(records);
    expect(alerts.some((a) => a.type === "no_impact_assessed" && a.severity === "medium")).toBe(true);
  });
});

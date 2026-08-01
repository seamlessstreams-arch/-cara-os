import { describe, it, expect } from "vitest";
import {
  computeDevelopmentPlanMetrics,
  identifyDevelopmentPlanAlerts,
} from "./staff-development-plan-service";
import type { StaffDevelopmentPlanRecord } from "./staff-development-plan-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffDevelopmentPlanRecord> = {}): StaffDevelopmentPlanRecord {
  return {
    id: "dp-1",
    home_id: "home-1",
    staff_name: "Jane Smith",
    staff_id: "s-1",
    development_area: "communication",
    plan_status: "active",
    approval_status: "approved",
    priority_level: "medium",
    session_date: "2026-05-01",
    created_by: "manager-1",
    development_area_detail: "Improve written records",
    evidence_summary: "Monthly audits show gaps",
    possible_underlying_reason: null,
    impact_description: null,
    strengths_to_build_on: "Good verbal communication",
    manager_support_actions: "Weekly check-ins",
    staff_actions_detail: "Complete training",
    training_required: "Record keeping course",
    mentoring_detail: null,
    success_measures: "90% record quality",
    staff_response: null,
    approved_by: "senior-1",
    approved_at: "2026-05-02",
    evidence_based: true,
    strengths_identified: true,
    staff_consulted: true,
    manager_actions_set: true,
    staff_actions_set: true,
    training_identified: true,
    mentoring_arranged: true,
    success_measures_set: true,
    review_date_set: true,
    staff_agreed: true,
    approved_by_senior: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: "2026-06-01",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeDevelopmentPlanMetrics ---------------------------------------------

describe("computeDevelopmentPlanMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeDevelopmentPlanMetrics([]);
    expect(m.total_plans).toBe(0);
    expect(m.urgent_count).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.pending_approval_count).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.evidence_based_rate).toBeNull();;
    expect(m.strengths_identified_rate).toBeNull();;
    expect(m.staff_consulted_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts statuses and priorities correctly", () => {
    const records = [
      makeRecord({ id: "1", priority_level: "urgent", plan_status: "active", approval_status: "pending" }),
      makeRecord({ id: "2", priority_level: "high", plan_status: "completed", approval_status: "approved" }),
      makeRecord({ id: "3", priority_level: "medium", plan_status: "active", approval_status: "pending" }),
    ];
    const m = computeDevelopmentPlanMetrics(records);
    expect(m.total_plans).toBe(3);
    expect(m.urgent_count).toBe(1);
    expect(m.active_count).toBe(2);
    expect(m.pending_approval_count).toBe(2);
    expect(m.completed_count).toBe(1);
  });

  it("computes boolean rates correctly with rounding", () => {
    const records = [
      makeRecord({ id: "1", evidence_based: true, strengths_identified: true, staff_consulted: false }),
      makeRecord({ id: "2", evidence_based: true, strengths_identified: false, staff_consulted: false }),
      makeRecord({ id: "3", evidence_based: false, strengths_identified: false, staff_consulted: false }),
    ];
    const m = computeDevelopmentPlanMetrics(records);
    expect(m.evidence_based_rate).toBe(66.7);
    expect(m.strengths_identified_rate).toBe(33.3);
    expect(m.staff_consulted_rate).toBe(0);
  });

  it("counts unique staff members", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Bob" }),
      makeRecord({ id: "3", staff_name: "Alice" }),
    ];
    const m = computeDevelopmentPlanMetrics(records);
    expect(m.unique_staff).toBe(2);
  });

  it("builds breakdown maps correctly", () => {
    const records = [
      makeRecord({ id: "1", development_area: "communication", plan_status: "active", approval_status: "pending", priority_level: "high" }),
      makeRecord({ id: "2", development_area: "communication", plan_status: "completed", approval_status: "approved", priority_level: "medium" }),
      makeRecord({ id: "3", development_area: "leadership", plan_status: "active", approval_status: "pending", priority_level: "high" }),
    ];
    const m = computeDevelopmentPlanMetrics(records);
    expect(m.by_development_area).toEqual({ communication: 2, leadership: 1 });
    expect(m.by_plan_status).toEqual({ active: 2, completed: 1 });
    expect(m.by_approval_status).toEqual({ pending: 2, approved: 1 });
    expect(m.by_priority_level).toEqual({ high: 2, medium: 1 });
  });

  it("returns 100% rates when all booleans true", () => {
    const records = [makeRecord(), makeRecord({ id: "2" })];
    const m = computeDevelopmentPlanMetrics(records);
    expect(m.evidence_based_rate).toBe(100);
    expect(m.strengths_identified_rate).toBe(100);
    expect(m.staff_consulted_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });
});

// -- identifyDevelopmentPlanAlerts ---------------------------------------------

describe("identifyDevelopmentPlanAlerts", () => {
  it("returns empty alerts for empty array", () => {
    expect(identifyDevelopmentPlanAlerts([])).toEqual([]);
  });

  it("returns empty alerts when all records are compliant", () => {
    const records = [makeRecord()];
    expect(identifyDevelopmentPlanAlerts(records)).toEqual([]);
  });

  it("fires critical alert for urgent unapproved plan", () => {
    const records = [
      makeRecord({ id: "dp-urgent", priority_level: "urgent", approval_status: "pending", staff_name: "Tom" }),
    ];
    const alerts = identifyDevelopmentPlanAlerts(records);
    const urgent = alerts.filter((a) => a.type === "urgent_unapproved");
    expect(urgent).toHaveLength(1);
    expect(urgent[0].severity).toBe("critical");
    expect(urgent[0].id).toBe("dp-urgent");
  });

  it("fires high alert when >= 1 plan has staff not consulted", () => {
    const records = [makeRecord({ id: "1", staff_consulted: false })];
    const alerts = identifyDevelopmentPlanAlerts(records);
    const found = alerts.filter((a) => a.type === "no_staff_consulted");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires high alert when >= 1 plan has no strengths identified", () => {
    const records = [makeRecord({ id: "1", strengths_identified: false })];
    const alerts = identifyDevelopmentPlanAlerts(records);
    const found = alerts.filter((a) => a.type === "no_strengths_identified");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires medium alert when >= 2 plans have no success measures", () => {
    const one = [makeRecord({ id: "1", success_measures_set: false })];
    expect(identifyDevelopmentPlanAlerts(one).filter((a) => a.type === "no_success_measures")).toHaveLength(0);

    const two = [
      makeRecord({ id: "1", success_measures_set: false }),
      makeRecord({ id: "2", success_measures_set: false }),
    ];
    const alerts = identifyDevelopmentPlanAlerts(two);
    const found = alerts.filter((a) => a.type === "no_success_measures");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("medium");
  });

  it("fires medium alert when >= 2 plans have no mentoring", () => {
    const one = [makeRecord({ id: "1", mentoring_arranged: false })];
    expect(identifyDevelopmentPlanAlerts(one).filter((a) => a.type === "no_mentoring")).toHaveLength(0);

    const two = [
      makeRecord({ id: "1", mentoring_arranged: false }),
      makeRecord({ id: "2", mentoring_arranged: false }),
    ];
    const alerts = identifyDevelopmentPlanAlerts(two);
    const found = alerts.filter((a) => a.type === "no_mentoring");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("medium");
  });
});

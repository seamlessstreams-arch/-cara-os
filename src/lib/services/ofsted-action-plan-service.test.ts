import { describe, it, expect } from "vitest";
import {
  computeOfstedActionPlanMetrics,
  identifyOfstedActionPlanAlerts,
  type OfstedActionPlanRecord,
} from "./ofsted-action-plan-service";

function makeRecord(overrides: Partial<OfstedActionPlanRecord> = {}): OfstedActionPlanRecord {
  return {
    id: "oap-1",
    home_id: "home-1",
    finding_type: "recommendation",
    action_status: "in_progress",
    finding_priority: "medium",
    inspection_type: "full_inspection",
    inspection_date: "2026-01-15",
    finding_description: "Improve record keeping",
    action_plan: "Implement new recording system",
    responsible_person: "Registered Manager",
    target_date: "2026-06-01",
    evidence_gathered: true,
    progress_documented: true,
    staff_briefed: true,
    training_provided: true,
    policy_updated: true,
    practice_changed: true,
    monitored_by_ri: true,
    children_informed: false,
    social_worker_notified: true,
    board_informed: true,
    follow_up_inspection_ready: true,
    regulation_referenced: true,
    issues_found: [],
    actions_taken: [],
    completed_by: null,
    completion_date: null,
    notes: null,
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeOfstedActionPlanMetrics ─────────────────────────────────────

describe("computeOfstedActionPlanMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeOfstedActionPlanMetrics([]);
    expect(m.total_findings).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.completion_rate).toBeNull();;
    expect(m.evidence_gathered_rate).toBeNull();;
  });

  it("computes status counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "oap-1", action_status: "completed", evidence_gathered: true, staff_briefed: true }),
      makeRecord({ id: "oap-2", action_status: "evidenced", evidence_gathered: true, staff_briefed: false }),
      makeRecord({ id: "oap-3", action_status: "not_started", evidence_gathered: false, staff_briefed: false }),
      makeRecord({ id: "oap-4", action_status: "overdue", evidence_gathered: false, staff_briefed: true }),
    ];
    const m = computeOfstedActionPlanMetrics(records);
    expect(m.total_findings).toBe(4);
    expect(m.not_started_count).toBe(1);
    expect(m.completed_count).toBe(1);
    expect(m.evidenced_count).toBe(1);
    expect(m.overdue_count).toBe(1);
    // completion_rate = (completed + evidenced) / total = 2/4 = 50%
    expect(m.completion_rate).toBe(50);
    // evidence_gathered_rate = 2/4 = 50%
    expect(m.evidence_gathered_rate).toBe(50);
    // staff_briefed_rate = 2/4 = 50%
    expect(m.staff_briefed_rate).toBe(50);
  });

  it("computes breakdowns by finding type, status, priority, and inspection type", () => {
    const records = [
      makeRecord({ id: "oap-1", finding_type: "requirement", finding_priority: "immediate", inspection_type: "full_inspection" }),
      makeRecord({ id: "oap-2", finding_type: "requirement", finding_priority: "high", inspection_type: "monitoring_visit" }),
      makeRecord({ id: "oap-3", finding_type: "recommendation", finding_priority: "medium", inspection_type: "full_inspection" }),
    ];
    const m = computeOfstedActionPlanMetrics(records);
    expect(m.by_finding_type["requirement"]).toBe(2);
    expect(m.by_finding_type["recommendation"]).toBe(1);
    expect(m.by_finding_priority["immediate"]).toBe(1);
    expect(m.by_finding_priority["high"]).toBe(1);
    expect(m.by_inspection_type["full_inspection"]).toBe(2);
    expect(m.by_inspection_type["monitoring_visit"]).toBe(1);
  });
});

// ── identifyOfstedActionPlanAlerts ─────────────────────────────────────

describe("identifyOfstedActionPlanAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyOfstedActionPlanAlerts([])).toHaveLength(0);
  });

  it("flags overdue_requirement (critical) for overdue requirement finding type", () => {
    const records = [
      makeRecord({ action_status: "overdue", finding_type: "requirement" }),
    ];
    const alerts = identifyOfstedActionPlanAlerts(records);
    const found = alerts.filter((a) => a.type === "overdue_requirement");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags overdue_requirement (critical) for overdue regulation_breach", () => {
    const records = [
      makeRecord({ action_status: "overdue", finding_type: "regulation_breach" }),
    ];
    const alerts = identifyOfstedActionPlanAlerts(records);
    const found = alerts.filter((a) => a.type === "overdue_requirement");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("does NOT flag overdue_requirement for overdue recommendation", () => {
    const records = [
      makeRecord({ action_status: "overdue", finding_type: "recommendation" }),
    ];
    const alerts = identifyOfstedActionPlanAlerts(records);
    const found = alerts.filter((a) => a.type === "overdue_requirement");
    expect(found).toHaveLength(0);
  });

  it("flags not_started (high) when >= 1 finding not started", () => {
    const records = [makeRecord({ action_status: "not_started" })];
    const alerts = identifyOfstedActionPlanAlerts(records);
    const found = alerts.filter((a) => a.type === "not_started");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags evidence_not_gathered (high) when >= 2 in-progress without evidence", () => {
    const records = [
      makeRecord({ id: "oap-1", action_status: "in_progress", evidence_gathered: false }),
      makeRecord({ id: "oap-2", action_status: "completed", evidence_gathered: false }),
    ];
    const alerts = identifyOfstedActionPlanAlerts(records);
    const found = alerts.filter((a) => a.type === "evidence_not_gathered");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags staff_not_briefed (medium) when >= 2 not briefed", () => {
    const records = [
      makeRecord({ id: "oap-1", staff_briefed: false }),
      makeRecord({ id: "oap-2", staff_briefed: false }),
    ];
    const alerts = identifyOfstedActionPlanAlerts(records);
    const found = alerts.filter((a) => a.type === "staff_not_briefed");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });

  it("flags practice_not_changed (medium) when >= 3 without practice change", () => {
    const records = [
      makeRecord({ id: "oap-1", practice_changed: false }),
      makeRecord({ id: "oap-2", practice_changed: false }),
      makeRecord({ id: "oap-3", practice_changed: false }),
    ];
    const alerts = identifyOfstedActionPlanAlerts(records);
    const found = alerts.filter((a) => a.type === "practice_not_changed");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });
});

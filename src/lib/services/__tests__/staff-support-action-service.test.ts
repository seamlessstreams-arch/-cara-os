import { describe, it, expect } from "vitest";
import { _testing, type StaffSupportActionRecord } from "../staff-support-action-service";

const { computeSupportActionMetrics, identifySupportActionAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<StaffSupportActionRecord>): StaffSupportActionRecord {
  return {
    id: "a-1",
    home_id: "home-1",
    action_type: "training_course",
    action_outcome: "positive",
    completion_status: "completed",
    action_priority: "medium",
    session_date: now.toISOString().split("T")[0],
    staff_name: "Staff A",
    recorded_by: "Manager A",
    action_description: "Test action",
    evidence_of_need: "Test evidence",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    expected_outcome: "expected_outcome" in (overrides ?? {}) ? (overrides!.expected_outcome ?? null) : null,
    actual_outcome: "actual_outcome" in (overrides ?? {}) ? (overrides!.actual_outcome ?? null) : null,
    staff_feedback: "staff_feedback" in (overrides ?? {}) ? (overrides!.staff_feedback ?? null) : null,
    manager_observation: "manager_observation" in (overrides ?? {}) ? (overrides!.manager_observation ?? null) : null,
    barriers_encountered: "barriers_encountered" in (overrides ?? {}) ? (overrides!.barriers_encountered ?? null) : null,
    follow_up_plan: "follow_up_plan" in (overrides ?? {}) ? (overrides!.follow_up_plan ?? null) : null,
    linked_plan_id: "linked_plan_id" in (overrides ?? {}) ? (overrides!.linked_plan_id ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
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
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

// ── computeSupportActionMetrics ──────────────────────────────────────────

describe("computeSupportActionMetrics", () => {
  it("returns zeros for empty", () => { 
    const m = computeSupportActionMetrics([]);
    expect(m.total_actions).toBe(0);;
    expect(m.overdue_count).toBe(0);
    expect(m.urgent_count).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.no_change_count).toBe(0);
    expect(m.evidence_based_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("returns empty breakdowns", () => { 
    const m = computeSupportActionMetrics([]);
    expect(m.by_action_type).toEqual({});
    expect(m.by_action_outcome).toEqual({});
    expect(m.by_completion_status).toEqual({});
    expect(m.by_action_priority).toEqual({});
  });

  it("total_actions counts records", () => { expect(computeSupportActionMetrics([makeRecord(), makeRecord({ id: "a-2" })]).total_actions).toBe(2); });

  it("counts overdue", () => { expect(computeSupportActionMetrics([makeRecord({ completion_status: "overdue" })]).overdue_count).toBe(1); });

  it("does not count cancelled as overdue", () => { expect(computeSupportActionMetrics([makeRecord({ completion_status: "cancelled" })]).overdue_count).toBe(0); });

  it("counts urgent", () => { expect(computeSupportActionMetrics([makeRecord({ action_priority: "urgent" })]).urgent_count).toBe(1); });

  it("counts completed", () => { expect(computeSupportActionMetrics([makeRecord({ completion_status: "completed" })]).completed_count).toBe(1); });

  it("counts no_change", () => { expect(computeSupportActionMetrics([makeRecord({ action_outcome: "no_change" })]).no_change_count).toBe(1); });

  it("does not count limited as no_change", () => { expect(computeSupportActionMetrics([makeRecord({ action_outcome: "limited" })]).no_change_count).toBe(0); });

  it("returns 100% boolean rates with defaults", () => {
    const m = computeSupportActionMetrics([makeRecord()]);
    expect(m.evidence_based_rate).toBe(100);
    expect(m.staff_consulted_rate).toBe(100);
    expect(m.staff_agreed_rate).toBe(100);
    expect(m.proportionate_rate).toBe(100);
    expect(m.cost_considered_rate).toBe(100);
    expect(m.timeline_rate).toBe(100);
    expect(m.success_criteria_rate).toBe(100);
    expect(m.follow_up_rate).toBe(100);
    expect(m.manager_approved_rate).toBe(100);
    expect(m.impact_assessed_rate).toBe(100);
    expect(m.linked_to_plan_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("evidence_based_rate 0 when false", () => { expect(computeSupportActionMetrics([makeRecord({ evidence_based: false })]).evidence_based_rate).toBe(0); });

  it("mixed boolean rate", () => { const m = computeSupportActionMetrics([makeRecord({ id: "a-1" }), makeRecord({ id: "a-2" }), makeRecord({ id: "a-3", staff_consulted: false })]); expect(m.staff_consulted_rate).toBe(66.7); });

  it("unique_staff distinct", () => { expect(computeSupportActionMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]).unique_staff).toBe(2); });

  it("counts all 10 action types", () => {
    const types = ["training_course", "mentoring_session", "supervision_adjustment", "reasonable_adjustment", "wellbeing_intervention", "peer_support", "workload_review", "occupational_health", "coaching", "other"] as const;
    const recs = types.map((t, i) => makeRecord({ id: `a-${i}`, action_type: t }));
    const m = computeSupportActionMetrics(recs);
    for (const t of types) expect(m.by_action_type[t]).toBe(1);
  });

  it("counts all 5 outcomes", () => {
    const outcomes = ["very_positive", "positive", "neutral", "limited", "no_change"] as const;
    const recs = outcomes.map((o, i) => makeRecord({ id: `a-${i}`, action_outcome: o }));
    const m = computeSupportActionMetrics(recs);
    for (const o of outcomes) expect(m.by_action_outcome[o]).toBe(1);
  });

  it("counts all 5 completion statuses", () => {
    const statuses = ["planned", "in_progress", "completed", "cancelled", "overdue"] as const;
    const recs = statuses.map((s, i) => makeRecord({ id: `a-${i}`, completion_status: s }));
    const m = computeSupportActionMetrics(recs);
    for (const s of statuses) expect(m.by_completion_status[s]).toBe(1);
  });

  it("counts all 5 priorities", () => {
    const priorities = ["urgent", "high", "medium", "low", "routine"] as const;
    const recs = priorities.map((p, i) => makeRecord({ id: `a-${i}`, action_priority: p }));
    const m = computeSupportActionMetrics(recs);
    for (const p of priorities) expect(m.by_action_priority[p]).toBe(1);
  });
});

// ── identifySupportActionAlerts ──────────────────────────────────────────

describe("identifySupportActionAlerts", () => {
  it("returns empty for clean", () => { expect(identifySupportActionAlerts([makeRecord()])).toEqual([]); });

  it("returns empty for empty", () => { expect(identifySupportActionAlerts([])).toEqual([]); });

  it("fires overdue_urgent", () => { 
    const a = identifySupportActionAlerts([makeRecord({ completion_status: "overdue", action_priority: "urgent", staff_name: "Jo" })]);
    expect(a).toHaveLength(1);
    expect(a[0].type).toBe("overdue_urgent");
    expect(a[0].severity).toBe("critical");
    expect(a[0].message).toContain("Jo");
  });

  it("no critical when overdue + medium", () => { expect(identifySupportActionAlerts([makeRecord({ completion_status: "overdue", action_priority: "medium" })]).filter((a) => a.severity === "critical")).toHaveLength(0); });

  it("no critical when planned + urgent", () => { expect(identifySupportActionAlerts([makeRecord({ completion_status: "planned", action_priority: "urgent" })]).filter((a) => a.severity === "critical")).toHaveLength(0); });

  it("per-record overdue_urgent", () => { const a = identifySupportActionAlerts([makeRecord({ id: "a-1", completion_status: "overdue", action_priority: "urgent" }), makeRecord({ id: "a-2", completion_status: "overdue", action_priority: "urgent" })]); expect(a.filter((x) => x.type === "overdue_urgent")).toHaveLength(2); });

  it("fires staff_not_consulted singular", () => { 
    const a = identifySupportActionAlerts([makeRecord({ staff_consulted: false })]);
    const f = a.find((x) => x.type === "staff_not_consulted");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("high");
    expect(f!.message).toContain("1 action has");
  });

  it("staff_not_consulted plural", () => { const a = identifySupportActionAlerts([makeRecord({ id: "a-1", staff_consulted: false }), makeRecord({ id: "a-2", staff_consulted: false })]); expect(a.find((x) => x.type === "staff_not_consulted")!.message).toContain("2 actions have"); });

  it("fires no_success_criteria", () => { const a = identifySupportActionAlerts([makeRecord({ success_criteria_set: false })]); const f = a.find((x) => x.type === "no_success_criteria"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });

  it("no_follow_up not for 1", () => { expect(identifySupportActionAlerts([makeRecord({ follow_up_scheduled: false })]).find((x) => x.type === "no_follow_up")).toBeUndefined(); });

  it("no_follow_up fires for 2", () => { const a = identifySupportActionAlerts([makeRecord({ id: "a-1", follow_up_scheduled: false }), makeRecord({ id: "a-2", follow_up_scheduled: false })]); const f = a.find((x) => x.type === "no_follow_up"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); });

  it("no_impact_assessed not for 1", () => { expect(identifySupportActionAlerts([makeRecord({ impact_assessed: false })]).find((x) => x.type === "no_impact_assessed")).toBeUndefined(); });

  it("no_impact_assessed fires for 2", () => { const a = identifySupportActionAlerts([makeRecord({ id: "a-1", impact_assessed: false }), makeRecord({ id: "a-2", impact_assessed: false })]); const f = a.find((x) => x.type === "no_impact_assessed"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); });

  it("fires all applicable", () => {
    const recs = [
      makeRecord({ id: "a-1", completion_status: "overdue", action_priority: "urgent", staff_consulted: false, success_criteria_set: false, follow_up_scheduled: false, impact_assessed: false }),
      makeRecord({ id: "a-2", completion_status: "overdue", action_priority: "urgent", staff_consulted: false, success_criteria_set: false, follow_up_scheduled: false, impact_assessed: false }),
    ];
    const a = identifySupportActionAlerts(recs);
    const types = a.map((x) => x.type);
    expect(types).toContain("overdue_urgent");
    expect(types).toContain("staff_not_consulted");
    expect(types).toContain("no_success_criteria");
    expect(types).toContain("no_follow_up");
    expect(types).toContain("no_impact_assessed");
  });
});

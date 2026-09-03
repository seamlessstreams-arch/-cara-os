// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DEVELOPMENT PLAN SERVICE TESTS
// Pure-function unit tests for development plan metrics computation and
// alert identification.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing, type StaffDevelopmentPlanRecord } from "../staff-development-plan-service";
import { todayStr } from "@/lib/utils";

const { computeDevelopmentPlanMetrics, identifyDevelopmentPlanAlerts } = _testing;

const now = new Date(todayStr());

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal StaffDevelopmentPlanRecord with sensible defaults. */
function makeRecord(overrides?: Partial<StaffDevelopmentPlanRecord>): StaffDevelopmentPlanRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : "a-1",
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    development_area: "development_area" in (overrides ?? {}) ? overrides!.development_area! : "de_escalation",
    plan_status: "plan_status" in (overrides ?? {}) ? overrides!.plan_status! : "active",
    approval_status: "approval_status" in (overrides ?? {}) ? overrides!.approval_status! : "approved",
    priority_level: "priority_level" in (overrides ?? {}) ? overrides!.priority_level! : "medium",
    session_date: "session_date" in (overrides ?? {}) ? overrides!.session_date! : todayStr(),
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Staff A",
    created_by: "created_by" in (overrides ?? {}) ? overrides!.created_by! : "Manager A",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    possible_underlying_reason: "possible_underlying_reason" in (overrides ?? {}) ? (overrides!.possible_underlying_reason ?? null) : null,
    impact_description: "impact_description" in (overrides ?? {}) ? (overrides!.impact_description ?? null) : null,
    strengths_to_build_on: "strengths_to_build_on" in (overrides ?? {}) ? (overrides!.strengths_to_build_on ?? null) : null,
    manager_support_actions: "manager_support_actions" in (overrides ?? {}) ? (overrides!.manager_support_actions ?? null) : null,
    staff_actions_detail: "staff_actions_detail" in (overrides ?? {}) ? (overrides!.staff_actions_detail ?? null) : null,
    training_required: "training_required" in (overrides ?? {}) ? (overrides!.training_required ?? null) : null,
    mentoring_detail: "mentoring_detail" in (overrides ?? {}) ? (overrides!.mentoring_detail ?? null) : null,
    success_measures: "success_measures" in (overrides ?? {}) ? (overrides!.success_measures ?? null) : null,
    staff_response: "staff_response" in (overrides ?? {}) ? (overrides!.staff_response ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    development_area_detail: "development_area_detail" in (overrides ?? {}) ? overrides!.development_area_detail! : "Test detail",
    evidence_summary: "evidence_summary" in (overrides ?? {}) ? overrides!.evidence_summary! : "Test evidence",
    evidence_based: "evidence_based" in (overrides ?? {}) ? overrides!.evidence_based! : true,
    strengths_identified: "strengths_identified" in (overrides ?? {}) ? overrides!.strengths_identified! : true,
    staff_consulted: "staff_consulted" in (overrides ?? {}) ? overrides!.staff_consulted! : true,
    manager_actions_set: "manager_actions_set" in (overrides ?? {}) ? overrides!.manager_actions_set! : true,
    staff_actions_set: "staff_actions_set" in (overrides ?? {}) ? overrides!.staff_actions_set! : true,
    training_identified: "training_identified" in (overrides ?? {}) ? overrides!.training_identified! : true,
    mentoring_arranged: "mentoring_arranged" in (overrides ?? {}) ? overrides!.mentoring_arranged! : true,
    success_measures_set: "success_measures_set" in (overrides ?? {}) ? overrides!.success_measures_set! : true,
    review_date_set: "review_date_set" in (overrides ?? {}) ? overrides!.review_date_set! : true,
    staff_agreed: "staff_agreed" in (overrides ?? {}) ? overrides!.staff_agreed! : true,
    approved_by_senior: "approved_by_senior" in (overrides ?? {}) ? overrides!.approved_by_senior! : true,
    recorded_promptly: "recorded_promptly" in (overrides ?? {}) ? overrides!.recorded_promptly! : true,
    issues_found: "issues_found" in (overrides ?? {}) ? overrides!.issues_found! : [],
    actions_taken: "actions_taken" in (overrides ?? {}) ? overrides!.actions_taken! : [],
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeDevelopmentPlanMetrics ─────────────────────────────────────────────

describe("computeDevelopmentPlanMetrics", () => {
  it("returns zeros for empty", () => { 
    const m = computeDevelopmentPlanMetrics([]);
    expect(m.total_plans).toBe(0);;
    expect(m.urgent_count).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.pending_approval_count).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.evidence_based_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("returns empty breakdowns", () => { 
    const m = computeDevelopmentPlanMetrics([]);
    expect(m.by_development_area).toEqual({});
    expect(m.by_plan_status).toEqual({});
    expect(m.by_approval_status).toEqual({});
    expect(m.by_priority_level).toEqual({});
  });

  it("total_plans counts records", () => { const m = computeDevelopmentPlanMetrics([makeRecord(), makeRecord({ id: "a-2" })]); expect(m.total_plans).toBe(2); });

  it("counts urgent", () => { const m = computeDevelopmentPlanMetrics([makeRecord({ priority_level: "urgent" })]); expect(m.urgent_count).toBe(1); });

  it("does not count high as urgent", () => { const m = computeDevelopmentPlanMetrics([makeRecord({ priority_level: "high" })]); expect(m.urgent_count).toBe(0); });

  it("counts active", () => { const m = computeDevelopmentPlanMetrics([makeRecord({ plan_status: "active" })]); expect(m.active_count).toBe(1); });

  it("counts pending_approval", () => { const m = computeDevelopmentPlanMetrics([makeRecord({ approval_status: "pending" })]); expect(m.pending_approval_count).toBe(1); });

  it("does not count approved as pending", () => { const m = computeDevelopmentPlanMetrics([makeRecord({ approval_status: "approved" })]); expect(m.pending_approval_count).toBe(0); });

  it("counts completed", () => { const m = computeDevelopmentPlanMetrics([makeRecord({ plan_status: "completed" })]); expect(m.completed_count).toBe(1); });

  it("returns 100% boolean rates with defaults", () => { 
    const m = computeDevelopmentPlanMetrics([makeRecord()]);
    expect(m.evidence_based_rate).toBe(100);
    expect(m.strengths_identified_rate).toBe(100);
    expect(m.staff_consulted_rate).toBe(100);
    expect(m.manager_actions_rate).toBe(100);
    expect(m.staff_actions_rate).toBe(100);
    expect(m.training_identified_rate).toBe(100);
    expect(m.mentoring_arranged_rate).toBe(100);
    expect(m.success_measures_rate).toBe(100);
    expect(m.review_date_rate).toBe(100);
    expect(m.staff_agreed_rate).toBe(100);
    expect(m.approved_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("evidence_based_rate 0 when false", () => { const m = computeDevelopmentPlanMetrics([makeRecord({ evidence_based: false })]); expect(m.evidence_based_rate).toBe(0); });

  it("mixed boolean rate", () => { const m = computeDevelopmentPlanMetrics([makeRecord({ staff_consulted: true }), makeRecord({ id: "a-2", staff_consulted: true }), makeRecord({ id: "a-3", staff_consulted: false })]); expect(m.staff_consulted_rate).toBe(66.7); });

  it("unique_staff distinct", () => { const m = computeDevelopmentPlanMetrics([makeRecord({ staff_name: "A" }), makeRecord({ id: "a-2", staff_name: "B" }), makeRecord({ id: "a-3", staff_name: "A" })]); expect(m.unique_staff).toBe(2); });

  it("counts all 10 development areas", () => { const areas = ["de_escalation", "safeguarding_practice", "recording_quality", "medication_management", "care_planning", "communication", "leadership", "child_engagement", "team_working", "professional_boundaries"] as const; const records = areas.map((a, i) => makeRecord({ id: `a-${i}`, development_area: a })); const m = computeDevelopmentPlanMetrics(records); for (const a of areas) expect(m.by_development_area[a]).toBe(1); });

  it("counts all 5 plan statuses", () => { const statuses = ["draft", "active", "under_review", "completed", "cancelled"] as const; const records = statuses.map((s, i) => makeRecord({ id: `a-${i}`, plan_status: s })); const m = computeDevelopmentPlanMetrics(records); for (const s of statuses) expect(m.by_plan_status[s]).toBe(1); });

  it("counts all 5 approval statuses", () => { const statuses = ["pending", "approved", "returned", "withdrawn", "not_required"] as const; const records = statuses.map((s, i) => makeRecord({ id: `a-${i}`, approval_status: s })); const m = computeDevelopmentPlanMetrics(records); for (const s of statuses) expect(m.by_approval_status[s]).toBe(1); });

  it("counts all 5 priority levels", () => { const levels = ["urgent", "high", "medium", "low", "developmental"] as const; const records = levels.map((l, i) => makeRecord({ id: `a-${i}`, priority_level: l })); const m = computeDevelopmentPlanMetrics(records); for (const l of levels) expect(m.by_priority_level[l]).toBe(1); });
});

// ── identifyDevelopmentPlanAlerts ─────────────────────────────────────────────

describe("identifyDevelopmentPlanAlerts", () => {
  it("returns empty for clean", () => { const alerts = identifyDevelopmentPlanAlerts([makeRecord()]); expect(alerts).toEqual([]); });

  it("returns empty for empty", () => { const alerts = identifyDevelopmentPlanAlerts([]); expect(alerts).toEqual([]); });

  it("fires urgent_unapproved for urgent + pending", () => { 
    const alerts = identifyDevelopmentPlanAlerts([makeRecord({ priority_level: "urgent", approval_status: "pending", staff_name: "Jo" })]);
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("urgent_unapproved");
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("Jo");
  });

  it("urgent_unapproved per-record", () => { const alerts = identifyDevelopmentPlanAlerts([makeRecord({ priority_level: "urgent", approval_status: "pending" }), makeRecord({ id: "a-2", priority_level: "urgent", approval_status: "pending" })]); const matched = alerts.filter((a) => a.type === "urgent_unapproved"); expect(matched.length).toBe(2); });

  it("no critical when approved", () => { const alerts = identifyDevelopmentPlanAlerts([makeRecord({ priority_level: "urgent", approval_status: "approved" })]); const matched = alerts.filter((a) => a.type === "urgent_unapproved"); expect(matched.length).toBe(0); });

  it("no critical for medium priority", () => { const alerts = identifyDevelopmentPlanAlerts([makeRecord({ priority_level: "medium", approval_status: "pending" })]); const matched = alerts.filter((a) => a.type === "urgent_unapproved"); expect(matched.length).toBe(0); });

  it("fires no_staff_consulted singular", () => { 
    const alerts = identifyDevelopmentPlanAlerts([makeRecord({ staff_consulted: false })]);
    const matched = alerts.filter((a) => a.type === "no_staff_consulted");
    expect(matched.length).toBe(1);
    expect(matched[0].severity).toBe("high");
    expect(matched[0].message).toContain("1 plan has");
  });

  it("no_staff_consulted plural", () => { const alerts = identifyDevelopmentPlanAlerts([makeRecord({ staff_consulted: false }), makeRecord({ id: "a-2", staff_consulted: false })]); const matched = alerts.filter((a) => a.type === "no_staff_consulted"); expect(matched.length).toBe(1); expect(matched[0].message).toContain("2 plans have"); });

  it("fires no_strengths_identified singular", () => { 
    const alerts = identifyDevelopmentPlanAlerts([makeRecord({ strengths_identified: false })]);
    const matched = alerts.filter((a) => a.type === "no_strengths_identified");
    expect(matched.length).toBe(1);
    expect(matched[0].severity).toBe("high");
    expect(matched[0].message).toContain("1 plan has");
  });

  it("no_success_measures not for 1", () => { const alerts = identifyDevelopmentPlanAlerts([makeRecord({ success_measures_set: false })]); const matched = alerts.filter((a) => a.type === "no_success_measures"); expect(matched.length).toBe(0); });

  it("no_success_measures fires for 2", () => { const alerts = identifyDevelopmentPlanAlerts([makeRecord({ success_measures_set: false }), makeRecord({ id: "a-2", success_measures_set: false })]); const matched = alerts.filter((a) => a.type === "no_success_measures"); expect(matched.length).toBe(1); expect(matched[0].severity).toBe("medium"); });

  it("no_mentoring not for 1", () => { const alerts = identifyDevelopmentPlanAlerts([makeRecord({ mentoring_arranged: false })]); const matched = alerts.filter((a) => a.type === "no_mentoring"); expect(matched.length).toBe(0); });

  it("no_mentoring fires for 2", () => { const alerts = identifyDevelopmentPlanAlerts([makeRecord({ mentoring_arranged: false }), makeRecord({ id: "a-2", mentoring_arranged: false })]); const matched = alerts.filter((a) => a.type === "no_mentoring"); expect(matched.length).toBe(1); expect(matched[0].severity).toBe("medium"); });

  it("fires all applicable", () => { 
    const shared = { staff_consulted: false, strengths_identified: false, success_measures_set: false, mentoring_arranged: false } as const;
    const alerts = identifyDevelopmentPlanAlerts([makeRecord({ priority_level: "urgent", approval_status: "pending", ...shared }), makeRecord({ id: "a-2", ...shared })]);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("urgent_unapproved");
    expect(types).toContain("no_staff_consulted");
    expect(types).toContain("no_strengths_identified");
    expect(types).toContain("no_success_measures");
    expect(types).toContain("no_mentoring");
  });
});

describe("tri-state judgements", () => {
  it("does not dilute evidence-based with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) => makeRecord({ id: `p-${i}`, evidence_based: v }));
    expect(computeDevelopmentPlanMetrics(rows).evidence_based_rate).toBe(100);
  });
  it("still scores a recorded not-evidence-based plan", () => {
    const rows = [true, false].map((v, i) => makeRecord({ id: `p-${i}`, evidence_based: v }));
    expect(computeDevelopmentPlanMetrics(rows).evidence_based_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF REVIEW OUTCOME SERVICE TESTS
// Pure-function unit tests for review outcome metrics computation and alert
// identification. Covers all counting logic, boolean rates, breakdowns,
// and alert thresholds/severity.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing, type StaffReviewOutcomeRecord } from "../staff-review-outcome-service";
import { todayStr } from "@/lib/utils";

const { computeReviewOutcomeMetrics, identifyReviewOutcomeAlerts } = _testing;

const now = new Date(todayStr());

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRecord(overrides?: Partial<StaffReviewOutcomeRecord>): StaffReviewOutcomeRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : "a-1",
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    review_type: "review_type" in (overrides ?? {}) ? overrides!.review_type! : "supervision",
    review_outcome: "review_outcome" in (overrides ?? {}) ? overrides!.review_outcome! : "good",
    outcome_status: "outcome_status" in (overrides ?? {}) ? overrides!.outcome_status! : "finalised",
    follow_up_urgency: "follow_up_urgency" in (overrides ?? {}) ? overrides!.follow_up_urgency! : "next_review",
    session_date: "session_date" in (overrides ?? {}) ? overrides!.session_date! : todayStr(),
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Staff A",
    reviewed_by: "reviewed_by" in (overrides ?? {}) ? overrides!.reviewed_by! : "Manager A",
    strengths_discussed: "strengths_discussed" in (overrides ?? {}) ? overrides!.strengths_discussed! : "Test strengths",
    areas_for_development: "areas_for_development" in (overrides ?? {}) ? overrides!.areas_for_development! : "Test areas",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    agreed_actions: "agreed_actions" in (overrides ?? {}) ? (overrides!.agreed_actions ?? null) : null,
    staff_response: "staff_response" in (overrides ?? {}) ? (overrides!.staff_response ?? null) : null,
    support_identified: "support_identified" in (overrides ?? {}) ? (overrides!.support_identified ?? null) : null,
    training_needs: "training_needs" in (overrides ?? {}) ? (overrides!.training_needs ?? null) : null,
    concerns_raised: "concerns_raised" in (overrides ?? {}) ? (overrides!.concerns_raised ?? null) : null,
    previous_actions_progress: "previous_actions_progress" in (overrides ?? {}) ? (overrides!.previous_actions_progress ?? null) : null,
    manager_notes: "manager_notes" in (overrides ?? {}) ? (overrides!.manager_notes ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    strengths_acknowledged: "strengths_acknowledged" in (overrides ?? {}) ? overrides!.strengths_acknowledged! : true,
    development_discussed: "development_discussed" in (overrides ?? {}) ? overrides!.development_discussed! : true,
    actions_agreed: "actions_agreed" in (overrides ?? {}) ? overrides!.actions_agreed! : true,
    staff_views_recorded: "staff_views_recorded" in (overrides ?? {}) ? overrides!.staff_views_recorded! : true,
    wellbeing_discussed: "wellbeing_discussed" in (overrides ?? {}) ? overrides!.wellbeing_discussed! : true,
    training_needs_identified: "training_needs_identified" in (overrides ?? {}) ? overrides!.training_needs_identified! : true,
    previous_actions_reviewed: "previous_actions_reviewed" in (overrides ?? {}) ? overrides!.previous_actions_reviewed! : true,
    support_offered: "support_offered" in (overrides ?? {}) ? overrides!.support_offered! : true,
    safeguarding_discussed: "safeguarding_discussed" in (overrides ?? {}) ? overrides!.safeguarding_discussed! : true,
    record_shared_with_staff: "record_shared_with_staff" in (overrides ?? {}) ? overrides!.record_shared_with_staff! : true,
    approved_by_senior: "approved_by_senior" in (overrides ?? {}) ? overrides!.approved_by_senior! : true,
    recorded_promptly: "recorded_promptly" in (overrides ?? {}) ? overrides!.recorded_promptly! : true,
    issues_found: "issues_found" in (overrides ?? {}) ? overrides!.issues_found! : [],
    actions_taken: "actions_taken" in (overrides ?? {}) ? overrides!.actions_taken! : [],
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeReviewOutcomeMetrics ──────────────────────────────────────────────

describe("computeReviewOutcomeMetrics", () => {
  it("returns zeros for empty", () => { 
    const m = computeReviewOutcomeMetrics([]);
    expect(m.total_reviews).toBe(0);;
    expect(m.needs_improvement_count).toBe(0);
    expect(m.immediate_followup_count).toBe(0);
    expect(m.disputed_count).toBe(0);
    expect(m.finalised_count).toBe(0);
    expect(m.strengths_acknowledged_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("returns empty breakdowns", () => { 
    const m = computeReviewOutcomeMetrics([]);
    expect(m.by_review_type).toEqual({});
    expect(m.by_review_outcome).toEqual({});
    expect(m.by_outcome_status).toEqual({});
    expect(m.by_follow_up_urgency).toEqual({});
  });

  it("total_reviews counts records", () => { expect(computeReviewOutcomeMetrics([makeRecord(), makeRecord({ id: "a-2" })]).total_reviews).toBe(2); });

  it("counts needs_improvement", () => { expect(computeReviewOutcomeMetrics([makeRecord({ review_outcome: "needs_improvement" })]).needs_improvement_count).toBe(1); });

  it("counts unsatisfactory as needs_improvement", () => { expect(computeReviewOutcomeMetrics([makeRecord({ review_outcome: "unsatisfactory" })]).needs_improvement_count).toBe(1); });

  it("does not count satisfactory as needs_improvement", () => { expect(computeReviewOutcomeMetrics([makeRecord({ review_outcome: "satisfactory" })]).needs_improvement_count).toBe(0); });

  it("counts immediate followup", () => { expect(computeReviewOutcomeMetrics([makeRecord({ follow_up_urgency: "immediate" })]).immediate_followup_count).toBe(1); });

  it("counts disputed", () => { expect(computeReviewOutcomeMetrics([makeRecord({ outcome_status: "disputed" })]).disputed_count).toBe(1); });

  it("counts under_appeal as disputed", () => { expect(computeReviewOutcomeMetrics([makeRecord({ outcome_status: "under_appeal" })]).disputed_count).toBe(1); });

  it("does not count draft as disputed", () => { expect(computeReviewOutcomeMetrics([makeRecord({ outcome_status: "draft" })]).disputed_count).toBe(0); });

  it("counts finalised", () => { expect(computeReviewOutcomeMetrics([makeRecord({ outcome_status: "finalised" })]).finalised_count).toBe(1); });

  it("returns 100% boolean rates with defaults", () => { 
    const m = computeReviewOutcomeMetrics([makeRecord()]);
    expect(m.strengths_acknowledged_rate).toBe(100);
    expect(m.development_discussed_rate).toBe(100);
    expect(m.actions_agreed_rate).toBe(100);
    expect(m.staff_views_rate).toBe(100);
    expect(m.wellbeing_discussed_rate).toBe(100);
    expect(m.training_needs_rate).toBe(100);
    expect(m.previous_actions_rate).toBe(100);
    expect(m.support_offered_rate).toBe(100);
    expect(m.safeguarding_discussed_rate).toBe(100);
    expect(m.record_shared_rate).toBe(100);
    expect(m.approved_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("strengths_acknowledged_rate 0 when false", () => { expect(computeReviewOutcomeMetrics([makeRecord({ strengths_acknowledged: false })]).strengths_acknowledged_rate).toBe(0); });

  it("mixed boolean rate", () => { const m = computeReviewOutcomeMetrics([makeRecord({ id: "a-1" }), makeRecord({ id: "a-2" }), makeRecord({ id: "a-3", wellbeing_discussed: false })]); expect(m.wellbeing_discussed_rate).toBe(66.7); });

  it("unique_staff distinct", () => { expect(computeReviewOutcomeMetrics([makeRecord({ id: "a-1", staff_name: "A" }), makeRecord({ id: "a-2", staff_name: "B" }), makeRecord({ id: "a-3", staff_name: "A" })]).unique_staff).toBe(2); });

  it("counts all 10 review types", () => { const types = ["supervision", "probation_review", "annual_appraisal", "return_to_work", "performance_conversation", "informal_check_in", "capability_review", "sickness_review", "team_review", "other"] as const; const recs = types.map((t, i) => makeRecord({ id: `a-${i}`, review_type: t })); const m = computeReviewOutcomeMetrics(recs); for (const t of types) expect(m.by_review_type[t]).toBe(1); });

  it("counts all 5 outcomes", () => { const outcomes = ["excellent", "good", "satisfactory", "needs_improvement", "unsatisfactory"] as const; const recs = outcomes.map((o, i) => makeRecord({ id: `a-${i}`, review_outcome: o })); const m = computeReviewOutcomeMetrics(recs); for (const o of outcomes) expect(m.by_review_outcome[o]).toBe(1); });

  it("counts all 5 outcome statuses", () => { const statuses = ["draft", "agreed", "disputed", "under_appeal", "finalised"] as const; const recs = statuses.map((s, i) => makeRecord({ id: `a-${i}`, outcome_status: s })); const m = computeReviewOutcomeMetrics(recs); for (const s of statuses) expect(m.by_outcome_status[s]).toBe(1); });

  it("counts all 5 follow_up urgencies", () => { const urgencies = ["immediate", "within_week", "within_month", "next_review", "none_required"] as const; const recs = urgencies.map((u, i) => makeRecord({ id: `a-${i}`, follow_up_urgency: u })); const m = computeReviewOutcomeMetrics(recs); for (const u of urgencies) expect(m.by_follow_up_urgency[u]).toBe(1); });
});

// ── identifyReviewOutcomeAlerts ──────────────────────────────────────────────

describe("identifyReviewOutcomeAlerts", () => {
  it("returns empty for clean", () => { expect(identifyReviewOutcomeAlerts([makeRecord()])).toEqual([]); });

  it("returns empty for empty", () => { expect(identifyReviewOutcomeAlerts([])).toEqual([]); });

  it("fires immediate_unsatisfactory for immediate + needs_improvement", () => { const a = identifyReviewOutcomeAlerts([makeRecord({ follow_up_urgency: "immediate", review_outcome: "needs_improvement", staff_name: "Jane" })]); expect(a.some((x) => x.type === "immediate_unsatisfactory" && x.severity === "critical" && x.message.includes("Jane"))).toBe(true); });

  it("fires for immediate + unsatisfactory", () => { const a = identifyReviewOutcomeAlerts([makeRecord({ follow_up_urgency: "immediate", review_outcome: "unsatisfactory" })]); expect(a.some((x) => x.type === "immediate_unsatisfactory" && x.severity === "critical")).toBe(true); });

  it("no critical when immediate + good", () => { const a = identifyReviewOutcomeAlerts([makeRecord({ follow_up_urgency: "immediate", review_outcome: "good" })]); expect(a.some((x) => x.type === "immediate_unsatisfactory")).toBe(false); });

  it("no critical when next_review + unsatisfactory", () => { const a = identifyReviewOutcomeAlerts([makeRecord({ follow_up_urgency: "next_review", review_outcome: "unsatisfactory" })]); expect(a.some((x) => x.type === "immediate_unsatisfactory")).toBe(false); });

  it("per-record", () => { const a = identifyReviewOutcomeAlerts([makeRecord({ id: "a-1", follow_up_urgency: "immediate", review_outcome: "unsatisfactory" }), makeRecord({ id: "a-2", follow_up_urgency: "immediate", review_outcome: "needs_improvement" })]); expect(a.filter((x) => x.type === "immediate_unsatisfactory")).toHaveLength(2); });

  it("fires staff_views_not_recorded", () => { 
    const a = identifyReviewOutcomeAlerts([makeRecord({ staff_views_recorded: false })]);
    const hit = a.find((x) => x.type === "staff_views_not_recorded");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
    expect(hit!.message).toContain("1 review has");
  });

  it("staff_views_not_recorded plural", () => { const a = identifyReviewOutcomeAlerts([makeRecord({ id: "a-1", staff_views_recorded: false }), makeRecord({ id: "a-2", staff_views_recorded: false })]); expect(a.find((x) => x.type === "staff_views_not_recorded")!.message).toContain("2 reviews have"); });

  it("fires no_strengths_acknowledged", () => { const a = identifyReviewOutcomeAlerts([makeRecord({ strengths_acknowledged: false })]); const hit = a.find((x) => x.type === "no_strengths_acknowledged"); expect(hit).toBeDefined(); expect(hit!.severity).toBe("high"); });

  it("no_wellbeing_discussed not for 1", () => { expect(identifyReviewOutcomeAlerts([makeRecord({ wellbeing_discussed: false })]).some((x) => x.type === "no_wellbeing_discussed")).toBe(false); });

  it("no_wellbeing_discussed fires for 2", () => { const a = identifyReviewOutcomeAlerts([makeRecord({ id: "a-1", wellbeing_discussed: false }), makeRecord({ id: "a-2", wellbeing_discussed: false })]); const hit = a.find((x) => x.type === "no_wellbeing_discussed"); expect(hit).toBeDefined(); expect(hit!.severity).toBe("medium"); });

  it("no_safeguarding_discussed not for 1", () => { expect(identifyReviewOutcomeAlerts([makeRecord({ safeguarding_discussed: false })]).some((x) => x.type === "no_safeguarding_discussed")).toBe(false); });

  it("no_safeguarding_discussed fires for 2", () => { const a = identifyReviewOutcomeAlerts([makeRecord({ id: "a-1", safeguarding_discussed: false }), makeRecord({ id: "a-2", safeguarding_discussed: false })]); const hit = a.find((x) => x.type === "no_safeguarding_discussed"); expect(hit).toBeDefined(); expect(hit!.severity).toBe("medium"); });

  it("fires all applicable", () => { 
    const rec = makeRecord({ follow_up_urgency: "immediate", review_outcome: "unsatisfactory", staff_views_recorded: false, strengths_acknowledged: false, wellbeing_discussed: false, safeguarding_discussed: false });
    const a = identifyReviewOutcomeAlerts([rec, makeRecord({ id: "a-2", wellbeing_discussed: false, safeguarding_discussed: false })]);
    const types = a.map((x) => x.type);
    expect(types).toContain("immediate_unsatisfactory");
    expect(types).toContain("staff_views_not_recorded");
    expect(types).toContain("no_strengths_acknowledged");
    expect(types).toContain("no_wellbeing_discussed");
    expect(types).toContain("no_safeguarding_discussed");
  });
});

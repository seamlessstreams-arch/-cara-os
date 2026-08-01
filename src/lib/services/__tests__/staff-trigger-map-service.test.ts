import { describe, it, expect } from "vitest";
import { _testing, type StaffTriggerMapRecord } from "../staff-trigger-map-service";
const { computeTriggerMapMetrics, identifyTriggerMapAlerts } = _testing;
const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<StaffTriggerMapRecord>): StaffTriggerMapRecord {
  return {
    id: "a-1",
    home_id: "home-1",
    trigger_category: "workload",
    trigger_severity: "moderate",
    coping_effectiveness: "effective",
    map_status: "active",
    session_date: now.toISOString().split("T")[0],
    staff_name: "Staff A",
    identified_by: "Manager A",
    trigger_description: "Test trigger",
    context_when_triggered: "Test context",
    observable_response: "Test response",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    impact_on_practice: "impact_on_practice" in (overrides ?? {}) ? (overrides!.impact_on_practice ?? null) : null,
    current_coping_strategies: "current_coping_strategies" in (overrides ?? {}) ? (overrides!.current_coping_strategies ?? null) : null,
    support_strategies: "support_strategies" in (overrides ?? {}) ? (overrides!.support_strategies ?? null) : null,
    environmental_adjustments: "environmental_adjustments" in (overrides ?? {}) ? (overrides!.environmental_adjustments ?? null) : null,
    supervision_response: "supervision_response" in (overrides ?? {}) ? (overrides!.supervision_response ?? null) : null,
    staff_self_awareness: "staff_self_awareness" in (overrides ?? {}) ? (overrides!.staff_self_awareness ?? null) : null,
    staff_comment: "staff_comment" in (overrides ?? {}) ? (overrides!.staff_comment ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    evidence_documented: true,
    staff_involved: true,
    triggers_explored: true,
    coping_strategies_identified: true,
    support_plan_linked: true,
    environmental_factors_considered: true,
    supervision_adjusted: true,
    wellbeing_checked: true,
    manager_reviewed: true,
    team_aware_if_appropriate: true,
    follow_up_scheduled: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

describe("computeTriggerMapMetrics", () => {
  it("returns zeros for empty", () => { 
    const m = computeTriggerMapMetrics([]);
    expect(m.total_maps).toBe(0);;
    expect(m.severe_count).toBe(0);
    expect(m.ineffective_coping_count).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.unreviewed_count).toBe(0);
    expect(m.evidence_documented_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });
  it("returns empty breakdowns", () => { 
    const m = computeTriggerMapMetrics([]);
    expect(m.by_trigger_category).toEqual({});
    expect(m.by_trigger_severity).toEqual({});
    expect(m.by_coping_effectiveness).toEqual({});
    expect(m.by_map_status).toEqual({});
  });
  it("total_maps counts records", () => { expect(computeTriggerMapMetrics([makeRecord(), makeRecord({ id: "a-2" })]).total_maps).toBe(2); });
  it("counts severe as severe_count", () => { expect(computeTriggerMapMetrics([makeRecord({ trigger_severity: "severe" })]).severe_count).toBe(1); });
  it("counts overwhelming as severe_count", () => { expect(computeTriggerMapMetrics([makeRecord({ trigger_severity: "overwhelming" })]).severe_count).toBe(1); });
  it("does not count significant as severe_count", () => { expect(computeTriggerMapMetrics([makeRecord({ trigger_severity: "significant" })]).severe_count).toBe(0); });
  it("counts ineffective coping", () => { expect(computeTriggerMapMetrics([makeRecord({ coping_effectiveness: "ineffective" })]).ineffective_coping_count).toBe(1); });
  it("counts counterproductive coping", () => { expect(computeTriggerMapMetrics([makeRecord({ coping_effectiveness: "counterproductive" })]).ineffective_coping_count).toBe(1); });
  it("does not count partially_effective as ineffective", () => { expect(computeTriggerMapMetrics([makeRecord({ coping_effectiveness: "partially_effective" })]).ineffective_coping_count).toBe(0); });
  it("counts active", () => { expect(computeTriggerMapMetrics([makeRecord({ map_status: "active" })]).active_count).toBe(1); });
  it("counts draft as unreviewed", () => { expect(computeTriggerMapMetrics([makeRecord({ map_status: "draft" })]).unreviewed_count).toBe(1); });
  it("counts under_review as unreviewed", () => { expect(computeTriggerMapMetrics([makeRecord({ map_status: "under_review" })]).unreviewed_count).toBe(1); });
  it("does not count active as unreviewed", () => { expect(computeTriggerMapMetrics([makeRecord({ map_status: "active" })]).unreviewed_count).toBe(0); });
  it("returns 100% boolean rates with defaults", () => { 
    const m = computeTriggerMapMetrics([makeRecord()]);
    expect(m.evidence_documented_rate).toBe(100);
    expect(m.staff_involved_rate).toBe(100);
    expect(m.triggers_explored_rate).toBe(100);
    expect(m.coping_strategies_rate).toBe(100);
    expect(m.support_plan_linked_rate).toBe(100);
    expect(m.environmental_factors_rate).toBe(100);
    expect(m.supervision_adjusted_rate).toBe(100);
    expect(m.wellbeing_checked_rate).toBe(100);
    expect(m.manager_reviewed_rate).toBe(100);
    expect(m.team_aware_rate).toBe(100);
    expect(m.follow_up_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });
  it("evidence_documented_rate 0 when false", () => { expect(computeTriggerMapMetrics([makeRecord({ evidence_documented: false })]).evidence_documented_rate).toBe(0); });
  it("mixed boolean rate", () => { expect(computeTriggerMapMetrics([makeRecord({ id: "a-1" }), makeRecord({ id: "a-2" }), makeRecord({ id: "a-3", wellbeing_checked: false })]).wellbeing_checked_rate).toBe(66.7); });
  it("unique_staff distinct", () => { expect(computeTriggerMapMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]).unique_staff).toBe(2); });
  it("counts all 10 trigger categories", () => { const cats = ["environmental", "interpersonal", "workload", "child_behaviour", "team_conflict", "personal_stress", "organisational_change", "shift_pattern", "safeguarding_pressure", "other"] as const; const recs = cats.map((c, i) => makeRecord({ id: `a-${i}`, trigger_category: c })); const m = computeTriggerMapMetrics(recs); for (const c of cats) expect(m.by_trigger_category[c]).toBe(1); });
  it("counts all 5 severities, coping levels, statuses", () => { const sevs = ["mild", "moderate", "significant", "severe", "overwhelming"] as const; const cops = ["very_effective", "effective", "partially_effective", "ineffective", "counterproductive"] as const; const stats = ["draft", "active", "under_review", "resolved", "archived"] as const; const recs = sevs.map((s, i) => makeRecord({ id: `a-${i}`, trigger_severity: s, coping_effectiveness: cops[i], map_status: stats[i] })); const m = computeTriggerMapMetrics(recs); for (const s of sevs) expect(m.by_trigger_severity[s]).toBe(1); for (const c of cops) expect(m.by_coping_effectiveness[c]).toBe(1); for (const st of stats) expect(m.by_map_status[st]).toBe(1); });
});

describe("identifyTriggerMapAlerts", () => {
  it("returns empty for clean", () => { expect(identifyTriggerMapAlerts([makeRecord()])).toEqual([]); });
  it("returns empty for empty", () => { expect(identifyTriggerMapAlerts([])).toEqual([]); });
  it("fires severe_ineffective_coping for severe + ineffective", () => { 
    const a = identifyTriggerMapAlerts([makeRecord({ trigger_severity: "severe", coping_effectiveness: "ineffective" })]);
    expect(a).toHaveLength(1);
    expect(a[0].type).toBe("severe_ineffective_coping");
    expect(a[0].severity).toBe("critical");
    expect(a[0].message).toContain("Staff A");
    expect(a[0].record_id).toBe("a-1");
  });
  it("fires for overwhelming + counterproductive", () => { const a = identifyTriggerMapAlerts([makeRecord({ trigger_severity: "overwhelming", coping_effectiveness: "counterproductive" })]); expect(a[0].severity).toBe("critical"); });
  it("per-record", () => { const a = identifyTriggerMapAlerts([makeRecord({ id: "a-1", trigger_severity: "severe", coping_effectiveness: "ineffective" }), makeRecord({ id: "a-2", trigger_severity: "overwhelming", coping_effectiveness: "counterproductive" })]); expect(a.filter((x) => x.type === "severe_ineffective_coping")).toHaveLength(2); });
  it("no critical when severe + effective", () => { expect(identifyTriggerMapAlerts([makeRecord({ trigger_severity: "severe", coping_effectiveness: "effective" })])).toEqual([]); });
  it("no critical when moderate + ineffective", () => { expect(identifyTriggerMapAlerts([makeRecord({ trigger_severity: "moderate", coping_effectiveness: "ineffective" })])).toEqual([]); });
  it("fires staff_not_involved singular", () => { 
    const a = identifyTriggerMapAlerts([makeRecord({ staff_involved: false })]);
    const f = a.find((x) => x.type === "staff_not_involved");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("high");
    expect(f!.message).toContain("1 trigger map has");
  });
  it("staff_not_involved plural", () => { const a = identifyTriggerMapAlerts([makeRecord({ id: "a-1", staff_involved: false }), makeRecord({ id: "a-2", staff_involved: false })]); const f = a.find((x) => x.type === "staff_not_involved"); expect(f!.message).toContain("2 trigger maps have"); });
  it("fires no_coping_strategies", () => { 
    const a = identifyTriggerMapAlerts([makeRecord({ coping_strategies_identified: false })]);
    const f = a.find((x) => x.type === "no_coping_strategies");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("high");
    expect(a.filter((x) => x.type === "no_coping_strategies").length).toBeGreaterThanOrEqual(1);
  });
  it("no_environmental_factors not for 1", () => { expect(identifyTriggerMapAlerts([makeRecord({ environmental_factors_considered: false })]).find((x) => x.type === "no_environmental_factors")).toBeUndefined(); });
  it("no_environmental_factors fires for 2", () => { const a = identifyTriggerMapAlerts([makeRecord({ id: "a-1", environmental_factors_considered: false }), makeRecord({ id: "a-2", environmental_factors_considered: false })]); const f = a.find((x) => x.type === "no_environmental_factors"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); });
  it("no_wellbeing_check not for 1", () => { expect(identifyTriggerMapAlerts([makeRecord({ wellbeing_checked: false })]).find((x) => x.type === "no_wellbeing_check")).toBeUndefined(); });
  it("no_wellbeing_check fires for 2", () => { const a = identifyTriggerMapAlerts([makeRecord({ id: "a-1", wellbeing_checked: false }), makeRecord({ id: "a-2", wellbeing_checked: false })]); const f = a.find((x) => x.type === "no_wellbeing_check"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); });
  it("fires all applicable", () => { 
    const recs = [makeRecord({ id: "a-1", trigger_severity: "severe", coping_effectiveness: "ineffective", staff_involved: false, coping_strategies_identified: false, environmental_factors_considered: false, wellbeing_checked: false }), makeRecord({ id: "a-2", trigger_severity: "overwhelming", coping_effectiveness: "counterproductive", staff_involved: false, coping_strategies_identified: false, environmental_factors_considered: false, wellbeing_checked: false })];
    const a = identifyTriggerMapAlerts(recs);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("severe_ineffective_coping")).toBe(true);
    expect(types.has("staff_not_involved")).toBe(true);
    expect(types.has("no_coping_strategies")).toBe(true);
    expect(types.has("no_environmental_factors")).toBe(true);
    expect(types.has("no_wellbeing_check")).toBe(true);
    expect(types.size).toBe(5);
  });
});

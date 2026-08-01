import { describe, it, expect } from "vitest";
import {
  computeTriggerMapMetrics,
  identifyTriggerMapAlerts,
} from "./staff-trigger-map-service";
import type { StaffTriggerMapRecord } from "./staff-trigger-map-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffTriggerMapRecord> = {}): StaffTriggerMapRecord {
  return {
    id: "tm-1",
    home_id: "home-1",
    staff_name: "Staff A",
    staff_id: "s-1",
    trigger_category: "workload",
    trigger_severity: "moderate",
    coping_effectiveness: "effective",
    map_status: "active",
    session_date: "2026-05-01",
    identified_by: "Manager",
    trigger_description: "Heavy caseload",
    context_when_triggered: "During shift",
    observable_response: "Increased anxiety",
    impact_on_practice: null,
    current_coping_strategies: null,
    support_strategies: null,
    environmental_adjustments: null,
    supervision_response: null,
    staff_self_awareness: null,
    staff_comment: null,
    approved_by: null,
    approved_at: null,
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
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeTriggerMapMetrics -------------------------------------------------

describe("computeTriggerMapMetrics", () => {
  it("returns zeroes for empty array", () => {
    const r = computeTriggerMapMetrics([]);
    expect(r.total_maps).toBe(0);
    expect(r.severe_count).toBe(0);
    expect(r.ineffective_coping_count).toBe(0);
    expect(r.active_count).toBe(0);
    expect(r.unreviewed_count).toBe(0);
    expect(r.evidence_documented_rate).toBeNull();;
    expect(r.staff_involved_rate).toBeNull();;
    expect(r.unique_staff).toBe(0);
  });

  it("counts severe (severe + overwhelming) records", () => {
    const records = [
      makeRecord({ id: "1", trigger_severity: "severe" }),
      makeRecord({ id: "2", trigger_severity: "overwhelming" }),
      makeRecord({ id: "3", trigger_severity: "moderate" }),
    ];
    expect(computeTriggerMapMetrics(records).severe_count).toBe(2);
  });

  it("counts ineffective coping (ineffective + counterproductive)", () => {
    const records = [
      makeRecord({ id: "1", coping_effectiveness: "ineffective" }),
      makeRecord({ id: "2", coping_effectiveness: "counterproductive" }),
      makeRecord({ id: "3", coping_effectiveness: "effective" }),
    ];
    expect(computeTriggerMapMetrics(records).ineffective_coping_count).toBe(2);
  });

  it("counts active and unreviewed (draft + under_review)", () => {
    const records = [
      makeRecord({ id: "1", map_status: "active" }),
      makeRecord({ id: "2", map_status: "draft" }),
      makeRecord({ id: "3", map_status: "under_review" }),
      makeRecord({ id: "4", map_status: "resolved" }),
    ];
    const r = computeTriggerMapMetrics(records);
    expect(r.active_count).toBe(1);
    expect(r.unreviewed_count).toBe(2);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", evidence_documented: true, staff_involved: true }),
      makeRecord({ id: "2", evidence_documented: false, staff_involved: false }),
    ];
    const r = computeTriggerMapMetrics(records);
    expect(r.evidence_documented_rate).toBe(50);
    expect(r.staff_involved_rate).toBe(50);
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Bob" }),
      makeRecord({ id: "3", staff_name: "Alice" }),
    ];
    expect(computeTriggerMapMetrics(records).unique_staff).toBe(2);
  });

  it("populates breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", trigger_category: "workload", trigger_severity: "mild", coping_effectiveness: "effective", map_status: "active" }),
      makeRecord({ id: "2", trigger_category: "interpersonal", trigger_severity: "severe", coping_effectiveness: "ineffective", map_status: "draft" }),
    ];
    const r = computeTriggerMapMetrics(records);
    expect(r.by_trigger_category).toEqual({ workload: 1, interpersonal: 1 });
    expect(r.by_trigger_severity).toEqual({ mild: 1, severe: 1 });
    expect(r.by_coping_effectiveness).toEqual({ effective: 1, ineffective: 1 });
    expect(r.by_map_status).toEqual({ active: 1, draft: 1 });
  });
});

// -- identifyTriggerMapAlerts -------------------------------------------------

describe("identifyTriggerMapAlerts", () => {
  it("returns empty for empty array", () => {
    expect(identifyTriggerMapAlerts([])).toEqual([]);
  });

  it("fires severe_ineffective_coping for severe + ineffective", () => {
    const records = [
      makeRecord({ trigger_severity: "severe", coping_effectiveness: "ineffective" }),
    ];
    const alerts = identifyTriggerMapAlerts(records);
    const a = alerts.filter((x) => x.type === "severe_ineffective_coping");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires severe_ineffective_coping for overwhelming + counterproductive", () => {
    const records = [
      makeRecord({ trigger_severity: "overwhelming", coping_effectiveness: "counterproductive" }),
    ];
    const alerts = identifyTriggerMapAlerts(records);
    expect(alerts.filter((x) => x.type === "severe_ineffective_coping")).toHaveLength(1);
  });

  it("fires staff_not_involved when >= 1 record has staff_involved false", () => {
    const records = [
      makeRecord({ staff_involved: false }),
    ];
    const alerts = identifyTriggerMapAlerts(records);
    const a = alerts.filter((x) => x.type === "staff_not_involved");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("high");
  });

  it("fires no_coping_strategies when >= 1 record has no coping strategies", () => {
    const records = [
      makeRecord({ coping_strategies_identified: false }),
    ];
    const alerts = identifyTriggerMapAlerts(records);
    expect(alerts.filter((x) => x.type === "no_coping_strategies")).toHaveLength(1);
  });

  it("fires no_environmental_factors at threshold of 2", () => {
    const records = [
      makeRecord({ id: "1", environmental_factors_considered: false }),
      makeRecord({ id: "2", environmental_factors_considered: false }),
    ];
    const alerts = identifyTriggerMapAlerts(records);
    expect(alerts.filter((x) => x.type === "no_environmental_factors")).toHaveLength(1);
  });

  it("does NOT fire no_environmental_factors for only 1 record", () => {
    const records = [
      makeRecord({ environmental_factors_considered: false }),
    ];
    const alerts = identifyTriggerMapAlerts(records);
    expect(alerts.filter((x) => x.type === "no_environmental_factors")).toHaveLength(0);
  });

  it("fires no_wellbeing_check at threshold of 2", () => {
    const records = [
      makeRecord({ id: "1", wellbeing_checked: false }),
      makeRecord({ id: "2", wellbeing_checked: false }),
    ];
    const alerts = identifyTriggerMapAlerts(records);
    const a = alerts.filter((x) => x.type === "no_wellbeing_check");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("medium");
  });
});

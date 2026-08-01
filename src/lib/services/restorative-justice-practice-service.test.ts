import { describe, it, expect } from "vitest";
import {
  computeRestorativeJusticeMetrics,
  identifyRestorativeJusticeAlerts,
  type RestorativeJusticePracticeRecord,
} from "./restorative-justice-practice-service";

function makeRecord(overrides: Partial<RestorativeJusticePracticeRecord> = {}): RestorativeJusticePracticeRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    practice_type: "restorative_conversation",
    outcome_level: "fully_resolved",
    participation_willingness: "fully_willing",
    relationship_impact: "improved",
    session_date: "2025-04-01",
    child_name: "Child A",
    child_id: "c1",
    facilitated_by: "Staff A",
    child_voice_heard: true,
    victim_supported: true,
    voluntary_participation: true,
    agreement_reached: true,
    follow_up_planned: true,
    empathy_demonstrated: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    staff_trained: true,
    safeguarding_considered: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2025-04-01T00:00:00Z",
    updated_at: "2025-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeRestorativeJusticeMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeRestorativeJusticeMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.escalated_count).toBe(0);
    expect(m.unresolved_count).toBe(0);
    expect(m.coerced_count).toBe(0);
    expect(m.worsened_count).toBe(0);
    expect(m.child_voice_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts problem outcomes", () => {
    const records = [
      makeRecord({ outcome_level: "escalated" }),
      makeRecord({ id: "r2", outcome_level: "unresolved" }),
      makeRecord({ id: "r3", participation_willingness: "coerced" }),
      makeRecord({ id: "r4", relationship_impact: "worsened" }),
      makeRecord({ id: "r5", relationship_impact: "significantly_worsened" }),
    ];
    const m = computeRestorativeJusticeMetrics(records);
    expect(m.escalated_count).toBe(1);
    expect(m.unresolved_count).toBe(1);
    expect(m.coerced_count).toBe(1);
    expect(m.worsened_count).toBe(2); // worsened + significantly_worsened
  });

  it("calculates boolean rates at 100%", () => {
    const records = [makeRecord(), makeRecord({ id: "r2" })];
    const m = computeRestorativeJusticeMetrics(records);
    expect(m.child_voice_rate).toBe(100);
    expect(m.victim_supported_rate).toBe(100);
    expect(m.voluntary_rate).toBe(100);
    expect(m.agreement_rate).toBe(100);
    expect(m.follow_up_rate).toBe(100);
    expect(m.empathy_rate).toBe(100);
    expect(m.staff_trained_rate).toBe(100);
    expect(m.safeguarding_rate).toBe(100);
  });

  it("calculates 50% rates with mixed values", () => {
    const records = [
      makeRecord({ child_voice_heard: true }),
      makeRecord({ id: "r2", child_voice_heard: false }),
    ];
    const m = computeRestorativeJusticeMetrics(records);
    expect(m.child_voice_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ id: "r2", child_name: "Alice" }),
      makeRecord({ id: "r3", child_name: "Bob" }),
    ];
    const m = computeRestorativeJusticeMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdowns by category", () => {
    const records = [
      makeRecord({ practice_type: "peer_mediation", outcome_level: "fully_resolved" }),
      makeRecord({ id: "r2", practice_type: "peer_mediation", outcome_level: "unresolved" }),
      makeRecord({ id: "r3", practice_type: "circle_time", outcome_level: "fully_resolved" }),
    ];
    const m = computeRestorativeJusticeMetrics(records);
    expect(m.by_practice_type).toEqual({ peer_mediation: 2, circle_time: 1 });
    expect(m.by_outcome_level).toEqual({ fully_resolved: 2, unresolved: 1 });
  });
});

describe("identifyRestorativeJusticeAlerts", () => {
  it("returns empty for no data", () => {
    expect(identifyRestorativeJusticeAlerts([])).toEqual([]);
  });

  it("critical alert for coerced + worsened relationship", () => {
    const records = [makeRecord({ participation_willingness: "coerced", relationship_impact: "worsened" })];
    const alerts = identifyRestorativeJusticeAlerts(records);
    expect(alerts.some((a) => a.type === "coerced_worsened" && a.severity === "critical")).toBe(true);
  });

  it("critical alert for coerced + significantly_worsened", () => {
    const records = [makeRecord({ participation_willingness: "coerced", relationship_impact: "significantly_worsened" })];
    const alerts = identifyRestorativeJusticeAlerts(records);
    expect(alerts.some((a) => a.type === "coerced_worsened" && a.severity === "critical")).toBe(true);
  });

  it("no critical alert when coerced but relationship improved", () => {
    const records = [makeRecord({ participation_willingness: "coerced", relationship_impact: "improved" })];
    const alerts = identifyRestorativeJusticeAlerts(records);
    expect(alerts.some((a) => a.type === "coerced_worsened")).toBe(false);
  });

  it("high alert when >= 1 child voice not heard", () => {
    const records = [makeRecord({ child_voice_heard: false })];
    const alerts = identifyRestorativeJusticeAlerts(records);
    expect(alerts.some((a) => a.type === "child_voice_not_heard" && a.severity === "high")).toBe(true);
  });

  it("high alert when >= 1 victim not supported", () => {
    const records = [makeRecord({ victim_supported: false })];
    const alerts = identifyRestorativeJusticeAlerts(records);
    expect(alerts.some((a) => a.type === "victim_not_supported" && a.severity === "high")).toBe(true);
  });

  it("medium alert when >= 2 staff not trained", () => {
    const records = [
      makeRecord({ staff_trained: false }),
      makeRecord({ id: "r2", staff_trained: false }),
    ];
    const alerts = identifyRestorativeJusticeAlerts(records);
    expect(alerts.some((a) => a.type === "staff_not_trained" && a.severity === "medium")).toBe(true);
  });

  it("no staff_not_trained alert for exactly 1", () => {
    const records = [makeRecord({ staff_trained: false })];
    const alerts = identifyRestorativeJusticeAlerts(records);
    expect(alerts.some((a) => a.type === "staff_not_trained")).toBe(false);
  });

  it("medium alert when >= 2 no follow-up planned", () => {
    const records = [
      makeRecord({ follow_up_planned: false }),
      makeRecord({ id: "r2", follow_up_planned: false }),
    ];
    const alerts = identifyRestorativeJusticeAlerts(records);
    expect(alerts.some((a) => a.type === "no_follow_up" && a.severity === "medium")).toBe(true);
  });
});

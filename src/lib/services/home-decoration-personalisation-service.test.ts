import { describe, it, expect } from "vitest";
import {
  computeHomeDecorationMetrics,
  identifyHomeDecorationAlerts,
  type HomeDecorationPersonalisationRecord,
} from "./home-decoration-personalisation-service";

function makeRecord(
  overrides: Partial<HomeDecorationPersonalisationRecord> = {},
): HomeDecorationPersonalisationRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    personalisation_type: "bedroom_decoration",
    satisfaction_level: "satisfied",
    personalisation_scope: "bedroom_only",
    budget_status: "within_budget",
    assessment_date: "2026-05-01",
    child_name: "Child A",
    child_id: null,
    assessed_by: "Staff A",
    child_chose: true,
    child_involved_planning: true,
    reflects_identity: true,
    culturally_appropriate: true,
    sensory_needs_met: true,
    age_appropriate: true,
    safety_checked: true,
    photographs_taken: false,
    social_worker_informed: false,
    budget_discussed: false,
    child_satisfied: true,
    regularly_updated: true,
    issues_found: [],
    actions_taken: [],
    budget_amount: null,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeHomeDecorationMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeHomeDecorationMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.very_satisfied_count).toBe(0);
    expect(m.dissatisfied_count).toBe(0);
    expect(m.child_chose_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
    expect(m.by_personalisation_type).toEqual({});
  });

  it("counts populated data correctly", () => {
    const records = [
      makeRecord({ id: "r1", satisfaction_level: "very_satisfied", child_name: "Alice", budget_status: "over_budget" }),
      makeRecord({ id: "r2", satisfaction_level: "dissatisfied", child_name: "Bob", budget_status: "within_budget", child_chose: false }),
      makeRecord({ id: "r3", satisfaction_level: "very_dissatisfied", child_name: "Alice", budget_status: "within_budget" }),
    ];
    const m = computeHomeDecorationMetrics(records);
    expect(m.total_assessments).toBe(3);
    expect(m.very_satisfied_count).toBe(1);
    expect(m.dissatisfied_count).toBe(2); // dissatisfied + very_dissatisfied
    expect(m.over_budget_count).toBe(1);
    expect(m.within_budget_count).toBe(2);
    expect(m.unique_children).toBe(2); // Alice and Bob
    expect(m.child_chose_rate).toBe(66.7); // 2/3
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ photographs_taken: true, social_worker_informed: true }),
      makeRecord({ photographs_taken: false, social_worker_informed: false }),
    ];
    const m = computeHomeDecorationMetrics(records);
    expect(m.photographs_taken_rate).toBe(50);
    expect(m.social_worker_informed_rate).toBe(50);
    expect(m.child_chose_rate).toBe(100);
  });

  it("populates breakdown records correctly", () => {
    const records = [
      makeRecord({ personalisation_type: "wall_art_posters", personalisation_scope: "communal_areas" }),
      makeRecord({ personalisation_type: "wall_art_posters", personalisation_scope: "both" }),
      makeRecord({ personalisation_type: "sensory_items", personalisation_scope: "both" }),
    ];
    const m = computeHomeDecorationMetrics(records);
    expect(m.by_personalisation_type).toEqual({ wall_art_posters: 2, sensory_items: 1 });
    expect(m.by_personalisation_scope).toEqual({ communal_areas: 1, both: 2 });
  });
});

describe("identifyHomeDecorationAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyHomeDecorationAlerts([])).toEqual([]);
  });

  it("returns empty array for all-good records", () => {
    const records = [makeRecord(), makeRecord({ id: "r2" })];
    expect(identifyHomeDecorationAlerts(records)).toEqual([]);
  });

  it("critical: dissatisfied_no_choice when dissatisfied and child_chose is false", () => {
    const records = [
      makeRecord({ satisfaction_level: "dissatisfied", child_chose: false }),
    ];
    const alerts = identifyHomeDecorationAlerts(records);
    expect(alerts.some((a) => a.type === "dissatisfied_no_choice" && a.severity === "critical")).toBe(true);
  });

  it("critical: also triggers for very_dissatisfied with no choice", () => {
    const records = [
      makeRecord({ satisfaction_level: "very_dissatisfied", child_chose: false }),
    ];
    const alerts = identifyHomeDecorationAlerts(records);
    expect(alerts.some((a) => a.type === "dissatisfied_no_choice" && a.severity === "critical")).toBe(true);
  });

  it("high: not_reflecting_identity when >= 1 record has reflects_identity false", () => {
    const records = [makeRecord({ reflects_identity: false })];
    const alerts = identifyHomeDecorationAlerts(records);
    expect(alerts.some((a) => a.type === "not_reflecting_identity" && a.severity === "high")).toBe(true);
  });

  it("high: safety_not_checked when >= 1 record has safety_checked false", () => {
    const records = [makeRecord({ safety_checked: false })];
    const alerts = identifyHomeDecorationAlerts(records);
    expect(alerts.some((a) => a.type === "safety_not_checked" && a.severity === "high")).toBe(true);
  });

  it("medium: not_culturally_appropriate fires at threshold >= 2", () => {
    // 1 record: should NOT fire
    const one = [makeRecord({ culturally_appropriate: false })];
    expect(identifyHomeDecorationAlerts(one).some((a) => a.type === "not_culturally_appropriate")).toBe(false);
    // 2 records: should fire
    const two = [
      makeRecord({ id: "r1", culturally_appropriate: false }),
      makeRecord({ id: "r2", culturally_appropriate: false }),
    ];
    expect(identifyHomeDecorationAlerts(two).some((a) => a.type === "not_culturally_appropriate" && a.severity === "medium")).toBe(true);
  });

  it("medium: not_regularly_updated fires at threshold >= 3", () => {
    const two = [
      makeRecord({ id: "r1", regularly_updated: false }),
      makeRecord({ id: "r2", regularly_updated: false }),
    ];
    expect(identifyHomeDecorationAlerts(two).some((a) => a.type === "not_regularly_updated")).toBe(false);

    const three = [
      makeRecord({ id: "r1", regularly_updated: false }),
      makeRecord({ id: "r2", regularly_updated: false }),
      makeRecord({ id: "r3", regularly_updated: false }),
    ];
    expect(identifyHomeDecorationAlerts(three).some((a) => a.type === "not_regularly_updated" && a.severity === "medium")).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  computeTraumaMetrics,
  identifyTraumaAlerts,
  type TraumaRecord,
} from "./trauma-informed-care-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<TraumaRecord> = {}): TraumaRecord {
  return {
    id: "tr1",
    home_id: "h1",
    child_name: "Alex",
    child_id: "c1",
    assessment_date: "2025-04-01",
    trauma_types: ["neglect"],
    aces_score: 4,
    therapeutic_model: "pace",
    recovery_progress: "some_improvement",
    tic_competency: "competent",
    staff_trained_percentage: 80,
    therapeutic_environment_score: 7,
    key_triggers: ["Loud noises"],
    calming_strategies: ["Quiet room"],
    therapist_involved: true,
    therapist_name: "Dr Jones",
    child_engaged_in_therapy: true,
    trauma_informed_plan_in_place: true,
    staff_aware_of_triggers: true,
    review_date: null,
    notes: null,
    created_at: "2025-04-01",
    updated_at: "2025-04-01",
    ...overrides,
  };
}

// ── computeTraumaMetrics ─────────────────────────────────────────────────

describe("computeTraumaMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeTraumaMetrics([], 0);
    expect(m.total_records).toBe(0);
    expect(m.children_assessed).toBe(0);
    expect(m.assessment_coverage).toBeNull();;
    expect(m.average_aces_score).toBeNull();;
    expect(m.therapist_involved_rate).toBeNull();;
    expect(m.child_engaged_rate).toBeNull();;
    expect(m.plan_in_place_rate).toBeNull();;
    expect(m.staff_aware_rate).toBeNull();;
    expect(m.significant_improvement_count).toBe(0);
    expect(m.deteriorating_count).toBe(0);
    expect(m.review_overdue_count).toBe(0);
  });

  it("calculates assessment coverage against total children", () => {
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ id: "tr2", child_id: "c2", child_name: "Jordan" }),
    ];
    const m = computeTraumaMetrics(records, 4);
    expect(m.children_assessed).toBe(2);
    expect(m.assessment_coverage).toBe(50);
  });

  it("calculates average ACEs score excluding nulls", () => {
    const records = [
      makeRecord({ aces_score: 6 }),
      makeRecord({ id: "tr2", aces_score: 4 }),
      makeRecord({ id: "tr3", aces_score: null }),
    ];
    const m = computeTraumaMetrics(records, 3);
    // (6+4)/2 = 5
    expect(m.average_aces_score).toBe(5);
  });

  it("calculates therapist involved rate", () => {
    const records = [
      makeRecord({ therapist_involved: true }),
      makeRecord({ id: "tr2", therapist_involved: false }),
    ];
    const m = computeTraumaMetrics(records, 2);
    expect(m.therapist_involved_rate).toBe(50);
  });

  it("counts recovery progress categories", () => {
    const records = [
      makeRecord({ recovery_progress: "significant_improvement" }),
      makeRecord({ id: "tr2", recovery_progress: "some_improvement" }),
      makeRecord({ id: "tr3", recovery_progress: "stable" }),
      makeRecord({ id: "tr4", recovery_progress: "deteriorating" }),
    ];
    const m = computeTraumaMetrics(records, 4);
    expect(m.significant_improvement_count).toBe(1);
    expect(m.some_improvement_count).toBe(1);
    expect(m.stable_count).toBe(1);
    expect(m.deteriorating_count).toBe(1);
  });

  it("counts overdue reviews", () => {
    const records = [
      makeRecord({ review_date: "2020-01-01" }),
      makeRecord({ id: "tr2", review_date: "2099-12-31" }),
      makeRecord({ id: "tr3", review_date: null }),
    ];
    const m = computeTraumaMetrics(records, 3);
    expect(m.review_overdue_count).toBe(1);
  });

  it("breaks down by trauma type (counts per type across records)", () => {
    const records = [
      makeRecord({ trauma_types: ["neglect", "physical_abuse"] }),
      makeRecord({ id: "tr2", trauma_types: ["neglect"] }),
    ];
    const m = computeTraumaMetrics(records, 2);
    expect(m.by_trauma_type["neglect"]).toBe(2);
    expect(m.by_trauma_type["physical_abuse"]).toBe(1);
  });

  it("calculates average staff trained percentage", () => {
    const records = [
      makeRecord({ staff_trained_percentage: 80 }),
      makeRecord({ id: "tr2", staff_trained_percentage: 60 }),
    ];
    const m = computeTraumaMetrics(records, 2);
    expect(m.average_staff_trained).toBe(70);
  });
});

// ── identifyTraumaAlerts ─────────────────────────────────────────────────

describe("identifyTraumaAlerts", () => {
  it("returns empty for no records", () => {
    expect(identifyTraumaAlerts([], 0)).toEqual([]);
  });

  it("triggers critical alert for deteriorating recovery", () => {
    const records = [makeRecord({ recovery_progress: "deteriorating" })];
    const alerts = identifyTraumaAlerts(records, 1);
    expect(alerts.some((a) => a.type === "deteriorating" && a.severity === "critical")).toBe(true);
  });

  it("triggers high alert for no plan with high ACEs (>= 4)", () => {
    const records = [
      makeRecord({ aces_score: 5, trauma_informed_plan_in_place: false }),
    ];
    const alerts = identifyTraumaAlerts(records, 1);
    expect(alerts.some((a) => a.type === "no_plan_high_aces" && a.severity === "high")).toBe(true);
  });

  it("does NOT trigger no_plan_high_aces when ACEs < 4", () => {
    const records = [
      makeRecord({ aces_score: 3, trauma_informed_plan_in_place: false }),
    ];
    const alerts = identifyTraumaAlerts(records, 1);
    expect(alerts.some((a) => a.type === "no_plan_high_aces")).toBe(false);
  });

  it("triggers high alert when staff not aware of triggers", () => {
    const records = [makeRecord({ staff_aware_of_triggers: false })];
    const alerts = identifyTraumaAlerts(records, 1);
    expect(alerts.some((a) => a.type === "staff_unaware" && a.severity === "high")).toBe(true);
  });

  it("triggers medium alert for low staff training (< 50%)", () => {
    const records = [makeRecord({ staff_trained_percentage: 30 })];
    const alerts = identifyTraumaAlerts(records, 1);
    expect(alerts.some((a) => a.type === "low_training" && a.severity === "medium")).toBe(true);
  });

  it("does NOT trigger low_training when >= 50%", () => {
    const records = [makeRecord({ staff_trained_percentage: 50 })];
    const alerts = identifyTraumaAlerts(records, 1);
    expect(alerts.some((a) => a.type === "low_training")).toBe(false);
  });

  it("triggers medium alert for children not assessed", () => {
    const records = [makeRecord({ child_id: "c1" })];
    // totalChildren = 3, assessed = 1, gap = 2
    const alerts = identifyTraumaAlerts(records, 3);
    expect(alerts.some((a) => a.type === "not_assessed" && a.severity === "medium")).toBe(true);
  });

  it("does NOT trigger not_assessed when all children assessed", () => {
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ id: "tr2", child_id: "c2", child_name: "Jordan" }),
    ];
    const alerts = identifyTraumaAlerts(records, 2);
    expect(alerts.some((a) => a.type === "not_assessed")).toBe(false);
  });
});

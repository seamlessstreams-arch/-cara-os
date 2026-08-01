import { describe, it, expect } from "vitest";
import {
  computeWellbeingMetrics,
  identifyWellbeingAlerts,
} from "./staff-wellbeing-service";
import type {
  WellbeingCheck,
  DebriefRecord,
} from "./staff-wellbeing-service";

// -- Factories ----------------------------------------------------------------

function makeCheck(overrides: Partial<WellbeingCheck> = {}): WellbeingCheck {
  return {
    id: "wc-1",
    home_id: "home-1",
    staff_member: "Staff A",
    check_date: "2026-05-10",
    checked_by: "Manager",
    wellbeing_rating: "good",
    stress_level: "low",
    workload_manageable: true,
    sleep_quality: "good",
    feeling_supported: true,
    concerns: null,
    support_offered: [],
    support_accepted: false,
    follow_up_date: null,
    follow_up_completed: false,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

function makeDebrief(overrides: Partial<DebriefRecord> = {}): DebriefRecord {
  return {
    id: "db-1",
    home_id: "home-1",
    debrief_date: "2026-05-05",
    staff_members: ["Staff A"],
    facilitated_by: "Manager",
    trigger: "critical_incident",
    incident_date: "2026-05-04",
    incident_summary: "Incident occurred",
    emotional_impact: null,
    lessons_learned: null,
    support_needs_identified: null,
    actions_agreed: [],
    follow_up_required: false,
    follow_up_date: null,
    follow_up_completed: false,
    notes: null,
    created_at: "2026-05-05T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-21T12:00:00Z");

// -- computeWellbeingMetrics --------------------------------------------------

describe("computeWellbeingMetrics", () => {
  it("returns zeroes for empty data", () => {
    const r = computeWellbeingMetrics([], [], 10);
    expect(r.staff_checked).toBe(0);
    expect(r.checks_this_quarter).toBe(0);
    expect(r.avg_wellbeing_score).toBeNull();
    expect(r.avg_stress_score).toBeNull();
    expect(r.staff_struggling_or_crisis).toBe(0);
    expect(r.high_stress_count).toBe(0);
    expect(r.workload_manageable_rate).toBeNull();; expect(r.feeling_supported_rate).toBeNull();; expect(r.support_acceptance_rate).toBeNull();; expect(r.debriefs_this_quarter).toBe(0);
    expect(r.overdue_follow_ups).toBe(0);
  });

  it("counts unique staff checked", () => {
    const checks = [
      makeCheck({ id: "1", staff_member: "Alice" }),
      makeCheck({ id: "2", staff_member: "Bob" }),
      makeCheck({ id: "3", staff_member: "Alice" }),
    ];
    expect(computeWellbeingMetrics(checks, [], 10).staff_checked).toBe(2);
  });

  it("calculates average wellbeing score (excellent=5, good=4, etc.)", () => {
    const checks = [
      makeCheck({ id: "1", wellbeing_rating: "excellent" }), // 5
      makeCheck({ id: "2", wellbeing_rating: "good" }),       // 4
    ];
    // (5+4)/2 = 4.5
    expect(computeWellbeingMetrics(checks, [], 10).avg_wellbeing_score).toBe(4.5);
  });

  it("calculates average stress score (very_low=1, high=4, etc.)", () => {
    const checks = [
      makeCheck({ id: "1", stress_level: "very_low" }), // 1
      makeCheck({ id: "2", stress_level: "high" }),       // 4
    ];
    // (1+4)/2 = 2.5
    expect(computeWellbeingMetrics(checks, [], 10).avg_stress_score).toBe(2.5);
  });

  it("counts struggling or crisis and high stress", () => {
    const checks = [
      makeCheck({ id: "1", wellbeing_rating: "struggling", stress_level: "high" }),
      makeCheck({ id: "2", wellbeing_rating: "crisis", stress_level: "very_high" }),
      makeCheck({ id: "3", wellbeing_rating: "good", stress_level: "low" }),
    ];
    const r = computeWellbeingMetrics(checks, [], 10);
    expect(r.staff_struggling_or_crisis).toBe(2);
    expect(r.high_stress_count).toBe(2);
  });

  it("calculates workload manageable and feeling supported rates", () => {
    const checks = [
      makeCheck({ id: "1", workload_manageable: true, feeling_supported: true }),
      makeCheck({ id: "2", workload_manageable: false, feeling_supported: false }),
    ];
    const r = computeWellbeingMetrics(checks, [], 10);
    expect(r.workload_manageable_rate).toBe(50);
    expect(r.feeling_supported_rate).toBe(50);
  });

  it("calculates support acceptance rate (only among those offered)", () => {
    const checks = [
      makeCheck({ id: "1", support_offered: ["supervision"], support_accepted: true }),
      makeCheck({ id: "2", support_offered: ["debrief"], support_accepted: false }),
      makeCheck({ id: "3", support_offered: [], support_accepted: false }), // not counted
    ];
    // offered=2, accepted=1 => 50%
    expect(computeWellbeingMetrics(checks, [], 10).support_acceptance_rate).toBe(50);
  });

  it("counts overdue follow-ups from checks and debriefs", () => {
    const checks = [
      makeCheck({ id: "1", follow_up_date: "2026-05-01", follow_up_completed: false }),
      makeCheck({ id: "2", follow_up_date: "2026-06-01", follow_up_completed: false }), // future
    ];
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_required: true, follow_up_date: "2026-05-01", follow_up_completed: false }),
    ];
    const r = computeWellbeingMetrics(checks, debriefs, 10, NOW);
    expect(r.overdue_follow_ups).toBe(2); // 1 check + 1 debrief
  });

  it("populates by_wellbeing_rating and by_stress_level", () => {
    const checks = [
      makeCheck({ id: "1", wellbeing_rating: "good", stress_level: "low" }),
      makeCheck({ id: "2", wellbeing_rating: "fair", stress_level: "moderate" }),
    ];
    const r = computeWellbeingMetrics(checks, [], 10);
    expect(r.by_wellbeing_rating).toEqual({ good: 1, fair: 1 });
    expect(r.by_stress_level).toEqual({ low: 1, moderate: 1 });
  });
});

// -- identifyWellbeingAlerts --------------------------------------------------

describe("identifyWellbeingAlerts", () => {
  it("returns empty for empty data with zero staff", () => {
    expect(identifyWellbeingAlerts([], [], 0, NOW)).toEqual([]);
  });

  it("fires staff_crisis for crisis rating", () => {
    const checks = [makeCheck({ wellbeing_rating: "crisis" })];
    const alerts = identifyWellbeingAlerts(checks, [], 10, NOW);
    const c = alerts.filter((a) => a.type === "staff_crisis");
    expect(c).toHaveLength(1);
    expect(c[0].severity).toBe("critical");
  });

  it("fires staff_struggling for struggling rating", () => {
    const checks = [makeCheck({ wellbeing_rating: "struggling" })];
    const alerts = identifyWellbeingAlerts(checks, [], 10, NOW);
    expect(alerts.filter((a) => a.type === "staff_struggling")).toHaveLength(1);
  });

  it("fires very_high_stress for very_high stress level", () => {
    const checks = [makeCheck({ stress_level: "very_high" })];
    const alerts = identifyWellbeingAlerts(checks, [], 10, NOW);
    expect(alerts.filter((a) => a.type === "very_high_stress")).toHaveLength(1);
  });

  it("fires support_declined when support offered but not accepted", () => {
    const checks = [makeCheck({ support_offered: ["supervision"], support_accepted: false })];
    const alerts = identifyWellbeingAlerts(checks, [], 10, NOW);
    expect(alerts.filter((a) => a.type === "support_declined")).toHaveLength(1);
  });

  it("fires follow_up_overdue for overdue check follow-ups", () => {
    const checks = [makeCheck({ follow_up_date: "2026-05-01", follow_up_completed: false })];
    const alerts = identifyWellbeingAlerts(checks, [], 10, NOW);
    expect(alerts.filter((a) => a.type === "follow_up_overdue")).toHaveLength(1);
  });

  it("fires debrief_follow_up_overdue for overdue debrief follow-ups", () => {
    const debriefs = [
      makeDebrief({ follow_up_required: true, follow_up_date: "2026-05-01", follow_up_completed: false }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 10, NOW);
    expect(alerts.filter((a) => a.type === "debrief_follow_up_overdue")).toHaveLength(1);
  });

  it("fires staff_not_checked when totalStaff > checked staff", () => {
    const checks = [makeCheck({ staff_member: "Alice" })];
    const alerts = identifyWellbeingAlerts(checks, [], 3, NOW);
    const a = alerts.filter((x) => x.type === "staff_not_checked");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("medium");
  });

  it("does NOT fire staff_not_checked when all staff checked", () => {
    const checks = [makeCheck({ staff_member: "Alice" })];
    const alerts = identifyWellbeingAlerts(checks, [], 1, NOW);
    expect(alerts.filter((x) => x.type === "staff_not_checked")).toHaveLength(0);
  });
});

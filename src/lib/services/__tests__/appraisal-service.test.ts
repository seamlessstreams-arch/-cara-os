// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF APPRAISAL & PERFORMANCE SERVICE TESTS
// Pure-function unit tests for appraisal compliance computation, goal progress
// tracking, alert identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../appraisal-service";

import type {
  Appraisal,
  PerformanceGoal,
} from "../appraisal-service";

const {
  computeAppraisalCompliance,
  computeGoalProgress,
  identifyAppraisalAlerts,
} = _testing;

// Re-import constants directly for constant tests
import {
  APPRAISAL_TYPES,
  RATING_SCALE,
  GOAL_CATEGORIES,
} from "../appraisal-service";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal Appraisal with sensible defaults. */
function makeAppraisal(
  overrides: Partial<Appraisal> = {},
): Appraisal {
  return {
    id: "id" in overrides ? overrides.id! : "apr-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    staff_id: "staff_id" in overrides ? overrides.staff_id! : "staff-1",
    staff_name: "staff_name" in overrides ? overrides.staff_name! : "Jane Doe",
    appraisal_type: "appraisal_type" in overrides ? overrides.appraisal_type! : "annual",
    appraisal_date: "appraisal_date" in overrides ? overrides.appraisal_date! : "2026-04-01",
    appraiser: "appraiser" in overrides ? overrides.appraiser! : "Manager A",
    period_from: "period_from" in overrides ? overrides.period_from! : "2025-04-01",
    period_to: "period_to" in overrides ? overrides.period_to! : "2026-03-31",
    overall_rating: "overall_rating" in overrides ? overrides.overall_rating! : "good",
    strengths: "strengths" in overrides ? overrides.strengths! : ["Teamwork"],
    areas_for_development: "areas_for_development" in overrides ? overrides.areas_for_development! : ["Documentation"],
    objectives: "objectives" in overrides ? overrides.objectives! : [],
    training_needs: "training_needs" in overrides ? overrides.training_needs! : [],
    supervision_frequency: "supervision_frequency" in overrides ? overrides.supervision_frequency! : "4 weekly",
    fitness_confirmed: "fitness_confirmed" in overrides ? overrides.fitness_confirmed! : true,
    next_appraisal_date: "next_appraisal_date" in overrides ? overrides.next_appraisal_date! : "2027-04-01",
    notes: "notes" in overrides ? overrides.notes! : null,
    status: "status" in overrides ? overrides.status! : "completed",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-04-01T00:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-04-01T00:00:00Z",
  };
}

/** Build a minimal PerformanceGoal with sensible defaults. */
function makePerformanceGoal(
  overrides: Partial<PerformanceGoal> = {},
): PerformanceGoal {
  return {
    id: "id" in overrides ? overrides.id! : "goal-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    staff_id: "staff_id" in overrides ? overrides.staff_id! : "staff-1",
    staff_name: "staff_name" in overrides ? overrides.staff_name! : "Jane Doe",
    goal_description: "goal_description" in overrides ? overrides.goal_description! : "Complete Level 5 Diploma",
    category: "category" in overrides ? overrides.category! : "professional_development",
    target_date: "target_date" in overrides ? overrides.target_date! : "2026-12-31",
    status: "status" in overrides ? overrides.status! : "active",
    progress_notes: "progress_notes" in overrides ? overrides.progress_notes! : [],
    linked_appraisal_id: "linked_appraisal_id" in overrides ? overrides.linked_appraisal_id! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-01-01T00:00:00Z",
  };
}

// ── computeAppraisalCompliance ─────────────────────────────────────────────

describe("computeAppraisalCompliance", () => {
  it("returns zero stats for empty appraisals and zero staff", () => {
    const result = computeAppraisalCompliance([], 0);
    expect(result.total_appraisals).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.scheduled).toBe(0);
    expect(result.compliance_rate).toBe(0);
    expect(result.staff_without_appraisal).toBe(0);
    expect(result.avg_rating).toBe(0);
    expect(result.fitness_confirmed_rate).toBe(0);
    expect(result.by_type).toEqual({});
  });

  it("returns zero compliance with staff but no appraisals", () => {
    const result = computeAppraisalCompliance([], 5);
    expect(result.compliance_rate).toBe(0);
    expect(result.staff_without_appraisal).toBe(5);
  });

  it("counts completed, overdue, and scheduled separately", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed" }),
      makeAppraisal({ id: "a2", staff_id: "s2", status: "overdue" }),
      makeAppraisal({ id: "a3", staff_id: "s3", status: "scheduled" }),
      makeAppraisal({ id: "a4", staff_id: "s4", status: "completed" }),
    ];
    const result = computeAppraisalCompliance(appraisals, 4);
    expect(result.total_appraisals).toBe(4);
    expect(result.completed).toBe(2);
    expect(result.overdue).toBe(1);
    expect(result.scheduled).toBe(1);
  });

  it("calculates compliance_rate as percentage of staff with completed appraisals", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed" }),
      makeAppraisal({ id: "a2", staff_id: "s2", status: "completed" }),
    ];
    const result = computeAppraisalCompliance(appraisals, 4);
    // 2 out of 4 staff = 50%
    expect(result.compliance_rate).toBe(50);
  });

  it("counts unique staff for compliance (not duplicate appraisals)", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed" }),
      makeAppraisal({ id: "a2", staff_id: "s1", status: "completed", appraisal_type: "mid_year" }),
    ];
    const result = computeAppraisalCompliance(appraisals, 2);
    // Only 1 unique staff out of 2
    expect(result.compliance_rate).toBe(50);
    expect(result.staff_without_appraisal).toBe(1);
  });

  it("returns 100% compliance when all staff have completed appraisals", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed" }),
      makeAppraisal({ id: "a2", staff_id: "s2", status: "completed" }),
      makeAppraisal({ id: "a3", staff_id: "s3", status: "completed" }),
    ];
    const result = computeAppraisalCompliance(appraisals, 3);
    expect(result.compliance_rate).toBe(100);
    expect(result.staff_without_appraisal).toBe(0);
  });

  it("calculates average rating from completed appraisals using RATING_SCALE", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed", overall_rating: "outstanding" }), // 4
      makeAppraisal({ id: "a2", staff_id: "s2", status: "completed", overall_rating: "good" }),         // 3
    ];
    const result = computeAppraisalCompliance(appraisals, 2);
    // (4 + 3) / 2 = 3.5
    expect(result.avg_rating).toBe(3.5);
  });

  it("returns avg_rating 0 when no completed appraisals have valid ratings", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "scheduled" }),
    ];
    const result = computeAppraisalCompliance(appraisals, 1);
    expect(result.avg_rating).toBe(0);
  });

  it("ignores non-completed appraisals for average rating", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed", overall_rating: "outstanding" }), // 4
      makeAppraisal({ id: "a2", staff_id: "s2", status: "overdue", overall_rating: "inadequate" }),
    ];
    const result = computeAppraisalCompliance(appraisals, 2);
    expect(result.avg_rating).toBe(4);
  });

  it("calculates fitness_confirmed_rate from completed appraisals", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed", fitness_confirmed: true }),
      makeAppraisal({ id: "a2", staff_id: "s2", status: "completed", fitness_confirmed: false }),
      makeAppraisal({ id: "a3", staff_id: "s3", status: "completed", fitness_confirmed: true }),
    ];
    const result = computeAppraisalCompliance(appraisals, 3);
    // 2 out of 3 completed = 67% (rounded)
    expect(result.fitness_confirmed_rate).toBe(67);
  });

  it("returns fitness_confirmed_rate 0 when no completed appraisals", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", status: "scheduled" }),
    ];
    const result = computeAppraisalCompliance(appraisals, 1);
    expect(result.fitness_confirmed_rate).toBe(0);
  });

  it("groups appraisals by type including all statuses", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", appraisal_type: "annual", status: "completed" }),
      makeAppraisal({ id: "a2", appraisal_type: "annual", status: "overdue" }),
      makeAppraisal({ id: "a3", appraisal_type: "probation_review", status: "completed" }),
      makeAppraisal({ id: "a4", appraisal_type: "mid_year", status: "scheduled" }),
    ];
    const result = computeAppraisalCompliance(appraisals, 4);
    expect(result.by_type).toEqual({
      annual: 2,
      probation_review: 1,
      mid_year: 1,
    });
  });

  it("staff_without_appraisal never goes below zero", () => {
    // More completed staff IDs than totalStaff (edge case)
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed" }),
      makeAppraisal({ id: "a2", staff_id: "s2", status: "completed" }),
      makeAppraisal({ id: "a3", staff_id: "s3", status: "completed" }),
    ];
    const result = computeAppraisalCompliance(appraisals, 1);
    expect(result.staff_without_appraisal).toBe(0);
  });
});

// ── computeGoalProgress ────────────────────────────────────────────────────

describe("computeGoalProgress", () => {
  it("returns zero stats for empty goals", () => {
    const result = computeGoalProgress([]);
    expect(result.total).toBe(0);
    expect(result.active).toBe(0);
    expect(result.achieved).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.achievement_rate).toBe(0);
    expect(result.by_category).toEqual({});
  });

  it("counts active, achieved, and overdue goals", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", status: "active" }),
      makePerformanceGoal({ id: "g2", status: "achieved" }),
      makePerformanceGoal({ id: "g3", status: "overdue" }),
      makePerformanceGoal({ id: "g4", status: "active" }),
    ];
    const result = computeGoalProgress(goals);
    expect(result.total).toBe(4);
    expect(result.active).toBe(2);
    expect(result.achieved).toBe(1);
    expect(result.overdue).toBe(1);
  });

  it("calculates achievement_rate excluding cancelled goals", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", status: "achieved" }),
      makePerformanceGoal({ id: "g2", status: "active" }),
      makePerformanceGoal({ id: "g3", status: "cancelled" }),
    ];
    const result = computeGoalProgress(goals);
    // non-cancelled = 2 (achieved + active), achieved = 1 → 50%
    expect(result.achievement_rate).toBe(50);
  });

  it("returns 100% when all non-cancelled goals are achieved", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", status: "achieved" }),
      makePerformanceGoal({ id: "g2", status: "achieved" }),
      makePerformanceGoal({ id: "g3", status: "cancelled" }),
    ];
    const result = computeGoalProgress(goals);
    expect(result.achievement_rate).toBe(100);
  });

  it("returns 0% when no goals are achieved (all active/overdue)", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", status: "active" }),
      makePerformanceGoal({ id: "g2", status: "overdue" }),
    ];
    const result = computeGoalProgress(goals);
    expect(result.achievement_rate).toBe(0);
  });

  it("returns 0% when all goals are cancelled", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", status: "cancelled" }),
      makePerformanceGoal({ id: "g2", status: "cancelled" }),
    ];
    const result = computeGoalProgress(goals);
    expect(result.achievement_rate).toBe(0);
  });

  it("groups goals by category with total and achieved counts", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", category: "safeguarding", status: "achieved" }),
      makePerformanceGoal({ id: "g2", category: "safeguarding", status: "active" }),
      makePerformanceGoal({ id: "g3", category: "leadership", status: "achieved" }),
    ];
    const result = computeGoalProgress(goals);
    expect(result.by_category).toEqual({
      safeguarding: { total: 2, achieved: 1 },
      leadership: { total: 1, achieved: 1 },
    });
  });

  it("includes cancelled goals in by_category totals", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", category: "communication", status: "cancelled" }),
      makePerformanceGoal({ id: "g2", category: "communication", status: "achieved" }),
    ];
    const result = computeGoalProgress(goals);
    expect(result.by_category["communication"]).toEqual({ total: 2, achieved: 1 });
  });

  it("rounds achievement_rate to nearest integer", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", status: "achieved" }),
      makePerformanceGoal({ id: "g2", status: "active" }),
      makePerformanceGoal({ id: "g3", status: "overdue" }),
    ];
    const result = computeGoalProgress(goals);
    // 1 / 3 = 33.33… → 33
    expect(result.achievement_rate).toBe(33);
  });

  it("handles a single goal", () => {
    const goals = [makePerformanceGoal({ status: "achieved" })];
    const result = computeGoalProgress(goals);
    expect(result.total).toBe(1);
    expect(result.achieved).toBe(1);
    expect(result.achievement_rate).toBe(100);
  });

  it("counts overdue correctly when mixed with other statuses", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", status: "overdue" }),
      makePerformanceGoal({ id: "g2", status: "overdue" }),
      makePerformanceGoal({ id: "g3", status: "active" }),
      makePerformanceGoal({ id: "g4", status: "achieved" }),
      makePerformanceGoal({ id: "g5", status: "cancelled" }),
    ];
    const result = computeGoalProgress(goals);
    expect(result.overdue).toBe(2);
    expect(result.total).toBe(5);
  });
});

// ── identifyAppraisalAlerts ────────────────────────────────────────────────

describe("identifyAppraisalAlerts", () => {
  it("returns no alerts when everything is healthy", () => {
    const appraisals = [
      makeAppraisal({ staff_id: "s1", status: "completed", fitness_confirmed: true, overall_rating: "good" }),
    ];
    const goals: PerformanceGoal[] = [];
    const alerts = identifyAppraisalAlerts(appraisals, goals, 1);
    expect(alerts).toEqual([]);
  });

  it("returns no alerts for empty inputs with zero staff", () => {
    const alerts = identifyAppraisalAlerts([], [], 0);
    expect(alerts).toEqual([]);
  });

  it("raises high alert for overdue appraisals", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "overdue" }),
      makeAppraisal({ id: "a2", staff_id: "s2", status: "overdue" }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 2);
    const overdueAlert = alerts.find((a) => a.type === "overdue_appraisal");
    expect(overdueAlert).toBeDefined();
    expect(overdueAlert!.severity).toBe("high");
    expect(overdueAlert!.message).toContain("2");
  });

  it("uses singular when only one appraisal is overdue", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "overdue" }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 1);
    const overdueAlert = alerts.find((a) => a.type === "overdue_appraisal");
    expect(overdueAlert).toBeDefined();
    expect(overdueAlert!.message).toContain("1 staff appraisal overdue");
  });

  it("raises medium alert for staff without completed appraisals", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed" }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 3);
    const noAppraisalAlert = alerts.find((a) => a.type === "no_appraisal");
    expect(noAppraisalAlert).toBeDefined();
    expect(noAppraisalAlert!.severity).toBe("medium");
    expect(noAppraisalAlert!.message).toContain("2 of 3");
  });

  it("does not raise no_appraisal alert when totalStaff is 0", () => {
    const alerts = identifyAppraisalAlerts([], [], 0);
    const noAppraisalAlert = alerts.find((a) => a.type === "no_appraisal");
    expect(noAppraisalAlert).toBeUndefined();
  });

  it("raises high alert for completed appraisals without fitness confirmation", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed", fitness_confirmed: false }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 1);
    const fitnessAlert = alerts.find((a) => a.type === "fitness_not_confirmed");
    expect(fitnessAlert).toBeDefined();
    expect(fitnessAlert!.severity).toBe("high");
    expect(fitnessAlert!.message).toContain("Reg 32");
  });

  it("does not flag fitness for non-completed appraisals", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", status: "scheduled", fitness_confirmed: false }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 1);
    const fitnessAlert = alerts.find((a) => a.type === "fitness_not_confirmed");
    expect(fitnessAlert).toBeUndefined();
  });

  it("raises critical alert for each inadequate rating", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", staff_name: "Alice Smith", status: "completed", overall_rating: "inadequate", appraisal_date: "2026-04-01" }),
      makeAppraisal({ id: "a2", staff_id: "s2", staff_name: "Bob Jones", status: "completed", overall_rating: "inadequate", appraisal_date: "2026-04-15" }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 2);
    const inadequateAlerts = alerts.filter((a) => a.type === "inadequate_rating");
    expect(inadequateAlerts).toHaveLength(2);
    expect(inadequateAlerts[0].severity).toBe("critical");
    expect(inadequateAlerts[0].message).toContain("Alice Smith");
    expect(inadequateAlerts[1].message).toContain("Bob Jones");
  });

  it("does not raise inadequate alert for non-completed appraisals", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", status: "overdue", overall_rating: "inadequate" }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 1);
    const inadequateAlerts = alerts.filter((a) => a.type === "inadequate_rating");
    expect(inadequateAlerts).toHaveLength(0);
  });

  it("raises medium alert for overdue performance goals", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", status: "overdue" }),
      makePerformanceGoal({ id: "g2", status: "overdue" }),
      makePerformanceGoal({ id: "g3", status: "overdue" }),
    ];
    const alerts = identifyAppraisalAlerts([], goals, 0);
    const goalAlert = alerts.find((a) => a.type === "overdue_goals");
    expect(goalAlert).toBeDefined();
    expect(goalAlert!.severity).toBe("medium");
    expect(goalAlert!.message).toContain("3");
  });

  it("does not raise overdue_goals alert when no goals are overdue", () => {
    const goals = [
      makePerformanceGoal({ id: "g1", status: "active" }),
      makePerformanceGoal({ id: "g2", status: "achieved" }),
    ];
    const alerts = identifyAppraisalAlerts([], goals, 0);
    const goalAlert = alerts.find((a) => a.type === "overdue_goals");
    expect(goalAlert).toBeUndefined();
  });

  it("raises low alert for appraisals scheduled within 30 days", () => {
    // Use dates in the near future relative to now
    const now = new Date();
    const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const in10DaysStr = in10Days.toISOString().split("T")[0];

    const appraisals = [
      makeAppraisal({ id: "a1", status: "scheduled", appraisal_date: in10DaysStr }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 1);
    const upcomingAlert = alerts.find((a) => a.type === "upcoming_appraisal");
    expect(upcomingAlert).toBeDefined();
    expect(upcomingAlert!.severity).toBe("low");
    expect(upcomingAlert!.message).toContain("prepare documentation");
  });

  it("does not raise upcoming alert for appraisals more than 30 days away", () => {
    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in60DaysStr = in60Days.toISOString().split("T")[0];

    const appraisals = [
      makeAppraisal({ id: "a1", status: "scheduled", appraisal_date: in60DaysStr }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 1);
    const upcomingAlert = alerts.find((a) => a.type === "upcoming_appraisal");
    expect(upcomingAlert).toBeUndefined();
  });

  it("does not raise upcoming alert for past scheduled dates", () => {
    const appraisals = [
      makeAppraisal({ id: "a1", status: "scheduled", appraisal_date: "2020-01-01" }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, [], 1);
    const upcomingAlert = alerts.find((a) => a.type === "upcoming_appraisal");
    expect(upcomingAlert).toBeUndefined();
  });

  it("can produce multiple alert types simultaneously", () => {
    const now = new Date();
    const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const in5DaysStr = in5Days.toISOString().split("T")[0];

    const appraisals = [
      makeAppraisal({ id: "a1", staff_id: "s1", status: "overdue" }),
      makeAppraisal({ id: "a2", staff_id: "s2", status: "completed", fitness_confirmed: false, overall_rating: "inadequate", staff_name: "Bad Performer" }),
      makeAppraisal({ id: "a3", staff_id: "s3", status: "scheduled", appraisal_date: in5DaysStr }),
    ];
    const goals = [
      makePerformanceGoal({ id: "g1", status: "overdue" }),
    ];
    const alerts = identifyAppraisalAlerts(appraisals, goals, 5);
    const alertTypes = alerts.map((a) => a.type);
    expect(alertTypes).toContain("overdue_appraisal");
    expect(alertTypes).toContain("no_appraisal");
    expect(alertTypes).toContain("fitness_not_confirmed");
    expect(alertTypes).toContain("inadequate_rating");
    expect(alertTypes).toContain("overdue_goals");
    expect(alertTypes).toContain("upcoming_appraisal");
  });
});

// ── Constants ──────────────────────────────────────────────────────────────

describe("APPRAISAL_TYPES", () => {
  it("has exactly 5 types", () => {
    expect(APPRAISAL_TYPES).toHaveLength(5);
  });

  it("each entry has type, label, and frequency strings", () => {
    for (const entry of APPRAISAL_TYPES) {
      expect(typeof entry.type).toBe("string");
      expect(entry.type.length).toBeGreaterThan(0);
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.frequency).toBe("string");
      expect(entry.frequency.length).toBeGreaterThan(0);
    }
  });

  it("includes annual appraisal type", () => {
    const annual = APPRAISAL_TYPES.find((t) => t.type === "annual");
    expect(annual).toBeDefined();
    expect(annual!.label).toBe("Annual Appraisal");
    expect(annual!.frequency).toBe("Yearly");
  });

  it("includes probation_review type", () => {
    const probation = APPRAISAL_TYPES.find((t) => t.type === "probation_review");
    expect(probation).toBeDefined();
    expect(probation!.label).toBe("Probation Review");
  });

  it("has unique type values", () => {
    const types = APPRAISAL_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe("RATING_SCALE", () => {
  it("has exactly 4 ratings", () => {
    expect(RATING_SCALE).toHaveLength(4);
  });

  it("each entry has rating, label, and numeric value", () => {
    for (const entry of RATING_SCALE) {
      expect(typeof entry.rating).toBe("string");
      expect(entry.rating.length).toBeGreaterThan(0);
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.value).toBe("number");
      expect(entry.value).toBeGreaterThan(0);
    }
  });

  it("values range from 1 (inadequate) to 4 (outstanding)", () => {
    const outstanding = RATING_SCALE.find((r) => r.rating === "outstanding");
    const inadequate = RATING_SCALE.find((r) => r.rating === "inadequate");
    expect(outstanding!.value).toBe(4);
    expect(inadequate!.value).toBe(1);
  });

  it("is ordered from highest to lowest value", () => {
    for (let i = 1; i < RATING_SCALE.length; i++) {
      expect(RATING_SCALE[i - 1].value).toBeGreaterThan(RATING_SCALE[i].value);
    }
  });

  it("has unique rating keys", () => {
    const ratings = RATING_SCALE.map((r) => r.rating);
    expect(new Set(ratings).size).toBe(ratings.length);
  });
});

describe("GOAL_CATEGORIES", () => {
  it("has exactly 8 categories", () => {
    expect(GOAL_CATEGORIES).toHaveLength(8);
  });

  it("each entry has category and label strings", () => {
    for (const entry of GOAL_CATEGORIES) {
      expect(typeof entry.category).toBe("string");
      expect(entry.category.length).toBeGreaterThan(0);
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("includes safeguarding category", () => {
    const sg = GOAL_CATEGORIES.find((c) => c.category === "safeguarding");
    expect(sg).toBeDefined();
    expect(sg!.label).toBe("Safeguarding");
  });

  it("includes regulatory_compliance category", () => {
    const rc = GOAL_CATEGORIES.find((c) => c.category === "regulatory_compliance");
    expect(rc).toBeDefined();
    expect(rc!.label).toBe("Regulatory Compliance");
  });

  it("has unique category keys", () => {
    const categories = GOAL_CATEGORIES.map((c) => c.category);
    expect(new Set(categories).size).toBe(categories.length);
  });
});

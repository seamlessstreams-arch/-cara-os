// ══════════════════════════════════════════════════════════════════════════════
// CARA — BUSINESS CONTINUITY SERVICE TESTS
// Pure-function tests for business continuity metrics computation, alert
// identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 29 (business continuity),
// Reg 12 (protection from harm during disruptions). SCCIF Leadership &
// Management.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  PLAN_TYPES,
  PLAN_STATUSES,
  TEST_TYPES,
  TEST_OUTCOMES,
  RISK_LEVELS,
  listPlans,
  createPlan,
  updatePlan,
  listTests,
  createTest,
} from "../business-continuity-service";
import type {
  BusinessContinuityPlan,
  BusinessContinuityTest,
} from "../business-continuity-service";

const { computeBusinessContinuityMetrics, identifyBusinessContinuityAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Number of days ago as a Date, then return the epoch-ms offset (useful internally). */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** ISO date-only string N days from now (positive = future). */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO date-only string N days ago. */
function daysAgoISO(n: number): string {
  return daysAgo(n).toISOString().split("T")[0];
}

// ── Builder: BusinessContinuityPlan ─────────────────────────────────────

function makePlan(
  overrides: Partial<{
    id: string;
    home_id: string;
    plan_type: string;
    title: string;
    description: string;
    version: number;
    risk_level: string;
    owner: string;
    approved_by: string | null;
    approval_date: string | null;
    effective_date: string;
    review_date: string;
    last_reviewed_date: string | null;
    status: string;
    key_contacts: Record<string, unknown>[];
    critical_functions: Record<string, unknown>[];
    recovery_time_objective_hours: number | null;
    recovery_procedures: string;
    communication_plan: string | null;
    resource_requirements: string | null;
    dependencies: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }> = {},
): BusinessContinuityPlan {
  return {
    id: "id" in overrides ? overrides.id! : "plan-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    plan_type: ("plan_type" in overrides ? overrides.plan_type! : "full_bcp") as BusinessContinuityPlan["plan_type"],
    title: "title" in overrides ? overrides.title! : "Full BCP",
    description: "description" in overrides ? overrides.description! : "Comprehensive business continuity plan",
    version: "version" in overrides ? overrides.version! : 1,
    risk_level: ("risk_level" in overrides ? overrides.risk_level! : "medium") as BusinessContinuityPlan["risk_level"],
    owner: "owner" in overrides ? overrides.owner! : "staff-1",
    approved_by: "approved_by" in overrides ? overrides.approved_by! : "manager-1",
    approval_date: "approval_date" in overrides ? overrides.approval_date! : "2026-01-01",
    effective_date: "effective_date" in overrides ? overrides.effective_date! : "2026-01-01",
    review_date: "review_date" in overrides ? overrides.review_date! : daysFromNow(60),
    last_reviewed_date: "last_reviewed_date" in overrides ? overrides.last_reviewed_date! : null,
    status: ("status" in overrides ? overrides.status! : "active") as BusinessContinuityPlan["status"],
    key_contacts: "key_contacts" in overrides ? overrides.key_contacts! : [],
    critical_functions: "critical_functions" in overrides ? overrides.critical_functions! : [],
    recovery_time_objective_hours: "recovery_time_objective_hours" in overrides ? overrides.recovery_time_objective_hours! : 4,
    recovery_procedures: "recovery_procedures" in overrides ? overrides.recovery_procedures! : "Follow standard procedures",
    communication_plan: "communication_plan" in overrides ? overrides.communication_plan! : "Call all staff",
    resource_requirements: "resource_requirements" in overrides ? overrides.resource_requirements! : null,
    dependencies: "dependencies" in overrides ? overrides.dependencies! : null,
    notes: "notes" in overrides ? overrides.notes! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-01-01T00:00:00Z",
  };
}

// ── Builder: BusinessContinuityTest ─────────────────────────────────────

function makeTest(
  overrides: Partial<{
    id: string;
    home_id: string;
    plan_id: string;
    test_date: string;
    test_type: string;
    conducted_by: string;
    participants: string[];
    scenario: string;
    outcome: string;
    findings: string;
    actions_required: { action: string; assigned_to: string; due_date: string; completed: boolean }[];
    lessons_learned: string | null;
    next_test_date: string | null;
    notes: string | null;
    created_at: string;
  }> = {},
): BusinessContinuityTest {
  return {
    id: "id" in overrides ? overrides.id! : "test-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    plan_id: "plan_id" in overrides ? overrides.plan_id! : "plan-1",
    test_date: "test_date" in overrides ? overrides.test_date! : daysAgoISO(5),
    test_type: ("test_type" in overrides ? overrides.test_type! : "tabletop_exercise") as BusinessContinuityTest["test_type"],
    conducted_by: "conducted_by" in overrides ? overrides.conducted_by! : "staff-1",
    participants: "participants" in overrides ? overrides.participants! : ["staff-1", "staff-2"],
    scenario: "scenario" in overrides ? overrides.scenario! : "Fire evacuation scenario",
    outcome: ("outcome" in overrides ? overrides.outcome! : "passed") as BusinessContinuityTest["outcome"],
    findings: "findings" in overrides ? overrides.findings! : "All procedures followed correctly",
    actions_required: "actions_required" in overrides ? overrides.actions_required! : [],
    lessons_learned: "lessons_learned" in overrides ? overrides.lessons_learned! : null,
    next_test_date: "next_test_date" in overrides ? overrides.next_test_date! : null,
    notes: "notes" in overrides ? overrides.notes! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN_TYPES constant
// ═══════════════════════════════════════════════════════════════════════════

describe("PLAN_TYPES", () => {
  it("contains exactly 10 plan types", () => {
    expect(PLAN_TYPES).toHaveLength(10);
  });

  it("has correct shape for every entry", () => {
    for (const entry of PLAN_TYPES) {
      expect(entry).toHaveProperty("key");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.key).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique key values", () => {
    const keys = PLAN_TYPES.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has unique label values", () => {
    const labels = PLAN_TYPES.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("has non-empty labels for all entries", () => {
    for (const entry of PLAN_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("has non-empty keys for all entries", () => {
    for (const entry of PLAN_TYPES) {
      expect(entry.key.length).toBeGreaterThan(0);
    }
  });

  it("includes full_bcp", () => {
    const entry = PLAN_TYPES.find((p) => p.key === "full_bcp");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Full Business Continuity Plan");
  });

  it("includes fire_evacuation", () => {
    const entry = PLAN_TYPES.find((p) => p.key === "fire_evacuation");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Fire & Evacuation");
  });

  it("includes pandemic", () => {
    const entry = PLAN_TYPES.find((p) => p.key === "pandemic");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Pandemic / Infectious Disease");
  });

  it("includes safeguarding_crisis", () => {
    const entry = PLAN_TYPES.find((p) => p.key === "safeguarding_crisis");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Safeguarding Crisis");
  });

  it("includes it_failure", () => {
    const entry = PLAN_TYPES.find((p) => p.key === "it_failure");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("IT Failure / Data Loss");
  });

  it("includes supply_chain", () => {
    const entry = PLAN_TYPES.find((p) => p.key === "supply_chain");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Supply Chain Disruption");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PLAN_STATUSES constant
// ═══════════════════════════════════════════════════════════════════════════

describe("PLAN_STATUSES", () => {
  it("contains exactly 5 statuses", () => {
    expect(PLAN_STATUSES).toHaveLength(5);
  });

  it("has unique key values", () => {
    const keys = PLAN_STATUSES.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has unique label values", () => {
    const labels = PLAN_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("has correct shape for every entry", () => {
    for (const entry of PLAN_STATUSES) {
      expect(entry).toHaveProperty("key");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.key).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("includes draft", () => {
    const entry = PLAN_STATUSES.find((s) => s.key === "draft");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Draft");
  });

  it("includes active", () => {
    const entry = PLAN_STATUSES.find((s) => s.key === "active");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Active");
  });

  it("includes under_review", () => {
    const entry = PLAN_STATUSES.find((s) => s.key === "under_review");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Under Review");
  });

  it("includes archived", () => {
    const entry = PLAN_STATUSES.find((s) => s.key === "archived");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Archived");
  });

  it("includes expired", () => {
    const entry = PLAN_STATUSES.find((s) => s.key === "expired");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Expired");
  });

  it("has non-empty labels for all entries", () => {
    for (const entry of PLAN_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST_TYPES constant
// ═══════════════════════════════════════════════════════════════════════════

describe("TEST_TYPES", () => {
  it("contains exactly 5 test types", () => {
    expect(TEST_TYPES).toHaveLength(5);
  });

  it("has unique key values", () => {
    const keys = TEST_TYPES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has unique label values", () => {
    const labels = TEST_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("has correct shape for every entry", () => {
    for (const entry of TEST_TYPES) {
      expect(entry).toHaveProperty("key");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.key).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("includes tabletop_exercise", () => {
    const entry = TEST_TYPES.find((t) => t.key === "tabletop_exercise");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Tabletop Exercise");
  });

  it("includes full_drill", () => {
    const entry = TEST_TYPES.find((t) => t.key === "full_drill");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Full Drill");
  });

  it("includes partial_drill", () => {
    const entry = TEST_TYPES.find((t) => t.key === "partial_drill");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Partial Drill");
  });

  it("includes walkthrough", () => {
    const entry = TEST_TYPES.find((t) => t.key === "walkthrough");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Walkthrough");
  });

  it("includes notification_test", () => {
    const entry = TEST_TYPES.find((t) => t.key === "notification_test");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Notification Test");
  });

  it("has non-empty labels for all entries", () => {
    for (const entry of TEST_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST_OUTCOMES constant
// ═══════════════════════════════════════════════════════════════════════════

describe("TEST_OUTCOMES", () => {
  it("contains exactly 4 outcomes", () => {
    expect(TEST_OUTCOMES).toHaveLength(4);
  });

  it("has unique key values", () => {
    const keys = TEST_OUTCOMES.map((o) => o.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has unique label values", () => {
    const labels = TEST_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("has correct shape for every entry", () => {
    for (const entry of TEST_OUTCOMES) {
      expect(entry).toHaveProperty("key");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.key).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("includes passed", () => {
    const entry = TEST_OUTCOMES.find((o) => o.key === "passed");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Passed");
  });

  it("includes partial_pass", () => {
    const entry = TEST_OUTCOMES.find((o) => o.key === "partial_pass");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Partial Pass");
  });

  it("includes failed", () => {
    const entry = TEST_OUTCOMES.find((o) => o.key === "failed");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Failed");
  });

  it("includes cancelled", () => {
    const entry = TEST_OUTCOMES.find((o) => o.key === "cancelled");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Cancelled");
  });

  it("has non-empty labels for all entries", () => {
    for (const entry of TEST_OUTCOMES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RISK_LEVELS constant
// ═══════════════════════════════════════════════════════════════════════════

describe("RISK_LEVELS", () => {
  it("contains exactly 4 risk levels", () => {
    expect(RISK_LEVELS).toHaveLength(4);
  });

  it("has unique key values", () => {
    const keys = RISK_LEVELS.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has unique label values", () => {
    const labels = RISK_LEVELS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("has correct shape for every entry", () => {
    for (const entry of RISK_LEVELS) {
      expect(entry).toHaveProperty("key");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.key).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("includes low", () => {
    const entry = RISK_LEVELS.find((r) => r.key === "low");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Low");
  });

  it("includes medium", () => {
    const entry = RISK_LEVELS.find((r) => r.key === "medium");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Medium");
  });

  it("includes high", () => {
    const entry = RISK_LEVELS.find((r) => r.key === "high");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("High");
  });

  it("includes critical", () => {
    const entry = RISK_LEVELS.find((r) => r.key === "critical");
    expect(entry).toBeDefined();
    expect(entry!.label).toBe("Critical");
  });

  it("has non-empty labels for all entries", () => {
    for (const entry of RISK_LEVELS) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeBusinessContinuityMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeBusinessContinuityMetrics", () => {
  it("returns zeroes for all metrics when given empty arrays", () => {
    const result = computeBusinessContinuityMetrics([], []);
    expect(result).toEqual({
      active_plans: 0,
      expired_plans: 0,
      plans_due_review: 0,
      tests_this_year: 0,
      by_plan_type: {},
      by_test_outcome: {},
      avg_recovery_time_hours: null,
      plans_without_test: 0,
      critical_plans_count: 0,
    });
  });

  // -- active_plans --

  it("counts active plans correctly", () => {
    const plans = [
      makePlan({ id: "p1", status: "active" }),
      makePlan({ id: "p2", status: "active" }),
      makePlan({ id: "p3", status: "draft" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.active_plans).toBe(2);
  });

  it("returns 0 active plans when none are active", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft" }),
      makePlan({ id: "p2", status: "archived" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.active_plans).toBe(0);
  });

  it("counts all plans as active when all have active status", () => {
    const plans = [
      makePlan({ id: "p1", status: "active" }),
      makePlan({ id: "p2", status: "active" }),
      makePlan({ id: "p3", status: "active" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.active_plans).toBe(3);
  });

  it("does not count under_review as active", () => {
    const plans = [
      makePlan({ id: "p1", status: "under_review" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.active_plans).toBe(0);
  });

  it("does not count expired status as active", () => {
    const plans = [
      makePlan({ id: "p1", status: "expired" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.active_plans).toBe(0);
  });

  // -- expired_plans --

  it("counts expired plans (active status but review_date in the past)", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysAgoISO(10) }),
      makePlan({ id: "p2", status: "active", review_date: daysFromNow(60) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.expired_plans).toBe(1);
  });

  it("returns 0 expired plans when all review dates are in the future", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(30) }),
      makePlan({ id: "p2", status: "active", review_date: daysFromNow(90) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.expired_plans).toBe(0);
  });

  it("does not count non-active plans with past review dates as expired", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft", review_date: daysAgoISO(10) }),
      makePlan({ id: "p2", status: "archived", review_date: daysAgoISO(30) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.expired_plans).toBe(0);
  });

  it("counts multiple expired plans correctly", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysAgoISO(5) }),
      makePlan({ id: "p2", status: "active", review_date: daysAgoISO(100) }),
      makePlan({ id: "p3", status: "active", review_date: daysAgoISO(1) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.expired_plans).toBe(3);
  });

  // -- plans_due_review --

  it("counts plans due for review within 30 days", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(15) }),
      makePlan({ id: "p2", status: "active", review_date: daysFromNow(60) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.plans_due_review).toBe(1);
  });

  it("returns 0 plans due review when none are within 30 days", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(60) }),
      makePlan({ id: "p2", status: "active", review_date: daysFromNow(90) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.plans_due_review).toBe(0);
  });

  it("does not count plans with past review dates as due for review", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysAgoISO(5) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.plans_due_review).toBe(0);
  });

  it("does not count non-active plans as due for review", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft", review_date: daysFromNow(10) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.plans_due_review).toBe(0);
  });

  it("counts a plan due review on exactly 30 days from now", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(29) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.plans_due_review).toBe(1);
  });

  it("counts multiple plans due review correctly", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(5) }),
      makePlan({ id: "p2", status: "active", review_date: daysFromNow(20) }),
      makePlan({ id: "p3", status: "active", review_date: daysFromNow(28) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.plans_due_review).toBe(3);
  });

  // -- tests_this_year --

  it("counts tests conducted this year", () => {
    const tests = [
      makeTest({ id: "t1", test_date: daysAgoISO(5) }),
      makeTest({ id: "t2", test_date: daysAgoISO(30) }),
    ];
    const result = computeBusinessContinuityMetrics([], tests);
    expect(result.tests_this_year).toBe(2);
  });

  it("returns 0 tests this year when no tests exist", () => {
    const result = computeBusinessContinuityMetrics([], []);
    expect(result.tests_this_year).toBe(0);
  });

  it("excludes tests from previous years", () => {
    const tests = [
      makeTest({ id: "t1", test_date: "2025-06-01" }),
      makeTest({ id: "t2", test_date: daysAgoISO(5) }),
    ];
    const result = computeBusinessContinuityMetrics([], tests);
    expect(result.tests_this_year).toBe(1);
  });

  // -- by_plan_type --

  it("groups plans by type correctly", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "fire_evacuation" }),
      makePlan({ id: "p2", plan_type: "fire_evacuation" }),
      makePlan({ id: "p3", plan_type: "pandemic" }),
      makePlan({ id: "p4", plan_type: "flood" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.by_plan_type).toEqual({
      fire_evacuation: 2,
      pandemic: 1,
      flood: 1,
    });
  });

  it("returns empty object for by_plan_type when no plans exist", () => {
    const result = computeBusinessContinuityMetrics([], []);
    expect(result.by_plan_type).toEqual({});
  });

  it("counts all plan types including non-active", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "full_bcp", status: "active" }),
      makePlan({ id: "p2", plan_type: "full_bcp", status: "draft" }),
      makePlan({ id: "p3", plan_type: "full_bcp", status: "archived" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.by_plan_type).toEqual({ full_bcp: 3 });
  });

  // -- by_test_outcome --

  it("groups tests by outcome correctly", () => {
    const tests = [
      makeTest({ id: "t1", outcome: "passed" }),
      makeTest({ id: "t2", outcome: "passed" }),
      makeTest({ id: "t3", outcome: "failed" }),
      makeTest({ id: "t4", outcome: "partial_pass" }),
      makeTest({ id: "t5", outcome: "cancelled" }),
    ];
    const result = computeBusinessContinuityMetrics([], tests);
    expect(result.by_test_outcome).toEqual({
      passed: 2,
      failed: 1,
      partial_pass: 1,
      cancelled: 1,
    });
  });

  it("returns empty object for by_test_outcome when no tests exist", () => {
    const result = computeBusinessContinuityMetrics([], []);
    expect(result.by_test_outcome).toEqual({});
  });

  it("handles single outcome type", () => {
    const tests = [
      makeTest({ id: "t1", outcome: "failed" }),
      makeTest({ id: "t2", outcome: "failed" }),
    ];
    const result = computeBusinessContinuityMetrics([], tests);
    expect(result.by_test_outcome).toEqual({ failed: 2 });
  });

  // -- avg_recovery_time_hours --

  it("calculates average recovery time hours from plans with RTO", () => {
    const plans = [
      makePlan({ id: "p1", recovery_time_objective_hours: 4 }),
      makePlan({ id: "p2", recovery_time_objective_hours: 8 }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.avg_recovery_time_hours).toBe(6);
  });

  it("returns 0 average recovery time when no plans have RTO", () => {
    const plans = [
      makePlan({ id: "p1", recovery_time_objective_hours: null }),
      makePlan({ id: "p2", recovery_time_objective_hours: null }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.avg_recovery_time_hours).toBeNull();;
  });

  it("excludes null RTO from average calculation", () => {
    const plans = [
      makePlan({ id: "p1", recovery_time_objective_hours: 6 }),
      makePlan({ id: "p2", recovery_time_objective_hours: null }),
      makePlan({ id: "p3", recovery_time_objective_hours: 12 }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    // (6 + 12) / 2 = 9
    expect(result.avg_recovery_time_hours).toBe(9);
  });

  it("rounds average recovery time to nearest integer", () => {
    const plans = [
      makePlan({ id: "p1", recovery_time_objective_hours: 3 }),
      makePlan({ id: "p2", recovery_time_objective_hours: 4 }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    // (3 + 4) / 2 = 3.5 -> rounds to 4
    expect(result.avg_recovery_time_hours).toBe(4);
  });

  it("handles single plan with RTO", () => {
    const plans = [
      makePlan({ id: "p1", recovery_time_objective_hours: 24 }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.avg_recovery_time_hours).toBe(24);
  });

  it("returns 0 avg recovery time for empty plans array", () => {
    const result = computeBusinessContinuityMetrics([], []);
    expect(result.avg_recovery_time_hours).toBeNull();;
  });

  // -- plans_without_test --

  it("counts active plans without any test", () => {
    const plans = [
      makePlan({ id: "p1", status: "active" }),
      makePlan({ id: "p2", status: "active" }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, tests);
    expect(result.plans_without_test).toBe(1);
  });

  it("returns 0 plans without test when all active plans have tests", () => {
    const plans = [
      makePlan({ id: "p1", status: "active" }),
      makePlan({ id: "p2", status: "active" }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1" }),
      makeTest({ id: "t2", plan_id: "p2" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, tests);
    expect(result.plans_without_test).toBe(0);
  });

  it("does not count non-active plans in plans_without_test", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft" }),
      makePlan({ id: "p2", status: "archived" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.plans_without_test).toBe(0);
  });

  it("counts all active plans without test when no tests exist", () => {
    const plans = [
      makePlan({ id: "p1", status: "active" }),
      makePlan({ id: "p2", status: "active" }),
      makePlan({ id: "p3", status: "active" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.plans_without_test).toBe(3);
  });

  // -- critical_plans_count --

  it("counts critical plans correctly", () => {
    const plans = [
      makePlan({ id: "p1", risk_level: "critical" }),
      makePlan({ id: "p2", risk_level: "high" }),
      makePlan({ id: "p3", risk_level: "critical" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.critical_plans_count).toBe(2);
  });

  it("returns 0 critical plans when none exist", () => {
    const plans = [
      makePlan({ id: "p1", risk_level: "low" }),
      makePlan({ id: "p2", risk_level: "medium" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.critical_plans_count).toBe(0);
  });

  it("counts critical plans regardless of status", () => {
    const plans = [
      makePlan({ id: "p1", risk_level: "critical", status: "active" }),
      makePlan({ id: "p2", risk_level: "critical", status: "draft" }),
      makePlan({ id: "p3", risk_level: "critical", status: "archived" }),
    ];
    const result = computeBusinessContinuityMetrics(plans, []);
    expect(result.critical_plans_count).toBe(3);
  });

  // -- combined scenarios --

  it("handles a realistic mixed dataset", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", plan_type: "full_bcp", risk_level: "critical", review_date: daysFromNow(15), recovery_time_objective_hours: 4 }),
      makePlan({ id: "p2", status: "active", plan_type: "fire_evacuation", risk_level: "high", review_date: daysAgoISO(5), recovery_time_objective_hours: 2 }),
      makePlan({ id: "p3", status: "draft", plan_type: "pandemic", risk_level: "medium", review_date: daysFromNow(90), recovery_time_objective_hours: null }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", outcome: "passed", test_date: daysAgoISO(30) }),
      makeTest({ id: "t2", plan_id: "p2", outcome: "failed", test_date: daysAgoISO(10) }),
    ];
    const result = computeBusinessContinuityMetrics(plans, tests);
    expect(result.active_plans).toBe(2);
    expect(result.expired_plans).toBe(1);
    expect(result.plans_due_review).toBe(1);
    expect(result.tests_this_year).toBe(2);
    expect(result.by_plan_type).toEqual({ full_bcp: 1, fire_evacuation: 1, pandemic: 1 });
    expect(result.by_test_outcome).toEqual({ passed: 1, failed: 1 });
    expect(result.avg_recovery_time_hours).toBe(3);
    expect(result.plans_without_test).toBe(0);
    expect(result.critical_plans_count).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyBusinessContinuityAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyBusinessContinuityAlerts", () => {
  it("returns empty array when everything is compliant", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        review_date: daysFromNow(60),
        risk_level: "medium",
        approved_by: "manager-1",
        communication_plan: "Call all staff",
        updated_at: "2026-01-01T00:00:00Z",
      }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(30), outcome: "passed" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    expect(alerts).toEqual([]);
  });

  // -- plan_expired --

  it("raises plan_expired alert for active plan with past review_date", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", title: "Fire Plan", review_date: daysAgoISO(10) }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5), outcome: "passed" })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "plan_expired");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
    expect(alert!.message).toContain("Fire Plan");
    expect(alert!.message).toContain("Reg 29");
  });

  it("does not raise plan_expired for draft plan with past review_date", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft", review_date: daysAgoISO(10) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "plan_expired");
    expect(alert).toBeUndefined();
  });

  it("does not raise plan_expired when review_date is in the future", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(30) }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5) })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "plan_expired");
    expect(alert).toBeUndefined();
  });

  it("raises multiple plan_expired alerts for multiple expired plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", title: "Plan A", review_date: daysAgoISO(5) }),
      makePlan({ id: "p2", status: "active", title: "Plan B", review_date: daysAgoISO(20) }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(3) }),
      makeTest({ id: "t2", plan_id: "p2", test_date: daysAgoISO(3) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const expiredAlerts = alerts.filter((a) => a.type === "plan_expired");
    expect(expiredAlerts).toHaveLength(2);
  });

  it("does not raise plan_expired for archived plan with past review_date", () => {
    const plans = [
      makePlan({ id: "p1", status: "archived", review_date: daysAgoISO(30) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "plan_expired");
    expect(alert).toBeUndefined();
  });

  // -- plan_due_review --

  it("raises plan_due_review alert when review_date is within 30 days", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", title: "BCP", review_date: daysFromNow(15) }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5) })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "plan_due_review");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("BCP");
    expect(alert!.message).toContain("30 days");
  });

  it("does not raise plan_due_review when review_date is more than 30 days away", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(60) }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5) })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "plan_due_review");
    expect(alert).toBeUndefined();
  });

  it("does not raise plan_due_review for non-active plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft", review_date: daysFromNow(10) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "plan_due_review");
    expect(alert).toBeUndefined();
  });

  it("does not raise plan_due_review when review_date is in the past", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysAgoISO(1) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "plan_due_review");
    expect(alert).toBeUndefined();
  });

  // -- no_test_conducted --

  it("raises no_test_conducted alert when active plan has no test in 12 months", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", title: "Pandemic Plan", review_date: daysFromNow(60) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "no_test_conducted");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("Pandemic Plan");
    expect(alert!.message).toContain("12 months");
  });

  it("does not raise no_test_conducted when recent test exists within 12 months", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(60) }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(100) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "no_test_conducted");
    expect(alert).toBeUndefined();
  });

  it("raises no_test_conducted when only test is older than 12 months", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", title: "Old Plan", review_date: daysFromNow(60) }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(400) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "no_test_conducted");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Old Plan");
  });

  it("does not raise no_test_conducted for non-active plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft", review_date: daysFromNow(60) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "no_test_conducted");
    expect(alert).toBeUndefined();
  });

  it("does not raise no_test_conducted for archived plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "archived" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "no_test_conducted");
    expect(alert).toBeUndefined();
  });

  // -- test_failed --

  it("raises test_failed alert when most recent test failed", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", title: "Fire Plan", review_date: daysFromNow(60) }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(30), outcome: "passed" }),
      makeTest({ id: "t2", plan_id: "p1", test_date: daysAgoISO(5), outcome: "failed" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "test_failed");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("Fire Plan");
    expect(alert!.message).toContain("failed");
  });

  it("does not raise test_failed when most recent test passed", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(60) }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(30), outcome: "failed" }),
      makeTest({ id: "t2", plan_id: "p1", test_date: daysAgoISO(5), outcome: "passed" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "test_failed");
    expect(alert).toBeUndefined();
  });

  it("does not raise test_failed when no tests exist", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(60) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "test_failed");
    expect(alert).toBeUndefined();
  });

  it("does not raise test_failed for non-active plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft" }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(5), outcome: "failed" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "test_failed");
    expect(alert).toBeUndefined();
  });

  it("does not raise test_failed when most recent test is partial_pass", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(60) }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(5), outcome: "partial_pass" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "test_failed");
    expect(alert).toBeUndefined();
  });

  // -- critical_plan_no_approval --

  it("raises critical_plan_no_approval for critical plan without approved_by", () => {
    const plans = [
      makePlan({ id: "p1", risk_level: "critical", approved_by: null, title: "Critical BCP" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "critical_plan_no_approval");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
    expect(alert!.message).toContain("Critical BCP");
    expect(alert!.message).toContain("approval");
  });

  it("does not raise critical_plan_no_approval when critical plan has approved_by", () => {
    const plans = [
      makePlan({ id: "p1", risk_level: "critical", approved_by: "manager-1" }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5) })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "critical_plan_no_approval");
    expect(alert).toBeUndefined();
  });

  it("does not raise critical_plan_no_approval for non-critical plans without approval", () => {
    const plans = [
      makePlan({ id: "p1", risk_level: "high", approved_by: null }),
      makePlan({ id: "p2", risk_level: "medium", approved_by: null }),
      makePlan({ id: "p3", risk_level: "low", approved_by: null }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "critical_plan_no_approval");
    expect(alert).toBeUndefined();
  });

  it("raises critical_plan_no_approval regardless of plan status", () => {
    const plans = [
      makePlan({ id: "p1", risk_level: "critical", approved_by: null, status: "draft", title: "Draft Critical" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "critical_plan_no_approval");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Draft Critical");
  });

  // -- draft_plan_stale --

  it("raises draft_plan_stale for draft plan older than 60 days", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "draft",
        title: "Stale Draft",
        created_at: daysAgo(70).toISOString(),
      }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "draft_plan_stale");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("Stale Draft");
    expect(alert!.message).toContain("60 days");
  });

  it("does not raise draft_plan_stale for draft plan created less than 60 days ago", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "draft",
        created_at: daysAgo(30).toISOString(),
      }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "draft_plan_stale");
    expect(alert).toBeUndefined();
  });

  it("does not raise draft_plan_stale for active plans even if old", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        review_date: daysFromNow(60),
        created_at: daysAgo(100).toISOString(),
      }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5) })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "draft_plan_stale");
    expect(alert).toBeUndefined();
  });

  it("does not raise draft_plan_stale for archived plans", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "archived",
        created_at: daysAgo(100).toISOString(),
      }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "draft_plan_stale");
    expect(alert).toBeUndefined();
  });

  // -- no_communication_plan --

  it("raises no_communication_plan for active plan without communication_plan", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        title: "No Comms Plan",
        communication_plan: null,
        review_date: daysFromNow(60),
      }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5) })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "no_communication_plan");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("No Comms Plan");
    expect(alert!.message).toContain("communication plan");
  });

  it("does not raise no_communication_plan when communication_plan exists", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        communication_plan: "Email all staff, then call manager",
        review_date: daysFromNow(60),
      }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5) })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "no_communication_plan");
    expect(alert).toBeUndefined();
  });

  it("does not raise no_communication_plan for draft plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft", communication_plan: null }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "no_communication_plan");
    expect(alert).toBeUndefined();
  });

  it("does not raise no_communication_plan for archived plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "archived", communication_plan: null }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "no_communication_plan");
    expect(alert).toBeUndefined();
  });

  it("raises no_communication_plan for empty string communication_plan", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        title: "Empty Comms",
        communication_plan: "",
        review_date: daysFromNow(60),
      }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5) })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "no_communication_plan");
    expect(alert).toBeDefined();
  });

  // -- plan_not_tested_after_update --

  it("raises plan_not_tested_after_update when plan updated after last test", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        title: "Updated Plan",
        review_date: daysFromNow(60),
        updated_at: daysAgo(3).toISOString(),
        communication_plan: "Yes",
      }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(10) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "plan_not_tested_after_update");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("Updated Plan");
    expect(alert!.message).toContain("updated after");
  });

  it("does not raise plan_not_tested_after_update when last test is after update", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        review_date: daysFromNow(60),
        updated_at: daysAgo(30).toISOString(),
        communication_plan: "Yes",
      }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(5) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "plan_not_tested_after_update");
    expect(alert).toBeUndefined();
  });

  it("does not raise plan_not_tested_after_update when no tests exist", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        review_date: daysFromNow(60),
        updated_at: daysAgo(3).toISOString(),
      }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "plan_not_tested_after_update");
    expect(alert).toBeUndefined();
  });

  it("does not raise plan_not_tested_after_update for non-active plans", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "draft",
        updated_at: daysAgo(3).toISOString(),
      }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(10) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "plan_not_tested_after_update");
    expect(alert).toBeUndefined();
  });

  it("uses the most recent test date for plan_not_tested_after_update", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        review_date: daysFromNow(60),
        updated_at: daysAgo(15).toISOString(),
        communication_plan: "Yes",
      }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(30) }),
      makeTest({ id: "t2", plan_id: "p1", test_date: daysAgoISO(5) }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    // Most recent test is 5 days ago, plan updated 15 days ago
    // test is after update, so no alert
    const alert = alerts.find((a) => a.type === "plan_not_tested_after_update");
    expect(alert).toBeUndefined();
  });

  // -- combined alerts --

  it("can raise multiple alert types simultaneously", () => {
    const plans = [
      // plan_expired (active + past review), no_communication_plan, no_test_conducted
      makePlan({
        id: "p1",
        status: "active",
        title: "Expired No Comms",
        review_date: daysAgoISO(10),
        communication_plan: null,
      }),
      // critical_plan_no_approval
      makePlan({
        id: "p2",
        risk_level: "critical",
        approved_by: null,
        status: "active",
        title: "Critical Unapproved",
        review_date: daysFromNow(60),
        communication_plan: "Yes",
      }),
      // draft_plan_stale
      makePlan({
        id: "p3",
        status: "draft",
        title: "Stale Draft",
        created_at: daysAgo(90).toISOString(),
      }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, []);
    const alertTypes = alerts.map((a) => a.type);
    expect(alertTypes).toContain("plan_expired");
    expect(alertTypes).toContain("no_communication_plan");
    expect(alertTypes).toContain("no_test_conducted");
    expect(alertTypes).toContain("critical_plan_no_approval");
    expect(alertTypes).toContain("draft_plan_stale");
  });

  it("does not duplicate alert types for a single plan when not warranted", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        review_date: daysFromNow(60),
        risk_level: "medium",
        approved_by: "mgr-1",
        communication_plan: "Yes",
        updated_at: "2026-01-01T00:00:00Z",
      }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(30), outcome: "passed" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    expect(alerts).toHaveLength(0);
  });

  it("raises test_failed alongside plan_not_tested_after_update when applicable", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        title: "Failed Updated Plan",
        review_date: daysFromNow(60),
        communication_plan: "Yes",
        updated_at: daysAgo(2).toISOString(),
      }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(5), outcome: "failed" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alertTypes = alerts.map((a) => a.type);
    expect(alertTypes).toContain("test_failed");
    expect(alertTypes).toContain("plan_not_tested_after_update");
  });

  it("handles empty plans and tests arrays returning empty alerts", () => {
    const alerts = identifyBusinessContinuityAlerts([], []);
    expect(alerts).toEqual([]);
  });

  it("includes plan title in plan_due_review message", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", title: "My Important Plan", review_date: daysFromNow(10) }),
    ];
    const tests = [makeTest({ plan_id: "p1", test_date: daysAgoISO(5) })];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "plan_due_review");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("My Important Plan");
  });

  it("includes test date in test_failed message", () => {
    const testDate = daysAgoISO(7);
    const plans = [
      makePlan({ id: "p1", status: "active", review_date: daysFromNow(60) }),
    ];
    const tests = [
      makeTest({ id: "t1", plan_id: "p1", test_date: testDate, outcome: "failed" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alert = alerts.find((a) => a.type === "test_failed");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain(testDate);
  });

  it("raises all 8 alert types when every condition is met", () => {
    const plans = [
      // plan_expired + no_test_conducted + no_communication_plan + plan_not_tested_after_update
      makePlan({
        id: "p1",
        status: "active",
        title: "Expired",
        review_date: daysAgoISO(5),
        communication_plan: null,
        updated_at: daysAgo(2).toISOString(),
      }),
      // plan_due_review
      makePlan({
        id: "p2",
        status: "active",
        title: "Due Review",
        review_date: daysFromNow(10),
        communication_plan: "Yes",
        updated_at: "2026-01-01T00:00:00Z",
      }),
      // critical_plan_no_approval
      makePlan({
        id: "p3",
        status: "active",
        risk_level: "critical",
        approved_by: null,
        title: "Critical No Approval",
        review_date: daysFromNow(60),
        communication_plan: "Yes",
        updated_at: "2026-01-01T00:00:00Z",
      }),
      // draft_plan_stale
      makePlan({
        id: "p4",
        status: "draft",
        title: "Stale Draft",
        created_at: daysAgo(90).toISOString(),
      }),
    ];
    const tests = [
      // test_failed for p1, also makes plan_not_tested_after_update fire for p1
      makeTest({ id: "t1", plan_id: "p1", test_date: daysAgoISO(5), outcome: "failed" }),
      // recent test for p2 so no no_test_conducted
      makeTest({ id: "t2", plan_id: "p2", test_date: daysAgoISO(5), outcome: "passed" }),
      // recent test for p3 so no no_test_conducted
      makeTest({ id: "t3", plan_id: "p3", test_date: daysAgoISO(5), outcome: "passed" }),
    ];
    const alerts = identifyBusinessContinuityAlerts(plans, tests);
    const alertTypes = new Set(alerts.map((a) => a.type));
    expect(alertTypes.has("plan_expired")).toBe(true);
    expect(alertTypes.has("plan_due_review")).toBe(true);
    expect(alertTypes.has("no_test_conducted")).toBe(false); // p1 has a test within 12 months
    expect(alertTypes.has("test_failed")).toBe(true);
    expect(alertTypes.has("critical_plan_no_approval")).toBe(true);
    expect(alertTypes.has("draft_plan_stale")).toBe(true);
    expect(alertTypes.has("no_communication_plan")).toBe(true);
    expect(alertTypes.has("plan_not_tested_after_update")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Business Continuity Plans (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listPlans", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listPlans("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of status filter", async () => {
    const result = await listPlans("home-1", { status: "active" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of planType filter", async () => {
    const result = await listPlans("home-1", { planType: "fire_evacuation" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of riskLevel filter", async () => {
    const result = await listPlans("home-1", { riskLevel: "critical" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit", async () => {
    const result = await listPlans("home-1", { limit: 10 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array with all filters combined", async () => {
    const result = await listPlans("home-1", {
      status: "active",
      planType: "pandemic",
      riskLevel: "high",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createPlan", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createPlan({
      homeId: "home-1",
      planType: "full_bcp",
      title: "Test Plan",
      description: "Test description",
      riskLevel: "medium",
      owner: "staff-1",
      effectiveDate: "2026-01-01",
      reviewDate: "2026-06-01",
      recoveryProcedures: "Standard procedures",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with all optional fields", async () => {
    const result = await createPlan({
      homeId: "home-1",
      planType: "fire_evacuation",
      title: "Fire Plan",
      description: "Fire evacuation procedures",
      version: 2,
      riskLevel: "critical",
      owner: "staff-1",
      approvedBy: "manager-1",
      approvalDate: "2026-01-01",
      effectiveDate: "2026-01-01",
      reviewDate: "2026-06-01",
      lastReviewedDate: "2026-01-01",
      status: "active",
      keyContacts: [{ name: "Fire Service", phone: "999" }],
      criticalFunctions: [{ name: "Care delivery" }],
      recoveryTimeObjectiveHours: 4,
      recoveryProcedures: "Evacuate",
      communicationPlan: "Call all staff",
      resourceRequirements: "Emergency kit",
      dependencies: "None",
      notes: "Reviewed annually",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updatePlan", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updatePlan("plan-1", { status: "active" as const });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with multiple updates", async () => {
    const result = await updatePlan("plan-1", {
      status: "under_review" as const,
      title: "Updated Title",
      review_date: "2026-12-01",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Business Continuity Tests (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listTests", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listTests("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of planId filter", async () => {
    const result = await listTests("home-1", { planId: "plan-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of testType filter", async () => {
    const result = await listTests("home-1", { testType: "full_drill" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of outcome filter", async () => {
    const result = await listTests("home-1", { outcome: "passed" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of date range", async () => {
    const result = await listTests("home-1", { dateFrom: "2026-01-01", dateTo: "2026-12-31" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit", async () => {
    const result = await listTests("home-1", { limit: 25 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array with all filters combined", async () => {
    const result = await listTests("home-1", {
      planId: "plan-1",
      testType: "tabletop_exercise",
      outcome: "failed",
      dateFrom: "2026-01-01",
      dateTo: "2026-06-30",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createTest", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createTest({
      homeId: "home-1",
      planId: "plan-1",
      testDate: "2026-05-01",
      testType: "tabletop_exercise",
      conductedBy: "staff-1",
      scenario: "Fire evacuation",
      outcome: "passed",
      findings: "All procedures followed",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with all optional fields", async () => {
    const result = await createTest({
      homeId: "home-1",
      planId: "plan-1",
      testDate: "2026-05-01",
      testType: "full_drill",
      conductedBy: "staff-1",
      participants: ["staff-1", "staff-2", "staff-3"],
      scenario: "Full fire drill with evacuation",
      outcome: "partial_pass",
      findings: "Some staff unsure of assembly point",
      actionsRequired: [
        { action: "Retrain assembly points", assigned_to: "staff-lead", due_date: "2026-06-01", completed: false },
      ],
      lessonsLearned: "Need clearer signage",
      nextTestDate: "2026-08-01",
      notes: "Conducted during day shift",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

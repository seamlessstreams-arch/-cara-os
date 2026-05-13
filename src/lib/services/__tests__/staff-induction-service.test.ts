// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF INDUCTION SERVICE TESTS
// Pure-function tests for induction metrics computation, alert identification,
// constant validation, and CRUD fallback under CHR 2015 Reg 33/34.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  _testing,
  INDUCTION_CATEGORIES,
  INDUCTION_TASK_STATUSES,
  PROBATION_STATUSES,
  PROBATION_MILESTONES,
} from "../staff-induction-service";
import type {
  InductionRecord,
  InductionTask,
  InductionCategory,
  InductionTaskStatus,
  ProbationStatus,
  ProbationMilestone,
} from "../staff-induction-service";

const { computeInductionMetrics, identifyInductionAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<InductionRecord> = {}): InductionRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    staff_name: "Jane Doe",
    staff_role: "Residential Worker",
    start_date: "2026-04-01",
    induction_lead: "John Lead",
    probation_status: "in_probation",
    probation_end_date: "2026-10-01",
    total_tasks: 10,
    tasks_completed: 5,
    tasks_overdue: 1,
    dbs_verified: true,
    references_verified: true,
    right_to_work_verified: true,
    can_work_unsupervised: false,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function makeTask(overrides: Partial<InductionTask> = {}): InductionTask {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    induction_id: "ind-1",
    category: "safeguarding" as InductionCategory,
    task: "Complete safeguarding training",
    target_date: "2026-06-01",
    status: "not_started" as InductionTaskStatus,
    completed_date: null,
    signed_off_by: null,
    evidence: null,
    created_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-13");

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// ── INDUCTION_CATEGORIES ─────────────────────────────────────────────────

describe("INDUCTION_CATEGORIES", () => {
  it("has exactly 18 entries", () => {
    expect(INDUCTION_CATEGORIES).toHaveLength(18);
  });

  it("has unique category values", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of INDUCTION_CATEGORIES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("contains safeguarding", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("safeguarding");
  });

  it("contains health_safety", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("health_safety");
  });

  it("contains fire_safety", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("fire_safety");
  });

  it("contains first_aid", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("first_aid");
  });

  it("contains medication", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("medication");
  });

  it("contains behaviour_management", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("behaviour_management");
  });

  it("contains restraint", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("restraint");
  });

  it("contains data_protection", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("data_protection");
  });

  it("contains whistleblowing", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("whistleblowing");
  });

  it("contains complaints", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("complaints");
  });

  it("contains policies_procedures", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("policies_procedures");
  });

  it("contains lone_working", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("lone_working");
  });

  it("contains equality_diversity", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("equality_diversity");
  });

  it("contains record_keeping", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("record_keeping");
  });

  it("contains children_introductions", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("children_introductions");
  });

  it("contains premises_orientation", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("premises_orientation");
  });

  it("contains emergency_procedures", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("emergency_procedures");
  });

  it("contains other", () => {
    const cats = INDUCTION_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("other");
  });

  it("maps safeguarding to label Safeguarding", () => {
    const entry = INDUCTION_CATEGORIES.find((c) => c.category === "safeguarding");
    expect(entry?.label).toBe("Safeguarding");
  });

  it("maps health_safety to label Health & Safety", () => {
    const entry = INDUCTION_CATEGORIES.find((c) => c.category === "health_safety");
    expect(entry?.label).toBe("Health & Safety");
  });

  it("maps fire_safety to label Fire Safety", () => {
    const entry = INDUCTION_CATEGORIES.find((c) => c.category === "fire_safety");
    expect(entry?.label).toBe("Fire Safety");
  });

  it("maps other to label Other", () => {
    const entry = INDUCTION_CATEGORIES.find((c) => c.category === "other");
    expect(entry?.label).toBe("Other");
  });
});

// ── INDUCTION_TASK_STATUSES ──────────────────────────────────────────────

describe("INDUCTION_TASK_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(INDUCTION_TASK_STATUSES).toHaveLength(5);
  });

  it("has unique status values", () => {
    const statuses = INDUCTION_TASK_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of INDUCTION_TASK_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("contains not_started", () => {
    expect(INDUCTION_TASK_STATUSES.map((s) => s.status)).toContain("not_started");
  });

  it("contains in_progress", () => {
    expect(INDUCTION_TASK_STATUSES.map((s) => s.status)).toContain("in_progress");
  });

  it("contains completed", () => {
    expect(INDUCTION_TASK_STATUSES.map((s) => s.status)).toContain("completed");
  });

  it("contains deferred", () => {
    expect(INDUCTION_TASK_STATUSES.map((s) => s.status)).toContain("deferred");
  });

  it("contains not_applicable", () => {
    expect(INDUCTION_TASK_STATUSES.map((s) => s.status)).toContain("not_applicable");
  });

  it("maps not_started to Not Started", () => {
    const entry = INDUCTION_TASK_STATUSES.find((s) => s.status === "not_started");
    expect(entry?.label).toBe("Not Started");
  });

  it("maps completed to Completed", () => {
    const entry = INDUCTION_TASK_STATUSES.find((s) => s.status === "completed");
    expect(entry?.label).toBe("Completed");
  });
});

// ── PROBATION_STATUSES ───────────────────────────────────────────────────

describe("PROBATION_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(PROBATION_STATUSES).toHaveLength(5);
  });

  it("has unique status values", () => {
    const statuses = PROBATION_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of PROBATION_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("contains in_probation", () => {
    expect(PROBATION_STATUSES.map((s) => s.status)).toContain("in_probation");
  });

  it("contains extended", () => {
    expect(PROBATION_STATUSES.map((s) => s.status)).toContain("extended");
  });

  it("contains passed", () => {
    expect(PROBATION_STATUSES.map((s) => s.status)).toContain("passed");
  });

  it("contains failed", () => {
    expect(PROBATION_STATUSES.map((s) => s.status)).toContain("failed");
  });

  it("contains not_applicable", () => {
    expect(PROBATION_STATUSES.map((s) => s.status)).toContain("not_applicable");
  });

  it("maps in_probation to In Probation", () => {
    const entry = PROBATION_STATUSES.find((s) => s.status === "in_probation");
    expect(entry?.label).toBe("In Probation");
  });

  it("maps extended to Extended", () => {
    const entry = PROBATION_STATUSES.find((s) => s.status === "extended");
    expect(entry?.label).toBe("Extended");
  });
});

// ── PROBATION_MILESTONES ─────────────────────────────────────────────────

describe("PROBATION_MILESTONES", () => {
  it("has exactly 5 entries", () => {
    expect(PROBATION_MILESTONES).toHaveLength(5);
  });

  it("has unique milestone values", () => {
    const milestones = PROBATION_MILESTONES.map((m) => m.milestone);
    expect(new Set(milestones).size).toBe(milestones.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of PROBATION_MILESTONES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("contains week_1_review", () => {
    expect(PROBATION_MILESTONES.map((m) => m.milestone)).toContain("week_1_review");
  });

  it("contains month_1_review", () => {
    expect(PROBATION_MILESTONES.map((m) => m.milestone)).toContain("month_1_review");
  });

  it("contains month_3_review", () => {
    expect(PROBATION_MILESTONES.map((m) => m.milestone)).toContain("month_3_review");
  });

  it("contains month_6_review", () => {
    expect(PROBATION_MILESTONES.map((m) => m.milestone)).toContain("month_6_review");
  });

  it("contains final_review", () => {
    expect(PROBATION_MILESTONES.map((m) => m.milestone)).toContain("final_review");
  });

  it("maps week_1_review to Week 1 Review", () => {
    const entry = PROBATION_MILESTONES.find((m) => m.milestone === "week_1_review");
    expect(entry?.label).toBe("Week 1 Review");
  });

  it("maps final_review to Final Review", () => {
    const entry = PROBATION_MILESTONES.find((m) => m.milestone === "final_review");
    expect(entry?.label).toBe("Final Review");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeInductionMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeInductionMetrics", () => {
  describe("empty inputs", () => {
    it("returns zero total_records for no records", () => {
      const m = computeInductionMetrics([], [], NOW);
      expect(m.total_records).toBe(0);
    });

    it("returns zero in_probation for no records", () => {
      const m = computeInductionMetrics([], [], NOW);
      expect(m.in_probation).toBe(0);
    });

    it("returns zero total_tasks for no tasks", () => {
      const m = computeInductionMetrics([], [], NOW);
      expect(m.total_tasks).toBe(0);
    });

    it("returns zero completion_rate for no tasks", () => {
      const m = computeInductionMetrics([], [], NOW);
      expect(m.completion_rate).toBe(0);
    });

    it("returns zero dbs_verified_rate for no records", () => {
      const m = computeInductionMetrics([], [], NOW);
      expect(m.dbs_verified_rate).toBe(0);
    });

    it("returns zero avg_completion for no records", () => {
      const m = computeInductionMetrics([], [], NOW);
      expect(m.avg_completion).toBe(0);
    });

    it("returns empty by_category for no tasks", () => {
      const m = computeInductionMetrics([], [], NOW);
      expect(m.by_category).toEqual({});
    });

    it("returns empty by_task_status for no tasks", () => {
      const m = computeInductionMetrics([], [], NOW);
      expect(m.by_task_status).toEqual({});
    });

    it("returns empty by_probation_status for no records", () => {
      const m = computeInductionMetrics([], [], NOW);
      expect(m.by_probation_status).toEqual({});
    });
  });

  describe("total_records", () => {
    it("counts a single record", () => {
      const m = computeInductionMetrics([makeRecord()], [], NOW);
      expect(m.total_records).toBe(1);
    });

    it("counts multiple records", () => {
      const records = [makeRecord(), makeRecord(), makeRecord()];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.total_records).toBe(3);
    });
  });

  describe("in_probation", () => {
    it("counts records with probation_status in_probation", () => {
      const records = [
        makeRecord({ probation_status: "in_probation" }),
        makeRecord({ probation_status: "passed" }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.in_probation).toBe(1);
    });
  });

  describe("probation_extended", () => {
    it("counts records with probation_status extended", () => {
      const records = [
        makeRecord({ probation_status: "extended" }),
        makeRecord({ probation_status: "extended" }),
        makeRecord({ probation_status: "in_probation" }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.probation_extended).toBe(2);
    });
  });

  describe("probation_passed", () => {
    it("counts records with probation_status passed", () => {
      const records = [
        makeRecord({ probation_status: "passed" }),
        makeRecord({ probation_status: "failed" }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.probation_passed).toBe(1);
    });
  });

  describe("probation_failed", () => {
    it("counts records with probation_status failed", () => {
      const records = [
        makeRecord({ probation_status: "failed" }),
        makeRecord({ probation_status: "failed" }),
        makeRecord({ probation_status: "passed" }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.probation_failed).toBe(2);
    });
  });

  describe("total_tasks", () => {
    it("counts all tasks", () => {
      const tasks = [makeTask(), makeTask(), makeTask()];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.total_tasks).toBe(3);
    });
  });

  describe("tasks_completed", () => {
    it("counts completed tasks", () => {
      const tasks = [
        makeTask({ status: "completed" }),
        makeTask({ status: "completed" }),
        makeTask({ status: "not_started" }),
      ];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.tasks_completed).toBe(2);
    });

    it("returns zero when no tasks are completed", () => {
      const tasks = [makeTask({ status: "in_progress" })];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.tasks_completed).toBe(0);
    });
  });

  describe("tasks_overdue", () => {
    it("counts not_started tasks past target date as overdue", () => {
      const tasks = [makeTask({ status: "not_started", target_date: "2026-05-01" })];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.tasks_overdue).toBe(1);
    });

    it("counts in_progress tasks past target date as overdue", () => {
      const tasks = [makeTask({ status: "in_progress", target_date: "2026-04-01" })];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.tasks_overdue).toBe(1);
    });

    it("does not count completed tasks past target as overdue", () => {
      const tasks = [makeTask({ status: "completed", target_date: "2026-01-01" })];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.tasks_overdue).toBe(0);
    });

    it("does not count deferred tasks past target as overdue", () => {
      const tasks = [makeTask({ status: "deferred", target_date: "2026-01-01" })];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.tasks_overdue).toBe(0);
    });

    it("does not count future tasks as overdue", () => {
      const tasks = [makeTask({ status: "not_started", target_date: "2026-12-01" })];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.tasks_overdue).toBe(0);
    });
  });

  describe("completion_rate", () => {
    it("calculates rate excluding not_applicable tasks", () => {
      const tasks = [
        makeTask({ status: "completed" }),
        makeTask({ status: "not_started" }),
        makeTask({ status: "not_applicable" }),
      ];
      // 1 completed / 2 active = 50%
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.completion_rate).toBe(50);
    });

    it("returns 100 when all active tasks are completed", () => {
      const tasks = [
        makeTask({ status: "completed" }),
        makeTask({ status: "completed" }),
        makeTask({ status: "not_applicable" }),
      ];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.completion_rate).toBe(100);
    });

    it("returns 0 when no active tasks are completed", () => {
      const tasks = [makeTask({ status: "not_started" }), makeTask({ status: "in_progress" })];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.completion_rate).toBe(0);
    });

    it("returns 0 when all tasks are not_applicable", () => {
      const tasks = [makeTask({ status: "not_applicable" })];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.completion_rate).toBe(0);
    });

    it("rounds to one decimal place", () => {
      // 1 completed / 3 active = 33.333...% => 33.3
      const tasks = [
        makeTask({ status: "completed" }),
        makeTask({ status: "not_started" }),
        makeTask({ status: "in_progress" }),
      ];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.completion_rate).toBe(33.3);
    });
  });

  describe("dbs_verified_rate", () => {
    it("calculates rate of DBS-verified records", () => {
      const records = [
        makeRecord({ dbs_verified: true }),
        makeRecord({ dbs_verified: false }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.dbs_verified_rate).toBe(50);
    });

    it("returns 100 when all records are DBS-verified", () => {
      const records = [makeRecord({ dbs_verified: true })];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.dbs_verified_rate).toBe(100);
    });

    it("returns 0 when no records are DBS-verified", () => {
      const records = [makeRecord({ dbs_verified: false })];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.dbs_verified_rate).toBe(0);
    });
  });

  describe("references_verified_rate", () => {
    it("calculates rate of references-verified records", () => {
      const records = [
        makeRecord({ references_verified: true }),
        makeRecord({ references_verified: true }),
        makeRecord({ references_verified: false }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.references_verified_rate).toBe(66.7);
    });
  });

  describe("right_to_work_verified_rate", () => {
    it("calculates rate of RTW-verified records", () => {
      const records = [
        makeRecord({ right_to_work_verified: true }),
        makeRecord({ right_to_work_verified: false }),
        makeRecord({ right_to_work_verified: false }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.right_to_work_verified_rate).toBe(33.3);
    });
  });

  describe("can_work_unsupervised_count", () => {
    it("counts records where can_work_unsupervised is true", () => {
      const records = [
        makeRecord({ can_work_unsupervised: true }),
        makeRecord({ can_work_unsupervised: false }),
        makeRecord({ can_work_unsupervised: true }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.can_work_unsupervised_count).toBe(2);
    });

    it("returns 0 when none can work unsupervised", () => {
      const records = [makeRecord({ can_work_unsupervised: false })];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.can_work_unsupervised_count).toBe(0);
    });
  });

  describe("avg_completion", () => {
    it("computes average across active records only (in_probation/extended)", () => {
      const records = [
        makeRecord({ probation_status: "in_probation", total_tasks: 10, tasks_completed: 5 }),
        makeRecord({ probation_status: "extended", total_tasks: 10, tasks_completed: 10 }),
        makeRecord({ probation_status: "passed", total_tasks: 10, tasks_completed: 10 }),
      ];
      // Active: (50 + 100) / 2 = 75
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.avg_completion).toBe(75);
    });

    it("returns 0 when no active records exist", () => {
      const records = [makeRecord({ probation_status: "passed" })];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.avg_completion).toBe(0);
    });

    it("handles records with zero total_tasks", () => {
      const records = [
        makeRecord({ probation_status: "in_probation", total_tasks: 0, tasks_completed: 0 }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.avg_completion).toBe(0);
    });

    it("rounds to one decimal place", () => {
      const records = [
        makeRecord({ probation_status: "in_probation", total_tasks: 3, tasks_completed: 1 }),
      ];
      // (1/3)*100 = 33.333... => 33.3
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.avg_completion).toBe(33.3);
    });
  });

  describe("by_category", () => {
    it("groups tasks by category", () => {
      const tasks = [
        makeTask({ category: "safeguarding" }),
        makeTask({ category: "safeguarding" }),
        makeTask({ category: "fire_safety" }),
      ];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.by_category).toEqual({ safeguarding: 2, fire_safety: 1 });
    });

    it("handles single category", () => {
      const tasks = [makeTask({ category: "first_aid" })];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.by_category).toEqual({ first_aid: 1 });
    });
  });

  describe("by_task_status", () => {
    it("groups tasks by status", () => {
      const tasks = [
        makeTask({ status: "completed" }),
        makeTask({ status: "completed" }),
        makeTask({ status: "not_started" }),
        makeTask({ status: "deferred" }),
      ];
      const m = computeInductionMetrics([], tasks, NOW);
      expect(m.by_task_status).toEqual({ completed: 2, not_started: 1, deferred: 1 });
    });
  });

  describe("by_probation_status", () => {
    it("groups records by probation status", () => {
      const records = [
        makeRecord({ probation_status: "in_probation" }),
        makeRecord({ probation_status: "in_probation" }),
        makeRecord({ probation_status: "passed" }),
        makeRecord({ probation_status: "failed" }),
      ];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.by_probation_status).toEqual({ in_probation: 2, passed: 1, failed: 1 });
    });

    it("handles single probation status", () => {
      const records = [makeRecord({ probation_status: "extended" })];
      const m = computeInductionMetrics(records, [], NOW);
      expect(m.by_probation_status).toEqual({ extended: 1 });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyInductionAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyInductionAlerts", () => {
  describe("empty inputs", () => {
    it("returns no alerts for empty records and tasks", () => {
      const alerts = identifyInductionAlerts([], [], NOW);
      expect(alerts).toEqual([]);
    });
  });

  describe("checks_incomplete", () => {
    it("flags record with missing DBS", () => {
      const r = makeRecord({ dbs_verified: false, references_verified: true, right_to_work_verified: true });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const check = alerts.find((a) => a.type === "checks_incomplete");
      expect(check).toBeDefined();
      expect(check!.severity).toBe("critical");
      expect(check!.message).toContain("DBS");
    });

    it("flags record with missing references", () => {
      const r = makeRecord({ dbs_verified: true, references_verified: false, right_to_work_verified: true });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const check = alerts.find((a) => a.type === "checks_incomplete");
      expect(check).toBeDefined();
      expect(check!.message).toContain("references");
    });

    it("flags record with missing right to work", () => {
      const r = makeRecord({ dbs_verified: true, references_verified: true, right_to_work_verified: false });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const check = alerts.find((a) => a.type === "checks_incomplete");
      expect(check).toBeDefined();
      expect(check!.message).toContain("right to work");
    });

    it("lists all missing items in message", () => {
      const r = makeRecord({ dbs_verified: false, references_verified: false, right_to_work_verified: false });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const check = alerts.find((a) => a.type === "checks_incomplete");
      expect(check!.message).toContain("DBS");
      expect(check!.message).toContain("references");
      expect(check!.message).toContain("right to work");
    });

    it("includes staff name in message", () => {
      const r = makeRecord({ staff_name: "Alice Test", dbs_verified: false });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const check = alerts.find((a) => a.type === "checks_incomplete");
      expect(check!.message).toContain("Alice Test");
    });

    it("includes staff role in message", () => {
      const r = makeRecord({ staff_role: "Senior Worker", dbs_verified: false });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const check = alerts.find((a) => a.type === "checks_incomplete");
      expect(check!.message).toContain("Senior Worker");
    });

    it("does not flag record with all checks verified", () => {
      const r = makeRecord({ dbs_verified: true, references_verified: true, right_to_work_verified: true });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const check = alerts.find((a) => a.type === "checks_incomplete");
      expect(check).toBeUndefined();
    });

    it("uses record id", () => {
      const r = makeRecord({ id: "rec-check-1", dbs_verified: false });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const check = alerts.find((a) => a.type === "checks_incomplete");
      expect(check!.id).toBe("rec-check-1");
    });
  });

  describe("task_overdue", () => {
    it("flags not_started task past target date", () => {
      const t = makeTask({ status: "not_started", target_date: "2026-05-01" });
      const alerts = identifyInductionAlerts([], [t], NOW);
      const overdue = alerts.find((a) => a.type === "task_overdue");
      expect(overdue).toBeDefined();
      expect(overdue!.severity).toBe("high");
    });

    it("flags in_progress task past target date", () => {
      const t = makeTask({ status: "in_progress", target_date: "2026-04-15" });
      const alerts = identifyInductionAlerts([], [t], NOW);
      const overdue = alerts.find((a) => a.type === "task_overdue");
      expect(overdue).toBeDefined();
    });

    it("does not flag completed task past target", () => {
      const t = makeTask({ status: "completed", target_date: "2026-01-01" });
      const alerts = identifyInductionAlerts([], [t], NOW);
      const overdue = alerts.find((a) => a.type === "task_overdue");
      expect(overdue).toBeUndefined();
    });

    it("does not flag deferred task past target", () => {
      const t = makeTask({ status: "deferred", target_date: "2026-01-01" });
      const alerts = identifyInductionAlerts([], [t], NOW);
      const overdue = alerts.find((a) => a.type === "task_overdue");
      expect(overdue).toBeUndefined();
    });

    it("does not flag not_started task with future target", () => {
      const t = makeTask({ status: "not_started", target_date: "2026-12-01" });
      const alerts = identifyInductionAlerts([], [t], NOW);
      const overdue = alerts.find((a) => a.type === "task_overdue");
      expect(overdue).toBeUndefined();
    });

    it("includes task name in message", () => {
      const t = makeTask({ task: "Fire drill training", status: "not_started", target_date: "2026-05-01" });
      const alerts = identifyInductionAlerts([], [t], NOW);
      const overdue = alerts.find((a) => a.type === "task_overdue");
      expect(overdue!.message).toContain("Fire drill training");
    });

    it("includes category in message", () => {
      const t = makeTask({ category: "fire_safety", status: "not_started", target_date: "2026-05-01" });
      const alerts = identifyInductionAlerts([], [t], NOW);
      const overdue = alerts.find((a) => a.type === "task_overdue");
      expect(overdue!.message).toContain("fire_safety");
    });

    it("includes target_date in message", () => {
      const t = makeTask({ status: "not_started", target_date: "2026-05-01" });
      const alerts = identifyInductionAlerts([], [t], NOW);
      const overdue = alerts.find((a) => a.type === "task_overdue");
      expect(overdue!.message).toContain("2026-05-01");
    });

    it("uses task id", () => {
      const t = makeTask({ id: "task-overdue-1", status: "not_started", target_date: "2026-05-01" });
      const alerts = identifyInductionAlerts([], [t], NOW);
      const overdue = alerts.find((a) => a.type === "task_overdue");
      expect(overdue!.id).toBe("task-overdue-1");
    });
  });

  describe("probation_ending", () => {
    it("flags in_probation record ending within 14 days", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-05-20",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending).toBeDefined();
      expect(ending!.severity).toBe("medium");
    });

    it("flags extended record ending within 14 days", () => {
      const r = makeRecord({
        probation_status: "extended",
        probation_end_date: "2026-05-25",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending).toBeDefined();
    });

    it("does not flag when end date is more than 14 days away", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-06-15",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending).toBeUndefined();
    });

    it("does not flag passed record ending within 14 days", () => {
      const r = makeRecord({
        probation_status: "passed",
        probation_end_date: "2026-05-20",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending).toBeUndefined();
    });

    it("does not flag when end date is in the past", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-05-01",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending).toBeUndefined();
    });

    it("does not flag when probation_end_date is null", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: null,
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending).toBeUndefined();
    });

    it("includes staff name in message", () => {
      const r = makeRecord({
        staff_name: "Bob Builder",
        probation_status: "in_probation",
        probation_end_date: "2026-05-20",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending!.message).toContain("Bob Builder");
    });

    it("includes end date in message", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-05-20",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending!.message).toContain("2026-05-20");
    });

    it("flags record ending on exactly now date", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-05-13",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending).toBeDefined();
    });

    it("flags record ending on exactly 14 days from now", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-05-27",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const ending = alerts.find((a) => a.type === "probation_ending");
      expect(ending).toBeDefined();
    });
  });

  describe("probation_overdue", () => {
    it("flags in_probation record with past end date", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-05-01",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const overdue = alerts.find((a) => a.type === "probation_overdue");
      expect(overdue).toBeDefined();
      expect(overdue!.severity).toBe("high");
    });

    it("flags extended record with past end date", () => {
      const r = makeRecord({
        probation_status: "extended",
        probation_end_date: "2026-04-01",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const overdue = alerts.find((a) => a.type === "probation_overdue");
      expect(overdue).toBeDefined();
    });

    it("does not flag passed record with past end date", () => {
      const r = makeRecord({
        probation_status: "passed",
        probation_end_date: "2026-01-01",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const overdue = alerts.find((a) => a.type === "probation_overdue");
      expect(overdue).toBeUndefined();
    });

    it("does not flag failed record with past end date", () => {
      const r = makeRecord({
        probation_status: "failed",
        probation_end_date: "2026-01-01",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const overdue = alerts.find((a) => a.type === "probation_overdue");
      expect(overdue).toBeUndefined();
    });

    it("does not flag in_probation record with future end date", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-10-01",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const overdue = alerts.find((a) => a.type === "probation_overdue");
      expect(overdue).toBeUndefined();
    });

    it("does not flag when probation_end_date is null", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: null,
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const overdue = alerts.find((a) => a.type === "probation_overdue");
      expect(overdue).toBeUndefined();
    });

    it("includes staff name in message", () => {
      const r = makeRecord({
        staff_name: "Claire Adams",
        probation_status: "in_probation",
        probation_end_date: "2026-04-01",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const overdue = alerts.find((a) => a.type === "probation_overdue");
      expect(overdue!.message).toContain("Claire Adams");
    });

    it("includes end date in message", () => {
      const r = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-04-01",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const overdue = alerts.find((a) => a.type === "probation_overdue");
      expect(overdue!.message).toContain("2026-04-01");
    });
  });

  describe("unsupervised_without_checks", () => {
    it("flags record marked unsupervised with DBS not verified", () => {
      const r = makeRecord({
        can_work_unsupervised: true,
        dbs_verified: false,
        references_verified: true,
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const unsup = alerts.find((a) => a.type === "unsupervised_without_checks");
      expect(unsup).toBeDefined();
      expect(unsup!.severity).toBe("critical");
    });

    it("flags record marked unsupervised with references not verified", () => {
      const r = makeRecord({
        can_work_unsupervised: true,
        dbs_verified: true,
        references_verified: false,
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const unsup = alerts.find((a) => a.type === "unsupervised_without_checks");
      expect(unsup).toBeDefined();
    });

    it("flags record marked unsupervised with both DBS and references not verified", () => {
      const r = makeRecord({
        can_work_unsupervised: true,
        dbs_verified: false,
        references_verified: false,
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const unsup = alerts.find((a) => a.type === "unsupervised_without_checks");
      expect(unsup).toBeDefined();
    });

    it("does not flag record that cannot work unsupervised even without checks", () => {
      const r = makeRecord({
        can_work_unsupervised: false,
        dbs_verified: false,
        references_verified: false,
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const unsup = alerts.find((a) => a.type === "unsupervised_without_checks");
      expect(unsup).toBeUndefined();
    });

    it("does not flag record unsupervised with all checks verified", () => {
      const r = makeRecord({
        can_work_unsupervised: true,
        dbs_verified: true,
        references_verified: true,
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const unsup = alerts.find((a) => a.type === "unsupervised_without_checks");
      expect(unsup).toBeUndefined();
    });

    it("includes staff name in message", () => {
      const r = makeRecord({
        staff_name: "Dave Unsup",
        can_work_unsupervised: true,
        dbs_verified: false,
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const unsup = alerts.find((a) => a.type === "unsupervised_without_checks");
      expect(unsup!.message).toContain("Dave Unsup");
    });

    it("uses record id", () => {
      const r = makeRecord({
        id: "rec-unsup-1",
        can_work_unsupervised: true,
        dbs_verified: false,
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const unsup = alerts.find((a) => a.type === "unsupervised_without_checks");
      expect(unsup!.id).toBe("rec-unsup-1");
    });
  });

  describe("combined scenarios", () => {
    it("generates multiple alert types for one record", () => {
      // Record with: missing checks, overdue probation, working unsupervised
      const r = makeRecord({
        dbs_verified: false,
        references_verified: false,
        right_to_work_verified: false,
        can_work_unsupervised: true,
        probation_status: "in_probation",
        probation_end_date: "2026-04-01",
      });
      const alerts = identifyInductionAlerts([r], [], NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("checks_incomplete");
      expect(types).toContain("probation_overdue");
      expect(types).toContain("unsupervised_without_checks");
    });

    it("generates alerts for multiple records and tasks", () => {
      const r1 = makeRecord({ dbs_verified: false });
      const r2 = makeRecord({
        probation_status: "in_probation",
        probation_end_date: "2026-05-20",
        dbs_verified: true,
        references_verified: true,
        right_to_work_verified: true,
      });
      const t1 = makeTask({ status: "not_started", target_date: "2026-05-01" });
      const alerts = identifyInductionAlerts([r1, r2], [t1], NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("checks_incomplete");
      expect(types).toContain("probation_ending");
      expect(types).toContain("task_overdue");
    });

    it("produces no alerts when everything is in order", () => {
      const r = makeRecord({
        dbs_verified: true,
        references_verified: true,
        right_to_work_verified: true,
        can_work_unsupervised: false,
        probation_status: "passed",
        probation_end_date: "2026-01-01",
      });
      const t = makeTask({ status: "completed", target_date: "2026-01-01" });
      const alerts = identifyInductionAlerts([r], [t], NOW);
      expect(alerts).toEqual([]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

describe("CRUD fallback (Supabase disabled)", () => {
  // Dynamic import after mock to pick up mock
  let listRecords: typeof import("../staff-induction-service").listRecords;
  let createRecord: typeof import("../staff-induction-service").createRecord;
  let updateRecord: typeof import("../staff-induction-service").updateRecord;
  let listTasks: typeof import("../staff-induction-service").listTasks;
  let createTask: typeof import("../staff-induction-service").createTask;

  beforeAll(async () => {
    const mod = await import("../staff-induction-service");
    listRecords = mod.listRecords;
    createRecord = mod.createRecord;
    updateRecord = mod.updateRecord;
    listTasks = mod.listTasks;
    createTask = mod.createTask;
  });

  it("listRecords returns ok with empty array", async () => {
    const result = await listRecords("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listRecords returns ok with filters", async () => {
    const result = await listRecords("home-1", { probationStatus: "in_probation", limit: 10 });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createRecord returns error when Supabase not configured", async () => {
    const result = await createRecord({
      homeId: "home-1",
      staffName: "Test",
      staffRole: "Worker",
      startDate: "2026-01-01",
      inductionLead: "Lead",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateRecord returns error when Supabase not configured", async () => {
    const result = await updateRecord("rec-1", { staff_name: "Updated" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("listTasks returns ok with empty array", async () => {
    const result = await listTasks("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listTasks returns ok with filters", async () => {
    const result = await listTasks("home-1", {
      inductionId: "ind-1",
      category: "safeguarding",
      status: "not_started",
      limit: 50,
    });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createTask returns error when Supabase not configured", async () => {
    const result = await createTask({
      homeId: "home-1",
      inductionId: "ind-1",
      category: "safeguarding",
      task: "Test task",
      targetDate: "2026-06-01",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computeInductionMetrics handles a single record", () => {
    const m = computeInductionMetrics([makeRecord()], [], NOW);
    expect(m.total_records).toBe(1);
    expect(typeof m.dbs_verified_rate).toBe("number");
  });

  it("computeInductionMetrics handles a single task", () => {
    const m = computeInductionMetrics([], [makeTask()], NOW);
    expect(m.total_tasks).toBe(1);
  });

  it("computeInductionMetrics handles large dataset", () => {
    const records = Array.from({ length: 100 }, () => makeRecord());
    const tasks = Array.from({ length: 500 }, () => makeTask({ status: "completed" }));
    const m = computeInductionMetrics(records, tasks, NOW);
    expect(m.total_records).toBe(100);
    expect(m.total_tasks).toBe(500);
    expect(m.tasks_completed).toBe(500);
  });

  it("identifyInductionAlerts handles large dataset", () => {
    const records = Array.from({ length: 50 }, () =>
      makeRecord({ dbs_verified: false }),
    );
    const alerts = identifyInductionAlerts(records, [], NOW);
    const checksIncomplete = alerts.filter((a) => a.type === "checks_incomplete");
    expect(checksIncomplete).toHaveLength(50);
  });

  it("computeInductionMetrics returns all 17 fields", () => {
    const m = computeInductionMetrics([], [], NOW);
    const keys = Object.keys(m);
    expect(keys).toHaveLength(17);
    expect(keys).toContain("total_records");
    expect(keys).toContain("in_probation");
    expect(keys).toContain("probation_extended");
    expect(keys).toContain("probation_passed");
    expect(keys).toContain("probation_failed");
    expect(keys).toContain("total_tasks");
    expect(keys).toContain("tasks_completed");
    expect(keys).toContain("tasks_overdue");
    expect(keys).toContain("completion_rate");
    expect(keys).toContain("dbs_verified_rate");
    expect(keys).toContain("references_verified_rate");
    expect(keys).toContain("can_work_unsupervised_count");
    expect(keys).toContain("right_to_work_verified_rate");
    expect(keys).toContain("avg_completion");
    expect(keys).toContain("by_category");
    expect(keys).toContain("by_task_status");
    expect(keys).toContain("by_probation_status");
  });

  it("identifyInductionAlerts alert objects have required fields", () => {
    const r = makeRecord({ dbs_verified: false });
    const alerts = identifyInductionAlerts([r], [], NOW);
    expect(alerts.length).toBeGreaterThan(0);
    for (const alert of alerts) {
      expect(alert).toHaveProperty("type");
      expect(alert).toHaveProperty("severity");
      expect(alert).toHaveProperty("message");
      expect(alert).toHaveProperty("id");
    }
  });

  it("factory makeRecord produces valid InductionRecord shape", () => {
    const r = makeRecord();
    expect(r).toHaveProperty("id");
    expect(r).toHaveProperty("home_id");
    expect(r).toHaveProperty("staff_name");
    expect(r).toHaveProperty("staff_role");
    expect(r).toHaveProperty("start_date");
    expect(r).toHaveProperty("induction_lead");
    expect(r).toHaveProperty("probation_status");
    expect(r).toHaveProperty("probation_end_date");
    expect(r).toHaveProperty("total_tasks");
    expect(r).toHaveProperty("tasks_completed");
    expect(r).toHaveProperty("tasks_overdue");
    expect(r).toHaveProperty("dbs_verified");
    expect(r).toHaveProperty("references_verified");
    expect(r).toHaveProperty("right_to_work_verified");
    expect(r).toHaveProperty("can_work_unsupervised");
    expect(r).toHaveProperty("notes");
    expect(r).toHaveProperty("created_at");
    expect(r).toHaveProperty("updated_at");
  });

  it("factory makeTask produces valid InductionTask shape", () => {
    const t = makeTask();
    expect(t).toHaveProperty("id");
    expect(t).toHaveProperty("home_id");
    expect(t).toHaveProperty("induction_id");
    expect(t).toHaveProperty("category");
    expect(t).toHaveProperty("task");
    expect(t).toHaveProperty("target_date");
    expect(t).toHaveProperty("status");
    expect(t).toHaveProperty("completed_date");
    expect(t).toHaveProperty("signed_off_by");
    expect(t).toHaveProperty("evidence");
    expect(t).toHaveProperty("created_at");
  });

  it("makeRecord generates unique ids", () => {
    const r1 = makeRecord();
    const r2 = makeRecord();
    expect(r1.id).not.toBe(r2.id);
  });

  it("makeTask generates unique ids", () => {
    const t1 = makeTask();
    const t2 = makeTask();
    expect(t1.id).not.toBe(t2.id);
  });

  it("computeInductionMetrics with all probation statuses", () => {
    const records = [
      makeRecord({ probation_status: "in_probation" }),
      makeRecord({ probation_status: "extended" }),
      makeRecord({ probation_status: "passed" }),
      makeRecord({ probation_status: "failed" }),
      makeRecord({ probation_status: "not_applicable" }),
    ];
    const m = computeInductionMetrics(records, [], NOW);
    expect(m.in_probation).toBe(1);
    expect(m.probation_extended).toBe(1);
    expect(m.probation_passed).toBe(1);
    expect(m.probation_failed).toBe(1);
    expect(m.by_probation_status["not_applicable"]).toBe(1);
  });

  it("computeInductionMetrics with all task statuses", () => {
    const tasks = [
      makeTask({ status: "not_started", target_date: "2026-04-01" }),
      makeTask({ status: "in_progress", target_date: "2026-04-01" }),
      makeTask({ status: "completed" }),
      makeTask({ status: "deferred" }),
      makeTask({ status: "not_applicable" }),
    ];
    const m = computeInductionMetrics([], tasks, NOW);
    expect(m.total_tasks).toBe(5);
    expect(m.tasks_completed).toBe(1);
    expect(m.tasks_overdue).toBe(2);
    expect(m.by_task_status["not_started"]).toBe(1);
    expect(m.by_task_status["in_progress"]).toBe(1);
    expect(m.by_task_status["completed"]).toBe(1);
    expect(m.by_task_status["deferred"]).toBe(1);
    expect(m.by_task_status["not_applicable"]).toBe(1);
  });

  it("completion_rate with mixed statuses is correct", () => {
    // 2 completed, 1 not_started, 1 in_progress, 1 deferred = 5 active, 1 not_applicable
    const tasks = [
      makeTask({ status: "completed" }),
      makeTask({ status: "completed" }),
      makeTask({ status: "not_started" }),
      makeTask({ status: "in_progress" }),
      makeTask({ status: "deferred" }),
      makeTask({ status: "not_applicable" }),
    ];
    const m = computeInductionMetrics([], tasks, NOW);
    // 2/5 = 40%
    expect(m.completion_rate).toBe(40);
  });

  it("avg_completion with multiple active records averages correctly", () => {
    const records = [
      makeRecord({ probation_status: "in_probation", total_tasks: 10, tasks_completed: 2 }),
      makeRecord({ probation_status: "in_probation", total_tasks: 10, tasks_completed: 8 }),
    ];
    // (20 + 80) / 2 = 50
    const m = computeInductionMetrics(records, [], NOW);
    expect(m.avg_completion).toBe(50);
  });
});

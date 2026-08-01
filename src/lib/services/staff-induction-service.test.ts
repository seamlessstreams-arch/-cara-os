import { describe, it, expect } from "vitest";
import {
  computeInductionMetrics,
  identifyInductionAlerts,
} from "./staff-induction-service";
import type {
  InductionRecord,
  InductionTask,
} from "./staff-induction-service";

// -- Factories ----------------------------------------------------------------

function makeRecord(overrides: Partial<InductionRecord> = {}): InductionRecord {
  return {
    id: "ind-1",
    home_id: "home-1",
    staff_name: "New Starter",
    staff_role: "Residential Worker",
    start_date: "2026-04-01",
    induction_lead: "Manager A",
    probation_status: "in_probation",
    probation_end_date: "2026-10-01",
    total_tasks: 10,
    tasks_completed: 8,
    tasks_overdue: 0,
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
    id: "task-1",
    home_id: "home-1",
    induction_id: "ind-1",
    category: "safeguarding",
    task: "Safeguarding L1",
    target_date: "2026-04-15",
    status: "completed",
    completed_date: "2026-04-10",
    signed_off_by: "Manager A",
    evidence: "Certificate",
    created_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-21T12:00:00Z");

// -- computeInductionMetrics --------------------------------------------------

describe("computeInductionMetrics", () => {
  it("returns zeroes for empty arrays", () => {
    const m = computeInductionMetrics([], [], NOW);
    expect(m.total_records).toBe(0);
    expect(m.in_probation).toBe(0);
    expect(m.total_tasks).toBe(0);
    expect(m.tasks_completed).toBe(0);
    expect(m.tasks_overdue).toBe(0);
    expect(m.completion_rate).toBeNull();;
    expect(m.dbs_verified_rate).toBeNull();;
    expect(m.avg_completion).toBe(0);
  });

  it("counts probation statuses correctly", () => {
    const records = [
      makeRecord({ id: "1", probation_status: "in_probation" }),
      makeRecord({ id: "2", probation_status: "extended" }),
      makeRecord({ id: "3", probation_status: "passed" }),
      makeRecord({ id: "4", probation_status: "failed" }),
    ];
    const m = computeInductionMetrics(records, [], NOW);
    expect(m.in_probation).toBe(1);
    expect(m.probation_extended).toBe(1);
    expect(m.probation_passed).toBe(1);
    expect(m.probation_failed).toBe(1);
  });

  it("counts task statuses and overdue correctly", () => {
    const tasks = [
      makeTask({ id: "1", status: "completed" }),
      makeTask({ id: "2", status: "not_started", target_date: "2026-04-01" }),
      makeTask({ id: "3", status: "in_progress", target_date: "2026-04-01" }),
      makeTask({ id: "4", status: "not_applicable" }),
    ];
    const m = computeInductionMetrics([], tasks, NOW);
    expect(m.tasks_completed).toBe(1);
    expect(m.tasks_overdue).toBe(2);
    expect(m.total_tasks).toBe(4);
  });

  it("computes completion_rate excluding not_applicable tasks", () => {
    const tasks = [
      makeTask({ id: "1", status: "completed" }),
      makeTask({ id: "2", status: "not_started", target_date: "2026-06-01" }),
      makeTask({ id: "3", status: "not_applicable" }),
    ];
    const m = computeInductionMetrics([], tasks, NOW);
    // 1 completed out of 2 active tasks = 50%
    expect(m.completion_rate).toBe(50);
  });

  it("computes verification rates correctly", () => {
    const records = [
      makeRecord({ id: "1", dbs_verified: true, references_verified: true, right_to_work_verified: false }),
      makeRecord({ id: "2", dbs_verified: false, references_verified: false, right_to_work_verified: false }),
    ];
    const m = computeInductionMetrics(records, [], NOW);
    expect(m.dbs_verified_rate).toBe(50);
    expect(m.references_verified_rate).toBe(50);
    expect(m.right_to_work_verified_rate).toBe(0);
  });

  it("computes avg_completion for active records only", () => {
    const records = [
      makeRecord({ id: "1", probation_status: "in_probation", total_tasks: 10, tasks_completed: 5 }),
      makeRecord({ id: "2", probation_status: "passed", total_tasks: 10, tasks_completed: 10 }),
    ];
    const m = computeInductionMetrics(records, [], NOW);
    // Only in_probation record counts: 5/10 * 100 = 50
    expect(m.avg_completion).toBe(50);
  });

  it("builds breakdown maps", () => {
    const tasks = [
      makeTask({ id: "1", category: "safeguarding", status: "completed" }),
      makeTask({ id: "2", category: "safeguarding", status: "not_started" }),
      makeTask({ id: "3", category: "fire_safety", status: "completed" }),
    ];
    const m = computeInductionMetrics([], tasks, NOW);
    expect(m.by_category).toEqual({ safeguarding: 2, fire_safety: 1 });
    expect(m.by_task_status).toEqual({ completed: 2, not_started: 1 });
  });
});

// -- identifyInductionAlerts --------------------------------------------------

describe("identifyInductionAlerts", () => {
  it("returns empty alerts for empty arrays", () => {
    expect(identifyInductionAlerts([], [], NOW)).toEqual([]);
  });

  it("fires critical alert when pre-employment checks incomplete", () => {
    const records = [makeRecord({ id: "ind-x", dbs_verified: false, staff_name: "Tom" })];
    const alerts = identifyInductionAlerts(records, [], NOW);
    const found = alerts.filter((a) => a.type === "checks_incomplete");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
    expect(found[0].message).toContain("DBS");
  });

  it("lists all missing checks in message", () => {
    const records = [
      makeRecord({ id: "1", dbs_verified: false, references_verified: false, right_to_work_verified: false }),
    ];
    const alerts = identifyInductionAlerts(records, [], NOW);
    const msg = alerts.find((a) => a.type === "checks_incomplete")!.message;
    expect(msg).toContain("DBS");
    expect(msg).toContain("references");
    expect(msg).toContain("right to work");
  });

  it("fires high alert for overdue tasks", () => {
    const tasks = [
      makeTask({ id: "t-1", status: "not_started", target_date: "2026-04-01" }),
    ];
    const alerts = identifyInductionAlerts([], tasks, NOW);
    const found = alerts.filter((a) => a.type === "task_overdue");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires medium alert when probation ending within 14 days", () => {
    const soon = new Date(NOW);
    soon.setDate(soon.getDate() + 10);
    const records = [
      makeRecord({ id: "1", probation_status: "in_probation", probation_end_date: soon.toISOString().split("T")[0] }),
    ];
    const alerts = identifyInductionAlerts(records, [], NOW);
    expect(alerts.filter((a) => a.type === "probation_ending")).toHaveLength(1);
  });

  it("fires high alert when probation is overdue", () => {
    const records = [
      makeRecord({ id: "1", probation_status: "in_probation", probation_end_date: "2026-04-01" }),
    ];
    const alerts = identifyInductionAlerts(records, [], NOW);
    expect(alerts.filter((a) => a.type === "probation_overdue")).toHaveLength(1);
  });

  it("fires critical alert when working unsupervised without checks", () => {
    const records = [
      makeRecord({ id: "1", can_work_unsupervised: true, dbs_verified: false }),
    ];
    const alerts = identifyInductionAlerts(records, [], NOW);
    const found = alerts.filter((a) => a.type === "unsupervised_without_checks");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
  });
});

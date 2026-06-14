import { describe, it, expect } from "vitest";
import {
  computeTaskRiskScore,
  generateTaskReference,
  type TaskRiskAssessment,
} from "./task-service";
import type { CsTask } from "@/types/operations";

// ── Factory ──────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<CsTask> = {}): CsTask {
  return {
    id: "t1",
    home_id: "h1",
    reference: "CMP-TEST001",
    title: "Test task",
    description: null,
    category: "admin",
    priority: "medium",
    status: "not_started",
    assigned_to: "staff1",
    assigned_role: null,
    delegated_to: null,
    delegated_at: null,
    due_date: null,
    start_date: null,
    completed_at: null,
    completed_by: null,
    estimated_minutes: null,
    actual_minutes: null,
    recurring: false,
    recurring_schedule: null,
    recurrence_end: null,
    requires_sign_off: false,
    signed_off_by: null,
    signed_off_at: null,
    evidence_note: null,
    evidence_files: [],
    escalated: false,
    escalated_to: null,
    escalated_at: null,
    escalation_reason: null,
    escalation_level: 0,
    cara_risk_score: null,
    cara_risk_factors: null,
    cara_generated: false,
    cara_source: null,
    linked_child_id: null,
    linked_incident_id: null,
    linked_document_id: null,
    linked_form_id: null,
    linked_workflow_id: null,
    parent_task_id: null,
    tags: [],
    regulation_refs: [],
    created_by: null,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("computeTaskRiskScore", () => {
  it("returns low risk for basic admin task", () => {
    const task = makeTask({ priority: "medium", category: "admin" });
    const result = computeTaskRiskScore(task);
    expect(result.level).toBe("low");
    expect(result.score).toBeLessThan(25);
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it("scores higher for critical priority", () => {
    const result = computeTaskRiskScore(makeTask({ priority: "critical" }));
    expect(result.factors.find((f) => f.factor === "priority")!.weight).toBe(40);
  });

  it("scores higher for low priority as 5", () => {
    const result = computeTaskRiskScore(makeTask({ priority: "low" }));
    expect(result.factors.find((f) => f.factor === "priority")!.weight).toBe(5);
  });

  it("adds overdue factor when due_date is in the past", () => {
    const pastDate = new Date(Date.now() - 5 * 86400000).toISOString();
    const result = computeTaskRiskScore(makeTask({ due_date: pastDate }));
    expect(result.factors.some((f) => f.factor === "overdue")).toBe(true);
  });

  it("adds imminent factor when due within 48 hours", () => {
    const soonDate = new Date(Date.now() + 1 * 86400000).toISOString();
    const result = computeTaskRiskScore(makeTask({ due_date: soonDate }));
    expect(result.factors.some((f) => f.factor === "imminent")).toBe(true);
  });

  it("adds upcoming factor when due within 7 days", () => {
    const weekDate = new Date(Date.now() + 5 * 86400000).toISOString();
    const result = computeTaskRiskScore(makeTask({ due_date: weekDate }));
    expect(result.factors.some((f) => f.factor === "upcoming")).toBe(true);
  });

  it("adds escalation factor when escalated", () => {
    const result = computeTaskRiskScore(
      makeTask({ escalated: true, escalation_level: 2 }),
    );
    expect(result.factors.some((f) => f.factor === "escalated")).toBe(true);
    expect(result.factors.find((f) => f.factor === "escalated")!.weight).toBe(20);
  });

  it("adds category_risk for safeguarding category", () => {
    const result = computeTaskRiskScore(makeTask({ category: "safeguarding" }));
    expect(result.factors.some((f) => f.factor === "category_risk")).toBe(true);
  });

  it("adds unassigned factor when no assignee and not completed", () => {
    const result = computeTaskRiskScore(
      makeTask({ assigned_to: null, status: "not_started" }),
    );
    expect(result.factors.some((f) => f.factor === "unassigned")).toBe(true);
  });

  it("does not add unassigned for completed tasks", () => {
    const result = computeTaskRiskScore(
      makeTask({ assigned_to: null, status: "completed" }),
    );
    expect(result.factors.some((f) => f.factor === "unassigned")).toBe(false);
  });

  it("adds blocked factor for blocked status", () => {
    const result = computeTaskRiskScore(makeTask({ status: "blocked" }));
    expect(result.factors.some((f) => f.factor === "blocked")).toBe(true);
  });

  it("adds child_linked factor when linked_child_id present", () => {
    const result = computeTaskRiskScore(makeTask({ linked_child_id: "c1" }));
    expect(result.factors.some((f) => f.factor === "child_linked")).toBe(true);
  });

  it("caps score at 100", () => {
    const result = computeTaskRiskScore(
      makeTask({
        priority: "critical",
        category: "safeguarding",
        status: "blocked",
        assigned_to: null,
        escalated: true,
        escalation_level: 3,
        linked_child_id: "c1",
        due_date: new Date(Date.now() - 30 * 86400000).toISOString(),
      }),
    );
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns critical level when score >= 70", () => {
    const result = computeTaskRiskScore(
      makeTask({
        priority: "critical",
        category: "safeguarding",
        status: "blocked",
        assigned_to: null,
        escalated: true,
        escalation_level: 2,
        linked_child_id: "c1",
      }),
    );
    expect(result.level).toBe("critical");
  });
});

describe("generateTaskReference", () => {
  it("generates reference with correct category prefix", () => {
    const ref = generateTaskReference("compliance");
    expect(ref.startsWith("CMP-")).toBe(true);
  });

  it("generates reference for safeguarding category", () => {
    const ref = generateTaskReference("safeguarding");
    expect(ref.startsWith("SFG-")).toBe(true);
  });

  it("generates unique references on successive calls", () => {
    const ref1 = generateTaskReference("admin");
    const ref2 = generateTaskReference("admin");
    expect(ref1).not.toBe(ref2);
  });
});

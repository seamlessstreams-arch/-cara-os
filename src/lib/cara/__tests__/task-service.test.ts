// ══════════════════════════════════════════════════════════════════════════════
// Tests: Task Service — reference generation, Cara risk scoring
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/lib/services/task-service";
import type { CsTask } from "@/types/operations";

const { CATEGORY_PREFIX, generateTaskReference, computeTaskRiskScore } = _testing;

// Helper to create a minimal task for risk scoring
function makeTask(overrides: Partial<CsTask> = {}): CsTask {
  return {
    id: "t1",
    home_id: "h1",
    reference: "TSK-001",
    title: "Test task",
    description: null,
    category: "admin",
    priority: "medium",
    status: "not_started",
    assigned_to: "user1",
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
    created_by: "user1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Task Service", () => {
  // ── Category prefix ────────────────────────────────────────────────────
  describe("CATEGORY_PREFIX", () => {
    it("has prefixes for all 14 categories", () => {
      expect(Object.keys(CATEGORY_PREFIX).length).toBe(14);
    });

    it("each prefix is a 3-letter code", () => {
      for (const [, prefix] of Object.entries(CATEGORY_PREFIX)) {
        expect(prefix).toMatch(/^[A-Z]{3}$/);
      }
    });

    it("safeguarding prefix is SFG", () => {
      expect(CATEGORY_PREFIX.safeguarding).toBe("SFG");
    });

    it("cara_generated prefix is ARA", () => {
      expect(CATEGORY_PREFIX.cara_generated).toBe("ARA");
    });
  });

  // ── Reference generation ──────────────────────────────────────────────
  describe("generateTaskReference", () => {
    it("generates a reference with category prefix", () => {
      const ref = generateTaskReference("compliance");
      expect(ref).toMatch(/^CMP-/);
    });

    it("generates unique references", () => {
      const refs = new Set<string>();
      for (let i = 0; i < 50; i++) {
        refs.add(generateTaskReference("admin"));
      }
      expect(refs.size).toBe(50);
    });

    it("uses correct prefix for medication", () => {
      const ref = generateTaskReference("medication");
      expect(ref).toMatch(/^MED-/);
    });
  });

  // ── Cara risk scoring ─────────────────────────────────────────────────
  describe("computeTaskRiskScore", () => {
    it("low-priority unblocked task has low risk", () => {
      const result = computeTaskRiskScore(makeTask({ priority: "low" }));
      expect(result.score).toBeLessThan(25);
      expect(result.level).toBe("low");
    });

    it("critical priority increases score", () => {
      const low = computeTaskRiskScore(makeTask({ priority: "low" }));
      const critical = computeTaskRiskScore(makeTask({ priority: "critical" }));
      expect(critical.score).toBeGreaterThan(low.score);
    });

    it("overdue task increases score", () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const result = computeTaskRiskScore(makeTask({ due_date: yesterday }));
      expect(result.factors.some((f) => f.factor === "overdue")).toBe(true);
      expect(result.score).toBeGreaterThan(10);
    });

    it("task due within 48 hours has imminent factor", () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const result = computeTaskRiskScore(makeTask({ due_date: tomorrow }));
      expect(result.factors.some((f) => f.factor === "imminent")).toBe(true);
    });

    it("escalated task increases score", () => {
      const normal = computeTaskRiskScore(makeTask());
      const escalated = computeTaskRiskScore(makeTask({
        escalated: true,
        escalation_level: 2,
      }));
      expect(escalated.score).toBeGreaterThan(normal.score);
    });

    it("safeguarding category adds risk", () => {
      const admin = computeTaskRiskScore(makeTask({ category: "admin" }));
      const safeguarding = computeTaskRiskScore(makeTask({ category: "safeguarding" }));
      expect(safeguarding.score).toBeGreaterThan(admin.score);
    });

    it("unassigned task adds risk", () => {
      const assigned = computeTaskRiskScore(makeTask({ assigned_to: "user1" }));
      const unassigned = computeTaskRiskScore(makeTask({ assigned_to: null }));
      expect(unassigned.score).toBeGreaterThan(assigned.score);
    });

    it("blocked task adds risk", () => {
      const normal = computeTaskRiskScore(makeTask({ status: "in_progress" }));
      const blocked = computeTaskRiskScore(makeTask({ status: "blocked" }));
      expect(blocked.score).toBeGreaterThan(normal.score);
    });

    it("child-linked task adds risk", () => {
      const noChild = computeTaskRiskScore(makeTask());
      const withChild = computeTaskRiskScore(makeTask({ linked_child_id: "child1" }));
      expect(withChild.score).toBeGreaterThan(noChild.score);
    });

    it("score is capped at 100", () => {
      const worstCase = computeTaskRiskScore(makeTask({
        priority: "critical",
        due_date: new Date(Date.now() - 30 * 86400000).toISOString(),
        escalated: true,
        escalation_level: 5,
        category: "safeguarding",
        assigned_to: null,
        status: "blocked",
        linked_child_id: "child1",
      }));
      expect(worstCase.score).toBeLessThanOrEqual(100);
    });

    it("returns risk factors for each contributing element", () => {
      const result = computeTaskRiskScore(makeTask({
        priority: "high",
        category: "safeguarding",
        linked_child_id: "child1",
      }));
      expect(result.factors.length).toBeGreaterThanOrEqual(3);
      for (const f of result.factors) {
        expect(f.factor).toBeTruthy();
        expect(f.weight).toBeGreaterThan(0);
        expect(f.detail).toBeTruthy();
      }
    });

    it("maps score to correct level", () => {
      // Low
      const low = computeTaskRiskScore(makeTask({ priority: "low" }));
      expect(low.level).toBe("low");

      // Medium — due within 48 hours with medium priority
      const medium = computeTaskRiskScore(makeTask({
        priority: "medium",
        due_date: new Date(Date.now() + 86400000).toISOString(),
        linked_child_id: "c1",
      }));
      expect(["low", "medium"]).toContain(medium.level);

      // High
      const high = computeTaskRiskScore(makeTask({
        priority: "urgent",
        due_date: new Date(Date.now() - 5 * 86400000).toISOString(),
        escalated: true,
        escalation_level: 1,
      }));
      expect(["high", "critical"]).toContain(high.level);
    });
  });
});

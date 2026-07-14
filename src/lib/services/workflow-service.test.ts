import { describe, it, expect } from "vitest";
import {
  computeWorkflowProgress,
  getWorkflowTemplate,
  WORKFLOW_TEMPLATES,
  type WorkflowProgress,
} from "./workflow-service";
import type { CsWorkflowStep } from "@/types/operations";

// ── Factory ────────────────────────────────────────────────────────────────

function makeStep(overrides: Partial<CsWorkflowStep> = {}): CsWorkflowStep {
  return {
    id: "step-1",
    workflow_id: "wf-1",
    step_number: 1,
    title: "Test Step",
    description: "A test step",
    status: "pending",
    assigned_to: null,
    assigned_role: "registered_manager",
    evidence_required: true,
    evidence_ids: [],
    evidence_notes: null,
    completed_at: null,
    completed_by: null,
    completion_notes: null,
    due_date: null,
    auto_create_task: false,
    auto_task_template: null,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeWorkflowProgress ────────────────────────────────────────────────

describe("computeWorkflowProgress", () => {
  it("returns zeroes for empty steps", () => {
    const result = computeWorkflowProgress([]);
    expect(result).toEqual<WorkflowProgress>({
      total_steps: 0,
      completed: 0,
      skipped: 0,
      in_progress: 0,
      pending: 0,
      blocked: 0,
      percentage: 0,
    });
  });

  it("counts all pending steps correctly", () => {
    const steps = [makeStep(), makeStep({ id: "step-2", step_number: 2 })];
    const result = computeWorkflowProgress(steps);
    expect(result.total_steps).toBe(2);
    expect(result.pending).toBe(2);
    expect(result.completed).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("counts completed steps and computes percentage", () => {
    const steps = [
      makeStep({ status: "completed" }),
      makeStep({ id: "s2", step_number: 2, status: "completed" }),
      makeStep({ id: "s3", step_number: 3, status: "pending" }),
      makeStep({ id: "s4", step_number: 4, status: "in_progress" }),
    ];
    const result = computeWorkflowProgress(steps);
    expect(result.completed).toBe(2);
    expect(result.pending).toBe(1);
    expect(result.in_progress).toBe(1);
    expect(result.percentage).toBe(50); // 2 done out of 4
  });

  it("includes skipped steps in done percentage", () => {
    const steps = [
      makeStep({ status: "completed" }),
      makeStep({ id: "s2", step_number: 2, status: "skipped" }),
      makeStep({ id: "s3", step_number: 3, status: "pending" }),
    ];
    const result = computeWorkflowProgress(steps);
    expect(result.completed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.percentage).toBe(67); // Math.round(2/3 * 100) = 67
  });

  it("returns 100% when all steps are completed", () => {
    const steps = [
      makeStep({ status: "completed" }),
      makeStep({ id: "s2", step_number: 2, status: "completed" }),
    ];
    const result = computeWorkflowProgress(steps);
    expect(result.percentage).toBe(100);
  });

  it("counts blocked steps", () => {
    const steps = [
      makeStep({ status: "blocked" }),
      makeStep({ id: "s2", step_number: 2, status: "in_progress" }),
    ];
    const result = computeWorkflowProgress(steps);
    expect(result.blocked).toBe(1);
    expect(result.in_progress).toBe(1);
    expect(result.percentage).toBe(0);
  });

  it("handles mixed statuses correctly", () => {
    const steps = [
      makeStep({ status: "completed" }),
      makeStep({ id: "s2", step_number: 2, status: "skipped" }),
      makeStep({ id: "s3", step_number: 3, status: "in_progress" }),
      makeStep({ id: "s4", step_number: 4, status: "pending" }),
      makeStep({ id: "s5", step_number: 5, status: "blocked" }),
    ];
    const result = computeWorkflowProgress(steps);
    expect(result.total_steps).toBe(5);
    expect(result.completed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.in_progress).toBe(1);
    expect(result.pending).toBe(1);
    expect(result.blocked).toBe(1);
    expect(result.percentage).toBe(40); // 2 done out of 5
  });
});

// ── getWorkflowTemplate ────────────────────────────────────────────────────

describe("getWorkflowTemplate", () => {
  it("returns undefined for unknown code", () => {
    expect(getWorkflowTemplate("nonexistent" as any)).toBeUndefined();
  });

  it("returns correct template for new_placement", () => {
    const t = getWorkflowTemplate("new_placement");
    expect(t).toBeDefined();
    expect(t!.code).toBe("new_placement");
    expect(t!.steps.length).toBe(8);
  });

  it("returns correct template for incident_response", () => {
    const t = getWorkflowTemplate("incident_response");
    expect(t).toBeDefined();
    expect(t!.category).toBe("safeguarding");
    expect(t!.steps.length).toBe(6);
  });

  it("all templates have non-empty steps and regulation refs", () => {
    for (const tmpl of WORKFLOW_TEMPLATES) {
      expect(tmpl.steps.length).toBeGreaterThan(0);
      expect(tmpl.regulation_refs.length).toBeGreaterThan(0);
    }
  });
});

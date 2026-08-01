// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFLOW ENGINE SERVICE TESTS
// Pure-function unit tests for workflow progress computation, template lookup,
// and constant/template validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../workflow-service";

import type { CsWorkflowStep, WorkflowStepStatus } from "@/types/operations";

const { WORKFLOW_TEMPLATES, computeWorkflowProgress, getWorkflowTemplate } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal CsWorkflowStep with sensible defaults. */
function makeStep(
  overrides: Partial<CsWorkflowStep> = {},
): CsWorkflowStep {
  return {
    id: "id" in overrides ? overrides.id! : "step-1",
    workflow_id: "workflow_id" in overrides ? overrides.workflow_id! : "wf-1",
    step_number: "step_number" in overrides ? overrides.step_number! : 1,
    title: "title" in overrides ? overrides.title! : "Test Step",
    description: "description" in overrides ? overrides.description! : "A test step",
    status: "status" in overrides ? overrides.status! : "pending",
    assigned_to: "assigned_to" in overrides ? overrides.assigned_to! : null,
    assigned_role: "assigned_role" in overrides ? overrides.assigned_role! : "team_leader",
    evidence_required: "evidence_required" in overrides ? overrides.evidence_required! : true,
    evidence_ids: "evidence_ids" in overrides ? overrides.evidence_ids! : [],
    evidence_notes: "evidence_notes" in overrides ? overrides.evidence_notes! : null,
    completed_at: "completed_at" in overrides ? overrides.completed_at! : null,
    completed_by: "completed_by" in overrides ? overrides.completed_by! : null,
    completion_notes: "completion_notes" in overrides ? overrides.completion_notes! : null,
    due_date: "due_date" in overrides ? overrides.due_date! : null,
    auto_create_task: "auto_create_task" in overrides ? overrides.auto_create_task! : false,
    auto_task_template: "auto_task_template" in overrides ? overrides.auto_task_template! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T08:00:00Z",
  };
}

/** Build several steps with the given statuses. */
function makeSteps(statuses: WorkflowStepStatus[]): CsWorkflowStep[] {
  return statuses.map((status, idx) =>
    makeStep({ id: `step-${idx + 1}`, step_number: idx + 1, status }),
  );
}

// ── WORKFLOW_TEMPLATES constant ───────────────────────────────────────────

describe("WORKFLOW_TEMPLATES", () => {
  it("contains exactly 7 templates", () => {
    expect(WORKFLOW_TEMPLATES).toHaveLength(7);
  });

  it("has unique template codes", () => {
    const codes = WORKFLOW_TEMPLATES.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("includes the expected template codes", () => {
    const codes = WORKFLOW_TEMPLATES.map((t) => t.code);
    expect(codes).toContain("new_placement");
    expect(codes).toContain("incident_response");
    expect(codes).toContain("missing_episode");
    expect(codes).toContain("reg44_report");
    expect(codes).toContain("reg45_review");
    expect(codes).toContain("staff_onboarding");
    expect(codes).toContain("placement_ending");
  });

  it("every template has a non-empty title and description", () => {
    for (const t of WORKFLOW_TEMPLATES) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
    }
  });

  it("every template has a category string", () => {
    for (const t of WORKFLOW_TEMPLATES) {
      expect(typeof t.category).toBe("string");
      expect(t.category.length).toBeGreaterThan(0);
    }
  });

  it("every template has at least one regulation reference", () => {
    for (const t of WORKFLOW_TEMPLATES) {
      expect(t.regulation_refs.length).toBeGreaterThan(0);
    }
  });

  it("every template has at least one step", () => {
    for (const t of WORKFLOW_TEMPLATES) {
      expect(t.steps.length).toBeGreaterThan(0);
    }
  });

  it("every step in every template has required fields", () => {
    for (const t of WORKFLOW_TEMPLATES) {
      for (const step of t.steps) {
        expect(typeof step.title).toBe("string");
        expect(step.title.length).toBeGreaterThan(0);
        expect(typeof step.description).toBe("string");
        expect(step.description.length).toBeGreaterThan(0);
        expect(typeof step.assigned_role).toBe("string");
        expect(typeof step.evidence_required).toBe("boolean");
        expect(typeof step.auto_create_task).toBe("boolean");
      }
    }
  });

  it("new_placement template has 8 steps", () => {
    const np = WORKFLOW_TEMPLATES.find((t) => t.code === "new_placement");
    expect(np).toBeDefined();
    expect(np!.steps).toHaveLength(8);
  });

  it("incident_response template has 6 steps", () => {
    const ir = WORKFLOW_TEMPLATES.find((t) => t.code === "incident_response");
    expect(ir).toBeDefined();
    expect(ir!.steps).toHaveLength(6);
  });

  it("templates cover expected categories", () => {
    const categories = new Set(WORKFLOW_TEMPLATES.map((t) => t.category));
    expect(categories).toContain("placement");
    expect(categories).toContain("safeguarding");
    expect(categories).toContain("compliance");
    expect(categories).toContain("staffing");
  });

  it("some steps include estimated_hours", () => {
    const allSteps = WORKFLOW_TEMPLATES.flatMap((t) => t.steps);
    const withHours = allSteps.filter((s) => s.estimated_hours !== undefined);
    expect(withHours.length).toBeGreaterThan(0);
  });
});

// ── computeWorkflowProgress ───────────────────────────────────────────────

describe("computeWorkflowProgress", () => {
  it("returns zeroed stats for an empty steps array", () => {
    const result = computeWorkflowProgress([]);
    expect(result.total_steps).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.in_progress).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.blocked).toBe(0);
    expect(result.percentage).toBeNull();;
  });

  it("calculates 100% when all steps are completed", () => {
    const steps = makeSteps(["completed", "completed", "completed"]);
    const result = computeWorkflowProgress(steps);
    expect(result.total_steps).toBe(3);
    expect(result.completed).toBe(3);
    expect(result.percentage).toBe(100);
  });

  it("calculates 0% when all steps are pending", () => {
    const steps = makeSteps(["pending", "pending", "pending", "pending"]);
    const result = computeWorkflowProgress(steps);
    expect(result.total_steps).toBe(4);
    expect(result.pending).toBe(4);
    expect(result.percentage).toBe(0);
  });

  it("counts skipped steps as done in percentage", () => {
    const steps = makeSteps(["completed", "skipped", "pending"]);
    const result = computeWorkflowProgress(steps);
    expect(result.completed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.pending).toBe(1);
    expect(result.percentage).toBe(67); // Math.round(2/3 * 100)
  });

  it("counts in_progress steps correctly", () => {
    const steps = makeSteps(["completed", "in_progress", "pending"]);
    const result = computeWorkflowProgress(steps);
    expect(result.in_progress).toBe(1);
    expect(result.percentage).toBe(33); // only completed counts as done
  });

  it("counts blocked steps correctly", () => {
    const steps = makeSteps(["completed", "blocked", "pending"]);
    const result = computeWorkflowProgress(steps);
    expect(result.blocked).toBe(1);
    expect(result.percentage).toBe(33);
  });

  it("handles a mix of all statuses", () => {
    const steps = makeSteps(["completed", "skipped", "in_progress", "pending", "blocked"]);
    const result = computeWorkflowProgress(steps);
    expect(result.total_steps).toBe(5);
    expect(result.completed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.in_progress).toBe(1);
    expect(result.pending).toBe(1);
    expect(result.blocked).toBe(1);
    expect(result.percentage).toBe(40); // Math.round(2/5 * 100)
  });

  it("rounds percentage correctly for non-even splits", () => {
    // 1 completed out of 3 = 33.33... -> 33
    const steps = makeSteps(["completed", "pending", "pending"]);
    const result = computeWorkflowProgress(steps);
    expect(result.percentage).toBe(33);
  });

  it("handles a single completed step", () => {
    const steps = makeSteps(["completed"]);
    const result = computeWorkflowProgress(steps);
    expect(result.total_steps).toBe(1);
    expect(result.completed).toBe(1);
    expect(result.percentage).toBe(100);
  });

  it("handles a single pending step", () => {
    const steps = makeSteps(["pending"]);
    const result = computeWorkflowProgress(steps);
    expect(result.total_steps).toBe(1);
    expect(result.pending).toBe(1);
    expect(result.percentage).toBe(0);
  });

  it("treats unrecognised status values as uncounted", () => {
    const steps = [makeStep({ status: "unknown_status" as WorkflowStepStatus })];
    const result = computeWorkflowProgress(steps);
    expect(result.total_steps).toBe(1);
    expect(result.completed).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.in_progress).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.blocked).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("returns correct percentage for all-skipped steps", () => {
    const steps = makeSteps(["skipped", "skipped"]);
    const result = computeWorkflowProgress(steps);
    expect(result.skipped).toBe(2);
    expect(result.percentage).toBe(100);
  });
});

// ── getWorkflowTemplate ───────────────────────────────────────────────────

describe("getWorkflowTemplate", () => {
  it("returns the correct template for new_placement", () => {
    const t = getWorkflowTemplate("new_placement");
    expect(t).toBeDefined();
    expect(t!.code).toBe("new_placement");
    expect(t!.title).toBe("New Placement Admission");
  });

  it("returns the correct template for incident_response", () => {
    const t = getWorkflowTemplate("incident_response");
    expect(t).toBeDefined();
    expect(t!.code).toBe("incident_response");
    expect(t!.title).toBe("Significant Incident Response");
  });

  it("returns the correct template for missing_episode", () => {
    const t = getWorkflowTemplate("missing_episode");
    expect(t).toBeDefined();
    expect(t!.code).toBe("missing_episode");
    expect(t!.title).toBe("Missing from Care Episode");
    expect(t!.steps).toHaveLength(7);
  });

  it("returns the correct template for reg44_report", () => {
    const t = getWorkflowTemplate("reg44_report");
    expect(t).toBeDefined();
    expect(t!.code).toBe("reg44_report");
    expect(t!.category).toBe("compliance");
  });

  it("returns the correct template for reg45_review", () => {
    const t = getWorkflowTemplate("reg45_review");
    expect(t).toBeDefined();
    expect(t!.code).toBe("reg45_review");
    expect(t!.steps).toHaveLength(7);
  });

  it("returns the correct template for staff_onboarding", () => {
    const t = getWorkflowTemplate("staff_onboarding");
    expect(t).toBeDefined();
    expect(t!.code).toBe("staff_onboarding");
    expect(t!.category).toBe("staffing");
  });

  it("returns the correct template for placement_ending", () => {
    const t = getWorkflowTemplate("placement_ending");
    expect(t).toBeDefined();
    expect(t!.code).toBe("placement_ending");
    expect(t!.steps).toHaveLength(5);
  });

  it("returns undefined for an unknown template code", () => {
    // Cast to satisfy the type parameter while testing invalid input
    const t = getWorkflowTemplate("nonexistent_template" as never);
    expect(t).toBeUndefined();
  });

  it("returns undefined for an empty string code", () => {
    const t = getWorkflowTemplate("" as never);
    expect(t).toBeUndefined();
  });

  it("returned template includes regulation_refs array", () => {
    const t = getWorkflowTemplate("new_placement");
    expect(t).toBeDefined();
    expect(Array.isArray(t!.regulation_refs)).toBe(true);
    expect(t!.regulation_refs.length).toBeGreaterThan(0);
  });

  it("returned template steps have assigned_role on every step", () => {
    const t = getWorkflowTemplate("incident_response");
    expect(t).toBeDefined();
    for (const step of t!.steps) {
      expect(typeof step.assigned_role).toBe("string");
      expect(step.assigned_role.length).toBeGreaterThan(0);
    }
  });

  it("returned template is the same object reference as in WORKFLOW_TEMPLATES", () => {
    const t = getWorkflowTemplate("staff_onboarding");
    const fromArray = WORKFLOW_TEMPLATES.find((tpl) => tpl.code === "staff_onboarding");
    expect(t).toBe(fromArray);
  });
});

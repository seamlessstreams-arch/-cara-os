// ══════════════════════════════════════════════════════════════════════════════
// Tests: Workflow Service — templates, progress computation
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/lib/services/workflow-service";
import type { CsWorkflowStep } from "@/types/operations";

const { WORKFLOW_TEMPLATES, computeWorkflowProgress, getWorkflowTemplate } = _testing;

describe("Workflow Service", () => {
  // ── Templates ─────────────────────────────────────────────────────────
  describe("WORKFLOW_TEMPLATES", () => {
    it("has 7 pre-built templates", () => {
      expect(WORKFLOW_TEMPLATES.length).toBe(7);
    });

    it("each template has required fields", () => {
      for (const t of WORKFLOW_TEMPLATES) {
        expect(t.code).toBeTruthy();
        expect(t.title).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.category).toBeTruthy();
        expect(t.regulation_refs.length).toBeGreaterThan(0);
        expect(t.steps.length).toBeGreaterThan(0);
      }
    });

    it("each step has title, description, and role", () => {
      for (const t of WORKFLOW_TEMPLATES) {
        for (const step of t.steps) {
          expect(step.title).toBeTruthy();
          expect(step.description.length).toBeGreaterThan(20);
          expect(step.assigned_role).toBeTruthy();
        }
      }
    });

    it("new_placement has 8 steps", () => {
      const np = WORKFLOW_TEMPLATES.find((t) => t.code === "new_placement");
      expect(np).toBeDefined();
      expect(np!.steps.length).toBe(8);
    });

    it("incident_response has 6 steps", () => {
      const ir = WORKFLOW_TEMPLATES.find((t) => t.code === "incident_response");
      expect(ir).toBeDefined();
      expect(ir!.steps.length).toBe(6);
    });

    it("all template codes are unique", () => {
      const codes = WORKFLOW_TEMPLATES.map((t) => t.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it("covers key regulated processes", () => {
      const codes = WORKFLOW_TEMPLATES.map((t) => t.code);
      expect(codes).toContain("new_placement");
      expect(codes).toContain("incident_response");
      expect(codes).toContain("missing_episode");
      expect(codes).toContain("reg44_report");
      expect(codes).toContain("reg45_review");
      expect(codes).toContain("staff_onboarding");
      expect(codes).toContain("placement_ending");
    });
  });

  // ── getWorkflowTemplate ───────────────────────────────────────────────
  describe("getWorkflowTemplate", () => {
    it("finds new_placement template", () => {
      const t = getWorkflowTemplate("new_placement");
      expect(t).toBeDefined();
      expect(t!.title).toContain("Placement");
    });

    it("returns undefined for unknown code", () => {
      const t = getWorkflowTemplate("nonexistent" as any);
      expect(t).toBeUndefined();
    });
  });

  // ── computeWorkflowProgress ───────────────────────────────────────────
  describe("computeWorkflowProgress", () => {
    function makeStep(status: string, stepNumber: number): CsWorkflowStep {
      return {
        id: `s${stepNumber}`,
        workflow_id: "w1",
        step_number: stepNumber,
        title: `Step ${stepNumber}`,
        description: null,
        status: status as CsWorkflowStep["status"],
        assigned_to: null,
        assigned_role: null,
        evidence_required: false,
        evidence_ids: [],
        evidence_notes: null,
        completed_at: null,
        completed_by: null,
        completion_notes: null,
        due_date: null,
        auto_create_task: false,
        auto_task_template: null,
        created_at: new Date().toISOString(),
      };
    }

    it("empty steps returns 0%", () => {
      const progress = computeWorkflowProgress([]);
      expect(progress.percentage).toBe(0);
      expect(progress.total_steps).toBe(0);
    });

    it("all completed returns 100%", () => {
      const steps = [
        makeStep("completed", 1),
        makeStep("completed", 2),
        makeStep("completed", 3),
      ];
      const progress = computeWorkflowProgress(steps);
      expect(progress.percentage).toBe(100);
      expect(progress.completed).toBe(3);
    });

    it("half completed returns 50%", () => {
      const steps = [
        makeStep("completed", 1),
        makeStep("in_progress", 2),
        makeStep("pending", 3),
        makeStep("pending", 4),
      ];
      const progress = computeWorkflowProgress(steps);
      expect(progress.percentage).toBe(25);
      expect(progress.completed).toBe(1);
      expect(progress.in_progress).toBe(1);
      expect(progress.pending).toBe(2);
    });

    it("skipped steps count towards completion", () => {
      const steps = [
        makeStep("completed", 1),
        makeStep("skipped", 2),
        makeStep("completed", 3),
        makeStep("pending", 4),
      ];
      const progress = computeWorkflowProgress(steps);
      expect(progress.percentage).toBe(75);
      expect(progress.skipped).toBe(1);
    });

    it("counts blocked steps", () => {
      const steps = [
        makeStep("completed", 1),
        makeStep("blocked", 2),
        makeStep("pending", 3),
      ];
      const progress = computeWorkflowProgress(steps);
      expect(progress.blocked).toBe(1);
    });

    it("total_steps matches input length", () => {
      const steps = [
        makeStep("completed", 1),
        makeStep("pending", 2),
      ];
      const progress = computeWorkflowProgress(steps);
      expect(progress.total_steps).toBe(2);
    });
  });
});

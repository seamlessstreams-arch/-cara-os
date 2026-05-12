// ══════════════════════════════════════════════════════════════════════════════
// Tests: AriaKeyWorkPlanner _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/aria/aria-key-work-planner";

const { PRIORITY_CONFIG, SOURCE_CONFIG, getDemoKeyWorkPlan } = _testing;

describe("AriaKeyWorkPlanner", () => {
  describe("PRIORITY_CONFIG", () => {
    it("has essential, recommended, and optional", () => {
      expect(PRIORITY_CONFIG.essential).toBeDefined();
      expect(PRIORITY_CONFIG.recommended).toBeDefined();
      expect(PRIORITY_CONFIG.optional).toBeDefined();
    });

    it("each priority has label, colour, bg, and dot", () => {
      for (const [, cfg] of Object.entries(PRIORITY_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.dot).toBeTruthy();
      }
    });
  });

  describe("SOURCE_CONFIG", () => {
    it("has all 6 topic sources", () => {
      const sources = ["risk_assessment", "incident", "care_plan", "regulation", "positive_practice", "voice_of_child"];
      for (const s of sources) {
        expect(SOURCE_CONFIG[s as keyof typeof SOURCE_CONFIG]).toBeDefined();
      }
    });
  });

  describe("getDemoKeyWorkPlan", () => {
    const plan = getDemoKeyWorkPlan();

    it("has child name and ID", () => {
      expect(plan.childName).toBeTruthy();
      expect(plan.childId).toBeTruthy();
    });

    it("has last session date and days since", () => {
      expect(plan.lastSessionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(plan.daysSinceLastSession).toBeGreaterThanOrEqual(0);
    });

    it("has regulatory context", () => {
      expect(plan.regulatoryContext.length).toBeGreaterThan(20);
    });

    it("has prep checklist items", () => {
      expect(plan.prepChecklist.length).toBeGreaterThan(3);
    });

    it("has multiple suggested topics", () => {
      expect(plan.suggestedTopics.length).toBeGreaterThan(3);
    });

    it("each topic has required fields", () => {
      for (const t of plan.suggestedTopics) {
        expect(t.id).toBeTruthy();
        expect(t.title).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(["essential", "recommended", "optional"]).toContain(t.priority);
        expect(t.suggestedQuestions.length).toBeGreaterThan(0);
        expect(t.evidenceFor.length).toBeGreaterThan(0);
        expect(t.timeEstimate).toBeGreaterThan(0);
      }
    });

    it("includes essential topics", () => {
      const essential = plan.suggestedTopics.filter((t) => t.priority === "essential");
      expect(essential.length).toBeGreaterThan(0);
    });

    it("suggested questions are age-appropriate strings", () => {
      for (const t of plan.suggestedTopics) {
        for (const q of t.suggestedQuestions) {
          expect(q.length).toBeGreaterThan(10);
          expect(typeof q).toBe("string");
        }
      }
    });
  });
});

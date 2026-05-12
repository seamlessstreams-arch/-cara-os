// ══════════════════════════════════════════════════════════════════════════════
// Tests: AriaComplianceCalendar _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/aria/aria-compliance-calendar";

const { STATUS_CONFIG, TYPE_ICONS, getDemoDeadlines } = _testing;

describe("AriaComplianceCalendar", () => {
  describe("STATUS_CONFIG", () => {
    it("has all five deadline statuses", () => {
      expect(STATUS_CONFIG.overdue).toBeDefined();
      expect(STATUS_CONFIG.due_today).toBeDefined();
      expect(STATUS_CONFIG.due_soon).toBeDefined();
      expect(STATUS_CONFIG.upcoming).toBeDefined();
      expect(STATUS_CONFIG.complete).toBeDefined();
    });

    it("each status has label, colour, bg, and dot", () => {
      for (const [, cfg] of Object.entries(STATUS_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.dot).toBeTruthy();
      }
    });
  });

  describe("TYPE_ICONS", () => {
    it("has icons for all deadline types", () => {
      const types = [
        "reg45_report", "supervision", "training_renewal",
        "risk_assessment_review", "care_plan_review", "fire_drill",
        "medication_audit", "lac_review", "annual_review",
      ];
      for (const t of types) {
        expect(TYPE_ICONS[t as keyof typeof TYPE_ICONS]).toBeDefined();
      }
    });
  });

  describe("getDemoDeadlines", () => {
    const deadlines = getDemoDeadlines();

    it("returns multiple deadlines", () => {
      expect(deadlines.length).toBeGreaterThan(5);
    });

    it("each deadline has required fields", () => {
      for (const d of deadlines) {
        expect(d.id).toBeTruthy();
        expect(d.type).toBeTruthy();
        expect(d.title).toBeTruthy();
        expect(d.description).toBeTruthy();
        expect(d.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof d.daysUntilDue).toBe("number");
        expect(["overdue", "due_today", "due_soon", "upcoming", "complete"]).toContain(d.status);
      }
    });

    it("includes at least one overdue deadline", () => {
      const overdue = deadlines.filter((d) => d.status === "overdue");
      expect(overdue.length).toBeGreaterThan(0);
    });

    it("includes at least one complete deadline", () => {
      const complete = deadlines.filter((d) => d.status === "complete");
      expect(complete.length).toBeGreaterThan(0);
    });

    it("overdue deadlines have negative daysUntilDue", () => {
      const overdue = deadlines.filter((d) => d.status === "overdue");
      for (const d of overdue) {
        expect(d.daysUntilDue).toBeLessThan(0);
      }
    });

    it("due_today deadlines have daysUntilDue of 0", () => {
      const dueToday = deadlines.filter((d) => d.status === "due_today");
      for (const d of dueToday) {
        expect(d.daysUntilDue).toBe(0);
      }
    });

    it("covers multiple deadline types", () => {
      const types = new Set(deadlines.map((d) => d.type));
      expect(types.size).toBeGreaterThanOrEqual(5);
    });
  });
});

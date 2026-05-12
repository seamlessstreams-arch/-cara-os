// ══════════════════════════════════════════════════════════════════════════════
// Tests: AriaStaffWellbeing _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/aria/aria-staff-wellbeing";

const { WELLBEING_CONFIG, SUP_STATUS_CONFIG, getDemoStaffWellbeing } = _testing;

describe("AriaStaffWellbeing", () => {
  describe("WELLBEING_CONFIG", () => {
    it("has all four wellbeing levels", () => {
      expect(WELLBEING_CONFIG.good).toBeDefined();
      expect(WELLBEING_CONFIG.caution).toBeDefined();
      expect(WELLBEING_CONFIG.concern).toBeDefined();
      expect(WELLBEING_CONFIG.critical).toBeDefined();
    });

    it("each level has label, colour, bg, and dot", () => {
      for (const [, cfg] of Object.entries(WELLBEING_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.dot).toBeTruthy();
      }
    });
  });

  describe("SUP_STATUS_CONFIG", () => {
    it("has on_track, due_soon, and overdue", () => {
      expect(SUP_STATUS_CONFIG.on_track).toBeDefined();
      expect(SUP_STATUS_CONFIG.due_soon).toBeDefined();
      expect(SUP_STATUS_CONFIG.overdue).toBeDefined();
    });
  });

  describe("getDemoStaffWellbeing", () => {
    const staff = getDemoStaffWellbeing();

    it("returns 5 staff members", () => {
      expect(staff).toHaveLength(5);
    });

    it("each staff member has required fields", () => {
      for (const s of staff) {
        expect(s.staffId).toBeTruthy();
        expect(s.staffName).toBeTruthy();
        expect(s.role).toBeTruthy();
        expect(["good", "caution", "concern", "critical"]).toContain(s.wellbeingLevel);
        expect(["on_track", "due_soon", "overdue"]).toContain(s.supervisionStatus);
        expect(typeof s.daysSinceSupervision).toBe("number");
        expect(typeof s.weeklyHoursAvg4w).toBe("number");
        expect(typeof s.contractedHours).toBe("number");
        expect(typeof s.trainingCompliance).toBe("number");
        expect(s.trainingCompliance).toBeGreaterThanOrEqual(0);
        expect(s.trainingCompliance).toBeLessThanOrEqual(100);
        expect(["improving", "stable", "declining"]).toContain(s.trend);
        expect(Array.isArray(s.flags)).toBe(true);
      }
    });

    it("includes staff at different wellbeing levels", () => {
      const levels = new Set(staff.map((s) => s.wellbeingLevel));
      expect(levels.size).toBeGreaterThanOrEqual(3);
    });

    it("critical/concern staff have flags", () => {
      const atRisk = staff.filter((s) => s.wellbeingLevel === "critical" || s.wellbeingLevel === "concern");
      for (const s of atRisk) {
        expect(s.flags.length).toBeGreaterThan(0);
      }
    });

    it("at-risk staff have suggestions", () => {
      const atRisk = staff.filter((s) => s.wellbeingLevel === "critical" || s.wellbeingLevel === "concern");
      for (const s of atRisk) {
        expect(s.suggestion).toBeTruthy();
      }
    });

    it("includes at least one overdue supervision", () => {
      expect(staff.some((s) => s.supervisionStatus === "overdue")).toBe(true);
    });
  });
});

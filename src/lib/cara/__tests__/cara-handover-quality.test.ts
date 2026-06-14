// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraHandoverQuality _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-handover-quality";

const { QUALITY_CONFIG, CHECK_STATUS_CONFIG, TREND_CONFIG, getDemoHandoverQuality } = _testing;

describe("CaraHandoverQuality", () => {
  describe("QUALITY_CONFIG", () => {
    it("has all four quality levels", () => {
      expect(QUALITY_CONFIG.excellent).toBeDefined();
      expect(QUALITY_CONFIG.good).toBeDefined();
      expect(QUALITY_CONFIG.needs_improvement).toBeDefined();
      expect(QUALITY_CONFIG.poor).toBeDefined();
    });

    it("each level has label, colour, and bg", () => {
      for (const [, cfg] of Object.entries(QUALITY_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
      }
    });
  });

  describe("CHECK_STATUS_CONFIG", () => {
    it("has pass, warning, and fail statuses", () => {
      expect(CHECK_STATUS_CONFIG.pass).toBeDefined();
      expect(CHECK_STATUS_CONFIG.warning).toBeDefined();
      expect(CHECK_STATUS_CONFIG.fail).toBeDefined();
    });
  });

  describe("TREND_CONFIG", () => {
    it("has improving, stable, and declining trends", () => {
      expect(TREND_CONFIG.improving).toBeDefined();
      expect(TREND_CONFIG.stable).toBeDefined();
      expect(TREND_CONFIG.declining).toBeDefined();
    });
  });

  describe("getDemoHandoverQuality", () => {
    const data = getDemoHandoverQuality();

    it("has a shift date and type", () => {
      expect(data.shiftDate).toBeTruthy();
      expect(data.shiftType).toBeTruthy();
    });

    it("quality score is between 0 and 100", () => {
      expect(data.qualityScore).toBeGreaterThanOrEqual(0);
      expect(data.qualityScore).toBeLessThanOrEqual(100);
    });

    it("quality level matches a known level", () => {
      expect(["excellent", "good", "needs_improvement", "poor"]).toContain(data.qualityLevel);
    });

    it("has a valid trend", () => {
      expect(["improving", "stable", "declining"]).toContain(data.trend);
    });

    it("has 8 quality checks", () => {
      expect(data.checks).toHaveLength(8);
    });

    it("each check has required fields", () => {
      for (const check of data.checks) {
        expect(check.id).toBeTruthy();
        expect(check.category).toBeTruthy();
        expect(check.label).toBeTruthy();
        expect(check.description).toBeTruthy();
        expect(["pass", "warning", "fail"]).toContain(check.status);
        expect(check.detail).toBeTruthy();
      }
    });

    it("has a mix of pass, warning, and fail statuses", () => {
      const statuses = new Set(data.checks.map((c) => c.status));
      expect(statuses.size).toBeGreaterThanOrEqual(2);
    });

    it("average 7-day score is reasonable", () => {
      expect(data.averageScore7d).toBeGreaterThanOrEqual(0);
      expect(data.averageScore7d).toBeLessThanOrEqual(100);
    });

    it("covers all 8 check categories", () => {
      const categories = new Set(data.checks.map((c) => c.category));
      expect(categories.size).toBe(8);
    });
  });
});

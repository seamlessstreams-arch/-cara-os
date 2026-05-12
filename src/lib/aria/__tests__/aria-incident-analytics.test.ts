// ══════════════════════════════════════════════════════════════════════════════
// Tests: AriaIncidentAnalytics _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/aria/aria-incident-analytics";

const { TREND_CONFIG, getDemoIncidentAnalytics } = _testing;

describe("AriaIncidentAnalytics", () => {
  describe("TREND_CONFIG", () => {
    it("has increasing, stable, and decreasing", () => {
      expect(TREND_CONFIG.increasing).toBeDefined();
      expect(TREND_CONFIG.stable).toBeDefined();
      expect(TREND_CONFIG.decreasing).toBeDefined();
    });

    it("each trend has icon, label, and colour", () => {
      for (const [, cfg] of Object.entries(TREND_CONFIG)) {
        expect(cfg.icon).toBeTruthy();
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
      }
    });
  });

  describe("getDemoIncidentAnalytics", () => {
    const data = getDemoIncidentAnalytics();

    it("has period label", () => {
      expect(data.period).toBeTruthy();
    });

    it("has valid incident counts", () => {
      expect(data.totalIncidents30d).toBeGreaterThan(0);
      expect(data.totalIncidents90d).toBeGreaterThanOrEqual(data.totalIncidents30d);
    });

    it("has valid trend", () => {
      expect(["increasing", "stable", "decreasing"]).toContain(data.trend);
    });

    it("has 4 time slots that sum to 100%", () => {
      expect(data.timeSlots).toHaveLength(4);
      const total = data.timeSlots.reduce((sum, s) => sum + s.percentage, 0);
      expect(total).toBeGreaterThanOrEqual(98); // allow rounding
      expect(total).toBeLessThanOrEqual(102);
    });

    it("each time slot has required fields", () => {
      for (const slot of data.timeSlots) {
        expect(slot.label).toBeTruthy();
        expect(typeof slot.count).toBe("number");
        expect(typeof slot.percentage).toBe("number");
      }
    });

    it("has trigger patterns with valid fields", () => {
      expect(data.triggers.length).toBeGreaterThan(0);
      for (const t of data.triggers) {
        expect(t.trigger).toBeTruthy();
        expect(typeof t.count).toBe("number");
        expect(typeof t.percentage).toBe("number");
        expect(["increasing", "stable", "decreasing"]).toContain(t.trend);
      }
    });

    it("has child patterns", () => {
      expect(data.childPatterns.length).toBeGreaterThan(0);
      for (const cp of data.childPatterns) {
        expect(cp.childName).toBeTruthy();
        expect(typeof cp.count30d).toBe("number");
        expect(typeof cp.count90d).toBe("number");
        expect(["increasing", "stable", "decreasing"]).toContain(cp.trend);
        expect(cp.primaryTrigger).toBeTruthy();
        expect(cp.peakTime).toBeTruthy();
      }
    });

    it("has ARIA insights", () => {
      expect(data.ariaInsights.length).toBeGreaterThan(0);
      for (const insight of data.ariaInsights) {
        expect(insight.length).toBeGreaterThan(10);
      }
    });

    it("physical intervention rate is between 0 and 100", () => {
      expect(data.physicalInterventionRate).toBeGreaterThanOrEqual(0);
      expect(data.physicalInterventionRate).toBeLessThanOrEqual(100);
    });

    it("management oversight rate is between 0 and 100", () => {
      expect(data.managementOversightRate).toBeGreaterThanOrEqual(0);
      expect(data.managementOversightRate).toBeLessThanOrEqual(100);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraSmartSummary _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-smart-summary";

const { TREND_CONFIG, getDemoSummary } = _testing;

describe("CaraSmartSummary", () => {
  describe("TREND_CONFIG", () => {
    it("has all 4 trend types", () => {
      expect(TREND_CONFIG.improving).toBeDefined();
      expect(TREND_CONFIG.stable).toBeDefined();
      expect(TREND_CONFIG.declining).toBeDefined();
      expect(TREND_CONFIG.new_concern).toBeDefined();
    });

    it("each trend has label, icon, colour, and bg", () => {
      for (const [, config] of Object.entries(TREND_CONFIG)) {
        expect(config.label).toBeTruthy();
        expect(config.icon).toBeTruthy();
        expect(config.colour).toBeTruthy();
        expect(config.bg).toBeTruthy();
      }
    });
  });

  describe("getDemoSummary", () => {
    it("returns summary for a given child", () => {
      const summary = getDemoSummary("demo-child-1", 14);
      expect(summary.childId).toBe("demo-child-1");
      expect(summary.childName).toBe("Jayden Mitchell");
      expect(summary.periodDays).toBe(14);
    });

    it("has required structure fields", () => {
      const summary = getDemoSummary("demo-child-1", 14);
      expect(summary.headline).toBeTruthy();
      expect(summary.overallTrend).toBeTruthy();
      expect(summary.generatedAt).toBeTruthy();
    });

    it("has at least 3 sections", () => {
      const summary = getDemoSummary("demo-child-1", 14);
      expect(summary.sections.length).toBeGreaterThanOrEqual(3);
    });

    it("each section has required fields", () => {
      const summary = getDemoSummary("demo-child-1", 14);
      for (const section of summary.sections) {
        expect(section.id).toBeTruthy();
        expect(section.label).toBeTruthy();
        expect(section.content).toBeTruthy();
        expect(section.trend).toBeTruthy();
        expect(section.recordCount).toBeGreaterThan(0);
      }
    });

    it("has areas of concern and positive highlights", () => {
      const summary = getDemoSummary("demo-child-1", 14);
      expect(summary.areasOfConcern.length).toBeGreaterThan(0);
      expect(summary.positiveHighlights.length).toBeGreaterThan(0);
    });

    it("resolves child names for known IDs", () => {
      expect(getDemoSummary("demo-child-1", 14).childName).toBe("Jayden Mitchell");
      expect(getDemoSummary("demo-child-2", 14).childName).toBe("Amara Osei");
    });

    it("handles different period lengths", () => {
      expect(getDemoSummary("demo-child-1", 7).periodDays).toBe(7);
      expect(getDemoSummary("demo-child-1", 30).periodDays).toBe(30);
    });
  });
});

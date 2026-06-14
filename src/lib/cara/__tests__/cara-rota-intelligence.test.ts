// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraRotaIntelligence _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-rota-intelligence";

const { SEVERITY_CONFIG, getDemoRotaIntelligence } = _testing;

describe("CaraRotaIntelligence", () => {
  describe("SEVERITY_CONFIG", () => {
    it("has all five severity levels", () => {
      expect(SEVERITY_CONFIG.critical).toBeDefined();
      expect(SEVERITY_CONFIG.high).toBeDefined();
      expect(SEVERITY_CONFIG.medium).toBeDefined();
      expect(SEVERITY_CONFIG.low).toBeDefined();
      expect(SEVERITY_CONFIG.info).toBeDefined();
    });

    it("each severity has label, colour, bg, and dot", () => {
      for (const [, cfg] of Object.entries(SEVERITY_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.dot).toBeTruthy();
      }
    });
  });

  describe("getDemoRotaIntelligence", () => {
    const data = getDemoRotaIntelligence();

    it("has a week label", () => {
      expect(data.weekLabel).toBeTruthy();
    });

    it("has a valid overall risk level", () => {
      expect(["low", "medium", "high"]).toContain(data.overallRisk);
    });

    it("compliance score is between 0 and 100", () => {
      expect(data.complianceScore).toBeGreaterThanOrEqual(0);
      expect(data.complianceScore).toBeLessThanOrEqual(100);
    });

    it("has positive staffing numbers", () => {
      expect(data.totalShiftHours).toBeGreaterThan(0);
      expect(data.staffCount).toBeGreaterThan(0);
      expect(data.nightsRequired).toBeGreaterThan(0);
    });

    it("has at least one alert", () => {
      expect(data.alerts.length).toBeGreaterThan(0);
    });

    it("each alert has required fields", () => {
      for (const alert of data.alerts) {
        expect(alert.id).toBeTruthy();
        expect(alert.type).toBeTruthy();
        expect(alert.severity).toBeTruthy();
        expect(alert.title).toBeTruthy();
        expect(alert.detail).toBeTruthy();
      }
    });

    it("includes at least one critical alert", () => {
      const critical = data.alerts.filter((a) => a.severity === "critical");
      expect(critical.length).toBeGreaterThan(0);
    });

    it("includes at least one positive finding", () => {
      const positive = data.alerts.filter((a) => a.type === "positive");
      expect(positive.length).toBeGreaterThan(0);
    });

    it("alerts with suggestions have non-empty suggestion text", () => {
      for (const alert of data.alerts) {
        if (alert.suggestion) {
          expect(alert.suggestion.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

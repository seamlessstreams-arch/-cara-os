// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraRiskMatrix _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-risk-matrix";

const { RISK_LEVEL_CONFIG, DOMAIN_CONFIG, getDemoRiskMatrix } = _testing;

describe("CaraRiskMatrix", () => {
  describe("RISK_LEVEL_CONFIG", () => {
    it("has all five risk levels", () => {
      expect(RISK_LEVEL_CONFIG.critical).toBeDefined();
      expect(RISK_LEVEL_CONFIG.high).toBeDefined();
      expect(RISK_LEVEL_CONFIG.medium).toBeDefined();
      expect(RISK_LEVEL_CONFIG.low).toBeDefined();
      expect(RISK_LEVEL_CONFIG.minimal).toBeDefined();
    });

    it("each level has label, colour, bg, cell, and order", () => {
      for (const [, cfg] of Object.entries(RISK_LEVEL_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.cell).toBeTruthy();
        expect(typeof cfg.order).toBe("number");
      }
    });

    it("order values are unique and sequential", () => {
      const orders = Object.values(RISK_LEVEL_CONFIG).map((c) => c.order).sort((a, b) => a - b);
      expect(orders).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe("DOMAIN_CONFIG", () => {
    it("has all six risk domains", () => {
      expect(DOMAIN_CONFIG.behaviour).toBeDefined();
      expect(DOMAIN_CONFIG.safeguarding).toBeDefined();
      expect(DOMAIN_CONFIG.health).toBeDefined();
      expect(DOMAIN_CONFIG.placement_stability).toBeDefined();
      expect(DOMAIN_CONFIG.education).toBeDefined();
      expect(DOMAIN_CONFIG.relationships).toBeDefined();
    });

    it("each domain has label, icon, and shortLabel", () => {
      for (const [, cfg] of Object.entries(DOMAIN_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
        expect(cfg.shortLabel).toBeTruthy();
        expect(cfg.shortLabel.length).toBeLessThanOrEqual(4);
      }
    });
  });

  describe("getDemoRiskMatrix", () => {
    const profiles = getDemoRiskMatrix();

    it("returns 4 child profiles", () => {
      expect(profiles).toHaveLength(4);
    });

    it("each profile has required fields", () => {
      for (const p of profiles) {
        expect(p.childId).toBeTruthy();
        expect(p.childName).toBeTruthy();
        expect(["critical", "high", "medium", "low", "minimal"]).toContain(p.overallRisk);
        expect(p.lastUpdated).toBeTruthy();
        expect(p.domains).toHaveLength(6);
      }
    });

    it("each domain entry covers all six domains", () => {
      for (const p of profiles) {
        const domainNames = new Set(p.domains.map((d) => d.domain));
        expect(domainNames.size).toBe(6);
      }
    });

    it("each domain entry has valid fields", () => {
      for (const p of profiles) {
        for (const d of p.domains) {
          expect(["critical", "high", "medium", "low", "minimal"]).toContain(d.level);
          expect(["increasing", "stable", "decreasing"]).toContain(d.trend);
          expect(d.summary).toBeTruthy();
          expect(d.dataPoints).toBeGreaterThan(0);
        }
      }
    });

    it("at least one profile has Cara notes", () => {
      const withNotes = profiles.filter((p) => p.caraNotes);
      expect(withNotes.length).toBeGreaterThan(0);
    });
  });
});

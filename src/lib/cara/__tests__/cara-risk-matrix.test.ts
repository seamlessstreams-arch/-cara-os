// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraRiskMatrix _testing exports (config maps only)
//
// The component no longer carries hardcoded demo profiles — it renders only the
// real profiles it is given, with an honest empty state when there are none — so
// these tests cover the pure config maps, not any fabricated data.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-risk-matrix";

const { RISK_LEVEL_CONFIG, DOMAIN_CONFIG } = _testing;

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
});

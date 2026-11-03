// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraInsightCard _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-insight-card";

const { TYPE_CONFIG, SEVERITY_CONFIG } = _testing;

describe("CaraInsightCard", () => {
  describe("TYPE_CONFIG", () => {
    it("has all expected insight types", () => {
      const types = [
        "behaviour_pattern", "risk_escalation", "compliance_gap",
        "positive_trend", "staffing_concern", "oversight_gap",
        "evidence_gap", "wellbeing_alert",
      ];
      for (const type of types) {
        expect(TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]).toBeDefined();
        expect(TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].label).toBeTruthy();
        expect(TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].icon).toBeTruthy();
      }
    });

    it("has 8 insight types", () => {
      expect(Object.keys(TYPE_CONFIG)).toHaveLength(8);
    });
  });

  describe("SEVERITY_CONFIG", () => {
    it("has all severity levels", () => {
      const severities = ["critical", "high", "medium", "low", "positive"];
      for (const sev of severities) {
        const cfg = SEVERITY_CONFIG[sev as keyof typeof SEVERITY_CONFIG];
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.border).toBeTruthy();
        expect(cfg.dot).toBeTruthy();
      }
    });

    it("includes positive severity for good trends", () => {
      expect(SEVERITY_CONFIG.positive.colour).toContain("emerald");
    });
  });

  // Guards the fix: the component must never again ship fabricated demo
  // insights (fictional children) that would render on the live tenant. The
  // testing surface must expose ONLY the pure config maps — no record arrays.
  describe("no fabricated demo data", () => {
    it("exposes only pure config maps, never a seeded record array", () => {
      expect(Object.keys(_testing).sort()).toEqual(["SEVERITY_CONFIG", "TYPE_CONFIG"]);
    });
  });
});

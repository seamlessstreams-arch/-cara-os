// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraInsightCard _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-insight-card";

const { TYPE_CONFIG, SEVERITY_CONFIG, DEMO_INSIGHTS } = _testing;

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

  describe("DEMO_INSIGHTS", () => {
    it("has at least 4 demo insights", () => {
      expect(DEMO_INSIGHTS.length).toBeGreaterThanOrEqual(4);
    });

    it("each insight has required fields", () => {
      for (const insight of DEMO_INSIGHTS) {
        expect(insight.id).toBeTruthy();
        expect(insight.type).toBeTruthy();
        expect(insight.severity).toBeTruthy();
        expect(insight.title).toBeTruthy();
        expect(insight.summary).toBeTruthy();
        expect(insight.recommendation).toBeTruthy();
        expect(typeof insight.confidence).toBe("number");
        expect(insight.confidence).toBeGreaterThan(0);
        expect(insight.confidence).toBeLessThanOrEqual(100);
      }
    });

    it("includes at least one positive trend insight", () => {
      const positive = DEMO_INSIGHTS.filter((i) => i.type === "positive_trend");
      expect(positive.length).toBeGreaterThanOrEqual(1);
    });

    it("includes at least one oversight gap insight", () => {
      const gap = DEMO_INSIGHTS.filter((i) => i.type === "oversight_gap");
      expect(gap.length).toBeGreaterThanOrEqual(1);
    });

    it("insights reference child names where applicable", () => {
      const withChild = DEMO_INSIGHTS.filter((i) => i.relatedChildName);
      expect(withChild.length).toBeGreaterThan(0);
    });
  });
});

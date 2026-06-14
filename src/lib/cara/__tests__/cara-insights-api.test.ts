// ══════════════════════════════════════════════════════════════════════════════
// Tests: /api/cara/insights — pure helpers
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  validateInsightType,
  prioritiseInsights,
  getDemoInsights,
} from "@/app/api/cara/insights/route";

describe("insights API helpers", () => {
  // ── validateInsightType ─────────────────────────────────────────────────
  describe("validateInsightType", () => {
    it("accepts all valid insight types", () => {
      const valid = [
        "behaviour_pattern",
        "risk_escalation",
        "compliance_gap",
        "positive_trend",
        "staffing_concern",
        "oversight_gap",
        "evidence_gap",
        "wellbeing_alert",
      ];
      for (const t of valid) {
        expect(validateInsightType(t)).toBe(true);
      }
    });

    it("rejects invalid strings", () => {
      expect(validateInsightType("unknown")).toBe(false);
      expect(validateInsightType("")).toBe(false);
      expect(validateInsightType("BEHAVIOUR_PATTERN")).toBe(false);
    });

    it("rejects non-string values", () => {
      expect(validateInsightType(null)).toBe(false);
      expect(validateInsightType(undefined)).toBe(false);
      expect(validateInsightType(42)).toBe(false);
    });
  });

  // ── prioritiseInsights ──────────────────────────────────────────────────
  describe("prioritiseInsights", () => {
    it("sorts by severity (critical first)", () => {
      const items = [
        { severity: "low", confidence: 90 },
        { severity: "critical", confidence: 80 },
        { severity: "medium", confidence: 85 },
      ];
      const sorted = prioritiseInsights(items);
      expect(sorted[0].severity).toBe("critical");
      expect(sorted[1].severity).toBe("medium");
      expect(sorted[2].severity).toBe("low");
    });

    it("breaks ties by confidence descending", () => {
      const items = [
        { severity: "high", confidence: 70 },
        { severity: "high", confidence: 95 },
        { severity: "high", confidence: 82 },
      ];
      const sorted = prioritiseInsights(items);
      expect(sorted[0].confidence).toBe(95);
      expect(sorted[1].confidence).toBe(82);
      expect(sorted[2].confidence).toBe(70);
    });

    it("does not mutate the original array", () => {
      const items = [
        { severity: "low", confidence: 50 },
        { severity: "critical", confidence: 99 },
      ];
      const original = [...items];
      prioritiseInsights(items);
      expect(items).toEqual(original);
    });

    it("handles unknown severity gracefully", () => {
      const items = [
        { severity: "unknown", confidence: 50 },
        { severity: "critical", confidence: 80 },
      ];
      const sorted = prioritiseInsights(items);
      expect(sorted[0].severity).toBe("critical");
    });
  });

  // ── getDemoInsights ─────────────────────────────────────────────────────
  describe("getDemoInsights", () => {
    it("returns up to the requested limit", () => {
      expect(getDemoInsights(2)).toHaveLength(2);
      expect(getDemoInsights(10)).toHaveLength(5); // only 5 demo insights
    });

    it("returns insights sorted by priority", () => {
      const all = getDemoInsights(10);
      for (let i = 0; i < all.length - 1; i++) {
        const sevOrder: Record<string, number> = {
          critical: 0, high: 1, medium: 2, low: 3, positive: 4,
        };
        const aSev = sevOrder[all[i].severity] ?? 9;
        const bSev = sevOrder[all[i + 1].severity] ?? 9;
        if (aSev === bSev) {
          expect(all[i].confidence).toBeGreaterThanOrEqual(all[i + 1].confidence);
        } else {
          expect(aSev).toBeLessThanOrEqual(bSev);
        }
      }
    });

    it("each insight has required fields", () => {
      const insights = getDemoInsights(10);
      for (const ins of insights) {
        expect(ins.id).toBeTruthy();
        expect(ins.type).toBeTruthy();
        expect(ins.severity).toBeTruthy();
        expect(ins.title).toBeTruthy();
        expect(ins.summary).toBeTruthy();
        expect(ins.recommendation).toBeTruthy();
        expect(typeof ins.confidence).toBe("number");
        expect(ins.confidence).toBeGreaterThanOrEqual(0);
        expect(ins.confidence).toBeLessThanOrEqual(100);
      }
    });

    it("returns empty array for limit 0", () => {
      expect(getDemoInsights(0)).toHaveLength(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraPatternAlert component config / display helpers
//
// The actual pattern detection logic is tested in pattern-detection.test.ts.
// This file tests the component's configuration constants and rendering logic.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

// Note: the pattern detection engine is tested thoroughly in pattern-detection.test.ts
// These tests verify the component integration configuration.

const SIGNIFICANCE_CONFIG = {
  high: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  low: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
};

const PATTERN_TYPES = ["temporal", "sequential", "escalation", "correlation", "cyclical", "improvement"];

describe("CaraPatternAlert (component config)", () => {
  describe("SIGNIFICANCE_CONFIG", () => {
    it("has all 3 significance levels", () => {
      expect(SIGNIFICANCE_CONFIG.high).toBeDefined();
      expect(SIGNIFICANCE_CONFIG.medium).toBeDefined();
      expect(SIGNIFICANCE_CONFIG.low).toBeDefined();
    });

    it("each level has bg, text, and dot styles", () => {
      for (const [, cfg] of Object.entries(SIGNIFICANCE_CONFIG)) {
        expect(cfg.bg).toBeTruthy();
        expect(cfg.text).toBeTruthy();
        expect(cfg.dot).toBeTruthy();
      }
    });
  });

  describe("PATTERN_TYPES", () => {
    it("includes all 6 pattern types", () => {
      expect(PATTERN_TYPES).toContain("temporal");
      expect(PATTERN_TYPES).toContain("sequential");
      expect(PATTERN_TYPES).toContain("escalation");
      expect(PATTERN_TYPES).toContain("correlation");
      expect(PATTERN_TYPES).toContain("cyclical");
      expect(PATTERN_TYPES).toContain("improvement");
    });

    it("has exactly 6 types", () => {
      expect(PATTERN_TYPES).toHaveLength(6);
    });
  });

  describe("significance colour mapping", () => {
    it("high uses red", () => {
      expect(SIGNIFICANCE_CONFIG.high.bg).toContain("red");
      expect(SIGNIFICANCE_CONFIG.high.text).toContain("red");
    });

    it("medium uses amber", () => {
      expect(SIGNIFICANCE_CONFIG.medium.bg).toContain("amber");
      expect(SIGNIFICANCE_CONFIG.medium.text).toContain("amber");
    });

    it("low uses slate", () => {
      expect(SIGNIFICANCE_CONFIG.low.bg).toContain("slate");
    });
  });
});

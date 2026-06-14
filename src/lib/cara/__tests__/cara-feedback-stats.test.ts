// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraFeedbackStats _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-feedback-stats";

const { computeSatisfactionRate, formatTagLabel, formatCommandLabel, getDemoStats } = _testing;

describe("CaraFeedbackStats", () => {
  describe("computeSatisfactionRate", () => {
    it("returns 0 when total is 0", () => {
      expect(computeSatisfactionRate(0, 0)).toBe(0);
    });

    it("returns 100 when all positive", () => {
      expect(computeSatisfactionRate(10, 10)).toBe(100);
    });

    it("returns 0 when none positive", () => {
      expect(computeSatisfactionRate(0, 10)).toBe(0);
    });

    it("rounds to nearest integer", () => {
      expect(computeSatisfactionRate(1, 3)).toBe(33);
      expect(computeSatisfactionRate(2, 3)).toBe(67);
    });

    it("computes correctly for realistic values", () => {
      expect(computeSatisfactionRate(38, 47)).toBe(81);
    });
  });

  describe("formatTagLabel", () => {
    it("converts underscores to spaces and capitalises", () => {
      expect(formatTagLabel("too_long")).toBe("Too Long");
    });

    it("handles single word", () => {
      expect(formatTagLabel("inaccurate")).toBe("Inaccurate");
    });

    it("handles multiple underscores", () => {
      expect(formatTagLabel("missing_context")).toBe("Missing Context");
    });
  });

  describe("formatCommandLabel", () => {
    it("converts command IDs to readable labels", () => {
      expect(formatCommandLabel("improve_writing")).toBe("Improve Writing");
      expect(formatCommandLabel("extract_tasks")).toBe("Extract Tasks");
      expect(formatCommandLabel("draft_oversight")).toBe("Draft Oversight");
    });

    it("handles single-word commands", () => {
      expect(formatCommandLabel("summarise")).toBe("Summarise");
    });
  });

  describe("getDemoStats", () => {
    const stats = getDemoStats();

    it("returns expected structure", () => {
      expect(stats.totalFeedback).toBeGreaterThan(0);
      expect(stats.positiveCount).toBeGreaterThan(0);
      expect(stats.negativeCount).toBeGreaterThan(0);
      expect(stats.satisfactionRate).toBeGreaterThan(0);
    });

    it("has consistent counts", () => {
      expect(stats.positiveCount + stats.negativeCount).toBe(stats.totalFeedback);
    });

    it("satisfaction rate matches counts", () => {
      const expected = Math.round((stats.positiveCount / stats.totalFeedback) * 100);
      expect(stats.satisfactionRate).toBe(expected);
    });

    it("has negative tags", () => {
      expect(stats.topNegativeTags.length).toBeGreaterThan(0);
      for (const tag of stats.topNegativeTags) {
        expect(tag.tag).toBeTruthy();
        expect(tag.count).toBeGreaterThan(0);
      }
    });

    it("has command breakdown", () => {
      expect(stats.commandBreakdown.length).toBeGreaterThan(0);
      for (const cmd of stats.commandBreakdown) {
        expect(cmd.commandId).toBeTruthy();
        expect(cmd.positive + cmd.negative).toBe(cmd.total);
      }
    });
  });
});

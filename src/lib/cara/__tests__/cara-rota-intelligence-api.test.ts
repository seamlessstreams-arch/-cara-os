// ══════════════════════════════════════════════════════════════════════════════
// Tests: /api/cara/rota-intelligence — pure helpers
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  validateWeekStart,
  prioritiseAlerts,
  computeComplianceScore,
  getDemoAlerts,
} from "@/app/api/cara/rota-intelligence/route";

describe("rota-intelligence API helpers", () => {
  describe("validateWeekStart", () => {
    it("accepts valid YYYY-MM-DD dates", () => {
      expect(validateWeekStart("2026-05-12")).toBe(true);
      expect(validateWeekStart("2025-01-01")).toBe(true);
    });

    it("rejects invalid formats", () => {
      expect(validateWeekStart("12/05/2026")).toBe(false);
      expect(validateWeekStart("2026-5-12")).toBe(false);
      expect(validateWeekStart("May 12 2026")).toBe(false);
      expect(validateWeekStart("")).toBe(false);
    });

    it("rejects non-string values", () => {
      expect(validateWeekStart(null)).toBe(false);
      expect(validateWeekStart(undefined)).toBe(false);
      expect(validateWeekStart(20260512)).toBe(false);
    });
  });

  describe("prioritiseAlerts", () => {
    it("sorts critical alerts first", () => {
      const alerts = [
        { id: "1", type: "x", severity: "low" as const, title: "", detail: "" },
        { id: "2", type: "x", severity: "critical" as const, title: "", detail: "" },
        { id: "3", type: "x", severity: "medium" as const, title: "", detail: "" },
      ];
      const sorted = prioritiseAlerts(alerts);
      expect(sorted[0].severity).toBe("critical");
      expect(sorted[1].severity).toBe("medium");
      expect(sorted[2].severity).toBe("low");
    });

    it("does not mutate the original array", () => {
      const alerts = [
        { id: "1", type: "x", severity: "info" as const, title: "", detail: "" },
        { id: "2", type: "x", severity: "critical" as const, title: "", detail: "" },
      ];
      const copy = [...alerts];
      prioritiseAlerts(alerts);
      expect(alerts).toEqual(copy);
    });
  });

  describe("computeComplianceScore", () => {
    it("returns 100 for no alerts", () => {
      expect(computeComplianceScore([])).toBe(100);
    });

    it("subtracts 15 for critical", () => {
      const alerts = [{ id: "1", type: "x", severity: "critical" as const, title: "", detail: "" }];
      expect(computeComplianceScore(alerts)).toBe(85);
    });

    it("subtracts 10 for high", () => {
      const alerts = [{ id: "1", type: "x", severity: "high" as const, title: "", detail: "" }];
      expect(computeComplianceScore(alerts)).toBe(90);
    });

    it("never goes below 0", () => {
      const alerts = Array.from({ length: 10 }, (_, i) => ({
        id: `a${i}`, type: "x", severity: "critical" as const, title: "", detail: "",
      }));
      expect(computeComplianceScore(alerts)).toBe(0);
    });

    it("handles mixed severities", () => {
      const alerts = [
        { id: "1", type: "x", severity: "critical" as const, title: "", detail: "" },
        { id: "2", type: "x", severity: "high" as const, title: "", detail: "" },
        { id: "3", type: "x", severity: "medium" as const, title: "", detail: "" },
      ];
      // 100 - 15 - 10 - 5 = 70
      expect(computeComplianceScore(alerts)).toBe(70);
    });
  });

  describe("getDemoAlerts", () => {
    const alerts = getDemoAlerts();

    it("returns multiple alerts", () => {
      expect(alerts.length).toBeGreaterThan(0);
    });

    it("each alert has required fields", () => {
      for (const a of alerts) {
        expect(a.id).toBeTruthy();
        expect(a.type).toBeTruthy();
        expect(a.severity).toBeTruthy();
        expect(a.title).toBeTruthy();
        expect(a.detail).toBeTruthy();
      }
    });

    it("includes a critical alert", () => {
      expect(alerts.some((a) => a.severity === "critical")).toBe(true);
    });
  });
});

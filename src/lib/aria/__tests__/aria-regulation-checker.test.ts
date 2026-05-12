// ══════════════════════════════════════════════════════════════════════════════
// Tests: AriaRegulationChecker _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/aria/aria-regulation-checker";

const { STATUS_CONFIG, getDemoRegulations } = _testing;

describe("AriaRegulationChecker", () => {
  describe("STATUS_CONFIG", () => {
    it("has all four compliance statuses", () => {
      expect(STATUS_CONFIG.compliant).toBeDefined();
      expect(STATUS_CONFIG.partially_compliant).toBeDefined();
      expect(STATUS_CONFIG.non_compliant).toBeDefined();
      expect(STATUS_CONFIG.not_assessed).toBeDefined();
    });

    it("each status has label, colour, bg, and icon", () => {
      for (const [, cfg] of Object.entries(STATUS_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
      }
    });
  });

  describe("getDemoRegulations", () => {
    const regulations = getDemoRegulations();

    it("returns multiple regulations", () => {
      expect(regulations.length).toBeGreaterThan(10);
    });

    it("each regulation has required fields", () => {
      for (const reg of regulations) {
        expect(reg.id).toBeTruthy();
        expect(reg.number).toMatch(/^Reg \d+$/);
        expect(reg.title).toBeTruthy();
        expect(reg.description).toBeTruthy();
        expect(["compliant", "partially_compliant", "non_compliant", "not_assessed"]).toContain(reg.status);
        expect(typeof reg.evidenceCount).toBe("number");
        expect(reg.evidenceCount).toBeGreaterThanOrEqual(0);
        expect(reg.lastEvidenced).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Array.isArray(reg.gaps)).toBe(true);
      }
    });

    it("includes both compliant and non-compliant regulations", () => {
      const statuses = new Set(regulations.map((r) => r.status));
      expect(statuses.has("compliant")).toBe(true);
      expect(statuses.has("partially_compliant")).toBe(true);
    });

    it("partially compliant regulations have gaps", () => {
      const partial = regulations.filter((r) => r.status === "partially_compliant");
      for (const r of partial) {
        expect(r.gaps.length).toBeGreaterThan(0);
      }
    });

    it("compliant regulations have no gaps", () => {
      const compliant = regulations.filter((r) => r.status === "compliant");
      for (const r of compliant) {
        expect(r.gaps).toHaveLength(0);
      }
    });

    it("some regulations have ARIA suggestions", () => {
      const withSuggestions = regulations.filter((r) => r.ariaSuggestion);
      expect(withSuggestions.length).toBeGreaterThan(0);
    });

    it("includes key regulations (Reg 45, Reg 40, Reg 33)", () => {
      const numbers = regulations.map((r) => r.number);
      expect(numbers).toContain("Reg 45");
      expect(numbers).toContain("Reg 40");
      expect(numbers).toContain("Reg 33");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraDailyIntelligence _testing exports
//
// The component is driven entirely by the real /api/cara/today-briefing feed
// (no demo generator). These tests cover the display config maps and the RAG
// derivation — the only pure logic left.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-daily-intelligence";

const { SEVERITY_CONFIG, CATEGORY_CONFIG, RAG_CONFIG, ragFor } = _testing;

describe("CaraDailyIntelligence", () => {
  describe("SEVERITY_CONFIG", () => {
    it("has all 5 severities", () => {
      for (const s of ["critical", "high", "medium", "low", "positive"] as const) {
        expect(SEVERITY_CONFIG[s]).toBeDefined();
      }
    });

    it("each severity has label, colour, bg, border, icon", () => {
      for (const [, cfg] of Object.entries(SEVERITY_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.border).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
      }
    });
  });

  describe("CATEGORY_CONFIG", () => {
    it("covers every today-briefing signal category", () => {
      const cats = [
        "safeguarding", "incident", "compliance", "oversight", "staffing",
        "health", "education", "wellbeing", "deadline", "positive",
      ];
      for (const c of cats) {
        expect(CATEGORY_CONFIG[c as keyof typeof CATEGORY_CONFIG]).toBeDefined();
      }
    });

    it("each category has label, icon, colour", () => {
      for (const [, cfg] of Object.entries(CATEGORY_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
      }
    });
  });

  describe("RAG_CONFIG", () => {
    it("has red, amber, green", () => {
      expect(RAG_CONFIG.red).toBeDefined();
      expect(RAG_CONFIG.amber).toBeDefined();
      expect(RAG_CONFIG.green).toBeDefined();
    });
  });

  describe("ragFor", () => {
    it("is red when any critical signal is present", () => {
      expect(ragFor({ criticalCount: 1, highCount: 0 })).toBe("red");
      expect(ragFor({ criticalCount: 2, highCount: 5 })).toBe("red");
    });

    it("is amber when high but no critical", () => {
      expect(ragFor({ criticalCount: 0, highCount: 1 })).toBe("amber");
    });

    it("is green when nothing elevated", () => {
      expect(ragFor({ criticalCount: 0, highCount: 0 })).toBe("green");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraRegulationChecker _testing exports
//
// The widget renders published regulation reference content only. It must NOT
// carry any fabricated per-regulation assessment data (compliance status,
// evidence counts, gaps) or per-child suggestions naming fictional children —
// that is the behaviour being guarded against here.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-regulation-checker";

const { STATUS_CONFIG, REGULATION_REFERENCE } = _testing;

describe("CaraRegulationChecker", () => {
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

  describe("REGULATION_REFERENCE", () => {
    it("returns multiple regulations", () => {
      expect(REGULATION_REFERENCE.length).toBeGreaterThan(10);
    });

    it("each entry has only generic reference fields", () => {
      for (const reg of REGULATION_REFERENCE) {
        expect(reg.id).toBeTruthy();
        expect(reg.number).toMatch(/^Reg \d+$/);
        expect(reg.title).toBeTruthy();
        expect(reg.description).toBeTruthy();
      }
    });

    it("includes key regulations (Reg 45, Reg 40, Reg 33)", () => {
      const numbers = REGULATION_REFERENCE.map((r) => r.number);
      expect(numbers).toContain("Reg 45");
      expect(numbers).toContain("Reg 40");
      expect(numbers).toContain("Reg 33");
    });

    it("carries no fabricated assessment data or per-child suggestions", () => {
      // Guards the fix: any re-added per-regulation assessment field or
      // per-child suggestion (which previously named fictional children) must
      // fail here. Reference entries hold only generic published content.
      for (const reg of REGULATION_REFERENCE as unknown as Array<Record<string, unknown>>) {
        expect(reg.status).toBeUndefined();
        expect(reg.evidenceCount).toBeUndefined();
        expect(reg.lastEvidenced).toBeUndefined();
        expect(reg.gaps).toBeUndefined();
        expect(reg.caraSuggestion).toBeUndefined();
      }
    });
  });
});

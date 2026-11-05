// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraReg45Evidence widget _testing exports
//
// The widget renders an honest empty state only — it carries NO demo generator
// and no fabricated Reg 45 summary (it previously hardcoded fictional children,
// which must never surface on a live tenant). These tests cover the display
// config map that remains, and guard that no demo data is exported.
//
// (Not to be confused with cara-reg45-evidence.test.ts, which tests the
// server-side evidence engine at @/lib/cara/cara-reg45-evidence.)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-reg45-evidence";

const { STATUS_CONFIG } = _testing;

describe("CaraReg45Evidence widget", () => {
  describe("STATUS_CONFIG", () => {
    it("has all 4 evidence statuses", () => {
      for (const s of ["complete", "partial", "missing", "not_applicable"] as const) {
        expect(STATUS_CONFIG[s]).toBeDefined();
      }
    });

    it("each status has label, colour, bg, dot", () => {
      for (const [, cfg] of Object.entries(STATUS_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.dot).toBeTruthy();
      }
    });
  });

  describe("no fabricated data is exported", () => {
    it("does not expose a demo generator", () => {
      expect((_testing as Record<string, unknown>).getDemoReg45).toBeUndefined();
    });

    it("only exposes config maps", () => {
      expect(Object.keys(_testing)).toEqual(["STATUS_CONFIG"]);
    });
  });
});

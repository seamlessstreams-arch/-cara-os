// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraWriteToChild _testing exports
//
// The component no longer fabricates the child's letter or its Child Lens score
// (the old `generateDemoOutput` is gone). The practitioner writes the child
// version and Cara scores it server-side on save. These tests cover the pure
// display-config maps that remain.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-write-to-child";

const { SOURCE_CONFIG, LENS_CATEGORY_CONFIG, APPROACH_LABELS } = _testing;

describe("CaraWriteToChild", () => {
  describe("SOURCE_CONFIG", () => {
    it("has all 7 source types", () => {
      const sources = [
        "incident", "complaint", "missing_from_care", "weekly_summary",
        "direct_work", "management_oversight", "key_work_session",
      ];
      for (const s of sources) {
        expect(SOURCE_CONFIG[s as keyof typeof SOURCE_CONFIG]).toBeDefined();
      }
    });

    it("each source has label, icon, and colour", () => {
      for (const [, cfg] of Object.entries(SOURCE_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
      }
    });
  });

  describe("LENS_CATEGORY_CONFIG", () => {
    it("has all 6 lens categories", () => {
      const cats = ["clarity", "dignity", "jargonRisk", "blameRisk", "explanationOfConcern", "supportOffered"];
      for (const c of cats) {
        expect(LENS_CATEGORY_CONFIG[c as keyof typeof LENS_CATEGORY_CONFIG]).toBeDefined();
      }
    });

    it("each category has label, icon, and description", () => {
      for (const [, cfg] of Object.entries(LENS_CATEGORY_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
        expect(cfg.description).toBeTruthy();
      }
    });
  });

  describe("APPROACH_LABELS", () => {
    it("has PACE, ARC, Trauma-Informed and Relational Safeguarding", () => {
      expect(APPROACH_LABELS["PACE"]).toBeDefined();
      expect(APPROACH_LABELS["ARC"]).toBeDefined();
      expect(APPROACH_LABELS["Trauma-Informed"]).toBeDefined();
      expect(APPROACH_LABELS["Relational Safeguarding"]).toBeDefined();
    });
  });

  // Regression guard: the component must not re-introduce a fabricated letter /
  // score generator. _testing may only expose pure config maps.
  it("exposes no demo/output generator", () => {
    expect(Object.keys(_testing).sort()).toEqual(
      ["APPROACH_LABELS", "LENS_CATEGORY_CONFIG", "SOURCE_CONFIG"],
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraWriteToChild _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-write-to-child";

const { SOURCE_CONFIG, LENS_CATEGORY_CONFIG, APPROACH_LABELS, generateDemoOutput } = _testing;

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
    it("has PACE, ARC, and Trauma-Informed", () => {
      expect(APPROACH_LABELS["PACE"]).toBeDefined();
      expect(APPROACH_LABELS["ARC"]).toBeDefined();
      expect(APPROACH_LABELS["Trauma-Informed"]).toBeDefined();
      expect(APPROACH_LABELS["Relational Safeguarding"]).toBeDefined();
    });
  });

  describe("generateDemoOutput", () => {
    it("generates output for incident source", () => {
      const output = generateDemoOutput("incident", "Test oversight text", "Alex W", 14);
      expect(output.id).toBeTruthy();
      expect(output.managementVersion).toBeTruthy();
      expect(output.childVersion).toBeTruthy();
      expect(output.childVersion).toContain("Alex");
      expect(output.status).toBe("draft");
    });

    it("generates output for all source types", () => {
      const sources = [
        "incident", "complaint", "missing_from_care", "weekly_summary",
        "direct_work", "management_oversight", "key_work_session",
      ] as const;

      for (const src of sources) {
        const output = generateDemoOutput(src, "Test text", "Jordan M", 10);
        expect(output.childVersion).toBeTruthy();
        expect(output.childVersion.length).toBeGreaterThan(50);
      }
    });

    it("includes Child Lens Score with all 6 categories", () => {
      const output = generateDemoOutput("incident", "Test", "Casey T", 15);
      const score = output.childLensScore;
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.clarity).toBeGreaterThanOrEqual(0);
      expect(score.dignity).toBeGreaterThanOrEqual(0);
      expect(score.jargonRisk).toBeGreaterThanOrEqual(0);
      expect(score.blameRisk).toBeGreaterThanOrEqual(0);
      expect(score.explanationOfConcern).toBeGreaterThanOrEqual(0);
      expect(score.supportOffered).toBeGreaterThanOrEqual(0);
    });

    it("includes trauma-informed approaches", () => {
      const output = generateDemoOutput("incident", "Test", "Alex W");
      expect(output.approachUsed).toContain("PACE");
      expect(output.approachUsed).toContain("ARC");
      expect(output.approachUsed).toContain("Trauma-Informed");
    });

    it("uses age-appropriate language for younger children", () => {
      const young = generateDemoOutput("incident", "Test", "Riley P", 8);
      const older = generateDemoOutput("incident", "Test", "Riley P", 15);
      // Younger version should use simpler terms
      expect(young.childVersion).toContain("grown-ups");
      // Older version should use slightly more mature language
      expect(older.childVersion).toContain("key worker");
    });

    it("has valid generatedAt timestamp", () => {
      const output = generateDemoOutput("incident", "Test", "Alex W");
      expect(new Date(output.generatedAt).getTime()).toBeGreaterThan(0);
    });
  });
});

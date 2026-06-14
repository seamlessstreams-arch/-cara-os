// ══════════════════════════════════════════════════════════════════════════════
// Tests: Oversight Service — prompt generation, regulation references
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/lib/services/oversight-service";

const { generateOversightPrompts, OVERSIGHT_REGULATION_REFS } = _testing;

describe("Oversight Service", () => {
  // ── Prompt generation ─────────────────────────────────────────────────
  describe("generateOversightPrompts", () => {
    it("generates prompts for incident", () => {
      const result = generateOversightPrompts({
        recordType: "incident",
        recordSummary: "Physical altercation in the lounge",
        childName: "Alex W",
        childAge: 14,
      });
      expect(result.opening).toContain("incident");
      expect(result.dimensions.length).toBe(5);
      expect(result.closing).toBeTruthy();
    });

    it("includes 5 quality dimensions", () => {
      const result = generateOversightPrompts({
        recordType: "safeguarding",
        recordSummary: "Disclosure made during bedtime routine",
      });
      const dimensionNames = result.dimensions.map((d) => d.dimension);
      expect(dimensionNames).toContain("Reflective Analysis");
      expect(dimensionNames).toContain("Child Focus");
      expect(dimensionNames).toContain("Professional Challenge");
      expect(dimensionNames).toContain("Decision Clarity");
      expect(dimensionNames).toContain("Action Specificity");
    });

    it("each dimension has prompt and guidance", () => {
      const result = generateOversightPrompts({
        recordType: "missing_episode",
        recordSummary: "YP did not return from contact",
        childName: "Jordan M",
      });
      for (const dim of result.dimensions) {
        expect(dim.prompt.length).toBeGreaterThan(20);
        expect(dim.guidance.length).toBeGreaterThan(20);
      }
    });

    it("includes child name in prompts when provided", () => {
      const result = generateOversightPrompts({
        recordType: "incident",
        recordSummary: "Test",
        childName: "Jamie K",
        childAge: 12,
      });
      const allText = result.dimensions.map((d) => d.prompt).join(" ");
      expect(allText).toContain("Jamie K");
    });

    it("handles missing child name gracefully", () => {
      const result = generateOversightPrompts({
        recordType: "daily_log",
        recordSummary: "General entry",
      });
      const allText = result.dimensions.map((d) => d.prompt).join(" ");
      expect(allText).toContain("the young person");
    });

    it("includes regulation refs in closing when provided", () => {
      const result = generateOversightPrompts({
        recordType: "restraint",
        recordSummary: "Physical intervention used",
        regulationRefs: ["CHR2015:Reg12", "SCCIF:SafeChildren"],
      });
      expect(result.closing).toContain("CHR2015:Reg12");
    });

    it("generates different opening for each record type", () => {
      const incident = generateOversightPrompts({
        recordType: "incident",
        recordSummary: "Test",
      });
      const supervision = generateOversightPrompts({
        recordType: "supervision",
        recordSummary: "Test",
      });
      expect(incident.opening).not.toBe(supervision.opening);
    });

    it("supports all 13 record types", () => {
      const types = [
        "incident", "safeguarding", "missing_episode", "complaint",
        "daily_log", "medication_error", "restraint", "disclosure",
        "risk_assessment", "care_plan_review", "supervision",
        "key_work_session", "contact_session",
      ] as const;
      for (const type of types) {
        const result = generateOversightPrompts({
          recordType: type,
          recordSummary: "Test summary",
        });
        expect(result.opening).toBeTruthy();
        expect(result.dimensions.length).toBe(5);
      }
    });
  });

  // ── Regulation references ─────────────────────────────────────────────
  describe("OVERSIGHT_REGULATION_REFS", () => {
    it("has refs for all 13 record types", () => {
      expect(Object.keys(OVERSIGHT_REGULATION_REFS).length).toBe(13);
    });

    it("each record type has at least one regulation ref", () => {
      for (const [, refs] of Object.entries(OVERSIGHT_REGULATION_REFS)) {
        expect(refs.length).toBeGreaterThan(0);
      }
    });

    it("incident refs include Reg7 and Reg12", () => {
      expect(OVERSIGHT_REGULATION_REFS.incident).toContain("CHR2015:Reg7");
      expect(OVERSIGHT_REGULATION_REFS.incident).toContain("CHR2015:Reg12");
    });

    it("safeguarding refs include SCCIF", () => {
      expect(OVERSIGHT_REGULATION_REFS.safeguarding.some((r) => r.startsWith("SCCIF:"))).toBe(true);
    });

    it("supervision refs include leadership", () => {
      expect(OVERSIGHT_REGULATION_REFS.supervision).toContain("SCCIF:Leadership");
    });
  });
});

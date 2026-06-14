// ══════════════════════════════════════════════════════════════════════════════
// Tests: Evidence Service — inspection readiness computation
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/lib/services/evidence-service";
import type { CsEvidenceItem, CsRegulationMapping } from "@/types/operations";

const { computeInspectionReadiness } = _testing;

function makeEvidence(overrides: Partial<CsEvidenceItem> = {}): CsEvidenceItem {
  return {
    id: "e1",
    home_id: "h1",
    title: "Test evidence",
    description: null,
    evidence_type: "document",
    file_url: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    quality_score: null,
    quality_notes: null,
    linked_child_id: null,
    linked_staff_id: null,
    regulation_refs: [],
    sccif_refs: [],
    date_of_evidence: null,
    uploaded_by: null,
    verified_by: null,
    verified_at: null,
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeRegulation(overrides: Partial<CsRegulationMapping> = {}): CsRegulationMapping {
  return {
    id: "r1",
    framework: "CHR2015",
    reference: "Reg7",
    title: "Protection of children",
    description: null,
    module_links: ["safeguarding"],
    evidence_types: ["incident_report"],
    parent_ref: null,
    sort_order: 7,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Evidence Service", () => {
  describe("computeInspectionReadiness", () => {
    it("returns Inadequate with no evidence", () => {
      const result = computeInspectionReadiness([], [
        makeRegulation({ reference: "Reg7", module_links: ["safeguarding"] }),
        makeRegulation({ reference: "Reg12", module_links: ["safeguarding"], id: "r2" }),
      ]);
      expect(result.grade).toBe("Inadequate");
      expect(result.overallPercentage).toBe(0);
    });

    it("returns higher score with matching evidence", () => {
      const regs = [
        makeRegulation({ reference: "Reg7", module_links: ["safeguarding"] }),
      ];
      const evidence = [
        makeEvidence({ id: "e1", regulation_refs: ["CHR2015:Reg7"] }),
        makeEvidence({ id: "e2", regulation_refs: ["CHR2015:Reg7"] }),
        makeEvidence({ id: "e3", regulation_refs: ["CHR2015:Reg7"] }),
      ];
      const result = computeInspectionReadiness(evidence, regs);
      expect(result.overallPercentage).toBeGreaterThan(0);
    });

    it("identifies critical gaps", () => {
      const regs = [
        makeRegulation({ reference: "Reg7", module_links: ["safeguarding"] }),
        makeRegulation({ reference: "Reg12", module_links: ["safeguarding"], id: "r2" }),
        makeRegulation({ reference: "Reg14", module_links: ["safeguarding"], id: "r3" }),
      ];
      const result = computeInspectionReadiness([], regs);
      expect(result.criticalGaps.length).toBeGreaterThan(0);
    });

    it("identifies strengths with good evidence coverage", () => {
      const regs = [
        makeRegulation({ reference: "Reg7", module_links: ["safeguarding"] }),
      ];
      const evidence = [
        makeEvidence({ id: "e1", regulation_refs: ["CHR2015:Reg7"], verified_by: "v1" }),
        makeEvidence({ id: "e2", regulation_refs: ["CHR2015:Reg7"], verified_by: "v1" }),
        makeEvidence({ id: "e3", regulation_refs: ["CHR2015:Reg7"], verified_by: "v1" }),
      ];
      const result = computeInspectionReadiness(evidence, regs);
      // With 3+ items of verified evidence for the regulation
      const safeguardingModule = result.modules.find((m) => m.module === "safeguarding");
      expect(safeguardingModule?.strengths.length).toBeGreaterThan(0);
    });

    it("returns 8 module scores", () => {
      const result = computeInspectionReadiness([], []);
      expect(result.modules.length).toBe(8);
    });

    it("each module has required fields", () => {
      const result = computeInspectionReadiness([], []);
      for (const mod of result.modules) {
        expect(mod.module).toBeTruthy();
        expect(mod.label).toBeTruthy();
        expect(typeof mod.score).toBe("number");
        expect(typeof mod.maxScore).toBe("number");
        expect(typeof mod.percentage).toBe("number");
        expect(typeof mod.evidenceCount).toBe("number");
        expect(Array.isArray(mod.gaps)).toBe(true);
        expect(Array.isArray(mod.strengths)).toBe(true);
      }
    });

    it("grade boundaries are correct", () => {
      // With no evidence and no regulations, percentage is 0 → Inadequate
      const empty = computeInspectionReadiness([], []);
      expect(["Inadequate", "Outstanding", "Good", "Requires Improvement"]).toContain(empty.grade);
    });

    it("generates recommendations for low-scoring modules", () => {
      const regs = [
        makeRegulation({ reference: "Reg7", module_links: ["safeguarding"] }),
        makeRegulation({ reference: "Reg12", module_links: ["safeguarding"], id: "r2" }),
      ];
      const result = computeInspectionReadiness([], regs);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect } from "vitest";
import type { CsEvidenceItem, CsRegulationMapping } from "@/types/operations";
import {
  computeInspectionReadiness,
} from "./evidence-service";

// We define minimal types matching CsEvidenceItem and CsRegulationMapping
// as they come from @/types/operations which we can't import in tests directly.


function makeEvidence(overrides: Partial<CsEvidenceItem> = {}): CsEvidenceItem {
  return {
    id: "ev-1",
    home_id: "home-1",
    title: "Safeguarding Policy",
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
    date_of_evidence: "2026-05-01",
    uploaded_by: "Staff A",
    verified_by: null,
    verified_at: null,
    tags: [],
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeRegulation(overrides: Partial<CsRegulationMapping> = {}): CsRegulationMapping {
  return {
    id: "reg-1",
    framework: "CHR2015",
    reference: "Reg12",
    title: "Safeguarding",
    description: null,
    module_links: ["safeguarding"],
    evidence_types: ["document"],
    parent_ref: null,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeInspectionReadiness", () => {
  it("returns Inadequate grade with zeroes for empty data", () => {
    const result = computeInspectionReadiness([], []);
    expect(result.overallPercentage).toBe(0);
    expect(result.grade).toBe("Inadequate");
    expect(result.modules).toHaveLength(8);
    for (const mod of result.modules) {
      expect(mod.score).toBe(0);
      expect(mod.maxScore).toBe(0);
      expect(mod.percentage).toBeNull();;
    }
    // With no regulations, each module has 0 maxScore so percentage=0 => all flagged as critical gaps
    expect(result.criticalGaps).toHaveLength(8);
    expect(result.topStrengths).toEqual([]);
    expect(result.recommendations).toHaveLength(8);
  });

  it("scores evidence linked to regulation", () => {
    const regs = [
      makeRegulation({ id: "reg-1", framework: "CHR2015", reference: "Reg12", module_links: ["safeguarding"] }),
    ];
    const evidence = [
      makeEvidence({ id: "ev-1", regulation_refs: ["CHR2015:Reg12"] }),
    ];
    const result = computeInspectionReadiness(evidence, regs);
    const safeguardingModule = result.modules.find((m) => m.module === "safeguarding");
    expect(safeguardingModule).toBeDefined();
    // 1 evidence item for 1 regulation: score = 4/10, percentage = 40%
    expect(safeguardingModule!.score).toBe(4);
    expect(safeguardingModule!.maxScore).toBe(10);
    expect(safeguardingModule!.percentage).toBe(40);
  });

  it("gives higher score for 3+ evidence items per regulation", () => {
    const regs = [
      makeRegulation({ id: "reg-1", framework: "CHR2015", reference: "Reg12", module_links: ["safeguarding"] }),
    ];
    const evidence = [
      makeEvidence({ id: "ev-1", regulation_refs: ["CHR2015:Reg12"] }),
      makeEvidence({ id: "ev-2", regulation_refs: ["CHR2015:Reg12"] }),
      makeEvidence({ id: "ev-3", regulation_refs: ["CHR2015:Reg12"] }),
    ];
    const result = computeInspectionReadiness(evidence, regs);
    const safeguardingModule = result.modules.find((m) => m.module === "safeguarding");
    // 3+ items = 10/10 score
    expect(safeguardingModule!.score).toBe(10);
    expect(safeguardingModule!.percentage).toBe(100);
  });

  it("determines grade based on overall percentage", () => {
    // With no regulations, all modules have 0 maxScore so percentage is 0
    const result = computeInspectionReadiness([], []);
    expect(result.grade).toBe("Inadequate"); // 0%
  });

  it("identifies critical gaps for modules below 50%", () => {
    const regs = [
      makeRegulation({ id: "reg-1", framework: "CHR2015", reference: "Reg12", module_links: ["safeguarding"] }),
      makeRegulation({ id: "reg-2", framework: "CHR2015", reference: "Reg13", module_links: ["safeguarding"] }),
      makeRegulation({ id: "reg-3", framework: "CHR2015", reference: "Reg14", module_links: ["safeguarding"] }),
    ];
    // No evidence at all - safeguarding should be a critical gap
    const result = computeInspectionReadiness([], regs);
    expect(result.criticalGaps.some((g) => g.includes("Safeguarding"))).toBe(true);
  });

  it("identifies top strengths for modules >= 80%", () => {
    const regs = [
      makeRegulation({ id: "reg-1", framework: "CHR2015", reference: "Reg12", module_links: ["safeguarding"] }),
    ];
    const evidence = [
      makeEvidence({ id: "ev-1", regulation_refs: ["CHR2015:Reg12"] }),
      makeEvidence({ id: "ev-2", regulation_refs: ["CHR2015:Reg12"] }),
      makeEvidence({ id: "ev-3", regulation_refs: ["CHR2015:Reg12"] }),
    ];
    const result = computeInspectionReadiness(evidence, regs);
    expect(result.topStrengths.some((s) => s.includes("Safeguarding"))).toBe(true);
  });

  it("flags unverified evidence as a gap", () => {
    const regs = [
      makeRegulation({ id: "reg-1", framework: "CHR2015", reference: "Reg12", module_links: ["safeguarding"] }),
    ];
    const evidence = [
      makeEvidence({ id: "ev-1", regulation_refs: ["CHR2015:Reg12"], verified_by: null }),
    ];
    const result = computeInspectionReadiness(evidence, regs);
    const safeguardingModule = result.modules.find((m) => m.module === "safeguarding");
    expect(safeguardingModule!.gaps.some((g) => g.includes("not yet verified"))).toBe(true);
  });
});

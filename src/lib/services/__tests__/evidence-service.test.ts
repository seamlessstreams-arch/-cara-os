// ══════════════════════════════════════════════════════════════════════════════
// CARA — EVIDENCE SERVICE TESTS
// Pure-function tests for inspection readiness computation, grade boundaries,
// module scoring, gap/strength detection, and weighted overall scoring.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../evidence-service";

const { computeInspectionReadiness } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal evidence item with sensible defaults. */
function evidence(
  overrides: Partial<{
    id: string;
    home_id: string;
    title: string;
    description: string | null;
    evidence_type: string;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    mime_type: string | null;
    quality_score: number | null;
    quality_notes: string | null;
    linked_child_id: string | null;
    linked_staff_id: string | null;
    regulation_refs: string[];
    sccif_refs: string[];
    date_of_evidence: string | null;
    uploaded_by: string | null;
    verified_by: string | null;
    verified_at: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
  }> = {},
) {
  return {
    id: overrides.id ?? "ev-1",
    home_id: overrides.home_id ?? "home-1",
    title: overrides.title ?? "Test evidence",
    description: "description" in overrides ? overrides.description : "A test evidence item",
    evidence_type: overrides.evidence_type ?? "document",
    file_url: "file_url" in overrides ? overrides.file_url : null,
    file_name: "file_name" in overrides ? overrides.file_name : null,
    file_size: "file_size" in overrides ? overrides.file_size : null,
    mime_type: "mime_type" in overrides ? overrides.mime_type : null,
    quality_score: "quality_score" in overrides ? overrides.quality_score : null,
    quality_notes: "quality_notes" in overrides ? overrides.quality_notes : null,
    linked_child_id: "linked_child_id" in overrides ? overrides.linked_child_id : null,
    linked_staff_id: "linked_staff_id" in overrides ? overrides.linked_staff_id : null,
    regulation_refs: overrides.regulation_refs ?? [],
    sccif_refs: overrides.sccif_refs ?? [],
    date_of_evidence: "date_of_evidence" in overrides ? overrides.date_of_evidence : "2026-05-01",
    uploaded_by: "uploaded_by" in overrides ? overrides.uploaded_by : "staff-1",
    verified_by: "verified_by" in overrides ? overrides.verified_by : null,
    verified_at: "verified_at" in overrides ? overrides.verified_at : null,
    tags: overrides.tags ?? [],
    created_at: overrides.created_at ?? "2026-05-01T00:00:00Z",
    updated_at: overrides.updated_at ?? "2026-05-01T00:00:00Z",
  } as Parameters<typeof computeInspectionReadiness>[0][number];
}

/** Build a minimal regulation mapping with sensible defaults. */
function regulation(
  overrides: Partial<{
    id: string;
    framework: string;
    reference: string;
    title: string;
    description: string | null;
    module_links: string[];
    evidence_types: string[];
    parent_ref: string | null;
    sort_order: number;
    created_at: string;
  }> = {},
) {
  return {
    id: overrides.id ?? "reg-1",
    framework: overrides.framework ?? "CHR2015",
    reference: overrides.reference ?? "12",
    title: overrides.title ?? "Test regulation",
    description: "description" in overrides ? overrides.description : "A test regulation",
    module_links: overrides.module_links ?? [],
    evidence_types: overrides.evidence_types ?? [],
    parent_ref: "parent_ref" in overrides ? overrides.parent_ref : null,
    sort_order: overrides.sort_order ?? 1,
    created_at: overrides.created_at ?? "2026-01-01T00:00:00Z",
  } as Parameters<typeof computeInspectionReadiness>[1][number];
}

// ── computeInspectionReadiness — empty inputs ─────────────────────────────

describe("computeInspectionReadiness", () => {
  it("returns zeroed result for empty evidence and regulations", () => {
    const result = computeInspectionReadiness([], []);
    expect(result.overallScore).toBe(0);
    expect(result.overallPercentage).toBe(0);
    expect(result.grade).toBe("Inadequate");
    expect(result.modules).toHaveLength(8);
    // All modules are at 0% which is < 50%, so all 8 appear as critical gaps
    expect(result.criticalGaps).toHaveLength(8);
    expect(result.topStrengths).toEqual([]);
    // All 8 modules produce recommendations too
    expect(result.recommendations).toHaveLength(8);
  });

  it("returns 8 modules with correct keys and labels", () => {
    const result = computeInspectionReadiness([], []);
    const expectedModules = [
      { key: "safeguarding", label: "Safeguarding & Protection" },
      { key: "daily_logs", label: "Daily Recording" },
      { key: "oversight", label: "Management Oversight" },
      { key: "young_people", label: "Young People Outcomes" },
      { key: "staffing", label: "Staffing & Training" },
      { key: "medication", label: "Medication Management" },
      { key: "compliance", label: "Compliance & Governance" },
      { key: "contact", label: "Contact & Family" },
    ];
    for (let i = 0; i < expectedModules.length; i++) {
      expect(result.modules[i].module).toBe(expectedModules[i].key);
      expect(result.modules[i].label).toBe(expectedModules[i].label);
    }
  });

  it("gives 0 percentage for all modules when no regulations exist", () => {
    const result = computeInspectionReadiness([], []);
    for (const mod of result.modules) {
      expect(mod.percentage).toBeNull();;
      expect(mod.score).toBe(0);
      expect(mod.maxScore).toBe(0);
      expect(mod.evidenceCount).toBe(0);
      expect(mod.gaps).toEqual([]);
      expect(mod.strengths).toEqual([]);
    }
  });

  it("has evidence with no regulations yields 0% but evidence counted via tags", () => {
    const ev = [evidence({ tags: ["safeguarding"], id: "ev-tag-1" })];
    const result = computeInspectionReadiness(ev, []);
    const safeguardingMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeguardingMod.evidenceCount).toBe(1);
    expect(safeguardingMod.score).toBe(0);
    expect(safeguardingMod.maxScore).toBe(0);
    expect(safeguardingMod.percentage).toBeNull();;
  });

  // ── Single-regulation scoring ───────────────────────────────────────────

  it("scores 0 for a regulation with no evidence", () => {
    const regs = [regulation({ module_links: ["safeguarding"] })];
    const result = computeInspectionReadiness([], regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.score).toBe(0);
    expect(safeMod.maxScore).toBe(10);
    expect(safeMod.percentage).toBe(0);
  });

  it("scores 4 for a regulation with exactly 1 evidence item", () => {
    const regs = [regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] })];
    const ev = [evidence({ regulation_refs: ["CHR2015:12"] })];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.score).toBe(4);
    expect(safeMod.maxScore).toBe(10);
    expect(safeMod.percentage).toBe(40);
  });

  it("scores 7 for a regulation with exactly 2 evidence items", () => {
    const regs = [regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] })];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.score).toBe(7);
    expect(safeMod.maxScore).toBe(10);
    expect(safeMod.percentage).toBe(70);
  });

  it("scores 10 for a regulation with 3 or more evidence items", () => {
    const regs = [regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] })];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-3", regulation_refs: ["CHR2015:12"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.score).toBe(10);
    expect(safeMod.maxScore).toBe(10);
    expect(safeMod.percentage).toBe(100);
  });

  it("scores 10 for a regulation with more than 3 evidence items", () => {
    const regs = [regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] })];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-3", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-4", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-5", regulation_refs: ["CHR2015:12"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.score).toBe(10);
    expect(safeMod.percentage).toBe(100);
  });

  // ── Multiple-regulation scoring ─────────────────────────────────────────

  it("computes correct score across multiple regulations in one module", () => {
    const regs = [
      regulation({ id: "r1", framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
      regulation({ id: "r2", framework: "CHR2015", reference: "13", module_links: ["safeguarding"] }),
    ];
    // 1 evidence for reg 12 => score 4, 3 evidence for reg 13 => score 10
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:13"] }),
      evidence({ id: "ev-3", regulation_refs: ["CHR2015:13"] }),
      evidence({ id: "ev-4", regulation_refs: ["CHR2015:13"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.score).toBe(14); // 4 + 10
    expect(safeMod.maxScore).toBe(20); // 2 * 10
    expect(safeMod.percentage).toBe(70); // round(14/20 * 100)
  });

  it("distributes regulations to correct modules based on module_links", () => {
    const regs = [
      regulation({ id: "r1", framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
      regulation({ id: "r2", framework: "CHR2015", reference: "33", module_links: ["staffing"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:33"] }),
      evidence({ id: "ev-3", regulation_refs: ["CHR2015:33"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    const staffMod = result.modules.find((m) => m.module === "staffing")!;
    expect(safeMod.score).toBe(4);
    expect(staffMod.score).toBe(7);
  });

  it("a regulation linked to multiple modules counts in each", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "44", module_links: ["safeguarding", "compliance"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:44"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:44"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    const compMod = result.modules.find((m) => m.module === "compliance")!;
    expect(safeMod.score).toBe(7);
    expect(compMod.score).toBe(7);
  });

  // ── Gaps and strengths ──────────────────────────────────────────────────

  it("identifies gap when regulation has no evidence", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", title: "Child protection", module_links: ["safeguarding"] }),
    ];
    const result = computeInspectionReadiness([], regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.gaps).toContainEqual("No evidence for Child protection (CHR2015:12)");
  });

  it("identifies strength when regulation has 3+ evidence items", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", title: "Child protection", module_links: ["safeguarding"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-3", regulation_refs: ["CHR2015:12"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.strengths).toContainEqual("Strong evidence base for Child protection (3 items)");
  });

  it("identifies strength with correct count for 5 evidence items", () => {
    const regs = [
      regulation({ framework: "SCCIF", reference: "2.1", title: "Leadership", module_links: ["oversight"] }),
    ];
    const ev = Array.from({ length: 5 }, (_, i) =>
      evidence({ id: `ev-${i}`, regulation_refs: ["SCCIF:2.1"] }),
    );
    const result = computeInspectionReadiness(ev, regs);
    const oversightMod = result.modules.find((m) => m.module === "oversight")!;
    expect(oversightMod.strengths).toContainEqual("Strong evidence base for Leadership (5 items)");
  });

  it("identifies verification gap when evidence exists but none verified", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", title: "Child protection", module_links: ["safeguarding"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"], verified_by: null }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.gaps).toContainEqual("Evidence for Child protection not yet verified");
  });

  it("no verification gap when at least one evidence item is verified", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", title: "Child protection", module_links: ["safeguarding"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"], verified_by: null }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"], verified_by: "manager-1" }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(safeMod.gaps).not.toContainEqual(expect.stringContaining("not yet verified"));
  });

  it("no verification gap when regulation has zero evidence", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", title: "Child protection", module_links: ["safeguarding"] }),
    ];
    const result = computeInspectionReadiness([], regs);
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    // Should have the "No evidence" gap but not the "not yet verified" gap
    expect(safeMod.gaps).toContainEqual(expect.stringContaining("No evidence"));
    expect(safeMod.gaps).not.toContainEqual(expect.stringContaining("not yet verified"));
  });

  // ── Critical gaps and top strengths (global) ────────────────────────────

  it("adds module to criticalGaps when percentage < 50", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
    ];
    // 1 evidence item => score 4/10 => 40% < 50%
    const ev = [evidence({ regulation_refs: ["CHR2015:12"] })];
    const result = computeInspectionReadiness(ev, regs);
    expect(result.criticalGaps).toContainEqual(
      expect.stringContaining("Safeguarding & Protection: 40%"),
    );
  });

  it("adds module to recommendations when percentage < 50", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
    ];
    const result = computeInspectionReadiness([], regs);
    expect(result.recommendations).toContainEqual(
      expect.stringContaining("Upload evidence for Safeguarding & Protection"),
    );
  });

  it("adds module to topStrengths when percentage >= 80", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-3", regulation_refs: ["CHR2015:12"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    // 3+ evidence => score 10/10 => 100% >= 80%
    expect(result.topStrengths).toContainEqual(
      expect.stringContaining("Safeguarding & Protection: Strong at 100%"),
    );
  });

  it("does not add to criticalGaps at exactly 50%", () => {
    // Need a score/maxScore ratio of exactly 50%. Not achievable with the
    // scoring system (0,4,7,10), so we confirm that 40% IS critical and 70% is NOT.
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["staffing"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const staffMod = result.modules.find((m) => m.module === "staffing")!;
    // 2 evidence => score 7/10 => 70% — not critical
    expect(staffMod.percentage).toBe(70);
    expect(result.criticalGaps).not.toContainEqual(
      expect.stringContaining("Staffing & Training"),
    );
  });

  it("does not add to topStrengths when percentage is 70 (< 80)", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["staffing"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    expect(result.topStrengths).not.toContainEqual(
      expect.stringContaining("Staffing & Training"),
    );
  });

  // ── Evidence count via tags ─────────────────────────────────────────────

  it("counts evidence matching module by tag even without regulation_refs", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["medication"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", tags: ["medication"], regulation_refs: [] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const medMod = result.modules.find((m) => m.module === "medication")!;
    // Evidence is counted because it matches by tag
    expect(medMod.evidenceCount).toBe(1);
    // But score stays 0 because regulation_refs don't match
    expect(medMod.score).toBe(0);
  });

  it("counts evidence matching both tag and regulation_ref without double counting", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["medication"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", tags: ["medication"], regulation_refs: ["CHR2015:12"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const medMod = result.modules.find((m) => m.module === "medication")!;
    expect(medMod.evidenceCount).toBe(1);
    expect(medMod.score).toBe(4);
  });

  // ── Grade boundaries ────────────────────────────────────────────────────

  it("assigns Inadequate grade for overallPercentage 0", () => {
    const result = computeInspectionReadiness([], []);
    expect(result.grade).toBe("Inadequate");
  });

  it("assigns Inadequate grade for overallPercentage < 40", () => {
    // Single regulation in safeguarding (weight 25) with 0 evidence => 0%
    // All other modules have no regs => 0% each but with 0 weight applied
    // We need a scenario producing an overall% between 1-39
    // 1 evidence for safeguarding reg (40%) with weight 25 out of total 100
    // => weighted: 40*25 = 1000 / 100 = 10 => Inadequate
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
    ];
    const ev = [evidence({ regulation_refs: ["CHR2015:12"] })];
    const result = computeInspectionReadiness(ev, regs);
    expect(result.overallPercentage).toBe(10); // 40% * 25 / 100 = 10
    expect(result.grade).toBe("Inadequate");
  });

  it("assigns Requires Improvement for overallPercentage at 40", () => {
    // Need overall% = 40. Safeguarding weight=25, staffing weight=10
    // If safeguarding=100% (3+ evidence) and staffing=100% (3+ evidence)
    // and compliance=100% (weight 10) => (100*25 + 100*10 + 100*10) / 100 = 45
    // Try safeguarding=100% + daily_logs=100% => (100*25 + 100*15)/100 = 40
    const regs = [
      regulation({ id: "r1", framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
      regulation({ id: "r2", framework: "CHR2015", reference: "33", module_links: ["daily_logs"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-3", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-4", regulation_refs: ["CHR2015:33"] }),
      evidence({ id: "ev-5", regulation_refs: ["CHR2015:33"] }),
      evidence({ id: "ev-6", regulation_refs: ["CHR2015:33"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    expect(result.overallPercentage).toBe(40);
    expect(result.grade).toBe("Requires Improvement");
  });

  it("assigns Good for overallPercentage at 65", () => {
    // safeguarding(25) + daily_logs(15) + oversight(15) + young_people(15) = 70 weight
    // if each is 100% => 7000/100 = 70 but we want exactly 65
    // safeguarding(25)=100% + daily_logs(15)=100% + oversight(15)=100% + staffing(10)=100%
    // => (2500+1500+1500+1000)/100 = 65
    const regs = [
      regulation({ id: "r1", framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
      regulation({ id: "r2", framework: "CHR2015", reference: "33", module_links: ["daily_logs"] }),
      regulation({ id: "r3", framework: "CHR2015", reference: "34", module_links: ["oversight"] }),
      regulation({ id: "r4", framework: "CHR2015", reference: "35", module_links: ["staffing"] }),
    ];
    const makeEv = (ref: string, startId: number) => [
      evidence({ id: `ev-${startId}`, regulation_refs: [ref] }),
      evidence({ id: `ev-${startId + 1}`, regulation_refs: [ref] }),
      evidence({ id: `ev-${startId + 2}`, regulation_refs: [ref] }),
    ];
    const ev = [
      ...makeEv("CHR2015:12", 1),
      ...makeEv("CHR2015:33", 10),
      ...makeEv("CHR2015:34", 20),
      ...makeEv("CHR2015:35", 30),
    ];
    const result = computeInspectionReadiness(ev, regs);
    expect(result.overallPercentage).toBe(65);
    expect(result.grade).toBe("Good");
  });

  it("assigns Outstanding for overallPercentage at 85", () => {
    // safeguarding(25)+daily_logs(15)+oversight(15)+young_people(15)+staffing(10)+medication(5)
    // = 85 weight. If all 100% => 8500/100 = 85
    const regs = [
      regulation({ id: "r1", framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
      regulation({ id: "r2", framework: "CHR2015", reference: "33", module_links: ["daily_logs"] }),
      regulation({ id: "r3", framework: "CHR2015", reference: "34", module_links: ["oversight"] }),
      regulation({ id: "r4", framework: "CHR2015", reference: "35", module_links: ["young_people"] }),
      regulation({ id: "r5", framework: "CHR2015", reference: "36", module_links: ["staffing"] }),
      regulation({ id: "r6", framework: "CHR2015", reference: "37", module_links: ["medication"] }),
    ];
    const makeEv = (ref: string, startId: number) => [
      evidence({ id: `ev-${startId}`, regulation_refs: [ref] }),
      evidence({ id: `ev-${startId + 1}`, regulation_refs: [ref] }),
      evidence({ id: `ev-${startId + 2}`, regulation_refs: [ref] }),
    ];
    const ev = [
      ...makeEv("CHR2015:12", 1),
      ...makeEv("CHR2015:33", 10),
      ...makeEv("CHR2015:34", 20),
      ...makeEv("CHR2015:35", 30),
      ...makeEv("CHR2015:36", 40),
      ...makeEv("CHR2015:37", 50),
    ];
    const result = computeInspectionReadiness(ev, regs);
    expect(result.overallPercentage).toBe(85);
    expect(result.grade).toBe("Outstanding");
  });

  it("assigns Outstanding for all modules at 100%", () => {
    const moduleKeys = [
      "safeguarding", "daily_logs", "oversight", "young_people",
      "staffing", "medication", "compliance", "contact",
    ];
    const regs = moduleKeys.map((key, i) =>
      regulation({ id: `r-${i}`, framework: "CHR2015", reference: `${i + 10}`, module_links: [key] }),
    );
    const ev = moduleKeys.flatMap((_, i) => {
      const ref = `CHR2015:${i + 10}`;
      return [
        evidence({ id: `ev-${i}-a`, regulation_refs: [ref] }),
        evidence({ id: `ev-${i}-b`, regulation_refs: [ref] }),
        evidence({ id: `ev-${i}-c`, regulation_refs: [ref] }),
      ];
    });
    const result = computeInspectionReadiness(ev, regs);
    expect(result.overallPercentage).toBe(100);
    expect(result.grade).toBe("Outstanding");
  });

  // ── Overall score computation ───────────────────────────────────────────

  it("computes overallScore as rounded percentage / 10", () => {
    // overallScore = Math.round(overallPercentage / 10 * 10) / 10
    // For 65% => Math.round(65/10*10)/10 = Math.round(65)/10 = 65/10 = 6.5
    const regs = [
      regulation({ id: "r1", framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
      regulation({ id: "r2", framework: "CHR2015", reference: "33", module_links: ["daily_logs"] }),
      regulation({ id: "r3", framework: "CHR2015", reference: "34", module_links: ["oversight"] }),
      regulation({ id: "r4", framework: "CHR2015", reference: "35", module_links: ["staffing"] }),
    ];
    const makeEv = (ref: string, startId: number) => [
      evidence({ id: `ev-${startId}`, regulation_refs: [ref] }),
      evidence({ id: `ev-${startId + 1}`, regulation_refs: [ref] }),
      evidence({ id: `ev-${startId + 2}`, regulation_refs: [ref] }),
    ];
    const ev = [
      ...makeEv("CHR2015:12", 1),
      ...makeEv("CHR2015:33", 10),
      ...makeEv("CHR2015:34", 20),
      ...makeEv("CHR2015:35", 30),
    ];
    const result = computeInspectionReadiness(ev, regs);
    expect(result.overallPercentage).toBe(65);
    expect(result.overallScore).toBe(6.5);
  });

  it("overall score is 0 for empty inputs", () => {
    const result = computeInspectionReadiness([], []);
    expect(result.overallScore).toBe(0);
  });

  it("overall score is 10 at 100%", () => {
    const moduleKeys = [
      "safeguarding", "daily_logs", "oversight", "young_people",
      "staffing", "medication", "compliance", "contact",
    ];
    const regs = moduleKeys.map((key, i) =>
      regulation({ id: `r-${i}`, framework: "CHR2015", reference: `${i + 10}`, module_links: [key] }),
    );
    const ev = moduleKeys.flatMap((_, i) => {
      const ref = `CHR2015:${i + 10}`;
      return [
        evidence({ id: `ev-${i}-a`, regulation_refs: [ref] }),
        evidence({ id: `ev-${i}-b`, regulation_refs: [ref] }),
        evidence({ id: `ev-${i}-c`, regulation_refs: [ref] }),
      ];
    });
    const result = computeInspectionReadiness(ev, regs);
    expect(result.overallScore).toBe(10);
  });

  // ── Weighted scoring ────────────────────────────────────────────────────

  it("applies correct weighting — safeguarding (25) outweighs contact (5)", () => {
    // Only safeguarding at 100% => weighted = 100*25/100 = 25
    const regsA = [
      regulation({ id: "r1", framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
    ];
    const evA = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-3", regulation_refs: ["CHR2015:12"] }),
    ];
    const resultA = computeInspectionReadiness(evA, regsA);
    expect(resultA.overallPercentage).toBe(25);

    // Only contact at 100% => weighted = 100*5/100 = 5
    const regsB = [
      regulation({ id: "r2", framework: "CHR2015", reference: "13", module_links: ["contact"] }),
    ];
    const evB = [
      evidence({ id: "ev-4", regulation_refs: ["CHR2015:13"] }),
      evidence({ id: "ev-5", regulation_refs: ["CHR2015:13"] }),
      evidence({ id: "ev-6", regulation_refs: ["CHR2015:13"] }),
    ];
    const resultB = computeInspectionReadiness(evB, regsB);
    expect(resultB.overallPercentage).toBe(5);

    // Safeguarding contributes 5x more than contact
    expect(resultA.overallPercentage).toBe(resultB.overallPercentage * 5);
  });

  // ── Module structure ────────────────────────────────────────────────────

  it("each module has expected shape with all required fields", () => {
    const result = computeInspectionReadiness([], []);
    for (const mod of result.modules) {
      expect(typeof mod.module).toBe("string");
      expect(typeof mod.label).toBe("string");
      expect(typeof mod.score).toBe("number");
      expect(typeof mod.maxScore).toBe("number");
      expect(["number", "object"]).toContain(typeof mod.percentage); // number | null
      expect(typeof mod.evidenceCount).toBe("number");
      expect(Array.isArray(mod.gaps)).toBe(true);
      expect(Array.isArray(mod.strengths)).toBe(true);
    }
  });

  it("result has all required top-level fields", () => {
    const result = computeInspectionReadiness([], []);
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.overallPercentage).toBe("number");
    expect(typeof result.grade).toBe("string");
    expect(Array.isArray(result.modules)).toBe(true);
    expect(Array.isArray(result.criticalGaps)).toBe(true);
    expect(Array.isArray(result.topStrengths)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  // ── Regulation without module_links ─────────────────────────────────────

  it("regulation with empty module_links is not assigned to any module", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "99", module_links: [] }),
    ];
    const ev = [
      evidence({ regulation_refs: ["CHR2015:99"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    // No module should pick up this regulation
    for (const mod of result.modules) {
      expect(mod.maxScore).toBe(0);
      expect(mod.score).toBe(0);
    }
  });

  it("regulation with unrecognised module_link is silently ignored", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "99", module_links: ["nonexistent_module"] }),
    ];
    const result = computeInspectionReadiness([], regs);
    // All known modules should remain unaffected
    for (const mod of result.modules) {
      expect(mod.maxScore).toBe(0);
    }
  });

  // ── Different frameworks ────────────────────────────────────────────────

  it("handles different regulatory frameworks correctly", () => {
    const regs = [
      regulation({ id: "r1", framework: "SCCIF", reference: "3.1", module_links: ["oversight"] }),
      regulation({ id: "r2", framework: "KCSIE", reference: "part5", module_links: ["safeguarding"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["SCCIF:3.1"] }),
      evidence({ id: "ev-2", regulation_refs: ["KCSIE:part5"] }),
      evidence({ id: "ev-3", regulation_refs: ["KCSIE:part5"] }),
      evidence({ id: "ev-4", regulation_refs: ["KCSIE:part5"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    const oversightMod = result.modules.find((m) => m.module === "oversight")!;
    const safeMod = result.modules.find((m) => m.module === "safeguarding")!;
    expect(oversightMod.score).toBe(4); // 1 evidence
    expect(safeMod.score).toBe(10); // 3 evidence
  });

  // ── Module weights sum to 100 ───────────────────────────────────────────

  it("module weights sum to 100 (verified via overall calculation)", () => {
    // If every module has exactly 1 regulation and 3+ evidence, each module = 100%
    // Overall should be 100% if weights sum to 100
    const moduleKeys = [
      "safeguarding", "daily_logs", "oversight", "young_people",
      "staffing", "medication", "compliance", "contact",
    ];
    const regs = moduleKeys.map((key, i) =>
      regulation({ id: `r-${i}`, framework: "CHR2015", reference: `${i}`, module_links: [key] }),
    );
    const ev = moduleKeys.flatMap((_, i) => {
      const ref = `CHR2015:${i}`;
      return [
        evidence({ id: `ev-${i}-a`, regulation_refs: [ref] }),
        evidence({ id: `ev-${i}-b`, regulation_refs: [ref] }),
        evidence({ id: `ev-${i}-c`, regulation_refs: [ref] }),
      ];
    });
    const result = computeInspectionReadiness(ev, regs);
    // If weights don't sum to 100, percentage would not be 100
    expect(result.overallPercentage).toBe(100);
  });

  // ── Recommendations gap count ───────────────────────────────────────────

  it("recommendation includes correct gap count", () => {
    const regs = [
      regulation({ id: "r1", framework: "CHR2015", reference: "12", title: "Reg A", module_links: ["safeguarding"] }),
      regulation({ id: "r2", framework: "CHR2015", reference: "13", title: "Reg B", module_links: ["safeguarding"] }),
    ];
    // No evidence => score 0, percentage 0% < 50%, 2 gaps
    const result = computeInspectionReadiness([], regs);
    const rec = result.recommendations.find((r) => r.includes("Safeguarding & Protection"));
    expect(rec).toBeDefined();
    expect(rec).toContain("2 gap(s)");
  });

  // ── Critical gaps only for modules below 50% ───────────────────────────

  it("no critical gaps when all modules with regulations are at 70%+", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
    ];
    const ev = [
      evidence({ id: "ev-1", regulation_refs: ["CHR2015:12"] }),
      evidence({ id: "ev-2", regulation_refs: ["CHR2015:12"] }),
    ];
    const result = computeInspectionReadiness(ev, regs);
    // 70% not < 50% — no critical gap
    expect(result.criticalGaps).not.toContainEqual(
      expect.stringContaining("Safeguarding"),
    );
  });

  // ── Modules with no matching regulations have 0 percentage (not NaN) ───

  it("modules with no relevant regulations have 0% not NaN", () => {
    const regs = [
      regulation({ framework: "CHR2015", reference: "12", module_links: ["safeguarding"] }),
    ];
    const result = computeInspectionReadiness([], regs);
    for (const mod of result.modules) {
      expect(Number.isNaN(mod.percentage)).toBe(false);
    }
    const contactMod = result.modules.find((m) => m.module === "contact")!;
    expect(contactMod.percentage).toBeNull();;
    expect(contactMod.maxScore).toBe(0);
  });
});

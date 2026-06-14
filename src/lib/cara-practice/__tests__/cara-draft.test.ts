// ══════════════════════════════════════════════════════════════════════════════
// Cara PRACTICE INTELLIGENCE — DRAFTING ENGINE TESTS (deterministic scaffold)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildDraftScaffold, CARA_DRAFT_DISCLAIMER, type CaraDraftType } from "../cara-draft";
import type { PracticeSourceType } from "../types";

const TODAY = "2026-06-07";
function build(draftType: CaraDraftType, content: string, sourceType: PracticeSourceType = "daily_record") {
  return buildDraftScaffold({ draftType, content, sourceType, today: TODAY });
}
function headings(r: ReturnType<typeof buildDraftScaffold>): string[] {
  return r.sections.map((s) => s.heading.toLowerCase());
}

describe("Cara draft scaffold — common contract", () => {
  const types: CaraDraftType[] = [
    "professional_record", "child_friendly_explanation", "manager_threshold_summary",
    "supervision_reflection", "care_plan_impact_statement", "protective_factor_rewrite", "livers_analysis",
  ];
  it("every draft type produces editable, deterministic, disclaimed sections", () => {
    for (const t of types) {
      const r = build(t, "Child disclosed being hit by an adult; mum attends meetings; child lacks stability.");
      expect(r.sections.length).toBeGreaterThan(2);
      expect(r.editable).toBe(true);
      expect(r.generatedBy).toBe("deterministic");
      expect(r.aiNarrative).toBeNull();
      expect(r.disclaimer).toBe(CARA_DRAFT_DISCLAIMER);
      expect(r.disclaimer.toLowerCase()).toContain("requires human");
    }
  });
});

describe("professional_record", () => {
  const r = build("professional_record", "Staff completed key work. Mum attends meetings. No concerns.");
  it("includes child impact, So What and manager-review sections", () => {
    const h = headings(r);
    expect(h.some((x) => x.includes("child's lived experience"))).toBe(true);
    expect(h.some((x) => x.includes("what has changed for the child"))).toBe(true);
    expect(h.some((x) => x.includes("so what"))).toBe(true);
    expect(h.some((x) => x.includes("manager review"))).toBe(true);
  });
  it("surfaces the overstated protective factor in the protective-factors section", () => {
    const pf = r.sections.find((s) => s.heading.toLowerCase().includes("protective"))!;
    expect(pf.body.toLowerCase()).toContain("attends meetings");
  });
});

describe("child_friendly_explanation", () => {
  const r = build("child_friendly_explanation", "Adult hit the child.");
  it("is written to the child, non-blaming, with a 'not your fault' and 'you matter' section", () => {
    const h = headings(r);
    expect(h.some((x) => x.includes("not your fault"))).toBe(true);
    expect(h.some((x) => x.includes("you matter"))).toBe(true);
    expect(h.some((x) => x.includes("who can help"))).toBe(true);
  });
});

describe("manager_threshold_summary", () => {
  const r = build("manager_threshold_summary", "Child disclosed being hit by an adult and is scared to return home.", "safeguarding_concern");
  it("uses the threshold formulation and keeps the decision with the manager", () => {
    const h = headings(r);
    expect(h.some((x) => x.includes("the concerns relate to"))).toBe(true);
    expect(h.some((x) => x.includes("threshold judgement"))).toBe(true);
    const judge = r.sections.find((s) => s.heading.toLowerCase().includes("threshold judgement"))!;
    expect(judge.body.toLowerCase()).toContain("manager judgement");
  });
});

describe("care_plan_impact_statement", () => {
  const r = build("care_plan_impact_statement", "Child lacks stability, belonging and emotional security.", "care_plan");
  it("lists the developmental gaps to close and what will be different for the child", () => {
    const gaps = r.sections.find((s) => s.heading.toLowerCase().includes("developmental gaps"))!;
    expect(gaps.body.toLowerCase()).toContain("stability");
    expect(headings(r).some((x) => x.includes("what will be different for the child"))).toBe(true);
  });
});

describe("protective_factor_rewrite", () => {
  const r = build("protective_factor_rewrite", "Mum attends meetings and engages with professionals.", "risk_assessment");
  it("tests reliability, proximity, strength, durability and removal impact", () => {
    const h = headings(r);
    expect(h.some((x) => x.includes("reliability"))).toBe(true);
    expect(h.some((x) => x.includes("durability"))).toBe(true);
    expect(h.some((x) => x.includes("what would happen if it were removed"))).toBe(true);
  });
});

describe("livers_analysis", () => {
  const r = build("livers_analysis", "Complex case with disclosure, chaotic home and unmet needs.", "incident");
  it("produces all six L.I.V.E.R.S. dimensions plus a final formulation", () => {
    const h = headings(r);
    expect(h.some((x) => x.startsWith("l —") || x.startsWith("l —"))).toBe(true);
    expect(h.some((x) => x.includes("final formulation"))).toBe(true);
    expect(h.some((x) => x.includes("sustainability"))).toBe(true);
  });
});

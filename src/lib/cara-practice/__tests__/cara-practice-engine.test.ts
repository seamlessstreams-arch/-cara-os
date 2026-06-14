// ══════════════════════════════════════════════════════════════════════════════
// Cara PRACTICE INTELLIGENCE ENGINE — TESTS
// Includes the 8 spec acceptance cases + guardrail/scoring units.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { analyzePractice, CARA_GUIDANCE_RULES } from "../cara-practice-engine";
import type { CaraPracticeInput, CaraFlagType, PracticeSourceType } from "../types";

const TODAY = "2026-06-07";

function run(text: string, sourceType: PracticeSourceType = "daily_record", extra: Partial<CaraPracticeInput> = {}) {
  return analyzePractice({ text, sourceType, today: TODAY, ...extra });
}
function flagTypes(out: ReturnType<typeof analyzePractice>): CaraFlagType[] {
  return out.flags.map((f) => f.flagType);
}
function questionDomains(out: ReturnType<typeof analyzePractice>): string[] {
  return out.questions.map((q) => q.domain);
}

// ── Acceptance test 1: vague recording / activity over impact ─────────────────
describe("Acceptance 1 — vague daily record", () => {
  const out = run("Staff completed key work. Child engaged well. No concerns.");
  it("flags activity-over-impact and vague recording", () => {
    expect(flagTypes(out)).toContain("activity_over_impact");
    expect(flagTypes(out)).toContain("vague_recording");
  });
  it("asks So What questions", () => {
    expect(questionDomains(out)).toContain("so_what");
  });
  it("recommends adding child impact", () => {
    expect(out.recommendations.some((r) => /impact/i.test(r.title) || /different for the child/i.test(r.detail))).toBe(true);
    expect(out.mode).toContain("recognises");
  });
});

// ── Acceptance test 2: overstated protective factor ───────────────────────────
describe("Acceptance 2 — protective factor", () => {
  const out = run("Mum attends meetings and engages with professionals.", "risk_assessment");
  it("flags a possible overstated protective factor", () => {
    expect(flagTypes(out)).toContain("overstated_protective_factor");
  });
  it("asks what harm it reduces and whether it works under stress", () => {
    const qs = out.questions.filter((q) => q.domain === "protective_factor").map((q) => q.question.toLowerCase());
    expect(qs.some((q) => q.includes("protect"))).toBe(true);
    expect(qs.some((q) => q.includes("stress"))).toBe(true);
  });
  it("recommends a rewrite", () => {
    expect(out.recommendations.some((r) => /rewrite/i.test(r.title))).toBe(true);
  });
});

// ── Acceptance test 2b: adult-centred drift (child-centred supervision lens) ──
describe("Acceptance 2b — adult-centred drift", () => {
  it("flags when a record is mostly about adults and the child's experience is absent", () => {
    const out = run(
      "A review meeting was held with the mother, father and the social worker. The professionals discussed the care plan and agency involvement. The team agreed the parents would attend the next meeting.",
    );
    expect(flagTypes(out)).toContain("adult_centred_drift");
    expect(questionDomains(out)).toContain("child_centred");
  });
  it("does NOT flag a child-centred record even when adults are mentioned", () => {
    const out = run(
      "The child said she felt safer this week and chose to join the group with staff. She told staff she felt heard, and her mother attended contact as planned.",
    );
    expect(flagTypes(out)).not.toContain("adult_centred_drift");
  });
  it("does NOT flag a terse note (length-gated)", () => {
    const out = run("Meeting with mum and the social worker.");
    expect(flagTypes(out)).not.toContain("adult_centred_drift");
  });
});

// ── Acceptance test 3: developmental gap ──────────────────────────────────────
describe("Acceptance 3 — developmental gap", () => {
  const out = run("Child lacks stability, belonging and emotional security.", "care_plan");
  it("flags a developmental gap", () => {
    expect(flagTypes(out)).toContain("developmental_gap");
  });
  it("identifies the missing domains", () => {
    const domains = out.developmentalGaps.map((g) => g.domain);
    expect(domains).toContain("stability");
    expect(domains).toContain("belonging");
    expect(domains).toContain("emotional security");
  });
  it("recommends a plan action to close the gap", () => {
    expect(out.recommendations.some((r) => /gap/i.test(r.title))).toBe(true);
    expect(out.nextBestActions.some((a) => /plan action/i.test(a))).toBe(true);
  });
});

// ── Acceptance test 4: safeguarding threshold + immediate danger ──────────────
describe("Acceptance 4 — safeguarding threshold", () => {
  const out = run("Child disclosed being hit by an adult and is scared to return home.", "safeguarding_concern");
  it("flags a safeguarding threshold concern and immediate safety", () => {
    expect(flagTypes(out)).toContain("safeguarding_threshold");
    expect(flagTypes(out)).toContain("immediate_safety");
  });
  it("requires manager review and recommends a strategy discussion", () => {
    expect(out.requiresManagerReview).toBe(true);
    expect(out.threshold?.strategyDiscussionRecommended).toBe(true);
    expect(out.threshold?.emergencyActionRecommended).toBe(true);
  });
  it("asks an immediate safety question and is critical severity", () => {
    expect(questionDomains(out)).toContain("threshold");
    expect(out.highestSeverity).toBe("critical");
  });
});

// ── Acceptance test 5: LADO consideration ─────────────────────────────────────
describe("Acceptance 5 — LADO", () => {
  const out = run("Concern raised about staff member having inappropriate contact with child.", "lado_concern");
  it("flags a possible LADO consultation", () => {
    expect(flagTypes(out)).toContain("lado_consideration");
  });
  it("requires manager and RI review", () => {
    const f = out.flags.find((x) => x.flagType === "lado_consideration")!;
    expect(f.requiresManagerReview).toBe(true);
    expect(f.requiresRiReview).toBe(true);
  });
  it("advises child welfare first / LADO consultation", () => {
    expect(out.recommendations.some((r) => /lado/i.test(r.title))).toBe(true);
  });
});

// ── Acceptance test 6: staff wellbeing ────────────────────────────────────────
describe("Acceptance 6 — staff wellbeing", () => {
  const out = run("Worker feels emotionally drained, overwhelmed, irritable and unable to sleep.", "supervision");
  it("raises a wellbeing signal", () => {
    expect(flagTypes(out)).toContain("staff_wellbeing");
  });
  it("recommends reflective supervision and is non-punitive (medium, not critical)", () => {
    const f = out.flags.find((x) => x.flagType === "staff_wellbeing")!;
    expect(f.severity).toBe("medium");
    expect(f.description.toLowerCase()).toContain("not disciplinary");
    expect(out.recommendations.some((r) => /reflective supervision/i.test(r.title))).toBe(true);
  });
});

// ── Acceptance test 7: relationship depth (contact ≠ trust) ───────────────────
describe("Acceptance 7 — relationship depth", () => {
  const out = run("Child attended activity with key worker.", "key_work");
  it("classifies as interaction/cooperation, not trust", () => {
    expect(out.relationshipDepth).not.toBeNull();
    expect(out.relationshipDepth!.stage).toBeLessThanOrEqual(2);
    expect(out.relationshipDepth!.stageLabel.toLowerCase()).toContain("interaction");
  });
  it("asks what evidence shows emotional safety", () => {
    const qs = out.questions.filter((q) => q.domain === "relationship").map((q) => q.question.toLowerCase());
    expect(qs.some((q) => q.includes("emotionally safe") || q.includes("emotional safety") || q.includes("safely"))).toBe(true);
  });
});

// ── Acceptance test 8: complex case → L.I.V.E.R.S. ────────────────────────────
describe("Acceptance 8 — complex case", () => {
  const out = run(
    "Child disclosed being hit by an adult, lacks stability and emotional security, and mum attends meetings but the home is chaotic and the child is scared.",
    "incident",
  );
  it("generates L.I.V.E.R.S. questions and a final formulation prompt", () => {
    expect(questionDomains(out)).toContain("livers");
    expect(out.questions.some((q) => q.question.startsWith("L —"))).toBe(true);
    expect(out.questions.some((q) => /Final test/i.test(q.question))).toBe(true);
    expect(out.recommendations.some((r) => /L\.I\.V\.E\.R\.S\./i.test(r.title))).toBe(true);
  });
});

// ── Guardrail / scoring units ─────────────────────────────────────────────────
describe("guardrails & scoring", () => {
  it("clean impactful record produces no flags but still asks what changed", () => {
    const out = run("Casey told staff she felt safe for the first time and chose to join the family meal; she seemed calmer because the routine is now predictable.");
    expect(out.flags.length).toBe(0);
    expect(out.scores.overall).toBeGreaterThan(60);
    expect(out.summary.toLowerCase()).toContain("different for the child");
  });

  it("never auto-decides — safeguarding always requires human review", () => {
    const out = run("Child disclosed being hit by an adult and is scared to return home.", "safeguarding_concern");
    const sg = out.flags.find((f) => f.flagType === "safeguarding_threshold")!;
    expect(sg.requiresManagerReview).toBe(true);
    expect(out.threshold!.managerSummary).toContain("Cara does not decide");
  });

  it("immediate danger pulls overall score down and prioritises safety first", () => {
    const out = run("Child is scared to return home tonight and says they are not safe at home.", "safeguarding_concern");
    expect(out.scores.overall).toBeLessThanOrEqual(40);
    expect(out.nextBestActions[0].toLowerCase()).toContain("safe");
  });

  it("ships the 10 seed guidance rules", () => {
    expect(CARA_GUIDANCE_RULES.length).toBe(10);
    expect(CARA_GUIDANCE_RULES.every((r) => r.rule_key && r.active)).toBe(true);
    expect(new Set(CARA_GUIDANCE_RULES.map((r) => r.rule_key)).size).toBe(10);
  });
});

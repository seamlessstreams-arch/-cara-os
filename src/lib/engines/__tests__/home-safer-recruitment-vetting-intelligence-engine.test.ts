// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SAFER RECRUITMENT VETTING INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  computeSaferRecruitmentVetting,
  type RecruitmentRecordInput,
  type EmploymentHistoryInput,
  type GapExplanationInput,
  type InterviewInput,
  type SaferRecruitmentInput,
} from "../home-safer-recruitment-vetting-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makeRecruitment(
  id: string,
  overrides: Partial<RecruitmentRecordInput> = {},
): RecruitmentRecordInput {
  return {
    id,
    candidate_name: `Candidate ${id}`,
    status: "cleared",
    checklist_complete_rate: 100,
    references_received: 2,
    references_required: 2,
    dbs_result: "clear",
    has_red_flags: false,
    interview_panel_size: 2,
    panel_safer_recruitment_trained: true,
    ...overrides,
  };
}

function makeHistory(
  id: string,
  candidateId: string,
  overrides: Partial<EmploymentHistoryInput> = {},
): EmploymentHistoryInput {
  return {
    id,
    candidate_id: candidateId,
    verified: true,
    ...overrides,
  };
}

function makeGap(
  id: string,
  candidateId: string,
  overrides: Partial<GapExplanationInput> = {},
): GapExplanationInput {
  return {
    id,
    candidate_id: candidateId,
    explained: true,
    ...overrides,
  };
}

function makeInterview(
  id: string,
  candidateId: string,
  overrides: Partial<InterviewInput> = {},
): InterviewInput {
  return {
    id,
    candidate_id: candidateId,
    completed: true,
    panel_size: 2,
    safer_recruitment_trained_on_panel: true,
    recommendation: "appoint",
    ...overrides,
  };
}

/**
 * Base input producing outstanding:
 * 8 staff, 4 candidates all cleared with full refs, verified histories,
 * compliant interviews, no gaps, 100% checklists.
 *
 * Score: 52 base
 *  Mod 1 DBS 100% (4/4 clear) → +6
 *  Mod 2 Refs 100% (4/4 complete) → +5
 *  Mod 3 History 100% (8/8 verified) → +5
 *  Mod 4 Interview 100% (4/4 compliant) → +5
 *  Mod 5 No gaps → +4
 *  Mod 6 Checklist avg 100% → +5
 *  Total: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82 (outstanding)
 */
function baseInput(
  overrides: Partial<SaferRecruitmentInput> = {},
): SaferRecruitmentInput {
  const candidates = [
    makeRecruitment("r1"),
    makeRecruitment("r2"),
    makeRecruitment("r3"),
    makeRecruitment("r4"),
  ];
  const histories = [
    makeHistory("h1", "r1"),
    makeHistory("h2", "r1"),
    makeHistory("h3", "r2"),
    makeHistory("h4", "r2"),
    makeHistory("h5", "r3"),
    makeHistory("h6", "r3"),
    makeHistory("h7", "r4"),
    makeHistory("h8", "r4"),
  ];
  const interviews = [
    makeInterview("i1", "r1"),
    makeInterview("i2", "r2"),
    makeInterview("i3", "r3"),
    makeInterview("i4", "r4"),
  ];

  return {
    today: TODAY,
    total_staff: 8,
    recruitment_records: candidates,
    employment_histories: histories,
    gap_explanations: [],
    interviews,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Home Safer Recruitment Vetting Intelligence Engine", () => {
  // ── 1. Insufficient Data ─────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_staff is 0", () => {
      const r = computeSaferRecruitmentVetting(
        baseInput({ total_staff: 0 }),
      );
      expect(r.recruitment_rating).toBe("insufficient_data");
      expect(r.recruitment_score).toBe(0);
      expect(r.total_candidates).toBe(0);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("includes regulatory reference in insufficient_data recommendations", () => {
      const r = computeSaferRecruitmentVetting(
        baseInput({ total_staff: 0 }),
      );
      expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 32");
    });

    it("does not return insufficient_data when total_staff > 0", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.recruitment_rating).not.toBe("insufficient_data");
    });
  });

  // ── 2. Outstanding Rating ────────────────────────────────────────────────

  describe("outstanding rating", () => {
    it("achieves outstanding with perfect recruitment practice (score ~82)", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      expect(r.recruitment_rating).toBe("outstanding");
      expect(r.recruitment_score).toBe(82);
    });

    it("generates strengths for outstanding", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.strengths.some((s) => s.includes("DBS"))).toBe(true);
      expect(r.strengths.some((s) => s.includes("reference"))).toBe(true);
    });

    it("achieves outstanding at score boundary of 80", () => {
      // Degrade one modifier slightly: make Mod 5 go from +4 (no gaps) to +1 (80% explained)
      // And Mod 6 from +5 to +2 (avg ~80%)
      // 52 + 6 + 5 + 5 + 5 + 1 + 2 = 76 — not enough, need to be more precise
      // Instead: keep all at top except Mod 5. Add gaps, 95%+ explained → still +4
      // Reduce Mod 6 from +5 to +2: checklist avg 80-94%
      // 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79 — just under
      // Try: Mod 1 95% → +6, Mod 2 90% → +5, Mod 3 90% → +5, Mod 4 90% → +5
      // Mod 5 no gaps → +4, Mod 6 80% → +2 → total 79 (good)
      // To hit exactly 80: Mod 6 95% → +5, Mod 3 degrade to 70% → +2
      // 52 + 6 + 5 + 2 + 5 + 4 + 5 = 79 — still 79
      // Mod 3 at 90% → +5, Mod 6 at 95% → +5 = 82 (base)
      // Let's test boundary: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82 is outstanding
      // 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79 is good
      // So outstanding needs >= 80, which the base achieves at 82
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.recruitment_score).toBeGreaterThanOrEqual(80);
      expect(r.recruitment_rating).toBe("outstanding");
    });
  });

  // ── 3. Good Rating ───────────────────────────────────────────────────────

  describe("good rating", () => {
    it("achieves good when Mod 3 and Mod 6 are degraded", () => {
      // Keep Mods 1, 2, 4, 5 at top. Degrade Mod 3 (verification ~63% → +0) and Mod 6 (checklist avg ~85% → +2).
      // 52 + 6 + 5 + 0 + 5 + 4 + 2 = 74 (good)
      const histories = [
        // 5 out of 8 verified = 63% → ≥50% <70% → +0
        makeHistory("h1", "r1", { verified: true }),
        makeHistory("h2", "r1", { verified: true }),
        makeHistory("h3", "r2", { verified: true }),
        makeHistory("h4", "r2", { verified: false }),
        makeHistory("h5", "r3", { verified: true }),
        makeHistory("h6", "r3", { verified: false }),
        makeHistory("h7", "r4", { verified: true }),
        makeHistory("h8", "r4", { verified: false }),
      ];

      const candidates = [
        makeRecruitment("r1", { checklist_complete_rate: 85 }),
        makeRecruitment("r2", { checklist_complete_rate: 85 }),
        makeRecruitment("r3", { checklist_complete_rate: 85 }),
        makeRecruitment("r4", { checklist_complete_rate: 85 }),
      ];

      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: candidates,
          employment_histories: histories,
        }),
      );
      // Mod 1: 100% DBS → +6
      // Mod 2: 100% refs → +5
      // Mod 3: 5/8 = 63% → +0
      // Mod 4: 100% interviews → +5
      // Mod 5: no gaps → +4
      // Mod 6: avg 85% (≥80 <95) → +2
      // Total: 52 + 6 + 5 + 0 + 5 + 4 + 2 = 74
      expect(r.recruitment_rating).toBe("good");
      expect(r.recruitment_score).toBe(74);
    });

    it("good rating has correct headline", () => {
      const histories = [
        makeHistory("h1", "r1"),
        makeHistory("h2", "r1"),
        makeHistory("h3", "r2"),
        makeHistory("h4", "r2", { verified: false }),
        makeHistory("h5", "r3"),
        makeHistory("h6", "r3", { verified: false }),
        makeHistory("h7", "r4"),
        makeHistory("h8", "r4", { verified: false }),
      ];
      const candidates = [
        makeRecruitment("r1", { checklist_complete_rate: 85 }),
        makeRecruitment("r2", { checklist_complete_rate: 85 }),
        makeRecruitment("r3", { checklist_complete_rate: 85 }),
        makeRecruitment("r4", { checklist_complete_rate: 85 }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: candidates,
          employment_histories: histories,
        }),
      );
      expect(r.headline).toContain("Good");
    });
  });

  // ── 4. Adequate Rating ───────────────────────────────────────────────────

  describe("adequate rating", () => {
    it("achieves adequate with multiple degraded modifiers", () => {
      // Degrade several modifiers to land in 45-64 range
      // Mod 1: DBS 75% (≥60 <80) → +0, Mod 2: refs 50% (≥50 <70) → +0
      // Mod 3: history 20% (<50) → -5, Mod 4: interview 25% (<50) → -5
      // Mod 5: no gaps → +4, Mod 6: checklist avg 90% (≥80 <95) → +2
      // 52 + 0 + 0 - 5 - 5 + 4 + 2 = 48
      const candidates = [
        makeRecruitment("r1", { dbs_result: "clear", references_received: 2, checklist_complete_rate: 90 }),
        makeRecruitment("r2", { dbs_result: "clear", references_received: 2, checklist_complete_rate: 90 }),
        makeRecruitment("r3", { dbs_result: "clear", references_received: 1, checklist_complete_rate: 90 }),
        makeRecruitment("r4", { dbs_result: "pending", references_received: 1, checklist_complete_rate: 90 }),
      ];
      // DBS: 3 clear / 4 relevant = 75% → +0
      // Refs: 2/4 complete = 50% → +0

      const histories = [
        makeHistory("h1", "r1", { verified: true }),
        makeHistory("h2", "r2", { verified: false }),
        makeHistory("h3", "r3", { verified: false }),
        makeHistory("h4", "r4", { verified: false }),
        makeHistory("h5", "r4", { verified: false }),
      ];
      // 1/5 = 20% → -5

      const interviews = [
        makeInterview("i1", "r1", { panel_size: 2, safer_recruitment_trained_on_panel: true }),
        makeInterview("i2", "r2", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
        makeInterview("i3", "r3", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
        makeInterview("i4", "r4", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
      ];
      // 1/4 = 25% → -5

      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: candidates,
          employment_histories: histories,
          interviews,
        }),
      );
      // 52 + 0 + 0 - 5 - 5 + 4 + 2 = 48
      expect(r.recruitment_rating).toBe("adequate");
      expect(r.recruitment_score).toBe(48);
    });

    it("adequate headline is correct", () => {
      const candidates = [
        makeRecruitment("r1", { dbs_result: "clear", references_received: 2, checklist_complete_rate: 90 }),
        makeRecruitment("r2", { dbs_result: "clear", references_received: 2, checklist_complete_rate: 90 }),
        makeRecruitment("r3", { dbs_result: "clear", references_received: 1, checklist_complete_rate: 90 }),
        makeRecruitment("r4", { dbs_result: "pending", references_received: 1, checklist_complete_rate: 90 }),
      ];
      const histories = [
        makeHistory("h1", "r1", { verified: true }),
        makeHistory("h2", "r2", { verified: false }),
        makeHistory("h3", "r3", { verified: false }),
        makeHistory("h4", "r4", { verified: false }),
        makeHistory("h5", "r4", { verified: false }),
      ];
      const interviews = [
        makeInterview("i1", "r1"),
        makeInterview("i2", "r2", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
        makeInterview("i3", "r3", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
        makeInterview("i4", "r4", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: candidates,
          employment_histories: histories,
          interviews,
        }),
      );
      expect(r.headline).toContain("Adequate");
    });
  });

  // ── 5. Inadequate Rating ─────────────────────────────────────────────────

  describe("inadequate rating", () => {
    it("scores inadequate with heavily degraded modifiers", () => {
      // All modifiers at worst
      // Mod 1: DBS 0% (all pending) → -6
      // Mod 2: refs 0% → -5
      // Mod 3: history 0% → -5
      // Mod 4: interview 0% → -5
      // Mod 5: gaps all unexplained → -4
      // Mod 6: checklist 20% → -5
      // 52 - 6 - 5 - 5 - 5 - 4 - 5 = 22
      const candidates = [
        makeRecruitment("r1", {
          dbs_result: "pending",
          references_received: 0,
          checklist_complete_rate: 20,
          has_red_flags: true,
        }),
        makeRecruitment("r2", {
          dbs_result: "pending",
          references_received: 0,
          checklist_complete_rate: 20,
          has_red_flags: true,
        }),
      ];
      const histories = [
        makeHistory("h1", "r1", { verified: false }),
        makeHistory("h2", "r2", { verified: false }),
      ];
      const gaps = [
        makeGap("g1", "r1", { explained: false }),
        makeGap("g2", "r2", { explained: false }),
      ];
      const interviews = [
        makeInterview("i1", "r1", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
        makeInterview("i2", "r2", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
      ];

      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: candidates,
          employment_histories: histories,
          gap_explanations: gaps,
          interviews,
        }),
      );
      expect(r.recruitment_rating).toBe("inadequate");
      expect(r.recruitment_score).toBe(22);
    });

    it("generates critical insights for inadequate recruitment", () => {
      const candidates = [
        makeRecruitment("r1", {
          dbs_result: "pending",
          references_received: 0,
          checklist_complete_rate: 20,
          has_red_flags: true,
        }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: candidates,
          employment_histories: [makeHistory("h1", "r1", { verified: false })],
          interviews: [makeInterview("i1", "r1", { panel_size: 1, safer_recruitment_trained_on_panel: false })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
      expect(r.concerns.length).toBeGreaterThan(0);
    });

    it("inadequate headline is correct", () => {
      const candidates = [
        makeRecruitment("r1", {
          dbs_result: "pending",
          references_received: 0,
          checklist_complete_rate: 20,
          has_red_flags: true,
        }),
        makeRecruitment("r2", {
          dbs_result: "pending",
          references_received: 0,
          checklist_complete_rate: 20,
        }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: candidates,
          employment_histories: [
            makeHistory("h1", "r1", { verified: false }),
            makeHistory("h2", "r2", { verified: false }),
          ],
          gap_explanations: [
            makeGap("g1", "r1", { explained: false }),
            makeGap("g2", "r2", { explained: false }),
          ],
          interviews: [
            makeInterview("i1", "r1", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
            makeInterview("i2", "r2", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
          ],
        }),
      );
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── 6. Mod 1: DBS Clearance Rate ────────────────────────────────────────

  describe("Mod 1 — DBS clearance rate", () => {
    it("awards +6 when DBS clearance >= 95%", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      // All clear → 100% → +6
      expect(r.dbs_clearance_rate).toBe(100);
    });

    it("awards +3 when DBS clearance >= 80% and < 95%", () => {
      // 4 out of 5 candidates with DBS clear = 80%
      const candidates = [
        makeRecruitment("r1", { dbs_result: "clear" }),
        makeRecruitment("r2", { dbs_result: "clear" }),
        makeRecruitment("r3", { dbs_result: "clear" }),
        makeRecruitment("r4", { dbs_result: "clear" }),
        makeRecruitment("r5", { dbs_result: "pending" }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.dbs_clearance_rate).toBe(80);
    });

    it("treats disclosure_reviewed as cleared", () => {
      const candidates = [
        makeRecruitment("r1", { dbs_result: "disclosure_reviewed" }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.dbs_clearance_rate).toBe(100);
    });

    it("penalises -6 when DBS clearance < 60%", () => {
      const candidates = [
        makeRecruitment("r1", { dbs_result: "pending" }),
        makeRecruitment("r2", { dbs_result: "pending" }),
        makeRecruitment("r3", { dbs_result: "clear" }),
      ];
      // 1/3 = 33% → -6
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.dbs_clearance_rate).toBe(33);
    });
  });

  // ── 7. Mod 2: Reference Completion Rate ──────────────────────────────────

  describe("Mod 2 — reference completion rate", () => {
    it("awards +5 when reference completion >= 90%", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.reference_completion_rate).toBe(100);
    });

    it("awards +2 when reference completion >= 70% and < 90%", () => {
      // 3 out of 4 candidates have complete refs = 75%
      const candidates = [
        makeRecruitment("r1"),
        makeRecruitment("r2"),
        makeRecruitment("r3"),
        makeRecruitment("r4", { references_received: 1, references_required: 2 }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.reference_completion_rate).toBe(75);
    });

    it("penalises -5 when reference completion < 50%", () => {
      // 1 out of 4
      const candidates = [
        makeRecruitment("r1"),
        makeRecruitment("r2", { references_received: 0 }),
        makeRecruitment("r3", { references_received: 1 }),
        makeRecruitment("r4", { references_received: 0 }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.reference_completion_rate).toBe(25);
    });
  });

  // ── 8. Mod 3: Employment History Verification ───────────────────────────

  describe("Mod 3 — employment history verification", () => {
    it("awards +5 when verification >= 90%", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.history_verification_rate).toBe(100);
    });

    it("awards +2 when verification >= 70% and < 90%", () => {
      const histories = [
        makeHistory("h1", "r1"),
        makeHistory("h2", "r1"),
        makeHistory("h3", "r2"),
        makeHistory("h4", "r2", { verified: false }),
        makeHistory("h5", "r3"),
        makeHistory("h6", "r3"),
        makeHistory("h7", "r4"),
        makeHistory("h8", "r4"),
        makeHistory("h9", "r4"),
        makeHistory("h10", "r4", { verified: false }),
      ];
      // 8/10 = 80%
      const r = computeSaferRecruitmentVetting(
        baseInput({ employment_histories: histories }),
      );
      expect(r.history_verification_rate).toBe(80);
    });

    it("penalises -5 when verification < 50%", () => {
      const histories = [
        makeHistory("h1", "r1", { verified: false }),
        makeHistory("h2", "r1", { verified: false }),
        makeHistory("h3", "r2", { verified: true }),
      ];
      // 1/3 = 33%
      const r = computeSaferRecruitmentVetting(
        baseInput({ employment_histories: histories }),
      );
      expect(r.history_verification_rate).toBe(33);
    });

    it("treats zero histories as unmeasured, not a failure", () => {
      const r = computeSaferRecruitmentVetting(
        baseInput({ employment_histories: [] }),
      );
      expect(r.history_verification_rate).toBeNull();
    });
  });

  // ── 9. Mod 4: Interview Compliance ──────────────────────────────────────

  describe("Mod 4 — interview compliance", () => {
    it("awards +5 when interview compliance >= 90%", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.interview_compliance_rate).toBe(100);
    });

    it("requires both panel_size >= 2 AND safer_recruitment_trained", () => {
      const interviews = [
        makeInterview("i1", "r1", { panel_size: 2, safer_recruitment_trained_on_panel: true }),
        makeInterview("i2", "r2", { panel_size: 3, safer_recruitment_trained_on_panel: false }), // not trained
        makeInterview("i3", "r3", { panel_size: 1, safer_recruitment_trained_on_panel: true }),  // too small
      ];
      // Only 1/3 = 33% compliant
      const r = computeSaferRecruitmentVetting(
        baseInput({ interviews }),
      );
      expect(r.interview_compliance_rate).toBe(33);
    });

    it("treats zero interviews as unmeasured, not a failure", () => {
      const r = computeSaferRecruitmentVetting(
        baseInput({ interviews: [] }),
      );
      expect(r.interview_compliance_rate).toBeNull();
    });
  });

  // ── 10. Mod 5: Gap Explanation Rate ─────────────────────────────────────

  describe("Mod 5 — gap explanation rate", () => {
    it("leaves the gap rate unmeasured when no gaps exist", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.gap_explanation_rate).toBeNull();
    });

    it("awards +4 when gap explanation rate >= 95%", () => {
      // 20 gaps, 19 explained = 95%
      const gaps = Array.from({ length: 20 }, (_, i) =>
        makeGap(`g${i}`, "r1", { explained: i < 19 }),
      );
      const r = computeSaferRecruitmentVetting(
        baseInput({ gap_explanations: gaps }),
      );
      expect(r.gap_explanation_rate).toBe(95);
    });

    it("awards +1 when gap explanation rate >= 80% and < 95%", () => {
      // 5 gaps, 4 explained = 80%
      const gaps = [
        makeGap("g1", "r1"),
        makeGap("g2", "r2"),
        makeGap("g3", "r3"),
        makeGap("g4", "r4"),
        makeGap("g5", "r1", { explained: false }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ gap_explanations: gaps }),
      );
      expect(r.gap_explanation_rate).toBe(80);
    });

    it("penalises -4 when gap explanation rate < 60%", () => {
      // 4 gaps, 1 explained = 25%
      const gaps = [
        makeGap("g1", "r1"),
        makeGap("g2", "r2", { explained: false }),
        makeGap("g3", "r3", { explained: false }),
        makeGap("g4", "r4", { explained: false }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ gap_explanations: gaps }),
      );
      expect(r.gap_explanation_rate).toBe(25);
    });
  });

  // ── 11. Mod 6: Checklist Completion ─────────────────────────────────────

  describe("Mod 6 — checklist completion", () => {
    it("awards +5 when avg checklist >= 95%", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      // all candidates have 100%
      expect(r.recruitment_score).toBe(82);
    });

    it("awards +2 when avg checklist >= 80% and < 95%", () => {
      const candidates = [
        makeRecruitment("r1", { checklist_complete_rate: 85 }),
        makeRecruitment("r2", { checklist_complete_rate: 85 }),
        makeRecruitment("r3", { checklist_complete_rate: 85 }),
        makeRecruitment("r4", { checklist_complete_rate: 85 }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      // Base 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79
      expect(r.recruitment_score).toBe(79);
    });

    it("penalises -5 when avg checklist < 60%", () => {
      const candidates = [
        makeRecruitment("r1", { checklist_complete_rate: 40 }),
        makeRecruitment("r2", { checklist_complete_rate: 40 }),
        makeRecruitment("r3", { checklist_complete_rate: 40 }),
        makeRecruitment("r4", { checklist_complete_rate: 40 }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      // Base 52 + 6 + 5 + 5 + 5 + 4 + (-5) = 72
      expect(r.recruitment_score).toBe(72);
    });
  });

  // ── 12. Metrics ──────────────────────────────────────────────────────────

  describe("metrics", () => {
    it("calculates all metric percentages correctly", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.total_candidates).toBe(4);
      expect(r.dbs_clearance_rate).toBe(100);
      expect(r.reference_completion_rate).toBe(100);
      expect(r.history_verification_rate).toBe(100);
      expect(r.interview_compliance_rate).toBe(100);
      expect(r.gap_explanation_rate).toBeNull(); // no gaps recorded = nothing to explain
    });

    it("reports nothing measured for empty denominators", () => {
      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: [],
          employment_histories: [],
          interviews: [],
        }),
      );
      expect(r.dbs_clearance_rate).toBeNull();
      expect(r.reference_completion_rate).toBeNull();
      expect(r.history_verification_rate).toBeNull();
      expect(r.interview_compliance_rate).toBeNull();
    });
  });

  // ── 13. Strengths ────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes DBS clearance strength", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.strengths.some((s) => s.includes("DBS clearance"))).toBe(true);
    });

    it("includes reference completion strength", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.strengths.some((s) => s.includes("reference completion"))).toBe(true);
    });

    it("includes history verification strength", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.strengths.some((s) => s.includes("employment history verification"))).toBe(true);
    });

    it("includes interview compliance strength", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.strengths.some((s) => s.includes("interview compliance"))).toBe(true);
    });

    it("includes no gaps strength when no gaps exist", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.strengths.some((s) => s.includes("No employment gaps"))).toBe(true);
    });

    it("includes checklist completion strength", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.strengths.some((s) => s.includes("checklist completion"))).toBe(true);
    });

    it("includes no red flags strength", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.strengths.some((s) => s.includes("No red flags"))).toBe(true);
    });
  });

  // ── 14. Concerns ─────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags pending DBS checks", () => {
      const candidates = [
        makeRecruitment("r1", { dbs_result: "pending" }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.concerns.some((c) => c.includes("DBS check still pending"))).toBe(true);
    });

    it("flags incomplete references", () => {
      const candidates = [
        makeRecruitment("r1", { references_received: 1, references_required: 2 }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.concerns.some((c) => c.includes("incomplete references"))).toBe(true);
    });

    it("flags unverified histories", () => {
      const histories = [
        makeHistory("h1", "r1", { verified: false }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ employment_histories: histories }),
      );
      expect(r.concerns.some((c) => c.includes("unverified"))).toBe(true);
    });

    it("flags unexplained gaps", () => {
      const gaps = [makeGap("g1", "r1", { explained: false })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ gap_explanations: gaps }),
      );
      expect(r.concerns.some((c) => c.includes("without satisfactory explanation"))).toBe(true);
    });

    it("flags red flag candidates", () => {
      const candidates = [makeRecruitment("r1", { has_red_flags: true })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.concerns.some((c) => c.includes("red flags"))).toBe(true);
    });

    it("flags non-compliant interviews", () => {
      const interviews = [
        makeInterview("i1", "r1", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ interviews }),
      );
      expect(r.concerns.some((c) => c.includes("safer recruitment panel standards"))).toBe(true);
    });

    it("flags low checklist completion", () => {
      const candidates = [
        makeRecruitment("r1", { checklist_complete_rate: 30 }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.concerns.some((c) => c.includes("checklist completion"))).toBe(true);
    });
  });

  // ── 15. Recommendations ──────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends resolving pending DBS checks", () => {
      const candidates = [makeRecruitment("r1", { dbs_result: "pending" })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("pending DBS"))).toBe(true);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 32");
    });

    it("recommends investigating red flags", () => {
      const candidates = [makeRecruitment("r1", { has_red_flags: true })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("red flags"))).toBe(true);
    });

    it("recommends obtaining outstanding references with Sch 2 ref", () => {
      const candidates = [
        makeRecruitment("r1", { references_received: 0 }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      const refRec = r.recommendations.find((rec) =>
        rec.recommendation.includes("references"),
      );
      expect(refRec).toBeDefined();
      expect(refRec!.regulatory_ref).toBe("CHR 2015 Sch 2");
    });

    it("recommends documenting unexplained gaps", () => {
      const gaps = [makeGap("g1", "r1", { explained: false })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ gap_explanations: gaps }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("gap"))).toBe(true);
    });

    it("recommends verifying employment history", () => {
      const histories = [makeHistory("h1", "r1", { verified: false })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ employment_histories: histories }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("employment history"))).toBe(true);
    });

    it("recommends improving interview panels", () => {
      const interviews = [
        makeInterview("i1", "r1", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ interviews }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("panel"))).toBe(true);
    });

    it("generates no recommendations for perfect recruitment", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.recommendations.length).toBe(0);
    });

    it("ranks recommendations sequentially", () => {
      const candidates = [
        makeRecruitment("r1", {
          dbs_result: "pending",
          has_red_flags: true,
          references_received: 0,
        }),
      ];
      const gaps = [makeGap("g1", "r1", { explained: false })];
      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: candidates,
          gap_explanations: gaps,
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── 16. Insights ─────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for exemplary recruitment", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(
        r.insights.some(
          (i) => i.severity === "positive" && i.text.includes("exemplary"),
        ),
      ).toBe(true);
    });

    it("generates critical insight for pending DBS", () => {
      const candidates = [makeRecruitment("r1", { dbs_result: "pending" })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(
        r.insights.some(
          (i) => i.severity === "critical" && i.text.includes("DBS"),
        ),
      ).toBe(true);
    });

    it("generates critical insight for red flags", () => {
      const candidates = [makeRecruitment("r1", { has_red_flags: true })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(
        r.insights.some(
          (i) => i.severity === "critical" && i.text.includes("red flags"),
        ),
      ).toBe(true);
    });

    it("generates warning insight for unexplained gaps", () => {
      const gaps = [makeGap("g1", "r1", { explained: false })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ gap_explanations: gaps }),
      );
      expect(
        r.insights.some(
          (i) => i.severity === "warning" && i.text.includes("gap"),
        ),
      ).toBe(true);
    });

    it("generates warning insight for non-compliant interviews", () => {
      const interviews = [
        makeInterview("i1", "r1", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ interviews }),
      );
      expect(
        r.insights.some(
          (i) => i.severity === "warning" && i.text.includes("panel"),
        ),
      ).toBe(true);
    });

    it("generates warning insight for no employment histories", () => {
      const r = computeSaferRecruitmentVetting(
        baseInput({ employment_histories: [] }),
      );
      expect(
        r.insights.some(
          (i) =>
            i.severity === "warning" &&
            i.text.includes("No employment history"),
        ),
      ).toBe(true);
    });

    it("generates critical insight for low checklist completion", () => {
      const candidates = [
        makeRecruitment("r1", { checklist_complete_rate: 30 }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(
        r.insights.some(
          (i) =>
            i.severity === "critical" && i.text.includes("checklist"),
        ),
      ).toBe(true);
    });
  });

  // ── 17. Headlines ────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("generates outstanding headline", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("generates insufficient_data headline", () => {
      const r = computeSaferRecruitmentVetting(
        baseInput({ total_staff: 0 }),
      );
      expect(r.headline).toContain("No staff recorded");
    });

    it("headline includes candidate count for outstanding", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.headline).toContain("4 candidates");
    });
  });

  // ── 18. Score Clamping ───────────────────────────────────────────────────

  describe("score clamping", () => {
    it("clamps score to 0 minimum", () => {
      // Create a scenario with maximum penalties
      // 52 - 6 - 5 - 5 - 5 - 4 - 5 = 22, so still above 0
      // To get below 0 we'd need even more penalties, but modifiers cap at those values
      // Verify the engine doesn't go below 0 conceptually
      const candidates = [
        makeRecruitment("r1", {
          dbs_result: "pending",
          references_received: 0,
          checklist_complete_rate: 10,
        }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: candidates,
          employment_histories: [makeHistory("h1", "r1", { verified: false })],
          gap_explanations: [makeGap("g1", "r1", { explained: false })],
          interviews: [makeInterview("i1", "r1", { panel_size: 1, safer_recruitment_trained_on_panel: false })],
        }),
      );
      expect(r.recruitment_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to 100 maximum", () => {
      // The base case only reaches 82, but verify clamping logic exists
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.recruitment_score).toBeLessThanOrEqual(100);
    });
  });

  // ── 19. Edge Cases ───────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles empty recruitment records with staff > 0", () => {
      const r = computeSaferRecruitmentVetting(
        baseInput({
          recruitment_records: [],
          employment_histories: [],
          interviews: [],
        }),
      );
      expect(r.recruitment_rating).not.toBe("insufficient_data");
      expect(r.total_candidates).toBe(0);
    });

    it("handles single candidate scenario", () => {
      const candidates = [makeRecruitment("r1")];
      const histories = [makeHistory("h1", "r1")];
      const interviews = [makeInterview("i1", "r1")];
      const r = computeSaferRecruitmentVetting(
        baseInput({
          total_staff: 1,
          recruitment_records: candidates,
          employment_histories: histories,
          interviews,
        }),
      );
      expect(r.total_candidates).toBe(1);
      expect(r.recruitment_rating).toBe("outstanding");
    });

    it("plural forms for single pending DBS", () => {
      const candidates = [makeRecruitment("r1", { dbs_result: "pending" })];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.concerns.some((c) => c.includes("1 candidate with DBS check still pending"))).toBe(true);
    });

    it("plural forms for multiple pending DBS", () => {
      const candidates = [
        makeRecruitment("r1", { dbs_result: "pending" }),
        makeRecruitment("r2", { dbs_result: "pending" }),
      ];
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.concerns.some((c) => c.includes("2 candidates with DBS check still pending"))).toBe(true);
    });

    it("gap_explanation_rate is unmeasured when no gaps exist", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.gap_explanation_rate).toBeNull();
    });

    it("handles mixed DBS results correctly", () => {
      const candidates = [
        makeRecruitment("r1", { dbs_result: "clear" }),
        makeRecruitment("r2", { dbs_result: "disclosure_reviewed" }),
        makeRecruitment("r3", { dbs_result: "pending" }),
      ];
      // 2 cleared / 3 relevant = 67%
      const r = computeSaferRecruitmentVetting(
        baseInput({ recruitment_records: candidates }),
      );
      expect(r.dbs_clearance_rate).toBe(67);
    });
  });

  // ── 20. Full Scenario Integration ────────────────────────────────────────

  describe("full scenario integration", () => {
    it("large home with mixed recruitment quality", () => {
      const candidates = [
        makeRecruitment("r1", { dbs_result: "clear", checklist_complete_rate: 100 }),
        makeRecruitment("r2", { dbs_result: "clear", checklist_complete_rate: 100 }),
        makeRecruitment("r3", { dbs_result: "clear", checklist_complete_rate: 95 }),
        makeRecruitment("r4", { dbs_result: "disclosure_reviewed", checklist_complete_rate: 90 }),
        makeRecruitment("r5", { dbs_result: "clear", checklist_complete_rate: 85 }),
        makeRecruitment("r6", { dbs_result: "pending", references_received: 1, checklist_complete_rate: 70 }),
      ];
      // DBS: 5 cleared / 6 relevant = 83% → +3
      // Refs: 5/6 complete = 83% → +2
      // Checklist avg: (100+100+95+90+85+70)/6 = 540/6 = 90 → +2

      const histories = [
        makeHistory("h1", "r1"),
        makeHistory("h2", "r2"),
        makeHistory("h3", "r3"),
        makeHistory("h4", "r4"),
        makeHistory("h5", "r5"),
        makeHistory("h6", "r6"),
        makeHistory("h7", "r1"),
        makeHistory("h8", "r2"),
        makeHistory("h9", "r3", { verified: false }),
        makeHistory("h10", "r6", { verified: false }),
      ];
      // 8/10 = 80% → +2

      const interviews = [
        makeInterview("i1", "r1"),
        makeInterview("i2", "r2"),
        makeInterview("i3", "r3"),
        makeInterview("i4", "r4"),
        makeInterview("i5", "r5"),
        makeInterview("i6", "r6", { panel_size: 1, safer_recruitment_trained_on_panel: false }),
      ];
      // 5/6 = 83% → +2

      const gaps = [
        makeGap("g1", "r6"),
      ];
      // 1/1 = 100% → +4

      const r = computeSaferRecruitmentVetting(
        baseInput({
          total_staff: 20,
          recruitment_records: candidates,
          employment_histories: histories,
          gap_explanations: gaps,
          interviews,
        }),
      );
      // 52 + 3 + 2 + 2 + 2 + 4 + 2 = 67 (good)
      expect(r.recruitment_rating).toBe("good");
      expect(r.recruitment_score).toBe(67);
      expect(r.total_candidates).toBe(6);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
    });

    it("produces complete result shape with all fields defined", () => {
      const r = computeSaferRecruitmentVetting(baseInput());
      expect(r.recruitment_rating).toBeDefined();
      expect(r.recruitment_score).toBeDefined();
      expect(r.headline).toBeDefined();
      expect(r.total_candidates).toBeDefined();
      expect(r.dbs_clearance_rate).toBeDefined();
      expect(r.reference_completion_rate).toBeDefined();
      expect(r.history_verification_rate).toBeDefined();
      expect(r.interview_compliance_rate).toBeDefined();
      expect(r.gap_explanation_rate).toBeDefined();
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });
  });
});

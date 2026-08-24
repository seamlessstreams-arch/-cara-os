import { describe, it, expect } from "vitest";
import {
  computeHomeReg4445Evidence,
  type HomeReg4445EvidenceInput,
  type Reg44PackInput, type Reg44VisitReportInput, type Reg44ActionRecordInput,
  type Reg45EvidenceInput, type Reg46ReviewInput, type AnnexAEvidenceInput,
} from "../home-reg4445-evidence-intelligence-engine";

const TODAY = "2026-05-27";
function daysAgo(n: number): string { const d = new Date("2026-05-27"); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function futureDate(n: number): string { const d = new Date("2026-05-27"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

function makePack(ov: Partial<Reg44PackInput> = {}): Reg44PackInput {
  return { id: `p_${Math.random().toString(36).slice(2, 8)}`, month: "2026-04", visit_completed: true, report_submitted: true, children_spoken_to: 4, areas_covered: 6, actions_raised: 2, ...ov };
}
function makeReport(ov: Partial<Reg44VisitReportInput> = {}): Reg44VisitReportInput {
  return { id: `r_${Math.random().toString(36).slice(2, 8)}`, visit_date: daysAgo(10), children_interviewed: 4, staff_interviewed: 3, areas_inspected: ["care", "safety", "education", "health", "records"], positive_findings: 5, concerns_raised: 1, child_voice_included: true, ...ov };
}
function makeAction(ov: Partial<Reg44ActionRecordInput> = {}): Reg44ActionRecordInput {
  return { id: `a_${Math.random().toString(36).slice(2, 8)}`, raised_date: daysAgo(30), due_date: daysAgo(5), completed_date: daysAgo(7), status: "completed", priority: "medium", ...ov };
}
function makeReg45(ov: Partial<Reg45EvidenceInput> = {}): Reg45EvidenceInput {
  return { id: `e45_${Math.random().toString(36).slice(2, 8)}`, quality_area: "care_quality", evidence_date: daysAgo(10), evidence_type: "observation", strength_of_evidence: "strong", child_voice_present: true, review_date: futureDate(30), ...ov };
}
function makeReg46(ov: Partial<Reg46ReviewInput> = {}): Reg46ReviewInput {
  return { id: `r46_${Math.random().toString(36).slice(2, 8)}`, review_date: daysAgo(30), areas_reviewed: ["bedrooms", "kitchen", "garden"], actions_raised: 3, actions_completed: 3, next_review_date: futureDate(60), ...ov };
}
function makeAnnexA(ov: Partial<AnnexAEvidenceInput> = {}): AnnexAEvidenceInput {
  return { id: `aa_${Math.random().toString(36).slice(2, 8)}`, standard_ref: "S1", evidence_present: true, evidence_current: true, last_updated: daysAgo(10), gap_identified: false, ...ov };
}

/**
 * baseInput → score 80 (outstanding)
 * 52 + 5(mod1) + 4(mod2) + 3(mod3) + 4(mod4) + 3(mod5) + 3(mod6) + 3(mod7) + 3(mod8) = 80
 */
function baseInput(ov: Partial<HomeReg4445EvidenceInput> = {}): HomeReg4445EvidenceInput {
  return {
    today: TODAY,
    reg44_packs: Array.from({ length: 6 }, (_, i) => makePack({ id: `p${i}`, month: `2026-0${i + 1}` })),
    reg44_visit_reports: Array.from({ length: 6 }, (_, i) => makeReport({ id: `r${i}` })),
    reg44_actions: Array.from({ length: 10 }, (_, i) => makeAction({ id: `a${i}` })),
    reg45_evidence: [
      makeReg45({ id: "e1", quality_area: "care_quality" }),
      makeReg45({ id: "e2", quality_area: "safety" }),
      makeReg45({ id: "e3", quality_area: "education" }),
      makeReg45({ id: "e4", quality_area: "health" }),
      makeReg45({ id: "e5", quality_area: "leadership" }),
      makeReg45({ id: "e6", quality_area: "outcomes" }),
    ],
    reg46_reviews: [makeReg46({ id: "r46a" }), makeReg46({ id: "r46b" })],
    annex_a_evidence: Array.from({ length: 10 }, (_, i) => makeAnnexA({ id: `aa${i}`, standard_ref: `S${i + 1}` })),
    total_children: 5,
    ...ov,
  };
}

describe("computeHomeReg4445Evidence", () => {
  describe("insufficient data", () => {
    it("returns insufficient_data when no data", () => {
      const r = computeHomeReg4445Evidence({ today: TODAY, reg44_packs: [], reg44_visit_reports: [], reg44_actions: [], reg45_evidence: [], reg46_reviews: [], annex_a_evidence: [], total_children: 0 });
      expect(r.reg4445_rating).toBe("insufficient_data");
      expect(r.reg4445_score).toBe(0);
    });
    it("returns empty narrative on insufficient data", () => {
      const r = computeHomeReg4445Evidence({ today: TODAY, reg44_packs: [], reg44_visit_reports: [], reg44_actions: [], reg45_evidence: [], reg46_reviews: [], annex_a_evidence: [], total_children: 0 });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
    });
    it("does NOT return insufficient_data when total_children > 0", () => {
      const r = computeHomeReg4445Evidence({ today: TODAY, reg44_packs: [], reg44_visit_reports: [], reg44_actions: [], reg45_evidence: [], reg46_reviews: [], annex_a_evidence: [], total_children: 3 });
      expect(r.reg4445_rating).not.toBe("insufficient_data");
    });
  });

  describe("base score and outstanding", () => {
    it("baseInput scores 80 — outstanding", () => {
      const r = computeHomeReg4445Evidence(baseInput());
      expect(r.reg4445_score).toBe(80);
      expect(r.reg4445_rating).toBe("outstanding");
    });
    it("headline reflects outstanding", () => {
      const r = computeHomeReg4445Evidence(baseInput());
      expect(r.headline).toContain("outstanding");
    });
  });

  describe("rating thresholds", () => {
    it("score >= 80 is outstanding", () => {
      const r = computeHomeReg4445Evidence(baseInput());
      expect(r.reg4445_score).toBeGreaterThanOrEqual(80);
      expect(r.reg4445_rating).toBe("outstanding");
    });

    it("score 65-79 is good", () => {
      // Remove packs (mod1: -3) and annex_a (mod6: -1) → 52 -3 +4 +3 +4 +3 -1 +3 +3 = 68
      const r = computeHomeReg4445Evidence(baseInput({ reg44_packs: [], annex_a_evidence: [] }));
      expect(r.reg4445_score).toBeGreaterThanOrEqual(65);
      expect(r.reg4445_score).toBeLessThan(80);
      expect(r.reg4445_rating).toBe("good");
    });

    it("score 45-64 is adequate", () => {
      // Remove packs, reports, reg45, annex_a. Keep actions + reg46.
      // 52 -3(mod1) -2(mod2) +3(mod3) -2(mod4) +3(mod5) -1(mod6) +0(mod7 no voice sources) +3(mod8) = 53
      const r = computeHomeReg4445Evidence(baseInput({
        reg44_packs: [], reg44_visit_reports: [], reg45_evidence: [], annex_a_evidence: [],
      }));
      expect(r.reg4445_score).toBeGreaterThanOrEqual(45);
      expect(r.reg4445_score).toBeLessThan(65);
      expect(r.reg4445_rating).toBe("adequate");
    });

    it("score < 45 is inadequate", () => {
      // All degraded data
      const r = computeHomeReg4445Evidence({
        today: TODAY,
        reg44_packs: Array.from({ length: 3 }, (_, i) => makePack({ id: `p${i}`, visit_completed: false, report_submitted: false, areas_covered: 1 })),
        reg44_visit_reports: Array.from({ length: 3 }, (_, i) => makeReport({ id: `r${i}`, child_voice_included: false, children_interviewed: 0, areas_inspected: [] })),
        reg44_actions: Array.from({ length: 10 }, (_, i) => makeAction({ id: `a${i}`, status: "overdue", priority: "high", completed_date: "" })),
        reg45_evidence: Array.from({ length: 3 }, (_, i) => makeReg45({ id: `e${i}`, strength_of_evidence: "weak", child_voice_present: false, review_date: daysAgo(30) })),
        reg46_reviews: [makeReg46({ id: "r46a", actions_raised: 10, actions_completed: 1, next_review_date: daysAgo(30) })],
        annex_a_evidence: Array.from({ length: 10 }, (_, i) => makeAnnexA({ id: `aa${i}`, evidence_present: false, evidence_current: false, gap_identified: true })),
        total_children: 5,
      });
      expect(r.reg4445_score).toBeLessThan(45);
      expect(r.reg4445_rating).toBe("inadequate");
    });
  });

  describe("Mod 1: Reg 44 visit frequency", () => {
    it("penalises no packs with children", () => {
      const r = computeHomeReg4445Evidence(baseInput({ reg44_packs: [] }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises incomplete visits", () => {
      const packs = Array.from({ length: 6 }, (_, i) => makePack({ id: `p${i}`, visit_completed: false }));
      const r = computeHomeReg4445Evidence(baseInput({ reg44_packs: packs }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises unsubmitted reports", () => {
      const packs = Array.from({ length: 6 }, (_, i) => makePack({ id: `p${i}`, report_submitted: false }));
      const r = computeHomeReg4445Evidence(baseInput({ reg44_packs: packs }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
  });

  describe("Mod 2: Reg 44 report quality", () => {
    it("penalises no child voice", () => {
      const reports = Array.from({ length: 6 }, (_, i) => makeReport({ id: `r${i}`, child_voice_included: false }));
      const r = computeHomeReg4445Evidence(baseInput({ reg44_visit_reports: reports }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises low areas inspected", () => {
      const reports = Array.from({ length: 6 }, (_, i) => makeReport({ id: `r${i}`, areas_inspected: [] }));
      const r = computeHomeReg4445Evidence(baseInput({ reg44_visit_reports: reports }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises no reports with children", () => {
      const r = computeHomeReg4445Evidence(baseInput({ reg44_visit_reports: [] }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
  });

  describe("Mod 3: Reg 44 action tracking", () => {
    it("penalises low completion rate", () => {
      const actions = Array.from({ length: 10 }, (_, i) => makeAction({ id: `a${i}`, status: "open" }));
      const r = computeHomeReg4445Evidence(baseInput({ reg44_actions: actions }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises overdue actions", () => {
      const actions = Array.from({ length: 10 }, (_, i) => makeAction({ id: `a${i}`, status: "overdue", due_date: daysAgo(10) }));
      const r = computeHomeReg4445Evidence(baseInput({ reg44_actions: actions }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises high-priority open actions", () => {
      const actions = Array.from({ length: 10 }, (_, i) => makeAction({ id: `a${i}`, status: "open", priority: "high" }));
      const r = computeHomeReg4445Evidence(baseInput({ reg44_actions: actions }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
  });

  describe("Mod 4: Reg 45 evidence", () => {
    it("penalises weak evidence", () => {
      const evs = Array.from({ length: 6 }, (_, i) => makeReg45({ id: `e${i}`, strength_of_evidence: "weak" }));
      const r = computeHomeReg4445Evidence(baseInput({ reg45_evidence: evs }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises overdue evidence reviews", () => {
      const evs = Array.from({ length: 6 }, (_, i) => makeReg45({ id: `e${i}`, review_date: daysAgo(30) }));
      const r = computeHomeReg4445Evidence(baseInput({ reg45_evidence: evs }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises no evidence with children", () => {
      const r = computeHomeReg4445Evidence(baseInput({ reg45_evidence: [] }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
  });

  describe("Mod 5: Reg 46 premises review", () => {
    it("penalises poor action completion", () => {
      const reviews = [makeReg46({ id: "r46a", actions_raised: 10, actions_completed: 1 })];
      const r = computeHomeReg4445Evidence(baseInput({ reg46_reviews: reviews }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises overdue reviews", () => {
      const reviews = [makeReg46({ id: "r46a", next_review_date: daysAgo(30) })];
      const r = computeHomeReg4445Evidence(baseInput({ reg46_reviews: reviews }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises no reviews with children", () => {
      const r = computeHomeReg4445Evidence(baseInput({ reg46_reviews: [] }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
  });

  describe("Mod 6: Annex A readiness", () => {
    it("penalises low evidence present rate", () => {
      const aa = Array.from({ length: 10 }, (_, i) => makeAnnexA({ id: `aa${i}`, evidence_present: false }));
      const r = computeHomeReg4445Evidence(baseInput({ annex_a_evidence: aa }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises gaps", () => {
      const aa = Array.from({ length: 10 }, (_, i) => makeAnnexA({ id: `aa${i}`, gap_identified: true }));
      const r = computeHomeReg4445Evidence(baseInput({ annex_a_evidence: aa }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
    it("penalises no annex a with children", () => {
      const r = computeHomeReg4445Evidence(baseInput({ annex_a_evidence: [] }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
  });

  describe("Mod 7: Child voice", () => {
    it("penalises no child voice in reports", () => {
      const reports = Array.from({ length: 6 }, (_, i) => makeReport({ id: `r${i}`, child_voice_included: false }));
      const evs = Array.from({ length: 6 }, (_, i) => makeReg45({ id: `e${i}`, child_voice_present: false }));
      const r = computeHomeReg4445Evidence(baseInput({ reg44_visit_reports: reports, reg45_evidence: evs }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
  });

  describe("Mod 8: Action resolution", () => {
    it("penalises poor action closure cross-regulation", () => {
      const actions = Array.from({ length: 10 }, (_, i) => makeAction({ id: `a${i}`, status: "open" }));
      const reviews = [makeReg46({ id: "r46a", actions_raised: 10, actions_completed: 1 })];
      const r = computeHomeReg4445Evidence(baseInput({ reg44_actions: actions, reg46_reviews: reviews }));
      expect(r.reg4445_score).toBeLessThan(80);
    });
  });

  describe("Summary computations", () => {
    it("computes visit completed rate", () => {
      const packs = [makePack({ id: "p1", visit_completed: true }), makePack({ id: "p2", visit_completed: false })];
      const r = computeHomeReg4445Evidence(baseInput({ reg44_packs: packs }));
      expect(r.reg44_visits.visit_completed_rate).toBe(50);
    });
    it("computes action completed rate", () => {
      const actions = [makeAction({ id: "a1", status: "completed" }), makeAction({ id: "a2", status: "open" }), makeAction({ id: "a3", status: "open" })];
      const r = computeHomeReg4445Evidence(baseInput({ reg44_actions: actions }));
      expect(r.reg44_actions.completed_rate).toBe(33);
    });
    it("computes strong evidence rate", () => {
      const evs = [makeReg45({ id: "e1", strength_of_evidence: "strong" }), makeReg45({ id: "e2", strength_of_evidence: "weak" })];
      const r = computeHomeReg4445Evidence(baseInput({ reg45_evidence: evs }));
      expect(r.reg45.strong_evidence_rate).toBe(50);
    });
    it("computes annex a gaps", () => {
      const aa = [makeAnnexA({ id: "aa1", gap_identified: true }), makeAnnexA({ id: "aa2", gap_identified: false }), makeAnnexA({ id: "aa3", gap_identified: true })];
      const r = computeHomeReg4445Evidence(baseInput({ annex_a_evidence: aa }));
      expect(r.annex_a.gaps_identified).toBe(2);
    });
    it("computes reg46 action completion rate", () => {
      const reviews = [makeReg46({ id: "r1", actions_raised: 10, actions_completed: 7 }), makeReg46({ id: "r2", actions_raised: 10, actions_completed: 3 })];
      const r = computeHomeReg4445Evidence(baseInput({ reg46_reviews: reviews }));
      expect(r.reg46.action_completion_rate).toBe(50);
    });
    it("computes unique quality areas", () => {
      const evs = [
        makeReg45({ id: "e1", quality_area: "care" }), makeReg45({ id: "e2", quality_area: "safety" }),
        makeReg45({ id: "e3", quality_area: "care" }),
      ];
      const r = computeHomeReg4445Evidence(baseInput({ reg45_evidence: evs }));
      expect(r.reg45.unique_quality_areas).toBe(2);
    });
    it("counts overdue actions", () => {
      const actions = [
        makeAction({ id: "a1", status: "overdue", due_date: daysAgo(10) }),
        makeAction({ id: "a2", status: "completed" }),
        makeAction({ id: "a3", status: "in_progress", due_date: daysAgo(5) }),
      ];
      const r = computeHomeReg4445Evidence(baseInput({ reg44_actions: actions }));
      expect(r.reg44_actions.overdue_count).toBe(2);
    });
  });

  describe("Narrative output", () => {
    it("generates visit compliance strength", () => {
      const r = computeHomeReg4445Evidence(baseInput());
      expect(r.strengths.some(s => s.includes("Reg 44 visit compliance"))).toBe(true);
    });
    it("generates concern for no packs", () => {
      const r = computeHomeReg4445Evidence(baseInput({ reg44_packs: [] }));
      expect(r.concerns.some(c => c.includes("Reg 44 visit packs"))).toBe(true);
    });
    it("generates concern for overdue actions", () => {
      const actions = Array.from({ length: 10 }, (_, i) => makeAction({ id: `a${i}`, status: "overdue", due_date: daysAgo(10) }));
      const r = computeHomeReg4445Evidence(baseInput({ reg44_actions: actions }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });
    it("generates outstanding insight", () => {
      const r = computeHomeReg4445Evidence(baseInput());
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });
    it("generates inadequate insight", () => {
      const r = computeHomeReg4445Evidence({
        today: TODAY,
        reg44_packs: Array.from({ length: 3 }, (_, i) => makePack({ id: `p${i}`, visit_completed: false, report_submitted: false, areas_covered: 1 })),
        reg44_visit_reports: Array.from({ length: 3 }, (_, i) => makeReport({ id: `r${i}`, child_voice_included: false, children_interviewed: 0, areas_inspected: [] })),
        reg44_actions: Array.from({ length: 10 }, (_, i) => makeAction({ id: `a${i}`, status: "overdue", priority: "high", completed_date: "" })),
        reg45_evidence: Array.from({ length: 3 }, (_, i) => makeReg45({ id: `e${i}`, strength_of_evidence: "weak", child_voice_present: false, review_date: daysAgo(30) })),
        reg46_reviews: [makeReg46({ id: "r46a", actions_raised: 10, actions_completed: 1, next_review_date: daysAgo(30) })],
        annex_a_evidence: Array.from({ length: 10 }, (_, i) => makeAnnexA({ id: `aa${i}`, evidence_present: false, evidence_current: false, gap_identified: true })),
        total_children: 5,
      });
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
    it("generates recommendations with ranks", () => {
      const r = computeHomeReg4445Evidence(baseInput({ reg44_packs: [], reg45_evidence: [] }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.recommendations.every(rec => rec.rank > 0)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("score clamped to 0-100", () => {
      const r = computeHomeReg4445Evidence({
        today: TODAY,
        reg44_packs: Array.from({ length: 3 }, (_, i) => makePack({ id: `p${i}`, visit_completed: false, report_submitted: false, areas_covered: 0 })),
        reg44_visit_reports: Array.from({ length: 3 }, (_, i) => makeReport({ id: `r${i}`, child_voice_included: false, children_interviewed: 0, areas_inspected: [] })),
        reg44_actions: Array.from({ length: 10 }, (_, i) => makeAction({ id: `a${i}`, status: "overdue", priority: "high" })),
        reg45_evidence: Array.from({ length: 6 }, (_, i) => makeReg45({ id: `e${i}`, strength_of_evidence: "weak", child_voice_present: false, review_date: daysAgo(30) })),
        reg46_reviews: [makeReg46({ id: "r46a", actions_raised: 10, actions_completed: 0, next_review_date: daysAgo(30) })],
        annex_a_evidence: Array.from({ length: 10 }, (_, i) => makeAnnexA({ id: `aa${i}`, evidence_present: false, evidence_current: false, gap_identified: true })),
        total_children: 5,
      });
      expect(r.reg4445_score).toBeGreaterThanOrEqual(0);
      expect(r.reg4445_score).toBeLessThanOrEqual(100);
    });
    it("handles single pack", () => {
      const r = computeHomeReg4445Evidence(baseInput({ reg44_packs: [makePack({ id: "p1" })] }));
      expect(r.reg44_visits.total_packs).toBe(1);
    });
    it("visit_completed_rate is unmeasured for a zero denominator", () => {
      const r = computeHomeReg4445Evidence({ today: TODAY, reg44_packs: [], reg44_visit_reports: [], reg44_actions: [], reg45_evidence: [], reg46_reviews: [], annex_a_evidence: [], total_children: 0 });
      expect(r.reg44_visits.visit_completed_rate).toBeNull();
    });
  });
});

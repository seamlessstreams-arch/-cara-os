import { describe, it, expect } from "vitest";
import {
  computeAgencyStaffManagement,
  type AgencyShiftInput,
  type AgencyInductionInput,
  type AgencyFeedbackInput,
  type AgencyStaffManagementInput,
} from "../home-agency-staff-management-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeShift(overrides: Partial<AgencyShiftInput> = {}): AgencyShiftInput {
  return {
    id: "shift_1",
    worker_name: "Agency Worker A",
    worker_ref: "AW001",
    booking_reason: "sickness_cover",
    vetting_status: "fully_vetted",
    dbs_enhanced: true,
    induction_completed: true,
    safeguarding_briefing: true,
    young_people_briefing: true,
    feedback_score: 8,
    has_concerns: false,
    ...overrides,
  };
}

function makeInduction(overrides: Partial<AgencyInductionInput> = {}): AgencyInductionInput {
  return {
    id: "ind_1",
    agency_staff_name: "Agency Worker A",
    dbs_verified: true,
    training_verified: true,
    references_verified: true,
    children_informed: true,
    behaviour_plans_briefed: true,
    induction_pack_signed: true,
    topics_covered_count: 12,
    topics_total_count: 12,
    repeat_booking_approved: true,
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<AgencyFeedbackInput> = {}): AgencyFeedbackInput {
  return {
    id: "fb_1",
    agency_staff_name: "Agency Worker A",
    follows_routines: true,
    follows_behaviour_plans: true,
    follows_sensory_protocols: true,
    recording_quality: "excellent",
    professionalism_rating: 9,
    relational_skills_rating: 9,
    overall_verdict: "excellent",
    ...overrides,
  };
}

function baseInput(overrides: Partial<AgencyStaffManagementInput> = {}): AgencyStaffManagementInput {
  // 10 shifts all fully_vetted, dbs_enhanced, inducted, safeguarding briefed, no concerns
  // 10 inductions with 12/12 topics
  // 10 feedback all excellent
  // Expected: 52 + 5(vetting) + 6(induction) + 5(feedback) + 5(safeguarding) + 4(dbs) + 5(concerns) = 82
  return {
    today: "2026-05-27",
    total_staff: 8,
    shifts: Array.from({ length: 10 }, (_, i) => makeShift({ id: `shift_${i}` })),
    inductions: Array.from({ length: 10 }, (_, i) => makeInduction({ id: `ind_${i}` })),
    feedback: Array.from({ length: 10 }, (_, i) => makeFeedback({ id: `fb_${i}` })),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAgencyStaffManagement", () => {
  // ── Insufficient data ────────────────────────────────────────────────
  describe("insufficient_data", () => {
    it("returns insufficient_data when shifts array is empty", () => {
      const r = computeAgencyStaffManagement(baseInput({ shifts: [] }));
      expect(r.agency_rating).toBe("insufficient_data");
      expect(r.agency_score).toBe(0);
      expect(r.headline).toBe("No agency shift data available for analysis");
    });

    it("returns empty arrays for strengths/concerns/recommendations/insights", () => {
      const r = computeAgencyStaffManagement(baseInput({ shifts: [] }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns zero for all metrics", () => {
      const r = computeAgencyStaffManagement(baseInput({ shifts: [] }));
      expect(r.total_agency_shifts).toBe(0);
      expect(r.vetting_compliance_rate).toBe(0);
      expect(r.induction_completion_rate).toBe(0);
      expect(r.positive_feedback_rate).toBe(0);
      expect(r.safeguarding_briefing_rate).toBe(0);
      expect(r.concerns_flagged).toBe(0);
    });
  });

  // ── Rating tiers ─────────────────────────────────────────────────────
  describe("outstanding rating", () => {
    it("returns outstanding with score 82 for base input", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.agency_score).toBe(82);
      expect(r.agency_rating).toBe("outstanding");
    });

    it("has correct headline for outstanding", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.headline).toBe("Agency staff management is exemplary — robust vetting, induction and oversight");
    });
  });

  describe("good rating", () => {
    it("achieves good range with moderate feedback", () => {
      // Drop feedback to 70-89% positive → +2 instead of +5: 82-5+2 = 79? No.
      // Base with some partially vetted: 8/10 = 80% → vetting +2 instead of +5: 82-3=79
      // Also drop DBS to 90% → +1 instead of +4: 79-3=76
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 8 ? "fully_vetted" : "partially_vetted",
        dbs_enhanced: i < 9,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 52+2(vetting 80%)+6(induction)+5(feedback)+5(safeguarding)+1(dbs 90%)+5(concerns) = 76
      expect(r.agency_score).toBe(76);
      expect(r.agency_rating).toBe("good");
    });

    it("has correct headline for good", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 8 ? "fully_vetted" : "partially_vetted",
        dbs_enhanced: i < 9,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.headline).toBe("Good agency staff management with effective safeguarding oversight");
    });
  });

  describe("adequate rating", () => {
    it("achieves adequate range with multiple weaknesses", () => {
      // Vetting 70% → -5, DBS 70% → -4, safeguarding 50% → -5
      // 52-5+6+5-5-4+5 = 54
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 7 ? "fully_vetted" : "pending",
        dbs_enhanced: i < 7,
        safeguarding_briefing: i < 5,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 52 -5(vetting 70%) +6(induction) +5(feedback) -5(safeguarding 50%) -4(dbs 70%) +5(concerns 0) = 54
      expect(r.agency_score).toBe(54);
      expect(r.agency_rating).toBe("adequate");
    });

    it("has correct headline for adequate", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 7 ? "fully_vetted" : "pending",
        dbs_enhanced: i < 7,
        safeguarding_briefing: i < 5,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.headline).toBe("Agency management is adequate but has areas for improvement");
    });
  });

  describe("inadequate rating", () => {
    it("achieves inadequate with severe deficiencies", () => {
      // All penalties: vetting 0% → -5, induction topics 0% → -5, feedback all unsuitable → -4,
      // safeguarding 0% → -5, dbs 0% → -4, concerns 100% → -5
      // 52 -5 -5 -4 -5 -4 -5 = 24
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: "pending",
        dbs_enhanced: false,
        induction_completed: false,
        safeguarding_briefing: false,
        has_concerns: true,
      }));
      const inductions = Array.from({ length: 5 }, (_, i) => makeInduction({
        id: `ind_${i}`,
        topics_covered_count: 3,
        topics_total_count: 12,
      }));
      const feedback = Array.from({ length: 10 }, (_, i) => makeFeedback({
        id: `fb_${i}`,
        overall_verdict: "unsuitable",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts, inductions, feedback }));
      // 52 -5(vetting 0%) -5(topics 25%) -4(feedback 0% positive) -5(safeguarding 0%) -4(dbs 0%) -5(concerns 100%) = 24
      expect(r.agency_score).toBe(24);
      expect(r.agency_rating).toBe("inadequate");
    });

    it("has correct headline for inadequate", () => {
      const shifts = [makeShift({ vetting_status: "pending", dbs_enhanced: false, safeguarding_briefing: false, has_concerns: true })];
      const inductions = [makeInduction({ topics_covered_count: 2, topics_total_count: 12 })];
      const feedback = [makeFeedback({ overall_verdict: "unsuitable" })];
      const r = computeAgencyStaffManagement(baseInput({ shifts, inductions, feedback }));
      expect(r.agency_rating).toBe("inadequate");
      expect(r.headline).toBe("Significant concerns with agency staff management practices");
    });
  });

  // ── Modifier 1: Vetting compliance ───────────────────────────────────
  describe("modifier: vetting compliance", () => {
    it("awards +5 when vetting >= 95%", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.vetting_compliance_rate).toBe(100);
      // Baseline score includes +5 for vetting
      expect(r.agency_score).toBe(82);
    });

    it("awards +2 when vetting 80-94%", () => {
      // 8/10 = 80%
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 8 ? "fully_vetted" : "partially_vetted",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.vetting_compliance_rate).toBe(80);
      // 82 - 5 + 2 = 79 (replaced vetting bonus)
      // But also DBS: 100% → +4 still. So 52+2+6+5+5+4+5 = 79
      expect(r.agency_score).toBe(79);
    });

    it("penalises -5 when vetting < 80%", () => {
      // 7/10 = 70%
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 7 ? "fully_vetted" : "expired",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.vetting_compliance_rate).toBe(70);
      // 52 -5 +6+5+5+4+5 = 72
      expect(r.agency_score).toBe(72);
    });
  });

  // ── Modifier 2: Induction topic coverage ─────────────────────────────
  describe("modifier: induction topic coverage", () => {
    it("awards +6 when topic coverage >= 90%", () => {
      const r = computeAgencyStaffManagement(baseInput());
      // 12/12 = 100% → +6
      expect(r.agency_score).toBe(82);
    });

    it("awards +2 when topic coverage 70-89%", () => {
      const inductions = Array.from({ length: 10 }, (_, i) => makeInduction({
        id: `ind_${i}`,
        topics_covered_count: 9,
        topics_total_count: 12,
      }));
      const r = computeAgencyStaffManagement(baseInput({ inductions }));
      // 90/120 = 75% → +2. 82 - 6 + 2 = 78
      expect(r.agency_score).toBe(78);
    });

    it("penalises -5 when topic coverage < 50%", () => {
      const inductions = Array.from({ length: 10 }, (_, i) => makeInduction({
        id: `ind_${i}`,
        topics_covered_count: 4,
        topics_total_count: 12,
      }));
      const r = computeAgencyStaffManagement(baseInput({ inductions }));
      // 40/120 = 33% → -5. 82 - 6 - 5 = 71
      expect(r.agency_score).toBe(71);
    });

    it("penalises -1 when no inductions exist", () => {
      const r = computeAgencyStaffManagement(baseInput({ inductions: [] }));
      // 82 - 6 - 1 = 75
      expect(r.agency_score).toBe(75);
    });

    it("awards 0 when topic coverage is 50-69%", () => {
      const inductions = Array.from({ length: 10 }, (_, i) => makeInduction({
        id: `ind_${i}`,
        topics_covered_count: 7,
        topics_total_count: 12,
      }));
      const r = computeAgencyStaffManagement(baseInput({ inductions }));
      // 70/120 = 58% → no bonus (between 50-69%), 0 modifier. 82 - 6 = 76
      expect(r.agency_score).toBe(76);
    });
  });

  // ── Modifier 3: Feedback quality ─────────────────────────────────────
  describe("modifier: feedback quality", () => {
    it("awards +5 when positive feedback >= 90%", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.positive_feedback_rate).toBe(100);
      expect(r.agency_score).toBe(82);
    });

    it("awards +2 when positive feedback 70-89%", () => {
      // 8/10 = 80%
      const feedback = Array.from({ length: 10 }, (_, i) => makeFeedback({
        id: `fb_${i}`,
        overall_verdict: i < 8 ? "excellent" : "adequate",
      }));
      const r = computeAgencyStaffManagement(baseInput({ feedback }));
      // 82 - 5 + 2 = 79
      expect(r.agency_score).toBe(79);
    });

    it("penalises -4 when positive feedback < 50%", () => {
      const feedback = Array.from({ length: 10 }, (_, i) => makeFeedback({
        id: `fb_${i}`,
        overall_verdict: i < 4 ? "good" : "poor",
      }));
      const r = computeAgencyStaffManagement(baseInput({ feedback }));
      // 82 - 5 - 4 = 73
      expect(r.agency_score).toBe(73);
    });

    it("gives 0 modifier when no feedback exists", () => {
      const r = computeAgencyStaffManagement(baseInput({ feedback: [] }));
      // 82 - 5 = 77
      expect(r.agency_score).toBe(77);
    });
  });

  // ── Modifier 4: Safeguarding briefing ────────────────────────────────
  describe("modifier: safeguarding briefing rate", () => {
    it("awards +5 when safeguarding >= 95%", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.safeguarding_briefing_rate).toBe(100);
      expect(r.agency_score).toBe(82);
    });

    it("awards +2 when safeguarding 80-94%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        safeguarding_briefing: i < 9,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 9/10 = 90% → +2. 82 - 5 + 2 = 79
      expect(r.agency_score).toBe(79);
    });

    it("penalises -5 when safeguarding < 60%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        safeguarding_briefing: i < 5,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 5/10 = 50% → -5. 82 - 5 - 5 = 72
      expect(r.agency_score).toBe(72);
    });

    it("gives 0 modifier when safeguarding 60-79%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        safeguarding_briefing: i < 7,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 7/10 = 70% → 0. 82 - 5 = 77
      expect(r.agency_score).toBe(77);
    });
  });

  // ── Modifier 5: DBS compliance ───────────────────────────────────────
  describe("modifier: DBS enhanced compliance", () => {
    it("awards +4 when DBS = 100%", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.agency_score).toBe(82);
    });

    it("awards +1 when DBS 90-99%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        dbs_enhanced: i < 9,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 82 - 4 + 1 = 79
      expect(r.agency_score).toBe(79);
    });

    it("penalises -4 when DBS < 80%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        dbs_enhanced: i < 7,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 7/10 = 70% → -4. 82 - 4 - 4 = 74
      expect(r.agency_score).toBe(74);
    });

    it("gives 0 modifier when DBS 80-89%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        dbs_enhanced: i < 8,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 80% → 0 modifier. 82 - 4 = 78
      expect(r.agency_score).toBe(78);
    });
  });

  // ── Modifier 6: Concern management ───────────────────────────────────
  describe("modifier: concern management", () => {
    it("awards +5 when 0 concerns", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.concerns_flagged).toBe(0);
      expect(r.agency_score).toBe(82);
    });

    it("awards +2 when concern rate <= 10%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        has_concerns: i === 0,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 1/10 = 10% → +2. 82 - 5 + 2 = 79
      expect(r.agency_score).toBe(79);
    });

    it("penalises -5 when concern rate > 20%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        has_concerns: i < 3,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 3/10 = 30% → -5. 82 - 5 - 5 = 72
      expect(r.agency_score).toBe(72);
    });

    it("gives 0 modifier when concern rate 11-20%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        has_concerns: i < 2,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 2/10 = 20% → 0. 82 - 5 = 77
      expect(r.agency_score).toBe(77);
    });
  });

  // ── Metrics ──────────────────────────────────────────────────────────
  describe("metrics", () => {
    it("calculates total_agency_shifts correctly", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.total_agency_shifts).toBe(10);
    });

    it("calculates vetting_compliance_rate", () => {
      const shifts = [
        makeShift({ id: "a", vetting_status: "fully_vetted" }),
        makeShift({ id: "b", vetting_status: "pending" }),
        makeShift({ id: "c", vetting_status: "fully_vetted" }),
      ];
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.vetting_compliance_rate).toBe(67);
    });

    it("calculates induction_completion_rate", () => {
      const shifts = [
        makeShift({ id: "a", induction_completed: true }),
        makeShift({ id: "b", induction_completed: false }),
      ];
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.induction_completion_rate).toBe(50);
    });

    it("calculates positive_feedback_rate", () => {
      const feedback = [
        makeFeedback({ id: "a", overall_verdict: "excellent" }),
        makeFeedback({ id: "b", overall_verdict: "good" }),
        makeFeedback({ id: "c", overall_verdict: "adequate" }),
        makeFeedback({ id: "d", overall_verdict: "unsuitable" }),
      ];
      const r = computeAgencyStaffManagement(baseInput({ feedback }));
      expect(r.positive_feedback_rate).toBe(50);
    });

    it("calculates safeguarding_briefing_rate", () => {
      const shifts = [
        makeShift({ id: "a", safeguarding_briefing: true }),
        makeShift({ id: "b", safeguarding_briefing: false }),
      ];
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.safeguarding_briefing_rate).toBe(50);
    });

    it("calculates concerns_flagged", () => {
      const shifts = [
        makeShift({ id: "a", has_concerns: true }),
        makeShift({ id: "b", has_concerns: true }),
        makeShift({ id: "c", has_concerns: false }),
      ];
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.concerns_flagged).toBe(2);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes vetting strength when >= 95%", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.strengths.some(s => s.includes("vetting"))).toBe(true);
    });

    it("includes safeguarding strength when >= 95%", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.strengths.some(s => s.includes("safeguarding"))).toBe(true);
    });

    it("includes DBS strength when 100%", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.strengths.some(s => s.includes("DBS"))).toBe(true);
    });

    it("includes no concerns strength when 0 concerns", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.strengths.some(s => s.includes("concerns"))).toBe(true);
    });

    it("has no strengths when all metrics are poor", () => {
      const shifts = [makeShift({
        vetting_status: "pending",
        dbs_enhanced: false,
        safeguarding_briefing: false,
        has_concerns: true,
      })];
      const feedback = [makeFeedback({ overall_verdict: "unsuitable" })];
      const inductions = [makeInduction({ topics_covered_count: 2, topics_total_count: 12 })];
      const r = computeAgencyStaffManagement(baseInput({ shifts, feedback, inductions }));
      expect(r.strengths.length).toBe(0);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("includes vetting concern when < 80%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 5 ? "fully_vetted" : "expired",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.concerns.some(c => c.includes("vetting") || c.includes("vetted"))).toBe(true);
    });

    it("includes safeguarding concern when < 60%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        safeguarding_briefing: i < 5,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.concerns.some(c => c.includes("afeguarding"))).toBe(true);
    });

    it("includes no induction concern when 0 inductions with shifts", () => {
      const r = computeAgencyStaffManagement(baseInput({ inductions: [] }));
      expect(r.concerns.some(c => c.includes("induction"))).toBe(true);
    });

    it("has no concerns when all metrics are excellent", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.concerns.length).toBe(0);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────
  describe("recommendations", () => {
    it("generates recommendations for poor vetting", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 5 ? "fully_vetted" : "pending",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("vetting"))).toBe(true);
    });

    it("includes regulatory_ref on all recommendations", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: "pending",
        dbs_enhanced: false,
        safeguarding_briefing: false,
        has_concerns: true,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts, inductions: [] }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
        expect(rec.regulatory_ref === "CHR 2015 Reg 32" || rec.regulatory_ref === "SCCIF Leadership").toBe(true);
      }
    });

    it("caps recommendations at 5", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: "pending",
        dbs_enhanced: false,
        safeguarding_briefing: false,
        has_concerns: true,
      }));
      const inductions = Array.from({ length: 5 }, (_, i) => makeInduction({
        id: `ind_${i}`,
        topics_covered_count: 3,
        topics_total_count: 12,
      }));
      const feedback = Array.from({ length: 10 }, (_, i) => makeFeedback({
        id: `fb_${i}`,
        overall_verdict: "unsuitable",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts, inductions, feedback }));
      expect(r.recommendations.length).toBeLessThan(6);
    });

    it("ranks recommendations sequentially", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: "pending",
        safeguarding_briefing: false,
        dbs_enhanced: false,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("assigns urgency values", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: "pending",
        safeguarding_briefing: false,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      for (const rec of r.recommendations) {
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("returns empty recommendations for outstanding input", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────
  describe("insights", () => {
    it("generates positive insight when all safeguarding checks pass", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.insights.some(ins => ins.severity === "positive")).toBe(true);
    });

    it("generates critical insight when vetting or DBS < 80%", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 5 ? "fully_vetted" : "pending",
        dbs_enhanced: i < 5,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.insights.some(ins => ins.severity === "critical")).toBe(true);
    });

    it("generates warning insight when no feedback exists", () => {
      const r = computeAgencyStaffManagement(baseInput({ feedback: [] }));
      expect(r.insights.some(ins => ins.severity === "warning" && ins.text.includes("feedback"))).toBe(true);
    });

    it("caps insights at 3", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: "pending",
        dbs_enhanced: false,
        safeguarding_briefing: false,
        has_concerns: true,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts, inductions: [], feedback: [] }));
      expect(r.insights.length).toBeLessThan(4);
    });
  });

  // ── Score clamping ───────────────────────────────────────────────────
  describe("score clamping", () => {
    it("clamps score to minimum 0", () => {
      // Even with all penalties the engine shouldn't go below 0
      const shifts = Array.from({ length: 100 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: "expired",
        dbs_enhanced: false,
        safeguarding_briefing: false,
        has_concerns: true,
        induction_completed: false,
      }));
      const inductions = Array.from({ length: 10 }, (_, i) => makeInduction({
        id: `ind_${i}`,
        topics_covered_count: 0,
        topics_total_count: 12,
      }));
      const feedback = Array.from({ length: 10 }, (_, i) => makeFeedback({
        id: `fb_${i}`,
        overall_verdict: "unsuitable",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts, inductions, feedback }));
      expect(r.agency_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to maximum 100", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r.agency_score).toBeLessThan(101);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles single shift", () => {
      const r = computeAgencyStaffManagement(baseInput({
        shifts: [makeShift()],
        inductions: [makeInduction()],
        feedback: [makeFeedback()],
      }));
      expect(r.total_agency_shifts).toBe(1);
      expect(r.agency_rating).toBe("outstanding");
    });

    it("handles shifts with no inductions or feedback", () => {
      const r = computeAgencyStaffManagement(baseInput({
        inductions: [],
        feedback: [],
      }));
      // 52 +5(vetting) -1(no inductions) +0(no feedback) +5(safeguarding) +4(dbs) +5(concerns) = 70
      expect(r.agency_score).toBe(70);
      expect(r.agency_rating).toBe("good");
    });

    it("return shape has all required fields", () => {
      const r = computeAgencyStaffManagement(baseInput());
      expect(r).toHaveProperty("agency_rating");
      expect(r).toHaveProperty("agency_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_agency_shifts");
      expect(r).toHaveProperty("vetting_compliance_rate");
      expect(r).toHaveProperty("induction_completion_rate");
      expect(r).toHaveProperty("positive_feedback_rate");
      expect(r).toHaveProperty("safeguarding_briefing_rate");
      expect(r).toHaveProperty("concerns_flagged");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("handles boundary: exactly 80% vetting → +2", () => {
      // 4/5 = 80%
      const shifts = Array.from({ length: 5 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 4 ? "fully_vetted" : "pending",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.vetting_compliance_rate).toBe(80);
    });

    it("handles boundary: exactly 95% vetting → +5", () => {
      // 19/20 = 95%
      const shifts = Array.from({ length: 20 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 19 ? "fully_vetted" : "pending",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      expect(r.vetting_compliance_rate).toBe(95);
    });
  });

  // ── Combined modifier interactions ───────────────────────────────────
  describe("combined modifier interactions", () => {
    it("multiple moderate modifiers produce good rating", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 9 ? "fully_vetted" : "partially_vetted",
        safeguarding_briefing: i < 9,
        dbs_enhanced: i < 9,
      }));
      const inductions = Array.from({ length: 10 }, (_, i) => makeInduction({
        id: `ind_${i}`,
        topics_covered_count: 9,
        topics_total_count: 12,
      }));
      const feedback = Array.from({ length: 10 }, (_, i) => makeFeedback({
        id: `fb_${i}`,
        overall_verdict: i < 8 ? "good" : "adequate",
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts, inductions, feedback }));
      // 52+2(vetting 90%)+2(induction 75%)+2(feedback 80%)+2(safeguarding 90%)+1(dbs 90%)+5(0 concerns)=66
      expect(r.agency_score).toBe(66);
      expect(r.agency_rating).toBe("good");
    });

    it("mixed positive and negative modifiers", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => makeShift({
        id: `s_${i}`,
        vetting_status: i < 5 ? "fully_vetted" : "expired",
        safeguarding_briefing: true,
        has_concerns: i < 3,
      }));
      const r = computeAgencyStaffManagement(baseInput({ shifts }));
      // 52 -5(vetting 50%) +6(induction) +5(feedback) +5(safeguarding) +4(dbs) -5(concerns 30%) = 62
      expect(r.agency_score).toBe(62);
      expect(r.agency_rating).toBe("adequate");
    });
  });
});

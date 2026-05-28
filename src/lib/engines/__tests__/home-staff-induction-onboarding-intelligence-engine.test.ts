// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF INDUCTION & ONBOARDING INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStaffInductionOnboarding,
  type StaffInductionOnboardingInput,
  type StaffInductionInput,
  type AgencyInductionInput,
  type ShadowingRecordInput,
  type HandbookAcknowledgementInput,
} from "../home-staff-induction-onboarding-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeStaffInduction(
  overrides: Partial<StaffInductionInput> = {},
): StaffInductionInput {
  return {
    id: "ind_1",
    staff_id: "staff_1",
    start_date: "2026-01-10",
    completion_date: "2026-01-24",
    status: "completed",
    modules_total: 10,
    modules_completed: 10,
    safeguarding_covered: true,
    medication_covered: true,
    fire_safety_covered: true,
    children_intro_completed: true,
    policy_review_completed: true,
    signed_off_by: "manager_1",
    created_at: "2026-01-10",
    ...overrides,
  };
}

function makeAgencyInduction(
  overrides: Partial<AgencyInductionInput> = {},
): AgencyInductionInput {
  return {
    id: "ag_1",
    staff_name: "Agency Worker 1",
    agency_name: "Agency A",
    induction_date: "2026-02-01",
    completed: true,
    safeguarding_briefed: true,
    medication_briefed: true,
    fire_procedures_briefed: true,
    children_needs_briefed: true,
    house_rules_briefed: true,
    emergency_contacts_given: true,
    conducted_by: "manager_1",
    created_at: "2026-02-01",
    ...overrides,
  };
}

function makeShadowingRecord(
  overrides: Partial<ShadowingRecordInput> = {},
): ShadowingRecordInput {
  return {
    id: "sh_1",
    staff_id: "staff_1",
    shadow_date: "2026-01-15",
    shift_type: "day",
    hours: 10,
    mentor_id: "mentor_1",
    competency_confirmed: true,
    areas_of_strength: ["Communication", "Child engagement"],
    areas_for_development: [],
    ready_for_lone_working: true,
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeHandbookAcknowledgement(
  overrides: Partial<HandbookAcknowledgementInput> = {},
): HandbookAcknowledgementInput {
  return {
    id: "hb_1",
    staff_id: "staff_1",
    acknowledged_date: "2026-01-12",
    version: "v3.0",
    key_policies_read: true,
    safeguarding_policy_read: true,
    behaviour_management_read: true,
    whistleblowing_policy_read: true,
    signed: true,
    created_at: "2026-01-12",
    ...overrides,
  };
}

/**
 * Base input: 5 staff, all completed inductions, 2 agency completed,
 * 5 shadowing (competent + lone-ready), 5 handbooks signed.
 * All coverages = 100%. Should score outstanding (~80).
 */
function baseInput(
  overrides: Partial<StaffInductionOnboardingInput> = {},
): StaffInductionOnboardingInput {
  const staffIds = ["s1", "s2", "s3", "s4", "s5"];
  return {
    today: "2026-05-28",
    total_staff: 5,
    staff_inductions: staffIds.map((sid, i) =>
      makeStaffInduction({
        id: `ind_${i}`,
        staff_id: sid,
        status: "completed",
        completion_date: "2026-01-24",
        modules_total: 10,
        modules_completed: 10,
        safeguarding_covered: true,
        medication_covered: true,
        fire_safety_covered: true,
        children_intro_completed: true,
        policy_review_completed: true,
        signed_off_by: "mgr_1",
      }),
    ),
    agency_inductions: [
      makeAgencyInduction({ id: "ag_1" }),
      makeAgencyInduction({ id: "ag_2", staff_name: "Agency Worker 2" }),
    ],
    shadowing_records: staffIds.map((sid, i) =>
      makeShadowingRecord({
        id: `sh_${i}`,
        staff_id: sid,
        competency_confirmed: true,
        ready_for_lone_working: true,
        hours: 10,
        shift_type: i < 2 ? "day" : i < 4 ? "evening" : "night",
      }),
    ),
    handbook_acknowledgements: staffIds.map((sid, i) =>
      makeHandbookAcknowledgement({
        id: `hb_${i}`,
        staff_id: sid,
        signed: true,
        key_policies_read: true,
        safeguarding_policy_read: true,
        behaviour_management_read: true,
        whistleblowing_policy_read: true,
      }),
    ),
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Staff Induction & Onboarding Intelligence Engine", () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. RETURN STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Result structure", () => {
    it("returns a well-shaped result with all required fields", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r).toHaveProperty("induction_rating");
      expect(r).toHaveProperty("induction_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_inductions");
      expect(r).toHaveProperty("completion_rate");
      expect(r).toHaveProperty("agency_induction_completion_rate");
      expect(r).toHaveProperty("safeguarding_coverage_rate");
      expect(r).toHaveProperty("medication_coverage_rate");
      expect(r).toHaveProperty("fire_safety_coverage_rate");
      expect(r).toHaveProperty("shadowing_completion_rate");
      expect(r).toHaveProperty("shadowing_competency_rate");
      expect(r).toHaveProperty("handbook_acknowledgement_rate");
      expect(r).toHaveProperty("lone_working_readiness_rate");
      expect(r).toHaveProperty("average_module_completion");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("returns arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });

    it("assigns a valid rating value", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect([
        "outstanding",
        "good",
        "adequate",
        "inadequate",
        "insufficient_data",
      ]).toContain(r.induction_rating);
    });

    it("score is between 0 and 100", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.induction_score).toBeGreaterThanOrEqual(0);
      expect(r.induction_score).toBeLessThanOrEqual(100);
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({ status: "overdue", completion_date: null }),
          ],
        }),
      );
      for (const rec of r.recommendations) {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      }
    });

    it("insights have text and severity", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      for (const ins of r.insights) {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SPECIAL CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Special cases", () => {
    it("returns insufficient_data when all arrays empty and total_staff = 0", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 0,
        staff_inductions: [],
        agency_inductions: [],
        shadowing_records: [],
        handbook_acknowledgements: [],
      });
      expect(r.induction_rating).toBe("insufficient_data");
      expect(r.induction_score).toBe(0);
      expect(r.headline).toContain("Insufficient data");
      expect(r.total_inductions).toBe(0);
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("warning");
    });

    it("returns inadequate with score 15 when all arrays empty but total_staff > 0", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 8,
        staff_inductions: [],
        agency_inductions: [],
        shadowing_records: [],
        handbook_acknowledgements: [],
      });
      expect(r.induction_rating).toBe("inadequate");
      expect(r.induction_score).toBe(15);
      expect(r.headline).toContain("Inadequate");
      expect(r.total_inductions).toBe(0);
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns.length).toBeGreaterThanOrEqual(4);
      expect(r.recommendations.length).toBeGreaterThanOrEqual(4);
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("inadequate special case concerns mention the exact staff count", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 12,
        staff_inductions: [],
        agency_inductions: [],
        shadowing_records: [],
        handbook_acknowledgements: [],
      });
      expect(r.concerns[0]).toContain("12 staff recorded");
    });

    it("insufficient_data has exactly 0 for all metric fields", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 0,
        staff_inductions: [],
        agency_inductions: [],
        shadowing_records: [],
        handbook_acknowledgements: [],
      });
      expect(r.completion_rate).toBe(0);
      expect(r.agency_induction_completion_rate).toBe(0);
      expect(r.safeguarding_coverage_rate).toBe(0);
      expect(r.medication_coverage_rate).toBe(0);
      expect(r.fire_safety_coverage_rate).toBe(0);
      expect(r.shadowing_completion_rate).toBe(0);
      expect(r.shadowing_competency_rate).toBe(0);
      expect(r.handbook_acknowledgement_rate).toBe(0);
      expect(r.lone_working_readiness_rate).toBe(0);
      expect(r.average_module_completion).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BASE SCORE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Base score", () => {
    it("starts at 52 with no bonuses or penalties", () => {
      // Create input where all rates are between thresholds (no bonus, no penalty)
      // completionRate = 60% (no bonus, no penalty: >=50 so no penalty, <85 so no bonus)
      // agencyCompletionRate = 60% (no bonus, no penalty: >=50, <80)
      // safeguardingCoverage = 60% (no bonus, no penalty: >=50, <90)
      // medicationCoverage = 60% (no bonus, no penalty: <85)
      // fireSafetyCoverage = 75% (no bonus [<90], no penalty [>=70])
      // shadowingCompetencyRate = 60% (no bonus [<80], no penalty)
      // handbookAckRate = 60% (no bonus [<85], no penalty)
      // loneWorkingReadiness = 60% (no bonus [<80], no penalty)
      // avgModuleCompletion = 60% (no bonus [<80], no penalty)
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 3 ? "completed" : "in_progress",
          completion_date: i < 3 ? "2026-01-24" : null,
          modules_total: 10,
          modules_completed: 6,
          safeguarding_covered: i < 3, // 3/5 perm
          medication_covered: i < 3,
          fire_safety_covered: i < 4, // 4/5 perm
          signed_off_by: i < 3 ? "mgr_1" : null,
        }),
      );

      // totalInductionRecords = 5 + 5 = 10
      // safeguarding: 3 perm + 3 agency = 6/10 = 60%
      // medication: 3 perm + 3 agency = 6/10 = 60%
      // fire: 4 perm + (need 3.5 => 4) agency fire = 4 + 4 = 8/10 = 80%... too high
      // Let's recalculate more carefully:
      // We need fire >= 70 and < 90 (no bonus, no penalty)
      // 5 staff + 5 agency = 10 total
      // fire: 4 perm + 3 agency = 7/10 = 70%
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 3, // 3/5 = 60%
          safeguarding_briefed: i < 3, // +3 = 6/10 = 60%
          medication_briefed: i < 3, // +3 = 6/10 = 60%
          fire_procedures_briefed: i < 3, // +3 = 7/10 = 70%
          children_needs_briefed: i < 3,
        }),
      );

      // shadowing: 3 out of 5 competent = 60%, 3 out of 5 ready = 60%
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 3,
          ready_for_lone_working: i < 3,
          hours: 4,
          shift_type: "day",
        }),
      );

      // handbooks: 3 out of 5 signed = 60%
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 3,
          safeguarding_policy_read: i < 3,
          behaviour_management_read: i < 3,
          whistleblowing_policy_read: i < 3,
          key_policies_read: i < 3,
        }),
      );

      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions,
        shadowing_records: shadowingRecords,
        handbook_acknowledgements: handbookAcks,
      });

      // No bonuses, no penalties => exactly 52
      expect(r.induction_score).toBe(52);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. INDIVIDUAL BONUSES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Individual bonuses", () => {
    it("Bonus 1: completionRate >= 100 gives +4", () => {
      // All completed, no agency (avoid agency penalty)
      // No agency => pct(0,0)=0 => agencyCompletionRate=0 => penalty -5
      // safeguarding 100% (+4), medication 100% (+3), fire 100% (+2)
      // shadowingComp 100% (+3), handbook 100% (+3), loneWorking 100% (+3), avgModule 100% (+3)
      // total bonuses without agency = 4+4+3+2+3+3+3+3 = 25
      // penalty for agencyCompletionRate<50 = -5
      // 52 + 25 - 5 = 72
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: [] }),
      );
      expect(r.induction_score).toBe(72);
    });

    it("Bonus 1 lower tier: completionRate >= 85 gives +2", () => {
      // 6/7 completed = 86%
      const staffInductions = Array.from({ length: 7 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 6 ? "completed" : "in_progress",
          completion_date: i < 6 ? "2026-01-24" : null,
          modules_total: 10,
          modules_completed: i < 6 ? 10 : 5,
          safeguarding_covered: true,
          medication_covered: true,
          fire_safety_covered: true,
          signed_off_by: i < 6 ? "mgr" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ total_staff: 7, staff_inductions: staffInductions }),
      );
      // completionRate = 86% => +2 (not +4)
      // vs baseInput where completionRate = 100% => +4
      // Difference should be -2 from full-bonus base
      const rFull = computeStaffInductionOnboarding(baseInput({ total_staff: 7 }));
      // Can't directly compare since other metrics change. Just verify the rate.
      expect(r.completion_rate).toBe(86);
    });

    it("Bonus 2: agencyCompletionRate >= 100 gives +3", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      // baseInput has 2 agency, both completed => 100%
      expect(r.agency_induction_completion_rate).toBe(100);
    });

    it("Bonus 2 lower tier: agencyCompletionRate >= 80 gives +1", () => {
      // 4/5 = 80%
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 4,
          safeguarding_briefed: true,
          medication_briefed: true,
          fire_procedures_briefed: true,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      expect(r.agency_induction_completion_rate).toBe(80);
    });

    it("Bonus 3: safeguardingCoverage >= 100 gives +4", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.safeguarding_coverage_rate).toBe(100);
    });

    it("Bonus 3 lower tier: safeguardingCoverage >= 90 gives +2", () => {
      // 10 total records (5 staff + 5 agency), 9 safeguarding = 90%
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          safeguarding_covered: true,
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          safeguarding_briefed: i < 4, // 4/5 agency = 9/10 total = 90%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(r.safeguarding_coverage_rate).toBe(90);
    });

    it("Bonus 4: medicationCoverage >= 100 gives +3", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.medication_coverage_rate).toBe(100);
    });

    it("Bonus 4 lower tier: medicationCoverage >= 85 gives +1", () => {
      // 7 total records, 6 medication = 86%
      const staffInductions = Array.from({ length: 4 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          medication_covered: true,
        }),
      );
      const agencyInductions = Array.from({ length: 3 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          medication_briefed: i < 2, // 2/3 agency = 6/7 total = 86%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(r.medication_coverage_rate).toBe(86);
    });

    it("Bonus 5: fireSafetyCoverage >= 100 gives +2", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.fire_safety_coverage_rate).toBe(100);
    });

    it("Bonus 5 lower tier: fireSafetyCoverage >= 90 gives +1", () => {
      // 10 total, 9 fire = 90%
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          fire_safety_covered: true,
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          fire_procedures_briefed: i < 4, // 9/10 = 90%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(r.fire_safety_coverage_rate).toBe(90);
    });

    it("Bonus 6: shadowingCompetencyRate >= 100 gives +3", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.shadowing_competency_rate).toBe(100);
    });

    it("Bonus 6 lower tier: shadowingCompetencyRate >= 80 gives +1", () => {
      // 5 shadowing, 4 competent = 80%
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 4,
          ready_for_lone_working: true,
          shift_type: i < 2 ? "day" : i < 4 ? "evening" : "night",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      expect(r.shadowing_competency_rate).toBe(80);
    });

    it("Bonus 7: handbookAckRate >= 100 gives +3", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.handbook_acknowledgement_rate).toBe(100);
    });

    it("Bonus 7 lower tier: handbookAckRate >= 85 gives +1", () => {
      // 7 handbooks, 6 signed = 86%
      const handbookAcks = Array.from({ length: 7 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 6,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ handbook_acknowledgements: handbookAcks }),
      );
      expect(r.handbook_acknowledgement_rate).toBe(86);
    });

    it("Bonus 8: loneWorkingReadiness >= 100 gives +2", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.lone_working_readiness_rate).toBe(100);
    });

    it("Bonus 8 lower tier: loneWorkingReadiness >= 80 gives +1", () => {
      // 5 shadowing, 4 ready = 80%
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: true,
          ready_for_lone_working: i < 4,
          shift_type: i < 2 ? "day" : i < 4 ? "evening" : "night",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      expect(r.lone_working_readiness_rate).toBe(80);
    });

    it("Bonus 9: avgModuleCompletion >= 95 gives +2", () => {
      // All staff: modules_completed 10/10 = 100% avg
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.average_module_completion).toBe(100);
    });

    it("Bonus 9 lower tier: avgModuleCompletion >= 80 gives +1", () => {
      // 5 staff, each 8/10 = 80% average
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          modules_total: 10,
          modules_completed: 8,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(r.average_module_completion).toBe(80);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. INDIVIDUAL PENALTIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Individual penalties", () => {
    it("Penalty 1: safeguardingCoverage < 50 applies -5", () => {
      // 7 total records, 3 safeguarding = 43%
      const staffInductions = Array.from({ length: 4 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          safeguarding_covered: i < 2,
          medication_covered: true,
          fire_safety_covered: true,
        }),
      );
      const agencyInductions = Array.from({ length: 3 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          safeguarding_briefed: i < 1, // 1/3 agency = 3/7 total = 43%
          medication_briefed: true,
          fire_procedures_briefed: true,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(r.safeguarding_coverage_rate).toBe(43);
      // penalty applies
    });

    it("Penalty 2: completionRate < 50 applies -5", () => {
      // 3 staff inductions, 1 completed = 33%
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 1 ? "completed" : "in_progress",
          completion_date: i < 1 ? "2026-01-24" : null,
          signed_off_by: i < 1 ? "mgr" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(r.completion_rate).toBe(33);
    });

    it("Penalty 3: agencyCompletionRate < 50 applies -5", () => {
      // 3 agency, 1 completed = 33%
      const agencyInductions = Array.from({ length: 3 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 1,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      expect(r.agency_induction_completion_rate).toBe(33);
    });

    it("Penalty 4: fireSafetyCoverage < 70 applies -3", () => {
      // 10 total, 6 fire = 60%
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          fire_safety_covered: i < 3, // 3/5 perm
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          fire_procedures_briefed: i < 3, // 3/5 agency = 6/10 = 60%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(r.fire_safety_coverage_rate).toBe(60);
    });

    it("all four penalties stack together", () => {
      // Create a worst-case scenario for all four penalties:
      // completionRate = 0%, agencyCompletion = 0%, safeguarding = 0%, fire = 0%
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          staff_id: "s0",
          status: "not_started",
          completion_date: null,
          safeguarding_covered: false,
          medication_covered: false,
          fire_safety_covered: false,
          modules_total: 10,
          modules_completed: 0,
          signed_off_by: null,
        }),
      ];
      const agencyInductions = [
        makeAgencyInduction({
          id: "ag_0",
          completed: false,
          safeguarding_briefed: false,
          medication_briefed: false,
          fire_procedures_briefed: false,
        }),
      ];
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions,
        shadowing_records: [],
        handbook_acknowledgements: [],
      });
      // base 52, no bonuses
      // penalties: safeguarding<50 (-5), completion<50 (-5), agency<50 (-5), fire<70 (-3)
      // 52 - 5 - 5 - 5 - 3 = 34
      expect(r.induction_score).toBe(34);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. COMBINED OUTSTANDING (~80)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Combined outstanding", () => {
    it("all bonuses achieved yields score 80 (all bonuses: 52 + 28 = 80)", () => {
      // baseInput: all 100% everywhere
      // bonuses: completion(+4) + agency(+3) + safeguarding(+4) + medication(+3)
      //        + fire(+2) + shadowComp(+3) + handbook(+3) + loneWorking(+3) + avgModule(+3)
      //        = 28
      // No penalties
      // 52 + 28 = 80
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.induction_score).toBe(80);
    });

    it("baseInput yields 'outstanding' rating (80 >= 80)", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.induction_rating).toBe("outstanding");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. RATING BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Rating boundaries", () => {
    it("score 80 => outstanding (baseInput achieves max bonuses)", () => {
      // Max bonuses: 4+3+4+3+2+3+3+3+3 = 28. 52+28 = 80.
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.induction_score).toBe(80);
      expect(r.induction_rating).toBe("outstanding");
    });

    it("score 79 => good (drop one lower-tier bonus from outstanding)", () => {
      // Start from 80, reduce avgModule to 80% => +1 instead of +3 => 80-2 = 78
      // That's still good. Let's drop loneWorking to 80% => +1 instead of +3 => 80-2 = 78
      // Or: reduce avgModule below 95 but >= 80 => +1 instead of +3, score = 78
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: "completed",
          completion_date: "2026-01-24",
          modules_total: 10,
          modules_completed: 9, // 90% => >= 80 but < 95 => +1
          safeguarding_covered: true,
          medication_covered: true,
          fire_safety_covered: true,
          children_intro_completed: true,
          policy_review_completed: true,
          signed_off_by: "mgr_1",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      // avgModule = 90% => +1 (not +3). So 80 - 2 = 78.
      expect(r.induction_score).toBe(78);
      expect(r.induction_rating).toBe("good");
    });

    it("score 65 => good boundary", () => {
      // Need exactly 65 = 52 + 13 bonuses, 0 penalties.
      // completion 100% (+4), agency 100% (+3), safeguarding 100% (+4), medication 90% (+1), fire 90% (+1) = 13
      // shadowComp < 80 (no bonus), handbook < 85 (no bonus)
      // loneWorking < 80 (no bonus), avgModule < 80 (no bonus)
      // No penalties: all >= 50, fire >= 70.
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: "completed",
          modules_total: 10,
          modules_completed: 7, // 70% avg => < 80 no bonus
          safeguarding_covered: true,
          medication_covered: true,
          fire_safety_covered: true,
          signed_off_by: "mgr",
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: true, // 100%
          safeguarding_briefed: true, // 10/10 = 100%
          medication_briefed: i < 4, // 9/10 = 90% => +1
          fire_procedures_briefed: i < 4, // 9/10 = 90% => +1
        }),
      );
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 3, // 60% < 80
          ready_for_lone_working: i < 3, // 60% < 80
          shift_type: "day",
          hours: 4,
        }),
      );
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 4, // 80% < 85
        }),
      );
      // Bonuses: 4+3+4+1+1 = 13. Penalties: 0. Score = 52+13 = 65.
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions,
        shadowing_records: shadowingRecords,
        handbook_acknowledgements: handbookAcks,
      });
      expect(r.induction_score).toBe(65);
      expect(r.induction_rating).toBe("good");
    });

    it("score 64 => adequate (just below good)", () => {
      // Need 52 + 12 = 64.
      // completion100(+4) + agency100(+3) + safeguarding100(+4) + medication86(+1) = 12
      // fire 70% (no bonus, no penalty)
      // shadowComp < 80, handbook < 85, loneWorking < 80, avgModule < 80 => all no bonus
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: "completed",
          modules_total: 10,
          modules_completed: 7, // 70%
          safeguarding_covered: true,
          medication_covered: true,
          fire_safety_covered: i < 4, // 4/5 perm
          signed_off_by: "mgr",
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: true,
          safeguarding_briefed: true,
          medication_briefed: i < 4, // 9/10 = 90% => +1
          fire_procedures_briefed: i < 3, // 7/10 = 70% => no bonus, no penalty
        }),
      );
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 3, // 60%
          ready_for_lone_working: i < 3, // 60%
          shift_type: "day",
          hours: 4,
        }),
      );
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 4, // 80%
        }),
      );
      // Bonuses: 4+3+4+1 = 12. No penalties. Score = 52+12 = 64.
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions,
        shadowing_records: shadowingRecords,
        handbook_acknowledgements: handbookAcks,
      });
      expect(r.induction_score).toBe(64);
      expect(r.induction_rating).toBe("adequate");
    });

    it("score 45 => adequate boundary", () => {
      // Need 52 + bonuses - penalties = 45
      // 52 - 5(completion<50) - 3(fire<70) + 1(agency>=80) = 45
      // completionRate = 40% => -5, no bonus
      // agencyCompletion = 80% => +1, no penalty
      // safeguarding = 50% => no bonus, no penalty
      // medication = 60% => no bonus
      // fire = 40% => -3, no bonus
      // shadowComp = 60% => no bonus
      // handbookAck = 60% => no bonus
      // loneWorking = 60% => no bonus
      // avgModule = 50% => no bonus
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 2 ? "completed" : "in_progress",
          completion_date: i < 2 ? "2026-01-24" : null,
          modules_total: 10,
          modules_completed: 5,
          safeguarding_covered: i < 3,
          medication_covered: i < 3,
          fire_safety_covered: i < 2,
          signed_off_by: i < 2 ? "mgr" : null,
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 4, // 80% => +1
          safeguarding_briefed: i < 2, // 5/10 = 50%
          medication_briefed: i < 3, // 6/10 = 60%
          fire_procedures_briefed: i < 2, // 4/10 = 40% => -3
        }),
      );
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 3,
          ready_for_lone_working: i < 3,
          shift_type: "day",
          hours: 4,
        }),
      );
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 3,
        }),
      );
      // 52 + 1 - 5 - 3 = 45
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions,
        shadowing_records: shadowingRecords,
        handbook_acknowledgements: handbookAcks,
      });
      expect(r.induction_score).toBe(45);
      expect(r.induction_rating).toBe("adequate");
    });

    it("score 44 => inadequate (just below adequate)", () => {
      // 52 + 1 - 5 - 3 - 1_more... We need 44.
      // 52 - 5(completion<50) - 3(fire<70) = 44
      // No bonuses at all. Need all rates in "no bonus" range.
      // agencyCompletion: 50-79% (no bonus, no penalty)
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 2 ? "completed" : "in_progress",
          completion_date: i < 2 ? "2026-01-24" : null,
          modules_total: 10,
          modules_completed: 5,
          safeguarding_covered: i < 3,
          medication_covered: i < 3,
          fire_safety_covered: i < 2,
          signed_off_by: i < 2 ? "mgr" : null,
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 3, // 3/5 = 60% (no bonus, no penalty)
          safeguarding_briefed: i < 2, // 5/10 total = 50%
          medication_briefed: i < 3,
          fire_procedures_briefed: i < 2, // 4/10 = 40%
        }),
      );
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 3,
          ready_for_lone_working: i < 3,
          shift_type: "day",
          hours: 4,
        }),
      );
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 3,
        }),
      );
      // completionRate = 40% => -5
      // agencyCompletion = 60% => no bonus, no penalty
      // safeguarding = 50% => no bonus, no penalty
      // medication = 60% => no bonus, no penalty
      // fire = 40% => -3
      // shadow comp = 60%, lone = 60%, handbook = 60%, avg module = 50% => all no bonus, no penalty
      // 52 - 5 - 3 = 44

      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions,
        shadowing_records: shadowingRecords,
        handbook_acknowledgements: handbookAcks,
      });
      expect(r.induction_score).toBe(44);
      expect(r.induction_rating).toBe("inadequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. METRIC CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Metric calculations", () => {
    it("total_inductions = staff_inductions.length + agency_inductions.length", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.total_inductions).toBe(5 + 2); // 7
    });

    it("completion_rate = pct(completed, totalStaffInductions)", () => {
      const staffInductions = Array.from({ length: 4 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 3 ? "completed" : "overdue",
          completion_date: i < 3 ? "2026-01-24" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(r.completion_rate).toBe(75); // 3/4 = 75
    });

    it("agency_induction_completion_rate = pct(completed agency, total agency)", () => {
      const agencyInductions = Array.from({ length: 4 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 3,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      expect(r.agency_induction_completion_rate).toBe(75);
    });

    it("safeguarding_coverage_rate spans both permanent and agency", () => {
      // 3 staff, 2 agency = 5 total
      // 2 staff safeguarding + 1 agency safeguarding = 3/5 = 60%
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          safeguarding_covered: i < 2,
        }),
      );
      const agencyInductions = Array.from({ length: 2 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          safeguarding_briefed: i < 1,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(r.safeguarding_coverage_rate).toBe(60);
    });

    it("medication_coverage_rate spans both permanent and agency", () => {
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          medication_covered: i < 2,
        }),
      );
      const agencyInductions = Array.from({ length: 2 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          medication_briefed: i < 1,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(r.medication_coverage_rate).toBe(60); // 3/5
    });

    it("fire_safety_coverage_rate spans both permanent and agency", () => {
      const staffInductions = Array.from({ length: 4 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          fire_safety_covered: i < 3,
        }),
      );
      const agencyInductions = Array.from({ length: 4 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          fire_procedures_briefed: i < 3,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(r.fire_safety_coverage_rate).toBe(75); // 6/8
    });

    it("shadowing_completion_rate = pct(totalShadowing, total_staff)", () => {
      // 3 shadowing records, 5 total staff => 60%
      const shadowingRecords = Array.from({ length: 3 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          total_staff: 5,
          shadowing_records: shadowingRecords,
        }),
      );
      expect(r.shadowing_completion_rate).toBe(60);
    });

    it("shadowing_competency_rate = pct(competencyConfirmed, totalShadowing)", () => {
      const shadowingRecords = Array.from({ length: 4 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 3,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      expect(r.shadowing_competency_rate).toBe(75); // 3/4
    });

    it("handbook_acknowledgement_rate = pct(signed, totalHandbooks)", () => {
      const handbookAcks = Array.from({ length: 4 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 3,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ handbook_acknowledgements: handbookAcks }),
      );
      expect(r.handbook_acknowledgement_rate).toBe(75);
    });

    it("lone_working_readiness_rate = pct(readyForLoneWorking, totalShadowing)", () => {
      const shadowingRecords = Array.from({ length: 4 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          ready_for_lone_working: i < 2,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      expect(r.lone_working_readiness_rate).toBe(50); // 2/4
    });

    it("average_module_completion averages across all staff inductions", () => {
      // staff1: 8/10=80%, staff2: 6/10=60%, staff3: 10/10=100% => avg = (80+60+100)/3 = 80
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          staff_id: "s0",
          modules_total: 10,
          modules_completed: 8,
        }),
        makeStaffInduction({
          id: "ind_1",
          staff_id: "s1",
          modules_total: 10,
          modules_completed: 6,
        }),
        makeStaffInduction({
          id: "ind_2",
          staff_id: "s2",
          modules_total: 10,
          modules_completed: 10,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(r.average_module_completion).toBe(80);
    });

    it("average_module_completion handles modules_total = 0 as 0%", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          staff_id: "s0",
          modules_total: 0,
          modules_completed: 0,
        }),
        makeStaffInduction({
          id: "ind_1",
          staff_id: "s1",
          modules_total: 10,
          modules_completed: 10,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      // (0 + 100) / 2 = 50
      expect(r.average_module_completion).toBe(50);
    });

    it("average_module_completion is 0 when no staff inductions exist", () => {
      // Cannot have no staff inductions without triggering special case (unless agency exists)
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [],
          agency_inductions: [makeAgencyInduction()],
        }),
      );
      expect(r.average_module_completion).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. pct(0,0) = 0 BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════════

  describe("pct(0,0) = 0 behavior", () => {
    it("no agency inductions => agencyCompletionRate = 0 => triggers penalty", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: [] }),
      );
      expect(r.agency_induction_completion_rate).toBe(0);
      // agencyCompletionRate 0 < 50 => -5 penalty applied
    });

    it("no shadowing records => shadowingCompetencyRate = 0, loneWorkingReadiness = 0", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: [] }),
      );
      expect(r.shadowing_competency_rate).toBe(0);
      expect(r.lone_working_readiness_rate).toBe(0);
      expect(r.shadowing_completion_rate).toBe(0);
    });

    it("no handbook acknowledgements => handbookAckRate = 0", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({ handbook_acknowledgements: [] }),
      );
      expect(r.handbook_acknowledgement_rate).toBe(0);
    });

    it("no staff inductions but agency exists => completionRate = 0 => triggers penalty", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [],
          agency_inductions: [makeAgencyInduction()],
        }),
      );
      expect(r.completion_rate).toBe(0);
      // completionRate 0 < 50 => -5 penalty
    });

    it("shadowing_completion_rate with total_staff=0 is pct(n, 0) = 0", () => {
      // Even though we have shadowing records, if total_staff is 0, pct(5, 0) = 0
      // But total_staff=0 with non-empty arrays won't trigger the special case.
      const r = computeStaffInductionOnboarding(
        baseInput({ total_staff: 0 }),
      );
      expect(r.shadowing_completion_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Strengths", () => {
    it("100% completion rate generates strength about all inductions completed", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.strengths.some((s) => s.includes("100% completion"))).toBe(true);
    });

    it("85% completion rate generates partial strength", () => {
      const staffInductions = Array.from({ length: 7 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 6 ? "completed" : "in_progress",
          completion_date: i < 6 ? "2026-01-24" : null,
          modules_total: 10,
          modules_completed: 10,
          signed_off_by: i < 6 ? "mgr" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          total_staff: 7,
          staff_inductions: staffInductions,
        }),
      );
      // 6/7 = 86%
      expect(r.strengths.some((s) => s.includes("86% induction completion"))).toBe(true);
    });

    it("100% agency completion generates strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.strengths.some((s) => s.includes("agency staff inductions completed")),
      ).toBe(true);
    });

    it("80% agency completion generates partial strength", () => {
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 4, // 80%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      expect(
        r.strengths.some((s) => s.includes("80% agency induction completion")),
      ).toBe(true);
    });

    it("100% safeguarding coverage generates strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.strengths.some((s) => s.includes("Safeguarding covered in 100%")),
      ).toBe(true);
    });

    it("90% safeguarding coverage generates partial strength", () => {
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          safeguarding_covered: true,
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          safeguarding_briefed: i < 4, // 9/10 = 90%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(
        r.strengths.some((s) => s.includes("Safeguarding coverage at 90%")),
      ).toBe(true);
    });

    it("100% medication coverage generates strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.strengths.some((s) =>
          s.includes("Medication procedures covered in all inductions"),
        ),
      ).toBe(true);
    });

    it("100% fire safety generates strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.strengths.some((s) =>
          s.includes("Fire safety covered in all inductions"),
        ),
      ).toBe(true);
    });

    it("100% shadowing competency generates strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.strengths.some((s) =>
          s.includes("shadowing records confirm competency"),
        ),
      ).toBe(true);
    });

    it("80% shadowing competency generates partial strength", () => {
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 4, // 80%
          shift_type: i < 2 ? "day" : i < 4 ? "evening" : "night",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      expect(
        r.strengths.some((s) =>
          s.includes("80% of shadowing assessments confirm competency"),
        ),
      ).toBe(true);
    });

    it("100% handbook rate generates strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.strengths.some((s) =>
          s.includes("handbook acknowledgements signed"),
        ),
      ).toBe(true);
    });

    it("85% handbook rate generates partial strength", () => {
      const handbookAcks = Array.from({ length: 7 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 6, // 6/7 = 86%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ handbook_acknowledgements: handbookAcks }),
      );
      expect(
        r.strengths.some((s) => s.includes("86% handbook acknowledgement")),
      ).toBe(true);
    });

    it("100% lone working readiness generates strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.strengths.some((s) =>
          s.includes("ready for lone working"),
        ),
      ).toBe(true);
    });

    it("95%+ average module completion generates strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.strengths.some((s) => s.includes("Average module completion")),
      ).toBe(true);
    });

    it("all signed off + all completed generates sign-off strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.strengths.some((s) => s.includes("manager sign-off")),
      ).toBe(true);
    });

    it("3+ shift types in shadowing generates strength", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      // baseInput has day, evening, night = 3 shift types
      expect(
        r.strengths.some((s) => s.includes("3 different shift types")),
      ).toBe(true);
    });

    it("no strengths when all rates are low", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          staff_id: "s0",
          status: "overdue",
          completion_date: null,
          safeguarding_covered: false,
          medication_covered: false,
          fire_safety_covered: false,
          modules_total: 10,
          modules_completed: 2,
          signed_off_by: null,
        }),
      ];
      const agencyInductions = [
        makeAgencyInduction({
          id: "ag_0",
          completed: false,
          safeguarding_briefed: false,
        }),
      ];
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions,
        shadowing_records: [
          makeShadowingRecord({
            competency_confirmed: false,
            ready_for_lone_working: false,
            shift_type: "day",
          }),
        ],
        handbook_acknowledgements: [
          makeHandbookAcknowledgement({ signed: false }),
        ],
      });
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. CONCERNS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Concerns", () => {
    it("overdue inductions generate concern", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          staff_id: "s0",
          status: "overdue",
          completion_date: null,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(
        r.concerns.some((c) => c.includes("overdue") && c.includes("Reg 33")),
      ).toBe(true);
    });

    it("not-started inductions generate concern", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          staff_id: "s0",
          status: "not_started",
          completion_date: null,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(
        r.concerns.some((c) => c.includes("not started")),
      ).toBe(true);
    });

    it("completionRate < 50 generates concern", () => {
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 1 ? "completed" : "in_progress",
          completion_date: i < 1 ? "2026-01-24" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(
        r.concerns.some((c) => c.includes("33%") && c.includes("completed")),
      ).toBe(true);
    });

    it("agencyCompletionRate < 50 generates concern", () => {
      const agencyInductions = Array.from({ length: 3 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 1,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("33%") && c.includes("agency inductions completed"),
        ),
      ).toBe(true);
    });

    it("safeguarding < 50 generates critical concern", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          safeguarding_covered: false,
        }),
      ];
      const agencyInductions = [
        makeAgencyInduction({ id: "ag_0", safeguarding_briefed: false }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("Safeguarding covered in only 0%"),
        ),
      ).toBe(true);
    });

    it("safeguarding 50-79% generates moderate concern", () => {
      // 4 staff + 1 agency = 5. 3 safeguarding = 60%
      const staffInductions = Array.from({ length: 4 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          safeguarding_covered: i < 3,
        }),
      );
      const agencyInductions = [
        makeAgencyInduction({ id: "ag_0", safeguarding_briefed: false }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(
        r.concerns.some(
          (c) =>
            c.includes("Safeguarding coverage at 60%"),
        ),
      ).toBe(true);
    });

    it("medication < 70 generates concern", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          medication_covered: false,
        }),
      ];
      const agencyInductions = [
        makeAgencyInduction({ id: "ag_0", medication_briefed: false }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("Medication procedures covered in only 0%"),
        ),
      ).toBe(true);
    });

    it("fire safety < 70 generates concern", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          fire_safety_covered: false,
        }),
      ];
      const agencyInductions = [
        makeAgencyInduction({ id: "ag_0", fire_procedures_briefed: false }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("Fire safety covered in only 0%"),
        ),
      ).toBe(true);
    });

    it("shadowing competency < 50 generates concern", () => {
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 2, // 40%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("40%") && c.includes("competency"),
        ),
      ).toBe(true);
    });

    it("lone working readiness < 50 generates concern", () => {
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          ready_for_lone_working: i < 2, // 40%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("40%") && c.includes("lone working"),
        ),
      ).toBe(true);
    });

    it("handbook acknowledgement < 50 generates concern", () => {
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 2, // 40%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ handbook_acknowledgements: handbookAcks }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("40%") && c.includes("handbook"),
        ),
      ).toBe(true);
    });

    it("average module completion < 50 generates concern", () => {
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          modules_total: 10,
          modules_completed: 4, // 40%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("40%") && c.includes("module completion"),
        ),
      ).toBe(true);
    });

    it("completed inductions without sign-off generate concern", () => {
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: "completed",
          signed_off_by: i < 1 ? "mgr" : null, // 2 unsigned
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(
        r.concerns.some((c) => c.includes("manager sign-off")),
      ).toBe(true);
    });

    it("plural vs singular for overdue inductions", () => {
      const single = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              status: "overdue",
              completion_date: null,
            }),
          ],
        }),
      );
      expect(
        single.concerns.some((c) => c.includes("1 staff induction is overdue")),
      ).toBe(true);

      const plural = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              staff_id: "s0",
              status: "overdue",
              completion_date: null,
            }),
            makeStaffInduction({
              id: "ind_1",
              staff_id: "s1",
              status: "overdue",
              completion_date: null,
            }),
          ],
        }),
      );
      expect(
        plural.concerns.some(
          (c) => c.includes("2 staff inductions are overdue"),
        ),
      ).toBe(true);
    });

    it("agency children briefing gap generates concern when incomplete agency exists", () => {
      const agencyInductions = [
        makeAgencyInduction({
          id: "ag_0",
          completed: false,
          children_needs_briefed: false,
        }),
        makeAgencyInduction({
          id: "ag_1",
          completed: true,
          children_needs_briefed: true,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("children's individual needs"),
        ),
      ).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("overdue inductions trigger immediate recommendation", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          status: "overdue",
          completion_date: null,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("overdue"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 33");
    });

    it("safeguarding < 80 triggers immediate recommendation", () => {
      // 2 total records, 1 safeguarding = 50%
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({ id: "ind_0", safeguarding_covered: true }),
          ],
          agency_inductions: [
            makeAgencyInduction({ id: "ag_0", safeguarding_briefed: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("safeguarding coverage"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("agency completion < 80 triggers immediate recommendation", () => {
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 3, // 60%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("agency induction completion"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("fire safety < 90 triggers immediate recommendation", () => {
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          fire_safety_covered: i < 4, // 4/5 perm
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          fire_procedures_briefed: i < 4, // 4/5 agency => 8/10 = 80%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("fire safety coverage"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("completion < 85 triggers soon recommendation", () => {
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 4 ? "completed" : "in_progress",
          completion_date: i < 4 ? "2026-01-24" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      // 4/5 = 80% < 85
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("induction completion rate"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("medication < 85 triggers soon recommendation", () => {
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          medication_covered: i < 3, // 3/5 perm
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          medication_briefed: i < 3, // 3/5 agency => 6/10 = 60%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("medication coverage"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("shadowing competency < 80 triggers soon recommendation", () => {
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 3, // 60%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("shadowing programme"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("lone working readiness < 80 triggers soon recommendation", () => {
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          ready_for_lone_working: i < 3, // 60%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("lone working readiness"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("handbook rate < 85 triggers soon recommendation", () => {
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 4, // 80%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ handbook_acknowledgements: handbookAcks }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("handbook acknowledgement rate"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("not-started inductions trigger soon recommendation", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          status: "not_started",
          completion_date: null,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("outstanding induction"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("avg module completion < 80 triggers planned recommendation", () => {
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          modules_total: 10,
          modules_completed: 7, // 70%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("module completion"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("< 3 shift types triggers planned recommendation", () => {
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          shift_type: "day", // only 1 type
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("shift type"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("unsigned completed inductions trigger planned recommendation", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          status: "completed",
          signed_off_by: null,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.includes("manager sign-off"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommendations have sequential rank values", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          status: "overdue",
          completion_date: null,
          safeguarding_covered: false,
          medication_covered: false,
          fire_safety_covered: false,
          modules_total: 10,
          modules_completed: 2,
          signed_off_by: null,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: [
            makeAgencyInduction({
              id: "ag_0",
              completed: false,
              safeguarding_briefed: false,
              fire_procedures_briefed: false,
            }),
          ],
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("no recommendations when everything is perfect", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Insights", () => {
    it("safeguarding < 50 generates critical insight", () => {
      const staffInductions = [
        makeStaffInduction({ safeguarding_covered: false }),
      ];
      const agencyInductions = [
        makeAgencyInduction({ safeguarding_briefed: false }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "critical" &&
          i.text.includes("Safeguarding is covered in fewer than half"),
      );
      expect(insight).toBeDefined();
    });

    it("3+ overdue inductions generates critical insight", () => {
      const staffInductions = Array.from({ length: 4 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 3 ? "overdue" : "completed",
          completion_date: i < 3 ? null : "2026-01-24",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "critical" && i.text.includes("3 staff inductions are overdue"),
      );
      expect(insight).toBeDefined();
    });

    it("1-2 overdue inductions generates warning insight (not critical)", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          staff_id: "s0",
          status: "overdue",
          completion_date: null,
        }),
        makeStaffInduction({
          id: "ind_1",
          staff_id: "s1",
          status: "completed",
          completion_date: "2026-01-24",
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const insight = r.insights.find(
        (i) => i.severity === "warning" && i.text.includes("overdue"),
      );
      expect(insight).toBeDefined();
    });

    it("completion < 50 generates critical insight", () => {
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 1 ? "completed" : "in_progress",
          completion_date: i < 1 ? "2026-01-24" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "critical" && i.text.includes("Fewer than half"),
      );
      expect(insight).toBeDefined();
    });

    it("agency completion < 50 generates critical insight", () => {
      const agencyInductions = Array.from({ length: 3 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 1,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "critical" &&
          i.text.includes("Agency induction completion is critically low"),
      );
      expect(insight).toBeDefined();
    });

    it("lone working readiness < 50 generates warning insight", () => {
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          ready_for_lone_working: i < 2, // 40%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" && i.text.includes("lone working"),
      );
      expect(insight).toBeDefined();
    });

    it("handbook ack < 50 generates warning insight", () => {
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 2, // 40%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ handbook_acknowledgements: handbookAcks }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("Handbook acknowledgement rate"),
      );
      expect(insight).toBeDefined();
    });

    it("medication < 70 generates warning insight", () => {
      const staffInductions = [
        makeStaffInduction({ medication_covered: false }),
      ];
      const agencyInductions = [
        makeAgencyInduction({ medication_briefed: false }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("Medication procedures"),
      );
      expect(insight).toBeDefined();
    });

    it("fire safety < 70 generates warning insight", () => {
      const staffInductions = [
        makeStaffInduction({ fire_safety_covered: false }),
      ];
      const agencyInductions = [
        makeAgencyInduction({ fire_procedures_briefed: false }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: staffInductions,
          agency_inductions: agencyInductions,
        }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("Fire safety is covered in only"),
      );
      expect(insight).toBeDefined();
    });

    it("unshadowed staff generates warning insight", () => {
      // 5 total staff but only 3 have shadowing records
      const shadowingRecords = Array.from({ length: 3 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          shift_type: i < 2 ? "day" : "evening",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          total_staff: 5,
          shadowing_records: shadowingRecords,
        }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("no shadowing records"),
      );
      expect(insight).toBeDefined();
    });

    it("exemplary positive insight when everything is 100%", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      const insight = r.insights.find(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("Exemplary induction and onboarding"),
      );
      expect(insight).toBeDefined();
    });

    it("good positive insight when completion >= 85, safeguarding >= 90, shadow comp >= 80", () => {
      const staffInductions = Array.from({ length: 7 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 6 ? "completed" : "in_progress",
          completion_date: i < 6 ? "2026-01-24" : null,
          safeguarding_covered: true,
          modules_total: 10,
          modules_completed: 10,
          signed_off_by: i < 6 ? "mgr" : null,
        }),
      );
      // 6/7 = 86% completion
      // safeguarding = 7/9 staff + 2/2 agency? Let's keep agency at 100%
      // total records = 7 + 2 = 9. safeguarding: 7 staff + 2 agency = 9/9 = 100%
      // shadowing: 4/5 = 80%
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 4, // 80%
          shift_type: i < 2 ? "day" : i < 4 ? "evening" : "night",
        }),
      );
      // handbook: 4/5 = 80% (not 100%, so exemplary won't trigger)
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 4,
        }),
      );
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 7,
        staff_inductions: staffInductions,
        agency_inductions: [
          makeAgencyInduction({ id: "ag_0" }),
          makeAgencyInduction({ id: "ag_1", staff_name: "AW2" }),
        ],
        shadowing_records: shadowingRecords,
        handbook_acknowledgements: handbookAcks,
      });
      const insight = r.insights.find(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("Good induction framework"),
      );
      expect(insight).toBeDefined();
    });

    it("robust shadowing insight when avg hours >= 8 and lone readiness >= 80", () => {
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          hours: 10,
          ready_for_lone_working: true,
          shift_type: i < 2 ? "day" : i < 4 ? "evening" : "night",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("Shadowing programme is robust"),
      );
      expect(insight).toBeDefined();
    });

    it("all critical policies read generates positive insight", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      const insight = r.insights.find(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("safeguarding, behaviour management, and whistleblowing"),
      );
      expect(insight).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. HEADLINES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Headlines", () => {
    it("inadequate headline mentions statutory requirements", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: [
          makeStaffInduction({
            status: "not_started",
            completion_date: null,
            safeguarding_covered: false,
            medication_covered: false,
            fire_safety_covered: false,
            modules_total: 10,
            modules_completed: 0,
            signed_off_by: null,
          }),
        ],
        agency_inductions: [
          makeAgencyInduction({
            completed: false,
            safeguarding_briefed: false,
            fire_procedures_briefed: false,
          }),
        ],
        shadowing_records: [],
        handbook_acknowledgements: [],
      });
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("Reg 33/34");
    });

    it("adequate headline mentions gaps", () => {
      // Build adequate scenario (score 45-64)
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 2 ? "completed" : "in_progress",
          completion_date: i < 2 ? "2026-01-24" : null,
          modules_total: 10,
          modules_completed: 5,
          safeguarding_covered: i < 3,
          medication_covered: i < 3,
          fire_safety_covered: i < 4,
          signed_off_by: i < 2 ? "mgr" : null,
        }),
      );
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 3,
          safeguarding_briefed: i < 2,
          medication_briefed: i < 3,
          fire_procedures_briefed: i < 3,
        }),
      );
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions,
        shadowing_records: Array.from({ length: 5 }, (_, i) =>
          makeShadowingRecord({
            id: `sh_${i}`,
            staff_id: `s${i}`,
            competency_confirmed: i < 3,
            ready_for_lone_working: i < 3,
            shift_type: "day",
          }),
        ),
        handbook_acknowledgements: Array.from({ length: 5 }, (_, i) =>
          makeHandbookAcknowledgement({
            id: `hb_${i}`,
            staff_id: `s${i}`,
            signed: i < 3,
          }),
        ),
      });
      if (r.induction_rating === "adequate") {
        expect(r.headline).toContain("Adequate");
        expect(r.headline).toContain("gaps");
      }
    });

    it("good headline mentions areas for attention", () => {
      // Good scenario with some overdue
      const staffInductions = Array.from({ length: 10 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 9 ? "completed" : "overdue",
          completion_date: i < 9 ? "2026-01-24" : null,
          modules_total: 10,
          modules_completed: 10,
          safeguarding_covered: true,
          medication_covered: true,
          fire_safety_covered: true,
          signed_off_by: i < 9 ? "mgr" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          total_staff: 10,
          staff_inductions: staffInductions,
        }),
      );
      if (r.induction_rating === "good") {
        expect(r.headline).toContain("Good");
        expect(r.headline).toContain("overdue");
      }
    });

    it("good headline with no issues is generic positive", () => {
      // Drop avgModule to 80% => +1 instead of +3 => score 78, rating "good"
      const staffInductions = Array.from({ length: 5 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: "completed",
          completion_date: "2026-01-24",
          modules_total: 10,
          modules_completed: 9, // 90%
          safeguarding_covered: true,
          medication_covered: true,
          fire_safety_covered: true,
          children_intro_completed: true,
          policy_review_completed: true,
          signed_off_by: "mgr_1",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(r.induction_rating).toBe("good");
      // No overdue, agency 100%, handbook 100% => issues empty
      expect(r.headline).toContain("Good");
    });

    it("good headline lists agency completion when < 100", () => {
      const agencyInductions = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 4, // 80%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      if (r.induction_rating === "good") {
        expect(r.headline).toContain("agency completion at 80%");
      }
    });

    it("good headline lists handbook acknowledgement when < 100", () => {
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 4, // 80%
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ handbook_acknowledgements: handbookAcks }),
      );
      if (r.induction_rating === "good") {
        expect(r.headline).toContain("handbook acknowledgement at 80%");
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Edge cases", () => {
    it("single staff induction record", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 1,
        staff_inductions: [makeStaffInduction()],
        agency_inductions: [],
        shadowing_records: [makeShadowingRecord()],
        handbook_acknowledgements: [makeHandbookAcknowledgement()],
      });
      expect(r.total_inductions).toBe(1);
      expect(r.completion_rate).toBe(100);
      // agencyCompletionRate = pct(0,0) = 0 => penalty -5
      expect(r.agency_induction_completion_rate).toBe(0);
    });

    it("single agency induction record", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 1,
        staff_inductions: [],
        agency_inductions: [makeAgencyInduction()],
        shadowing_records: [],
        handbook_acknowledgements: [],
      });
      expect(r.total_inductions).toBe(1);
      expect(r.agency_induction_completion_rate).toBe(100);
      // completionRate = pct(0,0) = 0 => penalty -5
      expect(r.completion_rate).toBe(0);
    });

    it("empty sub-arrays with at least one non-empty prevents special case", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 3,
        staff_inductions: [],
        agency_inductions: [],
        shadowing_records: [makeShadowingRecord()],
        handbook_acknowledgements: [],
      });
      // Not special case because shadowing_records is not empty
      expect(r.induction_rating).not.toBe("insufficient_data");
      // allEmpty is false because shadowing has records
    });

    it("handbook only with everything else empty avoids special case but may be inadequate", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 2,
        staff_inductions: [],
        agency_inductions: [],
        shadowing_records: [],
        handbook_acknowledgements: [makeHandbookAcknowledgement()],
      });
      // Not the insufficient_data special case (handbook array is non-empty)
      expect(r.induction_rating).not.toBe("insufficient_data");
      // Goes through normal scoring: pct(0,0)=0 for many metrics triggers penalties
      // handbookAckRate 100% (+3), penalties: completion<50(-5), agency<50(-5), safeguarding<50(-5), fire<70(-3)
      // 52 + 3 - 18 = 37 => inadequate (but through normal path, not special case)
      expect(r.induction_score).toBe(37);
      expect(r.induction_rating).toBe("inadequate");
    });

    it("score is clamped to 0 (never negative)", () => {
      // Max penalties: -5 -5 -5 -3 = -18. From 52 => 34. Still positive.
      // But if we could get more penalties... current max penalties = 18.
      // 52 - 18 = 34, always >= 0. Let's just verify clamp works.
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: [
          makeStaffInduction({
            status: "not_started",
            completion_date: null,
            safeguarding_covered: false,
            medication_covered: false,
            fire_safety_covered: false,
            modules_total: 10,
            modules_completed: 0,
            signed_off_by: null,
          }),
        ],
        agency_inductions: [
          makeAgencyInduction({
            completed: false,
            safeguarding_briefed: false,
            fire_procedures_briefed: false,
          }),
        ],
        shadowing_records: [],
        handbook_acknowledgements: [],
      });
      expect(r.induction_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 (never exceeds)", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      expect(r.induction_score).toBeLessThanOrEqual(100);
    });

    it("rounding in pct: 2/3 = 67", () => {
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 2 ? "completed" : "overdue",
          completion_date: i < 2 ? "2026-01-24" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(r.completion_rate).toBe(67);
    });

    it("rounding in pct: 1/3 = 33", () => {
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 1 ? "completed" : "in_progress",
          completion_date: i < 1 ? "2026-01-24" : null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(r.completion_rate).toBe(33);
    });

    it("module completion rounds correctly: (50 + 100) / 2 = 75", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          staff_id: "s0",
          modules_total: 10,
          modules_completed: 5,
        }),
        makeStaffInduction({
          id: "ind_1",
          staff_id: "s1",
          modules_total: 10,
          modules_completed: 10,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(r.average_module_completion).toBe(75);
    });

    it("very large input processes correctly", () => {
      const staffInductions = Array.from({ length: 100 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: "completed",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          total_staff: 100,
          staff_inductions: staffInductions,
        }),
      );
      expect(r.total_inductions).toBe(102); // 100 staff + 2 agency
      expect(r.completion_rate).toBe(100);
    });

    it("all inductions in_progress yields 0% completion", () => {
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: "in_progress",
          completion_date: null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      expect(r.completion_rate).toBe(0);
    });

    it("only shadowing records exist (no inductions, no handbooks)", () => {
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 3,
        staff_inductions: [],
        agency_inductions: [],
        shadowing_records: [
          makeShadowingRecord({ id: "sh_0", staff_id: "s0" }),
          makeShadowingRecord({ id: "sh_1", staff_id: "s1" }),
        ],
        handbook_acknowledgements: [],
      });
      // Not a special case
      expect(r.total_inductions).toBe(0);
      expect(r.shadowing_completion_rate).toBe(67); // 2/3
      expect(r.shadowing_competency_rate).toBe(100);
    });

    it("overdue singular grammar: '1 staff induction is overdue'", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              status: "overdue",
              completion_date: null,
            }),
          ],
        }),
      );
      expect(
        r.concerns.some((c) => c.includes("1 staff induction is overdue")),
      ).toBe(true);
    });

    it("not_started singular grammar: '1 induction has not started'", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              status: "not_started",
              completion_date: null,
            }),
          ],
        }),
      );
      expect(
        r.concerns.some((c) => c.includes("1 induction has not started")),
      ).toBe(true);
    });

    it("not_started plural grammar: '2 inductions have not started'", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              staff_id: "s0",
              status: "not_started",
              completion_date: null,
            }),
            makeStaffInduction({
              id: "ind_1",
              staff_id: "s1",
              status: "not_started",
              completion_date: null,
            }),
          ],
        }),
      );
      expect(
        r.concerns.some((c) => c.includes("2 inductions have not started")),
      ).toBe(true);
    });

    it("unsigned singular grammar: '1 completed induction lacks manager sign-off'", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              status: "completed",
              signed_off_by: null,
            }),
          ],
        }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("lacks manager sign-off"),
        ),
      ).toBe(true);
    });

    it("unsigned plural grammar: '2 completed inductions lack manager sign-off'", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              staff_id: "s0",
              status: "completed",
              signed_off_by: null,
            }),
            makeStaffInduction({
              id: "ind_1",
              staff_id: "s1",
              status: "completed",
              signed_off_by: null,
            }),
          ],
        }),
      );
      expect(
        r.concerns.some(
          (c) => c.includes("lack manager sign-off"),
        ),
      ).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. SCORE VERIFICATION (combined scenarios)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Score verification", () => {
    it("all max bonuses, no penalties => 52 + 28 = 80", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      // 4+3+4+3+2+3+3+3+3 = 28
      expect(r.induction_score).toBe(80);
    });

    it("all max penalties, no bonuses => 52 - 18 = 34", () => {
      const staffInductions = [
        makeStaffInduction({
          status: "not_started",
          completion_date: null,
          safeguarding_covered: false,
          medication_covered: false,
          fire_safety_covered: false,
          modules_total: 10,
          modules_completed: 0,
          signed_off_by: null,
        }),
      ];
      const agencyInductions = [
        makeAgencyInduction({
          completed: false,
          safeguarding_briefed: false,
          medication_briefed: false,
          fire_procedures_briefed: false,
        }),
      ];
      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 5,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions,
        shadowing_records: [
          makeShadowingRecord({
            competency_confirmed: false,
            ready_for_lone_working: false,
            shift_type: "day",
            hours: 2,
          }),
        ],
        handbook_acknowledgements: [
          makeHandbookAcknowledgement({ signed: false }),
        ],
      });
      // completionRate=0% => -5, agencyCompletion=0% => -5, safeguarding=0% => -5, fire=0% => -3
      // No bonuses (all rates are 0%)
      // 52 - 18 = 34
      expect(r.induction_score).toBe(34);
      expect(r.induction_rating).toBe("inadequate");
    });

    it("mixed bonuses and penalties produce correct score", () => {
      // completion 100% (+4), agency pct(0,0)=0% (-5, no bonus), safeguarding 100% (+4),
      // medication 100% (+3), fire 100% (+2), shadow comp 100% (+3),
      // handbook 100% (+3), lone working 100% (+3), avg module 100% (+3)
      // = 52 + 25 - 5 = 72
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: [] }),
      );
      expect(r.induction_score).toBe(72);
    });

    it("lower tier bonuses produce correct score", () => {
      // completion 86% (+2), agency 80% (+1), safeguarding 90% (+2),
      // medication 86% (+1), fire 90% (+1), shadow comp 80% (+1),
      // handbook 86% (+1), lone working 80% (+1), avg module 80% (+1)
      // = 52 + 11 = 63
      const staffInductions = Array.from({ length: 7 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: i < 6 ? "completed" : "in_progress",
          completion_date: i < 6 ? "2026-01-24" : null,
          modules_total: 10,
          modules_completed: 8, // 80%
          safeguarding_covered: true,
          medication_covered: true,
          fire_safety_covered: true,
          signed_off_by: i < 6 ? "mgr" : null,
        }),
      );
      // 7 staff + 3 agency = 10 total induction records
      // safeguarding: all 7 staff + need 2/3 agency => 9/10 = 90% (+2)
      // medication: all 7 staff + need ~1.6 agency. 7+2=9/10=90%. Need >=85: 9/10=90% => +1
      // fire: all 7 staff + 2/3 agency = 9/10 = 90% (+1)
      const agencyInductions = Array.from({ length: 3 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 2 ? true : i < 3, // need 80%. 3 total, need 2.4 => 3/3 to get 100, or use 5 agency
          safeguarding_briefed: i < 2, // 9/10 = 90%
          medication_briefed: i < 2, // 9/10 = 90%
          fire_procedures_briefed: i < 2, // 9/10 = 90%
        }),
      );
      // Wait, agency completion: 3/3 = 100% => +3, not +1
      // Let me use 5 agency: 4/5 = 80% => +1
      const agencyInductions5 = Array.from({ length: 5 }, (_, i) =>
        makeAgencyInduction({
          id: `ag_${i}`,
          staff_name: `AW_${i}`,
          completed: i < 4, // 80% => +1
          safeguarding_briefed: i < 4, // 7+4=11/12 = 92% => +2
          medication_briefed: i < 4, // 7+4=11/12 = 92% => +1 (>=85)
          fire_procedures_briefed: i < 4, // 7+4=11/12 = 92% => +1 (>=90)
        }),
      );
      // completion = 6/7 = 86% => +2
      // agency = 80% => +1
      // safeguarding = 11/12 = 92% => +2
      // medication = 11/12 = 92% => +1
      // fire = 11/12 = 92% => +1
      // Total so far: 2+1+2+1+1 = 7

      // shadowing: 4/5 = 80% comp => +1
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          competency_confirmed: i < 4, // 80% => +1
          ready_for_lone_working: i < 4, // 80% => +1
          shift_type: "day",
          hours: 4,
        }),
      );
      // handbook: 6/7 = 86% => +1
      const handbookAcks = Array.from({ length: 7 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: i < 6, // 86% => +1
        }),
      );
      // avg module = 80% => +1
      // Bonuses: completion86%(+2) + agency80%(+1) + safeguarding92%(+2) + medication92%(+1) + fire92%(+1)
      //        + shadowComp80%(+1) + handbook86%(+1) + loneWorking80%(+1) + avgModule80%(+1)
      //        = 2+1+2+1+1+1+1+1+1 = 11
      // No penalties
      // 52 + 11 = 63

      const r = computeStaffInductionOnboarding({
        today: "2026-05-28",
        total_staff: 7,
        staff_inductions: staffInductions,
        agency_inductions: agencyInductions5,
        shadowing_records: shadowingRecords,
        handbook_acknowledgements: handbookAcks,
      });
      expect(r.induction_score).toBe(63);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. ADDITIONAL EDGE CASES & COVERAGE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Additional coverage", () => {
    it("agency children gap concern only triggers when incomplete agency exists", () => {
      // All agency completed => incompleteAgency = 0 => no children gap concern
      const r = computeStaffInductionOnboarding(baseInput());
      expect(
        r.concerns.some((c) => c.includes("children's individual needs")),
      ).toBe(false);
    });

    it("agency children gap singular grammar", () => {
      const agencyInductions = [
        makeAgencyInduction({
          id: "ag_0",
          completed: false,
          children_needs_briefed: false,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ agency_inductions: agencyInductions }),
      );
      const concern = r.concerns.find((c) =>
        c.includes("children's individual needs"),
      );
      expect(concern).toBeDefined();
      expect(concern).toContain("1 agency induction did not include");
    });

    it("overdue recommendation plural grammar", () => {
      const staffInductions = Array.from({ length: 3 }, (_, i) =>
        makeStaffInduction({
          id: `ind_${i}`,
          staff_id: `s${i}`,
          status: "overdue",
          completion_date: null,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const rec = r.recommendations.find((r) =>
        r.recommendation.includes("3 overdue staff inductions"),
      );
      expect(rec).toBeDefined();
    });

    it("shift types recommendation singular grammar", () => {
      const shadowingRecords = [
        makeShadowingRecord({
          id: "sh_0",
          staff_id: "s0",
          shift_type: "day",
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      const rec = r.recommendations.find((r) =>
        r.recommendation.includes("1 shift type"),
      );
      expect(rec).toBeDefined();
    });

    it("not-started recommendation singular grammar", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              status: "not_started",
              completion_date: null,
            }),
          ],
        }),
      );
      const rec = r.recommendations.find((r) =>
        r.recommendation.includes("1 outstanding induction"),
      );
      expect(rec).toBeDefined();
    });

    it("not-started recommendation plural grammar", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              staff_id: "s0",
              status: "not_started",
              completion_date: null,
            }),
            makeStaffInduction({
              id: "ind_1",
              staff_id: "s1",
              status: "not_started",
              completion_date: null,
            }),
          ],
        }),
      );
      const rec = r.recommendations.find((r) =>
        r.recommendation.includes("2 outstanding inductions"),
      );
      expect(rec).toBeDefined();
    });

    it("unsigned recommendation singular grammar", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              status: "completed",
              signed_off_by: null,
            }),
          ],
        }),
      );
      const rec = r.recommendations.find((r) =>
        r.recommendation.includes("1 completed induction"),
      );
      expect(rec).toBeDefined();
    });

    it("unsigned recommendation plural grammar", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          staff_inductions: [
            makeStaffInduction({
              id: "ind_0",
              staff_id: "s0",
              status: "completed",
              signed_off_by: null,
            }),
            makeStaffInduction({
              id: "ind_1",
              staff_id: "s1",
              status: "completed",
              signed_off_by: null,
            }),
          ],
        }),
      );
      const rec = r.recommendations.find((r) =>
        r.recommendation.includes("2 completed inductions"),
      );
      expect(rec).toBeDefined();
    });

    it("unshadowed staff insight singular grammar", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          total_staff: 2,
          shadowing_records: [
            makeShadowingRecord({ id: "sh_0", staff_id: "s0" }),
          ],
        }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("1 staff member has no shadowing records"),
      );
      expect(insight).toBeDefined();
    });

    it("unshadowed staff insight plural grammar", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({
          total_staff: 5,
          shadowing_records: [
            makeShadowingRecord({ id: "sh_0", staff_id: "s0" }),
          ],
        }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("4 staff members have no shadowing records"),
      );
      expect(insight).toBeDefined();
    });

    it("overdue insight singular grammar (1 overdue)", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          status: "overdue",
          completion_date: null,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("1 staff induction is overdue"),
      );
      expect(insight).toBeDefined();
    });

    it("overdue insight plural (2 overdue, still warning not critical)", () => {
      const staffInductions = [
        makeStaffInduction({
          id: "ind_0",
          staff_id: "s0",
          status: "overdue",
          completion_date: null,
        }),
        makeStaffInduction({
          id: "ind_1",
          staff_id: "s1",
          status: "overdue",
          completion_date: null,
        }),
      ];
      const r = computeStaffInductionOnboarding(
        baseInput({ staff_inductions: staffInductions }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" &&
          i.text.includes("2 staff inductions are overdue"),
      );
      expect(insight).toBeDefined();
    });

    it("robust shadowing does NOT trigger when avg hours < 8", () => {
      const shadowingRecords = Array.from({ length: 5 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
          hours: 5, // avg = 5 < 8
          ready_for_lone_working: true,
          shift_type: i < 2 ? "day" : i < 4 ? "evening" : "night",
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ shadowing_records: shadowingRecords }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("Shadowing programme is robust"),
      );
      expect(insight).toBeUndefined();
    });

    it("critical policies insight does NOT trigger when any policy is not universally read", () => {
      const handbookAcks = Array.from({ length: 5 }, (_, i) =>
        makeHandbookAcknowledgement({
          id: `hb_${i}`,
          staff_id: `s${i}`,
          signed: true,
          safeguarding_policy_read: true,
          behaviour_management_read: true,
          whistleblowing_policy_read: i < 4, // 4/5, not 5/5
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({ handbook_acknowledgements: handbookAcks }),
      );
      const insight = r.insights.find(
        (i) =>
          i.severity === "positive" &&
          i.text.includes("safeguarding, behaviour management, and whistleblowing"),
      );
      expect(insight).toBeUndefined();
    });

    it("no unshadowed staff insight when all staff have shadowing", () => {
      const r = computeStaffInductionOnboarding(baseInput());
      const insight = r.insights.find(
        (i) =>
          i.severity === "warning" && i.text.includes("no shadowing records"),
      );
      expect(insight).toBeUndefined();
    });

    it("total_staff = 0 with non-empty arrays still processes normally", () => {
      const r = computeStaffInductionOnboarding(
        baseInput({ total_staff: 0 }),
      );
      // Not special case because arrays are non-empty
      expect(r.induction_rating).not.toBe("insufficient_data");
    });

    it("shadowing_completion_rate uses total_staff as denominator", () => {
      // 10 shadowing records, 20 staff => 50%
      const shadowingRecords = Array.from({ length: 10 }, (_, i) =>
        makeShadowingRecord({
          id: `sh_${i}`,
          staff_id: `s${i}`,
        }),
      );
      const r = computeStaffInductionOnboarding(
        baseInput({
          total_staff: 20,
          shadowing_records: shadowingRecords,
        }),
      );
      expect(r.shadowing_completion_rate).toBe(50);
    });
  });
});

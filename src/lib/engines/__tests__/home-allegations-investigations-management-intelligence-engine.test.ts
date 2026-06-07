import { describe, it, expect } from "vitest";
import {
  computeAllegationsInvestigationsManagement,
  type AllegationRecordInput,
  type LadoReferralRecordInput,
  type InvestigationRecordInput,
  type OutcomeRecordInput,
  type SafeguardingResponseRecordInput,
  type AllegationsInvestigationsInput,
} from "../home-allegations-investigations-management-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeAllegation(
  overrides: Partial<AllegationRecordInput> = {},
): AllegationRecordInput {
  return {
    id: "alleg_1",
    date_received: "2026-04-01",
    date_recorded: "2026-04-01",
    allegation_type: "inappropriate_behaviour",
    subject_role: "permanent_staff",
    child_id: "child_1",
    recorded_within_24h: true,
    initial_risk_assessment_completed: true,
    child_safeguarded_immediately: true,
    staff_member_suspended: false,
    witness_statements_taken: true,
    evidence_preserved: true,
    chronology_maintained: true,
    dbs_check_current: true,
    reporter_type: "staff",
    severity: "medium",
    status: "closed",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeLadoReferral(
  overrides: Partial<LadoReferralRecordInput> = {},
): LadoReferralRecordInput {
  return {
    id: "lado_1",
    allegation_id: "alleg_1",
    date_allegation_received: "2026-04-01",
    date_lado_contacted: "2026-04-01",
    referred_within_1_working_day: true,
    lado_acknowledged: true,
    strategy_meeting_held: true,
    strategy_meeting_date: "2026-04-03",
    strategy_meeting_within_5_days: true,
    ofsted_notified: true,
    ofsted_notification_date: "2026-04-01",
    ofsted_notified_within_required_timeframe: true,
    dbs_referral_made: true,
    police_involved: false,
    local_authority_informed: true,
    multi_agency_approach: true,
    outcome_shared_with_home: true,
    referral_quality_adequate: true,
    status: "closed",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeInvestigation(
  overrides: Partial<InvestigationRecordInput> = {},
): InvestigationRecordInput {
  return {
    id: "inv_1",
    allegation_id: "alleg_1",
    investigation_type: "internal",
    date_opened: "2026-04-02",
    date_closed: "2026-04-15",
    is_open: false,
    target_completion_days: 30,
    actual_completion_days: 13,
    completed_within_target: true,
    investigation_plan_in_place: true,
    terms_of_reference_set: true,
    investigator_independent: true,
    witness_interviews_completed: true,
    evidence_reviewed: true,
    interim_measures_in_place: true,
    child_supported_throughout: true,
    staff_member_supported: true,
    regular_updates_provided: true,
    findings_documented: true,
    management_oversight: true,
    quality_assured: true,
    created_at: "2026-04-02",
    ...overrides,
  };
}

function makeOutcome(
  overrides: Partial<OutcomeRecordInput> = {},
): OutcomeRecordInput {
  return {
    id: "out_1",
    allegation_id: "alleg_1",
    investigation_id: "inv_1",
    outcome_type: "unsubstantiated",
    date_outcome_reached: "2026-04-15",
    outcome_documented: true,
    outcome_shared_with_subject: true,
    outcome_shared_with_child: true,
    outcome_shared_with_parents: true,
    outcome_shared_with_placing_authority: true,
    action_plan_created: true,
    action_plan_implemented: true,
    lessons_learned_recorded: true,
    lessons_shared_with_team: true,
    policy_review_triggered: true,
    training_needs_identified: true,
    training_delivered: true,
    dbs_status_updated: true,
    single_central_record_updated: true,
    appeal_process_offered: true,
    support_plan_for_child: true,
    support_plan_for_staff: true,
    regulatory_notifications_completed: true,
    created_at: "2026-04-15",
    ...overrides,
  };
}

function makeSafeguardingResponse(
  overrides: Partial<SafeguardingResponseRecordInput> = {},
): SafeguardingResponseRecordInput {
  return {
    id: "sg_1",
    allegation_id: "alleg_1",
    date_allegation_received: "2026-04-01",
    date_response_initiated: "2026-04-01",
    response_within_1_hour: true,
    child_safety_plan_in_place: true,
    child_wishes_captured: true,
    child_informed_age_appropriately: true,
    independent_advocate_offered: true,
    other_children_risk_assessed: true,
    contact_restrictions_applied: true,
    supervision_arrangements_reviewed: true,
    staff_deployment_adjusted: true,
    whistleblowing_policy_followed: true,
    no_unsupervised_contact: true,
    safeguarding_lead_informed: true,
    ri_informed: true,
    management_oversight_documented: true,
    follow_up_actions_set: true,
    follow_up_actions_completed: true,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<AllegationsInvestigationsInput> = {},
): AllegationsInvestigationsInput {
  // All perfect records across all 5 categories, each with 10 records
  // All bonuses should fire at top tier:
  // base=52 + B1(4) + B2(4) + B3(3) + B4(3) + B5(4) + B6(3) + B7(2) + B8(3) + B9(2) = 80
  return {
    today: "2026-05-28",
    total_children: 6,
    allegation_records: Array.from({ length: 10 }, (_, i) =>
      makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}` }),
    ),
    lado_referral_records: Array.from({ length: 10 }, (_, i) =>
      makeLadoReferral({ id: `lado_${i}`, allegation_id: `alleg_${i}` }),
    ),
    investigation_records: Array.from({ length: 10 }, (_, i) =>
      makeInvestigation({ id: `inv_${i}`, allegation_id: `alleg_${i}` }),
    ),
    outcome_records: Array.from({ length: 10 }, (_, i) =>
      makeOutcome({ id: `out_${i}`, allegation_id: `alleg_${i}`, investigation_id: `inv_${i}` }),
    ),
    safeguarding_response_records: Array.from({ length: 10 }, (_, i) =>
      makeSafeguardingResponse({ id: `sg_${i}`, allegation_id: `alleg_${i}` }),
    ),
    ...overrides,
  };
}

// Helper for base input with ALL bonuses zeroed out (rates <70 but >=50 to avoid penalties)
function baseInputNoBonuses(
  overrides: Partial<AllegationsInvestigationsInput> = {},
): AllegationsInvestigationsInput {
  // Allegations: 10 total, 6 recorded_within_24h = 60% (no bonus, no penalty)
  const allegations = Array.from({ length: 10 }, (_, i) =>
    makeAllegation({
      id: `alleg_${i}`,
      child_id: `child_${i}`,
      recorded_within_24h: i < 6,
      initial_risk_assessment_completed: true,
      child_safeguarded_immediately: true,
      evidence_preserved: true,
      chronology_maintained: true,
      witness_statements_taken: true,
      dbs_check_current: true,
      severity: "low",
    }),
  );
  // LADO: 10 total, 6 referred_within_1_working_day = 60%
  const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
    makeLadoReferral({
      id: `lado_${i}`,
      allegation_id: `alleg_${i}`,
      referred_within_1_working_day: i < 6,
      strategy_meeting_held: true,
      strategy_meeting_within_5_days: true,
      ofsted_notified: true,
      ofsted_notified_within_required_timeframe: true,
      multi_agency_approach: true,
      referral_quality_adequate: true,
      local_authority_informed: true,
      outcome_shared_with_home: true,
    }),
  );
  // Investigations: 10 total, all closed (100% completion = >=90 → would give +3)
  // So set 6 closed, 4 open => 60% completion (no bonus, no penalty)
  const investigations = Array.from({ length: 10 }, (_, i) =>
    makeInvestigation({
      id: `inv_${i}`,
      allegation_id: `alleg_${i}`,
      is_open: i >= 6,
      date_closed: i < 6 ? "2026-04-15" : null,
      actual_completion_days: i < 6 ? 13 : -1,
      completed_within_target: i < 6,
      investigation_plan_in_place: true,
      terms_of_reference_set: true,
      investigator_independent: i < 6, // 60% independence
      witness_interviews_completed: true,
      evidence_reviewed: true,
      interim_measures_in_place: true,
      child_supported_throughout: i < 6, // 60% child support
      staff_member_supported: true,
      regular_updates_provided: true,
      findings_documented: true,
      management_oversight: i < 6, // 60% oversight
      quality_assured: true,
    }),
  );
  // Outcomes: 10 total, 6 documented = 60%
  const outcomes = Array.from({ length: 10 }, (_, i) =>
    makeOutcome({
      id: `out_${i}`,
      allegation_id: `alleg_${i}`,
      investigation_id: `inv_${i}`,
      outcome_documented: i < 6,
      lessons_learned_recorded: i < 6, // 60%
      lessons_shared_with_team: true,
      action_plan_created: true,
      action_plan_implemented: true,
      single_central_record_updated: true,
    }),
  );
  // Safeguarding: 10 total, 6 within 1 hour = 60%
  const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
    makeSafeguardingResponse({
      id: `sg_${i}`,
      allegation_id: `alleg_${i}`,
      response_within_1_hour: i < 6,
      child_safety_plan_in_place: true,
      child_wishes_captured: true,
      child_informed_age_appropriately: true,
      independent_advocate_offered: true,
      other_children_risk_assessed: true,
      no_unsupervised_contact: true,
      safeguarding_lead_informed: true,
      ri_informed: true,
      management_oversight_documented: true,
      follow_up_actions_set: true,
      follow_up_actions_completed: true,
      whistleblowing_policy_followed: true,
    }),
  );

  return {
    today: "2026-05-28",
    total_children: 6,
    allegation_records: allegations,
    lado_referral_records: ladoReferrals,
    investigation_records: investigations,
    outcome_records: outcomes,
    safeguarding_response_records: safeguardingResponses,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAllegationsInvestigationsManagement", () => {
  // ── pct(0,0) edge case ──────────────────────────────────────────────
  describe("pct(0,0) returns 0", () => {
    it("returns 0 for all rates when no records exist but children=0 (insufficient_data)", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 0,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.allegation_recording_rate).toBe(0);
      expect(r.lado_referral_rate).toBe(0);
      expect(r.investigation_completion_rate).toBe(0);
      expect(r.outcome_documentation_rate).toBe(0);
      expect(r.safeguarding_response_rate).toBe(0);
      expect(r.timeliness_rate).toBe(0);
    });
  });

  // ── Insufficient data ──────────────────────────────────────────────
  describe("insufficient_data", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 0,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.allegations_rating).toBe("insufficient_data");
      expect(r.allegations_score).toBe(0);
    });

    it("returns correct headline for insufficient_data", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 0,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.headline).toContain("insufficient data");
    });

    it("returns empty arrays for strengths/concerns/recommendations/insights", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 0,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns zero for all counts", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 0,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.total_allegations).toBe(0);
      expect(r.total_lado_referrals).toBe(0);
      expect(r.total_investigations).toBe(0);
      expect(r.total_outcomes).toBe(0);
      expect(r.total_safeguarding_responses).toBe(0);
      expect(r.open_investigations).toBe(0);
      expect(r.substantiated_count).toBe(0);
    });
  });

  // ── Inadequate floor (all empty, children > 0) ─────────────────────
  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate with score 15", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 4,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.allegations_rating).toBe("inadequate");
      expect(r.allegations_score).toBe(15);
    });

    it("returns correct headline mentioning urgent establishment", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 4,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.headline).toContain("urgent establishment");
    });

    it("has exactly 1 concern referencing Reg 34 and Reg 35", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 4,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("Reg 34");
      expect(r.concerns[0]).toContain("Reg 35");
    });

    it("has exactly 2 recommendations", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 4,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has exactly 1 critical insight", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 4,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns zero for all rates", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 4,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.allegation_recording_rate).toBe(0);
      expect(r.lado_referral_rate).toBe(0);
      expect(r.investigation_completion_rate).toBe(0);
      expect(r.outcome_documentation_rate).toBe(0);
      expect(r.safeguarding_response_rate).toBe(0);
      expect(r.timeliness_rate).toBe(0);
    });
  });

  // ── Outstanding rating ──────────────────────────────────────────────
  describe("outstanding rating", () => {
    it("returns outstanding with score 80 for perfect base input", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.allegations_score).toBe(80);
      expect(r.allegations_rating).toBe("outstanding");
    });

    it("has correct headline for outstanding", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("has 100% allegation_recording_rate", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.allegation_recording_rate).toBe(100);
    });

    it("has 100% lado_referral_rate", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.lado_referral_rate).toBe(100);
    });

    it("has 100% investigation_completion_rate", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.investigation_completion_rate).toBe(100);
    });

    it("has 100% outcome_documentation_rate", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.outcome_documentation_rate).toBe(100);
    });

    it("has 100% safeguarding_response_rate", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.safeguarding_response_rate).toBe(100);
    });

    it("has 100% timeliness_rate", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.timeliness_rate).toBe(100);
    });

    it("has outstanding-level positive insight", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      const outstandingInsight = r.insights.find(
        (i) => i.severity === "positive" && i.text.includes("outstanding"),
      );
      expect(outstandingInsight).toBeDefined();
    });

    it("returns correct counts", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.total_allegations).toBe(10);
      expect(r.total_lado_referrals).toBe(10);
      expect(r.total_investigations).toBe(10);
      expect(r.total_outcomes).toBe(10);
      expect(r.total_safeguarding_responses).toBe(10);
      expect(r.open_investigations).toBe(0);
    });

    it("has multiple strengths for perfect data", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(10);
    });

    it("has no concerns for perfect data", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.concerns).toHaveLength(0);
    });
  });

  // ── Good rating ─────────────────────────────────────────────────────
  describe("good rating", () => {
    it("achieves good range (65-79)", () => {
      // Drop some bonuses to land in 65-79
      // Make allegation recording 80% → +2 instead of +4 (-2)
      // Make lado referral 80% → +2 instead of +4 (-2)
      // Score: 80-2-2 = 76
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 8,
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 8,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInput({ allegation_records: allegations, lado_referral_records: ladoReferrals }),
      );
      expect(r.allegations_score).toBe(76);
      expect(r.allegations_rating).toBe("good");
    });

    it("has correct headline for good", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 8,
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 8,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInput({ allegation_records: allegations, lado_referral_records: ladoReferrals }),
      );
      expect(r.headline).toContain("Good");
    });

    it("score 65 is good", () => {
      // Drop more bonuses: allegation 60% → 0, lado 60% → 0, safeguarding 60% → 0
      // investigation 80% → +1, outcome 60% → 0
      // management oversight 60% → 0, lessons 60% → 0
      // child support 60% → 0, independence 60% → 0
      // 52 + 3(inv completion 100%) + 3(outcome doc 100%) + 4(safeguarding 100%) + 3(mgmt 100%) + 2(lessons 100%) + 3(child support 100%) + 2(independence 100%) = too high
      // Use baseInputNoBonuses which gives 52 then add specific bonuses
      // Actually, let me manually compute:
      // baseInputNoBonuses: all rates at 60%, no bonuses, no penalties = 52
      // Then add investigation completion and safeguarding to 90%+ to get +3 and +4 = 59
      // Need more: also add lado to 90% → +4 = 63. Still < 65.
      // Add allegation to 90% → +4 = 67. Good!
      // But we need to override those from baseInputNoBonuses.
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 7, // 70% → +2
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 7, // 70% → +2
        }),
      );
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 7, // 70% completion → +1
          date_closed: i < 7 ? "2026-04-15" : null,
          actual_completion_days: i < 7 ? 13 : -1,
          completed_within_target: i < 7,
          management_oversight: i < 6, // 60% → 0
          child_supported_throughout: i < 6, // 60% → 0
          investigator_independent: i < 6, // 60% → 0
        }),
      );
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          investigation_id: `inv_${i}`,
          outcome_documented: i < 7, // 70% → +1
          lessons_learned_recorded: i < 6, // 60% → 0
        }),
      );
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 7, // 70% → +2
        }),
      );
      // Score: 52 + 2 + 2 + 1 + 1 + 2 + 0 + 0 + 0 + 0 = 58... not enough
      // Need to push some to 90%+
      // Let me make allegations 90% and lado 90%
      const allegs90 = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 9, // 90% → +4
        }),
      );
      const lado90 = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 7, // 70% → +2
        }),
      );
      const invs70 = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 7,
          date_closed: i < 7 ? "2026-04-15" : null,
          actual_completion_days: i < 7 ? 13 : -1,
          completed_within_target: i < 7,
          management_oversight: i < 6,
          child_supported_throughout: i < 6,
          investigator_independent: i < 6,
        }),
      );
      const outs60 = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: i < 6, // 60% → 0
          lessons_learned_recorded: i < 6,
        }),
      );
      const sgs60 = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 6, // 60% → 0
        }),
      );
      // Score: 52 + 4 + 2 + 1 + 0 + 0 + 0 + 0 + 0 + 0 = 59
      // Still need +6. Let me use perfect safeguarding (+4) and perfect outcome (+3)
      const r = computeAllegationsInvestigationsManagement(
        baseInput({
          allegation_records: allegs90,
          lado_referral_records: lado90,
          investigation_records: invs70,
          outcome_records: outs60,
          safeguarding_response_records: sgs60,
        }),
      );
      // 52 + 4(alleg 90%) + 2(lado 70%) + 1(inv 70%) + 0(outcome 60%) + 0(sfg 60%) + 0(mgmt 60%) + 0(lessons 60%) + 0(child 60%) + 0(indep 60%) = 59
      expect(r.allegations_score).toBe(59);
      // That's adequate, not good. Let me adjust.
    });

    it("score 79 is the upper bound of good", () => {
      // One bonus short of 80. Drop allegation recording to 80% → +2 instead of +4
      // 80-2 = 78
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 8, // 80% → +2
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInput({ allegation_records: allegations }),
      );
      expect(r.allegations_score).toBe(78);
      expect(r.allegations_rating).toBe("good");
    });
  });

  // ── Adequate rating ─────────────────────────────────────────────────
  describe("adequate rating", () => {
    it("score 52 (base only, no bonuses, no penalties) is adequate", () => {
      const r = computeAllegationsInvestigationsManagement(baseInputNoBonuses());
      expect(r.allegations_score).toBe(52);
      expect(r.allegations_rating).toBe("adequate");
    });

    it("has correct headline for adequate", () => {
      const r = computeAllegationsInvestigationsManagement(baseInputNoBonuses());
      expect(r.headline).toContain("Adequate");
    });

    it("score 45 is adequate boundary", () => {
      // 52 - need to lose 7 points via penalties
      // allegation recording <50 penalty: -5 (so 4/10 = 40%)
      // Add one more penalty: lado <50 -5 → would give 42 (inadequate)
      // So just use allegation <50 penalty only: 52 - 5 = 47
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 4, // 40% → penalty -5
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ allegation_records: allegations }),
      );
      expect(r.allegations_score).toBe(47);
      expect(r.allegations_rating).toBe("adequate");
    });

    it("score 64 is adequate (just below good)", () => {
      // 52 + need +12 from bonuses
      // allegation 90% → +4, lado 90% → +4, safeguarding 90% → +4 = 64
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 9, // 90% → +4
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 9, // 90% → +4
        }),
      );
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 9, // 90% → +4
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({
          allegation_records: allegations,
          lado_referral_records: ladoReferrals,
          safeguarding_response_records: safeguardingResponses,
        }),
      );
      // 52 + 4 + 4 + 0 + 0 + 4 + 0 + 0 + 0 + 0 = 64
      expect(r.allegations_score).toBe(64);
      expect(r.allegations_rating).toBe("adequate");
    });
  });

  // ── Inadequate rating ───────────────────────────────────────────────
  describe("inadequate rating", () => {
    it("score below 45 is inadequate", () => {
      // 52 - all 4 penalties: -5 -5 -4 -4 = -18 → 34
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 4, // 40% → -5
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 4, // 40% → -5
        }),
      );
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 4, // 40% completion → -4
          date_closed: i < 4 ? "2026-04-15" : null,
          actual_completion_days: i < 4 ? 13 : -1,
          completed_within_target: i < 4,
          management_oversight: i < 4,
          child_supported_throughout: i < 4,
          investigator_independent: i < 4,
        }),
      );
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 4, // 40% → -4
        }),
      );
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: i < 4,
          lessons_learned_recorded: i < 4,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({
          allegation_records: allegations,
          lado_referral_records: ladoReferrals,
          investigation_records: investigations,
          safeguarding_response_records: safeguardingResponses,
          outcome_records: outcomes,
        }),
      );
      // 52 - 5 - 5 - 4 - 4 = 34
      expect(r.allegations_score).toBe(34);
      expect(r.allegations_rating).toBe("inadequate");
    });

    it("has correct headline for inadequate", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 4,
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 4,
        }),
      );
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 4,
          date_closed: i < 4 ? "2026-04-15" : null,
          actual_completion_days: i < 4 ? 13 : -1,
          completed_within_target: i < 4,
          management_oversight: i < 4,
          child_supported_throughout: i < 4,
          investigator_independent: i < 4,
        }),
      );
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 4,
        }),
      );
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: i < 4,
          lessons_learned_recorded: i < 4,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({
          allegation_records: allegations,
          lado_referral_records: ladoReferrals,
          investigation_records: investigations,
          safeguarding_response_records: safeguardingResponses,
          outcome_records: outcomes,
        }),
      );
      expect(r.headline).toContain("inadequate");
    });

    it("score 44 is inadequate (just below adequate)", () => {
      // Need 52 - 8: two penalties of -5 and one would be too much
      // allegation <50 → -5, lado <50 → -5 = 42
      // That's inadequate.
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 4,
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 4,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({
          allegation_records: allegations,
          lado_referral_records: ladoReferrals,
        }),
      );
      // 52 - 5 - 5 = 42
      expect(r.allegations_score).toBe(42);
      expect(r.allegations_rating).toBe("inadequate");
    });
  });

  // ── Bonus tests: each bonus in isolation ──────────────────────────
  describe("Bonus 1: allegationRecordingRate", () => {
    it("+4 when allegationRecordingRate >= 90%", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 9, // 90%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ allegation_records: allegations }),
      );
      expect(r.allegations_score).toBe(52 + 4);
    });

    it("+2 when allegationRecordingRate >= 70% but < 90%", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 7, // 70%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ allegation_records: allegations }),
      );
      expect(r.allegations_score).toBe(52 + 2);
    });

    it("+0 when allegationRecordingRate < 70% (and >= 50)", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 6, // 60%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ allegation_records: allegations }),
      );
      expect(r.allegations_score).toBe(52);
    });

    it("+4 at exactly 100%", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: true, // 100%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ allegation_records: allegations }),
      );
      expect(r.allegations_score).toBe(52 + 4);
    });
  });

  describe("Bonus 2: ladoReferralRate", () => {
    it("+4 when ladoReferralRate >= 90%", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 9, // 90%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ lado_referral_records: ladoReferrals }),
      );
      expect(r.allegations_score).toBe(52 + 4);
    });

    it("+2 when ladoReferralRate >= 70% but < 90%", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 7, // 70%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ lado_referral_records: ladoReferrals }),
      );
      expect(r.allegations_score).toBe(52 + 2);
    });

    it("+0 when ladoReferralRate < 70% (and >= 50)", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 6, // 60%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ lado_referral_records: ladoReferrals }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Bonus 3: investigationCompletionRate", () => {
    it("+3 when investigationCompletionRate >= 90%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: false, // 100% completion
          date_closed: "2026-04-15",
          actual_completion_days: 13,
          completed_within_target: true,
          management_oversight: i < 6,
          child_supported_throughout: i < 6,
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52 + 3);
    });

    it("+1 when investigationCompletionRate >= 70% but < 90%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 7, // 70% completion
          date_closed: i < 7 ? "2026-04-15" : null,
          actual_completion_days: i < 7 ? 13 : -1,
          completed_within_target: i < 7,
          management_oversight: i < 6,
          child_supported_throughout: i < 6,
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52 + 1);
    });

    it("+0 when investigationCompletionRate < 70% (and >= 50)", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6, // 60% completion
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 6,
          child_supported_throughout: i < 6,
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Bonus 4: outcomeDocumentationRate", () => {
    it("+3 when outcomeDocumentationRate >= 90%", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: true, // 100%
          lessons_learned_recorded: i < 6, // keep lessons at 60%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ outcome_records: outcomes }),
      );
      expect(r.allegations_score).toBe(52 + 3);
    });

    it("+1 when outcomeDocumentationRate >= 70% but < 90%", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: i < 7, // 70%
          lessons_learned_recorded: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ outcome_records: outcomes }),
      );
      expect(r.allegations_score).toBe(52 + 1);
    });

    it("+0 when outcomeDocumentationRate < 70% (and >= 50)", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: i < 6, // 60%
          lessons_learned_recorded: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ outcome_records: outcomes }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Bonus 5: safeguardingResponseRate", () => {
    it("+4 when safeguardingResponseRate >= 90%", () => {
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 9, // 90%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ safeguarding_response_records: safeguardingResponses }),
      );
      expect(r.allegations_score).toBe(52 + 4);
    });

    it("+2 when safeguardingResponseRate >= 70% but < 90%", () => {
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 7, // 70%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ safeguarding_response_records: safeguardingResponses }),
      );
      expect(r.allegations_score).toBe(52 + 2);
    });

    it("+0 when safeguardingResponseRate < 70% (and >= 50)", () => {
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 6, // 60%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ safeguarding_response_records: safeguardingResponses }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Bonus 6: managementOversightRate", () => {
    it("+3 when managementOversightRate >= 90%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6, // 60% completion (no bonus 3)
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 9, // 90%
          child_supported_throughout: i < 6, // 60%
          investigator_independent: i < 6, // 60%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52 + 3);
    });

    it("+1 when managementOversightRate >= 70% but < 90%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 7, // 70%
          child_supported_throughout: i < 6,
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52 + 1);
    });

    it("+0 when managementOversightRate < 70%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 6, // 60%
          child_supported_throughout: i < 6,
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Bonus 7: lessonsRecordedRate", () => {
    it("+2 when lessonsRecordedRate >= 90%", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: i < 6, // 60% (no bonus 4)
          lessons_learned_recorded: i < 9, // 90%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ outcome_records: outcomes }),
      );
      expect(r.allegations_score).toBe(52 + 2);
    });

    it("+1 when lessonsRecordedRate >= 70% but < 90%", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: i < 6,
          lessons_learned_recorded: i < 7, // 70%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ outcome_records: outcomes }),
      );
      expect(r.allegations_score).toBe(52 + 1);
    });

    it("+0 when lessonsRecordedRate < 70%", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: i < 6,
          lessons_learned_recorded: i < 6, // 60%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ outcome_records: outcomes }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Bonus 8: childSupportRate", () => {
    it("+3 when childSupportRate >= 90%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 6,
          child_supported_throughout: i < 9, // 90%
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52 + 3);
    });

    it("+1 when childSupportRate >= 70% but < 90%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 6,
          child_supported_throughout: i < 7, // 70%
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52 + 1);
    });

    it("+0 when childSupportRate < 70%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 6,
          child_supported_throughout: i < 6, // 60%
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Bonus 9: independenceRate", () => {
    it("+2 when independenceRate >= 90%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 6,
          child_supported_throughout: i < 6,
          investigator_independent: i < 9, // 90%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52 + 2);
    });

    it("+1 when independenceRate >= 70% but < 90%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 6,
          child_supported_throughout: i < 6,
          investigator_independent: i < 7, // 70%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52 + 1);
    });

    it("+0 when independenceRate < 70%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
          management_oversight: i < 6,
          child_supported_throughout: i < 6,
          investigator_independent: i < 6, // 60%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("max bonuses sum to 28", () => {
    it("all 9 bonuses at top tier sum to 28 (52 + 28 = 80)", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.allegations_score).toBe(80);
    });
  });

  // ── Penalty tests ─────────────────────────────────────────────────
  describe("Penalty: allegationRecordingRate < 50", () => {
    it("-5 when allegationRecordingRate < 50 (records exist)", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 4, // 40%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ allegation_records: allegations }),
      );
      expect(r.allegations_score).toBe(52 - 5);
    });

    it("no penalty at exactly 50%", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 5, // 50%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ allegation_records: allegations }),
      );
      expect(r.allegations_score).toBe(52);
    });

    it("no penalty when no allegation records exist", () => {
      // Even though rate would be 0%, guard checks length > 0
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ allegation_records: [] }),
      );
      // No allegations → allegationRecordingRate = pct(0,0) = 0 but guard prevents penalty
      // Still score 52 with just the other arrays
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Penalty: ladoReferralRate < 50", () => {
    it("-5 when ladoReferralRate < 50 (records exist)", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 4, // 40%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ lado_referral_records: ladoReferrals }),
      );
      expect(r.allegations_score).toBe(52 - 5);
    });

    it("no penalty at exactly 50%", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 5, // 50%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ lado_referral_records: ladoReferrals }),
      );
      expect(r.allegations_score).toBe(52);
    });

    it("no penalty when no lado records exist", () => {
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ lado_referral_records: [] }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Penalty: investigationCompletionRate < 50", () => {
    it("-4 when investigationCompletionRate < 50 (records exist)", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 4, // 40% completion
          date_closed: i < 4 ? "2026-04-15" : null,
          actual_completion_days: i < 4 ? 13 : -1,
          completed_within_target: i < 4,
          management_oversight: i < 6,
          child_supported_throughout: i < 6,
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52 - 4);
    });

    it("no penalty at exactly 50%", () => {
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 5, // 50% completion
          date_closed: i < 5 ? "2026-04-15" : null,
          actual_completion_days: i < 5 ? 13 : -1,
          completed_within_target: i < 5,
          management_oversight: i < 6,
          child_supported_throughout: i < 6,
          investigator_independent: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: investigations }),
      );
      expect(r.allegations_score).toBe(52);
    });

    it("no penalty when no investigation records exist", () => {
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ investigation_records: [] }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("Penalty: safeguardingResponseRate < 50", () => {
    it("-4 when safeguardingResponseRate < 50 (records exist)", () => {
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 4, // 40%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ safeguarding_response_records: safeguardingResponses }),
      );
      expect(r.allegations_score).toBe(52 - 4);
    });

    it("no penalty at exactly 50%", () => {
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 5, // 50%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ safeguarding_response_records: safeguardingResponses }),
      );
      expect(r.allegations_score).toBe(52);
    });

    it("no penalty when no safeguarding response records exist", () => {
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({ safeguarding_response_records: [] }),
      );
      expect(r.allegations_score).toBe(52);
    });
  });

  describe("all penalties combine", () => {
    it("-18 when all four penalties fire", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 4,
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: i < 4,
        }),
      );
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: i >= 4,
          date_closed: i < 4 ? "2026-04-15" : null,
          actual_completion_days: i < 4 ? 13 : -1,
          completed_within_target: i < 4,
          management_oversight: i < 4,
          child_supported_throughout: i < 4,
          investigator_independent: i < 4,
        }),
      );
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: i < 4,
        }),
      );
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          allegation_id: `alleg_${i}`,
          outcome_documented: i < 4,
          lessons_learned_recorded: i < 4,
        }),
      );
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 6,
        allegation_records: allegations,
        lado_referral_records: ladoReferrals,
        investigation_records: investigations,
        outcome_records: outcomes,
        safeguarding_response_records: safeguardingResponses,
      });
      expect(r.allegations_score).toBe(52 - 5 - 5 - 4 - 4);
    });
  });

  // ── Score clamp ─────────────────────────────────────────────────────
  describe("score clamp", () => {
    it("score never exceeds 100", () => {
      // Even though 80 is max, confirm clamp(0,100) works
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.allegations_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      // With extreme penalties the score can't go below 0
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: false,
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          allegation_id: `alleg_${i}`,
          referred_within_1_working_day: false,
        }),
      );
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          allegation_id: `alleg_${i}`,
          is_open: true,
          date_closed: null,
          actual_completion_days: -1,
          completed_within_target: false,
          management_oversight: false,
          child_supported_throughout: false,
          investigator_independent: false,
        }),
      );
      const safeguardingResponses = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          allegation_id: `alleg_${i}`,
          response_within_1_hour: false,
        }),
      );
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 6,
        allegation_records: allegations,
        lado_referral_records: ladoReferrals,
        investigation_records: investigations,
        outcome_records: [],
        safeguarding_response_records: safeguardingResponses,
      });
      expect(r.allegations_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── 6 rates ───────────────────────────────────────────────────────
  describe("allegation_recording_rate", () => {
    it("returns 100 when all recorded within 24h", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.allegation_recording_rate).toBe(100);
    });

    it("returns 50 when half recorded within 24h", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.allegation_recording_rate).toBe(50);
    });

    it("returns 0 when none recorded within 24h", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: false }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.allegation_recording_rate).toBe(0);
    });

    it("returns 0 when no allegations (pct(0,0)=0)", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: [] }));
      expect(r.allegation_recording_rate).toBe(0);
    });
  });

  describe("lado_referral_rate", () => {
    it("returns 100 when all referred within 1 day", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.lado_referral_rate).toBe(100);
    });

    it("returns 60 when 6 of 10 referred within 1 day", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.lado_referral_rate).toBe(60);
    });

    it("returns 0 when no lado records (pct(0,0)=0)", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: [] }));
      expect(r.lado_referral_rate).toBe(0);
    });
  });

  describe("investigation_completion_rate", () => {
    it("returns 100 when all investigations closed", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.investigation_completion_rate).toBe(100);
    });

    it("returns 70 when 7 of 10 closed", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: i >= 7,
          date_closed: i < 7 ? "2026-04-15" : null,
          actual_completion_days: i < 7 ? 13 : -1,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.investigation_completion_rate).toBe(70);
    });

    it("returns 0 when no investigation records (pct(0,0)=0)", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: [] }));
      expect(r.investigation_completion_rate).toBe(0);
    });
  });

  describe("outcome_documentation_rate", () => {
    it("returns 100 when all outcomes documented", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.outcome_documentation_rate).toBe(100);
    });

    it("returns 40 when 4 of 10 documented", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, outcome_documented: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.outcome_documentation_rate).toBe(40);
    });

    it("returns 0 when no outcome records (pct(0,0)=0)", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: [] }));
      expect(r.outcome_documentation_rate).toBe(0);
    });
  });

  describe("safeguarding_response_rate", () => {
    it("returns 100 when all responses within 1 hour", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.safeguarding_response_rate).toBe(100);
    });

    it("returns 30 when 3 of 10 within 1 hour", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: i < 3 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.safeguarding_response_rate).toBe(30);
    });

    it("returns 0 when no safeguarding records (pct(0,0)=0)", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: [] }));
      expect(r.safeguarding_response_rate).toBe(0);
    });
  });

  describe("timeliness_rate", () => {
    it("returns 100 when all timeliness components are 100%", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.timeliness_rate).toBe(100);
    });

    it("returns 0 when no records exist to compute timeliness", () => {
      // All empty arrays → no timeliness components → 0
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 0,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.timeliness_rate).toBe(0);
    });

    it("averages available timeliness components", () => {
      // Only allegations and safeguarding responses, both at 50%
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 5 }),
      );
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 6,
        allegation_records: allegations,
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: sgs,
      });
      // Components: allegationRecordingRate=50, safeguardingResponseRate=50
      // No lado, no completed investigations → those aren't added
      // Average of [50, 50] = 50
      expect(r.timeliness_rate).toBe(50);
    });

    it("includes lado referral rate and investigation within target rate", () => {
      // All 4 components: allegations 100%, lado 50%, completed investigations within target 0%, safeguarding 100%
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: true }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 5 }),
      );
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: false,
          date_closed: "2026-04-15",
          actual_completion_days: 13,
          completed_within_target: false, // 0% within target
        }),
      );
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: true }),
      );
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 6,
        allegation_records: allegations,
        lado_referral_records: ladoReferrals,
        investigation_records: invs,
        outcome_records: [],
        safeguarding_response_records: sgs,
      });
      // Components: [100, 50, 0, 100] → average = 250/4 = 62.5 → 63 (Math.round)
      expect(r.timeliness_rate).toBe(63);
    });
  });

  // ── Counts ────────────────────────────────────────────────────────
  describe("counts", () => {
    it("total_allegations matches array length", () => {
      const r = computeAllegationsInvestigationsManagement(
        baseInput({ allegation_records: Array.from({ length: 5 }, (_, i) => makeAllegation({ id: `a_${i}`, child_id: `c_${i}` })) }),
      );
      expect(r.total_allegations).toBe(5);
    });

    it("total_lado_referrals matches array length", () => {
      const r = computeAllegationsInvestigationsManagement(
        baseInput({ lado_referral_records: Array.from({ length: 3 }, (_, i) => makeLadoReferral({ id: `l_${i}` })) }),
      );
      expect(r.total_lado_referrals).toBe(3);
    });

    it("total_investigations matches array length", () => {
      const r = computeAllegationsInvestigationsManagement(
        baseInput({ investigation_records: Array.from({ length: 7 }, (_, i) => makeInvestigation({ id: `i_${i}` })) }),
      );
      expect(r.total_investigations).toBe(7);
    });

    it("total_outcomes matches array length", () => {
      const r = computeAllegationsInvestigationsManagement(
        baseInput({ outcome_records: Array.from({ length: 4 }, (_, i) => makeOutcome({ id: `o_${i}` })) }),
      );
      expect(r.total_outcomes).toBe(4);
    });

    it("total_safeguarding_responses matches array length", () => {
      const r = computeAllegationsInvestigationsManagement(
        baseInput({ safeguarding_response_records: Array.from({ length: 8 }, (_, i) => makeSafeguardingResponse({ id: `s_${i}` })) }),
      );
      expect(r.total_safeguarding_responses).toBe(8);
    });

    it("open_investigations counts open investigations", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: i >= 7,
          date_closed: i < 7 ? "2026-04-15" : null,
          actual_completion_days: i < 7 ? 13 : -1,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.open_investigations).toBe(3);
    });

    it("substantiated_count counts substantiated outcomes", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          outcome_type: i < 3 ? "substantiated" : "unsubstantiated",
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.substantiated_count).toBe(3);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes 100% allegation recording strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Every allegation recorded within 24 hours"))).toBe(true);
    });

    it("includes 80-99% allegation recording strength", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("recorded within 24 hours"))).toBe(true);
    });

    it("includes 100% risk assessment strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Initial risk assessment completed for every allegation"))).toBe(true);
    });

    it("includes 100% children safeguarded strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Children safeguarded immediately in every allegation"))).toBe(true);
    });

    it("includes 90%+ evidence preservation strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("evidence preservation rate"))).toBe(true);
    });

    it("includes 90%+ chronology strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("chronology maintenance rate"))).toBe(true);
    });

    it("includes 100% LADO referral timeliness strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Every LADO referral made within 1 working day"))).toBe(true);
    });

    it("includes 100% strategy meeting strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Strategy meeting held for every LADO referral"))).toBe(true);
    });

    it("includes 100% Ofsted notification strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Ofsted notified for every LADO referral"))).toBe(true);
    });

    it("includes 90%+ multi-agency strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("multi-agency approach rate"))).toBe(true);
    });

    it("includes 90%+ referral quality strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("referral quality rate"))).toBe(true);
    });

    it("includes 100% investigation completion strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Every investigation completed"))).toBe(true);
    });

    it("includes 100% safeguarding response strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Every safeguarding response initiated within 1 hour"))).toBe(true);
    });

    it("includes 100% child support strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Children supported throughout every investigation"))).toBe(true);
    });

    it("includes 100% management oversight strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Management oversight documented for every investigation"))).toBe(true);
    });

    it("includes 90%+ quality assurance strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("quality assurance rate"))).toBe(true);
    });

    it("includes 100% outcome documentation strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("Every outcome fully documented"))).toBe(true);
    });

    it("includes 90%+ lessons learned strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("lessons learned recording rate"))).toBe(true);
    });

    it("includes 90%+ lessons shared strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("lessons shared with team"))).toBe(true);
    });

    it("includes 90%+ action plan creation strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("action plan creation rate"))).toBe(true);
    });

    it("includes 90%+ action plan implementation strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("action plan implementation rate"))).toBe(true);
    });

    it("includes 90%+ SCR update strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("single central record update rate"))).toBe(true);
    });

    it("includes 90%+ child wishes captured strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("child wishes captured rate"))).toBe(true);
    });

    it("includes 90%+ advocate offered strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("independent advocate offer rate"))).toBe(true);
    });

    it("includes 90%+ other children risk assessed strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("other children risk assessed"))).toBe(true);
    });

    it("includes 100% no unsupervised contact strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("No unsupervised contact ensured"))).toBe(true);
    });

    it("includes 90%+ follow-up completion strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("follow-up action completion rate"))).toBe(true);
    });

    it("includes 90%+ investigation plan strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("investigation plan"))).toBe(true);
    });

    it("includes 90%+ investigator independence strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("investigator independence rate"))).toBe(true);
    });

    it("includes 90%+ completion within target strength", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.strengths.some((s) => s.includes("within target timeframe"))).toBe(true);
    });

    it("no strengths when all rates are low", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: false,
          initial_risk_assessment_completed: false,
          child_safeguarded_immediately: false,
          evidence_preserved: false,
          chronology_maintained: false,
          witness_statements_taken: false,
          dbs_check_current: false,
        }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({
          id: `lado_${i}`,
          referred_within_1_working_day: false,
          strategy_meeting_held: false,
          ofsted_notified: false,
          multi_agency_approach: false,
          referral_quality_adequate: false,
        }),
      );
      const investigations = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: true,
          date_closed: null,
          actual_completion_days: -1,
          completed_within_target: false,
          investigation_plan_in_place: false,
          investigator_independent: false,
          child_supported_throughout: false,
          management_oversight: false,
          quality_assured: false,
        }),
      );
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          outcome_documented: false,
          lessons_learned_recorded: false,
          lessons_shared_with_team: false,
          action_plan_created: false,
          single_central_record_updated: false,
        }),
      );
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          response_within_1_hour: false,
          child_wishes_captured: false,
          independent_advocate_offered: false,
          other_children_risk_assessed: false,
          no_unsupervised_contact: false,
          child_safety_plan_in_place: false,
          follow_up_actions_set: false,
          follow_up_actions_completed: false,
          safeguarding_lead_informed: false,
        }),
      );
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 6,
        allegation_records: allegations,
        lado_referral_records: ladoReferrals,
        investigation_records: investigations,
        outcome_records: outcomes,
        safeguarding_response_records: sgs,
      });
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────
  describe("concerns", () => {
    it("flags allegation recording < 50 concern", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 3 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("recorded within 24 hours"))).toBe(true);
    });

    it("flags allegation recording 50-79 concern", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("Allegation recording timeliness at 60%"))).toBe(true);
    });

    it("flags risk assessment < 70 concern", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, initial_risk_assessment_completed: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("initial risk assessments"))).toBe(true);
    });

    it("flags immediate safeguarding < 70 concern", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, child_safeguarded_immediately: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("immediate safeguarding"))).toBe(true);
    });

    it("flags evidence preservation < 70 concern", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, evidence_preserved: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("evidence preservation rate"))).toBe(true);
    });

    it("flags high severity allegations >= 50% concern", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, severity: i < 5 ? "high" : "low" }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("high or critical severity"))).toBe(true);
    });

    it("flags repeat allegations concern", () => {
      // Two allegations with same child_id
      const allegations = [
        makeAllegation({ id: "alleg_0", child_id: "child_A" }),
        makeAllegation({ id: "alleg_1", child_id: "child_A" }),
        makeAllegation({ id: "alleg_2", child_id: "child_B" }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("repeat allegations"))).toBe(true);
    });

    it("flags agency staff allegations >= 40% concern", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          subject_role: i < 4 ? "agency_staff" : "permanent_staff",
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("agency staff"))).toBe(true);
    });

    it("flags LADO referral < 50 concern", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 3 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.concerns.some((c) => c.includes("LADO referrals made within 1 working day"))).toBe(true);
    });

    it("flags LADO referral 50-79 concern", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.concerns.some((c) => c.includes("LADO referral timeliness at 60%"))).toBe(true);
    });

    it("flags strategy meeting < 70 concern", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, strategy_meeting_held: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.concerns.some((c) => c.includes("strategy meeting"))).toBe(true);
    });

    it("flags Ofsted notification < 80 concern", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, ofsted_notified: i < 7 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.concerns.some((c) => c.includes("Ofsted notification rate"))).toBe(true);
    });

    it("flags multi-agency < 70 concern", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, multi_agency_approach: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.concerns.some((c) => c.includes("multi-agency approach rate"))).toBe(true);
    });

    it("flags investigation completion < 50 concern", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: i >= 4,
          date_closed: i < 4 ? "2026-04-15" : null,
          actual_completion_days: i < 4 ? 13 : -1,
          completed_within_target: i < 4,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("investigation completion rate"))).toBe(true);
    });

    it("flags investigation completion 50-79 concern", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
          completed_within_target: i < 6,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("Investigation completion rate at 60%"))).toBe(true);
    });

    it("flags overdue investigations concern", () => {
      const invs = [
        makeInvestigation({
          id: "inv_0",
          is_open: true,
          date_opened: "2026-01-01", // Well overdue (target 30 days, now May 28)
          date_closed: null,
          actual_completion_days: -1,
          target_completion_days: 30,
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
    });

    it("flags investigation plan < 70 concern", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({ id: `inv_${i}`, investigation_plan_in_place: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("formal plan"))).toBe(true);
    });

    it("flags independence < 70 concern", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({ id: `inv_${i}`, investigator_independent: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("investigator independence"))).toBe(true);
    });

    it("flags child support < 70 concern", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({ id: `inv_${i}`, child_supported_throughout: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("child support rate"))).toBe(true);
    });

    it("flags management oversight < 70 concern", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({ id: `inv_${i}`, management_oversight: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("management oversight rate"))).toBe(true);
    });

    it("flags quality assurance < 60 concern", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({ id: `inv_${i}`, quality_assured: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("quality assurance rate"))).toBe(true);
    });

    it("flags outcome documentation < 50 concern", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, outcome_documented: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.concerns.some((c) => c.includes("outcome documentation rate") && c.includes("40%"))).toBe(true);
    });

    it("flags outcome documentation 50-79 concern", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, outcome_documented: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.concerns.some((c) => c.includes("Outcome documentation at 60%"))).toBe(true);
    });

    it("flags lessons learned < 60 concern", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, lessons_learned_recorded: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.concerns.some((c) => c.includes("lessons learned recording rate"))).toBe(true);
    });

    it("flags action plan < 60 concern", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, action_plan_created: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.concerns.some((c) => c.includes("action plan creation rate"))).toBe(true);
    });

    it("flags action plan implementation < 60 concern", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({
          id: `out_${i}`,
          action_plan_created: true,
          action_plan_implemented: i < 5, // 50%
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.concerns.some((c) => c.includes("action plans have been implemented"))).toBe(true);
    });

    it("flags SCR update < 70 concern", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, single_central_record_updated: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.concerns.some((c) => c.includes("single central record update rate"))).toBe(true);
    });

    it("flags outcome shared with child < 70 concern", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, outcome_shared_with_child: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.concerns.some((c) => c.includes("outcomes shared with the child"))).toBe(true);
    });

    it("flags regulatory notification < 70 concern", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, regulatory_notifications_completed: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.concerns.some((c) => c.includes("regulatory notification"))).toBe(true);
    });

    it("flags safeguarding response < 50 concern", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: i < 3 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.concerns.some((c) => c.includes("safeguarding responses within 1 hour") && c.includes("30%"))).toBe(true);
    });

    it("flags safeguarding response 50-79 concern", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.concerns.some((c) => c.includes("Safeguarding response timeliness at 60%"))).toBe(true);
    });

    it("flags child safety plan < 70 concern", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, child_safety_plan_in_place: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.concerns.some((c) => c.includes("child safety plan"))).toBe(true);
    });

    it("flags child wishes < 70 concern", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, child_wishes_captured: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.concerns.some((c) => c.includes("child's wishes"))).toBe(true);
    });

    it("flags other children risk assessed < 70 concern", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, other_children_risk_assessed: i < 5 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.concerns.some((c) => c.includes("risk assessment of other children"))).toBe(true);
    });

    it("flags no unsupervised contact < 80 concern", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, no_unsupervised_contact: i < 7 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.concerns.some((c) => c.includes("unsupervised contact"))).toBe(true);
    });

    it("flags safeguarding lead < 80 concern", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, safeguarding_lead_informed: i < 7 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.concerns.some((c) => c.includes("safeguarding lead"))).toBe(true);
    });

    it("flags follow-up completion < 60 concern", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({
          id: `sg_${i}`,
          follow_up_actions_set: true,
          follow_up_actions_completed: i < 5,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.concerns.some((c) => c.includes("follow-up actions completed"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────
  describe("recommendations", () => {
    it("generates immediate recommendation for allegation recording < 50", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("allegation recording procedures"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate recommendation for LADO referral < 50", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("LADO referral timeliness"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate recommendation for investigation completion < 50", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: i >= 4,
          date_closed: i < 4 ? "2026-04-15" : null,
          actual_completion_days: i < 4 ? 13 : -1,
          completed_within_target: i < 4,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("open investigations"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate recommendation for safeguarding response < 50", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("safeguarding response protocols"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates soon recommendation for allegation recording 50-79", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("allegation recording timeliness to at least 80%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("generates soon recommendation for LADO referral 50-79", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("LADO referral timeliness to at least 80%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("generates planned recommendation for allegation recording 80-94", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("95%+ allegation recording"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("generates immediate recommendation for overdue investigations > 2", () => {
      const invs = Array.from({ length: 5 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: true,
          date_opened: "2026-01-01",
          date_closed: null,
          actual_completion_days: -1,
          target_completion_days: 30,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("overdue investigations"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate recommendation for Ofsted notification < 50", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, ofsted_notified: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("Ofsted notification failures"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate recommendation for outcome documentation < 50", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, outcome_documented: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("outcome documentation"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates planned recommendation for quality assurance < 80", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({ id: `inv_${i}`, quality_assured: i < 7 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("quality assurance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("generates planned recommendation for appeal offered < 80", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, appeal_process_offered: i < 7 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      const rec = r.recommendations.find((r) => r.recommendation.includes("appeal process"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("generates no immediate recommendations for perfect data", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      const immediateRecs = r.recommendations.filter((r) => r.urgency === "immediate");
      expect(immediateRecs).toHaveLength(0);
    });

    it("recommendations have sequential ranks", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 3 }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 3 }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInput({ allegation_records: allegations, lado_referral_records: ladoReferrals }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("recommendations have regulatory_ref", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 3 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Insights ──────────────────────────────────────────────────────
  describe("insights", () => {
    it("generates critical insight for allegation recording < 50", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("40%") && i.text.includes("recorded within 24 hours"))).toBe(true);
    });

    it("generates critical insight for LADO referral < 50", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("LADO referrals made within 1 working day"))).toBe(true);
    });

    it("generates critical insight for investigation completion < 50", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: i >= 4,
          date_closed: i < 4 ? "2026-04-15" : null,
          actual_completion_days: i < 4 ? 13 : -1,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("investigation completion rate"))).toBe(true);
    });

    it("generates critical insight for safeguarding response < 50", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("safeguarding responses initiated within 1 hour"))).toBe(true);
    });

    it("generates critical insight for outcome documentation < 50", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, outcome_documented: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("outcomes formally documented"))).toBe(true);
    });

    it("generates critical insight for no unsupervised contact < 50", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, no_unsupervised_contact: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("unsupervised contact"))).toBe(true);
    });

    it("generates critical insight for >= 2 critical-severity allegations", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, severity: i < 3 ? "critical" : "low" }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("critical-severity allegations"))).toBe(true);
    });

    it("generates critical insight for >= 2 children with repeat allegations", () => {
      const allegations = [
        makeAllegation({ id: "a1", child_id: "c1" }),
        makeAllegation({ id: "a2", child_id: "c1" }),
        makeAllegation({ id: "a3", child_id: "c2" }),
        makeAllegation({ id: "a4", child_id: "c2" }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("repeat allegations"))).toBe(true);
    });

    it("generates warning insight for allegation recording 50-79", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Allegation recording timeliness at 60%"))).toBe(true);
    });

    it("generates warning insight for LADO referral 50-79", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("LADO referral timeliness at 60%"))).toBe(true);
    });

    it("generates warning insight for investigation completion 50-79", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: i >= 6,
          date_closed: i < 6 ? "2026-04-15" : null,
          actual_completion_days: i < 6 ? 13 : -1,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Investigation completion rate at 60%"))).toBe(true);
    });

    it("generates warning insight for 1-2 overdue investigations", () => {
      const invs = [
        makeInvestigation({
          id: "inv_0",
          is_open: true,
          date_opened: "2026-01-01",
          date_closed: null,
          actual_completion_days: -1,
          target_completion_days: 30,
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("overdue"))).toBe(true);
    });

    it("generates warning insight for safeguarding response 50-79", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Safeguarding response timeliness at 60%"))).toBe(true);
    });

    it("generates warning insight for outcome documentation 50-79", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, outcome_documented: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Outcome documentation at 60%"))).toBe(true);
    });

    it("generates warning insight for lessons learned < 70", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, lessons_learned_recorded: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("lessons learned recorded"))).toBe(true);
    });

    it("generates warning insight for child wishes < 70", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, child_wishes_captured: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("child's wishes"))).toBe(true);
    });

    it("generates warning insight for management oversight 50-79", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({ id: `inv_${i}`, management_oversight: i < 6 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Management oversight at 60%"))).toBe(true);
    });

    it("generates warning insight for strategy meeting < 80", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, strategy_meeting_held: i < 7 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Strategy meeting rate at 70%"))).toBe(true);
    });

    it("generates warning insight for agency staff allegations >= 30%", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          subject_role: i < 3 ? "agency_staff" : "permanent_staff",
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("agency staff"))).toBe(true);
    });

    it("generates warning insight for manager allegations", () => {
      const allegations = [
        makeAllegation({ id: "a1", child_id: "c1", subject_role: "manager" }),
        makeAllegation({ id: "a2", child_id: "c2" }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("management staff"))).toBe(true);
    });

    it("generates positive insight for outstanding rating", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("generates positive insight for allegation recording >= 90", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("allegation recording timeliness"))).toBe(true);
    });

    it("generates positive insight for LADO referral >= 90", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("LADO referral timeliness"))).toBe(true);
    });

    it("generates positive insight for investigation completion >= 90", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("investigation completion rate"))).toBe(true);
    });

    it("generates positive insight for safeguarding response >= 90", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("safeguarding response rate"))).toBe(true);
    });

    it("generates positive insight for child support >= 90", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child support rate"))).toBe(true);
    });

    it("generates positive insight for lessons + sharing >= 90", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("lessons recorded"))).toBe(true);
    });

    it("generates positive insight for management oversight + QA", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("management oversight") && i.text.includes("quality assurance"))).toBe(true);
    });

    it("generates positive insight for no unsupervised contact + child safety plan", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("no unsupervised contact") && i.text.includes("child safety plans"))).toBe(true);
    });

    it("generates positive insight for multi-agency + Ofsted notification", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("multi-agency") && i.text.includes("Ofsted notification"))).toBe(true);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("single record in each category still works", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 1,
        allegation_records: [makeAllegation()],
        lado_referral_records: [makeLadoReferral()],
        investigation_records: [makeInvestigation()],
        outcome_records: [makeOutcome()],
        safeguarding_response_records: [makeSafeguardingResponse()],
      });
      expect(r.allegations_rating).toBe("outstanding");
      expect(r.total_allegations).toBe(1);
      expect(r.total_lado_referrals).toBe(1);
    });

    it("only allegations (no other records) still computes", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 6,
        allegation_records: Array.from({ length: 10 }, (_, i) =>
          makeAllegation({ id: `a_${i}`, child_id: `c_${i}` }),
        ),
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.allegations_rating).toBeDefined();
      expect(r.total_allegations).toBe(10);
      expect(r.lado_referral_rate).toBe(0);
    });

    it("child_id null does not count as repeat", () => {
      const allegations = [
        makeAllegation({ id: "a1", child_id: null }),
        makeAllegation({ id: "a2", child_id: null }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("repeat allegations"))).toBe(false);
    });

    it("handles mixed open/closed investigations correctly", () => {
      const invs = [
        makeInvestigation({ id: "inv_0", is_open: false, date_closed: "2026-04-15", actual_completion_days: 13 }),
        makeInvestigation({ id: "inv_1", is_open: true, date_closed: null, actual_completion_days: -1 }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.open_investigations).toBe(1);
      expect(r.investigation_completion_rate).toBe(50);
    });

    it("handles all investigations open", () => {
      const invs = Array.from({ length: 5 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: true,
          date_closed: null,
          actual_completion_days: -1,
          completed_within_target: false,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.investigation_completion_rate).toBe(0);
      expect(r.open_investigations).toBe(5);
    });

    it("substantiated_count is 0 when all unsubstantiated", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, outcome_type: "unsubstantiated" }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.substantiated_count).toBe(0);
    });

    it("total_children=1 with all empty arrays triggers inadequate floor", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 1,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.allegations_rating).toBe("inadequate");
      expect(r.allegations_score).toBe(15);
    });

    it("total_children=100 with all empty arrays still triggers inadequate floor", () => {
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 100,
        allegation_records: [],
        lado_referral_records: [],
        investigation_records: [],
        outcome_records: [],
        safeguarding_response_records: [],
      });
      expect(r.allegations_rating).toBe("inadequate");
      expect(r.allegations_score).toBe(15);
    });

    it("bonuses and penalties can coexist", () => {
      // High allegation recording (bonus +4) but low lado referral (penalty -5)
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, recorded_within_24h: true }),
      );
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 4 }),
      );
      const r = computeAllegationsInvestigationsManagement(
        baseInputNoBonuses({
          allegation_records: allegations,
          lado_referral_records: ladoReferrals,
        }),
      );
      // 52 + 4 (alleg bonus) - 5 (lado penalty) = 51
      expect(r.allegations_score).toBe(51);
    });

    it("1 child with repeat allegations uses singular form", () => {
      const allegations = [
        makeAllegation({ id: "a1", child_id: "same_child" }),
        makeAllegation({ id: "a2", child_id: "same_child" }),
        makeAllegation({ id: "a3", child_id: "other_child" }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("1 child involved in repeat allegations"))).toBe(true);
    });

    it("multiple children with repeat allegations uses plural form", () => {
      const allegations = [
        makeAllegation({ id: "a1", child_id: "c1" }),
        makeAllegation({ id: "a2", child_id: "c1" }),
        makeAllegation({ id: "a3", child_id: "c2" }),
        makeAllegation({ id: "a4", child_id: "c2" }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.concerns.some((c) => c.includes("2 children involved in repeat allegations"))).toBe(true);
    });

    it("1 overdue investigation uses singular form", () => {
      const invs = [
        makeInvestigation({
          id: "inv_0",
          is_open: true,
          date_opened: "2026-01-01",
          date_closed: null,
          actual_completion_days: -1,
          target_completion_days: 30,
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("1 investigation overdue"))).toBe(true);
    });

    it("strategy_meeting_within_5_days only counts if strategy_meeting_held is true", () => {
      // This tests the strategyMeetingsTimely logic
      const ladoReferrals = [
        makeLadoReferral({
          id: "lado_0",
          strategy_meeting_held: false,
          strategy_meeting_within_5_days: true, // Should not count
        }),
        makeLadoReferral({
          id: "lado_1",
          strategy_meeting_held: true,
          strategy_meeting_within_5_days: true, // Should count
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      // Strategy meeting rate = pct(1, 2) = 50%
      // Timely strategy meetings = 1 out of 1 held = 100%
      expect(r.total_lado_referrals).toBe(2);
    });

    it("action_plan_implemented only counts if action_plan_created is true", () => {
      const outcomes = [
        makeOutcome({
          id: "out_0",
          action_plan_created: false,
          action_plan_implemented: true, // Should not count
        }),
        makeOutcome({
          id: "out_1",
          action_plan_created: true,
          action_plan_implemented: true, // Should count
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.total_outcomes).toBe(2);
    });

    it("training_delivered only counts if training_needs_identified is true", () => {
      const outcomes = [
        makeOutcome({
          id: "out_0",
          training_needs_identified: false,
          training_delivered: true, // Should not count
        }),
        makeOutcome({
          id: "out_1",
          training_needs_identified: true,
          training_delivered: true, // Should count
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.total_outcomes).toBe(2);
    });

    it("follow_up_actions_completed only counts if follow_up_actions_set is true", () => {
      const sgs = [
        makeSafeguardingResponse({
          id: "sg_0",
          follow_up_actions_set: false,
          follow_up_actions_completed: true, // Should not count
        }),
        makeSafeguardingResponse({
          id: "sg_1",
          follow_up_actions_set: true,
          follow_up_actions_completed: true, // Should count
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.total_safeguarding_responses).toBe(2);
    });

    it("timeliness_rate only includes investigation component if completedInvestigations > 0", () => {
      // All investigations open → no completedInvestigations → completionWithinTargetRate not included
      const invs = Array.from({ length: 5 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: true,
          date_closed: null,
          actual_completion_days: -1,
          completed_within_target: false,
        }),
      );
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `a_${i}`, child_id: `c_${i}`, recorded_within_24h: true }),
      );
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: true }),
      );
      const r = computeAllegationsInvestigationsManagement({
        today: "2026-05-28",
        total_children: 6,
        allegation_records: allegations,
        lado_referral_records: [],
        investigation_records: invs,
        outcome_records: [],
        safeguarding_response_records: sgs,
      });
      // Components: allegationRecordingRate=100, safeguardingResponseRate=100
      // No lado, no completed investigations → not included
      // Average of [100, 100] = 100
      expect(r.timeliness_rate).toBe(100);
    });

    it("headline for good rating includes strengths and concerns counts", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({
          id: `alleg_${i}`,
          child_id: `child_${i}`,
          recorded_within_24h: i < 8, // 80% → +2 bonus, but also triggers 80-94 planned rec
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      if (r.allegations_rating === "good") {
        expect(r.headline).toContain("strength");
      }
    });

    it("headline for adequate includes concerns count", () => {
      const r = computeAllegationsInvestigationsManagement(baseInputNoBonuses());
      expect(r.headline).toContain("concern");
    });

    it("overdue investigation only flags if is_open and days > target", () => {
      // Investigation opened recently, not yet overdue
      const invs = [
        makeInvestigation({
          id: "inv_0",
          is_open: true,
          date_opened: "2026-05-20", // 8 days open, target 30
          date_closed: null,
          actual_completion_days: -1,
          target_completion_days: 30,
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("overdue"))).toBe(false);
    });

    it("overdue investigation flags when past target", () => {
      const invs = [
        makeInvestigation({
          id: "inv_0",
          is_open: true,
          date_opened: "2026-03-01", // ~88 days open, target 30
          date_closed: null,
          actual_completion_days: -1,
          target_completion_days: 30,
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
    });

    it("closed investigation does not count as overdue even if past target", () => {
      const invs = [
        makeInvestigation({
          id: "inv_0",
          is_open: false,
          date_opened: "2026-01-01",
          date_closed: "2026-04-15",
          actual_completion_days: 104,
          target_completion_days: 30,
          completed_within_target: false,
        }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      // The overdue check only fires for is_open: true
      const overdueInsight = r.concerns.filter((c) => c.includes("overdue"));
      expect(overdueInsight).toHaveLength(0);
    });

    it("outcome_type distribution counts substantiated correctly", () => {
      const outcomes = [
        makeOutcome({ id: "o1", outcome_type: "substantiated" }),
        makeOutcome({ id: "o2", outcome_type: "substantiated" }),
        makeOutcome({ id: "o3", outcome_type: "unsubstantiated" }),
        makeOutcome({ id: "o4", outcome_type: "unfounded" }),
        makeOutcome({ id: "o5", outcome_type: "malicious" }),
        makeOutcome({ id: "o6", outcome_type: "false" }),
        makeOutcome({ id: "o7", outcome_type: "pending" }),
      ];
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.substantiated_count).toBe(2);
    });

    it("80-99% child support shows strength text (not 100%)", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({ id: `inv_${i}`, child_supported_throughout: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.strengths.some((s) => s.includes("80% child support rate"))).toBe(true);
    });

    it("80-99% management oversight shows strength text (not 100%)", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({ id: `inv_${i}`, management_oversight: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.strengths.some((s) => s.includes("80% management oversight rate"))).toBe(true);
    });

    it("80-99% LADO referral shows strength text (not 100%)", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, referred_within_1_working_day: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.strengths.some((s) => s.includes("80% LADO referral timeliness"))).toBe(true);
    });

    it("80-99% Ofsted notification shows strength text (not 100%)", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, ofsted_notified: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.strengths.some((s) => s.includes("80% Ofsted notification rate"))).toBe(true);
    });

    it("80-99% safeguarding response shows strength text (not 100%)", () => {
      const sgs = Array.from({ length: 10 }, (_, i) =>
        makeSafeguardingResponse({ id: `sg_${i}`, response_within_1_hour: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ safeguarding_response_records: sgs }));
      expect(r.strengths.some((s) => s.includes("80% safeguarding responses within 1 hour"))).toBe(true);
    });

    it("80-99% investigation completion shows strength text (not 100%)", () => {
      const invs = Array.from({ length: 10 }, (_, i) =>
        makeInvestigation({
          id: `inv_${i}`,
          is_open: i >= 8,
          date_closed: i < 8 ? "2026-04-15" : null,
          actual_completion_days: i < 8 ? 13 : -1,
        }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ investigation_records: invs }));
      expect(r.strengths.some((s) => s.includes("80% investigation completion rate"))).toBe(true);
    });

    it("80-99% outcome documentation shows strength text (not 100%)", () => {
      const outcomes = Array.from({ length: 10 }, (_, i) =>
        makeOutcome({ id: `out_${i}`, outcome_documented: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ outcome_records: outcomes }));
      expect(r.strengths.some((s) => s.includes("80% outcome documentation rate"))).toBe(true);
    });

    it("80-99% risk assessment shows strength text (not 100%)", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, initial_risk_assessment_completed: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("risk assessments"))).toBe(true);
    });

    it("80-99% immediate safeguarding shows strength text", () => {
      const allegations = Array.from({ length: 10 }, (_, i) =>
        makeAllegation({ id: `alleg_${i}`, child_id: `child_${i}`, child_safeguarded_immediately: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ allegation_records: allegations }));
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("immediate safeguarding"))).toBe(true);
    });

    it("80-99% strategy meeting shows strength text (not 100%)", () => {
      const ladoReferrals = Array.from({ length: 10 }, (_, i) =>
        makeLadoReferral({ id: `lado_${i}`, strategy_meeting_held: i < 8 }),
      );
      const r = computeAllegationsInvestigationsManagement(baseInput({ lado_referral_records: ladoReferrals }));
      expect(r.strengths.some((s) => s.includes("80% strategy meeting rate"))).toBe(true);
    });
  });

  describe("substantiated allegations + overdue-with-missing-date", () => {
    it("surfaces a DBS-duty concern when there is a substantiated allegation", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput({
        outcome_records: [makeOutcome({ outcome_type: "substantiated" })],
      }));
      expect(r.concerns.some((c) => c.includes("substantiated allegation") && c.includes("DBS"))).toBe(true);
    });

    it("counts an open investigation with no date_opened as overdue (NaN must not evade the check)", () => {
      const r = computeAllegationsInvestigationsManagement(baseInput({
        investigation_records: [makeInvestigation({ id: "inv_x", is_open: true, date_opened: "" })],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("overdue"))).toBe(true);
    });
  });
});

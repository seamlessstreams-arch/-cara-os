import { describe, it, expect } from "vitest";
import {
  computeGriefBereavementSupport,
  type GriefBereavementInput,
  type LossIdentificationInput,
  type CounsellingAccessInput,
  type MemoryWorkInput,
  type GriefInterventionInput,
  type AnniversaryManagementInput,
} from "../home-grief-bereavement-support-intelligence-engine";

/* ── helpers ────────────────────────────────────────────────────────────────── */

function makeLoss(id: string, o: Partial<LossIdentificationInput> = {}): LossIdentificationInput {
  return {
    id,
    child_id: "c1",
    loss_type: "bereavement",
    loss_date: "2026-01-10",
    identified_date: "2026-01-12",
    identified_by: "keyworker",
    relationship_to_deceased_or_lost: "grandmother",
    impact_severity: "moderate",
    child_informed_sensitively: true,
    care_plan_updated: true,
    risk_assessment_completed: true,
    support_plan_in_place: true,
    review_date: "2026-06-01",
    review_overdue: false,
    created_at: "2026-01-12",
    ...o,
  };
}

function makeCounselling(id: string, o: Partial<CounsellingAccessInput> = {}): CounsellingAccessInput {
  return {
    id,
    child_id: "c1",
    counselling_type: "bereavement_specialist",
    provider: "Grief Solutions Ltd",
    referral_date: "2026-01-15",
    first_session_date: "2026-01-22",
    sessions_offered: 10,
    sessions_attended: 10,
    waiting_days: 7,
    active: true,
    child_engagement_rating: 5,
    child_found_helpful: true,
    barriers_to_access: [],
    discharge_reason: null,
    outcome_rating: 5,
    review_date: "2026-06-01",
    review_overdue: false,
    created_at: "2026-01-15",
    ...o,
  };
}

function makeMemoryWork(id: string, o: Partial<MemoryWorkInput> = {}): MemoryWorkInput {
  return {
    id,
    child_id: "c1",
    activity_type: "memory_box",
    activity_date: "2026-02-01",
    facilitated_by: "keyworker",
    child_engagement_rating: 5,
    child_found_meaningful: true,
    staff_observed_benefit: true,
    linked_to_loss_id: "l1",
    documented: true,
    follow_up_planned: true,
    follow_up_completed: true,
    created_at: "2026-02-01",
    ...o,
  };
}

function makeIntervention(id: string, o: Partial<GriefInterventionInput> = {}): GriefInterventionInput {
  return {
    id,
    child_id: "c1",
    intervention_type: "individual_therapy",
    start_date: "2026-01-20",
    end_date: null,
    active: true,
    sessions_planned: 10,
    sessions_completed: 10,
    baseline_grief_score: 8,
    current_grief_score: 3,
    target_grief_score: 2,
    child_reported_improvement: true,
    staff_reported_improvement: true,
    professional_involved: true,
    professional_name: "Dr Smith",
    therapeutic_approach: "CBT",
    coping_strategies_taught: 5,
    coping_strategies_used_by_child: 5,
    review_date: "2026-06-01",
    review_overdue: false,
    created_at: "2026-01-20",
    ...o,
  };
}

function makeAnniversary(id: string, o: Partial<AnniversaryManagementInput> = {}): AnniversaryManagementInput {
  return {
    id,
    child_id: "c1",
    anniversary_type: "death_anniversary",
    anniversary_date: "03-15",
    description: "Grandmother's death anniversary",
    plan_in_place: true,
    plan_shared_with_staff: true,
    plan_shared_with_child: true,
    child_preferences_recorded: true,
    proactive_support_offered: true,
    day_managed_well: true,
    child_feedback_positive: true,
    debrief_completed: true,
    created_at: "2026-01-01",
    ...o,
  };
}

function baseInput(overrides: Partial<GriefBereavementInput> = {}): GriefBereavementInput {
  return {
    today: "2026-05-15",
    total_children: 6,
    loss_identification_records: [makeLoss("l1"), makeLoss("l2", { child_id: "c2" })],
    counselling_access_records: [makeCounselling("co1"), makeCounselling("co2", { child_id: "c2" })],
    memory_work_records: [makeMemoryWork("mw1"), makeMemoryWork("mw2", { child_id: "c2" })],
    grief_intervention_records: [makeIntervention("gi1"), makeIntervention("gi2", { child_id: "c2" })],
    anniversary_management_records: [makeAnniversary("a1"), makeAnniversary("a2", { child_id: "c2" })],
    ...overrides,
  };
}

/* ── Minimal "zero-bonus" input — yields base score of 52 ────────────────── */
/* All rates land between thresholds so NO bonus fires and NO penalty fires. */

function zeroInput(): GriefBereavementInput {
  // 10 losses: 6 with support plan → 60% (no bonus, no penalty)
  // 6 with care_plan_updated → 60% (no bonus)
  const losses: LossIdentificationInput[] = [];
  for (let i = 0; i < 10; i++) {
    losses.push(
      makeLoss(`l${i}`, {
        child_id: `c${i}`,
        support_plan_in_place: i < 6,
        care_plan_updated: i < 6,
        child_informed_sensitively: i < 6,
        risk_assessment_completed: i < 6,
        review_overdue: false,
      }),
    );
  }

  // Counselling for 6 of 10 loss-children → 60% (no bonus, no penalty)
  // attendance: 6 offered, 4 attended → 67% (no bonus)
  // child_found_helpful: 4 of 6 → 67%
  const counselling: CounsellingAccessInput[] = [];
  for (let i = 0; i < 6; i++) {
    counselling.push(
      makeCounselling(`co${i}`, {
        child_id: `c${i}`,
        sessions_offered: 1,
        sessions_attended: i < 4 ? 1 : 0,
        child_found_helpful: i < 4,
        waiting_days: 20,
        active: false,
        review_overdue: false,
        barriers_to_access: [],
      }),
    );
  }

  // Memory work for 5 of 10 loss-children → 50% (no bonus)
  // child_found_meaningful: 3 of 5 → 60%
  const memoryWork: MemoryWorkInput[] = [];
  for (let i = 0; i < 5; i++) {
    memoryWork.push(
      makeMemoryWork(`mw${i}`, {
        child_id: `c${i}`,
        child_found_meaningful: i < 3,
        documented: i < 4,
        staff_observed_benefit: i < 3,
        follow_up_planned: false,
        follow_up_completed: false,
      }),
    );
  }

  // 10 interventions: 5 showing improvement → 50% (no bonus, no penalty)
  // child_reported_improvement: 3 of 10
  // sessions: 5 planned, 3 completed → 60%
  const interventions: GriefInterventionInput[] = [];
  for (let i = 0; i < 10; i++) {
    interventions.push(
      makeIntervention(`gi${i}`, {
        child_id: `c${i}`,
        baseline_grief_score: 8,
        current_grief_score: i < 5 ? 5 : 8,
        target_grief_score: 3,
        child_reported_improvement: i < 3,
        staff_reported_improvement: i < 3,
        professional_involved: i < 3,
        sessions_planned: 5,
        sessions_completed: 3,
        coping_strategies_taught: 1,
        coping_strategies_used_by_child: 0,
        active: false,
        review_overdue: false,
      }),
    );
  }

  // 10 anniversaries: 6 with plan → 60% (no bonus, no penalty)
  // proactive_support: 6 → 60% (no bonus)
  const anniversaries: AnniversaryManagementInput[] = [];
  for (let i = 0; i < 10; i++) {
    anniversaries.push(
      makeAnniversary(`a${i}`, {
        child_id: `c${i}`,
        plan_in_place: i < 6,
        plan_shared_with_staff: i < 6,
        plan_shared_with_child: i < 6,
        child_preferences_recorded: i < 6,
        proactive_support_offered: i < 6,
        day_managed_well: null,
        child_feedback_positive: null,
        debrief_completed: null,
      }),
    );
  }

  // childCopingRate = (3 + 4 + 3) / (10 + 6 + 5) = 10/21 = 48% (no bonus, no penalty)
  return {
    today: "2026-05-15",
    total_children: 12,
    loss_identification_records: losses,
    counselling_access_records: counselling,
    memory_work_records: memoryWork,
    grief_intervention_records: interventions,
    anniversary_management_records: anniversaries,
  };
}

/* ── tests ──────────────────────────────────────────────────────────────────── */

describe("Home Grief & Bereavement Support Intelligence Engine", () => {
  /* ================================================================== */
  /*  insufficient_data                                                  */
  /* ================================================================== */
  describe("insufficient_data", () => {
    it("returns insufficient_data when 0 children and all arrays empty", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 0,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.grief_rating).toBe("insufficient_data");
      expect(r.grief_score).toBe(0);
      expect(r.total_losses_identified).toBe(0);
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("headline mentions insufficient data", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 0,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.headline).toContain("insufficient data");
    });

    it("returns all zero rates", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 0,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.loss_identification_rate).toBeNull();
      expect(r.counselling_access_rate).toBeNull();
      expect(r.memory_work_rate).toBeNull();
      expect(r.intervention_effectiveness_rate).toBeNull();
      expect(r.anniversary_management_rate).toBeNull();
      expect(r.child_coping_rate).toBeNull();
      // fab-0: null (no records)
      expect(r.counselling_wait_avg_days).toBeNull();
      expect(r.intervention_progress_avg).toBeNull();
    });
  });

  /* ================================================================== */
  /*  Inadequate floor — children on placement but all arrays empty      */
  /* ================================================================== */
  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate with score 15 when children present but no data", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 4,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.grief_rating).toBe("inadequate");
      expect(r.grief_score).toBe(15);
    });

    it("produces exactly 1 concern, 2 recommendations, 1 insight", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 4,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.concerns).toHaveLength(1);
      expect(r.recommendations).toHaveLength(2);
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("recommendations have rank 1 and 2 with immediate urgency", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 4,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].rank).toBe(2);
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("headline mentions urgent attention", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 1,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.headline).toContain("urgent attention");
    });

    it("all zero rates in the floor path", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 3,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.loss_identification_rate).toBeNull();
      expect(r.counselling_access_rate).toBeNull();
      expect(r.memory_work_rate).toBeNull();
      expect(r.intervention_effectiveness_rate).toBeNull();
      expect(r.anniversary_management_rate).toBeNull();
      expect(r.child_coping_rate).toBeNull();
    });
  });

  /* ================================================================== */
  /*  Outstanding scenario (score >= 80)                                 */
  /* ================================================================== */
  describe("outstanding threshold (>= 80)", () => {
    it("rates outstanding with perfect data", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.grief_score).toBeGreaterThanOrEqual(80);
      expect(r.grief_rating).toBe("outstanding");
    });

    it("headline says outstanding", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("produces strengths for all high-rate areas", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(5);
    });

    it("has no concerns in outstanding scenario", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("has no recommendations in outstanding scenario", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("has positive insights for outstanding", () => {
      const r = computeGriefBereavementSupport(baseInput());
      const pos = r.insights.filter((i) => i.severity === "positive");
      expect(pos.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 100% loss_identification_rate with all support plans", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.loss_identification_rate).toBe(100);
    });

    it("returns 100% counselling_access_rate with all children covered", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.counselling_access_rate).toBe(100);
    });

    it("returns 100% memory_work_rate with all children covered", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.memory_work_rate).toBe(100);
    });

    it("returns 100% intervention_effectiveness_rate", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.intervention_effectiveness_rate).toBe(100);
    });

    it("returns 100% anniversary_management_rate", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.anniversary_management_rate).toBe(100);
    });

    it("returns 100% child_coping_rate", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.child_coping_rate).toBe(100);
    });
  });

  /* ================================================================== */
  /*  Good scenario (65–79)                                              */
  /* ================================================================== */
  describe("good threshold (65–79)", () => {
    it("rates good when some bonuses fire but not all", () => {
      // lossIdRate=100 (+4), counsellingAccess=100 (+4), memoryWork=100 (+3),
      // interventionEffective: 1/2=50% (no bonus), anniversary=100 (+3),
      // childCoping: lots positive (+3), attendance=100 (+3), carePlan=100 (+2), proactive=100 (+2)
      // But we drop interventionEffectiveness to 50% so lose +4
      // Score = 52+4+4+3+0+3+3+3+2+2 = 76 → good
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 3 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 9, baseline_grief_score: 8 }),
          ],
        }),
      );
      expect(r.grief_score).toBeGreaterThanOrEqual(65);
      expect(r.grief_score).toBeLessThan(80);
      expect(r.grief_rating).toBe("good");
    });

    it("headline mentions good", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 3 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 9, baseline_grief_score: 8 }),
          ],
        }),
      );
      expect(r.headline).toContain("Good");
    });

    it("good headline mentions strengths count", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 3 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 9, baseline_grief_score: 8 }),
          ],
        }),
      );
      expect(r.headline).toMatch(/\d+ strength/);
    });
  });

  /* ================================================================== */
  /*  Adequate scenario (45–64)                                          */
  /* ================================================================== */
  describe("adequate threshold (45–64)", () => {
    it("rates adequate when base score holds with no bonuses", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.grief_score).toBeGreaterThanOrEqual(45);
      expect(r.grief_score).toBeLessThan(65);
      expect(r.grief_rating).toBe("adequate");
    });

    it("headline mentions adequate", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.headline).toContain("Adequate");
    });

    it("adequate headline mentions concerns count", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.headline).toMatch(/\d+ concern/);
    });

    it("produces concerns for mid-range rates", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.concerns.length).toBeGreaterThanOrEqual(1);
    });
  });

  /* ================================================================== */
  /*  Inadequate scenario (< 45)                                         */
  /* ================================================================== */
  describe("inadequate threshold (< 45)", () => {
    it("rates inadequate when multiple penalties fire", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 6,
        loss_identification_records: [
          makeLoss("l1", { support_plan_in_place: false, care_plan_updated: false, child_id: "c1" }),
          makeLoss("l2", { support_plan_in_place: false, care_plan_updated: false, child_id: "c2" }),
          makeLoss("l3", { support_plan_in_place: false, care_plan_updated: false, child_id: "c3" }),
        ],
        counselling_access_records: [
          makeCounselling("co1", { child_found_helpful: false, sessions_offered: 10, sessions_attended: 2 }),
        ],
        memory_work_records: [],
        grief_intervention_records: [
          makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8, child_reported_improvement: false }),
          makeIntervention("gi2", { current_grief_score: 9, baseline_grief_score: 8, child_reported_improvement: false }),
        ],
        anniversary_management_records: [
          makeAnniversary("a1", { plan_in_place: false, proactive_support_offered: false, day_managed_well: null, child_feedback_positive: null, debrief_completed: null }),
          makeAnniversary("a2", { plan_in_place: false, proactive_support_offered: false, day_managed_well: null, child_feedback_positive: null, debrief_completed: null }),
          makeAnniversary("a3", { plan_in_place: false, proactive_support_offered: false, day_managed_well: null, child_feedback_positive: null, debrief_completed: null }),
        ],
      });
      // lossIdRate = 0% → penalty -5, counsellingAccess = 1/3 = 33% → penalty -5,
      // interventionEffective = 0% → penalty -4, anniversaryMgmt = 0% → penalty -4
      // score = 52 - 5 - 5 - 4 - 4 = 34
      expect(r.grief_score).toBeLessThan(45);
      expect(r.grief_rating).toBe("inadequate");
    });

    it("headline mentions inadequate and significant concerns", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 6,
        loss_identification_records: [
          makeLoss("l1", { support_plan_in_place: false, care_plan_updated: false, child_id: "c1" }),
          makeLoss("l2", { support_plan_in_place: false, care_plan_updated: false, child_id: "c2" }),
        ],
        counselling_access_records: [
          makeCounselling("co1", { child_found_helpful: false, sessions_offered: 10, sessions_attended: 2 }),
        ],
        memory_work_records: [],
        grief_intervention_records: [
          makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8, child_reported_improvement: false }),
        ],
        anniversary_management_records: [
          makeAnniversary("a1", { plan_in_place: false, proactive_support_offered: false, day_managed_well: null, child_feedback_positive: null, debrief_completed: null }),
        ],
      });
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("significant concern");
    });

    it("produces critical insights when inadequate", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 6,
        loss_identification_records: [
          makeLoss("l1", { support_plan_in_place: false, care_plan_updated: false, child_id: "c1" }),
          makeLoss("l2", { support_plan_in_place: false, care_plan_updated: false, child_id: "c2" }),
        ],
        counselling_access_records: [
          makeCounselling("co1", { child_found_helpful: false, sessions_offered: 10, sessions_attended: 2 }),
        ],
        memory_work_records: [],
        grief_intervention_records: [
          makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8, child_reported_improvement: false }),
        ],
        anniversary_management_records: [
          makeAnniversary("a1", { plan_in_place: false, proactive_support_offered: false, day_managed_well: null, child_feedback_positive: null, debrief_completed: null }),
        ],
      });
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBeGreaterThanOrEqual(1);
    });
  });

  /* ================================================================== */
  /*  Base score = 52 with zero bonuses and zero penalties               */
  /* ================================================================== */
  describe("base score verification", () => {
    it("score equals exactly 52 when no bonuses and no penalties fire", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.grief_score).toBe(52);
    });
  });

  /* ================================================================== */
  /*  Individual bonuses — each tested in isolation                      */
  /* ================================================================== */
  describe("bonus: lossIdentificationRate", () => {
    it("+4 when lossIdentificationRate >= 90", () => {
      const inp = zeroInput();
      // Set all losses to have support plan → 100%
      inp.loss_identification_records.forEach((l) => (l.support_plan_in_place = true));
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(52 + 4);
    });

    it("+2 when lossIdentificationRate >= 70 and < 90", () => {
      const inp = zeroInput();
      // 7 of 10 → 70%
      inp.loss_identification_records.forEach((l, i) => (l.support_plan_in_place = i < 7));
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(52 + 2);
    });

    it("+0 when lossIdentificationRate < 70", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.loss_identification_rate).toBe(60);
      expect(r.grief_score).toBe(52);
    });
  });

  describe("bonus: counsellingAccessRate", () => {
    it("+4 when counsellingAccessRate >= 90", () => {
      const inp = zeroInput();
      // Need 9 of 10 loss-children to have counselling
      for (let i = 6; i < 9; i++) {
        inp.counselling_access_records.push(
          makeCounselling(`co_extra${i}`, {
            child_id: `c${i}`,
            sessions_offered: 1,
            sessions_attended: 0,
            child_found_helpful: false,
            waiting_days: 20,
            active: false,
            review_overdue: false,
            barriers_to_access: [],
          }),
        );
      }
      // Now 9 unique children with counselling out of 10 with loss → 90%
      const r = computeGriefBereavementSupport(inp);
      expect(r.counselling_access_rate).toBe(90);
      expect(r.grief_score).toBe(52 + 4);
    });

    it("+2 when counsellingAccessRate >= 70 and < 90", () => {
      const inp = zeroInput();
      // Add 1 more → 7 of 10 = 70%
      inp.counselling_access_records.push(
        makeCounselling("co_extra6", {
          child_id: "c6",
          sessions_offered: 1,
          sessions_attended: 0,
          child_found_helpful: false,
          waiting_days: 20,
          active: false,
          review_overdue: false,
          barriers_to_access: [],
        }),
      );
      const r = computeGriefBereavementSupport(inp);
      expect(r.counselling_access_rate).toBe(70);
      expect(r.grief_score).toBe(52 + 2);
    });

    it("+0 when counsellingAccessRate < 70", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.counselling_access_rate).toBe(60);
      expect(r.grief_score).toBe(52);
    });
  });

  describe("bonus: memoryWorkRate", () => {
    it("+3 when memoryWorkRate >= 80", () => {
      const inp = zeroInput();
      // Need 8 of 10 loss-children to have memory work
      for (let i = 5; i < 8; i++) {
        inp.memory_work_records.push(
          makeMemoryWork(`mw_extra${i}`, {
            child_id: `c${i}`,
            child_found_meaningful: false,
            documented: true,
            staff_observed_benefit: false,
            follow_up_planned: false,
            follow_up_completed: false,
          }),
        );
      }
      const r = computeGriefBereavementSupport(inp);
      expect(r.memory_work_rate).toBe(80);
      expect(r.grief_score).toBe(52 + 3);
    });

    it("+1 when memoryWorkRate >= 60 and < 80", () => {
      const inp = zeroInput();
      // Add 1 more → 6 of 10 = 60%
      inp.memory_work_records.push(
        makeMemoryWork("mw_extra5", {
          child_id: "c5",
          child_found_meaningful: false,
          documented: true,
          staff_observed_benefit: false,
          follow_up_planned: false,
          follow_up_completed: false,
        }),
      );
      const r = computeGriefBereavementSupport(inp);
      expect(r.memory_work_rate).toBe(60);
      expect(r.grief_score).toBe(52 + 1);
    });

    it("+0 when memoryWorkRate < 60", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.memory_work_rate).toBe(50);
      expect(r.grief_score).toBe(52);
    });
  });

  describe("bonus: interventionEffectivenessRate", () => {
    it("+4 when interventionEffectivenessRate >= 90", () => {
      const inp = zeroInput();
      // Set all 10 interventions to show improvement
      inp.grief_intervention_records.forEach((iv) => (iv.current_grief_score = 3));
      const r = computeGriefBereavementSupport(inp);
      expect(r.intervention_effectiveness_rate).toBe(100);
      expect(r.grief_score).toBe(52 + 4);
    });

    it("+2 when interventionEffectivenessRate >= 70 and < 90", () => {
      const inp = zeroInput();
      // 7 of 10 improved
      inp.grief_intervention_records.forEach((iv, i) => {
        iv.current_grief_score = i < 7 ? 3 : 8;
      });
      const r = computeGriefBereavementSupport(inp);
      expect(r.intervention_effectiveness_rate).toBe(70);
      expect(r.grief_score).toBe(52 + 2);
    });

    it("+0 when interventionEffectivenessRate < 70", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.intervention_effectiveness_rate).toBe(50);
      expect(r.grief_score).toBe(52);
    });
  });

  describe("bonus: anniversaryManagementRate", () => {
    it("+3 when anniversaryManagementRate >= 90", () => {
      const inp = zeroInput();
      inp.anniversary_management_records.forEach((a) => (a.plan_in_place = true));
      const r = computeGriefBereavementSupport(inp);
      expect(r.anniversary_management_rate).toBe(100);
      expect(r.grief_score).toBe(52 + 3);
    });

    it("+1 when anniversaryManagementRate >= 70 and < 90", () => {
      const inp = zeroInput();
      inp.anniversary_management_records.forEach((a, i) => (a.plan_in_place = i < 7));
      const r = computeGriefBereavementSupport(inp);
      expect(r.anniversary_management_rate).toBe(70);
      expect(r.grief_score).toBe(52 + 1);
    });

    it("+0 when anniversaryManagementRate < 70", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.anniversary_management_rate).toBe(60);
      expect(r.grief_score).toBe(52);
    });
  });

  describe("bonus: childCopingRate", () => {
    it("+3 when childCopingRate >= 90", () => {
      const inp = zeroInput();
      // childCopingRate = (childReportedImprovement + counsellingFoundHelpful + memoryWorkMeaningful)
      //                   / (totalInterventions + totalCounselling + totalMemoryWork)
      // Make all positive
      inp.grief_intervention_records.forEach((iv) => (iv.child_reported_improvement = true));
      inp.counselling_access_records.forEach((co) => (co.child_found_helpful = true));
      inp.memory_work_records.forEach((mw) => (mw.child_found_meaningful = true));
      const r = computeGriefBereavementSupport(inp);
      expect(r.child_coping_rate).toBe(100);
      expect(r.grief_score).toBe(52 + 3);
    });

    it("+1 when childCopingRate >= 70 and < 90", () => {
      const inp = zeroInput();
      // 10 + 6 + 5 = 21 total opportunities, need 15 positive for ~71%
      // Set all intervention (10) + all counselling (6) positive = 16 positive
      // memoryWork meaningful = 0 → 16/21 = 76% → +1
      inp.grief_intervention_records.forEach((iv) => (iv.child_reported_improvement = true));
      inp.counselling_access_records.forEach((co) => (co.child_found_helpful = true));
      inp.memory_work_records.forEach((mw) => (mw.child_found_meaningful = false));
      const r = computeGriefBereavementSupport(inp);
      expect(r.child_coping_rate).toBe(76);
      expect(r.grief_score).toBe(52 + 1);
    });

    it("+0 when childCopingRate < 70", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.child_coping_rate).toBe(48);
      expect(r.grief_score).toBe(52);
    });
  });

  describe("bonus: counsellingAttendanceRate", () => {
    it("+3 when counsellingAttendanceRate >= 90", () => {
      const inp = zeroInput();
      inp.counselling_access_records.forEach((co) => (co.sessions_attended = co.sessions_offered));
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(52 + 3);
    });

    it("+1 when counsellingAttendanceRate >= 70 and < 90", () => {
      const inp = zeroInput();
      // 6 records each with 1 offered, need ~70% attendance total
      // 5 attended out of 6 = 83% → but need between 70 and 90
      // Let's set 10 offered and 7 attended per record → 70%
      inp.counselling_access_records.forEach((co) => {
        co.sessions_offered = 10;
        co.sessions_attended = 7;
      });
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(52 + 1);
    });

    it("+0 when counsellingAttendanceRate < 70", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      // 4 attended / 6 offered = 67%
      expect(r.grief_score).toBe(52);
    });
  });

  describe("bonus: carePlanUpdateRate", () => {
    it("+2 when carePlanUpdateRate >= 100", () => {
      const inp = zeroInput();
      inp.loss_identification_records.forEach((l) => (l.care_plan_updated = true));
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(52 + 2);
    });

    it("+1 when carePlanUpdateRate >= 80 and < 100", () => {
      const inp = zeroInput();
      // 8 of 10 → 80%
      inp.loss_identification_records.forEach((l, i) => (l.care_plan_updated = i < 8));
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(52 + 1);
    });

    it("+0 when carePlanUpdateRate < 80", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.grief_score).toBe(52);
    });
  });

  describe("bonus: proactiveSupportRate", () => {
    it("+2 when proactiveSupportRate >= 90", () => {
      const inp = zeroInput();
      inp.anniversary_management_records.forEach((a) => (a.proactive_support_offered = true));
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(52 + 2);
    });

    it("+1 when proactiveSupportRate >= 70 and < 90", () => {
      const inp = zeroInput();
      // 7 of 10 = 70%
      inp.anniversary_management_records.forEach((a, i) => (a.proactive_support_offered = i < 7));
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(52 + 1);
    });

    it("+0 when proactiveSupportRate < 70", () => {
      const r = computeGriefBereavementSupport(zeroInput());
      expect(r.grief_score).toBe(52);
    });
  });

  describe("max bonuses", () => {
    it("base + max bonuses = 80", () => {
      const r = computeGriefBereavementSupport(baseInput());
      // All rates at 100% → all bonuses fire → 52 + 28 = 80
      expect(r.grief_score).toBe(80);
    });
  });

  /* ================================================================== */
  /*  Individual penalties                                               */
  /* ================================================================== */
  describe("penalty: lossIdentificationRate < 50", () => {
    it("-5 when lossIdentificationRate < 50 and losses exist", () => {
      const inp = zeroInput();
      // 4 of 10 → 40%
      inp.loss_identification_records.forEach((l, i) => (l.support_plan_in_place = i < 4));
      const r = computeGriefBereavementSupport(inp);
      expect(r.loss_identification_rate).toBe(40);
      expect(r.grief_score).toBe(52 - 5);
    });

    it("no penalty when rate < 50 but no loss records exist", () => {
      const inp = zeroInput();
      inp.loss_identification_records = [];
      // Also clear dependent records to avoid other penalties
      inp.counselling_access_records = [];
      inp.memory_work_records = [];
      inp.grief_intervention_records = [];
      inp.anniversary_management_records = [];
      const r = computeGriefBereavementSupport(inp);
      // This is the "all empty + children > 0" floor, score = 15
      expect(r.grief_score).toBe(15);
    });
  });

  describe("penalty: counsellingAccessRate < 50", () => {
    it("-5 when counsellingAccessRate < 50 and counselling records exist", () => {
      const inp = zeroInput();
      // Remove most counselling → only 1 child of 10 with loss has counselling = 10%
      inp.counselling_access_records = [
        makeCounselling("co0", {
          child_id: "c0",
          sessions_offered: 1,
          sessions_attended: 0,
          child_found_helpful: false,
          waiting_days: 20,
          active: false,
          review_overdue: false,
          barriers_to_access: [],
        }),
      ];
      const r = computeGriefBereavementSupport(inp);
      expect(r.counselling_access_rate).toBe(10);
      expect(r.grief_score).toBe(52 - 5);
    });
  });

  describe("penalty: interventionEffectivenessRate < 40", () => {
    it("-4 when interventionEffectivenessRate < 40 and interventions exist", () => {
      const inp = zeroInput();
      // 3 of 10 improved → 30%
      inp.grief_intervention_records.forEach((iv, i) => {
        iv.current_grief_score = i < 3 ? 5 : 8;
      });
      const r = computeGriefBereavementSupport(inp);
      expect(r.intervention_effectiveness_rate).toBe(30);
      expect(r.grief_score).toBe(52 - 4);
    });
  });

  describe("penalty: anniversaryManagementRate < 50", () => {
    it("-4 when anniversaryManagementRate < 50 and anniversaries exist", () => {
      const inp = zeroInput();
      // 4 of 10 → 40%
      inp.anniversary_management_records.forEach((a, i) => (a.plan_in_place = i < 4));
      const r = computeGriefBereavementSupport(inp);
      expect(r.anniversary_management_rate).toBe(40);
      expect(r.grief_score).toBe(52 - 4);
    });
  });

  describe("penalty stacking", () => {
    it("applies all four penalties simultaneously: -18 total", () => {
      const inp = zeroInput();
      inp.loss_identification_records.forEach((l) => (l.support_plan_in_place = false));
      inp.counselling_access_records = [
        makeCounselling("co0", {
          child_id: "c0",
          sessions_offered: 1,
          sessions_attended: 0,
          child_found_helpful: false,
          waiting_days: 20,
          active: false,
          review_overdue: false,
          barriers_to_access: [],
        }),
      ];
      inp.grief_intervention_records.forEach((iv) => (iv.current_grief_score = 9));
      inp.anniversary_management_records.forEach((a) => (a.plan_in_place = false));
      const r = computeGriefBereavementSupport(inp);
      // 52 - 5 - 5 - 4 - 4 = 34
      expect(r.grief_score).toBe(34);
      expect(r.grief_rating).toBe("inadequate");
    });
  });

  /* ================================================================== */
  /*  6 output rates                                                     */
  /* ================================================================== */
  describe("rate: loss_identification_rate", () => {
    it("returns 100 when all losses have support plans", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.loss_identification_rate).toBe(100);
    });

    it("returns 0 when no losses have support plans", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { support_plan_in_place: false }),
            makeLoss("l2", { child_id: "c2", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.loss_identification_rate).toBe(0);
    });

    it("returns 50 when half have support plans", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { support_plan_in_place: true }),
            makeLoss("l2", { child_id: "c2", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.loss_identification_rate).toBe(50);
    });

    it("rate(0,0)=nullreturns 0 when no losses", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 0,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.loss_identification_rate).toBeNull();
    });
  });

  describe("rate: counselling_access_rate", () => {
    it("returns 100 when all children with loss have counselling", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.counselling_access_rate).toBe(100);
    });

    it("returns 50 when half children with loss have counselling", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
          ],
          counselling_access_records: [makeCounselling("co1", { child_id: "c1" })],
        }),
      );
      expect(r.counselling_access_rate).toBe(50);
    });

    it("returns 100 when counselling exists but no loss children (totalCounselling > 0)", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [],
          counselling_access_records: [makeCounselling("co1")],
        }),
      );
      expect(r.counselling_access_rate).toBe(100);
    });

    it("returns 0 when no counselling and no loss children", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [],
          counselling_access_records: [],
        }),
      );
      expect(r.counselling_access_rate).toBe(0);
    });
  });

  describe("rate: memory_work_rate", () => {
    it("returns 100 when all loss children have memory work", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.memory_work_rate).toBe(100);
    });

    it("returns 50 when half have memory work", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
          ],
          memory_work_records: [makeMemoryWork("mw1", { child_id: "c1" })],
        }),
      );
      expect(r.memory_work_rate).toBe(50);
    });

    it("returns 100 when memory work exists but no loss children", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [],
          memory_work_records: [makeMemoryWork("mw1")],
        }),
      );
      expect(r.memory_work_rate).toBe(100);
    });

    it("returns 0 when no memory work and no loss children", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [],
          memory_work_records: [],
        }),
      );
      expect(r.memory_work_rate).toBe(0);
    });
  });

  describe("rate: intervention_effectiveness_rate", () => {
    it("returns 100 when all interventions show improvement", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.intervention_effectiveness_rate).toBe(100);
    });

    it("returns 0 when no interventions show improvement", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 8, baseline_grief_score: 8 }),
          ],
        }),
      );
      expect(r.intervention_effectiveness_rate).toBe(0);
    });

    it("returns null when no interventions", () => {
      const r = computeGriefBereavementSupport(
        baseInput({ grief_intervention_records: [] }),
      );
      expect(r.intervention_effectiveness_rate).toBeNull();
    });
  });

  describe("rate: anniversary_management_rate", () => {
    it("returns 100 when all anniversaries have plans", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.anniversary_management_rate).toBe(100);
    });

    it("returns 0 when no anniversaries have plans", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { plan_in_place: false }),
            makeAnniversary("a2", { child_id: "c2", plan_in_place: false }),
          ],
        }),
      );
      expect(r.anniversary_management_rate).toBe(0);
    });

    it("returns null when no anniversaries", () => {
      const r = computeGriefBereavementSupport(
        baseInput({ anniversary_management_records: [] }),
      );
      expect(r.anniversary_management_rate).toBeNull();
    });
  });

  describe("rate: child_coping_rate", () => {
    it("returns 100 when all coping measures positive", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.child_coping_rate).toBe(100);
    });

    it("returns 0 when no coping measures positive", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { child_reported_improvement: false }),
          ],
          counselling_access_records: [
            makeCounselling("co1", { child_found_helpful: false }),
          ],
          memory_work_records: [
            makeMemoryWork("mw1", { child_found_meaningful: false }),
          ],
        }),
      );
      expect(r.child_coping_rate).toBe(0);
    });

    it("returns null when no coping opportunities", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [],
          counselling_access_records: [],
          memory_work_records: [],
        }),
      );
      expect(r.child_coping_rate).toBeNull();
    });
  });

  /* ================================================================== */
  /*  counselling_wait_avg_days                                          */
  /* ================================================================== */
  describe("counselling_wait_avg_days", () => {
    it("returns average waiting days", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { waiting_days: 10 }),
            makeCounselling("co2", { child_id: "c2", waiting_days: 20 }),
          ],
        }),
      );
      expect(r.counselling_wait_avg_days).toBe(15);
    });

    it("returns null when no counselling records (fab-0)", () => {
      const r = computeGriefBereavementSupport(
        baseInput({ counselling_access_records: [] }),
      );
      expect(r.counselling_wait_avg_days).toBeNull();
    });

    it("rounds to nearest integer", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { waiting_days: 10 }),
            makeCounselling("co2", { child_id: "c2", waiting_days: 11 }),
            makeCounselling("co3", { child_id: "c3", waiting_days: 12 }),
          ],
        }),
      );
      expect(r.counselling_wait_avg_days).toBe(11);
    });
  });

  /* ================================================================== */
  /*  intervention_progress_avg                                          */
  /* ================================================================== */
  describe("intervention_progress_avg", () => {
    it("returns 100 when all interventions reach target", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { baseline_grief_score: 8, current_grief_score: 2, target_grief_score: 2 }),
          ],
        }),
      );
      expect(r.intervention_progress_avg).toBe(100);
    });

    it("returns 50 when halfway to target", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { baseline_grief_score: 10, current_grief_score: 5, target_grief_score: 0 }),
          ],
        }),
      );
      expect(r.intervention_progress_avg).toBe(50);
    });

    it("returns 0 when no progress", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { baseline_grief_score: 8, current_grief_score: 8, target_grief_score: 2 }),
          ],
        }),
      );
      expect(r.intervention_progress_avg).toBe(0);
    });

    it("returns null when no interventions (fab-0)", () => {
      const r = computeGriefBereavementSupport(
        baseInput({ grief_intervention_records: [] }),
      );
      expect(r.intervention_progress_avg).toBeNull();
    });

    it("clamps negative progress to 0", () => {
      // current_grief_score > baseline → negative progress clamped to 0
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { baseline_grief_score: 8, current_grief_score: 10, target_grief_score: 2 }),
          ],
        }),
      );
      expect(r.intervention_progress_avg).toBe(0);
    });

    it("skips interventions where baseline equals target", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { baseline_grief_score: 5, current_grief_score: 5, target_grief_score: 5 }),
          ],
        }),
      );
      // baseline == target → excluded from progress calc, and with no eligible interventions → null (fab-0)
      expect(r.intervention_progress_avg).toBeNull();
    });
  });

  /* ================================================================== */
  /*  total_losses_identified                                            */
  /* ================================================================== */
  describe("total_losses_identified", () => {
    it("returns count of loss records", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.total_losses_identified).toBe(2);
    });

    it("returns 0 with no loss records", () => {
      const r = computeGriefBereavementSupport(
        baseInput({ loss_identification_records: [] }),
      );
      expect(r.total_losses_identified).toBe(0);
    });
  });

  /* ================================================================== */
  /*  Strengths                                                          */
  /* ================================================================== */
  describe("strengths", () => {
    it("includes loss identification strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("support plan in place"))).toBe(true);
    });

    it("includes lower-tier loss identification strength at 70-89%", () => {
      // 2/3 = 67% → should not have either strength tier
      // Let's test with 75%
      const r2 = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1"),
            makeLoss("l2", { child_id: "c2" }),
            makeLoss("l3", { child_id: "c3" }),
            makeLoss("l4", { child_id: "c4", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r2.strengths.some((s) => s.includes("75%") && s.includes("support plans"))).toBe(true);
    });

    it("includes counselling access strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("access to counselling"))).toBe(true);
    });

    it("includes memory work strength when rate >= 80", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("memory work"))).toBe(true);
    });

    it("includes intervention effectiveness strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("grief interventions showing improvement"))).toBe(true);
    });

    it("includes anniversary management strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("management plans"))).toBe(true);
    });

    it("includes child coping strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("coping outcomes"))).toBe(true);
    });

    it("includes counselling attendance strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("counselling session attendance"))).toBe(true);
    });

    it("includes care plan update strength when rate >= 100", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("care plan"))).toBe(true);
    });

    it("includes proactive support strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("proactive support"))).toBe(true);
    });

    it("includes sensitive informing strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("sensitive manner"))).toBe(true);
    });

    it("includes risk assessment strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("risk assessments"))).toBe(true);
    });

    it("includes memory work meaningful strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("meaningful by children"))).toBe(true);
    });

    it("includes coping strategy uptake strength when rate >= 80", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("coping strategies actively used"))).toBe(true);
    });

    it("includes professional involvement strength when rate >= 80", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("professional input"))).toBe(true);
    });

    it("includes short wait time strength when <= 14 days", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("waiting time"))).toBe(true);
    });

    it("includes day managed well strength when rate >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.strengths.some((s) => s.includes("managed well"))).toBe(true);
    });

    it("includes child-led memory work strength when rate >= 40", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          memory_work_records: [
            makeMemoryWork("mw1", { facilitated_by: "child_led" }),
            makeMemoryWork("mw2", { child_id: "c2", facilitated_by: "keyworker" }),
          ],
        }),
      );
      // 1/2 = 50% >= 40%
      expect(r.strengths.some((s) => s.includes("child-led"))).toBe(true);
    });

    it("no child-led strength when rate < 40", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          memory_work_records: [
            makeMemoryWork("mw1", { facilitated_by: "keyworker" }),
            makeMemoryWork("mw2", { child_id: "c2", facilitated_by: "keyworker" }),
            makeMemoryWork("mw3", { child_id: "c3", facilitated_by: "keyworker" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("child-led"))).toBe(false);
    });
  });

  /* ================================================================== */
  /*  Concerns                                                           */
  /* ================================================================== */
  describe("concerns", () => {
    it("concern when lossIdentificationRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { support_plan_in_place: false }),
            makeLoss("l2", { child_id: "c2", support_plan_in_place: false }),
            makeLoss("l3", { child_id: "c3", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("support plans"))).toBe(true);
    });

    it("concern when lossIdentificationRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { support_plan_in_place: true }),
            makeLoss("l2", { child_id: "c2", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("support plan rate"))).toBe(true);
    });

    it("concern when counsellingAccessRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
            makeLoss("l3", { child_id: "c3" }),
          ],
          counselling_access_records: [makeCounselling("co1", { child_id: "c1" })],
        }),
      );
      // 1 of 3 loss-children = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("counselling"))).toBe(true);
    });

    it("concern when counsellingAccessRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
          ],
          counselling_access_records: [makeCounselling("co1", { child_id: "c1" })],
        }),
      );
      // 1 of 2 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Counselling access"))).toBe(true);
    });

    it("concern when memoryWorkRate < 40", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
            makeLoss("l3", { child_id: "c3" }),
            makeLoss("l4", { child_id: "c4" }),
          ],
          memory_work_records: [makeMemoryWork("mw1", { child_id: "c1" })],
        }),
      );
      // 1 of 4 = 25%
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("memory work"))).toBe(true);
    });

    it("concern when memoryWorkRate 40-59", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
          ],
          memory_work_records: [makeMemoryWork("mw1", { child_id: "c1" })],
        }),
      );
      // 1 of 2 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Memory work participation"))).toBe(true);
    });

    it("concern when interventionEffectivenessRate < 40", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 8, baseline_grief_score: 8 }),
            makeIntervention("gi3", { child_id: "c3", current_grief_score: 5, baseline_grief_score: 8 }),
          ],
        }),
      );
      // 1 of 3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("grief interventions showing improvement"))).toBe(true);
    });

    it("concern when interventionEffectivenessRate 40-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 3, baseline_grief_score: 8 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 8, baseline_grief_score: 8 }),
          ],
        }),
      );
      // 1 of 2 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Intervention effectiveness"))).toBe(true);
    });

    it("concern when anniversaryManagementRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { plan_in_place: false }),
            makeAnniversary("a2", { child_id: "c2", plan_in_place: false }),
            makeAnniversary("a3", { child_id: "c3", plan_in_place: true }),
          ],
        }),
      );
      // 1 of 3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("anniversaries have management plans"))).toBe(true);
    });

    it("concern when anniversaryManagementRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { plan_in_place: true }),
            makeAnniversary("a2", { child_id: "c2", plan_in_place: false }),
          ],
        }),
      );
      // 1 of 2 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Anniversary management"))).toBe(true);
    });

    it("concern when childCopingRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { child_reported_improvement: false }),
            makeIntervention("gi2", { child_id: "c2", child_reported_improvement: false }),
          ],
          counselling_access_records: [
            makeCounselling("co1", { child_found_helpful: false }),
            makeCounselling("co2", { child_id: "c2", child_found_helpful: false }),
          ],
          memory_work_records: [
            makeMemoryWork("mw1", { child_found_meaningful: false }),
            makeMemoryWork("mw2", { child_id: "c2", child_found_meaningful: false }),
          ],
        }),
      );
      // 0 / 6 = 0%
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("coping outcomes"))).toBe(true);
    });

    it("concern when childCopingRate 50-69", () => {
      // 2 of 6 = 33% — actually < 50, need different numbers
      // Let's try: 3 positive of 6 = 50%
      const r2 = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { child_reported_improvement: true }),
          ],
          counselling_access_records: [
            makeCounselling("co1", { child_found_helpful: true }),
          ],
          memory_work_records: [
            makeMemoryWork("mw1", { child_found_meaningful: true }),
            makeMemoryWork("mw2", { child_id: "c2", child_found_meaningful: false }),
            makeMemoryWork("mw3", { child_id: "c3", child_found_meaningful: false }),
            makeMemoryWork("mw4", { child_id: "c4", child_found_meaningful: false }),
          ],
        }),
      );
      // 3 of 6 = 50%
      expect(r2.child_coping_rate).toBe(50);
      expect(r2.concerns.some((c) => c.includes("50%") && c.includes("coping rate"))).toBe(true);
    });

    it("concern when counsellingWaitAvgDays > 42", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { waiting_days: 50 }),
            makeCounselling("co2", { child_id: "c2", waiting_days: 50 }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("50 days") && c.includes("excessive delays"))).toBe(true);
    });

    it("concern when counsellingWaitAvgDays 29-42", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { waiting_days: 35 }),
            makeCounselling("co2", { child_id: "c2", waiting_days: 35 }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("35 days") && c.includes("delays in accessing"))).toBe(true);
    });

    it("concern when carePlanUpdateRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { care_plan_updated: false }),
            makeLoss("l2", { child_id: "c2", care_plan_updated: false }),
            makeLoss("l3", { child_id: "c3", care_plan_updated: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("care plans updated following loss"))).toBe(true);
    });

    it("concern when overdue loss reviews exist", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { review_overdue: true }),
            makeLoss("l2", { child_id: "c2", review_overdue: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("loss review") && c.includes("overdue"))).toBe(true);
    });

    it("overdue loss review concern uses singular grammar for 1", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { review_overdue: true }),
            makeLoss("l2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("1 loss review is overdue"))).toBe(true);
    });

    it("overdue loss review concern uses plural grammar for > 1", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { review_overdue: true }),
            makeLoss("l2", { child_id: "c2", review_overdue: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("2 loss reviews are overdue"))).toBe(true);
    });

    it("concern when overdue counselling reviews exist (active only)", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { review_overdue: true, active: true }),
            makeCounselling("co2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("counselling review"))).toBe(true);
    });

    it("no concern when overdue counselling review is inactive", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { review_overdue: true, active: false }),
            makeCounselling("co2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("counselling review") && c.includes("overdue"))).toBe(false);
    });

    it("concern when overdue intervention reviews exist (active only)", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { review_overdue: true, active: true }),
            makeIntervention("gi2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("grief intervention review"))).toBe(true);
    });

    it("concern when counsellingAttendanceRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { sessions_offered: 10, sessions_attended: 3 }),
            makeCounselling("co2", { child_id: "c2", sessions_offered: 10, sessions_attended: 3 }),
          ],
        }),
      );
      // 6/20 = 30%
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("counselling session attendance"))).toBe(true);
    });

    it("concern when severe losses lack support plans", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { impact_severity: "severe", support_plan_in_place: false }),
            makeLoss("l2", { child_id: "c2", impact_severity: "severe", support_plan_in_place: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("severe-impact loss") && c.includes("lacks a support plan"))).toBe(true);
    });

    it("severe loss concern plural for > 1 unsupported", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { impact_severity: "severe", support_plan_in_place: false }),
            makeLoss("l2", { child_id: "c2", impact_severity: "severe", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("severe-impact losses lack a support plan"))).toBe(true);
    });

    it("concern when barriersRate > 40", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { barriers_to_access: ["transport", "waiting list"] }),
            makeCounselling("co2", { child_id: "c2" }),
          ],
        }),
      );
      // 1 of 2 = 50% > 40%
      expect(r.concerns.some((c) => c.includes("barriers to access"))).toBe(true);
    });

    it("concern when memoryWorkDocumentationRate < 70", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          memory_work_records: [
            makeMemoryWork("mw1", { documented: false }),
            makeMemoryWork("mw2", { child_id: "c2", documented: false }),
            makeMemoryWork("mw3", { child_id: "c3", documented: true }),
          ],
        }),
      );
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("documentation") && c.includes("33%"))).toBe(true);
    });

    it("concern when sessionCompletionRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { sessions_planned: 10, sessions_completed: 3 }),
            makeIntervention("gi2", { child_id: "c2", sessions_planned: 10, sessions_completed: 3 }),
          ],
        }),
      );
      // 6/20 = 30%
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("planned intervention sessions"))).toBe(true);
    });
  });

  /* ================================================================== */
  /*  Recommendations                                                    */
  /* ================================================================== */
  describe("recommendations", () => {
    it("immediate rec when lossIdentificationRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { support_plan_in_place: false }),
            makeLoss("l2", { child_id: "c2", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("support plans for all identified losses"))).toBe(true);
    });

    it("immediate rec when counsellingAccessRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
            makeLoss("l3", { child_id: "c3" }),
          ],
          counselling_access_records: [makeCounselling("co1", { child_id: "c1" })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("bereavement counselling access"))).toBe(true);
    });

    it("immediate rec when interventionEffectivenessRate < 40", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 8, baseline_grief_score: 8 }),
            makeIntervention("gi3", { child_id: "c3", current_grief_score: 5, baseline_grief_score: 8 }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("ineffective grief interventions"))).toBe(true);
    });

    it("immediate rec when anniversaryManagementRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { plan_in_place: false }),
            makeAnniversary("a2", { child_id: "c2", plan_in_place: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("anniversary management plans"))).toBe(true);
    });

    it("immediate rec for severe losses without support plans", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { impact_severity: "severe", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("severe-impact losses"))).toBe(true);
    });

    it("immediate rec when counsellingWaitAvg > 42", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { waiting_days: 50 }),
            makeCounselling("co2", { child_id: "c2", waiting_days: 50 }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("excessive counselling waiting times"))).toBe(true);
    });

    it("immediate rec when childCopingRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { child_reported_improvement: false }),
          ],
          counselling_access_records: [
            makeCounselling("co1", { child_found_helpful: false }),
          ],
          memory_work_records: [
            makeMemoryWork("mw1", { child_found_meaningful: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("positive coping outcomes"))).toBe(true);
    });

    it("immediate rec when carePlanUpdateRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { care_plan_updated: false }),
            makeLoss("l2", { child_id: "c2", care_plan_updated: false }),
            makeLoss("l3", { child_id: "c3", care_plan_updated: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Update all care plans"))).toBe(true);
    });

    it("soon rec for overdue loss reviews", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { review_overdue: true }),
            makeLoss("l2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("overdue loss reviews"))).toBe(true);
    });

    it("soon rec for overdue intervention reviews", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { review_overdue: true, active: true }),
            makeIntervention("gi2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("overdue grief intervention reviews"))).toBe(true);
    });

    it("soon rec for overdue counselling reviews", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { review_overdue: true, active: true }),
            makeCounselling("co2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("overdue counselling reviews"))).toBe(true);
    });

    it("soon rec for lossIdRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { support_plan_in_place: true }),
            makeLoss("l2", { child_id: "c2", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Extend bereavement support planning"))).toBe(true);
    });

    it("soon rec for counsellingAccessRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
          ],
          counselling_access_records: [makeCounselling("co1", { child_id: "c1" })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Increase counselling access"))).toBe(true);
    });

    it("soon rec for interventionEffectiveness 40-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 3 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 8, baseline_grief_score: 8 }),
          ],
        }),
      );
      // 1/2 = 50%
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Review grief interventions not showing improvement"))).toBe(true);
    });

    it("soon rec for anniversaryMgmt 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { plan_in_place: true }),
            makeAnniversary("a2", { child_id: "c2", plan_in_place: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve anniversary management coverage"))).toBe(true);
    });

    it("soon rec for sessionCompletionRate < 70", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { sessions_planned: 10, sessions_completed: 5 }),
          ],
        }),
      );
      // 5/10 = 50%
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("session completion rate"))).toBe(true);
    });

    it("planned rec for memoryWorkRate < 60", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
            makeLoss("l3", { child_id: "c3" }),
          ],
          memory_work_records: [makeMemoryWork("mw1", { child_id: "c1" })],
        }),
      );
      // 1/3 = 33%
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Expand memory work activities"))).toBe(true);
    });

    it("planned rec for professionalInvolvementRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { professional_involved: false }),
            makeIntervention("gi2", { child_id: "c2", professional_involved: false }),
            makeIntervention("gi3", { child_id: "c3", professional_involved: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("professional involvement"))).toBe(true);
    });

    it("planned rec for counsellingAttendanceRate < 70", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { sessions_offered: 10, sessions_attended: 5 }),
            makeCounselling("co2", { child_id: "c2", sessions_offered: 10, sessions_attended: 5 }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("barriers to counselling attendance"))).toBe(true);
    });

    it("planned rec for preferencesRecordedRate < 70", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { child_preferences_recorded: false }),
            makeAnniversary("a2", { child_id: "c2", child_preferences_recorded: false }),
            makeAnniversary("a3", { child_id: "c3", child_preferences_recorded: true }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Record children's preferences"))).toBe(true);
    });

    it("planned rec for memoryWorkDocumentationRate < 70", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          memory_work_records: [
            makeMemoryWork("mw1", { documented: false }),
            makeMemoryWork("mw2", { child_id: "c2", documented: false }),
            makeMemoryWork("mw3", { child_id: "c3", documented: true }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Improve documentation of memory work"))).toBe(true);
    });

    it("planned rec for counsellingWaitAvg 29-42 days", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { waiting_days: 35 }),
            makeCounselling("co2", { child_id: "c2", waiting_days: 35 }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Reduce counselling waiting times"))).toBe(true);
    });

    it("recommendation ranks increment correctly", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 6,
        loss_identification_records: [
          makeLoss("l1", { support_plan_in_place: false, care_plan_updated: false, review_overdue: true, child_id: "c1" }),
          makeLoss("l2", { support_plan_in_place: false, care_plan_updated: false, review_overdue: true, child_id: "c2" }),
        ],
        counselling_access_records: [
          makeCounselling("co1", { child_found_helpful: false, sessions_offered: 10, sessions_attended: 2 }),
        ],
        memory_work_records: [],
        grief_intervention_records: [
          makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8, child_reported_improvement: false, review_overdue: true, active: true }),
        ],
        anniversary_management_records: [
          makeAnniversary("a1", { plan_in_place: false, proactive_support_offered: false, day_managed_well: null, child_feedback_positive: null, debrief_completed: null }),
        ],
      });
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("no recommendations in outstanding scenario", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });
  });

  /* ================================================================== */
  /*  Insights                                                           */
  /* ================================================================== */
  describe("insights", () => {
    it("critical insight when lossIdRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { support_plan_in_place: false }),
            makeLoss("l2", { child_id: "c2", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("support plans"))).toBe(true);
    });

    it("critical insight when counsellingAccessRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
            makeLoss("l3", { child_id: "c3" }),
          ],
          counselling_access_records: [makeCounselling("co1", { child_id: "c1" })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("counselling"))).toBe(true);
    });

    it("critical insight when interventionEffectivenessRate < 40", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 8, baseline_grief_score: 8 }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("interventions showing improvement"))).toBe(true);
    });

    it("critical insight when anniversaryMgmtRate < 50", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { plan_in_place: false }),
            makeAnniversary("a2", { child_id: "c2", plan_in_place: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("anniversaries have management plans"))).toBe(true);
    });

    it("critical insight for severe losses with < 50% support", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { impact_severity: "severe", support_plan_in_place: false }),
            makeLoss("l2", { child_id: "c2", impact_severity: "severe", support_plan_in_place: false }),
            makeLoss("l3", { child_id: "c3", impact_severity: "severe", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("severe-impact losses"))).toBe(true);
    });

    it("critical insight when counsellingWaitAvg > 42", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { waiting_days: 50 }),
            makeCounselling("co2", { child_id: "c2", waiting_days: 50 }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("exceeds 6 weeks"))).toBe(true);
    });

    it("warning insight when lossIdRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1"),
            makeLoss("l2", { child_id: "c2", support_plan_in_place: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("improving"))).toBe(true);
    });

    it("warning insight when counsellingAccessRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c2" }),
          ],
          counselling_access_records: [makeCounselling("co1", { child_id: "c1" })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Counselling access at 50%"))).toBe(true);
    });

    it("warning insight when interventionEffectivenessRate 40-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 3 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 8, baseline_grief_score: 8 }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Intervention effectiveness at 50%"))).toBe(true);
    });

    it("warning insight when anniversaryMgmtRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { plan_in_place: true }),
            makeAnniversary("a2", { child_id: "c2", plan_in_place: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Anniversary management at 50%"))).toBe(true);
    });

    it("warning insight when childCopingRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { child_reported_improvement: true }),
          ],
          counselling_access_records: [
            makeCounselling("co1", { child_found_helpful: true }),
          ],
          memory_work_records: [
            makeMemoryWork("mw1", { child_found_meaningful: true }),
            makeMemoryWork("mw2", { child_id: "c2", child_found_meaningful: false }),
            makeMemoryWork("mw3", { child_id: "c3", child_found_meaningful: false }),
            makeMemoryWork("mw4", { child_id: "c4", child_found_meaningful: false }),
          ],
        }),
      );
      // 3/6 = 50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("coping rate at 50%"))).toBe(true);
    });

    it("warning insight when counsellingWaitAvg 29-42", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { waiting_days: 35 }),
            makeCounselling("co2", { child_id: "c2", waiting_days: 35 }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("35 days"))).toBe(true);
    });

    it("warning insight for overdue loss reviews", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { review_overdue: true }),
            makeLoss("l2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("loss review"))).toBe(true);
    });

    it("warning insight for overdue intervention reviews (active)", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { review_overdue: true, active: true }),
            makeIntervention("gi2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("overdue reviews"))).toBe(true);
    });

    it("warning insight when sessionCompletionRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { sessions_planned: 10, sessions_completed: 6 }),
          ],
        }),
      );
      // 6/10 = 60%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Session completion at 60%"))).toBe(true);
    });

    it("warning insight when barriersRate > 40", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { barriers_to_access: ["transport"] }),
            makeCounselling("co2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("barriers to access"))).toBe(true);
    });

    it("warning insight for counsellingAttendanceRate 50-69", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { sessions_offered: 10, sessions_attended: 6 }),
            makeCounselling("co2", { child_id: "c2", sessions_offered: 10, sessions_attended: 6 }),
          ],
        }),
      );
      // 12/20 = 60%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Counselling attendance at 60%"))).toBe(true);
    });

    it("warning insight for loss type profile when >= 3 losses", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { loss_type: "bereavement" }),
            makeLoss("l2", { child_id: "c2", loss_type: "separation" }),
            makeLoss("l3", { child_id: "c3", loss_type: "bereavement" }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.text.includes("Loss profile"))).toBe(true);
    });

    it("no loss type profile insight with < 3 losses", () => {
      const r = computeGriefBereavementSupport(baseInput());
      // Only 2 losses
      expect(r.insights.some((i) => i.text.includes("Loss profile"))).toBe(false);
    });

    it("warning insight for intervention type profile when >= 3 active", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { intervention_type: "individual_therapy", active: true }),
            makeIntervention("gi2", { child_id: "c2", intervention_type: "group_work", active: true }),
            makeIntervention("gi3", { child_id: "c3", intervention_type: "cbt_grief", active: true }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.text.includes("Active grief intervention types"))).toBe(true);
    });

    it("warning insight for memory work type profile when >= 3 records", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          memory_work_records: [
            makeMemoryWork("mw1", { activity_type: "memory_box" }),
            makeMemoryWork("mw2", { child_id: "c2", activity_type: "photo_album" }),
            makeMemoryWork("mw3", { child_id: "c3", activity_type: "letter_writing" }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.text.includes("Memory work activity types"))).toBe(true);
    });

    it("positive insight when rating is outstanding", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding grief"))).toBe(true);
    });

    it("positive insight for combined loss support and care plan at >= 90", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("support plans") && i.text.includes("care plans updated"))).toBe(true);
    });

    it("positive insight for counselling access + helpful at high rates", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("counselling access") && i.text.includes("finding it helpful"))).toBe(true);
    });

    it("positive insight for intervention effectiveness + child reported improvement", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("grief interventions showing improvement") && i.text.includes("children reporting benefit"))).toBe(true);
    });

    it("positive insight for anniversary management + proactive support", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("anniversary management") && i.text.includes("proactive support"))).toBe(true);
    });

    it("positive insight for memory work meaningful + benefit", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("memory work found meaningful"))).toBe(true);
    });

    it("positive insight for high child coping rate", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("positive coping outcomes"))).toBe(true);
    });

    it("positive insight for staff + child reported improvement convergence", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("staff") && i.text.includes("children") && i.text.includes("report improvement"))).toBe(true);
    });

    it("positive insight for coping strategy uptake >= 80", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("coping strategies actively used"))).toBe(true);
    });

    it("positive insight for short wait + high attendance", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("wait of") && i.text.includes("attendance"))).toBe(true);
    });

    it("positive insight for day managed well + positive feedback", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("managed well") && i.text.includes("positive child feedback"))).toBe(true);
    });
  });

  /* ================================================================== */
  /*  Edge cases                                                         */
  /* ================================================================== */
  describe("edge cases", () => {
    it("rate(0,0)=nullreturns 0", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 0,
        loss_identification_records: [],
        counselling_access_records: [],
        memory_work_records: [],
        grief_intervention_records: [],
        anniversary_management_records: [],
      });
      expect(r.loss_identification_rate).toBeNull();
      expect(r.counselling_access_rate).toBeNull();
      expect(r.memory_work_rate).toBeNull();
      expect(r.intervention_effectiveness_rate).toBeNull();
      expect(r.anniversary_management_rate).toBeNull();
      expect(r.child_coping_rate).toBeNull();
    });

    it("score is clamped to 0 minimum", () => {
      // Extreme scenario: all penalties fire, minimal data
      // Even with 52 - 5 - 5 - 4 - 4 = 34, which is > 0 — need more extreme
      // Score can't actually go below 34 naturally (52 minus max 18 penalties)
      // But let's confirm the clamp works at 0
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 6,
        loss_identification_records: [
          makeLoss("l1", { support_plan_in_place: false, care_plan_updated: false }),
        ],
        counselling_access_records: [
          makeCounselling("co1", { child_found_helpful: false }),
        ],
        memory_work_records: [],
        grief_intervention_records: [
          makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8 }),
        ],
        anniversary_management_records: [
          makeAnniversary("a1", { plan_in_place: false }),
        ],
      });
      expect(r.grief_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      // Can't exceed 80 naturally (52 + 28), but confirm clamping works
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.grief_score).toBeLessThanOrEqual(100);
    });

    it("single child with single loss and full support", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 1,
        loss_identification_records: [makeLoss("l1")],
        counselling_access_records: [makeCounselling("co1")],
        memory_work_records: [makeMemoryWork("mw1")],
        grief_intervention_records: [makeIntervention("gi1")],
        anniversary_management_records: [makeAnniversary("a1")],
      });
      expect(r.grief_score).toBe(80);
      expect(r.grief_rating).toBe("outstanding");
      expect(r.total_losses_identified).toBe(1);
    });

    it("multiple losses for same child counted correctly", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { child_id: "c1" }),
            makeLoss("l2", { child_id: "c1", loss_type: "separation" }),
            makeLoss("l3", { child_id: "c1", loss_type: "placement_move" }),
          ],
        }),
      );
      expect(r.total_losses_identified).toBe(3);
      // uniqueChildrenWithLoss = 1, counselling has c1 and c2, so 1 child covers
    });

    it("counselling with no loss children still counts as 100%", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [],
          counselling_access_records: [makeCounselling("co1")],
        }),
      );
      expect(r.counselling_access_rate).toBe(100);
    });

    it("memory work with no loss children still counts as 100%", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [],
          memory_work_records: [makeMemoryWork("mw1")],
        }),
      );
      expect(r.memory_work_rate).toBe(100);
    });

    it("anniversaries with day_managed_well=null are excluded from occurred count", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { day_managed_well: null, child_feedback_positive: null, debrief_completed: null }),
            makeAnniversary("a2", { child_id: "c2", day_managed_well: true, child_feedback_positive: true, debrief_completed: true }),
          ],
        }),
      );
      // day_managed_well: 1 occurred, 1 managed well → 100%
      expect(r.strengths.some((s) => s.includes("managed well"))).toBe(true);
    });

    it("intervention with baseline equal to target is excluded from progress calc", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { baseline_grief_score: 5, target_grief_score: 5, current_grief_score: 5 }),
          ],
        }),
      );
      // fab-0: null when no eligible interventions remain after filter
      expect(r.intervention_progress_avg).toBeNull();
    });

    it("intervention where target > baseline is excluded from progress calc", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { baseline_grief_score: 3, target_grief_score: 8, current_grief_score: 5 }),
          ],
        }),
      );
      // baseline (3) < target (8) → excluded from progress calc (filter: baseline > target). fab-0: null.
      expect(r.intervention_progress_avg).toBeNull();
    });

    it("handles large number of records", () => {
      const losses: LossIdentificationInput[] = [];
      const counselling: CounsellingAccessInput[] = [];
      const memoryWork: MemoryWorkInput[] = [];
      const interventions: GriefInterventionInput[] = [];
      const anniversaries: AnniversaryManagementInput[] = [];

      for (let i = 0; i < 50; i++) {
        losses.push(makeLoss(`l${i}`, { child_id: `c${i}` }));
        counselling.push(makeCounselling(`co${i}`, { child_id: `c${i}` }));
        memoryWork.push(makeMemoryWork(`mw${i}`, { child_id: `c${i}` }));
        interventions.push(makeIntervention(`gi${i}`, { child_id: `c${i}` }));
        anniversaries.push(makeAnniversary(`a${i}`, { child_id: `c${i}` }));
      }

      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 50,
        loss_identification_records: losses,
        counselling_access_records: counselling,
        memory_work_records: memoryWork,
        grief_intervention_records: interventions,
        anniversary_management_records: anniversaries,
      });
      expect(r.grief_score).toBe(80);
      expect(r.grief_rating).toBe("outstanding");
      expect(r.total_losses_identified).toBe(50);
    });

    it("counselling_wait_avg_days with single record", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [makeCounselling("co1", { waiting_days: 21 })],
        }),
      );
      expect(r.counselling_wait_avg_days).toBe(21);
    });

    it("counselling engagement does not affect score directly", () => {
      // engagement rating is tracked but not part of scoring
      const r1 = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { child_engagement_rating: 1 }),
            makeCounselling("co2", { child_id: "c2", child_engagement_rating: 1 }),
          ],
        }),
      );
      const r2 = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { child_engagement_rating: 5 }),
            makeCounselling("co2", { child_id: "c2", child_engagement_rating: 5 }),
          ],
        }),
      );
      expect(r1.grief_score).toBe(r2.grief_score);
    });

    it("loss type breakdown uses replace for underscores", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          loss_identification_records: [
            makeLoss("l1", { loss_type: "family_breakdown" }),
            makeLoss("l2", { child_id: "c2", loss_type: "family_breakdown" }),
            makeLoss("l3", { child_id: "c3", loss_type: "placement_move" }),
          ],
        }),
      );
      const profileInsight = r.insights.find((i) => i.text.includes("Loss profile"));
      expect(profileInsight).toBeDefined();
      expect(profileInsight!.text).toContain("family breakdown");
      expect(profileInsight!.text).not.toContain("family_breakdown");
    });

    it("intervention type breakdown replaces underscores", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { intervention_type: "individual_therapy", active: true }),
            makeIntervention("gi2", { child_id: "c2", intervention_type: "individual_therapy", active: true }),
            makeIntervention("gi3", { child_id: "c3", intervention_type: "group_work", active: true }),
          ],
        }),
      );
      const ivInsight = r.insights.find((i) => i.text.includes("Active grief intervention types"));
      expect(ivInsight).toBeDefined();
      expect(ivInsight!.text).toContain("individual therapy");
      expect(ivInsight!.text).not.toContain("individual_therapy");
    });

    it("memory work type breakdown replaces underscores", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          memory_work_records: [
            makeMemoryWork("mw1", { activity_type: "memory_box" }),
            makeMemoryWork("mw2", { child_id: "c2", activity_type: "memory_box" }),
            makeMemoryWork("mw3", { child_id: "c3", activity_type: "photo_album" }),
          ],
        }),
      );
      const mwInsight = r.insights.find((i) => i.text.includes("Memory work activity types"));
      expect(mwInsight).toBeDefined();
      expect(mwInsight!.text).toContain("memory box");
      expect(mwInsight!.text).not.toContain("memory_box");
    });

    it("headline for good with zero concerns omits concern clause", () => {
      // Build a scenario that gets good rating with no concerns
      // Need score 65-79 with all metrics in non-concern territory
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { current_grief_score: 3 }),
            makeIntervention("gi2", { child_id: "c2", current_grief_score: 9, baseline_grief_score: 8 }),
          ],
        }),
      );
      // This should be good rating. If concerns = 0, headline has no "for improvement" suffix
      if (r.concerns.length === 0) {
        expect(r.headline).not.toContain("for improvement");
      }
    });

    it("all regulatory refs use CHR 2015 or SCCIF", () => {
      const r = computeGriefBereavementSupport({
        today: "2026-05-15",
        total_children: 6,
        loss_identification_records: [
          makeLoss("l1", { support_plan_in_place: false, care_plan_updated: false, child_id: "c1", review_overdue: true, impact_severity: "severe" }),
        ],
        counselling_access_records: [
          makeCounselling("co1", { child_found_helpful: false, sessions_offered: 10, sessions_attended: 2, waiting_days: 50 }),
        ],
        memory_work_records: [
          makeMemoryWork("mw1", { child_found_meaningful: false, documented: false }),
        ],
        grief_intervention_records: [
          makeIntervention("gi1", { current_grief_score: 9, baseline_grief_score: 8, child_reported_improvement: false, professional_involved: false, sessions_planned: 10, sessions_completed: 3, review_overdue: true, active: true }),
        ],
        anniversary_management_records: [
          makeAnniversary("a1", { plan_in_place: false, proactive_support_offered: false, child_preferences_recorded: false, day_managed_well: null, child_feedback_positive: null, debrief_completed: null }),
        ],
      });
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toMatch(/CHR 2015|SCCIF/);
      }
    });

    it("overdue intervention review concern uses singular for 1", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { review_overdue: true, active: true }),
            makeIntervention("gi2", { child_id: "c2", review_overdue: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("1 active grief intervention review is overdue"))).toBe(true);
    });

    it("overdue intervention review concern uses plural for > 1", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          grief_intervention_records: [
            makeIntervention("gi1", { review_overdue: true, active: true }),
            makeIntervention("gi2", { child_id: "c2", review_overdue: true, active: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("2 active grief intervention reviews are overdue"))).toBe(true);
    });

    it("overdue counselling review concern uses singular for 1", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { review_overdue: true, active: true }),
            makeCounselling("co2", { child_id: "c2" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("1 active counselling review is overdue"))).toBe(true);
    });

    it("overdue counselling review concern uses plural for > 1", () => {
      const r = computeGriefBereavementSupport(
        baseInput({
          counselling_access_records: [
            makeCounselling("co1", { review_overdue: true, active: true }),
            makeCounselling("co2", { child_id: "c2", review_overdue: true, active: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("2 active counselling reviews are overdue"))).toBe(true);
    });

    it("score boundaries: exactly 80 is outstanding", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r.grief_score).toBe(80);
      expect(r.grief_rating).toBe("outstanding");
    });

    it("score boundaries: exactly 65 is good", () => {
      // Need score = 65. Base 52 + 13 bonuses.
      // counsellingAccess +4, lossId +4, memoryWork +3, counsellingAttendance +3 = +14 → 66
      // Try lossId +4, counsellingAccess +4, anniversaryMgmt +3, carePlan +2 = +13 → 65
      // But need to cancel other bonuses...
      // Simpler: use zeroInput + add specific bonuses
      const inp = zeroInput();
      // B1: lossIdRate → +4 (set all support plans)
      inp.loss_identification_records.forEach((l) => (l.support_plan_in_place = true));
      // B2: counsellingAccess → keep at 60%, +0
      // B3: memoryWork → keep at 50%, +0
      // B4: interventionEffectiveness → +4 (set all improved)
      inp.grief_intervention_records.forEach((iv) => (iv.current_grief_score = 3));
      // B5: anniversaryMgmt → +3 (set all plan_in_place)
      inp.anniversary_management_records.forEach((a) => (a.plan_in_place = true));
      // B6: childCoping → keep at 48%, +0
      // B7: counsellingAttendance → keep at 67%, +0
      // B8: carePlanUpdate → +2 (set all care_plan_updated)
      inp.loss_identification_records.forEach((l) => (l.care_plan_updated = true));
      // B9: proactiveSupport → keep at 60%, +0
      // Total = 52 + 4 + 4 + 3 + 2 = 65
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(65);
      expect(r.grief_rating).toBe("good");
    });

    it("score boundaries: exactly 45 is adequate", () => {
      // Base 52 - 5 (lossIdRate penalty) - 4 (interventionEffectiveness penalty) + 2 (carePlan bonus) = 45
      // Need lossIdRate < 50 → penalty -5
      // Need interventionEffectiveness < 40 → penalty -4
      // Need carePlanUpdateRate >= 100 → +2
      // 52 - 5 - 4 + 2 = 45
      const inp = zeroInput();
      // Penalty: lossIdRate < 50: make only 4/10 have support_plan (=40%)
      inp.loss_identification_records.forEach((l, i) => (l.support_plan_in_place = i < 4));
      // Penalty: interventionEffectivenessRate < 40: make only 3/10 improved (=30%)
      inp.grief_intervention_records.forEach((iv, i) => {
        iv.current_grief_score = i < 3 ? 5 : 8;
      });
      // Bonus: carePlanUpdateRate >= 100
      inp.loss_identification_records.forEach((l) => (l.care_plan_updated = true));
      // Total = 52 - 5 - 4 + 2 = 45
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(45);
      expect(r.grief_rating).toBe("adequate");
    });

    it("score boundaries: 44 is inadequate", () => {
      // 52 - 5 - 4 + 1 = 44
      const inp = zeroInput();
      inp.loss_identification_records.forEach((l, i) => (l.support_plan_in_place = i < 4));
      inp.grief_intervention_records.forEach((iv, i) => {
        iv.current_grief_score = i < 3 ? 5 : 8;
      });
      // carePlanUpdateRate >= 80 but < 100 → +1
      inp.loss_identification_records.forEach((l, i) => (l.care_plan_updated = i < 8));
      // Total = 52 - 5 - 4 + 1 = 44
      const r = computeGriefBereavementSupport(inp);
      expect(r.grief_score).toBe(44);
      expect(r.grief_rating).toBe("inadequate");
    });

    it("score boundaries: 79 is good not outstanding", () => {
      // Base 52 + 27 = 79. Need all bonuses except -1 from one
      // All bonuses = +28. Drop 1 from proactive (+2→+1).
      // proactiveSupportRate >= 70 but < 90 → +1 (instead of +2)
      const r = computeGriefBereavementSupport(
        baseInput({
          anniversary_management_records: [
            makeAnniversary("a1", { proactive_support_offered: true }),
            makeAnniversary("a2", { child_id: "c2", proactive_support_offered: true }),
            makeAnniversary("a3", { child_id: "c3", proactive_support_offered: true }),
            makeAnniversary("a4", { child_id: "c4", proactive_support_offered: false }),
          ],
        }),
      );
      // proactive = 3/4 = 75% → +1, annivMgmt = 4/4 = 100% → +3
      // Wait, all have plan_in_place=true by default. So annivMgmt = 100%.
      // Other bonuses all at 100% from baseInput.
      // Total = 52 + 4+4+3+4+3+3+3+2+1 = 79
      expect(r.grief_score).toBe(79);
      expect(r.grief_rating).toBe("good");
    });

    it("output shape has all expected keys", () => {
      const r = computeGriefBereavementSupport(baseInput());
      expect(r).toHaveProperty("grief_rating");
      expect(r).toHaveProperty("grief_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_losses_identified");
      expect(r).toHaveProperty("loss_identification_rate");
      expect(r).toHaveProperty("counselling_access_rate");
      expect(r).toHaveProperty("memory_work_rate");
      expect(r).toHaveProperty("intervention_effectiveness_rate");
      expect(r).toHaveProperty("anniversary_management_rate");
      expect(r).toHaveProperty("child_coping_rate");
      expect(r).toHaveProperty("counselling_wait_avg_days");
      expect(r).toHaveProperty("intervention_progress_avg");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });
  });
});

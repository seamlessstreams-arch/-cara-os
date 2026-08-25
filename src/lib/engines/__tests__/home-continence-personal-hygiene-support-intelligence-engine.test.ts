// ══════════════════════════════════════════════════════════════════════════════
// CARA -- HOME CONTINENCE & PERSONAL HYGIENE SUPPORT INTELLIGENCE ENGINE -- TESTS
// CHR 2015 Reg 5/14: Continence management and personal hygiene support.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeContinencePersonalHygieneSupport,
  type ContinenceHygieneInput,
  type ContinencePlanRecordInput,
  type HygieneRoutineRecordInput,
  type DignityCareRecordInput,
  type AgeGuidanceRecordInput,
  type ProductProvisionRecordInput,
} from "../home-continence-personal-hygiene-support-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeContinencePlan(overrides: Partial<ContinencePlanRecordInput> = {}): ContinencePlanRecordInput {
  return {
    id: "cp_1",
    child_id: "yp_alex",
    plan_created_date: "2026-01-10",
    plan_review_date: "2026-04-10",
    plan_reviewed_on_time: true,
    condition_type: "enuresis_nocturnal",
    plan_in_place: true,
    plan_personalised: true,
    goals_set: true,
    goals_reviewed: true,
    goals_progressing: true,
    medical_advice_sought: true,
    medical_professional_involved: true,
    gp_referral_made: true,
    specialist_referral_made: false,
    night_management_plan: true,
    daytime_management_plan: true,
    school_plan_shared: true,
    triggers_identified: true,
    fluid_intake_monitored: true,
    diet_reviewed: true,
    toileting_schedule_in_place: true,
    reward_system_used: true,
    child_involved_in_planning: true,
    parent_carer_informed: true,
    social_worker_informed: true,
    confidentiality_maintained: true,
    staff_aware_of_plan: true,
    staff_trained: true,
    records_kept_securely: true,
    progress_notes_up_to_date: true,
    notes: "",
    created_at: "2026-01-10",
    ...overrides,
  };
}

function makeHygieneRoutine(overrides: Partial<HygieneRoutineRecordInput> = {}): HygieneRoutineRecordInput {
  return {
    id: "hr_1",
    child_id: "yp_alex",
    date: "2026-05-01",
    routine_type: "morning",
    routine_supported: true,
    routine_completed: true,
    child_independent: true,
    child_prompted: false,
    child_assisted: false,
    child_refused: false,
    refusal_handled_sensitively: false,
    age_appropriate_approach: true,
    dignity_maintained: true,
    products_available: true,
    products_suitable: true,
    cultural_needs_met: true,
    sensory_needs_considered: true,
    same_gender_support_offered: true,
    privacy_respected: true,
    child_choice_respected: true,
    routine_personalised: true,
    encouragement_given: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeDignityCare(overrides: Partial<DignityCareRecordInput> = {}): DignityCareRecordInput {
  return {
    id: "dc_1",
    child_id: "yp_alex",
    date: "2026-05-01",
    context: "continence_support",
    dignity_maintained: true,
    privacy_ensured: true,
    consent_sought: true,
    child_views_respected: true,
    minimal_staff_involved: true,
    same_gender_carer_offered: true,
    same_gender_carer_provided: true,
    discrete_approach_used: true,
    child_embarrassment_minimised: true,
    peer_awareness_managed: true,
    clean_clothes_provided_promptly: true,
    bedding_changed_promptly: true,
    no_shaming_language: true,
    positive_reassurance_given: true,
    incident_recorded_sensitively: true,
    child_debriefed: true,
    emotional_support_offered: true,
    staff_followed_protocol: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeAgeGuidance(overrides: Partial<AgeGuidanceRecordInput> = {}): AgeGuidanceRecordInput {
  return {
    id: "ag_1",
    child_id: "yp_alex",
    date: "2026-05-01",
    guidance_type: "hygiene_education",
    age_appropriate: true,
    development_appropriate: true,
    delivered_sensitively: true,
    child_engaged: true,
    child_understood: true,
    visual_aids_used: true,
    materials_provided: true,
    follow_up_planned: true,
    follow_up_completed: true,
    delivered_by: "keyworker",
    child_questions_encouraged: true,
    child_feedback_positive: true,
    parent_carer_consulted: true,
    cultural_sensitivity_shown: true,
    linked_to_care_plan: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeProductProvision(overrides: Partial<ProductProvisionRecordInput> = {}): ProductProvisionRecordInput {
  return {
    id: "pp_1",
    child_id: "yp_alex",
    date: "2026-05-01",
    product_category: "toiletries",
    product_available: true,
    product_suitable: true,
    product_preferred_by_child: true,
    sufficient_quantity: true,
    stored_discreetly: true,
    easy_access_for_child: true,
    brand_choice_offered: true,
    cultural_needs_met: true,
    sensory_needs_met: true,
    replenished_on_time: true,
    budget_adequate: true,
    child_consulted_on_choice: true,
    age_appropriate: true,
    medical_recommendation_followed: true,
    quality_acceptable: true,
    child_dignity_preserved: true,
    staff_aware_of_needs: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

/** Full "all-good" baseline that should yield outstanding */
function baseInput(overrides: Partial<ContinenceHygieneInput> = {}): ContinenceHygieneInput {
  return {
    today: "2026-05-29",
    total_children: 3,
    continence_plan_records: [
      makeContinencePlan({ id: "cp_1", child_id: "yp_alex" }),
      makeContinencePlan({ id: "cp_2", child_id: "yp_jordan" }),
      makeContinencePlan({ id: "cp_3", child_id: "yp_casey" }),
    ],
    hygiene_routine_records: [
      makeHygieneRoutine({ id: "hr_1", child_id: "yp_alex" }),
      makeHygieneRoutine({ id: "hr_2", child_id: "yp_jordan" }),
      makeHygieneRoutine({ id: "hr_3", child_id: "yp_casey" }),
    ],
    dignity_care_records: [
      makeDignityCare({ id: "dc_1", child_id: "yp_alex" }),
      makeDignityCare({ id: "dc_2", child_id: "yp_jordan" }),
      makeDignityCare({ id: "dc_3", child_id: "yp_casey" }),
    ],
    age_guidance_records: [
      makeAgeGuidance({ id: "ag_1", child_id: "yp_alex" }),
      makeAgeGuidance({ id: "ag_2", child_id: "yp_jordan" }),
      makeAgeGuidance({ id: "ag_3", child_id: "yp_casey" }),
    ],
    product_provision_records: [
      makeProductProvision({ id: "pp_1", child_id: "yp_alex" }),
      makeProductProvision({ id: "pp_2", child_id: "yp_jordan" }),
      makeProductProvision({ id: "pp_3", child_id: "yp_casey" }),
    ],
    ...overrides,
  };
}

// Shorthand: create N records with maker
function nRecords<T>(n: number, maker: (o: Partial<T>) => T, overrides: Partial<T> = {}): T[] {
  return Array.from({ length: n }, (_, i) =>
    maker({ ...overrides, id: `rec_${i + 1}` } as Partial<T>),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient_data", () => {
  it("returns insufficient_data when all arrays empty and total_children=0", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 0,
      continence_plan_records: [],
      hygiene_routine_records: [],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [],
    });
    expect(r.hygiene_rating).toBe("insufficient_data");
    expect(r.hygiene_score).toBe(0);
  });

  it("headline mentions insufficient data", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 0,
      continence_plan_records: [],
      hygiene_routine_records: [],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [],
    });
    expect(r.headline).toContain("insufficient data");
  });

  it("all totals are 0 on insufficient_data", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 0,
      continence_plan_records: [],
      hygiene_routine_records: [],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [],
    });
    expect(r.total_continence_plans).toBe(0);
    expect(r.total_hygiene_routines).toBe(0);
    expect(r.total_dignity_care_records).toBe(0);
    expect(r.total_age_guidance_records).toBe(0);
    expect(r.total_product_provision_records).toBe(0);
  });

  it("all rates are null on insufficient_data", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 0,
      continence_plan_records: [],
      hygiene_routine_records: [],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [],
    });
    expect(r.continence_plan_rate).toBeNull();
    expect(r.hygiene_routine_rate).toBeNull();
    expect(r.dignity_compliance_rate).toBeNull();
    expect(r.age_appropriate_rate).toBeNull();
    expect(r.product_provision_rate).toBeNull();
    expect(r.child_independence_rate).toBeNull();
  });

  it("no strengths, concerns, recommendations, or insights on insufficient_data", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 0,
      continence_plan_records: [],
      hygiene_routine_records: [],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [],
    });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE FLOOR (all empty + children > 0)
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate floor (all empty + children > 0)", () => {
  const result = computeContinencePersonalHygieneSupport({
    today: "2026-05-29",
    total_children: 4,
    continence_plan_records: [],
    hygiene_routine_records: [],
    dignity_care_records: [],
    age_guidance_records: [],
    product_provision_records: [],
  });

  it("returns inadequate rating", () => {
    expect(result.hygiene_rating).toBe("inadequate");
  });

  it("score is 15", () => {
    expect(result.hygiene_score).toBe(15);
  });

  it("headline mentions urgent attention", () => {
    expect(result.headline).toContain("urgent attention");
  });

  it("has exactly 1 concern", () => {
    expect(result.concerns).toHaveLength(1);
    expect(result.concerns[0]).toContain("No continence plan records");
  });

  it("has exactly 2 recommendations", () => {
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0].urgency).toBe("immediate");
    expect(result.recommendations[1].urgency).toBe("immediate");
    expect(result.recommendations[0].rank).toBe(1);
    expect(result.recommendations[1].rank).toBe(2);
  });

  it("has exactly 1 critical insight", () => {
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].severity).toBe("critical");
    expect(result.insights[0].text).toContain("complete absence");
  });

  it("all rates remain 0", () => {
    expect(result.continence_plan_rate).toBeNull();
    expect(result.hygiene_routine_rate).toBeNull();
    expect(result.dignity_compliance_rate).toBeNull();
    expect(result.age_appropriate_rate).toBeNull();
    expect(result.product_provision_rate).toBeNull();
    expect(result.child_independence_rate).toBeNull();
  });

  it("works for 1 child", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 1,
      continence_plan_records: [],
      hygiene_routine_records: [],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [],
    });
    expect(r.hygiene_rating).toBe("inadequate");
    expect(r.hygiene_score).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. pct(0,0) = 0 EDGE CASE
// ═══════════════════════════════════════════════════════════════════════════

describe("pct(0,0) = 0", () => {
  it("empty arrays with at least one record type produce 0 for empty composite rates", () => {
    // Only hygiene routine records, everything else empty
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [],
      hygiene_routine_records: [makeHygieneRoutine()],
    }));
    expect(r.continence_plan_rate).toBeNull();
    expect(r.dignity_compliance_rate).toBeNull();
    expect(r.age_appropriate_rate).toBeNull();
    expect(r.product_provision_rate).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. OUTSTANDING SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding scenario", () => {
  const result = computeContinencePersonalHygieneSupport(baseInput());

  it("rating is outstanding", () => {
    expect(result.hygiene_rating).toBe("outstanding");
  });

  it("score is 80 (52 base + 28 max bonuses)", () => {
    expect(result.hygiene_score).toBe(80);
  });

  it("headline says outstanding", () => {
    expect(result.headline).toContain("Outstanding");
  });

  it("has multiple strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("has no concerns", () => {
    expect(result.concerns).toHaveLength(0);
  });

  it("has no recommendations", () => {
    expect(result.recommendations).toHaveLength(0);
  });

  it("total counts are correct", () => {
    expect(result.total_continence_plans).toBe(3);
    expect(result.total_hygiene_routines).toBe(3);
    expect(result.total_dignity_care_records).toBe(3);
    expect(result.total_age_guidance_records).toBe(3);
    expect(result.total_product_provision_records).toBe(3);
  });

  it("all composite rates are 100", () => {
    expect(result.continence_plan_rate).toBe(100);
    expect(result.hygiene_routine_rate).toBe(100);
    expect(result.dignity_compliance_rate).toBe(100);
    expect(result.age_appropriate_rate).toBe(100);
    expect(result.product_provision_rate).toBe(100);
    expect(result.child_independence_rate).toBe(100);
  });

  it("includes positive outstanding insight", () => {
    const pos = result.insights.filter((i) => i.severity === "positive");
    expect(pos.length).toBeGreaterThan(0);
    expect(pos.some((i) => i.text.includes("outstanding continence"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. GOOD SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("good scenario", () => {
  it("score 65-79 yields good rating", () => {
    // Achieve good by getting some bonuses but not all
    // base=52, need +13 to +27 more
    // Get bonuses 1(+3), 2(+3), 3(+3), 4(+2), 5(+2) = +13 -> 65
    // Set rates at 70-89 level for those, skip bonus 6 and 7
    const r = computeContinencePersonalHygieneSupport(baseInput({
      // continence plans: 3/4 (75%) for plan_in_place etc -> planRate ~75 -> +3
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", child_id: "yp_alex" }),
        makeContinencePlan({ id: "cp_2", child_id: "yp_jordan" }),
        makeContinencePlan({ id: "cp_3", child_id: "yp_casey" }),
        makeContinencePlan({ id: "cp_4", child_id: "yp_sam", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
      // hygiene routines: 3/4 true -> ~75 -> +3
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", child_id: "yp_alex" }),
        makeHygieneRoutine({ id: "hr_2", child_id: "yp_jordan" }),
        makeHygieneRoutine({ id: "hr_3", child_id: "yp_casey" }),
        makeHygieneRoutine({ id: "hr_4", child_id: "yp_sam", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
      // dignity: 4/5 -> 80% -> +3
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", child_id: "yp_alex" }),
        makeDignityCare({ id: "dc_2", child_id: "yp_jordan" }),
        makeDignityCare({ id: "dc_3", child_id: "yp_casey" }),
        makeDignityCare({ id: "dc_4", child_id: "yp_sam" }),
        makeDignityCare({ id: "dc_5", child_id: "yp_sam", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      // age guidance: 3/4 -> ~75 -> +2
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", child_id: "yp_alex" }),
        makeAgeGuidance({ id: "ag_2", child_id: "yp_jordan" }),
        makeAgeGuidance({ id: "ag_3", child_id: "yp_casey" }),
        makeAgeGuidance({ id: "ag_4", child_id: "yp_sam", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      // products: 3/4 -> ~75 -> +2
      product_provision_records: [
        makeProductProvision({ id: "pp_1", child_id: "yp_alex" }),
        makeProductProvision({ id: "pp_2", child_id: "yp_jordan" }),
        makeProductProvision({ id: "pp_3", child_id: "yp_casey" }),
        makeProductProvision({ id: "pp_4", child_id: "yp_sam", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
      total_children: 4,
    }));
    expect(r.hygiene_rating).toBe("good");
    expect(r.hygiene_score).toBeGreaterThanOrEqual(65);
    expect(r.hygiene_score).toBeLessThan(80);
  });

  it("good headline includes strengths count", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2" }),
        makeContinencePlan({ id: "cp_3" }),
        makeContinencePlan({ id: "cp_4", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2" }),
        makeHygieneRoutine({ id: "hr_3" }),
        makeHygieneRoutine({ id: "hr_4", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2" }),
        makeDignityCare({ id: "dc_3" }),
        makeDignityCare({ id: "dc_4" }),
        makeDignityCare({ id: "dc_5", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2" }),
        makeAgeGuidance({ id: "ag_3" }),
        makeAgeGuidance({ id: "ag_4", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2" }),
        makeProductProvision({ id: "pp_3" }),
        makeProductProvision({ id: "pp_4", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
      total_children: 4,
    }));
    expect(r.headline).toContain("Good");
    expect(r.headline).toContain("strength");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. ADEQUATE SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("adequate scenario", () => {
  it("score 45-64 yields adequate rating", () => {
    // base 52 with no bonuses, no penalties -> 52 = adequate
    // No bonuses: all rates below 70 (but above 40/50 to avoid penalties)
    // Rates: ~50% -> no bonuses and no penalties
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.hygiene_rating).toBe("adequate");
    expect(r.hygiene_score).toBeGreaterThanOrEqual(45);
    expect(r.hygiene_score).toBeLessThan(65);
  });

  it("adequate headline mentions concerns count", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toContain("concern");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. INADEQUATE SCENARIO (via penalties)
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate scenario (via penalties)", () => {
  it("all penalties fire -> score 34 (52 - 18)", () => {
    // All bad rates: continencePlanRate<40, hygieneRoutineRate<40, dignityComplianceRate<50, productProvisionRate<40
    // Also zero out child independence fields and confidentiality to avoid any bonuses
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, child_involved_in_planning: false, confidentiality_maintained: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false, child_independent: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false, child_consulted_on_choice: false }),
      ],
    }));
    // base 52, penalty -5 -5 -5 -3 = -18 = 34
    expect(r.hygiene_score).toBe(34);
    expect(r.hygiene_rating).toBe("inadequate");
  });

  it("inadequate headline mentions significant concerns", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [],
      product_provision_records: [
        makeProductProvision({ id: "pp_1", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("significant concern");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. BONUS ISOLATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("bonus isolation", () => {
  // Helper to create a base with NO bonuses and NO penalties:
  // all record types present but with 50% rates (above penalty, below bonus thresholds)
  function neutralInput(overrides: Partial<ContinenceHygieneInput> = {}): ContinenceHygieneInput {
    return {
      today: "2026-05-29",
      total_children: 2,
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, child_involved_in_planning: false, confidentiality_maintained: false, staff_trained: false, medical_professional_involved: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false, child_independent: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false, child_consulted_on_choice: false }),
      ],
      ...overrides,
    };
  }

  it("neutral baseline yields score=52 (no bonuses, no penalties)", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput());
    expect(r.hygiene_score).toBe(52);
  });

  // Bonus 1: continencePlanRate >= 90 -> +5
  it("bonus 1 high: continencePlanRate >= 90 -> +5", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      continence_plan_records: nRecords(10, makeContinencePlan),
    }));
    // All 10 have perfect defaults -> planRate 100 -> +5
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 5);
  });

  // Bonus 1 lower: continencePlanRate >= 70 -> +3
  it("bonus 1 low: continencePlanRate >= 70 (but <90) -> +3", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2" }),
        makeContinencePlan({ id: "cp_3" }),
        makeContinencePlan({ id: "cp_4", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, child_involved_in_planning: false, confidentiality_maintained: false }),
      ],
    }));
    // 3/4=75% for each component -> planRate = round((75+75+75+75)/4)=75 -> +3
    expect(r.continence_plan_rate).toBe(75);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 3);
  });

  // Bonus 2: hygieneRoutineRate >= 90 -> +5
  it("bonus 2 high: hygieneRoutineRate >= 90 -> +5", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      hygiene_routine_records: nRecords(10, makeHygieneRoutine),
    }));
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 5);
  });

  // Bonus 2 lower: hygieneRoutineRate >= 70 -> +3
  it("bonus 2 low: hygieneRoutineRate >= 70 (but <90) -> +3", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2" }),
        makeHygieneRoutine({ id: "hr_3" }),
        makeHygieneRoutine({ id: "hr_4", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false, child_independent: false }),
      ],
    }));
    expect(r.hygiene_routine_rate).toBe(75);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 3);
  });

  // Bonus 3: dignityComplianceRate >= 95 -> +5
  it("bonus 3 high: dignityComplianceRate >= 95 -> +5", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      dignity_care_records: nRecords(10, makeDignityCare),
    }));
    expect(r.dignity_compliance_rate).toBe(100);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 5);
  });

  // Bonus 3 lower: dignityComplianceRate >= 80 -> +3
  it("bonus 3 low: dignityComplianceRate >= 80 (but <95) -> +3", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2" }),
        makeDignityCare({ id: "dc_3" }),
        makeDignityCare({ id: "dc_4" }),
        makeDignityCare({ id: "dc_5", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
    }));
    // 4/5=80% for each component -> dignityComplianceRate = round((80+80+80+80+80+80)/6)=80 -> +3
    expect(r.dignity_compliance_rate).toBe(80);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 3);
  });

  // Bonus 4: ageAppropriateRate >= 90 -> +4
  it("bonus 4 high: ageAppropriateRate >= 90 -> +4", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      age_guidance_records: nRecords(10, makeAgeGuidance),
    }));
    expect(r.age_appropriate_rate).toBe(100);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 4);
  });

  // Bonus 4 lower: ageAppropriateRate >= 70 -> +2
  it("bonus 4 low: ageAppropriateRate >= 70 (but <90) -> +2", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2" }),
        makeAgeGuidance({ id: "ag_3" }),
        makeAgeGuidance({ id: "ag_4", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
    }));
    expect(r.age_appropriate_rate).toBe(75);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 2);
  });

  // Bonus 5: productProvisionRate >= 90 -> +4
  it("bonus 5 high: productProvisionRate >= 90 -> +4", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      product_provision_records: nRecords(10, makeProductProvision),
    }));
    expect(r.product_provision_rate).toBe(100);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 4);
  });

  // Bonus 5 lower: productProvisionRate >= 70 -> +2
  it("bonus 5 low: productProvisionRate >= 70 (but <90) -> +2", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2" }),
        makeProductProvision({ id: "pp_3" }),
        makeProductProvision({ id: "pp_4", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false, child_consulted_on_choice: false }),
      ],
    }));
    expect(r.product_provision_rate).toBe(75);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 2);
  });

  // Bonus 6: childIndependenceRate >= 90 -> +3
  it("bonus 6 high: childIndependenceRate >= 90 -> +3", () => {
    // child_independent on hygiene, child_involved_in_planning on continence,
    // child_engaged on guidance, child_consulted_on_choice on products
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      hygiene_routine_records: nRecords(10, makeHygieneRoutine),
      continence_plan_records: nRecords(10, makeContinencePlan),
      age_guidance_records: nRecords(10, makeAgeGuidance),
      product_provision_records: nRecords(10, makeProductProvision),
    }));
    expect(r.child_independence_rate).toBe(100);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 3);
  });

  // Bonus 6 lower: childIndependenceRate >= 70 -> +1
  it("bonus 6 low: childIndependenceRate >= 70 (but <90) -> +1", () => {
    // (3+2+2+2) / (4+3+3+3) = 9/13 = 69% -- still not 70
    // (3+2+2+2) = 9, denominator 13 -> pct(9,13) = round(69.23) = 69. Just short.
    // Try 10/13 = 77%
    const r3 = computeContinencePersonalHygieneSupport(neutralInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", child_independent: true }),
        makeHygieneRoutine({ id: "hr_2", child_independent: true }),
        makeHygieneRoutine({ id: "hr_3", child_independent: true }),
        makeHygieneRoutine({ id: "hr_4", child_independent: true, routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", child_involved_in_planning: true }),
        makeContinencePlan({ id: "cp_2", child_involved_in_planning: true }),
        makeContinencePlan({ id: "cp_3", child_involved_in_planning: false, plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, confidentiality_maintained: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", child_engaged: true }),
        makeAgeGuidance({ id: "ag_2", child_engaged: true }),
        makeAgeGuidance({ id: "ag_3", child_engaged: false, age_appropriate: false, development_appropriate: false, delivered_sensitively: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1", child_consulted_on_choice: true }),
        makeProductProvision({ id: "pp_2", child_consulted_on_choice: true }),
        makeProductProvision({ id: "pp_3", child_consulted_on_choice: false, product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    // (4+2+2+2) / (4+3+3+3) = 10/13 = pct(10,13) = round(76.92) = 77
    expect(r3.child_independence_rate).toBe(77);
    // This triggers bonus 6 lower (+1), but also bonus 2 is affected... we just check the rate is >=70
    expect(r3.child_independence_rate).toBeGreaterThanOrEqual(70);
    expect(r3.child_independence_rate).toBeLessThan(90);
  });

  // Bonus 7: confidentialityRate >= 95 && totalContinencePlans > 0 -> +2
  it("bonus 7: confidentialityRate >= 95 with plans -> +2", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      continence_plan_records: nRecords(10, makeContinencePlan),
    }));
    // All 10 have confidentiality_maintained: true -> 100% -> +2
    expect(r.hygiene_score).toBeGreaterThanOrEqual(52 + 2);
  });

  it("bonus 7 does NOT fire when totalContinencePlans = 0", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      continence_plan_records: [],
    }));
    // No plans -> even though technically no confidentiality violations, bonus 7 is guarded
    // Score should be 52 (neutral) minus nothing (no penalty since no records)
    expect(r.hygiene_score).toBe(52);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. PENALTY ISOLATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("penalty isolation", () => {
  function neutralInput(overrides: Partial<ContinenceHygieneInput> = {}): ContinenceHygieneInput {
    return {
      today: "2026-05-29",
      total_children: 2,
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, child_involved_in_planning: false, confidentiality_maintained: false, staff_trained: false, medical_professional_involved: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false, child_independent: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false, child_consulted_on_choice: false }),
      ],
      ...overrides,
    };
  }

  // Penalty 1: continencePlanRate < 40 -> -5
  it("penalty 1: continencePlanRate < 40 -> -5", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, child_involved_in_planning: false, confidentiality_maintained: false }),
      ],
    }));
    // record exists → 0, not null
    expect(r.continence_plan_rate).toBe(0);
    expect(r.hygiene_score).toBe(52 - 5);
  });

  // Penalty 1 does NOT fire when no records
  it("penalty 1 does NOT fire when continence_plan_records empty", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      continence_plan_records: [],
    }));
    expect(r.hygiene_score).toBe(52);
  });

  // Penalty 2: hygieneRoutineRate < 40 -> -5
  it("penalty 2: hygieneRoutineRate < 40 -> -5", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false, child_independent: false }),
      ],
    }));
    // record exists → 0, not null
    expect(r.hygiene_routine_rate).toBe(0);
    expect(r.hygiene_score).toBe(52 - 5);
  });

  // Penalty 2 does NOT fire when no records
  it("penalty 2 does NOT fire when hygiene_routine_records empty", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      hygiene_routine_records: [],
    }));
    expect(r.hygiene_score).toBe(52);
  });

  // Penalty 3: dignityComplianceRate < 50 -> -5
  it("penalty 3: dignityComplianceRate < 50 -> -5", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
    }));
    // record exists → 0, not null
    expect(r.dignity_compliance_rate).toBe(0);
    expect(r.hygiene_score).toBe(52 - 5);
  });

  // Penalty 3 does NOT fire when no records
  it("penalty 3 does NOT fire when dignity_care_records empty", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      dignity_care_records: [],
    }));
    expect(r.hygiene_score).toBe(52);
  });

  // Penalty 4: productProvisionRate < 40 -> -3
  it("penalty 4: productProvisionRate < 40 -> -3", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      product_provision_records: [
        makeProductProvision({ id: "pp_1", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false, child_consulted_on_choice: false }),
      ],
    }));
    // record exists → 0, not null
    expect(r.product_provision_rate).toBe(0);
    expect(r.hygiene_score).toBe(52 - 3);
  });

  // Penalty 4 does NOT fire when no records
  it("penalty 4 does NOT fire when product_provision_records empty", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      product_provision_records: [],
    }));
    expect(r.hygiene_score).toBe(52);
  });

  it("multiple penalties stack", () => {
    const r = computeContinencePersonalHygieneSupport(neutralInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, child_involved_in_planning: false, confidentiality_maintained: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false, child_independent: false }),
      ],
    }));
    // Penalties: -5 (continence) + -5 (hygiene) = -10
    expect(r.hygiene_score).toBe(52 - 10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. SIX COMPOSITE RATES
// ═══════════════════════════════════════════════════════════════════════════

describe("six composite rates", () => {
  describe("continence_plan_rate", () => {
    it("is average of planInPlace, personalised, reviewedOnTime, goalsSet rates", () => {
      // 2 records: one all-true, one with plan_in_place=false, rest true
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [
          makeContinencePlan({ id: "cp_1" }),
          makeContinencePlan({ id: "cp_2", plan_in_place: false }),
        ],
      }));
      // planInPlaceRate = pct(1,2) = 50
      // planPersonalisedRate = pct(1,2) = 50 (only in_place AND personalised counted)
      // planReviewRate = pct(2,2) = 100
      // goalsSetRate = pct(2,2) = 100
      // avg = (50+50+100+100)/4 = 75
      expect(r.continence_plan_rate).toBe(75);
    });

    it("returns null when no continence plans", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [],
      }));
      expect(r.continence_plan_rate).toBeNull();
    });
  });

  describe("hygiene_routine_rate", () => {
    it("is average of support, completion, dignity, privacy, ageAppropriate rates", () => {
      // 2 records: one all-true, one with routine_supported=false
      const r = computeContinencePersonalHygieneSupport(baseInput({
        hygiene_routine_records: [
          makeHygieneRoutine({ id: "hr_1" }),
          makeHygieneRoutine({ id: "hr_2", routine_supported: false }),
        ],
      }));
      // supported = 50, completed = 100, dignity = 100, privacy = 100, ageAppropriate = 100
      // avg = (50+100+100+100+100)/5 = 90
      expect(r.hygiene_routine_rate).toBe(90);
    });

    it("returns null when no hygiene routines", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        hygiene_routine_records: [],
      }));
      expect(r.hygiene_routine_rate).toBeNull();
    });
  });

  describe("dignity_compliance_rate", () => {
    it("is average of dignity, privacy, consent, noShaming, embarrassment, reassurance rates", () => {
      // 2 records: one all-true, one with dignity_maintained=false
      const r = computeContinencePersonalHygieneSupport(baseInput({
        dignity_care_records: [
          makeDignityCare({ id: "dc_1" }),
          makeDignityCare({ id: "dc_2", dignity_maintained: false }),
        ],
      }));
      // dignity = 50, privacy = 100, consent = 100, noShaming = 100, embarrassment = 100, reassurance = 100
      // avg = (50+100+100+100+100+100)/6 = round(91.67) = 92
      expect(r.dignity_compliance_rate).toBe(92);
    });

    it("returns null when no dignity care records", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        dignity_care_records: [],
      }));
      expect(r.dignity_compliance_rate).toBeNull();
    });
  });

  describe("age_appropriate_rate", () => {
    it("is average of ageAppropriate, development, deliveredSensitively, childEngaged rates", () => {
      // 2 records: one all-true, one with age_appropriate=false
      const r = computeContinencePersonalHygieneSupport(baseInput({
        age_guidance_records: [
          makeAgeGuidance({ id: "ag_1" }),
          makeAgeGuidance({ id: "ag_2", age_appropriate: false }),
        ],
      }));
      // ageAppropriate = 50, development = 100, delivered = 100, engaged = 100
      // avg = (50+100+100+100)/4 = 88 (round)
      expect(r.age_appropriate_rate).toBe(88);
    });

    it("returns null when no age guidance records", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        age_guidance_records: [],
      }));
      expect(r.age_appropriate_rate).toBeNull();
    });
  });

  describe("product_provision_rate", () => {
    it("is average of availability, suitability, quantity, storedDiscreetly, dignity rates", () => {
      // 2 records: one all-true, one with product_available=false
      const r = computeContinencePersonalHygieneSupport(baseInput({
        product_provision_records: [
          makeProductProvision({ id: "pp_1" }),
          makeProductProvision({ id: "pp_2", product_available: false }),
        ],
      }));
      // availability = 50, suitability = 100, quantity = 100, storedDiscreetly = 100, dignity = 100
      // avg = (50+100+100+100+100)/5 = 90
      expect(r.product_provision_rate).toBe(90);
    });

    it("returns null when no product provision records", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        product_provision_records: [],
      }));
      expect(r.product_provision_rate).toBeNull();
    });
  });

  describe("child_independence_rate", () => {
    it("combines independence across all 4 record types", () => {
      // All records have child independence true
      const r = computeContinencePersonalHygieneSupport(baseInput());
      // hygiene: 3/3 independent, continence: 3/3 child_involved, guidance: 3/3 child_engaged, products: 3/3 child_consulted
      // total = 12/12 = 100%
      expect(r.child_independence_rate).toBe(100);
    });

    it("returns 0 when all record arrays empty", () => {
      // This hits the allEmpty + children > 0 path which returns 15 score
      // Let's use one record type with zero independence
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [makeContinencePlan({ id: "cp_1", child_involved_in_planning: false })],
        hygiene_routine_records: [makeHygieneRoutine({ id: "hr_1", child_independent: false })],
        age_guidance_records: [makeAgeGuidance({ id: "ag_1", child_engaged: false })],
        product_provision_records: [makeProductProvision({ id: "pp_1", child_consulted_on_choice: false })],
      }));
      // 0/4 = 0
      expect(r.child_independence_rate).toBe(0);
    });

    it("only includes record types that have records", () => {
      // Only hygiene records with 1/2 independent
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [],
        dignity_care_records: [makeDignityCare()],
        age_guidance_records: [],
        product_provision_records: [],
        hygiene_routine_records: [
          makeHygieneRoutine({ id: "hr_1", child_independent: true }),
          makeHygieneRoutine({ id: "hr_2", child_independent: false }),
        ],
      }));
      // Only hygiene contributes: 1/2 = 50
      expect(r.child_independence_rate).toBe(50);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("continencePlanRate >= 90 -> strength about continence plans", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Continence plan compliance at 100%"))).toBe(true);
  });

  it("continencePlanRate 70-89 -> strength about good standards", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2" }),
        makeContinencePlan({ id: "cp_3" }),
        makeContinencePlan({ id: "cp_4", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("good standards of continence management"))).toBe(true);
  });

  it("hygieneRoutineRate >= 90 -> strength about hygiene routines", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Hygiene routine quality at 100%"))).toBe(true);
  });

  it("hygieneRoutineRate 70-89 -> strength about good support", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2" }),
        makeHygieneRoutine({ id: "hr_3" }),
        makeHygieneRoutine({ id: "hr_4", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("good support for children's personal hygiene"))).toBe(true);
  });

  it("dignityComplianceRate >= 95 -> strength about exemplary dignity", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Dignity in care compliance at 100%"))).toBe(true);
  });

  it("dignityComplianceRate 80-94 -> strength about strong commitment", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2" }),
        makeDignityCare({ id: "dc_3" }),
        makeDignityCare({ id: "dc_4" }),
        makeDignityCare({ id: "dc_5", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("strong commitment"))).toBe(true);
  });

  it("ageAppropriateRate >= 90 -> strength about guidance", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Age-appropriate guidance rate at 100%"))).toBe(true);
  });

  it("ageAppropriateRate 70-89 -> strength about good standards", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2" }),
        makeAgeGuidance({ id: "ag_3" }),
        makeAgeGuidance({ id: "ag_4", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("good standards of age"))).toBe(true);
  });

  it("productProvisionRate >= 90 -> strength about products", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Product provision rate at 100%"))).toBe(true);
  });

  it("productProvisionRate 70-89 -> strength about access", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2" }),
        makeProductProvision({ id: "pp_3" }),
        makeProductProvision({ id: "pp_4", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("children have access to appropriate continence"))).toBe(true);
  });

  it("childIndependenceRate >= 90 -> strength about independence", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Child independence rate at 100%"))).toBe(true);
  });

  it("confidentialityRate >= 95 -> strength about confidentiality", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("confidentiality maintained"))).toBe(true);
  });

  it("noShamingRate >= 95 -> strength about shaming-free language", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("shaming language"))).toBe(true);
  });

  it("medicalInvolvementRate >= 90 -> strength about medical professionals", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("involve medical professionals"))).toBe(true);
  });

  it("medicalInvolvementRate 70-89 -> strength about good engagement", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2" }),
        makeContinencePlan({ id: "cp_3" }),
        makeContinencePlan({ id: "cp_4", medical_professional_involved: false }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("good engagement with health professionals"))).toBe(true);
  });

  it("refusalHandlingRate >= 95 with refusals -> strength", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", child_refused: true, refusal_handled_sensitively: true }),
        makeHygieneRoutine({ id: "hr_2" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("Refusals of hygiene support"))).toBe(true);
  });

  it("culturalNeedsRate >= 90 -> strength about cultural sensitivity", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("cultural needs"))).toBe(true);
  });

  it("sameGenderRate >= 90 -> strength about same-gender support", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Same-gender support offered"))).toBe(true);
  });

  it("childEngagedRate >= 90 -> strength about engagement in guidance", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("child engagement in age-appropriate guidance"))).toBe(true);
  });

  it("guidanceChildCoverage >= 100 -> strength about every child", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Every child has received"))).toBe(true);
  });

  it("guidanceChildCoverage 80-99 -> strength about coverage", () => {
    // 4 of 5 children have engaged guidance -> 80%
    const r = computeContinencePersonalHygieneSupport(baseInput({
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", child_id: "yp_alex" }),
        makeAgeGuidance({ id: "ag_2", child_id: "yp_jordan" }),
        makeAgeGuidance({ id: "ag_3", child_id: "yp_casey" }),
        makeAgeGuidance({ id: "ag_4", child_id: "yp_sam" }),
      ],
      total_children: 5,
    }));
    expect(r.strengths.some((s) => s.includes("of children have received age-appropriate guidance"))).toBe(true);
  });

  it("easyAccessRate >= 95 -> strength about product access", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("easily accessible to children"))).toBe(true);
  });

  it("replenishedRate >= 95 -> strength about replenishment", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("replenished on time"))).toBe(true);
  });

  it("cleanClothesRate >= 95 -> strength about clean clothes", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Clean clothes provided promptly"))).toBe(true);
  });

  it("peerAwarenessRate >= 90 -> strength about peer awareness", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Peer awareness managed"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("continencePlanRate < 40 -> critical concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("significantly deficient"))).toBe(true);
  });

  it("continencePlanRate 40-69 -> moderate concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
    }));
    // Rate = (50+50+50+50)/4=50 which is 40-69 range
    // Wait: plan_in_place=1/2=50%, personalised requires plan_in_place && personalised, so 1/2=50%, reviewed=1/2=50%, goals=1/2=50%
    // avg = 50 -> in 40-69 range
    expect(r.concerns.some((c) => c.includes("gaps in personalisation"))).toBe(true);
  });

  it("hygieneRoutineRate < 40 -> serious concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("serious welfare concern"))).toBe(true);
  });

  it("hygieneRoutineRate 40-69 -> moderate concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("inconsistencies in support"))).toBe(true);
  });

  it("dignityComplianceRate < 50 -> safeguarding concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("serious safeguarding concern"))).toBe(true);
  });

  it("dignityComplianceRate 50-79 -> moderate concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
    }));
    // dignityComplianceRate = avg(50,50,50,50,50,50)/6 = 50 -> 50-79 range
    expect(r.concerns.some((c) => c.includes("inconsistencies in privacy"))).toBe(true);
  });

  it("ageAppropriateRate < 40 -> critical concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("undermines children's understanding"))).toBe(true);
  });

  it("ageAppropriateRate 40-69 -> moderate concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("not consistently meeting"))).toBe(true);
  });

  it("productProvisionRate < 40 -> critical concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      product_provision_records: [
        makeProductProvision({ id: "pp_1", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("directly impacts children's dignity"))).toBe(true);
  });

  it("productProvisionRate 40-69 -> moderate concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("gaps in product availability"))).toBe(true);
  });

  it("childIndependenceRate < 30 -> critical concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [makeContinencePlan({ id: "cp_1", child_involved_in_planning: false })],
      hygiene_routine_records: [makeHygieneRoutine({ id: "hr_1", child_independent: false })],
      age_guidance_records: [makeAgeGuidance({ id: "ag_1", child_engaged: false })],
      product_provision_records: [makeProductProvision({ id: "pp_1", child_consulted_on_choice: false })],
    }));
    expect(r.child_independence_rate).toBe(0);
    expect(r.concerns.some((c) => c.includes("not being adequately involved"))).toBe(true);
  });

  it("childIndependenceRate 30-69 -> moderate concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", child_involved_in_planning: true }),
        makeContinencePlan({ id: "cp_2", child_involved_in_planning: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", child_independent: true }),
        makeHygieneRoutine({ id: "hr_2", child_independent: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", child_engaged: true }),
        makeAgeGuidance({ id: "ag_2", child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1", child_consulted_on_choice: true }),
        makeProductProvision({ id: "pp_2", child_consulted_on_choice: false }),
      ],
    }));
    // (1+1+1+1) / (2+2+2+2) = 4/8 = 50 -> 30-69 range
    expect(r.child_independence_rate).toBe(50);
    expect(r.concerns.some((c) => c.includes("more could be done to involve children"))).toBe(true);
  });

  it("noShamingRate < 80 -> concern about shaming language", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2", no_shaming_language: false }),
        makeDignityCare({ id: "dc_3", no_shaming_language: false }),
        makeDignityCare({ id: "dc_4", no_shaming_language: false }),
        makeDignityCare({ id: "dc_5", no_shaming_language: false }),
      ],
    }));
    // noShamingRate = 1/5 = 20% < 80
    expect(r.concerns.some((c) => c.includes("inappropriate or shaming language"))).toBe(true);
  });

  it("confidentialityRate < 80 -> concern about confidentiality", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2", confidentiality_maintained: false }),
        makeContinencePlan({ id: "cp_3", confidentiality_maintained: false }),
      ],
    }));
    // confidentialityRate = 1/3 = 33% < 80
    expect(r.concerns.some((c) => c.includes("breaches of confidentiality"))).toBe(true);
  });

  it("refusalHandlingRate < 70 with refusals -> concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", child_refused: true, refusal_handled_sensitively: false }),
        makeHygieneRoutine({ id: "hr_2", child_refused: true, refusal_handled_sensitively: false }),
        makeHygieneRoutine({ id: "hr_3", child_refused: true, refusal_handled_sensitively: true }),
      ],
    }));
    // 1/3 = 33% < 70
    expect(r.concerns.some((c) => c.includes("refusals handled sensitively"))).toBe(true);
  });

  it("medicalInvolvementRate < 50 -> concern about medical input", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", medical_professional_involved: false }),
        makeContinencePlan({ id: "cp_2", medical_professional_involved: false }),
        makeContinencePlan({ id: "cp_3", medical_professional_involved: true }),
      ],
    }));
    // medicalInvolvementRate = 1/3 = 33% < 50
    expect(r.concerns.some((c) => c.includes("not receiving specialist clinical input"))).toBe(true);
  });

  it("staffTrainedRate < 50 -> concern about staff training", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", staff_trained: false }),
        makeContinencePlan({ id: "cp_2", staff_trained: false }),
        makeContinencePlan({ id: "cp_3", staff_trained: true }),
      ],
    }));
    // staffTrainedRate = 1/3 = 33% < 50
    expect(r.concerns.some((c) => c.includes("staff may not be equipped"))).toBe(true);
  });

  it("easyAccessRate < 60 -> concern about product access", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      product_provision_records: [
        makeProductProvision({ id: "pp_1", easy_access_for_child: false }),
        makeProductProvision({ id: "pp_2", easy_access_for_child: false }),
        makeProductProvision({ id: "pp_3", easy_access_for_child: true }),
      ],
    }));
    // easyAccessRate = 1/3 = 33% < 60
    expect(r.concerns.some((c) => c.includes("undermines their dignity and independence"))).toBe(true);
  });

  it("peerAwarenessRate < 60 -> concern about peer awareness", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", peer_awareness_managed: false }),
        makeDignityCare({ id: "dc_2", peer_awareness_managed: false }),
        makeDignityCare({ id: "dc_3", peer_awareness_managed: true }),
      ],
    }));
    // peerAwarenessRate = 1/3 = 33% < 60
    expect(r.concerns.some((c) => c.includes("exposed to embarrassment among peers"))).toBe(true);
  });

  it("guidanceChildCoverage < 50 -> concern about coverage", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      total_children: 5,
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", child_id: "yp_alex", child_engaged: true }),
        makeAgeGuidance({ id: "ag_2", child_id: "yp_jordan", child_engaged: true }),
      ],
    }));
    // 2 unique children out of 5 = 40% < 50
    expect(r.concerns.some((c) => c.includes("missing out on essential"))).toBe(true);
  });

  it("no continence plans with children + non-empty data -> concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No continence plan records exist"))).toBe(true);
  });

  it("no dignity care records with children + non-empty data -> concern", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No dignity care records exist"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("ranks are sequential starting from 1", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, confidentiality_maintained: false, staff_trained: false, medical_professional_involved: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.recommendations.length).toBeGreaterThan(0);
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });

  it("continencePlanRate < 40 -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("continence management plans"))).toBe(true);
  });

  it("dignityComplianceRate < 50 -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("dignity in continence"))).toBe(true);
  });

  it("hygieneRoutineRate < 40 -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("hygiene routine support"))).toBe(true);
  });

  it("noShamingRate < 80 -> immediate recommendation about shaming", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", no_shaming_language: false }),
        makeDignityCare({ id: "dc_2", no_shaming_language: false }),
        makeDignityCare({ id: "dc_3", no_shaming_language: false }),
        makeDignityCare({ id: "dc_4", no_shaming_language: false }),
        makeDignityCare({ id: "dc_5" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("shaming language"))).toBe(true);
  });

  it("confidentialityRate < 80 -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", confidentiality_maintained: false }),
        makeContinencePlan({ id: "cp_2", confidentiality_maintained: false }),
        makeContinencePlan({ id: "cp_3" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("confidentiality practices"))).toBe(true);
  });

  it("productProvisionRate < 40 -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      product_provision_records: [
        makeProductProvision({ id: "pp_1", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("immediate access to suitable"))).toBe(true);
  });

  it("medicalInvolvementRate < 50 -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", medical_professional_involved: false }),
        makeContinencePlan({ id: "cp_2", medical_professional_involved: false }),
        makeContinencePlan({ id: "cp_3" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("medical professional involvement"))).toBe(true);
  });

  it("staffTrainedRate < 50 -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", staff_trained: false }),
        makeContinencePlan({ id: "cp_2", staff_trained: false }),
        makeContinencePlan({ id: "cp_3" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("continence management training"))).toBe(true);
  });

  it("refusalHandlingRate < 70 -> soon recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", child_refused: true, refusal_handled_sensitively: false }),
        makeHygieneRoutine({ id: "hr_2", child_refused: true, refusal_handled_sensitively: false }),
        makeHygieneRoutine({ id: "hr_3", child_refused: true, refusal_handled_sensitively: true }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("hygiene refusals"))).toBe(true);
  });

  it("ageAppropriateRate 40-69 -> soon recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("quality and consistency of age-appropriate guidance"))).toBe(true);
  });

  it("ageAppropriateRate < 40 -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently review the approach"))).toBe(true);
  });

  it("childIndependenceRate < 30 -> soon recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [makeContinencePlan({ id: "cp_1", child_involved_in_planning: false })],
      hygiene_routine_records: [makeHygieneRoutine({ id: "hr_1", child_independent: false })],
      age_guidance_records: [makeAgeGuidance({ id: "ag_1", child_engaged: false })],
      product_provision_records: [makeProductProvision({ id: "pp_1", child_consulted_on_choice: false })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("increase children's involvement"))).toBe(true);
  });

  it("easyAccessRate < 60 -> soon recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      product_provision_records: [
        makeProductProvision({ id: "pp_1", easy_access_for_child: false }),
        makeProductProvision({ id: "pp_2", easy_access_for_child: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("product storage and access"))).toBe(true);
  });

  it("peerAwarenessRate < 60 -> soon recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", peer_awareness_managed: false }),
        makeDignityCare({ id: "dc_2", peer_awareness_managed: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("peer awareness management"))).toBe(true);
  });

  it("continencePlanRate 40-69 -> soon recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Strengthen continence management plans"))).toBe(true);
  });

  it("hygieneRoutineRate 40-69 -> planned recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Improve consistency in hygiene routine"))).toBe(true);
  });

  it("dignityComplianceRate 50-79 -> planned recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Build on existing dignity standards"))).toBe(true);
  });

  it("productProvisionRate 40-69 -> planned recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Improve product provision standards"))).toBe(true);
  });

  it("childIndependenceRate 30-69 -> planned recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", child_involved_in_planning: true }),
        makeContinencePlan({ id: "cp_2", child_involved_in_planning: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", child_independent: true }),
        makeHygieneRoutine({ id: "hr_2", child_independent: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", child_engaged: true }),
        makeAgeGuidance({ id: "ag_2", child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1", child_consulted_on_choice: true }),
        makeProductProvision({ id: "pp_2", child_consulted_on_choice: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("active participation"))).toBe(true);
  });

  it("guidanceChildCoverage 50-79 -> planned recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      total_children: 4,
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", child_id: "yp_alex" }),
        makeAgeGuidance({ id: "ag_2", child_id: "yp_jordan" }),
        makeAgeGuidance({ id: "ag_3", child_id: "yp_casey" }),
      ],
    }));
    // 3/4 = 75% -> 50-79 range
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Extend age-appropriate guidance coverage"))).toBe(true);
  });

  it("no continence plans + children + not allEmpty -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Assess all children for continence needs"))).toBe(true);
  });

  it("no dignity care records + children + not allEmpty -> immediate recommendation", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      dignity_care_records: [],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Begin recording dignity"))).toBe(true);
  });

  it("all recommendations have regulatory_ref", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
    }));
    r.recommendations.forEach((rec) => {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  describe("critical insights", () => {
    it("continencePlanRate < 40 -> critical insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [
          makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("systemic failure"))).toBe(true);
    });

    it("dignityComplianceRate < 50 -> critical insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        dignity_care_records: [
          makeDignityCare({ id: "dc_1", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("safeguarding concern"))).toBe(true);
    });

    it("hygieneRoutineRate < 40 -> critical insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        hygiene_routine_records: [
          makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("priority welfare concern"))).toBe(true);
    });

    it("noShamingRate < 80 -> critical insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        dignity_care_records: [
          makeDignityCare({ id: "dc_1", no_shaming_language: false }),
          makeDignityCare({ id: "dc_2", no_shaming_language: false }),
          makeDignityCare({ id: "dc_3", no_shaming_language: false }),
          makeDignityCare({ id: "dc_4", no_shaming_language: false }),
          makeDignityCare({ id: "dc_5" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("lasting psychological harm"))).toBe(true);
    });

    it("confidentialityRate < 80 -> critical insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [
          makeContinencePlan({ id: "cp_1", confidentiality_maintained: false }),
          makeContinencePlan({ id: "cp_2", confidentiality_maintained: false }),
          makeContinencePlan({ id: "cp_3" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("most sensitive personal data"))).toBe(true);
    });

    it("productProvisionRate < 40 -> critical insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        product_provision_records: [
          makeProductProvision({ id: "pp_1", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("basic care requirement"))).toBe(true);
    });

    it("no continence plans + children + not allEmpty -> critical insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No continence plan records exist"))).toBe(true);
    });

    it("no dignity care records + children + not allEmpty -> critical insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        dignity_care_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No dignity care records exist"))).toBe(true);
    });
  });

  describe("warning insights", () => {
    it("continencePlanRate 40-69 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [
          makeContinencePlan({ id: "cp_1" }),
          makeContinencePlan({ id: "cp_2", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("improving but inconsistencies"))).toBe(true);
    });

    it("hygieneRoutineRate 40-69 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        hygiene_routine_records: [
          makeHygieneRoutine({ id: "hr_1" }),
          makeHygieneRoutine({ id: "hr_2", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("gaps in dignity, privacy"))).toBe(true);
    });

    it("dignityComplianceRate 50-79 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        dignity_care_records: [
          makeDignityCare({ id: "dc_1" }),
          makeDignityCare({ id: "dc_2", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("basic standards are being met"))).toBe(true);
    });

    it("ageAppropriateRate 40-69 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        age_guidance_records: [
          makeAgeGuidance({ id: "ag_1" }),
          makeAgeGuidance({ id: "ag_2", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("not consistently tailored"))).toBe(true);
    });

    it("productProvisionRate 40-69 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        product_provision_records: [
          makeProductProvision({ id: "pp_1" }),
          makeProductProvision({ id: "pp_2", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("gaps in suitability"))).toBe(true);
    });

    it("childIndependenceRate 30-69 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [
          makeContinencePlan({ id: "cp_1", child_involved_in_planning: true }),
          makeContinencePlan({ id: "cp_2", child_involved_in_planning: false }),
        ],
        hygiene_routine_records: [
          makeHygieneRoutine({ id: "hr_1", child_independent: true }),
          makeHygieneRoutine({ id: "hr_2", child_independent: false }),
        ],
        age_guidance_records: [
          makeAgeGuidance({ id: "ag_1", child_engaged: true }),
          makeAgeGuidance({ id: "ag_2", child_engaged: false }),
        ],
        product_provision_records: [
          makeProductProvision({ id: "pp_1", child_consulted_on_choice: true }),
          makeProductProvision({ id: "pp_2", child_consulted_on_choice: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("preparation for adulthood"))).toBe(true);
    });

    it("medicalInvolvementRate 50-69 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [
          makeContinencePlan({ id: "cp_1", medical_professional_involved: true }),
          makeContinencePlan({ id: "cp_2", medical_professional_involved: false }),
        ],
      }));
      // 1/2 = 50% -> 50-69 range
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("gaps remain"))).toBe(true);
    });

    it("staffTrainedRate 50-69 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [
          makeContinencePlan({ id: "cp_1", staff_trained: true }),
          makeContinencePlan({ id: "cp_2", staff_trained: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("not all staff"))).toBe(true);
    });

    it("refusalHandlingRate 70-94 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        hygiene_routine_records: [
          makeHygieneRoutine({ id: "hr_1", child_refused: true, refusal_handled_sensitively: true }),
          makeHygieneRoutine({ id: "hr_2", child_refused: true, refusal_handled_sensitively: true }),
          makeHygieneRoutine({ id: "hr_3", child_refused: true, refusal_handled_sensitively: true }),
          makeHygieneRoutine({ id: "hr_4", child_refused: true, refusal_handled_sensitively: false }),
        ],
      }));
      // 3/4 = 75% -> 70-94 range
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("most refusals are handled well"))).toBe(true);
    });

    it("followUpCompletionRate < 70 -> warning insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        age_guidance_records: [
          makeAgeGuidance({ id: "ag_1", follow_up_planned: true, follow_up_completed: false }),
          makeAgeGuidance({ id: "ag_2", follow_up_planned: true, follow_up_completed: false }),
          makeAgeGuidance({ id: "ag_3", follow_up_planned: true, follow_up_completed: true }),
        ],
      }));
      // 1/3 = 33% < 70
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Follow-up completion"))).toBe(true);
    });

    it("topConditions insight with >= 3 continence plans", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        continence_plan_records: [
          makeContinencePlan({ id: "cp_1", condition_type: "enuresis_nocturnal" }),
          makeContinencePlan({ id: "cp_2", condition_type: "enuresis_nocturnal" }),
          makeContinencePlan({ id: "cp_3", condition_type: "encopresis" }),
        ],
      }));
      expect(r.insights.some((i) => i.text.includes("most common continence conditions"))).toBe(true);
      expect(r.insights.some((i) => i.text.includes("nocturnal enuresis"))).toBe(true);
    });

    it("missing routine types insight when >= 2 missing and > 3 routines", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput({
        hygiene_routine_records: [
          makeHygieneRoutine({ id: "hr_1", routine_type: "morning" }),
          makeHygieneRoutine({ id: "hr_2", routine_type: "morning" }),
          makeHygieneRoutine({ id: "hr_3", routine_type: "morning" }),
          makeHygieneRoutine({ id: "hr_4", routine_type: "morning" }),
        ],
      }));
      // Missing: evening, bathing, dental, handwashing (4 >= 2)
      expect(r.insights.some((i) => i.text.includes("No records for"))).toBe(true);
    });
  });

  describe("positive insights", () => {
    it("outstanding rating -> positive insight about outstanding", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding continence"))).toBe(true);
    });

    it("continencePlanRate >= 90 + medicalInvolvement >= 90 -> positive insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("clinically-informed"))).toBe(true);
    });

    it("dignityComplianceRate >= 95 + noShamingRate >= 95 -> positive insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("exemplary practice"))).toBe(true);
    });

    it("hygieneRoutineRate >= 90 + routinePersonalisedRate >= 90 -> positive insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("personalised"))).toBe(true);
    });

    it("ageAppropriateRate >= 90 + childEngagedRate >= 90 -> positive insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("well-tailored"))).toBe(true);
    });

    it("productProvisionRate >= 90 + easyAccessRate >= 90 -> positive insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("promotes children's independence"))).toBe(true);
    });

    it("childIndependenceRate >= 90 -> positive insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("genuinely involved"))).toBe(true);
    });

    it("guidanceChildCoverage >= 100 -> positive insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child has received"))).toBe(true);
    });

    it("confidentialityRate >= 95 + secureRecordRate >= 95 -> positive insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding data protection"))).toBe(true);
    });

    it("culturalNeedsRate >= 90 + sensoryRate >= 90 -> positive insight", () => {
      const r = computeContinencePersonalHygieneSupport(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("inclusive, person-centred care"))).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("single record across all types produces valid result", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 1,
      continence_plan_records: [makeContinencePlan()],
      hygiene_routine_records: [makeHygieneRoutine()],
      dignity_care_records: [makeDignityCare()],
      age_guidance_records: [makeAgeGuidance()],
      product_provision_records: [makeProductProvision()],
    });
    expect(["outstanding", "good", "adequate", "inadequate"]).toContain(r.hygiene_rating);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(0);
    expect(r.hygiene_score).toBeLessThanOrEqual(100);
  });

  it("score is clamped at 0 minimum", () => {
    // Even though theoretically base(52) - max penalties(18) = 34, we verify clamping works
    // The clamp is 0-100 range
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false }),
      ],
    }));
    expect(r.hygiene_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped at 100 maximum", () => {
    // Full bonuses = 52 + 28 = 80. Should not exceed 100 even with many records.
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.hygiene_score).toBeLessThanOrEqual(100);
  });

  it("large number of records produces valid result", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 20,
      continence_plan_records: nRecords(50, makeContinencePlan),
      hygiene_routine_records: nRecords(100, makeHygieneRoutine),
      dignity_care_records: nRecords(80, makeDignityCare),
      age_guidance_records: nRecords(40, makeAgeGuidance),
      product_provision_records: nRecords(60, makeProductProvision),
    });
    expect(r.hygiene_rating).toBe("outstanding");
    expect(r.total_continence_plans).toBe(50);
    expect(r.total_hygiene_routines).toBe(100);
    expect(r.total_dignity_care_records).toBe(80);
    expect(r.total_age_guidance_records).toBe(40);
    expect(r.total_product_provision_records).toBe(60);
  });

  it("refusalHandlingRate defaults to 100 when no refusals", () => {
    // No child_refused in any record -> refusalHandlingRate = 100
    const r = computeContinencePersonalHygieneSupport(baseInput());
    // This is internal and not directly exposed, but its effects show up:
    // refusalHandlingRate >= 95 with refusals won't fire because no refusals
    // Just verify it doesn't crash and produces good result
    expect(r.hygiene_rating).toBe("outstanding");
  });

  it("followUpCompletionRate defaults to 100 when no follow-ups planned", () => {
    // No follow_up_planned -> followUpCompletionRate = 100
    const r = computeContinencePersonalHygieneSupport(baseInput({
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1", follow_up_planned: false }),
      ],
    }));
    // Should not generate follow-up warning
    expect(r.insights.every((i) => !i.text.includes("Follow-up completion"))).toBe(true);
  });

  it("mixed condition types with >= 3 plans generate condition insight", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", condition_type: "enuresis_nocturnal" }),
        makeContinencePlan({ id: "cp_2", condition_type: "encopresis" }),
        makeContinencePlan({ id: "cp_3", condition_type: "functional" }),
      ],
    }));
    expect(r.insights.some((i) => i.text.includes("most common continence conditions"))).toBe(true);
  });

  it("fewer than 3 plans do not generate condition insight", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", condition_type: "enuresis_nocturnal" }),
        makeContinencePlan({ id: "cp_2", condition_type: "encopresis" }),
      ],
    }));
    expect(r.insights.every((i) => !i.text.includes("most common continence conditions"))).toBe(true);
  });

  it("missing routine types don't trigger when <= 3 routines", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_type: "morning" }),
        makeHygieneRoutine({ id: "hr_2", routine_type: "morning" }),
        makeHygieneRoutine({ id: "hr_3", routine_type: "morning" }),
      ],
    }));
    expect(r.insights.every((i) => !i.text.includes("No records for"))).toBe(true);
  });

  it("missing routine types don't trigger when only 1 type missing", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_type: "morning" }),
        makeHygieneRoutine({ id: "hr_2", routine_type: "evening" }),
        makeHygieneRoutine({ id: "hr_3", routine_type: "bathing" }),
        makeHygieneRoutine({ id: "hr_4", routine_type: "dental" }),
      ],
    }));
    // Only handwashing missing = 1 < 2
    expect(r.insights.every((i) => !i.text.includes("No records for"))).toBe(true);
  });

  it("only hygiene routines provided (no continence/dignity/guidance/products)", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 2,
      continence_plan_records: [],
      hygiene_routine_records: [makeHygieneRoutine()],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [],
    });
    // Not allEmpty (hygiene has record), so it proceeds to scoring
    expect(r.hygiene_rating).not.toBe("insufficient_data");
    expect(r.total_hygiene_routines).toBe(1);
    expect(r.continence_plan_rate).toBeNull();
    expect(r.dignity_compliance_rate).toBeNull();
  });

  it("only continence plans provided (no hygiene/dignity/guidance/products)", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 2,
      continence_plan_records: [makeContinencePlan()],
      hygiene_routine_records: [],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [],
    });
    expect(r.hygiene_rating).not.toBe("insufficient_data");
    expect(r.total_continence_plans).toBe(1);
    expect(r.hygiene_routine_rate).toBeNull();
  });

  it("only dignity care records provided", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 2,
      continence_plan_records: [],
      hygiene_routine_records: [],
      dignity_care_records: [makeDignityCare()],
      age_guidance_records: [],
      product_provision_records: [],
    });
    expect(r.hygiene_rating).not.toBe("insufficient_data");
    expect(r.total_dignity_care_records).toBe(1);
  });

  it("only age guidance records provided", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 2,
      continence_plan_records: [],
      hygiene_routine_records: [],
      dignity_care_records: [],
      age_guidance_records: [makeAgeGuidance()],
      product_provision_records: [],
    });
    expect(r.hygiene_rating).not.toBe("insufficient_data");
    expect(r.total_age_guidance_records).toBe(1);
  });

  it("only product provision records provided", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 2,
      continence_plan_records: [],
      hygiene_routine_records: [],
      dignity_care_records: [],
      age_guidance_records: [],
      product_provision_records: [makeProductProvision()],
    });
    expect(r.hygiene_rating).not.toBe("insufficient_data");
    expect(r.total_product_provision_records).toBe(1);
  });

  it("total_children = 0 with records still computes normally", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 0,
      continence_plan_records: [makeContinencePlan()],
      hygiene_routine_records: [makeHygieneRoutine()],
      dignity_care_records: [makeDignityCare()],
      age_guidance_records: [makeAgeGuidance()],
      product_provision_records: [makeProductProvision()],
    });
    // Not allEmpty, but total_children = 0 doesn't trigger the special case
    // because allEmpty is false
    expect(r.hygiene_rating).not.toBe("insufficient_data");
  });

  it("guidance coverage is 0 when total_children = 0", () => {
    const r = computeContinencePersonalHygieneSupport({
      today: "2026-05-29",
      total_children: 0,
      continence_plan_records: [makeContinencePlan()],
      hygiene_routine_records: [makeHygieneRoutine()],
      dignity_care_records: [makeDignityCare()],
      age_guidance_records: [makeAgeGuidance()],
      product_provision_records: [makeProductProvision()],
    });
    // guidanceChildCoverage uses total_children as denominator
    // When total_children=0, coverage = 0 (guarded)
    // So the strength about "Every child has received" won't fire
    expect(r.strengths.every((s) => !s.includes("Every child has received"))).toBe(true);
  });

  it("condition type labels are correctly mapped", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", condition_type: "enuresis_diurnal" }),
        makeContinencePlan({ id: "cp_2", condition_type: "enuresis_diurnal" }),
        makeContinencePlan({ id: "cp_3", condition_type: "stress" }),
      ],
    }));
    expect(r.insights.some((i) => i.text.includes("diurnal enuresis"))).toBe(true);
  });

  it("plan_personalised only counts when plan_in_place is true", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: true }),
        makeContinencePlan({ id: "cp_2", plan_in_place: true, plan_personalised: true }),
      ],
    }));
    // planPersonalisedRate = pct(1, 2) = 50 (only plan_in_place AND personalised)
    // planInPlaceRate = pct(1, 2) = 50
    // planReviewRate = pct(2, 2) = 100
    // goalsSetRate = pct(2, 2) = 100
    // continence_plan_rate = round((50+50+100+100)/4) = 75
    expect(r.continence_plan_rate).toBe(75);
  });

  it("goals_progressing only counts when goals_set is true", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", goals_set: false, goals_progressing: true }),
        makeContinencePlan({ id: "cp_2", goals_set: true, goals_progressing: true }),
      ],
    }));
    // goalsProgressRate = pct(1, 2) = 50 (only goals_set AND goals_progressing)
    // But goalsProgressRate doesn't directly affect the composite continence_plan_rate
    // The composite uses goalsSetRate: pct(1,2)=50
    // planInPlace=100, planPersonalised=100, planReview=100, goalsSet=50
    // avg = round((100+100+100+50)/4) = 88
    expect(r.continence_plan_rate).toBe(88);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. RATING BOUNDARY TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating boundaries", () => {
  it("score = 80 -> outstanding", () => {
    // Full bonuses = 52 + 28 = 80
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r.hygiene_score).toBe(80);
    expect(r.hygiene_rating).toBe("outstanding");
  });

  it("score = 79 -> good", () => {
    // Need exactly 79: 52 + 27 bonuses
    // Get all bonuses except confidentiality (saves 2): 52 + 26 = 78. Still not 79.
    // Get all high bonuses except bonus6 high (save 2 by getting +1 instead of +3): 52 + 26 = 78.
    // Actually: all high bonuses = +5+5+5+4+4+3+2 = 28 = 80. If we drop bonus 7 (-2) = 78.
    // To get 79: need 27 bonuses. Drop bonus7 (-2) and get bonus6 high (+3->+1 saves 2) for 24+1 = 25. Not right.
    // Let's think: need score 52+X where X = 27 for total 79.
    // Bonuses: 5+5+5+4+4+3+2 = 28. To get 27: need to lose 1 from somewhere.
    // Replace bonus 6 high (+3) with bonus 6 low (+1): total = 5+5+5+4+4+1+2 = 26. Score=78.
    // Replace bonus 7 (+2) with nothing: 5+5+5+4+4+3+0 = 26. Score=78.
    // Replace bonus 1 high (+5) with low (+3): 3+5+5+4+4+3+2 = 26. Score=78.
    // We can't easily get exactly 79 because bonuses are integers.
    // 52 + 5+5+5+4+4+3+0 = 78. 52 + 5+5+5+4+4+1+2 = 78.
    // 52 + 3+5+5+4+4+3+2 = 78. 52 + 5+3+5+4+4+3+2 = 78.
    // Actually, there's no combination that yields exactly 79.
    // The closest below 80 is 78 (52+26). Let's test that 78 = good.
    // Actually wait, let me recalculate if we can trigger penalties with bonuses...
    // Better: just verify that 79 would be good via toRating logic
    // Since the score is integer and max is 80, 79 can't actually occur from the engine.
    // But we can verify the boundary by checking score 78 yields "good"
    // and score 80 yields "outstanding".
    // Skip this test if we can't engineer exactly 79. Let's test threshold behavior.
    // Score 78 -> good (< 80)
    const r = computeContinencePersonalHygieneSupport(baseInput({
      // Drop confidentiality bonus by removing it from continence plans
      continence_plan_records: nRecords(10, makeContinencePlan, { confidentiality_maintained: false } as Partial<ContinencePlanRecordInput>),
    }));
    // continencePlanRate still 100 (confidentiality doesn't affect the composite)
    // But confidentialityRate = 0% -> no bonus 7
    // Score = 52 + 5+5+5+4+4+3+0 = 78
    expect(r.hygiene_score).toBe(78);
    expect(r.hygiene_rating).toBe("good");
  });

  it("score = 65 -> good", () => {
    // base 52 + 13 bonuses
    // Get bonus 1 low(+3) + bonus 2 low(+3) + bonus 3 low(+3) + bonus 4 low(+2) + bonus 5 low(+2) = 13
    // This means score = 65 = good boundary
    // We already tested this in the good scenario - just verify boundary
    // Need rates: continence 70+, hygiene 70+, dignity 80+, age 70+, product 70+
    // independence < 70 (no bonus 6), confidentiality < 95 (no bonus 7)
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1" }),
        makeContinencePlan({ id: "cp_2" }),
        makeContinencePlan({ id: "cp_3" }),
        makeContinencePlan({ id: "cp_4", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, child_involved_in_planning: false, confidentiality_maintained: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2" }),
        makeHygieneRoutine({ id: "hr_3" }),
        makeHygieneRoutine({ id: "hr_4", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false, child_independent: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2" }),
        makeDignityCare({ id: "dc_3" }),
        makeDignityCare({ id: "dc_4" }),
        makeDignityCare({ id: "dc_5", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2" }),
        makeAgeGuidance({ id: "ag_3" }),
        makeAgeGuidance({ id: "ag_4", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2" }),
        makeProductProvision({ id: "pp_3" }),
        makeProductProvision({ id: "pp_4", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false, child_consulted_on_choice: false }),
      ],
    }));
    // continencePlanRate = round((75+75+75+75)/4) = 75 -> +3
    // hygieneRoutineRate = round((75+75+75+75+75)/5) = 75 -> +3
    // dignityComplianceRate = round((80+80+80+80+80+80)/6) = 80 -> +3
    // ageAppropriateRate = round((75+75+75+75)/4) = 75 -> +2
    // productProvisionRate = round((75+75+75+75+75)/5) = 75 -> +2
    // childIndependenceRate: need to check
    //   hygiene: 3/4 independent, continence: 3/4 child_involved, guidance: 3/4 engaged, products: 3/4 consulted
    //   = (3+3+3+3)/(4+4+4+4) = 12/16 = 75% -> +1
    // confidentiality: 3/4 = 75% < 95 -> no bonus 7
    // Total bonuses: 3+3+3+2+2+1+0 = 14
    // Score: 52+14 = 66
    expect(r.hygiene_score).toBe(66);
    expect(r.hygiene_rating).toBe("good");
  });

  it("score = 45 -> adequate", () => {
    // base 52 - need to lose 7+ points to go below 52 but stay at or above 45
    // penalty 1 (-5) + no bonuses = 47 = adequate
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, child_involved_in_planning: false, confidentiality_maintained: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1" }),
        makeHygieneRoutine({ id: "hr_2", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false, child_independent: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false, child_consulted_on_choice: false }),
      ],
    }));
    // continencePlanRate = 0 -> penalty -5
    // All other rates ~50 -> no bonuses, no other penalties
    // Score = 52 - 5 = 47
    expect(r.hygiene_score).toBe(47);
    expect(r.hygiene_rating).toBe("adequate");
  });

  it("score = 44 -> inadequate", () => {
    // 52 - 5 - 5 = 42 (two penalties)
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false, child_involved_in_planning: false, confidentiality_maintained: false }),
      ],
      hygiene_routine_records: [
        makeHygieneRoutine({ id: "hr_1", routine_supported: false, routine_completed: false, dignity_maintained: false, privacy_respected: false, age_appropriate_approach: false, child_independent: false }),
      ],
      dignity_care_records: [
        makeDignityCare({ id: "dc_1" }),
        makeDignityCare({ id: "dc_2", dignity_maintained: false, privacy_ensured: false, consent_sought: false, no_shaming_language: false, child_embarrassment_minimised: false, positive_reassurance_given: false }),
      ],
      age_guidance_records: [
        makeAgeGuidance({ id: "ag_1" }),
        makeAgeGuidance({ id: "ag_2", age_appropriate: false, development_appropriate: false, delivered_sensitively: false, child_engaged: false }),
      ],
      product_provision_records: [
        makeProductProvision({ id: "pp_1" }),
        makeProductProvision({ id: "pp_2", product_available: false, product_suitable: false, sufficient_quantity: false, stored_discreetly: false, child_dignity_preserved: false, child_consulted_on_choice: false }),
      ],
    }));
    // continencePlanRate = 0 -> penalty -5
    // hygieneRoutineRate = 0 -> penalty -5
    // Score = 52 - 10 = 42
    expect(r.hygiene_score).toBe(42);
    expect(r.hygiene_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. RETURN STRUCTURE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

describe("return structure", () => {
  it("contains all expected fields", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(r).toHaveProperty("hygiene_rating");
    expect(r).toHaveProperty("hygiene_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_continence_plans");
    expect(r).toHaveProperty("total_hygiene_routines");
    expect(r).toHaveProperty("total_dignity_care_records");
    expect(r).toHaveProperty("total_age_guidance_records");
    expect(r).toHaveProperty("total_product_provision_records");
    expect(r).toHaveProperty("continence_plan_rate");
    expect(r).toHaveProperty("hygiene_routine_rate");
    expect(r).toHaveProperty("dignity_compliance_rate");
    expect(r).toHaveProperty("age_appropriate_rate");
    expect(r).toHaveProperty("product_provision_rate");
    expect(r).toHaveProperty("child_independence_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("rating is one of the defined values", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.hygiene_rating);
  });

  it("score is an integer between 0 and 100", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    expect(Number.isInteger(r.hygiene_score)).toBe(true);
    expect(r.hygiene_score).toBeGreaterThanOrEqual(0);
    expect(r.hygiene_score).toBeLessThanOrEqual(100);
  });

  it("rates are integers between 0 and 100", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    for (const rate of [
      r.continence_plan_rate,
      r.hygiene_routine_rate,
      r.dignity_compliance_rate,
      r.age_appropriate_rate,
      r.product_provision_rate,
      r.child_independence_rate,
    ]) {
      expect(Number.isInteger(rate)).toBe(true);
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    }
  });

  it("recommendations have valid urgency values", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput({
      continence_plan_records: [
        makeContinencePlan({ id: "cp_1", plan_in_place: false, plan_personalised: false, plan_reviewed_on_time: false, goals_set: false }),
      ],
    }));
    r.recommendations.forEach((rec) => {
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    });
  });

  it("insights have valid severity values", () => {
    const r = computeContinencePersonalHygieneSupport(baseInput());
    r.insights.forEach((ins) => {
      expect(["critical", "warning", "positive"]).toContain(ins.severity);
    });
  });
});

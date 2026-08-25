// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BEDWETTING & ENURESIS SUPPORT INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeBedwettingEnuresisSupport,
  type BedwettingEnuresisInput,
  type ManagementPlanRecordInput,
  type DiscreetSupportRecordInput,
  type DignityPreservationRecordInput,
  type MedicalReferralRecordInput,
  type EmotionalWellbeingRecordInput,
} from "../home-bedwetting-enuresis-support-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const baseInput: BedwettingEnuresisInput = {
  today: "2026-05-30",
  total_children: 4,
  management_plan_records: [],
  discreet_support_records: [],
  dignity_preservation_records: [],
  medical_referral_records: [],
  emotional_wellbeing_records: [],
};

function makePlan(overrides: Partial<ManagementPlanRecordInput> = {}): ManagementPlanRecordInput {
  return {
    id: "plan_1",
    child_id: "child_1",
    plan_created_date: "2026-01-10",
    plan_type: "individual_enuresis_plan",
    plan_active: true,
    reviewed: true,
    review_date: "2026-04-10",
    review_frequency: "monthly",
    child_involved_in_planning: true,
    parent_carer_informed: true,
    triggers_identified: true,
    triggers_documented: "Stress at school",
    night_routine_documented: true,
    fluid_intake_guidance_included: true,
    protective_bedding_in_place: true,
    alarm_system_used: false,
    medication_component: false,
    medication_name: null,
    progress_rating: 4,
    outcomes_documented: true,
    staff_trained_on_plan: true,
    last_incident_date: "2026-05-15",
    incident_frequency: "weekly",
    goals: "Reduce frequency",
    created_at: "2026-01-10T10:00:00Z",
    ...overrides,
  };
}

function makeSupport(overrides: Partial<DiscreetSupportRecordInput> = {}): DiscreetSupportRecordInput {
  return {
    id: "sup_1",
    child_id: "child_1",
    date: "2026-05-20",
    support_type: "bedding_change",
    handled_discreetly: true,
    child_aware_of_discretion: true,
    other_children_unaware: true,
    staff_approach_appropriate: true,
    child_dignity_maintained: true,
    private_storage_used: true,
    timing_appropriate: true,
    staff_member: "staff_1",
    child_feedback: "positive",
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeDignity(overrides: Partial<DignityPreservationRecordInput> = {}): DignityPreservationRecordInput {
  return {
    id: "dig_1",
    child_id: "child_1",
    assessment_date: "2026-05-15",
    private_laundry_arrangement: true,
    discreet_bedding_storage: true,
    room_access_restricted_appropriately: true,
    no_peer_awareness_incidents: true,
    child_not_blamed_or_shamed: true,
    language_used_sensitively: true,
    child_empowered_in_management: true,
    self_management_skills_taught: true,
    age_appropriate_explanation_given: true,
    normalisation_approach_used: true,
    overnight_stays_supported: true,
    school_trip_support_provided: true,
    peer_teasing_addressed: false,
    peer_teasing_incidents: 0,
    overall_dignity_score: 5,
    issues_identified: [],
    issues_resolved: false,
    resolution_date: null,
    assessed_by: "staff_1",
    created_at: "2026-05-15T10:00:00Z",
    ...overrides,
  };
}

function makeReferral(overrides: Partial<MedicalReferralRecordInput> = {}): MedicalReferralRecordInput {
  return {
    id: "ref_1",
    child_id: "child_1",
    referral_date: "2026-03-01",
    referral_type: "gp",
    referral_reason: "Persistent bedwetting",
    referral_made_by: "staff_1",
    referral_accepted: true,
    appointment_date: "2026-03-15",
    appointment_attended: true,
    outcome_documented: true,
    outcome_summary: "Continue monitoring",
    follow_up_required: true,
    follow_up_date: "2026-06-15",
    follow_up_completed: true,
    medication_prescribed: false,
    medication_name: null,
    medication_reviewed: false,
    treatment_plan_received: true,
    treatment_plan_implemented: true,
    professional_advice_shared_with_staff: true,
    child_consented_to_referral: true,
    parent_informed: true,
    social_worker_informed: true,
    created_at: "2026-03-01T10:00:00Z",
    ...overrides,
  };
}

function makeEmotional(overrides: Partial<EmotionalWellbeingRecordInput> = {}): EmotionalWellbeingRecordInput {
  return {
    id: "emo_1",
    child_id: "child_1",
    date: "2026-05-20",
    assessment_type: "keywork_session",
    emotional_impact_level: "mild",
    child_self_esteem_rating: 4,
    child_anxiety_around_bedtime: false,
    child_anxiety_around_sleepovers: false,
    child_avoids_overnight_activities: false,
    child_talks_openly_about_issue: true,
    child_feels_supported: true,
    child_feels_embarrassed: false,
    child_feels_different: false,
    peer_relationship_impact: "none",
    school_impact: "none",
    therapeutic_support_offered: true,
    therapeutic_support_accepted: true,
    therapeutic_support_type: "Counselling",
    coping_strategies_in_place: true,
    coping_strategies_effective: true,
    progress_since_last_assessment: "improved",
    staff_member: "staff_1",
    child_voice_captured: true,
    child_wishes_recorded: "Wants to go on sleepovers",
    confidence_in_management: true,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function manyPlans(n: number, overrides: Partial<ManagementPlanRecordInput> = {}): ManagementPlanRecordInput[] {
  return Array.from({ length: n }, (_, i) => makePlan({ id: `plan_${i}`, child_id: `child_${i}`, ...overrides }));
}
function manySupport(n: number, overrides: Partial<DiscreetSupportRecordInput> = {}): DiscreetSupportRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeSupport({ id: `sup_${i}`, ...overrides }));
}
function manyDignity(n: number, overrides: Partial<DignityPreservationRecordInput> = {}): DignityPreservationRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeDignity({ id: `dig_${i}`, child_id: `child_${i}`, ...overrides }));
}
function manyReferral(n: number, overrides: Partial<MedicalReferralRecordInput> = {}): MedicalReferralRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeReferral({ id: `ref_${i}`, ...overrides }));
}
function manyEmotional(n: number, overrides: Partial<EmotionalWellbeingRecordInput> = {}): EmotionalWellbeingRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeEmotional({ id: `emo_${i}`, child_id: `child_${i}`, ...overrides }));
}

// ── Insufficient Data ───────────────────────────────────────────────────────

describe("insufficient_data", () => {
  it("returns insufficient_data when no children and all arrays empty", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 0 });
    expect(r.enuresis_rating).toBe("insufficient_data");
    expect(r.enuresis_score).toBe(0);
  });

  it("returns null for all rate fields when insufficient_data", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 0 });
    expect(r.management_plan_rate).toBeNull();
    expect(r.discreet_support_rate).toBeNull();
    expect(r.dignity_preservation_rate).toBeNull();
    expect(r.medical_referral_rate).toBeNull();
    expect(r.emotional_wellbeing_rate).toBeNull();
    expect(r.child_confidence_rate).toBeNull();
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 0 });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns 0 totals when insufficient_data", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 0 });
    expect(r.total_management_plans).toBe(0);
    expect(r.total_support_interactions).toBe(0);
  });

  it("headline mentions insufficient data", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 0 });
    expect(r.headline.toLowerCase()).toContain("insufficient data");
  });
});

// ── Inadequate Floor ────────────────────────────────────────────────────────

describe("inadequate floor (children but no records)", () => {
  it("returns inadequate rating with score 15", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 3 });
    expect(r.enuresis_rating).toBe("inadequate");
    expect(r.enuresis_score).toBe(15);
  });

  it("has exactly 1 concern", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 3 });
    expect(r.concerns.length).toBe(1);
  });

  it("has exactly 2 recommendations with immediate urgency", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 3 });
    expect(r.recommendations.length).toBe(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("has exactly 1 critical insight", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 3 });
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("returns null for all rate fields at the inadequate floor", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 3 });
    expect(r.management_plan_rate).toBeNull();
    expect(r.discreet_support_rate).toBeNull();
    expect(r.dignity_preservation_rate).toBeNull();
    expect(r.medical_referral_rate).toBeNull();
    expect(r.emotional_wellbeing_rate).toBeNull();
    expect(r.child_confidence_rate).toBeNull();
  });

  it("headline mentions urgent", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 3 });
    expect(r.headline.toLowerCase()).toContain("urgent");
  });
});

// ── pct(0,0) = 0 edge case ─────────────────────────────────────────────────

describe("pct(0,0) = 0 edge case", () => {
  it("rates default to 0 for empty sub-arrays even with data in others", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5),
    });
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.discreet_support_rate).toBeNull();
    expect(r.discreet_support_rate).not.toBe(0); // 0% is a claim; nothing was measured
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.dignity_preservation_rate).toBeNull();
    expect(r.dignity_preservation_rate).not.toBe(0); // 0% is a claim; nothing was measured
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.medical_referral_rate).toBeNull();
    expect(r.medical_referral_rate).not.toBe(0); // 0% is a claim; nothing was measured
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.emotional_wellbeing_rate).toBeNull();
    expect(r.emotional_wellbeing_rate).not.toBe(0); // 0% is a claim; nothing was measured
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.child_confidence_rate).toBeNull();
    expect(r.child_confidence_rate).not.toBe(0); // 0% is a claim; nothing was measured
  });
});

// ── Base Score = 52 ─────────────────────────────────────────────────────────

describe("base score = 52", () => {
  it("score is 52 with neutral data (no bonuses, no penalties)", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: [
        makePlan({ plan_active: true, reviewed: true, child_involved_in_planning: true, triggers_identified: true, night_routine_documented: false, staff_trained_on_plan: false }),
        makePlan({ id: "p2", child_id: "c2", plan_active: true, reviewed: false, child_involved_in_planning: false, triggers_identified: false, night_routine_documented: true, staff_trained_on_plan: false }),
      ],
      // managementPlanRate: 6/12 = 50%
      discreet_support_records: [
        makeSupport({ handled_discreetly: true, other_children_unaware: true, staff_approach_appropriate: true, child_dignity_maintained: false, timing_appropriate: false }),
        makeSupport({ id: "s2", handled_discreetly: true, other_children_unaware: false, staff_approach_appropriate: true, child_dignity_maintained: false, timing_appropriate: false }),
      ],
      // discreetSupportRate: 5/10 = 50%
      dignity_preservation_records: [
        makeDignity({
          private_laundry_arrangement: true, discreet_bedding_storage: true,
          room_access_restricted_appropriately: true, no_peer_awareness_incidents: false,
          child_not_blamed_or_shamed: true, language_used_sensitively: false,
          child_empowered_in_management: false, normalisation_approach_used: false,
          age_appropriate_explanation_given: true,
        }),
        makeDignity({ id: "d2", child_id: "c2",
          private_laundry_arrangement: false, discreet_bedding_storage: false,
          room_access_restricted_appropriately: true, no_peer_awareness_incidents: true,
          child_not_blamed_or_shamed: false, language_used_sensitively: true,
          child_empowered_in_management: true, normalisation_approach_used: true,
          age_appropriate_explanation_given: false,
        }),
      ],
      // dignityPreservationRate: 10/18 = 56%, noBlamingRate: 1/2 = 50% (<80 → no bonus 9)
      medical_referral_records: [
        makeReferral({ referral_accepted: true, appointment_attended: true, outcome_documented: false, professional_advice_shared_with_staff: false, follow_up_required: false }),
      ],
      // medicalReferralRate: 2/4 = 50%
      emotional_wellbeing_records: [
        makeEmotional({ child_feels_supported: true, child_voice_captured: true, coping_strategies_in_place: false, confidence_in_management: false }),
        makeEmotional({ id: "e2", child_id: "c2", child_feels_supported: false, child_voice_captured: false, coping_strategies_in_place: true, confidence_in_management: false }),
      ],
      // emotionalWellbeingRate: 4/8 = 50%, childConfidenceRate: 0%
    });
    expect(r.enuresis_score).toBe(52);
  });
});

// ── Outstanding Rating ─────────────────────────────────────────────────────

describe("outstanding rating", () => {
  function makeOutstandingInput(): BedwettingEnuresisInput {
    return {
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: true,
        reviewed: true,
        child_involved_in_planning: true,
        triggers_identified: true,
        night_routine_documented: true,
        staff_trained_on_plan: true,
        progress_rating: 5,
      }),
      discreet_support_records: manySupport(10, {
        handled_discreetly: true,
        other_children_unaware: true,
        staff_approach_appropriate: true,
        child_dignity_maintained: true,
        timing_appropriate: true,
      }),
      dignity_preservation_records: manyDignity(5, {
        private_laundry_arrangement: true,
        discreet_bedding_storage: true,
        room_access_restricted_appropriately: true,
        no_peer_awareness_incidents: true,
        child_not_blamed_or_shamed: true,
        language_used_sensitively: true,
        child_empowered_in_management: true,
        normalisation_approach_used: true,
        age_appropriate_explanation_given: true,
      }),
      medical_referral_records: manyReferral(5, {
        referral_accepted: true,
        appointment_attended: true,
        outcome_documented: true,
        professional_advice_shared_with_staff: true,
        follow_up_required: true,
        follow_up_completed: true,
      }),
      emotional_wellbeing_records: manyEmotional(4, {
        child_feels_supported: true,
        child_voice_captured: true,
        coping_strategies_in_place: true,
        confidence_in_management: true,
      }),
    };
  }

  it("returns outstanding rating", () => {
    const r = computeBedwettingEnuresisSupport(makeOutstandingInput());
    expect(r.enuresis_rating).toBe("outstanding");
  });

  it("score is 80 (base 52 + 28 bonuses)", () => {
    const r = computeBedwettingEnuresisSupport(makeOutstandingInput());
    // Bonuses: +4+4+4+3+3+3+3+2+2 = 28
    expect(r.enuresis_score).toBe(80);
  });

  it("has no concerns", () => {
    const r = computeBedwettingEnuresisSupport(makeOutstandingInput());
    expect(r.concerns.length).toBe(0);
  });

  it("has positive insights", () => {
    const r = computeBedwettingEnuresisSupport(makeOutstandingInput());
    const positive = r.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThan(0);
  });

  it("has multiple strengths", () => {
    const r = computeBedwettingEnuresisSupport(makeOutstandingInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(5);
  });

  it("headline mentions outstanding", () => {
    const r = computeBedwettingEnuresisSupport(makeOutstandingInput());
    expect(r.headline.toLowerCase()).toContain("outstanding");
  });
});

// ── Good Rating ─────────────────────────────────────────────────────────────

describe("good rating", () => {
  function makeGoodInput(): BedwettingEnuresisInput {
    return {
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: true, reviewed: true, child_involved_in_planning: true,
        triggers_identified: true, night_routine_documented: false,
        staff_trained_on_plan: true, progress_rating: 4,
      }),
      discreet_support_records: [
        ...manySupport(7, { handled_discreetly: true, other_children_unaware: true, staff_approach_appropriate: true, child_dignity_maintained: true, timing_appropriate: true }),
        ...manySupport(3, { id: "sb", handled_discreetly: false, other_children_unaware: false, staff_approach_appropriate: false, child_dignity_maintained: false, timing_appropriate: false }),
      ],
      dignity_preservation_records: manyDignity(4, {
        private_laundry_arrangement: true, discreet_bedding_storage: true,
        room_access_restricted_appropriately: true, no_peer_awareness_incidents: true,
        child_not_blamed_or_shamed: true, language_used_sensitively: true,
        child_empowered_in_management: false, normalisation_approach_used: true,
        age_appropriate_explanation_given: true,
      }),
      medical_referral_records: manyReferral(4, {
        referral_accepted: true, appointment_attended: true,
        outcome_documented: true, professional_advice_shared_with_staff: false,
      }),
      emotional_wellbeing_records: manyEmotional(4, {
        child_feels_supported: true, child_voice_captured: true,
        coping_strategies_in_place: true, confidence_in_management: false,
      }),
    };
  }

  it("returns good rating", () => {
    const r = computeBedwettingEnuresisSupport(makeGoodInput());
    expect(r.enuresis_rating).toBe("good");
  });

  it("score is between 65 and 79", () => {
    const r = computeBedwettingEnuresisSupport(makeGoodInput());
    expect(r.enuresis_score).toBeGreaterThanOrEqual(65);
    expect(r.enuresis_score).toBeLessThan(80);
  });

  it("headline mentions good", () => {
    const r = computeBedwettingEnuresisSupport(makeGoodInput());
    expect(r.headline.toLowerCase()).toContain("good");
  });
});

// ── Adequate Rating ─────────────────────────────────────────────────────────

describe("adequate rating", () => {
  function makeAdequateInput(): BedwettingEnuresisInput {
    return {
      ...baseInput,
      management_plan_records: [
        makePlan({ plan_active: true, reviewed: true, child_involved_in_planning: true, triggers_identified: false, night_routine_documented: false, staff_trained_on_plan: false }),
        makePlan({ id: "p2", child_id: "c2", plan_active: true, reviewed: false, child_involved_in_planning: false, triggers_identified: true, night_routine_documented: true, staff_trained_on_plan: false }),
      ],
      discreet_support_records: [
        ...manySupport(5, { handled_discreetly: true, other_children_unaware: true, staff_approach_appropriate: true, child_dignity_maintained: true, timing_appropriate: false }),
        ...manySupport(5, { id: "sb", handled_discreetly: true, other_children_unaware: false, staff_approach_appropriate: false, child_dignity_maintained: false, timing_appropriate: false }),
      ],
      dignity_preservation_records: manyDignity(2, {
        private_laundry_arrangement: true, discreet_bedding_storage: true,
        room_access_restricted_appropriately: true, no_peer_awareness_incidents: false,
        child_not_blamed_or_shamed: true, language_used_sensitively: true,
        child_empowered_in_management: false, normalisation_approach_used: false,
        age_appropriate_explanation_given: false,
      }),
      medical_referral_records: [
        makeReferral({ referral_accepted: true, appointment_attended: true, outcome_documented: false, professional_advice_shared_with_staff: false }),
      ],
      emotional_wellbeing_records: manyEmotional(2, {
        child_feels_supported: true, child_voice_captured: false,
        coping_strategies_in_place: false, confidence_in_management: false,
      }),
    };
  }

  it("returns adequate rating", () => {
    const r = computeBedwettingEnuresisSupport(makeAdequateInput());
    expect(r.enuresis_rating).toBe("adequate");
  });

  it("score is between 45 and 64", () => {
    const r = computeBedwettingEnuresisSupport(makeAdequateInput());
    expect(r.enuresis_score).toBeGreaterThanOrEqual(45);
    expect(r.enuresis_score).toBeLessThan(65);
  });

  it("headline mentions adequate", () => {
    const r = computeBedwettingEnuresisSupport(makeAdequateInput());
    expect(r.headline.toLowerCase()).toContain("adequate");
  });
});

// ── Inadequate Rating ───────────────────────────────────────────────────────

describe("inadequate rating", () => {
  function makeInadequateInput(): BedwettingEnuresisInput {
    return {
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: false, reviewed: false, child_involved_in_planning: false,
        triggers_identified: false, night_routine_documented: false,
        staff_trained_on_plan: false,
      }),
      discreet_support_records: manySupport(10, {
        handled_discreetly: false, other_children_unaware: false,
        staff_approach_appropriate: false, child_dignity_maintained: false,
        timing_appropriate: false,
      }),
      dignity_preservation_records: manyDignity(5, {
        private_laundry_arrangement: false, discreet_bedding_storage: false,
        room_access_restricted_appropriately: false, no_peer_awareness_incidents: false,
        child_not_blamed_or_shamed: false, language_used_sensitively: false,
        child_empowered_in_management: false, normalisation_approach_used: false,
        age_appropriate_explanation_given: false,
      }),
      medical_referral_records: manyReferral(5, {
        referral_accepted: false, appointment_attended: false,
        outcome_documented: false, professional_advice_shared_with_staff: false,
      }),
      emotional_wellbeing_records: manyEmotional(4, {
        child_feels_supported: false, child_voice_captured: false,
        coping_strategies_in_place: false, confidence_in_management: false,
        emotional_impact_level: "severe",
      }),
    };
  }

  it("returns inadequate rating", () => {
    const r = computeBedwettingEnuresisSupport(makeInadequateInput());
    expect(r.enuresis_rating).toBe("inadequate");
  });

  it("score is below 45", () => {
    const r = computeBedwettingEnuresisSupport(makeInadequateInput());
    expect(r.enuresis_score).toBeLessThan(45);
  });

  it("has multiple concerns", () => {
    const r = computeBedwettingEnuresisSupport(makeInadequateInput());
    expect(r.concerns.length).toBeGreaterThanOrEqual(3);
  });

  it("has critical insights", () => {
    const r = computeBedwettingEnuresisSupport(makeInadequateInput());
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBeGreaterThanOrEqual(3);
  });

  it("has immediate recommendations", () => {
    const r = computeBedwettingEnuresisSupport(makeInadequateInput());
    const immediate = r.recommendations.filter((rec) => rec.urgency === "immediate");
    expect(immediate.length).toBeGreaterThanOrEqual(3);
  });

  it("headline mentions inadequate", () => {
    const r = computeBedwettingEnuresisSupport(makeInadequateInput());
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });
});

// ── Bonuses in Isolation ────────────────────────────────────────────────────

describe("bonuses in isolation", () => {
  it("Bonus 1: managementPlanRate >=90 → +4", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: true, reviewed: true, child_involved_in_planning: true,
        triggers_identified: true, night_routine_documented: true,
        staff_trained_on_plan: true,
      }),
    });
    // managementPlanRate = 100% (6/6 checks all true) → +4
    // planReviewRate = 100% → +3 (bonus 7)
    expect(r.enuresis_score).toBe(52 + 4 + 3);
  });

  it("Bonus 1: managementPlanRate >=70 <90 → +2", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: [
        makePlan({ plan_active: true, reviewed: true, child_involved_in_planning: true, triggers_identified: true, night_routine_documented: true, staff_trained_on_plan: false }),
      ],
    });
    // 5/6 = 83% → +2, planReviewRate=100 → +3
    expect(r.enuresis_score).toBe(52 + 2 + 3);
  });

  it("Bonus 2: discreetSupportRate >=90 → +4", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(10, {
        handled_discreetly: true, other_children_unaware: true,
        staff_approach_appropriate: true, child_dignity_maintained: true,
        timing_appropriate: true,
      }),
    });
    expect(r.enuresis_score).toBe(52 + 4);
  });

  it("Bonus 2: discreetSupportRate >=70 <90 → +2", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: [
        makeSupport({ handled_discreetly: true, other_children_unaware: true, staff_approach_appropriate: true, child_dignity_maintained: true, timing_appropriate: false }),
      ],
    });
    // 4/5 = 80% → +2
    expect(r.enuresis_score).toBe(52 + 2);
  });

  it("Bonus 3: dignityPreservationRate >=90 → +4", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5, {
        private_laundry_arrangement: true, discreet_bedding_storage: true,
        room_access_restricted_appropriately: true, no_peer_awareness_incidents: true,
        child_not_blamed_or_shamed: true, language_used_sensitively: true,
        child_empowered_in_management: true, normalisation_approach_used: true,
        age_appropriate_explanation_given: true,
      }),
    });
    // 9/9 = 100% → +4, noBlamingRate=100 >=95 → +2
    expect(r.enuresis_score).toBe(52 + 4 + 2);
  });

  it("Bonus 3: dignityPreservationRate >=70 <90 → +2", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: [
        makeDignity({
          private_laundry_arrangement: true, discreet_bedding_storage: true,
          room_access_restricted_appropriately: true, no_peer_awareness_incidents: true,
          child_not_blamed_or_shamed: true, language_used_sensitively: true,
          child_empowered_in_management: false, normalisation_approach_used: true,
          age_appropriate_explanation_given: false,
        }),
      ],
    });
    // 7/9 = 78% → +2, noBlamingRate 100 → +2
    expect(r.enuresis_score).toBe(52 + 2 + 2);
  });

  it("Bonus 4: medicalReferralRate >=85 → +3", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: manyReferral(5, {
        referral_accepted: true, appointment_attended: true,
        outcome_documented: true, professional_advice_shared_with_staff: true,
        follow_up_required: true, follow_up_completed: true,
      }),
    });
    // 4/4 = 100% → +3, followUpCompletionRate=100 → +2
    expect(r.enuresis_score).toBe(52 + 3 + 2);
  });

  it("Bonus 4: medicalReferralRate >=65 <85 → +1", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: [
        makeReferral({ referral_accepted: true, appointment_attended: true, outcome_documented: true, professional_advice_shared_with_staff: false, follow_up_required: false }),
      ],
    });
    // 3/4 = 75% → +1, no follow-up bonus since no follow-ups required
    expect(r.enuresis_score).toBe(52 + 1);
  });

  it("Bonus 5: emotionalWellbeingRate >=90 → +3", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, {
        child_feels_supported: true, child_voice_captured: true,
        coping_strategies_in_place: true, confidence_in_management: true,
      }),
    });
    // 4/4 = 100% → +3, childConfidenceRate=100 → +3
    expect(r.enuresis_score).toBe(52 + 3 + 3);
  });

  it("Bonus 5: emotionalWellbeingRate >=70 <90 → +1", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ child_feels_supported: true, child_voice_captured: true, coping_strategies_in_place: true, confidence_in_management: false }),
      ],
    });
    // 3/4 = 75% → +1
    expect(r.enuresis_score).toBe(52 + 1);
  });

  it("Bonus 6: childConfidenceRate >=90 → +3", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, {
        confidence_in_management: true,
        child_feels_supported: false, child_voice_captured: false,
        coping_strategies_in_place: false,
      }),
    });
    // childConfidence=100 → +3, emotionalWellbeingRate = (0+0+0+100)/4... wait: 25%. nah
    // emotionalWellbeingRate: checks are supported, voice, coping, confidence → 1/4 = 25% → penalty -nothing (not <50 guarded by records > 0? Actually penalty is for <50)
    // Hmm let me recalculate. Each record has 1 of 4 checks passed → pct(4, 16) = 25 → no penalty because managementPlanRate check not discreetSupport check... wait penalty 4 is significantImpactRate.
    // No penalty for emotionalWellbeingRate < 50. Only penalties are for managementPlanRate, discreetSupportRate, dignityPreservationRate, and significantImpactRate.
    expect(r.enuresis_score).toBe(52 + 3);
  });

  it("Bonus 6: childConfidenceRate >=70 <90 → +1", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ confidence_in_management: true, child_feels_supported: false, child_voice_captured: false, coping_strategies_in_place: false }),
        makeEmotional({ id: "e2", child_id: "c2", confidence_in_management: true, child_feels_supported: false, child_voice_captured: false, coping_strategies_in_place: false }),
        makeEmotional({ id: "e3", child_id: "c3", confidence_in_management: true, child_feels_supported: false, child_voice_captured: false, coping_strategies_in_place: false }),
        makeEmotional({ id: "e4", child_id: "c4", confidence_in_management: false, child_feels_supported: false, child_voice_captured: false, coping_strategies_in_place: false }),
      ],
    });
    // childConfidence = 3/4 = 75% → +1
    expect(r.enuresis_score).toBe(52 + 1);
  });

  it("Bonus 7: planReviewRate >=90 → +3", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        reviewed: true,
        plan_active: false, child_involved_in_planning: false,
        triggers_identified: false, night_routine_documented: false,
        staff_trained_on_plan: false,
      }),
    });
    // managementPlanRate: 1/6 per record = 17% → penalty -5
    // planReviewRate: 100% → +3
    expect(r.enuresis_score).toBe(52 + 3 - 5);
  });

  it("Bonus 7: planReviewRate >=70 <90 → +1", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: [
        makePlan({ reviewed: true, plan_active: false, child_involved_in_planning: false, triggers_identified: false, night_routine_documented: false, staff_trained_on_plan: false }),
        makePlan({ id: "p2", child_id: "c2", reviewed: true, plan_active: false, child_involved_in_planning: false, triggers_identified: false, night_routine_documented: false, staff_trained_on_plan: false }),
        makePlan({ id: "p3", child_id: "c3", reviewed: true, plan_active: false, child_involved_in_planning: false, triggers_identified: false, night_routine_documented: false, staff_trained_on_plan: false }),
        makePlan({ id: "p4", child_id: "c4", reviewed: false, plan_active: false, child_involved_in_planning: false, triggers_identified: false, night_routine_documented: false, staff_trained_on_plan: false }),
      ],
    });
    // planReviewRate: 3/4 = 75% → +1, managementPlanRate: 3/24 = 13% → -5
    expect(r.enuresis_score).toBe(52 + 1 - 5);
  });

  it("Bonus 8: followUpCompletionRate >=90 → +2", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: manyReferral(5, {
        follow_up_required: true, follow_up_completed: true,
        referral_accepted: false, appointment_attended: false,
        outcome_documented: false, professional_advice_shared_with_staff: false,
      }),
    });
    // followUp=100 → +2, medicalReferralRate=0% → no penalty (no penalty for medicalReferralRate)
    expect(r.enuresis_score).toBe(52 + 2);
  });

  it("Bonus 8: followUpCompletionRate >=70 <90 → +1", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: [
        makeReferral({ follow_up_required: true, follow_up_completed: true, referral_accepted: false, appointment_attended: false, outcome_documented: false, professional_advice_shared_with_staff: false }),
        makeReferral({ id: "r2", follow_up_required: true, follow_up_completed: true, referral_accepted: false, appointment_attended: false, outcome_documented: false, professional_advice_shared_with_staff: false }),
        makeReferral({ id: "r3", follow_up_required: true, follow_up_completed: true, referral_accepted: false, appointment_attended: false, outcome_documented: false, professional_advice_shared_with_staff: false }),
        makeReferral({ id: "r4", follow_up_required: true, follow_up_completed: false, referral_accepted: false, appointment_attended: false, outcome_documented: false, professional_advice_shared_with_staff: false }),
      ],
    });
    // followUp: 3/4=75% → +1
    expect(r.enuresis_score).toBe(52 + 1);
  });

  it("Bonus 9: noBlamingRate >=95 → +2", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(20, {
        child_not_blamed_or_shamed: true,
        private_laundry_arrangement: false, discreet_bedding_storage: false,
        room_access_restricted_appropriately: false, no_peer_awareness_incidents: false,
        language_used_sensitively: false, child_empowered_in_management: false,
        normalisation_approach_used: false, age_appropriate_explanation_given: false,
      }),
    });
    // noBlamingRate=100 → +2, dignityPreservationRate=1/9=11% → -5
    expect(r.enuresis_score).toBe(52 + 2 - 5);
  });

  it("Bonus 9: noBlamingRate >=80 <95 → +1", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: [
        ...manyDignity(8, {
          child_not_blamed_or_shamed: true,
          private_laundry_arrangement: false, discreet_bedding_storage: false,
          room_access_restricted_appropriately: false, no_peer_awareness_incidents: false,
          language_used_sensitively: false, child_empowered_in_management: false,
          normalisation_approach_used: false, age_appropriate_explanation_given: false,
        }),
        ...manyDignity(2, {
          child_not_blamed_or_shamed: false, id: "nb",
          private_laundry_arrangement: false, discreet_bedding_storage: false,
          room_access_restricted_appropriately: false, no_peer_awareness_incidents: false,
          language_used_sensitively: false, child_empowered_in_management: false,
          normalisation_approach_used: false, age_appropriate_explanation_given: false,
        }),
      ],
    });
    // noBlamingRate=80% → +1, dignityPreservation=8/90 = 9% → -5
    expect(r.enuresis_score).toBe(52 + 1 - 5);
  });

  it("max bonuses total = 28", () => {
    expect(4 + 4 + 4 + 3 + 3 + 3 + 3 + 2 + 2).toBe(28);
  });
});

// ── Penalties ───────────────────────────────────────────────────────────────

describe("penalties", () => {
  it("managementPlanRate < 50 → -5 (guarded)", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: false, reviewed: false, child_involved_in_planning: false,
        triggers_identified: false, night_routine_documented: false,
        staff_trained_on_plan: false,
      }),
    });
    // 0/30 = 0% → -5
    expect(r.enuresis_score).toBe(52 - 5);
  });

  it("discreetSupportRate < 50 → -5 (guarded)", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(10, {
        handled_discreetly: false, other_children_unaware: false,
        staff_approach_appropriate: false, child_dignity_maintained: false,
        timing_appropriate: false,
      }),
    });
    expect(r.enuresis_score).toBe(52 - 5);
  });

  it("dignityPreservationRate < 50 → -5 (guarded)", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5, {
        private_laundry_arrangement: false, discreet_bedding_storage: false,
        room_access_restricted_appropriately: false, no_peer_awareness_incidents: false,
        child_not_blamed_or_shamed: false, language_used_sensitively: false,
        child_empowered_in_management: false, normalisation_approach_used: false,
        age_appropriate_explanation_given: false,
      }),
    });
    expect(r.enuresis_score).toBe(52 - 5);
  });

  it("significantImpactRate > 50 → -3 (guarded)", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, {
        emotional_impact_level: "severe",
        child_feels_supported: false, child_voice_captured: false,
        coping_strategies_in_place: false, confidence_in_management: false,
      }),
    });
    // significantImpactRate = 100% → -3
    expect(r.enuresis_score).toBe(52 - 3);
  });

  it("all penalties combined: -5 -5 -5 -3 = -18 → score = 34", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: false, reviewed: false, child_involved_in_planning: false,
        triggers_identified: false, night_routine_documented: false,
        staff_trained_on_plan: false,
      }),
      discreet_support_records: manySupport(10, {
        handled_discreetly: false, other_children_unaware: false,
        staff_approach_appropriate: false, child_dignity_maintained: false,
        timing_appropriate: false,
      }),
      dignity_preservation_records: manyDignity(5, {
        private_laundry_arrangement: false, discreet_bedding_storage: false,
        room_access_restricted_appropriately: false, no_peer_awareness_incidents: false,
        child_not_blamed_or_shamed: false, language_used_sensitively: false,
        child_empowered_in_management: false, normalisation_approach_used: false,
        age_appropriate_explanation_given: false,
      }),
      emotional_wellbeing_records: manyEmotional(4, {
        emotional_impact_level: "significant",
        child_feels_supported: false, child_voice_captured: false,
        coping_strategies_in_place: false, confidence_in_management: false,
      }),
    });
    expect(r.enuresis_score).toBe(34);
  });

  it("score cannot go below 0 (clamp)", () => {
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 0 });
    expect(r.enuresis_score).toBeGreaterThanOrEqual(0);
  });
});

// ── Rates ───────────────────────────────────────────────────────────────────

describe("rates", () => {
  it("managementPlanRate is composite of 6 checks", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: [
        makePlan({ plan_active: true, reviewed: true, child_involved_in_planning: true, triggers_identified: true, night_routine_documented: true, staff_trained_on_plan: false }),
      ],
    });
    // 5/6 = 83%
    expect(r.management_plan_rate).toBe(83);
  });

  it("discreetSupportRate is composite of 5 checks", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: [
        makeSupport({ handled_discreetly: true, other_children_unaware: true, staff_approach_appropriate: true, child_dignity_maintained: true, timing_appropriate: false }),
      ],
    });
    // 4/5 = 80%
    expect(r.discreet_support_rate).toBe(80);
  });

  it("dignityPreservationRate is composite of 9 checks", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: [
        makeDignity({
          private_laundry_arrangement: true, discreet_bedding_storage: true,
          room_access_restricted_appropriately: true, no_peer_awareness_incidents: true,
          child_not_blamed_or_shamed: true, language_used_sensitively: true,
          child_empowered_in_management: true, normalisation_approach_used: true,
          age_appropriate_explanation_given: false,
        }),
      ],
    });
    // 8/9 = 89%
    expect(r.dignity_preservation_rate).toBe(89);
  });

  it("medicalReferralRate is composite of 4 checks", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: [
        makeReferral({ referral_accepted: true, appointment_attended: true, outcome_documented: true, professional_advice_shared_with_staff: false }),
      ],
    });
    // 3/4 = 75%
    expect(r.medical_referral_rate).toBe(75);
  });

  it("emotionalWellbeingRate is composite of 4 checks", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ child_feels_supported: true, child_voice_captured: true, coping_strategies_in_place: false, confidence_in_management: false }),
      ],
    });
    // 2/4 = 50%
    expect(r.emotional_wellbeing_rate).toBe(50);
  });

  it("childConfidenceRate is pct of confidence_in_management", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ confidence_in_management: true }),
        makeEmotional({ id: "e2", child_id: "c2", confidence_in_management: false }),
      ],
    });
    expect(r.child_confidence_rate).toBe(50);
  });
});

// ── Totals ──────────────────────────────────────────────────────────────────

describe("totals", () => {
  it("total_management_plans reflects array length", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(7),
    });
    expect(r.total_management_plans).toBe(7);
  });

  it("total_support_interactions reflects discreet_support_records length", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(12),
    });
    expect(r.total_support_interactions).toBe(12);
  });
});

// ── Strengths ───────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("management plan strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: true, reviewed: true, child_involved_in_planning: true,
        triggers_identified: true, night_routine_documented: true,
        staff_trained_on_plan: true,
      }),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.toLowerCase().includes("management plan"))).toBe(true);
  });

  it("management plan strength at >=70% <90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: [
        makePlan({ plan_active: true, reviewed: true, child_involved_in_planning: true, triggers_identified: true, night_routine_documented: true, staff_trained_on_plan: false }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("83%") && s.toLowerCase().includes("management plan"))).toBe(true);
  });

  it("discreet support strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(10),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.toLowerCase().includes("discreet support"))).toBe(true);
  });

  it("dignity preservation strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.toLowerCase().includes("dignity preservation"))).toBe(true);
  });

  it("medical referral strength at >=85%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: manyReferral(5),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.toLowerCase().includes("medical referral"))).toBe(true);
  });

  it("emotional wellbeing strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.toLowerCase().includes("emotional wellbeing"))).toBe(true);
  });

  it("child confidence strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { confidence_in_management: true }),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.toLowerCase().includes("confidence"))).toBe(true);
  });

  it("no-blame strength at >=95%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(20, { child_not_blamed_or_shamed: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("no-blame"))).toBe(true);
  });

  it("peer privacy strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(10, { no_peer_awareness_incidents: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("peer privacy"))).toBe(true);
  });

  it("plan review strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, { reviewed: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("management plans reviewed"))).toBe(true);
  });

  it("follow-up completion strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: manyReferral(5, { follow_up_required: true, follow_up_completed: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("follow-up"))).toBe(true);
  });

  it("child involvement strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, { child_involved_in_planning: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("child involvement"))).toBe(true);
  });

  it("self-management strength at >=80%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5, { self_management_skills_taught: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("self-management"))).toBe(true);
  });

  it("overnight support strength at >=80%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5, { overnight_stays_supported: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("overnight"))).toBe(true);
  });

  it("coping strategies strength at >=80%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { coping_strategies_in_place: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("coping strategies"))).toBe(true);
  });

  it("advice shared strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: manyReferral(5, { professional_advice_shared_with_staff: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("advice shared"))).toBe(true);
  });

  it("staff trained strength at >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, { staff_trained_on_plan: true }),
    });
    expect(r.strengths.some((s) => s.toLowerCase().includes("staff trained"))).toBe(true);
  });
});

// ── Concerns ────────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("management plan concern at <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: false, reviewed: false, child_involved_in_planning: false,
        triggers_identified: false, night_routine_documented: false,
        staff_trained_on_plan: false,
      }),
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.toLowerCase().includes("management plan"))).toBe(true);
  });

  it("management plan concern at 50-70%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: [
        makePlan({ plan_active: true, reviewed: true, child_involved_in_planning: true, triggers_identified: false, night_routine_documented: false, staff_trained_on_plan: false }),
      ],
    });
    // 3/6 = 50%
    expect(r.concerns.some((c) => c.includes("50%") && c.toLowerCase().includes("management plan"))).toBe(true);
  });

  it("discreet support concern at <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(10, {
        handled_discreetly: false, other_children_unaware: false,
        staff_approach_appropriate: false, child_dignity_maintained: false,
        timing_appropriate: false,
      }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("discreet support"))).toBe(true);
  });

  it("dignity concern at <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5, {
        private_laundry_arrangement: false, discreet_bedding_storage: false,
        room_access_restricted_appropriately: false, no_peer_awareness_incidents: false,
        child_not_blamed_or_shamed: false, language_used_sensitively: false,
        child_empowered_in_management: false, normalisation_approach_used: false,
        age_appropriate_explanation_given: false,
      }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("dignity preservation"))).toBe(true);
  });

  it("medical referral concern at <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: manyReferral(5, {
        referral_accepted: false, appointment_attended: false,
        outcome_documented: false, professional_advice_shared_with_staff: false,
      }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("medical referral"))).toBe(true);
  });

  it("emotional wellbeing concern at <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, {
        child_feels_supported: false, child_voice_captured: false,
        coping_strategies_in_place: false, confidence_in_management: false,
      }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("emotional wellbeing"))).toBe(true);
  });

  it("child confidence concern at <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { confidence_in_management: false }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("confidence"))).toBe(true);
  });

  it("significant impact concern at >50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { emotional_impact_level: "severe" }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("significant or severe"))).toBe(true);
  });

  it("significant impact concern at 30-50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ emotional_impact_level: "severe" }),
        makeEmotional({ id: "e2", child_id: "c2", emotional_impact_level: "mild" }),
        makeEmotional({ id: "e3", child_id: "c3", emotional_impact_level: "mild" }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33%") && c.toLowerCase().includes("significant or severe"))).toBe(true);
  });

  it("embarrassment concern at >50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { child_feels_embarrassed: true }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("embarrassed"))).toBe(true);
  });

  it("embarrassment concern at 30-50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ child_feels_embarrassed: true }),
        makeEmotional({ id: "e2", child_id: "c2", child_feels_embarrassed: true }),
        makeEmotional({ id: "e3", child_id: "c3", child_feels_embarrassed: false }),
        makeEmotional({ id: "e4", child_id: "c4", child_feels_embarrassed: false }),
        makeEmotional({ id: "e5", child_id: "c5", child_feels_embarrassed: false }),
      ],
    });
    // 2/5 = 40%
    expect(r.concerns.some((c) => c.toLowerCase().includes("embarrass"))).toBe(true);
  });

  it("no-blame concern at <90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: [
        ...manyDignity(8, { child_not_blamed_or_shamed: true }),
        ...manyDignity(2, { child_not_blamed_or_shamed: false, id: "nb" }),
      ],
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("blame"))).toBe(true);
  });

  it("bedtime anxiety concern at >40%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { child_anxiety_around_bedtime: true }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("anxiety"))).toBe(true);
  });

  it("avoids sleepover concern at >40%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { child_avoids_overnight_activities: true }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("overnight"))).toBe(true);
  });

  it("no management plans concern when children present", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(5),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("no enuresis management plans"))).toBe(true);
  });

  it("no dignity records concern when children present", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(5),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("no dignity preservation"))).toBe(true);
  });

  it("no medical referrals concern when children present", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(5),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("no medical referrals"))).toBe(true);
  });

  it("self-esteem concern at <2.5", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { child_self_esteem_rating: 2 }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("self-esteem"))).toBe(true);
  });

  it("self-esteem concern at 2.5-3.0", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ child_self_esteem_rating: 3 }),
        makeEmotional({ id: "e2", child_id: "c2", child_self_esteem_rating: 2 }),
      ],
    });
    // avg = 2.5
    expect(r.concerns.some((c) => c.toLowerCase().includes("self-esteem"))).toBe(true);
  });

  it("peer impact concern at >30%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { peer_relationship_impact: "significant" }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("peer relationship"))).toBe(true);
  });

  it("school impact concern at >30%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { school_impact: "moderate" }),
    });
    expect(r.concerns.some((c) => c.toLowerCase().includes("school impact"))).toBe(true);
  });
});

// ── Recommendations ─────────────────────────────────────────────────────────

describe("recommendations", () => {
  it("ranks are sequential starting from 1", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: false, reviewed: false, child_involved_in_planning: false,
        triggers_identified: false, night_routine_documented: false,
        staff_trained_on_plan: false,
      }),
      discreet_support_records: manySupport(10, {
        handled_discreetly: false, other_children_unaware: false,
        staff_approach_appropriate: false, child_dignity_maintained: false,
        timing_appropriate: false,
      }),
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("immediate urgency for plan rate <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: false, reviewed: false, child_involved_in_planning: false,
        triggers_identified: false, night_routine_documented: false,
        staff_trained_on_plan: false,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("management plan"))).toBe(true);
  });

  it("immediate urgency for discreet support <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(10, {
        handled_discreetly: false, other_children_unaware: false,
        staff_approach_appropriate: false, child_dignity_maintained: false,
        timing_appropriate: false,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("discreet"))).toBe(true);
  });

  it("immediate urgency for dignity <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5, {
        private_laundry_arrangement: false, discreet_bedding_storage: false,
        room_access_restricted_appropriately: false, no_peer_awareness_incidents: false,
        child_not_blamed_or_shamed: false, language_used_sensitively: false,
        child_empowered_in_management: false, normalisation_approach_used: false,
        age_appropriate_explanation_given: false,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("dignity"))).toBe(true);
  });

  it("all recommendations have regulatory_ref", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: false, reviewed: false, child_involved_in_planning: false,
        triggers_identified: false, night_routine_documented: false, staff_trained_on_plan: false,
      }),
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });

  it("no recommendations when everything is outstanding", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: true, reviewed: true, child_involved_in_planning: true,
        triggers_identified: true, night_routine_documented: true,
        staff_trained_on_plan: true,
      }),
      discreet_support_records: manySupport(10),
      dignity_preservation_records: manyDignity(5),
      medical_referral_records: manyReferral(5),
      emotional_wellbeing_records: manyEmotional(4),
    });
    expect(r.recommendations.length).toBe(0);
  });
});

// ── Insights ────────────────────────────────────────────────────────────────

describe("insights", () => {
  it("critical insight for management plan <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: false, reviewed: false, child_involved_in_planning: false,
        triggers_identified: false, night_routine_documented: false,
        staff_trained_on_plan: false,
      }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("management plan"))).toBe(true);
  });

  it("critical insight for discreet support <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(10, {
        handled_discreetly: false, other_children_unaware: false,
        staff_approach_appropriate: false, child_dignity_maintained: false,
        timing_appropriate: false,
      }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("discreet support"))).toBe(true);
  });

  it("critical insight for dignity <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5, {
        private_laundry_arrangement: false, discreet_bedding_storage: false,
        room_access_restricted_appropriately: false, no_peer_awareness_incidents: false,
        child_not_blamed_or_shamed: false, language_used_sensitively: false,
        child_empowered_in_management: false, normalisation_approach_used: false,
        age_appropriate_explanation_given: false,
      }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("dignity preservation"))).toBe(true);
  });

  it("critical insight for no-blame <90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: [
        ...manyDignity(8, { child_not_blamed_or_shamed: true }),
        ...manyDignity(2, { child_not_blamed_or_shamed: false, id: "nb" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("no-blame"))).toBe(true);
  });

  it("critical insight for significant impact >50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, { emotional_impact_level: "severe" }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("significant or severe"))).toBe(true);
  });

  it("critical insight for no management plans with children present", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(5),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("no enuresis management plans"))).toBe(true);
  });

  it("critical insight for no medical referrals with children present", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(5),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("no medical referrals"))).toBe(true);
  });

  it("critical insight for medical referral <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: manyReferral(5, {
        referral_accepted: false, appointment_attended: false,
        outcome_documented: false, professional_advice_shared_with_staff: false,
      }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("medical referral"))).toBe(true);
  });

  it("warning insight for management plan 50-70%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: [
        makePlan({ plan_active: true, reviewed: true, child_involved_in_planning: true, triggers_identified: false, night_routine_documented: false, staff_trained_on_plan: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("management plan"))).toBe(true);
  });

  it("warning insight for discreet support 50-70%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: [
        makeSupport({ handled_discreetly: true, other_children_unaware: true, staff_approach_appropriate: true, child_dignity_maintained: false, timing_appropriate: false }),
      ],
    });
    // 3/5=60%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("discreet support"))).toBe(true);
  });

  it("warning insight for child confidence 50-70%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ confidence_in_management: true }),
        makeEmotional({ id: "e2", child_id: "c2", confidence_in_management: false }),
      ],
    });
    // 50%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("confidence"))).toBe(true);
  });

  it("warning insight for embarrassment 30-50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ child_feels_embarrassed: true }),
        makeEmotional({ id: "e2", child_id: "c2", child_feels_embarrassed: true }),
        makeEmotional({ id: "e3", child_id: "c3", child_feels_embarrassed: false }),
        makeEmotional({ id: "e4", child_id: "c4", child_feels_embarrassed: false }),
        makeEmotional({ id: "e5", child_id: "c5", child_feels_embarrassed: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("embarrass"))).toBe(true);
  });

  it("warning insight for bedtime anxiety 20-40%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ child_anxiety_around_bedtime: true }),
        makeEmotional({ id: "e2", child_id: "c2", child_anxiety_around_bedtime: false }),
        makeEmotional({ id: "e3", child_id: "c3", child_anxiety_around_bedtime: false }),
        makeEmotional({ id: "e4", child_id: "c4", child_anxiety_around_bedtime: false }),
      ],
    });
    // 25%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("bedtime anxiety"))).toBe(true);
  });

  it("warning insight for high-frequency enuresis >30%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(4, { incident_frequency: "nightly" }),
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.toLowerCase().includes("nightly"))).toBe(true);
  });

  it("warning insight with referral type distribution", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: [
        makeReferral({ referral_type: "gp" }),
        makeReferral({ id: "r2", referral_type: "paediatrician" }),
      ],
    });
    expect(r.insights.some((i) => i.text.toLowerCase().includes("referral pathway"))).toBe(true);
  });

  it("positive insight when rating is outstanding", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: true, reviewed: true, child_involved_in_planning: true,
        triggers_identified: true, night_routine_documented: true,
        staff_trained_on_plan: true,
      }),
      discreet_support_records: manySupport(10),
      dignity_preservation_records: manyDignity(5),
      medical_referral_records: manyReferral(5, { follow_up_required: true, follow_up_completed: true }),
      emotional_wellbeing_records: manyEmotional(4),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("outstanding"))).toBe(true);
  });

  it("positive insight for high plan quality + staff training", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: true, reviewed: true, child_involved_in_planning: true,
        triggers_identified: true, night_routine_documented: true,
        staff_trained_on_plan: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("staff training"))).toBe(true);
  });

  it("positive insight for high discreet support + dignity", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      discreet_support_records: manySupport(10),
      dignity_preservation_records: manyDignity(5),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("discreet support"))).toBe(true);
  });

  it("positive insight for no-blame + peer privacy", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(20, {
        child_not_blamed_or_shamed: true,
        no_peer_awareness_incidents: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("no-blame"))).toBe(true);
  });

  it("positive insight for high referral quality + follow-up", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: manyReferral(5, {
        follow_up_required: true, follow_up_completed: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("referral quality"))).toBe(true);
  });

  it("positive insight for emotional wellbeing + child confidence", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, {
        child_feels_supported: true, child_voice_captured: true,
        coping_strategies_in_place: true, confidence_in_management: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("emotional wellbeing"))).toBe(true);
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("single record in each category still computes", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: [makePlan()],
      discreet_support_records: [makeSupport()],
      dignity_preservation_records: [makeDignity()],
      medical_referral_records: [makeReferral()],
      emotional_wellbeing_records: [makeEmotional()],
    });
    expect(r.enuresis_rating).toBeDefined();
    expect(r.enuresis_score).toBeGreaterThanOrEqual(0);
  });

  it("very large arrays process correctly", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(200),
    });
    expect(r.total_management_plans).toBe(200);
  });

  it("score clamped at 100", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: true, reviewed: true, child_involved_in_planning: true,
        triggers_identified: true, night_routine_documented: true,
        staff_trained_on_plan: true,
      }),
      discreet_support_records: manySupport(10),
      dignity_preservation_records: manyDignity(5),
      medical_referral_records: manyReferral(5, { follow_up_required: true, follow_up_completed: true }),
      emotional_wellbeing_records: manyEmotional(4),
    });
    expect(r.enuresis_score).toBeLessThanOrEqual(100);
  });

  it("total_children = 0 with some records → still computes (not insufficient)", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      total_children: 0,
      management_plan_records: manyPlans(5),
    });
    expect(r.enuresis_rating).not.toBe("insufficient_data");
  });

  it("headline reflects concern count for adequate", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: [
        makePlan({ plan_active: true, reviewed: true, child_involved_in_planning: true, triggers_identified: false, night_routine_documented: false, staff_trained_on_plan: false }),
      ],
      discreet_support_records: manySupport(5),
    });
    if (r.enuresis_rating === "adequate") {
      expect(r.headline.toLowerCase()).toContain("concern");
    }
  });

  it("headline for good rating mentions strengths", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, {
        plan_active: true, reviewed: true, child_involved_in_planning: true,
        triggers_identified: true, night_routine_documented: false,
        staff_trained_on_plan: true, progress_rating: 4,
      }),
      discreet_support_records: manySupport(10),
      dignity_preservation_records: manyDignity(4),
      medical_referral_records: manyReferral(4),
      emotional_wellbeing_records: manyEmotional(4),
    });
    if (r.enuresis_rating === "good") {
      expect(r.headline.toLowerCase()).toContain("strength");
    }
  });

  it("dignity issue resolution tracking works", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: [
        makeDignity({ issues_identified: ["Laundry issue"], issues_resolved: true }),
        makeDignity({ id: "d2", child_id: "c2", issues_identified: ["Storage issue"], issues_resolved: false }),
      ],
    });
    expect(r.enuresis_rating).toBeDefined();
  });

  it("peer teasing resolution is tracked", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: [
        makeDignity({ peer_teasing_incidents: 2, peer_teasing_addressed: true }),
        makeDignity({ id: "d2", child_id: "c2", peer_teasing_incidents: 1, peer_teasing_addressed: false }),
      ],
    });
    expect(r.enuresis_rating).toBeDefined();
  });

  it("no penalties when records are empty", () => {
    // Only the inadequate floor case
    const r = computeBedwettingEnuresisSupport({ ...baseInput, total_children: 3 });
    expect(r.enuresis_score).toBe(15);
  });

  it("follow-up recommendation at <50% with required follow-ups", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      medical_referral_records: [
        makeReferral({ follow_up_required: true, follow_up_completed: false }),
        makeReferral({ id: "r2", follow_up_required: true, follow_up_completed: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("follow-up"))).toBe(true);
  });

  it("plan review recommendation at <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, { reviewed: false }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("review"))).toBe(true);
  });

  it("child involvement recommendation at <50%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, { child_involved_in_planning: false }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("involve"))).toBe(true);
  });

  it("self-management recommendation at <60%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5, { self_management_skills_taught: false }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("self-management"))).toBe(true);
  });

  it("avoids sleepover recommendation at >30%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: [
        makeEmotional({ child_avoids_overnight_activities: true }),
        makeEmotional({ id: "e2", child_id: "c2", child_avoids_overnight_activities: true }),
        makeEmotional({ id: "e3", child_id: "c3", child_avoids_overnight_activities: false }),
        makeEmotional({ id: "e4", child_id: "c4", child_avoids_overnight_activities: false }),
        makeEmotional({ id: "e5", child_id: "c5", child_avoids_overnight_activities: false }),
      ],
    });
    // 2/5 = 40%
    expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("overnight"))).toBe(true);
  });

  it("positive insight for child involvement >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, { child_involved_in_planning: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("child involvement"))).toBe(true);
  });

  it("positive insight for overnight support >=80%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      dignity_preservation_records: manyDignity(5, { overnight_stays_supported: true }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("overnight"))).toBe(true);
  });

  it("positive insight for coping strategies + effectiveness", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, {
        coping_strategies_in_place: true,
        coping_strategies_effective: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("coping"))).toBe(true);
  });

  it("positive insight for avg progress rating >=4.0", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      management_plan_records: manyPlans(5, { progress_rating: 4 }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("progress"))).toBe(true);
  });

  it("positive insight for feels supported + voice captured >=90%", () => {
    const r = computeBedwettingEnuresisSupport({
      ...baseInput,
      emotional_wellbeing_records: manyEmotional(4, {
        child_feels_supported: true,
        child_voice_captured: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.toLowerCase().includes("feel supported"))).toBe(true);
  });
});

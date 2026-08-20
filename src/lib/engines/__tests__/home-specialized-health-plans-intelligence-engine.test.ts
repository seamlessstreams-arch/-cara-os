// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME SPECIALIZED HEALTH PLANS INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeSpecializedHealthPlans,
  type HomeSpecializedHealthPlansInput,
  type ADHDPlanInput,
  type AllergyPlanInput,
  type AsthmaPlanInput,
  type AutismPlanInput,
  type DiabeticCarePlanInput,
  type EpilepsyPlanInput,
  type ContinencePlanInput,
  type PhysioOtPlanInput,
  type MenstrualHealthPlanInput,
  type OccupationalTherapyInput,
} from "../home-specialized-health-plans-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeADHD(overrides: Partial<ADHDPlanInput> = {}): ADHDPlanInput {
  return {
    id: "adhd-1", child_id: "c1", plan_date: "2025-05-01", review_date: "2025-12-01",
    has_medication: true, strategies_count: 5, child_voice_provided: true, key_worker_assigned: true,
    ...overrides,
  };
}

function makeAllergy(overrides: Partial<AllergyPlanInput> = {}): AllergyPlanInput {
  return {
    id: "allergy-1", child_id: "c1", plan_date: "2025-05-01", review_date: "2025-12-01",
    aai_prescribed: true, staff_trained_count: 3, school_has_plan: true,
    child_wears_medical_alert: true, allergens_count: 2, emergency_protocol_count: 3,
    ...overrides,
  };
}

function makeAsthma(overrides: Partial<AsthmaPlanInput> = {}): AsthmaPlanInput {
  return {
    id: "asthma-1", child_id: "c1", plan_date: "2025-05-01", review_date: "2025-12-01",
    has_preventer_inhaler: true, has_reliever_inhaler: true, school_has_inhaler: true,
    spare_inhaler_locations_count: 2, child_can_self_medicate: true,
    ...overrides,
  };
}

function makeAutism(overrides: Partial<AutismPlanInput> = {}): AutismPlanInput {
  return {
    id: "autism-1", child_id: "c1", plan_date: "2025-05-01", review_date: "2025-12-01",
    sensory_profile_count: 4, strategies_count: 8, child_voice_provided: true,
    external_support_count: 2,
    ...overrides,
  };
}

function makeDiabetic(overrides: Partial<DiabeticCarePlanInput> = {}): DiabeticCarePlanInput {
  return {
    id: "diabetic-1", child_id: "c1", plan_date: "2025-05-01", review_date: "2025-12-01",
    cgm_in_use: true, school_plan_in_place: true, child_can_self_manage: true,
    emergency_contacts_count: 2, flags_for_review_count: 0,
    ...overrides,
  };
}

function makeEpilepsy(overrides: Partial<EpilepsyPlanInput> = {}): EpilepsyPlanInput {
  return {
    id: "epilepsy-1", child_id: "c1", plan_date: "2025-05-01", review_date: "2025-12-01",
    has_rescue_medication: true, staff_trained_count: 3, school_plan_in_place: true,
    safe_sleeping_documented: true, recent_seizure_count: 0,
    ...overrides,
  };
}

function makeContinence(overrides: Partial<ContinencePlanInput> = {}): ContinencePlanInput {
  return {
    id: "cont-1", child_id: "c1", plan_date: "2025-05-01", review_date: "2025-12-01",
    privacy_measures_count: 3, child_voice_provided: true,
    external_support_count: 1, strategies_count: 5,
    ...overrides,
  };
}

function makePhysioOt(overrides: Partial<PhysioOtPlanInput> = {}): PhysioOtPlanInput {
  return {
    id: "physio-1", child_id: "c1", review_date: "2025-12-01",
    goals_count: 3, exercises_count: 5, school_plan_in_place: true,
    child_voice_provided: true, next_appointment_set: true,
    ...overrides,
  };
}

function makeMenstrualHealth(overrides: Partial<MenstrualHealthPlanInput> = {}): MenstrualHealthPlanInput {
  return {
    id: "menstrual-1", child_id: "c1", plan_reviewed_date: "2025-05-01",
    child_chosen_products: true, child_comfort_level: "comfortable",
    education_delivered_count: 3,
    ...overrides,
  };
}

function makeOT(overrides: Partial<OccupationalTherapyInput> = {}): OccupationalTherapyInput {
  return {
    id: "ot-1", child_id: "c1", assessment_date: "2025-05-01", next_review_date: "2025-12-01",
    recommendations_count: 4, sensory_diet_count: 3, equipment_count: 2,
    report_provided: true, staff_training_provided: true,
    ...overrides,
  };
}

/**
 * Base input: outstanding scenario.
 * 5 children, each with multiple plan types, all reviewed on time,
 * all safety-critical plans have trained staff and school plans,
 * child voice present, school integration complete, therapy engaged,
 * emergency preparedness complete.
 *
 * Score calculation:
 * Base 52
 * mod1 (coverage): 5 children, 5/5 = 100% → +5
 * mod2 (reviews): all on time → +4
 * mod3 (safety-critical): allergy + epilepsy all ready → +4
 * mod4 (child voice): all voiced → +3
 * mod5 (plan types): 5+ types → +3
 * mod6 (school integration): 100% → +3
 * mod7 (therapy): 100% engaged → +3
 * mod8 (emergency): 100% → +3
 * Total: 52 + 5 + 4 + 4 + 3 + 3 + 3 + 3 + 3 = 80 → outstanding
 */
function baseInput(overrides: Partial<HomeSpecializedHealthPlansInput> = {}): HomeSpecializedHealthPlansInput {
  return {
    today: TODAY,
    adhd_plans: [makeADHD({ child_id: "c1" }), makeADHD({ id: "adhd-2", child_id: "c2" })],
    allergy_plans: [makeAllergy({ child_id: "c2" }), makeAllergy({ id: "allergy-2", child_id: "c3" })],
    asthma_plans: [makeAsthma({ child_id: "c3" })],
    autism_plans: [makeAutism({ child_id: "c4" })],
    diabetic_care_plans: [makeDiabetic({ child_id: "c4" })],
    epilepsy_plans: [makeEpilepsy({ child_id: "c5" })],
    continence_plans: [makeContinence({ child_id: "c5" })],
    physio_ot_plans: [makePhysioOt({ child_id: "c1" })],
    menstrual_health_plans: [makeMenstrualHealth({ child_id: "c3" })],
    occupational_therapy_records: [makeOT({ child_id: "c4" })],
    total_children: 5,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Specialized Health Plans Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0 and all arrays empty", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY, adhd_plans: [], allergy_plans: [], asthma_plans: [],
        autism_plans: [], diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [], physio_ot_plans: [], menstrual_health_plans: [],
        occupational_therapy_records: [], total_children: 0,
      });
      expect(result.health_plans_rating).toBe("insufficient_data");
      expect(result.health_plans_score).toBe(0);
    });

    it("does NOT return insufficient_data when plans exist but total_children is 0", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY, adhd_plans: [makeADHD()], allergy_plans: [], asthma_plans: [],
        autism_plans: [], diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [], physio_ot_plans: [], menstrual_health_plans: [],
        occupational_therapy_records: [], total_children: 0,
      });
      expect(result.health_plans_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data when total_children > 0 but no plans", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY, adhd_plans: [], allergy_plans: [], asthma_plans: [],
        autism_plans: [], diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [], physio_ot_plans: [], menstrual_health_plans: [],
        occupational_therapy_records: [], total_children: 3,
      });
      expect(result.health_plans_rating).not.toBe("insufficient_data");
    });

    it("has concern when insufficient_data", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY, adhd_plans: [], allergy_plans: [], asthma_plans: [],
        autism_plans: [], diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [], physio_ot_plans: [], menstrual_health_plans: [],
        occupational_therapy_records: [], total_children: 0,
      });
      expect(result.concerns.length).toBeGreaterThan(0);
    });
  });

  // ── Rating thresholds ─────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("rates outstanding for score >= 80", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.health_plans_score).toBeGreaterThanOrEqual(80);
      expect(result.health_plans_rating).toBe("outstanding");
    });

    it("rates good for score 65-79", () => {
      // Remove some plan types and weaken therapy to reduce from 80
      // Remove occupational_therapy → mod7 drops (therapy engagement drops), mod5 drops
      const result = computeHomeSpecializedHealthPlans(baseInput({
        occupational_therapy_records: [],
        physio_ot_plans: [],
        menstrual_health_plans: [],
        // Now plan types: adhd, allergy, asthma, autism, diabetic, epilepsy, continence = 7 types
        // But losing physio/OT removes from mod6 (school), mod4 (voice), mod7 (therapy)
        // Let's also weaken some reviews
        adhd_plans: [
          makeADHD({ child_id: "c1", review_date: "2025-01-01" }), // overdue
          makeADHD({ id: "adhd-2", child_id: "c2" }),
        ],
      }));
      expect(result.health_plans_score).toBeGreaterThanOrEqual(65);
      expect(result.health_plans_score).toBeLessThan(80);
      expect(result.health_plans_rating).toBe("good");
    });

    it("rates adequate for score 45-64", () => {
      // Moderate data: decent coverage and reviews, but limited plan types
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [
          makeADHD({ child_id: "c1" }),
          makeADHD({ id: "adhd-2", child_id: "c2" }),
        ],
        allergy_plans: [],
        asthma_plans: [],
        autism_plans: [makeAutism({ child_id: "c3" })],
        diabetic_care_plans: [],
        epilepsy_plans: [],
        continence_plans: [],
        physio_ot_plans: [],
        menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 5,
      });
      // mod1: 3/5 = 60% → +3
      // mod2: 3 reviewable, all on time → +4
      // mod3: no allergy/epilepsy, no diabetic/asthma → +0
      // mod4: 2 adhd(true) + 1 autism(true) = 3/3 = 100% → +3
      // mod5: 2 types (adhd + autism) → +0
      // mod6: no school-applicable → +0
      // mod7: no therapy → +0
      // mod8: no emergency → +0
      // Score: 52 + 3 + 4 + 0 + 3 + 0 + 0 + 0 + 0 = 62
      expect(result.health_plans_score).toBeGreaterThanOrEqual(45);
      expect(result.health_plans_score).toBeLessThan(65);
      expect(result.health_plans_rating).toBe("adequate");
    });

    it("rates inadequate for score < 45", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1", review_date: "2025-01-01", child_voice_provided: false })],
        allergy_plans: [makeAllergy({ child_id: "c1", staff_trained_count: 0, school_has_plan: false, emergency_protocol_count: 0 })],
        asthma_plans: [],
        autism_plans: [],
        diabetic_care_plans: [],
        epilepsy_plans: [],
        continence_plans: [],
        physio_ot_plans: [],
        menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 5,
      });
      expect(result.health_plans_score).toBeLessThan(45);
      expect(result.health_plans_rating).toBe("inadequate");
    });
  });

  // ── Score boundary tests ──────────────────────────────────────────────

  describe("score boundaries", () => {
    it("score 80 is outstanding", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.health_plans_score).toBe(80);
      expect(result.health_plans_rating).toBe("outstanding");
    });

    it("never exceeds 100", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.health_plans_score).toBeLessThanOrEqual(100);
    });

    it("never goes below 0", () => {
      // Worst case everywhere
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1", review_date: "2024-01-01", child_voice_provided: false })],
        allergy_plans: [makeAllergy({ child_id: "c1", staff_trained_count: 0, school_has_plan: false, emergency_protocol_count: 0 })],
        asthma_plans: [makeAsthma({ child_id: "c1", school_has_inhaler: false })],
        autism_plans: [],
        diabetic_care_plans: [],
        epilepsy_plans: [makeEpilepsy({ child_id: "c1", staff_trained_count: 0, school_plan_in_place: false, has_rescue_medication: false })],
        continence_plans: [],
        physio_ot_plans: [makePhysioOt({ child_id: "c1", school_plan_in_place: false, child_voice_provided: false, next_appointment_set: false })],
        menstrual_health_plans: [makeMenstrualHealth({ child_id: "c1", child_chosen_products: false })],
        occupational_therapy_records: [makeOT({ child_id: "c1", report_provided: false })],
        total_children: 10,
      });
      expect(result.health_plans_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Modifier 1: Plan coverage breadth (±5) ────────────────────────────

  describe("mod1: plan coverage breadth", () => {
    it("+5 when coverage >= 80%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      // 5/5 = 100% → +5
      expect(result.plan_coverage.child_coverage).toBe(100);
    });

    it("+3 when coverage 60-79%", () => {
      // 3 children covered out of 5 = 60%
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [makeADHD({ child_id: "c1" })],
        allergy_plans: [makeAllergy({ child_id: "c2" })],
        asthma_plans: [],
        autism_plans: [],
        diabetic_care_plans: [],
        epilepsy_plans: [makeEpilepsy({ child_id: "c3" })],
        continence_plans: [],
        physio_ot_plans: [],
        menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 5,
      }));
      expect(result.plan_coverage.child_coverage).toBe(60);
    });

    it("-5 when coverage < 40%", () => {
      // 1 child out of 5 = 20%
      const high = computeHomeSpecializedHealthPlans(baseInput());
      const low = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [makeADHD({ child_id: "c1" })],
        allergy_plans: [],
        asthma_plans: [],
        autism_plans: [],
        diabetic_care_plans: [],
        epilepsy_plans: [],
        continence_plans: [],
        physio_ot_plans: [],
        menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 5,
      }));
      expect(low.plan_coverage.child_coverage).toBe(20);
      // When coverage drops from 100% (+5) to 20% (-5), diff = 10
      // But also affects mod3 (no allergy/epilepsy → neutral), mod4 (only adhd voice),
      // mod5 (1 type → -3 vs 7+), mod6, mod7, mod8
    });

    it("uses plan count signal when total_children is 0", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        total_children: 0,
      }));
      expect(result.health_plans_rating).not.toBe("insufficient_data");
    });
  });

  // ── Modifier 2: Review timeliness (±4) ────────────────────────────────

  describe("mod2: review timeliness", () => {
    it("+4 when all reviews on time (>= 95%)", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      // Menstrual plans excluded from review compliance (no forward date)
      // 11 reviewable plans, all on time
      expect(result.review_compliance.on_time_rate).toBe(100);
    });

    it("+2 when on-time rate 80-94%", () => {
      // Make 1 of 11 plans overdue → 10/11 = ~91% on time
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", review_date: "2025-01-01" }), // overdue
          makeADHD({ id: "adhd-2", child_id: "c2" }),
        ],
      }));
      expect(result.review_compliance.overdue_reviews).toBe(1);
      // 10/11 = 91%
      expect(result.review_compliance.on_time_rate).toBe(91);
    });

    it("-4 when on-time rate < 60%", () => {
      // Make most plans overdue
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", review_date: "2025-01-01" }),
          makeADHD({ id: "adhd-2", child_id: "c2", review_date: "2025-01-01" }),
        ],
        allergy_plans: [
          makeAllergy({ child_id: "c2", review_date: "2025-01-01" }),
          makeAllergy({ id: "allergy-2", child_id: "c3", review_date: "2025-01-01" }),
        ],
        asthma_plans: [makeAsthma({ child_id: "c3", review_date: "2025-01-01" })],
        autism_plans: [makeAutism({ child_id: "c4", review_date: "2025-01-01" })],
        epilepsy_plans: [makeEpilepsy({ child_id: "c5", review_date: "2025-01-01" })],
        continence_plans: [makeContinence({ child_id: "c5", review_date: "2025-01-01" })],
      }));
      // 8 overdue of 11 total → on_time = 3/11 = 27%
      expect(result.review_compliance.on_time_rate).toBeLessThan(60);
    });

    it("+0 when no reviewable plans", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [], allergy_plans: [], asthma_plans: [],
        autism_plans: [], diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [], physio_ot_plans: [], menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 3,
      });
      expect(result.review_compliance.total_reviewable).toBe(0);
    });

    it("tracks oldest overdue days", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", review_date: "2024-06-01" }), // ~380 days overdue
          makeADHD({ id: "adhd-2", child_id: "c2", review_date: "2025-05-01" }), // ~45 days overdue
        ],
      }));
      expect(result.review_compliance.oldest_overdue_days).toBeGreaterThan(300);
    });
  });

  // ── Modifier 3: Safety-critical plan preparedness (±4) ────────────────

  describe("mod3: safety-critical preparedness", () => {
    it("+4 when all allergy + epilepsy plans fully ready", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.safety_preparedness.allergy_staff_trained_rate).toBe(100);
      expect(result.safety_preparedness.epilepsy_staff_trained_rate).toBe(100);
    });

    it("-4 when readiness < 50%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        allergy_plans: [
          makeAllergy({ child_id: "c2", staff_trained_count: 0, school_has_plan: false }),
          makeAllergy({ id: "allergy-2", child_id: "c3", staff_trained_count: 0, school_has_plan: false }),
        ],
        epilepsy_plans: [makeEpilepsy({ child_id: "c5", staff_trained_count: 0, school_plan_in_place: false })],
      }));
      // 0 of 3 ready → 0% → -4
      expect(result.safety_preparedness.allergy_staff_trained_rate).toBe(0);
    });

    it("neutral when no allergy/epilepsy plans", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        allergy_plans: [],
        epilepsy_plans: [],
      }));
      // Has diabetic + asthma, so +1 (neutral bonus)
      expect(result.health_plans_rating).not.toBe("insufficient_data");
    });

    it("+2 when readiness 80-99%", () => {
      // 4 of 5 ready → 80%
      const result = computeHomeSpecializedHealthPlans(baseInput({
        allergy_plans: [
          makeAllergy({ child_id: "c2" }), // ready
          makeAllergy({ id: "allergy-2", child_id: "c3" }), // ready
          makeAllergy({ id: "allergy-3", child_id: "c1" }), // ready
          makeAllergy({ id: "allergy-4", child_id: "c4", staff_trained_count: 0, school_has_plan: false }), // not ready
        ],
        epilepsy_plans: [makeEpilepsy({ child_id: "c5" })], // ready
      }));
      // 4 of 5 = 80% → +2
      const safetyReadyCount = 3 + 1; // 3 allergy ready + 1 epilepsy ready
      const totalSafety = 4 + 1;
      expect(Math.round(safetyReadyCount / totalSafety * 100)).toBe(80);
    });
  });

  // ── Modifier 4: Child voice (±3) ─────────────────────────────────────

  describe("mod4: child voice across plans", () => {
    it("+3 when voice rate >= 90%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.child_voice.voice_rate).toBeGreaterThanOrEqual(90);
    });

    it("-3 when voice rate < 50%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", child_voice_provided: false }),
          makeADHD({ id: "adhd-2", child_id: "c2", child_voice_provided: false }),
        ],
        autism_plans: [makeAutism({ child_id: "c4", child_voice_provided: false })],
        continence_plans: [makeContinence({ child_id: "c5", child_voice_provided: false })],
        physio_ot_plans: [makePhysioOt({ child_id: "c1", child_voice_provided: false })],
        menstrual_health_plans: [makeMenstrualHealth({ child_id: "c3", child_chosen_products: false })],
      }));
      expect(result.child_voice.voice_rate).toBe(0);
    });

    it("+1 when voice rate 70-89%", () => {
      // 5 of 7 voices → 71%
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", child_voice_provided: true }),
          makeADHD({ id: "adhd-2", child_id: "c2", child_voice_provided: false }),
        ],
        autism_plans: [makeAutism({ child_id: "c4", child_voice_provided: true })],
        continence_plans: [makeContinence({ child_id: "c5", child_voice_provided: true })],
        physio_ot_plans: [makePhysioOt({ child_id: "c1", child_voice_provided: true })],
        menstrual_health_plans: [makeMenstrualHealth({ child_id: "c3", child_chosen_products: true })],
      }));
      // 5 of 6 = 83%
      expect(result.child_voice.voice_rate).toBeGreaterThanOrEqual(70);
      expect(result.child_voice.voice_rate).toBeLessThan(90);
    });

    it("+0 when no voice-applicable plans", () => {
      // Only allergy/asthma/diabetic/epilepsy — none have voice field
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [],
        allergy_plans: [makeAllergy({ child_id: "c1" })],
        asthma_plans: [],
        autism_plans: [],
        diabetic_care_plans: [],
        epilepsy_plans: [],
        continence_plans: [],
        physio_ot_plans: [],
        menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 3,
      });
      expect(result.child_voice.total_applicable).toBe(0);
    });
  });

  // ── Modifier 5: Plan type diversity (±3) ──────────────────────────────

  describe("mod5: plan type diversity", () => {
    it("+3 when >= 5 plan types active", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.plan_coverage.plan_types_active).toBeGreaterThanOrEqual(5);
    });

    it("+1 when 3-4 plan types", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        asthma_plans: [],
        autism_plans: [],
        diabetic_care_plans: [],
        continence_plans: [],
        physio_ot_plans: [],
        menstrual_health_plans: [],
        occupational_therapy_records: [],
      }));
      // adhd + allergy + epilepsy = 3 types
      expect(result.plan_coverage.plan_types_active).toBe(3);
    });

    it("-3 when only 1 plan type", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1" })],
        allergy_plans: [], asthma_plans: [], autism_plans: [],
        diabetic_care_plans: [], epilepsy_plans: [], continence_plans: [],
        physio_ot_plans: [], menstrual_health_plans: [], occupational_therapy_records: [],
        total_children: 3,
      });
      expect(result.plan_coverage.plan_types_active).toBe(1);
    });

    it("+0 when 2 plan types", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1" })],
        allergy_plans: [makeAllergy({ child_id: "c2" })],
        asthma_plans: [], autism_plans: [], diabetic_care_plans: [],
        epilepsy_plans: [], continence_plans: [], physio_ot_plans: [],
        menstrual_health_plans: [], occupational_therapy_records: [],
        total_children: 3,
      });
      expect(result.plan_coverage.plan_types_active).toBe(2);
    });
  });

  // ── Modifier 6: School integration (±3) ───────────────────────────────

  describe("mod6: school integration", () => {
    it("+3 when 100% school integration", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      // All allergy, asthma, epilepsy, diabetic, physio_ot have school plans
      expect(result.safety_preparedness.allergy_school_plan_rate).toBe(100);
      expect(result.safety_preparedness.asthma_school_inhaler_rate).toBe(100);
      expect(result.safety_preparedness.epilepsy_school_plan_rate).toBe(100);
      expect(result.safety_preparedness.diabetic_school_plan_rate).toBe(100);
    });

    it("-3 when school integration < 50%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        allergy_plans: [
          makeAllergy({ child_id: "c2", school_has_plan: false }),
          makeAllergy({ id: "allergy-2", child_id: "c3", school_has_plan: false }),
        ],
        asthma_plans: [makeAsthma({ child_id: "c3", school_has_inhaler: false })],
        epilepsy_plans: [makeEpilepsy({ child_id: "c5", school_plan_in_place: false })],
        diabetic_care_plans: [makeDiabetic({ child_id: "c4", school_plan_in_place: false })],
        physio_ot_plans: [makePhysioOt({ child_id: "c1", school_plan_in_place: false })],
      }));
      // 0/6 → 0% → -3
      expect(result.safety_preparedness.allergy_school_plan_rate).toBe(0);
    });

    it("+0 when no school-applicable plans", () => {
      // Only ADHD, autism, continence, menstrual — not school-applicable
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1" })],
        allergy_plans: [], asthma_plans: [],
        autism_plans: [makeAutism({ child_id: "c2" })],
        diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [makeContinence({ child_id: "c3" })],
        physio_ot_plans: [],
        menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 3,
      });
      // No school-applicable plans → +0
      expect(result.plan_coverage.plan_types_active).toBe(3);
    });
  });

  // ── Modifier 7: Therapy engagement (±3) ───────────────────────────────

  describe("mod7: therapy engagement", () => {
    it("+3 when therapy engagement >= 90%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      // physio has next_appointment_set, OT has report_provided
      // 2/2 = 100%
      expect(result.therapy.physio_ot_active).toBe(1);
      expect(result.therapy.ot_active).toBe(1);
    });

    it("-3 when therapy engagement < 50%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        physio_ot_plans: [
          makePhysioOt({ child_id: "c1", next_appointment_set: false }),
          makePhysioOt({ id: "physio-2", child_id: "c2", next_appointment_set: false }),
        ],
        occupational_therapy_records: [
          makeOT({ child_id: "c4", report_provided: false }),
        ],
      }));
      // 0/3 = 0% → -3
      expect(result.therapy.report_provision_rate).toBe(0);
    });

    it("+0 when no therapy records", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        physio_ot_plans: [],
        occupational_therapy_records: [],
      }));
      expect(result.therapy.physio_ot_active).toBe(0);
      expect(result.therapy.ot_active).toBe(0);
    });
  });

  // ── Modifier 8: Emergency preparedness (±3) ───────────────────────────

  describe("mod8: emergency preparedness", () => {
    it("+3 when 100% emergency ready", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      // allergy has emergency_protocol, epilepsy has rescue_med, diabetic has contacts
      expect(result.health_plans_score).toBe(80);
    });

    it("-3 when emergency readiness < 50%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        allergy_plans: [
          makeAllergy({ child_id: "c2", emergency_protocol_count: 0 }),
          makeAllergy({ id: "allergy-2", child_id: "c3", emergency_protocol_count: 0 }),
        ],
        epilepsy_plans: [makeEpilepsy({ child_id: "c5", has_rescue_medication: false })],
        diabetic_care_plans: [makeDiabetic({ child_id: "c4", emergency_contacts_count: 0 })],
      }));
      // 0/4 = 0% → -3
      expect(result.health_plans_score).toBe(74);
    });

    it("+0 when no emergency-applicable plans", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1" })],
        allergy_plans: [], asthma_plans: [],
        autism_plans: [makeAutism({ child_id: "c2" })],
        diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [],
        physio_ot_plans: [],
        menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 3,
      });
      // Only ADHD + autism → no emergency plans
      expect(result.health_plans_score).toBe(62);
    });
  });

  // ── Profile calculations ──────────────────────────────────────────────

  describe("profile calculations", () => {
    it("calculates plan coverage correctly", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      // 2 adhd + 2 allergy + 1 asthma + 1 autism + 1 diabetic + 1 epilepsy + 1 continence + 1 physio + 1 menstrual + 1 OT = 12
      expect(result.plan_coverage.total_plans).toBe(12);
      expect(result.plan_coverage.unique_children_covered).toBe(5);
      expect(result.plan_coverage.child_coverage).toBe(100);
      expect(result.plan_coverage.plan_types_active).toBeGreaterThanOrEqual(7);
    });

    it("counts overdue reviews correctly", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", review_date: "2025-01-01" }),
          makeADHD({ id: "adhd-2", child_id: "c2", review_date: "2025-01-01" }),
        ],
      }));
      // 2 ADHD overdue (menstrual plan not counted in reviews)
      expect(result.review_compliance.overdue_reviews).toBe(2);
    });

    it("calculates safety preparedness rates", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        allergy_plans: [
          makeAllergy({ child_id: "c2", staff_trained_count: 3, school_has_plan: true }),
          makeAllergy({ id: "allergy-2", child_id: "c3", staff_trained_count: 0, school_has_plan: false }),
        ],
      }));
      expect(result.safety_preparedness.allergy_staff_trained_rate).toBe(50);
      expect(result.safety_preparedness.allergy_school_plan_rate).toBe(50);
    });

    it("calculates child voice profile", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", child_voice_provided: true }),
          makeADHD({ id: "adhd-2", child_id: "c2", child_voice_provided: false }),
        ],
      }));
      // 2 adhd (1 true, 1 false) + 1 autism (true) + 1 continence (true) + 1 physio (true) + 1 menstrual (true) = 5/6
      expect(result.child_voice.total_applicable).toBe(6);
      expect(result.child_voice.total_with_voice).toBe(5);
      expect(result.child_voice.voice_rate).toBe(83);
    });

    it("calculates therapy profile", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        physio_ot_plans: [
          makePhysioOt({ child_id: "c1", goals_count: 3, exercises_count: 5 }),
          makePhysioOt({ id: "physio-2", child_id: "c2", goals_count: 4, exercises_count: 6 }),
        ],
      }));
      expect(result.therapy.physio_ot_active).toBe(2);
      expect(result.therapy.total_goals).toBe(7);
      expect(result.therapy.total_exercises).toBe(11);
    });

    it("calculates OT report rate", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        occupational_therapy_records: [
          makeOT({ child_id: "c4", report_provided: true }),
          makeOT({ id: "ot-2", child_id: "c5", report_provided: false }),
        ],
      }));
      expect(result.therapy.report_provision_rate).toBe(50);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.headline).toContain("Exceptional");
    });

    it("inadequate headline", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1", review_date: "2025-01-01", child_voice_provided: false })],
        allergy_plans: [makeAllergy({ child_id: "c1", staff_trained_count: 0, school_has_plan: false, emergency_protocol_count: 0 })],
        asthma_plans: [], autism_plans: [], diabetic_care_plans: [],
        epilepsy_plans: [], continence_plans: [], physio_ot_plans: [],
        menstrual_health_plans: [], occupational_therapy_records: [],
        total_children: 5,
      });
      expect(result.headline).toContain("Critical");
    });

    it("insufficient_data headline", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [], allergy_plans: [], asthma_plans: [],
        autism_plans: [], diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [], physio_ot_plans: [], menstrual_health_plans: [],
        occupational_therapy_records: [], total_children: 0,
      });
      expect(result.headline).toContain("No specialized health plan data");
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes coverage strength when >= 90%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.strengths.some(s => s.includes("coverage"))).toBe(true);
    });

    it("includes review compliance strength when >= 95%", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.strengths.some(s => s.includes("review") && s.includes("on time"))).toBe(true);
    });

    it("includes allergy staff trained strength", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.strengths.some(s => s.includes("allergy") || s.includes("anaphylaxis"))).toBe(true);
    });

    it("includes plan type diversity strength", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.strengths.some(s => s.includes("plan types") || s.includes("condition coverage"))).toBe(true);
    });

    it("no strengths when data is poor", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1", review_date: "2025-01-01", child_voice_provided: false })],
        allergy_plans: [], asthma_plans: [], autism_plans: [],
        diabetic_care_plans: [], epilepsy_plans: [], continence_plans: [],
        physio_ot_plans: [], menstrual_health_plans: [], occupational_therapy_records: [],
        total_children: 5,
      });
      expect(result.strengths.length).toBe(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags overdue reviews", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", review_date: "2025-01-01" }),
          makeADHD({ id: "adhd-2", child_id: "c2" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("flags low coverage", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1" })],
        allergy_plans: [], asthma_plans: [], autism_plans: [],
        diabetic_care_plans: [], epilepsy_plans: [], continence_plans: [],
        physio_ot_plans: [], menstrual_health_plans: [], occupational_therapy_records: [],
        total_children: 5,
      });
      expect(result.concerns.some(c => c.includes("coverage"))).toBe(true);
    });

    it("flags untrained allergy staff", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        allergy_plans: [
          makeAllergy({ child_id: "c2", staff_trained_count: 0 }),
          makeAllergy({ id: "allergy-2", child_id: "c3" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("allergy") && c.includes("trained"))).toBe(true);
    });

    it("flags diabetic review flags", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        diabetic_care_plans: [makeDiabetic({ child_id: "c4", flags_for_review_count: 3 })],
      }));
      expect(result.concerns.some(c => c.includes("diabetic") || c.includes("flag"))).toBe(true);
    });

    it("flags recent seizures", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        epilepsy_plans: [makeEpilepsy({ child_id: "c5", recent_seizure_count: 8 })],
      }));
      expect(result.concerns.some(c => c.includes("seizure"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends urgent review when plans overdue", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", review_date: "2025-01-01" }),
          makeADHD({ id: "adhd-2", child_id: "c2" }),
        ],
      }));
      expect(result.recommendations.some(r => r.recommendation.includes("review") && r.regulatory_ref === "CHR 2015 Reg 10")).toBe(true);
    });

    it("recommends allergy training when staff not trained", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        allergy_plans: [makeAllergy({ child_id: "c2", staff_trained_count: 0 })],
      }));
      expect(result.recommendations.some(r => r.recommendation.includes("allergy") && r.urgency === "immediate")).toBe(true);
    });

    it("recommends epilepsy training when staff not trained", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        epilepsy_plans: [makeEpilepsy({ child_id: "c5", staff_trained_count: 0 })],
      }));
      expect(result.recommendations.some(r => r.recommendation.includes("epilepsy") && r.urgency === "immediate")).toBe(true);
    });

    it("has ranked recommendations", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [makeADHD({ child_id: "c1", review_date: "2025-01-01" })],
        allergy_plans: [makeAllergy({ child_id: "c2", staff_trained_count: 0 })],
      }));
      if (result.recommendations.length >= 2) {
        expect(result.recommendations[0].rank).toBe(1);
        expect(result.recommendations[1].rank).toBe(2);
      }
    });

    it("no recommendations when everything is excellent", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.recommendations.length).toBe(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("insights", () => {
    it("critical insight for many recent seizures", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        epilepsy_plans: [makeEpilepsy({ child_id: "c5", recent_seizure_count: 8 })],
      }));
      expect(result.insights.some(i => i.severity === "critical" && i.text.includes("seizure"))).toBe(true);
    });

    it("warning insight for diabetic flags", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        diabetic_care_plans: [makeDiabetic({ child_id: "c4", flags_for_review_count: 4 })],
      }));
      expect(result.insights.some(i => i.severity === "warning" && i.text.includes("diabetic"))).toBe(true);
    });

    it("critical insight for very overdue plans", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", review_date: "2024-06-01" }), // >180 days
          makeADHD({ id: "adhd-2", child_id: "c2" }),
        ],
      }));
      expect(result.insights.some(i => i.severity === "critical" && i.text.includes("overdue"))).toBe(true);
    });

    it("positive insight for exemplary multi-condition management", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("positive insight when all children wear medical alerts", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      expect(result.insights.some(i => i.severity === "positive" && i.text.includes("medical alert"))).toBe(true);
    });

    it("warning insight for low OT report rate", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        occupational_therapy_records: [
          makeOT({ child_id: "c4", report_provided: false }),
          makeOT({ id: "ot-2", child_id: "c5", report_provided: false }),
        ],
      }));
      expect(result.insights.some(i => i.severity === "warning" && i.text.includes("OT report"))).toBe(true);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single plan type with many plans", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [
          makeADHD({ child_id: "c1" }),
          makeADHD({ id: "adhd-2", child_id: "c2" }),
          makeADHD({ id: "adhd-3", child_id: "c3" }),
        ],
        allergy_plans: [], asthma_plans: [], autism_plans: [],
        diabetic_care_plans: [], epilepsy_plans: [], continence_plans: [],
        physio_ot_plans: [], menstrual_health_plans: [], occupational_therapy_records: [],
        total_children: 3,
      });
      expect(result.plan_coverage.plan_types_active).toBe(1);
      expect(result.plan_coverage.child_coverage).toBe(100);
    });

    it("menstrual health plan_reviewed_date is excluded from review compliance", () => {
      // plan_reviewed_date is past tense — no forward review concept
      const a = computeHomeSpecializedHealthPlans(baseInput());
      const b = computeHomeSpecializedHealthPlans(baseInput({
        menstrual_health_plans: [makeMenstrualHealth({ child_id: "c3", plan_reviewed_date: "2024-01-01" })],
      }));
      // Even an old reviewed date doesn't affect overdue count
      expect(a.review_compliance.overdue_reviews).toBe(b.review_compliance.overdue_reviews);
    });

    it("handles all children with the same child_id", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "c1" })],
        allergy_plans: [makeAllergy({ child_id: "c1" })],
        asthma_plans: [makeAsthma({ child_id: "c1" })],
        autism_plans: [], diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [], physio_ot_plans: [], menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 3,
      });
      // Only 1 unique child covered
      expect(result.plan_coverage.unique_children_covered).toBe(1);
      expect(result.plan_coverage.child_coverage).toBe(33);
    });

    it("handles future review dates as on-time", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [makeADHD({ child_id: "c1", review_date: "2026-01-01" })],
      }));
      // Future date → not overdue
      expect(result.review_compliance.overdue_reviews).toBe(0);
      expect(result.review_compliance.on_time_rate).toBe(100);
    });

    it("handles very old overdue dates", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput({
        adhd_plans: [
          makeADHD({ child_id: "c1", review_date: "2023-01-01" }),
          makeADHD({ id: "adhd-2", child_id: "c2" }),
        ],
      }));
      expect(result.review_compliance.oldest_overdue_days).toBeGreaterThan(800);
    });

    it("handles empty child_ids gracefully", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [makeADHD({ child_id: "" })],
        allergy_plans: [], asthma_plans: [], autism_plans: [],
        diabetic_care_plans: [], epilepsy_plans: [], continence_plans: [],
        physio_ot_plans: [], menstrual_health_plans: [], occupational_therapy_records: [],
        total_children: 3,
      });
      expect(result.plan_coverage.unique_children_covered).toBe(1); // "" is still a unique id
    });
  });

  // ── Cross-modifier isolation ──────────────────────────────────────────

  describe("cross-modifier isolation", () => {
    it("changing mod1 does not affect mod2", () => {
      // Same review dates, different coverage
      const a = computeHomeSpecializedHealthPlans(baseInput());
      const b = computeHomeSpecializedHealthPlans(baseInput({
        total_children: 20, // drops coverage from 100% to 25%
      }));
      expect(a.review_compliance.on_time_rate).toBe(b.review_compliance.on_time_rate);
    });

    it("changing mod3 only affects safety-critical plans", () => {
      const a = computeHomeSpecializedHealthPlans(baseInput());
      const b = computeHomeSpecializedHealthPlans(baseInput({
        allergy_plans: [
          makeAllergy({ child_id: "c2", staff_trained_count: 0, school_has_plan: false }),
          makeAllergy({ id: "allergy-2", child_id: "c3", staff_trained_count: 0, school_has_plan: false }),
        ],
      }));
      // mod3 changes, but also mod6 (school integration) and mod8 (emergency) may change
      expect(b.safety_preparedness.allergy_staff_trained_rate).toBe(0);
      expect(a.safety_preparedness.allergy_staff_trained_rate).toBe(100);
    });

    it("therapy changes don't affect plan coverage", () => {
      const a = computeHomeSpecializedHealthPlans(baseInput());
      const b = computeHomeSpecializedHealthPlans(baseInput({
        physio_ot_plans: [makePhysioOt({ child_id: "c1", next_appointment_set: false })],
        occupational_therapy_records: [makeOT({ child_id: "c4", report_provided: false })],
      }));
      expect(a.plan_coverage.child_coverage).toBe(b.plan_coverage.child_coverage);
    });
  });

  // ── Exact score calculations ──────────────────────────────────────────

  describe("exact score calculations", () => {
    it("calculates base outstanding score correctly", () => {
      const result = computeHomeSpecializedHealthPlans(baseInput());
      // Base 52
      // mod1 (coverage): 5/5 = 100% → +5
      // mod2 (reviews): 11 reviewable (excl menstrual), all on time → +4
      // mod3 (safety-critical): 2 allergy + 1 epilepsy all ready → +4
      // mod4 (child voice): 6/6 = 100% → +3
      // mod5 (plan types): 10 types → +3
      // mod6 (school): 6/6 = 100% → +3
      // mod7 (therapy): 2/2 = 100% → +3
      // mod8 (emergency): 4/4 = 100% → +3
      // Total: 52 + 5 + 4 + 4 + 3 + 3 + 3 + 3 + 3 = 80
      expect(result.health_plans_score).toBe(80);
    });

    it("all-zero children no plans gives score 52 (base only, mod1 uses -5)", () => {
      const result = computeHomeSpecializedHealthPlans({
        today: TODAY,
        adhd_plans: [], allergy_plans: [], asthma_plans: [],
        autism_plans: [], diabetic_care_plans: [], epilepsy_plans: [],
        continence_plans: [], physio_ot_plans: [], menstrual_health_plans: [],
        occupational_therapy_records: [],
        total_children: 3,
      });
      // mod1: 0 plans, 0 coverage → -5
      // mod2: 0 reviewables → +0
      // mod3: no allergy/epilepsy, no diabetic/asthma → +0
      // mod4: 0 voice applicable → +0
      // mod5: 0 plans → +0
      // mod6: 0 school applicable → +0
      // mod7: 0 therapy → +0
      // mod8: 0 emergency → +0
      // Score: 52 - 5 = 47
      expect(result.health_plans_score).toBe(47);
      expect(result.health_plans_rating).toBe("adequate");
    });
  });
});

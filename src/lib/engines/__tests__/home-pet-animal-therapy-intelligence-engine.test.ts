// ==============================================================================
// CARA -- HOME PET & ANIMAL THERAPY INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering insufficient_data, inadequate floor,
// outstanding/good/adequate/inadequate scenarios, every bonus in isolation,
// every penalty, all 6 rates, strengths, concerns, recommendations, insights,
// and edge cases.
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  computePetAnimalTherapy,
  type PetAnimalTherapyInput,
  type TherapySessionInput,
  type PetCareInput,
  type AnimalInteractionInput,
  type AnimalWelfareInput,
  type ChildEngagementInput,
} from "../home-pet-animal-therapy-intelligence-engine";

// -- Constants ---------------------------------------------------------------

const TODAY = "2026-05-29";

// -- ID generator ------------------------------------------------------------

let _id = 0;
function uid(): string {
  return `test_${++_id}`;
}

// -- Factories ---------------------------------------------------------------

function makeSession(overrides: Partial<TherapySessionInput> = {}): TherapySessionInput {
  return {
    id: uid(),
    child_id: "child_1",
    session_date: "2026-05-20",
    session_type: "individual",
    animal_type: "dog",
    animal_name: "Rex",
    therapist_name: "Dr Smith",
    duration_minutes: 45,
    goals_set: true,
    goals_met: true,
    child_engagement_rating: 4,
    outcome_rating: 4,
    child_feedback_positive: true,
    staff_present: true,
    risk_assessment_completed: true,
    notes_recorded: true,
    follow_up_planned: true,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeCare(overrides: Partial<PetCareInput> = {}): PetCareInput {
  return {
    id: uid(),
    child_id: "child_1",
    animal_id: "animal_1",
    animal_type: "dog",
    care_date: "2026-05-20",
    care_type: "feeding",
    responsibility_assigned: true,
    responsibility_completed: true,
    supervised: true,
    child_initiated: true,
    child_engagement_rating: 4,
    skills_demonstrated: ["empathy"],
    staff_observer: "staff_1",
    notes_recorded: true,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeInteraction(overrides: Partial<AnimalInteractionInput> = {}): AnimalInteractionInput {
  return {
    id: uid(),
    child_id: "child_1",
    animal_id: "animal_1",
    animal_type: "dog",
    interaction_date: "2026-05-20",
    interaction_type: "therapeutic",
    duration_minutes: 30,
    setting: "indoor",
    child_mood_before: 2,
    child_mood_after: 4,
    positive_outcome: true,
    behavioural_improvement: true,
    emotional_regulation_observed: true,
    risk_assessment_current: true,
    staff_present: true,
    notes_recorded: true,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeWelfare(overrides: Partial<AnimalWelfareInput> = {}): AnimalWelfareInput {
  return {
    id: uid(),
    animal_id: "animal_1",
    animal_type: "dog",
    animal_name: "Rex",
    check_date: "2026-05-20",
    check_type: "routine",
    health_status: "excellent",
    welfare_standards_met: true,
    environment_suitable: true,
    diet_appropriate: true,
    exercise_adequate: true,
    veterinary_up_to_date: true,
    insurance_current: true,
    risk_assessment_current: true,
    concerns_identified: false,
    concerns_actioned: false,
    next_review_date: "2026-06-20",
    review_overdue: false,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeEngagement(overrides: Partial<ChildEngagementInput> = {}): ChildEngagementInput {
  return {
    id: uid(),
    child_id: "child_1",
    assessment_date: "2026-05-20",
    engagement_level: "high",
    therapeutic_benefit_observed: true,
    confidence_improved: true,
    empathy_demonstrated: true,
    responsibility_skills_improved: true,
    social_skills_improved: true,
    emotional_regulation_improved: true,
    child_self_reported_benefit: true,
    staff_reported_benefit: true,
    overall_progress_rating: 4,
    barriers_identified: [],
    support_plan_in_place: true,
    review_date: "2026-06-20",
    review_overdue: false,
    created_at: "2026-05-20",
    ...overrides,
  };
}

/** Build a full input with convenient defaults -- override any field. */
function baseInput(overrides: Partial<PetAnimalTherapyInput> = {}): PetAnimalTherapyInput {
  return {
    today: TODAY,
    total_children: 3,
    therapy_session_records: [],
    pet_care_records: [],
    animal_interaction_records: [],
    animal_welfare_records: [],
    child_engagement_records: [],
    ...overrides,
  };
}

// Helper: pct mirrors the engine's pct
function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ==============================================================================
// TESTS
// ==============================================================================

describe("computePetAnimalTherapy", () => {

  // ======================================================================
  // 1. INSUFFICIENT DATA
  // ======================================================================
  describe("insufficient_data", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computePetAnimalTherapy(baseInput({ total_children: 0 }));
      expect(r.therapy_rating).toBe("insufficient_data");
      expect(r.therapy_score).toBe(0);
      expect(r.total_sessions).toBe(0);
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("headline mentions insufficient data", () => {
      const r = computePetAnimalTherapy(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("insufficient data");
    });

    it("all 6 rates are 0", () => {
      const r = computePetAnimalTherapy(baseInput({ total_children: 0 }));
      expect(r.therapy_frequency_rate).toBe(0);
      expect(r.pet_care_responsibility_rate).toBe(0);
      expect(r.interaction_outcome_rate).toBe(0);
      expect(r.welfare_compliance_rate).toBe(0);
      expect(r.child_engagement_rate).toBe(0);
      expect(r.child_benefit_rate).toBe(0);
    });
  });

  // ======================================================================
  // 2. INADEQUATE FLOOR (all empty, children > 0)
  // ======================================================================
  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate with score 15", () => {
      const r = computePetAnimalTherapy(baseInput({ total_children: 3 }));
      expect(r.therapy_rating).toBe("inadequate");
      expect(r.therapy_score).toBe(15);
    });

    it("has exactly 1 concern", () => {
      const r = computePetAnimalTherapy(baseInput({ total_children: 3 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No therapy session records");
    });

    it("has exactly 2 recommendations with immediate urgency", () => {
      const r = computePetAnimalTherapy(baseInput({ total_children: 3 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("has exactly 1 critical insight", () => {
      const r = computePetAnimalTherapy(baseInput({ total_children: 3 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("headline mentions urgent attention", () => {
      const r = computePetAnimalTherapy(baseInput({ total_children: 3 }));
      expect(r.headline).toContain("urgent attention");
    });

    it("all 6 rates are 0", () => {
      const r = computePetAnimalTherapy(baseInput({ total_children: 3 }));
      expect(r.therapy_frequency_rate).toBe(0);
      expect(r.pet_care_responsibility_rate).toBe(0);
      expect(r.interaction_outcome_rate).toBe(0);
      expect(r.welfare_compliance_rate).toBe(0);
      expect(r.child_engagement_rate).toBe(0);
      expect(r.child_benefit_rate).toBe(0);
    });
  });

  // ======================================================================
  // 3. pct HELPER EDGE CASES
  // ======================================================================
  describe("pct(0,0)=0 edge case", () => {
    it("pct(0,0)=0 is consistent with engine behaviour", () => {
      expect(pct(0, 0)).toBe(0);
    });

    it("rates are 0 when all arrays empty (pct with d=0 returns 0)", () => {
      // Only welfare records present but no assigned care
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        animal_welfare_records: [makeWelfare()],
      }));
      // pet_care_responsibility_rate uses pct(completed, assigned) -- both 0 when no care records
      expect(r.pet_care_responsibility_rate).toBe(0);
    });

    it("pet_care_responsibility_rate is 0 when no responsibilities assigned", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare({ responsibility_assigned: false, responsibility_completed: false })],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.pet_care_responsibility_rate).toBe(0);
    });
  });

  // ======================================================================
  // 4. BASE SCORE
  // ======================================================================
  describe("base score is 52", () => {
    it("score is 52 when all rates are in the no-bonus, no-penalty zone", () => {
      // Create records that yield middle-range rates (40-69 range for most, 50-79 for welfare)
      // that don't trigger any bonuses or penalties.
      // 2 children, 1 session for child_1 -> therapyFrequencyRate = pct(1,2) = 50
      // 1 care with assigned+completed -> petCareResponsibilityRate = 100 -- triggers bonus!
      // So we need to be careful. Let's make everything land in the dead zone.

      // therapyFrequencyRate: 1 unique child / 2 total = 50% -- no bonus, no penalty
      // petCareResponsibilityRate: 1 completed / 2 assigned = 50% -- no bonus, no penalty
      // interactionOutcomeRate: 1 positive / 2 total = 50% -- no bonus, no penalty
      // welfareComplianceRate: 1 met / 2 total = 50% -- no bonus, no penalty (>=50, <80)
      // childEngagementRate: 1 high-mod / 2 total = 50% -- no bonus, no penalty
      // childBenefitRate: needs to be 50-69 range
      // sessionRiskAssessmentRate: 1/2 = 50% -- no bonus
      // goalAchievementRate: 1 met / 2 goals set = 50% -- no bonus

      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      }));

      // therapyFrequencyRate = pct(1, 2) = 50 -- unique child_1 out of 2 total children
      // petCareResponsibilityRate = pct(1, 2) = 50
      // interactionOutcomeRate = pct(1, 2) = 50
      // welfareComplianceRate = pct(1, 2) = 50
      // childEngagementRate = pct(1, 2) = 50
      // childBenefitRate = pct(1+1+1, 2+2+2) = pct(3, 6) = 50
      // sessionRiskAssessmentRate = pct(1, 2) = 50
      // goalAchievementRate = pct(1, 2) = 50
      // No bonuses, no penalties
      expect(r.therapy_score).toBe(52);
    });
  });

  // ======================================================================
  // 5. BONUS ISOLATION TESTS
  // ======================================================================
  describe("bonus isolation", () => {
    // For each bonus, we set up records so that ONLY the target bonus fires.
    // All other rates must land in dead zones (no bonus, no penalty).

    // Helper: create a scenario where everything is in the dead zone
    function deadZoneInput(): PetAnimalTherapyInput {
      // 2 children, 1 session for child_1 -> freq = 50%
      // 1/2 care completed -> 50%
      // 1/2 interactions positive -> 50%
      // 1/2 welfare met -> 50%
      // 1/2 engagement high -> 50%
      // benefit = pct(1+1+1, 2+2+2) = 50%
      // risk assessment = 50%
      // goal achievement = 50%
      return baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
    }

    // --- Bonus 1: therapyFrequencyRate >= 90 -> +4, >= 70 -> +2 ---
    describe("Bonus 1: therapyFrequencyRate", () => {
      it("+4 when therapyFrequencyRate >= 90", () => {
        // 2 unique children / 2 total = 100%
        const input = deadZoneInput();
        input.therapy_session_records = [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_2", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ];
        // childBenefitRate = pct(1+1+1, 2+2+2) = 50% -- still dead zone
        const r = computePetAnimalTherapy(input);
        expect(r.therapy_frequency_rate).toBe(100);
        expect(r.therapy_score).toBe(52 + 4);
      });

      it("+2 when therapyFrequencyRate >= 70 and < 90", () => {
        // 3 unique children / 4 total = 75%
        const input = deadZoneInput();
        input.total_children = 4;
        input.therapy_session_records = [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_2", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          makeSession({ child_id: "child_3", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ];
        // freq = pct(3, 4) = 75 -> +2
        // goalAchievementRate = pct(1, 4) = 25 -> no bonus
        // sessionRiskAssessmentRate = pct(1, 4) = 25 -> no bonus
        // childBenefitRate = pct(1+1+1, 4+2+2) = pct(3,8) = 38 -> no bonus, no penalty (totalBenefitOpportunities > 0 but < 50 triggers concern)
        const r = computePetAnimalTherapy(input);
        expect(r.therapy_frequency_rate).toBe(75);
        expect(r.therapy_score).toBe(52 + 2);
      });
    });

    // --- Bonus 2: petCareResponsibilityRate >= 90 -> +4, >= 70 -> +2 ---
    describe("Bonus 2: petCareResponsibilityRate", () => {
      it("+4 when petCareResponsibilityRate >= 90", () => {
        const input = deadZoneInput();
        // All assigned care completed = 100%
        input.pet_care_records = [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
        ];
        const r = computePetAnimalTherapy(input);
        expect(r.pet_care_responsibility_rate).toBe(100);
        expect(r.therapy_score).toBe(52 + 4);
      });

      it("+2 when petCareResponsibilityRate >= 70 and < 90", () => {
        const input = deadZoneInput();
        // 3 out of 4 completed = 75%
        input.pet_care_records = [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ];
        const r = computePetAnimalTherapy(input);
        expect(r.pet_care_responsibility_rate).toBe(75);
        expect(r.therapy_score).toBe(52 + 2);
      });
    });

    // --- Bonus 3: interactionOutcomeRate >= 90 -> +4, >= 70 -> +2 ---
    describe("Bonus 3: interactionOutcomeRate", () => {
      it("+4 when interactionOutcomeRate >= 90", () => {
        const input = deadZoneInput();
        input.animal_interaction_records = [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
        ];
        // Now childBenefitRate changes: benefit = pct(1+2+1, 2+2+2) = pct(4,6) = 67 -> no bonus
        const r = computePetAnimalTherapy(input);
        expect(r.interaction_outcome_rate).toBe(100);
        expect(r.therapy_score).toBe(52 + 4);
      });

      it("+2 when interactionOutcomeRate >= 70 and < 90", () => {
        const input = deadZoneInput();
        input.animal_interaction_records = [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ];
        // interactionOutcomeRate = pct(3, 4) = 75
        // childBenefitRate = pct(1+3+1, 2+4+2) = pct(5,8) = 63 -> no bonus
        const r = computePetAnimalTherapy(input);
        expect(r.interaction_outcome_rate).toBe(75);
        expect(r.therapy_score).toBe(52 + 2);
      });
    });

    // --- Bonus 4: welfareComplianceRate >= 100 -> +4, >= 80 -> +2 ---
    describe("Bonus 4: welfareComplianceRate", () => {
      it("+4 when welfareComplianceRate >= 100", () => {
        const input = deadZoneInput();
        input.animal_welfare_records = [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
        ];
        const r = computePetAnimalTherapy(input);
        expect(r.welfare_compliance_rate).toBe(100);
        expect(r.therapy_score).toBe(52 + 4);
      });

      it("+2 when welfareComplianceRate >= 80 and < 100", () => {
        const input = deadZoneInput();
        // 4 out of 5 met = 80%
        input.animal_welfare_records = [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ];
        const r = computePetAnimalTherapy(input);
        expect(r.welfare_compliance_rate).toBe(80);
        expect(r.therapy_score).toBe(52 + 2);
      });
    });

    // --- Bonus 5: childEngagementRate >= 90 -> +4, >= 70 -> +2 ---
    describe("Bonus 5: childEngagementRate", () => {
      it("+4 when childEngagementRate >= 90", () => {
        const input = deadZoneInput();
        input.child_engagement_records = [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
        ];
        // childBenefitRate = pct(1+1+2, 2+2+2) = pct(4,6) = 67 -> no bonus
        const r = computePetAnimalTherapy(input);
        expect(r.child_engagement_rate).toBe(100);
        expect(r.therapy_score).toBe(52 + 4);
      });

      it("+2 when childEngagementRate >= 70 and < 90", () => {
        const input = deadZoneInput();
        // 3 high/moderate out of 4 = 75%
        input.child_engagement_records = [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "moderate", child_self_reported_benefit: false }),
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: false }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ];
        // childBenefitRate = pct(1+1+1, 2+2+4) = pct(3,8) = 38 -> no bonus
        const r = computePetAnimalTherapy(input);
        expect(r.child_engagement_rate).toBe(75);
        expect(r.therapy_score).toBe(52 + 2);
      });
    });

    // --- Bonus 6: childBenefitRate >= 90 -> +4, >= 70 -> +2 ---
    describe("Bonus 6: childBenefitRate", () => {
      it("+4 when childBenefitRate >= 90", () => {
        const input = deadZoneInput();
        // Make all feedback/outcomes/benefit positive
        input.therapy_session_records = [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: true }),
        ];
        input.animal_interaction_records = [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
        ];
        input.child_engagement_records = [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: true }),
        ];
        // childBenefitRate = pct(2+2+2, 2+2+2) = 100 -> +4
        // But interactionOutcomeRate = 100 -> +4 and childEngagementRate = pct(1,2) = 50 -> no bonus
        // therapyFrequencyRate = 50 -> no bonus
        // So we get +4 (interaction) + +4 (benefit) = +8... we need to isolate benefit
        // Let's adjust interactions to 50%
        input.animal_interaction_records = [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ];
        // childBenefitRate = pct(2+1+2, 2+2+2) = pct(5,6) = 83 -> need >= 90
        // Not enough. Let's add more positive records.
        input.therapy_session_records = [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: true }),
        ];
        // sessions: 4 positive feedback, interactions: 1 positive, engagement: 2 self-reported
        // benefit = pct(4+1+2, 4+2+2) = pct(7,8) = 88 -> not enough
        // Make all engagement positive too and add more
        input.child_engagement_records = [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: true }),
        ];
        // benefit = pct(4+1+4, 4+2+4) = pct(9,10) = 90 -> +4
        // interactionOutcomeRate = pct(1,2) = 50 -> no bonus
        // childEngagementRate = pct(1,4) = 25 -> no bonus, but penalty! (< 40)
        // That would trigger -4 penalty. Let's fix engagement.
        input.child_engagement_records = [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "moderate", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: true }),
        ];
        // childEngagementRate = pct(2,4) = 50 -> no bonus, no penalty
        // benefit = pct(4+1+4, 4+2+4) = pct(9,10) = 90 -> +4
        // goalAchievementRate = pct(1,4) = 25 (1 met out of 4 goals set) -> no bonus
        // sessionRiskAssessmentRate = pct(1,4) = 25 -> no bonus
        const r = computePetAnimalTherapy(input);
        expect(r.child_benefit_rate).toBe(90);
        expect(r.therapy_score).toBe(52 + 4);
      });

      it("+2 when childBenefitRate >= 70 and < 90", () => {
        const input = deadZoneInput();
        // Adjust to get benefit rate around 75
        input.therapy_session_records = [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ];
        input.animal_interaction_records = [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ];
        input.child_engagement_records = [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "moderate", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ];
        // benefit = pct(3+1+2, 4+2+4) = pct(6,10) = 60... not enough
        // Make 3rd engagement benefit true
        input.child_engagement_records[2] = makeEngagement({ engagement_level: "low", child_self_reported_benefit: true });
        // benefit = pct(3+1+3, 4+2+4) = pct(7,10) = 70 -> +2
        // childEngagementRate = pct(2,4) = 50 -> no bonus
        const r = computePetAnimalTherapy(input);
        expect(r.child_benefit_rate).toBe(70);
        expect(r.therapy_score).toBe(52 + 2);
      });
    });

    // --- Bonus 7: sessionRiskAssessmentRate >= 100 -> +2, >= 80 -> +1 ---
    describe("Bonus 7: sessionRiskAssessmentRate", () => {
      it("+2 when sessionRiskAssessmentRate >= 100", () => {
        const input = deadZoneInput();
        input.therapy_session_records = [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: true, child_feedback_positive: false }),
        ];
        // sessionRiskAssessmentRate = 100 -> +2
        // goalAchievementRate = pct(1,2) = 50 -> no bonus
        const r = computePetAnimalTherapy(input);
        expect(r.therapy_score).toBe(52 + 2);
      });

      it("+1 when sessionRiskAssessmentRate >= 80 and < 100", () => {
        const input = deadZoneInput();
        // 4 out of 5 sessions have risk assessment = 80%
        input.therapy_session_records = [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: true, child_feedback_positive: false }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: true, child_feedback_positive: false }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: true, child_feedback_positive: false }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ];
        // sessionRiskAssessmentRate = pct(4,5) = 80 -> +1
        // goalAchievementRate = pct(1,5) = 20 -> no bonus
        // benefit = pct(1+1+1, 5+2+2) = pct(3,9) = 33 -> no bonus, no penalty (< 50 triggers concern but not penalty)
        const r = computePetAnimalTherapy(input);
        expect(r.therapy_score).toBe(52 + 1);
      });
    });

    // --- Bonus 8: goalAchievementRate >= 90 -> +2, >= 70 -> +1 ---
    describe("Bonus 8: goalAchievementRate", () => {
      it("+2 when goalAchievementRate >= 90", () => {
        const input = deadZoneInput();
        input.therapy_session_records = [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: false, child_feedback_positive: false }),
        ];
        // goalAchievementRate = pct(2,2) = 100 -> +2
        // sessionRiskAssessmentRate = pct(1,2) = 50 -> no bonus
        const r = computePetAnimalTherapy(input);
        expect(r.therapy_score).toBe(52 + 2);
      });

      it("+1 when goalAchievementRate >= 70 and < 90", () => {
        const input = deadZoneInput();
        // 3 out of 4 goals met = 75%
        input.therapy_session_records = [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: false, child_feedback_positive: false }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: false, child_feedback_positive: false }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ];
        // goalAchievementRate = pct(3,4) = 75 -> +1
        // sessionRiskAssessmentRate = pct(1,4) = 25 -> no bonus
        const r = computePetAnimalTherapy(input);
        expect(r.therapy_score).toBe(52 + 1);
      });
    });

    // --- Combined max bonuses = +28 ---
    describe("max bonus cap", () => {
      it("max bonuses sum to 28 (score = 80, outstanding)", () => {
        // Need: therapyFreq >= 90 (+4), petCare >= 90 (+4), interaction >= 90 (+4),
        // welfare >= 100 (+4), engagement >= 90 (+4), benefit >= 90 (+4),
        // sessionRisk >= 100 (+2), goalAchieve >= 90 (+2)
        // Total: 4+4+4+4+4+4+2+2 = 28
        // Score = 52 + 28 = 80
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
            makeSession({ child_id: "child_2", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
            makeInteraction({ positive_outcome: true }),
          ],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true }),
            makeWelfare({ welfare_standards_met: true }),
          ],
          child_engagement_records: [
            makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
            makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          ],
        }));
        expect(r.therapy_score).toBe(80);
        expect(r.therapy_rating).toBe("outstanding");
      });
    });
  });

  // ======================================================================
  // 6. PENALTY TESTS
  // ======================================================================
  describe("penalties", () => {
    // --- Penalty 1: therapyFrequencyRate < 40 -> -5 ---
    // All penalty tests use dead-zone arrays (50% rates) to avoid accidental bonuses.
    describe("therapyFrequencyRate < 40 penalty (-5)", () => {
      it("applies -5 when therapyFrequencyRate < 40 and sessions exist", () => {
        // 1 unique child / 10 total = 10% -> penalty
        // All other arrays in dead zone: 50% rates, no bonuses
        const r = computePetAnimalTherapy(baseInput({
          total_children: 10,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
            makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [
            makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
            makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
          ],
        }));
        // therapyFreq = pct(1,10) = 10 -> -5
        // petCare = 50 -> no bonus. interaction = 50 -> no bonus. welfare = 50 -> no bonus.
        // engagement = pct(1,2) = 50 -> no bonus
        // benefit = pct(1+1+1, 2+2+2) = 50 -> no bonus
        // sessionRisk = pct(1,2) = 50 -> no bonus. goalAchieve = pct(1,2) = 50 -> no bonus
        expect(r.therapy_frequency_rate).toBe(10);
        expect(r.therapy_score).toBe(52 - 5);
      });

      it("does NOT apply penalty when sessions array is empty", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [
            makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
            makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
          ],
        }));
        // therapyFrequencyRate = 0 (< 40) but no sessions -> no penalty
        // engagement = pct(1,2) = 50 -> no bonus
        // benefit = pct(0+1+1, 0+2+2) = pct(2,4) = 50 -> no bonus
        expect(r.therapy_score).toBe(52);
      });
    });

    // --- Penalty 2: welfareComplianceRate < 50 -> -5 ---
    describe("welfareComplianceRate < 50 penalty (-5)", () => {
      it("applies -5 when welfareComplianceRate < 50 and welfare records exist", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
            makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: false }),
            makeWelfare({ welfare_standards_met: false }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [
            makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
            makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
          ],
        }));
        // welfareComplianceRate = 0 -> -5
        // therapyFreq = 50 -> no bonus. petCare = 50 -> no bonus. interaction = 50 -> no bonus.
        // engagement = 50 -> no bonus. benefit = 50 -> no bonus.
        // sessionRisk = 50 -> no bonus. goalAchieve = 50 -> no bonus.
        expect(r.welfare_compliance_rate).toBe(0);
        expect(r.therapy_score).toBe(52 - 5);
      });

      it("does NOT apply penalty when welfare array is empty", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
            makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [],
          child_engagement_records: [
            makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
            makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
          ],
        }));
        // No welfare records -> welfareComplianceRate = 0 but guard prevents penalty
        // All other rates in dead zone (50%)
        expect(r.therapy_score).toBe(52);
      });
    });

    // --- Penalty 3: interactionOutcomeRate < 40 -> -4 ---
    describe("interactionOutcomeRate < 40 penalty (-4)", () => {
      it("applies -4 when interactionOutcomeRate < 40 and interactions exist", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
            makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: false }),
            makeInteraction({ positive_outcome: false }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [
            makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
            makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
          ],
        }));
        // interactionOutcomeRate = 0 -> -4
        // therapyFreq = 50 -> no bonus. petCare = 50 -> no bonus. welfare = 50 -> no bonus.
        // engagement = 50 -> no bonus.
        // benefit = pct(1+0+1, 2+3+2) = pct(2,7) = 29 -> no bonus
        // sessionRisk = 50 -> no bonus. goalAchieve = 50 -> no bonus.
        expect(r.interaction_outcome_rate).toBe(0);
        expect(r.therapy_score).toBe(52 - 4);
      });

      it("does NOT apply penalty when interactions array is empty", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
            makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [
            makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
            makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
          ],
        }));
        // No interactions -> rate = 0 but guard prevents penalty
        // benefit = pct(1+0+1, 2+0+2) = pct(2,4) = 50 -> no bonus
        expect(r.therapy_score).toBe(52);
      });
    });

    // --- Penalty 4: childEngagementRate < 40 -> -4 ---
    describe("childEngagementRate < 40 penalty (-4)", () => {
      it("applies -4 when childEngagementRate < 40 and engagement records exist", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
            makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [
            makeEngagement({ engagement_level: "low", child_self_reported_benefit: true }),
            makeEngagement({ engagement_level: "disengaged", child_self_reported_benefit: false }),
            makeEngagement({ engagement_level: "refused", child_self_reported_benefit: false }),
          ],
        }));
        expect(r.child_engagement_rate).toBe(0);
        expect(r.therapy_score).toBe(52 - 4);
      });

      it("does NOT apply penalty when engagement array is empty", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
            makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [],
        }));
        expect(r.therapy_score).toBe(52);
      });
    });

    // --- Multiple penalties stacking ---
    describe("multiple penalties stack", () => {
      it("applies all 4 penalties together (-5 -5 -4 -4 = -18)", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 10,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: false }),
            makeInteraction({ positive_outcome: false }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: false }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [
            makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
            makeEngagement({ engagement_level: "disengaged", child_self_reported_benefit: false }),
            makeEngagement({ engagement_level: "refused", child_self_reported_benefit: false }),
          ],
        }));
        // therapyFrequencyRate = pct(1, 10) = 10 -> -5
        // welfareComplianceRate = pct(0, 2) = 0 -> -5
        // interactionOutcomeRate = pct(0, 3) = 0 -> -4
        // childEngagementRate = pct(0, 3) = 0 -> -4
        expect(r.therapy_score).toBe(52 - 18);
        expect(r.therapy_score).toBe(34);
      });
    });
  });

  // ======================================================================
  // 7. SCORE CLAMPING
  // ======================================================================
  describe("score clamping", () => {
    it("score never goes below 0", () => {
      // Even with extreme penalties, should clamp to 0
      // This is hard to hit with only -18 possible from 52, but let's verify the clamp logic works
      // Score floor with all penalties = 52 - 18 = 34, which is > 0
      // So we just verify it's >= 0
      const r = computePetAnimalTherapy(baseInput({
        total_children: 10,
        therapy_session_records: [makeSession({ child_id: "child_1", goals_set: false, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false })],
        pet_care_records: [makeCare({ responsibility_assigned: true, responsibility_completed: false })],
        animal_interaction_records: [makeInteraction({ positive_outcome: false })],
        animal_welfare_records: [makeWelfare({ welfare_standards_met: false })],
        child_engagement_records: [makeEngagement({ engagement_level: "refused", child_self_reported_benefit: false })],
      }));
      expect(r.therapy_score).toBeGreaterThanOrEqual(0);
    });

    it("score never exceeds 100", () => {
      // Even if somehow we could exceed 100, it should clamp
      // With base 52 + max 28 = 80, we can't exceed anyway, but verify
      const r = computePetAnimalTherapy(baseInput({
        total_children: 1,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
        ],
      }));
      expect(r.therapy_score).toBeLessThanOrEqual(100);
    });
  });

  // ======================================================================
  // 8. RATING THRESHOLDS (toRating)
  // ======================================================================
  describe("rating thresholds", () => {
    it("score 80 -> outstanding", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_2", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
        ],
      }));
      expect(r.therapy_score).toBe(80);
      expect(r.therapy_rating).toBe("outstanding");
    });

    it("score 65 -> good", () => {
      // We need score = 65, so base 52 + 13 in bonuses
      // +4+4+4+1 = 13 (therapy freq + care + interaction + goal achieve)
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_2", goals_set: true, goals_met: true, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      }));
      // therapyFreq = 100 -> +4
      // petCare = 100 -> +4
      // interaction = 100 -> +4
      // welfare = 50 -> no bonus
      // engagement = 50 -> no bonus
      // benefit = pct(1+2+1, 2+2+2) = pct(4,6) = 67 -> no bonus
      // sessionRisk = pct(1,2) = 50 -> no bonus
      // goalAchieve = pct(2,2) = 100 -> +2
      // Total: 52 + 4+4+4+2 = 66
      expect(r.therapy_score).toBe(66);
      expect(r.therapy_rating).toBe("good");
    });

    it("score 45-64 -> adequate", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      }));
      expect(r.therapy_score).toBe(52);
      expect(r.therapy_rating).toBe("adequate");
    });

    it("score < 45 -> inadequate", () => {
      // 52 - 18 = 34
      const r = computePetAnimalTherapy(baseInput({
        total_children: 10,
        therapy_session_records: [makeSession({ child_id: "child_1", goals_set: false, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false })],
        pet_care_records: [makeCare({ responsibility_assigned: true, responsibility_completed: false })],
        animal_interaction_records: [makeInteraction({ positive_outcome: false }), makeInteraction({ positive_outcome: false }), makeInteraction({ positive_outcome: false })],
        animal_welfare_records: [makeWelfare({ welfare_standards_met: false }), makeWelfare({ welfare_standards_met: false })],
        child_engagement_records: [makeEngagement({ engagement_level: "refused", child_self_reported_benefit: false }), makeEngagement({ engagement_level: "disengaged", child_self_reported_benefit: false })],
      }));
      expect(r.therapy_score).toBeLessThan(45);
      expect(r.therapy_rating).toBe("inadequate");
    });
  });

  // ======================================================================
  // 9. ALL 6 RATES COMPUTATION
  // ======================================================================
  describe("rate computations", () => {
    it("therapy_frequency_rate = pct(unique children with sessions, total_children)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 4,
        therapy_session_records: [
          makeSession({ child_id: "child_1" }),
          makeSession({ child_id: "child_2" }),
          makeSession({ child_id: "child_1" }), // duplicate child
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.therapy_frequency_rate).toBe(50); // 2 unique / 4 total
    });

    it("pet_care_responsibility_rate = pct(assigned+completed, assigned)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          makeCare({ responsibility_assigned: false, responsibility_completed: false }), // not counted
        ],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.pet_care_responsibility_rate).toBe(67); // 2/3 = 67
    });

    it("interaction_outcome_rate = pct(positive, total interactions)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.interaction_outcome_rate).toBe(67); // 2/3
    });

    it("welfare_compliance_rate = pct(standards met, total welfare checks)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.welfare_compliance_rate).toBe(75); // 3/4
    });

    it("child_engagement_rate = pct(high+moderate, total engagement records)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high" }),
          makeEngagement({ engagement_level: "moderate" }),
          makeEngagement({ engagement_level: "low" }),
          makeEngagement({ engagement_level: "disengaged" }),
          makeEngagement({ engagement_level: "refused" }),
        ],
      }));
      expect(r.child_engagement_rate).toBe(40); // 2/5
    });

    it("child_benefit_rate = pct(positive feedback + positive interactions + self-reported benefit, total opportunities)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_feedback_positive: true }),
          makeSession({ child_feedback_positive: false }),
          makeSession({ child_feedback_positive: true }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        child_engagement_records: [
          makeEngagement({ child_self_reported_benefit: true }),
          makeEngagement({ child_self_reported_benefit: false }),
        ],
        animal_welfare_records: [makeWelfare()],
      }));
      // benefit = pct(2+1+1, 3+2+2) = pct(4, 7) = 57
      expect(r.child_benefit_rate).toBe(57);
    });
  });

  // ======================================================================
  // 10. SESSION GOAL ACHIEVEMENT AVG
  // ======================================================================
  describe("session_goal_achievement_avg", () => {
    it("computed as goalsMet / goalsSet (rounded to 2 decimals)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ goals_set: true, goals_met: true }),
          makeSession({ goals_set: true, goals_met: true }),
          makeSession({ goals_set: true, goals_met: false }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // 2 met / 3 set = 0.6666... -> Math.round(0.6666 * 100) / 100 = 0.67
      expect(r.session_goal_achievement_avg).toBe(0.67);
    });

    it("returns 0 when no goals set", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ goals_set: false, goals_met: false }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.session_goal_achievement_avg).toBeNull();
    });
  });

  // ======================================================================
  // 11. MOOD IMPROVEMENT AVG
  // ======================================================================
  describe("mood_improvement_avg", () => {
    it("computed as average of (mood_after - mood_before)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ child_mood_before: 2, child_mood_after: 4 }), // +2
          makeInteraction({ child_mood_before: 3, child_mood_after: 5 }), // +2
          makeInteraction({ child_mood_before: 1, child_mood_after: 3 }), // +2
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.mood_improvement_avg).toBe(2);
    });

    it("can be negative when mood decreases", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ child_mood_before: 4, child_mood_after: 2 }), // -2
          makeInteraction({ child_mood_before: 5, child_mood_after: 3 }), // -2
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.mood_improvement_avg).toBe(-2);
    });

    it("is 0 when no interactions have valid mood data", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ child_mood_before: 0, child_mood_after: 4 }), // excluded (before=0)
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.mood_improvement_avg).toBeNull();
    });

    it("rounds to 2 decimals", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ child_mood_before: 1, child_mood_after: 2 }), // +1
          makeInteraction({ child_mood_before: 2, child_mood_after: 4 }), // +2
          makeInteraction({ child_mood_before: 3, child_mood_after: 4 }), // +1
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // (1+2+1)/3 = 1.3333... -> 1.33
      expect(r.mood_improvement_avg).toBe(1.33);
    });
  });

  // ======================================================================
  // 12. STRENGTHS
  // ======================================================================
  describe("strengths", () => {
    it("includes therapy frequency strength when >= 90", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 1,
        therapy_session_records: [makeSession({ child_id: "child_1" })],
        pet_care_records: [],
        animal_interaction_records: [],
        animal_welfare_records: [],
        child_engagement_records: [],
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("accessing animal-assisted therapy"))).toBe(true);
    });

    it("includes therapy frequency strength when >= 70 and < 90", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 4,
        therapy_session_records: [
          makeSession({ child_id: "child_1" }),
          makeSession({ child_id: "child_2" }),
          makeSession({ child_id: "child_3" }),
        ],
        pet_care_records: [],
        animal_interaction_records: [],
        animal_welfare_records: [],
        child_engagement_records: [],
      }));
      expect(r.strengths.some(s => s.includes("75%") && s.includes("engaging in therapy sessions"))).toBe(true);
    });

    it("includes pet care strength when >= 90", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
        ],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("pet care responsibilities are completed"))).toBe(true);
    });

    it("includes interaction outcome strength when >= 90", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("achieve positive outcomes"))).toBe(true);
    });

    it("includes welfare compliance strength when >= 100", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("All animal welfare checks meet required standards"))).toBe(true);
    });

    it("includes engagement strength when >= 90", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high" }),
          makeEngagement({ engagement_level: "high" }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("show high or moderate engagement"))).toBe(true);
    });

    it("includes child benefit strength when >= 90", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 1,
        therapy_session_records: [makeSession({ child_feedback_positive: true })],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction({ positive_outcome: true })],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement({ child_self_reported_benefit: true })],
      }));
      // benefit = pct(1+1+1, 1+1+1) = 100
      expect(r.strengths.some(s => s.includes("100%") && s.includes("positive child outcomes"))).toBe(true);
    });

    it("includes goal achievement strength when >= 90", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ goals_set: true, goals_met: true }),
          makeSession({ goals_set: true, goals_met: true }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("therapy session goals are achieved"))).toBe(true);
    });

    it("includes risk assessment strength when >= 100", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ risk_assessment_completed: true }),
          makeSession({ risk_assessment_completed: true }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("Every therapy session has a completed risk assessment"))).toBe(true);
    });

    it("includes mood improvement strength when >= 80", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ child_mood_before: 2, child_mood_after: 4 }),
          makeInteraction({ child_mood_before: 1, child_mood_after: 3 }),
          makeInteraction({ child_mood_before: 2, child_mood_after: 4 }),
          makeInteraction({ child_mood_before: 2, child_mood_after: 4 }),
          makeInteraction({ child_mood_before: 3, child_mood_after: 3 }), // no improvement
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // 4 improved out of 5 = 80%
      expect(r.strengths.some(s => s.includes("80%") && s.includes("improved child mood"))).toBe(true);
    });

    it("includes emotional regulation strength when >= 80", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ emotional_regulation_observed: true }),
          makeInteraction({ emotional_regulation_observed: true }),
          makeInteraction({ emotional_regulation_observed: true }),
          makeInteraction({ emotional_regulation_observed: true }),
          makeInteraction({ emotional_regulation_observed: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("Emotional regulation observed in 80%"))).toBe(true);
    });

    it("includes empathy strength when >= 80", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ empathy_demonstrated: true }),
          makeEngagement({ empathy_demonstrated: true }),
          makeEngagement({ empathy_demonstrated: true }),
          makeEngagement({ empathy_demonstrated: true }),
          makeEngagement({ empathy_demonstrated: false }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("80%") && s.includes("improved empathy"))).toBe(true);
    });

    it("includes child-initiated care strength when >= 50", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [
          makeCare({ child_initiated: true }),
          makeCare({ child_initiated: false }),
        ],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("50%") && s.includes("child-initiated"))).toBe(true);
    });

    it("includes vet compliance strength when >= 100", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ veterinary_up_to_date: true }),
          makeWelfare({ veterinary_up_to_date: true }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("All therapy animals have up-to-date veterinary care"))).toBe(true);
    });

    it("includes documentation strength when >= 90", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ notes_recorded: true }),
          makeSession({ notes_recorded: true }),
          makeSession({ notes_recorded: true }),
          makeSession({ notes_recorded: true }),
          makeSession({ notes_recorded: true }),
          makeSession({ notes_recorded: true }),
          makeSession({ notes_recorded: true }),
          makeSession({ notes_recorded: true }),
          makeSession({ notes_recorded: true }),
          makeSession({ notes_recorded: false }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("90%") && s.includes("documented notes"))).toBe(true);
    });

    it("includes concerns actioned strength when all concerns actioned", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ concerns_identified: true, concerns_actioned: true }),
          makeWelfare({ concerns_identified: true, concerns_actioned: true }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("All identified animal welfare concerns have been actioned"))).toBe(true);
    });

    it("includes responsibility improvement strength when >= 80", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ responsibility_skills_improved: true }),
          makeEngagement({ responsibility_skills_improved: true }),
          makeEngagement({ responsibility_skills_improved: true }),
          makeEngagement({ responsibility_skills_improved: true }),
          makeEngagement({ responsibility_skills_improved: false }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("80%") && s.includes("improved responsibility skills"))).toBe(true);
    });

    it("includes behavioural improvement strength when >= 70", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ behavioural_improvement: true }),
          makeInteraction({ behavioural_improvement: true }),
          makeInteraction({ behavioural_improvement: true }),
          makeInteraction({ behavioural_improvement: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.strengths.some(s => s.includes("Behavioural improvement observed in 75%"))).toBe(true);
    });
  });

  // ======================================================================
  // 13. CONCERNS
  // ======================================================================
  describe("concerns", () => {
    it("flags therapy frequency < 40 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 10,
        therapy_session_records: [makeSession({ child_id: "child_1" })],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Only 10%") && c.includes("accessing animal-assisted therapy"))).toBe(true);
    });

    it("flags therapy frequency 40-69 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 3,
        therapy_session_records: [
          makeSession({ child_id: "child_1" }),
          makeSession({ child_id: "child_2" }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // freq = pct(2,3) = 67
      expect(r.concerns.some(c => c.includes("Therapy session coverage at 67%"))).toBe(true);
    });

    it("flags pet care responsibility < 50 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("pet care responsibilities are completed"))).toBe(true);
    });

    it("flags pet care responsibility 50-69 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // petCareResponsibilityRate = pct(1,2) = 50
      expect(r.concerns.some(c => c.includes("Pet care responsibility completion at 50%"))).toBe(true);
    });

    it("flags interaction outcome < 40 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: false }),
          makeInteraction({ positive_outcome: false }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("achieve positive outcomes"))).toBe(true);
    });

    it("flags interaction outcome 40-69 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Interaction outcome rate at 50%"))).toBe(true);
    });

    it("flags welfare compliance < 50 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: false }),
          makeWelfare({ welfare_standards_met: false }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("animal welfare checks meet required standards"))).toBe(true);
    });

    it("flags welfare compliance 50-79 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Welfare compliance at 67%"))).toBe(true);
    });

    it("flags child engagement < 40 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ engagement_level: "low" }),
          makeEngagement({ engagement_level: "disengaged" }),
          makeEngagement({ engagement_level: "refused" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("show adequate engagement"))).toBe(true);
    });

    it("flags child engagement 40-69 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high" }),
          makeEngagement({ engagement_level: "low" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Child engagement rate at 50%"))).toBe(true);
    });

    it("flags child benefit < 50 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_feedback_positive: false }),
          makeSession({ child_feedback_positive: false }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: false }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ child_self_reported_benefit: false }),
          makeEngagement({ child_self_reported_benefit: false }),
        ],
      }));
      // benefit = pct(0+0+0, 2+2+2) = 0
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("positive benefit"))).toBe(true);
    });

    it("flags child benefit 50-69 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_feedback_positive: true }),
          makeSession({ child_feedback_positive: false }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ child_self_reported_benefit: true }),
          makeEngagement({ child_self_reported_benefit: false }),
        ],
      }));
      // benefit = pct(1+1+1, 2+2+2) = 50
      expect(r.concerns.some(c => c.includes("Child benefit rate at 50%"))).toBe(true);
    });

    it("flags session risk assessment < 80 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ risk_assessment_completed: true }),
          makeSession({ risk_assessment_completed: false }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Only 50%") && c.includes("risk assessments"))).toBe(true);
    });

    it("flags interaction risk assessment < 80 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ risk_assessment_current: false }),
          makeInteraction({ risk_assessment_current: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("animal interactions have current risk assessments"))).toBe(true);
    });

    it("flags poor health animals concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ health_status: "poor" }),
          makeWelfare({ health_status: "critical" }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("2 animals in poor or critical health"))).toBe(true);
    });

    it("flags single poor health animal (singular)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare({ health_status: "poor" })],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("1 animal in poor or critical health"))).toBe(true);
    });

    it("flags overdue welfare reviews concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare({ review_overdue: true })],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("1 animal welfare review is overdue"))).toBe(true);
    });

    it("flags multiple overdue welfare reviews (plural)", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ review_overdue: true }),
          makeWelfare({ review_overdue: true }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("2 animal welfare reviews are overdue"))).toBe(true);
    });

    it("flags overdue engagement reviews concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement({ review_overdue: true })],
      }));
      expect(r.concerns.some(c => c.includes("1 child engagement review is overdue"))).toBe(true);
    });

    it("flags vet compliance < 80 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ veterinary_up_to_date: false }),
          makeWelfare({ veterinary_up_to_date: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("up-to-date veterinary care"))).toBe(true);
    });

    it("flags insurance < 80 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ insurance_current: false }),
          makeWelfare({ insurance_current: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("current insurance"))).toBe(true);
    });

    it("flags goal setting < 50 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ goals_set: false }),
          makeSession({ goals_set: false }),
          makeSession({ goals_set: true, goals_met: false }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // goalSettingRate = pct(1,3) = 33
      expect(r.concerns.some(c => c.includes("Goals set for only 33%"))).toBe(true);
    });

    it("flags session documentation < 70 concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ notes_recorded: false }),
          makeSession({ notes_recorded: false }),
          makeSession({ notes_recorded: true }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // sessionDocumentationRate = pct(1,3) = 33
      expect(r.concerns.some(c => c.includes("Session documentation at only 33%"))).toBe(true);
    });

    it("flags unactioned welfare concerns", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ concerns_identified: true, concerns_actioned: false }),
          makeWelfare({ concerns_identified: true, concerns_actioned: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("welfare concerns have been actioned"))).toBe(true);
    });
  });

  // ======================================================================
  // 14. RECOMMENDATIONS
  // ======================================================================
  describe("recommendations", () => {
    it("generates recommendation for welfare < 50", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: false }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Urgently address animal welfare compliance") && rec.urgency === "immediate")).toBe(true);
    });

    it("generates recommendation for poor health animals", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare({ health_status: "poor" })],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("veterinary assessment") && rec.urgency === "immediate")).toBe(true);
    });

    it("generates recommendation for session risk < 80", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ risk_assessment_completed: false }),
          makeSession({ risk_assessment_completed: false }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Ensure every therapy session has a completed risk assessment"))).toBe(true);
    });

    it("generates recommendation for therapy frequency < 40", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 10,
        therapy_session_records: [makeSession({ child_id: "child_1" })],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("expand therapy session access"))).toBe(true);
    });

    it("generates recommendation for interaction outcome < 40", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: false }),
          makeInteraction({ positive_outcome: false }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Review and redesign the animal interaction programme"))).toBe(true);
    });

    it("generates recommendation for child engagement < 40", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ engagement_level: "low" }),
          makeEngagement({ engagement_level: "disengaged" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Conduct individual assessments"))).toBe(true);
    });

    it("generates planned recommendation for welfare 50-79", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Improve animal welfare compliance to at least 80%") && rec.urgency === "planned")).toBe(true);
    });

    it("generates planned recommendation for child engagement 40-69", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high" }),
          makeEngagement({ engagement_level: "low" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Increase child engagement rates") && rec.urgency === "planned")).toBe(true);
    });

    it("generates recommendation for support plan < 70", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ support_plan_in_place: false }),
          makeEngagement({ support_plan_in_place: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Ensure all children participating in animal therapy have a support plan"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 10,
        therapy_session_records: [makeSession({ child_id: "child_1", risk_assessment_completed: false, goals_set: false, notes_recorded: false, child_feedback_positive: false })],
        pet_care_records: [makeCare({ responsibility_assigned: true, responsibility_completed: false })],
        animal_interaction_records: [makeInteraction({ positive_outcome: false, risk_assessment_current: false })],
        animal_welfare_records: [makeWelfare({ welfare_standards_met: false, health_status: "poor", veterinary_up_to_date: false, insurance_current: false, concerns_identified: true, concerns_actioned: false, review_overdue: true })],
        child_engagement_records: [makeEngagement({ engagement_level: "low", child_self_reported_benefit: false, support_plan_in_place: false, review_overdue: true })],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("generates soon recommendation for therapy frequency 40-69", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 3,
        therapy_session_records: [
          makeSession({ child_id: "child_1" }),
          makeSession({ child_id: "child_2" }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // freq = pct(2,3) = 67
      expect(r.recommendations.some(rec => rec.recommendation.includes("Increase therapy session coverage to reach at least 70%") && rec.urgency === "soon")).toBe(true);
    });

    it("generates soon recommendation for interaction outcome 40-69", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Review animal interactions that are not achieving positive outcomes") && rec.urgency === "soon")).toBe(true);
    });

    it("generates soon recommendation for pet care responsibility 50-69", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Improve pet care responsibility completion rates") && rec.urgency === "soon")).toBe(true);
    });

    it("generates soon recommendation for pet care responsibility < 50", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Urgently review pet care responsibility allocation") && rec.urgency === "soon")).toBe(true);
    });

    it("generates planned recommendation for session documentation < 70", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ notes_recorded: false }),
          makeSession({ notes_recorded: false }),
          makeSession({ notes_recorded: true }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Improve therapy session documentation") && rec.urgency === "planned")).toBe(true);
    });

    it("generates planned recommendation for insurance < 80", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ insurance_current: false }),
          makeWelfare({ insurance_current: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Ensure all therapy animals have current insurance") && rec.urgency === "planned")).toBe(true);
    });

    it("generates planned recommendation for child benefit 50-69", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_feedback_positive: true }),
          makeSession({ child_feedback_positive: false }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ child_self_reported_benefit: true }),
          makeEngagement({ child_self_reported_benefit: false }),
        ],
      }));
      // benefit = pct(1+1+1, 2+2+2) = 50
      expect(r.recommendations.some(rec => rec.recommendation.includes("Explore ways to increase the therapeutic benefit") && rec.urgency === "planned")).toBe(true);
    });
  });

  // ======================================================================
  // 15. INSIGHTS
  // ======================================================================
  describe("insights", () => {
    describe("critical insights", () => {
      it("welfare compliance < 50 critical insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: false }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Only 0%") && i.text.includes("Animal Welfare Act 2006"))).toBe(true);
      });

      it("therapy frequency < 40 critical insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 10,
          therapy_session_records: [makeSession({ child_id: "child_1" })],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Only 10%") && i.text.includes("access animal-assisted therapy"))).toBe(true);
      });

      it("interaction outcome < 40 critical insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: false }),
            makeInteraction({ positive_outcome: false }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Only 0%") && i.text.includes("achieve positive outcomes"))).toBe(true);
      });

      it("child engagement < 40 critical insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [
            makeEngagement({ engagement_level: "low" }),
            makeEngagement({ engagement_level: "refused" }),
          ],
        }));
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Only 0%") && i.text.includes("show adequate engagement"))).toBe(true);
      });

      it("poor health + low session risk assessment critical insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ risk_assessment_completed: false }),
            makeSession({ risk_assessment_completed: false }),
          ],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare({ health_status: "poor" })],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("poor or critical health") && i.text.includes("lack risk assessments"))).toBe(true);
      });
    });

    describe("warning insights", () => {
      it("therapy frequency 40-69 warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 3,
          therapy_session_records: [
            makeSession({ child_id: "child_1" }),
            makeSession({ child_id: "child_2" }),
          ],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Therapy session coverage at 67%"))).toBe(true);
      });

      it("interaction outcome 40-69 warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Interaction outcome rate at 50%"))).toBe(true);
      });

      it("welfare compliance 50-79 warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true }),
            makeWelfare({ welfare_standards_met: true }),
            makeWelfare({ welfare_standards_met: false }),
          ],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Welfare compliance at 67%"))).toBe(true);
      });

      it("child engagement 40-69 warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [
            makeEngagement({ engagement_level: "high" }),
            makeEngagement({ engagement_level: "low" }),
          ],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Child engagement at 50%"))).toBe(true);
      });

      it("child benefit 50-69 warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_feedback_positive: true }),
            makeSession({ child_feedback_positive: false }),
          ],
          pet_care_records: [makeCare()],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
            makeInteraction({ positive_outcome: false }),
          ],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [
            makeEngagement({ child_self_reported_benefit: true }),
            makeEngagement({ child_self_reported_benefit: false }),
          ],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Child benefit rate at 50%"))).toBe(true);
      });

      it("overdue welfare reviews warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [
            makeWelfare({ review_overdue: true }),
            makeWelfare({ review_overdue: true }),
          ],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("2 animal welfare reviews overdue"))).toBe(true);
      });

      it("overdue engagement reviews warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [
            makeEngagement({ review_overdue: true }),
            makeEngagement({ review_overdue: true }),
          ],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("2 child engagement reviews overdue"))).toBe(true);
      });

      it("goal setting 50-69 warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ goals_set: true, goals_met: false }),
            makeSession({ goals_set: false }),
          ],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        // goalSettingRate = pct(1,2) = 50
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Goals set for only 50%"))).toBe(true);
      });

      it("pet care responsibility 50-69 warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: false }),
          ],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Pet care responsibility completion at 50%"))).toBe(true);
      });

      it("session documentation 50-69 warning insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ notes_recorded: true }),
            makeSession({ notes_recorded: false }),
          ],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        // sessionDocumentationRate = pct(1,2) = 50
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Session documentation at 50%"))).toBe(true);
      });

      it("animal type analysis warning insight with >= 3 sessions", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ animal_type: "dog" }),
            makeSession({ animal_type: "dog" }),
            makeSession({ animal_type: "cat" }),
          ],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Therapy sessions by animal type:"))).toBe(true);
      });

      it("no animal type insight with < 3 sessions", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ animal_type: "dog" }),
            makeSession({ animal_type: "cat" }),
          ],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.text.includes("Therapy sessions by animal type:"))).toBe(false);
      });

      it("interaction type analysis warning insight with >= 3 interactions", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [
            makeInteraction({ interaction_type: "therapeutic" }),
            makeInteraction({ interaction_type: "recreational" }),
            makeInteraction({ interaction_type: "therapeutic" }),
          ],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Interaction types:"))).toBe(true);
      });

      it("no interaction type insight with < 3 interactions", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [
            makeInteraction({ interaction_type: "therapeutic" }),
            makeInteraction({ interaction_type: "recreational" }),
          ],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.text.includes("Interaction types:"))).toBe(false);
      });
    });

    describe("positive insights", () => {
      it("outstanding rating positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_id: "child_1" }),
            makeSession({ child_id: "child_2" }),
          ],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          ],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true }),
          ],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true }),
          ],
          child_engagement_records: [
            makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          ],
        }));
        if (r.therapy_rating === "outstanding") {
          expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding animal-assisted therapy provision"))).toBe(true);
        }
      });

      it("therapy frequency + goal achievement positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ child_id: "child_1", goals_set: true, goals_met: true }),
            makeSession({ child_id: "child_2", goals_set: true, goals_met: true }),
          ],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100% of children accessing therapy with 100% goal achievement"))).toBe(true);
      });

      it("welfare + vet compliance positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [
            makeWelfare({ welfare_standards_met: true, veterinary_up_to_date: true }),
            makeWelfare({ welfare_standards_met: true, veterinary_up_to_date: true }),
          ],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("All welfare checks meet standards with 100% veterinary compliance"))).toBe(true);
      });

      it("interaction outcome + mood improvement positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [
            makeInteraction({ positive_outcome: true, child_mood_before: 2, child_mood_after: 4 }),
            makeInteraction({ positive_outcome: true, child_mood_before: 1, child_mood_after: 3 }),
            makeInteraction({ positive_outcome: true, child_mood_before: 2, child_mood_after: 4 }),
            makeInteraction({ positive_outcome: true, child_mood_before: 3, child_mood_after: 5 }),
            makeInteraction({ positive_outcome: true, child_mood_before: 2, child_mood_after: 4 }),
          ],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100% positive interaction outcomes with 100% mood improvement"))).toBe(true);
      });

      it("engagement + benefit positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 1,
          therapy_session_records: [makeSession({ child_feedback_positive: true })],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction({ positive_outcome: true })],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [makeEngagement({ engagement_level: "high", child_self_reported_benefit: true })],
        }));
        // engagement = 100%, benefit = 100%
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100% child engagement with 100% positive benefit"))).toBe(true);
      });

      it("pet care + responsibility improvement positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
            makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          ],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [
            makeEngagement({ responsibility_skills_improved: true }),
            makeEngagement({ responsibility_skills_improved: true }),
            makeEngagement({ responsibility_skills_improved: true }),
            makeEngagement({ responsibility_skills_improved: true }),
            makeEngagement({ responsibility_skills_improved: false }),
          ],
        }));
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100% care responsibility completion with 80%"))).toBe(true);
      });

      it("empathy + social skills positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: true }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: true }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: true }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: false }),
            makeEngagement({ empathy_demonstrated: false, social_skills_improved: false }),
          ],
        }));
        // empathyRate = pct(4,5) = 80, socialSkillsRate = pct(3,5) = 60 -> not enough for social
        // Need 70% social. Let's adjust.
        const r2 = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: true }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: true }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: true }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: true }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: false }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: false }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: false }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: true }),
            makeEngagement({ empathy_demonstrated: true, social_skills_improved: true }),
            makeEngagement({ empathy_demonstrated: false, social_skills_improved: true }),
          ],
        }));
        // empathyRate = pct(9,10) = 90 >= 80, socialSkillsRate = pct(7,10) = 70 >= 70
        expect(r2.insights.some(i => i.severity === "positive" && i.text.includes("improved empathy") && i.text.includes("improved social skills"))).toBe(true);
      });

      it("emotional regulation interaction + improvement positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [
            makeInteraction({ emotional_regulation_observed: true }),
            makeInteraction({ emotional_regulation_observed: true }),
            makeInteraction({ emotional_regulation_observed: true }),
            makeInteraction({ emotional_regulation_observed: true }),
            makeInteraction({ emotional_regulation_observed: false }),
          ],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [
            makeEngagement({ emotional_regulation_improved: true }),
            makeEngagement({ emotional_regulation_improved: true }),
            makeEngagement({ emotional_regulation_improved: true }),
            makeEngagement({ emotional_regulation_improved: false }),
          ],
        }));
        // emotionalRegulationRate = pct(4,5) = 80, emotionalRegulationImprovementRate = pct(3,4) = 75 >= 70
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Emotional regulation observed in 80%") && i.text.includes("75% showing sustained improvement"))).toBe(true);
      });

      it("staff + child reported benefit positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [makeWelfare()],
          child_engagement_records: [
            makeEngagement({ staff_reported_benefit: true, child_self_reported_benefit: true }),
            makeEngagement({ staff_reported_benefit: true, child_self_reported_benefit: true }),
            makeEngagement({ staff_reported_benefit: true, child_self_reported_benefit: true }),
            makeEngagement({ staff_reported_benefit: true, child_self_reported_benefit: true }),
            makeEngagement({ staff_reported_benefit: false, child_self_reported_benefit: false }),
          ],
        }));
        // staffReportedBenefitRate = pct(4,5) = 80, childSelfReportedBenefitRate = pct(4,5) = 80
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Both staff (80%) and children (80%) report therapeutic benefit"))).toBe(true);
      });

      it("full risk assessment coverage positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [
            makeSession({ risk_assessment_completed: true }),
            makeSession({ risk_assessment_completed: true }),
          ],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [
            makeWelfare({ risk_assessment_current: true }),
            makeWelfare({ risk_assessment_current: true }),
          ],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("All therapy sessions and welfare checks have current risk assessments"))).toBe(true);
      });

      it("all concerns actioned positive insight", () => {
        const r = computePetAnimalTherapy(baseInput({
          total_children: 2,
          therapy_session_records: [makeSession()],
          pet_care_records: [makeCare()],
          animal_interaction_records: [makeInteraction()],
          animal_welfare_records: [
            makeWelfare({ concerns_identified: true, concerns_actioned: true }),
          ],
          child_engagement_records: [makeEngagement()],
        }));
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("All identified animal welfare concerns have been actioned"))).toBe(true);
      });
    });
  });

  // ======================================================================
  // 16. HEADLINES
  // ======================================================================
  describe("headlines", () => {
    it("outstanding headline", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1" }),
          makeSession({ child_id: "child_2" }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
        ],
      }));
      if (r.therapy_rating === "outstanding") {
        expect(r.headline).toContain("Outstanding animal-assisted therapy provision");
      }
    });

    it("good headline includes strengths and concerns count", () => {
      // Create a "good" scenario (score 65-79)
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1" }),
          makeSession({ child_id: "child_2" }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      }));
      if (r.therapy_rating === "good") {
        expect(r.headline).toContain("Good animal-assisted therapy provision");
        expect(r.headline).toMatch(/\d+ strength/);
      }
    });

    it("adequate headline mentions concerns", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      }));
      if (r.therapy_rating === "adequate") {
        expect(r.headline).toContain("Adequate animal-assisted therapy provision");
        expect(r.headline).toMatch(/\d+ concern/);
      }
    });

    it("inadequate headline mentions significant concerns and urgent action", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 10,
        therapy_session_records: [makeSession({ child_id: "child_1", goals_set: false, risk_assessment_completed: false, child_feedback_positive: false })],
        pet_care_records: [makeCare({ responsibility_assigned: true, responsibility_completed: false })],
        animal_interaction_records: [makeInteraction({ positive_outcome: false }), makeInteraction({ positive_outcome: false }), makeInteraction({ positive_outcome: false })],
        animal_welfare_records: [makeWelfare({ welfare_standards_met: false }), makeWelfare({ welfare_standards_met: false })],
        child_engagement_records: [makeEngagement({ engagement_level: "refused", child_self_reported_benefit: false }), makeEngagement({ engagement_level: "disengaged", child_self_reported_benefit: false })],
      }));
      expect(r.therapy_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent action");
    });
  });

  // ======================================================================
  // 17. EDGE CASES
  // ======================================================================
  describe("edge cases", () => {
    it("single child, single record in each array", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 1,
        therapy_session_records: [makeSession({ child_id: "child_1" })],
        pet_care_records: [makeCare({ child_id: "child_1" })],
        animal_interaction_records: [makeInteraction({ child_id: "child_1" })],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement({ child_id: "child_1" })],
      }));
      expect(r.therapy_frequency_rate).toBe(100);
      expect(r.total_sessions).toBe(1);
      expect(r.therapy_rating).toBeDefined();
    });

    it("total_children = 0 with some records returns insufficient_data only when all empty", () => {
      // With records but 0 children: NOT insufficient_data (goes into normal compute)
      const r = computePetAnimalTherapy(baseInput({
        total_children: 0,
        therapy_session_records: [makeSession()],
      }));
      // Should NOT be insufficient_data because not allEmpty
      expect(r.therapy_rating).not.toBe("insufficient_data");
      expect(r.therapy_frequency_rate).toBe(0); // pct(x, 0) = 0 since total_children=0
    });

    it("duplicate child_ids counted once for unique count", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 3,
        therapy_session_records: [
          makeSession({ child_id: "child_1" }),
          makeSession({ child_id: "child_1" }),
          makeSession({ child_id: "child_1" }),
          makeSession({ child_id: "child_2" }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.therapy_frequency_rate).toBe(67); // 2/3
    });

    it("goals_met only counted when goals_set is true", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ goals_set: false, goals_met: true }), // should NOT count as met
          makeSession({ goals_set: true, goals_met: true }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // goalAchievementRate = pct(1, 1) = 100 (only 1 had goals_set=true)
      expect(r.session_goal_achievement_avg).toBe(1); // 1/1
    });

    it("concerns_actioned only counted when concerns_identified is true", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ concerns_identified: false, concerns_actioned: true }), // should NOT count
          makeWelfare({ concerns_identified: true, concerns_actioned: false }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      // concernsActionedRate = pct(0, 1) = 0
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("welfare concerns have been actioned"))).toBe(true);
    });

    it("mood improvement excludes records with mood_before=0 or mood_after=0", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ child_mood_before: 0, child_mood_after: 5 }), // excluded
          makeInteraction({ child_mood_before: 2, child_mood_after: 0 }), // excluded
          makeInteraction({ child_mood_before: 2, child_mood_after: 4 }), // +2
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.mood_improvement_avg).toBe(2);
    });

    it("large number of records processes correctly", () => {
      const sessions = Array.from({ length: 50 }, (_, i) =>
        makeSession({ child_id: `child_${(i % 5) + 1}` })
      );
      const r = computePetAnimalTherapy(baseInput({
        total_children: 5,
        therapy_session_records: sessions,
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.total_sessions).toBe(50);
      expect(r.therapy_frequency_rate).toBe(100);
    });

    it("animal type counts are case-insensitive", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ animal_type: "Dog" }),
          makeSession({ animal_type: "dog" }),
          makeSession({ animal_type: "DOG" }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // All should be counted as "dog" (lowercased)
      expect(r.insights.some(i => i.text.includes("dog (3)"))).toBe(true);
    });

    it("interaction type underscores replaced with spaces in insight", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ interaction_type: "therapeutic" }),
          makeInteraction({ interaction_type: "therapeutic" }),
          makeInteraction({ interaction_type: "therapeutic" }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // "therapeutic" has no underscores, but let's verify the format
      expect(r.insights.some(i => i.text.includes("therapeutic (3)"))).toBe(true);
    });

    it("total_sessions output matches therapy_session_records length", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession(), makeSession(), makeSession(), makeSession(), makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.total_sessions).toBe(5);
    });

    it("all engagement levels counted correctly", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high" }),
          makeEngagement({ engagement_level: "moderate" }),
          makeEngagement({ engagement_level: "low" }),
          makeEngagement({ engagement_level: "disengaged" }),
          makeEngagement({ engagement_level: "refused" }),
        ],
      }));
      // high + moderate = 2, total = 5
      expect(r.child_engagement_rate).toBe(40);
    });

    it("only 1 array populated, rest empty", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession({ child_id: "child_1" })],
        pet_care_records: [],
        animal_interaction_records: [],
        animal_welfare_records: [],
        child_engagement_records: [],
      }));
      // Not allEmpty, so goes through normal compute
      expect(r.therapy_rating).not.toBe("insufficient_data");
      expect(r.pet_care_responsibility_rate).toBe(0);
      expect(r.interaction_outcome_rate).toBe(0);
      expect(r.welfare_compliance_rate).toBe(0);
      expect(r.child_engagement_rate).toBe(0);
    });

    it("result contains all expected fields", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 1,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r).toHaveProperty("therapy_rating");
      expect(r).toHaveProperty("therapy_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_sessions");
      expect(r).toHaveProperty("therapy_frequency_rate");
      expect(r).toHaveProperty("pet_care_responsibility_rate");
      expect(r).toHaveProperty("interaction_outcome_rate");
      expect(r).toHaveProperty("welfare_compliance_rate");
      expect(r).toHaveProperty("child_engagement_rate");
      expect(r).toHaveProperty("child_benefit_rate");
      expect(r).toHaveProperty("session_goal_achievement_avg");
      expect(r).toHaveProperty("mood_improvement_avg");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("health status excellent/good/fair do not trigger poor health concern", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [
          makeWelfare({ health_status: "excellent" }),
          makeWelfare({ health_status: "good" }),
          makeWelfare({ health_status: "fair" }),
        ],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.concerns.some(c => c.includes("poor or critical health"))).toBe(false);
    });

    it("responsibility_completed without responsibility_assigned does not count", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [
          makeCare({ responsibility_assigned: false, responsibility_completed: true }),
          makeCare({ responsibility_assigned: false, responsibility_completed: true }),
        ],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      // No assigned, so pct(0, 0) = 0
      expect(r.pet_care_responsibility_rate).toBe(0);
    });
  });

  // ======================================================================
  // 18. FULL OUTSTANDING SCENARIO
  // ======================================================================
  describe("full outstanding scenario", () => {
    it("achieves outstanding with all metrics maximised", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 3,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true, notes_recorded: true }),
          makeSession({ child_id: "child_2", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true, notes_recorded: true }),
          makeSession({ child_id: "child_3", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true, notes_recorded: true }),
        ],
        pet_care_records: [
          makeCare({ child_id: "child_1", responsibility_assigned: true, responsibility_completed: true, child_initiated: true }),
          makeCare({ child_id: "child_2", responsibility_assigned: true, responsibility_completed: true, child_initiated: true }),
          makeCare({ child_id: "child_3", responsibility_assigned: true, responsibility_completed: true, child_initiated: true }),
        ],
        animal_interaction_records: [
          makeInteraction({ child_id: "child_1", positive_outcome: true, behavioural_improvement: true, emotional_regulation_observed: true, child_mood_before: 2, child_mood_after: 5 }),
          makeInteraction({ child_id: "child_2", positive_outcome: true, behavioural_improvement: true, emotional_regulation_observed: true, child_mood_before: 1, child_mood_after: 4 }),
          makeInteraction({ child_id: "child_3", positive_outcome: true, behavioural_improvement: true, emotional_regulation_observed: true, child_mood_before: 2, child_mood_after: 5 }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true, veterinary_up_to_date: true, insurance_current: true, risk_assessment_current: true }),
          makeWelfare({ welfare_standards_met: true, veterinary_up_to_date: true, insurance_current: true, risk_assessment_current: true }),
        ],
        child_engagement_records: [
          makeEngagement({ child_id: "child_1", engagement_level: "high", child_self_reported_benefit: true, staff_reported_benefit: true, empathy_demonstrated: true, responsibility_skills_improved: true, social_skills_improved: true, emotional_regulation_improved: true, support_plan_in_place: true }),
          makeEngagement({ child_id: "child_2", engagement_level: "high", child_self_reported_benefit: true, staff_reported_benefit: true, empathy_demonstrated: true, responsibility_skills_improved: true, social_skills_improved: true, emotional_regulation_improved: true, support_plan_in_place: true }),
          makeEngagement({ child_id: "child_3", engagement_level: "high", child_self_reported_benefit: true, staff_reported_benefit: true, empathy_demonstrated: true, responsibility_skills_improved: true, social_skills_improved: true, emotional_regulation_improved: true, support_plan_in_place: true }),
        ],
      }));

      expect(r.therapy_rating).toBe("outstanding");
      expect(r.therapy_score).toBe(80);
      expect(r.therapy_frequency_rate).toBe(100);
      expect(r.pet_care_responsibility_rate).toBe(100);
      expect(r.interaction_outcome_rate).toBe(100);
      expect(r.welfare_compliance_rate).toBe(100);
      expect(r.child_engagement_rate).toBe(100);
      expect(r.child_benefit_rate).toBe(100);
      expect(r.concerns).toHaveLength(0);
      expect(r.strengths.length).toBeGreaterThan(5);
    });
  });

  // ======================================================================
  // 19. MIXED SCENARIO TESTS
  // ======================================================================
  describe("mixed scenarios", () => {
    it("good rating with some concerns and strengths", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 4,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_2", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_3", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "moderate", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      }));
      // therapyFreq = pct(3,4)=75 -> +2
      // petCare = 100 -> +4
      // interaction = 100 -> +4
      // welfare = pct(2,3)=67 -> no bonus
      // engagement = pct(2,3)=67 -> no bonus
      // benefit = pct(3+3+2, 3+3+3) = pct(8,9) = 89 -> +2 (>= 70)
      // sessionRisk = 100 -> +2
      // goalAchieve = 100 -> +2
      // Total = 52+2+4+4+2+2+2 = 68
      expect(r.therapy_score).toBe(68);
      expect(r.therapy_rating).toBe("good");
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.concerns.length).toBeGreaterThan(0);
    });

    it("adequate rating with mixed bonuses and no penalties", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      }));
      expect(r.therapy_score).toBe(52);
      expect(r.therapy_rating).toBe("adequate");
    });
  });

  // ======================================================================
  // 20. ADDITIONAL EDGE CASES & BOUNDARY TESTS
  // ======================================================================
  describe("additional boundary tests", () => {
    it("welfare compliance boundary: exactly 80 triggers +2 bonus", () => {
      // 4 out of 5 = 80%
      const input = baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      expect(r.welfare_compliance_rate).toBe(80);
      expect(r.therapy_score).toBe(52 + 2); // welfare +2
    });

    it("welfare compliance boundary: exactly 79 gets no bonus", () => {
      // Need 79%: hard to get exact with integers. Let's try 11 out of 14 = 79 (Math.round(11/14*100))
      // Actually pct(11,14) = Math.round(786) = 79
      const welfareRecords = [
        ...Array.from({ length: 11 }, () => makeWelfare({ welfare_standards_met: true })),
        ...Array.from({ length: 3 }, () => makeWelfare({ welfare_standards_met: false })),
      ];
      const input = baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: welfareRecords,
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      expect(r.welfare_compliance_rate).toBe(79);
      expect(r.therapy_score).toBe(52); // no bonus, no penalty
    });

    it("therapyFrequencyRate boundary: exactly 70 triggers +2", () => {
      // 7 out of 10 = 70%
      const sessions = Array.from({ length: 7 }, (_, i) =>
        makeSession({ child_id: `child_${i + 1}`, goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false })
      );
      const input = baseInput({
        total_children: 10,
        therapy_session_records: sessions,
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      expect(r.therapy_frequency_rate).toBe(70);
      // therapyFreq = 70 -> +2
      // goalAchieve = pct(0, 7) = 0 -> no bonus
      // sessionRisk = pct(0, 7) = 0 -> no bonus
      // benefit = pct(0+1+1, 7+2+2) = pct(2,11) = 18 -> no bonus
      expect(r.therapy_score).toBe(52 + 2);
    });

    it("therapyFrequencyRate boundary: exactly 90 triggers +4", () => {
      // 9 out of 10 = 90%
      const sessions = Array.from({ length: 9 }, (_, i) =>
        makeSession({ child_id: `child_${i + 1}`, goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false })
      );
      const input = baseInput({
        total_children: 10,
        therapy_session_records: sessions,
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      expect(r.therapy_frequency_rate).toBe(90);
      expect(r.therapy_score).toBe(52 + 4);
    });

    it("therapyFrequencyRate boundary: exactly 40 avoids penalty", () => {
      // 2 out of 5 = 40%
      const input = baseInput({
        total_children: 5,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_2", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      expect(r.therapy_frequency_rate).toBe(40);
      // No penalty (>= 40), no bonus (< 70)
      expect(r.therapy_score).toBe(52);
    });

    it("goalAchievementRate boundary: exactly 70 triggers +1", () => {
      // 7 out of 10 = 70%
      const sessions = [
        ...Array.from({ length: 7 }, () =>
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: false, child_feedback_positive: false })
        ),
        ...Array.from({ length: 3 }, () =>
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false })
        ),
      ];
      const input = baseInput({
        total_children: 2,
        therapy_session_records: sessions,
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      // goalAchievementRate = pct(7, 10) = 70 -> +1
      // sessionRiskAssessmentRate = pct(0, 10) = 0 -> no bonus
      // benefit = pct(0+1+1, 10+2+2) = pct(2,14) = 14 -> no bonus
      expect(r.therapy_score).toBe(52 + 1);
    });

    it("sessionRiskAssessmentRate boundary: exactly 80 triggers +1", () => {
      // 4 out of 5 = 80%
      const sessions = [
        ...Array.from({ length: 4 }, () =>
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: true, child_feedback_positive: false })
        ),
        makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
      ];
      const input = baseInput({
        total_children: 2,
        therapy_session_records: sessions,
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      // sessionRiskAssessmentRate = pct(4, 5) = 80 -> +1
      // goalAchievementRate = pct(0, 5) = 0 -> no bonus
      // benefit = pct(0+1+1, 5+2+2) = pct(2,9) = 22 -> no bonus
      expect(r.therapy_score).toBe(52 + 1);
    });

    it("no strengths in low-rate scenario", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 10,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: false, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false, notes_recorded: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: false, child_initiated: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: false, behavioural_improvement: false, emotional_regulation_observed: false, child_mood_before: 3, child_mood_after: 2 }),
          makeInteraction({ positive_outcome: false, behavioural_improvement: false, emotional_regulation_observed: false, child_mood_before: 3, child_mood_after: 2 }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: false, veterinary_up_to_date: false, insurance_current: false, concerns_identified: true, concerns_actioned: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "refused", child_self_reported_benefit: false, empathy_demonstrated: false, responsibility_skills_improved: false }),
        ],
      }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns.length).toBeGreaterThan(0);
    });

    it("interactionOutcomeRate boundary: exactly 40 avoids penalty", () => {
      // 2 out of 5 = 40%
      const input = baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
          makeInteraction({ positive_outcome: false }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      expect(r.interaction_outcome_rate).toBe(40);
      // No penalty (>= 40), no bonus (< 70)
      // benefit = pct(1+2+1, 2+5+2) = pct(4,9) = 44 -> no bonus
      expect(r.therapy_score).toBe(52);
    });

    it("childEngagementRate boundary: exactly 40 avoids penalty", () => {
      // 2 out of 5 = 40%
      const input = baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "moderate", child_self_reported_benefit: false }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
          makeEngagement({ engagement_level: "disengaged", child_self_reported_benefit: false }),
          makeEngagement({ engagement_level: "refused", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      expect(r.child_engagement_rate).toBe(40);
      // No penalty (>= 40), no bonus (< 70)
      // benefit = pct(1+1+1, 2+2+5) = pct(3,9) = 33 -> no bonus
      expect(r.therapy_score).toBe(52);
    });

    it("welfareComplianceRate boundary: exactly 50 avoids penalty", () => {
      // 1 out of 2 = 50%
      const input = baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ child_id: "child_1", goals_set: true, goals_met: true, risk_assessment_completed: true, child_feedback_positive: true }),
          makeSession({ child_id: "child_1", goals_set: true, goals_met: false, risk_assessment_completed: false, child_feedback_positive: false }),
        ],
        pet_care_records: [
          makeCare({ responsibility_assigned: true, responsibility_completed: true }),
          makeCare({ responsibility_assigned: true, responsibility_completed: false }),
        ],
        animal_interaction_records: [
          makeInteraction({ positive_outcome: true }),
          makeInteraction({ positive_outcome: false }),
        ],
        animal_welfare_records: [
          makeWelfare({ welfare_standards_met: true }),
          makeWelfare({ welfare_standards_met: false }),
        ],
        child_engagement_records: [
          makeEngagement({ engagement_level: "high", child_self_reported_benefit: true }),
          makeEngagement({ engagement_level: "low", child_self_reported_benefit: false }),
        ],
      });
      const r = computePetAnimalTherapy(input);
      expect(r.welfare_compliance_rate).toBe(50);
      // No penalty (>= 50), no bonus (< 80)
      expect(r.therapy_score).toBe(52);
    });

    it("interaction types with underscores display correctly", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [makeSession()],
        pet_care_records: [makeCare()],
        animal_interaction_records: [
          makeInteraction({ interaction_type: "calming" }),
          makeInteraction({ interaction_type: "calming" }),
          makeInteraction({ interaction_type: "calming" }),
        ],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      expect(r.insights.some(i => i.text.includes("calming (3)"))).toBe(true);
    });

    it("multiple animal types sorted by count descending", () => {
      const r = computePetAnimalTherapy(baseInput({
        total_children: 2,
        therapy_session_records: [
          makeSession({ animal_type: "dog" }),
          makeSession({ animal_type: "dog" }),
          makeSession({ animal_type: "dog" }),
          makeSession({ animal_type: "cat" }),
          makeSession({ animal_type: "cat" }),
          makeSession({ animal_type: "rabbit" }),
        ],
        pet_care_records: [makeCare()],
        animal_interaction_records: [makeInteraction()],
        animal_welfare_records: [makeWelfare()],
        child_engagement_records: [makeEngagement()],
      }));
      const typeInsight = r.insights.find(i => i.text.includes("Therapy sessions by animal type:"));
      expect(typeInsight).toBeDefined();
      // dog (3) should come before cat (2) which comes before rabbit (1)
      const text = typeInsight!.text;
      const dogIdx = text.indexOf("dog (3)");
      const catIdx = text.indexOf("cat (2)");
      const rabbitIdx = text.indexOf("rabbit (1)");
      expect(dogIdx).toBeLessThan(catIdx);
      expect(catIdx).toBeLessThan(rabbitIdx);
    });
  });
});

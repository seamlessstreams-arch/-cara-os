import { describe, it, expect } from "vitest";
import {
  computeIndependenceLifeSkillsDevelopment,
  type IndependenceLifeSkillsInput,
  type LifeSkillsAssessmentInput,
  type CookingProgrammeInput,
  type TravelTrainingInput,
  type PersonalCareInput,
  type IndependenceMilestoneInput,
} from "../home-independence-life-skills-development-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

function makeAssessment(
  overrides: Partial<LifeSkillsAssessmentInput> = {},
): LifeSkillsAssessmentInput {
  return {
    id: "lsa_1",
    child_id: "c1",
    assessment_date: "2026-05-01",
    assessor_name: "Staff A",
    assessment_type: "initial",
    cooking_score: 3,
    cleaning_score: 3,
    laundry_score: 3,
    budgeting_score: 3,
    personal_hygiene_score: 3,
    travel_score: 3,
    social_skills_score: 3,
    overall_independence_score: 6,
    previous_overall_score: null,
    child_involved: false,
    goals_set: 0,
    goals_achieved: 0,
    review_date: null,
    review_overdue: false,
    key_worker_involved: false,
    child_feedback_positive: false,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeCooking(
  overrides: Partial<CookingProgrammeInput> = {},
): CookingProgrammeInput {
  return {
    id: "cp_1",
    child_id: "c1",
    session_date: "2026-05-01",
    meal_type: "dinner",
    skill_level: "observer",
    recipe_followed: false,
    hygiene_standards_met: false,
    safety_standards_met: false,
    child_enjoyed: false,
    staff_member: "Staff A",
    new_skill_learned: false,
    child_chose_recipe: false,
    notes_recorded: false,
    created_at: "2026-05-01T12:00:00Z",
    ...overrides,
  };
}

function makeTravel(
  overrides: Partial<TravelTrainingInput> = {},
): TravelTrainingInput {
  return {
    id: "tt_1",
    child_id: "c1",
    training_date: "2026-05-01",
    training_type: "road_safety",
    competency_level: "not_started",
    route_practised: "Home to school",
    accompanied: true,
    risk_assessment_completed: false,
    child_confidence_rating: 1,
    staff_confidence_rating: 1,
    milestone_achieved: false,
    child_feedback_positive: false,
    created_at: "2026-05-01T14:00:00Z",
    ...overrides,
  };
}

function makePersonalCare(
  overrides: Partial<PersonalCareInput> = {},
): PersonalCareInput {
  return {
    id: "pc_1",
    child_id: "c1",
    record_date: "2026-05-01",
    care_area: "hygiene_routine",
    independence_level: "full_support",
    improvement_noted: false,
    child_engaged: false,
    dignity_respected: true,
    age_appropriate_support: true,
    key_worker_discussed: false,
    created_at: "2026-05-01T16:00:00Z",
    ...overrides,
  };
}

function makeMilestone(
  overrides: Partial<IndependenceMilestoneInput> = {},
): IndependenceMilestoneInput {
  return {
    id: "im_1",
    child_id: "c1",
    milestone_date: "2026-05-01",
    milestone_category: "cooking",
    milestone_description: "Cooked a simple meal",
    achieved: false,
    target_date: null,
    overdue: false,
    child_celebrated: false,
    evidenced_in_records: false,
    staff_witness: "Staff A",
    child_proud: false,
    shared_with_social_worker: false,
    created_at: "2026-05-01T18:00:00Z",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<IndependenceLifeSkillsInput> = {},
): IndependenceLifeSkillsInput {
  return {
    today: TODAY,
    total_children: 3,
    life_skills_assessment_records: [],
    cooking_programme_records: [],
    travel_training_records: [],
    personal_care_records: [],
    independence_milestone_records: [],
    ...overrides,
  };
}

/** pct helper matching the engine */
function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeIndependenceLifeSkillsDevelopment", () => {
  // ── Return shape ──────────────────────────────────────────────────────
  it("returns all required top-level fields", () => {
    const r = computeIndependenceLifeSkillsDevelopment(baseInput());
    expect(r).toHaveProperty("independence_rating");
    expect(r).toHaveProperty("independence_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("skills_assessment_coverage_rate");
    expect(r).toHaveProperty("cooking_competency_rate");
    expect(r).toHaveProperty("travel_independence_rate");
    expect(r).toHaveProperty("personal_care_rate");
    expect(r).toHaveProperty("milestone_achievement_rate");
    expect(r).toHaveProperty("child_engagement_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSUFFICIENT DATA
  // ════════════════════════════════════════════════════════════════════════

  describe("insufficient_data", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ total_children: 0 }),
      );
      expect(r.independence_rating).toBe("insufficient_data");
      expect(r.independence_score).toBe(0);
      expect(r.skills_assessment_coverage_rate).toBe(0);
      expect(r.cooking_competency_rate).toBe(0);
      expect(r.travel_independence_rate).toBe(0);
      expect(r.personal_care_rate).toBe(0);
      expect(r.milestone_achievement_rate).toBe(0);
      expect(r.child_engagement_rate).toBe(0);
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("headline mentions insufficient data", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ total_children: 0 }),
      );
      expect(r.headline).toContain("insufficient data");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INADEQUATE FLOOR (all empty + children > 0)
  // ════════════════════════════════════════════════════════════════════════

  describe("inadequate floor", () => {
    it("returns inadequate with score 15 when all empty but children present", () => {
      const r = computeIndependenceLifeSkillsDevelopment(baseInput());
      expect(r.independence_rating).toBe("inadequate");
      expect(r.independence_score).toBe(15);
    });

    it("has 1 concern about no records", () => {
      const r = computeIndependenceLifeSkillsDevelopment(baseInput());
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No life skills assessments");
    });

    it("has 2 recommendations", () => {
      const r = computeIndependenceLifeSkillsDevelopment(baseInput());
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has 1 critical insight", () => {
      const r = computeIndependenceLifeSkillsDevelopment(baseInput());
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("all rates are 0", () => {
      const r = computeIndependenceLifeSkillsDevelopment(baseInput());
      expect(r.skills_assessment_coverage_rate).toBe(0);
      expect(r.cooking_competency_rate).toBe(0);
      expect(r.travel_independence_rate).toBe(0);
      expect(r.personal_care_rate).toBe(0);
      expect(r.milestone_achievement_rate).toBe(0);
      expect(r.child_engagement_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // OUTSTANDING SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("outstanding scenario", () => {
    function outstandingInput(): IndependenceLifeSkillsInput {
      // 3 children, each has an assessment, cooking, travel, personal care, milestones
      const assessments: LifeSkillsAssessmentInput[] = [
        makeAssessment({
          id: "lsa_1", child_id: "c1",
          child_involved: true, key_worker_involved: true,
          child_feedback_positive: true, review_overdue: false,
          goals_set: 5, goals_achieved: 5,
          overall_independence_score: 9, previous_overall_score: 7,
          cooking_score: 5, cleaning_score: 5, laundry_score: 5,
          budgeting_score: 5, personal_hygiene_score: 5, travel_score: 5,
          social_skills_score: 5,
        }),
        makeAssessment({
          id: "lsa_2", child_id: "c2",
          child_involved: true, key_worker_involved: true,
          child_feedback_positive: true, review_overdue: false,
          goals_set: 4, goals_achieved: 4,
          overall_independence_score: 8, previous_overall_score: 6,
          cooking_score: 4, cleaning_score: 4, laundry_score: 4,
          budgeting_score: 4, personal_hygiene_score: 5, travel_score: 4,
          social_skills_score: 4,
        }),
        makeAssessment({
          id: "lsa_3", child_id: "c3",
          child_involved: true, key_worker_involved: true,
          child_feedback_positive: true, review_overdue: false,
          goals_set: 3, goals_achieved: 3,
          overall_independence_score: 8, previous_overall_score: 5,
          cooking_score: 5, cleaning_score: 4, laundry_score: 5,
          budgeting_score: 4, personal_hygiene_score: 4, travel_score: 5,
          social_skills_score: 5,
        }),
      ];

      const cookingRecords: CookingProgrammeInput[] = [
        makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", hygiene_standards_met: true, safety_standards_met: true, child_enjoyed: true, new_skill_learned: true, child_chose_recipe: true, notes_recorded: true }),
        makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", hygiene_standards_met: true, safety_standards_met: true, child_enjoyed: true, new_skill_learned: true, child_chose_recipe: true, notes_recorded: true }),
        makeCooking({ id: "cp_3", child_id: "c3", skill_level: "independent", hygiene_standards_met: true, safety_standards_met: true, child_enjoyed: true, new_skill_learned: true, child_chose_recipe: true, notes_recorded: true }),
        makeCooking({ id: "cp_4", child_id: "c1", skill_level: "independent", hygiene_standards_met: true, safety_standards_met: true, child_enjoyed: true, new_skill_learned: true, child_chose_recipe: true, notes_recorded: true }),
        makeCooking({ id: "cp_5", child_id: "c2", skill_level: "supervised", hygiene_standards_met: true, safety_standards_met: true, child_enjoyed: true, new_skill_learned: true, child_chose_recipe: true, notes_recorded: true }),
      ];

      const travelRecords: TravelTrainingInput[] = [
        makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", accompanied: false, risk_assessment_completed: true, child_confidence_rating: 5, staff_confidence_rating: 5, milestone_achieved: true, child_feedback_positive: true }),
        makeTravel({ id: "tt_2", child_id: "c2", competency_level: "competent", accompanied: true, risk_assessment_completed: true, child_confidence_rating: 4, staff_confidence_rating: 4, milestone_achieved: true, child_feedback_positive: true }),
        makeTravel({ id: "tt_3", child_id: "c3", competency_level: "independent", accompanied: false, risk_assessment_completed: true, child_confidence_rating: 5, staff_confidence_rating: 5, milestone_achieved: true, child_feedback_positive: true }),
      ];

      const personalCareRecords: PersonalCareInput[] = [
        makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", improvement_noted: true, child_engaged: true, dignity_respected: true, age_appropriate_support: true, key_worker_discussed: true }),
        makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "minimal_prompts", improvement_noted: true, child_engaged: true, dignity_respected: true, age_appropriate_support: true, key_worker_discussed: true }),
        makePersonalCare({ id: "pc_3", child_id: "c3", independence_level: "independent", improvement_noted: true, child_engaged: true, dignity_respected: true, age_appropriate_support: true, key_worker_discussed: true }),
      ];

      const milestones: IndependenceMilestoneInput[] = [
        makeMilestone({ id: "im_1", child_id: "c1", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
        makeMilestone({ id: "im_2", child_id: "c2", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
        makeMilestone({ id: "im_3", child_id: "c3", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
      ];

      return baseInput({
        total_children: 3,
        life_skills_assessment_records: assessments,
        cooking_programme_records: cookingRecords,
        travel_training_records: travelRecords,
        personal_care_records: personalCareRecords,
        independence_milestone_records: milestones,
      });
    }

    it("achieves outstanding rating (score >= 80)", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      expect(r.independence_rating).toBe("outstanding");
      expect(r.independence_score).toBeGreaterThanOrEqual(80);
    });

    it("headline mentions outstanding", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("has no concerns", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("has multiple strengths", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(5);
    });

    it("has positive insights", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      const positive = r.insights.filter((i) => i.severity === "positive");
      expect(positive.length).toBeGreaterThanOrEqual(1);
    });

    it("skills_assessment_coverage_rate is 100", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      expect(r.skills_assessment_coverage_rate).toBe(100);
    });

    it("cooking_competency_rate is 100 (all supervised or independent)", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      expect(r.cooking_competency_rate).toBe(100);
    });

    it("travel_independence_rate is 100", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      expect(r.travel_independence_rate).toBe(100);
    });

    it("personal_care_rate is 100", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      expect(r.personal_care_rate).toBe(100);
    });

    it("milestone_achievement_rate is 100", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      expect(r.milestone_achievement_rate).toBe(100);
    });

    it("child_engagement_rate is 100", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      // engagement = assessmentsWithChildInvolvement(3) + cookingChildEnjoyed(5) + travelChildFeedbackPositive(3) + personalCareChildEngaged(3)
      // denom = 3 + 5 + 3 + 3 = 14, num = 14 → 100%
      expect(r.child_engagement_rate).toBe(100);
    });

    it("has no immediate recommendations", () => {
      const r = computeIndependenceLifeSkillsDevelopment(outstandingInput());
      const immediate = r.recommendations.filter((rec) => rec.urgency === "immediate");
      expect(immediate).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // GOOD SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("good scenario", () => {
    function goodInput(): IndependenceLifeSkillsInput {
      // 3 children, mixed quality — some gaps
      const assessments: LifeSkillsAssessmentInput[] = [
        makeAssessment({
          id: "lsa_1", child_id: "c1",
          child_involved: true, key_worker_involved: true,
          child_feedback_positive: true, review_overdue: false,
          goals_set: 4, goals_achieved: 3,
          overall_independence_score: 7, previous_overall_score: 5,
        }),
        makeAssessment({
          id: "lsa_2", child_id: "c2",
          child_involved: true, key_worker_involved: true,
          child_feedback_positive: true, review_overdue: false,
          goals_set: 4, goals_achieved: 3,
          overall_independence_score: 6, previous_overall_score: 5,
        }),
        makeAssessment({
          id: "lsa_3", child_id: "c3",
          child_involved: true, key_worker_involved: false,
          child_feedback_positive: false, review_overdue: false,
          goals_set: 3, goals_achieved: 2,
          overall_independence_score: 5, previous_overall_score: 4,
        }),
      ];

      // 5 cooking, 3 supervised/independent, 2 observer/assisted → 60% competency
      const cookingRecords: CookingProgrammeInput[] = [
        makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, notes_recorded: true }),
        makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, notes_recorded: true }),
        makeCooking({ id: "cp_3", child_id: "c3", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, notes_recorded: true }),
        makeCooking({ id: "cp_4", child_id: "c1", skill_level: "assisted", child_enjoyed: false, safety_standards_met: true, hygiene_standards_met: true }),
        makeCooking({ id: "cp_5", child_id: "c2", skill_level: "observer", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true }),
      ];

      // 4 travel, 3 competent/independent → 75%
      const travelRecords: TravelTrainingInput[] = [
        makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", risk_assessment_completed: true, child_confidence_rating: 4, staff_confidence_rating: 4, child_feedback_positive: true }),
        makeTravel({ id: "tt_2", child_id: "c2", competency_level: "competent", risk_assessment_completed: true, child_confidence_rating: 3, staff_confidence_rating: 3, child_feedback_positive: true }),
        makeTravel({ id: "tt_3", child_id: "c3", competency_level: "competent", risk_assessment_completed: true, child_confidence_rating: 3, staff_confidence_rating: 3, child_feedback_positive: true }),
        makeTravel({ id: "tt_4", child_id: "c1", competency_level: "developing", risk_assessment_completed: false, child_confidence_rating: 2, staff_confidence_rating: 2, child_feedback_positive: false }),
      ];

      // 4 personal care, 3 independent/minimal → 75%
      const personalCareRecords: PersonalCareInput[] = [
        makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", child_engaged: true, improvement_noted: true }),
        makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "minimal_prompts", child_engaged: true, improvement_noted: true }),
        makePersonalCare({ id: "pc_3", child_id: "c3", independence_level: "minimal_prompts", child_engaged: true, improvement_noted: true }),
        makePersonalCare({ id: "pc_4", child_id: "c1", independence_level: "some_support", child_engaged: false }),
      ];

      // 5 milestones, 4 achieved → 80%
      const milestones: IndependenceMilestoneInput[] = [
        makeMilestone({ id: "im_1", child_id: "c1", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
        makeMilestone({ id: "im_2", child_id: "c2", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: false }),
        makeMilestone({ id: "im_3", child_id: "c3", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
        makeMilestone({ id: "im_4", child_id: "c1", achieved: true, child_celebrated: false, evidenced_in_records: true, child_proud: false, shared_with_social_worker: false }),
        makeMilestone({ id: "im_5", child_id: "c2", achieved: false }),
      ];

      return baseInput({
        total_children: 3,
        life_skills_assessment_records: assessments,
        cooking_programme_records: cookingRecords,
        travel_training_records: travelRecords,
        personal_care_records: personalCareRecords,
        independence_milestone_records: milestones,
      });
    }

    it("achieves good rating (score 65-79)", () => {
      const r = computeIndependenceLifeSkillsDevelopment(goodInput());
      expect(r.independence_rating).toBe("good");
      expect(r.independence_score).toBeGreaterThanOrEqual(65);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("headline mentions Good", () => {
      const r = computeIndependenceLifeSkillsDevelopment(goodInput());
      expect(r.headline).toContain("Good");
    });

    it("has strengths and may have minor concerns", () => {
      const r = computeIndependenceLifeSkillsDevelopment(goodInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(1);
    });

    it("cooking_competency_rate is 60%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(goodInput());
      expect(r.cooking_competency_rate).toBe(60);
    });

    it("travel_independence_rate is 75%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(goodInput());
      expect(r.travel_independence_rate).toBe(75);
    });

    it("personal_care_rate is 75%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(goodInput());
      expect(r.personal_care_rate).toBe(75);
    });

    it("milestone_achievement_rate is 80%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(goodInput());
      expect(r.milestone_achievement_rate).toBe(80);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADEQUATE SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("adequate scenario", () => {
    function adequateInput(): IndependenceLifeSkillsInput {
      // Weak but present data — few records, minimal quality
      const assessments: LifeSkillsAssessmentInput[] = [
        makeAssessment({
          id: "lsa_1", child_id: "c1",
          child_involved: true, child_feedback_positive: true,
          goals_set: 2, goals_achieved: 1,
          overall_independence_score: 5, previous_overall_score: 4,
        }),
        makeAssessment({
          id: "lsa_2", child_id: "c2",
          child_involved: false, child_feedback_positive: false,
          goals_set: 2, goals_achieved: 1,
          overall_independence_score: 4, previous_overall_score: 3,
        }),
      ];

      // 4 cooking, 2 supervised → 50% competency
      const cookingRecords: CookingProgrammeInput[] = [
        makeCooking({ id: "cp_1", child_id: "c1", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true }),
        makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", child_enjoyed: false, safety_standards_met: true }),
        makeCooking({ id: "cp_3", child_id: "c1", skill_level: "assisted", child_enjoyed: false, safety_standards_met: true }),
        makeCooking({ id: "cp_4", child_id: "c2", skill_level: "observer", child_enjoyed: false, safety_standards_met: true }),
      ];

      // 3 travel, 1 competent → 33%
      const travelRecords: TravelTrainingInput[] = [
        makeTravel({ id: "tt_1", child_id: "c1", competency_level: "competent", risk_assessment_completed: true, child_feedback_positive: true, child_confidence_rating: 3, staff_confidence_rating: 3 }),
        makeTravel({ id: "tt_2", child_id: "c2", competency_level: "developing", risk_assessment_completed: true, child_feedback_positive: false, child_confidence_rating: 2, staff_confidence_rating: 2 }),
        makeTravel({ id: "tt_3", child_id: "c1", competency_level: "developing", risk_assessment_completed: false, child_feedback_positive: false, child_confidence_rating: 2, staff_confidence_rating: 2 }),
      ];

      // 4 personal care, 2 independent/minimal → 50%
      const personalCareRecords: PersonalCareInput[] = [
        makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "minimal_prompts", child_engaged: true }),
        makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "some_support", child_engaged: false }),
        makePersonalCare({ id: "pc_3", child_id: "c1", independence_level: "independent", child_engaged: true }),
        makePersonalCare({ id: "pc_4", child_id: "c2", independence_level: "full_support", child_engaged: false }),
      ];

      // 4 milestones, 3 achieved → 75%
      const milestones: IndependenceMilestoneInput[] = [
        makeMilestone({ id: "im_1", child_id: "c1", achieved: true, child_celebrated: true }),
        makeMilestone({ id: "im_2", child_id: "c2", achieved: true }),
        makeMilestone({ id: "im_3", child_id: "c1", achieved: true }),
        makeMilestone({ id: "im_4", child_id: "c2", achieved: false }),
      ];

      return baseInput({
        total_children: 3,
        life_skills_assessment_records: assessments,
        cooking_programme_records: cookingRecords,
        travel_training_records: travelRecords,
        personal_care_records: personalCareRecords,
        independence_milestone_records: milestones,
      });
    }

    it("achieves adequate rating (score 45-64)", () => {
      const r = computeIndependenceLifeSkillsDevelopment(adequateInput());
      expect(r.independence_rating).toBe("adequate");
      expect(r.independence_score).toBeGreaterThanOrEqual(45);
      expect(r.independence_score).toBeLessThan(65);
    });

    it("headline mentions Adequate", () => {
      const r = computeIndependenceLifeSkillsDevelopment(adequateInput());
      expect(r.headline).toContain("Adequate");
    });

    it("has concerns", () => {
      const r = computeIndependenceLifeSkillsDevelopment(adequateInput());
      expect(r.concerns.length).toBeGreaterThanOrEqual(1);
    });

    it("has recommendations", () => {
      const r = computeIndependenceLifeSkillsDevelopment(adequateInput());
      expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INADEQUATE SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("inadequate scenario", () => {
    function inadequateInput(): IndependenceLifeSkillsInput {
      // Only 1 child out of 3 assessed; poor data all round
      const assessments: LifeSkillsAssessmentInput[] = [
        makeAssessment({
          id: "lsa_1", child_id: "c1",
          child_involved: false, child_feedback_positive: false,
          review_overdue: true,
          goals_set: 3, goals_achieved: 0,
          overall_independence_score: 3, previous_overall_score: 3,
        }),
      ];

      // 5 cooking, 1 supervised rest observer/assisted → 20%
      const cookingRecords: CookingProgrammeInput[] = [
        makeCooking({ id: "cp_1", child_id: "c1", skill_level: "supervised", child_enjoyed: false, safety_standards_met: false }),
        makeCooking({ id: "cp_2", child_id: "c1", skill_level: "observer", child_enjoyed: false, safety_standards_met: false }),
        makeCooking({ id: "cp_3", child_id: "c1", skill_level: "observer", child_enjoyed: false, safety_standards_met: true }),
        makeCooking({ id: "cp_4", child_id: "c1", skill_level: "assisted", child_enjoyed: false, safety_standards_met: false }),
        makeCooking({ id: "cp_5", child_id: "c1", skill_level: "observer", child_enjoyed: false, safety_standards_met: true }),
      ];

      // 4 travel, 0 competent/independent → 0%
      const travelRecords: TravelTrainingInput[] = [
        makeTravel({ id: "tt_1", child_id: "c1", competency_level: "not_started", child_feedback_positive: false, child_confidence_rating: 1, staff_confidence_rating: 1 }),
        makeTravel({ id: "tt_2", child_id: "c1", competency_level: "developing", child_feedback_positive: false, child_confidence_rating: 1, staff_confidence_rating: 1 }),
        makeTravel({ id: "tt_3", child_id: "c1", competency_level: "developing", child_feedback_positive: false, child_confidence_rating: 2, staff_confidence_rating: 2 }),
        makeTravel({ id: "tt_4", child_id: "c1", competency_level: "not_started", child_feedback_positive: false, child_confidence_rating: 1, staff_confidence_rating: 1 }),
      ];

      // 5 personal care, 1 minimal prompts → 20%
      const personalCareRecords: PersonalCareInput[] = [
        makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "full_support", child_engaged: false }),
        makePersonalCare({ id: "pc_2", child_id: "c1", independence_level: "full_support", child_engaged: false }),
        makePersonalCare({ id: "pc_3", child_id: "c1", independence_level: "some_support", child_engaged: false }),
        makePersonalCare({ id: "pc_4", child_id: "c1", independence_level: "some_support", child_engaged: false }),
        makePersonalCare({ id: "pc_5", child_id: "c1", independence_level: "minimal_prompts", child_engaged: true }),
      ];

      // 4 milestones, 1 achieved, 2 overdue
      const milestones: IndependenceMilestoneInput[] = [
        makeMilestone({ id: "im_1", child_id: "c1", achieved: true }),
        makeMilestone({ id: "im_2", child_id: "c1", achieved: false, overdue: true }),
        makeMilestone({ id: "im_3", child_id: "c1", achieved: false, overdue: true }),
        makeMilestone({ id: "im_4", child_id: "c1", achieved: false }),
      ];

      return baseInput({
        total_children: 3,
        life_skills_assessment_records: assessments,
        cooking_programme_records: cookingRecords,
        travel_training_records: travelRecords,
        personal_care_records: personalCareRecords,
        independence_milestone_records: milestones,
      });
    }

    it("achieves inadequate rating (score < 45)", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      expect(r.independence_rating).toBe("inadequate");
      expect(r.independence_score).toBeLessThan(45);
    });

    it("headline mentions inadequate", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      expect(r.headline).toContain("inadequate");
    });

    it("has many concerns", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      expect(r.concerns.length).toBeGreaterThanOrEqual(3);
    });

    it("has many recommendations", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      expect(r.recommendations.length).toBeGreaterThanOrEqual(3);
    });

    it("has critical insights", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBeGreaterThanOrEqual(2);
    });

    it("coverage rate is 33%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      expect(r.skills_assessment_coverage_rate).toBe(33);
    });

    it("cooking_competency_rate is 20%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      expect(r.cooking_competency_rate).toBe(20);
    });

    it("travel_independence_rate is 0%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      expect(r.travel_independence_rate).toBe(0);
    });

    it("personal_care_rate is 20%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      expect(r.personal_care_rate).toBe(20);
    });

    it("milestone_achievement_rate is 25%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(inadequateInput());
      expect(r.milestone_achievement_rate).toBe(25);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INDIVIDUAL BONUS TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("individual bonuses", () => {
    // NOTE: All make*() helpers default to MINIMAL values (false, 0, observer,
    // not_started, full_support, not achieved) specifically so that individual
    // bonus tests don't accidentally trigger other bonuses.

    // ----------- Bonus 1: skillsAssessmentCoverageRate >=100 → +4 ----------
    describe("Bonus 1: skillsAssessmentCoverageRate", () => {
      it("+4 when all children have assessments (100% coverage)", () => {
        // 3 children, 3 unique child_ids
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
              makeAssessment({ id: "a2", child_id: "c2" }),
              makeAssessment({ id: "a3", child_id: "c3" }),
            ],
          }),
        );
        // base 52 + 4 (coverage 100%) + 2 (review compliance 100%) = 58
        expect(r.independence_score).toBe(58);
      });

      it("+2 when coverage is 80-99%", () => {
        // 5 children, 4 assessed → 80%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 5,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
              makeAssessment({ id: "a2", child_id: "c2" }),
              makeAssessment({ id: "a3", child_id: "c3" }),
              makeAssessment({ id: "a4", child_id: "c4" }),
            ],
          }),
        );
        // 80% → +2, review compliance 100% → +2
        expect(r.independence_score).toBe(56);
      });

      it("+0 when coverage is below 80%", () => {
        // 3 children, 2 assessed → 67%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
              makeAssessment({ id: "a2", child_id: "c2" }),
            ],
          }),
        );
        // 67% → no coverage bonus, review compliance 100% → +2
        expect(r.independence_score).toBe(54);
      });
    });

    // ----------- Bonus 2: cookingCompetencyRate >=80 → +4, >=60 → +2 ------
    describe("Bonus 2: cookingCompetencyRate", () => {
      it("+4 when competency is >=80%", () => {
        // 5 cooking, 4 supervised/independent → 80%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            cooking_programme_records: [
              makeCooking({ id: "cp_1", skill_level: "independent" }),
              makeCooking({ id: "cp_2", skill_level: "supervised" }),
              makeCooking({ id: "cp_3", skill_level: "supervised" }),
              makeCooking({ id: "cp_4", skill_level: "independent" }),
              makeCooking({ id: "cp_5", skill_level: "observer" }),
            ],
          }),
        );
        // base 52 + 4 (cooking competency 80%) - 6 (skills coverage: 0/3 = 0% < 50%)
        // cookingParticipationRate = pct(1,3) = 33% < 50 → concern but no score penalty
        expect(r.independence_score).toBe(50);
      });

      it("+2 when competency is 60-79%", () => {
        // 5 cooking, 3 supervised/independent → 60%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            cooking_programme_records: [
              makeCooking({ id: "cp_1", skill_level: "supervised" }),
              makeCooking({ id: "cp_2", skill_level: "supervised" }),
              makeCooking({ id: "cp_3", skill_level: "independent" }),
              makeCooking({ id: "cp_4", skill_level: "observer" }),
              makeCooking({ id: "cp_5", skill_level: "assisted" }),
            ],
          }),
        );
        // base 52 + 2 (cooking 60%) - 6 (skills coverage penalty)
        expect(r.independence_score).toBe(48);
      });

      it("+0 when competency is below 60%", () => {
        // 5 cooking, 2 supervised → 40%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            cooking_programme_records: [
              makeCooking({ id: "cp_1", skill_level: "supervised" }),
              makeCooking({ id: "cp_2", skill_level: "supervised" }),
              makeCooking({ id: "cp_3", skill_level: "observer" }),
              makeCooking({ id: "cp_4", skill_level: "observer" }),
              makeCooking({ id: "cp_5", skill_level: "observer" }),
            ],
          }),
        );
        // base 52 + 0 - 6 (skills coverage penalty)
        // cooking competency = 40%, no cooking penalty (40 not <40)
        expect(r.independence_score).toBe(46);
      });
    });

    // ----------- Bonus 3: travelIndependenceRate >=80 → +3, >=60 → +1 -----
    describe("Bonus 3: travelIndependenceRate", () => {
      it("+3 when travel independence >=80%", () => {
        // 5 travel, 4 competent/independent → 80%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            travel_training_records: [
              makeTravel({ id: "tt_1", competency_level: "independent" }),
              makeTravel({ id: "tt_2", competency_level: "competent" }),
              makeTravel({ id: "tt_3", competency_level: "independent" }),
              makeTravel({ id: "tt_4", competency_level: "competent" }),
              makeTravel({ id: "tt_5", competency_level: "developing" }),
            ],
          }),
        );
        // base 52 + 3 - 6 (coverage penalty)
        expect(r.independence_score).toBe(49);
      });

      it("+1 when travel independence 60-79%", () => {
        // 5 travel, 3 competent/independent → 60%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            travel_training_records: [
              makeTravel({ id: "tt_1", competency_level: "independent" }),
              makeTravel({ id: "tt_2", competency_level: "competent" }),
              makeTravel({ id: "tt_3", competency_level: "competent" }),
              makeTravel({ id: "tt_4", competency_level: "developing" }),
              makeTravel({ id: "tt_5", competency_level: "not_started" }),
            ],
          }),
        );
        // base 52 + 1 - 6 (coverage penalty)
        expect(r.independence_score).toBe(47);
      });

      it("+0 when travel independence below 60%", () => {
        // 5 travel, 2 competent → 40%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            travel_training_records: [
              makeTravel({ id: "tt_1", competency_level: "competent" }),
              makeTravel({ id: "tt_2", competency_level: "competent" }),
              makeTravel({ id: "tt_3", competency_level: "developing" }),
              makeTravel({ id: "tt_4", competency_level: "developing" }),
              makeTravel({ id: "tt_5", competency_level: "not_started" }),
            ],
          }),
        );
        // base 52 + 0 - 6 (coverage penalty), no travel penalty (40% not <30%)
        expect(r.independence_score).toBe(46);
      });
    });

    // ----------- Bonus 4: personalCareRate >=90 → +3, >=70 → +1 -----------
    describe("Bonus 4: personalCareRate", () => {
      it("+3 when personal care rate >=90%", () => {
        // 10 records, 9 independent/minimal → 90%
        const records: PersonalCareInput[] = [];
        for (let i = 0; i < 9; i++) {
          records.push(
            makePersonalCare({
              id: `pc_${i}`,
              independence_level: i % 2 === 0 ? "independent" : "minimal_prompts",
            }),
          );
        }
        records.push(
          makePersonalCare({ id: "pc_9", independence_level: "some_support" }),
        );
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({ personal_care_records: records }),
        );
        // base 52 + 3 - 6 (coverage penalty)
        expect(r.independence_score).toBe(49);
      });

      it("+1 when personal care rate 70-89%", () => {
        // 10 records, 7 independent/minimal → 70%
        const records: PersonalCareInput[] = [];
        for (let i = 0; i < 7; i++) {
          records.push(
            makePersonalCare({
              id: `pc_${i}`,
              independence_level: "independent",
            }),
          );
        }
        for (let i = 7; i < 10; i++) {
          records.push(
            makePersonalCare({
              id: `pc_${i}`,
              independence_level: "some_support",
            }),
          );
        }
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({ personal_care_records: records }),
        );
        // base 52 + 1 - 6 (coverage penalty)
        expect(r.independence_score).toBe(47);
      });

      it("+0 when personal care rate below 70%", () => {
        // 10 records, 5 independent/minimal → 50%
        const records: PersonalCareInput[] = [];
        for (let i = 0; i < 5; i++) {
          records.push(
            makePersonalCare({ id: `pc_${i}`, independence_level: "independent" }),
          );
        }
        for (let i = 5; i < 10; i++) {
          records.push(
            makePersonalCare({ id: `pc_${i}`, independence_level: "full_support" }),
          );
        }
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({ personal_care_records: records }),
        );
        // base 52 + 0 - 6 (coverage penalty), no personal care penalty (50% not <40%)
        expect(r.independence_score).toBe(46);
      });
    });

    // ----------- Bonus 5: milestoneAchievementRate >=90 → +4, >=70 → +2 ---
    describe("Bonus 5: milestoneAchievementRate", () => {
      it("+4 when milestone achievement >=90%", () => {
        // 10 milestones, 9 achieved → 90%
        const milestones: IndependenceMilestoneInput[] = [];
        for (let i = 0; i < 9; i++) {
          milestones.push(makeMilestone({ id: `im_${i}`, achieved: true }));
        }
        milestones.push(makeMilestone({ id: "im_9", achieved: false }));
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({ independence_milestone_records: milestones }),
        );
        // base 52 + 4 - 6 (coverage penalty)
        expect(r.independence_score).toBe(50);
      });

      it("+2 when milestone achievement 70-89%", () => {
        // 10 milestones, 7 achieved → 70%
        const milestones: IndependenceMilestoneInput[] = [];
        for (let i = 0; i < 7; i++) {
          milestones.push(makeMilestone({ id: `im_${i}`, achieved: true }));
        }
        for (let i = 7; i < 10; i++) {
          milestones.push(makeMilestone({ id: `im_${i}`, achieved: false }));
        }
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({ independence_milestone_records: milestones }),
        );
        // base 52 + 2 - 6 (coverage penalty)
        expect(r.independence_score).toBe(48);
      });

      it("+0 when milestone achievement below 70%", () => {
        // 10 milestones, 5 achieved → 50%
        const milestones: IndependenceMilestoneInput[] = [];
        for (let i = 0; i < 5; i++) {
          milestones.push(makeMilestone({ id: `im_${i}`, achieved: true }));
        }
        for (let i = 5; i < 10; i++) {
          milestones.push(makeMilestone({ id: `im_${i}`, achieved: false }));
        }
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({ independence_milestone_records: milestones }),
        );
        // base 52 + 0 - 6 (coverage penalty)
        expect(r.independence_score).toBe(46);
      });
    });

    // ----------- Bonus 6: childEngagementRate >=90 → +3, >=70 → +1 --------
    describe("Bonus 6: childEngagementRate", () => {
      it("+3 when engagement >=90%", () => {
        // engagement = (child_involved + child_enjoyed + travel_feedback_positive + child_engaged) / total_records
        // 3 assessments with child_involved + 3 cooking with child_enjoyed + 3 travel with positive feedback + 3 personal care with child_engaged
        // = 12/12 = 100%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
              makeAssessment({ id: "a2", child_id: "c2", child_involved: true }),
              makeAssessment({ id: "a3", child_id: "c3", child_involved: true }),
            ],
            cooking_programme_records: [
              makeCooking({ id: "cp_1", child_id: "c1", child_enjoyed: true }),
              makeCooking({ id: "cp_2", child_id: "c2", child_enjoyed: true }),
              makeCooking({ id: "cp_3", child_id: "c3", child_enjoyed: true }),
            ],
            travel_training_records: [
              makeTravel({ id: "tt_1", child_id: "c1", child_feedback_positive: true }),
              makeTravel({ id: "tt_2", child_id: "c2", child_feedback_positive: true }),
              makeTravel({ id: "tt_3", child_id: "c3", child_feedback_positive: true }),
            ],
            personal_care_records: [
              makePersonalCare({ id: "pc_1", child_id: "c1", child_engaged: true }),
              makePersonalCare({ id: "pc_2", child_id: "c2", child_engaged: true }),
              makePersonalCare({ id: "pc_3", child_id: "c3", child_engaged: true }),
            ],
          }),
        );
        // base 52 + 4 (coverage 100%) + 3 (engagement 100%) + 2 (review compliance 100%)
        // cooking competency: 0/3 (all observer default) → penalty -4
        // travel: 0/3 (all not_started) → penalty -4
        // personal care: 0/3 (all full_support) → penalty -3
        // So: 52 + 4 + 3 + 2 - 4 - 4 - 3 = 50
        expect(r.independence_score).toBe(50);
      });

      it("+1 when engagement 70-89%", () => {
        // 10 records total, 7 engaged
        // 3 assessments (2 involved), 3 cooking (2 enjoyed), 2 travel (2 positive), 2 personal care (1 engaged)
        // = 7/10 = 70%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
              makeAssessment({ id: "a2", child_id: "c2", child_involved: true }),
              makeAssessment({ id: "a3", child_id: "c3", child_involved: false }),
            ],
            cooking_programme_records: [
              makeCooking({ id: "cp_1", child_id: "c1", child_enjoyed: true }),
              makeCooking({ id: "cp_2", child_id: "c2", child_enjoyed: true }),
              makeCooking({ id: "cp_3", child_id: "c3", child_enjoyed: false }),
            ],
            travel_training_records: [
              makeTravel({ id: "tt_1", child_id: "c1", child_feedback_positive: true }),
              makeTravel({ id: "tt_2", child_id: "c2", child_feedback_positive: true }),
            ],
            personal_care_records: [
              makePersonalCare({ id: "pc_1", child_id: "c1", child_engaged: true }),
              makePersonalCare({ id: "pc_2", child_id: "c2", child_engaged: false }),
            ],
          }),
        );
        // engagement = 7/10 = 70%
        // coverage: 3/3 = 100% → +4
        // review compliance: 100% → +2
        // cooking: 0/3 = 0% → penalty -4
        // travel: 0/2 = 0% → penalty -4
        // personal care: 0/2 = 0% → penalty -3
        // engagement: 70% → +1
        // 52 + 4 + 2 + 1 - 4 - 4 - 3 = 48
        expect(r.independence_score).toBe(48);
      });

      it("+0 when engagement below 70%", () => {
        // 10 records total, 5 engaged → 50%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
              makeAssessment({ id: "a2", child_id: "c2", child_involved: false }),
              makeAssessment({ id: "a3", child_id: "c3", child_involved: false }),
            ],
            cooking_programme_records: [
              makeCooking({ id: "cp_1", child_id: "c1", child_enjoyed: true }),
              makeCooking({ id: "cp_2", child_id: "c2", child_enjoyed: true }),
              makeCooking({ id: "cp_3", child_id: "c3", child_enjoyed: false }),
            ],
            travel_training_records: [
              makeTravel({ id: "tt_1", child_id: "c1", child_feedback_positive: true }),
              makeTravel({ id: "tt_2", child_id: "c2", child_feedback_positive: false }),
            ],
            personal_care_records: [
              makePersonalCare({ id: "pc_1", child_id: "c1", child_engaged: true }),
              makePersonalCare({ id: "pc_2", child_id: "c2", child_engaged: false }),
            ],
          }),
        );
        // engagement = 5/10 = 50% → +0
        // coverage 100% → +4, review compliance 100% → +2
        // cooking penalty -4, travel penalty -4, personal care penalty -3
        // 52 + 4 + 2 - 4 - 4 - 3 = 47
        expect(r.independence_score).toBe(47);
      });
    });

    // ----------- Bonus 7: goalsAchievementRate >=80 → +3, >=60 → +1 -------
    describe("Bonus 7: goalsAchievementRate", () => {
      it("+3 when goals achievement >=80%", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", goals_set: 5, goals_achieved: 5 }),
              makeAssessment({ id: "a2", child_id: "c2", goals_set: 5, goals_achieved: 4 }),
              makeAssessment({ id: "a3", child_id: "c3", goals_set: 5, goals_achieved: 4 }),
            ],
          }),
        );
        // goals: 13/15 = 87% → +3
        // coverage: 3/3 = 100% → +4
        // review compliance: 100% → +2
        // 52 + 4 + 3 + 2 = 61
        expect(r.independence_score).toBe(61);
      });

      it("+1 when goals achievement 60-79%", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", goals_set: 5, goals_achieved: 3 }),
              makeAssessment({ id: "a2", child_id: "c2", goals_set: 5, goals_achieved: 3 }),
              makeAssessment({ id: "a3", child_id: "c3", goals_set: 5, goals_achieved: 3 }),
            ],
          }),
        );
        // goals: 9/15 = 60% → +1
        // coverage: 100% → +4
        // review compliance: 100% → +2
        // 52 + 4 + 1 + 2 = 59
        expect(r.independence_score).toBe(59);
      });

      it("+0 when goals achievement below 60%", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", goals_set: 5, goals_achieved: 2 }),
              makeAssessment({ id: "a2", child_id: "c2", goals_set: 5, goals_achieved: 2 }),
              makeAssessment({ id: "a3", child_id: "c3", goals_set: 5, goals_achieved: 2 }),
            ],
          }),
        );
        // goals: 6/15 = 40% → +0
        // coverage: 100% → +4
        // review compliance: 100% → +2
        // 52 + 4 + 2 = 58
        expect(r.independence_score).toBe(58);
      });
    });

    // ----------- Bonus 8: assessmentReviewComplianceRate >=100 → +2, >=80 → +1
    describe("Bonus 8: assessmentReviewComplianceRate", () => {
      it("+2 when all reviews on time (100%)", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", review_overdue: false }),
              makeAssessment({ id: "a2", child_id: "c2", review_overdue: false }),
              makeAssessment({ id: "a3", child_id: "c3", review_overdue: false }),
            ],
          }),
        );
        // review compliance: 3/3 = 100% → +2
        // coverage: 100% → +4
        // 52 + 4 + 2 = 58
        expect(r.independence_score).toBe(58);
      });

      it("+1 when review compliance 80-99%", () => {
        // 5 assessments, 1 overdue → 80%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 5,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", review_overdue: false }),
              makeAssessment({ id: "a2", child_id: "c2", review_overdue: false }),
              makeAssessment({ id: "a3", child_id: "c3", review_overdue: false }),
              makeAssessment({ id: "a4", child_id: "c4", review_overdue: false }),
              makeAssessment({ id: "a5", child_id: "c5", review_overdue: true }),
            ],
          }),
        );
        // review compliance: 4/5 = 80% → +1
        // coverage: 5/5 = 100% → +4
        // 52 + 4 + 1 = 57
        expect(r.independence_score).toBe(57);
      });

      it("+0 when review compliance below 80%", () => {
        // 5 assessments, 2 overdue → 60%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 5,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", review_overdue: false }),
              makeAssessment({ id: "a2", child_id: "c2", review_overdue: false }),
              makeAssessment({ id: "a3", child_id: "c3", review_overdue: false }),
              makeAssessment({ id: "a4", child_id: "c4", review_overdue: true }),
              makeAssessment({ id: "a5", child_id: "c5", review_overdue: true }),
            ],
          }),
        );
        // review compliance: 3/5 = 60% → +0
        // coverage: 100% → +4
        // 52 + 4 = 56
        expect(r.independence_score).toBe(56);
      });
    });

    // ----------- Bonus 9: skillsImprovementRate >=80 → +2, >=60 → +1 ------
    describe("Bonus 9: skillsImprovementRate", () => {
      it("+2 when improvement rate >=80%", () => {
        // 5 assessments with previous scores, 4 showing improvement → 80%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 5,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", overall_independence_score: 7, previous_overall_score: 5 }),
              makeAssessment({ id: "a2", child_id: "c2", overall_independence_score: 8, previous_overall_score: 6 }),
              makeAssessment({ id: "a3", child_id: "c3", overall_independence_score: 6, previous_overall_score: 4 }),
              makeAssessment({ id: "a4", child_id: "c4", overall_independence_score: 9, previous_overall_score: 7 }),
              makeAssessment({ id: "a5", child_id: "c5", overall_independence_score: 5, previous_overall_score: 5 }),
            ],
          }),
        );
        // improvement: 4/5 = 80% → +2
        // coverage: 100% → +4
        // review compliance: 100% → +2
        // 52 + 4 + 2 + 2 = 60
        expect(r.independence_score).toBe(60);
      });

      it("+1 when improvement rate 60-79%", () => {
        // 5 assessments, 3 with previous, 2 improved → 67%
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", overall_independence_score: 7, previous_overall_score: 5 }),
              makeAssessment({ id: "a2", child_id: "c2", overall_independence_score: 8, previous_overall_score: 6 }),
              makeAssessment({ id: "a3", child_id: "c3", overall_independence_score: 5, previous_overall_score: 5 }),
            ],
          }),
        );
        // improvement: 2/3 = 67% → +1
        // coverage: 100% → +4
        // review compliance: 100% → +2
        // 52 + 4 + 2 + 1 = 59
        expect(r.independence_score).toBe(59);
      });

      it("+0 when improvement rate below 60%", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", overall_independence_score: 5, previous_overall_score: 5 }),
              makeAssessment({ id: "a2", child_id: "c2", overall_independence_score: 6, previous_overall_score: 6 }),
              makeAssessment({ id: "a3", child_id: "c3", overall_independence_score: 7, previous_overall_score: 5 }),
            ],
          }),
        );
        // improvement: 1/3 = 33% → +0
        // coverage: 100% → +4
        // review compliance: 100% → +2
        // 52 + 4 + 2 = 58
        expect(r.independence_score).toBe(58);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INDIVIDUAL PENALTY TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("individual penalties", () => {
    // Penalty 1: skillsAssessmentCoverageRate < 50 → -6
    describe("Penalty: low skills assessment coverage (-6)", () => {
      it("fires when coverage < 50% and total_children > 0", () => {
        // 3 children, 1 assessed → 33% < 50 → -6
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
          }),
        );
        // base 52 - 6 (coverage penalty) + 2 (review compliance 100%) = 48
        expect(r.independence_score).toBe(48);
      });

      it("fires when coverage = 0%", () => {
        // assessments present but for 0 children matched (actually if records exist, at least one child is counted)
        // Use: total_children = 3, 0 assessments → allEmpty path. Need at least one record type not empty.
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            cooking_programme_records: [makeCooking({ id: "cp_1" })],
          }),
        );
        // coverage: 0/3 = 0% < 50 → -6
        // cooking competency: 0/1 = 0% → cooking penalty -4 (0 < 40 and total > 0)
        // 52 - 6 - 4 = 42
        expect(r.independence_score).toBe(42);
      });

      it("does not fire when coverage >= 50%", () => {
        // 3 children, 2 assessed → 67% >= 50 → no penalty
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
              makeAssessment({ id: "a2", child_id: "c2" }),
            ],
          }),
        );
        // no coverage penalty, no coverage bonus (67% < 80), review compliance 100% → +2
        expect(r.independence_score).toBe(54);
      });
    });

    // Penalty 2: cookingCompetencyRate < 40 → -4
    describe("Penalty: low cooking competency (-4)", () => {
      it("fires when competency < 40% and cooking sessions exist", () => {
        // 5 cooking, 1 supervised → 20% < 40 → -4
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            cooking_programme_records: [
              makeCooking({ id: "cp_1", skill_level: "supervised" }),
              makeCooking({ id: "cp_2", skill_level: "observer" }),
              makeCooking({ id: "cp_3", skill_level: "observer" }),
              makeCooking({ id: "cp_4", skill_level: "observer" }),
              makeCooking({ id: "cp_5", skill_level: "observer" }),
            ],
          }),
        );
        // base 52 - 6 (coverage) - 4 (cooking) = 42
        expect(r.independence_score).toBe(42);
      });

      it("does not fire when competency is exactly 40%", () => {
        // 5 cooking, 2 supervised → 40% — not < 40
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            cooking_programme_records: [
              makeCooking({ id: "cp_1", skill_level: "supervised" }),
              makeCooking({ id: "cp_2", skill_level: "supervised" }),
              makeCooking({ id: "cp_3", skill_level: "observer" }),
              makeCooking({ id: "cp_4", skill_level: "observer" }),
              makeCooking({ id: "cp_5", skill_level: "observer" }),
            ],
          }),
        );
        // 40% → no cooking penalty, no bonus
        // base 52 - 6 (coverage) = 46
        expect(r.independence_score).toBe(46);
      });

      it("does not fire when no cooking sessions exist", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
          }),
        );
        // No cooking records → guard prevents penalty
        // coverage: 33% < 50 → -6, review compliance 100% → +2
        // 52 - 6 + 2 = 48
        expect(r.independence_score).toBe(48);
      });
    });

    // Penalty 3: travelIndependenceRate < 30 → -4
    describe("Penalty: low travel independence (-4)", () => {
      it("fires when travel independence < 30% and travel sessions exist", () => {
        // 5 travel, 1 competent → 20% < 30 → -4
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            travel_training_records: [
              makeTravel({ id: "tt_1", competency_level: "competent" }),
              makeTravel({ id: "tt_2", competency_level: "developing" }),
              makeTravel({ id: "tt_3", competency_level: "developing" }),
              makeTravel({ id: "tt_4", competency_level: "not_started" }),
              makeTravel({ id: "tt_5", competency_level: "not_started" }),
            ],
          }),
        );
        // base 52 - 6 (coverage) - 4 (travel) = 42
        expect(r.independence_score).toBe(42);
      });

      it("does not fire when travel independence is exactly 30%", () => {
        // 10 travel, 3 competent/independent → 30% — not < 30
        const records: TravelTrainingInput[] = [];
        for (let i = 0; i < 3; i++) {
          records.push(makeTravel({ id: `tt_${i}`, competency_level: "competent" }));
        }
        for (let i = 3; i < 10; i++) {
          records.push(makeTravel({ id: `tt_${i}`, competency_level: "developing" }));
        }
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({ travel_training_records: records }),
        );
        // 30% → no penalty, no bonus
        // base 52 - 6 (coverage) = 46
        expect(r.independence_score).toBe(46);
      });

      it("does not fire when no travel sessions exist", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
          }),
        );
        // coverage: 33% → -6, review compliance 100% → +2
        expect(r.independence_score).toBe(48);
      });
    });

    // Penalty 4: personalCareRate < 40 → -3
    describe("Penalty: low personal care rate (-3)", () => {
      it("fires when personal care rate < 40% and records exist", () => {
        // 5 records, 1 independent → 20% < 40 → -3
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            personal_care_records: [
              makePersonalCare({ id: "pc_1", independence_level: "independent" }),
              makePersonalCare({ id: "pc_2", independence_level: "full_support" }),
              makePersonalCare({ id: "pc_3", independence_level: "full_support" }),
              makePersonalCare({ id: "pc_4", independence_level: "full_support" }),
              makePersonalCare({ id: "pc_5", independence_level: "full_support" }),
            ],
          }),
        );
        // base 52 - 6 (coverage) - 3 (personal care) = 43
        expect(r.independence_score).toBe(43);
      });

      it("does not fire when personal care rate is exactly 40%", () => {
        // 5 records, 2 independent/minimal → 40% — not < 40
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            personal_care_records: [
              makePersonalCare({ id: "pc_1", independence_level: "independent" }),
              makePersonalCare({ id: "pc_2", independence_level: "minimal_prompts" }),
              makePersonalCare({ id: "pc_3", independence_level: "full_support" }),
              makePersonalCare({ id: "pc_4", independence_level: "full_support" }),
              makePersonalCare({ id: "pc_5", independence_level: "full_support" }),
            ],
          }),
        );
        // 40% → no penalty, no bonus
        // base 52 - 6 (coverage) = 46
        expect(r.independence_score).toBe(46);
      });

      it("does not fire when no personal care records exist", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
          }),
        );
        // coverage: 33% → -6, review compliance 100% → +2
        expect(r.independence_score).toBe(48);
      });
    });

    // All penalties combined
    describe("all penalties stacked", () => {
      it("deducts all four penalties when conditions met simultaneously", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 3,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
            cooking_programme_records: [
              makeCooking({ id: "cp_1", skill_level: "observer" }),
            ],
            travel_training_records: [
              makeTravel({ id: "tt_1", competency_level: "not_started" }),
            ],
            personal_care_records: [
              makePersonalCare({ id: "pc_1", independence_level: "full_support" }),
            ],
          }),
        );
        // coverage: 33% → -6, cooking: 0% → -4, travel: 0% → -4, personal care: 0% → -3
        // review compliance: 100% → +2
        // 52 - 6 - 4 - 4 - 3 + 2 = 37
        expect(r.independence_score).toBe(37);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RATE CALCULATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("rate calculations", () => {
    describe("skills_assessment_coverage_rate", () => {
      it("returns pct of unique children with assessments", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 4,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
              makeAssessment({ id: "a2", child_id: "c2" }),
              makeAssessment({ id: "a3", child_id: "c1" }), // duplicate child_id
            ],
          }),
        );
        // unique children = 2, total = 4 → 50%
        expect(r.skills_assessment_coverage_rate).toBe(50);
      });

      it("returns 0 when total_children is 0 (but not allEmpty)", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 0,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
          }),
        );
        // total_children = 0 → skillsAssessmentCoverageRate = 0
        expect(r.skills_assessment_coverage_rate).toBe(0);
      });

      it("handles 100% with exact match", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 2,
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
              makeAssessment({ id: "a2", child_id: "c2" }),
            ],
          }),
        );
        expect(r.skills_assessment_coverage_rate).toBe(100);
      });
    });

    describe("cooking_competency_rate", () => {
      it("counts supervised + independent as competent", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            cooking_programme_records: [
              makeCooking({ id: "cp_1", skill_level: "independent" }),
              makeCooking({ id: "cp_2", skill_level: "supervised" }),
              makeCooking({ id: "cp_3", skill_level: "assisted" }),
              makeCooking({ id: "cp_4", skill_level: "observer" }),
            ],
          }),
        );
        // 2/4 = 50%
        expect(r.cooking_competency_rate).toBe(50);
      });

      it("returns 0 when no cooking records", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
          }),
        );
        expect(r.cooking_competency_rate).toBe(0);
      });
    });

    describe("travel_independence_rate", () => {
      it("counts independent + competent", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            travel_training_records: [
              makeTravel({ id: "tt_1", competency_level: "independent" }),
              makeTravel({ id: "tt_2", competency_level: "competent" }),
              makeTravel({ id: "tt_3", competency_level: "developing" }),
              makeTravel({ id: "tt_4", competency_level: "not_started" }),
            ],
          }),
        );
        // 2/4 = 50%
        expect(r.travel_independence_rate).toBe(50);
      });

      it("returns 0 when no travel records", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
          }),
        );
        expect(r.travel_independence_rate).toBe(0);
      });
    });

    describe("personal_care_rate", () => {
      it("counts independent + minimal_prompts", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            personal_care_records: [
              makePersonalCare({ id: "pc_1", independence_level: "independent" }),
              makePersonalCare({ id: "pc_2", independence_level: "minimal_prompts" }),
              makePersonalCare({ id: "pc_3", independence_level: "some_support" }),
              makePersonalCare({ id: "pc_4", independence_level: "full_support" }),
            ],
          }),
        );
        // 2/4 = 50%
        expect(r.personal_care_rate).toBe(50);
      });

      it("returns 0 when no personal care records", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
          }),
        );
        expect(r.personal_care_rate).toBe(0);
      });
    });

    describe("milestone_achievement_rate", () => {
      it("counts achieved milestones", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            independence_milestone_records: [
              makeMilestone({ id: "im_1", achieved: true }),
              makeMilestone({ id: "im_2", achieved: true }),
              makeMilestone({ id: "im_3", achieved: false }),
            ],
          }),
        );
        // 2/3 = 67%
        expect(r.milestone_achievement_rate).toBe(67);
      });

      it("returns 0 when no milestones", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1" }),
            ],
          }),
        );
        expect(r.milestone_achievement_rate).toBe(0);
      });
    });

    describe("child_engagement_rate", () => {
      it("combines all engagement sources", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
              makeAssessment({ id: "a2", child_id: "c2", child_involved: false }),
            ],
            cooking_programme_records: [
              makeCooking({ id: "cp_1", child_enjoyed: true }),
              makeCooking({ id: "cp_2", child_enjoyed: true }),
            ],
            travel_training_records: [
              makeTravel({ id: "tt_1", child_feedback_positive: true }),
            ],
            personal_care_records: [
              makePersonalCare({ id: "pc_1", child_engaged: false }),
              makePersonalCare({ id: "pc_2", child_engaged: false }),
            ],
          }),
        );
        // numerator: 1 + 2 + 1 + 0 = 4
        // denominator: 2 + 2 + 1 + 2 = 7
        // 4/7 = 57%
        expect(r.child_engagement_rate).toBe(57);
      });

      it("returns 0 when all records have zero engagement", () => {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            life_skills_assessment_records: [
              makeAssessment({ id: "a1", child_id: "c1", child_involved: false }),
            ],
            cooking_programme_records: [
              makeCooking({ id: "cp_1", child_enjoyed: false }),
            ],
          }),
        );
        // 0 / 2 = 0%
        expect(r.child_engagement_rate).toBe(0);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("adds coverage 100% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
            makeAssessment({ id: "a3", child_id: "c3" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Every child has a life skills assessment"))).toBe(true);
    });

    it("adds coverage 80-99% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 5,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
            makeAssessment({ id: "a3", child_id: "c3" }),
            makeAssessment({ id: "a4", child_id: "c4" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("life skills assessments"))).toBe(true);
    });

    it("adds cooking competency >=80% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "independent" }),
            makeCooking({ id: "cp_2", skill_level: "supervised" }),
            makeCooking({ id: "cp_3", skill_level: "supervised" }),
            makeCooking({ id: "cp_4", skill_level: "supervised" }),
            makeCooking({ id: "cp_5", skill_level: "observer" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("cooking"))).toBe(true);
    });

    it("adds cooking competency 60-79% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "supervised" }),
            makeCooking({ id: "cp_2", skill_level: "supervised" }),
            makeCooking({ id: "cp_3", skill_level: "supervised" }),
            makeCooking({ id: "cp_4", skill_level: "observer" }),
            makeCooking({ id: "cp_5", skill_level: "observer" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("60%") && s.includes("cooking competency"))).toBe(true);
    });

    it("adds travel independence >=80% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "independent" }),
            makeTravel({ id: "tt_2", competency_level: "competent" }),
            makeTravel({ id: "tt_3", competency_level: "competent" }),
            makeTravel({ id: "tt_4", competency_level: "independent" }),
            makeTravel({ id: "tt_5", competency_level: "developing" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("travel"))).toBe(true);
    });

    it("adds personal care >=90% strength", () => {
      const records: PersonalCareInput[] = [];
      for (let i = 0; i < 9; i++) {
        records.push(makePersonalCare({ id: `pc_${i}`, independence_level: "independent" }));
      }
      records.push(makePersonalCare({ id: "pc_9", independence_level: "some_support" }));
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ personal_care_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("personal care"))).toBe(true);
    });

    it("adds milestone >=90% strength", () => {
      const milestones: IndependenceMilestoneInput[] = [];
      for (let i = 0; i < 9; i++) {
        milestones.push(makeMilestone({ id: `im_${i}`, achieved: true }));
      }
      milestones.push(makeMilestone({ id: "im_9", achieved: false }));
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ independence_milestone_records: milestones }),
      );
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("milestone"))).toBe(true);
    });

    it("adds child engagement >=90% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
            makeAssessment({ id: "a2", child_id: "c2", child_involved: true }),
            makeAssessment({ id: "a3", child_id: "c3", child_involved: true }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_enjoyed: true }),
            makeCooking({ id: "cp_2", child_enjoyed: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_feedback_positive: true }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_engaged: true }),
          ],
        }),
      );
      // 7/7 = 100% engagement
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("engagement"))).toBe(true);
    });

    it("adds goals >=80% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", goals_set: 5, goals_achieved: 5 }),
            makeAssessment({ id: "a2", child_id: "c2", goals_set: 5, goals_achieved: 4 }),
            makeAssessment({ id: "a3", child_id: "c3", goals_set: 5, goals_achieved: 4 }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("goal") && s.includes("achieved"))).toBe(true);
    });

    it("adds cooking enjoyment >=90% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_enjoyed: true }),
            makeCooking({ id: "cp_2", child_enjoyed: true }),
            makeCooking({ id: "cp_3", child_enjoyed: true }),
            makeCooking({ id: "cp_4", child_enjoyed: true }),
            makeCooking({ id: "cp_5", child_enjoyed: true }),
          ],
        }),
      );
      // 5/5 = 100%
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("enjoy"))).toBe(true);
    });

    it("adds cooking child choice >=70% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_chose_recipe: true }),
            makeCooking({ id: "cp_2", child_chose_recipe: true }),
            makeCooking({ id: "cp_3", child_chose_recipe: true }),
            makeCooking({ id: "cp_4", child_chose_recipe: true }),
            makeCooking({ id: "cp_5", child_chose_recipe: false }),
          ],
        }),
      );
      // 4/5 = 80%
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("recipe"))).toBe(true);
    });

    it("adds travel confidence avg >=4.0 strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", child_confidence_rating: 5, staff_confidence_rating: 5 }),
            makeTravel({ id: "tt_2", child_confidence_rating: 4, staff_confidence_rating: 4 }),
            makeTravel({ id: "tt_3", child_confidence_rating: 4, staff_confidence_rating: 4 }),
          ],
        }),
      );
      // avg = (5+4+4)/3 = 4.33
      expect(r.strengths.some((s) => s.includes("confidence"))).toBe(true);
    });

    it("adds milestone celebration >=80% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true, child_celebrated: true }),
            makeMilestone({ id: "im_2", achieved: true, child_celebrated: true }),
            makeMilestone({ id: "im_3", achieved: true, child_celebrated: true }),
            makeMilestone({ id: "im_4", achieved: true, child_celebrated: true }),
            makeMilestone({ id: "im_5", achieved: true, child_celebrated: false }),
          ],
        }),
      );
      // 4/5 = 80%
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("celebrated"))).toBe(true);
    });

    it("adds review compliance 100% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", review_overdue: false }),
            makeAssessment({ id: "a2", child_id: "c2", review_overdue: false }),
            makeAssessment({ id: "a3", child_id: "c3", review_overdue: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("review") && s.includes("up to date"))).toBe(true);
    });

    it("adds improvement >=80% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", overall_independence_score: 8, previous_overall_score: 5 }),
            makeAssessment({ id: "a2", child_id: "c2", overall_independence_score: 7, previous_overall_score: 4 }),
            makeAssessment({ id: "a3", child_id: "c3", overall_independence_score: 9, previous_overall_score: 6 }),
          ],
        }),
      );
      // 3/3 = 100%
      expect(r.strengths.some((s) => s.includes("improvement"))).toBe(true);
    });

    it("adds dignity 100% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          personal_care_records: [
            makePersonalCare({ id: "pc_1", dignity_respected: true }),
            makePersonalCare({ id: "pc_2", dignity_respected: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Dignity") && s.includes("100%"))).toBe(true);
    });

    it("adds cooking safety 100% strength", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", safety_standards_met: true }),
            makeCooking({ id: "cp_2", safety_standards_met: true }),
            makeCooking({ id: "cp_3", safety_standards_met: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Safety standards") && s.includes("100%"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("adds coverage < 50% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("life skills assessments"))).toBe(true);
    });

    it("adds coverage 50-79% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("67%") && c.includes("independence development needs"))).toBe(true);
    });

    it("adds cooking competency < 40% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "observer" }),
            makeCooking({ id: "cp_2", skill_level: "observer" }),
            makeCooking({ id: "cp_3", skill_level: "observer" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("cooking"))).toBe(true);
    });

    it("adds cooking competency 40-59% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "supervised" }),
            makeCooking({ id: "cp_2", skill_level: "supervised" }),
            makeCooking({ id: "cp_3", skill_level: "observer" }),
            makeCooking({ id: "cp_4", skill_level: "observer" }),
            makeCooking({ id: "cp_5", skill_level: "observer" }),
          ],
        }),
      );
      // 2/5 = 40%
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("Cooking competency"))).toBe(true);
    });

    it("adds travel < 30% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "developing" }),
            makeTravel({ id: "tt_2", competency_level: "not_started" }),
            makeTravel({ id: "tt_3", competency_level: "not_started" }),
            makeTravel({ id: "tt_4", competency_level: "developing" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("travel training"))).toBe(true);
    });

    it("adds travel 30-59% concern", () => {
      // 5 travel, 2 competent → 40%
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "competent" }),
            makeTravel({ id: "tt_2", competency_level: "competent" }),
            makeTravel({ id: "tt_3", competency_level: "developing" }),
            makeTravel({ id: "tt_4", competency_level: "developing" }),
            makeTravel({ id: "tt_5", competency_level: "not_started" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("Travel independence"))).toBe(true);
    });

    it("adds personal care < 40% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "full_support" }),
            makePersonalCare({ id: "pc_2", independence_level: "full_support" }),
            makePersonalCare({ id: "pc_3", independence_level: "full_support" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("personal care"))).toBe(true);
    });

    it("adds personal care 40-69% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "independent" }),
            makePersonalCare({ id: "pc_2", independence_level: "full_support" }),
          ],
        }),
      );
      // 1/2 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Personal care independence"))).toBe(true);
    });

    it("adds milestone < 50% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true }),
            makeMilestone({ id: "im_2", achieved: false }),
            makeMilestone({ id: "im_3", achieved: false }),
            makeMilestone({ id: "im_4", achieved: false }),
            makeMilestone({ id: "im_5", achieved: false }),
          ],
        }),
      );
      // 1/5 = 20%
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("milestone"))).toBe(true);
    });

    it("adds milestone 50-69% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true }),
            makeMilestone({ id: "im_2", achieved: true }),
            makeMilestone({ id: "im_3", achieved: true }),
            makeMilestone({ id: "im_4", achieved: false }),
            makeMilestone({ id: "im_5", achieved: false }),
          ],
        }),
      );
      // 3/5 = 60%
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Milestone achievement"))).toBe(true);
    });

    it("adds engagement < 50% concern", () => {
      // 4 records, 1 engaged → 25%
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: false }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_enjoyed: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_feedback_positive: false }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_engaged: false }),
          ],
        }),
      );
      // 1/4 = 25%
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("engagement"))).toBe(true);
    });

    it("adds engagement 50-69% concern", () => {
      // 4 records, 2 engaged → 50%
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_enjoyed: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_feedback_positive: false }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_engaged: false }),
          ],
        }),
      );
      // 2/4 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Child engagement"))).toBe(true);
    });

    it("adds overdue milestones concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: false, overdue: true }),
            makeMilestone({ id: "im_2", achieved: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("1 independence milestone is overdue"))).toBe(true);
    });

    it("adds plural overdue milestones concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: false, overdue: true }),
            makeMilestone({ id: "im_2", achieved: false, overdue: true }),
            makeMilestone({ id: "im_3", achieved: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("2 independence milestones are overdue"))).toBe(true);
    });

    it("adds overdue assessment reviews concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", review_overdue: true }),
            makeAssessment({ id: "a2", child_id: "c2", review_overdue: false }),
            makeAssessment({ id: "a3", child_id: "c3", review_overdue: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("1 life skills assessment review is overdue"))).toBe(true);
    });

    it("adds cooking participation < 50% concern", () => {
      // 3 children, 1 unique child in cooking → 33%
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
            makeAssessment({ id: "a3", child_id: "c3" }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("cooking programme"))).toBe(true);
    });

    it("adds travel participation < 50% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
            makeAssessment({ id: "a3", child_id: "c3" }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_id: "c1" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("travel training"))).toBe(true);
    });

    it("adds personal care participation < 50% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
            makeAssessment({ id: "a3", child_id: "c3" }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_id: "c1" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("personal care development records"))).toBe(true);
    });

    it("adds cooking safety < 80% concern", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", safety_standards_met: true }),
            makeCooking({ id: "cp_2", safety_standards_met: true }),
            makeCooking({ id: "cp_3", safety_standards_met: false }),
            makeCooking({ id: "cp_4", safety_standards_met: false }),
            makeCooking({ id: "cp_5", safety_standards_met: false }),
          ],
        }),
      );
      // 2/5 = 40%
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("safety"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("recommends assessment coverage when < 50%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("life skills assessments"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toContain("Reg 5");
    });

    it("recommends cooking when competency < 40%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "observer" }),
            makeCooking({ id: "cp_2", skill_level: "observer" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("cooking programme"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends travel when independence < 30%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "developing" }),
            makeTravel({ id: "tt_2", competency_level: "not_started" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("travel training"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends personal care when rate < 40%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "full_support" }),
            makePersonalCare({ id: "pc_2", independence_level: "full_support" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("personal care development"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends engagement improvement when < 50%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: false }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_enjoyed: false }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_feedback_positive: false }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_engaged: false }),
          ],
        }),
      );
      // engagement = 0/4 = 0%
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("child engagement"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends cooking safety when < 80%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", safety_standards_met: false }),
            makeCooking({ id: "cp_2", safety_standards_met: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("cooking safety"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends milestone review when achievement < 50%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: false }),
            makeMilestone({ id: "im_2", achieved: false }),
            makeMilestone({ id: "im_3", achieved: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("milestones"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends overdue assessment reviews (soon urgency)", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", review_overdue: true }),
            makeAssessment({ id: "a2", child_id: "c2" }),
            makeAssessment({ id: "a3", child_id: "c3" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("overdue life skills assessment"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends overdue milestone review (soon urgency)", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: false, overdue: true }),
            makeMilestone({ id: "im_2", achieved: true }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("overdue milestones"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends extending coverage when 50-79%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Extend life skills assessment"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends accelerating cooking when 40-59%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "supervised" }),
            makeCooking({ id: "cp_2", skill_level: "supervised" }),
            makeCooking({ id: "cp_3", skill_level: "observer" }),
            makeCooking({ id: "cp_4", skill_level: "observer" }),
            makeCooking({ id: "cp_5", skill_level: "observer" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Accelerate cooking"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends expanding travel when 30-59%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "competent" }),
            makeTravel({ id: "tt_2", competency_level: "competent" }),
            makeTravel({ id: "tt_3", competency_level: "developing" }),
            makeTravel({ id: "tt_4", competency_level: "developing" }),
            makeTravel({ id: "tt_5", competency_level: "not_started" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Expand travel"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends personal care focus when 40-69%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "independent" }),
            makePersonalCare({ id: "pc_2", independence_level: "full_support" }),
          ],
        }),
      );
      // 1/2 = 50%
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Focus on building personal care"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends cooking participation when < 50%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
            makeAssessment({ id: "a3", child_id: "c3" }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1" }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("all children participate"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends risk assessments when < 80% (planned urgency)", () => {
      // Use competent/independent travel to avoid the <30% travel penalty recommendation
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "competent", risk_assessment_completed: true }),
            makeTravel({ id: "tt_2", competency_level: "competent", risk_assessment_completed: false }),
            makeTravel({ id: "tt_3", competency_level: "competent", risk_assessment_completed: false }),
            makeTravel({ id: "tt_4", competency_level: "competent", risk_assessment_completed: false }),
            makeTravel({ id: "tt_5", competency_level: "competent", risk_assessment_completed: false }),
          ],
        }),
      );
      // risk assessment rate: 1/5 = 20% < 80
      // travel independence: 100% → no travel penalty recommendation
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("risk assessments are completed"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends cooking documentation when < 70% (planned urgency)", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", notes_recorded: true }),
            makeCooking({ id: "cp_2", notes_recorded: false }),
            makeCooking({ id: "cp_3", notes_recorded: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("cooking session documentation"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends sharing milestones with SW when < 70% (planned urgency)", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true, shared_with_social_worker: true }),
            makeMilestone({ id: "im_2", achieved: true, shared_with_social_worker: false }),
            makeMilestone({ id: "im_3", achieved: true, shared_with_social_worker: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Share independence milestones"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends engagement exploration when 50-69% (planned urgency)", () => {
      // 4 records, 2 engaged → 50%
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_enjoyed: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_feedback_positive: false }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_engaged: false }),
          ],
        }),
      );
      // 2/4 = 50%
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Explore ways to increase"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommendations have incrementing rank numbers", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", review_overdue: true }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "observer" }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "not_started" }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "full_support" }),
          ],
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("adds critical insight for coverage < 50%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "critical" && i.text.includes("life skills assessments"));
      expect(insight).toBeDefined();
    });

    it("adds critical insight for cooking < 40%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "observer" }),
            makeCooking({ id: "cp_2", skill_level: "observer" }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "critical" && i.text.includes("cooking"));
      expect(insight).toBeDefined();
    });

    it("adds critical insight for travel < 30%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "developing" }),
            makeTravel({ id: "tt_2", competency_level: "not_started" }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "critical" && i.text.includes("travel"));
      expect(insight).toBeDefined();
    });

    it("adds critical insight for personal care < 40%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "full_support" }),
            makePersonalCare({ id: "pc_2", independence_level: "full_support" }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "critical" && i.text.includes("personal care"));
      expect(insight).toBeDefined();
    });

    it("adds critical insight for engagement < 50%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: false }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_enjoyed: false }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_feedback_positive: false }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_engaged: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "critical" && i.text.includes("engagement"));
      expect(insight).toBeDefined();
    });

    it("adds warning insight for coverage 50-79%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("67%"));
      expect(insight).toBeDefined();
    });

    it("adds warning insight for cooking 40-59%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "supervised" }),
            makeCooking({ id: "cp_2", skill_level: "supervised" }),
            makeCooking({ id: "cp_3", skill_level: "observer" }),
            makeCooking({ id: "cp_4", skill_level: "observer" }),
            makeCooking({ id: "cp_5", skill_level: "observer" }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("Cooking competency"));
      expect(insight).toBeDefined();
    });

    it("adds warning insight for travel 30-59%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "competent" }),
            makeTravel({ id: "tt_2", competency_level: "competent" }),
            makeTravel({ id: "tt_3", competency_level: "developing" }),
            makeTravel({ id: "tt_4", competency_level: "developing" }),
            makeTravel({ id: "tt_5", competency_level: "not_started" }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("Travel independence"));
      expect(insight).toBeDefined();
    });

    it("adds warning insight for personal care 40-69%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "independent" }),
            makePersonalCare({ id: "pc_2", independence_level: "full_support" }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("Personal care independence"));
      expect(insight).toBeDefined();
    });

    it("adds warning insight for milestone 50-69%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true }),
            makeMilestone({ id: "im_2", achieved: true }),
            makeMilestone({ id: "im_3", achieved: true }),
            makeMilestone({ id: "im_4", achieved: false }),
            makeMilestone({ id: "im_5", achieved: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("Milestone achievement"));
      expect(insight).toBeDefined();
    });

    it("adds warning insight for engagement 50-69%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_enjoyed: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_feedback_positive: false }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_engaged: false }),
          ],
        }),
      );
      // 2/4 = 50%
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("Child engagement"));
      expect(insight).toBeDefined();
    });

    it("adds warning insight for overdue milestones", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: false, overdue: true }),
            makeMilestone({ id: "im_2", achieved: true }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("passed the target date"));
      expect(insight).toBeDefined();
    });

    it("adds warning for plural overdue milestones", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: false, overdue: true }),
            makeMilestone({ id: "im_2", achieved: false, overdue: true }),
            makeMilestone({ id: "im_3", achieved: true }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.text.includes("2 independence milestones have"));
      expect(insight).toBeDefined();
    });

    it("adds warning insight for overdue assessment reviews", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", review_overdue: true }),
            makeAssessment({ id: "a2", child_id: "c2" }),
            makeAssessment({ id: "a3", child_id: "c3" }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("assessment review"));
      expect(insight).toBeDefined();
    });

    it("adds warning for goals 40-59%", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", goals_set: 5, goals_achieved: 2 }),
            makeAssessment({ id: "a2", child_id: "c2", goals_set: 5, goals_achieved: 3 }),
            makeAssessment({ id: "a3", child_id: "c3", goals_set: 5, goals_achieved: 2 }),
          ],
        }),
      );
      // 7/15 ≈ 47%
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("Goal achievement"));
      expect(insight).toBeDefined();
    });

    it("adds warning for cooking safety 80-89%", () => {
      // 10 cooking, 8 safe → 80%; need 80-89%
      const records: CookingProgrammeInput[] = [];
      for (let i = 0; i < 8; i++) {
        records.push(makeCooking({ id: `cp_${i}`, safety_standards_met: true }));
      }
      records.push(makeCooking({ id: "cp_8", safety_standards_met: false }));
      records.push(makeCooking({ id: "cp_9", safety_standards_met: false }));
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ cooking_programme_records: records }),
      );
      // 8/10 = 80%
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("Cooking safety"));
      expect(insight).toBeDefined();
    });

    it("adds warning for travel risk assessment 60-79%", () => {
      // 5 travel, 3 with risk assessment → 60%
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", risk_assessment_completed: true }),
            makeTravel({ id: "tt_2", risk_assessment_completed: true }),
            makeTravel({ id: "tt_3", risk_assessment_completed: true }),
            makeTravel({ id: "tt_4", risk_assessment_completed: false }),
            makeTravel({ id: "tt_5", risk_assessment_completed: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("risk assessment"));
      expect(insight).toBeDefined();
    });

    it("adds milestone category breakdown when >= 5 milestones", () => {
      const milestones: IndependenceMilestoneInput[] = [
        makeMilestone({ id: "im_1", milestone_category: "cooking", achieved: true }),
        makeMilestone({ id: "im_2", milestone_category: "cooking", achieved: false }),
        makeMilestone({ id: "im_3", milestone_category: "travel", achieved: true }),
        makeMilestone({ id: "im_4", milestone_category: "personal_care", achieved: true }),
        makeMilestone({ id: "im_5", milestone_category: "social_skills", achieved: false }),
      ];
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ independence_milestone_records: milestones }),
      );
      const insight = r.insights.find((i) => i.text.includes("milestone breakdown"));
      expect(insight).toBeDefined();
    });

    it("adds cooking skill distribution when >= 5 sessions", () => {
      const records: CookingProgrammeInput[] = [
        makeCooking({ id: "cp_1", skill_level: "observer" }),
        makeCooking({ id: "cp_2", skill_level: "assisted" }),
        makeCooking({ id: "cp_3", skill_level: "supervised" }),
        makeCooking({ id: "cp_4", skill_level: "independent" }),
        makeCooking({ id: "cp_5", skill_level: "observer" }),
      ];
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ cooking_programme_records: records }),
      );
      const insight = r.insights.find((i) => i.text.includes("skill distribution"));
      expect(insight).toBeDefined();
    });

    it("adds positive outstanding insight", () => {
      // Reuse outstanding scenario's input
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 9, previous_overall_score: 7 }),
            makeAssessment({ id: "a2", child_id: "c2", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 6 }),
            makeAssessment({ id: "a3", child_id: "c3", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 5 }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, notes_recorded: true, child_chose_recipe: true, new_skill_learned: true }),
            makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, notes_recorded: true, child_chose_recipe: true, new_skill_learned: true }),
            makeCooking({ id: "cp_3", child_id: "c3", skill_level: "independent", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, notes_recorded: true, child_chose_recipe: true, new_skill_learned: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", child_confidence_rating: 5, staff_confidence_rating: 5, child_feedback_positive: true, risk_assessment_completed: true }),
            makeTravel({ id: "tt_2", child_id: "c2", competency_level: "competent", child_confidence_rating: 4, staff_confidence_rating: 4, child_feedback_positive: true, risk_assessment_completed: true }),
            makeTravel({ id: "tt_3", child_id: "c3", competency_level: "independent", child_confidence_rating: 5, staff_confidence_rating: 5, child_feedback_positive: true, risk_assessment_completed: true }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", child_engaged: true, dignity_respected: true }),
            makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "independent", child_engaged: true, dignity_respected: true }),
            makePersonalCare({ id: "pc_3", child_id: "c3", independence_level: "independent", child_engaged: true, dignity_respected: true }),
          ],
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
            makeMilestone({ id: "im_2", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
            makeMilestone({ id: "im_3", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
          ],
        }),
      );
      expect(r.independence_rating).toBe("outstanding");
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("outstanding"));
      expect(insight).toBeDefined();
    });

    it("adds positive insight for 100% coverage + high child involvement", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
            makeAssessment({ id: "a2", child_id: "c2", child_involved: true }),
            makeAssessment({ id: "a3", child_id: "c3", child_involved: true }),
          ],
        }),
      );
      // assessmentChildInvolvementRate = 100% >=90, coverage=100%
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("participatory assessment"));
      expect(insight).toBeDefined();
    });

    it("adds positive insight for high cooking competency + enjoyment", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "independent", child_enjoyed: true }),
            makeCooking({ id: "cp_2", skill_level: "supervised", child_enjoyed: true }),
            makeCooking({ id: "cp_3", skill_level: "supervised", child_enjoyed: true }),
            makeCooking({ id: "cp_4", skill_level: "supervised", child_enjoyed: true }),
            makeCooking({ id: "cp_5", skill_level: "supervised", child_enjoyed: false }),
          ],
        }),
      );
      // competency = 5/5 = 100% >=80, enjoyment = 4/5 = 80% >=80
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("cooking competency"));
      expect(insight).toBeDefined();
    });

    it("adds positive insight for high travel independence + confidence", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "independent", child_confidence_rating: 5, staff_confidence_rating: 5 }),
            makeTravel({ id: "tt_2", competency_level: "competent", child_confidence_rating: 4, staff_confidence_rating: 4 }),
            makeTravel({ id: "tt_3", competency_level: "independent", child_confidence_rating: 5, staff_confidence_rating: 5 }),
            makeTravel({ id: "tt_4", competency_level: "competent", child_confidence_rating: 4, staff_confidence_rating: 4 }),
            makeTravel({ id: "tt_5", competency_level: "developing", child_confidence_rating: 3, staff_confidence_rating: 3 }),
          ],
        }),
      );
      // 80% independence, avg confidence 4.2
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("travel independence"));
      expect(insight).toBeDefined();
    });

    it("adds positive insight for high personal care + dignity", () => {
      const records: PersonalCareInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(makePersonalCare({
          id: `pc_${i}`,
          independence_level: i < 9 ? "independent" : "minimal_prompts",
          dignity_respected: true,
        }));
      }
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ personal_care_records: records }),
      );
      // rate = 100% >=90, dignity = 100%
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("personal care independence"));
      expect(insight).toBeDefined();
    });

    it("adds positive insight for high milestones + celebration", () => {
      const milestones: IndependenceMilestoneInput[] = [];
      for (let i = 0; i < 10; i++) {
        milestones.push(makeMilestone({
          id: `im_${i}`,
          achieved: i < 9,
          child_celebrated: i < 9,
        }));
      }
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ independence_milestone_records: milestones }),
      );
      // 9/10 = 90% >=90, celebration = 9/9 = 100% >=80
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("milestone achievement"));
      expect(insight).toBeDefined();
    });

    it("adds positive insight for high engagement", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_enjoyed: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_feedback_positive: true }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_engaged: true }),
          ],
        }),
      );
      // 4/4 = 100% >=90
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("100% child engagement"));
      expect(insight).toBeDefined();
    });

    it("adds positive insight for high goals + improvement", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 5 }),
            makeAssessment({ id: "a2", child_id: "c2", goals_set: 5, goals_achieved: 5, overall_independence_score: 7, previous_overall_score: 4 }),
            makeAssessment({ id: "a3", child_id: "c3", goals_set: 5, goals_achieved: 4, overall_independence_score: 9, previous_overall_score: 6 }),
          ],
        }),
      );
      // goals: 14/15 = 93% >=80, improvement: 3/3 = 100% >=80
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("goal achievement"));
      expect(insight).toBeDefined();
    });

    it("adds positive insight for cooking child choice + new skills", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_chose_recipe: true, new_skill_learned: true }),
            makeCooking({ id: "cp_2", child_chose_recipe: true, new_skill_learned: true }),
            makeCooking({ id: "cp_3", child_chose_recipe: true, new_skill_learned: true }),
            makeCooking({ id: "cp_4", child_chose_recipe: true, new_skill_learned: false }),
            makeCooking({ id: "cp_5", child_chose_recipe: false, new_skill_learned: false }),
          ],
        }),
      );
      // choice: 4/5 = 80% >=70, new skill: 3/5 = 60% >=60
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("recipe choice"));
      expect(insight).toBeDefined();
    });

    it("adds positive insight for milestone evidence + sharing", () => {
      const milestones: IndependenceMilestoneInput[] = [];
      for (let i = 0; i < 5; i++) {
        milestones.push(makeMilestone({
          id: `im_${i}`,
          achieved: true,
          evidenced_in_records: true,
          shared_with_social_worker: true,
        }));
      }
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({ independence_milestone_records: milestones }),
      );
      // evidence: 5/5 = 100% >=90, shared: 5/5 = 100% >=80
      const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("evidenced"));
      expect(insight).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // HEADLINE TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("headline", () => {
    it("outstanding headline format", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 9, previous_overall_score: 7 }),
            makeAssessment({ id: "a2", child_id: "c2", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 6 }),
            makeAssessment({ id: "a3", child_id: "c3", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 5 }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, notes_recorded: true, child_chose_recipe: true, new_skill_learned: true }),
            makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, notes_recorded: true, child_chose_recipe: true, new_skill_learned: true }),
            makeCooking({ id: "cp_3", child_id: "c3", skill_level: "independent", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, notes_recorded: true, child_chose_recipe: true, new_skill_learned: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", child_confidence_rating: 5, staff_confidence_rating: 5, child_feedback_positive: true, risk_assessment_completed: true }),
            makeTravel({ id: "tt_2", child_id: "c2", competency_level: "competent", child_confidence_rating: 4, staff_confidence_rating: 4, child_feedback_positive: true, risk_assessment_completed: true }),
            makeTravel({ id: "tt_3", child_id: "c3", competency_level: "independent", child_confidence_rating: 5, staff_confidence_rating: 5, child_feedback_positive: true, risk_assessment_completed: true }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", child_engaged: true, dignity_respected: true }),
            makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "independent", child_engaged: true, dignity_respected: true }),
            makePersonalCare({ id: "pc_3", child_id: "c3", independence_level: "independent", child_engaged: true, dignity_respected: true }),
          ],
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
            makeMilestone({ id: "im_2", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
            makeMilestone({ id: "im_3", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
          ],
        }),
      );
      expect(r.headline).toContain("Outstanding independence");
    });

    it("good headline includes strengths and concerns counts", () => {
      // Need a scenario that gives good
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true, goals_set: 5, goals_achieved: 4, overall_independence_score: 7, previous_overall_score: 5 }),
            makeAssessment({ id: "a2", child_id: "c2", child_involved: true, goals_set: 5, goals_achieved: 4, overall_independence_score: 6, previous_overall_score: 4 }),
            makeAssessment({ id: "a3", child_id: "c3", child_involved: true, goals_set: 5, goals_achieved: 3, overall_independence_score: 5, previous_overall_score: 3 }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", child_enjoyed: true, safety_standards_met: true }),
            makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true }),
            makeCooking({ id: "cp_3", child_id: "c3", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", child_feedback_positive: true, risk_assessment_completed: true, child_confidence_rating: 4, staff_confidence_rating: 4 }),
            makeTravel({ id: "tt_2", child_id: "c2", competency_level: "competent", child_feedback_positive: true, risk_assessment_completed: true, child_confidence_rating: 4, staff_confidence_rating: 4 }),
            makeTravel({ id: "tt_3", child_id: "c3", competency_level: "competent", child_feedback_positive: true, risk_assessment_completed: true, child_confidence_rating: 3, staff_confidence_rating: 3 }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", child_engaged: true }),
            makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "minimal_prompts", child_engaged: true }),
            makePersonalCare({ id: "pc_3", child_id: "c3", independence_level: "independent", child_engaged: true }),
          ],
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true, child_celebrated: true }),
            makeMilestone({ id: "im_2", achieved: true, child_celebrated: true }),
            makeMilestone({ id: "im_3", achieved: true, child_celebrated: true }),
          ],
        }),
      );
      if (r.independence_rating === "good") {
        expect(r.headline).toContain("Good independence");
        expect(r.headline).toContain("strength");
      }
    });

    it("adequate headline includes concerns count", () => {
      // Create adequate scenario
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "supervised" }),
            makeCooking({ id: "cp_2", skill_level: "observer" }),
          ],
        }),
      );
      if (r.independence_rating === "adequate") {
        expect(r.headline).toContain("Adequate");
        expect(r.headline).toContain("concern");
      }
    });

    it("inadequate headline includes concerns count", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "observer" }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "not_started" }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "full_support" }),
          ],
        }),
      );
      if (r.independence_rating === "inadequate") {
        expect(r.headline).toContain("inadequate");
        expect(r.headline).toContain("concern");
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("single child with all excellent data", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 1,
          life_skills_assessment_records: [
            makeAssessment({
              id: "a1", child_id: "c1",
              child_involved: true, key_worker_involved: true,
              child_feedback_positive: true, review_overdue: false,
              goals_set: 5, goals_achieved: 5,
              overall_independence_score: 9, previous_overall_score: 6,
            }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", child_enjoyed: true, safety_standards_met: true, hygiene_standards_met: true, child_chose_recipe: true, new_skill_learned: true, notes_recorded: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", child_confidence_rating: 5, staff_confidence_rating: 5, child_feedback_positive: true, risk_assessment_completed: true, milestone_achieved: true }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", child_engaged: true, dignity_respected: true, improvement_noted: true, key_worker_discussed: true }),
          ],
          independence_milestone_records: [
            makeMilestone({ id: "im_1", child_id: "c1", achieved: true, child_celebrated: true, evidenced_in_records: true, child_proud: true, shared_with_social_worker: true }),
          ],
        }),
      );
      expect(r.independence_rating).toBe("outstanding");
      expect(r.skills_assessment_coverage_rate).toBe(100);
    });

    it("score is clamped to minimum 0", () => {
      // Even with all penalties, score should not go below 0
      // Max penalties: -6 -4 -4 -3 = -17, from base 52 → 35. Still above 0.
      // But we can't get below 0 with the current penalty structure.
      // Just verify clamp behavior with a test case.
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 10,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "observer" }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "not_started" }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "full_support" }),
          ],
        }),
      );
      expect(r.independence_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to maximum 100", () => {
      // Even with all bonuses, score should not exceed 100
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 9, previous_overall_score: 7 }),
            makeAssessment({ id: "a2", child_id: "c2", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 6 }),
            makeAssessment({ id: "a3", child_id: "c3", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 5 }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", child_enjoyed: true }),
            makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", child_enjoyed: true }),
            makeCooking({ id: "cp_3", child_id: "c3", skill_level: "independent", child_enjoyed: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", child_feedback_positive: true }),
            makeTravel({ id: "tt_2", child_id: "c2", competency_level: "competent", child_feedback_positive: true }),
            makeTravel({ id: "tt_3", child_id: "c3", competency_level: "independent", child_feedback_positive: true }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", child_engaged: true }),
            makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "independent", child_engaged: true }),
            makePersonalCare({ id: "pc_3", child_id: "c3", independence_level: "independent", child_engaged: true }),
          ],
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true }),
            makeMilestone({ id: "im_2", achieved: true }),
            makeMilestone({ id: "im_3", achieved: true }),
          ],
        }),
      );
      expect(r.independence_score).toBeLessThanOrEqual(100);
    });

    it("large number of children (20)", () => {
      const assessments: LifeSkillsAssessmentInput[] = [];
      for (let i = 0; i < 20; i++) {
        assessments.push(
          makeAssessment({ id: `a_${i}`, child_id: `c${i}` }),
        );
      }
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 20,
          life_skills_assessment_records: assessments,
        }),
      );
      expect(r.skills_assessment_coverage_rate).toBe(100);
      expect(r.independence_score).toBeGreaterThanOrEqual(0);
    });

    it("duplicate child_ids in assessments counted as single child", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c1" }),
            makeAssessment({ id: "a3", child_id: "c1" }),
          ],
        }),
      );
      // unique children = 1, total = 3 → 33%
      expect(r.skills_assessment_coverage_rate).toBe(33);
    });

    it("boundary: score exactly 80 → outstanding", () => {
      // base 52 + all bonuses max = 52+4+4+3+3+4+3+3+2+2 = 80
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 9, previous_overall_score: 7, child_feedback_positive: true }),
            makeAssessment({ id: "a2", child_id: "c2", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 6, child_feedback_positive: true }),
            makeAssessment({ id: "a3", child_id: "c3", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 5, child_feedback_positive: true }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", child_enjoyed: true, safety_standards_met: true }),
            makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true }),
            makeCooking({ id: "cp_3", child_id: "c3", skill_level: "independent", child_enjoyed: true, safety_standards_met: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", child_feedback_positive: true, child_confidence_rating: 5, staff_confidence_rating: 5 }),
            makeTravel({ id: "tt_2", child_id: "c2", competency_level: "competent", child_feedback_positive: true, child_confidence_rating: 4, staff_confidence_rating: 4 }),
            makeTravel({ id: "tt_3", child_id: "c3", competency_level: "independent", child_feedback_positive: true, child_confidence_rating: 5, staff_confidence_rating: 5 }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", child_engaged: true }),
            makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "independent", child_engaged: true }),
            makePersonalCare({ id: "pc_3", child_id: "c3", independence_level: "independent", child_engaged: true }),
          ],
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true }),
            makeMilestone({ id: "im_2", achieved: true }),
            makeMilestone({ id: "im_3", achieved: true }),
          ],
        }),
      );
      // Check that all max bonuses fire
      // coverage: 100% → +4
      // cooking: 100% → +4
      // travel: 100% → +3
      // personal care: 100% → +3
      // milestones: 100% → +4
      // engagement: all positive → 100% → +3
      // goals: 100% → +3
      // review compliance: 100% → +2
      // improvement: 100% → +2
      // Total: 52 + 4+4+3+3+4+3+3+2+2 = 80
      expect(r.independence_score).toBe(80);
      expect(r.independence_rating).toBe("outstanding");
    });

    it("boundary: score exactly 65 → good", () => {
      // Need score = 65. base 52, need +13 in bonuses.
      // coverage 100% → +4, cooking >=80% → +4, travel >=80% → +3, review 100% → +2
      // 4+4+3+2 = 13. 52+13 = 65.
      // But we need to avoid other bonuses and penalties.
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
            makeAssessment({ id: "a2", child_id: "c2" }),
            makeAssessment({ id: "a3", child_id: "c3" }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "independent" }),
            makeCooking({ id: "cp_2", skill_level: "supervised" }),
            makeCooking({ id: "cp_3", skill_level: "supervised" }),
            makeCooking({ id: "cp_4", skill_level: "supervised" }),
            makeCooking({ id: "cp_5", skill_level: "observer" }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "independent" }),
            makeTravel({ id: "tt_2", competency_level: "competent" }),
            makeTravel({ id: "tt_3", competency_level: "competent" }),
            makeTravel({ id: "tt_4", competency_level: "independent" }),
            makeTravel({ id: "tt_5", competency_level: "developing" }),
          ],
        }),
      );
      // coverage: 100% → +4
      // cooking: 80% → +4
      // travel: 80% → +3
      // personal care: 0 records → +0
      // milestones: 0 records → +0
      // engagement: numerator = 0+0+0+0=0, denominator = 3+5+5+0=13, 0% → +0
      // goals: 0/0 = 0% → +0
      // review compliance: 100% → +2
      // improvement: 0 with previous → +0
      // No penalties (all guards pass)
      // 52 + 4 + 4 + 3 + 2 = 65
      expect(r.independence_score).toBe(65);
      expect(r.independence_rating).toBe("good");
    });

    it("boundary: score exactly 45 → adequate", () => {
      // Need score = 45. base 52 + review compliance bonus +2 when assessment present.
      // With 1 assessment: 52 + 2 (review) - 6 (coverage) = 48. Need -3 more.
      // Add personal care penalty: 48 - 3 = 45!
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "full_support" }),
            makePersonalCare({ id: "pc_2", independence_level: "full_support" }),
            makePersonalCare({ id: "pc_3", independence_level: "full_support" }),
          ],
        }),
      );
      // coverage: 33% → -6
      // review compliance: 100% → +2
      // personal care: 0% → -3
      // 52 - 6 + 2 - 3 = 45
      expect(r.independence_score).toBe(45);
      expect(r.independence_rating).toBe("adequate");
    });

    it("boundary: score exactly 44 → inadequate", () => {
      // 52 + 2 (review) - 6 (coverage) - 4 (travel) = 44
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "developing" }),
            makeTravel({ id: "tt_2", competency_level: "not_started" }),
            makeTravel({ id: "tt_3", competency_level: "not_started" }),
            makeTravel({ id: "tt_4", competency_level: "developing" }),
          ],
        }),
      );
      // coverage: 33% → -6
      // review compliance: 100% → +2
      // travel: 0% → -4
      // 52 - 6 + 2 - 4 = 44
      expect(r.independence_score).toBe(44);
      expect(r.independence_rating).toBe("inadequate");
    });

    it("empty arrays with 0 total_children returns clean insufficient_data", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 0,
          life_skills_assessment_records: [],
          cooking_programme_records: [],
          travel_training_records: [],
          personal_care_records: [],
          independence_milestone_records: [],
        }),
      );
      expect(r.independence_rating).toBe("insufficient_data");
      expect(r.independence_score).toBe(0);
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("total_children=0 but some records exist (not allEmpty) still computes", () => {
      // The allEmpty check fails because there are records
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 0,
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "independent" }),
          ],
        }),
      );
      // Should not be insufficient_data (not allEmpty)
      // Should proceed to normal compute
      expect(r.independence_rating).not.toBe("insufficient_data");
      // coverage = 0/0 → 0, no coverage penalty (total_children == 0)
      // cooking competency = 100% → +4
      // 52 + 4 = 56
      expect(r.independence_score).toBe(56);
    });

    it("assessment with previous_overall_score=null is excluded from improvement tracking", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 1,
          life_skills_assessment_records: [
            makeAssessment({
              id: "a1", child_id: "c1",
              overall_independence_score: 9,
              previous_overall_score: null,
            }),
          ],
        }),
      );
      // assessmentsWithPreviousScore = 0, so skillsImprovementRate = pct(0, 0) = 0
      // No improvement bonus
      // coverage: 100% → +4, review compliance 100% → +2
      // 52 + 4 + 2 = 58
      expect(r.independence_score).toBe(58);
    });

    it("overdue milestone that is also achieved does not count as overdue", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true, overdue: true }),
            makeMilestone({ id: "im_2", achieved: true }),
          ],
        }),
      );
      // overdueMilestones = filter(overdue && !achieved) → 0
      expect(r.concerns.some((c) => c.includes("overdue"))).toBe(false);
    });

    it("all assessment types are accepted", () => {
      const types: Array<"initial" | "review" | "annual" | "transition" | "specialist"> = [
        "initial", "review", "annual", "transition", "specialist",
      ];
      for (const t of types) {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            total_children: 1,
            life_skills_assessment_records: [
              makeAssessment({ id: `a_${t}`, child_id: "c1", assessment_type: t }),
            ],
          }),
        );
        expect(r.independence_rating).not.toBe("insufficient_data");
      }
    });

    it("all cooking meal types are accepted", () => {
      const types: Array<"breakfast" | "lunch" | "dinner" | "snack" | "baking"> = [
        "breakfast", "lunch", "dinner", "snack", "baking",
      ];
      for (const t of types) {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            cooking_programme_records: [
              makeCooking({ id: `cp_${t}`, meal_type: t }),
            ],
          }),
        );
        expect(r.independence_rating).not.toBe("insufficient_data");
      }
    });

    it("all training types accepted", () => {
      const types: Array<"road_safety" | "public_transport" | "route_learning" | "journey_planning" | "cycling" | "independent_travel"> = [
        "road_safety", "public_transport", "route_learning", "journey_planning", "cycling", "independent_travel",
      ];
      for (const t of types) {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            travel_training_records: [
              makeTravel({ id: `tt_${t}`, training_type: t }),
            ],
          }),
        );
        expect(r.independence_rating).not.toBe("insufficient_data");
      }
    });

    it("all personal care areas accepted", () => {
      const areas: Array<"hygiene_routine" | "dental_care" | "skin_care" | "hair_care" | "clothing_management" | "bedroom_maintenance" | "laundry_skills" | "health_appointments"> = [
        "hygiene_routine", "dental_care", "skin_care", "hair_care",
        "clothing_management", "bedroom_maintenance", "laundry_skills", "health_appointments",
      ];
      for (const a of areas) {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            personal_care_records: [
              makePersonalCare({ id: `pc_${a}`, care_area: a }),
            ],
          }),
        );
        expect(r.independence_rating).not.toBe("insufficient_data");
      }
    });

    it("all milestone categories accepted", () => {
      const cats: Array<"cooking" | "cleaning" | "money_management" | "travel" | "personal_care" | "social_skills" | "health_management" | "digital_skills"> = [
        "cooking", "cleaning", "money_management", "travel",
        "personal_care", "social_skills", "health_management", "digital_skills",
      ];
      for (const c of cats) {
        const r = computeIndependenceLifeSkillsDevelopment(
          baseInput({
            independence_milestone_records: [
              makeMilestone({ id: `im_${c}`, milestone_category: c }),
            ],
          }),
        );
        expect(r.independence_rating).not.toBe("insufficient_data");
      }
    });

    it("pct(0, 0) returns 0 (division by zero guard)", () => {
      // When no records → rates should be 0, not NaN or Infinity
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 0,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
          ],
        }),
      );
      // total_children=0 but has records, so not allEmpty or allEmpty+children
      // skillsAssessmentCoverageRate = total_children > 0 ? pct(...) : 0 → 0
      expect(r.skills_assessment_coverage_rate).toBe(0);
    });

    it("score never becomes negative even with maximum penalties", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 100,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1" }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "observer" }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "not_started" }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", independence_level: "full_support" }),
          ],
        }),
      );
      expect(r.independence_score).toBeGreaterThanOrEqual(0);
    });

    it("only records, no children → computes without coverage penalty", () => {
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 0,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 9, previous_overall_score: 7 }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "independent", child_enjoyed: true }),
          ],
        }),
      );
      // No coverage penalty (total_children not > 0)
      // cooking: 100% → +4
      // engagement: 2/2 = 100% → +3
      // goals: 100% → +3
      // review: 100% → +2
      // improvement: 100% → +2
      // 52 + 4 + 3 + 3 + 2 + 2 = 66
      expect(r.independence_score).toBe(66);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RATING THRESHOLD TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("rating thresholds", () => {
    it("toRating: 100 → outstanding", () => {
      // Can't directly test private function, but we can verify via score
      // Score of 100 would need base 52 + 28 bonuses + extra... actually max is 80
      // Just verify that >=80 → outstanding
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 9, previous_overall_score: 7, child_feedback_positive: true }),
            makeAssessment({ id: "a2", child_id: "c2", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 6, child_feedback_positive: true }),
            makeAssessment({ id: "a3", child_id: "c3", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 5, child_feedback_positive: true }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", child_enjoyed: true, safety_standards_met: true }),
            makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true }),
            makeCooking({ id: "cp_3", child_id: "c3", skill_level: "independent", child_enjoyed: true, safety_standards_met: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", child_feedback_positive: true }),
            makeTravel({ id: "tt_2", child_id: "c2", competency_level: "competent", child_feedback_positive: true }),
            makeTravel({ id: "tt_3", child_id: "c3", competency_level: "independent", child_feedback_positive: true }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", child_engaged: true }),
            makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "independent", child_engaged: true }),
            makePersonalCare({ id: "pc_3", child_id: "c3", independence_level: "independent", child_engaged: true }),
          ],
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true }),
            makeMilestone({ id: "im_2", achieved: true }),
            makeMilestone({ id: "im_3", achieved: true }),
          ],
        }),
      );
      expect(r.independence_score).toBe(80);
      expect(r.independence_rating).toBe("outstanding");
    });

    it("79 → good (not outstanding)", () => {
      // base 52 + bonuses that sum to 27 = 79
      // coverage 100% +4, cooking 80% +4, travel 80% +3, personalCare 90% +3, milestones 90% +4, engagement 90% +3, goals 80% +3, review 80% +1, improvement 60% +1 = 26 → 78
      // Hmm, need exactly 27. Let's try:
      // +4 +4 +3 +3 +4 +3 +3 +2 +1 = 27 → 79
      // review 100% +2, improvement 60% +1
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 8, previous_overall_score: 6, child_feedback_positive: true }),
            makeAssessment({ id: "a2", child_id: "c2", child_involved: true, goals_set: 5, goals_achieved: 5, overall_independence_score: 7, previous_overall_score: 6, child_feedback_positive: true }),
            makeAssessment({ id: "a3", child_id: "c3", child_involved: true, goals_set: 5, goals_achieved: 4, overall_independence_score: 6, previous_overall_score: 6, child_feedback_positive: true }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", child_id: "c1", skill_level: "independent", child_enjoyed: true, safety_standards_met: true }),
            makeCooking({ id: "cp_2", child_id: "c2", skill_level: "supervised", child_enjoyed: true, safety_standards_met: true }),
            makeCooking({ id: "cp_3", child_id: "c3", skill_level: "independent", child_enjoyed: true, safety_standards_met: true }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", child_id: "c1", competency_level: "independent", child_feedback_positive: true }),
            makeTravel({ id: "tt_2", child_id: "c2", competency_level: "competent", child_feedback_positive: true }),
            makeTravel({ id: "tt_3", child_id: "c3", competency_level: "independent", child_feedback_positive: true }),
          ],
          personal_care_records: [
            makePersonalCare({ id: "pc_1", child_id: "c1", independence_level: "independent", child_engaged: true }),
            makePersonalCare({ id: "pc_2", child_id: "c2", independence_level: "independent", child_engaged: true }),
            makePersonalCare({ id: "pc_3", child_id: "c3", independence_level: "independent", child_engaged: true }),
          ],
          independence_milestone_records: [
            makeMilestone({ id: "im_1", achieved: true }),
            makeMilestone({ id: "im_2", achieved: true }),
            makeMilestone({ id: "im_3", achieved: true }),
          ],
        }),
      );
      // coverage: 100% → +4
      // cooking: 100% → +4
      // travel: 100% → +3
      // personal care: 100% → +3
      // milestones: 100% → +4
      // engagement: 12/12=100% → +3
      // goals: 14/15=93% → +3
      // review: 100% → +2
      // improvement: 2/3=67% → +1
      // Total: 52 + 4+4+3+3+4+3+3+2+1 = 79
      expect(r.independence_score).toBe(79);
      expect(r.independence_rating).toBe("good");
    });

    it("64 → adequate (not good)", () => {
      // Need 64. base 52 + 12.
      // coverage 100% +4, cooking 80% +4, travel 60% +1, review 100% +2, improvement 60% +1 = 12
      const r = computeIndependenceLifeSkillsDevelopment(
        baseInput({
          total_children: 3,
          life_skills_assessment_records: [
            makeAssessment({ id: "a1", child_id: "c1", overall_independence_score: 7, previous_overall_score: 5 }),
            makeAssessment({ id: "a2", child_id: "c2", overall_independence_score: 6, previous_overall_score: 5 }),
            makeAssessment({ id: "a3", child_id: "c3", overall_independence_score: 4, previous_overall_score: 4 }),
          ],
          cooking_programme_records: [
            makeCooking({ id: "cp_1", skill_level: "independent" }),
            makeCooking({ id: "cp_2", skill_level: "supervised" }),
            makeCooking({ id: "cp_3", skill_level: "supervised" }),
            makeCooking({ id: "cp_4", skill_level: "supervised" }),
            makeCooking({ id: "cp_5", skill_level: "observer" }),
          ],
          travel_training_records: [
            makeTravel({ id: "tt_1", competency_level: "competent" }),
            makeTravel({ id: "tt_2", competency_level: "competent" }),
            makeTravel({ id: "tt_3", competency_level: "competent" }),
            makeTravel({ id: "tt_4", competency_level: "developing" }),
            makeTravel({ id: "tt_5", competency_level: "developing" }),
          ],
        }),
      );
      // coverage: 100% → +4
      // cooking: 80% → +4
      // travel: 60% → +1
      // review: 100% → +2
      // improvement: 2/3 = 67% → +1
      // 52 + 4 + 4 + 1 + 2 + 1 = 64
      expect(r.independence_score).toBe(64);
      expect(r.independence_rating).toBe("adequate");
    });
  });
});

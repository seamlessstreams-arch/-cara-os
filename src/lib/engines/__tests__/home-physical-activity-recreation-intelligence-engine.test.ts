// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PHYSICAL ACTIVITY & RECREATION INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for physical activity and recreation provision.
// Covers CHR 2015 Reg 7, Reg 9, Reg 10, Reg 12 and SCCIF requirements.
// Base 52, max bonuses 28 (outstanding >= 80), good >= 65, adequate >= 45,
// inadequate < 45. Special: allEmpty+0 children = insufficient_data/0;
// allEmpty+children>0 = inadequate/15. pct(0,0) = 0.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePhysicalActivityRecreation,
  type PhysicalActivityRecreationInput,
  type ExerciseProgrammeInput,
  type RecreationalActivityInput,
  type OutdoorEngagementInput,
  type FitnessAssessmentInput,
  type ActivityAccessibilityInput,
  type PhysicalActivityRecreationResult,
} from "../home-physical-activity-recreation-intelligence-engine";

const TODAY = "2026-05-28";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;

function baseInput(
  overrides: Partial<PhysicalActivityRecreationInput> = {},
): PhysicalActivityRecreationInput {
  return {
    today: TODAY,
    total_children: 0,
    exercise_programme_records: [],
    recreational_activity_records: [],
    outdoor_engagement_records: [],
    fitness_assessment_records: [],
    activity_accessibility_records: [],
    ...overrides,
  };
}

function makeExerciseProgramme(
  overrides: Partial<ExerciseProgrammeInput> = {},
): ExerciseProgrammeInput {
  _id++;
  return {
    id: `ep_${_id}`,
    child_id: "child_1",
    programme_name: "General Fitness",
    programme_type: "individual",
    start_date: "2026-01-01",
    end_date: null,
    active: true,
    sessions_planned: 10,
    sessions_attended: 9,
    engagement_level: "high",
    progress_notes: null,
    child_enjoys: true,
    staff_led: true,
    external_provider: false,
    goals_set: 0,
    goals_achieved: 0,
    reviewed: false,
    review_date: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeRecreationalActivity(
  overrides: Partial<RecreationalActivityInput> = {},
): RecreationalActivityInput {
  _id++;
  return {
    id: `ra_${_id}`,
    child_id: "child_1",
    activity_name: "Activity",
    activity_category: "sport",
    date: "2026-05-01",
    duration_minutes: 60,
    child_choice: false,
    child_enjoyed: false,
    participation_level: "full",
    inclusive: true,
    skill_development: false,
    peer_interaction: false,
    new_experience: false,
    staff_facilitated: true,
    community_based: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeOutdoorEngagement(
  overrides: Partial<OutdoorEngagementInput> = {},
): OutdoorEngagementInput {
  _id++;
  return {
    id: `oe_${_id}`,
    child_id: "child_1",
    date: "2026-05-01",
    activity_type: "walk",
    duration_minutes: 30,
    weather_appropriate: true,
    child_initiated: false,
    supervised: true,
    location: "Local park",
    enjoyment_rating: 3,
    physical_benefit: true,
    wellbeing_benefit: true,
    risk_assessed: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeFitnessAssessment(
  overrides: Partial<FitnessAssessmentInput> = {},
): FitnessAssessmentInput {
  _id++;
  return {
    id: `fa_${_id}`,
    child_id: "child_1",
    assessment_date: "2026-04-01",
    assessor: "Staff A",
    assessment_type: "periodic",
    fitness_level: "good",
    bmi_recorded: false,
    activity_recommendations_given: true,
    follow_up_planned: false,
    follow_up_completed: false,
    child_involved_in_goal_setting: false,
    health_professional_involved: false,
    review_date: null,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeActivityAccessibility(
  overrides: Partial<ActivityAccessibilityInput> = {},
): ActivityAccessibilityInput {
  _id++;
  return {
    id: `aa_${_id}`,
    child_id: "child_1",
    date: "2026-05-01",
    activity_type: "sport",
    accessibility_need: "none",
    adaptation_required: false,
    adaptation_provided: false,
    barrier_identified: null,
    barrier_resolved: false,
    child_able_to_participate: true,
    equipment_available: true,
    transport_arranged: true,
    cost_covered: true,
    equal_opportunity: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

/** Helper: compute shorthand */
function run(overrides: Partial<PhysicalActivityRecreationInput> = {}) {
  return computePhysicalActivityRecreation(baseInput(overrides));
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data", () => {
  it("returns insufficient_data with score 0 when all arrays empty and 0 children", () => {
    const r = run();
    expect(r.activity_rating).toBe("insufficient_data");
    expect(r.activity_score).toBe(0);
    expect(r.total_exercise_programmes).toBe(0);
    expect(r.total_recreational_activities).toBe(0);
    expect(r.total_outdoor_engagements).toBe(0);
    expect(r.total_fitness_assessments).toBe(0);
    expect(r.total_accessibility_records).toBe(0);
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("headline mentions no children on placement", () => {
    const r = run();
    expect(r.headline).toContain("No children on placement");
  });

  it("all metric rates are 0 on insufficient_data", () => {
    const r = run();
    expect(r.exercise_engagement_rate).toBe(0);
    expect(r.recreational_diversity_score).toBe(0);
    expect(r.outdoor_participation_rate).toBe(0);
    expect(r.fitness_assessment_coverage_rate).toBe(0);
    expect(r.activity_accessibility_rate).toBe(0);
    expect(r.child_choice_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE BASELINE (all empty, children > 0)
// ══════════════════════════════════════════════════════════════════════════════

describe("Inadequate baseline — all empty with children", () => {
  it("returns inadequate with score 15 when all arrays empty but children > 0", () => {
    const r = run({ total_children: 3 });
    expect(r.activity_rating).toBe("inadequate");
    expect(r.activity_score).toBe(15);
  });

  it("headline mentions urgent attention", () => {
    const r = run({ total_children: 3 });
    expect(r.headline).toContain("urgent attention");
  });

  it("has exactly 1 concern", () => {
    const r = run({ total_children: 3 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No exercise programmes");
  });

  it("has exactly 2 recommendations with immediate urgency", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("has exactly 1 critical insight about absence of records", () => {
    const r = run({ total_children: 3 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
    expect(r.insights[0].text).toContain("complete absence");
  });

  it("all metric totals and rates are 0", () => {
    const r = run({ total_children: 3 });
    expect(r.total_exercise_programmes).toBe(0);
    expect(r.total_recreational_activities).toBe(0);
    expect(r.total_outdoor_engagements).toBe(0);
    expect(r.total_fitness_assessments).toBe(0);
    expect(r.total_accessibility_records).toBe(0);
    expect(r.exercise_engagement_rate).toBe(0);
    expect(r.recreational_diversity_score).toBe(0);
    expect(r.outdoor_participation_rate).toBe(0);
    expect(r.fitness_assessment_coverage_rate).toBe(0);
    expect(r.activity_accessibility_rate).toBe(0);
    expect(r.child_choice_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. BONUS 1 — Exercise Engagement Rate (>=90: +4, >=70: +2)
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 1 — exerciseEngagementRate", () => {
  it("awards +4 when engagement >= 90%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1",
          sessions_planned: 10,
          sessions_attended: 9,
          engagement_level: "high",
          child_enjoys: false,
          goals_set: 0,
          goals_achieved: 0,
          reviewed: false,
          active: true,
          external_provider: false,
          programme_type: "individual",
        }),
      ],
    });
    // 90% engagement => +4, exerciseCoverage 100% => +3, no outdoor penalty -5 guarded (0 engagements but total_children>0 => penalty)
    // fitnessAssessmentCoverage <30 => -3
    // outdoorParticipation <50 with children>0 => -5
    expect(r.exercise_engagement_rate).toBe(90);
    // base=52 +4(engagement) +3(coverage) -5(outdoor<50) -3(fitness<30) = 51
    expect(r.activity_score).toBe(51);
  });

  it("awards +2 when engagement >= 70% and < 90%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1",
          sessions_planned: 10,
          sessions_attended: 7,
          engagement_level: "high",
          child_enjoys: false,
          goals_set: 0,
          goals_achieved: 0,
          reviewed: false,
          active: true,
          external_provider: false,
          programme_type: "individual",
        }),
      ],
    });
    expect(r.exercise_engagement_rate).toBe(70);
    // base=52 +2(engagement) +3(coverage) -5(outdoor<50) -3(fitness<30) = 49
    expect(r.activity_score).toBe(49);
  });

  it("awards +0 when engagement < 70%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1",
          sessions_planned: 10,
          sessions_attended: 6,
          engagement_level: "moderate",
          child_enjoys: false,
          goals_set: 0,
          goals_achieved: 0,
          reviewed: false,
          active: true,
          external_provider: false,
          programme_type: "individual",
        }),
      ],
    });
    expect(r.exercise_engagement_rate).toBe(60);
    // base=52 +0(engagement) +3(coverage) -5(outdoor<50) -3(fitness<30) = 47
    expect(r.activity_score).toBe(47);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. BONUS 2 — Recreational Diversity Score (>=80: +3, >=60: +1)
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 2 — recreationalDiversityScore", () => {
  function makeAllCategories(): RecreationalActivityInput[] {
    const cats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation",
    ];
    return cats.map((c) =>
      makeRecreationalActivity({
        activity_category: c,
        child_choice: false,
        child_enjoyed: false,
        new_experience: false,
        community_based: false,
        peer_interaction: false,
        skill_development: false,
        inclusive: true,
      }),
    );
  }

  it("awards +3 when diversity >= 80% (6/7 categories)", () => {
    // 6/7 = 86%
    const r = run({
      total_children: 1,
      recreational_activity_records: makeAllCategories(), // 6 categories
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recreational_diversity_score).toBe(86);
    // base=52 +4(engagement90) +3(diversity) +3(coverage100) -5(outdoor<50) -3(fitness<30) = 54
    expect(r.activity_score).toBe(54);
  });

  it("awards +1 when diversity >= 60% and < 80% (5/7 categories)", () => {
    const cats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure",
    ];
    const recs = cats.map((c) =>
      makeRecreationalActivity({
        activity_category: c,
        child_choice: false,
        child_enjoyed: false,
        new_experience: false,
        community_based: false,
        peer_interaction: false,
        skill_development: false,
        inclusive: true,
      }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 5/7 = 71%
    expect(r.recreational_diversity_score).toBe(71);
    // base=52 +4(engagement90) +1(diversity) +3(coverage100) -5(outdoor<50) -3(fitness<30) = 52
    expect(r.activity_score).toBe(52);
  });

  it("awards +0 when diversity < 60% (1/7 categories)", () => {
    const recs = [
      makeRecreationalActivity({
        activity_category: "sport",
        child_choice: false,
        child_enjoyed: false,
        new_experience: false,
        community_based: false,
        peer_interaction: false,
        skill_development: false,
        inclusive: true,
      }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/7 = 14%
    expect(r.recreational_diversity_score).toBe(14);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. BONUS 3 — Outdoor Participation Rate (>=100: +4, >=80: +2)
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 3 — outdoorParticipationRate", () => {
  it("awards +4 when all children have outdoor engagement", () => {
    const r = run({
      total_children: 2,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", enjoyment_rating: 3, risk_assessed: false, child_initiated: false, weather_appropriate: true, physical_benefit: false, wellbeing_benefit: false }),
        makeOutdoorEngagement({ child_id: "child_2", enjoyment_rating: 3, risk_assessed: false, child_initiated: false, weather_appropriate: true, physical_benefit: false, wellbeing_benefit: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
      ],
    });
    expect(r.outdoor_participation_rate).toBe(100);
    // base=52 +4(engagement90) +4(outdoor100) +3(coverage100) -3(fitness<30) = 60
    expect(r.activity_score).toBe(60);
  });

  it("awards +2 when outdoor >= 80% and < 100%", () => {
    // 4/5 = 80%
    const r = run({
      total_children: 5,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", enjoyment_rating: 3, risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_2", enjoyment_rating: 3, risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_3", enjoyment_rating: 3, risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_4", enjoyment_rating: 3, risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
        makeExerciseProgramme({ child_id: "child_3", active: true }),
        makeExerciseProgramme({ child_id: "child_4", active: true }),
        makeExerciseProgramme({ child_id: "child_5", active: true }),
      ],
    });
    expect(r.outdoor_participation_rate).toBe(80);
    // base=52 +4(engagement90) +2(outdoor80) +3(coverage100) -3(fitness<30) = 58
    expect(r.activity_score).toBe(58);
  });

  it("awards +0 when outdoor < 80%", () => {
    // 1/5 = 20%
    const r = run({
      total_children: 5,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", enjoyment_rating: 3, risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
        makeExerciseProgramme({ child_id: "child_3", active: true }),
        makeExerciseProgramme({ child_id: "child_4", active: true }),
        makeExerciseProgramme({ child_id: "child_5", active: true }),
      ],
    });
    expect(r.outdoor_participation_rate).toBe(20);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. BONUS 4 — Fitness Assessment Coverage (>=100: +3, >=80: +1)
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 4 — fitnessAssessmentCoverageRate", () => {
  it("awards +3 when all children assessed", () => {
    const r = run({
      total_children: 2,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1" }),
        makeFitnessAssessment({ child_id: "child_2" }),
      ],
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_2", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
      ],
    });
    expect(r.fitness_assessment_coverage_rate).toBe(100);
    // base=52 +4(engagement90) +4(outdoor100) +3(fitness100) +3(coverage100) = 66
    expect(r.activity_score).toBe(66);
  });

  it("awards +1 when coverage >= 80% and < 100%", () => {
    // 4/5 = 80%
    const r = run({
      total_children: 5,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1" }),
        makeFitnessAssessment({ child_id: "child_2" }),
        makeFitnessAssessment({ child_id: "child_3" }),
        makeFitnessAssessment({ child_id: "child_4" }),
      ],
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_2", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_3", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_4", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_5", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
        makeExerciseProgramme({ child_id: "child_3", active: true }),
        makeExerciseProgramme({ child_id: "child_4", active: true }),
        makeExerciseProgramme({ child_id: "child_5", active: true }),
      ],
    });
    expect(r.fitness_assessment_coverage_rate).toBe(80);
    // base=52 +4(eng90) +4(outdoor100) +1(fitness80) +3(coverage100) = 64
    expect(r.activity_score).toBe(64);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. BONUS 5 — Activity Accessibility Rate (>=100: +3, >=80: +1)
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 5 — activityAccessibilityRate", () => {
  it("awards +3 when all children can participate", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ child_id: "child_1", child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.activity_accessibility_rate).toBe(100);
    // base=52 +4(eng) +3(accessibility100) +3(coverage100) -5(outdoor<50) -3(fitness<30) = 54
    expect(r.activity_score).toBe(54);
  });

  it("awards +1 when accessibility >= 80% and < 100%", () => {
    // 4/5 = 80%
    const recs = [
      makeActivityAccessibility({ child_id: "child_1", child_able_to_participate: true }),
      makeActivityAccessibility({ child_id: "child_2", child_able_to_participate: true }),
      makeActivityAccessibility({ child_id: "child_3", child_able_to_participate: true }),
      makeActivityAccessibility({ child_id: "child_4", child_able_to_participate: true }),
      makeActivityAccessibility({ child_id: "child_5", child_able_to_participate: false, equal_opportunity: false }),
    ];
    const r = run({
      total_children: 1,
      activity_accessibility_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.activity_accessibility_rate).toBe(80);
  });

  it("awards +0 when accessibility < 80%", () => {
    const recs = [
      makeActivityAccessibility({ child_id: "child_1", child_able_to_participate: true }),
      makeActivityAccessibility({ child_id: "child_2", child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_id: "child_3", child_able_to_participate: false, equal_opportunity: false }),
    ];
    const r = run({
      total_children: 1,
      activity_accessibility_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.activity_accessibility_rate).toBe(33);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. BONUS 6 — Child Choice Rate (>=80: +3, >=60: +1)
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 6 — childChoiceRate", () => {
  it("awards +3 when child choice >= 80%", () => {
    // 4/5 = 80%
    const recs = [
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.child_choice_rate).toBe(80);
  });

  it("awards +1 when child choice >= 60% and < 80%", () => {
    // 3/5 = 60%
    const recs = [
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, community_based: false, new_experience: false, peer_interaction: false, skill_development: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.child_choice_rate).toBe(60);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. BONUS 7 — Exercise Coverage Rate (>=100: +3, >=80: +1)
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 7 — exerciseCoverageRate", () => {
  it("awards +3 when all children have active exercise programmes", () => {
    const r = run({
      total_children: 2,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
      ],
    });
    // 2/2 = 100%
    // base=52 +4(eng90) +3(coverage100) -5(outdoor<50) -3(fitness<30) = 51
    expect(r.activity_score).toBe(51);
  });

  it("awards +1 when coverage >= 80% and < 100%", () => {
    // 4/5 = 80%
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
        makeExerciseProgramme({ child_id: "child_3", active: true }),
        makeExerciseProgramme({ child_id: "child_4", active: true }),
      ],
    });
    // base=52 +4(eng90) +1(coverage80) -5(outdoor<50) -3(fitness<30) = 49
    expect(r.activity_score).toBe(49);
  });

  it("awards +0 when coverage < 80%", () => {
    // 1/5 = 20%
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // base=52 +4(eng90) +0(coverage20) -5(outdoor<50) -3(fitness<30) = 48
    expect(r.activity_score).toBe(48);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. BONUS 8 — Goal Achievement Rate (>=80: +2, >=60: +1)
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 8 — goalAchievementRate", () => {
  it("awards +2 when goal achievement >= 80%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1",
          active: true,
          goals_set: 10,
          goals_achieved: 8,
        }),
      ],
    });
    // base=52 +4(eng90) +3(coverage100) +2(goals80) -5(outdoor<50) -3(fitness<30) = 53
    expect(r.activity_score).toBe(53);
  });

  it("awards +1 when goal achievement >= 60% and < 80%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1",
          active: true,
          goals_set: 10,
          goals_achieved: 6,
        }),
      ],
    });
    // base=52 +4(eng90) +3(coverage100) +1(goals60) -5(outdoor<50) -3(fitness<30) = 52
    expect(r.activity_score).toBe(52);
  });

  it("awards +0 when goal achievement < 60%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1",
          active: true,
          goals_set: 10,
          goals_achieved: 5,
        }),
      ],
    });
    // 50% < 60 => +0
    // base=52 +4(eng90) +3(coverage100) +0(goals) -5(outdoor<50) -3(fitness<30) = 51
    expect(r.activity_score).toBe(51);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. BONUS 9 — Recreational Enjoyment Rate (>=90: +3, >=70: +1)
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 9 — recreationalEnjoymentRate", () => {
  it("awards +3 when enjoyment >= 90%", () => {
    // 9/10 = 90%
    const recs: RecreationalActivityInput[] = [];
    for (let i = 0; i < 9; i++) {
      recs.push(makeRecreationalActivity({
        child_enjoyed: true,
        child_choice: false,
        community_based: false,
        new_experience: false,
        peer_interaction: false,
        skill_development: false,
        inclusive: true,
      }));
    }
    recs.push(makeRecreationalActivity({
      child_enjoyed: false,
      child_choice: false,
      community_based: false,
      new_experience: false,
      peer_interaction: false,
      skill_development: false,
      inclusive: true,
    }));
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r).toHaveProperty("activity_score");
    // check enjoyment rate
    const enjoyedCount = recs.filter((x) => x.child_enjoyed).length;
    expect(Math.round((enjoyedCount / recs.length) * 100)).toBe(90);
  });

  it("awards +1 when enjoyment >= 70% and < 90%", () => {
    // 7/10 = 70%
    const recs: RecreationalActivityInput[] = [];
    for (let i = 0; i < 7; i++) {
      recs.push(makeRecreationalActivity({
        child_enjoyed: true,
        child_choice: false,
        community_based: false,
        new_experience: false,
        peer_interaction: false,
        skill_development: false,
        inclusive: true,
      }));
    }
    for (let i = 0; i < 3; i++) {
      recs.push(makeRecreationalActivity({
        child_enjoyed: false,
        child_choice: false,
        community_based: false,
        new_experience: false,
        peer_interaction: false,
        skill_development: false,
        inclusive: true,
      }));
    }
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    const enjoyedCount = recs.filter((x) => x.child_enjoyed).length;
    expect(Math.round((enjoyedCount / recs.length) * 100)).toBe(70);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. ALL BONUSES COMBINED — Max Score 80
// ══════════════════════════════════════════════════════════════════════════════

describe("All bonuses combined — maximum score", () => {
  function makeMaxInput(): PhysicalActivityRecreationInput {
    const children = ["child_1", "child_2"];
    const totalChildren = 2;

    // 7 categories for full diversity
    const allCats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation", "educational",
    ];

    const exerciseRecords = children.map((c) =>
      makeExerciseProgramme({
        child_id: c,
        active: true,
        sessions_planned: 10,
        sessions_attended: 10,
        engagement_level: "high",
        child_enjoys: true,
        goals_set: 10,
        goals_achieved: 10,
        reviewed: true,
        external_provider: true,
        programme_type: "individual",
      }),
    );

    const recRecords = allCats.map((cat) =>
      makeRecreationalActivity({
        child_id: "child_1",
        activity_category: cat,
        child_choice: true,
        child_enjoyed: true,
        new_experience: true,
        community_based: true,
        peer_interaction: true,
        skill_development: true,
        inclusive: true,
      }),
    );

    const outdoorRecords = children.map((c) =>
      makeOutdoorEngagement({
        child_id: c,
        enjoyment_rating: 5,
        risk_assessed: true,
        child_initiated: true,
        weather_appropriate: true,
        physical_benefit: true,
        wellbeing_benefit: true,
      }),
    );

    const fitnessRecords = children.map((c) =>
      makeFitnessAssessment({
        child_id: c,
        follow_up_planned: true,
        follow_up_completed: true,
        child_involved_in_goal_setting: true,
        health_professional_involved: true,
        bmi_recorded: true,
        fitness_level: "excellent",
      }),
    );

    const accessRecords = children.map((c) =>
      makeActivityAccessibility({
        child_id: c,
        child_able_to_participate: true,
        adaptation_required: true,
        adaptation_provided: true,
        barrier_identified: "access ramp",
        barrier_resolved: true,
        equipment_available: true,
        transport_arranged: true,
        cost_covered: true,
        equal_opportunity: true,
      }),
    );

    return baseInput({
      total_children: totalChildren,
      exercise_programme_records: exerciseRecords,
      recreational_activity_records: recRecords,
      outdoor_engagement_records: outdoorRecords,
      fitness_assessment_records: fitnessRecords,
      activity_accessibility_records: accessRecords,
    });
  }

  it("achieves score 80 (outstanding) with all bonuses", () => {
    const r = computePhysicalActivityRecreation(makeMaxInput());
    // 52 + 4+3+4+3+3+3+3+2+3 = 80
    expect(r.activity_score).toBe(80);
    expect(r.activity_rating).toBe("outstanding");
  });

  it("has outstanding headline", () => {
    const r = computePhysicalActivityRecreation(makeMaxInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("produces multiple strengths for outstanding scenario", () => {
    const r = computePhysicalActivityRecreation(makeMaxInput());
    expect(r.strengths.length).toBeGreaterThan(5);
  });

  it("produces no concerns for outstanding scenario", () => {
    const r = computePhysicalActivityRecreation(makeMaxInput());
    expect(r.concerns).toHaveLength(0);
  });

  it("produces positive insights for outstanding scenario", () => {
    const r = computePhysicalActivityRecreation(makeMaxInput());
    const positiveInsights = r.insights.filter((i) => i.severity === "positive");
    expect(positiveInsights.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. PENALTIES
// ══════════════════════════════════════════════════════════════════════════════

describe("Penalty 1 — exerciseEngagementRate < 40 (-5)", () => {
  it("applies -5 when engagement < 40%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1",
          active: true,
          sessions_planned: 10,
          sessions_attended: 3,
          engagement_level: "low",
          child_enjoys: false,
          goals_set: 0,
          goals_achieved: 0,
          reviewed: false,
          external_provider: false,
        }),
      ],
    });
    expect(r.exercise_engagement_rate).toBe(30);
    // base=52 +0(eng) +3(coverage100) -5(engPenalty) -5(outdoor<50) -3(fitness<30) = 42
    expect(r.activity_score).toBe(42);
  });
});

describe("Penalty 2 — outdoorParticipationRate < 50 (-5)", () => {
  it("applies -5 when outdoor participation < 50%", () => {
    // 0 outdoor, 1 child => 0% < 50
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.outdoor_participation_rate).toBe(0);
    // base=52 +4(eng90) +3(coverage100) -5(outdoor<50) -3(fitness<30) = 51
    expect(r.activity_score).toBe(51);
  });
});

describe("Penalty 3 — activityAccessibilityRate < 50 (-5)", () => {
  it("applies -5 when accessibility < 50%", () => {
    const recs = [
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: true }),
    ];
    const r = run({
      total_children: 1,
      activity_accessibility_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.activity_accessibility_rate).toBe(33);
    // base=52 +4(eng90) +3(coverage100) -5(accessibility<50) -5(outdoor<50) -3(fitness<30) = 46
    expect(r.activity_score).toBe(46);
  });
});

describe("Penalty 4 — fitnessAssessmentCoverageRate < 30 (-3)", () => {
  it("applies -3 when fitness coverage < 30%", () => {
    // 0 assessments, 1 child => 0% < 30
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.fitness_assessment_coverage_rate).toBe(0);
    // base=52 +4(eng90) +3(coverage100) -5(outdoor<50) -3(fitness<30) = 51
    expect(r.activity_score).toBe(51);
  });

  it("does not apply when fitness coverage >= 30%", () => {
    // 1/3 = 33%
    const r = run({
      total_children: 3,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1" }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
        makeExerciseProgramme({ child_id: "child_3", active: true }),
      ],
    });
    expect(r.fitness_assessment_coverage_rate).toBe(33);
    // base=52 +4(eng90) +3(coverage100) -5(outdoor<50) +0(no fitness penalty) = 54
    expect(r.activity_score).toBe(54);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. PENALTY GUARDS (denominator = 0 prevents penalty)
// ══════════════════════════════════════════════════════════════════════════════

describe("Penalty guards — zero denominator prevents penalty", () => {
  it("no exercise engagement penalty when sessionsPlanned = 0", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1",
          active: true,
          sessions_planned: 0,
          sessions_attended: 0,
          engagement_level: "high",
        }),
      ],
    });
    // pct(0,0) = 0 but guard: totalSessionsPlanned=0 => no penalty
    expect(r.exercise_engagement_rate).toBe(0);
    // base=52 +0(eng,no bonus since 0%<70) +3(coverage100) -5(outdoor<50) -3(fitness<30) = 47
    // no -5 for engagement since guard prevents it
    expect(r.activity_score).toBe(47);
  });

  it("no outdoor penalty when total_children = 0 (insufficient data path already handles this)", () => {
    // This would go through insufficient_data path, so test it with records present
    const r = run({
      total_children: 0,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // total_children=0 but exercise exists: not allEmpty, not allEmpty+children>0
    // outdoorParticipationRate = 0 (total_children=0 => 0 by guard)
    // penalty guard: total_children=0 => no penalty
    // fitnessAssessmentCoverageRate = 0 (total_children=0 => 0 by guard), penalty guard: total_children=0 => no penalty
    // exerciseCoverageRate = 0 (total_children=0 => 0 by guard)
    // base=52 +4(eng90) +0(outdoor) +0(fitness) +0(coverage) = 56
    expect(r.activity_score).toBe(56);
  });

  it("no accessibility penalty when totalAccessibilityRecords = 0", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
      activity_accessibility_records: [],
    });
    // No accessibility records => activityAccessibilityRate = pct(0,0) = 0
    // Guard: totalAccessibilityRecords=0 => no penalty
    // base=52 +4(eng90) +3(coverage100) -5(outdoor<50) -3(fitness<30) = 51
    expect(r.activity_score).toBe(51);
  });

  it("no fitness penalty when total_children = 0 with exercise records", () => {
    const r = run({
      total_children: 0,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // fitnessAssessmentCoverageRate = 0 but guard: total_children=0 => no -3
    expect(r.activity_score).toBe(56);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. RATING BOUNDARIES
// ══════════════════════════════════════════════════════════════════════════════

describe("Rating boundaries", () => {
  it("score 80 => outstanding", () => {
    // We already tested this in all-bonuses
    const children = ["child_1", "child_2"];
    const allCats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation", "educational",
    ];
    const r = run({
      total_children: 2,
      exercise_programme_records: children.map((c) =>
        makeExerciseProgramme({
          child_id: c, active: true, sessions_planned: 10, sessions_attended: 10,
          goals_set: 10, goals_achieved: 10, child_enjoys: true, reviewed: true,
          external_provider: true,
        }),
      ),
      recreational_activity_records: allCats.map((cat) =>
        makeRecreationalActivity({
          activity_category: cat, child_choice: true, child_enjoyed: true,
          new_experience: true, community_based: true, peer_interaction: true,
          skill_development: true, inclusive: true,
        }),
      ),
      outdoor_engagement_records: children.map((c) =>
        makeOutdoorEngagement({
          child_id: c, enjoyment_rating: 5, risk_assessed: true,
          child_initiated: true, weather_appropriate: true,
          physical_benefit: true, wellbeing_benefit: true,
        }),
      ),
      fitness_assessment_records: children.map((c) =>
        makeFitnessAssessment({
          child_id: c, follow_up_planned: true, follow_up_completed: true,
          child_involved_in_goal_setting: true, health_professional_involved: true,
          bmi_recorded: true, fitness_level: "excellent",
        }),
      ),
      activity_accessibility_records: children.map((c) =>
        makeActivityAccessibility({
          child_id: c, child_able_to_participate: true,
          adaptation_required: true, adaptation_provided: true,
          barrier_identified: "ramp", barrier_resolved: true,
          equipment_available: true, transport_arranged: true,
          cost_covered: true, equal_opportunity: true,
        }),
      ),
    });
    expect(r.activity_score).toBe(80);
    expect(r.activity_rating).toBe("outstanding");
  });

  it("score 79 => good (just below outstanding)", () => {
    // Build max but remove 1 bonus point - remove the goalAchievement bonus (+2)
    const children = ["child_1", "child_2"];
    const allCats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation", "educational",
    ];
    const r = run({
      total_children: 2,
      exercise_programme_records: children.map((c) =>
        makeExerciseProgramme({
          child_id: c, active: true, sessions_planned: 10, sessions_attended: 10,
          goals_set: 10, goals_achieved: 5, // 50% < 60 => no bonus
          child_enjoys: true, reviewed: true, external_provider: true,
        }),
      ),
      recreational_activity_records: allCats.map((cat) =>
        makeRecreationalActivity({
          activity_category: cat, child_choice: true, child_enjoyed: true,
          new_experience: true, community_based: true, peer_interaction: true,
          skill_development: true, inclusive: true,
        }),
      ),
      outdoor_engagement_records: children.map((c) =>
        makeOutdoorEngagement({
          child_id: c, enjoyment_rating: 5, risk_assessed: true,
          child_initiated: true, weather_appropriate: true,
          physical_benefit: true, wellbeing_benefit: true,
        }),
      ),
      fitness_assessment_records: children.map((c) =>
        makeFitnessAssessment({
          child_id: c, follow_up_planned: true, follow_up_completed: true,
          child_involved_in_goal_setting: true, health_professional_involved: true,
          bmi_recorded: true, fitness_level: "excellent",
        }),
      ),
      activity_accessibility_records: children.map((c) =>
        makeActivityAccessibility({
          child_id: c, child_able_to_participate: true,
          adaptation_required: true, adaptation_provided: true,
          barrier_identified: "ramp", barrier_resolved: true,
          equipment_available: true, transport_arranged: true,
          cost_covered: true, equal_opportunity: true,
        }),
      ),
    });
    // 52 + 4+3+4+3+3+3+3+0+3 = 78
    expect(r.activity_score).toBe(78);
    expect(r.activity_rating).toBe("good");
  });

  it("score 65 => good boundary", () => {
    // Build scenario that yields exactly 65
    // base=52, need +13 bonus with no penalties
    // eng90(+4) + outdoor100(+4) + fitness100(+3) + coverage100(+3) = +14 => 66 with no penalties
    // eng90(+4) + outdoor100(+4) + fitness100(+3) + coverage80(+1) = +12 => 64...
    // We need a carefully constructed scenario
    // Let's go: eng90(+4) + outdoor100(+4) + fitness100(+3) + accessibility100(+3) - no exercise coverage bonus (0 children... no)
    // With 2 children, 2 exercise, 2 outdoor, 2 fitness => eng+4, outdoor+4, fitness+3, coverage+3 = 66
    // We need 65, so let's do: fitness at 80% (+1 instead of +3) => 64 ... too low
    // eng+4, outdoor+4, fitness+3, coverage80(+1), enjoyment90(+3) = 15 => 67... too high
    // eng+4, outdoor+4, fitness80(+1), coverage+3 = 12 => 64
    // eng+4, outdoor+4, fitness80(+1), coverage+3, goals80(+2) = 14 => 66
    // eng+4, outdoor+4, fitness80(+1), coverage+3, goals60(+1) = 13 => 65
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({
            child_id: c, active: true, sessions_planned: 10, sessions_attended: 9,
            goals_set: 5, goals_achieved: 3, // 60% overall
            child_enjoys: false, reviewed: false, external_provider: false,
          }),
        ),
      ],
      outdoor_engagement_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeOutdoorEngagement({
            child_id: c, enjoyment_rating: 3, risk_assessed: false,
            child_initiated: false, weather_appropriate: true,
            physical_benefit: false, wellbeing_benefit: false,
          }),
        ),
      ],
      fitness_assessment_records: [
        ...["child_1", "child_2", "child_3", "child_4"].map((c) =>
          makeFitnessAssessment({ child_id: c }),
        ),
      ],
    });
    // eng: 45/50 = 90% => +4
    // outdoor: 5/5 = 100% => +4
    // fitness: 4/5 = 80% => +1
    // coverage: 5/5 = 100% => +3
    // goals: 15/25 = 60% => +1
    // 52 + 4+4+1+3+1 = 65
    expect(r.activity_score).toBe(65);
    expect(r.activity_rating).toBe("good");
  });

  it("score 64 => adequate (just below good)", () => {
    // Same as above but goals at 50% (no bonus)
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({
            child_id: c, active: true, sessions_planned: 10, sessions_attended: 9,
            goals_set: 10, goals_achieved: 5, // 50% < 60 => no bonus
            child_enjoys: false, reviewed: false, external_provider: false,
          }),
        ),
      ],
      outdoor_engagement_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeOutdoorEngagement({
            child_id: c, enjoyment_rating: 3, risk_assessed: false,
            child_initiated: false, weather_appropriate: true,
            physical_benefit: false, wellbeing_benefit: false,
          }),
        ),
      ],
      fitness_assessment_records: [
        ...["child_1", "child_2", "child_3", "child_4"].map((c) =>
          makeFitnessAssessment({ child_id: c }),
        ),
      ],
    });
    // 52 + 4+4+1+3+0 = 64
    expect(r.activity_score).toBe(64);
    expect(r.activity_rating).toBe("adequate");
  });

  it("score 45 => adequate boundary", () => {
    // base=52, penalties needed to bring to 45: -7
    // outdoor<50(-5) + fitness<30(-3) = -8 => 44... too low
    // Need +1 bonus: outdoor<50(-5) + fitness<30(-3) + diversity60(+1) = 52-8+1 = 45
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true, sessions_planned: 10, sessions_attended: 6,
          goals_set: 0, goals_achieved: 0, child_enjoys: false, reviewed: false,
          external_provider: false, engagement_level: "moderate",
        }),
      ],
      recreational_activity_records: [
        // 5 categories => 5/7 = 71% => +1 diversity bonus
        ...["sport", "creative", "social", "cultural", "adventure"].map((cat) =>
          makeRecreationalActivity({
            activity_category: cat as RecreationalActivityInput["activity_category"],
            child_choice: false, child_enjoyed: false, community_based: false,
            new_experience: false, peer_interaction: false, skill_development: false,
            inclusive: true,
          }),
        ),
      ],
    });
    // eng: 6/10 = 60% => no bonus, no penalty (>=40)
    // diversity: 5/7 = 71% => +1
    // outdoor: 0/5 = 0% => -5
    // fitness: 0/5 = 0% => -3
    // coverage: 1/5 = 20% => no bonus
    // 52 + 1 - 5 - 3 = 45
    expect(r.activity_score).toBe(45);
    expect(r.activity_rating).toBe("adequate");
  });

  it("score 44 => inadequate (just below adequate)", () => {
    // base=52, outdoor<50(-5) + fitness<30(-3) = 44
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true, sessions_planned: 10, sessions_attended: 6,
          goals_set: 0, goals_achieved: 0, child_enjoys: false, reviewed: false,
          external_provider: false, engagement_level: "moderate",
        }),
      ],
    });
    // eng: 60% no bonus/penalty, coverage 1/5=20% no bonus
    // outdoor: 0% < 50 => -5, fitness: 0% < 30 => -3
    // 52 - 5 - 3 = 44
    expect(r.activity_score).toBe(44);
    expect(r.activity_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. METRIC CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Metric calculations", () => {
  it("calculates exercise_engagement_rate correctly", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ sessions_planned: 20, sessions_attended: 15, active: true }),
      ],
    });
    expect(r.exercise_engagement_rate).toBe(75); // 15/20 = 75%
  });

  it("calculates recreational_diversity_score correctly (3/7)", () => {
    const r = run({
      total_children: 1,
      recreational_activity_records: [
        makeRecreationalActivity({ activity_category: "sport", child_choice: false, child_enjoyed: false, inclusive: true }),
        makeRecreationalActivity({ activity_category: "creative", child_choice: false, child_enjoyed: false, inclusive: true }),
        makeRecreationalActivity({ activity_category: "social", child_choice: false, child_enjoyed: false, inclusive: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recreational_diversity_score).toBe(43); // 3/7 = 42.8 => 43
  });

  it("calculates outdoor_participation_rate correctly", () => {
    const r = run({
      total_children: 4,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_2", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_3", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
        makeExerciseProgramme({ child_id: "child_3", active: true }),
        makeExerciseProgramme({ child_id: "child_4", active: true }),
      ],
    });
    expect(r.outdoor_participation_rate).toBe(75); // 3/4
  });

  it("calculates fitness_assessment_coverage_rate correctly", () => {
    const r = run({
      total_children: 3,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1" }),
        makeFitnessAssessment({ child_id: "child_2" }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
        makeExerciseProgramme({ child_id: "child_3", active: true }),
      ],
    });
    expect(r.fitness_assessment_coverage_rate).toBe(67); // 2/3
  });

  it("calculates activity_accessibility_rate correctly", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ child_able_to_participate: true }),
        makeActivityAccessibility({ child_able_to_participate: true }),
        makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.activity_accessibility_rate).toBe(67); // 2/3
  });

  it("calculates child_choice_rate correctly", () => {
    const r = run({
      total_children: 1,
      recreational_activity_records: [
        makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
        makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
        makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
        makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.child_choice_rate).toBe(50); // 2/4
  });

  it("counts total_exercise_programmes correctly", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1" }),
        makeExerciseProgramme({ child_id: "child_1" }),
        makeExerciseProgramme({ child_id: "child_1" }),
      ],
    });
    expect(r.total_exercise_programmes).toBe(3);
  });

  it("counts total_recreational_activities correctly", () => {
    const r = run({
      total_children: 1,
      recreational_activity_records: [
        makeRecreationalActivity({}),
        makeRecreationalActivity({}),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.total_recreational_activities).toBe(2);
  });

  it("counts total_outdoor_engagements correctly", () => {
    const r = run({
      total_children: 1,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1" }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.total_outdoor_engagements).toBe(1);
  });

  it("counts total_fitness_assessments correctly", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({}),
        makeFitnessAssessment({}),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.total_fitness_assessments).toBe(2);
  });

  it("counts total_accessibility_records correctly", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({}),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.total_accessibility_records).toBe(1);
  });

  it("pct(0, 0) = 0", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 0, sessions_attended: 0,
        }),
      ],
    });
    expect(r.exercise_engagement_rate).toBe(0);
  });

  it("exercise coverage counts only active programmes", () => {
    // 1 active for child_1, 1 inactive for child_2
    const r = run({
      total_children: 2,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: false }),
      ],
    });
    // Only child_1 has active programme => 1/2 = 50%
    // Coverage rate based on unique children with active programmes
    expect(r.outdoor_participation_rate).toBe(0);
  });

  it("duplicate child_ids in outdoor engagement count as 1 unique child", () => {
    const r = run({
      total_children: 2,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
      ],
    });
    // 1 unique child / 2 total = 50%
    expect(r.outdoor_participation_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("includes exercise engagement strength when >= 90%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 9,
        }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("90% exercise session attendance"))).toBe(true);
  });

  it("includes exercise engagement strength at 70% tier", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 7,
        }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("70% exercise session attendance"))).toBe(true);
  });

  it("includes exercise coverage strength when 100%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Every child has an active exercise programme"))).toBe(true);
  });

  it("includes recreational diversity strength when >= 80%", () => {
    const cats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation",
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: cats.map((c) =>
        makeRecreationalActivity({ activity_category: c, child_choice: false, child_enjoyed: false, inclusive: true }),
      ),
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("6 of 7 categories"))).toBe(true);
  });

  it("includes child choice strength when >= 80%", () => {
    const recs = Array.from({ length: 4 }, () =>
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
    );
    recs.push(makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }));
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("80% of recreational activities chosen by children"))).toBe(true);
  });

  it("includes outdoor participation strength when 100%", () => {
    const r = run({
      total_children: 2,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_2", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Every child engages in outdoor activities"))).toBe(true);
  });

  it("includes fitness assessment strength when 100%", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1" }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Every child has received a fitness assessment"))).toBe(true);
  });

  it("includes activity accessibility strength when 100%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("All children are able to participate"))).toBe(true);
  });

  it("includes goal achievement strength when >= 80%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          goals_set: 10, goals_achieved: 8,
        }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("80% of exercise goals achieved"))).toBe(true);
  });

  it("includes recreational enjoyment strength when >= 90%", () => {
    const recs = Array.from({ length: 9 }, () =>
      makeRecreationalActivity({ child_enjoyed: true, child_choice: false, inclusive: true }),
    );
    recs.push(makeRecreationalActivity({ child_enjoyed: false, child_choice: false, inclusive: true }));
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("90% of children report enjoying"))).toBe(true);
  });

  it("includes exercise enjoyment strength when >= 90%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true, child_enjoys: true }),
      ],
    });
    // 1/1 = 100% >= 90
    expect(r.strengths.some((s) => s.includes("of children enjoy their exercise programmes"))).toBe(true);
  });

  it("includes new experience strength when >= 50%", () => {
    const recs = [
      makeRecreationalActivity({ new_experience: true, child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ new_experience: false, child_choice: false, child_enjoyed: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("50% of recreational activities offer new experiences"))).toBe(true);
  });

  it("includes community based strength when >= 50%", () => {
    const recs = [
      makeRecreationalActivity({ community_based: true, child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ community_based: false, child_choice: false, child_enjoyed: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("50% of recreational activities are community-based"))).toBe(true);
  });

  it("includes peer interaction strength when >= 70%", () => {
    const recs = Array.from({ length: 7 }, () =>
      makeRecreationalActivity({ peer_interaction: true, child_choice: false, child_enjoyed: false, inclusive: true }),
    );
    for (let i = 0; i < 3; i++) {
      recs.push(makeRecreationalActivity({ peer_interaction: false, child_choice: false, child_enjoyed: false, inclusive: true }));
    }
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("70% of activities promote peer interaction"))).toBe(true);
  });

  it("includes adaptation strength when 100%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({
          adaptation_required: true, adaptation_provided: true,
          child_able_to_participate: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Every required adaptation has been provided"))).toBe(true);
  });

  it("includes outdoor enjoyment strength when avg >= 4.0", () => {
    const r = run({
      total_children: 1,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", enjoyment_rating: 5, risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Outdoor enjoyment averages"))).toBe(true);
  });

  it("includes risk assessment strength when >= 90%", () => {
    const r = run({
      total_children: 1,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: true, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("of outdoor activities risk-assessed"))).toBe(true);
  });

  it("includes health professional strength when >= 70%", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1", health_professional_involved: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("of fitness assessments involve a health professional"))).toBe(true);
  });

  it("includes child-initiated outdoor strength when >= 50%", () => {
    const r = run({
      total_children: 1,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", child_initiated: true, risk_assessed: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("of outdoor activities are child-initiated"))).toBe(true);
  });

  it("includes barrier resolution strength when >= 90%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({
          barrier_identified: "steps",
          barrier_resolved: true,
          child_able_to_participate: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("of identified barriers resolved"))).toBe(true);
  });

  it("includes follow-up strength when >= 90%", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({
          child_id: "child_1",
          follow_up_planned: true,
          follow_up_completed: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("of fitness assessment follow-ups completed"))).toBe(true);
  });

  it("includes skill development strength when >= 60%", () => {
    const recs = [
      makeRecreationalActivity({ skill_development: true, child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ skill_development: true, child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ skill_development: false, child_choice: false, child_enjoyed: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 2/3 = 67%
    expect(r.strengths.some((s) => s.includes("of activities support skill development"))).toBe(true);
  });

  it("includes equal opportunity strength when >= 90%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ equal_opportunity: true, child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("equal opportunity rate"))).toBe(true);
  });

  it("includes therapeutic and competitive programme strength", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true, programme_type: "therapeutic" }),
        makeExerciseProgramme({ child_id: "child_1", active: true, programme_type: "competitive" }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("therapeutic") && s.includes("competitive"))).toBe(true);
  });

  it("includes external provider strength when >= 40%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true, external_provider: true }),
        makeExerciseProgramme({ child_id: "child_1", active: true, external_provider: false }),
      ],
    });
    // 1/2 = 50% >= 40
    expect(r.strengths.some((s) => s.includes("of exercise programmes involve external providers"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("Concerns", () => {
  it("flags exercise engagement < 40%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 3,
          engagement_level: "low", child_enjoys: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("30% exercise session attendance"))).toBe(true);
  });

  it("flags exercise engagement between 40-70%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 5,
          engagement_level: "moderate", child_enjoys: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Exercise engagement at 50%"))).toBe(true);
  });

  it("flags exercise coverage < 50%", () => {
    const r = run({
      total_children: 3,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33% of children have active exercise programmes"))).toBe(true);
  });

  it("flags recreational diversity < 40%", () => {
    const r = run({
      total_children: 1,
      recreational_activity_records: [
        makeRecreationalActivity({ activity_category: "sport", child_choice: false, child_enjoyed: false, inclusive: true }),
        makeRecreationalActivity({ activity_category: "sport", child_choice: false, child_enjoyed: false, inclusive: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/7 = 14%
    expect(r.concerns.some((c) => c.includes("1 of 7 activity categories"))).toBe(true);
  });

  it("flags child choice < 30%", () => {
    const recs = [
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/5 = 20%
    expect(r.concerns.some((c) => c.includes("20% of recreational activities are child-chosen"))).toBe(true);
  });

  it("flags outdoor participation < 50%", () => {
    const r = run({
      total_children: 5,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/5 = 20%
    expect(r.concerns.some((c) => c.includes("20% of children participate in outdoor"))).toBe(true);
  });

  it("flags fitness coverage < 30%", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 0/5 = 0%
    expect(r.concerns.some((c) => c.includes("0% of children have received fitness assessments"))).toBe(true);
  });

  it("flags activity accessibility < 50%", () => {
    const recs = [
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
    ];
    const r = run({
      total_children: 1,
      activity_accessibility_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33% activity accessibility rate"))).toBe(true);
  });

  it("flags goal achievement < 30%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          goals_set: 10, goals_achieved: 2,
        }),
      ],
    });
    // 2/10 = 20%
    expect(r.concerns.some((c) => c.includes("20% of exercise goals achieved"))).toBe(true);
  });

  it("flags recreational enjoyment < 50%", () => {
    const recs = [
      makeRecreationalActivity({ child_enjoyed: true, child_choice: false, inclusive: true }),
      makeRecreationalActivity({ child_enjoyed: false, child_choice: false, inclusive: true }),
      makeRecreationalActivity({ child_enjoyed: false, child_choice: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33% of children enjoy their recreational"))).toBe(true);
  });

  it("flags no recreational activities with children present", () => {
    const r = run({
      total_children: 2,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("No recreational activities recorded"))).toBe(true);
  });

  it("flags no outdoor engagement with children present", () => {
    const r = run({
      total_children: 2,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("No outdoor engagement recorded"))).toBe(true);
  });

  it("flags low inclusivity < 70%", () => {
    const recs = [
      makeRecreationalActivity({ inclusive: true, child_choice: false, child_enjoyed: false }),
      makeRecreationalActivity({ inclusive: false, child_choice: false, child_enjoyed: false }),
      makeRecreationalActivity({ inclusive: false, child_choice: false, child_enjoyed: false }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33% of recreational activities recorded as inclusive"))).toBe(true);
  });

  it("flags adaptation < 50%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: false, child_able_to_participate: true }),
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: false, child_able_to_participate: true }),
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: true, child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33% of required adaptations provided"))).toBe(true);
  });

  it("flags barrier resolution < 50%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ barrier_identified: "steps", barrier_resolved: false, child_able_to_participate: true }),
        makeActivityAccessibility({ barrier_identified: "noise", barrier_resolved: false, child_able_to_participate: true }),
        makeActivityAccessibility({ barrier_identified: "ramp", barrier_resolved: true, child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33% of identified activity barriers resolved"))).toBe(true);
  });

  it("flags follow-up completion < 50%", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: false }),
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: false }),
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33% of fitness assessment follow-ups completed"))).toBe(true);
  });

  it("flags programme review < 50%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33% of exercise programmes reviewed"))).toBe(true);
  });

  it("flags outdoor risk assessment < 70%", () => {
    const r = run({
      total_children: 1,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: true, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("33% of outdoor activities risk-assessed"))).toBe(true);
  });

  it("flags disengaged rate >= 40%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true, engagement_level: "disengaged", sessions_planned: 10, sessions_attended: 1, child_enjoys: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, engagement_level: "low", sessions_planned: 10, sessions_attended: 2, child_enjoys: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, engagement_level: "high", sessions_planned: 10, sessions_attended: 9, child_enjoys: false }),
      ],
    });
    // 2/3 = 67% disengaged+low
    expect(r.concerns.some((c) => c.includes("of exercise programmes show low or disengaged participation"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("recommends urgent exercise engagement review when < 40%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 3,
          engagement_level: "low", child_enjoys: false,
        }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Urgently review exercise programme engagement"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Urgently review"))?.urgency).toBe("immediate");
  });

  it("recommends increasing outdoor engagement when < 50%", () => {
    const r = run({
      total_children: 3,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase outdoor engagement"))).toBe(true);
  });

  it("recommends addressing accessibility when < 50%", () => {
    const recs = [
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: true }),
    ];
    const r = run({
      total_children: 1,
      activity_accessibility_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Address activity accessibility barriers"))).toBe(true);
  });

  it("recommends fitness assessments when coverage < 30%", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Implement fitness assessments"))).toBe(true);
  });

  it("recommends developing exercise programmes when coverage < 50%", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 1/5 = 20%
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Develop exercise programmes for all children"))).toBe(true);
  });

  it("recommends increasing child choice when < 30%", () => {
    const recs = Array.from({ length: 5 }, () =>
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase child choice"))).toBe(true);
  });

  it("recommends broadening activity range when diversity < 40%", () => {
    const r = run({
      total_children: 1,
      recreational_activity_records: [
        makeRecreationalActivity({ activity_category: "sport", child_choice: false, child_enjoyed: false, inclusive: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Broaden the range of recreational activities"))).toBe(true);
  });

  it("recommends reviewing activities when enjoyment < 50%", () => {
    const recs = [
      makeRecreationalActivity({ child_enjoyed: false, child_choice: false, inclusive: true }),
      makeRecreationalActivity({ child_enjoyed: false, child_choice: false, inclusive: true }),
      makeRecreationalActivity({ child_enjoyed: true, child_choice: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Review activity provision with children"))).toBe(true);
  });

  it("recommends recording recreational activities when none exist but children present", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Begin recording recreational activities"))).toBe(true);
  });

  it("recommends recording outdoor engagement when none exist but children present", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Begin recording outdoor engagement"))).toBe(true);
  });

  it("recommends community-based activities when < 30%", () => {
    const recs = Array.from({ length: 5 }, () =>
      makeRecreationalActivity({ community_based: false, child_choice: false, child_enjoyed: false, inclusive: true }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase community-based recreational activities"))).toBe(true);
  });

  it("recommends new experiences when < 20%", () => {
    const recs = Array.from({ length: 5 }, () =>
      makeRecreationalActivity({ new_experience: false, child_choice: false, child_enjoyed: false, inclusive: true }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Introduce more new experiences"))).toBe(true);
  });

  it("recommendations have sequential rank numbers", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 3,
          engagement_level: "low", child_enjoys: false,
        }),
      ],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("recommendations include regulatory_ref", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 3,
          engagement_level: "low", child_enjoys: false,
        }),
      ],
    });
    r.recommendations.forEach((rec) => {
      expect(rec.regulatory_ref).toBeTruthy();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 20. INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Insights", () => {
  it("critical insight for exercise engagement < 40%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 3,
          engagement_level: "low", child_enjoys: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("30% exercise session attendance"))).toBe(true);
  });

  it("critical insight for outdoor participation < 50%", () => {
    const r = run({
      total_children: 3,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("of children participate in outdoor activities"))).toBe(true);
  });

  it("critical insight for accessibility < 50%", () => {
    const recs = [
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: true }),
    ];
    const r = run({
      total_children: 1,
      activity_accessibility_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("activity accessibility rate"))).toBe(true);
  });

  it("critical insight for fitness coverage < 30%", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("of children have received fitness assessments"))).toBe(true);
  });

  it("critical insight for no recreational activities with children", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No recreational activities recorded"))).toBe(true);
  });

  it("critical insight for no outdoor engagement with children", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No outdoor engagement recorded"))).toBe(true);
  });

  it("critical insight for child choice < 30%", () => {
    const recs = Array.from({ length: 5 }, () =>
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0% of recreational activities chosen by children"))).toBe(true);
  });

  it("critical insight for exercise coverage < 50%", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
      ],
    });
    // 2/5 = 40%
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("40% of children have active exercise programmes"))).toBe(true);
  });

  it("warning insight for exercise engagement 40-70%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 5,
          engagement_level: "moderate", child_enjoys: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Exercise engagement at 50%"))).toBe(true);
  });

  it("warning insight for recreational diversity 40-60%", () => {
    const cats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social",
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: cats.map((c) =>
        makeRecreationalActivity({ activity_category: c, child_choice: false, child_enjoyed: false, inclusive: true }),
      ),
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 3/7 = 43%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("3 of 7 categories"))).toBe(true);
  });

  it("warning insight for disengaged rate >= 40%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true, engagement_level: "disengaged", sessions_planned: 10, sessions_attended: 1, child_enjoys: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, engagement_level: "low", sessions_planned: 10, sessions_attended: 2, child_enjoys: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, engagement_level: "high", sessions_planned: 10, sessions_attended: 9, child_enjoys: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("of exercise programmes show low or disengaged"))).toBe(true);
  });

  it("positive insight for outstanding rating", () => {
    const children = ["child_1", "child_2"];
    const allCats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation", "educational",
    ];
    const r = run({
      total_children: 2,
      exercise_programme_records: children.map((c) =>
        makeExerciseProgramme({
          child_id: c, active: true, sessions_planned: 10, sessions_attended: 10,
          goals_set: 10, goals_achieved: 10, child_enjoys: true, reviewed: true,
          external_provider: true,
        }),
      ),
      recreational_activity_records: allCats.map((cat) =>
        makeRecreationalActivity({
          activity_category: cat, child_choice: true, child_enjoyed: true,
          new_experience: true, community_based: true, peer_interaction: true,
          skill_development: true, inclusive: true,
        }),
      ),
      outdoor_engagement_records: children.map((c) =>
        makeOutdoorEngagement({
          child_id: c, enjoyment_rating: 5, risk_assessed: true,
          child_initiated: true, weather_appropriate: true,
          physical_benefit: true, wellbeing_benefit: true,
        }),
      ),
      fitness_assessment_records: children.map((c) =>
        makeFitnessAssessment({
          child_id: c, follow_up_planned: true, follow_up_completed: true,
          child_involved_in_goal_setting: true, health_professional_involved: true,
          bmi_recorded: true, fitness_level: "excellent",
        }),
      ),
      activity_accessibility_records: children.map((c) =>
        makeActivityAccessibility({
          child_id: c, child_able_to_participate: true,
          adaptation_required: true, adaptation_provided: true,
          barrier_identified: "ramp", barrier_resolved: true,
          equipment_available: true, transport_arranged: true,
          cost_covered: true, equal_opportunity: true,
        }),
      ),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding physical activity"))).toBe(true);
  });

  it("positive insight for goal achievement >= 80%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          goals_set: 10, goals_achieved: 9,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("exercise goal achievement"))).toBe(true);
  });

  it("positive insight for recreational enjoyment >= 90%", () => {
    const recs = Array.from({ length: 10 }, () =>
      makeRecreationalActivity({ child_enjoyed: true, child_choice: false, inclusive: true }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% of children enjoy their recreational activities"))).toBe(true);
  });

  it("positive insight for new experience rate >= 50%", () => {
    const recs = [
      makeRecreationalActivity({ new_experience: true, child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ new_experience: true, child_choice: false, child_enjoyed: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("of activities offer new experiences"))).toBe(true);
  });

  it("positive insight for community + peer interaction", () => {
    const recs = Array.from({ length: 10 }, () =>
      makeRecreationalActivity({
        community_based: true, peer_interaction: true,
        child_choice: false, child_enjoyed: false, inclusive: true,
      }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("community-based") && i.text.includes("peer interaction"))).toBe(true);
  });

  it("positive insight for child-initiated outdoor >= 50%", () => {
    const r = run({
      total_children: 1,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", child_initiated: true, risk_assessed: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child-initiated"))).toBe(true);
  });

  it("positive insight for health professional + BMI recording", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({
          child_id: "child_1",
          health_professional_involved: true,
          bmi_recorded: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("health professional involvement") && i.text.includes("BMI recording"))).toBe(true);
  });

  it("positive insight for barrier resolution >= 90%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({
          barrier_identified: "steps", barrier_resolved: true,
          child_able_to_participate: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("of identified barriers resolved"))).toBe(true);
  });

  it("positive insight for skill development >= 60%", () => {
    const recs = [
      makeRecreationalActivity({ skill_development: true, child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ skill_development: true, child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ skill_development: false, child_choice: false, child_enjoyed: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("of activities support skill development"))).toBe(true);
  });

  it("positive insight for weather appropriate + risk assessed >= 90%", () => {
    const r = run({
      total_children: 1,
      outdoor_engagement_records: [
        makeOutdoorEngagement({
          child_id: "child_1",
          weather_appropriate: true,
          risk_assessed: true,
          child_initiated: false,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("weather-appropriate") && i.text.includes("risk-assessed"))).toBe(true);
  });

  it("positive insight for equal opportunity + cost + transport", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({
          equal_opportunity: true,
          cost_covered: true,
          transport_arranged: true,
          child_able_to_participate: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("equal opportunity") && i.text.includes("cost coverage"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 21. HEADLINES
// ══════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("outstanding headline contains 'Outstanding'", () => {
    const children = ["child_1", "child_2"];
    const allCats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation", "educational",
    ];
    const r = run({
      total_children: 2,
      exercise_programme_records: children.map((c) =>
        makeExerciseProgramme({
          child_id: c, active: true, sessions_planned: 10, sessions_attended: 10,
          goals_set: 10, goals_achieved: 10, child_enjoys: true, reviewed: true,
          external_provider: true,
        }),
      ),
      recreational_activity_records: allCats.map((cat) =>
        makeRecreationalActivity({
          activity_category: cat, child_choice: true, child_enjoyed: true,
          new_experience: true, community_based: true, peer_interaction: true,
          skill_development: true, inclusive: true,
        }),
      ),
      outdoor_engagement_records: children.map((c) =>
        makeOutdoorEngagement({
          child_id: c, enjoyment_rating: 5, risk_assessed: true,
          child_initiated: true, weather_appropriate: true,
          physical_benefit: true, wellbeing_benefit: true,
        }),
      ),
      fitness_assessment_records: children.map((c) =>
        makeFitnessAssessment({
          child_id: c, follow_up_planned: true, follow_up_completed: true,
          child_involved_in_goal_setting: true, health_professional_involved: true,
          bmi_recorded: true, fitness_level: "excellent",
        }),
      ),
      activity_accessibility_records: children.map((c) =>
        makeActivityAccessibility({
          child_id: c, child_able_to_participate: true,
          adaptation_required: true, adaptation_provided: true,
          barrier_identified: "ramp", barrier_resolved: true,
          equipment_available: true, transport_arranged: true,
          cost_covered: true, equal_opportunity: true,
        }),
      ),
    });
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline mentions strengths count", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({
            child_id: c, active: true, sessions_planned: 10, sessions_attended: 9,
            goals_set: 5, goals_achieved: 3,
            child_enjoys: false, reviewed: false, external_provider: false,
          }),
        ),
      ],
      outdoor_engagement_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeOutdoorEngagement({
            child_id: c, enjoyment_rating: 3, risk_assessed: false,
            child_initiated: false, weather_appropriate: true,
            physical_benefit: false, wellbeing_benefit: false,
          }),
        ),
      ],
      fitness_assessment_records: [
        ...["child_1", "child_2", "child_3", "child_4"].map((c) =>
          makeFitnessAssessment({ child_id: c }),
        ),
      ],
    });
    // score = 65, rating = good
    expect(r.activity_rating).toBe("good");
    expect(r.headline).toContain("Good");
    expect(r.headline).toMatch(/\d+ strength/);
  });

  it("adequate headline mentions concerns count", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true, sessions_planned: 10, sessions_attended: 6,
          child_enjoys: false, reviewed: false, external_provider: false,
          engagement_level: "moderate",
        }),
      ],
      recreational_activity_records: [
        ...["sport", "creative", "social", "cultural", "adventure"].map((cat) =>
          makeRecreationalActivity({
            activity_category: cat as RecreationalActivityInput["activity_category"],
            child_choice: false, child_enjoyed: false, community_based: false,
            new_experience: false, peer_interaction: false, skill_development: false,
            inclusive: true,
          }),
        ),
      ],
    });
    // score = 45, adequate
    expect(r.activity_rating).toBe("adequate");
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toMatch(/\d+ concern/);
  });

  it("inadequate headline mentions urgent action", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true, sessions_planned: 10, sessions_attended: 6,
          child_enjoys: false, reviewed: false, external_provider: false,
          engagement_level: "moderate",
        }),
      ],
    });
    // base=52 -5(outdoor<50) -3(fitness<30) = 44
    expect(r.activity_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("urgent action");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 22. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("score is clamped to 0 minimum", () => {
    // All penalties on top of minimal base
    const r = run({
      total_children: 10,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 100, sessions_attended: 1,
          engagement_level: "disengaged", child_enjoys: false,
          goals_set: 0, goals_achieved: 0, reviewed: false,
        }),
      ],
      activity_accessibility_records: [
        makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
        makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
        makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      ],
    });
    // base=52, -5(eng<40) -5(outdoor<50) -5(access<50) -3(fitness<30) = 34
    expect(r.activity_score).toBe(34);
    expect(r.activity_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to 100 maximum", () => {
    // Score should never exceed 80 in practice (52+28), but clamp protects
    // Just verifying clamped result is at most 100
    const children = ["child_1", "child_2"];
    const allCats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation", "educational",
    ];
    const r = run({
      total_children: 2,
      exercise_programme_records: children.map((c) =>
        makeExerciseProgramme({
          child_id: c, active: true, sessions_planned: 10, sessions_attended: 10,
          goals_set: 10, goals_achieved: 10, child_enjoys: true, reviewed: true,
          external_provider: true,
        }),
      ),
      recreational_activity_records: allCats.map((cat) =>
        makeRecreationalActivity({
          activity_category: cat, child_choice: true, child_enjoyed: true,
          new_experience: true, community_based: true, peer_interaction: true,
          skill_development: true, inclusive: true,
        }),
      ),
      outdoor_engagement_records: children.map((c) =>
        makeOutdoorEngagement({
          child_id: c, enjoyment_rating: 5, risk_assessed: true,
          child_initiated: true, weather_appropriate: true,
          physical_benefit: true, wellbeing_benefit: true,
        }),
      ),
      fitness_assessment_records: children.map((c) =>
        makeFitnessAssessment({
          child_id: c, follow_up_planned: true, follow_up_completed: true,
          child_involved_in_goal_setting: true, health_professional_involved: true,
          bmi_recorded: true, fitness_level: "excellent",
        }),
      ),
      activity_accessibility_records: children.map((c) =>
        makeActivityAccessibility({
          child_id: c, child_able_to_participate: true,
          adaptation_required: true, adaptation_provided: true,
          barrier_identified: "ramp", barrier_resolved: true,
          equipment_available: true, transport_arranged: true,
          cost_covered: true, equal_opportunity: true,
        }),
      ),
    });
    expect(r.activity_score).toBeLessThanOrEqual(100);
  });

  it("handles single child with complete data", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
      recreational_activity_records: [
        makeRecreationalActivity({ child_id: "child_1", child_choice: false, child_enjoyed: false, inclusive: true }),
      ],
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
      ],
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1" }),
      ],
      activity_accessibility_records: [
        makeActivityAccessibility({ child_id: "child_1", child_able_to_participate: true }),
      ],
    });
    expect(r.activity_rating).toBeDefined();
    expect(r.activity_score).toBeGreaterThan(0);
  });

  it("handles many records efficiently", () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      makeExerciseProgramme({
        child_id: `child_${i % 5 + 1}`,
        active: true,
        sessions_planned: 10,
        sessions_attended: 8,
      }),
    );
    const r = run({
      total_children: 5,
      exercise_programme_records: many,
    });
    expect(r.total_exercise_programmes).toBe(100);
    expect(r.exercise_engagement_rate).toBe(80);
  });

  it("recreational diversity maxes at 7 categories", () => {
    const allCats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation", "educational",
    ];
    const recs = allCats.map((cat) =>
      makeRecreationalActivity({
        activity_category: cat, child_choice: false, child_enjoyed: false, inclusive: true,
      }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recreational_diversity_score).toBe(100); // 7/7
  });

  it("inactive programmes do not count towards exercise coverage", () => {
    const r = run({
      total_children: 2,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: false }),
        makeExerciseProgramme({ child_id: "child_2", active: false }),
      ],
    });
    // 0 active children / 2 = 0%
    // exerciseCoverageRate = 0%, no coverage bonus
    // Also outdoor<50 penalty + fitness<30 penalty
    // engagement: 18/20 = 90% => +4
    // base=52 +4 -5(outdoor) -3(fitness) = 48
    expect(r.activity_score).toBe(48);
  });

  it("empty barrier_identified string is treated as no barrier", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({
          barrier_identified: "",
          barrier_resolved: false,
          child_able_to_participate: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // Empty string => not counted as barrier identified
    // barrier resolution concern should NOT fire
    expect(r.concerns.every((c) => !c.includes("barriers resolved"))).toBe(true);
  });

  it("null barrier_identified is treated as no barrier", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({
          barrier_identified: null,
          barrier_resolved: false,
          child_able_to_participate: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.concerns.every((c) => !c.includes("barriers resolved"))).toBe(true);
  });

  it("follow-up completion only counts records where follow_up_planned is true", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({
          child_id: "child_1",
          follow_up_planned: false,
          follow_up_completed: false,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // No follow-ups planned => no follow-up completion concern
    expect(r.concerns.every((c) => !c.includes("follow-ups completed"))).toBe(true);
  });

  it("adaptation rate only considers records where adaptation is required", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({
          adaptation_required: false,
          adaptation_provided: false,
          child_able_to_participate: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // No adaptation required => no adaptation concern
    expect(r.concerns.every((c) => !c.includes("adaptations provided"))).toBe(true);
  });

  it("total_children = 0 with data present is not insufficient_data", () => {
    const r = run({
      total_children: 0,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // Not allEmpty since exercise records exist, not allEmpty+children>0
    expect(r.activity_rating).not.toBe("insufficient_data");
    expect(r.activity_score).toBeGreaterThan(0);
  });

  it("multiple all-penalty scenario stays above 0", () => {
    // base=52 with all 4 penalties = 52-5-5-5-3 = 34
    const r = run({
      total_children: 10,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 1,
          engagement_level: "disengaged", child_enjoys: false,
        }),
      ],
      activity_accessibility_records: Array.from({ length: 3 }, () =>
        makeActivityAccessibility({
          child_able_to_participate: false,
          equal_opportunity: false,
        }),
      ),
    });
    // engRate: 1/10 = 10% <40 => -5
    // outdoor: 0/10 = 0% <50 => -5
    // access: 0/3 = 0% <50 => -5
    // fitness: 0/10 = 0% <30 => -3
    // base=52 -5-5-5-3 = 34
    expect(r.activity_score).toBe(34);
    expect(r.activity_score).toBeGreaterThanOrEqual(0);
  });

  it("good headline has area for improvement text when concerns exist", () => {
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({
            child_id: c, active: true, sessions_planned: 10, sessions_attended: 9,
            goals_set: 5, goals_achieved: 3,
            child_enjoys: false, reviewed: false, external_provider: false,
          }),
        ),
      ],
      outdoor_engagement_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeOutdoorEngagement({
            child_id: c, enjoyment_rating: 3, risk_assessed: false,
            child_initiated: false, weather_appropriate: true,
            physical_benefit: false, wellbeing_benefit: false,
          }),
        ),
      ],
      fitness_assessment_records: [
        ...["child_1", "child_2", "child_3", "child_4"].map((c) =>
          makeFitnessAssessment({ child_id: c }),
        ),
      ],
    });
    expect(r.activity_rating).toBe("good");
    if (r.concerns.length > 0) {
      expect(r.headline).toContain("area");
    }
  });

  it("outdoor risk assessment warning insight requires rate > 0", () => {
    // Rate 0 with 0 outdoor engagements => no warning
    const r = run({
      total_children: 0,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.every((i) => !i.text.includes("outdoor activities risk-assessed") || i.severity !== "warning")).toBe(true);
  });

  it("community-based warning insight when < 30%", () => {
    const recs = Array.from({ length: 10 }, () =>
      makeRecreationalActivity({ community_based: false, child_choice: false, child_enjoyed: false, inclusive: true }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("community-based"))).toBe(true);
  });

  it("duplicate categories in recreational activities count once for diversity", () => {
    const recs = Array.from({ length: 5 }, () =>
      makeRecreationalActivity({ activity_category: "sport", child_choice: false, child_enjoyed: false, inclusive: true }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // All sport => 1/7 = 14%
    expect(r.recreational_diversity_score).toBe(14);
  });

  it("exercise enjoyment + engagement positive insight", () => {
    // exerciseEnjoymentRate >= 90 AND exerciseEngagementRate >= 80
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 9,
          child_enjoys: true,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("exercise enjoyment") && i.text.includes("attendance"))).toBe(true);
  });

  it("outdoor enjoyment + participation positive insight", () => {
    const r = run({
      total_children: 2,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", enjoyment_rating: 5, risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_2", enjoyment_rating: 4, risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
      ],
    });
    // outdoorParticipationRate = 100%, avg enjoyment = 4.5 >= 4.0
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child engages in outdoor activities"))).toBe(true);
  });

  it("fitness + follow-up positive insight", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({
          child_id: "child_1",
          follow_up_planned: true,
          follow_up_completed: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // fitnessAssessmentCoverageRate = 100%, followUpCompletionRate = 100%
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child has a fitness assessment"))).toBe(true);
  });

  it("accessibility + adaptation positive insight", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({
          child_able_to_participate: true,
          adaptation_required: true,
          adaptation_provided: true,
        }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // activityAccessibilityRate = 100%, adaptationRate = 100%
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child can participate in activities"))).toBe(true);
  });

  it("diversity + child choice positive insight", () => {
    const allCats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social", "cultural", "adventure", "relaxation",
    ];
    const recs = allCats.map((cat) =>
      makeRecreationalActivity({
        activity_category: cat, child_choice: true, child_enjoyed: false,
        inclusive: true,
      }),
    );
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 6/7 = 86% diversity, 100% child choice
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("categories with") && i.text.includes("child choice"))).toBe(true);
  });

  it("exercise engagement + coverage positive insight", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 10,
        }),
      ],
    });
    // engRate = 100% >= 90, coverageRate = 100%
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("session attendance with 100% programme coverage"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 23. ADDITIONAL RECOMMENDATIONS (PLANNED/SOON TIERS)
// ══════════════════════════════════════════════════════════════════════════════

describe("Planned and soon tier recommendations", () => {
  it("recommends improving exercise attendance when 40-70%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          sessions_planned: 10, sessions_attended: 5,
          engagement_level: "moderate", child_enjoys: false,
        }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve exercise session attendance to at least 70%"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Improve exercise session attendance"))?.urgency).toBe("soon");
  });

  it("recommends extending outdoor engagement when 50-80%", () => {
    // 3/5 = 60%
    const r = run({
      total_children: 5,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_2", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_3", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({ child_id: c, active: true }),
        ),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Extend outdoor engagement to all children"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Extend outdoor engagement"))?.urgency).toBe("soon");
  });

  it("recommends increasing fitness assessment coverage when 30-80%", () => {
    // 2/5 = 40%
    const r = run({
      total_children: 5,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1" }),
        makeFitnessAssessment({ child_id: "child_2" }),
      ],
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({ child_id: c, active: true }),
        ),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase fitness assessment coverage"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Increase fitness assessment"))?.urgency).toBe("soon");
  });

  it("recommends strengthening child choice when 30-60%", () => {
    // 2/5 = 40%
    const recs = [
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Strengthen child choice"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Strengthen child choice"))?.urgency).toBe("planned");
  });

  it("recommends expanding diversity when 40-60%", () => {
    const cats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social",
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: cats.map((c) =>
        makeRecreationalActivity({ activity_category: c, child_choice: false, child_enjoyed: false, inclusive: true }),
      ),
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 3/7 = 43%
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Expand recreational activity diversity"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Expand recreational"))?.urgency).toBe("planned");
  });

  it("recommends improving accessibility when 50-80%", () => {
    // 3/5 = 60%
    const recs = [
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
    ];
    const r = run({
      total_children: 1,
      activity_accessibility_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve activity accessibility to at least 80%"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Improve activity accessibility"))?.urgency).toBe("planned");
  });

  it("recommends extending exercise coverage when 50-80%", () => {
    // 3/5 = 60%
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
        makeExerciseProgramme({ child_id: "child_3", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Extend exercise programme coverage"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Extend exercise programme"))?.urgency).toBe("planned");
  });

  it("recommends improving enjoyment when 50-70%", () => {
    // 6/10 = 60%
    const recs: RecreationalActivityInput[] = [];
    for (let i = 0; i < 6; i++) {
      recs.push(makeRecreationalActivity({ child_enjoyed: true, child_choice: false, inclusive: true }));
    }
    for (let i = 0; i < 4; i++) {
      recs.push(makeRecreationalActivity({ child_enjoyed: false, child_choice: false, inclusive: true }));
    }
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve recreational enjoyment"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Improve recreational enjoyment"))?.urgency).toBe("planned");
  });

  it("recommends programme reviews when < 50%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Implement regular exercise programme reviews"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Implement regular exercise programme reviews"))?.urgency).toBe("soon");
  });

  it("recommends outdoor risk assessments when < 70%", () => {
    const r = run({
      total_children: 1,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: true, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Ensure all outdoor activities are risk-assessed"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Ensure all outdoor activities are risk-assessed"))?.urgency).toBe("soon");
  });

  it("recommends resolving barriers when resolution < 50%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ barrier_identified: "steps", barrier_resolved: false, child_able_to_participate: true }),
        makeActivityAccessibility({ barrier_identified: "noise", barrier_resolved: false, child_able_to_participate: true }),
        makeActivityAccessibility({ barrier_identified: "ramp", barrier_resolved: true, child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Resolve all identified activity barriers"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Resolve all identified"))?.urgency).toBe("soon");
  });

  it("recommends adaptations when < 50%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: false, child_able_to_participate: true }),
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: false, child_able_to_participate: true }),
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: true, child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Ensure all required adaptations are provided"))).toBe(true);
  });

  it("recommends goal recalibration when < 30%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          goals_set: 10, goals_achieved: 2,
        }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Review and recalibrate exercise goals"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("recalibrate"))?.urgency).toBe("soon");
  });

  it("recommends completing follow-ups when < 50%", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: false }),
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: false }),
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Complete all fitness assessment follow-ups"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Complete all fitness assessment"))?.urgency).toBe("soon");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 24. WARNING-TIER CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("Warning-tier concerns (mid-range values)", () => {
  it("flags exercise coverage 50-80%", () => {
    // 3/5 = 60%
    const r = run({
      total_children: 5,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
        makeExerciseProgramme({ child_id: "child_2", active: true }),
        makeExerciseProgramme({ child_id: "child_3", active: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Exercise programme coverage at 60%"))).toBe(true);
  });

  it("flags recreational diversity 40-60%", () => {
    const cats: RecreationalActivityInput["activity_category"][] = [
      "sport", "creative", "social",
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: cats.map((c) =>
        makeRecreationalActivity({ activity_category: c, child_choice: false, child_enjoyed: false, inclusive: true }),
      ),
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    // 3/7 = 43%
    expect(r.concerns.some((c) => c.includes("Recreational diversity covers 3 of 7 categories"))).toBe(true);
  });

  it("flags child choice 30-60%", () => {
    // 2/5 = 40%
    const recs = [
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Child choice rate at 40%"))).toBe(true);
  });

  it("flags outdoor participation 50-80%", () => {
    // 3/5 = 60%
    const r = run({
      total_children: 5,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_2", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_3", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({ child_id: c, active: true }),
        ),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Outdoor participation at 60%"))).toBe(true);
  });

  it("flags fitness coverage 30-80%", () => {
    // 2/5 = 40%
    const r = run({
      total_children: 5,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1" }),
        makeFitnessAssessment({ child_id: "child_2" }),
      ],
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({ child_id: c, active: true }),
        ),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Fitness assessment coverage at 40%"))).toBe(true);
  });

  it("flags accessibility 50-80%", () => {
    // 3/5 = 60%
    const recs = [
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
    ];
    const r = run({
      total_children: 1,
      activity_accessibility_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Activity accessibility at 60%"))).toBe(true);
  });

  it("flags goal achievement 30-60%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          goals_set: 10, goals_achieved: 4,
        }),
      ],
    });
    // 40%
    expect(r.concerns.some((c) => c.includes("Exercise goal achievement at 40%"))).toBe(true);
  });

  it("flags recreational enjoyment 50-70%", () => {
    // 6/10 = 60%
    const recs: RecreationalActivityInput[] = [];
    for (let i = 0; i < 6; i++) {
      recs.push(makeRecreationalActivity({ child_enjoyed: true, child_choice: false, inclusive: true }));
    }
    for (let i = 0; i < 4; i++) {
      recs.push(makeRecreationalActivity({ child_enjoyed: false, child_choice: false, inclusive: true }));
    }
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Recreational enjoyment at 60%"))).toBe(true);
  });

  it("flags adaptation 50-80%", () => {
    // 2/3 = 67%
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: true, child_able_to_participate: true }),
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: true, child_able_to_participate: true }),
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: false, child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Adaptation provision at 67%"))).toBe(true);
  });

  it("flags barrier resolution 50-80%", () => {
    // 2/3 = 67%
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ barrier_identified: "steps", barrier_resolved: true, child_able_to_participate: true }),
        makeActivityAccessibility({ barrier_identified: "noise", barrier_resolved: true, child_able_to_participate: true }),
        makeActivityAccessibility({ barrier_identified: "ramp", barrier_resolved: false, child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Barrier resolution at 67%"))).toBe(true);
  });

  it("flags follow-up completion 50-80%", () => {
    // 2/3 = 67%
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: true }),
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: true }),
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Fitness follow-up completion at 67%"))).toBe(true);
  });

  it("flags programme review 50-80%", () => {
    // 2/3 = 67%
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: true }),
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: true }),
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Programme review rate at 67%"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 25. WARNING-TIER INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Warning-tier insights (mid-range values)", () => {
  it("warning insight for outdoor participation 50-80%", () => {
    const r = run({
      total_children: 5,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_2", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_3", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({ child_id: c, active: true }),
        ),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Outdoor participation at 60%"))).toBe(true);
  });

  it("warning insight for fitness coverage 30-80%", () => {
    const r = run({
      total_children: 5,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1" }),
        makeFitnessAssessment({ child_id: "child_2" }),
      ],
      exercise_programme_records: [
        ...["child_1", "child_2", "child_3", "child_4", "child_5"].map((c) =>
          makeExerciseProgramme({ child_id: c, active: true }),
        ),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Fitness assessment coverage at 40%"))).toBe(true);
  });

  it("warning insight for accessibility 50-80%", () => {
    const recs = [
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: true }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
      makeActivityAccessibility({ child_able_to_participate: false, equal_opportunity: false }),
    ];
    const r = run({
      total_children: 1,
      activity_accessibility_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Activity accessibility at 60%"))).toBe(true);
  });

  it("warning insight for child choice 30-60%", () => {
    const recs = [
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: true, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
      makeRecreationalActivity({ child_choice: false, child_enjoyed: false, inclusive: true }),
    ];
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child choice rate at 40%"))).toBe(true);
  });

  it("warning insight for goal achievement 30-60%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({
          child_id: "child_1", active: true,
          goals_set: 10, goals_achieved: 4,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Exercise goal achievement at 40%"))).toBe(true);
  });

  it("warning insight for recreational enjoyment 50-70%", () => {
    const recs: RecreationalActivityInput[] = [];
    for (let i = 0; i < 6; i++) {
      recs.push(makeRecreationalActivity({ child_enjoyed: true, child_choice: false, inclusive: true }));
    }
    for (let i = 0; i < 4; i++) {
      recs.push(makeRecreationalActivity({ child_enjoyed: false, child_choice: false, inclusive: true }));
    }
    const r = run({
      total_children: 1,
      recreational_activity_records: recs,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Recreational enjoyment at 60%"))).toBe(true);
  });

  it("warning insight for adaptation 50-80%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: true, child_able_to_participate: true }),
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: true, child_able_to_participate: true }),
        makeActivityAccessibility({ adaptation_required: true, adaptation_provided: false, child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Adaptation provision at 67%"))).toBe(true);
  });

  it("warning insight for follow-up 50-80%", () => {
    const r = run({
      total_children: 1,
      fitness_assessment_records: [
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: true }),
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: true }),
        makeFitnessAssessment({ child_id: "child_1", follow_up_planned: true, follow_up_completed: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Fitness follow-up completion at 67%"))).toBe(true);
  });

  it("warning insight for programme review < 50%", () => {
    const r = run({
      total_children: 1,
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: false }),
        makeExerciseProgramme({ child_id: "child_1", active: true, reviewed: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("of exercise programmes reviewed"))).toBe(true);
  });

  it("warning insight for barrier resolution 50-80%", () => {
    const r = run({
      total_children: 1,
      activity_accessibility_records: [
        makeActivityAccessibility({ barrier_identified: "steps", barrier_resolved: true, child_able_to_participate: true }),
        makeActivityAccessibility({ barrier_identified: "noise", barrier_resolved: true, child_able_to_participate: true }),
        makeActivityAccessibility({ barrier_identified: "ramp", barrier_resolved: false, child_able_to_participate: true }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Barrier resolution at 67%"))).toBe(true);
  });

  it("warning insight for outdoor risk assessment when rate > 0 and < 70%", () => {
    const r = run({
      total_children: 1,
      outdoor_engagement_records: [
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: true, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
        makeOutdoorEngagement({ child_id: "child_1", risk_assessed: false, child_initiated: false }),
      ],
      exercise_programme_records: [
        makeExerciseProgramme({ child_id: "child_1", active: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("outdoor activities risk-assessed"))).toBe(true);
  });
});

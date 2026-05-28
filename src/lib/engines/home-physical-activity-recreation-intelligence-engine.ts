// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PHYSICAL ACTIVITY & RECREATION INTELLIGENCE ENGINE
// Evaluates physical activity and recreation provision: exercise programme
// engagement, recreational activity diversity, outdoor engagement, fitness
// assessments, and activity accessibility.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 7 (Children's plan — health & development),
// Reg 9 (Enjoyment & achievement), Reg 10 (Health).
// SCCIF: "Children enjoy a wide range of activities that promote their
// physical and emotional well-being."
// Store keys: exerciseProgrammeRecords, recreationalActivityRecords,
//             outdoorEngagementRecords, fitnessAssessmentRecords,
//             activityAccessibilityRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ExerciseProgrammeInput {
  id: string;
  child_id: string;
  programme_name: string;
  programme_type: "individual" | "group" | "therapeutic" | "competitive";
  start_date: string;
  end_date: string | null;
  active: boolean;
  sessions_planned: number;
  sessions_attended: number;
  engagement_level: "high" | "moderate" | "low" | "disengaged";
  progress_notes: string | null;
  child_enjoys: boolean;
  staff_led: boolean;
  external_provider: boolean;
  goals_set: number;
  goals_achieved: number;
  reviewed: boolean;
  review_date: string | null;
  created_at: string;
}

export interface RecreationalActivityInput {
  id: string;
  child_id: string;
  activity_name: string;
  activity_category: "sport" | "creative" | "social" | "cultural" | "adventure" | "relaxation" | "educational";
  date: string;
  duration_minutes: number;
  child_choice: boolean;
  child_enjoyed: boolean;
  participation_level: "full" | "partial" | "observed" | "declined";
  inclusive: boolean;
  skill_development: boolean;
  peer_interaction: boolean;
  new_experience: boolean;
  staff_facilitated: boolean;
  community_based: boolean;
  created_at: string;
}

export interface OutdoorEngagementInput {
  id: string;
  child_id: string;
  date: string;
  activity_type: "walk" | "park" | "sports" | "gardening" | "nature" | "adventure" | "playground" | "cycling" | "other";
  duration_minutes: number;
  weather_appropriate: boolean;
  child_initiated: boolean;
  supervised: boolean;
  location: string;
  enjoyment_rating: number; // 1-5
  physical_benefit: boolean;
  wellbeing_benefit: boolean;
  risk_assessed: boolean;
  created_at: string;
}

export interface FitnessAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor: string;
  assessment_type: "baseline" | "periodic" | "annual" | "targeted";
  fitness_level: "excellent" | "good" | "moderate" | "below_average" | "poor";
  bmi_recorded: boolean;
  activity_recommendations_given: boolean;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  child_involved_in_goal_setting: boolean;
  health_professional_involved: boolean;
  review_date: string | null;
  created_at: string;
}

export interface ActivityAccessibilityInput {
  id: string;
  child_id: string;
  date: string;
  activity_type: string;
  accessibility_need: "physical" | "sensory" | "cognitive" | "emotional" | "none";
  adaptation_required: boolean;
  adaptation_provided: boolean;
  barrier_identified: string | null;
  barrier_resolved: boolean;
  child_able_to_participate: boolean;
  equipment_available: boolean;
  transport_arranged: boolean;
  cost_covered: boolean;
  equal_opportunity: boolean;
  created_at: string;
}

export interface PhysicalActivityRecreationInput {
  today: string;
  total_children: number;
  exercise_programme_records: ExerciseProgrammeInput[];
  recreational_activity_records: RecreationalActivityInput[];
  outdoor_engagement_records: OutdoorEngagementInput[];
  fitness_assessment_records: FitnessAssessmentInput[];
  activity_accessibility_records: ActivityAccessibilityInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PhysicalActivityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PhysicalActivityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PhysicalActivityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PhysicalActivityRecreationResult {
  activity_rating: PhysicalActivityRating;
  activity_score: number;
  headline: string;
  total_exercise_programmes: number;
  total_recreational_activities: number;
  total_outdoor_engagements: number;
  total_fitness_assessments: number;
  total_accessibility_records: number;
  exercise_engagement_rate: number;
  recreational_diversity_score: number;
  outdoor_participation_rate: number;
  fitness_assessment_coverage_rate: number;
  activity_accessibility_rate: number;
  child_choice_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: PhysicalActivityRecommendation[];
  insights: PhysicalActivityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PhysicalActivityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: PhysicalActivityRating,
  score: number,
  headline: string,
): PhysicalActivityRecreationResult {
  return {
    activity_rating: rating,
    activity_score: score,
    headline,
    total_exercise_programmes: 0,
    total_recreational_activities: 0,
    total_outdoor_engagements: 0,
    total_fitness_assessments: 0,
    total_accessibility_records: 0,
    exercise_engagement_rate: 0,
    recreational_diversity_score: 0,
    outdoor_participation_rate: 0,
    fitness_assessment_coverage_rate: 0,
    activity_accessibility_rate: 0,
    child_choice_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computePhysicalActivityRecreation(
  input: PhysicalActivityRecreationInput,
): PhysicalActivityRecreationResult {
  const {
    total_children,
    exercise_programme_records,
    recreational_activity_records,
    outdoor_engagement_records,
    fitness_assessment_records,
    activity_accessibility_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    exercise_programme_records.length === 0 &&
    recreational_activity_records.length === 0 &&
    outdoor_engagement_records.length === 0 &&
    fitness_assessment_records.length === 0 &&
    activity_accessibility_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess physical activity and recreation provision.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No physical activity or recreation data recorded despite children on placement — exercise programmes, recreational activities, outdoor engagement, and fitness assessments require urgent attention.",
      ),
      concerns: [
        "No exercise programmes, recreational activities, outdoor engagement records, fitness assessments, or accessibility records exist despite children being on placement — the home cannot evidence provision of physical activity and recreation opportunities.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of exercise programmes, recreational activities, outdoor engagement, fitness assessments, and activity accessibility to evidence the home's provision of physical activity and recreation for all children.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has a documented exercise programme or activity plan that promotes their physical health and well-being, with regular fitness assessments and access to diverse recreational opportunities.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 10 — Health",
        },
      ],
      insights: [
        {
          text: "The complete absence of physical activity and recreation records means Ofsted cannot verify that children enjoy a range of activities promoting their physical and emotional well-being. This represents a fundamental gap in Reg 9 (enjoyment & achievement) and Reg 10 (health) compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Exercise programme metrics ---
  const totalExerciseProgrammes = exercise_programme_records.length;
  const activeExerciseProgrammes = exercise_programme_records.filter((e) => e.active).length;

  const totalSessionsPlanned = exercise_programme_records.reduce(
    (sum, e) => sum + e.sessions_planned,
    0,
  );
  const totalSessionsAttended = exercise_programme_records.reduce(
    (sum, e) => sum + e.sessions_attended,
    0,
  );
  const exerciseEngagementRate = pct(totalSessionsAttended, totalSessionsPlanned);

  const highEngagement = exercise_programme_records.filter(
    (e) => e.engagement_level === "high",
  ).length;
  const moderateEngagement = exercise_programme_records.filter(
    (e) => e.engagement_level === "moderate",
  ).length;
  const highOrModerateEngagementRate = pct(
    highEngagement + moderateEngagement,
    totalExerciseProgrammes,
  );

  const childEnjoysExercise = exercise_programme_records.filter((e) => e.child_enjoys).length;
  const exerciseEnjoymentRate = pct(childEnjoysExercise, totalExerciseProgrammes);

  const totalGoalsSet = exercise_programme_records.reduce(
    (sum, e) => sum + e.goals_set,
    0,
  );
  const totalGoalsAchieved = exercise_programme_records.reduce(
    (sum, e) => sum + e.goals_achieved,
    0,
  );
  const goalAchievementRate = pct(totalGoalsAchieved, totalGoalsSet);

  const reviewedProgrammes = exercise_programme_records.filter((e) => e.reviewed).length;
  const programmeReviewRate = pct(reviewedProgrammes, totalExerciseProgrammes);

  const uniqueChildrenWithExercise = new Set(
    exercise_programme_records.filter((e) => e.active).map((e) => e.child_id),
  ).size;
  const exerciseCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithExercise, total_children) : 0;

  const externalProviders = exercise_programme_records.filter((e) => e.external_provider).length;
  const externalProviderRate = pct(externalProviders, totalExerciseProgrammes);

  const therapeuticProgrammes = exercise_programme_records.filter(
    (e) => e.programme_type === "therapeutic",
  ).length;
  const competitiveProgrammes = exercise_programme_records.filter(
    (e) => e.programme_type === "competitive",
  ).length;

  // --- Recreational activity metrics ---
  const totalRecActivities = recreational_activity_records.length;

  const distinctCategories = new Set(
    recreational_activity_records.map((r) => r.activity_category),
  );
  const totalPossibleCategories = 7; // sport, creative, social, cultural, adventure, relaxation, educational
  const recreationalDiversityScore = pct(distinctCategories.size, totalPossibleCategories);

  const childChoiceActivities = recreational_activity_records.filter(
    (r) => r.child_choice,
  ).length;
  const childChoiceRate = pct(childChoiceActivities, totalRecActivities);

  const childEnjoyedActivities = recreational_activity_records.filter(
    (r) => r.child_enjoyed,
  ).length;
  const recreationalEnjoymentRate = pct(childEnjoyedActivities, totalRecActivities);

  const fullParticipation = recreational_activity_records.filter(
    (r) => r.participation_level === "full",
  ).length;
  const partialParticipation = recreational_activity_records.filter(
    (r) => r.participation_level === "partial",
  ).length;
  const recParticipationRate = pct(
    fullParticipation + partialParticipation,
    totalRecActivities,
  );

  const inclusiveActivities = recreational_activity_records.filter(
    (r) => r.inclusive,
  ).length;
  const inclusivityRate = pct(inclusiveActivities, totalRecActivities);

  const skillDevelopmentActivities = recreational_activity_records.filter(
    (r) => r.skill_development,
  ).length;
  const skillDevRate = pct(skillDevelopmentActivities, totalRecActivities);

  const peerInteractionActivities = recreational_activity_records.filter(
    (r) => r.peer_interaction,
  ).length;
  const peerInteractionRate = pct(peerInteractionActivities, totalRecActivities);

  const newExperienceActivities = recreational_activity_records.filter(
    (r) => r.new_experience,
  ).length;
  const newExperienceRate = pct(newExperienceActivities, totalRecActivities);

  const communityBasedActivities = recreational_activity_records.filter(
    (r) => r.community_based,
  ).length;
  const communityBasedRate = pct(communityBasedActivities, totalRecActivities);

  const uniqueChildrenWithRecActivities = new Set(
    recreational_activity_records.map((r) => r.child_id),
  ).size;
  const recActivityCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithRecActivities, total_children) : 0;

  // --- Outdoor engagement metrics ---
  const totalOutdoorEngagements = outdoor_engagement_records.length;

  const uniqueChildrenOutdoors = new Set(
    outdoor_engagement_records.map((o) => o.child_id),
  ).size;
  const outdoorParticipationRate =
    total_children > 0 ? pct(uniqueChildrenOutdoors, total_children) : 0;

  const outdoorEnjoymentSum = outdoor_engagement_records.reduce(
    (sum, o) => sum + o.enjoyment_rating,
    0,
  );
  const outdoorEnjoymentAvg =
    totalOutdoorEngagements > 0
      ? Math.round((outdoorEnjoymentSum / totalOutdoorEngagements) * 100) / 100
      : 0;

  const outdoorPhysicalBenefit = outdoor_engagement_records.filter(
    (o) => o.physical_benefit,
  ).length;
  const outdoorPhysicalBenefitRate = pct(outdoorPhysicalBenefit, totalOutdoorEngagements);

  const outdoorWellbeingBenefit = outdoor_engagement_records.filter(
    (o) => o.wellbeing_benefit,
  ).length;
  const outdoorWellbeingBenefitRate = pct(outdoorWellbeingBenefit, totalOutdoorEngagements);

  const outdoorRiskAssessed = outdoor_engagement_records.filter(
    (o) => o.risk_assessed,
  ).length;
  const outdoorRiskAssessedRate = pct(outdoorRiskAssessed, totalOutdoorEngagements);

  const childInitiatedOutdoor = outdoor_engagement_records.filter(
    (o) => o.child_initiated,
  ).length;
  const childInitiatedOutdoorRate = pct(childInitiatedOutdoor, totalOutdoorEngagements);

  const weatherAppropriate = outdoor_engagement_records.filter(
    (o) => o.weather_appropriate,
  ).length;
  const weatherAppropriateRate = pct(weatherAppropriate, totalOutdoorEngagements);

  const distinctOutdoorTypes = new Set(
    outdoor_engagement_records.map((o) => o.activity_type),
  );
  const outdoorDiversityCount = distinctOutdoorTypes.size;

  const avgOutdoorDuration =
    totalOutdoorEngagements > 0
      ? Math.round(
          outdoor_engagement_records.reduce((sum, o) => sum + o.duration_minutes, 0) /
            totalOutdoorEngagements,
        )
      : 0;

  // --- Fitness assessment metrics ---
  const totalFitnessAssessments = fitness_assessment_records.length;

  const uniqueChildrenAssessed = new Set(
    fitness_assessment_records.map((f) => f.child_id),
  ).size;
  const fitnessAssessmentCoverageRate =
    total_children > 0 ? pct(uniqueChildrenAssessed, total_children) : 0;

  const recsGiven = fitness_assessment_records.filter(
    (f) => f.activity_recommendations_given,
  ).length;
  const recsGivenRate = pct(recsGiven, totalFitnessAssessments);

  const followUpPlanned = fitness_assessment_records.filter(
    (f) => f.follow_up_planned,
  ).length;
  const followUpCompleted = fitness_assessment_records.filter(
    (f) => f.follow_up_planned && f.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpPlanned);

  const childInvolvedGoalSetting = fitness_assessment_records.filter(
    (f) => f.child_involved_in_goal_setting,
  ).length;
  const childInvolvedGoalSettingRate = pct(childInvolvedGoalSetting, totalFitnessAssessments);

  const healthProfInvolved = fitness_assessment_records.filter(
    (f) => f.health_professional_involved,
  ).length;
  const healthProfInvolvedRate = pct(healthProfInvolved, totalFitnessAssessments);

  const excellentOrGoodFitness = fitness_assessment_records.filter(
    (f) => f.fitness_level === "excellent" || f.fitness_level === "good",
  ).length;
  const goodFitnessRate = pct(excellentOrGoodFitness, totalFitnessAssessments);

  const bmiRecorded = fitness_assessment_records.filter((f) => f.bmi_recorded).length;
  const bmiRecordedRate = pct(bmiRecorded, totalFitnessAssessments);

  // --- Activity accessibility metrics ---
  const totalAccessibilityRecords = activity_accessibility_records.length;

  const adaptationRequired = activity_accessibility_records.filter(
    (a) => a.adaptation_required,
  ).length;
  const adaptationProvided = activity_accessibility_records.filter(
    (a) => a.adaptation_required && a.adaptation_provided,
  ).length;
  const adaptationRate = pct(adaptationProvided, adaptationRequired);

  const barrierIdentified = activity_accessibility_records.filter(
    (a) => a.barrier_identified !== null && a.barrier_identified !== "",
  ).length;
  const barrierResolved = activity_accessibility_records.filter(
    (a) =>
      a.barrier_identified !== null &&
      a.barrier_identified !== "" &&
      a.barrier_resolved,
  ).length;
  const barrierResolutionRate = pct(barrierResolved, barrierIdentified);

  const ableToParticipate = activity_accessibility_records.filter(
    (a) => a.child_able_to_participate,
  ).length;
  const activityAccessibilityRate = pct(ableToParticipate, totalAccessibilityRecords);

  const equipmentAvailable = activity_accessibility_records.filter(
    (a) => a.equipment_available,
  ).length;
  const equipmentAvailableRate = pct(equipmentAvailable, totalAccessibilityRecords);

  const transportArranged = activity_accessibility_records.filter(
    (a) => a.transport_arranged,
  ).length;
  const transportArrangedRate = pct(transportArranged, totalAccessibilityRecords);

  const costCovered = activity_accessibility_records.filter(
    (a) => a.cost_covered,
  ).length;
  const costCoveredRate = pct(costCovered, totalAccessibilityRecords);

  const equalOpportunity = activity_accessibility_records.filter(
    (a) => a.equal_opportunity,
  ).length;
  const equalOpportunityRate = pct(equalOpportunity, totalAccessibilityRecords);

  const uniqueChildrenWithAccessibility = new Set(
    activity_accessibility_records.filter((a) => a.child_able_to_participate).map((a) => a.child_id),
  ).size;

  // ── Scoring: base 52, 9 bonus categories summing to 28 (max 80) ──────

  let score = 52;

  // --- Bonus 1: exerciseEngagementRate (>=90: +4, >=70: +2) --- [max 4]
  if (exerciseEngagementRate >= 90) score += 4;
  else if (exerciseEngagementRate >= 70) score += 2;

  // --- Bonus 2: recreationalDiversityScore (>=80: +3, >=60: +1) --- [max 3]
  if (recreationalDiversityScore >= 80) score += 3;
  else if (recreationalDiversityScore >= 60) score += 1;

  // --- Bonus 3: outdoorParticipationRate (>=100: +4, >=80: +2) --- [max 4]
  if (outdoorParticipationRate >= 100) score += 4;
  else if (outdoorParticipationRate >= 80) score += 2;

  // --- Bonus 4: fitnessAssessmentCoverageRate (>=100: +3, >=80: +1) --- [max 3]
  if (fitnessAssessmentCoverageRate >= 100) score += 3;
  else if (fitnessAssessmentCoverageRate >= 80) score += 1;

  // --- Bonus 5: activityAccessibilityRate (>=100: +3, >=80: +1) --- [max 3]
  if (activityAccessibilityRate >= 100) score += 3;
  else if (activityAccessibilityRate >= 80) score += 1;

  // --- Bonus 6: childChoiceRate (>=80: +3, >=60: +1) --- [max 3]
  if (childChoiceRate >= 80) score += 3;
  else if (childChoiceRate >= 60) score += 1;

  // --- Bonus 7: exerciseCoverageRate (>=100: +3, >=80: +1) --- [max 3]
  if (exerciseCoverageRate >= 100) score += 3;
  else if (exerciseCoverageRate >= 80) score += 1;

  // --- Bonus 8: goalAchievementRate (>=80: +2, >=60: +1) --- [max 2]
  if (goalAchievementRate >= 80) score += 2;
  else if (goalAchievementRate >= 60) score += 1;

  // --- Bonus 9: recreationalEnjoymentRate (>=90: +3, >=70: +1) --- [max 3]
  if (recreationalEnjoymentRate >= 90) score += 3;
  else if (recreationalEnjoymentRate >= 70) score += 1;

  // Bonus total: 4+3+4+3+3+3+3+2+3 = 28  ✓  Base 52 + 28 = 80 (outstanding threshold)

  // ── Penalties (all guard denominator > 0) ────────────────────────────

  // Penalty 1: exerciseEngagementRate < 40 → -5
  if (exerciseEngagementRate < 40 && totalSessionsPlanned > 0) score -= 5;

  // Penalty 2: outdoorParticipationRate < 50 → -5
  if (outdoorParticipationRate < 50 && total_children > 0) score -= 5;

  // Penalty 3: activityAccessibilityRate < 50 → -5
  if (activityAccessibilityRate < 50 && totalAccessibilityRecords > 0) score -= 5;

  // Penalty 4: fitnessAssessmentCoverageRate < 30 → -3
  if (fitnessAssessmentCoverageRate < 30 && total_children > 0) score -= 3;

  score = clamp(score, 0, 100);

  const activity_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // Exercise engagement strengths
  if (exerciseEngagementRate >= 90 && totalSessionsPlanned > 0) {
    strengths.push(
      `${exerciseEngagementRate}% exercise session attendance — children demonstrate excellent commitment to their exercise programmes, attending the vast majority of planned sessions.`,
    );
  } else if (exerciseEngagementRate >= 70 && totalSessionsPlanned > 0) {
    strengths.push(
      `${exerciseEngagementRate}% exercise session attendance — children attend the majority of their planned exercise sessions, showing positive engagement with physical activity.`,
    );
  }

  // Exercise coverage strengths
  if (exerciseCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has an active exercise programme — comprehensive physical activity provision ensuring all children benefit from structured exercise.",
    );
  } else if (exerciseCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${exerciseCoverageRate}% of children have active exercise programmes — strong exercise provision across the home.`,
    );
  }

  // Recreational diversity strengths
  if (recreationalDiversityScore >= 80 && totalRecActivities > 0) {
    strengths.push(
      `Recreational activities span ${distinctCategories.size} of ${totalPossibleCategories} categories — children enjoy a genuinely diverse range of leisure activities covering sport, creative, social, cultural, and adventure experiences.`,
    );
  } else if (recreationalDiversityScore >= 60 && totalRecActivities > 0) {
    strengths.push(
      `Recreational activities cover ${distinctCategories.size} of ${totalPossibleCategories} categories — good diversity in leisure provision for children.`,
    );
  }

  // Child choice strengths
  if (childChoiceRate >= 80 && totalRecActivities > 0) {
    strengths.push(
      `${childChoiceRate}% of recreational activities chosen by children — the home empowers children to direct their own leisure time, promoting autonomy and personal interests.`,
    );
  } else if (childChoiceRate >= 60 && totalRecActivities > 0) {
    strengths.push(
      `${childChoiceRate}% of activities child-chosen — children have meaningful input into their recreational activities.`,
    );
  }

  // Outdoor participation strengths
  if (outdoorParticipationRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child engages in outdoor activities — comprehensive outdoor provision ensuring all children benefit from fresh air, physical activity, and connection with nature.",
    );
  } else if (outdoorParticipationRate >= 80 && total_children > 0) {
    strengths.push(
      `${outdoorParticipationRate}% of children participate in outdoor activities — strong outdoor engagement across the home.`,
    );
  }

  // Fitness assessment strengths
  if (fitnessAssessmentCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has received a fitness assessment — comprehensive health monitoring ensuring physical development is tracked and supported for all children.",
    );
  } else if (fitnessAssessmentCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${fitnessAssessmentCoverageRate}% of children have received fitness assessments — strong coverage of physical health monitoring.`,
    );
  }

  // Activity accessibility strengths
  if (activityAccessibilityRate >= 100 && totalAccessibilityRecords > 0) {
    strengths.push(
      "All children are able to participate in activities — the home ensures every child can access physical and recreational opportunities regardless of individual needs.",
    );
  } else if (activityAccessibilityRate >= 80 && totalAccessibilityRecords > 0) {
    strengths.push(
      `${activityAccessibilityRate}% activity accessibility rate — the vast majority of children can participate in activities, demonstrating strong inclusive practice.`,
    );
  }

  // Goal achievement strengths
  if (goalAchievementRate >= 80 && totalGoalsSet > 0) {
    strengths.push(
      `${goalAchievementRate}% of exercise goals achieved — children are making excellent progress against their physical activity targets, reflecting well-designed programmes and motivated engagement.`,
    );
  } else if (goalAchievementRate >= 60 && totalGoalsSet > 0) {
    strengths.push(
      `${goalAchievementRate}% exercise goal achievement — children are making solid progress against their physical activity targets.`,
    );
  }

  // Enjoyment strengths
  if (recreationalEnjoymentRate >= 90 && totalRecActivities > 0) {
    strengths.push(
      `${recreationalEnjoymentRate}% of children report enjoying their recreational activities — the home's activity provision is genuinely child-centred and enjoyable.`,
    );
  } else if (recreationalEnjoymentRate >= 70 && totalRecActivities > 0) {
    strengths.push(
      `${recreationalEnjoymentRate}% recreational enjoyment rate — the majority of children enjoy the activities provided.`,
    );
  }

  // Exercise enjoyment strengths
  if (exerciseEnjoymentRate >= 90 && totalExerciseProgrammes > 0) {
    strengths.push(
      `${exerciseEnjoymentRate}% of children enjoy their exercise programmes — programmes are well-matched to children's interests and abilities.`,
    );
  }

  // New experiences strengths
  if (newExperienceRate >= 50 && totalRecActivities > 0) {
    strengths.push(
      `${newExperienceRate}% of recreational activities offer new experiences — the home is proactively broadening children's horizons through novel activities.`,
    );
  }

  // Community engagement strengths
  if (communityBasedRate >= 50 && totalRecActivities > 0) {
    strengths.push(
      `${communityBasedRate}% of recreational activities are community-based — children are integrated into wider community life through their leisure pursuits.`,
    );
  }

  // Peer interaction strengths
  if (peerInteractionRate >= 70 && totalRecActivities > 0) {
    strengths.push(
      `${peerInteractionRate}% of activities promote peer interaction — physical activity is supporting social development and positive relationships.`,
    );
  }

  // Adaptation strengths
  if (adaptationRate >= 100 && adaptationRequired > 0) {
    strengths.push(
      "Every required adaptation has been provided — the home demonstrates exemplary inclusive practice by ensuring all children can access activities regardless of their needs.",
    );
  } else if (adaptationRate >= 80 && adaptationRequired > 0) {
    strengths.push(
      `${adaptationRate}% of required adaptations provided — strong commitment to removing barriers and enabling participation for all children.`,
    );
  }

  // Outdoor enjoyment strengths
  if (outdoorEnjoymentAvg >= 4.0 && totalOutdoorEngagements > 0) {
    strengths.push(
      `Outdoor enjoyment averages ${outdoorEnjoymentAvg}/5 — children genuinely value and enjoy their outdoor experiences.`,
    );
  }

  // Risk assessment strengths
  if (outdoorRiskAssessedRate >= 90 && totalOutdoorEngagements > 0) {
    strengths.push(
      `${outdoorRiskAssessedRate}% of outdoor activities risk-assessed — safety is embedded into outdoor activity planning without restricting children's experiences.`,
    );
  }

  // Health professional involvement strengths
  if (healthProfInvolvedRate >= 70 && totalFitnessAssessments > 0) {
    strengths.push(
      `${healthProfInvolvedRate}% of fitness assessments involve a health professional — robust clinical oversight of children's physical development.`,
    );
  }

  // Child-initiated outdoor strengths
  if (childInitiatedOutdoorRate >= 50 && totalOutdoorEngagements > 0) {
    strengths.push(
      `${childInitiatedOutdoorRate}% of outdoor activities are child-initiated — children are motivated to seek out outdoor experiences independently.`,
    );
  }

  // Barrier resolution strengths
  if (barrierResolutionRate >= 90 && barrierIdentified > 0) {
    strengths.push(
      `${barrierResolutionRate}% of identified barriers resolved — the home proactively removes obstacles to children's participation in activities.`,
    );
  }

  // Follow-up strengths
  if (followUpCompletionRate >= 90 && followUpPlanned > 0) {
    strengths.push(
      `${followUpCompletionRate}% of fitness assessment follow-ups completed — thorough follow-through on health recommendations ensuring children benefit from assessment findings.`,
    );
  }

  // Skill development strengths
  if (skillDevRate >= 60 && totalRecActivities > 0) {
    strengths.push(
      `${skillDevRate}% of activities support skill development — recreational time is used purposefully to build children's capabilities and confidence.`,
    );
  }

  // Equal opportunity strengths
  if (equalOpportunityRate >= 90 && totalAccessibilityRecords > 0) {
    strengths.push(
      `${equalOpportunityRate}% equal opportunity rate — the home ensures fair and equitable access to activities for all children.`,
    );
  }

  // Therapeutic and competitive programme strengths
  if (therapeuticProgrammes > 0 && competitiveProgrammes > 0) {
    strengths.push(
      `The home provides both therapeutic (${therapeuticProgrammes}) and competitive (${competitiveProgrammes}) exercise programmes — a well-balanced approach catering to diverse physical needs and aspirations.`,
    );
  }

  // External provider strengths
  if (externalProviderRate >= 40 && totalExerciseProgrammes > 0) {
    strengths.push(
      `${externalProviderRate}% of exercise programmes involve external providers — children benefit from specialist expertise and community integration through external activity partnerships.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // Exercise engagement concerns
  if (exerciseEngagementRate < 40 && totalSessionsPlanned > 0) {
    concerns.push(
      `Only ${exerciseEngagementRate}% exercise session attendance — children are attending fewer than half of their planned sessions, indicating significant disengagement from physical activity programmes.`,
    );
  } else if (exerciseEngagementRate < 70 && exerciseEngagementRate >= 40 && totalSessionsPlanned > 0) {
    concerns.push(
      `Exercise engagement at ${exerciseEngagementRate}% — a notable proportion of planned sessions are not being attended, which may limit the physical health benefits for children.`,
    );
  }

  // Exercise coverage concerns
  if (exerciseCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${exerciseCoverageRate}% of children have active exercise programmes — the majority of children lack structured physical activity provision.`,
    );
  } else if (exerciseCoverageRate < 80 && exerciseCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `Exercise programme coverage at ${exerciseCoverageRate}% — not all children have access to a structured exercise programme to support their physical development.`,
    );
  }

  // Recreational diversity concerns
  if (recreationalDiversityScore < 40 && totalRecActivities > 0) {
    concerns.push(
      `Recreational diversity is limited to ${distinctCategories.size} of ${totalPossibleCategories} activity categories — children are not experiencing the breadth of leisure activities needed for holistic development.`,
    );
  } else if (recreationalDiversityScore < 60 && recreationalDiversityScore >= 40 && totalRecActivities > 0) {
    concerns.push(
      `Recreational diversity covers ${distinctCategories.size} of ${totalPossibleCategories} categories — some activity types (sport, creative, social, cultural, adventure, relaxation, educational) are not represented.`,
    );
  }

  // Child choice concerns
  if (childChoiceRate < 30 && totalRecActivities > 0) {
    concerns.push(
      `Only ${childChoiceRate}% of recreational activities are child-chosen — children have very limited autonomy over their leisure time, which may undermine engagement and personal development.`,
    );
  } else if (childChoiceRate < 60 && childChoiceRate >= 30 && totalRecActivities > 0) {
    concerns.push(
      `Child choice rate at ${childChoiceRate}% — many activities are not driven by children's preferences, which may reduce engagement and fail to promote their individual interests.`,
    );
  }

  // Outdoor participation concerns
  if (outdoorParticipationRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${outdoorParticipationRate}% of children participate in outdoor activities — the majority of children are missing the physical, emotional, and developmental benefits of regular outdoor engagement.`,
    );
  } else if (outdoorParticipationRate < 80 && outdoorParticipationRate >= 50 && total_children > 0) {
    concerns.push(
      `Outdoor participation at ${outdoorParticipationRate}% — not all children are engaging in outdoor activities, which may limit their physical health and connection with nature.`,
    );
  }

  // Fitness assessment coverage concerns
  if (fitnessAssessmentCoverageRate < 30 && total_children > 0) {
    concerns.push(
      `Only ${fitnessAssessmentCoverageRate}% of children have received fitness assessments — the home cannot evidence that it monitors and supports children's physical development through regular assessment.`,
    );
  } else if (fitnessAssessmentCoverageRate < 80 && fitnessAssessmentCoverageRate >= 30 && total_children > 0) {
    concerns.push(
      `Fitness assessment coverage at ${fitnessAssessmentCoverageRate}% — not all children have been assessed, which may mean physical health needs are going unidentified.`,
    );
  }

  // Activity accessibility concerns
  if (activityAccessibilityRate < 50 && totalAccessibilityRecords > 0) {
    concerns.push(
      `Only ${activityAccessibilityRate}% activity accessibility rate — the majority of children with recorded accessibility needs are unable to fully participate in activities, indicating significant barriers to inclusion.`,
    );
  } else if (activityAccessibilityRate < 80 && activityAccessibilityRate >= 50 && totalAccessibilityRecords > 0) {
    concerns.push(
      `Activity accessibility at ${activityAccessibilityRate}% — some children are unable to participate in activities due to unmet accessibility needs or unresolved barriers.`,
    );
  }

  // Goal achievement concerns
  if (goalAchievementRate < 30 && totalGoalsSet > 0) {
    concerns.push(
      `Only ${goalAchievementRate}% of exercise goals achieved — children are not progressing against their physical activity targets, suggesting programmes may not be well-designed or adequately supported.`,
    );
  } else if (goalAchievementRate < 60 && goalAchievementRate >= 30 && totalGoalsSet > 0) {
    concerns.push(
      `Exercise goal achievement at ${goalAchievementRate}% — progress against physical activity targets is inconsistent and needs strengthening.`,
    );
  }

  // Enjoyment concerns
  if (recreationalEnjoymentRate < 50 && totalRecActivities > 0) {
    concerns.push(
      `Only ${recreationalEnjoymentRate}% of children enjoy their recreational activities — activities may not be well-matched to children's interests, potentially reducing engagement and wellbeing benefits.`,
    );
  } else if (recreationalEnjoymentRate < 70 && recreationalEnjoymentRate >= 50 && totalRecActivities > 0) {
    concerns.push(
      `Recreational enjoyment at ${recreationalEnjoymentRate}% — a significant number of children do not report enjoying their leisure activities.`,
    );
  }

  // Adaptation concerns
  if (adaptationRate < 50 && adaptationRequired > 0) {
    concerns.push(
      `Only ${adaptationRate}% of required adaptations provided — children with accessibility needs are not receiving the support they need to participate fully in activities.`,
    );
  } else if (adaptationRate < 80 && adaptationRate >= 50 && adaptationRequired > 0) {
    concerns.push(
      `Adaptation provision at ${adaptationRate}% — some required adaptations are not being made, which may exclude children from activities they could otherwise enjoy.`,
    );
  }

  // Barrier resolution concerns
  if (barrierResolutionRate < 50 && barrierIdentified > 0) {
    concerns.push(
      `Only ${barrierResolutionRate}% of identified activity barriers resolved — barriers to children's participation are being identified but not addressed.`,
    );
  } else if (barrierResolutionRate < 80 && barrierResolutionRate >= 50 && barrierIdentified > 0) {
    concerns.push(
      `Barrier resolution at ${barrierResolutionRate}% — some identified barriers to activity participation remain unresolved.`,
    );
  }

  // Follow-up concerns
  if (followUpCompletionRate < 50 && followUpPlanned > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of fitness assessment follow-ups completed — health recommendations from assessments are not being acted upon.`,
    );
  } else if (followUpCompletionRate < 80 && followUpCompletionRate >= 50 && followUpPlanned > 0) {
    concerns.push(
      `Fitness follow-up completion at ${followUpCompletionRate}% — some health recommendations are not being followed through.`,
    );
  }

  // Programme review concerns
  if (programmeReviewRate < 50 && totalExerciseProgrammes > 0) {
    concerns.push(
      `Only ${programmeReviewRate}% of exercise programmes reviewed — without regular review, programmes may not be meeting children's changing needs.`,
    );
  } else if (programmeReviewRate < 80 && programmeReviewRate >= 50 && totalExerciseProgrammes > 0) {
    concerns.push(
      `Programme review rate at ${programmeReviewRate}% — some exercise programmes have not been reviewed to assess effectiveness and relevance.`,
    );
  }

  // Outdoor risk assessment concerns
  if (outdoorRiskAssessedRate < 70 && totalOutdoorEngagements > 0) {
    concerns.push(
      `Only ${outdoorRiskAssessedRate}% of outdoor activities risk-assessed — outdoor engagement should be supported by appropriate risk assessment to ensure children's safety.`,
    );
  }

  // Low engagement level concerns
  const disengagedProgrammes = exercise_programme_records.filter(
    (e) => e.engagement_level === "disengaged" || e.engagement_level === "low",
  ).length;
  const disengagedRate = pct(disengagedProgrammes, totalExerciseProgrammes);
  if (disengagedRate >= 40 && totalExerciseProgrammes > 0) {
    concerns.push(
      `${disengagedRate}% of exercise programmes show low or disengaged participation — a significant number of children are not benefiting from their exercise provision.`,
    );
  }

  // No recreational activities but children exist
  if (totalRecActivities === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No recreational activities recorded despite children being on placement — the home cannot evidence that children enjoy a range of leisure activities.",
    );
  }

  // No outdoor engagement but children exist
  if (totalOutdoorEngagements === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No outdoor engagement recorded despite children being on placement — children may be missing essential outdoor experiences for their physical and emotional wellbeing.",
    );
  }

  // Inclusivity concerns
  if (inclusivityRate < 70 && totalRecActivities > 0) {
    concerns.push(
      `Only ${inclusivityRate}% of recreational activities recorded as inclusive — activities may not be designed to accommodate all children's needs and abilities.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: PhysicalActivityRecommendation[] = [];
  let rank = 0;

  if (exerciseEngagementRate < 40 && totalSessionsPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review exercise programme engagement — identify why children are not attending sessions. Involve children in redesigning programmes to match their interests, abilities, and preferences. Consider motivational approaches and peer support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (outdoorParticipationRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase outdoor engagement for all children — ensure every child has regular opportunities for outdoor activity including walks, sports, nature exploration, and adventure. Outdoor time should be a daily priority, not an optional extra.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 10 — Health",
    });
  }

  if (activityAccessibilityRate < 50 && totalAccessibilityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address activity accessibility barriers urgently — review all children's accessibility needs and ensure adaptations, equipment, transport, and funding are in place to enable full participation in physical and recreational activities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (fitnessAssessmentCoverageRate < 30 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement fitness assessments for all children — each child should have a baseline physical health assessment with regular follow-up to monitor development, set goals, and identify any health concerns early.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 10 — Health",
    });
  }

  if (exerciseCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop exercise programmes for all children — every child should have access to structured physical activity suited to their interests and abilities, with regular sessions and clear goals.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (childChoiceRate < 30 && totalRecActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child choice in activities — involve children in planning their recreational time. Use wish lists, activity menus, and regular consultations to ensure children's preferences drive activity provision.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (recreationalDiversityScore < 40 && totalRecActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Broaden the range of recreational activities — introduce activities across all categories (sport, creative, social, cultural, adventure, relaxation, educational) to ensure children experience diverse leisure opportunities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (recreationalEnjoymentRate < 50 && totalRecActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review activity provision with children — understand why enjoyment is low and redesign activities to better match children's interests. Activities should be fun and engaging, not imposed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (adaptationRate < 50 && adaptationRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all required adaptations are provided — children with accessibility needs must have appropriate adaptations in place to participate fully. Review each child's needs and implement solutions promptly.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (goalAchievementRate < 30 && totalGoalsSet > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and recalibrate exercise goals — very low achievement suggests goals may be unrealistic or programmes insufficiently supported. Involve children in setting achievable, motivating targets.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10 — Health",
    });
  }

  if (followUpCompletionRate < 50 && followUpPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all fitness assessment follow-ups — health recommendations from assessments must be acted upon. Implement a tracking system to ensure every follow-up is completed on time.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10 — Health",
    });
  }

  if (
    exerciseEngagementRate >= 40 &&
    exerciseEngagementRate < 70 &&
    totalSessionsPlanned > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve exercise session attendance to at least 70% — explore barriers to attendance and consider adjusting programme timing, location, or format to increase engagement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (
    outdoorParticipationRate >= 50 &&
    outdoorParticipationRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend outdoor engagement to all children — identify those not currently participating and explore creative ways to encourage outdoor activity suited to their interests.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10 — Health",
    });
  }

  if (
    fitnessAssessmentCoverageRate >= 30 &&
    fitnessAssessmentCoverageRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase fitness assessment coverage — aim for every child to receive a regular fitness assessment to monitor physical development and identify health needs early.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10 — Health",
    });
  }

  if (
    childChoiceRate >= 30 &&
    childChoiceRate < 60 &&
    totalRecActivities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen child choice in recreational activities — aim for at least 60% of activities to be child-selected. Regularly consult children about their activity preferences.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    recreationalDiversityScore >= 40 &&
    recreationalDiversityScore < 60 &&
    totalRecActivities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand recreational activity diversity — introduce activities in underrepresented categories to ensure children benefit from a broader range of experiences.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (
    activityAccessibilityRate >= 50 &&
    activityAccessibilityRate < 80 &&
    totalAccessibilityRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve activity accessibility to at least 80% — review remaining barriers and ensure adaptations, equipment, and support are in place for all children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (
    exerciseCoverageRate >= 50 &&
    exerciseCoverageRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend exercise programme coverage — develop and implement exercise programmes for children who currently lack structured physical activity provision.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (
    recreationalEnjoymentRate >= 50 &&
    recreationalEnjoymentRate < 70 &&
    totalRecActivities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve recreational enjoyment — consult children about what they enjoy and adjust activity provision accordingly. Fun and engagement should be central to all leisure activities.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (programmeReviewRate < 50 && totalExerciseProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement regular exercise programme reviews — all programmes should be reviewed periodically to assess effectiveness, relevance, and alignment with children's evolving needs and preferences.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (outdoorRiskAssessedRate < 70 && totalOutdoorEngagements > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all outdoor activities are risk-assessed — while avoiding overly restrictive practice, appropriate risk assessment should be embedded in outdoor activity planning.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Safety",
    });
  }

  if (totalRecActivities === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording recreational activities — the home must evidence that children enjoy a range of leisure pursuits. Implement structured recording of all recreational activities with categories, child choice, and enjoyment data.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (totalOutdoorEngagements === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording outdoor engagement — outdoor activities are essential for children's physical and emotional health. Implement daily outdoor engagement recording with activity type, duration, and enjoyment data.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 10 — Health",
    });
  }

  if (
    barrierResolutionRate < 50 &&
    barrierIdentified > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Resolve all identified activity barriers — each barrier to a child's participation should have a clear action plan with responsibility and timescale for resolution.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (communityBasedRate < 30 && totalRecActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase community-based recreational activities — children should regularly participate in activities within the wider community to promote social integration and normalised experiences.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  if (newExperienceRate < 20 && totalRecActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce more new experiences — children benefit from trying new activities that broaden their horizons. Plan at least monthly new experience opportunities.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Enjoyment & achievement",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: PhysicalActivityInsight[] = [];

  // -- Critical insights --

  if (exerciseEngagementRate < 40 && totalSessionsPlanned > 0) {
    insights.push({
      text: `Only ${exerciseEngagementRate}% exercise session attendance. Ofsted will view very low engagement as evidence that exercise programmes are not meeting children's needs or interests. The home must urgently review programme design, timing, and child involvement in planning to reverse this trend.`,
      severity: "critical",
    });
  }

  if (outdoorParticipationRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${outdoorParticipationRate}% of children participate in outdoor activities. Regular outdoor engagement is fundamental to children's physical health, emotional wellbeing, and development. Ofsted expects children to enjoy regular outdoor time as part of a healthy, active lifestyle.`,
      severity: "critical",
    });
  }

  if (activityAccessibilityRate < 50 && totalAccessibilityRecords > 0) {
    insights.push({
      text: `Only ${activityAccessibilityRate}% activity accessibility rate. Children are being denied participation in physical and recreational activities due to unmet accessibility needs. This represents a failure to ensure equal opportunities for all children regardless of their individual circumstances.`,
      severity: "critical",
    });
  }

  if (fitnessAssessmentCoverageRate < 30 && total_children > 0) {
    insights.push({
      text: `Only ${fitnessAssessmentCoverageRate}% of children have received fitness assessments. Without regular assessment, the home cannot evidence that it monitors children's physical development or identifies health needs early. This is a significant gap in Reg 10 (health) compliance.`,
      severity: "critical",
    });
  }

  if (totalRecActivities === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No recreational activities recorded despite children being on placement. Ofsted expects evidence that children enjoy a wide range of leisure activities. The absence of recreational activity records is a serious gap in Reg 9 (enjoyment & achievement) evidence.",
      severity: "critical",
    });
  }

  if (totalOutdoorEngagements === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No outdoor engagement recorded despite children being on placement. Outdoor activity is essential for children's physical and emotional health. The absence of outdoor records suggests children may not be receiving adequate outdoor time.",
      severity: "critical",
    });
  }

  if (childChoiceRate < 30 && totalRecActivities > 0) {
    insights.push({
      text: `Only ${childChoiceRate}% of recreational activities chosen by children. The voice of the child is not sufficiently reflected in activity planning. Ofsted expects children to have genuine influence over their leisure time, not simply be directed into adult-chosen activities.`,
      severity: "critical",
    });
  }

  if (exerciseCoverageRate < 50 && total_children > 0 && totalExerciseProgrammes > 0) {
    insights.push({
      text: `Only ${exerciseCoverageRate}% of children have active exercise programmes. The majority of children lack structured physical activity provision. Reg 9 requires the home to ensure all children enjoy activities that promote their development.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    exerciseEngagementRate >= 40 &&
    exerciseEngagementRate < 70 &&
    totalSessionsPlanned > 0
  ) {
    insights.push({
      text: `Exercise engagement at ${exerciseEngagementRate}% — improving but a significant proportion of planned sessions are missed. Explore whether programme format, timing, or content needs adjusting to increase children's motivation and attendance.`,
      severity: "warning",
    });
  }

  if (
    recreationalDiversityScore >= 40 &&
    recreationalDiversityScore < 60 &&
    totalRecActivities > 0
  ) {
    insights.push({
      text: `Recreational diversity covers ${distinctCategories.size} of ${totalPossibleCategories} categories — while some variety exists, children would benefit from a broader range of activity types to support their holistic development.`,
      severity: "warning",
    });
  }

  if (
    outdoorParticipationRate >= 50 &&
    outdoorParticipationRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Outdoor participation at ${outdoorParticipationRate}% — while improving, some children are not engaging in outdoor activities. Identify those missing out and develop tailored approaches to encourage outdoor engagement.`,
      severity: "warning",
    });
  }

  if (
    fitnessAssessmentCoverageRate >= 30 &&
    fitnessAssessmentCoverageRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Fitness assessment coverage at ${fitnessAssessmentCoverageRate}% — not all children have been assessed. Physical health monitoring through regular fitness assessments should be embedded as standard practice for every child.`,
      severity: "warning",
    });
  }

  if (
    activityAccessibilityRate >= 50 &&
    activityAccessibilityRate < 80 &&
    totalAccessibilityRecords > 0
  ) {
    insights.push({
      text: `Activity accessibility at ${activityAccessibilityRate}% — while many children can participate, some remain excluded due to unresolved accessibility needs. Every child should be able to access physical and recreational activities.`,
      severity: "warning",
    });
  }

  if (
    childChoiceRate >= 30 &&
    childChoiceRate < 60 &&
    totalRecActivities > 0
  ) {
    insights.push({
      text: `Child choice rate at ${childChoiceRate}% — children have some input but many activities are not driven by their preferences. Increasing child-led activity selection supports autonomy, engagement, and the voice of the child.`,
      severity: "warning",
    });
  }

  if (
    goalAchievementRate >= 30 &&
    goalAchievementRate < 60 &&
    totalGoalsSet > 0
  ) {
    insights.push({
      text: `Exercise goal achievement at ${goalAchievementRate}% — progress is inconsistent. Review whether goals are realistic, programmes are well-supported, and children are motivated by their targets.`,
      severity: "warning",
    });
  }

  if (
    recreationalEnjoymentRate >= 50 &&
    recreationalEnjoymentRate < 70 &&
    totalRecActivities > 0
  ) {
    insights.push({
      text: `Recreational enjoyment at ${recreationalEnjoymentRate}% — a notable proportion of children do not enjoy their activities. Activities should be fun and engaging; consult children about what they would prefer.`,
      severity: "warning",
    });
  }

  if (
    adaptationRate >= 50 &&
    adaptationRate < 80 &&
    adaptationRequired > 0
  ) {
    insights.push({
      text: `Adaptation provision at ${adaptationRate}% — some required adaptations are not in place. Without full adaptation support, children with additional needs cannot participate equally in activities.`,
      severity: "warning",
    });
  }

  if (
    followUpCompletionRate >= 50 &&
    followUpCompletionRate < 80 &&
    followUpPlanned > 0
  ) {
    insights.push({
      text: `Fitness follow-up completion at ${followUpCompletionRate}% — some health recommendations from assessments are not being acted upon, reducing the value of the assessment process.`,
      severity: "warning",
    });
  }

  if (programmeReviewRate < 50 && totalExerciseProgrammes > 0) {
    insights.push({
      text: `Only ${programmeReviewRate}% of exercise programmes reviewed — without regular review, programmes may become stale, irrelevant, or poorly matched to children's changing needs and interests.`,
      severity: "warning",
    });
  }

  if (
    barrierResolutionRate >= 50 &&
    barrierResolutionRate < 80 &&
    barrierIdentified > 0
  ) {
    insights.push({
      text: `Barrier resolution at ${barrierResolutionRate}% — some identified barriers to activity participation remain unresolved. Persistent barriers may lead to sustained exclusion from activities.`,
      severity: "warning",
    });
  }

  if (disengagedRate >= 40 && totalExerciseProgrammes > 0) {
    insights.push({
      text: `${disengagedRate}% of exercise programmes show low or disengaged participation — a significant proportion of children are not benefiting from their exercise provision. This may indicate programmes are not sufficiently motivating or child-centred.`,
      severity: "warning",
    });
  }

  if (outdoorRiskAssessedRate < 70 && outdoorRiskAssessedRate > 0 && totalOutdoorEngagements > 0) {
    insights.push({
      text: `Only ${outdoorRiskAssessedRate}% of outdoor activities risk-assessed — while avoiding overly cautious practice, basic risk assessment supports safe outdoor engagement and protects both children and staff.`,
      severity: "warning",
    });
  }

  if (communityBasedRate < 30 && totalRecActivities > 0) {
    insights.push({
      text: `Only ${communityBasedRate}% of recreational activities are community-based — children may be missing opportunities for social integration and normalised experiences outside the home setting.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (activity_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding physical activity and recreation provision — children enjoy diverse, accessible, and engaging activities with strong exercise programme engagement, comprehensive outdoor participation, and fitness monitoring. This is strong evidence for Reg 9 and Reg 10 compliance.",
      severity: "positive",
    });
  }

  if (
    exerciseEngagementRate >= 90 &&
    exerciseCoverageRate >= 100 &&
    totalSessionsPlanned > 0 &&
    total_children > 0
  ) {
    insights.push({
      text: `${exerciseEngagementRate}% session attendance with 100% programme coverage — every child has an exercise programme and attends consistently. This demonstrates exemplary physical activity provision that promotes children's health and development.`,
      severity: "positive",
    });
  }

  if (
    recreationalDiversityScore >= 80 &&
    childChoiceRate >= 80 &&
    totalRecActivities > 0
  ) {
    insights.push({
      text: `Recreational activities span ${distinctCategories.size} categories with ${childChoiceRate}% child choice — children enjoy a genuinely diverse range of child-led leisure activities. This demonstrates the home's commitment to promoting children's interests, autonomy, and holistic development.`,
      severity: "positive",
    });
  }

  if (
    outdoorParticipationRate >= 100 &&
    outdoorEnjoymentAvg >= 4.0 &&
    total_children > 0 &&
    totalOutdoorEngagements > 0
  ) {
    insights.push({
      text: `Every child engages in outdoor activities with enjoyment averaging ${outdoorEnjoymentAvg}/5 — the home ensures all children benefit from regular, enjoyable outdoor experiences that promote physical health and emotional wellbeing.`,
      severity: "positive",
    });
  }

  if (
    fitnessAssessmentCoverageRate >= 100 &&
    followUpCompletionRate >= 90 &&
    total_children > 0 &&
    followUpPlanned > 0
  ) {
    insights.push({
      text: `Every child has a fitness assessment with ${followUpCompletionRate}% follow-up completion — comprehensive physical health monitoring with excellent follow-through on recommendations. This is strong evidence of proactive health promotion.`,
      severity: "positive",
    });
  }

  if (
    activityAccessibilityRate >= 100 &&
    adaptationRate >= 100 &&
    totalAccessibilityRecords > 0 &&
    adaptationRequired > 0
  ) {
    insights.push({
      text: "Every child can participate in activities with all required adaptations provided — the home demonstrates exemplary inclusive practice, ensuring no child is excluded from physical and recreational opportunities.",
      severity: "positive",
    });
  }

  if (
    goalAchievementRate >= 80 &&
    totalGoalsSet > 0
  ) {
    insights.push({
      text: `${goalAchievementRate}% exercise goal achievement — children are making excellent progress against their physical activity targets. Well-designed programmes and motivated engagement are driving measurable health and fitness improvements.`,
      severity: "positive",
    });
  }

  if (
    recreationalEnjoymentRate >= 90 &&
    totalRecActivities > 0
  ) {
    insights.push({
      text: `${recreationalEnjoymentRate}% of children enjoy their recreational activities — the home's leisure provision is genuinely child-centred and engaging. Children experience activities as fun, meaningful, and enriching.`,
      severity: "positive",
    });
  }

  if (
    exerciseEnjoymentRate >= 90 &&
    totalExerciseProgrammes > 0 &&
    exerciseEngagementRate >= 80
  ) {
    insights.push({
      text: `${exerciseEnjoymentRate}% exercise enjoyment with ${exerciseEngagementRate}% attendance — children both enjoy and consistently attend their exercise programmes. This combination of enjoyment and commitment reflects well-designed, motivating physical activity provision.`,
      severity: "positive",
    });
  }

  if (
    newExperienceRate >= 50 &&
    totalRecActivities > 0
  ) {
    insights.push({
      text: `${newExperienceRate}% of activities offer new experiences — the home is proactively broadening children's horizons and building confidence through exposure to new activities and challenges.`,
      severity: "positive",
    });
  }

  if (
    communityBasedRate >= 50 &&
    peerInteractionRate >= 70 &&
    totalRecActivities > 0
  ) {
    insights.push({
      text: `${communityBasedRate}% community-based with ${peerInteractionRate}% peer interaction — children's recreational activities promote social integration and positive peer relationships, supporting normalised community life.`,
      severity: "positive",
    });
  }

  if (
    childInitiatedOutdoorRate >= 50 &&
    totalOutdoorEngagements > 0
  ) {
    insights.push({
      text: `${childInitiatedOutdoorRate}% of outdoor activities are child-initiated — children are motivated to independently seek outdoor experiences, indicating genuine enthusiasm for an active lifestyle.`,
      severity: "positive",
    });
  }

  if (
    healthProfInvolvedRate >= 70 &&
    bmiRecordedRate >= 80 &&
    totalFitnessAssessments > 0
  ) {
    insights.push({
      text: `${healthProfInvolvedRate}% health professional involvement in fitness assessments with ${bmiRecordedRate}% BMI recording — robust clinical oversight ensures physical development is monitored to professional standards.`,
      severity: "positive",
    });
  }

  if (
    barrierResolutionRate >= 90 &&
    barrierIdentified > 0
  ) {
    insights.push({
      text: `${barrierResolutionRate}% of identified barriers resolved — the home proactively identifies and removes obstacles to children's participation, demonstrating a culture of inclusive, responsive activity provision.`,
      severity: "positive",
    });
  }

  if (
    skillDevRate >= 60 &&
    totalRecActivities > 0
  ) {
    insights.push({
      text: `${skillDevRate}% of activities support skill development — recreational time is used purposefully to build children's capabilities, confidence, and competence across a range of domains.`,
      severity: "positive",
    });
  }

  if (
    weatherAppropriateRate >= 90 &&
    outdoorRiskAssessedRate >= 90 &&
    totalOutdoorEngagements > 0
  ) {
    insights.push({
      text: `${weatherAppropriateRate}% weather-appropriate and ${outdoorRiskAssessedRate}% risk-assessed outdoor activities — the home balances safety and enrichment effectively, ensuring outdoor engagement is both safe and enjoyable.`,
      severity: "positive",
    });
  }

  if (
    equalOpportunityRate >= 90 &&
    costCoveredRate >= 90 &&
    transportArrangedRate >= 80 &&
    totalAccessibilityRecords > 0
  ) {
    insights.push({
      text: `${equalOpportunityRate}% equal opportunity with ${costCoveredRate}% cost coverage and ${transportArrangedRate}% transport arranged — the home removes financial and logistical barriers to ensure every child can access activities on an equal footing.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (activity_rating === "outstanding") {
    headline =
      "Outstanding physical activity and recreation provision — children enjoy diverse, accessible activities with strong exercise engagement, comprehensive outdoor participation, and robust fitness monitoring.";
  } else if (activity_rating === "good") {
    headline = `Good physical activity and recreation provision — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (activity_rating === "adequate") {
    headline = `Adequate physical activity and recreation provision — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children enjoy sufficient physical activity and diverse recreational opportunities.`;
  } else {
    headline = `Physical activity and recreation provision is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children have access to exercise, outdoor engagement, and diverse recreational activities.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    activity_rating,
    activity_score: score,
    headline,
    total_exercise_programmes: totalExerciseProgrammes,
    total_recreational_activities: totalRecActivities,
    total_outdoor_engagements: totalOutdoorEngagements,
    total_fitness_assessments: totalFitnessAssessments,
    total_accessibility_records: totalAccessibilityRecords,
    exercise_engagement_rate: exerciseEngagementRate,
    recreational_diversity_score: recreationalDiversityScore,
    outdoor_participation_rate: outdoorParticipationRate,
    fitness_assessment_coverage_rate: fitnessAssessmentCoverageRate,
    activity_accessibility_rate: activityAccessibilityRate,
    child_choice_rate: childChoiceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

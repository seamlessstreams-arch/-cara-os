// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INDEPENDENCE & LIFE SKILLS DEVELOPMENT INTELLIGENCE ENGINE
// Tracks how effectively the home prepares children/young people for
// independent living — cooking skills, cleaning/laundry, travel training,
// personal hygiene management, money management practice, social skills
// for independence.
// Critical for Ofsted under Children's Homes Regulations 2015:
//   Reg 5 (quality of care), Reg 7 (children's views),
//   Reg 12 (positive relationships).
// HOME-LEVEL engine — no childId parameter; aggregates across all children.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Store keys: lifeSkillsAssessmentRecords, cookingProgrammeRecords,
//             travelTrainingRecords, personalCareRecords,
//             independenceMilestoneRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LifeSkillsAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor_name: string;
  assessment_type: "initial" | "review" | "annual" | "transition" | "specialist";
  // Skill area scores (1-5 each)
  cooking_score: number;
  cleaning_score: number;
  laundry_score: number;
  budgeting_score: number;
  personal_hygiene_score: number;
  travel_score: number;
  social_skills_score: number;
  overall_independence_score: number; // 1-10
  previous_overall_score: number | null; // 1-10 or null if first assessment
  child_involved: boolean;
  goals_set: number;
  goals_achieved: number;
  review_date: string | null;
  review_overdue: boolean;
  key_worker_involved: boolean;
  child_feedback_positive: boolean;
  created_at: string;
}

export interface CookingProgrammeInput {
  id: string;
  child_id: string;
  session_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "baking";
  skill_level: "observer" | "assisted" | "supervised" | "independent";
  recipe_followed: boolean;
  hygiene_standards_met: boolean;
  safety_standards_met: boolean;
  child_enjoyed: boolean;
  staff_member: string;
  new_skill_learned: boolean;
  child_chose_recipe: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface TravelTrainingInput {
  id: string;
  child_id: string;
  training_date: string;
  training_type: "road_safety" | "public_transport" | "route_learning" | "journey_planning" | "cycling" | "independent_travel";
  competency_level: "not_started" | "developing" | "competent" | "independent";
  route_practised: string;
  accompanied: boolean;
  risk_assessment_completed: boolean;
  child_confidence_rating: number; // 1-5
  staff_confidence_rating: number; // 1-5
  milestone_achieved: boolean;
  child_feedback_positive: boolean;
  created_at: string;
}

export interface PersonalCareInput {
  id: string;
  child_id: string;
  record_date: string;
  care_area: "hygiene_routine" | "dental_care" | "skin_care" | "hair_care" | "clothing_management" | "bedroom_maintenance" | "laundry_skills" | "health_appointments";
  independence_level: "full_support" | "some_support" | "minimal_prompts" | "independent";
  improvement_noted: boolean;
  child_engaged: boolean;
  dignity_respected: boolean;
  age_appropriate_support: boolean;
  key_worker_discussed: boolean;
  created_at: string;
}

export interface IndependenceMilestoneInput {
  id: string;
  child_id: string;
  milestone_date: string;
  milestone_category: "cooking" | "cleaning" | "money_management" | "travel" | "personal_care" | "social_skills" | "health_management" | "digital_skills";
  milestone_description: string;
  achieved: boolean;
  target_date: string | null;
  overdue: boolean;
  child_celebrated: boolean;
  evidenced_in_records: boolean;
  staff_witness: string;
  child_proud: boolean;
  shared_with_social_worker: boolean;
  created_at: string;
}

export interface IndependenceLifeSkillsInput {
  today: string;
  total_children: number;
  life_skills_assessment_records: LifeSkillsAssessmentInput[];
  cooking_programme_records: CookingProgrammeInput[];
  travel_training_records: TravelTrainingInput[];
  personal_care_records: PersonalCareInput[];
  independence_milestone_records: IndependenceMilestoneInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type IndependenceLifeSkillsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface IndependenceLifeSkillsInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface IndependenceLifeSkillsRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface IndependenceLifeSkillsResult {
  independence_rating: IndependenceLifeSkillsRating;
  independence_score: number;
  headline: string;
  skills_assessment_coverage_rate: number;
  cooking_competency_rate: number;
  travel_independence_rate: number;
  personal_care_rate: number;
  milestone_achievement_rate: number;
  child_engagement_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: IndependenceLifeSkillsRecommendation[];
  insights: IndependenceLifeSkillsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): IndependenceLifeSkillsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: IndependenceLifeSkillsRating,
  score: number,
  headline: string,
): IndependenceLifeSkillsResult {
  return {
    independence_rating: rating,
    independence_score: score,
    headline,
    skills_assessment_coverage_rate: 0,
    cooking_competency_rate: 0,
    travel_independence_rate: 0,
    personal_care_rate: 0,
    milestone_achievement_rate: 0,
    child_engagement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeIndependenceLifeSkillsDevelopment(
  input: IndependenceLifeSkillsInput,
): IndependenceLifeSkillsResult {
  const {
    total_children,
    life_skills_assessment_records,
    cooking_programme_records,
    travel_training_records,
    personal_care_records,
    independence_milestone_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    life_skills_assessment_records.length === 0 &&
    cooking_programme_records.length === 0 &&
    travel_training_records.length === 0 &&
    personal_care_records.length === 0 &&
    independence_milestone_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess independence and life skills development.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No independence or life skills data recorded despite children on placement — life skills development requires urgent attention.",
      ),
      concerns: [
        "No life skills assessments, cooking programme records, travel training records, personal care records, or independence milestones exist despite children being on placement — the home cannot evidence that it is preparing children for independent living.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured life skills assessments for all children to identify their current independence levels and create individualised development plans covering cooking, cleaning, travel, personal care, and money management.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Establish a cooking programme, travel training schedule, and personal care development framework to ensure every child receives age-appropriate opportunities to develop practical life skills for independence.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
        },
      ],
      insights: [
        {
          text: "The complete absence of independence and life skills records means the home cannot demonstrate that children are being prepared for independent living. Ofsted expects homes to actively develop children's practical life skills as part of quality of care under Reg 5, and the absence of any such provision represents a fundamental gap in meeting children's developmental needs.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Skills assessment coverage ---
  const uniqueChildrenWithAssessments = new Set(
    life_skills_assessment_records.map((a) => a.child_id),
  ).size;
  const skillsAssessmentCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithAssessments, total_children) : 0;

  const totalAssessments = life_skills_assessment_records.length;

  // --- Assessment quality metrics ---
  const assessmentsWithChildInvolvement = life_skills_assessment_records.filter(
    (a) => a.child_involved,
  ).length;
  const assessmentChildInvolvementRate = pct(assessmentsWithChildInvolvement, totalAssessments);

  const assessmentsWithKeyWorker = life_skills_assessment_records.filter(
    (a) => a.key_worker_involved,
  ).length;
  const keyWorkerInvolvementRate = pct(assessmentsWithKeyWorker, totalAssessments);

  const overdueAssessmentReviews = life_skills_assessment_records.filter(
    (a) => a.review_overdue,
  ).length;
  const assessmentReviewComplianceRate = totalAssessments > 0
    ? pct(totalAssessments - overdueAssessmentReviews, totalAssessments)
    : 0;

  const assessmentChildFeedbackPositive = life_skills_assessment_records.filter(
    (a) => a.child_feedback_positive,
  ).length;
  const assessmentFeedbackRate = pct(assessmentChildFeedbackPositive, totalAssessments);

  // --- Skills improvement tracking ---
  const assessmentsWithPreviousScore = life_skills_assessment_records.filter(
    (a) => a.previous_overall_score !== null,
  );
  const assessmentsShowingImprovement = assessmentsWithPreviousScore.filter(
    (a) => a.overall_independence_score > (a.previous_overall_score ?? 0),
  ).length;
  const skillsImprovementRate = pct(assessmentsShowingImprovement, assessmentsWithPreviousScore.length);

  // --- Goals tracking ---
  const totalGoalsSet = life_skills_assessment_records.reduce(
    (sum, a) => sum + a.goals_set, 0,
  );
  const totalGoalsAchieved = life_skills_assessment_records.reduce(
    (sum, a) => sum + a.goals_achieved, 0,
  );
  const goalsAchievementRate = pct(totalGoalsAchieved, totalGoalsSet);

  // --- Average skill scores ---
  const avgCookingScore = totalAssessments > 0
    ? Math.round(
        (life_skills_assessment_records.reduce((s, a) => s + a.cooking_score, 0) / totalAssessments) * 100,
      ) / 100
    : 0;
  const avgCleaningScore = totalAssessments > 0
    ? Math.round(
        (life_skills_assessment_records.reduce((s, a) => s + a.cleaning_score, 0) / totalAssessments) * 100,
      ) / 100
    : 0;
  const avgLaundryScore = totalAssessments > 0
    ? Math.round(
        (life_skills_assessment_records.reduce((s, a) => s + a.laundry_score, 0) / totalAssessments) * 100,
      ) / 100
    : 0;
  const avgBudgetingScore = totalAssessments > 0
    ? Math.round(
        (life_skills_assessment_records.reduce((s, a) => s + a.budgeting_score, 0) / totalAssessments) * 100,
      ) / 100
    : 0;
  const avgPersonalHygieneScore = totalAssessments > 0
    ? Math.round(
        (life_skills_assessment_records.reduce((s, a) => s + a.personal_hygiene_score, 0) / totalAssessments) * 100,
      ) / 100
    : 0;
  const avgTravelScore = totalAssessments > 0
    ? Math.round(
        (life_skills_assessment_records.reduce((s, a) => s + a.travel_score, 0) / totalAssessments) * 100,
      ) / 100
    : 0;
  const avgSocialSkillsScore = totalAssessments > 0
    ? Math.round(
        (life_skills_assessment_records.reduce((s, a) => s + a.social_skills_score, 0) / totalAssessments) * 100,
      ) / 100
    : 0;

  // --- Cooking programme metrics ---
  const totalCookingSessions = cooking_programme_records.length;
  const uniqueChildrenCooking = new Set(
    cooking_programme_records.map((c) => c.child_id),
  ).size;
  const cookingParticipationRate =
    total_children > 0 ? pct(uniqueChildrenCooking, total_children) : 0;

  const cookingIndependentOrSupervised = cooking_programme_records.filter(
    (c) => c.skill_level === "independent" || c.skill_level === "supervised",
  ).length;
  const cookingCompetencyRate = pct(cookingIndependentOrSupervised, totalCookingSessions);

  const cookingHygieneCompliant = cooking_programme_records.filter(
    (c) => c.hygiene_standards_met,
  ).length;
  const cookingHygieneRate = pct(cookingHygieneCompliant, totalCookingSessions);

  const cookingSafetyCompliant = cooking_programme_records.filter(
    (c) => c.safety_standards_met,
  ).length;
  const cookingSafetyRate = pct(cookingSafetyCompliant, totalCookingSessions);

  const cookingChildEnjoyed = cooking_programme_records.filter(
    (c) => c.child_enjoyed,
  ).length;
  const cookingEnjoymentRate = pct(cookingChildEnjoyed, totalCookingSessions);

  const cookingNewSkillLearned = cooking_programme_records.filter(
    (c) => c.new_skill_learned,
  ).length;
  const cookingNewSkillRate = pct(cookingNewSkillLearned, totalCookingSessions);

  const cookingChildChoseRecipe = cooking_programme_records.filter(
    (c) => c.child_chose_recipe,
  ).length;
  const cookingChildChoiceRate = pct(cookingChildChoseRecipe, totalCookingSessions);

  const cookingNotesRecorded = cooking_programme_records.filter(
    (c) => c.notes_recorded,
  ).length;
  const cookingDocumentationRate = pct(cookingNotesRecorded, totalCookingSessions);

  const cookingIndependentSessions = cooking_programme_records.filter(
    (c) => c.skill_level === "independent",
  ).length;
  const cookingFullIndependenceRate = pct(cookingIndependentSessions, totalCookingSessions);

  // --- Travel training metrics ---
  const totalTravelSessions = travel_training_records.length;
  const uniqueChildrenTravel = new Set(
    travel_training_records.map((t) => t.child_id),
  ).size;
  const travelParticipationRate =
    total_children > 0 ? pct(uniqueChildrenTravel, total_children) : 0;

  const travelIndependentOrCompetent = travel_training_records.filter(
    (t) => t.competency_level === "independent" || t.competency_level === "competent",
  ).length;
  const travelIndependenceRate = pct(travelIndependentOrCompetent, totalTravelSessions);

  const travelRiskAssessmentCompleted = travel_training_records.filter(
    (t) => t.risk_assessment_completed,
  ).length;
  const travelRiskAssessmentRate = pct(travelRiskAssessmentCompleted, totalTravelSessions);

  const travelMilestonesAchieved = travel_training_records.filter(
    (t) => t.milestone_achieved,
  ).length;
  const travelMilestoneRate = pct(travelMilestonesAchieved, totalTravelSessions);

  const travelChildFeedbackPositive = travel_training_records.filter(
    (t) => t.child_feedback_positive,
  ).length;
  const travelFeedbackRate = pct(travelChildFeedbackPositive, totalTravelSessions);

  const travelChildConfidenceSum = travel_training_records.reduce(
    (sum, t) => sum + t.child_confidence_rating, 0,
  );
  const travelChildConfidenceAvg =
    totalTravelSessions > 0
      ? Math.round((travelChildConfidenceSum / totalTravelSessions) * 100) / 100
      : 0;

  const travelStaffConfidenceSum = travel_training_records.reduce(
    (sum, t) => sum + t.staff_confidence_rating, 0,
  );
  const travelStaffConfidenceAvg =
    totalTravelSessions > 0
      ? Math.round((travelStaffConfidenceSum / totalTravelSessions) * 100) / 100
      : 0;

  const travelIndependentJourneys = travel_training_records.filter(
    (t) => t.competency_level === "independent" && !t.accompanied,
  ).length;

  // --- Personal care metrics ---
  const totalPersonalCareRecords = personal_care_records.length;
  const uniqueChildrenPersonalCare = new Set(
    personal_care_records.map((p) => p.child_id),
  ).size;
  const personalCareParticipationRate =
    total_children > 0 ? pct(uniqueChildrenPersonalCare, total_children) : 0;

  const personalCareIndependent = personal_care_records.filter(
    (p) => p.independence_level === "independent" || p.independence_level === "minimal_prompts",
  ).length;
  const personalCareRate = pct(personalCareIndependent, totalPersonalCareRecords);

  const personalCareImprovement = personal_care_records.filter(
    (p) => p.improvement_noted,
  ).length;
  const personalCareImprovementRate = pct(personalCareImprovement, totalPersonalCareRecords);

  const personalCareChildEngaged = personal_care_records.filter(
    (p) => p.child_engaged,
  ).length;
  const personalCareEngagementRate = pct(personalCareChildEngaged, totalPersonalCareRecords);

  const personalCareDignityRespected = personal_care_records.filter(
    (p) => p.dignity_respected,
  ).length;
  const personalCareDignityRate = pct(personalCareDignityRespected, totalPersonalCareRecords);

  const personalCareAgeAppropriate = personal_care_records.filter(
    (p) => p.age_appropriate_support,
  ).length;
  const personalCareAgeApproRate = pct(personalCareAgeAppropriate, totalPersonalCareRecords);

  const personalCareKeyWorkerDiscussed = personal_care_records.filter(
    (p) => p.key_worker_discussed,
  ).length;
  const personalCareKeyWorkerRate = pct(personalCareKeyWorkerDiscussed, totalPersonalCareRecords);

  const personalCareFullIndependence = personal_care_records.filter(
    (p) => p.independence_level === "independent",
  ).length;
  const personalCareFullIndependenceRate = pct(personalCareFullIndependence, totalPersonalCareRecords);

  // --- Independence milestones ---
  const totalMilestones = independence_milestone_records.length;
  const achievedMilestones = independence_milestone_records.filter(
    (m) => m.achieved,
  ).length;
  const milestoneAchievementRate = pct(achievedMilestones, totalMilestones);

  const overdueMilestones = independence_milestone_records.filter(
    (m) => m.overdue && !m.achieved,
  ).length;

  const celebratedMilestones = independence_milestone_records.filter(
    (m) => m.achieved && m.child_celebrated,
  ).length;
  const milestoneCelebrationRate = pct(celebratedMilestones, achievedMilestones);

  const evidencedMilestones = independence_milestone_records.filter(
    (m) => m.achieved && m.evidenced_in_records,
  ).length;
  const milestoneEvidenceRate = pct(evidencedMilestones, achievedMilestones);

  const childProudMilestones = independence_milestone_records.filter(
    (m) => m.achieved && m.child_proud,
  ).length;
  const milestoneChildProudRate = pct(childProudMilestones, achievedMilestones);

  const sharedWithSWMilestones = independence_milestone_records.filter(
    (m) => m.achieved && m.shared_with_social_worker,
  ).length;
  const milestoneSharedRate = pct(sharedWithSWMilestones, achievedMilestones);

  // Milestone category analysis
  const milestoneCategoryCounts: Record<string, { total: number; achieved: number }> = {};
  for (const m of independence_milestone_records) {
    if (!milestoneCategoryCounts[m.milestone_category]) {
      milestoneCategoryCounts[m.milestone_category] = { total: 0, achieved: 0 };
    }
    milestoneCategoryCounts[m.milestone_category].total++;
    if (m.achieved) milestoneCategoryCounts[m.milestone_category].achieved++;
  }

  // --- Child engagement rate (composite) ---
  const engagementNumerator =
    assessmentsWithChildInvolvement +
    cookingChildEnjoyed +
    travelChildFeedbackPositive +
    personalCareChildEngaged;
  const engagementDenominator =
    totalAssessments +
    totalCookingSessions +
    totalTravelSessions +
    totalPersonalCareRecords;
  const childEngagementRate = pct(engagementNumerator, engagementDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: skillsAssessmentCoverageRate (>=100: +4, >=80: +2) ---
  if (skillsAssessmentCoverageRate >= 100) score += 4;
  else if (skillsAssessmentCoverageRate >= 80) score += 2;

  // --- Bonus 2: cookingCompetencyRate (>=80: +4, >=60: +2) ---
  if (cookingCompetencyRate >= 80) score += 4;
  else if (cookingCompetencyRate >= 60) score += 2;

  // --- Bonus 3: travelIndependenceRate (>=80: +3, >=60: +1) ---
  if (travelIndependenceRate >= 80) score += 3;
  else if (travelIndependenceRate >= 60) score += 1;

  // --- Bonus 4: personalCareRate (>=90: +3, >=70: +1) ---
  if (personalCareRate >= 90) score += 3;
  else if (personalCareRate >= 70) score += 1;

  // --- Bonus 5: milestoneAchievementRate (>=90: +4, >=70: +2) ---
  if (milestoneAchievementRate >= 90) score += 4;
  else if (milestoneAchievementRate >= 70) score += 2;

  // --- Bonus 6: childEngagementRate (>=90: +3, >=70: +1) ---
  if (childEngagementRate >= 90) score += 3;
  else if (childEngagementRate >= 70) score += 1;

  // --- Bonus 7: goalsAchievementRate (>=80: +3, >=60: +1) ---
  if (goalsAchievementRate >= 80) score += 3;
  else if (goalsAchievementRate >= 60) score += 1;

  // --- Bonus 8: assessmentReviewComplianceRate (>=100: +2, >=80: +1) ---
  if (assessmentReviewComplianceRate >= 100) score += 2;
  else if (assessmentReviewComplianceRate >= 80) score += 1;

  // --- Bonus 9: skillsImprovementRate (>=80: +2, >=60: +1) ---
  if (skillsImprovementRate >= 80) score += 2;
  else if (skillsImprovementRate >= 60) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // skillsAssessmentCoverageRate < 50 → -6 (major gap in understanding needs)
  if (skillsAssessmentCoverageRate < 50 && total_children > 0) score -= 6;

  // cookingCompetencyRate < 40 → -4
  if (cookingCompetencyRate < 40 && totalCookingSessions > 0) score -= 4;

  // travelIndependenceRate < 30 → -4
  if (travelIndependenceRate < 30 && totalTravelSessions > 0) score -= 4;

  // personalCareRate < 40 → -3
  if (personalCareRate < 40 && totalPersonalCareRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const independence_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (skillsAssessmentCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has a life skills assessment — the home demonstrates comprehensive identification of each child's independence development needs.",
    );
  } else if (skillsAssessmentCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${skillsAssessmentCoverageRate}% of children have life skills assessments — strong coverage in identifying children's independence development needs.`,
    );
  }

  if (cookingCompetencyRate >= 80 && totalCookingSessions > 0) {
    strengths.push(
      `${cookingCompetencyRate}% of cooking sessions at supervised or independent level — children are developing genuine cooking competency for independent living.`,
    );
  } else if (cookingCompetencyRate >= 60 && totalCookingSessions > 0) {
    strengths.push(
      `${cookingCompetencyRate}% cooking competency rate — the majority of cooking sessions demonstrate real skill development.`,
    );
  }

  if (travelIndependenceRate >= 80 && totalTravelSessions > 0) {
    strengths.push(
      `${travelIndependenceRate}% of travel training at competent or independent level — children are developing strong travel skills for independent living.`,
    );
  } else if (travelIndependenceRate >= 60 && totalTravelSessions > 0) {
    strengths.push(
      `${travelIndependenceRate}% travel independence rate — good progress in developing children's travel competency.`,
    );
  }

  if (personalCareRate >= 90 && totalPersonalCareRecords > 0) {
    strengths.push(
      `${personalCareRate}% of personal care at independent or minimal-prompts level — children are managing their personal care with growing independence.`,
    );
  } else if (personalCareRate >= 70 && totalPersonalCareRecords > 0) {
    strengths.push(
      `${personalCareRate}% personal care independence — most children demonstrate good levels of independence in managing their personal hygiene and self-care.`,
    );
  }

  if (milestoneAchievementRate >= 90 && totalMilestones > 0) {
    strengths.push(
      `${milestoneAchievementRate}% of independence milestones achieved — children are consistently reaching their independence development targets.`,
    );
  } else if (milestoneAchievementRate >= 70 && totalMilestones > 0) {
    strengths.push(
      `${milestoneAchievementRate}% milestone achievement rate — the majority of independence milestones are being met.`,
    );
  }

  if (childEngagementRate >= 90 && engagementDenominator > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement across life skills activities — children are actively involved and motivated in developing their independence.`,
    );
  } else if (childEngagementRate >= 70 && engagementDenominator > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement rate — most children are positively engaged in life skills development activities.`,
    );
  }

  if (goalsAchievementRate >= 80 && totalGoalsSet > 0) {
    strengths.push(
      `${goalsAchievementRate}% of independence goals achieved — the home sets appropriate targets and supports children to reach them.`,
    );
  } else if (goalsAchievementRate >= 60 && totalGoalsSet > 0) {
    strengths.push(
      `${goalsAchievementRate}% goal achievement rate — most children are meeting their independence development goals.`,
    );
  }

  if (cookingEnjoymentRate >= 90 && totalCookingSessions > 0) {
    strengths.push(
      `${cookingEnjoymentRate}% of children enjoy cooking sessions — the cooking programme is engaging and creates positive experiences.`,
    );
  }

  if (cookingChildChoiceRate >= 70 && totalCookingSessions > 0) {
    strengths.push(
      `${cookingChildChoiceRate}% of cooking sessions involve the child choosing their own recipe — children have genuine agency in their life skills learning.`,
    );
  }

  if (travelChildConfidenceAvg >= 4.0 && totalTravelSessions > 0) {
    strengths.push(
      `Average child travel confidence of ${travelChildConfidenceAvg}/5 — children feel confident in their developing travel skills.`,
    );
  }

  if (milestoneCelebrationRate >= 80 && achievedMilestones > 0) {
    strengths.push(
      `${milestoneCelebrationRate}% of achieved milestones celebrated with the child — the home recognises and validates children's independence achievements.`,
    );
  }

  if (assessmentReviewComplianceRate >= 100 && totalAssessments > 0) {
    strengths.push(
      "All life skills assessment reviews are up to date — the home ensures assessments remain current and reflective of children's developing skills.",
    );
  } else if (assessmentReviewComplianceRate >= 80 && totalAssessments > 0) {
    strengths.push(
      `${assessmentReviewComplianceRate}% of assessment reviews on schedule — strong compliance with review timescales.`,
    );
  }

  if (skillsImprovementRate >= 80 && assessmentsWithPreviousScore.length > 0) {
    strengths.push(
      `${skillsImprovementRate}% of children showing measurable improvement in independence skills — the home's approach to life skills development is achieving real progress.`,
    );
  } else if (skillsImprovementRate >= 60 && assessmentsWithPreviousScore.length > 0) {
    strengths.push(
      `${skillsImprovementRate}% of children showing improvement — most children are making progress in their independence development.`,
    );
  }

  if (personalCareDignityRate >= 100 && totalPersonalCareRecords > 0) {
    strengths.push(
      "Dignity is respected in 100% of personal care support — the home ensures children's privacy and dignity are maintained throughout personal care development.",
    );
  }

  if (cookingSafetyRate >= 100 && totalCookingSessions > 0) {
    strengths.push(
      "Safety standards met in 100% of cooking sessions — children learn in a safe environment that builds confidence.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (skillsAssessmentCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${skillsAssessmentCoverageRate}% of children have life skills assessments — the majority of children's independence development needs have not been formally assessed, preventing the home from delivering tailored support.`,
    );
  } else if (skillsAssessmentCoverageRate < 80 && skillsAssessmentCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `Life skills assessment coverage at ${skillsAssessmentCoverageRate}% — some children's independence development needs remain unassessed, which may result in missed opportunities to develop critical life skills.`,
    );
  }

  if (cookingCompetencyRate < 40 && totalCookingSessions > 0) {
    concerns.push(
      `Only ${cookingCompetencyRate}% of cooking sessions at supervised or independent level — most children are still requiring significant support, suggesting the cooking programme needs strengthening to build genuine competency.`,
    );
  } else if (cookingCompetencyRate < 60 && cookingCompetencyRate >= 40 && totalCookingSessions > 0) {
    concerns.push(
      `Cooking competency at ${cookingCompetencyRate}% — a significant proportion of sessions still require full assistance, indicating slower progress in developing cooking independence.`,
    );
  }

  if (travelIndependenceRate < 30 && totalTravelSessions > 0) {
    concerns.push(
      `Only ${travelIndependenceRate}% of travel training at competent or independent level — the majority of children have not yet developed sufficient travel skills for safe independent movement.`,
    );
  } else if (travelIndependenceRate < 60 && travelIndependenceRate >= 30 && totalTravelSessions > 0) {
    concerns.push(
      `Travel independence at ${travelIndependenceRate}% — many children are still in early stages of travel competency, requiring increased training frequency and graduated exposure.`,
    );
  }

  if (personalCareRate < 40 && totalPersonalCareRecords > 0) {
    concerns.push(
      `Only ${personalCareRate}% of personal care at independent or minimal-prompts level — the majority of children still require significant support with personal hygiene and self-care routines.`,
    );
  } else if (personalCareRate < 70 && personalCareRate >= 40 && totalPersonalCareRecords > 0) {
    concerns.push(
      `Personal care independence at ${personalCareRate}% — some children still need considerable support with personal care, indicating the need for more structured development of self-care routines.`,
    );
  }

  if (milestoneAchievementRate < 50 && totalMilestones > 0) {
    concerns.push(
      `Only ${milestoneAchievementRate}% of independence milestones achieved — the majority of milestones are not being met, suggesting targets may be unrealistic or insufficient support is provided to help children reach them.`,
    );
  } else if (milestoneAchievementRate < 70 && milestoneAchievementRate >= 50 && totalMilestones > 0) {
    concerns.push(
      `Milestone achievement at ${milestoneAchievementRate}% — a notable proportion of independence milestones are not being met, requiring review of targets and support strategies.`,
    );
  }

  if (childEngagementRate < 50 && engagementDenominator > 0) {
    concerns.push(
      `Only ${childEngagementRate}% child engagement across life skills activities — most children are not positively engaged, raising questions about whether activities are motivating, age-appropriate, and meeting their interests.`,
    );
  } else if (childEngagementRate < 70 && childEngagementRate >= 50 && engagementDenominator > 0) {
    concerns.push(
      `Child engagement at ${childEngagementRate}% — a significant proportion of children are not actively engaged in life skills development, which may reduce the effectiveness of independence training.`,
    );
  }

  if (overdueMilestones > 0 && totalMilestones > 0) {
    concerns.push(
      `${overdueMilestones} independence milestone${overdueMilestones !== 1 ? "s are" : " is"} overdue — milestones that pass their target date without achievement need review and potentially revised support plans.`,
    );
  }

  if (overdueAssessmentReviews > 0 && totalAssessments > 0) {
    concerns.push(
      `${overdueAssessmentReviews} life skills assessment review${overdueAssessmentReviews !== 1 ? "s are" : " is"} overdue — without timely reviews, assessments may not reflect children's current independence levels.`,
    );
  }

  if (cookingParticipationRate < 50 && total_children > 0 && totalCookingSessions > 0) {
    concerns.push(
      `Only ${cookingParticipationRate}% of children are participating in the cooking programme — the majority of children are missing out on essential cooking skills development.`,
    );
  }

  if (travelParticipationRate < 50 && total_children > 0 && totalTravelSessions > 0) {
    concerns.push(
      `Only ${travelParticipationRate}% of children are receiving travel training — most children are not being supported to develop safe travel skills.`,
    );
  }

  if (personalCareParticipationRate < 50 && total_children > 0 && totalPersonalCareRecords > 0) {
    concerns.push(
      `Only ${personalCareParticipationRate}% of children have personal care development records — the home cannot evidence individualised personal care support for most children.`,
    );
  }

  if (cookingSafetyRate < 80 && totalCookingSessions > 0) {
    concerns.push(
      `Safety standards met in only ${cookingSafetyRate}% of cooking sessions — children must be safe during all cooking activities and any lapse in safety standards is unacceptable.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: IndependenceLifeSkillsRecommendation[] = [];
  let rank = 0;

  if (skillsAssessmentCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently complete life skills assessments for all children — every child's independence development needs must be formally assessed to create individualised plans covering cooking, cleaning, travel, personal care, and money management.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (cookingCompetencyRate < 40 && totalCookingSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and strengthen the cooking programme to build genuine competency — ensure sessions are progressive, building from observation through to independent cooking, with clear pathways for each child to develop real-world cooking skills.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (travelIndependenceRate < 30 && totalTravelSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Intensify travel training with graduated exposure — children need more frequent, structured travel training sessions moving from accompanied to independent journeys, with individual risk assessments and confidence-building approaches.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (personalCareRate < 40 && totalPersonalCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement structured personal care development plans for all children — work with each child to build age-appropriate self-care routines, ensuring dignity is respected while progressively building independence.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (childEngagementRate < 50 && engagementDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review life skills activities to improve child engagement — consult children about what activities interest them and how they would like to learn, adapting the programme to their preferences while maintaining developmental objectives.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (cookingSafetyRate < 80 && totalCookingSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately review cooking safety procedures — every cooking session must meet safety standards. Conduct a safety audit, retrain staff, and implement pre-session safety checklists.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Quality of care",
    });
  }

  if (milestoneAchievementRate < 50 && totalMilestones > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review independence milestones to ensure they are achievable and appropriately supported — where the majority of milestones are not being achieved, targets may need adjusting or additional support strategies implementing.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (overdueAssessmentReviews > 0 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue life skills assessment reviews — children's independence abilities evolve and assessments must be kept current to ensure development plans remain appropriate.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (overdueMilestones > 0 && totalMilestones > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all overdue milestones — where milestones have passed their target date, assess whether the target was realistic, whether additional support is needed, or whether the milestone needs adjusting to the child's individual pace.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    skillsAssessmentCoverageRate >= 50 &&
    skillsAssessmentCoverageRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend life skills assessment coverage to all children — aim for 100% coverage to ensure every child has an individualised independence development plan.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    cookingCompetencyRate >= 40 &&
    cookingCompetencyRate < 60 &&
    totalCookingSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Accelerate cooking skills progression — increase the frequency and variety of cooking sessions, providing more opportunities for children to practise in supervised and independent settings.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    travelIndependenceRate >= 30 &&
    travelIndependenceRate < 60 &&
    totalTravelSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand travel training to include more independent travel opportunities — gradually increase unsupervised journeys for children who are assessed as competent, building real-world travel confidence.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (
    personalCareRate >= 40 &&
    personalCareRate < 70 &&
    totalPersonalCareRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Focus on building personal care independence through graduated withdrawal of support — for children still requiring significant assistance, create step-by-step plans to build self-care confidence at their own pace.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (cookingParticipationRate < 50 && total_children > 0 && totalCookingSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children participate in the cooking programme — every child should have regular opportunities to develop cooking skills, adapted to their age, ability, and interests.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (travelRiskAssessmentRate < 80 && totalTravelSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure risk assessments are completed for all travel training sessions — each session should have a documented risk assessment to evidence safe, proportionate practice.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Quality of care",
    });
  }

  if (cookingDocumentationRate < 70 && totalCookingSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve cooking session documentation — each session should have recorded notes detailing skills practised, progress made, and any concerns to evidence the developmental value of the cooking programme.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (milestoneSharedRate < 70 && achievedMilestones > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Share independence milestones with children's social workers — celebrating achievements with the wider professional network reinforces children's sense of progress and supports positive reporting at reviews.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70 &&
    engagementDenominator > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore ways to increase child engagement in life skills activities — seek children's views on what motivates them and adapt the programme to incorporate their interests while maintaining developmental objectives.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: IndependenceLifeSkillsInsight[] = [];

  // -- Critical insights --

  if (skillsAssessmentCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${skillsAssessmentCoverageRate}% of children have life skills assessments. Without formal assessment of each child's independence development needs, the home cannot demonstrate that it is tailoring life skills support to individual requirements. Ofsted expects evidence that the home actively prepares children for independence under Reg 5.`,
      severity: "critical",
    });
  }

  if (cookingCompetencyRate < 40 && totalCookingSessions > 0) {
    insights.push({
      text: `Only ${cookingCompetencyRate}% of cooking sessions at supervised or independent level. The cooking programme is not effectively building competency — children need progressive, structured pathways from observation through to independent cooking to develop a fundamental life skill.`,
      severity: "critical",
    });
  }

  if (travelIndependenceRate < 30 && totalTravelSessions > 0) {
    insights.push({
      text: `Only ${travelIndependenceRate}% of travel training at competent or independent level. Most children cannot travel safely and independently, which significantly limits their ability to access education, employment, and social opportunities. This is a critical independence deficit.`,
      severity: "critical",
    });
  }

  if (personalCareRate < 40 && totalPersonalCareRecords > 0) {
    insights.push({
      text: `Only ${personalCareRate}% of personal care at independent or minimal-prompts level. The majority of children still require significant support with basic personal hygiene routines. While support must always respect dignity, the home should be actively building self-care independence.`,
      severity: "critical",
    });
  }

  if (childEngagementRate < 50 && engagementDenominator > 0) {
    insights.push({
      text: `Only ${childEngagementRate}% child engagement across life skills activities. When most children are not engaged, the programme is not meeting their needs or interests. Reg 7 requires that children's views shape their care, and low engagement suggests children's preferences are not being heard.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    skillsAssessmentCoverageRate >= 50 &&
    skillsAssessmentCoverageRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Life skills assessment coverage at ${skillsAssessmentCoverageRate}% — improving but some children still lack a formal independence assessment. Each unassessed child may be missing individualised development opportunities.`,
      severity: "warning",
    });
  }

  if (
    cookingCompetencyRate >= 40 &&
    cookingCompetencyRate < 60 &&
    totalCookingSessions > 0
  ) {
    insights.push({
      text: `Cooking competency at ${cookingCompetencyRate}% — progression is slow for some children. Consider whether the programme offers enough variety, frequency, and graduated challenge to build genuine independence.`,
      severity: "warning",
    });
  }

  if (
    travelIndependenceRate >= 30 &&
    travelIndependenceRate < 60 &&
    totalTravelSessions > 0
  ) {
    insights.push({
      text: `Travel independence at ${travelIndependenceRate}% — many children are still developing travel competency. Increasing the frequency and diversity of travel training opportunities will accelerate progress toward safe independent travel.`,
      severity: "warning",
    });
  }

  if (
    personalCareRate >= 40 &&
    personalCareRate < 70 &&
    totalPersonalCareRecords > 0
  ) {
    insights.push({
      text: `Personal care independence at ${personalCareRate}% — some children still need considerable support. Graduated withdrawal of support, led by the child's pace and preferences, should be the focus.`,
      severity: "warning",
    });
  }

  if (
    milestoneAchievementRate >= 50 &&
    milestoneAchievementRate < 70 &&
    totalMilestones > 0
  ) {
    insights.push({
      text: `Milestone achievement at ${milestoneAchievementRate}% — some milestones are being missed. Consider whether targets are appropriately ambitious yet achievable, and whether enough support is in place.`,
      severity: "warning",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70 &&
    engagementDenominator > 0
  ) {
    insights.push({
      text: `Child engagement at ${childEngagementRate}% — a notable proportion of children are not actively engaged. Adapting activities to children's individual interests and consulting them about what they want to learn will improve motivation.`,
      severity: "warning",
    });
  }

  if (overdueMilestones > 0 && totalMilestones > 0) {
    insights.push({
      text: `${overdueMilestones} independence milestone${overdueMilestones !== 1 ? "s have" : " has"} passed the target date. Overdue milestones need reviewing — the child may need more support, the target may need adjusting, or the approach may need changing.`,
      severity: "warning",
    });
  }

  if (overdueAssessmentReviews > 0 && totalAssessments > 0) {
    insights.push({
      text: `${overdueAssessmentReviews} life skills assessment review${overdueAssessmentReviews !== 1 ? "s are" : " is"} overdue. Children's independence abilities change as they develop — out-of-date assessments may lead to inappropriate or insufficient support.`,
      severity: "warning",
    });
  }

  if (goalsAchievementRate < 60 && goalsAchievementRate >= 40 && totalGoalsSet > 0) {
    insights.push({
      text: `Goal achievement at ${goalsAchievementRate}% — less than two-thirds of independence goals are being met. This may indicate that goals are too ambitious or that children need more structured support to achieve them.`,
      severity: "warning",
    });
  }

  if (cookingSafetyRate < 90 && cookingSafetyRate >= 80 && totalCookingSessions > 0) {
    insights.push({
      text: `Cooking safety compliance at ${cookingSafetyRate}% — while mostly compliant, any shortfall in kitchen safety during children's cooking activities is concerning and must be addressed.`,
      severity: "warning",
    });
  }

  if (travelRiskAssessmentRate < 80 && travelRiskAssessmentRate >= 60 && totalTravelSessions > 0) {
    insights.push({
      text: `Travel training risk assessment completion at ${travelRiskAssessmentRate}% — not all sessions have documented risk assessments. Every travel training session should have a proportionate risk assessment.`,
      severity: "warning",
    });
  }

  // Analysis of milestone categories
  const categoryEntries = Object.entries(milestoneCategoryCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4);
  if (categoryEntries.length > 0 && totalMilestones >= 5) {
    const catStr = categoryEntries
      .map(
        ([cat, data]) =>
          `${cat.replace(/_/g, " ")} (${data.achieved}/${data.total})`,
      )
      .join(", ");
    insights.push({
      text: `Independence milestone breakdown: ${catStr}. Review whether the milestone portfolio covers all domains of independence — cooking, money management, travel, personal care, social skills — proportionately.`,
      severity: "warning",
    });
  }

  // Analysis of cooking skill levels
  if (totalCookingSessions >= 5) {
    const skillLevels: Record<string, number> = {};
    for (const c of cooking_programme_records) {
      skillLevels[c.skill_level] = (skillLevels[c.skill_level] ?? 0) + 1;
    }
    const levelStr = Object.entries(skillLevels)
      .sort((a, b) => b[1] - a[1])
      .map(([level, count]) => `${level} (${count})`)
      .join(", ");
    insights.push({
      text: `Cooking session skill distribution: ${levelStr}. A healthy programme should show progressive movement from observer/assisted toward supervised/independent across time.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (independence_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding independence and life skills development — children receive comprehensive, individualised support across cooking, travel, personal care, and broader independence skills. This is strong evidence of quality of care that genuinely prepares children for independent living under Reg 5.",
      severity: "positive",
    });
  }

  if (
    skillsAssessmentCoverageRate >= 100 &&
    assessmentChildInvolvementRate >= 90 &&
    total_children > 0 &&
    totalAssessments > 0
  ) {
    insights.push({
      text: "Every child has a life skills assessment with high levels of child involvement — the home excels at identifying each child's independence needs through participatory assessment, ensuring development plans are truly child-centred.",
      severity: "positive",
    });
  }

  if (
    cookingCompetencyRate >= 80 &&
    cookingEnjoymentRate >= 80 &&
    totalCookingSessions > 0
  ) {
    insights.push({
      text: `${cookingCompetencyRate}% cooking competency with ${cookingEnjoymentRate}% enjoyment — children are developing genuine cooking skills while enjoying the experience, creating a positive association with this essential life skill.`,
      severity: "positive",
    });
  }

  if (
    travelIndependenceRate >= 80 &&
    travelChildConfidenceAvg >= 4.0 &&
    totalTravelSessions > 0
  ) {
    insights.push({
      text: `${travelIndependenceRate}% travel independence with average child confidence of ${travelChildConfidenceAvg}/5 — children are confident, competent travellers who can access their communities independently. This directly supports positive outcomes and social inclusion.`,
      severity: "positive",
    });
  }

  if (
    personalCareRate >= 90 &&
    personalCareDignityRate >= 100 &&
    totalPersonalCareRecords > 0
  ) {
    insights.push({
      text: `${personalCareRate}% personal care independence with dignity maintained throughout — children manage their personal care with growing confidence while the home ensures their privacy and dignity are always respected.`,
      severity: "positive",
    });
  }

  if (
    milestoneAchievementRate >= 90 &&
    milestoneCelebrationRate >= 80 &&
    totalMilestones > 0
  ) {
    insights.push({
      text: `${milestoneAchievementRate}% milestone achievement with ${milestoneCelebrationRate}% celebrated with children — the home sets achievable targets, supports children to reach them, and genuinely celebrates their achievements, building self-esteem and motivation.`,
      severity: "positive",
    });
  }

  if (
    childEngagementRate >= 90 &&
    engagementDenominator > 0
  ) {
    insights.push({
      text: `${childEngagementRate}% child engagement — children are overwhelmingly positive about their life skills development activities. This high engagement level is powerful evidence that the home listens to children's views under Reg 7 and adapts provision accordingly.`,
      severity: "positive",
    });
  }

  if (
    goalsAchievementRate >= 80 &&
    skillsImprovementRate >= 80 &&
    totalGoalsSet > 0 &&
    assessmentsWithPreviousScore.length > 0
  ) {
    insights.push({
      text: `${goalsAchievementRate}% goal achievement combined with ${skillsImprovementRate}% measurable improvement — the home sets appropriate targets and delivers the support needed for children to achieve them, with measurable progress evidenced over time.`,
      severity: "positive",
    });
  }

  if (
    cookingChildChoiceRate >= 70 &&
    cookingNewSkillRate >= 60 &&
    totalCookingSessions > 0
  ) {
    insights.push({
      text: `${cookingChildChoiceRate}% child recipe choice with ${cookingNewSkillRate}% of sessions involving new skill learning — children have genuine agency in their cooking development while consistently building their repertoire of skills.`,
      severity: "positive",
    });
  }

  if (
    milestoneEvidenceRate >= 90 &&
    milestoneSharedRate >= 80 &&
    achievedMilestones > 0
  ) {
    insights.push({
      text: `${milestoneEvidenceRate}% of milestones evidenced in records and ${milestoneSharedRate}% shared with social workers — the home maintains robust evidence of children's independence achievements and ensures the wider professional network is informed of progress.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (independence_rating === "outstanding") {
    headline =
      "Outstanding independence and life skills development — children receive comprehensive, individualised support across cooking, travel, personal care, and broader independence skills, genuinely preparing them for independent living.";
  } else if (independence_rating === "good") {
    headline = `Good independence and life skills development — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (independence_rating === "adequate") {
    headline = `Adequate independence and life skills development — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children are being effectively prepared for independent living.`;
  } else {
    headline = `Independence and life skills development is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children receive the independence support they need.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    independence_rating,
    independence_score: score,
    headline,
    skills_assessment_coverage_rate: skillsAssessmentCoverageRate,
    cooking_competency_rate: cookingCompetencyRate,
    travel_independence_rate: travelIndependenceRate,
    personal_care_rate: personalCareRate,
    milestone_achievement_rate: milestoneAchievementRate,
    child_engagement_rate: childEngagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

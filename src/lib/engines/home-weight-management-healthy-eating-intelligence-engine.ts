// ==============================================================================
// CARA -- HOME WEIGHT MANAGEMENT & HEALTHY EATING INTELLIGENCE ENGINE
// Monitors weight management quality -- weight monitoring frequency, BMI tracking,
// healthy eating programme engagement, portion control awareness, and body
// positivity support across the home.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (Health care), Reg 5 (Statement of purpose),
// SCCIF "Health and wellbeing".
import { meets, below } from "@/lib/metrics/rate";

// Store keys: weightMonitoringRecords, bmiTrackingRecords,
//             healthyEatingRecords, portionControlRecords,
//             bodyPositivityRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface WeightMonitoringRecordInput {
  id: string;
  child_id: string;
  date: string;
  weight_kg: number;
  height_cm: number;
  measured_by: "nurse" | "gp" | "staff" | "health_visitor" | "dietitian" | "self" | "other";
  measurement_context: "routine" | "concern" | "review" | "initial" | "discharge" | "other";
  weight_trend: "stable" | "gaining" | "losing" | "fluctuating" | "unknown";
  within_healthy_range: boolean;
  action_taken: boolean;
  action_details: string;
  gp_notified: boolean;
  child_informed: boolean;
  child_consent_obtained: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  notes: string;
  created_at: string;
}

export interface BmiTrackingRecordInput {
  id: string;
  child_id: string;
  date: string;
  bmi_value: number;
  bmi_category: "underweight" | "healthy" | "overweight" | "obese" | "unknown";
  centile_position: number | null; // percentile on growth chart
  plotted_on_growth_chart: boolean;
  growth_chart_reviewed: boolean;
  trend_direction: "improving" | "stable" | "declining" | "unknown";
  referral_made: boolean;
  referral_type: "dietitian" | "paediatrician" | "gp" | "camhs" | "none";
  professional_involved: boolean;
  review_frequency_weeks: number;
  last_professional_review: string | null;
  child_age_appropriate_discussion: boolean;
  notes: string;
  created_at: string;
}

export interface HealthyEatingRecordInput {
  id: string;
  child_id: string;
  programme_name: string;
  programme_type: "structured_programme" | "cooking_session" | "nutrition_education" | "meal_planning" | "garden_growing" | "shopping_skills" | "food_tasting" | "other";
  date: string;
  attended: boolean;
  engaged: boolean;
  child_enjoyed: boolean;
  child_satisfaction: number; // 1-5
  learning_objectives_met: boolean;
  skills_gained: string[];
  staff_led: boolean;
  external_provider: boolean;
  dietary_knowledge_improved: boolean;
  healthy_choice_made: boolean;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  notes: string;
  created_at: string;
}

export interface PortionControlRecordInput {
  id: string;
  child_id: string;
  date: string;
  assessment_type: "meal_observation" | "education_session" | "care_plan_review" | "keywork_discussion" | "dietitian_assessment" | "other";
  understands_portions: boolean;
  age_appropriate_portions_served: boolean;
  child_self_serves: boolean;
  child_makes_healthy_choices: boolean;
  overeating_concerns: boolean;
  undereating_concerns: boolean;
  emotional_eating_identified: boolean;
  support_plan_in_place: boolean;
  staff_trained_on_portions: boolean;
  meals_balanced: boolean;
  snack_provision_appropriate: boolean;
  hydration_adequate: boolean;
  child_voice_captured: boolean;
  notes: string;
  created_at: string;
}

export interface BodyPositivityRecordInput {
  id: string;
  child_id: string;
  date: string;
  activity_type: "group_session" | "individual_keywork" | "therapeutic_work" | "peer_support" | "resource_sharing" | "positive_affirmation" | "self_image_work" | "other";
  child_engaged: boolean;
  child_satisfaction: number; // 1-5
  positive_body_image_discussed: boolean;
  media_literacy_included: boolean;
  self_esteem_component: boolean;
  weight_stigma_addressed: boolean;
  staff_facilitated: boolean;
  external_professional_involved: boolean;
  child_voice_captured: boolean;
  concerns_identified: boolean;
  concerns_details: string;
  referral_made: boolean;
  referral_type: "camhs" | "counselling" | "eating_disorder_service" | "gp" | "none";
  outcomes_documented: boolean;
  notes: string;
  created_at: string;
}

export interface WeightManagementInput {
  today: string;
  total_children: number;
  weight_monitoring_records: WeightMonitoringRecordInput[];
  bmi_tracking_records: BmiTrackingRecordInput[];
  healthy_eating_records: HealthyEatingRecordInput[];
  portion_control_records: PortionControlRecordInput[];
  body_positivity_records: BodyPositivityRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type WeightManagementRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface WeightManagementInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface WeightManagementRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface WeightManagementResult {
  weight_rating: WeightManagementRating;
  weight_score: number;
  headline: string;
  weight_monitoring_rate: number;
  // fab-0: null when no records.
  bmi_tracking_rate: number | null;
  // fab-0: null when no records.
  healthy_eating_rate: number | null;
  // fab-0: null when no records.
  portion_control_rate: number | null;
  // fab-0: null when no records.
  body_positivity_rate: number | null;
  child_engagement_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: WeightManagementRecommendation[];
  insights: WeightManagementInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): WeightManagementRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: WeightManagementRating,
  score: number,
  headline: string,
): WeightManagementResult {
  return {
    weight_rating: rating,
    weight_score: score,
    headline,
    weight_monitoring_rate: 0,
    bmi_tracking_rate: null,
    healthy_eating_rate: null,
    portion_control_rate: null,
    body_positivity_rate: null,
    child_engagement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeWeightManagementHealthyEating(
  input: WeightManagementInput,
): WeightManagementResult {
  const {
    total_children,
    weight_monitoring_records,
    bmi_tracking_records,
    healthy_eating_records,
    portion_control_records,
    body_positivity_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    weight_monitoring_records.length === 0 &&
    bmi_tracking_records.length === 0 &&
    healthy_eating_records.length === 0 &&
    portion_control_records.length === 0 &&
    body_positivity_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess weight management and healthy eating.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No weight management or healthy eating data recorded despite children on placement -- weight monitoring, BMI tracking, healthy eating programmes, portion control awareness, and body positivity support require urgent attention.",
      ),
      concerns: [
        "No weight monitoring, BMI tracking, healthy eating, portion control, or body positivity records exist despite children being on placement -- the home cannot evidence that children's nutritional health and weight management needs are being assessed or met.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured weight monitoring and BMI tracking for every child with regular health professional reviews, growth chart plotting, and documented action plans where weight concerns are identified.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 -- Health care",
        },
        {
          rank: 2,
          recommendation:
            "Establish a healthy eating programme including nutrition education, cooking skills, portion awareness, and body positivity activities to support children's physical health, self-esteem, and independence.",
          urgency: "immediate",
          regulatory_ref: "SCCIF -- Health and wellbeing",
        },
      ],
      insights: [
        {
          text: "The complete absence of weight management and healthy eating records means Ofsted cannot verify that children's nutritional health is being monitored, that healthy eating is promoted, or that body image concerns are addressed. This represents a fundamental gap in Reg 14 compliance and the home's duty to promote children's health and wellbeing.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Weight monitoring rate ---
  const totalWeightRecords = weight_monitoring_records.length;
  const healthyRangeRecords = weight_monitoring_records.filter((r) => r.within_healthy_range).length;
  const weightMonitoringRate = pct(healthyRangeRecords, totalWeightRecords);

  const uniqueChildrenMonitored = new Set(
    weight_monitoring_records.map((r) => r.child_id),
  ).size;
  const weightCoverageRate = pct(uniqueChildrenMonitored, total_children);

  const weightActionTaken = weight_monitoring_records.filter((r) => r.action_taken).length;
  const weightActionRate = pct(weightActionTaken, totalWeightRecords);

  const weightConsentObtained = weight_monitoring_records.filter((r) => r.child_consent_obtained).length;
  const weightConsentRate = pct(weightConsentObtained, totalWeightRecords);

  const weightChildInformed = weight_monitoring_records.filter((r) => r.child_informed).length;
  const weightChildInformedRate = pct(weightChildInformed, totalWeightRecords);

  const weightGpNotified = weight_monitoring_records.filter((r) => r.gp_notified).length;
  const weightGpNotificationRate = pct(weightGpNotified, totalWeightRecords);

  const weightFollowUpNeeded = weight_monitoring_records.filter((r) => r.follow_up_date !== null).length;
  const weightFollowUpCompleted = weight_monitoring_records.filter(
    (r) => r.follow_up_date !== null && r.follow_up_completed,
  ).length;
  const weightFollowUpRate = pct(weightFollowUpCompleted, weightFollowUpNeeded);

  const weightConcernRecords = weight_monitoring_records.filter(
    (r) => !r.within_healthy_range,
  ).length;
  const weightConcernRate = pct(weightConcernRecords, totalWeightRecords);

  const routineMonitoring = weight_monitoring_records.filter(
    (r) => r.measurement_context === "routine",
  ).length;
  const routineMonitoringRate = pct(routineMonitoring, totalWeightRecords);

  // --- BMI tracking rate ---
  const totalBmiRecords = bmi_tracking_records.length;
  const bmiPlottedOnChart = bmi_tracking_records.filter((r) => r.plotted_on_growth_chart).length;
  const bmiPlottingRate = pct(bmiPlottedOnChart, totalBmiRecords);

  const bmiChartReviewed = bmi_tracking_records.filter((r) => r.growth_chart_reviewed).length;
  const bmiReviewRate = pct(bmiChartReviewed, totalBmiRecords);

  // fab-0: null when no BMI records.
  const bmiTrackingRate: number | null =
    totalBmiRecords > 0
      ? Math.round((bmiPlottingRate + bmiReviewRate) / 2)
      : null;

  const bmiHealthy = bmi_tracking_records.filter((r) => r.bmi_category === "healthy").length;
  const bmiHealthyRate = pct(bmiHealthy, totalBmiRecords);

  const bmiImproving = bmi_tracking_records.filter((r) => r.trend_direction === "improving").length;
  const bmiImprovingRate = pct(bmiImproving, totalBmiRecords);

  const bmiReferralMade = bmi_tracking_records.filter((r) => r.referral_made).length;
  const bmiReferralRate = pct(bmiReferralMade, totalBmiRecords);

  const bmiProfessionalInvolved = bmi_tracking_records.filter((r) => r.professional_involved).length;
  const bmiProfessionalRate = pct(bmiProfessionalInvolved, totalBmiRecords);

  const bmiAgeAppropriateDiscussion = bmi_tracking_records.filter(
    (r) => r.child_age_appropriate_discussion,
  ).length;
  const bmiDiscussionRate = pct(bmiAgeAppropriateDiscussion, totalBmiRecords);

  const bmiOutsideHealthy = bmi_tracking_records.filter(
    (r) => r.bmi_category !== "healthy" && r.bmi_category !== "unknown",
  ).length;
  const bmiConcernRate = pct(bmiOutsideHealthy, totalBmiRecords);

  const bmiDeclining = bmi_tracking_records.filter((r) => r.trend_direction === "declining").length;
  const bmiDecliningRate = pct(bmiDeclining, totalBmiRecords);

  // --- Healthy eating programme engagement ---
  const totalHealthyEatingRecords = healthy_eating_records.length;
  const healthyEatingAttended = healthy_eating_records.filter((r) => r.attended).length;
  const healthyEatingAttendanceRate = pct(healthyEatingAttended, totalHealthyEatingRecords);

  const healthyEatingEngaged = healthy_eating_records.filter((r) => r.engaged).length;
  const healthyEatingEngagementRate = pct(healthyEatingEngaged, totalHealthyEatingRecords);

  // fab-0: null when no healthy-eating records.
  const healthyEatingRate: number | null =
    totalHealthyEatingRecords > 0
      ? Math.round((healthyEatingAttendanceRate + healthyEatingEngagementRate) / 2)
      : null;

  const healthyEatingEnjoyed = healthy_eating_records.filter((r) => r.child_enjoyed).length;
  const healthyEatingEnjoymentRate = pct(healthyEatingEnjoyed, totalHealthyEatingRecords);

  const healthyEatingSatisfactionSum = healthy_eating_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  // fab-0: null when no healthy-eating records.
  const healthyEatingSatisfactionAvg: number | null =
    totalHealthyEatingRecords > 0
      ? Math.round((healthyEatingSatisfactionSum / totalHealthyEatingRecords) * 100) / 100
      : null;

  const healthyEatingObjectivesMet = healthy_eating_records.filter(
    (r) => r.learning_objectives_met,
  ).length;
  const healthyEatingObjectivesRate = pct(healthyEatingObjectivesMet, totalHealthyEatingRecords);

  const healthyChoiceMade = healthy_eating_records.filter((r) => r.healthy_choice_made).length;
  const healthyChoiceRate = pct(healthyChoiceMade, totalHealthyEatingRecords);

  const dietaryKnowledgeImproved = healthy_eating_records.filter(
    (r) => r.dietary_knowledge_improved,
  ).length;
  const dietaryKnowledgeRate = pct(dietaryKnowledgeImproved, totalHealthyEatingRecords);

  const healthyEatingFollowUpNeeded = healthy_eating_records.filter(
    (r) => r.follow_up_planned,
  ).length;
  const healthyEatingFollowUpCompleted = healthy_eating_records.filter(
    (r) => r.follow_up_planned && r.follow_up_completed,
  ).length;
  const healthyEatingFollowUpRate = pct(healthyEatingFollowUpCompleted, healthyEatingFollowUpNeeded);

  const externalProviderSessions = healthy_eating_records.filter(
    (r) => r.external_provider,
  ).length;
  const externalProviderRate = pct(externalProviderSessions, totalHealthyEatingRecords);

  // --- Portion control awareness ---
  const totalPortionRecords = portion_control_records.length;
  const understandsPortions = portion_control_records.filter(
    (r) => r.understands_portions,
  ).length;
  const portionUnderstandingRate = pct(understandsPortions, totalPortionRecords);

  const ageAppropriatePortions = portion_control_records.filter(
    (r) => r.age_appropriate_portions_served,
  ).length;
  const ageAppropriatePortionRate = pct(ageAppropriatePortions, totalPortionRecords);

  // fab-0: null when no portion records.
  const portionControlRate: number | null =
    totalPortionRecords > 0
      ? Math.round((portionUnderstandingRate + ageAppropriatePortionRate) / 2)
      : null;

  const mealsBalanced = portion_control_records.filter((r) => r.meals_balanced).length;
  const mealsBalancedRate = pct(mealsBalanced, totalPortionRecords);

  const snackAppropriate = portion_control_records.filter(
    (r) => r.snack_provision_appropriate,
  ).length;
  const snackAppropriateRate = pct(snackAppropriate, totalPortionRecords);

  const hydrationAdequate = portion_control_records.filter(
    (r) => r.hydration_adequate,
  ).length;
  const hydrationRate = pct(hydrationAdequate, totalPortionRecords);

  const healthyChoicesPC = portion_control_records.filter(
    (r) => r.child_makes_healthy_choices,
  ).length;
  const healthyChoicesRate = pct(healthyChoicesPC, totalPortionRecords);

  const selfServes = portion_control_records.filter((r) => r.child_self_serves).length;
  const selfServingRate = pct(selfServes, totalPortionRecords);

  const overeatingConcerns = portion_control_records.filter(
    (r) => r.overeating_concerns,
  ).length;
  const overeatingRate = pct(overeatingConcerns, totalPortionRecords);

  const undereatingConcerns = portion_control_records.filter(
    (r) => r.undereating_concerns,
  ).length;
  const undereatingRate = pct(undereatingConcerns, totalPortionRecords);

  const emotionalEating = portion_control_records.filter(
    (r) => r.emotional_eating_identified,
  ).length;
  const emotionalEatingRate = pct(emotionalEating, totalPortionRecords);

  const portionSupportPlan = portion_control_records.filter(
    (r) => r.support_plan_in_place,
  ).length;
  const portionSupportPlanRate = pct(portionSupportPlan, totalPortionRecords);

  const staffTrainedPortions = portion_control_records.filter(
    (r) => r.staff_trained_on_portions,
  ).length;
  const staffTrainedPortionRate = pct(staffTrainedPortions, totalPortionRecords);

  const portionVoiceCaptured = portion_control_records.filter(
    (r) => r.child_voice_captured,
  ).length;

  // --- Body positivity support ---
  const totalBodyPositivityRecords = body_positivity_records.length;
  const bodyPositivityEngaged = body_positivity_records.filter(
    (r) => r.child_engaged,
  ).length;
  const bodyPositivityEngagementRate = pct(bodyPositivityEngaged, totalBodyPositivityRecords);

  const positiveImageDiscussed = body_positivity_records.filter(
    (r) => r.positive_body_image_discussed,
  ).length;
  const positiveImageRate = pct(positiveImageDiscussed, totalBodyPositivityRecords);

  // fab-0: null when no body-positivity records.
  const bodyPositivityRate: number | null =
    totalBodyPositivityRecords > 0
      ? Math.round((bodyPositivityEngagementRate + positiveImageRate) / 2)
      : null;

  const bodyPositivitySatisfactionSum = body_positivity_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  // fab-0: null when no body-positivity records.
  const bodyPositivitySatisfactionAvg: number | null =
    totalBodyPositivityRecords > 0
      ? Math.round((bodyPositivitySatisfactionSum / totalBodyPositivityRecords) * 100) / 100
      : null;

  const selfEsteemComponent = body_positivity_records.filter(
    (r) => r.self_esteem_component,
  ).length;
  const selfEsteemRate = pct(selfEsteemComponent, totalBodyPositivityRecords);

  const mediaLiteracy = body_positivity_records.filter(
    (r) => r.media_literacy_included,
  ).length;
  const mediaLiteracyRate = pct(mediaLiteracy, totalBodyPositivityRecords);

  const weightStigmaAddressed = body_positivity_records.filter(
    (r) => r.weight_stigma_addressed,
  ).length;
  const weightStigmaRate = pct(weightStigmaAddressed, totalBodyPositivityRecords);

  const bodyPositivityConcerns = body_positivity_records.filter(
    (r) => r.concerns_identified,
  ).length;
  const bodyPositivityConcernRate = pct(bodyPositivityConcerns, totalBodyPositivityRecords);

  const bodyPositivityReferrals = body_positivity_records.filter(
    (r) => r.referral_made,
  ).length;
  const bodyPositivityReferralRate = pct(bodyPositivityReferrals, totalBodyPositivityRecords);

  const bodyPositivityOutcomes = body_positivity_records.filter(
    (r) => r.outcomes_documented,
  ).length;
  const bodyPositivityOutcomesRate = pct(bodyPositivityOutcomes, totalBodyPositivityRecords);

  const bodyPositivityVoiceCaptured = body_positivity_records.filter(
    (r) => r.child_voice_captured,
  ).length;

  const bodyPositivityStaffFacilitated = body_positivity_records.filter(
    (r) => r.staff_facilitated,
  ).length;
  const bodyPositivityStaffRate = pct(bodyPositivityStaffFacilitated, totalBodyPositivityRecords);

  // --- Child engagement composite ---
  const engagementNumerator =
    healthyEatingEngaged +
    bodyPositivityEngaged +
    portionVoiceCaptured +
    bodyPositivityVoiceCaptured;
  const engagementDenominator =
    totalHealthyEatingRecords +
    totalBodyPositivityRecords +
    totalPortionRecords +
    totalBodyPositivityRecords;
  const childEngagementRate = pct(engagementNumerator, engagementDenominator);

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: weightMonitoringRate (>=90: +4, >=70: +2) ---
  if (weightMonitoringRate >= 90) score += 4;
  else if (weightMonitoringRate >= 70) score += 2;

  // --- Bonus 2: bmiTrackingRate (>=80: +4, >=60: +2) ---
  if (meets(bmiTrackingRate, 80)) score += 4;
  else if (meets(bmiTrackingRate, 60)) score += 2;

  // --- Bonus 3: healthyEatingRate (>=90: +4, >=70: +2) ---
  if (meets(healthyEatingRate, 90)) score += 4;
  else if (meets(healthyEatingRate, 70)) score += 2;

  // --- Bonus 4: portionControlRate (>=90: +3, >=70: +1) ---
  if (meets(portionControlRate, 90)) score += 3;
  else if (meets(portionControlRate, 70)) score += 1;

  // --- Bonus 5: bodyPositivityRate (>=90: +3, >=70: +1) ---
  if (meets(bodyPositivityRate, 90)) score += 3;
  else if (meets(bodyPositivityRate, 70)) score += 1;

  // --- Bonus 6: childEngagementRate (>=80: +3, >=60: +1) ---
  if (childEngagementRate >= 80) score += 3;
  else if (childEngagementRate >= 60) score += 1;

  // --- Bonus 7: mealsBalancedRate (>=95: +3, >=80: +1) ---
  if (mealsBalancedRate >= 95) score += 3;
  else if (mealsBalancedRate >= 80) score += 1;

  // --- Bonus 8: weightCoverageRate (>=90: +2, >=70: +1) ---
  if (weightCoverageRate >= 90) score += 2;
  else if (weightCoverageRate >= 70) score += 1;

  // --- Bonus 9: hydrationRate (>=90: +2, >=70: +1) ---
  if (hydrationRate >= 90) score += 2;
  else if (hydrationRate >= 70) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // weightConcernRate > 50 and no actions -> -5
  if (weightConcernRate > 50 && weightActionRate < 50 && weight_monitoring_records.length > 0) score -= 5;

  // bmiDecliningRate > 40 -> -5
  if (bmiDecliningRate > 40 && bmi_tracking_records.length > 0) score -= 5;

  // healthyEatingRate < 40 -> -4
  if (below(healthyEatingRate, 40) && healthy_eating_records.length > 0) score -= 4;

  // bodyPositivityRate < 40 -> -4
  if (below(bodyPositivityRate, 40) && body_positivity_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const weight_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (weightMonitoringRate >= 90 && totalWeightRecords > 0) {
    strengths.push(
      `${weightMonitoringRate}% of children's weight measurements are within healthy range -- the home demonstrates effective weight monitoring and health promotion.`,
    );
  } else if (weightMonitoringRate >= 70 && totalWeightRecords > 0) {
    strengths.push(
      `${weightMonitoringRate}% of weight measurements within healthy range -- the majority of children's weight is well managed.`,
    );
  }

  if (weightCoverageRate >= 90 && total_children > 0) {
    strengths.push(
      `${weightCoverageRate}% of children have weight monitoring records -- comprehensive coverage ensures no child's nutritional health is overlooked.`,
    );
  } else if (weightCoverageRate >= 70 && total_children > 0) {
    strengths.push(
      `${weightCoverageRate}% weight monitoring coverage -- most children's weight is being actively tracked.`,
    );
  }

  if (weightActionRate >= 90 && totalWeightRecords > 0) {
    strengths.push(
      `Actions taken in ${weightActionRate}% of weight monitoring records -- the home responds promptly to weight-related findings.`,
    );
  }

  if (weightConsentRate >= 90 && totalWeightRecords > 0) {
    strengths.push(
      `Child consent obtained for ${weightConsentRate}% of weight measurements -- the home respects children's autonomy and rights in health monitoring.`,
    );
  }

  if (weightFollowUpRate >= 90 && weightFollowUpNeeded > 0) {
    strengths.push(
      `${weightFollowUpRate}% of weight monitoring follow-ups completed -- the home demonstrates strong continuity of care in weight management.`,
    );
  }

  if (totalBmiRecords > 0 && meets(bmiTrackingRate, 80)) {
    strengths.push(
      `BMI tracking rate at ${bmiTrackingRate}% -- growth charts are plotted and reviewed systematically for all children.`,
    );
  } else if (totalBmiRecords > 0 && meets(bmiTrackingRate, 60)) {
    strengths.push(
      `BMI tracking rate at ${bmiTrackingRate}% -- good progress in systematic BMI monitoring and growth chart review.`,
    );
  }

  if (bmiHealthyRate >= 80 && totalBmiRecords > 0) {
    strengths.push(
      `${bmiHealthyRate}% of BMI assessments fall within the healthy category -- children's nutritional status is well maintained.`,
    );
  }

  if (bmiProfessionalRate >= 80 && totalBmiRecords > 0) {
    strengths.push(
      `Health professionals involved in ${bmiProfessionalRate}% of BMI reviews -- clinical oversight ensures weight concerns are identified and addressed by qualified practitioners.`,
    );
  }

  if (bmiDiscussionRate >= 80 && totalBmiRecords > 0) {
    strengths.push(
      `Age-appropriate BMI discussions held in ${bmiDiscussionRate}% of cases -- children understand their growth and development in a sensitive, supportive way.`,
    );
  }

  if (totalHealthyEatingRecords > 0 && meets(healthyEatingRate, 90)) {
    strengths.push(
      `Healthy eating programme engagement at ${healthyEatingRate}% -- children are attending and actively participating in nutrition education.`,
    );
  } else if (totalHealthyEatingRecords > 0 && meets(healthyEatingRate, 70)) {
    strengths.push(
      `Healthy eating engagement at ${healthyEatingRate}% -- good levels of participation in nutrition programmes.`,
    );
  }

  if (totalHealthyEatingRecords > 0 && healthyEatingSatisfactionAvg !== null && healthyEatingSatisfactionAvg >= 4.0) {
    strengths.push(
      `Children's satisfaction with healthy eating programmes averages ${healthyEatingSatisfactionAvg}/5 -- children enjoy and value the nutrition education provided.`,
    );
  }

  if (healthyChoiceRate >= 80 && totalHealthyEatingRecords > 0) {
    strengths.push(
      `Healthy food choices observed in ${healthyChoiceRate}% of programme sessions -- children are translating nutrition knowledge into practical choices.`,
    );
  }

  if (dietaryKnowledgeRate >= 80 && totalHealthyEatingRecords > 0) {
    strengths.push(
      `Dietary knowledge improved in ${dietaryKnowledgeRate}% of sessions -- the healthy eating programme is effectively building children's nutritional literacy.`,
    );
  }

  if (healthyEatingObjectivesRate >= 80 && totalHealthyEatingRecords > 0) {
    strengths.push(
      `Learning objectives met in ${healthyEatingObjectivesRate}% of healthy eating sessions -- programmes are well structured and delivering intended outcomes.`,
    );
  }

  if (totalPortionRecords > 0 && meets(portionControlRate, 90)) {
    strengths.push(
      `Portion control awareness at ${portionControlRate}% -- children understand appropriate portions and are served age-appropriate meals.`,
    );
  } else if (totalPortionRecords > 0 && meets(portionControlRate, 70)) {
    strengths.push(
      `Portion control awareness at ${portionControlRate}% -- good understanding of portions across the home.`,
    );
  }

  if (mealsBalancedRate >= 90 && totalPortionRecords > 0) {
    strengths.push(
      `${mealsBalancedRate}% of meals assessed as balanced -- the home consistently provides nutritionally balanced meals.`,
    );
  }

  if (snackAppropriateRate >= 90 && totalPortionRecords > 0) {
    strengths.push(
      `Appropriate snack provision in ${snackAppropriateRate}% of assessments -- snacking habits are healthy and well managed.`,
    );
  }

  if (hydrationRate >= 90 && totalPortionRecords > 0) {
    strengths.push(
      `Adequate hydration reported in ${hydrationRate}% of assessments -- children are drinking enough water and healthy fluids.`,
    );
  }

  if (selfServingRate >= 60 && totalPortionRecords > 0) {
    strengths.push(
      `${selfServingRate}% of children self-serve at meals -- the home promotes independence and self-regulation in eating habits.`,
    );
  }

  if (staffTrainedPortionRate >= 80 && totalPortionRecords > 0) {
    strengths.push(
      `Staff trained on portion guidance in ${staffTrainedPortionRate}% of assessments -- staff are equipped to support children's healthy eating.`,
    );
  }

  if (totalBodyPositivityRecords > 0 && meets(bodyPositivityRate, 90)) {
    strengths.push(
      `Body positivity support at ${bodyPositivityRate}% -- children are engaged in positive body image work and discussions.`,
    );
  } else if (totalBodyPositivityRecords > 0 && meets(bodyPositivityRate, 70)) {
    strengths.push(
      `Body positivity support at ${bodyPositivityRate}% -- good levels of engagement with positive body image activities.`,
    );
  }

  if (totalBodyPositivityRecords > 0 && bodyPositivitySatisfactionAvg !== null && bodyPositivitySatisfactionAvg >= 4.0) {
    strengths.push(
      `Children's satisfaction with body positivity work averages ${bodyPositivitySatisfactionAvg}/5 -- children find the sessions helpful and supportive.`,
    );
  }

  if (selfEsteemRate >= 80 && totalBodyPositivityRecords > 0) {
    strengths.push(
      `Self-esteem components included in ${selfEsteemRate}% of body positivity sessions -- the home links body image work to broader self-worth and confidence.`,
    );
  }

  if (mediaLiteracyRate >= 60 && totalBodyPositivityRecords > 0) {
    strengths.push(
      `Media literacy included in ${mediaLiteracyRate}% of body positivity sessions -- children are developing critical thinking about media portrayals of body image.`,
    );
  }

  if (weightStigmaRate >= 60 && totalBodyPositivityRecords > 0) {
    strengths.push(
      `Weight stigma addressed in ${weightStigmaRate}% of sessions -- the home actively challenges weight-based discrimination and promotes acceptance.`,
    );
  }

  if (bodyPositivityOutcomesRate >= 80 && totalBodyPositivityRecords > 0) {
    strengths.push(
      `Outcomes documented in ${bodyPositivityOutcomesRate}% of body positivity sessions -- the home tracks the impact of its body image support work.`,
    );
  }

  if (childEngagementRate >= 80 && engagementDenominator > 0) {
    strengths.push(
      `Overall child engagement rate at ${childEngagementRate}% -- children are actively participating in weight management and healthy eating activities.`,
    );
  } else if (childEngagementRate >= 60 && engagementDenominator > 0) {
    strengths.push(
      `Child engagement rate at ${childEngagementRate}% -- good participation levels across healthy eating and body positivity programmes.`,
    );
  }

  if (routineMonitoringRate >= 70 && totalWeightRecords > 0) {
    strengths.push(
      `${routineMonitoringRate}% of weight measurements are routine -- the home has embedded proactive weight monitoring into regular care rather than only responding to concerns.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (weightConcernRate > 50 && weightActionRate < 50 && totalWeightRecords > 0) {
    concerns.push(
      `${weightConcernRate}% of weight measurements fall outside healthy range yet actions taken in only ${weightActionRate}% of records -- the home is identifying weight concerns but not responding adequately, failing in its duty of health care under Reg 14.`,
    );
  } else if (weightConcernRate > 30 && totalWeightRecords > 0) {
    concerns.push(
      `${weightConcernRate}% of weight measurements outside healthy range -- elevated levels of weight concern require closer monitoring and targeted intervention.`,
    );
  }

  if (weightCoverageRate < 50 && total_children > 0 && totalWeightRecords > 0) {
    concerns.push(
      `Only ${weightCoverageRate}% of children have weight monitoring records -- the majority of children's weight is not being actively tracked, creating blind spots in health oversight.`,
    );
  } else if (weightCoverageRate < 70 && weightCoverageRate >= 50 && total_children > 0 && totalWeightRecords > 0) {
    concerns.push(
      `Weight monitoring coverage at ${weightCoverageRate}% -- not all children are having their weight regularly monitored.`,
    );
  }

  if (weightConsentRate < 50 && totalWeightRecords > 0) {
    concerns.push(
      `Child consent obtained for only ${weightConsentRate}% of weight measurements -- the home is not consistently seeking children's consent for health monitoring, undermining their autonomy and rights.`,
    );
  }

  if (weightFollowUpRate < 50 && weightFollowUpNeeded > 0) {
    concerns.push(
      `Only ${weightFollowUpRate}% of weight monitoring follow-ups completed -- gaps in follow-up mean weight concerns may not be adequately addressed.`,
    );
  }

  if (bmiDecliningRate > 40 && totalBmiRecords > 0) {
    concerns.push(
      `${bmiDecliningRate}% of BMI trends are declining -- a significant proportion of children's nutritional status is deteriorating, requiring urgent clinical review.`,
    );
  } else if (bmiDecliningRate > 20 && bmiDecliningRate <= 40 && totalBmiRecords > 0) {
    concerns.push(
      `${bmiDecliningRate}% of BMI trends declining -- some children's weight trajectories are worsening and need closer attention.`,
    );
  }

  if (totalBmiRecords > 0 && below(bmiTrackingRate, 50)) {
    concerns.push(
      `BMI tracking rate at only ${bmiTrackingRate}% -- growth charts are not being consistently plotted or reviewed, meaning weight trends may be missed.`,
    );
  } else if (totalBmiRecords > 0 && bmiTrackingRate !== null && bmiTrackingRate < 60 && bmiTrackingRate >= 50) {
    concerns.push(
      `BMI tracking rate at ${bmiTrackingRate}% -- growth chart plotting and review need strengthening to ensure systematic BMI monitoring.`,
    );
  }

  if (bmiProfessionalRate < 50 && totalBmiRecords > 0) {
    concerns.push(
      `Health professionals involved in only ${bmiProfessionalRate}% of BMI reviews -- insufficient clinical oversight of children's growth and nutritional status.`,
    );
  }

  if (bmiDiscussionRate < 50 && totalBmiRecords > 0) {
    concerns.push(
      `Age-appropriate BMI discussions held in only ${bmiDiscussionRate}% of cases -- children are not being helped to understand their growth and development.`,
    );
  }

  if (totalHealthyEatingRecords > 0 && below(healthyEatingRate, 40)) {
    concerns.push(
      `Healthy eating programme engagement at only ${healthyEatingRate}% -- children are not attending or engaging with nutrition education, undermining healthy eating promotion.`,
    );
  } else if (totalHealthyEatingRecords > 0 && healthyEatingRate !== null && healthyEatingRate < 70 && healthyEatingRate >= 40) {
    concerns.push(
      `Healthy eating engagement at ${healthyEatingRate}% -- participation in nutrition programmes needs strengthening to ensure all children benefit.`,
    );
  }

  if (totalHealthyEatingRecords > 0 && healthyEatingSatisfactionAvg !== null && healthyEatingSatisfactionAvg < 3.0) {
    concerns.push(
      `Children's satisfaction with healthy eating programmes averages only ${healthyEatingSatisfactionAvg}/5 -- children do not find the nutrition education engaging or enjoyable.`,
    );
  }

  if (healthyChoiceRate < 50 && totalHealthyEatingRecords > 0) {
    concerns.push(
      `Healthy food choices observed in only ${healthyChoiceRate}% of sessions -- nutrition education is not translating into practical behaviour change.`,
    );
  }

  if (totalPortionRecords > 0 && below(portionControlRate, 50)) {
    concerns.push(
      `Portion control awareness at only ${portionControlRate}% -- children do not understand appropriate portions and may not be served age-appropriate meals.`,
    );
  } else if (totalPortionRecords > 0 && portionControlRate !== null && portionControlRate < 70 && portionControlRate >= 50) {
    concerns.push(
      `Portion control awareness at ${portionControlRate}% -- portion understanding and serving practices need improvement.`,
    );
  }

  if (mealsBalancedRate < 70 && totalPortionRecords > 0) {
    concerns.push(
      `Only ${mealsBalancedRate}% of meals assessed as balanced -- children may not be receiving nutritionally adequate meals.`,
    );
  }

  if (overeatingRate > 30 && totalPortionRecords > 0) {
    concerns.push(
      `Overeating concerns identified in ${overeatingRate}% of portion assessments -- the home needs to address overeating patterns with sensitive, supportive intervention.`,
    );
  }

  if (undereatingRate > 30 && totalPortionRecords > 0) {
    concerns.push(
      `Undereating concerns identified in ${undereatingRate}% of portion assessments -- restrictive eating patterns require prompt assessment and support.`,
    );
  }

  if (emotionalEatingRate > 20 && totalPortionRecords > 0) {
    concerns.push(
      `Emotional eating identified in ${emotionalEatingRate}% of assessments -- children may be using food to manage emotions, requiring therapeutic support.`,
    );
  }

  if (hydrationRate < 70 && totalPortionRecords > 0) {
    concerns.push(
      `Adequate hydration reported in only ${hydrationRate}% of assessments -- children may not be drinking enough water and healthy fluids.`,
    );
  }

  if (totalBodyPositivityRecords > 0 && below(bodyPositivityRate, 40)) {
    concerns.push(
      `Body positivity support at only ${bodyPositivityRate}% -- children are not engaging with positive body image work, leaving them vulnerable to weight stigma and low self-esteem.`,
    );
  } else if (totalBodyPositivityRecords > 0 && bodyPositivityRate !== null && bodyPositivityRate < 70 && bodyPositivityRate >= 40) {
    concerns.push(
      `Body positivity support at ${bodyPositivityRate}% -- more children need to be engaged in positive body image activities.`,
    );
  }

  if (bodyPositivityConcernRate > 30 && totalBodyPositivityRecords > 0) {
    concerns.push(
      `Body image concerns identified in ${bodyPositivityConcernRate}% of sessions -- a significant proportion of children are struggling with body image and may need specialist support.`,
    );
  }

  if (totalBodyPositivityRecords > 0 && bodyPositivitySatisfactionAvg !== null && bodyPositivitySatisfactionAvg < 3.0) {
    concerns.push(
      `Children's satisfaction with body positivity work averages only ${bodyPositivitySatisfactionAvg}/5 -- the approach to body image support may not be resonating with children.`,
    );
  }

  if (childEngagementRate < 50 && engagementDenominator > 0) {
    concerns.push(
      `Overall child engagement rate at only ${childEngagementRate}% -- children are not adequately involved in weight management and healthy eating activities.`,
    );
  } else if (childEngagementRate < 60 && childEngagementRate >= 50 && engagementDenominator > 0) {
    concerns.push(
      `Child engagement rate at ${childEngagementRate}% -- engagement with healthy eating and body positivity programmes needs strengthening.`,
    );
  }

  if (totalWeightRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No weight monitoring records despite children being on placement -- the home may not be tracking children's weight as part of routine health care.",
    );
  }

  if (totalBmiRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No BMI tracking records -- children's growth and nutritional status are not being systematically assessed using BMI and growth charts.",
    );
  }

  if (totalBodyPositivityRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No body positivity records -- the home has not documented any work to promote positive body image, self-esteem, or challenge weight stigma among children.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: WeightManagementRecommendation[] = [];
  let rank = 0;

  if (weightConcernRate > 50 && weightActionRate < 50 && totalWeightRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all weight measurements outside healthy range and implement documented action plans for every child with a weight concern -- liaise with GP, dietitian, or paediatrician as clinically indicated and ensure follow-up is completed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (bmiDecliningRate > 40 && totalBmiRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Refer all children with declining BMI trends for urgent clinical review -- deteriorating nutritional status requires immediate assessment by a health professional and a documented care plan to reverse the decline.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalHealthyEatingRecords > 0 && below(healthyEatingRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Redesign the healthy eating programme to improve engagement -- consult children about preferred activities, incorporate practical cooking sessions, food tasting, and garden growing to make nutrition education enjoyable and relevant.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (totalBodyPositivityRecords > 0 && below(bodyPositivityRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen body positivity provision -- implement regular group and individual sessions covering positive body image, media literacy, self-esteem, and weight stigma awareness. Consider external professionals for specialist input.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (weightCoverageRate < 50 && total_children > 0 && totalWeightRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child has routine weight monitoring in line with their health care plan -- integrate weight checks into regular health reviews and document all measurements with appropriate consent.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalBmiRecords > 0 && below(bmiTrackingRate, 50)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement systematic BMI tracking with growth chart plotting for every child -- ensure charts are reviewed by a health professional at each measurement and trends are discussed age-appropriately with the child.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalPortionRecords > 0 && below(portionControlRate, 50)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide portion awareness training for staff and children -- use visual guides, age-appropriate portion tools, and involve children in meal planning and self-serving to build understanding and independence.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (mealsBalancedRate < 70 && totalPortionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review menu planning to ensure all meals are nutritionally balanced -- use the Eatwell Guide as a framework and involve children in meal planning to increase both balance and engagement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (emotionalEatingRate > 20 && totalPortionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop individual support plans for children identified with emotional eating patterns -- consider therapeutic input to address underlying emotional needs and provide alternative coping strategies.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (bodyPositivityConcernRate > 30 && totalBodyPositivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children with identified body image concerns receive appropriate specialist referrals -- liaise with CAMHS, counselling services, or eating disorder services as indicated and document outcomes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (weightConsentRate < 50 && totalWeightRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed consent-seeking in all weight monitoring processes -- explain the purpose of measurement, respect children's right to decline, and record consent or refusal in every instance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (bmiDiscussionRate < 50 && totalBmiRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all BMI reviews include an age-appropriate discussion with the child about their growth -- avoid stigmatising language and frame discussions positively around health and wellbeing rather than weight alone.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (hydrationRate < 70 && totalPortionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Promote adequate hydration across the home -- ensure fresh water is always available, encourage regular fluid intake, and monitor hydration as part of daily wellbeing observations.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalHealthyEatingRecords > 0 && healthyEatingRate !== null && healthyEatingRate >= 40 && healthyEatingRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase healthy eating programme attendance and engagement to at least 70% -- review session timings, content, and delivery methods to make programmes more accessible and appealing to all children.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (totalPortionRecords > 0 && portionControlRate !== null && portionControlRate >= 50 && portionControlRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen portion control awareness through ongoing education, visual portion guides, and regular staff refresher training to ensure consistent, age-appropriate portion provision.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (totalBodyPositivityRecords > 0 && bodyPositivityRate !== null && bodyPositivityRate >= 40 && bodyPositivityRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand body positivity provision -- increase the frequency and variety of sessions, incorporate media literacy and peer support, and ensure body image work is embedded in the home's wellbeing culture.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (weightCoverageRate >= 50 && weightCoverageRate < 70 && total_children > 0 && totalWeightRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase weight monitoring coverage to at least 70% of children -- ensure all children have weight monitoring included in their health care plans with routine measurement schedules.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalWeightRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement routine weight monitoring for every child as part of their health care plan -- record measurements, trends, and actions taken with appropriate child consent.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalBmiRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin systematic BMI calculation and growth chart plotting for every child -- ensure clinical review of growth charts at each health assessment and document age-appropriate discussions with children about their growth.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalBodyPositivityRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a body positivity programme including regular sessions on positive body image, self-esteem, media literacy, and weight stigma awareness -- ensure children's views shape the programme content.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: WeightManagementInsight[] = [];

  // --- Critical insights ---

  if (weightConcernRate > 50 && weightActionRate < 50 && totalWeightRecords > 0) {
    insights.push({
      text: `${weightConcernRate}% of weight measurements outside healthy range with actions taken in only ${weightActionRate}% of records. Ofsted will view the failure to act on identified weight concerns as a serious breach of Reg 14 -- the home is identifying problems but not responding, which is arguably worse than not monitoring at all.`,
      severity: "critical",
    });
  }

  if (bmiDecliningRate > 40 && totalBmiRecords > 0) {
    insights.push({
      text: `${bmiDecliningRate}% of BMI trends are declining. A deteriorating nutritional trajectory for this many children indicates a systemic failure in the home's approach to weight management and healthy eating. Ofsted will expect evidence of urgent clinical intervention and documented care plans.`,
      severity: "critical",
    });
  }

  if (totalHealthyEatingRecords > 0 && below(healthyEatingRate, 40)) {
    insights.push({
      text: `Healthy eating programme engagement at only ${healthyEatingRate}%. Children are not attending or engaging with nutrition education, meaning the home cannot evidence that it promotes healthy eating as required by Reg 14. The programme may need fundamental redesign to engage children meaningfully.`,
      severity: "critical",
    });
  }

  if (totalBodyPositivityRecords > 0 && below(bodyPositivityRate, 40)) {
    insights.push({
      text: `Body positivity support at only ${bodyPositivityRate}%. Without effective body image work, children are vulnerable to weight stigma, disordered eating patterns, and low self-esteem. Ofsted expects homes to promote positive body image as part of holistic health and wellbeing.`,
      severity: "critical",
    });
  }

  if (totalWeightRecords === 0 && totalBmiRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No weight monitoring or BMI tracking records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's nutritional health is not being monitored -- a fundamental failure in the home's health care duty under Reg 14.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (weightConcernRate > 30 && weightConcernRate <= 50 && totalWeightRecords > 0) {
    insights.push({
      text: `${weightConcernRate}% of weight measurements fall outside healthy range -- while not yet critical, elevated concern levels require closer monitoring and proactive intervention to prevent deterioration.`,
      severity: "warning",
    });
  }

  if (bmiDecliningRate > 20 && bmiDecliningRate <= 40 && totalBmiRecords > 0) {
    insights.push({
      text: `${bmiDecliningRate}% of BMI trends are declining -- some children's nutritional trajectories are worsening. Early intervention can prevent these trends from becoming critical.`,
      severity: "warning",
    });
  }

  if (totalHealthyEatingRecords > 0 && healthyEatingRate !== null && healthyEatingRate >= 40 && healthyEatingRate < 70) {
    insights.push({
      text: `Healthy eating engagement at ${healthyEatingRate}% -- while some children participate, overall engagement needs improvement to demonstrate the home's commitment to promoting healthy eating across the whole community.`,
      severity: "warning",
    });
  }

  if (totalPortionRecords > 0 && portionControlRate !== null && portionControlRate >= 50 && portionControlRate < 70) {
    insights.push({
      text: `Portion control awareness at ${portionControlRate}% -- understanding of appropriate portions is developing but not yet embedded. Inconsistent portion knowledge may contribute to unhealthy eating patterns.`,
      severity: "warning",
    });
  }

  if (totalBodyPositivityRecords > 0 && bodyPositivityRate !== null && bodyPositivityRate >= 40 && bodyPositivityRate < 70) {
    insights.push({
      text: `Body positivity support at ${bodyPositivityRate}% -- some children are benefiting from positive body image work but coverage needs expansion to protect all children from weight stigma and self-image difficulties.`,
      severity: "warning",
    });
  }

  if (overeatingRate > 30 && totalPortionRecords > 0) {
    insights.push({
      text: `Overeating concerns in ${overeatingRate}% of portion assessments -- patterns of overeating in looked-after children often relate to early experiences of food insecurity or emotional regulation difficulties and require sensitive, trauma-informed support.`,
      severity: "warning",
    });
  }

  if (undereatingRate > 30 && totalPortionRecords > 0) {
    insights.push({
      text: `Undereating concerns in ${undereatingRate}% of portion assessments -- restrictive eating in looked-after children may indicate anxiety, control issues, or disordered eating patterns that require specialist assessment.`,
      severity: "warning",
    });
  }

  if (emotionalEatingRate > 20 && totalPortionRecords > 0) {
    insights.push({
      text: `Emotional eating identified in ${emotionalEatingRate}% of assessments -- using food to manage emotions is common in children who have experienced trauma and adversity. Therapeutic support should address the underlying emotional needs.`,
      severity: "warning",
    });
  }

  if (childEngagementRate >= 50 && childEngagementRate < 80 && engagementDenominator > 0) {
    insights.push({
      text: `Child engagement rate at ${childEngagementRate}% across healthy eating and body positivity activities -- while participation exists, more children need to be actively engaged to ensure equitable access to health promotion.`,
      severity: "warning",
    });
  }

  if (weightCoverageRate >= 50 && weightCoverageRate < 70 && total_children > 0 && totalWeightRecords > 0) {
    insights.push({
      text: `Weight monitoring covers ${weightCoverageRate}% of children -- gaps in coverage mean some children's weight may not be tracked, creating blind spots in health oversight.`,
      severity: "warning",
    });
  }

  if (mealsBalancedRate >= 70 && mealsBalancedRate < 90 && totalPortionRecords > 0) {
    insights.push({
      text: `${mealsBalancedRate}% of meals assessed as balanced -- while generally good, inconsistency in meal balance means some children may receive nutritionally inadequate meals on occasion.`,
      severity: "warning",
    });
  }

  if (bodyPositivityConcernRate > 30 && totalBodyPositivityRecords > 0) {
    insights.push({
      text: `Body image concerns identified in ${bodyPositivityConcernRate}% of sessions -- a significant minority of children are struggling with how they see their bodies. This requires proactive specialist support and close monitoring.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (weight_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding weight management and healthy eating provision -- children's nutritional health is comprehensively monitored, healthy eating is actively promoted, portions are appropriate, and positive body image is supported. This is strong evidence for Reg 14 compliance and holistic health and wellbeing.",
      severity: "positive",
    });
  }

  if (totalWeightRecords > 0 && totalBmiRecords > 0 && meets(bmiTrackingRate, 80) && weightMonitoringRate >= 90) {
    insights.push({
      text: `${weightMonitoringRate}% healthy weight range with BMI tracking at ${bmiTrackingRate}% -- the home provides comprehensive, systematic weight monitoring with clinical rigour. Ofsted will recognise this as evidence of proactive health care.`,
      severity: "positive",
    });
  }

  if (totalHealthyEatingRecords > 0 && meets(healthyEatingRate, 90) && healthyEatingSatisfactionAvg !== null && healthyEatingSatisfactionAvg >= 4.0) {
    insights.push({
      text: `Healthy eating engagement at ${healthyEatingRate}% with satisfaction averaging ${healthyEatingSatisfactionAvg}/5 -- children are not only attending nutrition programmes but genuinely enjoying and learning from them. This translates knowledge into lasting healthy habits.`,
      severity: "positive",
    });
  }

  if (totalPortionRecords > 0 && meets(portionControlRate, 90) && mealsBalancedRate >= 90) {
    insights.push({
      text: `Portion awareness at ${portionControlRate}% with ${mealsBalancedRate}% balanced meals -- the home delivers consistently nutritious, appropriately portioned meals while building children's understanding of healthy eating. This supports both immediate health and long-term independence.`,
      severity: "positive",
    });
  }

  if (totalBodyPositivityRecords > 0 && meets(bodyPositivityRate, 90) && selfEsteemRate >= 80) {
    insights.push({
      text: `Body positivity at ${bodyPositivityRate}% with self-esteem components in ${selfEsteemRate}% of sessions -- the home goes beyond weight management to nurture children's holistic wellbeing, confidence, and positive self-image. This is exemplary practice.`,
      severity: "positive",
    });
  }

  if (childEngagementRate >= 80 && engagementDenominator > 0) {
    insights.push({
      text: `${childEngagementRate}% child engagement across weight management and healthy eating activities -- children are active participants in their own health, not passive recipients of care. This promotes autonomy, self-regulation, and lifelong healthy habits.`,
      severity: "positive",
    });
  }

  if (healthyChoiceRate >= 80 && dietaryKnowledgeRate >= 80 && totalHealthyEatingRecords > 0) {
    insights.push({
      text: `Healthy choices observed in ${healthyChoiceRate}% of sessions with dietary knowledge improving in ${dietaryKnowledgeRate}% -- nutrition education is successfully translating into practical behaviour change, demonstrating genuine impact on children's eating habits.`,
      severity: "positive",
    });
  }

  if (hydrationRate >= 90 && snackAppropriateRate >= 90 && totalPortionRecords > 0) {
    insights.push({
      text: `Hydration adequate in ${hydrationRate}% and snack provision appropriate in ${snackAppropriateRate}% of assessments -- the home's attention to hydration and healthy snacking complements its meal provision for comprehensive nutritional care.`,
      severity: "positive",
    });
  }

  if (weightConsentRate >= 90 && weightChildInformedRate >= 90 && totalWeightRecords > 0) {
    insights.push({
      text: `Consent obtained in ${weightConsentRate}% and children informed in ${weightChildInformedRate}% of weight measurements -- the home respects children's autonomy and rights in health monitoring while maintaining comprehensive oversight.`,
      severity: "positive",
    });
  }

  if (mediaLiteracyRate >= 60 && weightStigmaRate >= 60 && totalBodyPositivityRecords > 0) {
    insights.push({
      text: `Media literacy in ${mediaLiteracyRate}% and weight stigma addressed in ${weightStigmaRate}% of body positivity sessions -- the home equips children with critical thinking about media portrayals and actively challenges weight-based discrimination.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (weight_rating === "outstanding") {
    headline =
      "Outstanding weight management and healthy eating provision -- children's nutritional health is comprehensively monitored and healthy lifestyles actively promoted.";
  } else if (weight_rating === "good") {
    headline = `Good weight management and healthy eating provision -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (weight_rating === "adequate") {
    headline = `Adequate weight management and healthy eating provision -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's nutritional health and wellbeing are fully supported.`;
  } else {
    headline = `Weight management and healthy eating provision is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's nutritional health is monitored and healthy lifestyles promoted.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    weight_rating,
    weight_score: score,
    headline,
    weight_monitoring_rate: weightMonitoringRate,
    bmi_tracking_rate: bmiTrackingRate,
    healthy_eating_rate: healthyEatingRate,
    portion_control_rate: portionControlRate,
    body_positivity_rate: bodyPositivityRate,
    child_engagement_rate: childEngagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

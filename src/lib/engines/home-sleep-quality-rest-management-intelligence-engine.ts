// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SLEEP QUALITY & REST MANAGEMENT INTELLIGENCE ENGINE
// Monitors how well the home supports children's sleep routines, environment
// quality, disturbance management, bedtime support, and sleep improvement.
// Measures sleep routine adherence, sleep environment quality, sleep
// disturbance tracking, bedtime support quality, and sleep improvement plans.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 6 (Quality of care standard), Reg 12 (Health and wellbeing).
// SCCIF: "Children's health and well-being are promoted".
// Store keys: sleepRoutineRecords, sleepEnvironmentRecords,
//             sleepDisturbanceRecords, bedtimeSupportRecords,
//             sleepImprovementRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SleepRoutineRecordInput {
  id: string;
  child_id: string;
  date: string;
  planned_bedtime: string;
  actual_bedtime: string | null;
  planned_wake_time: string;
  actual_wake_time: string | null;
  wind_down_activity_completed: boolean;
  routine_followed: boolean;
  routine_deviation_reason: string | null;
  staff_member: string;
  child_settled_within_30_min: boolean;
  sleep_quality_rating: number; // 1-5
  notes: string | null;
  created_at: string;
}

export interface SleepEnvironmentRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  room_temperature_ok: boolean;
  lighting_appropriate: boolean;
  noise_level_acceptable: boolean;
  bedding_clean_adequate: boolean;
  room_personalised: boolean;
  electronic_devices_managed: boolean;
  ventilation_adequate: boolean;
  overall_environment_score: number; // 1-5
  issues_identified: string[];
  issues_resolved: boolean;
  resolution_date: string | null;
  assessed_by: string;
  created_at: string;
}

export interface SleepDisturbanceRecordInput {
  id: string;
  child_id: string;
  date: string;
  time_of_disturbance: string;
  disturbance_type: "nightmare" | "night_terror" | "sleepwalking" | "noise" | "anxiety" | "medical" | "peer" | "other";
  duration_minutes: number;
  staff_response_time_minutes: number | null;
  intervention_type: string;
  child_resettled: boolean;
  resettled_time_minutes: number | null;
  follow_up_actions: string | null;
  follow_up_completed: boolean;
  impact_on_next_day: "none" | "mild" | "moderate" | "severe";
  staff_member: string;
  created_at: string;
}

export interface BedtimeSupportRecordInput {
  id: string;
  child_id: string;
  date: string;
  support_type: "reading" | "conversation" | "relaxation" | "sensory" | "medication_prompt" | "emotional_check_in" | "other";
  support_provided: boolean;
  duration_minutes: number;
  child_engaged: boolean;
  child_feedback_positive: boolean;
  staff_member: string;
  consistency_with_plan: boolean;
  notes: string | null;
  created_at: string;
}

export interface SleepImprovementRecordInput {
  id: string;
  child_id: string;
  plan_created_date: string;
  plan_type: "individual_sleep_plan" | "melatonin_review" | "sleep_hygiene" | "environmental_adjustment" | "therapeutic_referral" | "routine_restructure" | "other";
  target_outcome: string;
  review_date: string | null;
  reviewed: boolean;
  progress_rating: number; // 1-5
  child_involved_in_planning: boolean;
  professional_input_received: boolean;
  plan_active: boolean;
  outcomes_documented: boolean;
  created_at: string;
}

export interface SleepQualityRestManagementInput {
  today: string;
  total_children: number;
  sleep_routine_records: SleepRoutineRecordInput[];
  sleep_environment_records: SleepEnvironmentRecordInput[];
  sleep_disturbance_records: SleepDisturbanceRecordInput[];
  bedtime_support_records: BedtimeSupportRecordInput[];
  sleep_improvement_records: SleepImprovementRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SleepQualityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SleepQualityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SleepQualityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SleepQualityRestManagementResult {
  sleep_rating: SleepQualityRating;
  sleep_score: number;
  headline: string;
  total_routine_records: number;
  total_disturbances: number;
  routine_adherence_rate: number;
  environment_quality_rate: number;
  disturbance_resolution_rate: number;
  bedtime_support_quality_rate: number;
  improvement_plan_coverage_rate: number;
  child_satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: SleepQualityRecommendation[];
  insights: SleepQualityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SleepQualityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: SleepQualityRating,
  score: number,
  headline: string,
): SleepQualityRestManagementResult {
  return {
    sleep_rating: rating,
    sleep_score: score,
    headline,
    total_routine_records: 0,
    total_disturbances: 0,
    routine_adherence_rate: 0,
    environment_quality_rate: 0,
    disturbance_resolution_rate: 0,
    bedtime_support_quality_rate: 0,
    improvement_plan_coverage_rate: 0,
    child_satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeSleepQualityRestManagement(
  input: SleepQualityRestManagementInput,
): SleepQualityRestManagementResult {
  const {
    total_children,
    sleep_routine_records,
    sleep_environment_records,
    sleep_disturbance_records,
    bedtime_support_records,
    sleep_improvement_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    sleep_routine_records.length === 0 &&
    sleep_environment_records.length === 0 &&
    sleep_disturbance_records.length === 0 &&
    bedtime_support_records.length === 0 &&
    sleep_improvement_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess sleep quality and rest management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No sleep or rest management data recorded despite children on placement — sleep quality monitoring requires urgent attention.",
      ),
      concerns: [
        "No sleep routine records, environment assessments, disturbance tracking, bedtime support records, or improvement plans exist despite children being on placement — the home cannot evidence adequate sleep quality management or rest support.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of sleep routines, environment assessments, disturbance tracking, bedtime support, and improvement plans to evidence the home's management of children's sleep and rest needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has a documented sleep routine that is followed consistently, with regular environment assessments and individualised bedtime support plans in place.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 — Health and wellbeing",
        },
      ],
      insights: [
        {
          text: "The complete absence of sleep and rest management records means Ofsted cannot verify that children's sleep needs are being met, environments are appropriate, or disturbances are managed. This represents a fundamental gap in Reg 6 and Reg 12 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Sleep routine metrics ---
  const totalRoutineRecords = sleep_routine_records.length;

  const routineFollowed = sleep_routine_records.filter((r) => r.routine_followed).length;
  const routineAdherenceRate = pct(routineFollowed, totalRoutineRecords);

  const settledWithin30 = sleep_routine_records.filter((r) => r.child_settled_within_30_min).length;
  const settlingRate = pct(settledWithin30, totalRoutineRecords);

  const windDownCompleted = sleep_routine_records.filter((r) => r.wind_down_activity_completed).length;
  const windDownRate = pct(windDownCompleted, totalRoutineRecords);

  const sleepQualitySum = sleep_routine_records.reduce((sum, r) => sum + r.sleep_quality_rating, 0);
  const avgSleepQualityRating =
    totalRoutineRecords > 0
      ? Math.round((sleepQualitySum / totalRoutineRecords) * 100) / 100
      : 0;

  // --- Environment metrics ---
  const totalEnvironmentRecords = sleep_environment_records.length;

  const environmentChecks = [
    (e: SleepEnvironmentRecordInput) => e.room_temperature_ok,
    (e: SleepEnvironmentRecordInput) => e.lighting_appropriate,
    (e: SleepEnvironmentRecordInput) => e.noise_level_acceptable,
    (e: SleepEnvironmentRecordInput) => e.bedding_clean_adequate,
    (e: SleepEnvironmentRecordInput) => e.room_personalised,
    (e: SleepEnvironmentRecordInput) => e.electronic_devices_managed,
    (e: SleepEnvironmentRecordInput) => e.ventilation_adequate,
  ];
  const totalEnvChecksPossible = totalEnvironmentRecords * environmentChecks.length;
  let totalEnvChecksPassed = 0;
  for (const rec of sleep_environment_records) {
    for (const check of environmentChecks) {
      if (check(rec)) totalEnvChecksPassed++;
    }
  }
  const environmentQualityRate = pct(totalEnvChecksPassed, totalEnvChecksPossible);

  const envIssuesIdentified = sleep_environment_records.filter(
    (e) => e.issues_identified.length > 0,
  ).length;
  const envIssuesResolved = sleep_environment_records.filter(
    (e) => e.issues_identified.length > 0 && e.issues_resolved,
  ).length;
  const envIssueResolutionRate = pct(envIssuesResolved, envIssuesIdentified);

  const envScoreSum = sleep_environment_records.reduce(
    (sum, e) => sum + e.overall_environment_score,
    0,
  );
  const avgEnvironmentScore =
    totalEnvironmentRecords > 0
      ? Math.round((envScoreSum / totalEnvironmentRecords) * 100) / 100
      : 0;

  // --- Disturbance metrics ---
  const totalDisturbances = sleep_disturbance_records.length;

  const disturbancesResettled = sleep_disturbance_records.filter((d) => d.child_resettled).length;
  const disturbanceResolutionRate = pct(disturbancesResettled, totalDisturbances);

  const followUpRequired = sleep_disturbance_records.filter(
    (d) => d.follow_up_actions !== null && d.follow_up_actions !== "",
  ).length;
  const followUpCompleted = sleep_disturbance_records.filter(
    (d) => d.follow_up_actions !== null && d.follow_up_actions !== "" && d.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpRequired);

  const rapidResponse = sleep_disturbance_records.filter(
    (d) => d.staff_response_time_minutes !== null && d.staff_response_time_minutes <= 5,
  ).length;
  const rapidResponseRate = pct(rapidResponse, totalDisturbances);

  const severeImpactDisturbances = sleep_disturbance_records.filter(
    (d) => d.impact_on_next_day === "severe" || d.impact_on_next_day === "moderate",
  ).length;
  const highImpactRate = pct(severeImpactDisturbances, totalDisturbances);

  // --- Bedtime support metrics ---
  const totalBedtimeSupport = bedtime_support_records.length;

  const supportProvided = bedtime_support_records.filter((b) => b.support_provided).length;
  const supportProvidedRate = pct(supportProvided, totalBedtimeSupport);

  const childEngaged = bedtime_support_records.filter((b) => b.child_engaged).length;
  const childEngagementRate = pct(childEngaged, totalBedtimeSupport);

  const childFeedbackPositive = bedtime_support_records.filter((b) => b.child_feedback_positive).length;
  const childSatisfactionRate = pct(childFeedbackPositive, totalBedtimeSupport);

  const consistentWithPlan = bedtime_support_records.filter((b) => b.consistency_with_plan).length;
  const planConsistencyRate = pct(consistentWithPlan, totalBedtimeSupport);

  // Bedtime support quality is composite: provided + engaged + positive + consistent
  const bedtimeSupportQualityNumerator = supportProvided + childEngaged + childFeedbackPositive + consistentWithPlan;
  const bedtimeSupportQualityDenominator = totalBedtimeSupport * 4;
  const bedtimeSupportQualityRate = pct(bedtimeSupportQualityNumerator, bedtimeSupportQualityDenominator);

  // --- Improvement plan metrics ---
  const totalImprovementPlans = sleep_improvement_records.length;

  const activePlans = sleep_improvement_records.filter((p) => p.plan_active).length;

  const uniqueChildrenWithPlans = new Set(
    sleep_improvement_records.filter((p) => p.plan_active).map((p) => p.child_id),
  ).size;
  const improvementPlanCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithPlans, total_children) : 0;

  const reviewedPlans = sleep_improvement_records.filter((p) => p.reviewed).length;
  const planReviewRate = pct(reviewedPlans, totalImprovementPlans);

  const childInvolvedInPlanning = sleep_improvement_records.filter(
    (p) => p.child_involved_in_planning,
  ).length;
  const childInvolvementRate = pct(childInvolvedInPlanning, totalImprovementPlans);

  const professionalInputReceived = sleep_improvement_records.filter(
    (p) => p.professional_input_received,
  ).length;
  const professionalInputRate = pct(professionalInputReceived, totalImprovementPlans);

  const progressSum = sleep_improvement_records.reduce((sum, p) => sum + p.progress_rating, 0);
  const avgProgressRating =
    totalImprovementPlans > 0
      ? Math.round((progressSum / totalImprovementPlans) * 100) / 100
      : 0;

  const outcomesDocumented = sleep_improvement_records.filter((p) => p.outcomes_documented).length;
  const outcomesDocumentedRate = pct(outcomesDocumented, totalImprovementPlans);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: routineAdherenceRate (>=90: +4, >=70: +2) ---
  if (routineAdherenceRate >= 90) score += 4;
  else if (routineAdherenceRate >= 70) score += 2;

  // --- Bonus 2: environmentQualityRate (>=90: +3, >=70: +1) ---
  if (environmentQualityRate >= 90) score += 3;
  else if (environmentQualityRate >= 70) score += 1;

  // --- Bonus 3: disturbanceResolutionRate (>=90: +4, >=70: +2) ---
  if (disturbanceResolutionRate >= 90) score += 4;
  else if (disturbanceResolutionRate >= 70) score += 2;

  // --- Bonus 4: bedtimeSupportQualityRate (>=85: +3, >=65: +1) ---
  if (bedtimeSupportQualityRate >= 85) score += 3;
  else if (bedtimeSupportQualityRate >= 65) score += 1;

  // --- Bonus 5: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (childSatisfactionRate >= 90) score += 3;
  else if (childSatisfactionRate >= 70) score += 1;

  // --- Bonus 6: improvementPlanCoverageRate (>=80: +3, >=50: +1) ---
  if (improvementPlanCoverageRate >= 80) score += 3;
  else if (improvementPlanCoverageRate >= 50) score += 1;

  // --- Bonus 7: followUpCompletionRate (>=90: +3, >=70: +1) ---
  if (followUpCompletionRate >= 90) score += 3;
  else if (followUpCompletionRate >= 70) score += 1;

  // --- Bonus 8: settlingRate (>=90: +2, >=70: +1) ---
  if (settlingRate >= 90) score += 2;
  else if (settlingRate >= 70) score += 1;

  // --- Bonus 9: planReviewRate (>=90: +3, >=70: +1) ---
  if (planReviewRate >= 90) score += 3;
  else if (planReviewRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // routineAdherenceRate < 50 → -5
  if (routineAdherenceRate < 50 && totalRoutineRecords > 0) score -= 5;

  // disturbanceResolutionRate < 50 → -5
  if (disturbanceResolutionRate < 50 && totalDisturbances > 0) score -= 5;

  // bedtimeSupportQualityRate < 40 → -5
  if (bedtimeSupportQualityRate < 40 && totalBedtimeSupport > 0) score -= 5;

  // highImpactRate > 50 → -3
  if (highImpactRate > 50 && totalDisturbances > 0) score -= 3;

  score = clamp(score, 0, 100);

  const sleep_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (routineAdherenceRate >= 90 && totalRoutineRecords > 0) {
    strengths.push(
      `${routineAdherenceRate}% sleep routine adherence — children's bedtime routines are followed consistently, promoting stability and predictability in their rest patterns.`,
    );
  } else if (routineAdherenceRate >= 70 && totalRoutineRecords > 0) {
    strengths.push(
      `${routineAdherenceRate}% sleep routine adherence — the home generally maintains consistent bedtime routines for children.`,
    );
  }

  if (environmentQualityRate >= 90 && totalEnvironmentRecords > 0) {
    strengths.push(
      `${environmentQualityRate}% sleep environment quality — bedrooms consistently meet high standards for temperature, lighting, noise, bedding, and personalisation.`,
    );
  } else if (environmentQualityRate >= 70 && totalEnvironmentRecords > 0) {
    strengths.push(
      `${environmentQualityRate}% sleep environment quality — the majority of environment checks are met across children's bedrooms.`,
    );
  }

  if (disturbanceResolutionRate >= 90 && totalDisturbances > 0) {
    strengths.push(
      `${disturbanceResolutionRate}% disturbance resolution rate — staff effectively resettle children after sleep disturbances, demonstrating skilled night care.`,
    );
  } else if (disturbanceResolutionRate >= 70 && totalDisturbances > 0) {
    strengths.push(
      `${disturbanceResolutionRate}% of sleep disturbances resolved with child resettled — generally effective disturbance management.`,
    );
  }

  if (bedtimeSupportQualityRate >= 85 && totalBedtimeSupport > 0) {
    strengths.push(
      `${bedtimeSupportQualityRate}% bedtime support quality — staff consistently provide high-quality, child-centred bedtime support aligned with individual plans.`,
    );
  } else if (bedtimeSupportQualityRate >= 65 && totalBedtimeSupport > 0) {
    strengths.push(
      `${bedtimeSupportQualityRate}% bedtime support quality — the home provides generally effective bedtime support to children.`,
    );
  }

  if (childSatisfactionRate >= 90 && totalBedtimeSupport > 0) {
    strengths.push(
      `${childSatisfactionRate}% positive child feedback on bedtime support — children feel well supported at bedtime, reflecting sensitive and responsive staff practice.`,
    );
  } else if (childSatisfactionRate >= 70 && totalBedtimeSupport > 0) {
    strengths.push(
      `${childSatisfactionRate}% positive child feedback — most children report positive experiences with bedtime support.`,
    );
  }

  if (settlingRate >= 90 && totalRoutineRecords > 0) {
    strengths.push(
      `${settlingRate}% of children settle within 30 minutes — effective wind-down routines and bedtime support promote timely settling.`,
    );
  } else if (settlingRate >= 70 && totalRoutineRecords > 0) {
    strengths.push(
      `${settlingRate}% of children settle within 30 minutes — the home's approach to settling is effective for the majority of children.`,
    );
  }

  if (followUpCompletionRate >= 90 && followUpRequired > 0) {
    strengths.push(
      `${followUpCompletionRate}% of disturbance follow-up actions completed — staff consistently follow through on actions identified after sleep disturbances.`,
    );
  } else if (followUpCompletionRate >= 70 && followUpRequired > 0) {
    strengths.push(
      `${followUpCompletionRate}% of follow-up actions completed — the home generally follows through on disturbance-related actions.`,
    );
  }

  if (rapidResponseRate >= 90 && totalDisturbances > 0) {
    strengths.push(
      `${rapidResponseRate}% of disturbances responded to within 5 minutes — staff respond rapidly to children's sleep disturbances, providing timely reassurance and support.`,
    );
  } else if (rapidResponseRate >= 70 && totalDisturbances > 0) {
    strengths.push(
      `${rapidResponseRate}% of disturbances responded to within 5 minutes — generally prompt response to sleep disturbances.`,
    );
  }

  if (planReviewRate >= 90 && totalImprovementPlans > 0) {
    strengths.push(
      `${planReviewRate}% of sleep improvement plans reviewed — the home actively monitors the effectiveness of sleep interventions and adapts approaches accordingly.`,
    );
  } else if (planReviewRate >= 70 && totalImprovementPlans > 0) {
    strengths.push(
      `${planReviewRate}% of improvement plans reviewed — the home generally reviews the effectiveness of sleep interventions.`,
    );
  }

  if (childInvolvementRate >= 90 && totalImprovementPlans > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in sleep improvement planning — children are actively consulted about their sleep needs and preferences.`,
    );
  } else if (childInvolvementRate >= 70 && totalImprovementPlans > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in planning — most children are consulted about their sleep improvement plans.`,
    );
  }

  if (windDownRate >= 90 && totalRoutineRecords > 0) {
    strengths.push(
      `${windDownRate}% wind-down activity completion — the home consistently provides calming pre-bedtime activities to support children's transition to sleep.`,
    );
  }

  if (envIssueResolutionRate >= 90 && envIssuesIdentified > 0) {
    strengths.push(
      `${envIssueResolutionRate}% of environment issues resolved — identified problems with sleep environments are addressed promptly, ensuring children have appropriate rest conditions.`,
    );
  }

  if (avgSleepQualityRating >= 4.0 && totalRoutineRecords > 0) {
    strengths.push(
      `Average sleep quality rating of ${avgSleepQualityRating}/5 — children are consistently achieving good-quality sleep, reflecting effective rest management across the home.`,
    );
  } else if (avgSleepQualityRating >= 3.5 && totalRoutineRecords > 0) {
    strengths.push(
      `Average sleep quality rating of ${avgSleepQualityRating}/5 — children generally experience reasonable quality sleep.`,
    );
  }

  if (professionalInputRate >= 80 && totalImprovementPlans > 0) {
    strengths.push(
      `${professionalInputRate}% of sleep improvement plans include professional input — the home engages health professionals and specialists to support children's sleep needs.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (routineAdherenceRate < 50 && totalRoutineRecords > 0) {
    concerns.push(
      `Only ${routineAdherenceRate}% sleep routine adherence — the majority of children's bedtime routines are not being followed, undermining stability and potentially impacting children's health and wellbeing.`,
    );
  } else if (routineAdherenceRate < 70 && routineAdherenceRate >= 50 && totalRoutineRecords > 0) {
    concerns.push(
      `Sleep routine adherence at ${routineAdherenceRate}% — inconsistent bedtime routines may leave children feeling unsettled and affect their rest quality.`,
    );
  }

  if (environmentQualityRate < 50 && totalEnvironmentRecords > 0) {
    concerns.push(
      `Only ${environmentQualityRate}% sleep environment quality — a significant proportion of environment standards are not being met, which directly affects children's ability to achieve restful sleep.`,
    );
  } else if (environmentQualityRate < 70 && environmentQualityRate >= 50 && totalEnvironmentRecords > 0) {
    concerns.push(
      `Sleep environment quality at ${environmentQualityRate}% — some environment standards are not consistently met across children's bedrooms.`,
    );
  }

  if (disturbanceResolutionRate < 50 && totalDisturbances > 0) {
    concerns.push(
      `Only ${disturbanceResolutionRate}% disturbance resolution — the majority of children are not being successfully resettled after sleep disturbances, indicating staff require additional training or support in night care practices.`,
    );
  } else if (disturbanceResolutionRate < 70 && disturbanceResolutionRate >= 50 && totalDisturbances > 0) {
    concerns.push(
      `Disturbance resolution rate at ${disturbanceResolutionRate}% — some children are not being successfully resettled after sleep disturbances.`,
    );
  }

  if (bedtimeSupportQualityRate < 40 && totalBedtimeSupport > 0) {
    concerns.push(
      `Bedtime support quality at only ${bedtimeSupportQualityRate}% — bedtime support is inconsistent, children are not engaging, and support is not aligned with individual plans. This undermines the home's ability to promote healthy sleep.`,
    );
  } else if (bedtimeSupportQualityRate < 65 && bedtimeSupportQualityRate >= 40 && totalBedtimeSupport > 0) {
    concerns.push(
      `Bedtime support quality at ${bedtimeSupportQualityRate}% — staff need to improve the consistency, engagement, and child-centredness of bedtime support.`,
    );
  }

  if (childSatisfactionRate < 50 && totalBedtimeSupport > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% positive child feedback on bedtime support — children are not satisfied with the support they receive at bedtime, which may indicate a lack of sensitivity to individual needs.`,
    );
  } else if (childSatisfactionRate < 70 && childSatisfactionRate >= 50 && totalBedtimeSupport > 0) {
    concerns.push(
      `Child satisfaction with bedtime support at ${childSatisfactionRate}% — a significant proportion of children are not reporting positive experiences at bedtime.`,
    );
  }

  if (highImpactRate > 50 && totalDisturbances > 0) {
    concerns.push(
      `${highImpactRate}% of sleep disturbances have moderate or severe next-day impact — persistent poor sleep is affecting children's daytime functioning, behaviour, and wellbeing.`,
    );
  } else if (highImpactRate > 30 && highImpactRate <= 50 && totalDisturbances > 0) {
    concerns.push(
      `${highImpactRate}% of disturbances have moderate or severe next-day impact — some children's daytime functioning is being affected by disrupted sleep.`,
    );
  }

  if (settlingRate < 50 && totalRoutineRecords > 0) {
    concerns.push(
      `Only ${settlingRate}% of children settle within 30 minutes — many children are experiencing difficulty getting to sleep, suggesting wind-down routines or bedtime support need review.`,
    );
  } else if (settlingRate < 70 && settlingRate >= 50 && totalRoutineRecords > 0) {
    concerns.push(
      `Settling rate at ${settlingRate}% — some children are taking longer than 30 minutes to settle, indicating potential issues with routines or environment.`,
    );
  }

  if (followUpCompletionRate < 50 && followUpRequired > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of disturbance follow-up actions completed — identified actions to prevent recurrence of sleep problems are not being followed through.`,
    );
  } else if (followUpCompletionRate < 70 && followUpCompletionRate >= 50 && followUpRequired > 0) {
    concerns.push(
      `Follow-up completion rate at ${followUpCompletionRate}% — some post-disturbance actions are not being followed through.`,
    );
  }

  if (planReviewRate < 50 && totalImprovementPlans > 0) {
    concerns.push(
      `Only ${planReviewRate}% of sleep improvement plans reviewed — plans exist but are not being monitored, meaning the home cannot evidence whether interventions are working.`,
    );
  } else if (planReviewRate < 70 && planReviewRate >= 50 && totalImprovementPlans > 0) {
    concerns.push(
      `Plan review rate at ${planReviewRate}% — not all sleep improvement plans are being reviewed regularly to assess progress.`,
    );
  }

  if (childInvolvementRate < 50 && totalImprovementPlans > 0) {
    concerns.push(
      `Only ${childInvolvementRate}% child involvement in sleep improvement planning — children's views and preferences about their sleep are not being sought, undermining the voice of the child.`,
    );
  }

  if (envIssueResolutionRate < 50 && envIssuesIdentified > 0) {
    concerns.push(
      `Only ${envIssueResolutionRate}% of identified environment issues resolved — problems with children's sleep environments persist without remediation.`,
    );
  }

  if (avgSleepQualityRating < 2.5 && totalRoutineRecords > 0) {
    concerns.push(
      `Average sleep quality rating at only ${avgSleepQualityRating}/5 — children are consistently experiencing poor-quality sleep, which has implications for their health, behaviour, and development.`,
    );
  } else if (avgSleepQualityRating < 3.0 && avgSleepQualityRating >= 2.5 && totalRoutineRecords > 0) {
    concerns.push(
      `Average sleep quality rating at ${avgSleepQualityRating}/5 — sleep quality across the home is below acceptable standards and requires targeted intervention.`,
    );
  }

  if (totalRoutineRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No sleep routine records exist despite children being on placement — the home cannot evidence that bedtime routines are in place or followed consistently.",
    );
  }

  if (totalEnvironmentRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No sleep environment assessments recorded — the home cannot evidence that children's bedrooms meet appropriate standards for restful sleep.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: SleepQualityRecommendation[] = [];
  let rank = 0;

  if (routineAdherenceRate < 50 && totalRoutineRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and reinstate consistent bedtime routines for all children — establish clear, individualised routines with staff accountability for adherence. Children need predictable bedtime patterns for stability and rest.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
    });
  }

  if (disturbanceResolutionRate < 50 && totalDisturbances > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide urgent training for staff on managing sleep disturbances — children who are not successfully resettled experience compounding effects on their health and wellbeing. Review night care staffing levels and skills.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Health and wellbeing",
    });
  }

  if (bedtimeSupportQualityRate < 40 && totalBedtimeSupport > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul bedtime support practices — ensure every child's individual needs are understood and met through personalised, engaging, and consistent support at bedtime. Review individual sleep plans with children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
    });
  }

  if (highImpactRate > 50 && totalDisturbances > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a multi-disciplinary review of persistent sleep disruption — when more than half of disturbances have moderate or severe next-day impact, specialist assessment and intervention are required to protect children's health.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Health and wellbeing",
    });
  }

  if (environmentQualityRate < 50 && totalEnvironmentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct immediate environment assessments for all children's bedrooms — address temperature, lighting, noise, bedding, and personalisation issues that are preventing restful sleep.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
    });
  }

  if (childSatisfactionRate < 50 && totalBedtimeSupport > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult children individually about their bedtime experiences and preferences — low satisfaction indicates bedtime support is not meeting children's needs and must be redesigned with their input.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (totalRoutineRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate recording of sleep routines for every child on placement — without routine records, the home cannot evidence that children's sleep needs are being managed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
    });
  }

  if (totalEnvironmentRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence regular sleep environment assessments for all children's bedrooms — document room conditions, personalisation, and any issues requiring resolution.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
    });
  }

  if (followUpCompletionRate < 50 && followUpRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a follow-up action tracker for sleep disturbances — ensure all identified actions are completed and documented to prevent recurrence and evidence continuous improvement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Health and wellbeing",
    });
  }

  if (planReviewRate < 50 && totalImprovementPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a schedule for reviewing all sleep improvement plans — unreviewed plans cannot be evidenced as effective and may drift from children's current needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Health and wellbeing",
    });
  }

  if (childInvolvementRate < 50 && totalImprovementPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children in their sleep improvement planning — ask children about their sleep experiences, preferences, and what helps or hinders their rest to create genuinely child-centred plans.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    routineAdherenceRate >= 50 &&
    routineAdherenceRate < 70 &&
    totalRoutineRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve sleep routine adherence to at least 70% — review barriers to consistent routines and provide staff with guidance on maintaining structure while allowing age-appropriate flexibility.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
    });
  }

  if (
    disturbanceResolutionRate >= 50 &&
    disturbanceResolutionRate < 70 &&
    totalDisturbances > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance disturbance management training to improve the resettling rate above 70% — consider individual strategies for children who experience frequent disturbances.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Health and wellbeing",
    });
  }

  if (
    environmentQualityRate >= 50 &&
    environmentQualityRate < 70 &&
    totalEnvironmentRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve sleep environment standards — address specific areas where rooms are falling short and involve children in personalising their sleep spaces.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
    });
  }

  if (
    bedtimeSupportQualityRate >= 40 &&
    bedtimeSupportQualityRate < 65 &&
    totalBedtimeSupport > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance bedtime support quality through staff training and supervision — focus on engagement, consistency with care plans, and responsiveness to children's individual needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
    });
  }

  if (
    childSatisfactionRate >= 50 &&
    childSatisfactionRate < 70 &&
    totalBedtimeSupport > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Seek regular child feedback on bedtime experiences and adapt support accordingly — aim to increase positive feedback above 70% by responding to children's preferences.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (windDownRate < 70 && totalRoutineRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure wind-down activities are consistently provided before bedtime — calming pre-sleep activities help children transition to rest and improve settling times.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care standard",
    });
  }

  if (
    improvementPlanCoverageRate < 50 &&
    total_children > 0 &&
    totalImprovementPlans > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend sleep improvement plan coverage to all children who would benefit — assess each child's sleep needs and create individualised plans where sleep quality is below expected standards.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Health and wellbeing",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: SleepQualityInsight[] = [];

  // -- Critical insights --

  if (routineAdherenceRate < 50 && totalRoutineRecords > 0) {
    insights.push({
      text: `Only ${routineAdherenceRate}% sleep routine adherence. Ofsted expects children in residential care to have consistent, predictable routines. Poor routine adherence directly undermines children's sense of security, their physical health, and their ability to engage with education and activities.`,
      severity: "critical",
    });
  }

  if (disturbanceResolutionRate < 50 && totalDisturbances > 0) {
    insights.push({
      text: `Only ${disturbanceResolutionRate}% disturbance resolution. When children are not resettled after sleep disturbances, the cumulative impact on their emotional wellbeing, behaviour, and development can be profound. Staff require training in therapeutic night care approaches.`,
      severity: "critical",
    });
  }

  if (bedtimeSupportQualityRate < 40 && totalBedtimeSupport > 0) {
    insights.push({
      text: `Bedtime support quality at only ${bedtimeSupportQualityRate}%. Bedtime is a critical therapeutic moment — children in care often experience heightened anxiety, fear, or emotional dysregulation at night. Poor-quality bedtime support represents a missed opportunity to build attachment and provide emotional containment.`,
      severity: "critical",
    });
  }

  if (highImpactRate > 50 && totalDisturbances > 0) {
    insights.push({
      text: `${highImpactRate}% of disturbances have moderate or severe next-day impact. Chronic sleep deprivation in looked-after children is associated with increased behavioural incidents, reduced educational engagement, and poorer mental health outcomes. This requires specialist intervention.`,
      severity: "critical",
    });
  }

  if (environmentQualityRate < 50 && totalEnvironmentRecords > 0) {
    insights.push({
      text: `Only ${environmentQualityRate}% sleep environment quality. A child's bedroom is their personal space — when it fails to meet basic standards for temperature, lighting, noise, and comfort, it signals that the home is not prioritising children's fundamental need for restful sleep.`,
      severity: "critical",
    });
  }

  if (totalRoutineRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No sleep routine records exist despite children being on placement. Without routine tracking, the home cannot evidence that children have consistent bedtime patterns or that sleep is being managed proactively. This is a fundamental gap in care quality evidence.",
      severity: "critical",
    });
  }

  if (totalEnvironmentRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No sleep environment assessments recorded. Ofsted expects children's living and sleeping spaces to be assessed for appropriateness. The absence of any assessment records means the home cannot demonstrate that bedrooms are fit for purpose.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    routineAdherenceRate >= 50 &&
    routineAdherenceRate < 70 &&
    totalRoutineRecords > 0
  ) {
    insights.push({
      text: `Sleep routine adherence at ${routineAdherenceRate}% — improving but inconsistent. Some children are not benefiting from the predictable bedtime structures that promote healthy sleep. Review whether staffing patterns, activities, or individual needs are creating barriers.`,
      severity: "warning",
    });
  }

  if (
    environmentQualityRate >= 50 &&
    environmentQualityRate < 70 &&
    totalEnvironmentRecords > 0
  ) {
    insights.push({
      text: `Sleep environment quality at ${environmentQualityRate}% — some bedrooms are not consistently meeting all standards. Environmental factors like temperature, noise, and lighting have a significant evidence-based impact on sleep quality.`,
      severity: "warning",
    });
  }

  if (
    disturbanceResolutionRate >= 50 &&
    disturbanceResolutionRate < 70 &&
    totalDisturbances > 0
  ) {
    insights.push({
      text: `Disturbance resolution rate at ${disturbanceResolutionRate}% — some children are not being successfully resettled. Consider whether individual disturbance profiles require tailored approaches or specialist support.`,
      severity: "warning",
    });
  }

  if (
    childSatisfactionRate >= 50 &&
    childSatisfactionRate < 70 &&
    totalBedtimeSupport > 0
  ) {
    insights.push({
      text: `Child satisfaction with bedtime support at ${childSatisfactionRate}% — a notable proportion of children do not feel positively about their bedtime experience. Bedtime should feel safe and supportive, not stressful or impersonal.`,
      severity: "warning",
    });
  }

  if (
    settlingRate >= 50 &&
    settlingRate < 70 &&
    totalRoutineRecords > 0
  ) {
    insights.push({
      text: `Settling rate at ${settlingRate}% — some children are taking extended periods to fall asleep. Consider whether anxiety, overstimulation, or environmental factors are contributing to delayed settling.`,
      severity: "warning",
    });
  }

  if (
    followUpCompletionRate >= 50 &&
    followUpCompletionRate < 70 &&
    followUpRequired > 0
  ) {
    insights.push({
      text: `Follow-up completion rate at ${followUpCompletionRate}% — some post-disturbance actions are not being completed, which means lessons from sleep disruptions are not consistently driving improvement.`,
      severity: "warning",
    });
  }

  if (
    planReviewRate >= 50 &&
    planReviewRate < 70 &&
    totalImprovementPlans > 0
  ) {
    insights.push({
      text: `Plan review rate at ${planReviewRate}% — not all sleep improvement plans are being regularly reviewed. Without consistent review, the home cannot evidence that interventions are effective or adapt approaches when needed.`,
      severity: "warning",
    });
  }

  if (
    avgSleepQualityRating >= 2.5 &&
    avgSleepQualityRating < 3.5 &&
    totalRoutineRecords > 0
  ) {
    insights.push({
      text: `Average sleep quality rating at ${avgSleepQualityRating}/5 — sleep quality is mediocre across the home. This suggests systemic factors may be affecting children's rest rather than isolated individual issues.`,
      severity: "warning",
    });
  }

  if (windDownRate < 70 && windDownRate > 0 && totalRoutineRecords > 0) {
    insights.push({
      text: `Wind-down activity completion at only ${windDownRate}% — calming pre-bedtime activities are not being consistently delivered. Research shows structured wind-down routines significantly improve sleep onset and quality in children.`,
      severity: "warning",
    });
  }

  // Disturbance type analysis
  const disturbanceTypes: Record<string, number> = {};
  for (const d of sleep_disturbance_records) {
    disturbanceTypes[d.disturbance_type] = (disturbanceTypes[d.disturbance_type] ?? 0) + 1;
  }
  const topDisturbances = Object.entries(disturbanceTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topDisturbances.length > 0) {
    const formatted = topDisturbances
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common disturbance types: ${formatted}. Understanding disturbance patterns enables targeted interventions — recurring types may indicate unmet therapeutic needs, environmental issues, or peer dynamic problems.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (sleep_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding sleep quality and rest management — children's routines are followed consistently, environments are well maintained, disturbances are managed effectively, and bedtime support is child-centred and high quality. This is strong evidence for Reg 6 and Reg 12 compliance.",
      severity: "positive",
    });
  }

  if (
    routineAdherenceRate >= 90 &&
    settlingRate >= 90 &&
    totalRoutineRecords > 0
  ) {
    insights.push({
      text: `${routineAdherenceRate}% routine adherence with ${settlingRate}% settling within 30 minutes — the combination of consistent routines and effective settling demonstrates that the home has established a calm, predictable bedtime culture that promotes healthy sleep.`,
      severity: "positive",
    });
  }

  if (
    disturbanceResolutionRate >= 90 &&
    rapidResponseRate >= 90 &&
    totalDisturbances > 0
  ) {
    insights.push({
      text: `${disturbanceResolutionRate}% disturbance resolution with ${rapidResponseRate}% rapid response — staff demonstrate skilled, prompt night care that effectively reassures and resettles children, minimising the impact of sleep disruption.`,
      severity: "positive",
    });
  }

  if (
    environmentQualityRate >= 90 &&
    totalEnvironmentRecords > 0
  ) {
    insights.push({
      text: `${environmentQualityRate}% environment quality — children's bedrooms consistently meet high standards across all assessed domains. A well-maintained sleep environment is foundational to promoting restful, restorative sleep.`,
      severity: "positive",
    });
  }

  if (
    bedtimeSupportQualityRate >= 85 &&
    childSatisfactionRate >= 90 &&
    totalBedtimeSupport > 0
  ) {
    insights.push({
      text: `${bedtimeSupportQualityRate}% bedtime support quality with ${childSatisfactionRate}% positive child feedback — the home provides excellent, child-centred bedtime support that children genuinely value. This reflects sensitive, attuned staff practice at a critical time of day.`,
      severity: "positive",
    });
  }

  if (
    childSatisfactionRate >= 90 &&
    totalBedtimeSupport > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% positive child feedback on bedtime support — children feel cared for, secure, and supported at bedtime. This builds trust and contributes to children's emotional wellbeing and sense of belonging.`,
      severity: "positive",
    });
  }

  if (
    planReviewRate >= 90 &&
    avgProgressRating >= 4.0 &&
    totalImprovementPlans > 0
  ) {
    insights.push({
      text: `${planReviewRate}% plan review rate with average progress of ${avgProgressRating}/5 — sleep improvement plans are actively monitored and achieving positive outcomes. The home uses evidence-based approaches to continuously improve children's sleep quality.`,
      severity: "positive",
    });
  }

  if (
    childInvolvementRate >= 90 &&
    totalImprovementPlans > 0
  ) {
    insights.push({
      text: `${childInvolvementRate}% child involvement in sleep improvement planning — children's voices shape their own sleep plans, ensuring interventions are personalised and meaningful. Ofsted views this as evidence of genuinely child-centred practice.`,
      severity: "positive",
    });
  }

  if (
    followUpCompletionRate >= 90 &&
    followUpRequired > 0
  ) {
    insights.push({
      text: `${followUpCompletionRate}% of disturbance follow-up actions completed — the home consistently learns from sleep disruptions and implements changes. This demonstrates a proactive, improvement-oriented approach to night care.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (sleep_rating === "outstanding") {
    headline =
      "Outstanding sleep quality and rest management — children's routines are consistent, environments are well maintained, and bedtime support is child-centred and effective.";
  } else if (sleep_rating === "good") {
    headline = `Good sleep quality and rest management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (sleep_rating === "adequate") {
    headline = `Adequate sleep quality and rest management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children achieve consistent, restful sleep.`;
  } else {
    headline = `Sleep quality and rest management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's sleep needs are met.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    sleep_rating,
    sleep_score: score,
    headline,
    total_routine_records: totalRoutineRecords,
    total_disturbances: totalDisturbances,
    routine_adherence_rate: routineAdherenceRate,
    environment_quality_rate: environmentQualityRate,
    disturbance_resolution_rate: disturbanceResolutionRate,
    bedtime_support_quality_rate: bedtimeSupportQualityRate,
    improvement_plan_coverage_rate: improvementPlanCoverageRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

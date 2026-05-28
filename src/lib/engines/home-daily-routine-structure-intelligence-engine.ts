// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DAILY ROUTINE & STRUCTURE INTELLIGENCE ENGINE
// Tracks daily routine quality — routine consistency, activity scheduling,
// meal time regularity, bedtime routine adherence, and child participation
// in daily planning. Critical for Ofsted under Children's Homes Regulations
// 2015 (Reg 5 quality of care, Reg 6 quality and purpose of care standard,
// Reg 7 children's views, SCCIF experiences and progress).
// HOME-LEVEL engine.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Store keys: routineScheduleRecords, activityPlanRecords,
//             mealRoutineRecords, bedtimeRoutineRecords,
//             childParticipationRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RoutineScheduleRecordInput {
  id: string;
  date: string;
  child_id: string;
  routine_type: "morning" | "afternoon" | "evening" | "full_day";
  scheduled_start_time: string;
  actual_start_time: string | null;
  scheduled_end_time: string;
  actual_end_time: string | null;
  routine_followed: boolean;
  deviation_reason: string | null;
  flexibility_shown: boolean;
  child_informed_of_plan: boolean;
  staff_member: string;
  consistency_rating: number; // 1-5
  notes: string | null;
  created_at: string;
}

export interface ActivityPlanRecordInput {
  id: string;
  date: string;
  child_id: string;
  activity_type: "educational" | "recreational" | "therapeutic" | "social" | "life_skills" | "creative" | "physical" | "other";
  activity_name: string;
  planned: boolean;
  completed: boolean;
  child_enjoyed: boolean;
  child_chose_activity: boolean;
  duration_minutes: number;
  staff_member: string;
  outcome_notes: string | null;
  created_at: string;
}

export interface MealRoutineRecordInput {
  id: string;
  date: string;
  child_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  scheduled_time: string;
  actual_time: string | null;
  meal_on_time: boolean;
  child_present: boolean;
  child_involved_in_preparation: boolean;
  dietary_needs_met: boolean;
  healthy_options_provided: boolean;
  social_dining_environment: boolean;
  child_feedback_positive: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface BedtimeRoutineRecordInput {
  id: string;
  date: string;
  child_id: string;
  planned_bedtime: string;
  actual_bedtime: string | null;
  bedtime_routine_followed: boolean;
  wind_down_activity_provided: boolean;
  child_settled_within_30_min: boolean;
  age_appropriate_bedtime: boolean;
  consistent_with_previous_nights: boolean;
  deviation_reason: string | null;
  child_feedback: string | null;
  staff_member: string;
  created_at: string;
}

export interface ChildParticipationRecordInput {
  id: string;
  date: string;
  child_id: string;
  participation_type: "daily_planning" | "menu_choice" | "activity_choice" | "routine_review" | "house_meeting" | "feedback_session" | "other";
  child_consulted: boolean;
  child_views_recorded: boolean;
  views_actioned: boolean;
  child_satisfied_with_outcome: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface DailyRoutineInput {
  today: string;
  total_children: number;
  routine_schedule_records: RoutineScheduleRecordInput[];
  activity_plan_records: ActivityPlanRecordInput[];
  meal_routine_records: MealRoutineRecordInput[];
  bedtime_routine_records: BedtimeRoutineRecordInput[];
  child_participation_records: ChildParticipationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DailyRoutineRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DailyRoutineInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DailyRoutineRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface DailyRoutineResult {
  routine_rating: DailyRoutineRating;
  routine_score: number;
  headline: string;
  total_routine_records: number;
  total_activity_records: number;
  total_meal_records: number;
  total_bedtime_records: number;
  total_participation_records: number;
  routine_consistency_rate: number;
  activity_completion_rate: number;
  meal_regularity_rate: number;
  bedtime_adherence_rate: number;
  child_participation_rate: number;
  flexibility_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: DailyRoutineRecommendation[];
  insights: DailyRoutineInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): DailyRoutineRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: DailyRoutineRating,
  score: number,
  headline: string,
): DailyRoutineResult {
  return {
    routine_rating: rating,
    routine_score: score,
    headline,
    total_routine_records: 0,
    total_activity_records: 0,
    total_meal_records: 0,
    total_bedtime_records: 0,
    total_participation_records: 0,
    routine_consistency_rate: 0,
    activity_completion_rate: 0,
    meal_regularity_rate: 0,
    bedtime_adherence_rate: 0,
    child_participation_rate: 0,
    flexibility_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeDailyRoutineStructure(
  input: DailyRoutineInput,
): DailyRoutineResult {
  const {
    total_children,
    routine_schedule_records,
    activity_plan_records,
    meal_routine_records,
    bedtime_routine_records,
    child_participation_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    routine_schedule_records.length === 0 &&
    activity_plan_records.length === 0 &&
    meal_routine_records.length === 0 &&
    bedtime_routine_records.length === 0 &&
    child_participation_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess daily routine and structure.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No daily routine or structure data recorded despite children on placement — routine management requires urgent attention.",
      ),
      concerns: [
        "No routine schedule records, activity plans, meal routine records, bedtime routine records, or child participation records exist despite children being on placement — the home cannot evidence adequate daily routine management or structured care.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of daily routines, activity plans, meal times, bedtime routines, and child participation to evidence the home's management of children's daily structure and experiences.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has a documented daily routine that is followed consistently, with regular activity planning, predictable meal times, and opportunities for children to participate in planning their day.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
      ],
      insights: [
        {
          text: "The complete absence of daily routine and structure records means Ofsted cannot verify that children experience predictable, well-structured days with meaningful activities, regular meals, and consistent bedtimes. This represents a fundamental gap in Reg 5 and Reg 6 compliance and undermines SCCIF evidence of children's experiences and progress.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Routine schedule metrics ---
  const totalRoutineRecords = routine_schedule_records.length;

  const routineFollowed = routine_schedule_records.filter((r) => r.routine_followed).length;
  const routineConsistencyRate = pct(routineFollowed, totalRoutineRecords);

  const flexibilityShown = routine_schedule_records.filter((r) => r.flexibility_shown).length;
  const flexibilityRate = pct(flexibilityShown, totalRoutineRecords);

  const childInformedOfPlan = routine_schedule_records.filter((r) => r.child_informed_of_plan).length;
  const childInformedRate = pct(childInformedOfPlan, totalRoutineRecords);

  const consistencySum = routine_schedule_records.reduce((sum, r) => sum + r.consistency_rating, 0);
  const avgConsistencyRating =
    totalRoutineRecords > 0
      ? Math.round((consistencySum / totalRoutineRecords) * 100) / 100
      : 0;

  const routinesOnTime = routine_schedule_records.filter(
    (r) => r.actual_start_time !== null && r.actual_start_time !== "",
  ).length;
  const routineTimeliness = pct(routinesOnTime, totalRoutineRecords);

  // --- Activity plan metrics ---
  const totalActivityRecords = activity_plan_records.length;

  const activitiesCompleted = activity_plan_records.filter((a) => a.completed).length;
  const activityCompletionRate = pct(activitiesCompleted, totalActivityRecords);

  const activitiesPlanned = activity_plan_records.filter((a) => a.planned).length;
  const activityPlanningRate = pct(activitiesPlanned, totalActivityRecords);

  const childEnjoyedActivity = activity_plan_records.filter((a) => a.child_enjoyed).length;
  const activityEnjoymentRate = pct(childEnjoyedActivity, totalActivityRecords);

  const childChoseActivity = activity_plan_records.filter((a) => a.child_chose_activity).length;
  const activityChoiceRate = pct(childChoseActivity, totalActivityRecords);

  // Activity variety: count unique activity types
  const activityTypes = new Set(activity_plan_records.map((a) => a.activity_type));
  const activityVarietyCount = activityTypes.size;
  // We consider 5+ types out of 8 as good variety
  const activityVarietyRate = pct(activityVarietyCount, 8);

  // --- Meal routine metrics ---
  const totalMealRecords = meal_routine_records.length;

  const mealsOnTime = meal_routine_records.filter((m) => m.meal_on_time).length;
  const mealRegularityRate = pct(mealsOnTime, totalMealRecords);

  const childPresentAtMeal = meal_routine_records.filter((m) => m.child_present).length;
  const mealAttendanceRate = pct(childPresentAtMeal, totalMealRecords);

  const childInvolvedInPrep = meal_routine_records.filter((m) => m.child_involved_in_preparation).length;
  const mealInvolvementRate = pct(childInvolvedInPrep, totalMealRecords);

  const dietaryNeedsMet = meal_routine_records.filter((m) => m.dietary_needs_met).length;
  const dietaryComplianceRate = pct(dietaryNeedsMet, totalMealRecords);

  const healthyOptions = meal_routine_records.filter((m) => m.healthy_options_provided).length;
  const healthyOptionsRate = pct(healthyOptions, totalMealRecords);

  const socialDining = meal_routine_records.filter((m) => m.social_dining_environment).length;
  const socialDiningRate = pct(socialDining, totalMealRecords);

  const mealFeedbackPositive = meal_routine_records.filter((m) => m.child_feedback_positive).length;
  const mealSatisfactionRate = pct(mealFeedbackPositive, totalMealRecords);

  // --- Bedtime routine metrics ---
  const totalBedtimeRecords = bedtime_routine_records.length;

  const bedtimeFollowed = bedtime_routine_records.filter((b) => b.bedtime_routine_followed).length;
  const bedtimeAdherenceRate = pct(bedtimeFollowed, totalBedtimeRecords);

  const windDownProvided = bedtime_routine_records.filter((b) => b.wind_down_activity_provided).length;
  const windDownRate = pct(windDownProvided, totalBedtimeRecords);

  const settledWithin30 = bedtime_routine_records.filter((b) => b.child_settled_within_30_min).length;
  const settlingRate = pct(settledWithin30, totalBedtimeRecords);

  const ageAppropriateBedtime = bedtime_routine_records.filter((b) => b.age_appropriate_bedtime).length;
  const ageAppropriateBedtimeRate = pct(ageAppropriateBedtime, totalBedtimeRecords);

  const consistentWithPrevious = bedtime_routine_records.filter((b) => b.consistent_with_previous_nights).length;
  const bedtimeConsistencyRate = pct(consistentWithPrevious, totalBedtimeRecords);

  // --- Child participation metrics ---
  const totalParticipationRecords = child_participation_records.length;

  const childConsulted = child_participation_records.filter((p) => p.child_consulted).length;
  const consultationRate = pct(childConsulted, totalParticipationRecords);

  const viewsRecorded = child_participation_records.filter((p) => p.child_views_recorded).length;
  const viewsRecordedRate = pct(viewsRecorded, totalParticipationRecords);

  const viewsActioned = child_participation_records.filter((p) => p.views_actioned).length;
  const viewsActionedRate = pct(viewsActioned, totalParticipationRecords);

  const childSatisfiedOutcome = child_participation_records.filter((p) => p.child_satisfied_with_outcome).length;
  const participationSatisfactionRate = pct(childSatisfiedOutcome, totalParticipationRecords);

  // Composite child participation rate: consulted + views recorded + actioned + satisfied
  const participationNumerator = childConsulted + viewsRecorded + viewsActioned + childSatisfiedOutcome;
  const participationDenominator = totalParticipationRecords * 4;
  const childParticipationRate = pct(participationNumerator, participationDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: routineConsistencyRate (>=90: +4, >=70: +2) ---
  if (routineConsistencyRate >= 90) score += 4;
  else if (routineConsistencyRate >= 70) score += 2;

  // --- Bonus 2: activityCompletionRate (>=90: +3, >=70: +1) ---
  if (activityCompletionRate >= 90) score += 3;
  else if (activityCompletionRate >= 70) score += 1;

  // --- Bonus 3: mealRegularityRate (>=90: +4, >=70: +2) ---
  if (mealRegularityRate >= 90) score += 4;
  else if (mealRegularityRate >= 70) score += 2;

  // --- Bonus 4: bedtimeAdherenceRate (>=90: +3, >=70: +1) ---
  if (bedtimeAdherenceRate >= 90) score += 3;
  else if (bedtimeAdherenceRate >= 70) score += 1;

  // --- Bonus 5: childParticipationRate (>=85: +3, >=65: +1) ---
  if (childParticipationRate >= 85) score += 3;
  else if (childParticipationRate >= 65) score += 1;

  // --- Bonus 6: flexibilityRate (>=80: +3, >=50: +1) ---
  if (flexibilityRate >= 80) score += 3;
  else if (flexibilityRate >= 50) score += 1;

  // --- Bonus 7: activityEnjoymentRate (>=90: +3, >=70: +1) ---
  if (activityEnjoymentRate >= 90) score += 3;
  else if (activityEnjoymentRate >= 70) score += 1;

  // --- Bonus 8: settlingRate (>=90: +2, >=70: +1) ---
  if (settlingRate >= 90) score += 2;
  else if (settlingRate >= 70) score += 1;

  // --- Bonus 9: mealSatisfactionRate (>=90: +3, >=70: +1) ---
  if (mealSatisfactionRate >= 90) score += 3;
  else if (mealSatisfactionRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // routineConsistencyRate < 50 → -5
  if (routineConsistencyRate < 50 && totalRoutineRecords > 0) score -= 5;

  // mealRegularityRate < 50 → -5
  if (mealRegularityRate < 50 && totalMealRecords > 0) score -= 5;

  // bedtimeAdherenceRate < 50 → -5
  if (bedtimeAdherenceRate < 50 && totalBedtimeRecords > 0) score -= 5;

  // childParticipationRate < 40 → -3
  if (childParticipationRate < 40 && totalParticipationRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const routine_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (routineConsistencyRate >= 90 && totalRoutineRecords > 0) {
    strengths.push(
      `${routineConsistencyRate}% routine consistency — daily routines are followed consistently, providing children with the stability and predictability they need to feel secure and settled.`,
    );
  } else if (routineConsistencyRate >= 70 && totalRoutineRecords > 0) {
    strengths.push(
      `${routineConsistencyRate}% routine consistency — the home generally maintains consistent daily routines for children.`,
    );
  }

  if (activityCompletionRate >= 90 && totalActivityRecords > 0) {
    strengths.push(
      `${activityCompletionRate}% activity completion — planned activities are consistently delivered, ensuring children benefit from a rich programme of meaningful experiences.`,
    );
  } else if (activityCompletionRate >= 70 && totalActivityRecords > 0) {
    strengths.push(
      `${activityCompletionRate}% activity completion — the majority of planned activities are completed, giving children regular access to stimulating experiences.`,
    );
  }

  if (mealRegularityRate >= 90 && totalMealRecords > 0) {
    strengths.push(
      `${mealRegularityRate}% meal time regularity — meals are served on time consistently, providing children with the predictable structure that promotes wellbeing and healthy eating habits.`,
    );
  } else if (mealRegularityRate >= 70 && totalMealRecords > 0) {
    strengths.push(
      `${mealRegularityRate}% meal time regularity — the home generally serves meals on schedule, supporting children's routine expectations.`,
    );
  }

  if (bedtimeAdherenceRate >= 90 && totalBedtimeRecords > 0) {
    strengths.push(
      `${bedtimeAdherenceRate}% bedtime routine adherence — bedtime routines are followed consistently, promoting healthy sleep patterns and emotional security at a critical time of day.`,
    );
  } else if (bedtimeAdherenceRate >= 70 && totalBedtimeRecords > 0) {
    strengths.push(
      `${bedtimeAdherenceRate}% bedtime routine adherence — the home generally follows established bedtime routines for children.`,
    );
  }

  if (childParticipationRate >= 85 && totalParticipationRecords > 0) {
    strengths.push(
      `${childParticipationRate}% child participation quality — children are actively consulted about their daily plans, their views are recorded and actioned, and they are satisfied with outcomes. This demonstrates genuinely child-centred practice.`,
    );
  } else if (childParticipationRate >= 65 && totalParticipationRecords > 0) {
    strengths.push(
      `${childParticipationRate}% child participation quality — children are generally involved in planning their daily experiences and routines.`,
    );
  }

  if (flexibilityRate >= 80 && totalRoutineRecords > 0) {
    strengths.push(
      `${flexibilityRate}% flexibility demonstrated — staff appropriately adapt routines to individual children's needs and circumstances, balancing structure with responsiveness.`,
    );
  } else if (flexibilityRate >= 50 && totalRoutineRecords > 0) {
    strengths.push(
      `${flexibilityRate}% flexibility demonstrated — staff show some ability to adapt routines to children's individual needs.`,
    );
  }

  if (activityEnjoymentRate >= 90 && totalActivityRecords > 0) {
    strengths.push(
      `${activityEnjoymentRate}% activity enjoyment — children consistently enjoy the activities provided, indicating that the programme is engaging, age-appropriate, and responsive to children's interests.`,
    );
  } else if (activityEnjoymentRate >= 70 && totalActivityRecords > 0) {
    strengths.push(
      `${activityEnjoymentRate}% activity enjoyment — the majority of children enjoy the activities offered by the home.`,
    );
  }

  if (activityChoiceRate >= 80 && totalActivityRecords > 0) {
    strengths.push(
      `${activityChoiceRate}% child-chosen activities — children have genuine influence over their activity choices, reflecting a commitment to promoting autonomy and personal interests.`,
    );
  } else if (activityChoiceRate >= 60 && totalActivityRecords > 0) {
    strengths.push(
      `${activityChoiceRate}% child-chosen activities — children are given some opportunity to choose their own activities.`,
    );
  }

  if (settlingRate >= 90 && totalBedtimeRecords > 0) {
    strengths.push(
      `${settlingRate}% of children settle within 30 minutes — effective bedtime routines support timely settling, indicating children feel safe and relaxed at bedtime.`,
    );
  } else if (settlingRate >= 70 && totalBedtimeRecords > 0) {
    strengths.push(
      `${settlingRate}% of children settle within 30 minutes — the home's bedtime approach is effective for the majority of children.`,
    );
  }

  if (mealSatisfactionRate >= 90 && totalMealRecords > 0) {
    strengths.push(
      `${mealSatisfactionRate}% positive meal feedback — children are satisfied with their meal experiences, reflecting thoughtful menu planning, quality food, and positive dining environments.`,
    );
  } else if (mealSatisfactionRate >= 70 && totalMealRecords > 0) {
    strengths.push(
      `${mealSatisfactionRate}% positive meal feedback — the majority of children report positive meal experiences.`,
    );
  }

  if (dietaryComplianceRate >= 90 && totalMealRecords > 0) {
    strengths.push(
      `${dietaryComplianceRate}% dietary needs compliance — the home consistently meets children's individual dietary requirements, demonstrating person-centred nutrition management.`,
    );
  }

  if (healthyOptionsRate >= 90 && totalMealRecords > 0) {
    strengths.push(
      `${healthyOptionsRate}% healthy options provided — the home consistently offers nutritious meal options, promoting children's physical health and wellbeing.`,
    );
  }

  if (socialDiningRate >= 90 && totalMealRecords > 0) {
    strengths.push(
      `${socialDiningRate}% social dining environments — meal times are consistently used as opportunities for positive social interaction, building relationships, and developing social skills.`,
    );
  }

  if (windDownRate >= 90 && totalBedtimeRecords > 0) {
    strengths.push(
      `${windDownRate}% wind-down activities provided — the home consistently provides calming pre-bedtime activities to support children's transition to sleep.`,
    );
  }

  if (ageAppropriateBedtimeRate >= 90 && totalBedtimeRecords > 0) {
    strengths.push(
      `${ageAppropriateBedtimeRate}% age-appropriate bedtimes — bedtimes are consistently set according to children's developmental needs, ensuring adequate rest.`,
    );
  }

  if (childInformedRate >= 90 && totalRoutineRecords > 0) {
    strengths.push(
      `${childInformedRate}% of children informed of daily plans — children are consistently told about the day's schedule in advance, reducing anxiety and promoting a sense of control.`,
    );
  }

  if (viewsActionedRate >= 90 && totalParticipationRecords > 0) {
    strengths.push(
      `${viewsActionedRate}% of children's views actioned — when children share their preferences, the home consistently acts on them, demonstrating genuine respect for the voice of the child.`,
    );
  }

  if (avgConsistencyRating >= 4.0 && totalRoutineRecords > 0) {
    strengths.push(
      `Average consistency rating of ${avgConsistencyRating}/5 — staff rate daily routine consistency highly, reflecting embedded good practice across the home.`,
    );
  }

  if (activityVarietyCount >= 6 && totalActivityRecords > 0) {
    strengths.push(
      `${activityVarietyCount} different activity types offered — children benefit from a diverse programme spanning educational, recreational, therapeutic, social, life skills, creative, and physical activities.`,
    );
  }

  if (mealInvolvementRate >= 70 && totalMealRecords > 0) {
    strengths.push(
      `${mealInvolvementRate}% child involvement in meal preparation — children are regularly involved in cooking and food preparation, building independence and life skills.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (routineConsistencyRate < 50 && totalRoutineRecords > 0) {
    concerns.push(
      `Only ${routineConsistencyRate}% routine consistency — the majority of daily routines are not being followed, undermining children's sense of stability, predictability, and security. Children in care particularly need consistent structure.`,
    );
  } else if (routineConsistencyRate < 70 && routineConsistencyRate >= 50 && totalRoutineRecords > 0) {
    concerns.push(
      `Routine consistency at ${routineConsistencyRate}% — inconsistent daily routines may leave children feeling unsettled and anxious about what to expect.`,
    );
  }

  if (activityCompletionRate < 50 && totalActivityRecords > 0) {
    concerns.push(
      `Only ${activityCompletionRate}% activity completion — the majority of planned activities are not being delivered, meaning children are missing out on enriching experiences that support their development and wellbeing.`,
    );
  } else if (activityCompletionRate < 70 && activityCompletionRate >= 50 && totalActivityRecords > 0) {
    concerns.push(
      `Activity completion at ${activityCompletionRate}% — a significant proportion of planned activities are not being completed, reducing children's access to stimulating experiences.`,
    );
  }

  if (mealRegularityRate < 50 && totalMealRecords > 0) {
    concerns.push(
      `Only ${mealRegularityRate}% meal time regularity — the majority of meals are not served on time, disrupting children's daily structure and potentially affecting their nutrition, behaviour, and sense of routine.`,
    );
  } else if (mealRegularityRate < 70 && mealRegularityRate >= 50 && totalMealRecords > 0) {
    concerns.push(
      `Meal time regularity at ${mealRegularityRate}% — inconsistent meal times undermine the predictable daily structure that children need.`,
    );
  }

  if (bedtimeAdherenceRate < 50 && totalBedtimeRecords > 0) {
    concerns.push(
      `Only ${bedtimeAdherenceRate}% bedtime routine adherence — the majority of bedtime routines are not being followed, directly impacting children's sleep quality, health, and next-day functioning.`,
    );
  } else if (bedtimeAdherenceRate < 70 && bedtimeAdherenceRate >= 50 && totalBedtimeRecords > 0) {
    concerns.push(
      `Bedtime routine adherence at ${bedtimeAdherenceRate}% — inconsistent bedtime routines may affect children's sleep quality and emotional regulation.`,
    );
  }

  if (childParticipationRate < 40 && totalParticipationRecords > 0) {
    concerns.push(
      `Child participation quality at only ${childParticipationRate}% — children are not being meaningfully consulted about their daily plans, their views are not being recorded or actioned, and satisfaction with outcomes is low. This undermines the voice of the child.`,
    );
  } else if (childParticipationRate < 65 && childParticipationRate >= 40 && totalParticipationRecords > 0) {
    concerns.push(
      `Child participation quality at ${childParticipationRate}% — children's involvement in daily planning needs to improve to ensure their views genuinely shape their experiences.`,
    );
  }

  if (activityEnjoymentRate < 50 && totalActivityRecords > 0) {
    concerns.push(
      `Only ${activityEnjoymentRate}% activity enjoyment — the majority of children are not enjoying the activities provided, suggesting the programme does not align with children's interests, needs, or developmental stage.`,
    );
  } else if (activityEnjoymentRate < 70 && activityEnjoymentRate >= 50 && totalActivityRecords > 0) {
    concerns.push(
      `Activity enjoyment at ${activityEnjoymentRate}% — a significant proportion of children are not enjoying activities, indicating a need to review the programme with children's input.`,
    );
  }

  if (settlingRate < 50 && totalBedtimeRecords > 0) {
    concerns.push(
      `Only ${settlingRate}% of children settle within 30 minutes — many children are experiencing difficulty getting to sleep, suggesting bedtime routines, wind-down activities, or the sleep environment need review.`,
    );
  } else if (settlingRate < 70 && settlingRate >= 50 && totalBedtimeRecords > 0) {
    concerns.push(
      `Settling rate at ${settlingRate}% — some children are taking longer than 30 minutes to settle, indicating potential issues with bedtime routines.`,
    );
  }

  if (mealSatisfactionRate < 50 && totalMealRecords > 0) {
    concerns.push(
      `Only ${mealSatisfactionRate}% positive meal feedback — children are not satisfied with their meal experiences, which may indicate issues with food quality, choice, environment, or responsiveness to preferences.`,
    );
  } else if (mealSatisfactionRate < 70 && mealSatisfactionRate >= 50 && totalMealRecords > 0) {
    concerns.push(
      `Meal satisfaction at ${mealSatisfactionRate}% — a significant proportion of children are not reporting positive meal experiences.`,
    );
  }

  if (dietaryComplianceRate < 70 && totalMealRecords > 0) {
    concerns.push(
      `Dietary needs compliance at only ${dietaryComplianceRate}% — children's individual dietary requirements are not being consistently met, which poses a risk to their health and wellbeing.`,
    );
  }

  if (activityChoiceRate < 40 && totalActivityRecords > 0) {
    concerns.push(
      `Only ${activityChoiceRate}% child-chosen activities — children have limited influence over their activity choices, undermining their autonomy and sense of agency.`,
    );
  }

  if (flexibilityRate < 30 && totalRoutineRecords > 0) {
    concerns.push(
      `Flexibility rate at only ${flexibilityRate}% — routines are being applied rigidly without adapting to individual children's needs and circumstances. Good practice requires a balance between structure and flexibility.`,
    );
  }

  if (viewsActionedRate < 50 && totalParticipationRecords > 0) {
    concerns.push(
      `Only ${viewsActionedRate}% of children's views actioned — children are being consulted but their views are not leading to change, which risks tokenistic participation and erodes children's trust in the process.`,
    );
  }

  if (childInformedRate < 50 && totalRoutineRecords > 0) {
    concerns.push(
      `Only ${childInformedRate}% of children informed of daily plans — children are not being told about the day ahead, which can increase anxiety and undermine their sense of control.`,
    );
  }

  if (windDownRate < 50 && totalBedtimeRecords > 0) {
    concerns.push(
      `Only ${windDownRate}% wind-down activities provided — calming pre-bedtime activities are not being consistently offered, which affects children's ability to transition to sleep.`,
    );
  }

  if (totalRoutineRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No routine schedule records exist despite children being on placement — the home cannot evidence that daily routines are in place or followed consistently.",
    );
  }

  if (totalMealRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No meal routine records exist despite children being on placement — the home cannot evidence that meals are served regularly or that dietary needs are being met.",
    );
  }

  if (totalBedtimeRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No bedtime routine records exist despite children being on placement — the home cannot evidence consistent bedtime routines or adherence to age-appropriate bedtimes.",
    );
  }

  if (totalParticipationRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child participation records exist despite children being on placement — the home cannot evidence that children are consulted about their daily plans or that their views influence their routines.",
    );
  }

  if (totalActivityRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No activity plan records exist despite children being on placement — the home cannot evidence a structured programme of activities that promotes children's development and enjoyment.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: DailyRoutineRecommendation[] = [];
  let rank = 0;

  if (routineConsistencyRate < 50 && totalRoutineRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and reinstate consistent daily routines for all children — establish clear, individualised routine structures with staff accountability for adherence. Children in care need predictable daily patterns for stability and emotional security.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
    });
  }

  if (mealRegularityRate < 50 && totalMealRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address meal time irregularity urgently — establish fixed meal times that are consistently adhered to, ensuring children experience the predictable routine and adequate nutrition they need. Review kitchen staffing and meal planning processes.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (bedtimeAdherenceRate < 50 && totalBedtimeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently reinstate consistent bedtime routines — ensure every child has a documented, age-appropriate bedtime routine that is followed each night. Inconsistent bedtimes directly impact children's health, behaviour, and educational engagement.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
    });
  }

  if (childParticipationRate < 40 && totalParticipationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul child participation in daily planning — ensure every child is meaningfully consulted about their routine, activities, and meals. Record their views, action them where possible, and explain decisions. Children must feel they have genuine influence over their daily lives.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (activityCompletionRate < 50 && totalActivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review why planned activities are not being completed — identify barriers (staffing, resources, transport, motivation) and ensure children receive the enriching experiences documented in their plans. Incomplete activity programmes fail to support children's development.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (activityEnjoymentRate < 50 && totalActivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Redesign the activity programme with children's input — when the majority of children do not enjoy activities, the programme is not meeting their needs. Consult children about their interests and preferences and develop a child-led activity programme.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (dietaryComplianceRate < 70 && totalMealRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children's dietary requirements are consistently met — review individual dietary plans, update kitchen staff on each child's needs, and implement checks to verify compliance at every meal.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (totalRoutineRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate recording of daily routine schedules for every child on placement — without routine records, the home cannot evidence that children experience structured, predictable days.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
    });
  }

  if (totalMealRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence recording of meal routines for every child — document meal times, attendance, dietary compliance, and child feedback to evidence that nutrition and meal time structure are managed effectively.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (totalBedtimeRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence recording of bedtime routines for every child — document planned and actual bedtimes, routine adherence, and settling to evidence that sleep patterns are managed consistently.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
    });
  }

  if (totalParticipationRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement structured child participation in daily planning — record consultations, views, and outcomes to evidence that children genuinely influence their daily experiences.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (totalActivityRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish an activity planning and recording system — document planned and completed activities, child choice, and enjoyment to evidence a structured enrichment programme.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (settlingRate < 50 && totalBedtimeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review settling approaches for children taking longer than 30 minutes — consider whether wind-down activities, environment, anxiety, or overstimulation are contributing factors and develop individualised settling strategies.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
    });
  }

  if (viewsActionedRate < 50 && totalParticipationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's views lead to tangible changes — when children are consulted but their views are not actioned, participation becomes tokenistic. Staff should demonstrate how children's input has shaped decisions or explain why changes were not possible.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (activityChoiceRate < 40 && totalActivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase opportunities for child-chosen activities — offer children genuine choices about how they spend their time, supporting autonomy and personal interests within an appropriate structure.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (flexibilityRate < 30 && totalRoutineRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train staff in balancing routine structure with flexibility — good residential care requires predictable routines that can adapt to individual children's needs, emotional states, and circumstances. Rigid routines can feel institutional.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
    });
  }

  if (
    routineConsistencyRate >= 50 &&
    routineConsistencyRate < 70 &&
    totalRoutineRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve daily routine consistency to at least 70% — review barriers to consistent routines (staffing patterns, shift handovers, individual resistance) and provide staff with guidance on maintaining structure.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
    });
  }

  if (
    mealRegularityRate >= 50 &&
    mealRegularityRate < 70 &&
    totalMealRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve meal time regularity to at least 70% — review kitchen planning and staffing to ensure meals are consistently served at scheduled times.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    bedtimeAdherenceRate >= 50 &&
    bedtimeAdherenceRate < 70 &&
    totalBedtimeRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve bedtime routine adherence to at least 70% — review barriers to consistent bedtime routines and provide staff with clear expectations and individualised bedtime plans.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
    });
  }

  if (
    activityCompletionRate >= 50 &&
    activityCompletionRate < 70 &&
    totalActivityRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase activity completion rate above 70% — ensure planned activities are resourced, staffed, and prioritised so children consistently receive the experiences documented in their plans.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (
    activityEnjoymentRate >= 50 &&
    activityEnjoymentRate < 70 &&
    totalActivityRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance activity enjoyment by consulting children about their preferences — tailor the programme to children's interests and developmental stage to increase engagement and positive experiences.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (
    mealSatisfactionRate >= 50 &&
    mealSatisfactionRate < 70 &&
    totalMealRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve meal satisfaction by seeking regular child feedback on menu choices, food quality, and dining experiences — adapt menus and meal environments in response to children's preferences.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (windDownRate < 70 && totalBedtimeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure wind-down activities are consistently provided before bedtime — calming pre-sleep activities help children transition to rest and improve settling times.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care standard",
    });
  }

  if (socialDiningRate < 70 && totalMealRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Promote social dining environments at meal times — encourage staff and children to eat together in a relaxed setting, using meal times as opportunities for positive social interaction and relationship building.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (mealInvolvementRate < 50 && totalMealRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's involvement in meal preparation — cooking and food preparation develop independence and life skills while giving children a sense of ownership over their meals.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (activityVarietyCount < 4 && totalActivityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Broaden the range of activity types offered — children should have access to educational, recreational, therapeutic, social, life skills, creative, and physical activities to support holistic development.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (childInformedRate < 70 && totalRoutineRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children are consistently informed about their daily plans — discuss the day's schedule with each child in advance to reduce anxiety, promote a sense of control, and support transitions between activities.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: DailyRoutineInsight[] = [];

  // -- Critical insights --

  if (routineConsistencyRate < 50 && totalRoutineRecords > 0) {
    insights.push({
      text: `Only ${routineConsistencyRate}% routine consistency. Ofsted expects children in residential care to experience predictable, well-structured days. Poor routine consistency directly undermines children's sense of security, their emotional regulation, and their ability to engage with education and planned activities. This is a fundamental shortfall under Reg 6.`,
      severity: "critical",
    });
  }

  if (mealRegularityRate < 50 && totalMealRecords > 0) {
    insights.push({
      text: `Only ${mealRegularityRate}% meal time regularity. Irregular meals disrupt children's daily structure, affect their nutrition and energy levels, and can trigger anxiety in children who have experienced food insecurity or neglect. Consistent meal times are a cornerstone of routine-based care.`,
      severity: "critical",
    });
  }

  if (bedtimeAdherenceRate < 50 && totalBedtimeRecords > 0) {
    insights.push({
      text: `Only ${bedtimeAdherenceRate}% bedtime routine adherence. Inconsistent bedtimes directly impact children's sleep quality, next-day functioning, behaviour, and educational engagement. For children with trauma histories, predictable bedtime routines are particularly important for emotional regulation.`,
      severity: "critical",
    });
  }

  if (childParticipationRate < 40 && totalParticipationRecords > 0) {
    insights.push({
      text: `Child participation quality at only ${childParticipationRate}%. When children have no meaningful influence over their daily lives, it can feel institutional and disempowering. Reg 7 requires that children's views, wishes, and feelings are taken into account in daily decision-making, not just in formal reviews.`,
      severity: "critical",
    });
  }

  if (activityCompletionRate < 50 && totalActivityRecords > 0) {
    insights.push({
      text: `Only ${activityCompletionRate}% of planned activities completed. Looked-after children frequently have gaps in their experiences and development. When planned activities are consistently not delivered, children miss opportunities for enrichment, skill development, and positive experiences that the SCCIF specifically assesses.`,
      severity: "critical",
    });
  }

  if (totalRoutineRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No daily routine records exist despite children being on placement. Without routine tracking, the home cannot evidence that children experience structured, predictable days. This is a fundamental gap in care quality evidence under Reg 6.",
      severity: "critical",
    });
  }

  if (totalMealRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No meal routine records exist despite children being on placement. The home cannot evidence that meals are served regularly, dietary needs are met, or that meal times are managed as positive experiences. This represents a gap in Reg 5 compliance.",
      severity: "critical",
    });
  }

  if (totalBedtimeRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No bedtime routine records exist despite children being on placement. The home cannot evidence consistent bedtime management or age-appropriate bedtimes. Bedtime routines are a key component of structured daily care under Reg 6.",
      severity: "critical",
    });
  }

  if (totalParticipationRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No child participation records exist despite children being on placement. The home cannot evidence that children are consulted about their daily plans or that their voices influence routine decisions. This is a significant gap in Reg 7 compliance.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    routineConsistencyRate >= 50 &&
    routineConsistencyRate < 70 &&
    totalRoutineRecords > 0
  ) {
    insights.push({
      text: `Routine consistency at ${routineConsistencyRate}% — improving but inconsistent. Some children are not benefiting from the predictable daily structures that promote stability. Review whether staffing patterns, shift handovers, or individual needs are creating barriers to consistent routines.`,
      severity: "warning",
    });
  }

  if (
    mealRegularityRate >= 50 &&
    mealRegularityRate < 70 &&
    totalMealRecords > 0
  ) {
    insights.push({
      text: `Meal time regularity at ${mealRegularityRate}% — some meals are not being served on schedule. Unpredictable meal times can be particularly distressing for children who have experienced neglect or food insecurity.`,
      severity: "warning",
    });
  }

  if (
    bedtimeAdherenceRate >= 50 &&
    bedtimeAdherenceRate < 70 &&
    totalBedtimeRecords > 0
  ) {
    insights.push({
      text: `Bedtime routine adherence at ${bedtimeAdherenceRate}% — inconsistencies in bedtime routines may be contributing to settling difficulties, disrupted sleep, and next-day behavioural challenges.`,
      severity: "warning",
    });
  }

  if (
    childParticipationRate >= 40 &&
    childParticipationRate < 65 &&
    totalParticipationRecords > 0
  ) {
    insights.push({
      text: `Child participation quality at ${childParticipationRate}% — children's involvement in daily planning is present but not yet embedded. Genuine participation requires not only consultation but also recording views, taking action, and checking satisfaction.`,
      severity: "warning",
    });
  }

  if (
    activityCompletionRate >= 50 &&
    activityCompletionRate < 70 &&
    totalActivityRecords > 0
  ) {
    insights.push({
      text: `Activity completion at ${activityCompletionRate}% — some planned activities are not being delivered. Review whether resource constraints, staffing, or individual refusal are the primary barriers and address accordingly.`,
      severity: "warning",
    });
  }

  if (
    activityEnjoymentRate >= 50 &&
    activityEnjoymentRate < 70 &&
    totalActivityRecords > 0
  ) {
    insights.push({
      text: `Activity enjoyment at ${activityEnjoymentRate}% — some children are not enjoying the activities offered. Consider whether the programme is sufficiently varied, age-appropriate, and responsive to individual interests.`,
      severity: "warning",
    });
  }

  if (
    settlingRate >= 50 &&
    settlingRate < 70 &&
    totalBedtimeRecords > 0
  ) {
    insights.push({
      text: `Settling rate at ${settlingRate}% — some children are taking extended periods to fall asleep. Consider whether anxiety, overstimulation, screen use, or environmental factors are contributing to delayed settling.`,
      severity: "warning",
    });
  }

  if (
    mealSatisfactionRate >= 50 &&
    mealSatisfactionRate < 70 &&
    totalMealRecords > 0
  ) {
    insights.push({
      text: `Meal satisfaction at ${mealSatisfactionRate}% — some children do not feel positively about their meal experiences. Meal times should be enjoyable social occasions, not stressful or impersonal.`,
      severity: "warning",
    });
  }

  if (avgConsistencyRating >= 2.5 && avgConsistencyRating < 3.5 && totalRoutineRecords > 0) {
    insights.push({
      text: `Average consistency rating at ${avgConsistencyRating}/5 — routine consistency is mediocre across the home. This suggests systemic factors may be affecting the delivery of structured daily care rather than isolated individual issues.`,
      severity: "warning",
    });
  }

  if (activityVarietyCount < 4 && totalActivityRecords > 0) {
    insights.push({
      text: `Only ${activityVarietyCount} activity types offered. A limited activity programme restricts children's opportunities for holistic development. Children should experience a range of educational, recreational, therapeutic, social, creative, and physical activities.`,
      severity: "warning",
    });
  }

  if (windDownRate >= 30 && windDownRate < 70 && totalBedtimeRecords > 0) {
    insights.push({
      text: `Wind-down activity provision at ${windDownRate}% — calming pre-bedtime activities are not being consistently delivered. Research shows structured wind-down routines significantly improve sleep onset and quality in children.`,
      severity: "warning",
    });
  }

  if (
    viewsActionedRate >= 30 &&
    viewsActionedRate < 50 &&
    totalParticipationRecords > 0
  ) {
    insights.push({
      text: `Only ${viewsActionedRate}% of children's views actioned — there is a gap between consultation and action. When children see that their input does not lead to change, they may disengage from participation processes entirely.`,
      severity: "warning",
    });
  }

  // Activity type analysis
  const activityTypeCounts: Record<string, number> = {};
  for (const a of activity_plan_records) {
    activityTypeCounts[a.activity_type] = (activityTypeCounts[a.activity_type] ?? 0) + 1;
  }
  const topActivities = Object.entries(activityTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topActivities.length > 0) {
    const formatted = topActivities
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common activity types: ${formatted}. Understanding activity patterns helps ensure the programme is balanced — over-reliance on a single type may indicate gaps in other developmental areas.`,
      severity: "warning",
    });
  }

  // Participation type analysis
  const participationTypeCounts: Record<string, number> = {};
  for (const p of child_participation_records) {
    participationTypeCounts[p.participation_type] = (participationTypeCounts[p.participation_type] ?? 0) + 1;
  }
  const topParticipation = Object.entries(participationTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topParticipation.length > 0) {
    const formatted = topParticipation
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common participation types: ${formatted}. Effective child participation should span daily planning, menu choices, activity selection, and routine reviews to ensure children influence all aspects of their daily lives.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (routine_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding daily routine and structure — children experience predictable, well-organised days with consistent routines, rich activity programmes, regular meals, appropriate bedtimes, and meaningful participation in planning. This is strong evidence for Reg 5, Reg 6, and Reg 7 compliance and SCCIF experiences and progress.",
      severity: "positive",
    });
  }

  if (
    routineConsistencyRate >= 90 &&
    mealRegularityRate >= 90 &&
    bedtimeAdherenceRate >= 90 &&
    totalRoutineRecords > 0 &&
    totalMealRecords > 0 &&
    totalBedtimeRecords > 0
  ) {
    insights.push({
      text: `${routineConsistencyRate}% routine consistency, ${mealRegularityRate}% meal regularity, and ${bedtimeAdherenceRate}% bedtime adherence — the home delivers exceptional structure across all key daily touchpoints, giving children the stability and predictability they need to thrive.`,
      severity: "positive",
    });
  }

  if (
    childParticipationRate >= 85 &&
    viewsActionedRate >= 80 &&
    totalParticipationRecords > 0
  ) {
    insights.push({
      text: `${childParticipationRate}% child participation quality with ${viewsActionedRate}% of views actioned — children genuinely shape their daily experiences. Their voices are heard, recorded, acted upon, and they are satisfied with the outcomes. This is exemplary Reg 7 practice.`,
      severity: "positive",
    });
  }

  if (
    activityCompletionRate >= 90 &&
    activityEnjoymentRate >= 90 &&
    totalActivityRecords > 0
  ) {
    insights.push({
      text: `${activityCompletionRate}% activity completion with ${activityEnjoymentRate}% child enjoyment — the home delivers a consistently engaging programme of activities that children value. This evidences high-quality experiences and progress under SCCIF.`,
      severity: "positive",
    });
  }

  if (
    mealRegularityRate >= 90 &&
    mealSatisfactionRate >= 90 &&
    totalMealRecords > 0
  ) {
    insights.push({
      text: `${mealRegularityRate}% meal regularity with ${mealSatisfactionRate}% positive child feedback — the home provides consistent, enjoyable meal experiences. Meal times serve as positive social occasions that promote wellbeing and belonging.`,
      severity: "positive",
    });
  }

  if (
    bedtimeAdherenceRate >= 90 &&
    settlingRate >= 90 &&
    totalBedtimeRecords > 0
  ) {
    insights.push({
      text: `${bedtimeAdherenceRate}% bedtime adherence with ${settlingRate}% settling within 30 minutes — the combination of consistent routines and effective settling demonstrates that the home has established a calm, predictable bedtime culture that promotes healthy sleep.`,
      severity: "positive",
    });
  }

  if (
    flexibilityRate >= 80 &&
    routineConsistencyRate >= 80 &&
    totalRoutineRecords > 0
  ) {
    insights.push({
      text: `${routineConsistencyRate}% routine consistency alongside ${flexibilityRate}% flexibility — the home achieves an excellent balance between structure and responsiveness. Routines are followed but adapted appropriately to individual children's needs and circumstances, avoiding institutional rigidity.`,
      severity: "positive",
    });
  }

  if (
    activityChoiceRate >= 80 &&
    activityEnjoymentRate >= 80 &&
    totalActivityRecords > 0
  ) {
    insights.push({
      text: `${activityChoiceRate}% child-chosen activities with ${activityEnjoymentRate}% enjoyment — children have genuine agency in selecting their activities and consistently enjoy them. This promotes autonomy, self-expression, and positive developmental experiences.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (routine_rating === "outstanding") {
    headline =
      "Outstanding daily routine and structure — children experience predictable, well-organised days with consistent routines, rich activities, regular meals, and meaningful participation in planning.";
  } else if (routine_rating === "good") {
    headline = `Good daily routine and structure — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (routine_rating === "adequate") {
    headline = `Adequate daily routine and structure — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children experience consistently structured, enjoyable days.`;
  } else {
    headline = `Daily routine and structure is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children experience predictable, well-structured daily care.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    routine_rating,
    routine_score: score,
    headline,
    total_routine_records: totalRoutineRecords,
    total_activity_records: totalActivityRecords,
    total_meal_records: totalMealRecords,
    total_bedtime_records: totalBedtimeRecords,
    total_participation_records: totalParticipationRecords,
    routine_consistency_rate: routineConsistencyRate,
    activity_completion_rate: activityCompletionRate,
    meal_regularity_rate: mealRegularityRate,
    bedtime_adherence_rate: bedtimeAdherenceRate,
    child_participation_rate: childParticipationRate,
    flexibility_rate: flexibilityRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

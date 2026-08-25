import { rate, below, formatRate, meets } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SPECIALIZED HEALTH PLANS INTELLIGENCE ENGINE
// Home-level: aggregates ADHD plans, allergy plans, asthma plans, autism plans,
// diabetic care plans, epilepsy/seizure plans, continence plans, physio/OT plans,
// menstrual health plans, and occupational therapy records.
// CHR 2015 Reg 10: "The health and wellbeing standard."
// CHR 2015 Reg 15: "Supporting the child's health needs."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface ADHDPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  review_date: string;
  has_medication: boolean;
  strategies_count: number;         // executive_function_support + time_blindness + rsd_support
  child_voice_provided: boolean;    // child_voice !== ""
  key_worker_assigned: boolean;     // key_worker !== ""
}

export interface AllergyPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  review_date: string;
  aai_prescribed: boolean;
  staff_trained_count: number;
  school_has_plan: boolean;
  child_wears_medical_alert: boolean;
  allergens_count: number;
  emergency_protocol_count: number;
}

export interface AsthmaPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  review_date: string;
  has_preventer_inhaler: boolean;
  has_reliever_inhaler: boolean;
  school_has_inhaler: boolean;
  spare_inhaler_locations_count: number;
  child_can_self_medicate: boolean;
}

export interface AutismPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  review_date: string;
  sensory_profile_count: number;     // sensory_profile entries
  strategies_count: number;          // staff_do + staff_do_not strategies
  child_voice_provided: boolean;
  external_support_count: number;
}

export interface DiabeticCarePlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  review_date: string;
  cgm_in_use: boolean;
  school_plan_in_place: boolean;
  child_can_self_manage: boolean;    // not "not_at_all"
  emergency_contacts_count: number;
  flags_for_review_count: number;
}

export interface EpilepsyPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  review_date: string;
  has_rescue_medication: boolean;
  staff_trained_count: number;
  school_plan_in_place: boolean;
  safe_sleeping_documented: boolean; // safe_sleeping_arrangements.length > 0
  recent_seizure_count: number;
}

export interface ContinencePlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  review_date: string;
  privacy_measures_count: number;
  child_voice_provided: boolean;
  external_support_count: number;
  strategies_count: number;          // staff_do + staff_do_not strategies
}

export interface PhysioOtPlanInput {
  id: string;
  child_id: string;
  review_date: string;
  goals_count: number;
  exercises_count: number;
  school_plan_in_place: boolean;
  child_voice_provided: boolean;
  next_appointment_set: boolean;
}

export interface MenstrualHealthPlanInput {
  id: string;
  child_id: string;
  plan_reviewed_date: string;
  child_chosen_products: boolean;
  child_comfort_level: string;       // comfortable | somewhat_comfortable | uncomfortable | not_discussed
  education_delivered_count: number;
}

export interface OccupationalTherapyInput {
  id: string;
  child_id: string;
  assessment_date: string;
  next_review_date: string;
  recommendations_count: number;
  sensory_diet_count: number;
  equipment_count: number;
  report_provided: boolean;
  staff_training_provided: boolean;  // staff_training !== ""
}

export interface HomeSpecializedHealthPlansInput {
  today: string;
  adhd_plans: ADHDPlanInput[];
  allergy_plans: AllergyPlanInput[];
  asthma_plans: AsthmaPlanInput[];
  autism_plans: AutismPlanInput[];
  diabetic_care_plans: DiabeticCarePlanInput[];
  epilepsy_plans: EpilepsyPlanInput[];
  continence_plans: ContinencePlanInput[];
  physio_ot_plans: PhysioOtPlanInput[];
  menstrual_health_plans: MenstrualHealthPlanInput[];
  occupational_therapy_records: OccupationalTherapyInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type SpecializedHealthRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PlanCoverageProfile {
  total_plans: number;
  unique_children_covered: number;
  /** null when the population is empty — nothing measured, not 0%. */
  child_coverage: number | null;            // pct of total_children with >=1 plan
  plan_types_active: number;         // how many distinct plan categories have data
}

export interface ReviewComplianceProfile {
  total_reviewable: number;
  overdue_reviews: number;
  /** null when the population is empty — nothing measured, not 0%. */
  on_time_rate: number | null;
  oldest_overdue_days: number;
}

export interface SafetyPreparednessProfile {
  /** null when the population is empty — nothing measured, not 0%. */
  allergy_staff_trained_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  allergy_school_plan_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  epilepsy_staff_trained_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  epilepsy_school_plan_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  diabetic_school_plan_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  asthma_school_inhaler_rate: number | null;
}

export interface ChildVoiceProfile {
  total_with_voice: number;
  total_applicable: number;
  /** null when the population is empty — nothing measured, not 0%. */
  voice_rate: number | null;
}

export interface TherapyProfile {
  physio_ot_active: number;
  ot_active: number;
  total_goals: number;
  total_exercises: number;
  /** null when the population is empty — nothing measured, not 0%. */
  report_provision_rate: number | null;
}

export interface HomeSpecializedHealthPlansResult {
  health_plans_rating: SpecializedHealthRating;
  health_plans_score: number;
  headline: string;
  plan_coverage: PlanCoverageProfile;
  review_compliance: ReviewComplianceProfile;
  safety_preparedness: SafetyPreparednessProfile;
  child_voice: ChildVoiceProfile;
  therapy: TherapyProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeSpecializedHealthPlans(
  input: HomeSpecializedHealthPlansInput,
): HomeSpecializedHealthPlansResult {
  const {
    today, adhd_plans, allergy_plans, asthma_plans, autism_plans,
    diabetic_care_plans, epilepsy_plans, continence_plans,
    physio_ot_plans, menstrual_health_plans, occupational_therapy_records,
    total_children,
  } = input;

  // ── Collect all plans ────────────────────────────────────────────────
  const allPlans = [
    ...adhd_plans, ...allergy_plans, ...asthma_plans, ...autism_plans,
    ...diabetic_care_plans, ...epilepsy_plans, ...continence_plans,
    ...physio_ot_plans, ...menstrual_health_plans, ...occupational_therapy_records,
  ];

  // ── Insufficient data guard ──────────────────────────────────────────
  if (total_children === 0 && allPlans.length === 0) {
    return {
      health_plans_rating: "insufficient_data",
      health_plans_score: 0,
      headline: "No specialized health plan data available for analysis.",
      plan_coverage: { total_plans: 0, unique_children_covered: 0, child_coverage: null, plan_types_active: 0 },
      review_compliance: { total_reviewable: 0, overdue_reviews: 0, on_time_rate: null, oldest_overdue_days: 0 },
      safety_preparedness: { allergy_staff_trained_rate: null, allergy_school_plan_rate: null, epilepsy_staff_trained_rate: null, epilepsy_school_plan_rate: null, diabetic_school_plan_rate: null, asthma_school_inhaler_rate: null },
      child_voice: { total_with_voice: 0, total_applicable: 0, voice_rate: null },
      therapy: { physio_ot_active: 0, ot_active: 0, total_goals: 0, total_exercises: 0, report_provision_rate: null },
      strengths: [],
      concerns: ["No specialized health plan data — individual health needs cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Plan Coverage ────────────────────────────────────────────────────
  const uniqueChildIds = new Set<string>();
  for (const p of adhd_plans) uniqueChildIds.add(p.child_id);
  for (const p of allergy_plans) uniqueChildIds.add(p.child_id);
  for (const p of asthma_plans) uniqueChildIds.add(p.child_id);
  for (const p of autism_plans) uniqueChildIds.add(p.child_id);
  for (const p of diabetic_care_plans) uniqueChildIds.add(p.child_id);
  for (const p of epilepsy_plans) uniqueChildIds.add(p.child_id);
  for (const p of continence_plans) uniqueChildIds.add(p.child_id);
  for (const p of physio_ot_plans) uniqueChildIds.add(p.child_id);
  for (const p of menstrual_health_plans) uniqueChildIds.add(p.child_id);
  for (const p of occupational_therapy_records) uniqueChildIds.add(p.child_id);

  const childCoverage = rate(uniqueChildIds.size, total_children);

  let planTypesActive = 0;
  if (adhd_plans.length > 0) planTypesActive++;
  if (allergy_plans.length > 0) planTypesActive++;
  if (asthma_plans.length > 0) planTypesActive++;
  if (autism_plans.length > 0) planTypesActive++;
  if (diabetic_care_plans.length > 0) planTypesActive++;
  if (epilepsy_plans.length > 0) planTypesActive++;
  if (continence_plans.length > 0) planTypesActive++;
  if (physio_ot_plans.length > 0) planTypesActive++;
  if (menstrual_health_plans.length > 0) planTypesActive++;
  if (occupational_therapy_records.length > 0) planTypesActive++;

  const planCoverageProfile: PlanCoverageProfile = {
    total_plans: allPlans.length,
    unique_children_covered: uniqueChildIds.size,
    child_coverage: childCoverage,
    plan_types_active: planTypesActive,
  };

  // ── Review Compliance ────────────────────────────────────────────────
  // Gather all reviewable plans with their review dates
  interface Reviewable { review_date: string }
  const reviewables: Reviewable[] = [];

  for (const p of adhd_plans) reviewables.push({ review_date: p.review_date });
  for (const p of allergy_plans) reviewables.push({ review_date: p.review_date });
  for (const p of asthma_plans) reviewables.push({ review_date: p.review_date });
  for (const p of autism_plans) reviewables.push({ review_date: p.review_date });
  for (const p of diabetic_care_plans) reviewables.push({ review_date: p.review_date });
  for (const p of epilepsy_plans) reviewables.push({ review_date: p.review_date });
  for (const p of continence_plans) reviewables.push({ review_date: p.review_date });
  for (const p of physio_ot_plans) reviewables.push({ review_date: p.review_date });
  // Menstrual health only has plan_reviewed_date (past tense) — no forward review date, skip.
  for (const p of occupational_therapy_records) reviewables.push({ review_date: p.next_review_date });

  const overdueReviews = reviewables.filter(r => daysBetween(r.review_date, today) > 0);
  const onTimeRate = rate(reviewables.length - overdueReviews.length, reviewables.length);
  let oldestOverdueDays = 0;
  for (const r of overdueReviews) {
    const days = daysBetween(r.review_date, today);
    if (days > oldestOverdueDays) oldestOverdueDays = days;
  }

  const reviewComplianceProfile: ReviewComplianceProfile = {
    total_reviewable: reviewables.length,
    overdue_reviews: overdueReviews.length,
    on_time_rate: onTimeRate,
    oldest_overdue_days: oldestOverdueDays,
  };

  // ── Safety Preparedness ──────────────────────────────────────────────
  const allergyStaffTrainedRate = rate(
    allergy_plans.filter(p => p.staff_trained_count > 0).length,
    allergy_plans.length,
  );
  const allergySchoolPlanRate = rate(
    allergy_plans.filter(p => p.school_has_plan).length,
    allergy_plans.length,
  );
  const epilepsyStaffTrainedRate = rate(
    epilepsy_plans.filter(p => p.staff_trained_count > 0).length,
    epilepsy_plans.length,
  );
  const epilepsySchoolPlanRate = rate(
    epilepsy_plans.filter(p => p.school_plan_in_place).length,
    epilepsy_plans.length,
  );
  const diabeticSchoolPlanRate = rate(
    diabetic_care_plans.filter(p => p.school_plan_in_place).length,
    diabetic_care_plans.length,
  );
  const asthmaSchoolInhalerRate = rate(
    asthma_plans.filter(p => p.school_has_inhaler).length,
    asthma_plans.length,
  );

  const safetyProfile: SafetyPreparednessProfile = {
    allergy_staff_trained_rate: allergyStaffTrainedRate,
    allergy_school_plan_rate: allergySchoolPlanRate,
    epilepsy_staff_trained_rate: epilepsyStaffTrainedRate,
    epilepsy_school_plan_rate: epilepsySchoolPlanRate,
    diabetic_school_plan_rate: diabeticSchoolPlanRate,
    asthma_school_inhaler_rate: asthmaSchoolInhalerRate,
  };

  // ── Child Voice ──────────────────────────────────────────────────────
  // Applicable: ADHD, autism, continence plans + menstrual health (child_chosen_products)
  // + physio/OT plans
  const voiceApplicable = [
    ...adhd_plans.map(p => p.child_voice_provided),
    ...autism_plans.map(p => p.child_voice_provided),
    ...continence_plans.map(p => p.child_voice_provided),
    ...physio_ot_plans.map(p => p.child_voice_provided),
    ...menstrual_health_plans.map(p => p.child_chosen_products),
  ];
  const totalWithVoice = voiceApplicable.filter(Boolean).length;

  const childVoiceProfile: ChildVoiceProfile = {
    total_with_voice: totalWithVoice,
    total_applicable: voiceApplicable.length,
    voice_rate: rate(totalWithVoice, voiceApplicable.length),
  };

  // ── Therapy ──────────────────────────────────────────────────────────
  const totalGoals = physio_ot_plans.reduce((s, p) => s + p.goals_count, 0);
  const totalExercises = physio_ot_plans.reduce((s, p) => s + p.exercises_count, 0);
  const otReportRate = rate(
    occupational_therapy_records.filter(r => r.report_provided).length,
    occupational_therapy_records.length,
  );

  const therapyProfile: TherapyProfile = {
    physio_ot_active: physio_ot_plans.length,
    ot_active: occupational_therapy_records.length,
    total_goals: totalGoals,
    total_exercises: totalExercises,
    report_provision_rate: otReportRate,
  };

  // ── Scoring ──────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80
  let score = 52;

  // mod1: Plan coverage breadth (±5) — children with >=1 specialized plan
  if (total_children === 0) {
    // Plans exist but no children — use plan count signal
    score += (allPlans.length >= 3 ? 3 : allPlans.length >= 1 ? 1 : 0);
  } else {
    if (meets(childCoverage, 80)) score += 5;
    else if (meets(childCoverage, 60)) score += 3;
    else if (meets(childCoverage, 40)) score += 0;
    else score -= 5;
  }

  // mod2: Review timeliness (±4) — plans reviewed on time
  if (reviewables.length === 0) {
    score += 0;
  } else {
    if (meets(onTimeRate, 95)) score += 4;
    else if (meets(onTimeRate, 80)) score += 2;
    else if (meets(onTimeRate, 60)) score += 0;
    else score -= 4;
  }

  // mod3: Safety-critical plan preparedness (±4) — allergy + epilepsy staff training & school plans
  const safetyCriticalPlans = [...allergy_plans, ...epilepsy_plans];
  if (safetyCriticalPlans.length === 0) {
    // No safety-critical plans needed — neutral
    score += (diabetic_care_plans.length > 0 || asthma_plans.length > 0 ? 1 : 0);
  } else {
    const allergyReady = allergy_plans.filter(p => p.staff_trained_count > 0 && p.school_has_plan);
    const epilepsyReady = epilepsy_plans.filter(p => p.staff_trained_count > 0 && p.school_plan_in_place);
    const readyRate = rate(
      allergyReady.length + epilepsyReady.length,
      safetyCriticalPlans.length,
    );
    if (meets(readyRate, 100)) score += 4;
    else if (meets(readyRate, 80)) score += 2;
    else if (meets(readyRate, 50)) score += 0;
    else score -= 4;
  }

  // mod4: Child voice across plans (±3)
  if (voiceApplicable.length === 0) {
    score += 0;
  } else {
    const voiceRate = childVoiceProfile.voice_rate;
    if (meets(voiceRate, 90)) score += 3;
    else if (meets(voiceRate, 70)) score += 1;
    else if (meets(voiceRate, 50)) score += 0;
    else score -= 3;
  }

  // mod5: Plan type diversity (±3) — breadth of conditions covered
  if (allPlans.length === 0) {
    score += 0;
  } else {
    if (planTypesActive >= 5) score += 3;
    else if (planTypesActive >= 3) score += 1;
    else if (planTypesActive >= 2) score += 0;
    else score -= 3;
  }

  // mod6: School integration (±3) — plans linked to school settings
  const schoolLinkedPlans = [
    ...allergy_plans.filter(p => p.school_has_plan),
    ...asthma_plans.filter(p => p.school_has_inhaler),
    ...epilepsy_plans.filter(p => p.school_plan_in_place),
    ...diabetic_care_plans.filter(p => p.school_plan_in_place),
    ...physio_ot_plans.filter(p => p.school_plan_in_place),
  ];
  const totalSchoolApplicable = allergy_plans.length + asthma_plans.length +
    epilepsy_plans.length + diabetic_care_plans.length + physio_ot_plans.length;

  if (totalSchoolApplicable === 0) {
    score += 0;
  } else {
    const schoolRate = rate(schoolLinkedPlans.length, totalSchoolApplicable);
    if (meets(schoolRate, 100)) score += 3;
    else if (meets(schoolRate, 80)) score += 1;
    else if (meets(schoolRate, 50)) score += 0;
    else score -= 3;
  }

  // mod7: Therapy engagement (±3) — physio/OT + OT records
  const therapyTotal = physio_ot_plans.length + occupational_therapy_records.length;
  if (therapyTotal === 0) {
    score += 0;
  } else {
    const appointmentSet = physio_ot_plans.filter(p => p.next_appointment_set).length;
    const reportsProvided = occupational_therapy_records.filter(r => r.report_provided).length;
    const engagementRate = rate(appointmentSet + reportsProvided, therapyTotal);
    if (meets(engagementRate, 90)) score += 3;
    else if (meets(engagementRate, 70)) score += 1;
    else if (meets(engagementRate, 50)) score += 0;
    else score -= 3;
  }

  // mod8: Emergency preparedness (±3) — allergy emergency protocols + epilepsy rescue meds
  const emergencyPlans = [
    ...allergy_plans.map(p => p.emergency_protocol_count > 0),
    ...epilepsy_plans.map(p => p.has_rescue_medication),
    ...diabetic_care_plans.map(p => p.emergency_contacts_count > 0),
  ];
  if (emergencyPlans.length === 0) {
    score += 0;
  } else {
    const emergencyRate = rate(emergencyPlans.filter(Boolean).length, emergencyPlans.length);
    if (meets(emergencyRate, 100)) score += 3;
    else if (meets(emergencyRate, 80)) score += 1;
    else if (meets(emergencyRate, 50)) score += 0;
    else score -= 3;
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let health_plans_rating: SpecializedHealthRating;
  if (score >= 80) health_plans_rating = "outstanding";
  else if (score >= 65) health_plans_rating = "good";
  else if (score >= 45) health_plans_rating = "adequate";
  else health_plans_rating = "inadequate";

  // ── Headline ─────────────────────────────────────────────────────────
  const headlines: Record<SpecializedHealthRating, string> = {
    outstanding: "Exceptional specialized health plan management — comprehensive, reviewed and child-centred.",
    good: "Strong specialized health plans — most children's conditions well-managed.",
    adequate: "Specialized health plans meet basic requirements but need strengthening.",
    inadequate: "Critical gaps in specialized health plan coverage — urgent action required.",
    insufficient_data: "No specialized health plan data available for analysis.",
  };
  const headline = headlines[health_plans_rating];

  // ── Strengths ────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(childCoverage, 90) && total_children > 0)
    strengths.push(`Excellent health plan coverage — ${childCoverage}% of children have individualized plans.`);
  if (meets(onTimeRate, 95) && reviewables.length > 0)
    strengths.push(`Outstanding review compliance — ${onTimeRate}% of plans reviewed on time.`);
  if (meets(allergyStaffTrainedRate, 100) && allergy_plans.length > 0)
    strengths.push("All allergy plans have trained staff in place — children protected against anaphylaxis.");
  if (meets(epilepsyStaffTrainedRate, 100) && epilepsy_plans.length > 0)
    strengths.push("100% of epilepsy plans have trained staff — excellent seizure management readiness.");
  if (meets(childVoiceProfile.voice_rate, 90) && voiceApplicable.length > 0)
    strengths.push(`Strong child voice — ${formatRate(childVoiceProfile.voice_rate)} of plans reflect children's views.`);
  if (planTypesActive >= 5)
    strengths.push(`Comprehensive condition coverage across ${planTypesActive} different plan types.`);
  if (meets(otReportRate, 100) && occupational_therapy_records.length > 0)
    strengths.push("All occupational therapy assessments have reports provided — excellent clinical governance.");

  // ── Concerns ─────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (overdueReviews.length > 0)
    concerns.push(`${overdueReviews.length} health plan review${overdueReviews.length > 1 ? "s" : ""} overdue — oldest by ${oldestOverdueDays} days.`);
  if (below(childCoverage, 50) && total_children > 0 && allPlans.length > 0)
    concerns.push(`Only ${childCoverage}% of children have specialized health plans — coverage gap.`);
  if (below(allergyStaffTrainedRate, 100) && allergy_plans.length > 0)
    concerns.push("Not all allergy plans have trained staff — anaphylaxis risk.");
  if (below(epilepsyStaffTrainedRate, 100) && epilepsy_plans.length > 0)
    concerns.push("Not all epilepsy plans have trained staff — seizure management risk.");
  if (below(childVoiceProfile.voice_rate, 50) && voiceApplicable.length > 0)
    concerns.push(`Child voice rate of only ${formatRate(childVoiceProfile.voice_rate)} across plans — children's views underrepresented.`);

  const diabeticFlags = diabetic_care_plans.reduce((s, p) => s + p.flags_for_review_count, 0);
  if (diabeticFlags > 0)
    concerns.push(`${diabeticFlags} flag${diabeticFlags > 1 ? "s" : ""} for review across diabetic care plans.`);

  const recentSeizures = epilepsy_plans.reduce((s, p) => s + p.recent_seizure_count, 0);
  if (recentSeizures >= 5)
    concerns.push(`${recentSeizures} recent seizures logged — consider clinical review urgency.`);

  // ── Recommendations ──────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let recRank = 0;

  if (overdueReviews.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: `Schedule urgent reviews for ${overdueReviews.length} overdue health plans — Reg 10 requires current, reviewed plans.`,
      urgency: overdueReviews.some(r => daysBetween(r.review_date, today) > 90) ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 10",
    });
  }

  if (below(allergyStaffTrainedRate, 100) && allergy_plans.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Ensure all staff are trained in allergy/anaphylaxis management for every child with an allergy plan.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 15",
    });
  }

  if (below(epilepsyStaffTrainedRate, 100) && epilepsy_plans.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Complete epilepsy/rescue medication training for all relevant staff.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 15",
    });
  }

  if (below(childCoverage, 50) && total_children > 0 && allPlans.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Audit all children for unmet health conditions requiring specialized plans.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10",
    });
  }

  if (below(childVoiceProfile.voice_rate, 70) && voiceApplicable.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Increase child participation in health plan development — ensure every child's voice is captured.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 10",
    });
  }

  // ── Insights ─────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (recentSeizures >= 5)
    insights.push({ text: `Cara detects ${recentSeizures} recent seizures across epilepsy plans — consider joint clinical review with neurologist.`, severity: "critical" });

  if (diabeticFlags >= 3)
    insights.push({ text: `Cara flags ${diabeticFlags} diabetic care concerns — multi-disciplinary review recommended.`, severity: "warning" });

  if (oldestOverdueDays > 180)
    insights.push({ text: `Cara detects health plans overdue by ${oldestOverdueDays} days — regulatory non-compliance risk.`, severity: "critical" });

  if (planTypesActive >= 5 && meets(onTimeRate, 90) && meets(childCoverage, 80))
    insights.push({ text: "Cara recognises exemplary multi-condition management — evidence of proactive health culture.", severity: "positive" });

  if (therapyTotal > 0 && below(otReportRate, 50))
    insights.push({ text: "Cara notes low OT report provision rate — clinical governance improvement opportunity.", severity: "warning" });

  if (allergy_plans.length > 0 && allergy_plans.every(p => p.child_wears_medical_alert))
    insights.push({ text: "All children with allergies wear medical alerts — strong emergency identification practice.", severity: "positive" });

  return {
    health_plans_rating,
    health_plans_score: score,
    headline,
    plan_coverage: planCoverageProfile,
    review_compliance: reviewComplianceProfile,
    safety_preparedness: safetyProfile,
    child_voice: childVoiceProfile,
    therapy: therapyProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

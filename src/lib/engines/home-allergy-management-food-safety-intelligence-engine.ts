// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ALLERGY MANAGEMENT & FOOD SAFETY INTELLIGENCE ENGINE
// Monitors how well the home manages children's allergy plans, ensures staff
// allergen awareness training is current, tracks epipen availability and
// expiry checks, evaluates food labelling compliance, measures emergency
// response preparedness for anaphylaxis/allergic reactions, and assesses
// children's own allergy awareness.
// Measures allergy plan coverage, allergen awareness training rates, epipen
// check compliance, food labelling compliance, emergency response readiness,
// and child allergy awareness.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (Arrangements for the protection of children),
//          Reg 5 (Registered person: fitness and competence).
// SCCIF: "Children's health needs are identified and met."
// Store keys: allergyPlanRecords, allergenAwarenessRecords,
//             epipenCheckRecords, foodLabellingRecords,
//             emergencyResponseRecords
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meets } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AllergyPlanInput {
  id: string;
  child_id: string;
  allergen: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  plan_created_date: string;
  plan_review_date: string | null;
  plan_review_overdue: boolean;
  plan_shared_with_staff: boolean;
  plan_shared_with_child: boolean;
  emergency_medication_specified: boolean;
  dietary_requirements_documented: boolean;
  cross_contamination_measures: boolean;
  gp_or_specialist_input: boolean;
  parent_carer_consulted: boolean;
  risk_assessment_completed: boolean;
  photo_on_plan: boolean;
  plan_accessible_in_kitchen: boolean;
  created_at: string;
}

export interface AllergenAwarenessInput {
  id: string;
  staff_id: string;
  staff_name: string;
  training_type: "induction" | "refresher" | "advanced" | "epipen_practical" | "anaphylaxis";
  training_date: string;
  expiry_date: string | null;
  training_expired: boolean;
  trainer_name: string;
  certificate_held: boolean;
  assessment_passed: boolean;
  covers_all_14_allergens: boolean;
  practical_component_completed: boolean;
  created_at: string;
}

export interface EpipenCheckInput {
  id: string;
  child_id: string;
  epipen_location: string;
  check_date: string;
  expiry_date: string;
  epipen_expired: boolean;
  epipen_in_date: boolean;
  epipen_accessible: boolean;
  spare_available: boolean;
  checked_by: string;
  location_clearly_labelled: boolean;
  staff_aware_of_location: boolean;
  travel_kit_available: boolean;
  created_at: string;
}

export interface FoodLabellingInput {
  id: string;
  audit_date: string;
  area_audited: "kitchen" | "dining_room" | "storage" | "packed_lunch" | "snack_area" | "fridge" | "freezer";
  items_checked: number;
  items_correctly_labelled: number;
  allergen_info_displayed: boolean;
  cross_contamination_controls: boolean;
  date_marking_compliant: boolean;
  separate_storage_for_allergens: boolean;
  menu_allergen_info_available: boolean;
  auditor_name: string;
  corrective_actions_required: number;
  corrective_actions_completed: number;
  created_at: string;
}

export interface EmergencyResponseInput {
  id: string;
  drill_date: string;
  drill_type: "tabletop" | "practical" | "full_simulation" | "epipen_practice" | "scenario_discussion";
  scenario: string;
  participants_expected: number;
  participants_attended: number;
  response_time_seconds: number | null;
  correct_procedure_followed: boolean;
  epipen_administered_correctly: boolean;
  emergency_services_called_correctly: boolean;
  debrief_completed: boolean;
  lessons_learned_documented: boolean;
  improvements_identified: number;
  improvements_actioned: number;
  next_drill_date: string | null;
  created_at: string;
}

export interface AllergyManagementFoodSafetyInput {
  today: string;
  total_children: number;
  children_with_allergies: number;
  total_staff: number;
  allergy_plan_records: AllergyPlanInput[];
  allergen_awareness_records: AllergenAwarenessInput[];
  epipen_check_records: EpipenCheckInput[];
  food_labelling_records: FoodLabellingInput[];
  emergency_response_records: EmergencyResponseInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AllergyManagementRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AllergyManagementInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AllergyManagementRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface AllergyManagementFoodSafetyResult {
  allergy_rating: AllergyManagementRating;
  allergy_score: number;
  headline: string;
  total_plans: number;
  children_with_allergies: number;
  allergy_plan_rate: number;
  allergen_awareness_rate: number;
  epipen_check_rate: number;
  food_labelling_rate: number;
  // fab-0: null when no drills/plans have been recorded (see check-fabricated-scores.js).
  emergency_response_rate: number | null;
  child_awareness_rate: number;
  // fab-0: null when no allergy plans exist to average quality across.
  plan_quality_avg: number | null;
  training_currency_rate: number;
  allergy_plan_records: AllergyPlanInput[];
  allergen_awareness_records: AllergenAwarenessInput[];
  epipen_check_records: EpipenCheckInput[];
  food_labelling_records: FoodLabellingInput[];
  emergency_response_records: EmergencyResponseInput[];
  strengths: string[];
  concerns: string[];
  recommendations: AllergyManagementRecommendation[];
  insights: AllergyManagementInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AllergyManagementRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: AllergyManagementRating,
  score: number,
  headline: string,
): AllergyManagementFoodSafetyResult {
  return {
    allergy_rating: rating,
    allergy_score: score,
    headline,
    total_plans: 0,
    children_with_allergies: 0,
    allergy_plan_rate: 0,
    allergen_awareness_rate: 0,
    epipen_check_rate: 0,
    food_labelling_rate: 0,
    emergency_response_rate: null,
    child_awareness_rate: 0,
    plan_quality_avg: null,
    training_currency_rate: 0,
    allergy_plan_records: [],
    allergen_awareness_records: [],
    epipen_check_records: [],
    food_labelling_records: [],
    emergency_response_records: [],
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeAllergyManagementFoodSafety(
  input: AllergyManagementFoodSafetyInput,
): AllergyManagementFoodSafetyResult {
  const {
    total_children,
    children_with_allergies,
    total_staff,
    allergy_plan_records,
    allergen_awareness_records,
    epipen_check_records,
    food_labelling_records,
    emergency_response_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    allergy_plan_records.length === 0 &&
    allergen_awareness_records.length === 0 &&
    epipen_check_records.length === 0 &&
    food_labelling_records.length === 0 &&
    emergency_response_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess allergy management and food safety.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No allergy management or food safety data recorded despite children on placement — allergy plans, staff training, and food safety require urgent attention.",
      ),
      children_with_allergies,
      allergy_plan_records,
      allergen_awareness_records,
      epipen_check_records,
      food_labelling_records,
      emergency_response_records,
      concerns: [
        "No allergy plans, allergen awareness training, epipen checks, food labelling audits, or emergency response drills exist despite children being on placement — the home cannot evidence safe allergy management or food safety compliance.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately establish allergy plans for every child with known allergies, including documented allergens, emergency medication, dietary requirements, and cross-contamination measures.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Arrangements for protection of children",
        },
        {
          rank: 2,
          recommendation:
            "Implement mandatory allergen awareness training for all staff covering the 14 regulated allergens, epipen administration, and anaphylaxis response, with documented certificates and scheduled refreshers.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Registered person: fitness and competence",
        },
      ],
      insights: [
        {
          text: "The complete absence of allergy management and food safety records means the home cannot demonstrate that children's allergy needs are identified, managed, or that food is safely prepared. Ofsted expects robust allergy management as a fundamental safeguarding obligation under Reg 14, and the absence of any records represents a serious risk to children's safety.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Allergy plan coverage ---
  const uniqueChildrenWithPlans = new Set(
    allergy_plan_records.map((p) => p.child_id),
  ).size;
  const allergyPlanRate =
    children_with_allergies > 0
      ? pct(uniqueChildrenWithPlans, children_with_allergies)
      : (allergy_plan_records.length > 0 ? 100 : 0);

  const totalPlans = allergy_plan_records.length;

  // --- Plan quality metrics ---
  const plansSharedWithStaff = allergy_plan_records.filter(
    (p) => p.plan_shared_with_staff,
  ).length;
  const planStaffShareRate = pct(plansSharedWithStaff, totalPlans);

  const plansSharedWithChild = allergy_plan_records.filter(
    (p) => p.plan_shared_with_child,
  ).length;
  const childAwarenessRate = pct(plansSharedWithChild, totalPlans);

  const plansWithEmergencyMed = allergy_plan_records.filter(
    (p) => p.emergency_medication_specified,
  ).length;
  const emergencyMedDocRate = pct(plansWithEmergencyMed, totalPlans);

  const plansWithDietary = allergy_plan_records.filter(
    (p) => p.dietary_requirements_documented,
  ).length;
  const dietaryDocRate = pct(plansWithDietary, totalPlans);

  const plansWithCrossContam = allergy_plan_records.filter(
    (p) => p.cross_contamination_measures,
  ).length;
  const crossContamRate = pct(plansWithCrossContam, totalPlans);

  const plansWithRiskAssessment = allergy_plan_records.filter(
    (p) => p.risk_assessment_completed,
  ).length;
  const riskAssessmentRate = pct(plansWithRiskAssessment, totalPlans);

  const plansWithPhoto = allergy_plan_records.filter(
    (p) => p.photo_on_plan,
  ).length;
  const photoOnPlanRate = pct(plansWithPhoto, totalPlans);

  const plansAccessibleInKitchen = allergy_plan_records.filter(
    (p) => p.plan_accessible_in_kitchen,
  ).length;
  const kitchenAccessRate = pct(plansAccessibleInKitchen, totalPlans);

  const plansWithGPInput = allergy_plan_records.filter(
    (p) => p.gp_or_specialist_input,
  ).length;
  const gpInputRate = pct(plansWithGPInput, totalPlans);

  const plansWithParentConsulted = allergy_plan_records.filter(
    (p) => p.parent_carer_consulted,
  ).length;
  const parentConsultRate = pct(plansWithParentConsulted, totalPlans);

  const overdueplanReviews = allergy_plan_records.filter(
    (p) => p.plan_review_overdue,
  ).length;
  const planReviewComplianceRate = totalPlans > 0
    ? pct(totalPlans - overdueplanReviews, totalPlans)
    : 0;

  // Plan quality: average of key quality indicators per plan. `checks` is a
  // fixed-length array literal so the denominator is compile-time > 0 — no
  // fab-0 risk in the per-plan map.
  const planQualityScores = allergy_plan_records.map((p) => {
    const checks = [
      p.plan_shared_with_staff,
      p.plan_shared_with_child,
      p.emergency_medication_specified,
      p.dietary_requirements_documented,
      p.cross_contamination_measures,
      p.gp_or_specialist_input,
      p.parent_carer_consulted,
      p.risk_assessment_completed,
      p.photo_on_plan,
      p.plan_accessible_in_kitchen,
    ];
    const q = checks.filter(Boolean).length;
    return Math.round((q / checks.length) * 100);
  });
  // fab-0: null when no allergy plans to average across.
  const planQualityAvg: number | null =
    planQualityScores.length > 0
      ? Math.round(
          planQualityScores.reduce((sum, v) => sum + v, 0) /
            planQualityScores.length,
        )
      : null;

  // Severity distribution
  const lifeThreatPlans = allergy_plan_records.filter(
    (p) => p.severity === "life_threatening",
  ).length;
  const severePlans = allergy_plan_records.filter(
    (p) => p.severity === "severe",
  ).length;
  const highRiskPlans = lifeThreatPlans + severePlans;

  // Life-threatening plans with missing critical components
  const lifeThreatMissingMed = allergy_plan_records.filter(
    (p) => p.severity === "life_threatening" && !p.emergency_medication_specified,
  ).length;
  const lifeThreatMissingRisk = allergy_plan_records.filter(
    (p) => p.severity === "life_threatening" && !p.risk_assessment_completed,
  ).length;

  // --- Allergen awareness training ---
  const totalTrainingRecords = allergen_awareness_records.length;
  const uniqueStaffTrained = new Set(
    allergen_awareness_records.map((a) => a.staff_id),
  ).size;
  const allergenAwarenessRate =
    total_staff > 0 ? pct(uniqueStaffTrained, total_staff) : 0;

  const currentTraining = allergen_awareness_records.filter(
    (a) => !a.training_expired,
  ).length;
  const trainingCurrencyRate = pct(currentTraining, totalTrainingRecords);

  const expiredTraining = allergen_awareness_records.filter(
    (a) => a.training_expired,
  ).length;

  const trainingWithCertificate = allergen_awareness_records.filter(
    (a) => a.certificate_held,
  ).length;
  const certificateRate = pct(trainingWithCertificate, totalTrainingRecords);

  const trainingAssessmentPassed = allergen_awareness_records.filter(
    (a) => a.assessment_passed,
  ).length;
  const assessmentPassRate = pct(trainingAssessmentPassed, totalTrainingRecords);

  const trainingCoversAll14 = allergen_awareness_records.filter(
    (a) => a.covers_all_14_allergens,
  ).length;
  const covers14Rate = pct(trainingCoversAll14, totalTrainingRecords);

  const practicalCompleted = allergen_awareness_records.filter(
    (a) => a.practical_component_completed,
  ).length;
  const practicalRate = pct(practicalCompleted, totalTrainingRecords);

  // --- Epipen checks ---
  const totalEpipenChecks = epipen_check_records.length;
  const uniqueChildrenWithEpipens = new Set(
    epipen_check_records.map((e) => e.child_id),
  ).size;

  const epipensInDate = epipen_check_records.filter(
    (e) => e.epipen_in_date,
  ).length;
  const epipensExpired = epipen_check_records.filter(
    (e) => e.epipen_expired,
  ).length;
  const epipensAccessible = epipen_check_records.filter(
    (e) => e.epipen_accessible,
  ).length;
  const epipensWithSpare = epipen_check_records.filter(
    (e) => e.spare_available,
  ).length;
  const epipensLabelled = epipen_check_records.filter(
    (e) => e.location_clearly_labelled,
  ).length;
  const staffAwareLocation = epipen_check_records.filter(
    (e) => e.staff_aware_of_location,
  ).length;
  const travelKitAvailable = epipen_check_records.filter(
    (e) => e.travel_kit_available,
  ).length;

  // Epipen composite check rate: in-date AND accessible AND staff-aware
  const epipensCompliant = epipen_check_records.filter(
    (e) => e.epipen_in_date && e.epipen_accessible && e.staff_aware_of_location,
  ).length;
  const epipenCheckRate = pct(epipensCompliant, totalEpipenChecks);

  const epipenInDateRate = pct(epipensInDate, totalEpipenChecks);
  const epipenAccessibleRate = pct(epipensAccessible, totalEpipenChecks);
  const spareAvailableRate = pct(epipensWithSpare, totalEpipenChecks);
  const locationLabelledRate = pct(epipensLabelled, totalEpipenChecks);
  const staffAwareRate = pct(staffAwareLocation, totalEpipenChecks);
  const travelKitRate = pct(travelKitAvailable, totalEpipenChecks);

  // --- Food labelling compliance ---
  const totalFoodAudits = food_labelling_records.length;
  const totalItemsChecked = food_labelling_records.reduce(
    (sum, f) => sum + f.items_checked,
    0,
  );
  const totalItemsCorrect = food_labelling_records.reduce(
    (sum, f) => sum + f.items_correctly_labelled,
    0,
  );
  const foodLabellingRate = pct(totalItemsCorrect, totalItemsChecked);

  const auditsWithAllergenInfo = food_labelling_records.filter(
    (f) => f.allergen_info_displayed,
  ).length;
  const allergenInfoRate = pct(auditsWithAllergenInfo, totalFoodAudits);

  const auditsWithCrossContamControls = food_labelling_records.filter(
    (f) => f.cross_contamination_controls,
  ).length;
  const crossContamControlRate = pct(auditsWithCrossContamControls, totalFoodAudits);

  const auditsDateCompliant = food_labelling_records.filter(
    (f) => f.date_marking_compliant,
  ).length;
  const dateMarkingRate = pct(auditsDateCompliant, totalFoodAudits);

  const auditsWithSeparateStorage = food_labelling_records.filter(
    (f) => f.separate_storage_for_allergens,
  ).length;
  const separateStorageRate = pct(auditsWithSeparateStorage, totalFoodAudits);

  const auditsWithMenuInfo = food_labelling_records.filter(
    (f) => f.menu_allergen_info_available,
  ).length;
  const menuAllergenRate = pct(auditsWithMenuInfo, totalFoodAudits);

  const totalCorrectiveRequired = food_labelling_records.reduce(
    (sum, f) => sum + f.corrective_actions_required,
    0,
  );
  const totalCorrectiveCompleted = food_labelling_records.reduce(
    (sum, f) => sum + f.corrective_actions_completed,
    0,
  );
  const correctiveActionRate = pct(totalCorrectiveCompleted, totalCorrectiveRequired);

  // --- Emergency response preparedness ---
  const totalDrills = emergency_response_records.length;
  const drillsWithCorrectProcedure = emergency_response_records.filter(
    (e) => e.correct_procedure_followed,
  ).length;
  const correctProcedureRate = pct(drillsWithCorrectProcedure, totalDrills);

  const drillsWithCorrectEpipen = emergency_response_records.filter(
    (e) => e.epipen_administered_correctly,
  ).length;
  const epipenAdminRate = pct(drillsWithCorrectEpipen, totalDrills);

  const drillsWithCorrectEmergencyCall = emergency_response_records.filter(
    (e) => e.emergency_services_called_correctly,
  ).length;
  const emergencyCallRate = pct(drillsWithCorrectEmergencyCall, totalDrills);

  const drillsDebriefed = emergency_response_records.filter(
    (e) => e.debrief_completed,
  ).length;
  const debriefRate = pct(drillsDebriefed, totalDrills);

  const drillsWithLessons = emergency_response_records.filter(
    (e) => e.lessons_learned_documented,
  ).length;
  const lessonsDocRate = pct(drillsWithLessons, totalDrills);

  const totalParticipantsExpected = emergency_response_records.reduce(
    (sum, e) => sum + e.participants_expected,
    0,
  );
  const totalParticipantsAttended = emergency_response_records.reduce(
    (sum, e) => sum + e.participants_attended,
    0,
  );
  const drillAttendanceRate = pct(totalParticipantsAttended, totalParticipantsExpected);

  const totalImprovementsIdentified = emergency_response_records.reduce(
    (sum, e) => sum + e.improvements_identified,
    0,
  );
  const totalImprovementsActioned = emergency_response_records.reduce(
    (sum, e) => sum + e.improvements_actioned,
    0,
  );
  const improvementActionRate = pct(totalImprovementsActioned, totalImprovementsIdentified);

  // Emergency response composite rate — null when no drills recorded.
  const emergencyResponseRate: number | null = totalDrills > 0
    ? Math.round((correctProcedureRate + epipenAdminRate + emergencyCallRate) / 3)
    : null;

  // Response time analysis — null when no response times recorded.
  const responseTimes = emergency_response_records
    .filter((e) => e.response_time_seconds !== null && e.response_time_seconds !== undefined)
    .map((e) => e.response_time_seconds as number);
  const avgResponseTime: number | null =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
      : null;
  const slowResponses = responseTimes.filter((t) => t > 300).length; // > 5 minutes

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: allergyPlanRate (>=100: +5, >=80: +3) ---
  if (allergyPlanRate >= 100) score += 5;
  else if (allergyPlanRate >= 80) score += 3;

  // --- Bonus 2: allergenAwarenessRate (>=100: +5, >=80: +3) ---
  if (allergenAwarenessRate >= 100) score += 5;
  else if (allergenAwarenessRate >= 80) score += 3;

  // --- Bonus 3: epipenCheckRate (>=100: +5, >=80: +3) ---
  if (epipenCheckRate >= 100) score += 5;
  else if (epipenCheckRate >= 80) score += 3;

  // --- Bonus 4: foodLabellingRate (>=95: +4, >=80: +2) ---
  if (foodLabellingRate >= 95) score += 4;
  else if (foodLabellingRate >= 80) score += 2;

  // --- Bonus 5: emergencyResponseRate (>=90: +5, >=70: +3) ---
  if (meets(emergencyResponseRate, 90)) score += 5;
  else if (meets(emergencyResponseRate, 70)) score += 3;

  // --- Bonus 6: planQualityAvg (>=90: +2, >=70: +1) ---
  if (meets(planQualityAvg, 90)) score += 2;
  else if (meets(planQualityAvg, 70)) score += 1;

  // --- Bonus 7: childAwarenessRate (>=90: +2, >=70: +1) ---
  if (childAwarenessRate >= 90) score += 2;
  else if (childAwarenessRate >= 70) score += 1;

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // allergyPlanRate < 50 → -6
  if (allergyPlanRate < 50 && children_with_allergies > 0) score -= 6;

  // allergenAwarenessRate < 50 → -5
  if (allergenAwarenessRate < 50 && total_staff > 0) score -= 5;

  // epipenCheckRate < 50 → -5
  if (epipenCheckRate < 50 && totalEpipenChecks > 0) score -= 5;

  // emergencyResponseRate < 40 → -5
  if (below(emergencyResponseRate, 40) && totalDrills > 0) score -= 5;

  score = clamp(score, 0, 100);

  const allergy_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (allergyPlanRate >= 100 && children_with_allergies > 0) {
    strengths.push(
      "Every child with a known allergy has a documented allergy plan — the home demonstrates comprehensive identification and management of children's allergy needs.",
    );
  } else if (allergyPlanRate >= 80 && children_with_allergies > 0) {
    strengths.push(
      `${allergyPlanRate}% of children with allergies have documented plans — strong allergy plan coverage ensuring most children's needs are formally managed.`,
    );
  }

  if (allergenAwarenessRate >= 100 && total_staff > 0) {
    strengths.push(
      "Every member of staff has completed allergen awareness training — the entire workforce is equipped to recognise and respond to allergy risks.",
    );
  } else if (allergenAwarenessRate >= 80 && total_staff > 0) {
    strengths.push(
      `${allergenAwarenessRate}% of staff have allergen awareness training — strong training coverage across the team.`,
    );
  }

  if (epipenCheckRate >= 100 && totalEpipenChecks > 0) {
    strengths.push(
      "All epipens are in-date, accessible, and their locations are known to staff — the home ensures emergency medication is always ready for use.",
    );
  } else if (epipenCheckRate >= 80 && totalEpipenChecks > 0) {
    strengths.push(
      `${epipenCheckRate}% of epipens are fully compliant (in-date, accessible, staff-aware) — strong emergency medication management.`,
    );
  }

  if (foodLabellingRate >= 95 && totalItemsChecked > 0) {
    strengths.push(
      `${foodLabellingRate}% food labelling compliance — near-perfect labelling ensures children with allergies can identify safe foods and staff can verify allergen content.`,
    );
  } else if (foodLabellingRate >= 80 && totalItemsChecked > 0) {
    strengths.push(
      `${foodLabellingRate}% food labelling compliance — good standard of food labelling supporting safe allergen management in the kitchen and dining areas.`,
    );
  }

  if (totalDrills > 0 && meets(emergencyResponseRate, 90)) {
    strengths.push(
      `${emergencyResponseRate}% emergency response accuracy — staff demonstrate excellent capability in following correct procedures, administering epipens, and contacting emergency services during drills.`,
    );
  } else if (totalDrills > 0 && meets(emergencyResponseRate, 70)) {
    strengths.push(
      `${emergencyResponseRate}% emergency response accuracy — staff demonstrate competent allergy emergency response skills across drills.`,
    );
  }

  if (childAwarenessRate >= 90 && totalPlans > 0) {
    strengths.push(
      `${childAwarenessRate}% of allergy plans have been shared with the child — children are actively informed about their own allergies, empowering them to participate in their own safety.`,
    );
  } else if (childAwarenessRate >= 70 && totalPlans > 0) {
    strengths.push(
      `${childAwarenessRate}% of allergy plans shared with the child — good practice in involving children in understanding their allergy management.`,
    );
  }

  if (totalPlans > 0 && meets(planQualityAvg, 90)) {
    strengths.push(
      `Allergy plan quality averages ${planQualityAvg}% — plans are comprehensive, including emergency medication, dietary requirements, cross-contamination measures, risk assessments, and professional input.`,
    );
  } else if (totalPlans > 0 && meets(planQualityAvg, 70)) {
    strengths.push(
      `Allergy plan quality averages ${planQualityAvg}% — plans contain the majority of essential elements for safe allergy management.`,
    );
  }

  if (trainingCurrencyRate >= 100 && totalTrainingRecords > 0) {
    strengths.push(
      "All allergen awareness training records are current — no expired training across the staff team ensures continuous competence in allergy management.",
    );
  } else if (trainingCurrencyRate >= 80 && totalTrainingRecords > 0) {
    strengths.push(
      `${trainingCurrencyRate}% of allergen awareness training is current — the majority of staff have up-to-date training.`,
    );
  }

  if (planReviewComplianceRate >= 100 && totalPlans > 0) {
    strengths.push(
      "All allergy plan reviews are up to date — the home ensures plans remain current and reflective of children's evolving needs.",
    );
  } else if (planReviewComplianceRate >= 80 && totalPlans > 0) {
    strengths.push(
      `${planReviewComplianceRate}% of allergy plan reviews are on schedule — strong compliance with review timescales.`,
    );
  }

  if (crossContamRate >= 100 && totalPlans > 0) {
    strengths.push(
      "Cross-contamination measures are documented in every allergy plan — the home demonstrates thorough attention to preventing accidental allergen exposure.",
    );
  }

  if (kitchenAccessRate >= 100 && totalPlans > 0) {
    strengths.push(
      "All allergy plans are accessible in the kitchen — staff preparing food have immediate access to children's allergy information.",
    );
  }

  if (covers14Rate >= 100 && totalTrainingRecords > 0) {
    strengths.push(
      "All training records cover the 14 regulated allergens — staff have comprehensive knowledge of all major allergen groups.",
    );
  }

  if (practicalRate >= 90 && totalTrainingRecords > 0) {
    strengths.push(
      `${practicalRate}% of training includes a practical component — staff can demonstrate allergy management skills, not just theoretical knowledge.`,
    );
  }

  if (spareAvailableRate >= 100 && totalEpipenChecks > 0) {
    strengths.push(
      "Spare epipens are available for every child — the home has contingency medication in case of device failure or multiple dosing requirement.",
    );
  }

  if (debriefRate >= 100 && totalDrills > 0) {
    strengths.push(
      "Every emergency response drill includes a debrief — the home uses drills as genuine learning opportunities to continuously improve response capability.",
    );
  }

  if (correctiveActionRate >= 100 && totalCorrectiveRequired > 0) {
    strengths.push(
      "All corrective actions from food labelling audits have been completed — the home responds effectively to identified food safety issues.",
    );
  }

  if (separateStorageRate >= 100 && totalFoodAudits > 0) {
    strengths.push(
      "Separate storage for allergens is confirmed in all food audits — the home maintains clear physical separation to prevent cross-contamination.",
    );
  }

  if (menuAllergenRate >= 100 && totalFoodAudits > 0) {
    strengths.push(
      "Menu allergen information is available at every audit point — children and staff can readily identify allergen content in all planned meals.",
    );
  }

  if (riskAssessmentRate >= 100 && totalPlans > 0) {
    strengths.push(
      "Every allergy plan includes a completed risk assessment — the home systematically evaluates and mitigates allergy-related risks for each child.",
    );
  }

  if (drillAttendanceRate >= 90 && totalParticipantsExpected > 0) {
    strengths.push(
      `${drillAttendanceRate}% drill attendance — strong staff participation ensures the team collectively develops confidence in emergency allergy response.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (allergyPlanRate < 50 && children_with_allergies > 0) {
    concerns.push(
      `Only ${allergyPlanRate}% of children with allergies have documented plans — the majority of children with known allergies do not have formal management plans, creating a serious safeguarding risk.`,
    );
  } else if (allergyPlanRate < 80 && allergyPlanRate >= 50 && children_with_allergies > 0) {
    concerns.push(
      `Allergy plan coverage at ${allergyPlanRate}% — some children with known allergies do not have documented management plans, potentially leaving them unprotected.`,
    );
  }

  if (allergenAwarenessRate < 50 && total_staff > 0) {
    concerns.push(
      `Only ${allergenAwarenessRate}% of staff have allergen awareness training — the majority of the workforce lacks documented training in recognising and managing allergic reactions.`,
    );
  } else if (allergenAwarenessRate < 80 && allergenAwarenessRate >= 50 && total_staff > 0) {
    concerns.push(
      `Allergen awareness training at ${allergenAwarenessRate}% — some staff members lack documented allergen training, creating gaps in the team's ability to manage allergy risks safely.`,
    );
  }

  if (epipenCheckRate < 50 && totalEpipenChecks > 0) {
    concerns.push(
      `Only ${epipenCheckRate}% of epipens are fully compliant — the majority of emergency auto-injectors are not confirmed as in-date, accessible, and staff-aware, which could be fatal in an emergency.`,
    );
  } else if (epipenCheckRate < 80 && epipenCheckRate >= 50 && totalEpipenChecks > 0) {
    concerns.push(
      `Epipen compliance at ${epipenCheckRate}% — some emergency auto-injectors have gaps in date, accessibility, or staff awareness checks.`,
    );
  }

  if (foodLabellingRate < 70 && totalItemsChecked > 0) {
    concerns.push(
      `Food labelling compliance at only ${foodLabellingRate}% — significant numbers of food items are not correctly labelled, creating a risk of accidental allergen exposure during meal preparation and serving.`,
    );
  } else if (foodLabellingRate < 80 && foodLabellingRate >= 70 && totalItemsChecked > 0) {
    concerns.push(
      `Food labelling compliance at ${foodLabellingRate}% — some food items lack correct labelling, which could contribute to allergen management errors.`,
    );
  }

  if (totalDrills > 0 && below(emergencyResponseRate, 40)) {
    concerns.push(
      `Emergency response accuracy at only ${emergencyResponseRate}% — staff are not consistently demonstrating correct procedures, epipen administration, or emergency call protocols during drills, indicating a serious training gap.`,
    );
  } else if (totalDrills > 0 && emergencyResponseRate !== null && emergencyResponseRate < 70 && emergencyResponseRate >= 40) {
    concerns.push(
      `Emergency response accuracy at ${emergencyResponseRate}% — not all drills demonstrate correct allergy emergency procedures, indicating further training and practice is needed.`,
    );
  }

  if (childAwarenessRate < 50 && totalPlans > 0) {
    concerns.push(
      `Only ${childAwarenessRate}% of allergy plans have been shared with the child — most children with allergies are not being actively informed about their own allergy management, limiting their ability to self-protect.`,
    );
  } else if (childAwarenessRate < 70 && childAwarenessRate >= 50 && totalPlans > 0) {
    concerns.push(
      `Child allergy awareness at ${childAwarenessRate}% — a significant proportion of children have not been formally involved in understanding their own allergy plans.`,
    );
  }

  if (lifeThreatMissingMed > 0) {
    concerns.push(
      `${lifeThreatMissingMed} life-threatening allergy plan${lifeThreatMissingMed !== 1 ? "s do" : " does"} not specify emergency medication — this is a critical omission that could delay life-saving treatment.`,
    );
  }

  if (lifeThreatMissingRisk > 0) {
    concerns.push(
      `${lifeThreatMissingRisk} life-threatening allergy plan${lifeThreatMissingRisk !== 1 ? "s lack" : " lacks"} a completed risk assessment — risk assessment is essential for managing the most serious allergy risks.`,
    );
  }

  if (epipensExpired > 0) {
    concerns.push(
      `${epipensExpired} epipen${epipensExpired !== 1 ? "s are" : " is"} expired — expired auto-injectors may not deliver the correct dose or may fail entirely during an emergency.`,
    );
  }

  if (expiredTraining > 0) {
    concerns.push(
      `${expiredTraining} allergen awareness training record${expiredTraining !== 1 ? "s have" : " has"} expired — staff with expired training may not be current on best practice allergy management.`,
    );
  }

  if (overdueplanReviews > 0 && totalPlans > 0) {
    concerns.push(
      `${overdueplanReviews} allergy plan review${overdueplanReviews !== 1 ? "s are" : " is"} overdue — without timely reviews, plans may not reflect children's current allergy status or changing needs.`,
    );
  }

  if (slowResponses > 0 && responseTimes.length > 0) {
    concerns.push(
      `${slowResponses} emergency response drill${slowResponses !== 1 ? "s recorded" : " recorded"} response times over 5 minutes — in anaphylaxis, rapid response is critical and delays can be life-threatening.`,
    );
  }

  if (crossContamControlRate < 70 && totalFoodAudits > 0) {
    concerns.push(
      `Cross-contamination controls confirmed in only ${crossContamControlRate}% of food audits — inadequate cross-contamination prevention creates a direct risk of accidental allergen exposure.`,
    );
  }

  if (planStaffShareRate < 70 && totalPlans > 0) {
    concerns.push(
      `Only ${planStaffShareRate}% of allergy plans shared with staff — staff who are unaware of children's allergies cannot safeguard them during meals, activities, or outings.`,
    );
  }

  if (kitchenAccessRate < 70 && totalPlans > 0) {
    concerns.push(
      `Only ${kitchenAccessRate}% of allergy plans are accessible in the kitchen — food preparation staff may not have the information they need to prevent allergen contamination.`,
    );
  }

  if (correctiveActionRate < 70 && totalCorrectiveRequired > 0) {
    concerns.push(
      `Only ${correctiveActionRate}% of food labelling corrective actions completed — outstanding corrective actions indicate unresolved food safety issues.`,
    );
  }

  if (drillAttendanceRate < 60 && totalParticipantsExpected > 0) {
    concerns.push(
      `Emergency drill attendance at only ${drillAttendanceRate}% — low participation means a significant portion of the team has not practised allergy emergency response.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: AllergyManagementRecommendation[] = [];
  let rank = 0;

  if (allergyPlanRate < 50 && children_with_allergies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently create allergy management plans for all children with known allergies — every child's allergy must be formally documented with allergens, emergency medication, dietary requirements, and cross-contamination measures to ensure safe care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (lifeThreatMissingMed > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately update all life-threatening allergy plans to specify emergency medication — the absence of documented emergency medication for life-threatening allergies is a critical safety gap that must be addressed without delay.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (epipensExpired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately replace all expired epipens and implement an expiry tracking system with advance alerts — expired auto-injectors may fail in an emergency and must be replaced before their expiry date.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (allergenAwarenessRate < 50 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently deliver allergen awareness training to all untrained staff — every member of the team must understand the 14 regulated allergens, recognise signs of allergic reaction, and know how to respond, including epipen administration.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Fitness and competence",
    });
  }

  if (epipenCheckRate < 50 && totalEpipenChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all epipen arrangements to ensure every device is in-date, accessible, and its location known to all staff — non-compliant auto-injectors represent a life-threatening risk.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (totalDrills > 0 && below(emergencyResponseRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately increase the frequency and quality of allergy emergency response drills — staff must be able to demonstrate correct epipen administration, appropriate emergency service contact, and proper post-incident protocols.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (crossContamControlRate < 70 && totalFoodAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement robust cross-contamination controls across all food handling areas — ensure separate utensils, chopping boards, and preparation surfaces for allergen-free meals, with documented cleaning protocols.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (planStaffShareRate < 70 && totalPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all allergy plans are shared with the full staff team and new staff receive allergy information during induction — staff who are unaware of a child's allergies cannot keep them safe.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (foodLabellingRate < 70 && totalItemsChecked > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve food labelling across all storage and preparation areas — every food item must be clearly labelled with allergen content to prevent accidental exposure during meal preparation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (overdueplanReviews > 0 && totalPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue allergy plan reviews — children's allergy status can change over time and plans must be kept current to ensure ongoing safe management.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (expiredTraining > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule refresher training for all staff with expired allergen awareness certificates — expired training means staff competence in allergy management has not been recently verified.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Fitness and competence",
    });
  }

  if (
    allergyPlanRate >= 50 &&
    allergyPlanRate < 80 &&
    children_with_allergies > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend allergy plan coverage to all children with known allergies — aim for 100% coverage to ensure every child's allergy is formally managed with documented plans.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (
    allergenAwarenessRate >= 50 &&
    allergenAwarenessRate < 80 &&
    total_staff > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand allergen awareness training to achieve full staff coverage — every staff member must have documented training to ensure consistent allergy management across all shifts.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Fitness and competence",
    });
  }

  if (
    epipenCheckRate >= 50 &&
    epipenCheckRate < 80 &&
    totalEpipenChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve epipen compliance to ensure all devices are consistently in-date, accessible, and their locations are confirmed to all staff members.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (
    totalDrills > 0 &&
    emergencyResponseRate !== null &&
    emergencyResponseRate >= 40 &&
    emergencyResponseRate < 70
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve allergy emergency response performance through additional practice drills and targeted training for staff who did not follow correct procedures.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (childAwarenessRate < 70 && totalPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child involvement in allergy plan awareness — children should understand their own allergies, know what foods to avoid, recognise symptoms of reaction, and know how to seek help. Use age-appropriate methods to build their understanding.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's health needs are identified and met",
    });
  }

  if (
    foodLabellingRate >= 70 &&
    foodLabellingRate < 95 &&
    totalItemsChecked > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Continue improving food labelling to achieve 95%+ compliance — consistent, accurate labelling is essential to prevent accidental allergen exposure and demonstrate food safety diligence.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (correctiveActionRate < 80 && totalCorrectiveRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all outstanding corrective actions from food labelling audits — unresolved findings represent ongoing food safety risks that must be closed out promptly.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (covers14Rate < 80 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all allergen awareness training covers the 14 regulated allergens as defined by food labelling legislation — incomplete coverage may leave staff unaware of certain allergen risks.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Fitness and competence",
    });
  }

  if (practicalRate < 70 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the proportion of allergen awareness training that includes practical components — theoretical knowledge alone does not equip staff to confidently administer epipens or manage live allergic reactions.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Fitness and competence",
    });
  }

  if (travelKitRate < 80 && totalEpipenChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure travel allergy kits are available for all children with epipens — children must have access to emergency medication during outings, activities, and transport.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  if (lessonsDocRate < 70 && totalDrills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document lessons learned from all emergency response drills — capturing and acting on lessons ensures continuous improvement in allergy emergency preparedness.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Learning and improving from events",
    });
  }

  if (photoOnPlanRate < 70 && totalPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include a photograph of the child on all allergy plans — photos help staff, supply workers, and visitors quickly identify children with allergies, particularly in busy mealtime environments.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Protection of children",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: AllergyManagementInsight[] = [];

  // -- Critical insights --

  if (allergyPlanRate < 50 && children_with_allergies > 0) {
    insights.push({
      text: `Only ${allergyPlanRate}% of children with known allergies have documented plans. Without formal allergy management plans, the home cannot demonstrate that it has identified, assessed, and mitigated each child's allergy risks. Ofsted considers allergy management a fundamental safeguarding obligation under Reg 14, and the absence of plans for the majority of allergic children represents a serious regulatory concern.`,
      severity: "critical",
    });
  }

  if (lifeThreatMissingMed > 0) {
    insights.push({
      text: `${lifeThreatMissingMed} child${lifeThreatMissingMed !== 1 ? "ren" : ""} with life-threatening allergies ${lifeThreatMissingMed !== 1 ? "have" : "has"} plans that do not specify emergency medication. In an anaphylactic emergency, every second counts — staff must know exactly what medication to administer, the correct dose, and the route of administration. This omission could directly impact a child's survival.`,
      severity: "critical",
    });
  }

  if (epipensExpired > 0) {
    insights.push({
      text: `${epipensExpired} epipen${epipensExpired !== 1 ? "s are" : " is"} expired. An expired auto-injector may not deliver the correct dose of adrenaline or may fail to fire entirely. In anaphylaxis, the epipen is a child's first line of life-saving treatment — expired devices must be replaced immediately without exception.`,
      severity: "critical",
    });
  }

  if (allergenAwarenessRate < 50 && total_staff > 0) {
    insights.push({
      text: `Only ${allergenAwarenessRate}% of staff have allergen awareness training. Staff who have not been trained in recognising allergic reactions, understanding cross-contamination risks, and administering emergency medication cannot safely care for children with allergies. This training gap represents a serious competence concern under Reg 5.`,
      severity: "critical",
    });
  }

  if (epipenCheckRate < 50 && totalEpipenChecks > 0) {
    insights.push({
      text: `Only ${epipenCheckRate}% of epipens are fully compliant. For an epipen to be effective in an emergency, it must be in-date, physically accessible within seconds, and its location must be known to all staff on shift. Non-compliant auto-injectors create a direct, life-threatening risk.`,
      severity: "critical",
    });
  }

  if (totalDrills > 0 && below(emergencyResponseRate, 40)) {
    insights.push({
      text: `Emergency response accuracy at only ${emergencyResponseRate}%. When staff cannot consistently demonstrate correct allergy emergency procedures during controlled drills, there is a serious risk that a real allergic emergency would be managed poorly. The home must invest in intensive, repeated practice to build muscle memory and confidence.`,
      severity: "critical",
    });
  }

  if (crossContamControlRate < 50 && totalFoodAudits > 0) {
    insights.push({
      text: `Cross-contamination controls confirmed in only ${crossContamControlRate}% of food audits. Cross-contamination is one of the most common causes of accidental allergen exposure — without consistent controls in every food handling area, children with allergies are at risk of exposure through shared surfaces, utensils, or storage.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    allergyPlanRate >= 50 &&
    allergyPlanRate < 80 &&
    children_with_allergies > 0
  ) {
    insights.push({
      text: `Allergy plan coverage at ${allergyPlanRate}% — improving but some children with known allergies still lack formal management plans. Each child without a plan is at increased risk of an unmanaged allergic reaction.`,
      severity: "warning",
    });
  }

  if (
    allergenAwarenessRate >= 50 &&
    allergenAwarenessRate < 80 &&
    total_staff > 0
  ) {
    insights.push({
      text: `Allergen awareness training at ${allergenAwarenessRate}% — not all staff have documented training. Gaps in training coverage mean that on any given shift, staff without allergy knowledge may be responsible for children with serious allergies.`,
      severity: "warning",
    });
  }

  if (
    epipenCheckRate >= 50 &&
    epipenCheckRate < 80 &&
    totalEpipenChecks > 0
  ) {
    insights.push({
      text: `Epipen compliance at ${epipenCheckRate}% — some auto-injectors have gaps in date, accessibility, or staff awareness checks. Any gap in epipen readiness could prove fatal during an anaphylactic emergency.`,
      severity: "warning",
    });
  }

  if (
    totalDrills > 0 &&
    emergencyResponseRate !== null &&
    emergencyResponseRate >= 40 &&
    emergencyResponseRate < 70
  ) {
    insights.push({
      text: `Emergency response accuracy at ${emergencyResponseRate}% — not all drills demonstrate correct procedures. Further practice is needed to ensure every staff member can confidently and correctly manage an allergic emergency.`,
      severity: "warning",
    });
  }

  if (
    foodLabellingRate >= 70 &&
    foodLabellingRate < 95 &&
    totalItemsChecked > 0
  ) {
    insights.push({
      text: `Food labelling compliance at ${foodLabellingRate}% — while the majority of items are correctly labelled, any mislabelled item in a kitchen serving children with allergies represents a potential safety incident.`,
      severity: "warning",
    });
  }

  if (
    childAwarenessRate >= 50 &&
    childAwarenessRate < 70 &&
    totalPlans > 0
  ) {
    insights.push({
      text: `Child allergy awareness at ${childAwarenessRate}% — some children have not been formally involved in understanding their own allergy plans. Age-appropriate allergy education empowers children to participate in their own safety.`,
      severity: "warning",
    });
  }

  if (overdueplanReviews > 0 && totalPlans > 0) {
    insights.push({
      text: `${overdueplanReviews} allergy plan review${overdueplanReviews !== 1 ? "s" : ""} overdue. Children's allergy status can change — new allergies may develop, existing allergies may resolve, or medication may change. Out-of-date plans may contain incorrect information that could endanger a child.`,
      severity: "warning",
    });
  }

  if (expiredTraining > 0 && totalTrainingRecords > 0) {
    insights.push({
      text: `${expiredTraining} training record${expiredTraining !== 1 ? "s have" : " has"} expired. Allergen management guidance and best practice evolve, and staff competence must be periodically verified. Expired training means the home cannot confirm that staff knowledge is current.`,
      severity: "warning",
    });
  }

  if (slowResponses > 0 && responseTimes.length > 0 && avgResponseTime !== null) {
    insights.push({
      text: `${slowResponses} drill${slowResponses !== 1 ? "s" : ""} recorded response times exceeding 5 minutes. In anaphylaxis, adrenaline should be administered as quickly as possible — delays significantly reduce the likelihood of a positive outcome. Average response time across drills: ${avgResponseTime} seconds.`,
      severity: "warning",
    });
  }

  if (
    totalPlans > 0 &&
    planQualityAvg !== null &&
    planQualityAvg >= 50 &&
    planQualityAvg < 70
  ) {
    insights.push({
      text: `Allergy plan quality averaging ${planQualityAvg}% — plans are missing some essential elements such as emergency medication details, cross-contamination measures, photographs, or risk assessments. Incomplete plans may not provide staff with the information they need during an emergency.`,
      severity: "warning",
    });
  }

  if (
    correctiveActionRate >= 50 &&
    correctiveActionRate < 80 &&
    totalCorrectiveRequired > 0
  ) {
    insights.push({
      text: `Only ${correctiveActionRate}% of food labelling corrective actions completed. Outstanding corrective actions represent known food safety issues that have been identified but not yet resolved.`,
      severity: "warning",
    });
  }

  if (covers14Rate < 80 && covers14Rate >= 50 && totalTrainingRecords > 0) {
    insights.push({
      text: `Only ${covers14Rate}% of training records confirm coverage of all 14 regulated allergens. Staff who are not trained on all allergen groups may not recognise less common allergens such as lupin, molluscs, or celery in food items.`,
      severity: "warning",
    });
  }

  // Severity distribution analysis
  if (highRiskPlans > 0 && totalPlans > 0) {
    const highRiskPct = pct(highRiskPlans, totalPlans);
    if (highRiskPct >= 50) {
      insights.push({
        text: `${highRiskPct}% of allergy plans relate to severe or life-threatening allergies (${lifeThreatPlans} life-threatening, ${severePlans} severe). The high proportion of serious allergies demands exceptional vigilance in plan quality, epipen readiness, and staff training. Any failure in management could have catastrophic consequences.`,
        severity: "warning",
      });
    }
  }

  // Area audit analysis
  const areaAuditCounts: Record<string, number> = {};
  for (const audit of food_labelling_records) {
    areaAuditCounts[audit.area_audited] = (areaAuditCounts[audit.area_audited] ?? 0) + 1;
  }
  const topAuditAreas = Object.entries(areaAuditCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topAuditAreas.length > 0 && totalFoodAudits >= 3) {
    const areaStr = topAuditAreas
      .map(([area, count]) => `${area.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Food labelling audits by area: ${areaStr}. Consider whether all food handling areas receive regular audit attention, including packed lunches, snack areas, and fridges where allergen risks are present.`,
      severity: "warning",
    });
  }

  // Drill type analysis
  const drillTypeCounts: Record<string, number> = {};
  for (const drill of emergency_response_records) {
    drillTypeCounts[drill.drill_type] = (drillTypeCounts[drill.drill_type] ?? 0) + 1;
  }
  const topDrillTypes = Object.entries(drillTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topDrillTypes.length > 0 && totalDrills >= 3) {
    const drillStr = topDrillTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Emergency response drill types: ${drillStr}. A balanced mix of tabletop exercises, practical drills, and full simulations provides the most comprehensive preparation for real emergencies.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (allergy_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding allergy management and food safety — children's allergies are comprehensively documented, staff are trained and competent, epipens are managed rigorously, food labelling is exemplary, and emergency response preparedness is strong. This is powerful evidence of proactive health safeguarding under Reg 14.",
      severity: "positive",
    });
  }

  if (
    totalPlans > 0 &&
    planQualityAvg !== null &&
    allergyPlanRate >= 100 &&
    planQualityAvg >= 90 &&
    children_with_allergies > 0
  ) {
    insights.push({
      text: `Every child with an allergy has a comprehensive plan averaging ${planQualityAvg}% quality — the home excels at documenting allergy management with all essential elements including emergency medication, dietary requirements, cross-contamination measures, and risk assessments.`,
      severity: "positive",
    });
  }

  if (
    allergenAwarenessRate >= 100 &&
    trainingCurrencyRate >= 100 &&
    total_staff > 0 &&
    totalTrainingRecords > 0
  ) {
    insights.push({
      text: "Every staff member has current allergen awareness training — the home maintains a fully trained workforce with no expired certifications, ensuring consistent competence in allergy management across all shifts.",
      severity: "positive",
    });
  }

  if (
    epipenCheckRate >= 100 &&
    spareAvailableRate >= 100 &&
    totalEpipenChecks > 0
  ) {
    insights.push({
      text: "All epipens are fully compliant with spare devices available — the home operates exemplary emergency medication management, ensuring children have immediate access to life-saving treatment with backup devices as contingency.",
      severity: "positive",
    });
  }

  if (
    foodLabellingRate >= 95 &&
    crossContamControlRate >= 100 &&
    separateStorageRate >= 100 &&
    totalItemsChecked > 0 &&
    totalFoodAudits > 0
  ) {
    insights.push({
      text: `${foodLabellingRate}% labelling compliance with 100% cross-contamination controls and separate allergen storage — the home's food safety practices are exemplary, minimising the risk of accidental allergen exposure during all stages of food preparation and service.`,
      severity: "positive",
    });
  }

  if (
    totalDrills > 0 &&
    emergencyResponseRate !== null &&
    emergencyResponseRate >= 90 &&
    debriefRate >= 100
  ) {
    insights.push({
      text: `${emergencyResponseRate}% emergency response accuracy with 100% debrief completion — staff demonstrate excellent allergy emergency skills and the home uses drills as genuine learning opportunities, continuously improving its readiness for real incidents.`,
      severity: "positive",
    });
  }

  if (
    childAwarenessRate >= 90 &&
    totalPlans > 0
  ) {
    insights.push({
      text: `${childAwarenessRate}% of allergy plans shared with the child — children are empowered to understand and participate in managing their own allergies. Age-appropriate allergy education is a hallmark of outstanding, child-centred care.`,
      severity: "positive",
    });
  }

  if (
    riskAssessmentRate >= 100 &&
    crossContamRate >= 100 &&
    totalPlans > 0
  ) {
    insights.push({
      text: "Every allergy plan includes both a completed risk assessment and cross-contamination measures — the home systematically identifies and mitigates allergy risks through formal, documented processes.",
      severity: "positive",
    });
  }

  if (
    practicalRate >= 90 &&
    assessmentPassRate >= 90 &&
    totalTrainingRecords > 0
  ) {
    insights.push({
      text: `${practicalRate}% practical training completion with ${assessmentPassRate}% assessment pass rate — staff are not only theoretically trained but have demonstrated practical competence in allergy management, including hands-on epipen practice.`,
      severity: "positive",
    });
  }

  if (
    improvementActionRate >= 100 &&
    totalImprovementsIdentified > 0
  ) {
    insights.push({
      text: "All improvements identified from emergency response drills have been actioned — the home demonstrates a genuine commitment to continuous improvement in allergy emergency preparedness.",
      severity: "positive",
    });
  }

  if (
    correctiveActionRate >= 100 &&
    totalCorrectiveRequired > 0
  ) {
    insights.push({
      text: "All food labelling corrective actions have been completed — the home responds effectively and promptly to identified food safety issues, closing the loop on audit findings.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (allergy_rating === "outstanding") {
    headline =
      "Outstanding allergy management and food safety — children's allergies are comprehensively managed, staff are well-trained, emergency preparedness is strong, and food labelling compliance is exemplary.";
  } else if (allergy_rating === "good") {
    headline = `Good allergy management and food safety — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (allergy_rating === "adequate") {
    headline = `Adequate allergy management and food safety — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's allergy needs are safely managed.`;
  } else {
    headline = `Allergy management and food safety is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children with allergies.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    allergy_rating,
    allergy_score: score,
    headline,
    total_plans: totalPlans,
    children_with_allergies,
    allergy_plan_rate: allergyPlanRate,
    allergen_awareness_rate: allergenAwarenessRate,
    epipen_check_rate: epipenCheckRate,
    food_labelling_rate: foodLabellingRate,
    emergency_response_rate: emergencyResponseRate,
    child_awareness_rate: childAwarenessRate,
    plan_quality_avg: planQualityAvg,
    training_currency_rate: trainingCurrencyRate,
    allergy_plan_records,
    allergen_awareness_records,
    epipen_check_records,
    food_labelling_records,
    emergency_response_records,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

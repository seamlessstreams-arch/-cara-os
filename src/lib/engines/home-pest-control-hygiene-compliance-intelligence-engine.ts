// ==============================================================================
// CARA -- HOME PEST CONTROL & HYGIENE COMPLIANCE INTELLIGENCE ENGINE
// Monitors pest inspection schedules, treatment effectiveness, kitchen hygiene
// audits, environmental cleanliness ratings, and child-safe product usage.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises -- suitable and maintained to high standard),
// Reg 5 (Engaging, empowering and employing), SCCIF safety.
// Store keys: pestInspectionRecords, treatmentRecords, kitchenHygieneRecords,
//             cleanlinessRatingRecords, productSafetyRecords
// ==============================================================================

import { above, below, meets } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface PestInspectionRecordInput {
  id: string;
  inspection_date: string;
  inspector_type: "external_contractor" | "internal_staff" | "local_authority" | "specialist";
  areas_inspected: string[];
  pests_found: boolean;
  pest_types_found: string[];
  severity: "none" | "low" | "moderate" | "high" | "critical";
  scheduled: boolean;
  completed_on_time: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  report_filed: boolean;
  corrective_actions_identified: number;
  corrective_actions_completed: number;
  next_inspection_date: string | null;
  children_areas_affected: boolean;
  staff_id: string;
  notes: string;
  created_at: string;
}

export interface TreatmentRecordInput {
  id: string;
  treatment_date: string;
  pest_type: string;
  treatment_method: "chemical" | "biological" | "physical" | "integrated" | "preventive";
  product_used: string;
  product_child_safe: boolean;
  coshh_compliant: boolean;
  area_treated: string;
  children_relocated_during_treatment: boolean;
  re_entry_time_observed: boolean;
  treatment_effective: boolean;
  follow_up_treatment_required: boolean;
  follow_up_treatment_completed: boolean;
  risk_assessment_completed: boolean;
  staff_id: string;
  contractor_name: string;
  contractor_certified: boolean;
  documentation_complete: boolean;
  created_at: string;
}

export interface KitchenHygieneRecordInput {
  id: string;
  audit_date: string;
  auditor_type: "internal" | "external" | "eho" | "registered_manager";
  overall_score: number; // 0-100
  food_storage_compliant: boolean;
  temperature_monitoring_compliant: boolean;
  cleaning_schedule_followed: boolean;
  pest_evidence_found: boolean;
  hand_hygiene_compliant: boolean;
  waste_management_compliant: boolean;
  cross_contamination_controls: boolean;
  staff_training_current: boolean;
  fridge_temperature_in_range: boolean;
  freezer_temperature_in_range: boolean;
  cooking_temperature_verified: boolean;
  allergen_controls_in_place: boolean;
  corrective_actions_raised: number;
  corrective_actions_closed: number;
  food_hygiene_rating: number; // 0-5
  date_labelling_compliant: boolean;
  surface_cleanliness_passed: boolean;
  equipment_maintained: boolean;
  notes: string;
  created_at: string;
}

export interface CleanlinessRatingRecordInput {
  id: string;
  assessment_date: string;
  area_name: string;
  area_type: "bedroom" | "bathroom" | "kitchen" | "living_area" | "hallway" | "garden" | "laundry" | "office" | "communal" | "utility" | "other";
  cleanliness_score: number; // 1-10
  hygiene_standard_met: boolean;
  deep_clean_completed: boolean;
  deep_clean_due_date: string | null;
  deep_clean_overdue: boolean;
  infection_control_compliant: boolean;
  hazards_identified: number;
  hazards_resolved: number;
  odour_issues: boolean;
  damp_mould_issues: boolean;
  ventilation_adequate: boolean;
  child_involved_in_assessment: boolean;
  staff_id: string;
  notes: string;
  created_at: string;
}

export interface ProductSafetyRecordInput {
  id: string;
  product_name: string;
  product_type: "cleaning_chemical" | "disinfectant" | "pesticide" | "herbicide" | "laundry" | "air_freshener" | "sanitiser" | "other";
  child_safe_certified: boolean;
  coshh_assessment_completed: boolean;
  coshh_sheet_available: boolean;
  stored_securely: boolean;
  locked_storage: boolean;
  labelled_correctly: boolean;
  in_date: boolean;
  expiry_date: string | null;
  staff_trained_on_use: boolean;
  risk_assessment_completed: boolean;
  first_aid_instructions_available: boolean;
  alternative_child_safe_product_available: boolean;
  usage_logged: boolean;
  last_audit_date: string | null;
  created_at: string;
}

export interface PestControlInput {
  today: string;
  total_children: number;
  pest_inspection_records: PestInspectionRecordInput[];
  treatment_records: TreatmentRecordInput[];
  kitchen_hygiene_records: KitchenHygieneRecordInput[];
  cleanliness_rating_records: CleanlinessRatingRecordInput[];
  product_safety_records: ProductSafetyRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type PestControlRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PestControlInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PestControlRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PestControlResult {
  pest_control_rating: PestControlRating;
  pest_control_score: number;
  headline: string;
  // Most rates use pct() directly (deterministic 0 on empty). The 2 composite
  // rates below are null on empty: no source records ⇒ no signal. Fab-0 doctrine.
  inspection_compliance_rate: number;
  treatment_effectiveness_rate: number;
  kitchen_hygiene_rate: number | null;
  cleanliness_rate: number | null;
  product_safety_rate: number;
  staff_training_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: PestControlRecommendation[];
  insights: PestControlInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PestControlRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: PestControlRating,
  score: number,
  headline: string,
): PestControlResult {
  return {
    pest_control_rating: rating,
    pest_control_score: score,
    headline,
    inspection_compliance_rate: 0,
    treatment_effectiveness_rate: 0,
    kitchen_hygiene_rate: null,
    cleanliness_rate: null,
    product_safety_rate: 0,
    staff_training_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computePestControlHygieneCompliance(
  input: PestControlInput,
): PestControlResult {
  const {
    today,
    total_children,
    pest_inspection_records,
    treatment_records,
    kitchen_hygiene_records,
    cleanliness_rating_records,
    product_safety_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    pest_inspection_records.length === 0 &&
    treatment_records.length === 0 &&
    kitchen_hygiene_records.length === 0 &&
    cleanliness_rating_records.length === 0 &&
    product_safety_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess pest control and hygiene compliance.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No pest control or hygiene compliance data recorded despite children on placement -- pest inspection schedules, kitchen hygiene audits, environmental cleanliness, and product safety require urgent attention.",
      ),
      concerns: [
        "No pest inspection, treatment, kitchen hygiene, cleanliness, or product safety records exist despite children being on placement -- the home cannot evidence a safe and hygienic living environment.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured pest inspection schedules, kitchen hygiene auditing, environmental cleanliness assessments, and product safety registers to evidence the home's commitment to a safe and hygienic environment for children.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 -- Premises (maintained to a high standard)",
        },
        {
          rank: 2,
          recommendation:
            "Commission an immediate pest control survey and environmental health assessment of all premises areas to identify any existing issues and establish baseline standards for ongoing monitoring.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 -- Premises; SCCIF Safety",
        },
      ],
      insights: [
        {
          text: "The complete absence of pest control and hygiene compliance records means Ofsted cannot verify that the premises are maintained to the required standard. This represents a fundamental gap in Reg 25 compliance and the home's duty to provide a safe, hygienic living environment.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // === 1. Pest Inspection Compliance ===

  const totalInspections = pest_inspection_records.length;
  const completedOnTime = pest_inspection_records.filter((r) => r.completed_on_time).length;
  const inspectionComplianceRate = pct(completedOnTime, totalInspections);

  const reportsFiled = pest_inspection_records.filter((r) => r.report_filed).length;
  const reportFilingRate = pct(reportsFiled, totalInspections);

  const inspectionsWithFollowUp = pest_inspection_records.filter((r) => r.follow_up_required).length;
  const followUpCompleted = pest_inspection_records.filter(
    (r) => r.follow_up_required && r.follow_up_completed,
  ).length;
  const inspectionFollowUpRate = pct(followUpCompleted, inspectionsWithFollowUp);

  const childAreasAffected = pest_inspection_records.filter(
    (r) => r.children_areas_affected,
  ).length;
  const childAreaAffectedRate = pct(childAreasAffected, totalInspections);

  const highSeverityInspections = pest_inspection_records.filter(
    (r) => r.severity === "high" || r.severity === "critical",
  ).length;
  const highSeverityRate = pct(highSeverityInspections, totalInspections);

  const overdueInspections = pest_inspection_records.filter((r) => {
    if (!r.next_inspection_date) return false;
    return r.next_inspection_date < today;
  }).length;
  const overdueInspectionRate = pct(overdueInspections, totalInspections);

  // === 2. Treatment Effectiveness ===

  const totalTreatments = treatment_records.length;
  const effectiveTreatments = treatment_records.filter((r) => r.treatment_effective).length;
  const treatmentEffectivenessRate = pct(effectiveTreatments, totalTreatments);

  const childSafeTreatments = treatment_records.filter((r) => r.product_child_safe).length;
  const treatmentChildSafetyRate = pct(childSafeTreatments, totalTreatments);

  const coshhCompliantTreatments = treatment_records.filter((r) => r.coshh_compliant).length;
  const treatmentCoshhRate = pct(coshhCompliantTreatments, totalTreatments);

  const reEntryTimeObserved = treatment_records.filter(
    (r) => r.re_entry_time_observed,
  ).length;
  const reEntryComplianceRate = pct(reEntryTimeObserved, totalTreatments);

  const contractorCertified = treatment_records.filter(
    (r) => r.contractor_certified,
  ).length;
  const contractorWithName = treatment_records.filter(
    (r) => r.contractor_name && r.contractor_name.length > 0,
  ).length;
  const contractorCertificationRate = pct(
    contractorCertified,
    contractorWithName > 0 ? contractorWithName : totalTreatments,
  );

  const followUpTreatmentRequired = treatment_records.filter(
    (r) => r.follow_up_treatment_required,
  ).length;
  const followUpTreatmentCompleted = treatment_records.filter(
    (r) => r.follow_up_treatment_required && r.follow_up_treatment_completed,
  ).length;
  const treatmentFollowUpRate = pct(followUpTreatmentCompleted, followUpTreatmentRequired);

  // === 3. Kitchen Hygiene ===

  const totalKitchenAudits = kitchen_hygiene_records.length;
  const kitchenScoreSum = kitchen_hygiene_records.reduce(
    (sum, r) => sum + r.overall_score, 0,
  );
  const kitchenHygieneRate: number | null =
    totalKitchenAudits > 0
      ? Math.round(kitchenScoreSum / totalKitchenAudits)
      : null;

  const foodStorageCompliant = kitchen_hygiene_records.filter(
    (r) => r.food_storage_compliant,
  ).length;
  const foodStorageRate = pct(foodStorageCompliant, totalKitchenAudits);

  const tempMonitoringCompliant = kitchen_hygiene_records.filter(
    (r) => r.temperature_monitoring_compliant,
  ).length;
  const tempMonitoringRate = pct(tempMonitoringCompliant, totalKitchenAudits);

  const kitchenPestEvidence = kitchen_hygiene_records.filter(
    (r) => r.pest_evidence_found,
  ).length;
  const kitchenPestRate = pct(kitchenPestEvidence, totalKitchenAudits);

  const handHygieneCompliant = kitchen_hygiene_records.filter(
    (r) => r.hand_hygiene_compliant,
  ).length;
  const handHygieneRate = pct(handHygieneCompliant, totalKitchenAudits);

  const wasteManagementCompliant = kitchen_hygiene_records.filter(
    (r) => r.waste_management_compliant,
  ).length;
  const wasteManagementRate = pct(wasteManagementCompliant, totalKitchenAudits);


  const kitchenStaffTraining = kitchen_hygiene_records.filter(
    (r) => r.staff_training_current,
  ).length;
  const kitchenStaffTrainingRate = pct(kitchenStaffTraining, totalKitchenAudits);

  const allergenControls = kitchen_hygiene_records.filter(
    (r) => r.allergen_controls_in_place,
  ).length;
  const allergenControlRate = pct(allergenControls, totalKitchenAudits);

  const totalCorrectiveActionsKitchen = kitchen_hygiene_records.reduce(
    (sum, r) => sum + r.corrective_actions_raised, 0,
  );
  const closedCorrectiveActionsKitchen = kitchen_hygiene_records.reduce(
    (sum, r) => sum + r.corrective_actions_closed, 0,
  );
  const kitchenCorrectiveActionRate = pct(
    closedCorrectiveActionsKitchen, totalCorrectiveActionsKitchen,
  );

  const foodHygieneRatingSum = kitchen_hygiene_records.reduce(
    (sum, r) => sum + r.food_hygiene_rating, 0,
  );
  const averageFoodHygieneRating: number | null =
    totalKitchenAudits > 0
      ? Math.round((foodHygieneRatingSum / totalKitchenAudits) * 10) / 10
      : null;


  // === 4. Environmental Cleanliness ===

  const totalCleanlinessAssessments = cleanliness_rating_records.length;
  const cleanlinessScoreSum = cleanliness_rating_records.reduce(
    (sum, r) => sum + r.cleanliness_score, 0,
  );
  const averageCleanlinessScore: number | null =
    totalCleanlinessAssessments > 0
      ? Math.round((cleanlinessScoreSum / totalCleanlinessAssessments) * 10) / 10
      : null;
  const cleanlinessRate: number | null =
    totalCleanlinessAssessments > 0
      ? Math.round((averageCleanlinessScore! / 10) * 100)
      : null;

  const hygieneStandardMet = cleanliness_rating_records.filter(
    (r) => r.hygiene_standard_met,
  ).length;
  const hygieneStandardRate = pct(hygieneStandardMet, totalCleanlinessAssessments);

  const deepCleanCompleted = cleanliness_rating_records.filter(
    (r) => r.deep_clean_completed,
  ).length;
  const deepCleanCompletionRate = pct(deepCleanCompleted, totalCleanlinessAssessments);

  const deepCleanOverdue = cleanliness_rating_records.filter(
    (r) => r.deep_clean_overdue,
  ).length;
  const deepCleanOverdueRate = pct(deepCleanOverdue, totalCleanlinessAssessments);

  const infectionControlCompliant = cleanliness_rating_records.filter(
    (r) => r.infection_control_compliant,
  ).length;
  const infectionControlRate = pct(infectionControlCompliant, totalCleanlinessAssessments);

  const totalHazardsIdentified = cleanliness_rating_records.reduce(
    (sum, r) => sum + r.hazards_identified, 0,
  );
  const totalHazardsResolved = cleanliness_rating_records.reduce(
    (sum, r) => sum + r.hazards_resolved, 0,
  );
  const hazardResolutionRate = pct(totalHazardsResolved, totalHazardsIdentified);

  const dampMouldIssues = cleanliness_rating_records.filter(
    (r) => r.damp_mould_issues,
  ).length;
  const dampMouldRate = pct(dampMouldIssues, totalCleanlinessAssessments);

  const ventilationAdequate = cleanliness_rating_records.filter(
    (r) => r.ventilation_adequate,
  ).length;
  const ventilationRate = pct(ventilationAdequate, totalCleanlinessAssessments);

  const childInvolvedAssessment = cleanliness_rating_records.filter(
    (r) => r.child_involved_in_assessment,
  ).length;
  const childInvolvementRate = pct(childInvolvedAssessment, totalCleanlinessAssessments);

  const bedroomAssessments = cleanliness_rating_records.filter(
    (r) => r.area_type === "bedroom",
  );
  const bedroomScoreSum = bedroomAssessments.reduce(
    (sum, r) => sum + r.cleanliness_score, 0,
  );
  const bedroomCleanlinessAvg: number | null =
    bedroomAssessments.length > 0
      ? Math.round((bedroomScoreSum / bedroomAssessments.length) * 10) / 10
      : null;

  const bathroomAssessments = cleanliness_rating_records.filter(
    (r) => r.area_type === "bathroom",
  );
  const bathroomScoreSum = bathroomAssessments.reduce(
    (sum, r) => sum + r.cleanliness_score, 0,
  );
  const bathroomCleanlinessAvg: number | null =
    bathroomAssessments.length > 0
      ? Math.round((bathroomScoreSum / bathroomAssessments.length) * 10) / 10
      : null;

  const kitchenAreaAssessments = cleanliness_rating_records.filter(
    (r) => r.area_type === "kitchen",
  );
  const kitchenAreaScoreSum = kitchenAreaAssessments.reduce(
    (sum, r) => sum + r.cleanliness_score, 0,
  );
  const kitchenAreaCleanlinessAvg: number | null =
    kitchenAreaAssessments.length > 0
      ? Math.round((kitchenAreaScoreSum / kitchenAreaAssessments.length) * 10) / 10
      : null;

  // === 5. Product Safety ===

  const totalProducts = product_safety_records.length;
  const childSafeProducts = product_safety_records.filter(
    (r) => r.child_safe_certified,
  ).length;
  const productSafetyRate = pct(childSafeProducts, totalProducts);

  const coshhAssessmentCompleted = product_safety_records.filter(
    (r) => r.coshh_assessment_completed,
  ).length;
  const coshhAssessmentRate = pct(coshhAssessmentCompleted, totalProducts);

  const coshhSheetAvailable = product_safety_records.filter(
    (r) => r.coshh_sheet_available,
  ).length;
  const coshhSheetRate = pct(coshhSheetAvailable, totalProducts);

  const storedSecurely = product_safety_records.filter(
    (r) => r.stored_securely,
  ).length;
  const secureStorageRate = pct(storedSecurely, totalProducts);

  const lockedStorage = product_safety_records.filter(
    (r) => r.locked_storage,
  ).length;
  const lockedStorageRate = pct(lockedStorage, totalProducts);

  const inDateProducts = product_safety_records.filter(
    (r) => r.in_date,
  ).length;

  const staffTrainedOnProducts = product_safety_records.filter(
    (r) => r.staff_trained_on_use,
  ).length;
  const productStaffTrainingRate = pct(staffTrainedOnProducts, totalProducts);

  const expiredProducts = product_safety_records.filter(
    (r) => !r.in_date,
  ).length;
  const expiredProductRate = pct(expiredProducts, totalProducts);

  // === 6. Staff Training Composite ===

  const trainingNumerator =
    kitchenStaffTraining + staffTrainedOnProducts;
  const trainingDenominator =
    totalKitchenAudits + totalProducts;
  const staffTrainingRate = pct(trainingNumerator, trainingDenominator);

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: inspectionComplianceRate (>=90: +5, >=70: +2) ---
  if (inspectionComplianceRate >= 90) score += 5;
  else if (inspectionComplianceRate >= 70) score += 2;

  // --- Bonus 2: treatmentEffectivenessRate (>=90: +4, >=70: +2) ---
  if (treatmentEffectivenessRate >= 90) score += 4;
  else if (treatmentEffectivenessRate >= 70) score += 2;

  // --- Bonus 3: kitchenHygieneRate (>=85: +5, >=70: +2) ---
  if (meets(kitchenHygieneRate, 85)) score += 5;
  else if (meets(kitchenHygieneRate, 70)) score += 2;

  // --- Bonus 4: cleanlinessRate (>=85: +4, >=70: +2) ---
  if (meets(cleanlinessRate, 85)) score += 4;
  else if (meets(cleanlinessRate, 70)) score += 2;

  // --- Bonus 5: productSafetyRate (>=90: +4, >=70: +2) ---
  if (productSafetyRate >= 90) score += 4;
  else if (productSafetyRate >= 70) score += 2;

  // --- Bonus 6: staffTrainingRate (>=90: +3, >=70: +1) ---
  if (staffTrainingRate >= 90) score += 3;
  else if (staffTrainingRate >= 70) score += 1;

  // --- Bonus 7: kitchenCorrectiveActionRate (>=90: +3, >=70: +1) ---
  if (kitchenCorrectiveActionRate >= 90) score += 3;
  else if (kitchenCorrectiveActionRate >= 70) score += 1;

  // Total max bonuses = 5+4+5+4+4+3+3 = 28

  // -- Penalties (4 with guards) -------------------------------------------

  // inspectionComplianceRate < 50 -> -6
  if (inspectionComplianceRate < 50 && pest_inspection_records.length > 0) score -= 6;

  // below(kitchenHygieneRate, 50) -> -6
  if (below(kitchenHygieneRate, 50) && kitchen_hygiene_records.length > 0) score -= 6;

  // productSafetyRate < 50 -> -5
  if (productSafetyRate < 50 && product_safety_records.length > 0) score -= 5;

  // below(cleanlinessRate, 50) -> -5
  if (below(cleanlinessRate, 50) && cleanliness_rating_records.length > 0) score -= 5;

  score = clamp(score, 0, 100);

  const pest_control_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (inspectionComplianceRate >= 90 && totalInspections > 0) {
    strengths.push(
      `${inspectionComplianceRate}% of pest inspections completed on time -- the home demonstrates excellent adherence to pest inspection schedules, providing strong evidence of proactive premises management.`,
    );
  } else if (inspectionComplianceRate >= 70 && totalInspections > 0) {
    strengths.push(
      `${inspectionComplianceRate}% pest inspection compliance rate -- most inspections are completed on schedule.`,
    );
  }

  if (reportFilingRate >= 90 && totalInspections > 0) {
    strengths.push(
      `${reportFilingRate}% of pest inspection reports filed -- thorough documentation supports regulatory evidence.`,
    );
  }

  if (inspectionFollowUpRate >= 90 && inspectionsWithFollowUp > 0) {
    strengths.push(
      `${inspectionFollowUpRate}% of inspection follow-up actions completed -- the home responds promptly when pest issues are identified.`,
    );
  }

  if (treatmentEffectivenessRate >= 90 && totalTreatments > 0) {
    strengths.push(
      `${treatmentEffectivenessRate}% treatment effectiveness -- pest control treatments consistently achieve intended outcomes.`,
    );
  } else if (treatmentEffectivenessRate >= 70 && totalTreatments > 0) {
    strengths.push(
      `${treatmentEffectivenessRate}% treatment effectiveness -- the majority of treatments are effective.`,
    );
  }

  if (treatmentChildSafetyRate >= 90 && treatmentCoshhRate >= 90 && totalTreatments > 0) {
    strengths.push(
      `${treatmentChildSafetyRate}% child-safe products and ${treatmentCoshhRate}% COSHH compliance -- robust chemical safety in pest control.`,
    );
  } else if (treatmentChildSafetyRate >= 90 && totalTreatments > 0) {
    strengths.push(
      `${treatmentChildSafetyRate}% of treatments use child-safe products -- children's safety is prioritised.`,
    );
  }

  if (contractorCertificationRate >= 90 && contractorWithName > 0) {
    strengths.push(
      `${contractorCertificationRate}% of pest control contractors certified -- qualified professionals are used.`,
    );
  }

  if (meets(kitchenHygieneRate, 85) && totalKitchenAudits > 0) {
    strengths.push(
      `Kitchen hygiene audit scores average ${kitchenHygieneRate}% -- the kitchen maintains excellent hygiene standards, providing a safe food preparation environment.`,
    );
  } else if (meets(kitchenHygieneRate, 70) && totalKitchenAudits > 0) {
    strengths.push(
      `Kitchen hygiene rate at ${kitchenHygieneRate}% -- good kitchen hygiene standards are maintained.`,
    );
  }

  if (meets(averageFoodHygieneRating, 4.0) && totalKitchenAudits > 0) {
    strengths.push(
      `Average food hygiene rating of ${averageFoodHygieneRating}/5 -- strong food hygiene standards are evidenced.`,
    );
  }

  if (foodStorageRate >= 90 && tempMonitoringRate >= 90 && totalKitchenAudits > 0) {
    strengths.push(
      `Food storage (${foodStorageRate}%) and temperature monitoring (${tempMonitoringRate}%) both compliant -- proper storage and temperature control prevent foodborne illness.`,
    );
  }

  if (handHygieneRate >= 90 && totalKitchenAudits > 0) {
    strengths.push(
      `Hand hygiene compliant in ${handHygieneRate}% of audits -- excellent hand hygiene practice reduces infection risk.`,
    );
  }

  if (allergenControlRate >= 90 && totalKitchenAudits > 0) {
    strengths.push(
      `Allergen controls in place for ${allergenControlRate}% of audits -- strong allergen awareness and management.`,
    );
  }

  if (kitchenCorrectiveActionRate >= 90 && totalCorrectiveActionsKitchen > 0) {
    strengths.push(
      `${kitchenCorrectiveActionRate}% of kitchen corrective actions closed -- audit findings are systematically resolved.`,
    );
  }

  if (meets(cleanlinessRate, 85) && totalCleanlinessAssessments > 0) {
    strengths.push(
      `Environmental cleanliness at ${cleanlinessRate}% (avg ${averageCleanlinessScore}/10) -- excellent hygiene standards across all areas.`,
    );
  } else if (meets(cleanlinessRate, 70) && totalCleanlinessAssessments > 0) {
    strengths.push(
      `Environmental cleanliness at ${cleanlinessRate}% -- good cleanliness standards maintained.`,
    );
  }

  if (infectionControlRate >= 90 && totalCleanlinessAssessments > 0) {
    strengths.push(
      `Infection control compliant in ${infectionControlRate}% of assessments -- strong infection prevention.`,
    );
  }

  if (hazardResolutionRate >= 90 && totalHazardsIdentified > 0) {
    strengths.push(
      `${hazardResolutionRate}% of environmental hazards resolved -- identified hazards are promptly addressed.`,
    );
  }

  if (productSafetyRate >= 90 && totalProducts > 0) {
    strengths.push(
      `${productSafetyRate}% of products are child-safe certified -- the home prioritises child safety in product selection.`,
    );
  } else if (productSafetyRate >= 70 && totalProducts > 0) {
    strengths.push(
      `${productSafetyRate}% product safety rate -- good progress in ensuring products used in the home are child-safe.`,
    );
  }

  if (secureStorageRate >= 90 && lockedStorageRate >= 90 && totalProducts > 0) {
    strengths.push(
      `${secureStorageRate}% secure storage with ${lockedStorageRate}% locked -- hazardous substances are properly secured away from children.`,
    );
  } else if (secureStorageRate >= 90 && totalProducts > 0) {
    strengths.push(
      `${secureStorageRate}% of products stored securely -- hazardous substances are kept safely away from children.`,
    );
  }

  if (coshhAssessmentRate >= 90 && totalProducts > 0) {
    strengths.push(
      `COSHH assessments completed for ${coshhAssessmentRate}% of products -- comprehensive chemical safety documentation.`,
    );
  }

  if (staffTrainingRate >= 90 && trainingDenominator > 0) {
    strengths.push(
      `Composite staff training rate at ${staffTrainingRate}% -- staff are well trained in both kitchen hygiene and product safety.`,
    );
  }

  if (kitchenPestRate === 0 && totalKitchenAudits > 0) {
    strengths.push(
      "No pest evidence found in any kitchen hygiene audit -- the kitchen environment is pest-free.",
    );
  }

  if (deepCleanOverdueRate === 0 && totalCleanlinessAssessments > 0 && deepCleanCompleted > 0) {
    strengths.push(
      "No overdue deep cleans -- all deep cleaning schedules are up to date.",
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (inspectionComplianceRate < 50 && totalInspections > 0) {
    concerns.push(
      `Only ${inspectionComplianceRate}% of pest inspections completed on time -- the majority of scheduled inspections are overdue or missed, leaving the home unable to evidence proactive pest management.`,
    );
  } else if (inspectionComplianceRate < 70 && inspectionComplianceRate >= 50 && totalInspections > 0) {
    concerns.push(
      `Pest inspection compliance at ${inspectionComplianceRate}% -- a significant proportion of inspections are not completed on schedule.`,
    );
  }

  if (highSeverityRate >= 20 && totalInspections > 0) {
    concerns.push(
      `${highSeverityRate}% of inspections identified high/critical severity issues -- persistent serious pest problems indicate inadequate prevention.`,
    );
  }

  if (inspectionFollowUpRate < 50 && inspectionsWithFollowUp > 0) {
    concerns.push(
      `Only ${inspectionFollowUpRate}% of inspection follow-ups completed -- identified pest issues are not being resolved.`,
    );
  }

  if (reportFilingRate < 70 && totalInspections > 0) {
    concerns.push(
      `Only ${reportFilingRate}% of pest inspection reports filed -- incomplete documentation undermines regulatory evidence.`,
    );
  }

  if (treatmentEffectivenessRate < 50 && totalTreatments > 0) {
    concerns.push(
      `Only ${treatmentEffectivenessRate}% of pest treatments effective -- inadequate pest management strategy.`,
    );
  } else if (treatmentEffectivenessRate < 70 && treatmentEffectivenessRate >= 50 && totalTreatments > 0) {
    concerns.push(
      `Treatment effectiveness at ${treatmentEffectivenessRate}% -- a significant proportion of treatments are not fully effective.`,
    );
  }

  if (treatmentChildSafetyRate < 70 && totalTreatments > 0) {
    concerns.push(
      `Only ${treatmentChildSafetyRate}% of treatments use child-safe products -- posing direct risk to children's health.`,
    );
  }

  if (treatmentCoshhRate < 70 && totalTreatments > 0) {
    concerns.push(
      `COSHH compliance at only ${treatmentCoshhRate}% for pest treatments -- chemical safety management is insufficient.`,
    );
  }

  if (treatmentFollowUpRate < 50 && followUpTreatmentRequired > 0) {
    concerns.push(
      `Only ${treatmentFollowUpRate}% of follow-up treatments completed -- incomplete cycles allow pest problems to recur.`,
    );
  }

  if (below(kitchenHygieneRate, 50) && totalKitchenAudits > 0) {
    concerns.push(
      `Kitchen hygiene rate at only ${kitchenHygieneRate}% -- kitchen hygiene standards are fundamentally inadequate, posing serious food safety risks to children.`,
    );
  } else if (below(kitchenHygieneRate, 70) && meets(kitchenHygieneRate, 50) && totalKitchenAudits > 0) {
    concerns.push(
      `Kitchen hygiene rate at ${kitchenHygieneRate}% -- kitchen hygiene standards need significant improvement.`,
    );
  }

  if (kitchenPestRate >= 20 && totalKitchenAudits > 0) {
    concerns.push(
      `Pest evidence found in ${kitchenPestRate}% of kitchen hygiene audits -- pest contamination in food preparation areas is a serious health risk.`,
    );
  }

  if (below(averageFoodHygieneRating, 3.0) && totalKitchenAudits > 0) {
    concerns.push(
      `Average food hygiene rating of only ${averageFoodHygieneRating}/5 -- the home's food hygiene standards are below acceptable levels.`,
    );
  }

  if (foodStorageRate < 70 && totalKitchenAudits > 0) {
    concerns.push(
      `Food storage compliant in only ${foodStorageRate}% of audits -- improper storage increases contamination risk.`,
    );
  }

  if (handHygieneRate < 70 && totalKitchenAudits > 0) {
    concerns.push(
      `Hand hygiene compliant in only ${handHygieneRate}% of audits -- poor hand hygiene increases infection risk.`,
    );
  }

  if (wasteManagementRate < 70 && totalKitchenAudits > 0) {
    concerns.push(
      `Waste management compliant in only ${wasteManagementRate}% of audits -- poor waste management attracts pests and compromises hygiene.`,
    );
  }

  if (below(cleanlinessRate, 50) && totalCleanlinessAssessments > 0) {
    concerns.push(
      `Environmental cleanliness rate at only ${cleanlinessRate}% -- the home's living environment is not maintained to an acceptable standard.`,
    );
  } else if (below(cleanlinessRate, 70) && meets(cleanlinessRate, 50) && totalCleanlinessAssessments > 0) {
    concerns.push(
      `Environmental cleanliness rate at ${cleanlinessRate}% -- cleanliness standards across the home need improvement.`,
    );
  }

  if (hygieneStandardRate < 70 && totalCleanlinessAssessments > 0) {
    concerns.push(
      `Hygiene standards met in only ${hygieneStandardRate}% of area assessments -- many areas of the home do not meet required hygiene benchmarks.`,
    );
  }

  if (dampMouldRate >= 20 && totalCleanlinessAssessments > 0) {
    concerns.push(
      `Damp or mould in ${dampMouldRate}% of areas -- damp and mould pose respiratory health risks and indicate poor environmental management.`,
    );
  }

  if (ventilationRate < 70 && totalCleanlinessAssessments > 0) {
    concerns.push(
      `Ventilation adequate in only ${ventilationRate}% of areas -- poor ventilation leads to damp, mould, and unhealthy air quality.`,
    );
  }

  if (infectionControlRate < 70 && totalCleanlinessAssessments > 0) {
    concerns.push(
      `Infection control compliant in only ${infectionControlRate}% of assessments -- inadequate infection prevention increases health risks.`,
    );
  }

  if (hazardResolutionRate < 50 && totalHazardsIdentified > 0) {
    concerns.push(
      `Only ${hazardResolutionRate}% of environmental hazards resolved -- unresolved hazards pose ongoing safety risks to children.`,
    );
  }

  if (productSafetyRate < 50 && totalProducts > 0) {
    concerns.push(
      `Only ${productSafetyRate}% of products are child-safe certified -- most products are not safe for use around children.`,
    );
  } else if (productSafetyRate < 70 && productSafetyRate >= 50 && totalProducts > 0) {
    concerns.push(
      `Product safety rate at ${productSafetyRate}% -- a significant proportion are not child-safe certified.`,
    );
  }

  if (secureStorageRate < 70 && totalProducts > 0) {
    concerns.push(
      `Only ${secureStorageRate}% of products stored securely -- hazardous substances may be accessible to children.`,
    );
  }

  if (coshhAssessmentRate < 70 && totalProducts > 0) {
    concerns.push(
      `COSHH assessments completed for only ${coshhAssessmentRate}% of products -- incomplete chemical safety documentation.`,
    );
  }

  if (expiredProductRate >= 20 && totalProducts > 0) {
    concerns.push(
      `${expiredProductRate}% of products are expired -- may be ineffective or pose safety risks.`,
    );
  }

  if (staffTrainingRate < 50 && trainingDenominator > 0) {
    concerns.push(
      `Composite staff training rate at only ${staffTrainingRate}% -- staff lack adequate training in kitchen hygiene and product safety.`,
    );
  }

  if (totalInspections === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No pest inspection records despite children on placement -- no evidence of pest monitoring.",
    );
  }

  if (totalKitchenAudits === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No kitchen hygiene audit records -- kitchen hygiene standards are not evidenced.",
    );
  }

  if (totalCleanlinessAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No environmental cleanliness assessments -- living areas are not regularly assessed.",
    );
  }

  if (totalProducts === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No product safety records -- no evidence of COSHH compliance or child-safe product management.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: PestControlRecommendation[] = [];
  let rank = 0;

  if (inspectionComplianceRate < 50 && totalInspections > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently establish and adhere to a pest inspection schedule -- every scheduled inspection must be completed on time with a full report filed. Consider engaging a professional pest control contractor for regular inspections.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (maintained to a high standard)",
    });
  }

  if (below(kitchenHygieneRate, 50) && totalKitchenAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately address kitchen hygiene failures -- conduct a comprehensive kitchen deep clean and implement daily hygiene monitoring. Ensure food storage, temperature control, hand hygiene, and waste management all meet required standards.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; Food Safety Act 1990",
    });
  }

  if (productSafetyRate < 50 && totalProducts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently audit all cleaning and pest control products -- replace non-child-safe products with certified alternatives, complete COSHH assessments for all products, and ensure all substances are stored in locked cabinets inaccessible to children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; COSHH Regulations 2002",
    });
  }

  if (below(cleanlinessRate, 50) && totalCleanlinessAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve environmental cleanliness across all areas -- implement a structured cleaning schedule with daily, weekly, and deep-clean cycles. Address any damp, mould, ventilation, and odour issues immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (maintained to a high standard)",
    });
  }

  if (kitchenPestRate >= 20 && totalKitchenAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address pest contamination in kitchen areas as a matter of urgency -- engage professional pest control, implement preventive measures, and conduct daily kitchen pest checks until the issue is resolved.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; Food Safety Act 1990",
    });
  }

  if (highSeverityRate >= 20 && totalInspections > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate causes of high/critical severity pest findings -- commission a specialist risk assessment and implement an integrated pest management plan.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; SCCIF Safety",
    });
  }

  if (treatmentChildSafetyRate < 70 && totalTreatments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Switch to child-safe pest control products for all treatments -- every product used in a children's home must be safe for children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; COSHH Regulations 2002",
    });
  }

  if (secureStorageRate < 70 && totalProducts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all cleaning chemicals and pest control products are stored in locked cabinets -- unsecured hazardous substances are a direct safeguarding risk.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; COSHH Regulations 2002",
    });
  }

  if (dampMouldRate >= 20 && totalCleanlinessAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address damp and mould issues across the home -- commission a damp survey, repair affected areas, improve ventilation, and monitor for recurrence. Damp and mould pose respiratory health risks to children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; Housing Health and Safety Rating System",
    });
  }

  if (treatmentEffectivenessRate < 70 && treatmentEffectivenessRate >= 50 && totalTreatments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review pest treatment methods and consider engaging specialist contractors -- low treatment effectiveness suggests current approaches may not be appropriate for the pest types present.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (inspectionComplianceRate >= 50 && inspectionComplianceRate < 70 && totalInspections > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve pest inspection compliance to at least 70% -- review scheduling, staff allocation, and contractor availability to ensure inspections are completed on time.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (meets(kitchenHygieneRate, 50) && below(kitchenHygieneRate, 70) && totalKitchenAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve kitchen hygiene standards to at least 70% -- focus on areas of non-compliance including food storage, temperature monitoring, hand hygiene, and cleaning schedules.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; Food Safety Act 1990",
    });
  }

  if (meets(cleanlinessRate, 50) && below(cleanlinessRate, 70) && totalCleanlinessAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve environmental cleanliness to at least 70% -- review cleaning schedules, increase deep-clean frequency, and address any areas consistently scoring below standard.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (coshhAssessmentRate < 70 && totalProducts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete COSHH assessments for all cleaning and pest control products -- every substance used in the home must have a current COSHH assessment with safety data sheets readily accessible.",
      urgency: "soon",
      regulatory_ref: "COSHH Regulations 2002",
    });
  }

  if (productStaffTrainingRate < 70 && totalProducts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train all staff on the safe use of cleaning and pest control products -- training should cover COSHH requirements, first aid measures, and child safety considerations.",
      urgency: "soon",
      regulatory_ref: "COSHH Regulations 2002; CHR 2015 Reg 5",
    });
  }

  if (productSafetyRate >= 50 && productSafetyRate < 70 && totalProducts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child-safe product usage to at least 70% -- audit current product inventory and identify child-safe alternatives for all non-certified products.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; COSHH Regulations 2002",
    });
  }

  if (childInvolvementRate < 30 && totalCleanlinessAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children in environmental cleanliness assessments where age-appropriate -- this supports their sense of ownership over their living environment.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (ventilationRate < 70 && totalCleanlinessAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve ventilation across the home -- ensure adequate airflow to prevent damp, mould, and stale air. Consider extractor fans or improved window ventilation.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; Building Regulations",
    });
  }

  if (totalInspections === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission an initial pest control survey and establish a regular inspection schedule to evidence active pest risk monitoring.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (totalKitchenAudits === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a kitchen hygiene auditing programme covering food storage, temperature monitoring, cleaning schedules, and pest prevention.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises; Food Safety Act 1990",
    });
  }

  if (totalCleanlinessAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement structured environmental cleanliness assessments across all areas -- at least weekly, covering hygiene standards and infection control.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (totalProducts === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create a product safety register for all cleaning and pest control substances -- include COSHH assessments, child-safe certifications, and staff training records.",
      urgency: "immediate",
      regulatory_ref: "COSHH Regulations 2002; CHR 2015 Reg 25",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: PestControlInsight[] = [];

  // --- Critical insights ---

  if (inspectionComplianceRate < 50 && totalInspections > 0) {
    insights.push({
      text: `Only ${inspectionComplianceRate}% of pest inspections completed on time. Ofsted will view the failure to maintain a pest inspection schedule as evidence that the home does not adequately manage premises safety -- a direct failure under Reg 25.`,
      severity: "critical",
    });
  }

  if (below(kitchenHygieneRate, 50) && totalKitchenAudits > 0) {
    insights.push({
      text: `Kitchen hygiene rate at only ${kitchenHygieneRate}%. Fundamentally inadequate kitchen hygiene poses serious food safety risks to children. Ofsted and EHO will view this as a significant premises failure under Reg 25 and a potential safeguarding concern.`,
      severity: "critical",
    });
  }

  if (productSafetyRate < 50 && totalProducts > 0) {
    insights.push({
      text: `Only ${productSafetyRate}% of products are child-safe certified. Using non-child-safe cleaning and pest control products in a children's home represents a direct risk to children's health and safety. This is a COSHH compliance failure and a Reg 25 concern.`,
      severity: "critical",
    });
  }

  if (below(cleanlinessRate, 50) && totalCleanlinessAssessments > 0) {
    insights.push({
      text: `Environmental cleanliness at only ${cleanlinessRate}%. The home's living environment does not meet acceptable hygiene standards. Ofsted will view this as evidence that premises are not maintained to a high standard as required by Reg 25.`,
      severity: "critical",
    });
  }

  if (kitchenPestRate >= 30 && totalKitchenAudits > 0) {
    insights.push({
      text: `Pest evidence found in ${kitchenPestRate}% of kitchen audits. Pest contamination in food preparation areas is a serious public health risk that requires immediate professional intervention and may trigger Environmental Health enforcement action.`,
      severity: "critical",
    });
  }


  if (secureStorageRate < 50 && totalProducts > 0) {
    insights.push({
      text: `Only ${secureStorageRate}% of products stored securely. Unsecured hazardous substances represent a direct safeguarding risk -- children could access harmful chemicals.`,
      severity: "critical",
    });
  }

  if (dampMouldRate >= 30 && totalCleanlinessAssessments > 0) {
    insights.push({
      text: `Damp or mould identified in ${dampMouldRate}% of areas. Widespread damp and mould pose respiratory health risks and indicate systemic environmental management failures.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (inspectionComplianceRate >= 50 && inspectionComplianceRate < 70 && totalInspections > 0) {
    insights.push({
      text: `Pest inspection compliance at ${inspectionComplianceRate}% -- improving but some inspections are not completed on schedule. Each missed inspection represents a gap in pest risk monitoring.`,
      severity: "warning",
    });
  }

  if (meets(kitchenHygieneRate, 50) && below(kitchenHygieneRate, 70) && totalKitchenAudits > 0) {
    insights.push({
      text: `Kitchen hygiene at ${kitchenHygieneRate}% -- standards need improvement to ensure consistent food safety for children.`,
      severity: "warning",
    });
  }

  if (meets(cleanlinessRate, 50) && below(cleanlinessRate, 70) && totalCleanlinessAssessments > 0) {
    insights.push({
      text: `Environmental cleanliness at ${cleanlinessRate}% -- cleanliness standards are below the level expected for a well-maintained children's home. Targeted cleaning improvements are needed.`,
      severity: "warning",
    });
  }

  if (productSafetyRate >= 50 && productSafetyRate < 70 && totalProducts > 0) {
    insights.push({
      text: `Product safety rate at ${productSafetyRate}% -- a significant proportion of products are not child-safe certified. In a children's home, all products should ideally be child-safe.`,
      severity: "warning",
    });
  }

  if (staffTrainingRate >= 50 && staffTrainingRate < 70 && trainingDenominator > 0) {
    insights.push({
      text: `Composite staff training rate at ${staffTrainingRate}% -- gaps in kitchen hygiene and product safety training increase the risk of hygiene failures and unsafe product use.`,
      severity: "warning",
    });
  }


  if (expiredProductRate >= 10 && totalProducts > 0) {
    insights.push({
      text: `${expiredProductRate}% of products are expired -- expired products may be less effective or harmful. Implement stock rotation and expiry monitoring.`,
      severity: "warning",
    });
  }


  // --- Positive insights ---

  if (pest_control_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding pest control and hygiene compliance -- premises are maintained to a high standard with robust inspection schedules, effective treatments, excellent kitchen hygiene, and comprehensive product safety management. This is strong evidence for Reg 25 compliance.",
      severity: "positive",
    });
  }

  if (inspectionComplianceRate >= 90 && treatmentEffectivenessRate >= 90 && totalInspections > 0 && totalTreatments > 0) {
    insights.push({
      text: `${inspectionComplianceRate}% inspection compliance with ${treatmentEffectivenessRate}% treatment effectiveness -- the home operates an exemplary pest management system. Inspections are timely and treatments are effective, providing strong evidence of proactive premises management.`,
      severity: "positive",
    });
  }

  if (meets(kitchenHygieneRate, 85) && kitchenPestRate === 0 && totalKitchenAudits > 0) {
    insights.push({
      text: `Kitchen hygiene rate at ${kitchenHygieneRate}% with zero pest evidence -- the kitchen maintains excellent hygiene standards and is pest-free. This demonstrates the home's commitment to food safety and environmental health.`,
      severity: "positive",
    });
  }

  if (meets(cleanlinessRate, 85) && infectionControlRate >= 90 && totalCleanlinessAssessments > 0) {
    insights.push({
      text: `Environmental cleanliness at ${cleanlinessRate}% with ${infectionControlRate}% infection control compliance -- the home maintains excellent environmental hygiene standards with robust infection prevention practices.`,
      severity: "positive",
    });
  }

  if (productSafetyRate >= 90 && secureStorageRate >= 90 && totalProducts > 0) {
    insights.push({
      text: `${productSafetyRate}% child-safe products with ${secureStorageRate}% secure storage -- the home demonstrates exemplary chemical safety management. Products are child-safe, properly stored, and staff are trained in their use.`,
      severity: "positive",
    });
  }

  if (staffTrainingRate >= 90 && trainingDenominator > 0) {
    insights.push({
      text: `Composite staff training rate at ${staffTrainingRate}% -- staff are well trained in kitchen hygiene and product safety.`,
      severity: "positive",
    });
  }

  if (treatmentChildSafetyRate >= 90 && treatmentCoshhRate >= 90 && totalTreatments > 0) {
    insights.push({
      text: `${treatmentChildSafetyRate}% child-safe treatments with ${treatmentCoshhRate}% COSHH compliance -- pest control operations prioritise children's safety.`,
      severity: "positive",
    });
  }

  // -- Area-specific insights ---

  if (above(bedroomCleanlinessAvg, 0) && below(bedroomCleanlinessAvg, 5) && bedroomAssessments.length > 0) {
    insights.push({
      text: `Bedroom cleanliness averages only ${bedroomCleanlinessAvg}/10 -- children's personal spaces are not maintained to an acceptable standard, affecting comfort and dignity.`,
      severity: "warning",
    });
  }

  if (above(bathroomCleanlinessAvg, 0) && below(bathroomCleanlinessAvg, 5) && bathroomAssessments.length > 0) {
    insights.push({
      text: `Bathroom cleanliness averages only ${bathroomCleanlinessAvg}/10 -- poor bathroom hygiene poses infection risks and affects children's dignity.`,
      severity: "critical",
    });
  }

  if (above(kitchenAreaCleanlinessAvg, 0) && below(kitchenAreaCleanlinessAvg, 5) && kitchenAreaAssessments.length > 0) {
    insights.push({
      text: `Kitchen area cleanliness averages only ${kitchenAreaCleanlinessAvg}/10 -- a poorly maintained kitchen increases food contamination and pest risks.`,
      severity: "critical",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (pest_control_rating === "outstanding") {
    headline =
      "Outstanding pest control and hygiene compliance -- premises are maintained to a high standard with robust inspection schedules, effective treatments, and comprehensive product safety management.";
  } else if (pest_control_rating === "good") {
    headline = `Good pest control and hygiene compliance -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (pest_control_rating === "adequate") {
    headline = `Adequate pest control and hygiene compliance -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure premises meet required standards.`;
  } else {
    headline = `Pest control and hygiene compliance is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children live in a safe, hygienic environment.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    pest_control_rating,
    pest_control_score: score,
    headline,
    inspection_compliance_rate: inspectionComplianceRate,
    treatment_effectiveness_rate: treatmentEffectivenessRate,
    kitchen_hygiene_rate: kitchenHygieneRate,
    cleanliness_rate: cleanlinessRate,
    product_safety_rate: productSafetyRate,
    staff_training_rate: staffTrainingRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

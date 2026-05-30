// ==============================================================================
// CORNERSTONE -- HOME SHARPS DISPOSAL & HAZARDOUS WASTE INTELLIGENCE ENGINE
// Monitors sharps bin compliance, hazardous waste disposal, COSHH compliance,
// clinical waste management, child safety awareness, and staff training in
// hazardous materials handling within the children's home setting.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 25 (Premises -- safe, well maintained, appropriately
// located), Reg 14 (Care and control -- safe environment), SCCIF Safety.
// Store keys: sharpsBinRecords, hazardousWasteRecords, coshhRecords,
//             clinicalWasteRecords, childSafetyRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface SharpsBinRecordInput {
  id: string;
  location: string;
  bin_type: "standard" | "large" | "community" | "wall_mounted" | "portable" | "other";
  is_locked: boolean;
  is_labelled: boolean;
  fill_level: "empty" | "quarter" | "half" | "three_quarter" | "full" | "overfull";
  last_inspection_date: string;
  inspection_passed: boolean;
  disposal_date: string | null;
  disposal_method: "licensed_contractor" | "pharmacy_return" | "nhs_collection" | "internal_process" | "unknown" | "none";
  disposal_documented: boolean;
  tamper_evident_seal: boolean;
  accessible_to_children: boolean;
  staff_member_responsible: string;
  issues_found: string[];
  corrective_action_taken: boolean;
  next_collection_date: string | null;
  created_at: string;
}

export interface HazardousWasteRecordInput {
  id: string;
  waste_type: "chemical" | "pharmaceutical" | "biological" | "radioactive" | "cytotoxic" | "flammable" | "corrosive" | "other";
  substance_name: string;
  quantity: string;
  storage_location: string;
  storage_compliant: boolean;
  labelling_correct: boolean;
  containment_intact: boolean;
  disposal_date: string | null;
  disposal_method: "licensed_contractor" | "specialist_collection" | "incineration" | "chemical_treatment" | "pending" | "other";
  disposal_documented: boolean;
  consignment_note_present: boolean;
  risk_assessment_completed: boolean;
  staff_handling_trained: boolean;
  spill_kit_available: boolean;
  ppe_available: boolean;
  incidents_reported: number;
  incidents_resolved: number;
  created_at: string;
}

export interface CoshhRecordInput {
  id: string;
  substance_name: string;
  substance_category: "cleaning" | "laundry" | "gardening" | "maintenance" | "medical" | "kitchen" | "art_craft" | "pest_control" | "other";
  coshh_assessment_completed: boolean;
  coshh_assessment_date: string | null;
  coshh_assessment_review_date: string | null;
  data_sheet_available: boolean;
  storage_locked: boolean;
  storage_location_appropriate: boolean;
  labelling_compliant: boolean;
  first_aid_measures_documented: boolean;
  ppe_requirements_documented: boolean;
  ppe_available: boolean;
  staff_trained: boolean;
  accessible_to_children: boolean;
  risk_level: "low" | "medium" | "high" | "very_high";
  incidents_reported: number;
  incidents_resolved: number;
  last_audit_date: string | null;
  created_at: string;
}

export interface ClinicalWasteRecordInput {
  id: string;
  waste_category: "offensive" | "infectious" | "medicinal" | "anatomical" | "sharps" | "cytotoxic" | "other";
  waste_stream_colour: "orange" | "yellow" | "purple" | "red" | "black" | "other";
  segregation_correct: boolean;
  container_type_correct: boolean;
  container_sealed: boolean;
  labelling_correct: boolean;
  storage_location_secure: boolean;
  storage_temperature_compliant: boolean;
  collection_frequency: "daily" | "weekly" | "fortnightly" | "monthly" | "as_needed" | "unknown";
  collection_on_schedule: boolean;
  contractor_licensed: boolean;
  duty_of_care_transfer_note: boolean;
  weight_recorded: boolean;
  disposed_quantity: string;
  staff_handling_trained: boolean;
  ppe_worn: boolean;
  spillage_incidents: number;
  spillage_incidents_managed: number;
  created_at: string;
}

export interface ChildSafetyRecordInput {
  id: string;
  child_id: string;
  awareness_session_date: string | null;
  awareness_topic: "sharps_safety" | "chemical_safety" | "waste_handling" | "medication_safety" | "general_hazard" | "spill_response" | "fire_chemical" | "other";
  session_completed: boolean;
  child_understood: boolean;
  age_appropriate_materials: boolean;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  hazard_reported_by_child: boolean;
  child_knows_reporting_process: boolean;
  risk_assessment_includes_child: boolean;
  incidents_involving_child: number;
  incidents_resolved: number;
  near_misses_reported: number;
  safeguarding_concerns_raised: number;
  created_at: string;
}

export interface SharpsDisposalHazardousWasteInput {
  today: string;
  total_children: number;
  sharps_bin_records: SharpsBinRecordInput[];
  hazardous_waste_records: HazardousWasteRecordInput[];
  coshh_records: CoshhRecordInput[];
  clinical_waste_records: ClinicalWasteRecordInput[];
  child_safety_records: ChildSafetyRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type SharpsDisposalRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SharpsDisposalInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SharpsDisposalRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SharpsDisposalHazardousWasteResult {
  sharps_rating: SharpsDisposalRating;
  sharps_score: number;
  headline: string;
  sharps_bin_rate: number;
  hazardous_waste_rate: number;
  coshh_compliance_rate: number;
  clinical_waste_rate: number;
  child_safety_rate: number;
  staff_training_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: SharpsDisposalRecommendation[];
  insights: SharpsDisposalInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SharpsDisposalRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: SharpsDisposalRating,
  score: number,
  headline: string,
): SharpsDisposalHazardousWasteResult {
  return {
    sharps_rating: rating,
    sharps_score: score,
    headline,
    sharps_bin_rate: 0,
    hazardous_waste_rate: 0,
    coshh_compliance_rate: 0,
    clinical_waste_rate: 0,
    child_safety_rate: 0,
    staff_training_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeSharpsDisposalHazardousWaste(
  input: SharpsDisposalHazardousWasteInput,
): SharpsDisposalHazardousWasteResult {
  const {
    total_children,
    sharps_bin_records,
    hazardous_waste_records,
    coshh_records,
    clinical_waste_records,
    child_safety_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    sharps_bin_records.length === 0 &&
    hazardous_waste_records.length === 0 &&
    coshh_records.length === 0 &&
    clinical_waste_records.length === 0 &&
    child_safety_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess sharps disposal and hazardous waste compliance.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No sharps disposal or hazardous waste records despite children on placement -- sharps bin compliance, COSHH management, clinical waste handling, and child safety awareness require urgent attention.",
      ),
      concerns: [
        "No sharps bin, hazardous waste, COSHH, clinical waste, or child safety awareness records exist despite children being on placement -- the home cannot evidence safe management of hazardous materials or protection of children from harm.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of sharps bin compliance, hazardous waste disposal, COSHH assessments, clinical waste management, and child safety awareness sessions to evidence the home's commitment to safe premises and child protection.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
        },
        {
          rank: 2,
          recommendation:
            "Conduct an immediate audit of all sharps, hazardous substances, and clinical waste on the premises and ensure COSHH assessments, risk assessments, and disposal arrangements are in place and documented.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 -- Care and control (safe environment)",
        },
      ],
      insights: [
        {
          text: "The complete absence of sharps disposal and hazardous waste records means Ofsted cannot verify that children are protected from exposure to sharps, chemicals, or clinical waste. This represents a fundamental gap in Reg 25 compliance and the home's duty to maintain safe premises.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // === SHARPS BIN COMPLIANCE ===
  const totalSharpsRecords = sharps_bin_records.length;
  const sharpsInspectionsPassed = sharps_bin_records.filter((r) => r.inspection_passed).length;
  const sharpsInspectionPassRate = pct(sharpsInspectionsPassed, totalSharpsRecords);

  const sharpsLocked = sharps_bin_records.filter((r) => r.is_locked).length;
  const sharpsLockedRate = pct(sharpsLocked, totalSharpsRecords);

  const sharpsLabelled = sharps_bin_records.filter((r) => r.is_labelled).length;
  const sharpsLabelledRate = pct(sharpsLabelled, totalSharpsRecords);

  const sharpsTamperEvident = sharps_bin_records.filter((r) => r.tamper_evident_seal).length;
  const sharpsTamperRate = pct(sharpsTamperEvident, totalSharpsRecords);

  const sharpsDisposalDocumented = sharps_bin_records.filter((r) => r.disposal_documented).length;
  const sharpsDisposalDocRate = pct(sharpsDisposalDocumented, totalSharpsRecords);

  const sharpsAccessibleToChildren = sharps_bin_records.filter((r) => r.accessible_to_children).length;
  const sharpsAccessibleRate = pct(sharpsAccessibleToChildren, totalSharpsRecords);

  const sharpsOverfull = sharps_bin_records.filter((r) => r.fill_level === "overfull" || r.fill_level === "full").length;
  const sharpsOverfullRate = pct(sharpsOverfull, totalSharpsRecords);

  const sharpsCorrectiveAction = sharps_bin_records.filter((r) => r.issues_found.length > 0 && r.corrective_action_taken).length;
  const sharpsIssuesTotal = sharps_bin_records.filter((r) => r.issues_found.length > 0).length;
  const sharpsCorrectiveRate = pct(sharpsCorrectiveAction, sharpsIssuesTotal);

  const sharpsLicensedDisposal = sharps_bin_records.filter(
    (r) => r.disposal_method === "licensed_contractor" || r.disposal_method === "nhs_collection" || r.disposal_method === "pharmacy_return",
  ).length;
  const sharpsLicensedRate = pct(sharpsLicensedDisposal, totalSharpsRecords);

  // Composite sharps bin rate
  const sharpsBinRate =
    totalSharpsRecords > 0
      ? Math.round(
          (sharpsInspectionPassRate + sharpsLockedRate + sharpsLabelledRate + sharpsTamperRate + sharpsDisposalDocRate) / 5,
        )
      : 0;

  // === HAZARDOUS WASTE DISPOSAL ===
  const totalHazardousRecords = hazardous_waste_records.length;
  const hazStorageCompliant = hazardous_waste_records.filter((r) => r.storage_compliant).length;
  const hazStorageRate = pct(hazStorageCompliant, totalHazardousRecords);

  const hazLabellingCorrect = hazardous_waste_records.filter((r) => r.labelling_correct).length;
  const hazLabellingRate = pct(hazLabellingCorrect, totalHazardousRecords);

  const hazContainmentIntact = hazardous_waste_records.filter((r) => r.containment_intact).length;
  const hazContainmentRate = pct(hazContainmentIntact, totalHazardousRecords);

  const hazDisposalDocumented = hazardous_waste_records.filter((r) => r.disposal_documented).length;
  const hazDisposalDocRate = pct(hazDisposalDocumented, totalHazardousRecords);

  const hazConsignmentPresent = hazardous_waste_records.filter((r) => r.consignment_note_present).length;
  const hazConsignmentRate = pct(hazConsignmentPresent, totalHazardousRecords);

  const hazRiskAssessed = hazardous_waste_records.filter((r) => r.risk_assessment_completed).length;
  const hazRiskAssessRate = pct(hazRiskAssessed, totalHazardousRecords);

  const hazStaffTrained = hazardous_waste_records.filter((r) => r.staff_handling_trained).length;
  const hazStaffTrainedRate = pct(hazStaffTrained, totalHazardousRecords);

  const hazSpillKit = hazardous_waste_records.filter((r) => r.spill_kit_available).length;
  const hazSpillKitRate = pct(hazSpillKit, totalHazardousRecords);

  const hazPPE = hazardous_waste_records.filter((r) => r.ppe_available).length;
  const hazPPERate = pct(hazPPE, totalHazardousRecords);

  const hazTotalIncidents = hazardous_waste_records.reduce((sum, r) => sum + r.incidents_reported, 0);
  const hazTotalResolved = hazardous_waste_records.reduce((sum, r) => sum + r.incidents_resolved, 0);
  const hazIncidentResolutionRate = pct(hazTotalResolved, hazTotalIncidents);

  // Composite hazardous waste rate
  const hazardousWasteRate =
    totalHazardousRecords > 0
      ? Math.round(
          (hazStorageRate + hazLabellingRate + hazContainmentRate + hazDisposalDocRate + hazRiskAssessRate) / 5,
        )
      : 0;

  // === COSHH COMPLIANCE ===
  const totalCoshhRecords = coshh_records.length;
  const coshhAssessed = coshh_records.filter((r) => r.coshh_assessment_completed).length;
  const coshhAssessedRate = pct(coshhAssessed, totalCoshhRecords);

  const coshhDataSheets = coshh_records.filter((r) => r.data_sheet_available).length;
  const coshhDataSheetRate = pct(coshhDataSheets, totalCoshhRecords);

  const coshhStorageLocked = coshh_records.filter((r) => r.storage_locked).length;
  const coshhLockedRate = pct(coshhStorageLocked, totalCoshhRecords);

  const coshhStorageAppropriate = coshh_records.filter((r) => r.storage_location_appropriate).length;
  const coshhStorageRate = pct(coshhStorageAppropriate, totalCoshhRecords);

  const coshhLabellingCompliant = coshh_records.filter((r) => r.labelling_compliant).length;
  const coshhLabelRate = pct(coshhLabellingCompliant, totalCoshhRecords);

  const coshhFirstAid = coshh_records.filter((r) => r.first_aid_measures_documented).length;
  const coshhFirstAidRate = pct(coshhFirstAid, totalCoshhRecords);

  const coshhPPEReqDoc = coshh_records.filter((r) => r.ppe_requirements_documented).length;
  const coshhPPEDocRate = pct(coshhPPEReqDoc, totalCoshhRecords);

  const coshhPPEAvail = coshh_records.filter((r) => r.ppe_available).length;
  const coshhPPEAvailRate = pct(coshhPPEAvail, totalCoshhRecords);

  const coshhStaffTrained = coshh_records.filter((r) => r.staff_trained).length;
  const coshhStaffTrainedRate = pct(coshhStaffTrained, totalCoshhRecords);

  const coshhAccessibleToChildren = coshh_records.filter((r) => r.accessible_to_children).length;
  const coshhChildAccessRate = pct(coshhAccessibleToChildren, totalCoshhRecords);

  const coshhHighRisk = coshh_records.filter((r) => r.risk_level === "high" || r.risk_level === "very_high").length;
  const coshhHighRiskRate = pct(coshhHighRisk, totalCoshhRecords);

  const coshhHighRiskLocked = coshh_records.filter(
    (r) => (r.risk_level === "high" || r.risk_level === "very_high") && r.storage_locked,
  ).length;
  const coshhHighRiskLockedRate = pct(coshhHighRiskLocked, coshhHighRisk);

  const coshhTotalIncidents = coshh_records.reduce((sum, r) => sum + r.incidents_reported, 0);
  const coshhTotalResolved = coshh_records.reduce((sum, r) => sum + r.incidents_resolved, 0);
  const coshhIncidentResolutionRate = pct(coshhTotalResolved, coshhTotalIncidents);

  // Composite COSHH compliance rate
  const coshhComplianceRate =
    totalCoshhRecords > 0
      ? Math.round(
          (coshhAssessedRate + coshhLockedRate + coshhStorageRate + coshhLabelRate + coshhDataSheetRate) / 5,
        )
      : 0;

  // === CLINICAL WASTE MANAGEMENT ===
  const totalClinicalRecords = clinical_waste_records.length;
  const clinicalSegCorrect = clinical_waste_records.filter((r) => r.segregation_correct).length;
  const clinicalSegRate = pct(clinicalSegCorrect, totalClinicalRecords);

  const clinicalContainerCorrect = clinical_waste_records.filter((r) => r.container_type_correct).length;
  const clinicalContainerRate = pct(clinicalContainerCorrect, totalClinicalRecords);

  const clinicalSealed = clinical_waste_records.filter((r) => r.container_sealed).length;
  const clinicalSealedRate = pct(clinicalSealed, totalClinicalRecords);

  const clinicalLabelled = clinical_waste_records.filter((r) => r.labelling_correct).length;
  const clinicalLabelRate = pct(clinicalLabelled, totalClinicalRecords);

  const clinicalStorageSecure = clinical_waste_records.filter((r) => r.storage_location_secure).length;
  const clinicalStorageRate = pct(clinicalStorageSecure, totalClinicalRecords);

  const clinicalTempCompliant = clinical_waste_records.filter((r) => r.storage_temperature_compliant).length;
  const clinicalTempRate = pct(clinicalTempCompliant, totalClinicalRecords);

  const clinicalOnSchedule = clinical_waste_records.filter((r) => r.collection_on_schedule).length;
  const clinicalScheduleRate = pct(clinicalOnSchedule, totalClinicalRecords);

  const clinicalContractorLicensed = clinical_waste_records.filter((r) => r.contractor_licensed).length;
  const clinicalLicensedRate = pct(clinicalContractorLicensed, totalClinicalRecords);

  const clinicalDutyOfCare = clinical_waste_records.filter((r) => r.duty_of_care_transfer_note).length;
  const clinicalDutyRate = pct(clinicalDutyOfCare, totalClinicalRecords);

  const clinicalStaffTrained = clinical_waste_records.filter((r) => r.staff_handling_trained).length;
  const clinicalStaffTrainedRate = pct(clinicalStaffTrained, totalClinicalRecords);

  const clinicalPPEWorn = clinical_waste_records.filter((r) => r.ppe_worn).length;
  const clinicalPPERate = pct(clinicalPPEWorn, totalClinicalRecords);

  const clinicalSpillages = clinical_waste_records.reduce((sum, r) => sum + r.spillage_incidents, 0);
  const clinicalSpillagesManaged = clinical_waste_records.reduce((sum, r) => sum + r.spillage_incidents_managed, 0);
  const clinicalSpillageManagementRate = pct(clinicalSpillagesManaged, clinicalSpillages);

  // Composite clinical waste rate
  const clinicalWasteRate =
    totalClinicalRecords > 0
      ? Math.round(
          (clinicalSegRate + clinicalContainerRate + clinicalSealedRate + clinicalLabelRate + clinicalStorageRate) / 5,
        )
      : 0;

  // === CHILD SAFETY AWARENESS ===
  const totalChildSafetyRecords = child_safety_records.length;
  const safetySessionsCompleted = child_safety_records.filter((r) => r.session_completed).length;
  const safetyCompletionRate = pct(safetySessionsCompleted, totalChildSafetyRecords);

  const childUnderstood = child_safety_records.filter((r) => r.child_understood).length;
  const childUnderstandingRate = pct(childUnderstood, totalChildSafetyRecords);

  const ageAppropriateMaterials = child_safety_records.filter((r) => r.age_appropriate_materials).length;
  const ageAppropriateRate = pct(ageAppropriateMaterials, totalChildSafetyRecords);

  const followUpPlanned = child_safety_records.filter((r) => r.follow_up_planned).length;
  const followUpCompleted = child_safety_records.filter((r) => r.follow_up_completed).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpPlanned);

  const childKnowsReporting = child_safety_records.filter((r) => r.child_knows_reporting_process).length;
  const childReportingKnowledgeRate = pct(childKnowsReporting, totalChildSafetyRecords);

  const riskAssessmentIncludesChild = child_safety_records.filter((r) => r.risk_assessment_includes_child).length;
  const riskAssessmentChildRate = pct(riskAssessmentIncludesChild, totalChildSafetyRecords);

  const hazardReportedByChild = child_safety_records.filter((r) => r.hazard_reported_by_child).length;
  const childHazardReportRate = pct(hazardReportedByChild, totalChildSafetyRecords);

  const childIncidentsTotal = child_safety_records.reduce((sum, r) => sum + r.incidents_involving_child, 0);
  const childIncidentsResolved = child_safety_records.reduce((sum, r) => sum + r.incidents_resolved, 0);
  const childIncidentResolutionRate = pct(childIncidentsResolved, childIncidentsTotal);

  const nearMissesTotal = child_safety_records.reduce((sum, r) => sum + r.near_misses_reported, 0);
  const safeguardingConcernsTotal = child_safety_records.reduce((sum, r) => sum + r.safeguarding_concerns_raised, 0);

  const uniqueChildrenWithSafety = new Set(child_safety_records.map((r) => r.child_id)).size;
  const childSafetyCoverageRate = pct(uniqueChildrenWithSafety, total_children);

  // Composite child safety rate
  const childSafetyRate =
    totalChildSafetyRecords > 0
      ? Math.round(
          (safetyCompletionRate + childUnderstandingRate + ageAppropriateRate + childReportingKnowledgeRate) / 4,
        )
      : 0;

  // === STAFF TRAINING COMPOSITE ===
  const trainingDenominator = totalHazardousRecords + totalCoshhRecords + totalClinicalRecords;
  const trainingNumerator = hazStaffTrained + coshhStaffTrained + clinicalStaffTrained;
  const staffTrainingRate = pct(trainingNumerator, trainingDenominator);

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: sharpsBinRate (>=90: +5, >=70: +3) ---
  if (sharpsBinRate >= 90) score += 5;
  else if (sharpsBinRate >= 70) score += 3;

  // --- Bonus 2: hazardousWasteRate (>=90: +5, >=70: +2) ---
  if (hazardousWasteRate >= 90) score += 5;
  else if (hazardousWasteRate >= 70) score += 2;

  // --- Bonus 3: coshhComplianceRate (>=90: +4, >=70: +2) ---
  if (coshhComplianceRate >= 90) score += 4;
  else if (coshhComplianceRate >= 70) score += 2;

  // --- Bonus 4: clinicalWasteRate (>=90: +4, >=70: +2) ---
  if (clinicalWasteRate >= 90) score += 4;
  else if (clinicalWasteRate >= 70) score += 2;

  // --- Bonus 5: childSafetyRate (>=90: +3, >=70: +1) ---
  if (childSafetyRate >= 90) score += 3;
  else if (childSafetyRate >= 70) score += 1;

  // --- Bonus 6: staffTrainingRate (>=90: +3, >=60: +1) ---
  if (staffTrainingRate >= 90) score += 3;
  else if (staffTrainingRate >= 60) score += 1;

  // --- Bonus 7: sharpsLockedRate (>=100: +2, >=80: +1) ---
  if (sharpsLockedRate >= 100) score += 2;
  else if (sharpsLockedRate >= 80) score += 1;

  // --- Bonus 8: coshhLockedRate (>=95: +2, >=80: +1) ---
  if (coshhLockedRate >= 95) score += 2;
  else if (coshhLockedRate >= 80) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // sharpsAccessibleRate > 0 (any sharps accessible to children) -> -6
  if (sharpsAccessibleRate > 0 && totalSharpsRecords > 0) score -= 6;

  // coshhChildAccessRate > 0 (any COSHH substances accessible to children) -> -5
  if (coshhChildAccessRate > 0 && totalCoshhRecords > 0) score -= 5;

  // hazRiskAssessRate < 50 -> -5
  if (hazRiskAssessRate < 50 && totalHazardousRecords > 0) score -= 5;

  // clinicalSegRate < 50 -> -4
  if (clinicalSegRate < 50 && totalClinicalRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const sharps_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (sharpsInspectionPassRate >= 90 && totalSharpsRecords > 0) {
    strengths.push(
      `${sharpsInspectionPassRate}% of sharps bin inspections passed -- the home demonstrates consistent sharps bin compliance with regular inspections maintaining safety standards.`,
    );
  } else if (sharpsInspectionPassRate >= 70 && totalSharpsRecords > 0) {
    strengths.push(
      `${sharpsInspectionPassRate}% sharps bin inspection pass rate -- most sharps bins meet safety and compliance standards.`,
    );
  }

  if (sharpsLockedRate >= 100 && totalSharpsRecords > 0) {
    strengths.push(
      "Every sharps bin is locked and secured -- children cannot access sharps containers, demonstrating exemplary child safety practice.",
    );
  } else if (sharpsLockedRate >= 90 && totalSharpsRecords > 0) {
    strengths.push(
      `${sharpsLockedRate}% of sharps bins are locked and secured -- strong compliance with sharps containment requirements.`,
    );
  }

  if (sharpsAccessibleRate === 0 && totalSharpsRecords > 0) {
    strengths.push(
      "No sharps bins are accessible to children -- all sharps are stored in locations and containers that prevent child access.",
    );
  }

  if (sharpsLicensedRate >= 90 && totalSharpsRecords > 0) {
    strengths.push(
      `${sharpsLicensedRate}% of sharps disposed via licensed contractor, NHS collection, or pharmacy return -- disposal chain is compliant and auditable.`,
    );
  }

  if (sharpsTamperRate >= 90 && totalSharpsRecords > 0) {
    strengths.push(
      `${sharpsTamperRate}% of sharps bins have tamper-evident seals -- excellent containment integrity reducing risk of accidental exposure.`,
    );
  }

  if (sharpsCorrectiveRate >= 90 && sharpsIssuesTotal > 0) {
    strengths.push(
      `${sharpsCorrectiveRate}% of sharps bin issues addressed with corrective action -- the home responds promptly to identified sharps safety concerns.`,
    );
  }

  if (hazStorageRate >= 90 && totalHazardousRecords > 0) {
    strengths.push(
      `${hazStorageRate}% of hazardous waste stored compliantly -- storage arrangements meet regulatory requirements for safe containment.`,
    );
  } else if (hazStorageRate >= 70 && totalHazardousRecords > 0) {
    strengths.push(
      `${hazStorageRate}% hazardous waste storage compliance -- most hazardous materials are stored safely and appropriately.`,
    );
  }

  if (hazConsignmentRate >= 90 && totalHazardousRecords > 0) {
    strengths.push(
      `${hazConsignmentRate}% of hazardous waste disposals have consignment notes -- disposal documentation is thorough and auditable.`,
    );
  }

  if (hazRiskAssessRate >= 90 && totalHazardousRecords > 0) {
    strengths.push(
      `${hazRiskAssessRate}% of hazardous waste items have completed risk assessments -- hazards are systematically identified and mitigated.`,
    );
  }

  if (hazSpillKitRate >= 90 && totalHazardousRecords > 0) {
    strengths.push(
      `Spill kits available for ${hazSpillKitRate}% of hazardous waste locations -- the home is prepared for emergency containment.`,
    );
  }

  if (hazPPERate >= 90 && totalHazardousRecords > 0) {
    strengths.push(
      `PPE available for ${hazPPERate}% of hazardous waste handling situations -- staff are properly equipped for safe handling.`,
    );
  }

  if (hazIncidentResolutionRate >= 90 && hazTotalIncidents > 0) {
    strengths.push(
      `${hazIncidentResolutionRate}% of hazardous waste incidents resolved -- the home responds effectively to hazardous material incidents.`,
    );
  }

  if (coshhAssessedRate >= 90 && totalCoshhRecords > 0) {
    strengths.push(
      `${coshhAssessedRate}% of COSHH substances have completed assessments -- comprehensive hazard identification and control measures are in place.`,
    );
  } else if (coshhAssessedRate >= 70 && totalCoshhRecords > 0) {
    strengths.push(
      `${coshhAssessedRate}% COSHH assessment completion rate -- most hazardous substances have been assessed and controlled.`,
    );
  }

  if (coshhLockedRate >= 95 && totalCoshhRecords > 0) {
    strengths.push(
      `${coshhLockedRate}% of COSHH substances stored in locked locations -- hazardous chemicals are secured against unauthorised access.`,
    );
  }

  if (coshhChildAccessRate === 0 && totalCoshhRecords > 0) {
    strengths.push(
      "No COSHH substances are accessible to children -- all hazardous chemicals are stored securely out of children's reach.",
    );
  }

  if (coshhDataSheetRate >= 90 && totalCoshhRecords > 0) {
    strengths.push(
      `Safety data sheets available for ${coshhDataSheetRate}% of COSHH substances -- staff have access to critical safety information for all hazardous materials.`,
    );
  }

  if (coshhFirstAidRate >= 90 && totalCoshhRecords > 0) {
    strengths.push(
      `First aid measures documented for ${coshhFirstAidRate}% of COSHH substances -- emergency response information is readily available.`,
    );
  }

  if (coshhHighRiskLockedRate >= 100 && coshhHighRisk > 0) {
    strengths.push(
      "Every high-risk COSHH substance is stored in a locked location -- the most dangerous chemicals are fully secured against unauthorised access.",
    );
  }

  if (coshhIncidentResolutionRate >= 90 && coshhTotalIncidents > 0) {
    strengths.push(
      `${coshhIncidentResolutionRate}% of COSHH incidents resolved -- the home manages chemical safety incidents effectively.`,
    );
  }

  if (clinicalSegRate >= 90 && totalClinicalRecords > 0) {
    strengths.push(
      `${clinicalSegRate}% clinical waste correctly segregated -- waste streams are properly separated reducing cross-contamination and infection risk.`,
    );
  } else if (clinicalSegRate >= 70 && totalClinicalRecords > 0) {
    strengths.push(
      `${clinicalSegRate}% clinical waste segregation rate -- most clinical waste is correctly categorised and separated.`,
    );
  }

  if (clinicalLicensedRate >= 100 && totalClinicalRecords > 0) {
    strengths.push(
      "All clinical waste collected by licensed contractors -- disposal chain is fully compliant with regulatory requirements.",
    );
  } else if (clinicalLicensedRate >= 90 && totalClinicalRecords > 0) {
    strengths.push(
      `${clinicalLicensedRate}% of clinical waste collected by licensed contractors -- strong compliance with duty of care requirements.`,
    );
  }

  if (clinicalDutyRate >= 90 && totalClinicalRecords > 0) {
    strengths.push(
      `Duty of care transfer notes present for ${clinicalDutyRate}% of clinical waste disposals -- robust audit trail for waste tracking.`,
    );
  }

  if (clinicalScheduleRate >= 90 && totalClinicalRecords > 0) {
    strengths.push(
      `${clinicalScheduleRate}% of clinical waste collections on schedule -- waste is not accumulating beyond safe storage periods.`,
    );
  }

  if (clinicalPPERate >= 90 && totalClinicalRecords > 0) {
    strengths.push(
      `PPE worn during ${clinicalPPERate}% of clinical waste handling -- staff consistently protect themselves during waste management.`,
    );
  }

  if (clinicalSpillageManagementRate >= 90 && clinicalSpillages > 0) {
    strengths.push(
      `${clinicalSpillageManagementRate}% of clinical waste spillages correctly managed -- the home responds effectively to waste containment failures.`,
    );
  }

  if (safetyCompletionRate >= 90 && totalChildSafetyRecords > 0) {
    strengths.push(
      `${safetyCompletionRate}% of child safety awareness sessions completed -- children are being educated about hazard awareness in an age-appropriate way.`,
    );
  } else if (safetyCompletionRate >= 70 && totalChildSafetyRecords > 0) {
    strengths.push(
      `${safetyCompletionRate}% child safety session completion rate -- most children are receiving hazard awareness education.`,
    );
  }

  if (childUnderstandingRate >= 90 && totalChildSafetyRecords > 0) {
    strengths.push(
      `${childUnderstandingRate}% of children demonstrated understanding of hazard safety -- education is effective and age-appropriate.`,
    );
  }

  if (childReportingKnowledgeRate >= 90 && totalChildSafetyRecords > 0) {
    strengths.push(
      `${childReportingKnowledgeRate}% of children know how to report hazards -- children are empowered to contribute to the home's safety culture.`,
    );
  }

  if (childSafetyCoverageRate >= 90 && total_children > 0) {
    strengths.push(
      `Child safety awareness covers ${childSafetyCoverageRate}% of children on placement -- comprehensive safety education across the home.`,
    );
  }

  if (ageAppropriateRate >= 90 && totalChildSafetyRecords > 0) {
    strengths.push(
      `${ageAppropriateRate}% of safety sessions used age-appropriate materials -- education is tailored to children's developmental needs.`,
    );
  }

  if (followUpCompletionRate >= 90 && followUpPlanned > 0) {
    strengths.push(
      `${followUpCompletionRate}% of planned safety follow-ups completed -- the home ensures safety messages are reinforced.`,
    );
  }

  if (staffTrainingRate >= 90 && trainingDenominator > 0) {
    strengths.push(
      `Staff training rate at ${staffTrainingRate}% across hazardous waste, COSHH, and clinical waste handling -- the workforce is well equipped to manage hazardous materials safely.`,
    );
  } else if (staffTrainingRate >= 70 && trainingDenominator > 0) {
    strengths.push(
      `Staff training rate at ${staffTrainingRate}% -- most staff are trained in hazardous materials handling.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (sharpsAccessibleRate > 0 && totalSharpsRecords > 0) {
    concerns.push(
      `${sharpsAccessibleRate}% of sharps bins are accessible to children -- this is a critical safeguarding failure. Every sharps container must be stored in a location that children cannot access to prevent needlestick injuries and exposure to contaminated materials.`,
    );
  }

  if (sharpsInspectionPassRate < 50 && totalSharpsRecords > 0) {
    concerns.push(
      `Only ${sharpsInspectionPassRate}% of sharps bin inspections passed -- the majority of sharps containers do not meet safety standards, creating unacceptable risk of needlestick injury.`,
    );
  } else if (sharpsInspectionPassRate < 70 && sharpsInspectionPassRate >= 50 && totalSharpsRecords > 0) {
    concerns.push(
      `Sharps bin inspection pass rate at ${sharpsInspectionPassRate}% -- a significant proportion of sharps containers are not meeting compliance standards.`,
    );
  }

  if (sharpsLockedRate < 80 && totalSharpsRecords > 0) {
    concerns.push(
      `Only ${sharpsLockedRate}% of sharps bins are locked -- unsecured sharps containers present a direct risk to children and staff.`,
    );
  }

  if (sharpsOverfullRate > 10 && totalSharpsRecords > 0) {
    concerns.push(
      `${sharpsOverfullRate}% of sharps bins are full or overfull -- overfilled sharps containers increase the risk of needlestick injuries and must be replaced or collected immediately.`,
    );
  }

  if (sharpsDisposalDocRate < 70 && totalSharpsRecords > 0) {
    concerns.push(
      `Only ${sharpsDisposalDocRate}% of sharps disposals are documented -- the home cannot evidence a safe disposal chain for sharps waste.`,
    );
  }

  if (sharpsLicensedRate < 70 && totalSharpsRecords > 0) {
    concerns.push(
      `Only ${sharpsLicensedRate}% of sharps disposed via licensed routes -- unregulated disposal methods create legal liability and environmental risk.`,
    );
  }

  if (hazStorageRate < 50 && totalHazardousRecords > 0) {
    concerns.push(
      `Only ${hazStorageRate}% of hazardous waste stored compliantly -- the majority of hazardous materials are not being stored safely, creating direct risk of exposure, spill, or contamination.`,
    );
  } else if (hazStorageRate < 70 && hazStorageRate >= 50 && totalHazardousRecords > 0) {
    concerns.push(
      `Hazardous waste storage compliance at ${hazStorageRate}% -- a significant proportion of hazardous materials are not stored to required standards.`,
    );
  }

  if (hazRiskAssessRate < 50 && totalHazardousRecords > 0) {
    concerns.push(
      `Only ${hazRiskAssessRate}% of hazardous waste items have completed risk assessments -- the home has not systematically identified and mitigated hazardous material risks, which is a fundamental failure of risk management.`,
    );
  } else if (hazRiskAssessRate < 70 && hazRiskAssessRate >= 50 && totalHazardousRecords > 0) {
    concerns.push(
      `Hazardous waste risk assessment rate at ${hazRiskAssessRate}% -- not all hazardous materials have been properly risk assessed.`,
    );
  }

  if (hazConsignmentRate < 70 && totalHazardousRecords > 0) {
    concerns.push(
      `Only ${hazConsignmentRate}% of hazardous waste disposals have consignment notes -- incomplete documentation prevents verification of safe disposal and creates regulatory non-compliance.`,
    );
  }

  if (hazSpillKitRate < 70 && totalHazardousRecords > 0) {
    concerns.push(
      `Spill kits available for only ${hazSpillKitRate}% of hazardous waste locations -- the home is not adequately prepared for emergency containment of hazardous material spills.`,
    );
  }

  if (hazPPERate < 70 && totalHazardousRecords > 0) {
    concerns.push(
      `PPE available for only ${hazPPERate}% of hazardous waste handling situations -- staff are handling dangerous materials without adequate personal protection.`,
    );
  }

  if (coshhChildAccessRate > 0 && totalCoshhRecords > 0) {
    concerns.push(
      `${coshhChildAccessRate}% of COSHH substances are accessible to children -- this is a critical safeguarding failure. Every hazardous chemical must be stored in a locked location that children cannot access to prevent poisoning, burns, or inhalation injuries.`,
    );
  }

  if (coshhAssessedRate < 50 && totalCoshhRecords > 0) {
    concerns.push(
      `Only ${coshhAssessedRate}% of COSHH substances have completed assessments -- the majority of hazardous chemicals in the home have not been properly assessed for risk, failing legal COSHH requirements.`,
    );
  } else if (coshhAssessedRate < 70 && coshhAssessedRate >= 50 && totalCoshhRecords > 0) {
    concerns.push(
      `COSHH assessment completion rate at ${coshhAssessedRate}% -- a significant number of hazardous substances lack formal risk assessments.`,
    );
  }

  if (coshhLockedRate < 80 && totalCoshhRecords > 0) {
    concerns.push(
      `Only ${coshhLockedRate}% of COSHH substances stored in locked locations -- unsecured chemicals present a direct risk to children and vulnerable individuals in the home.`,
    );
  }

  if (coshhHighRiskLockedRate < 100 && coshhHighRisk > 0) {
    concerns.push(
      `Only ${coshhHighRiskLockedRate}% of high-risk COSHH substances are locked -- high-risk chemicals that are not secured pose an immediate and serious danger to children.`,
    );
  }

  if (coshhDataSheetRate < 70 && totalCoshhRecords > 0) {
    concerns.push(
      `Safety data sheets available for only ${coshhDataSheetRate}% of COSHH substances -- staff lack critical safety information for handling hazardous chemicals.`,
    );
  }

  if (clinicalSegRate < 50 && totalClinicalRecords > 0) {
    concerns.push(
      `Only ${clinicalSegRate}% of clinical waste correctly segregated -- incorrect waste stream separation creates cross-contamination risk and potential infection hazard.`,
    );
  } else if (clinicalSegRate < 70 && clinicalSegRate >= 50 && totalClinicalRecords > 0) {
    concerns.push(
      `Clinical waste segregation rate at ${clinicalSegRate}% -- waste streams are not consistently separated, increasing contamination risk.`,
    );
  }

  if (clinicalStorageRate < 70 && totalClinicalRecords > 0) {
    concerns.push(
      `Only ${clinicalStorageRate}% of clinical waste stored in secure locations -- unsecured clinical waste presents infection and contamination risks to children and staff.`,
    );
  }

  if (clinicalLicensedRate < 80 && totalClinicalRecords > 0) {
    concerns.push(
      `Only ${clinicalLicensedRate}% of clinical waste collected by licensed contractors -- the home may be in breach of duty of care requirements for clinical waste disposal.`,
    );
  }

  if (clinicalScheduleRate < 70 && totalClinicalRecords > 0) {
    concerns.push(
      `Only ${clinicalScheduleRate}% of clinical waste collections on schedule -- delayed collections mean clinical waste accumulates beyond safe storage periods.`,
    );
  }

  if (clinicalPPERate < 70 && totalClinicalRecords > 0) {
    concerns.push(
      `PPE worn during only ${clinicalPPERate}% of clinical waste handling -- staff are exposed to infection risk when handling clinical waste without proper protection.`,
    );
  }

  if (safetyCompletionRate < 50 && totalChildSafetyRecords > 0) {
    concerns.push(
      `Only ${safetyCompletionRate}% of child safety awareness sessions completed -- the majority of children have not received education about hazard awareness, leaving them vulnerable to accidental exposure.`,
    );
  } else if (safetyCompletionRate < 70 && safetyCompletionRate >= 50 && totalChildSafetyRecords > 0) {
    concerns.push(
      `Child safety session completion at ${safetyCompletionRate}% -- not all children are receiving hazard awareness education.`,
    );
  }

  if (childReportingKnowledgeRate < 50 && totalChildSafetyRecords > 0) {
    concerns.push(
      `Only ${childReportingKnowledgeRate}% of children know how to report hazards -- children are not empowered to contribute to their own safety.`,
    );
  }

  if (childSafetyCoverageRate < 50 && total_children > 0 && totalChildSafetyRecords > 0) {
    concerns.push(
      `Child safety awareness covers only ${childSafetyCoverageRate}% of children on placement -- many children have not received any hazard safety education.`,
    );
  }

  if (safeguardingConcernsTotal > 0) {
    concerns.push(
      `${safeguardingConcernsTotal} safeguarding concern${safeguardingConcernsTotal !== 1 ? "s" : ""} raised related to hazardous materials and child safety -- each concern must be thoroughly investigated and resolved.`,
    );
  }

  if (staffTrainingRate < 50 && trainingDenominator > 0) {
    concerns.push(
      `Staff training rate at only ${staffTrainingRate}% across hazardous waste, COSHH, and clinical waste handling -- the majority of staff lack training in safe handling of hazardous materials, creating direct risk to children and staff.`,
    );
  } else if (staffTrainingRate < 70 && staffTrainingRate >= 50 && trainingDenominator > 0) {
    concerns.push(
      `Staff training rate at ${staffTrainingRate}% -- a significant proportion of staff are not trained in hazardous materials handling.`,
    );
  }

  if (totalSharpsRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No sharps bin records despite children being on placement -- the home has not documented sharps bin locations, inspections, or disposal arrangements, which may indicate sharps are present without proper management.",
    );
  }

  if (totalCoshhRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No COSHH records despite children being on placement -- the home has not documented hazardous substance assessments, which is a legal requirement. Every cleaning product, chemical, and hazardous substance must have a COSHH assessment.",
    );
  }

  if (totalChildSafetyRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child safety awareness records -- children have not been educated about hazardous materials, sharps safety, or chemical dangers in an age-appropriate way.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: SharpsDisposalRecommendation[] = [];
  let rank = 0;

  if (sharpsAccessibleRate > 0 && totalSharpsRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately relocate all sharps bins to secure, locked locations that children cannot access. Every sharps container must be wall-mounted at adult height or stored in locked clinical rooms. This is a critical child safety issue requiring same-day resolution.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (coshhChildAccessRate > 0 && totalCoshhRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately secure all COSHH substances in locked storage that children cannot access. Conduct an emergency audit of every chemical, cleaning product, and hazardous substance in the home to verify secure storage. This is a critical safeguarding issue.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Care and control (safe environment)",
    });
  }

  if (hazRiskAssessRate < 50 && totalHazardousRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete risk assessments for all hazardous waste items immediately. Every hazardous substance must have a documented risk assessment identifying hazards, exposure routes, control measures, and emergency procedures.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (clinicalSegRate < 50 && totalClinicalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently retrain all staff on clinical waste segregation. Implement colour-coded waste stream guides at every disposal point and conduct weekly audits of waste segregation compliance until the rate exceeds 90%.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (sharpsInspectionPassRate < 50 && totalSharpsRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all sharps bins that failed inspection and take immediate corrective action. Implement weekly sharps bin inspection schedules with documented sign-off by a designated responsible person.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (coshhAssessedRate < 50 && totalCoshhRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete COSHH assessments for all hazardous substances on the premises immediately. COSHH assessments are a legal requirement and every cleaning product, chemical, and hazardous material must be assessed, documented, and reviewed annually.",
      urgency: "immediate",
      regulatory_ref: "COSHH Regulations 2002 / CHR 2015 Reg 25",
    });
  }

  if (staffTrainingRate < 50 && trainingDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory hazardous materials handling training for all staff. Training must cover COSHH awareness, clinical waste segregation, sharps safety, spill response, and PPE usage. No staff member should handle hazardous materials without current training.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises / SCCIF Safety",
    });
  }

  if (safetyCompletionRate < 50 && totalChildSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Deliver age-appropriate hazard awareness sessions to all children. Children must understand the dangers of sharps, chemicals, and clinical waste, know how to report hazards, and understand basic safety precautions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Care and control (safe environment)",
    });
  }

  if (coshhHighRiskLockedRate < 100 && coshhHighRisk > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all high-risk and very-high-risk COSHH substances are stored in locked cabinets or rooms. High-risk chemicals require the most stringent storage controls and must be secured at all times.",
      urgency: "immediate",
      regulatory_ref: "COSHH Regulations 2002 / CHR 2015 Reg 25",
    });
  }

  if (sharpsLockedRate < 80 && totalSharpsRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all sharps bins are secured with locks or tamper-evident mechanisms. Unsecured sharps containers must be replaced with locking models or relocated to locked storage areas.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (hazStorageRate < 70 && hazStorageRate >= 50 && totalHazardousRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve hazardous waste storage arrangements to achieve at least 70% compliance. Ensure all storage locations meet regulatory requirements for containment, ventilation, and access control.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (hazConsignmentRate < 70 && totalHazardousRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure consignment notes are completed and retained for all hazardous waste disposals. Consignment notes are a legal requirement for hazardous waste transfer and must be kept for a minimum of three years.",
      urgency: "soon",
      regulatory_ref: "Hazardous Waste Regulations / CHR 2015 Reg 25",
    });
  }

  if (hazSpillKitRate < 70 && totalHazardousRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide spill kits at all locations where hazardous waste is stored or handled. Staff must know the location of spill kits and be trained in their use.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (clinicalStorageRate < 70 && totalClinicalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Secure all clinical waste storage locations with restricted access. Clinical waste must be stored in designated, locked areas away from children and general waste to prevent contamination and infection risk.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (clinicalLicensedRate < 80 && totalClinicalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all clinical waste is collected by a licensed waste contractor. The home has a legal duty of care to ensure clinical waste is disposed of safely and lawfully through licensed waste carriers.",
      urgency: "soon",
      regulatory_ref: "Environmental Protection Act / CHR 2015 Reg 25",
    });
  }

  if (clinicalScheduleRate < 70 && totalClinicalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review clinical waste collection schedules and ensure collections occur on time. Delayed collections create storage capacity issues and increase infection risk.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (childReportingKnowledgeRate < 50 && totalChildSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Teach all children how to report hazards they encounter. Create simple, visual reporting guides appropriate to each child's age and understanding, and ensure every child knows who to tell if they see something dangerous.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Care and control (safe environment)",
    });
  }

  if (sharpsInspectionPassRate >= 50 && sharpsInspectionPassRate < 70 && totalSharpsRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve sharps bin inspection compliance to at least 70%. Review common inspection failures and address underlying issues such as bin condition, labelling, or fill level management.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (coshhAssessedRate >= 50 && coshhAssessedRate < 70 && totalCoshhRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase COSHH assessment completion to at least 70%. Prioritise unassessed substances by risk level, starting with high-risk chemicals, and ensure all assessments are reviewed within 12 months.",
      urgency: "planned",
      regulatory_ref: "COSHH Regulations 2002 / CHR 2015 Reg 25",
    });
  }

  if (coshhDataSheetRate < 70 && totalCoshhRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Obtain and file safety data sheets for all COSHH substances. Data sheets should be readily accessible to all staff who handle the substances and included in COSHH assessment folders.",
      urgency: "planned",
      regulatory_ref: "COSHH Regulations 2002",
    });
  }

  if (staffTrainingRate >= 50 && staffTrainingRate < 70 && trainingDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase staff training coverage to at least 70% for hazardous waste, COSHH, and clinical waste handling. Identify untrained staff and schedule training within the next quarter.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises / SCCIF Safety",
    });
  }

  if (safetyCompletionRate >= 50 && safetyCompletionRate < 70 && totalChildSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child safety awareness session completion to at least 70%. Review barriers to completion and ensure sessions are scheduled, age-appropriate, and engaging.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Care and control (safe environment)",
    });
  }

  if (sharpsOverfullRate > 10 && totalSharpsRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a sharps bin fill-level monitoring system to prevent bins reaching full or overfull status. Arrange more frequent collections or additional bins where fill levels consistently exceed three-quarter capacity.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (totalSharpsRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an audit of all sharps on the premises and implement sharps bin records including location, inspection schedules, disposal documentation, and responsible staff member assignment.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (safe and well maintained)",
    });
  }

  if (totalCoshhRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a full COSHH inventory of every hazardous substance on the premises, including cleaning products, gardening chemicals, and maintenance materials. Complete COSHH assessments, secure storage, and establish a review schedule.",
      urgency: "soon",
      regulatory_ref: "COSHH Regulations 2002 / CHR 2015 Reg 25",
    });
  }

  if (totalChildSafetyRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and deliver an age-appropriate child hazard awareness programme covering sharps safety, chemical safety, waste handling, and how to report hazards. Document all sessions and assess children's understanding.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Care and control (safe environment)",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: SharpsDisposalInsight[] = [];

  // --- Critical insights ---

  if (sharpsAccessibleRate > 0 && totalSharpsRecords > 0) {
    insights.push({
      text: `${sharpsAccessibleRate}% of sharps bins are accessible to children. Ofsted will view any child's ability to access sharps as a serious safeguarding failure under Reg 25 -- needlestick injuries can transmit blood-borne infections and this must be resolved immediately.`,
      severity: "critical",
    });
  }

  if (coshhChildAccessRate > 0 && totalCoshhRecords > 0) {
    insights.push({
      text: `${coshhChildAccessRate}% of COSHH substances are accessible to children. Unsecured chemicals in a children's home represent an immediate danger -- ingestion, skin contact, or inhalation of hazardous substances can cause serious injury. Ofsted will treat this as a Reg 14 and Reg 25 breach.`,
      severity: "critical",
    });
  }

  if (hazRiskAssessRate < 50 && totalHazardousRecords > 0) {
    insights.push({
      text: `Only ${hazRiskAssessRate}% of hazardous waste has completed risk assessments. Without systematic risk assessment, the home cannot demonstrate it understands or controls the hazards present. Ofsted will view this as evidence of poor risk management under Reg 25.`,
      severity: "critical",
    });
  }

  if (clinicalSegRate < 50 && totalClinicalRecords > 0) {
    insights.push({
      text: `Only ${clinicalSegRate}% of clinical waste correctly segregated. Incorrect waste stream separation creates cross-contamination hazards and potential infection transmission. Ofsted will view poor waste segregation as evidence the home does not maintain safe premises.`,
      severity: "critical",
    });
  }

  if (totalSharpsRecords === 0 && totalCoshhRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No sharps bin or COSHH records despite children being on placement. Ofsted may interpret the absence of records as evidence that hazardous materials management has not been assessed or controlled -- every home uses chemicals and many manage sharps, so the lack of records is a significant regulatory gap.",
      severity: "critical",
    });
  }

  if (staffTrainingRate < 50 && trainingDenominator > 0) {
    insights.push({
      text: `Staff training rate at only ${staffTrainingRate}% for hazardous materials handling. Untrained staff handling sharps, chemicals, or clinical waste creates direct risk of injury, contamination, and infection. Ofsted will question whether the home has adequate staffing competence under Reg 25 and SCCIF Safety.`,
      severity: "critical",
    });
  }

  if (coshhHighRiskLockedRate < 100 && coshhHighRisk > 0) {
    insights.push({
      text: `${100 - coshhHighRiskLockedRate}% of high-risk COSHH substances are not in locked storage. High-risk chemicals that are unsecured in a children's home represent an immediate danger. Ofsted inspectors will check chemical storage as part of premises safety assessment.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (sharpsInspectionPassRate >= 50 && sharpsInspectionPassRate < 70 && totalSharpsRecords > 0) {
    insights.push({
      text: `Sharps bin inspection pass rate at ${sharpsInspectionPassRate}% -- improving but not yet at the standard expected. Regular inspections with documented corrective action demonstrate the home's commitment to ongoing safety.`,
      severity: "warning",
    });
  }

  if (hazStorageRate >= 50 && hazStorageRate < 70 && totalHazardousRecords > 0) {
    insights.push({
      text: `Hazardous waste storage compliance at ${hazStorageRate}%. While some materials are properly stored, gaps in compliance create uneven protection. Ofsted will expect all hazardous waste to meet storage standards without exception.`,
      severity: "warning",
    });
  }

  if (coshhAssessedRate >= 50 && coshhAssessedRate < 70 && totalCoshhRecords > 0) {
    insights.push({
      text: `COSHH assessment completion at ${coshhAssessedRate}%. COSHH assessments are a legal requirement for all hazardous substances -- partial compliance still leaves the home exposed to regulatory action and, more importantly, leaves staff and children at risk from unassessed hazards.`,
      severity: "warning",
    });
  }

  if (clinicalSegRate >= 50 && clinicalSegRate < 70 && totalClinicalRecords > 0) {
    insights.push({
      text: `Clinical waste segregation at ${clinicalSegRate}%. Waste stream errors can lead to infectious waste entering general waste channels or incorrect treatment at disposal facilities. Consistent segregation is essential for infection prevention.`,
      severity: "warning",
    });
  }

  if (clinicalScheduleRate >= 50 && clinicalScheduleRate < 70 && totalClinicalRecords > 0) {
    insights.push({
      text: `Only ${clinicalScheduleRate}% of clinical waste collections are on schedule. Delayed collections mean clinical waste accumulates beyond recommended storage periods, increasing infection risk and storage capacity concerns.`,
      severity: "warning",
    });
  }

  if (safetyCompletionRate >= 50 && safetyCompletionRate < 70 && totalChildSafetyRecords > 0) {
    insights.push({
      text: `Child safety awareness completion at ${safetyCompletionRate}%. While some children have received hazard education, gaps in coverage mean some children may not understand the risks of sharps, chemicals, or clinical waste in their living environment.`,
      severity: "warning",
    });
  }

  if (staffTrainingRate >= 50 && staffTrainingRate < 70 && trainingDenominator > 0) {
    insights.push({
      text: `Staff training rate at ${staffTrainingRate}% for hazardous materials handling. While the majority of staff have been trained, any untrained staff member handling hazardous materials creates a risk. The SCCIF expects all staff to be competent in their roles.`,
      severity: "warning",
    });
  }

  if (sharpsOverfullRate > 10 && totalSharpsRecords > 0) {
    insights.push({
      text: `${sharpsOverfullRate}% of sharps bins are full or overfull. Overfilled sharps containers are one of the most common causes of needlestick injuries -- when bins are overfull, sharps protrude and the risk of accidental contact increases significantly.`,
      severity: "warning",
    });
  }

  if (nearMissesTotal > 0 && totalChildSafetyRecords > 0) {
    insights.push({
      text: `${nearMissesTotal} near-miss${nearMissesTotal !== 1 ? "es" : ""} reported involving children and hazardous materials. Near misses are valuable safety intelligence -- each one represents a prevented harm and should be investigated to strengthen controls. The reporting culture is positive but the underlying risks need addressing.`,
      severity: "warning",
    });
  }

  if (childIncidentsTotal > 0 && totalChildSafetyRecords > 0) {
    insights.push({
      text: `${childIncidentsTotal} incident${childIncidentsTotal !== 1 ? "s" : ""} involving children and hazardous materials recorded. Every incident involving a child and hazardous material must be thoroughly investigated with lessons learned applied across the home. ${childIncidentResolutionRate}% have been resolved.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (sharpsBinRate >= 90 && totalSharpsRecords > 0) {
    insights.push({
      text: `Sharps bin compliance at ${sharpsBinRate}%. The home demonstrates exemplary sharps management with consistent inspections, secure storage, proper labelling, and documented disposal. This level of compliance provides strong evidence of safe premises for Ofsted.`,
      severity: "positive",
    });
  }

  if (hazardousWasteRate >= 90 && totalHazardousRecords > 0) {
    insights.push({
      text: `Hazardous waste management at ${hazardousWasteRate}%. The home has robust systems for storing, labelling, risk-assessing, and disposing of hazardous waste. This demonstrates compliance with environmental and health and safety regulations.`,
      severity: "positive",
    });
  }

  if (coshhComplianceRate >= 90 && totalCoshhRecords > 0) {
    insights.push({
      text: `COSHH compliance at ${coshhComplianceRate}%. All hazardous substances are assessed, securely stored, properly labelled, and supported by safety data sheets. This is strong evidence of Reg 25 compliance and a well-managed premises.`,
      severity: "positive",
    });
  }

  if (clinicalWasteRate >= 90 && totalClinicalRecords > 0) {
    insights.push({
      text: `Clinical waste management at ${clinicalWasteRate}%. Waste is correctly segregated, contained, labelled, and securely stored. This demonstrates the home's commitment to infection prevention and safe waste management.`,
      severity: "positive",
    });
  }

  if (childSafetyRate >= 90 && totalChildSafetyRecords > 0) {
    insights.push({
      text: `Child safety awareness at ${childSafetyRate}%. Children are educated about hazard risks, understand how to report dangers, and are actively involved in the home's safety culture. This demonstrates the home nurtures safety-conscious young people.`,
      severity: "positive",
    });
  }

  if (staffTrainingRate >= 90 && trainingDenominator > 0) {
    insights.push({
      text: `Staff training rate at ${staffTrainingRate}% for hazardous materials handling. The workforce is comprehensively trained in sharps safety, COSHH management, and clinical waste handling. This underpins safe practice across the home.`,
      severity: "positive",
    });
  }

  if (sharpsAccessibleRate === 0 && coshhChildAccessRate === 0 && totalSharpsRecords > 0 && totalCoshhRecords > 0) {
    insights.push({
      text: "No sharps or COSHH substances are accessible to children. The home has established comprehensive physical barriers between children and hazardous materials, which Ofsted will view as strong evidence of a safe living environment under Reg 25 and Reg 14.",
      severity: "positive",
    });
  }

  // -- Headline ---------------------------------------------------------------

  let headline = "";
  if (sharps_rating === "outstanding") {
    headline = `Outstanding sharps disposal and hazardous waste management -- sharps bin compliance at ${sharpsBinRate}%, hazardous waste at ${hazardousWasteRate}%, COSHH at ${coshhComplianceRate}%, clinical waste at ${clinicalWasteRate}%, and child safety awareness at ${childSafetyRate}%. The home demonstrates exemplary hazardous materials management protecting children from harm.`;
  } else if (sharps_rating === "good") {
    headline = `Good sharps disposal and hazardous waste management -- sharps bin compliance at ${sharpsBinRate}%, hazardous waste at ${hazardousWasteRate}%, COSHH at ${coshhComplianceRate}%, clinical waste at ${clinicalWasteRate}%. Some areas for improvement identified but overall the home manages hazardous materials safely.`;
  } else if (sharps_rating === "adequate") {
    headline = `Adequate sharps disposal and hazardous waste management -- sharps bin compliance at ${sharpsBinRate}%, hazardous waste at ${hazardousWasteRate}%, COSHH at ${coshhComplianceRate}%, clinical waste at ${clinicalWasteRate}%. Significant improvements needed in hazardous materials management to ensure children's safety.`;
  } else {
    headline = `Inadequate sharps disposal and hazardous waste management -- sharps bin compliance at ${sharpsBinRate}%, hazardous waste at ${hazardousWasteRate}%, COSHH at ${coshhComplianceRate}%, clinical waste at ${clinicalWasteRate}%. Urgent action required to protect children from hazardous materials exposure.`;
  }

  // -- Return -----------------------------------------------------------------

  return {
    sharps_rating,
    sharps_score: score,
    headline,
    sharps_bin_rate: sharpsBinRate,
    hazardous_waste_rate: hazardousWasteRate,
    coshh_compliance_rate: coshhComplianceRate,
    clinical_waste_rate: clinicalWasteRate,
    child_safety_rate: childSafetyRate,
    staff_training_rate: staffTrainingRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

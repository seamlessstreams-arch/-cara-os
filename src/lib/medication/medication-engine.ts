/* ──────────────────────────────────────────────────────────────
   Medication Intelligence Engine  v2.0

   Pure deterministic engine for evaluating medication management
   in a children's residential home — administration accuracy,
   controlled drug governance, consent, error tracking, storage,
   and staff competency.

   Regulatory basis:
     - CHR 2015 Reg 23 — Health and wellbeing (medication)
     - Misuse of Drugs Act 1971 — Controlled drug governance
     - CQC Guidance — Managing medicines in care homes
     - NICE CG76 — Medicines adherence
     - SCCIF — Health & wellbeing judgement
     - HSCA 2008 Reg 12 — Safe medication handling
     - NMS 3 — Health and wellbeing standard

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type MedicationCategory =
  | "regular_administration"
  | "prn_administration"
  | "controlled_drug"
  | "medication_storage"
  | "consent_review"
  | "medication_error"
  | "medication_review"
  | "competency_assessment";

export type MedicationOutcome =
  | "administered_correctly"
  | "dose_refused"
  | "error_identified"
  | "review_completed"
  | "not_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const categoryLabels: Record<MedicationCategory, string> = {
  regular_administration: "Regular Administration",
  prn_administration: "PRN Administration",
  controlled_drug: "Controlled Drug",
  medication_storage: "Medication Storage",
  consent_review: "Consent Review",
  medication_error: "Medication Error",
  medication_review: "Medication Review",
  competency_assessment: "Competency Assessment",
};

const outcomeLabels: Record<MedicationOutcome, string> = {
  administered_correctly: "Administered Correctly",
  dose_refused: "Dose Refused",
  error_identified: "Error Identified",
  review_completed: "Review Completed",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getMedicationCategoryLabel(cat: MedicationCategory): string {
  return categoryLabels[cat] ?? cat;
}

export function getMedicationOutcomeLabel(outcome: MedicationOutcome): string {
  return outcomeLabels[outcome] ?? outcome;
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] ?? rating;
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MedicationRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: MedicationCategory;
  outcome: MedicationOutcome;
  administeredCorrectly: boolean;
  signedByTwoStaff: boolean;
  consentOnFile: boolean;
  errorReported: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface MedicationPolicy {
  medicationPolicy: boolean;
  controlledDrugPolicy: boolean;
  administrationProcedure: boolean;
  consentFramework: boolean;
  errorReportingPolicy: boolean;
  storagePolicy: boolean;
  reviewSchedulePolicy: boolean;
}

export interface StaffMedicationTraining {
  staffId: string;
  medicationAdministration: boolean;
  controlledDrugHandling: boolean;
  errorReporting: boolean;
  consentProcess: boolean;
  storageChecks: boolean;
  medicationReview: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface MedicationQualityResult {
  overallScore: number;
  rating: Rating;
  totalRecords: number;
  administeredCorrectlyRate: number;
  signedByTwoStaffRate: number;
  consentOnFileRate: number;
  errorReportedRate: number;
}

export interface MedicationComplianceResult {
  overallScore: number;
  rating: Rating;
  documentationRate: number;
  timelyRecordingRate: number;
  signedByTwoStaffRate: number;
  categoryDiversityRatio: number;
}

export interface MedicationPolicyResult {
  overallScore: number;
  rating: Rating;
  medicationPolicy: boolean;
  controlledDrugPolicy: boolean;
  administrationProcedure: boolean;
  consentFramework: boolean;
  errorReportingPolicy: boolean;
  storagePolicy: boolean;
  reviewSchedulePolicy: boolean;
}

export interface StaffMedicationReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  medicationAdministrationRate: number;
  controlledDrugHandlingRate: number;
  errorReportingRate: number;
  consentProcessRate: number;
  storageChecksRate: number;
  medicationReviewRate: number;
}

export interface ChildMedicationProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  administeredCorrectlyRate: number;
  consentOnFileRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface MedicationIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  medicationQuality: MedicationQualityResult;
  medicationCompliance: MedicationComplianceResult;
  medicationPolicy: MedicationPolicyResult;
  staffReadiness: StaffMedicationReadinessResult;
  childProfiles: ChildMedicationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: MedicationCategory[] = [
  "regular_administration",
  "prn_administration",
  "controlled_drug",
  "medication_storage",
  "consent_review",
  "medication_error",
  "medication_review",
  "competency_assessment",
];

// ── Evaluator 1: Medication Quality (0-25) ─────────────────────────────────

export function evaluateMedicationQuality(records: MedicationRecord[]): MedicationQualityResult {
  const total = records.length;
  if (total === 0) {
    return {
      overallScore: 0,
      rating: "inadequate",
      totalRecords: 0,
      administeredCorrectlyRate: 0,
      signedByTwoStaffRate: 0,
      consentOnFileRate: 0,
      errorReportedRate: 0,
    };
  }

  const administeredCorrectlyRate = pct(records.filter((r) => r.administeredCorrectly).length, total);
  const signedByTwoStaffRate = pct(records.filter((r) => r.signedByTwoStaff).length, total);
  const consentOnFileRate = pct(records.filter((r) => r.consentOnFile).length, total);
  // "Of the administrations where an error occurred, how many were reported?"
  // A home with NO errors has nothing to report and scores full marks (100) —
  // rather than being penalised for a 0% rate computed over error-free records.
  const errorRecords = records.filter((r) => r.outcome === "error_identified");
  const errorReportedRate = errorRecords.length > 0
    ? pct(errorRecords.filter((r) => r.errorReported).length, errorRecords.length)
    : 100;

  // Weighted: administeredCorrectlyRate 7 + signedByTwoStaffRate 6 + consentOnFileRate 6 + errorReportedRate 6 = 25
  const raw =
    (administeredCorrectlyRate / 100) * 7 +
    (signedByTwoStaffRate / 100) * 6 +
    (consentOnFileRate / 100) * 6 +
    (errorReportedRate / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return {
    overallScore,
    rating: getRating(overallScore * 4),
    totalRecords: total,
    administeredCorrectlyRate,
    signedByTwoStaffRate,
    consentOnFileRate,
    errorReportedRate,
  };
}

// ── Evaluator 2: Medication Compliance (0-25) ──────────────────────────────

export function evaluateMedicationCompliance(records: MedicationRecord[]): MedicationComplianceResult {
  const total = records.length;
  if (total === 0) {
    return {
      overallScore: 0,
      rating: "inadequate",
      documentationRate: 0,
      timelyRecordingRate: 0,
      signedByTwoStaffRate: 0,
      categoryDiversityRatio: 0,
    };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, total);
  const signedByTwoStaffRate = pct(records.filter((r) => r.signedByTwoStaff).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRecordingRate 7 + signedByTwoStaffRate 5 + categoryDiversityRatio 5 = 25
  const raw =
    (documentationRate / 100) * 8 +
    (timelyRecordingRate / 100) * 7 +
    (signedByTwoStaffRate / 100) * 5 +
    (categoryDiversityRatio / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return {
    overallScore,
    rating: getRating(overallScore * 4),
    documentationRate,
    timelyRecordingRate,
    signedByTwoStaffRate,
    categoryDiversityRatio,
  };
}

// ── Evaluator 3: Policy & Governance (0-25) ────────────────────────────────

export function evaluateMedicationPolicy(policy: MedicationPolicy | null): MedicationPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      rating: "inadequate",
      medicationPolicy: false,
      controlledDrugPolicy: false,
      administrationProcedure: false,
      consentFramework: false,
      errorReportingPolicy: false,
      storagePolicy: false,
      reviewSchedulePolicy: false,
    };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.medicationPolicy) score += 4;
  if (policy.controlledDrugPolicy) score += 4;
  if (policy.administrationProcedure) score += 4;
  if (policy.consentFramework) score += 4;
  if (policy.errorReportingPolicy) score += 3;
  if (policy.storagePolicy) score += 3;
  if (policy.reviewSchedulePolicy) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    medicationPolicy: policy.medicationPolicy,
    controlledDrugPolicy: policy.controlledDrugPolicy,
    administrationProcedure: policy.administrationProcedure,
    consentFramework: policy.consentFramework,
    errorReportingPolicy: policy.errorReportingPolicy,
    storagePolicy: policy.storagePolicy,
    reviewSchedulePolicy: policy.reviewSchedulePolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffMedicationReadiness(staff: StaffMedicationTraining[]): StaffMedicationReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return {
      overallScore: 0,
      rating: "inadequate",
      totalStaff: 0,
      medicationAdministrationRate: 0,
      controlledDrugHandlingRate: 0,
      errorReportingRate: 0,
      consentProcessRate: 0,
      storageChecksRate: 0,
      medicationReviewRate: 0,
    };
  }

  const medicationAdministrationRate = pct(staff.filter((s) => s.medicationAdministration).length, count);
  const controlledDrugHandlingRate = pct(staff.filter((s) => s.controlledDrugHandling).length, count);
  const errorReportingRate = pct(staff.filter((s) => s.errorReporting).length, count);
  const consentProcessRate = pct(staff.filter((s) => s.consentProcess).length, count);
  const storageChecksRate = pct(staff.filter((s) => s.storageChecks).length, count);
  const medicationReviewRate = pct(staff.filter((s) => s.medicationReview).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (medicationAdministrationRate / 100) * 6 +
    (controlledDrugHandlingRate / 100) * 5 +
    (errorReportingRate / 100) * 5 +
    (consentProcessRate / 100) * 4 +
    (storageChecksRate / 100) * 3 +
    (medicationReviewRate / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return {
    overallScore,
    rating: getRating(overallScore * 4),
    totalStaff: count,
    medicationAdministrationRate,
    controlledDrugHandlingRate,
    errorReportingRate,
    consentProcessRate,
    storageChecksRate,
    medicationReviewRate,
  };
}

// ── Child Profiles (0-10) ──────────────────────────────────────────────────

export function buildChildMedicationProfiles(records: MedicationRecord[]): ChildMedicationProfile[] {
  const grouped = new Map<string, MedicationRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildMedicationProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const administeredCorrectlyRate = pct(recs.filter((r) => r.administeredCorrectly).length, totalRecords);
    const consentOnFileRate = pct(recs.filter((r) => r.consentOnFile).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10 -> 2, >=5 -> 1] + rate1 administeredCorrectlyRate [>=80 -> 3, >=60 -> 2, >=40 -> 1]
    //          + rate2 consentOnFileRate [same] + diversity [>=4 -> 2, >=2 -> 1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (administeredCorrectlyRate >= 80) score += 3;
    else if (administeredCorrectlyRate >= 60) score += 2;
    else if (administeredCorrectlyRate >= 40) score += 1;

    if (consentOnFileRate >= 80) score += 3;
    else if (consentOnFileRate >= 60) score += 2;
    else if (consentOnFileRate >= 40) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      administeredCorrectlyRate,
      consentOnFileRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateMedicationIntelligence(
  records: MedicationRecord[],
  policy: MedicationPolicy | null,
  staff: StaffMedicationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): MedicationIntelligence {
  const medicationQuality = evaluateMedicationQuality(records);
  const medicationCompliance = evaluateMedicationCompliance(records);
  const medicationPolicy = evaluateMedicationPolicy(policy);
  const staffReadiness = evaluateStaffMedicationReadiness(staff);
  const childProfiles = buildChildMedicationProfiles(records);

  const overallScore = Math.min(
    100,
    medicationQuality.overallScore +
      medicationCompliance.overallScore +
      medicationPolicy.overallScore +
      staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (medicationQuality.administeredCorrectlyRate >= 80) strengths.push("Medications are consistently administered correctly");
  if (medicationQuality.signedByTwoStaffRate >= 80) strengths.push("Dual-signature practice is well established");
  if (medicationQuality.consentOnFileRate >= 80) strengths.push("Consent records are consistently maintained");
  if (medicationQuality.errorReportedRate >= 80) strengths.push("Error reporting culture is strong and transparent");
  if (medicationCompliance.documentationRate >= 80) strengths.push("Medication documentation is thorough and complete");
  if (medicationCompliance.timelyRecordingRate >= 80) strengths.push("Medication records are completed in a timely manner");
  if (staffReadiness.medicationAdministrationRate >= 80) strengths.push("Staff are well trained in medication administration");
  if (staffReadiness.controlledDrugHandlingRate >= 80) strengths.push("Strong controlled drug handling competency across the team");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (medicationQuality.administeredCorrectlyRate < 60) areasForImprovement.push("Medication administration accuracy needs improvement");
  if (medicationQuality.signedByTwoStaffRate < 60) areasForImprovement.push("Dual-signature practice is not consistently followed");
  if (medicationQuality.consentOnFileRate < 60) areasForImprovement.push("Consent records are not consistently maintained");
  if (medicationQuality.errorReportedRate < 60) areasForImprovement.push("Error reporting is inconsistent — errors may go unrecorded");
  if (medicationCompliance.documentationRate < 60) areasForImprovement.push("Medication documentation is incomplete or inconsistent");
  if (medicationCompliance.timelyRecordingRate < 60) areasForImprovement.push("Medication records are not being completed promptly");
  if (staffReadiness.medicationAdministrationRate < 60) areasForImprovement.push("Staff need more training in medication administration");
  if (staffReadiness.controlledDrugHandlingRate < 60) areasForImprovement.push("Staff controlled drug handling skills require development");

  // Actions
  const actions: string[] = [];
  if (medicationPolicy.overallScore === 0) actions.push("URGENT: Establish a medication management policy — CHR 2015 Reg 23 requires documented medication procedures");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide medication training to all staff — safe administration depends on skilled practitioners");
  if (medicationQuality.administeredCorrectlyRate < 50) actions.push("Review medication administration procedures and retrain staff on correct techniques");
  if (medicationQuality.signedByTwoStaffRate < 50) actions.push("Reinforce dual-signature requirement — all controlled drugs must be signed by two staff");
  if (medicationCompliance.documentationRate < 50) actions.push("Improve medication documentation — all administrations must be fully recorded");
  if (medicationCompliance.timelyRecordingRate < 50) actions.push("Review recording timescales — medication records should be completed within 1 hour");
  if (medicationQuality.consentOnFileRate < 50) actions.push("Ensure consent is obtained and documented for every medication — NICE CG76");
  if (staffReadiness.errorReportingRate < 50) actions.push("Provide error reporting training — all staff must know how to report medication errors");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 23 — Health and wellbeing (medication)",
    "Misuse of Drugs Act 1971 — Controlled drug governance",
    "CQC Guidance — Managing medicines in care homes",
    "NICE CG76 — Medicines adherence",
    "SCCIF — Health & wellbeing judgement",
    "HSCA 2008 Reg 12 — Safe medication handling",
    "NMS 3 — Health and wellbeing standard",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    medicationQuality,
    medicationCompliance,
    medicationPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

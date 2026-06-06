/* ──────────────────────────────────────────────────────────────
   Safer Recruitment Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of safer recruitment practices in a children's
   residential care home.

   Regulatory basis:
     - CHR 2015 Reg 32 — Fitness of workers
     - CHR 2015 Schedule 2 — Information in respect of persons
       working at children's homes
     - Keeping Children Safe in Education 2024
     - Working Together to Safeguard Children 2023
     - Safeguarding Vulnerable Groups Act 2006
     - NMS 19 — Staffing of children's homes
     - SCCIF — Leadership and management: safer recruitment

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type SaferRecruitmentCategory =
  | "dbs_check"
  | "reference_verification"
  | "interview_assessment"
  | "identity_verification"
  | "qualification_check"
  | "right_to_work_check"
  | "employment_history_review"
  | "risk_assessment";

export type SaferRecruitmentOutcome =
  | "fully_compliant"
  | "minor_gap"
  | "significant_gap"
  | "non_compliant"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const saferRecruitmentCategoryLabels: Record<SaferRecruitmentCategory, string> = {
  dbs_check: "DBS Check",
  reference_verification: "Reference Verification",
  interview_assessment: "Interview Assessment",
  identity_verification: "Identity Verification",
  qualification_check: "Qualification Check",
  right_to_work_check: "Right to Work Check",
  employment_history_review: "Employment History Review",
  risk_assessment: "Risk Assessment",
};

const saferRecruitmentOutcomeLabels: Record<SaferRecruitmentOutcome, string> = {
  fully_compliant: "Fully Compliant",
  minor_gap: "Minor Gap",
  significant_gap: "Significant Gap",
  non_compliant: "Non-Compliant",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSaferRecruitmentCategoryLabel(category: SaferRecruitmentCategory): string {
  return saferRecruitmentCategoryLabels[category];
}

export function getSaferRecruitmentOutcomeLabel(outcome: SaferRecruitmentOutcome): string {
  return saferRecruitmentOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface SaferRecruitmentRecord {
  id: string;
  homeId: string;
  date: string;
  staffId: string;
  staffName: string;
  category: SaferRecruitmentCategory;
  outcome: SaferRecruitmentOutcome;
  dbsCheckCompleted: boolean;
  referencesVerified: boolean;
  interviewConducted: boolean;
  identityConfirmed: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface SaferRecruitmentPolicy {
  saferRecruitmentPolicy: boolean;
  dbsRenewalPolicy: boolean;
  referenceCheckProcedure: boolean;
  interviewProtocol: boolean;
  disqualificationByAssociationPolicy: boolean;
  inductionPolicy: boolean;
  ongoingVigilancePolicy: boolean;
}

export interface StaffSaferRecruitmentTraining {
  staffId: string;
  safeguardingRecruitment: boolean;
  dbsProcessKnowledge: boolean;
  interviewTechniques: boolean;
  referenceVerification: boolean;
  disqualificationAwareness: boolean;
  whistleblowingAwareness: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SaferRecruitmentQualityResult {
  overallScore: number;
  totalRecords: number;
  dbsCheckCompletedRate: number;
  referencesVerifiedRate: number;
  interviewConductedRate: number;
  identityConfirmedRate: number;
}

export interface SaferRecruitmentComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  dbsCheckCompletedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface SaferRecruitmentPolicyResult {
  overallScore: number;
  saferRecruitmentPolicy: boolean;
  dbsRenewalPolicy: boolean;
  referenceCheckProcedure: boolean;
  interviewProtocol: boolean;
  disqualificationByAssociationPolicy: boolean;
  inductionPolicy: boolean;
  ongoingVigilancePolicy: boolean;
}

export interface StaffSaferRecruitmentReadinessResult {
  overallScore: number;
  totalStaff: number;
  safeguardingRecruitmentRate: number;
  dbsProcessKnowledgeRate: number;
  interviewTechniquesRate: number;
  referenceVerificationRate: number;
  disqualificationAwarenessRate: number;
  whistleblowingAwarenessRate: number;
}

export interface StaffRecruitmentProfile {
  staffId: string;
  staffName: string;
  totalRecords: number;
  dbsCheckCompletedRate: number;
  referencesVerifiedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface SaferRecruitmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  saferRecruitmentQuality: SaferRecruitmentQualityResult;
  saferRecruitmentCompliance: SaferRecruitmentComplianceResult;
  saferRecruitmentPolicy: SaferRecruitmentPolicyResult;
  staffReadiness: StaffSaferRecruitmentReadinessResult;
  staffProfiles: StaffRecruitmentProfile[];
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

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluateSaferRecruitmentQuality(
  records: SaferRecruitmentRecord[],
): SaferRecruitmentQualityResult {
  const n = records.length;

  if (n === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      dbsCheckCompletedRate: 0,
      referencesVerifiedRate: 0,
      interviewConductedRate: 0,
      identityConfirmedRate: 0,
    };
  }

  const dbsCheckCompletedRate = pct(records.filter((r) => r.dbsCheckCompleted).length, n);
  const referencesVerifiedRate = pct(records.filter((r) => r.referencesVerified).length, n);
  const interviewConductedRate = pct(records.filter((r) => r.interviewConducted).length, n);
  const identityConfirmedRate = pct(records.filter((r) => r.identityConfirmed).length, n);

  // Weights: dbsCheckCompletedRate 7 + referencesVerifiedRate 6 + interviewConductedRate 6 + identityConfirmedRate 6 = 25
  let score = 0;
  score += (dbsCheckCompletedRate / 100) * 7;
  score += (referencesVerifiedRate / 100) * 6;
  score += (interviewConductedRate / 100) * 6;
  score += (identityConfirmedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalRecords: n,
    dbsCheckCompletedRate,
    referencesVerifiedRate,
    interviewConductedRate,
    identityConfirmedRate,
  };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateSaferRecruitmentCompliance(
  records: SaferRecruitmentRecord[],
): SaferRecruitmentComplianceResult {
  const n = records.length;

  if (n === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      documentationRate: 0,
      timelyRecordingRate: 0,
      dbsCheckCompletedRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
    };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const dbsCheckCompletedRate = pct(records.filter((r) => r.dbsCheckCompleted).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  // Weights: documentationRate 8 + timelyRecordingRate 7 + dbsCheckCompletedRate 5 + categoryDiversityRatio 5 = 25
  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (dbsCheckCompletedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalRecords: n,
    documentationRate,
    timelyRecordingRate,
    dbsCheckCompletedRate,
    categoryDiversityRatio,
    uniqueCategories,
  };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateSaferRecruitmentPolicy(
  policy: SaferRecruitmentPolicy | null,
): SaferRecruitmentPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      saferRecruitmentPolicy: false,
      dbsRenewalPolicy: false,
      referenceCheckProcedure: false,
      interviewProtocol: false,
      disqualificationByAssociationPolicy: false,
      inductionPolicy: false,
      ongoingVigilancePolicy: false,
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.saferRecruitmentPolicy) score += 4;
  if (policy.dbsRenewalPolicy) score += 4;
  if (policy.referenceCheckProcedure) score += 4;
  if (policy.interviewProtocol) score += 4;
  if (policy.disqualificationByAssociationPolicy) score += 3;
  if (policy.inductionPolicy) score += 3;
  if (policy.ongoingVigilancePolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    saferRecruitmentPolicy: policy.saferRecruitmentPolicy,
    dbsRenewalPolicy: policy.dbsRenewalPolicy,
    referenceCheckProcedure: policy.referenceCheckProcedure,
    interviewProtocol: policy.interviewProtocol,
    disqualificationByAssociationPolicy: policy.disqualificationByAssociationPolicy,
    inductionPolicy: policy.inductionPolicy,
    ongoingVigilancePolicy: policy.ongoingVigilancePolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffSaferRecruitmentReadiness(
  training: StaffSaferRecruitmentTraining[],
): StaffSaferRecruitmentReadinessResult {
  const n = training.length;

  if (n === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      safeguardingRecruitmentRate: 0,
      dbsProcessKnowledgeRate: 0,
      interviewTechniquesRate: 0,
      referenceVerificationRate: 0,
      disqualificationAwarenessRate: 0,
      whistleblowingAwarenessRate: 0,
    };
  }

  const safeguardingRecruitmentRate = pct(training.filter((t) => t.safeguardingRecruitment).length, n);
  const dbsProcessKnowledgeRate = pct(training.filter((t) => t.dbsProcessKnowledge).length, n);
  const interviewTechniquesRate = pct(training.filter((t) => t.interviewTechniques).length, n);
  const referenceVerificationRate = pct(training.filter((t) => t.referenceVerification).length, n);
  const disqualificationAwarenessRate = pct(training.filter((t) => t.disqualificationAwareness).length, n);
  const whistleblowingAwarenessRate = pct(training.filter((t) => t.whistleblowingAwareness).length, n);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (safeguardingRecruitmentRate / 100) * 6;
  score += (dbsProcessKnowledgeRate / 100) * 5;
  score += (interviewTechniquesRate / 100) * 5;
  score += (referenceVerificationRate / 100) * 4;
  score += (disqualificationAwarenessRate / 100) * 3;
  score += (whistleblowingAwarenessRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalStaff: n,
    safeguardingRecruitmentRate,
    dbsProcessKnowledgeRate,
    interviewTechniquesRate,
    referenceVerificationRate,
    disqualificationAwarenessRate,
    whistleblowingAwarenessRate,
  };
}

// ── Build Staff Recruitment Profiles ────────────────────────────────────

export function buildStaffRecruitmentProfiles(
  records: SaferRecruitmentRecord[],
): StaffRecruitmentProfile[] {
  if (records.length === 0) return [];

  const staffMap = new Map<string, { staffId: string; staffName: string; records: SaferRecruitmentRecord[] }>();

  for (const r of records) {
    if (!staffMap.has(r.staffId)) {
      staffMap.set(r.staffId, { staffId: r.staffId, staffName: r.staffName, records: [] });
    }
    staffMap.get(r.staffId)!.records.push(r);
  }

  return Array.from(staffMap.values()).map((staff) => {
    const totalRecords = staff.records.length;

    const dbsCheckCompletedRate = pct(
      staff.records.filter((r) => r.dbsCheckCompleted).length,
      totalRecords,
    );
    const referencesVerifiedRate = pct(
      staff.records.filter((r) => r.referencesVerified).length,
      totalRecords,
    );

    const uniqueCategoriesSet = new Set(staff.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    // frequency: >=10 records -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    // rate1 (dbsCheckCompletedRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (dbsCheckCompletedRate >= 80) rate1Score = 3;
    else if (dbsCheckCompletedRate >= 60) rate1Score = 2;
    else if (dbsCheckCompletedRate >= 40) rate1Score = 1;

    // rate2 (referencesVerifiedRate): same thresholds
    let rate2Score = 0;
    if (referencesVerifiedRate >= 80) rate2Score = 3;
    else if (referencesVerifiedRate >= 60) rate2Score = 2;
    else if (referencesVerifiedRate >= 40) rate2Score = 1;

    // diversity (unique categories): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      staffId: staff.staffId,
      staffName: staff.staffName,
      totalRecords,
      dbsCheckCompletedRate,
      referencesVerifiedRate,
      categoriesCovered,
      overallScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateSaferRecruitmentIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: SaferRecruitmentRecord[];
  policy: SaferRecruitmentPolicy | null;
  staff: StaffSaferRecruitmentTraining[];
}

export function generateSaferRecruitmentIntelligence(
  input: GenerateSaferRecruitmentIntelligenceInput,
): SaferRecruitmentIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  // Filter records to period
  const periodRecords = records.filter(
    (r) => withinPeriod(r.date, periodStart, periodEnd),
  );

  // Evaluate each layer
  const qualityResult = evaluateSaferRecruitmentQuality(periodRecords);
  const complianceResult = evaluateSaferRecruitmentCompliance(periodRecords);
  const policyResult = evaluateSaferRecruitmentPolicy(policy);
  const staffResult = evaluateStaffSaferRecruitmentReadiness(staff);

  // Build staff recruitment profiles
  const staffProfiles = buildStaffRecruitmentProfiles(periodRecords);

  // Overall score capped at 100
  const rawScore =
    qualityResult.overallScore +
    complianceResult.overallScore +
    policyResult.overallScore +
    staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Safer recruitment practices rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Safer recruitment practices rated Good (" + overallScore + "/100)");
  }

  if (qualityResult.overallScore >= 20) {
    strengths.push("Recruitment quality is strong (score " + qualityResult.overallScore + "/25)");
  }
  if (complianceResult.overallScore >= 20) {
    strengths.push("Recruitment compliance is strong (score " + complianceResult.overallScore + "/25)");
  }
  if (policyResult.overallScore >= 20) {
    strengths.push("Safer recruitment policy framework is robust (score " + policyResult.overallScore + "/25)");
  }
  if (staffResult.overallScore >= 20) {
    strengths.push("Staff safer recruitment readiness is strong (score " + staffResult.overallScore + "/25)");
  }

  if (periodRecords.length > 0 && qualityResult.dbsCheckCompletedRate >= 90) {
    strengths.push("DBS checks completed at " + qualityResult.dbsCheckCompletedRate + "% — robust vetting in place");
  }
  if (periodRecords.length > 0 && qualityResult.referencesVerifiedRate >= 90) {
    strengths.push("References verified at " + qualityResult.referencesVerifiedRate + "% — thorough reference checking");
  }
  if (periodRecords.length > 0 && qualityResult.interviewConductedRate >= 90) {
    strengths.push("Interviews conducted at " + qualityResult.interviewConductedRate + "% — consistent interview practice");
  }
  if (periodRecords.length > 0 && complianceResult.documentationRate >= 90) {
    strengths.push("Recruitment documentation at " + complianceResult.documentationRate + "% — comprehensive records");
  }

  // Areas for improvement
  const areasForImprovement: string[] = [];

  if (overallScore < 40) {
    areasForImprovement.push("Safer recruitment rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areasForImprovement.push("Safer recruitment Requires Improvement (" + overallScore + "/100)");
  }

  if (qualityResult.overallScore < 15) {
    areasForImprovement.push("Recruitment quality needs improvement (score " + qualityResult.overallScore + "/25)");
  }
  if (complianceResult.overallScore < 15) {
    areasForImprovement.push("Recruitment compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  }
  if (policyResult.overallScore < 15) {
    areasForImprovement.push("Safer recruitment policy framework needs strengthening (score " + policyResult.overallScore + "/25)");
  }
  if (staffResult.overallScore < 15) {
    areasForImprovement.push("Staff safer recruitment readiness needs improvement (score " + staffResult.overallScore + "/25)");
  }

  if (periodRecords.length > 0 && qualityResult.dbsCheckCompletedRate < 80) {
    areasForImprovement.push("DBS check completion at " + qualityResult.dbsCheckCompletedRate + "% — must achieve 100% for safeguarding compliance");
  }
  if (periodRecords.length > 0 && qualityResult.referencesVerifiedRate < 80) {
    areasForImprovement.push("Reference verification at " + qualityResult.referencesVerifiedRate + "% — all references must be verified before appointment");
  }
  if (periodRecords.length > 0 && qualityResult.identityConfirmedRate < 80) {
    areasForImprovement.push("Identity confirmation at " + qualityResult.identityConfirmedRate + "% — identity must be verified for all candidates");
  }
  if (periodRecords.length === 0) {
    areasForImprovement.push("No safer recruitment records — recruitment checks must be documented");
  }
  if (policy === null) {
    areasForImprovement.push("No safer recruitment policy in place — statutory requirement");
  }
  if (staff.length === 0) {
    areasForImprovement.push("No staff safer recruitment training records — training must be provided");
  }

  // Actions
  const actions: string[] = [];

  if (policy === null || policyResult.overallScore === 0) {
    actions.push("URGENT: No safer recruitment policy — develop and implement comprehensive policy immediately");
  }

  if (staff.length === 0) {
    actions.push("URGENT: No staff safer recruitment training records — schedule training for all staff involved in recruitment");
  }

  if (periodRecords.length > 0 && qualityResult.dbsCheckCompletedRate < 100) {
    actions.push("URGENT: DBS check completion at " + qualityResult.dbsCheckCompletedRate + "% — ensure DBS checks are completed for all candidates before appointment");
  }

  if (periodRecords.length > 0 && qualityResult.referencesVerifiedRate < 50) {
    actions.push("HIGH: Reference verification at " + qualityResult.referencesVerifiedRate + "% — strengthen reference checking procedures");
  }

  if (periodRecords.length > 0 && complianceResult.documentationRate < 50) {
    actions.push("HIGH: Documentation rate at " + complianceResult.documentationRate + "% — all recruitment activities must be fully documented");
  }

  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) {
    actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — recruitment records must be completed promptly");
  }

  if (periodRecords.length > 0 && qualityResult.interviewConductedRate < 50) {
    actions.push("MEDIUM: Interview rate at " + qualityResult.interviewConductedRate + "% — all candidates must be formally interviewed");
  }

  if (staff.length > 0 && staffResult.safeguardingRecruitmentRate < 50) {
    actions.push("MEDIUM: Safeguarding recruitment training at " + staffResult.safeguardingRecruitmentRate + "% — schedule training for all recruiting staff");
  }

  const lowScoreStaff = staffProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreStaff.length > 0) {
    actions.push("MEDIUM: " + lowScoreStaff.length + " staff member(s) with low recruitment compliance scores — review individual recruitment files");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Safer recruitment systems operating within expected standards.");
  }

  // Regulatory links
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 32 — Fitness of workers",
    "CHR 2015 Schedule 2 — Information in respect of persons working at children's homes",
    "Keeping Children Safe in Education 2024",
    "Working Together to Safeguard Children 2023",
    "Safeguarding Vulnerable Groups Act 2006",
    "NMS 19 — Staffing of children's homes",
    "SCCIF — Leadership and management: safer recruitment",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    saferRecruitmentQuality: qualityResult,
    saferRecruitmentCompliance: complianceResult,
    saferRecruitmentPolicy: policyResult,
    staffReadiness: staffResult,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

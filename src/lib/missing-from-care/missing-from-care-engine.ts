// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Missing From Care Intelligence Engine (4-Evaluator Pattern)
//
// Deterministic engine for analysing the quality, compliance, policy,
// and staff readiness of a children's home's missing from care response.
//
// Aligned to:
//   - CHR 2015 Reg 34(1)(f) — Missing from care procedures
//   - DfE Statutory Guidance — Children who run away or go missing
//   - CHR 2015 Reg 40 — Notifiable events (missing)
//   - SCCIF — Safety: missing episodes
//   - Children Act 1989 s.22 — Duty to safeguard welfare
//   - Local protocol — Police notification timelines
//   - Quality Standards 2015 — Standard 5 (keeping safe)
//
// Scoring: 4 evaluators x 25 = 100. Cap 100.
// Rating: >=80 outstanding, >=60 good, >=40 requires_improvement, <40 inadequate.
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type MissingFromCareCategory =
  | "missing_episode"
  | "absent_episode"
  | "return_interview"
  | "risk_assessment"
  | "police_notification"
  | "pattern_analysis"
  | "prevention_plan"
  | "debrief_session";

export type MissingFromCareOutcome =
  | "resolved_safely"
  | "resolved_with_concern"
  | "ongoing_monitoring"
  | "escalated"
  | "not_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ────────────────────────────────────────────────────

const MISSING_FROM_CARE_CATEGORY_LABELS: Record<MissingFromCareCategory, string> = {
  missing_episode: "Missing Episode",
  absent_episode: "Absent Episode",
  return_interview: "Return Interview",
  risk_assessment: "Risk Assessment",
  police_notification: "Police Notification",
  pattern_analysis: "Pattern Analysis",
  prevention_plan: "Prevention Plan",
  debrief_session: "Debrief Session",
};

const MISSING_FROM_CARE_OUTCOME_LABELS: Record<MissingFromCareOutcome, string> = {
  resolved_safely: "Resolved Safely",
  resolved_with_concern: "Resolved with Concern",
  ongoing_monitoring: "Ongoing Monitoring",
  escalated: "Escalated",
  not_applicable: "Not Applicable",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getMissingFromCareCategoryLabel(category: MissingFromCareCategory): string {
  return MISSING_FROM_CARE_CATEGORY_LABELS[category];
}

export function getMissingFromCareOutcomeLabel(outcome: MissingFromCareOutcome): string {
  return MISSING_FROM_CARE_OUTCOME_LABELS[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

// ── Core Interfaces ─────────────────────────────────────────────────────────

export interface MissingFromCareRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: MissingFromCareCategory;
  outcome: MissingFromCareOutcome;
  policeNotifiedTimely: boolean;
  returnInterviewCompleted: boolean;
  riskAssessmentUpdated: boolean;
  preventionPlanReviewed: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface MissingFromCarePolicy {
  missingPersonsPolicy: boolean;
  policeNotificationProcedure: boolean;
  returnInterviewFramework: boolean;
  riskAssessmentPolicy: boolean;
  preventionStrategyPolicy: boolean;
  debriefProcedure: boolean;
  patternAnalysisPolicy: boolean;
}

export interface StaffMissingFromCareTraining {
  staffId: string;
  missingPersonsResponse: boolean;
  returnInterviewConduct: boolean;
  riskAssessmentSkills: boolean;
  policeNotificationProcess: boolean;
  patternRecognition: boolean;
  preventionPlanning: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface QualityResult {
  overallScore: number; // 0-25
  totalRecords: number;
  policeNotifiedTimelyRate: number;
  returnInterviewCompletedRate: number;
  riskAssessmentUpdatedRate: number;
  preventionPlanReviewedRate: number;
}

export interface ComplianceResult {
  overallScore: number; // 0-25
  documentationRate: number;
  timelyRecordingRate: number;
  returnInterviewCompletedRate: number;
  categoryDiversityRatio: number;
}

export interface PolicyResult {
  overallScore: number; // 0-25
  missingPersonsPolicy: boolean;
  policeNotificationProcedure: boolean;
  returnInterviewFramework: boolean;
  riskAssessmentPolicy: boolean;
  preventionStrategyPolicy: boolean;
  debriefProcedure: boolean;
  patternAnalysisPolicy: boolean;
}

export interface StaffReadinessResult {
  overallScore: number; // 0-25
  missingPersonsResponseRate: number;
  returnInterviewConductRate: number;
  riskAssessmentSkillsRate: number;
  policeNotificationProcessRate: number;
  patternRecognitionRate: number;
  preventionPlanningRate: number;
}

export interface ChildProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  returnInterviewCompletedRate: number;
  riskAssessmentUpdatedRate: number;
  categoriesCovered: string[];
  overallScore: number; // 0-10
}

export interface MissingFromCareIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  quality: QualityResult;
  compliance: ComplianceResult;
  policy: PolicyResult;
  staffReadiness: StaffReadinessResult;

  childProfiles: ChildProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── All Category Types (for diversity calculation) ──────────────────────────

const ALL_CATEGORIES: MissingFromCareCategory[] = [
  "missing_episode",
  "absent_episode",
  "return_interview",
  "risk_assessment",
  "police_notification",
  "pattern_analysis",
  "prevention_plan",
  "debrief_session",
];

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 1: Quality (0-25)
// Weights: policeNotifiedTimelyRate(7) + returnInterviewCompletedRate(6)
//          + riskAssessmentUpdatedRate(6) + preventionPlanReviewedRate(6)
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateQuality(records: MissingFromCareRecord[]): QualityResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      policeNotifiedTimelyRate: 0,
      returnInterviewCompletedRate: 0,
      riskAssessmentUpdatedRate: 0,
      preventionPlanReviewedRate: 0,
    };
  }

  const policeNotifiedTimelyCount = records.filter((r) => r.policeNotifiedTimely).length;
  const policeNotifiedTimelyRate = pct(policeNotifiedTimelyCount, totalRecords);

  const returnInterviewCompletedCount = records.filter((r) => r.returnInterviewCompleted).length;
  const returnInterviewCompletedRate = pct(returnInterviewCompletedCount, totalRecords);

  const riskAssessmentUpdatedCount = records.filter((r) => r.riskAssessmentUpdated).length;
  const riskAssessmentUpdatedRate = pct(riskAssessmentUpdatedCount, totalRecords);

  const preventionPlanReviewedCount = records.filter((r) => r.preventionPlanReviewed).length;
  const preventionPlanReviewedRate = pct(preventionPlanReviewedCount, totalRecords);

  // Score (out of 25): 7+6+6+6
  let score = 0;
  score += (policeNotifiedTimelyRate / 100) * 7;
  score += (returnInterviewCompletedRate / 100) * 6;
  score += (riskAssessmentUpdatedRate / 100) * 6;
  score += (preventionPlanReviewedRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    overallScore: score,
    totalRecords,
    policeNotifiedTimelyRate,
    returnInterviewCompletedRate,
    riskAssessmentUpdatedRate,
    preventionPlanReviewedRate,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 2: Compliance (0-25)
// Weights: documentationRate(8) + timelyRecordingRate(7) +
//          returnInterviewCompletedRate(5) + categoryDiversityRatio(5) = 25
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateCompliance(records: MissingFromCareRecord[]): ComplianceResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      overallScore: 0,
      documentationRate: 0,
      timelyRecordingRate: 0,
      returnInterviewCompletedRate: 0,
      categoryDiversityRatio: 0,
    };
  }

  const documentedCount = records.filter((r) => r.documentationComplete).length;
  const documentationRate = pct(documentedCount, totalRecords);

  const timelyCount = records.filter((r) => r.timelyRecording).length;
  const timelyRecordingRate = pct(timelyCount, totalRecords);

  const returnInterviewCount = records.filter((r) => r.returnInterviewCompleted).length;
  const returnInterviewCompletedRate = pct(returnInterviewCount, totalRecords);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Score (out of 25): 8+7+5+5
  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (returnInterviewCompletedRate / 100) * 5;
  score += (categoryDiversityRatio / 100) * 5;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    overallScore: score,
    documentationRate,
    timelyRecordingRate,
    returnInterviewCompletedRate,
    categoryDiversityRatio,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 3: Policy (0-25)
// Weights: 4+4+4+4+3+3+3 = 25
// ══════════════════════════════════════════════════════════════════════════════

export function evaluatePolicy(policy: MissingFromCarePolicy | null): PolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      missingPersonsPolicy: false,
      policeNotificationProcedure: false,
      returnInterviewFramework: false,
      riskAssessmentPolicy: false,
      preventionStrategyPolicy: false,
      debriefProcedure: false,
      patternAnalysisPolicy: false,
    };
  }

  let score = 0;
  if (policy.missingPersonsPolicy) score += 4;
  if (policy.policeNotificationProcedure) score += 4;
  if (policy.returnInterviewFramework) score += 4;
  if (policy.riskAssessmentPolicy) score += 4;
  if (policy.preventionStrategyPolicy) score += 3;
  if (policy.debriefProcedure) score += 3;
  if (policy.patternAnalysisPolicy) score += 3;

  score = clamp(score, 0, 25);

  return {
    overallScore: score,
    missingPersonsPolicy: policy.missingPersonsPolicy,
    policeNotificationProcedure: policy.policeNotificationProcedure,
    returnInterviewFramework: policy.returnInterviewFramework,
    riskAssessmentPolicy: policy.riskAssessmentPolicy,
    preventionStrategyPolicy: policy.preventionStrategyPolicy,
    debriefProcedure: policy.debriefProcedure,
    patternAnalysisPolicy: policy.patternAnalysisPolicy,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 4: Staff Readiness (0-25)
// Weights: 6+5+5+4+3+2 = 25
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateStaffReadiness(
  training: StaffMissingFromCareTraining[],
): StaffReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      overallScore: 0,
      missingPersonsResponseRate: 0,
      returnInterviewConductRate: 0,
      riskAssessmentSkillsRate: 0,
      policeNotificationProcessRate: 0,
      patternRecognitionRate: 0,
      preventionPlanningRate: 0,
    };
  }

  const missingPersonsResponseCount = training.filter((t) => t.missingPersonsResponse).length;
  const missingPersonsResponseRate = pct(missingPersonsResponseCount, totalStaff);

  const returnInterviewConductCount = training.filter((t) => t.returnInterviewConduct).length;
  const returnInterviewConductRate = pct(returnInterviewConductCount, totalStaff);

  const riskAssessmentSkillsCount = training.filter((t) => t.riskAssessmentSkills).length;
  const riskAssessmentSkillsRate = pct(riskAssessmentSkillsCount, totalStaff);

  const policeNotificationProcessCount = training.filter((t) => t.policeNotificationProcess).length;
  const policeNotificationProcessRate = pct(policeNotificationProcessCount, totalStaff);

  const patternRecognitionCount = training.filter((t) => t.patternRecognition).length;
  const patternRecognitionRate = pct(patternRecognitionCount, totalStaff);

  const preventionPlanningCount = training.filter((t) => t.preventionPlanning).length;
  const preventionPlanningRate = pct(preventionPlanningCount, totalStaff);

  // Score (out of 25): 6+5+5+4+3+2
  let score = 0;
  score += (missingPersonsResponseRate / 100) * 6;
  score += (returnInterviewConductRate / 100) * 5;
  score += (riskAssessmentSkillsRate / 100) * 5;
  score += (policeNotificationProcessRate / 100) * 4;
  score += (patternRecognitionRate / 100) * 3;
  score += (preventionPlanningRate / 100) * 2;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    overallScore: score,
    missingPersonsResponseRate,
    returnInterviewConductRate,
    riskAssessmentSkillsRate,
    policeNotificationProcessRate,
    patternRecognitionRate,
    preventionPlanningRate,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Build Child Profiles (0-10)
// freq (>=10 -> 2, >=5 -> 1) + rate1/returnInterviewCompletedRate (>=80 -> 3, >=60 -> 2, >=40 -> 1)
// + rate2/riskAssessmentUpdatedRate (same) + diversity (>=4 -> 2, >=2 -> 1). Cap 10.
// ══════════════════════════════════════════════════════════════════════════════

export function buildChildProfiles(records: MissingFromCareRecord[]): ChildProfile[] {
  const childMap = new Map<string, { childId: string; childName: string; records: MissingFromCareRecord[] }>();

  for (const record of records) {
    const existing = childMap.get(record.childId);
    if (existing) {
      existing.records.push(record);
    } else {
      childMap.set(record.childId, {
        childId: record.childId,
        childName: record.childName,
        records: [record],
      });
    }
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;

    const returnInterviewCount = child.records.filter((r) => r.returnInterviewCompleted).length;
    const returnInterviewCompletedRate = pct(returnInterviewCount, totalRecords);

    const riskAssessmentCount = child.records.filter((r) => r.riskAssessmentUpdated).length;
    const riskAssessmentUpdatedRate = pct(riskAssessmentCount, totalRecords);

    const uniqueCategories = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategories);

    // Score 0-10
    let score = 0;

    // Frequency: 0-2
    if (totalRecords >= 10) {
      score += 2;
    } else if (totalRecords >= 5) {
      score += 1;
    }

    // rate1 (returnInterviewCompletedRate): 0-3
    if (returnInterviewCompletedRate >= 80) {
      score += 3;
    } else if (returnInterviewCompletedRate >= 60) {
      score += 2;
    } else if (returnInterviewCompletedRate >= 40) {
      score += 1;
    }

    // rate2 (riskAssessmentUpdatedRate): 0-3
    if (riskAssessmentUpdatedRate >= 80) {
      score += 3;
    } else if (riskAssessmentUpdatedRate >= 60) {
      score += 2;
    } else if (riskAssessmentUpdatedRate >= 40) {
      score += 1;
    }

    // Diversity: 0-2
    if (uniqueCategories.size >= 4) {
      score += 2;
    } else if (uniqueCategories.size >= 2) {
      score += 1;
    }

    score = clamp(score, 0, 10);

    return {
      childId: child.childId,
      childName: child.childName,
      totalRecords,
      returnInterviewCompletedRate,
      riskAssessmentUpdatedRate,
      categoriesCovered,
      overallScore: score,
    };
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Generate Full Intelligence
// ══════════════════════════════════════════════════════════════════════════════

export function generateMissingFromCareIntelligence(
  records: MissingFromCareRecord[],
  policy: MissingFromCarePolicy | null,
  training: StaffMissingFromCareTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): MissingFromCareIntelligence {
  const assessedAt = periodEnd;

  // Evaluate each layer
  const quality = evaluateQuality(records);
  const compliance = evaluateCompliance(records);
  const policyResult = evaluatePolicy(policy);
  const staffReadiness = evaluateStaffReadiness(training);

  // Build child profiles
  const childProfiles = buildChildProfiles(records);

  // Overall score (100 points, capped)
  const rawScore =
    quality.overallScore +
    compliance.overallScore +
    policyResult.overallScore +
    staffReadiness.overallScore;
  const overallScore = clamp(Math.round(rawScore), 0, 100);

  const rating = getRating(overallScore);

  // Derive strengths, areas for improvement, actions, regulatory links
  const strengths = deriveStrengths(quality, compliance, policyResult, staffReadiness, overallScore);
  const areasForImprovement = deriveAreasForImprovement(quality, compliance, overallScore);
  const actions = deriveActions(records, policy, training, quality, compliance);
  const regulatoryLinks = [
    "CHR 2015 Reg 34(1)(f) — Missing from care procedures",
    "DfE Statutory Guidance — Children who run away or go missing",
    "CHR 2015 Reg 40 — Notifiable events (missing)",
    "SCCIF — Safety: missing episodes",
    "Children Act 1989 s.22 — Duty to safeguard welfare",
    "Local protocol — Police notification timelines",
    "Quality Standards 2015 — Standard 5 (keeping safe)",
  ];

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    quality,
    compliance,
    policy: policyResult,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Derive Strengths ────────────────────────────────────────────────────────

function deriveStrengths(
  quality: QualityResult,
  compliance: ComplianceResult,
  policy: PolicyResult,
  staff: StaffReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall missing from care management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall missing from care management rated Good (" + overallScore + "/100)");
  }

  if (quality.policeNotifiedTimelyRate >= 80) {
    strengths.push("Strong police notification timeliness: " + quality.policeNotifiedTimelyRate + "% notified within protocol timelines");
  }

  if (quality.returnInterviewCompletedRate >= 80) {
    strengths.push("Excellent return interview completion: " + quality.returnInterviewCompletedRate + "% of return interviews completed");
  }

  if (quality.riskAssessmentUpdatedRate >= 80) {
    strengths.push("Risk assessments consistently updated following episodes: " + quality.riskAssessmentUpdatedRate + "%");
  }

  if (compliance.documentationRate >= 80) {
    strengths.push("Strong documentation: " + compliance.documentationRate + "% of records fully documented");
  }

  if (compliance.timelyRecordingRate >= 80) {
    strengths.push("Timely recording practice: " + compliance.timelyRecordingRate + "% of records completed on time");
  }

  if (policy.overallScore === 25) {
    strengths.push("Comprehensive missing from care policy framework with all key elements in place");
  }

  if (staff.missingPersonsResponseRate >= 90) {
    strengths.push("Excellent missing persons response training: " + staff.missingPersonsResponseRate + "% of staff trained");
  }

  return strengths;
}

// ── Derive Areas for Improvement ────────────────────────────────────────────

function deriveAreasForImprovement(
  quality: QualityResult,
  compliance: ComplianceResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall missing from care management rated Inadequate (" + overallScore + "/100) — urgent review required");
  } else if (overallScore < 60) {
    areas.push("Overall missing from care management Requires Improvement (" + overallScore + "/100)");
  }

  if (quality.totalRecords > 0 && quality.policeNotifiedTimelyRate < 60) {
    areas.push("Police notification timeliness at " + quality.policeNotifiedTimelyRate + "% — below 60% threshold, protocol review needed");
  }

  if (quality.totalRecords > 0 && quality.returnInterviewCompletedRate < 60) {
    areas.push("Return interview completion at " + quality.returnInterviewCompletedRate + "% — statutory requirement not being met consistently");
  }

  if (quality.totalRecords > 0 && quality.riskAssessmentUpdatedRate < 60) {
    areas.push("Risk assessment update rate at " + quality.riskAssessmentUpdatedRate + "% — assessments should be updated after every episode");
  }

  if (compliance.documentationRate > 0 && compliance.documentationRate < 60) {
    areas.push("Documentation rate at " + compliance.documentationRate + "% — all missing episodes must be fully documented");
  }

  if (compliance.timelyRecordingRate > 0 && compliance.timelyRecordingRate < 60) {
    areas.push("Timely recording rate at " + compliance.timelyRecordingRate + "% — records must be completed promptly after episodes");
  }

  return areas;
}

// ── Derive Actions ──────────────────────────────────────────────────────────

function deriveActions(
  records: MissingFromCareRecord[],
  policy: MissingFromCarePolicy | null,
  training: StaffMissingFromCareTraining[],
  quality: QualityResult,
  compliance: ComplianceResult,
): string[] {
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push("No missing from care records found — begin recording all missing and absent episodes immediately");
  }

  if (policy === null) {
    actions.push("URGENT: No missing from care policy in place — develop and implement a comprehensive missing persons policy");
  }

  if (training.length === 0) {
    actions.push("URGENT: No staff missing from care training records — arrange training for all residential staff");
  }

  if (quality.totalRecords > 0 && quality.policeNotifiedTimelyRate < 60) {
    actions.push("Review police notification procedures to improve timeliness from " + quality.policeNotifiedTimelyRate + "%");
  }

  if (quality.totalRecords > 0 && quality.returnInterviewCompletedRate < 60) {
    actions.push("Implement consistent return interview process to improve completion from " + quality.returnInterviewCompletedRate + "%");
  }

  if (compliance.documentationRate > 0 && compliance.documentationRate < 60) {
    actions.push("Ensure all missing episodes are fully documented (" + compliance.documentationRate + "% currently documented)");
  }

  if (compliance.timelyRecordingRate > 0 && compliance.timelyRecordingRate < 60) {
    actions.push("Improve recording timeliness — currently at " + compliance.timelyRecordingRate + "%");
  }

  return actions;
}

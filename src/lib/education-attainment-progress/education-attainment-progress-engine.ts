// ══════════════════════════════════════════════════════════════════════════════
// EDUCATION ATTAINMENT & PROGRESS INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well a children's residential
// home supports looked-after children's educational attainment, school
// attendance, and academic progress.
//
// Regulatory basis:
//   - CHR 2015 Regulation 8 — The education standard
//   - CHR 2015 Regulation 9 — Quality of care standard
//   - SCCIF — Education and learning
//   - NMS 8 — Education
//   - Children Act 1989
//   - Children and Families Act 2014
//   - Virtual School Head guidance
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";
import { meets, rate } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type EducationArea =
  | "attendance"
  | "academic_progress"
  | "pep_review"
  | "homework_support"
  | "extra_curricular"
  | "sen_support"
  | "careers_guidance"
  | "school_liaison";

export type ProgressLevel =
  | "exceeding"
  | "expected"
  | "developing"
  | "below"
  | "significantly_below";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ──────────────────────────────────────────────────

const educationAreaLabels: Record<EducationArea, string> = {
  attendance: "Attendance",
  academic_progress: "Academic Progress",
  pep_review: "PEP Review",
  homework_support: "Homework Support",
  extra_curricular: "Extra-Curricular",
  sen_support: "SEN Support",
  careers_guidance: "Careers Guidance",
  school_liaison: "School Liaison",
};

const progressLevelLabels: Record<ProgressLevel, string> = {
  exceeding: "Exceeding",
  expected: "Expected",
  developing: "Developing",
  below: "Below",
  significantly_below: "Significantly Below",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getEducationAreaLabel(area: EducationArea): string {
  return educationAreaLabels[area];
}

export function getProgressLevelLabel(level: ProgressLevel): string {
  return progressLevelLabels[level];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface EducationRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string; // ISO date
  educationArea: EducationArea;
  progressLevel: ProgressLevel;
  pepUpdated: boolean;
  schoolAttendanceGood: boolean;
  staffAdvocacyProvided: boolean;
  documentedInPlan: boolean;
  virtualSchoolLinked: boolean;
  childViewsCaptured: boolean;
}

export interface EducationPolicy {
  id: string;
  educationChampionRole: boolean;
  pepReviewSchedule: boolean;
  attendanceMonitoring: boolean;
  homeworkSupportPlan: boolean;
  senCoordination: boolean;
  virtualSchoolPartnership: boolean;
  regularReview: boolean;
}

export interface StaffEducationTraining {
  id: string;
  staffId: string;
  staffName: string;
  educationSupport: boolean;
  pepProcess: boolean;
  attendanceImportance: boolean;
  senAwareness: boolean;
  homeworkStrategies: boolean;
  virtualSchoolProtocol: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────

export interface EducationQualityResult {
  totalRecords: number;
  progressRate: number | null;
  pepUpdatedRate: number | null;
  attendanceRate: number | null;
  childViewsRate: number | null;
  score: number | null; // 0-25
}

export interface EducationComplianceResult {
  totalRecords: number;
  staffAdvocacyRate: number | null;
  documentedRate: number | null;
  virtualSchoolRate: number | null;
  areaDiversity: number;
  score: number | null; // 0-25
}

export interface EducationPolicyResult {
  educationChampionRole: boolean;
  pepReviewSchedule: boolean;
  attendanceMonitoring: boolean;
  homeworkSupportPlan: boolean;
  senCoordination: boolean;
  virtualSchoolPartnership: boolean;
  regularReview: boolean;
  score: number | null; // 0-25
}

export interface StaffEducationReadinessResult {
  totalStaff: number;
  educationSupportRate: number | null;
  pepProcessRate: number | null;
  attendanceImportanceRate: number | null;
  senAwarenessRate: number | null;
  homeworkStrategiesRate: number | null;
  virtualSchoolProtocolRate: number | null;
  score: number | null; // 0-25
}

export interface ChildEducationProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  progressRate: number | null;
  pepUpdatedRate: number | null;
  uniqueAreas: number;
  overallScore: number | null; // 0-10
}

export interface EducationAttainmentProgressIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number | null; // 0-100
  rating: Rating;

  educationQuality: EducationQualityResult;
  educationCompliance: EducationComplianceResult;
  educationPolicy: EducationPolicyResult;
  staffEducationReadiness: StaffEducationReadinessResult;

  childProfiles: ChildEducationProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Core Function 1: Evaluate Education Quality (0-25) ─────────────────

export function evaluateEducationQuality(
  records: EducationRecord[],
): EducationQualityResult {
  const totalRecords = records.length;

  // PRESENCE pattern — empty → 0
  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      progressRate: null,
      pepUpdatedRate: null,
      attendanceRate: null,
      childViewsRate: null,
      score: 0,
    };
  }

  // Progress rate: exceeding + expected
  const progressCount = records.filter(
    (r) => r.progressLevel === "exceeding" || r.progressLevel === "expected",
  ).length;
  const progressRate = rate(progressCount, totalRecords)!;

  // PEP updated rate
  const pepUpdatedCount = records.filter((r) => r.pepUpdated).length;
  const pepUpdatedRate = rate(pepUpdatedCount, totalRecords)!;

  // Attendance rate
  const attendanceCount = records.filter((r) => r.schoolAttendanceGood).length;
  const attendanceRate = rate(attendanceCount, totalRecords)!;

  // Child views captured rate
  const childViewsCount = records.filter((r) => r.childViewsCaptured).length;
  const childViewsRate = rate(childViewsCount, totalRecords)!;

  // Score (out of 25)
  let score = 0;
  // progressRate: max 7
  score += (progressRate / 100) * 7;
  // pepUpdatedRate: max 6
  score += (pepUpdatedRate / 100) * 6;
  // attendanceRate: max 6
  score += (attendanceRate / 100) * 6;
  // childViewsRate: max 6
  score += (childViewsRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalRecords,
    progressRate,
    pepUpdatedRate,
    attendanceRate,
    childViewsRate,
    score,
  };
}

// ── Core Function 2: Evaluate Education Compliance (0-25) ──────────────

export function evaluateEducationCompliance(
  records: EducationRecord[],
): EducationComplianceResult {
  const totalRecords = records.length;

  // PRESENCE pattern — empty → 0
  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      staffAdvocacyRate: null,
      documentedRate: null,
      virtualSchoolRate: null,
      areaDiversity: 0,
      score: 0,
    };
  }

  // Staff advocacy rate
  const staffAdvocacyCount = records.filter((r) => r.staffAdvocacyProvided).length;
  const staffAdvocacyRate = rate(staffAdvocacyCount, totalRecords)!;

  // Documented in plan rate
  const documentedCount = records.filter((r) => r.documentedInPlan).length;
  const documentedRate = rate(documentedCount, totalRecords)!;

  // Virtual school linked rate
  const virtualSchoolCount = records.filter((r) => r.virtualSchoolLinked).length;
  const virtualSchoolRate = rate(virtualSchoolCount, totalRecords)!;

  // Area diversity: unique areas / 8
  const uniqueAreas = new Set(records.map((r) => r.educationArea)).size;
  const areaDiversity = uniqueAreas / 8;

  // Score (out of 25)
  let score = 0;
  // staffAdvocacyRate: max 8
  score += (staffAdvocacyRate / 100) * 8;
  // documentedRate: max 7
  score += (documentedRate / 100) * 7;
  // virtualSchoolRate: max 5
  score += (virtualSchoolRate / 100) * 5;
  // areaDiversity: max 5
  score += areaDiversity * 5;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalRecords,
    staffAdvocacyRate,
    documentedRate,
    virtualSchoolRate,
    areaDiversity: Math.round(areaDiversity * 100) / 100,
    score,
  };
}

// ── Core Function 3: Evaluate Education Policy (0-25) ──────────────────

export function evaluateEducationPolicy(
  policy: EducationPolicy | null,
): EducationPolicyResult {
  // null → 0
  if (!policy) {
    return {
      educationChampionRole: false,
      pepReviewSchedule: false,
      attendanceMonitoring: false,
      homeworkSupportPlan: false,
      senCoordination: false,
      virtualSchoolPartnership: false,
      regularReview: false,
      score: 0,
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.educationChampionRole) score += 4;
  if (policy.pepReviewSchedule) score += 4;
  if (policy.attendanceMonitoring) score += 4;
  if (policy.homeworkSupportPlan) score += 4;
  if (policy.senCoordination) score += 3;
  if (policy.virtualSchoolPartnership) score += 3;
  if (policy.regularReview) score += 3;

  score = clamp(score, 0, 25);

  return {
    educationChampionRole: policy.educationChampionRole,
    pepReviewSchedule: policy.pepReviewSchedule,
    attendanceMonitoring: policy.attendanceMonitoring,
    homeworkSupportPlan: policy.homeworkSupportPlan,
    senCoordination: policy.senCoordination,
    virtualSchoolPartnership: policy.virtualSchoolPartnership,
    regularReview: policy.regularReview,
    score,
  };
}

// ── Core Function 4: Evaluate Staff Education Readiness (0-25) ─────────

export function evaluateStaffEducationReadiness(
  training: StaffEducationTraining[],
): StaffEducationReadinessResult {
  const totalStaff = training.length;

  // PRESENCE pattern — empty → 0
  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      educationSupportRate: null,
      pepProcessRate: null,
      attendanceImportanceRate: null,
      senAwarenessRate: null,
      homeworkStrategiesRate: null,
      virtualSchoolProtocolRate: null,
      score: 0,
    };
  }

  // 6 skills
  const educationSupportCount = training.filter((t) => t.educationSupport).length;
  const educationSupportRate = rate(educationSupportCount, totalStaff)!;

  const pepProcessCount = training.filter((t) => t.pepProcess).length;
  const pepProcessRate = rate(pepProcessCount, totalStaff)!;

  const attendanceImportanceCount = training.filter((t) => t.attendanceImportance).length;
  const attendanceImportanceRate = rate(attendanceImportanceCount, totalStaff)!;

  const senAwarenessCount = training.filter((t) => t.senAwareness).length;
  const senAwarenessRate = rate(senAwarenessCount, totalStaff)!;

  const homeworkStrategiesCount = training.filter((t) => t.homeworkStrategies).length;
  const homeworkStrategiesRate = rate(homeworkStrategiesCount, totalStaff)!;

  const virtualSchoolProtocolCount = training.filter((t) => t.virtualSchoolProtocol).length;
  const virtualSchoolProtocolRate = rate(virtualSchoolProtocolCount, totalStaff)!;

  // Weighted: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (educationSupportRate / 100) * 6;
  score += (pepProcessRate / 100) * 5;
  score += (attendanceImportanceRate / 100) * 5;
  score += (senAwarenessRate / 100) * 4;
  score += (homeworkStrategiesRate / 100) * 3;
  score += (virtualSchoolProtocolRate / 100) * 2;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalStaff,
    educationSupportRate,
    pepProcessRate,
    attendanceImportanceRate,
    senAwarenessRate,
    homeworkStrategiesRate,
    virtualSchoolProtocolRate,
    score,
  };
}

// ── Build Child Education Profiles ─────────────────────────────────────

export function buildChildEducationProfiles(
  records: EducationRecord[],
): ChildEducationProfile[] {
  // Group by childId
  const childMap = new Map<string, EducationRecord[]>();
  for (const r of records) {
    const existing = childMap.get(r.childId) ?? [];
    existing.push(r);
    childMap.set(r.childId, existing);
  }

  return Array.from(childMap.entries()).map(([childId, childRecords]) => {
    const childName = childRecords[0].childName;
    const totalRecords = childRecords.length;

    // Progress rate
    const progressCount = childRecords.filter(
      (r) => r.progressLevel === "exceeding" || r.progressLevel === "expected",
    ).length;
    const progressRate = rate(progressCount, totalRecords)!;

    // PEP updated rate
    const pepUpdatedCount = childRecords.filter((r) => r.pepUpdated).length;
    const pepUpdatedRate = rate(pepUpdatedCount, totalRecords)!;

    // Unique areas
    const uniqueAreas = new Set(childRecords.map((r) => r.educationArea)).size;

    // Overall score 0-10
    let overallScore = 0;

    // frequency: 0-2 (>=10 → 2, >=5 → 1, else 0)
    if (totalRecords >= 10) overallScore += 2;
    else if (totalRecords >= 5) overallScore += 1;

    // progressRate: 0-3 (>=80 → 3, >=60 → 2, >=40 → 1, else 0)
    if (meets(progressRate, 80)) overallScore += 3;
    else if (meets(progressRate, 60)) overallScore += 2;
    else if (meets(progressRate, 40)) overallScore += 1;

    // pepUpdatedRate: 0-3 (>=80 → 3, >=60 → 2, >=40 → 1, else 0)
    if (meets(pepUpdatedRate, 80)) overallScore += 3;
    else if (meets(pepUpdatedRate, 60)) overallScore += 2;
    else if (meets(pepUpdatedRate, 40)) overallScore += 1;

    // diversity: 0-2 (>=4 → 2, >=2 → 1, else 0)
    if (uniqueAreas >= 4) overallScore += 2;
    else if (uniqueAreas >= 2) overallScore += 1;

    overallScore = clamp(overallScore, 0, 10);

    return {
      childId,
      childName,
      totalRecords,
      progressRate,
      pepUpdatedRate,
      uniqueAreas,
      overallScore,
    };
  });
}

// ── Rating ─────────────────────────────────────────────────────────────────

function getOverallRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Generate Education Attainment & Progress Intelligence ──────────────

export function generateEducationAttainmentProgressIntelligence(
  records: EducationRecord[],
  policy: EducationPolicy | null,
  training: StaffEducationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EducationAttainmentProgressIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter records to period
  const periodRecords = records.filter(
    (r) => withinPeriod(r.recordDate, periodStart, periodEnd),
  );

  // Evaluate each layer
  const educationQuality = evaluateEducationQuality(periodRecords);
  const educationCompliance = evaluateEducationCompliance(periodRecords);
  const educationPolicy = evaluateEducationPolicy(policy);
  const staffEducationReadiness = evaluateStaffEducationReadiness(training);

  // Build child profiles
  const childProfiles = buildChildEducationProfiles(periodRecords);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      (educationQuality.score ?? 0) +
      (educationCompliance.score ?? 0) +
      (educationPolicy.score ?? 0) +
      (staffEducationReadiness.score ?? 0),
    ),
    0,
    100,
  );

  const rating = getOverallRating(overallScore);

  // Strengths
  const strengths = buildStrengths(educationQuality, educationCompliance, overallScore);

  // Areas for improvement
  const areasForImprovement = buildAreasForImprovement(
    educationQuality, educationCompliance, educationPolicy, staffEducationReadiness, overallScore,
  );

  // Actions
  const actions = buildActions(
    periodRecords, policy, training, educationQuality, educationCompliance,
  );

  // Regulatory links
  const regulatoryLinks = [
    "CHR 2015 Regulation 8 — The education standard",
    "CHR 2015 Regulation 9 — Quality of care standard",
    "SCCIF — Education and learning",
    "NMS 8 — Education",
    "Children Act 1989",
    "Children and Families Act 2014",
    "Virtual School Head guidance",
  ];

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    educationQuality,
    educationCompliance,
    educationPolicy,
    staffEducationReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Build Strengths ────────────────────────────────────────────────────────

function buildStrengths(
  quality: EducationQualityResult,
  compliance: EducationComplianceResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall education attainment and progress rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall education attainment and progress rated Good (" + overallScore + "/100)");
  }

  if ((quality.progressRate ?? 0) >= 80) {
    strengths.push("Strong educational progress with " + quality.progressRate + "% of records at expected level or above");
  }
  if ((quality.pepUpdatedRate ?? 0) >= 80) {
    strengths.push("PEP reviews consistently up to date");
  }
  if ((quality.attendanceRate ?? 0) >= 80) {
    strengths.push("Good school attendance rates maintained across the home");
  }
  if ((compliance.documentedRate ?? 0) >= 80) {
    strengths.push("Excellent education documentation in care plans");
  }

  return strengths;
}

// ── Build Areas for Improvement ────────────────────────────────────────────

function buildAreasForImprovement(
  quality: EducationQualityResult,
  compliance: EducationComplianceResult,
  _policy: EducationPolicyResult,
  _staffReadiness: StaffEducationReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall education attainment and progress rated Inadequate (" + overallScore + "/100) — urgent review required");
  } else if (overallScore < 60) {
    areas.push("Overall education attainment and progress Requires Improvement (" + overallScore + "/100)");
  }

  if ((quality.progressRate ?? 0) < 60 && quality.totalRecords > 0) {
    areas.push("Educational progress rate at " + quality.progressRate + "% — below expected threshold");
  }
  if ((quality.pepUpdatedRate ?? 0) < 60 && quality.totalRecords > 0) {
    areas.push("PEP update rate at " + quality.pepUpdatedRate + "% — needs improvement");
  }
  if ((quality.attendanceRate ?? 0) < 60 && quality.totalRecords > 0) {
    areas.push("School attendance rate at " + quality.attendanceRate + "% — below expected threshold");
  }
  if ((compliance.virtualSchoolRate ?? 0) < 60 && compliance.totalRecords > 0) {
    areas.push("Virtual school link rate at " + compliance.virtualSchoolRate + "% — needs strengthening");
  }
  if ((quality.childViewsRate ?? 0) < 60 && quality.totalRecords > 0) {
    areas.push("Children's views captured in only " + quality.childViewsRate + "% of records");
  }

  return areas;
}

// ── Build Actions ──────────────────────────────────────────────────────────

function buildActions(
  records: EducationRecord[],
  policy: EducationPolicy | null,
  training: StaffEducationTraining[],
  quality: EducationQualityResult,
  compliance: EducationComplianceResult,
): string[] {
  const actions: string[] = [];

  // Empty records
  if (records.length === 0) {
    actions.push("No education records found — ensure educational progress is tracked and recorded");
  }

  // Null policy
  if (!policy) {
    actions.push("URGENT: No education policy in place — develop and implement a comprehensive education support policy");
  }

  // Empty training
  if (training.length === 0) {
    actions.push("URGENT: No staff education training records — implement education support training programme for all staff");
  }

  // Low virtual school links
  if ((compliance.virtualSchoolRate ?? 0) < 60 && compliance.totalRecords > 0) {
    actions.push("Strengthen virtual school links to improve coordination and support for looked-after children");
  }

  // Low child views
  if ((quality.childViewsRate ?? 0) < 60 && quality.totalRecords > 0) {
    actions.push("Embed children's views in education planning to ensure their voice is heard");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required — education support systems operating within expected standards");
  }

  return actions;
}

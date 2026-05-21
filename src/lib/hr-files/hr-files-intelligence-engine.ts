/* ──────────────────────────────────────────────────────────────
   HR Files Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of HR files management in residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 32 — Fitness of workers
     - CHR 2015 Reg 33 — Employment of staff
     - CHR 2015 Reg 13 — Leadership and management
     - NMS 19 — Staffing
     - SCCIF — Leadership and management
     - Children Act 1989 — Duty of care
     - Quality Standards 2015 Standard 7

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type HrFilesCategory =
  | "supervision_record"
  | "training_completion"
  | "dbs_check"
  | "probation_review"
  | "absence_management"
  | "performance_review"
  | "disciplinary_record"
  | "recruitment_record";

export type HrFilesOutcome =
  | "fully_compliant"
  | "partially_compliant"
  | "overdue"
  | "non_compliant"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const hrFilesCategoryLabels: Record<HrFilesCategory, string> = {
  supervision_record: "Supervision Record",
  training_completion: "Training Completion",
  dbs_check: "DBS Check",
  probation_review: "Probation Review",
  absence_management: "Absence Management",
  performance_review: "Performance Review",
  disciplinary_record: "Disciplinary Record",
  recruitment_record: "Recruitment Record",
};

const hrFilesOutcomeLabels: Record<HrFilesOutcome, string> = {
  fully_compliant: "Fully Compliant",
  partially_compliant: "Partially Compliant",
  overdue: "Overdue",
  non_compliant: "Non-Compliant",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getHrFilesCategoryLabel(category: HrFilesCategory): string {
  return hrFilesCategoryLabels[category];
}

export function getHrFilesOutcomeLabel(outcome: HrFilesOutcome): string {
  return hrFilesOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface HrFilesRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: HrFilesCategory;
  outcome: HrFilesOutcome;
  recordAccurate: boolean;
  signaturesObtained: boolean;
  actionPointsDocumented: boolean;
  timeframesMet: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface HrFilesPolicy {
  supervisionPolicy: boolean;
  mandatoryTrainingPolicy: boolean;
  saferRecruitmentPolicy: boolean;
  dbsRenewalPolicy: boolean;
  absenceManagementPolicy: boolean;
  performanceReviewPolicy: boolean;
  disciplinaryPolicy: boolean;
}

export interface StaffHrFilesTraining {
  staffId: string;
  hrPolicyKnowledge: boolean;
  supervisionSkills: boolean;
  saferRecruitmentKnowledge: boolean;
  trainingComplianceSkills: boolean;
  absenceManagementSkills: boolean;
  performanceReviewSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface HrFilesQualityResult {
  overallScore: number;
  totalRecords: number;
  recordAccurateRate: number;
  signaturesObtainedRate: number;
  actionPointsDocumentedRate: number;
  timeframesMetRate: number;
}

export interface HrFilesComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  recordAccurateRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface HrFilesPolicyResult {
  overallScore: number;
  supervisionPolicy: boolean;
  mandatoryTrainingPolicy: boolean;
  saferRecruitmentPolicy: boolean;
  dbsRenewalPolicy: boolean;
  absenceManagementPolicy: boolean;
  performanceReviewPolicy: boolean;
  disciplinaryPolicy: boolean;
}

export interface StaffHrFilesReadinessResult {
  overallScore: number;
  totalStaff: number;
  hrPolicyKnowledgeRate: number;
  supervisionSkillsRate: number;
  saferRecruitmentKnowledgeRate: number;
  trainingComplianceSkillsRate: number;
  absenceManagementSkillsRate: number;
  performanceReviewSkillsRate: number;
}

export interface ChildHrFilesProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  recordAccurateRate: number;
  signaturesObtainedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface HrFilesIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  hrFilesQuality: HrFilesQualityResult;
  hrFilesCompliance: HrFilesComplianceResult;
  hrFilesPolicy: HrFilesPolicyResult;
  staffReadiness: StaffHrFilesReadinessResult;
  childProfiles: ChildHrFilesProfile[];
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

// ── Evaluator 1: Quality (0-25) ────────────────────────────────────────────

export function evaluateHrFilesQuality(
  records: HrFilesRecord[],
): HrFilesQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, recordAccurateRate: 0, signaturesObtainedRate: 0, actionPointsDocumentedRate: 0, timeframesMetRate: 0 };
  }

  const recordAccurateRate = pct(records.filter((r) => r.recordAccurate).length, n);
  const signaturesObtainedRate = pct(records.filter((r) => r.signaturesObtained).length, n);
  const actionPointsDocumentedRate = pct(records.filter((r) => r.actionPointsDocumented).length, n);
  const timeframesMetRate = pct(records.filter((r) => r.timeframesMet).length, n);

  let score = 0;
  score += (recordAccurateRate / 100) * 7;
  score += (signaturesObtainedRate / 100) * 6;
  score += (actionPointsDocumentedRate / 100) * 6;
  score += (timeframesMetRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, recordAccurateRate, signaturesObtainedRate, actionPointsDocumentedRate, timeframesMetRate };
}

// ── Evaluator 2: Compliance (0-25) ─────────────────────────────────────────

export function evaluateHrFilesCompliance(
  records: HrFilesRecord[],
): HrFilesComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, recordAccurateRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const recordAccurateRate = pct(records.filter((r) => r.recordAccurate).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (recordAccurateRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, recordAccurateRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ─────────────────────────────────────────────

export function evaluateHrFilesPolicy(
  policy: HrFilesPolicy | null,
): HrFilesPolicyResult {
  if (policy === null) {
    return { overallScore: 0, supervisionPolicy: false, mandatoryTrainingPolicy: false, saferRecruitmentPolicy: false, dbsRenewalPolicy: false, absenceManagementPolicy: false, performanceReviewPolicy: false, disciplinaryPolicy: false };
  }

  let score = 0;
  if (policy.supervisionPolicy) score += 4;
  if (policy.mandatoryTrainingPolicy) score += 4;
  if (policy.saferRecruitmentPolicy) score += 4;
  if (policy.dbsRenewalPolicy) score += 4;
  if (policy.absenceManagementPolicy) score += 3;
  if (policy.performanceReviewPolicy) score += 3;
  if (policy.disciplinaryPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    supervisionPolicy: policy.supervisionPolicy,
    mandatoryTrainingPolicy: policy.mandatoryTrainingPolicy,
    saferRecruitmentPolicy: policy.saferRecruitmentPolicy,
    dbsRenewalPolicy: policy.dbsRenewalPolicy,
    absenceManagementPolicy: policy.absenceManagementPolicy,
    performanceReviewPolicy: policy.performanceReviewPolicy,
    disciplinaryPolicy: policy.disciplinaryPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffHrFilesReadiness(
  training: StaffHrFilesTraining[],
): StaffHrFilesReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, hrPolicyKnowledgeRate: 0, supervisionSkillsRate: 0, saferRecruitmentKnowledgeRate: 0, trainingComplianceSkillsRate: 0, absenceManagementSkillsRate: 0, performanceReviewSkillsRate: 0 };
  }

  const hrPolicyKnowledgeRate = pct(training.filter((t) => t.hrPolicyKnowledge).length, n);
  const supervisionSkillsRate = pct(training.filter((t) => t.supervisionSkills).length, n);
  const saferRecruitmentKnowledgeRate = pct(training.filter((t) => t.saferRecruitmentKnowledge).length, n);
  const trainingComplianceSkillsRate = pct(training.filter((t) => t.trainingComplianceSkills).length, n);
  const absenceManagementSkillsRate = pct(training.filter((t) => t.absenceManagementSkills).length, n);
  const performanceReviewSkillsRate = pct(training.filter((t) => t.performanceReviewSkills).length, n);

  let score = 0;
  score += (hrPolicyKnowledgeRate / 100) * 6;
  score += (supervisionSkillsRate / 100) * 5;
  score += (saferRecruitmentKnowledgeRate / 100) * 5;
  score += (trainingComplianceSkillsRate / 100) * 4;
  score += (absenceManagementSkillsRate / 100) * 3;
  score += (performanceReviewSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, hrPolicyKnowledgeRate, supervisionSkillsRate, saferRecruitmentKnowledgeRate, trainingComplianceSkillsRate, absenceManagementSkillsRate, performanceReviewSkillsRate };
}

// ── Build Child HR Files Profiles ──────────────────────────────────────────

export function buildChildHrFilesProfiles(
  records: HrFilesRecord[],
): ChildHrFilesProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: HrFilesRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const recordAccurateRate = pct(child.records.filter((r) => r.recordAccurate).length, totalRecords);
    const signaturesObtainedRate = pct(child.records.filter((r) => r.signaturesObtained).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (recordAccurateRate >= 80) rate1Score = 3;
    else if (recordAccurateRate >= 60) rate1Score = 2;
    else if (recordAccurateRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (signaturesObtainedRate >= 80) rate2Score = 3;
    else if (signaturesObtainedRate >= 60) rate2Score = 2;
    else if (signaturesObtainedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, recordAccurateRate, signaturesObtainedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateHrFilesIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: HrFilesRecord[];
  policy: HrFilesPolicy | null;
  staff: StaffHrFilesTraining[];
}

export function generateHrFilesIntelligence(
  input: GenerateHrFilesIntelligenceInput,
): HrFilesIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);

  const qualityResult = evaluateHrFilesQuality(periodRecords);
  const complianceResult = evaluateHrFilesCompliance(periodRecords);
  const policyResult = evaluateHrFilesPolicy(policy);
  const staffResult = evaluateStaffHrFilesReadiness(staff);

  const childProfiles = buildChildHrFilesProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("HR files management rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("HR files management rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Record quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("HR compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("HR policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff HR readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.recordAccurateRate >= 90) strengths.push("Record accuracy rate at " + qualityResult.recordAccurateRate + "%");
  if (periodRecords.length > 0 && qualityResult.signaturesObtainedRate >= 90) strengths.push("Signatures obtained rate at " + qualityResult.signaturesObtainedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  // ── Areas for improvement ─────────────────────────────────────────────
  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("HR files management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("HR files management Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Record quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("HR compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("HR policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff HR readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.recordAccurateRate < 80) areasForImprovement.push("Record accuracy at " + qualityResult.recordAccurateRate + "% — must improve for audit trail");
  if (periodRecords.length === 0) areasForImprovement.push("No HR file records — workforce documentation must be maintained");
  if (policy === null) areasForImprovement.push("No HR files policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff HR training records — training required");

  // ── Actions ───────────────────────────────────────────────────────────
  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No HR files policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff HR training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.recordAccurateRate < 50) actions.push("HIGH: Record accuracy at " + qualityResult.recordAccurateRate + "% — review recording processes");
  if (periodRecords.length > 0 && qualityResult.signaturesObtainedRate < 50) actions.push("HIGH: Signatures obtained at " + qualityResult.signaturesObtainedRate + "% — ensure signatures are consistently captured");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all HR records must be completed");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.hrPolicyKnowledgeRate < 50) actions.push("MEDIUM: HR policy knowledge at " + staffResult.hrPolicyKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " staff member(s) with low HR file scores — review individual records");
  if (actions.length === 0) actions.push("No immediate actions required. HR files systems operating within expected standards.");

  // ── Regulatory links ──────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 32 — Fitness of workers",
    "CHR 2015 Reg 33 — Employment of staff",
    "CHR 2015 Reg 13 — Leadership and management",
    "NMS 19 — Staffing",
    "SCCIF — Leadership and management",
    "Children Act 1989 — Duty of care",
    "Quality Standards 2015 Standard 7",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    hrFilesQuality: qualityResult,
    hrFilesCompliance: complianceResult,
    hrFilesPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

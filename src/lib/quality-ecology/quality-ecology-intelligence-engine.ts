/* ──────────────────────────────────────────────────────────────
   Quality Ecology Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of quality ecology & lifecycle management in
   children's residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 36 — Record keeping
     - CHR 2015 Reg 13 — Leadership and management
     - NMS 22 — Records and data
     - SCCIF — Leadership and management
     - Data Protection Act 2018
     - Quality Standards 2015 Standard 9
     - ICO Records Management guidance

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type QualityEcologyCategory =
  | "lifecycle_management"
  | "record_locking"
  | "audit_trail"
  | "qa_sampling"
  | "compliance_monitoring"
  | "escalation_management"
  | "amendment_tracking"
  | "quality_review";

export type QualityEcologyOutcome =
  | "fully_compliant"
  | "partially_compliant"
  | "non_compliant"
  | "overdue"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const qualityEcologyCategoryLabels: Record<QualityEcologyCategory, string> = {
  lifecycle_management: "Lifecycle Management",
  record_locking: "Record Locking",
  audit_trail: "Audit Trail",
  qa_sampling: "QA Sampling",
  compliance_monitoring: "Compliance Monitoring",
  escalation_management: "Escalation Management",
  amendment_tracking: "Amendment Tracking",
  quality_review: "Quality Review",
};

const qualityEcologyOutcomeLabels: Record<QualityEcologyOutcome, string> = {
  fully_compliant: "Fully Compliant",
  partially_compliant: "Partially Compliant",
  non_compliant: "Non-Compliant",
  overdue: "Overdue",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getQualityEcologyCategoryLabel(category: QualityEcologyCategory): string {
  return qualityEcologyCategoryLabels[category];
}

export function getQualityEcologyOutcomeLabel(outcome: QualityEcologyOutcome): string {
  return qualityEcologyOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface QualityEcologyRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: QualityEcologyCategory;
  outcome: QualityEcologyOutcome;
  qualityCheckPassed: boolean;
  auditTrailComplete: boolean;
  lifecycleCorrect: boolean;
  recordIntegrityVerified: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface QualityEcologyPolicy {
  qualityAssurancePolicy: boolean;
  recordLockingPolicy: boolean;
  auditTrailPolicy: boolean;
  lifecycleManagementPolicy: boolean;
  amendmentPolicy: boolean;
  qaSamplingPolicy: boolean;
  escalationPolicy: boolean;
}

export interface StaffQualityEcologyTraining {
  staffId: string;
  qualityAssuranceKnowledge: boolean;
  recordLockingSkills: boolean;
  auditTrailSkills: boolean;
  lifecycleManagementSkills: boolean;
  qaSamplingSkills: boolean;
  amendmentProcedureKnowledge: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface QualityEcologyQualityResult {
  overallScore: number;
  totalRecords: number;
  qualityCheckPassedRate: number;
  auditTrailCompleteRate: number;
  lifecycleCorrectRate: number;
  recordIntegrityVerifiedRate: number;
}

export interface QualityEcologyComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  qualityCheckPassedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface QualityEcologyPolicyResult {
  overallScore: number;
  qualityAssurancePolicy: boolean;
  recordLockingPolicy: boolean;
  auditTrailPolicy: boolean;
  lifecycleManagementPolicy: boolean;
  amendmentPolicy: boolean;
  qaSamplingPolicy: boolean;
  escalationPolicy: boolean;
}

export interface StaffQualityEcologyReadinessResult {
  overallScore: number;
  totalStaff: number;
  qualityAssuranceKnowledgeRate: number;
  recordLockingSkillsRate: number;
  auditTrailSkillsRate: number;
  lifecycleManagementSkillsRate: number;
  qaSamplingSkillsRate: number;
  amendmentProcedureKnowledgeRate: number;
}

export interface ChildQualityEcologyProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  qualityCheckPassedRate: number;
  auditTrailCompleteRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface QualityEcologyIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  qualityEcologyQuality: QualityEcologyQualityResult;
  qualityEcologyCompliance: QualityEcologyComplianceResult;
  qualityEcologyPolicy: QualityEcologyPolicyResult;
  staffReadiness: StaffQualityEcologyReadinessResult;
  childProfiles: ChildQualityEcologyProfile[];
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

export function evaluateQualityEcologyQuality(
  records: QualityEcologyRecord[],
): QualityEcologyQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, qualityCheckPassedRate: 0, auditTrailCompleteRate: 0, lifecycleCorrectRate: 0, recordIntegrityVerifiedRate: 0 };
  }

  const qualityCheckPassedRate = pct(records.filter((r) => r.qualityCheckPassed).length, n);
  const auditTrailCompleteRate = pct(records.filter((r) => r.auditTrailComplete).length, n);
  const lifecycleCorrectRate = pct(records.filter((r) => r.lifecycleCorrect).length, n);
  const recordIntegrityVerifiedRate = pct(records.filter((r) => r.recordIntegrityVerified).length, n);

  let score = 0;
  score += (qualityCheckPassedRate / 100) * 7;
  score += (auditTrailCompleteRate / 100) * 6;
  score += (lifecycleCorrectRate / 100) * 6;
  score += (recordIntegrityVerifiedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, qualityCheckPassedRate, auditTrailCompleteRate, lifecycleCorrectRate, recordIntegrityVerifiedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateQualityEcologyCompliance(
  records: QualityEcologyRecord[],
): QualityEcologyComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, qualityCheckPassedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const qualityCheckPassedRate = pct(records.filter((r) => r.qualityCheckPassed).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (qualityCheckPassedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, qualityCheckPassedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateQualityEcologyPolicy(
  policy: QualityEcologyPolicy | null,
): QualityEcologyPolicyResult {
  if (policy === null) {
    return { overallScore: 0, qualityAssurancePolicy: false, recordLockingPolicy: false, auditTrailPolicy: false, lifecycleManagementPolicy: false, amendmentPolicy: false, qaSamplingPolicy: false, escalationPolicy: false };
  }

  let score = 0;
  if (policy.qualityAssurancePolicy) score += 4;
  if (policy.recordLockingPolicy) score += 4;
  if (policy.auditTrailPolicy) score += 4;
  if (policy.lifecycleManagementPolicy) score += 4;
  if (policy.amendmentPolicy) score += 3;
  if (policy.qaSamplingPolicy) score += 3;
  if (policy.escalationPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    qualityAssurancePolicy: policy.qualityAssurancePolicy,
    recordLockingPolicy: policy.recordLockingPolicy,
    auditTrailPolicy: policy.auditTrailPolicy,
    lifecycleManagementPolicy: policy.lifecycleManagementPolicy,
    amendmentPolicy: policy.amendmentPolicy,
    qaSamplingPolicy: policy.qaSamplingPolicy,
    escalationPolicy: policy.escalationPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffQualityEcologyReadiness(
  training: StaffQualityEcologyTraining[],
): StaffQualityEcologyReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, qualityAssuranceKnowledgeRate: 0, recordLockingSkillsRate: 0, auditTrailSkillsRate: 0, lifecycleManagementSkillsRate: 0, qaSamplingSkillsRate: 0, amendmentProcedureKnowledgeRate: 0 };
  }

  const qualityAssuranceKnowledgeRate = pct(training.filter((t) => t.qualityAssuranceKnowledge).length, n);
  const recordLockingSkillsRate = pct(training.filter((t) => t.recordLockingSkills).length, n);
  const auditTrailSkillsRate = pct(training.filter((t) => t.auditTrailSkills).length, n);
  const lifecycleManagementSkillsRate = pct(training.filter((t) => t.lifecycleManagementSkills).length, n);
  const qaSamplingSkillsRate = pct(training.filter((t) => t.qaSamplingSkills).length, n);
  const amendmentProcedureKnowledgeRate = pct(training.filter((t) => t.amendmentProcedureKnowledge).length, n);

  let score = 0;
  score += (qualityAssuranceKnowledgeRate / 100) * 6;
  score += (recordLockingSkillsRate / 100) * 5;
  score += (auditTrailSkillsRate / 100) * 5;
  score += (lifecycleManagementSkillsRate / 100) * 4;
  score += (qaSamplingSkillsRate / 100) * 3;
  score += (amendmentProcedureKnowledgeRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, qualityAssuranceKnowledgeRate, recordLockingSkillsRate, auditTrailSkillsRate, lifecycleManagementSkillsRate, qaSamplingSkillsRate, amendmentProcedureKnowledgeRate };
}

// ── Build Child Quality Ecology Profiles ──────────────────────────────────

export function buildChildQualityEcologyProfiles(
  records: QualityEcologyRecord[],
): ChildQualityEcologyProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: QualityEcologyRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const qualityCheckPassedRate = pct(child.records.filter((r) => r.qualityCheckPassed).length, totalRecords);
    const auditTrailCompleteRate = pct(child.records.filter((r) => r.auditTrailComplete).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (qualityCheckPassedRate >= 80) rate1Score = 3;
    else if (qualityCheckPassedRate >= 60) rate1Score = 2;
    else if (qualityCheckPassedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (auditTrailCompleteRate >= 80) rate2Score = 3;
    else if (auditTrailCompleteRate >= 60) rate2Score = 2;
    else if (auditTrailCompleteRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, qualityCheckPassedRate, auditTrailCompleteRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateQualityEcologyIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: QualityEcologyRecord[];
  policy: QualityEcologyPolicy | null;
  staff: StaffQualityEcologyTraining[];
}

export function generateQualityEcologyIntelligence(
  input: GenerateQualityEcologyIntelligenceInput,
): QualityEcologyIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateQualityEcologyQuality(periodRecords);
  const complianceResult = evaluateQualityEcologyCompliance(periodRecords);
  const policyResult = evaluateQualityEcologyPolicy(policy);
  const staffResult = evaluateStaffQualityEcologyReadiness(staff);

  const childProfiles = buildChildQualityEcologyProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Quality ecology management rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Quality ecology management rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Record quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Quality compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Quality ecology policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff quality ecology readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.qualityCheckPassedRate >= 90) strengths.push("Quality check pass rate at " + qualityResult.qualityCheckPassedRate + "%");
  if (periodRecords.length > 0 && qualityResult.auditTrailCompleteRate >= 90) strengths.push("Audit trail completion at " + qualityResult.auditTrailCompleteRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation completion rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Quality ecology management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Quality ecology management Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Record quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Quality compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Quality ecology policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff quality ecology readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.qualityCheckPassedRate < 80) areasForImprovement.push("Quality check pass rate at " + qualityResult.qualityCheckPassedRate + "% — must improve for regulatory compliance");
  if (periodRecords.length === 0) areasForImprovement.push("No quality ecology records — recording must be documented");
  if (policy === null) areasForImprovement.push("No quality ecology policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff quality ecology training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No quality ecology policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff quality ecology training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.qualityCheckPassedRate < 50) actions.push("HIGH: Quality check pass rate at " + qualityResult.qualityCheckPassedRate + "% — review quality assurance procedures");
  if (periodRecords.length > 0 && qualityResult.auditTrailCompleteRate < 50) actions.push("HIGH: Audit trail completion at " + qualityResult.auditTrailCompleteRate + "% — ensure all records have complete audit trails");
  if (periodRecords.length > 0 && qualityResult.lifecycleCorrectRate < 50) actions.push("HIGH: Lifecycle correctness at " + qualityResult.lifecycleCorrectRate + "% — review lifecycle management procedures");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.qualityAssuranceKnowledgeRate < 50) actions.push("MEDIUM: Quality assurance knowledge at " + staffResult.qualityAssuranceKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low quality ecology scores — review individual quality provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Quality ecology systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 36 — Record keeping",
    "CHR 2015 Reg 13 — Leadership and management",
    "NMS 22 — Records and data",
    "SCCIF — Leadership and management",
    "Data Protection Act 2018",
    "Quality Standards 2015 Standard 9",
    "ICO Records Management guidance",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    qualityEcologyQuality: qualityResult,
    qualityEcologyCompliance: complianceResult,
    qualityEcologyPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

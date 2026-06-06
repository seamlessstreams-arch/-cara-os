/* ──────────────────────────────────────────────────────────────
   Filing Cabinet Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of document filing and records management in
   residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 36 — Record keeping
     - CHR 2015 Reg 37 — Record access
     - Data Protection Act 2018 — GDPR compliance
     - NMS 22 — Records and data
     - SCCIF — Leadership and management
     - Children Act 1989 s.26 — Case records
     - Quality Standards 2015 Standard 9

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type FilingCabinetCategory =
  | "care_plan_filing"
  | "risk_assessment_filing"
  | "medical_record_filing"
  | "education_record_filing"
  | "safeguarding_record_filing"
  | "placement_record_filing"
  | "correspondence_filing"
  | "legal_document_filing";

export type FilingCabinetOutcome =
  | "correctly_filed"
  | "partially_filed"
  | "misfiled"
  | "unfiled"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const filingCabinetCategoryLabels: Record<FilingCabinetCategory, string> = {
  care_plan_filing: "Care Plan Filing",
  risk_assessment_filing: "Risk Assessment Filing",
  medical_record_filing: "Medical Record Filing",
  education_record_filing: "Education Record Filing",
  safeguarding_record_filing: "Safeguarding Record Filing",
  placement_record_filing: "Placement Record Filing",
  correspondence_filing: "Correspondence Filing",
  legal_document_filing: "Legal Document Filing",
};

const filingCabinetOutcomeLabels: Record<FilingCabinetOutcome, string> = {
  correctly_filed: "Correctly Filed",
  partially_filed: "Partially Filed",
  misfiled: "Misfiled",
  unfiled: "Unfiled",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getFilingCabinetCategoryLabel(category: FilingCabinetCategory): string {
  return filingCabinetCategoryLabels[category];
}

export function getFilingCabinetOutcomeLabel(outcome: FilingCabinetOutcome): string {
  return filingCabinetOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface FilingCabinetRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: FilingCabinetCategory;
  outcome: FilingCabinetOutcome;
  correctCategoryAssigned: boolean;
  retentionPolicyApplied: boolean;
  sensitivityMarked: boolean;
  accessControlSet: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface FilingCabinetPolicy {
  documentManagementPolicy: boolean;
  retentionSchedulePolicy: boolean;
  dataProtectionFilingPolicy: boolean;
  accessControlPolicy: boolean;
  documentDestructionPolicy: boolean;
  auditTrailPolicy: boolean;
  backupAndRecoveryPolicy: boolean;
}

export interface StaffFilingCabinetTraining {
  staffId: string;
  documentManagementKnowledge: boolean;
  dataProtectionSkills: boolean;
  retentionPolicyKnowledge: boolean;
  accessControlSkills: boolean;
  auditTrailSkills: boolean;
  documentDestructionProcedure: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface FilingCabinetQualityResult {
  overallScore: number;
  totalRecords: number;
  correctCategoryAssignedRate: number;
  retentionPolicyAppliedRate: number;
  sensitivityMarkedRate: number;
  accessControlSetRate: number;
}

export interface FilingCabinetComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  correctCategoryAssignedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface FilingCabinetPolicyResult {
  overallScore: number;
  documentManagementPolicy: boolean;
  retentionSchedulePolicy: boolean;
  dataProtectionFilingPolicy: boolean;
  accessControlPolicy: boolean;
  documentDestructionPolicy: boolean;
  auditTrailPolicy: boolean;
  backupAndRecoveryPolicy: boolean;
}

export interface StaffFilingCabinetReadinessResult {
  overallScore: number;
  totalStaff: number;
  documentManagementKnowledgeRate: number;
  dataProtectionSkillsRate: number;
  retentionPolicyKnowledgeRate: number;
  accessControlSkillsRate: number;
  auditTrailSkillsRate: number;
  documentDestructionProcedureRate: number;
}

export interface ChildFilingCabinetProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  correctCategoryAssignedRate: number;
  retentionPolicyAppliedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface FilingCabinetIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  filingCabinetQuality: FilingCabinetQualityResult;
  filingCabinetCompliance: FilingCabinetComplianceResult;
  filingCabinetPolicy: FilingCabinetPolicyResult;
  staffReadiness: StaffFilingCabinetReadinessResult;
  childProfiles: ChildFilingCabinetProfile[];
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

export function evaluateFilingCabinetQuality(
  records: FilingCabinetRecord[],
): FilingCabinetQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, correctCategoryAssignedRate: 0, retentionPolicyAppliedRate: 0, sensitivityMarkedRate: 0, accessControlSetRate: 0 };
  }

  const correctCategoryAssignedRate = pct(records.filter((r) => r.correctCategoryAssigned).length, n);
  const retentionPolicyAppliedRate = pct(records.filter((r) => r.retentionPolicyApplied).length, n);
  const sensitivityMarkedRate = pct(records.filter((r) => r.sensitivityMarked).length, n);
  const accessControlSetRate = pct(records.filter((r) => r.accessControlSet).length, n);

  let score = 0;
  score += (correctCategoryAssignedRate / 100) * 7;
  score += (retentionPolicyAppliedRate / 100) * 6;
  score += (sensitivityMarkedRate / 100) * 6;
  score += (accessControlSetRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, correctCategoryAssignedRate, retentionPolicyAppliedRate, sensitivityMarkedRate, accessControlSetRate };
}

// ── Evaluator 2: Compliance (0-25) ─────────────────────────────────────────

export function evaluateFilingCabinetCompliance(
  records: FilingCabinetRecord[],
): FilingCabinetComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, correctCategoryAssignedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const correctCategoryAssignedRate = pct(records.filter((r) => r.correctCategoryAssigned).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (correctCategoryAssignedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, correctCategoryAssignedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ─────────────────────────────────────────────

export function evaluateFilingCabinetPolicy(
  policy: FilingCabinetPolicy | null,
): FilingCabinetPolicyResult {
  if (policy === null) {
    return { overallScore: 0, documentManagementPolicy: false, retentionSchedulePolicy: false, dataProtectionFilingPolicy: false, accessControlPolicy: false, documentDestructionPolicy: false, auditTrailPolicy: false, backupAndRecoveryPolicy: false };
  }

  let score = 0;
  if (policy.documentManagementPolicy) score += 4;
  if (policy.retentionSchedulePolicy) score += 4;
  if (policy.dataProtectionFilingPolicy) score += 4;
  if (policy.accessControlPolicy) score += 4;
  if (policy.documentDestructionPolicy) score += 3;
  if (policy.auditTrailPolicy) score += 3;
  if (policy.backupAndRecoveryPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    documentManagementPolicy: policy.documentManagementPolicy,
    retentionSchedulePolicy: policy.retentionSchedulePolicy,
    dataProtectionFilingPolicy: policy.dataProtectionFilingPolicy,
    accessControlPolicy: policy.accessControlPolicy,
    documentDestructionPolicy: policy.documentDestructionPolicy,
    auditTrailPolicy: policy.auditTrailPolicy,
    backupAndRecoveryPolicy: policy.backupAndRecoveryPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffFilingCabinetReadiness(
  training: StaffFilingCabinetTraining[],
): StaffFilingCabinetReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, documentManagementKnowledgeRate: 0, dataProtectionSkillsRate: 0, retentionPolicyKnowledgeRate: 0, accessControlSkillsRate: 0, auditTrailSkillsRate: 0, documentDestructionProcedureRate: 0 };
  }

  const documentManagementKnowledgeRate = pct(training.filter((t) => t.documentManagementKnowledge).length, n);
  const dataProtectionSkillsRate = pct(training.filter((t) => t.dataProtectionSkills).length, n);
  const retentionPolicyKnowledgeRate = pct(training.filter((t) => t.retentionPolicyKnowledge).length, n);
  const accessControlSkillsRate = pct(training.filter((t) => t.accessControlSkills).length, n);
  const auditTrailSkillsRate = pct(training.filter((t) => t.auditTrailSkills).length, n);
  const documentDestructionProcedureRate = pct(training.filter((t) => t.documentDestructionProcedure).length, n);

  let score = 0;
  score += (documentManagementKnowledgeRate / 100) * 6;
  score += (dataProtectionSkillsRate / 100) * 5;
  score += (retentionPolicyKnowledgeRate / 100) * 5;
  score += (accessControlSkillsRate / 100) * 4;
  score += (auditTrailSkillsRate / 100) * 3;
  score += (documentDestructionProcedureRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, documentManagementKnowledgeRate, dataProtectionSkillsRate, retentionPolicyKnowledgeRate, accessControlSkillsRate, auditTrailSkillsRate, documentDestructionProcedureRate };
}

// ── Build Child Filing Cabinet Profiles ────────────────────────────────────

export function buildChildFilingCabinetProfiles(
  records: FilingCabinetRecord[],
): ChildFilingCabinetProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: FilingCabinetRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const correctCategoryAssignedRate = pct(child.records.filter((r) => r.correctCategoryAssigned).length, totalRecords);
    const retentionPolicyAppliedRate = pct(child.records.filter((r) => r.retentionPolicyApplied).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (correctCategoryAssignedRate >= 80) rate1Score = 3;
    else if (correctCategoryAssignedRate >= 60) rate1Score = 2;
    else if (correctCategoryAssignedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (retentionPolicyAppliedRate >= 80) rate2Score = 3;
    else if (retentionPolicyAppliedRate >= 60) rate2Score = 2;
    else if (retentionPolicyAppliedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, correctCategoryAssignedRate, retentionPolicyAppliedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateFilingCabinetIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: FilingCabinetRecord[];
  policy: FilingCabinetPolicy | null;
  staff: StaffFilingCabinetTraining[];
}

export function generateFilingCabinetIntelligence(
  input: GenerateFilingCabinetIntelligenceInput,
): FilingCabinetIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateFilingCabinetQuality(periodRecords);
  const complianceResult = evaluateFilingCabinetCompliance(periodRecords);
  const policyResult = evaluateFilingCabinetPolicy(policy);
  const staffResult = evaluateStaffFilingCabinetReadiness(staff);

  const childProfiles = buildChildFilingCabinetProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Filing cabinet management rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Filing cabinet management rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Filing quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Filing compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Document management policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff document management readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.correctCategoryAssignedRate >= 90) strengths.push("Correct category assignment rate at " + qualityResult.correctCategoryAssignedRate + "%");
  if (periodRecords.length > 0 && qualityResult.retentionPolicyAppliedRate >= 90) strengths.push("Retention policy application rate at " + qualityResult.retentionPolicyAppliedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation completion rate at " + complianceResult.documentationCompleteRate + "%");

  // ── Areas for improvement ─────────────────────────────────────────────
  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Filing cabinet management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Filing cabinet management Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Filing quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Filing compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Document management policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff document management readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.correctCategoryAssignedRate < 80) areasForImprovement.push("Correct category assignment at " + qualityResult.correctCategoryAssignedRate + "% — must improve for compliance");
  if (periodRecords.length === 0) areasForImprovement.push("No filing cabinet records — document management must be tracked");
  if (policy === null) areasForImprovement.push("No document management policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff document management training records — training required");

  // ── Actions ───────────────────────────────────────────────────────────
  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No document management policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff document management training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.correctCategoryAssignedRate < 50) actions.push("HIGH: Correct category assignment at " + qualityResult.correctCategoryAssignedRate + "% — review filing processes");
  if (periodRecords.length > 0 && qualityResult.retentionPolicyAppliedRate < 50) actions.push("HIGH: Retention policy application at " + qualityResult.retentionPolicyAppliedRate + "% — ensure retention policies are consistently applied");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all records must be fully documented");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be filed promptly");
  if (staff.length > 0 && staffResult.documentManagementKnowledgeRate < 50) actions.push("MEDIUM: Document management knowledge at " + staffResult.documentManagementKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low filing management scores — review individual record-keeping");
  if (actions.length === 0) actions.push("No immediate actions required. Filing cabinet systems operating within expected standards.");

  // ── Regulatory links ──────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 36 — Record keeping",
    "CHR 2015 Reg 37 — Record access",
    "Data Protection Act 2018 — GDPR compliance",
    "NMS 22 — Records and data",
    "SCCIF — Leadership and management",
    "Children Act 1989 s.26 — Case records",
    "Quality Standards 2015 Standard 9",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    filingCabinetQuality: qualityResult,
    filingCabinetCompliance: complianceResult,
    filingCabinetPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

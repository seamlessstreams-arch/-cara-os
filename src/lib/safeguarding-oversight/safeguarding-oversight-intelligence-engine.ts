/* ──────────────────────────────────────────────────────────────
   Safeguarding Oversight Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of safeguarding arrangements in children's
   residential care homes.

   Evaluates safeguarding referrals, concern assessments,
   multi-agency strategy discussions, DBS compliance, training,
   threshold decisions, section 47 investigations, and audits.

   Regulatory basis:
     - CHR 2015 Reg 12 — Protection of children standard
     - CHR 2015 Reg 32 — Fitness of workers
     - CHR 2015 Reg 34 — Safeguarding
     - KCSIE 2024 — Keeping Children Safe in Education
     - NMS 3 — Safeguarding children
     - SCCIF — Safety of children
     - Working Together 2023 — Multi-agency safeguarding

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type SafeguardingOversightIntelligenceCategory =
  | "safeguarding_referral"
  | "concern_assessment"
  | "multi_agency_strategy"
  | "dbs_compliance_check"
  | "safeguarding_training"
  | "threshold_decision"
  | "section47_investigation"
  | "safeguarding_audit";

export type SafeguardingOversightIntelligenceOutcome =
  | "effective_safeguarding"
  | "partially_effective"
  | "concerns_identified"
  | "safeguarding_failure"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const safeguardingOversightIntelligenceCategoryLabels: Record<SafeguardingOversightIntelligenceCategory, string> = {
  safeguarding_referral: "Safeguarding Referral",
  concern_assessment: "Concern Assessment",
  multi_agency_strategy: "Multi-Agency Strategy",
  dbs_compliance_check: "DBS Compliance Check",
  safeguarding_training: "Safeguarding Training",
  threshold_decision: "Threshold Decision",
  section47_investigation: "Section 47 Investigation",
  safeguarding_audit: "Safeguarding Audit",
};

const safeguardingOversightIntelligenceOutcomeLabels: Record<SafeguardingOversightIntelligenceOutcome, string> = {
  effective_safeguarding: "Effective Safeguarding",
  partially_effective: "Partially Effective",
  concerns_identified: "Concerns Identified",
  safeguarding_failure: "Safeguarding Failure",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSafeguardingOversightIntelligenceCategoryLabel(category: SafeguardingOversightIntelligenceCategory): string {
  return safeguardingOversightIntelligenceCategoryLabels[category];
}

export function getSafeguardingOversightIntelligenceOutcomeLabel(outcome: SafeguardingOversightIntelligenceOutcome): string {
  return safeguardingOversightIntelligenceOutcomeLabels[outcome];
}

export function getIntelligenceRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface SafeguardingOversightRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: SafeguardingOversightIntelligenceCategory;
  outcome: SafeguardingOversightIntelligenceOutcome;
  riskAssessmentCompleted: boolean;
  safeguardingLeadInformed: boolean;
  multiAgencyEngaged: boolean;
  childViewCaptured: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface SafeguardingOversightPolicy {
  safeguardingPolicy: boolean;
  saferRecruitmentPolicy: boolean;
  whistleblowingPolicy: boolean;
  allegationsManagementPolicy: boolean;
  onlineSafetyPolicy: boolean;
  bodyMapProtocol: boolean;
  safeguardingSupervisionPolicy: boolean;
}

export interface StaffSafeguardingOversightTraining {
  staffId: string;
  safeguardingAwareness: boolean;
  recognisingSigns: boolean;
  referralProcedures: boolean;
  recordKeepingSkills: boolean;
  multiAgencyWorking: boolean;
  onlineSafetyKnowledge: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SafeguardingOversightQualityResult {
  overallScore: number;
  totalRecords: number;
  riskAssessmentCompletedRate: number;
  safeguardingLeadInformedRate: number;
  multiAgencyEngagedRate: number;
  childViewCapturedRate: number;
}

export interface SafeguardingOversightComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  riskAssessmentCompletedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface SafeguardingOversightPolicyResult {
  overallScore: number;
  safeguardingPolicy: boolean;
  saferRecruitmentPolicy: boolean;
  whistleblowingPolicy: boolean;
  allegationsManagementPolicy: boolean;
  onlineSafetyPolicy: boolean;
  bodyMapProtocol: boolean;
  safeguardingSupervisionPolicy: boolean;
}

export interface StaffSafeguardingOversightReadinessResult {
  overallScore: number;
  totalStaff: number;
  safeguardingAwarenessRate: number;
  recognisingSignsRate: number;
  referralProceduresRate: number;
  recordKeepingSkillsRate: number;
  multiAgencyWorkingRate: number;
  onlineSafetyKnowledgeRate: number;
}

export interface ChildSafeguardingOversightProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  riskAssessmentCompletedRate: number;
  safeguardingLeadInformedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface SafeguardingOversightIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  safeguardingOversightQuality: SafeguardingOversightQualityResult;
  safeguardingOversightCompliance: SafeguardingOversightComplianceResult;
  safeguardingOversightPolicy: SafeguardingOversightPolicyResult;
  staffReadiness: StaffSafeguardingOversightReadinessResult;
  childProfiles: ChildSafeguardingOversightProfile[];
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

export function evaluateSafeguardingOversightQuality(
  records: SafeguardingOversightRecord[],
): SafeguardingOversightQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, riskAssessmentCompletedRate: 0, safeguardingLeadInformedRate: 0, multiAgencyEngagedRate: 0, childViewCapturedRate: 0 };
  }

  const riskAssessmentCompletedRate = pct(records.filter((r) => r.riskAssessmentCompleted).length, n);
  const safeguardingLeadInformedRate = pct(records.filter((r) => r.safeguardingLeadInformed).length, n);
  const multiAgencyEngagedRate = pct(records.filter((r) => r.multiAgencyEngaged).length, n);
  const childViewCapturedRate = pct(records.filter((r) => r.childViewCaptured).length, n);

  let score = 0;
  score += (riskAssessmentCompletedRate / 100) * 7;
  score += (safeguardingLeadInformedRate / 100) * 6;
  score += (multiAgencyEngagedRate / 100) * 6;
  score += (childViewCapturedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, riskAssessmentCompletedRate, safeguardingLeadInformedRate, multiAgencyEngagedRate, childViewCapturedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateSafeguardingOversightCompliance(
  records: SafeguardingOversightRecord[],
): SafeguardingOversightComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, riskAssessmentCompletedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const riskAssessmentCompletedRate = pct(records.filter((r) => r.riskAssessmentCompleted).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (riskAssessmentCompletedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, riskAssessmentCompletedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateSafeguardingOversightPolicy(
  policy: SafeguardingOversightPolicy | null,
): SafeguardingOversightPolicyResult {
  if (policy === null) {
    return { overallScore: 0, safeguardingPolicy: false, saferRecruitmentPolicy: false, whistleblowingPolicy: false, allegationsManagementPolicy: false, onlineSafetyPolicy: false, bodyMapProtocol: false, safeguardingSupervisionPolicy: false };
  }

  let score = 0;
  if (policy.safeguardingPolicy) score += 4;
  if (policy.saferRecruitmentPolicy) score += 4;
  if (policy.whistleblowingPolicy) score += 4;
  if (policy.allegationsManagementPolicy) score += 4;
  if (policy.onlineSafetyPolicy) score += 3;
  if (policy.bodyMapProtocol) score += 3;
  if (policy.safeguardingSupervisionPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    safeguardingPolicy: policy.safeguardingPolicy,
    saferRecruitmentPolicy: policy.saferRecruitmentPolicy,
    whistleblowingPolicy: policy.whistleblowingPolicy,
    allegationsManagementPolicy: policy.allegationsManagementPolicy,
    onlineSafetyPolicy: policy.onlineSafetyPolicy,
    bodyMapProtocol: policy.bodyMapProtocol,
    safeguardingSupervisionPolicy: policy.safeguardingSupervisionPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffSafeguardingOversightReadiness(
  training: StaffSafeguardingOversightTraining[],
): StaffSafeguardingOversightReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, safeguardingAwarenessRate: 0, recognisingSignsRate: 0, referralProceduresRate: 0, recordKeepingSkillsRate: 0, multiAgencyWorkingRate: 0, onlineSafetyKnowledgeRate: 0 };
  }

  const safeguardingAwarenessRate = pct(training.filter((t) => t.safeguardingAwareness).length, n);
  const recognisingSignsRate = pct(training.filter((t) => t.recognisingSigns).length, n);
  const referralProceduresRate = pct(training.filter((t) => t.referralProcedures).length, n);
  const recordKeepingSkillsRate = pct(training.filter((t) => t.recordKeepingSkills).length, n);
  const multiAgencyWorkingRate = pct(training.filter((t) => t.multiAgencyWorking).length, n);
  const onlineSafetyKnowledgeRate = pct(training.filter((t) => t.onlineSafetyKnowledge).length, n);

  let score = 0;
  score += (safeguardingAwarenessRate / 100) * 6;
  score += (recognisingSignsRate / 100) * 5;
  score += (referralProceduresRate / 100) * 5;
  score += (recordKeepingSkillsRate / 100) * 4;
  score += (multiAgencyWorkingRate / 100) * 3;
  score += (onlineSafetyKnowledgeRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, safeguardingAwarenessRate, recognisingSignsRate, referralProceduresRate, recordKeepingSkillsRate, multiAgencyWorkingRate, onlineSafetyKnowledgeRate };
}

// ── Build Child Safeguarding Oversight Profiles ────────────────────────

export function buildChildSafeguardingOversightProfiles(
  records: SafeguardingOversightRecord[],
): ChildSafeguardingOversightProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: SafeguardingOversightRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const riskAssessmentCompletedRate = pct(child.records.filter((r) => r.riskAssessmentCompleted).length, totalRecords);
    const safeguardingLeadInformedRate = pct(child.records.filter((r) => r.safeguardingLeadInformed).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (riskAssessmentCompletedRate >= 80) rate1Score = 3;
    else if (riskAssessmentCompletedRate >= 60) rate1Score = 2;
    else if (riskAssessmentCompletedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (safeguardingLeadInformedRate >= 80) rate2Score = 3;
    else if (safeguardingLeadInformedRate >= 60) rate2Score = 2;
    else if (safeguardingLeadInformedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, riskAssessmentCompletedRate, safeguardingLeadInformedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateSafeguardingOversightIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: SafeguardingOversightRecord[];
  policy: SafeguardingOversightPolicy | null;
  staff: StaffSafeguardingOversightTraining[];
}

export function generateSafeguardingOversightIntelligenceResult(
  input: GenerateSafeguardingOversightIntelligenceInput,
): SafeguardingOversightIntelligenceResult {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateSafeguardingOversightQuality(periodRecords);
  const complianceResult = evaluateSafeguardingOversightCompliance(periodRecords);
  const policyResult = evaluateSafeguardingOversightPolicy(policy);
  const staffResult = evaluateStaffSafeguardingOversightReadiness(staff);

  const childProfiles = buildChildSafeguardingOversightProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Safeguarding oversight rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Safeguarding oversight rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Safeguarding oversight quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Safeguarding oversight compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Safeguarding policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff safeguarding readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.riskAssessmentCompletedRate >= 90) strengths.push("Risk assessments completed at " + qualityResult.riskAssessmentCompletedRate + "%");
  if (periodRecords.length > 0 && qualityResult.safeguardingLeadInformedRate >= 90) strengths.push("Designated safeguarding lead informed at " + qualityResult.safeguardingLeadInformedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Safeguarding oversight rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Safeguarding oversight Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Safeguarding oversight quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Safeguarding oversight compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Safeguarding policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff safeguarding readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.riskAssessmentCompletedRate < 80) areasForImprovement.push("Risk assessment completion at " + qualityResult.riskAssessmentCompletedRate + "% — must improve for child safety");
  if (periodRecords.length === 0) areasForImprovement.push("No safeguarding oversight records — assessments must be documented");
  if (policy === null) areasForImprovement.push("No safeguarding policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff safeguarding training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No safeguarding policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff safeguarding training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.riskAssessmentCompletedRate < 50) actions.push("HIGH: Risk assessment completion at " + qualityResult.riskAssessmentCompletedRate + "% — review assessment schedules and processes");
  if (periodRecords.length > 0 && qualityResult.multiAgencyEngagedRate < 50) actions.push("HIGH: Multi-agency engagement at " + qualityResult.multiAgencyEngagedRate + "% — strengthen partnership working");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all assessments must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.safeguardingAwarenessRate < 50) actions.push("MEDIUM: Safeguarding awareness at " + staffResult.safeguardingAwarenessRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low safeguarding oversight scores — review individual provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Safeguarding oversight systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 12 — Protection of children standard",
    "CHR 2015 Reg 32 — Fitness of workers",
    "CHR 2015 Reg 34 — Safeguarding",
    "KCSIE 2024 — Keeping Children Safe in Education",
    "NMS 3 — Safeguarding children",
    "SCCIF — Safety of children",
    "Working Together 2023 — Multi-agency safeguarding",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    safeguardingOversightQuality: qualityResult,
    safeguardingOversightCompliance: complianceResult,
    safeguardingOversightPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

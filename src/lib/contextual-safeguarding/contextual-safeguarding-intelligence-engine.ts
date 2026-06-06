/* ──────────────────────────────────────────────────────────────
   Contextual Safeguarding Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of contextual safeguarding practices in children's
   residential care homes.

   Contextual Safeguarding (Firmin, 2017) recognises that young
   people's experiences of harm extend beyond the family into
   peer groups, schools, neighbourhoods, and online spaces.

   Regulatory basis:
     - CHR 2015 Reg 34 — Safeguarding
     - CHR 2015 Reg 35 — Behaviour management
     - WTSC 2023 Ch.3 — Multi-agency safeguarding
     - KCSIE 2024 — Keeping Children Safe in Education
     - Children Act 1989 s.47 — Duty to investigate
     - NMS 20 — Child protection
     - SCCIF — How well children are helped and protected

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type ContextualSafeguardingCategory =
  | "peer_risk_assessment"
  | "environmental_mapping"
  | "online_safety_assessment"
  | "gang_exploitation_screening"
  | "county_lines_assessment"
  | "community_risk_mapping"
  | "family_network_analysis"
  | "school_safety_assessment";

export type ContextualSafeguardingOutcome =
  | "no_risk_identified"
  | "low_risk"
  | "moderate_risk"
  | "high_risk"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const contextualSafeguardingCategoryLabels: Record<ContextualSafeguardingCategory, string> = {
  peer_risk_assessment: "Peer Risk Assessment",
  environmental_mapping: "Environmental Mapping",
  online_safety_assessment: "Online Safety Assessment",
  gang_exploitation_screening: "Gang/Exploitation Screening",
  county_lines_assessment: "County Lines Assessment",
  community_risk_mapping: "Community Risk Mapping",
  family_network_analysis: "Family Network Analysis",
  school_safety_assessment: "School Safety Assessment",
};

const contextualSafeguardingOutcomeLabels: Record<ContextualSafeguardingOutcome, string> = {
  no_risk_identified: "No Risk Identified",
  low_risk: "Low Risk",
  moderate_risk: "Moderate Risk",
  high_risk: "High Risk",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getContextualSafeguardingCategoryLabel(category: ContextualSafeguardingCategory): string {
  return contextualSafeguardingCategoryLabels[category];
}

export function getContextualSafeguardingOutcomeLabel(outcome: ContextualSafeguardingOutcome): string {
  return contextualSafeguardingOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ContextualSafeguardingRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: ContextualSafeguardingCategory;
  outcome: ContextualSafeguardingOutcome;
  riskAssessmentCompleted: boolean;
  protectiveFactorsIdentified: boolean;
  multiAgencyInvolved: boolean;
  safetyPlanInPlace: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface ContextualSafeguardingPolicy {
  contextualSafeguardingPolicy: boolean;
  peerRiskAssessmentPolicy: boolean;
  onlineSafetyPolicy: boolean;
  exploitationScreeningPolicy: boolean;
  communityMappingPolicy: boolean;
  multiAgencyProtocol: boolean;
  safetyPlanningPolicy: boolean;
}

export interface StaffContextualSafeguardingTraining {
  staffId: string;
  contextualSafeguardingKnowledge: boolean;
  exploitationAwareness: boolean;
  onlineSafetyCompetency: boolean;
  multiAgencyWorkingSkills: boolean;
  riskAssessmentSkills: boolean;
  safetyPlanningSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ContextualSafeguardingQualityResult {
  overallScore: number;
  totalRecords: number;
  riskAssessmentCompletedRate: number;
  protectiveFactorsIdentifiedRate: number;
  multiAgencyInvolvedRate: number;
  safetyPlanInPlaceRate: number;
}

export interface ContextualSafeguardingComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  riskAssessmentCompletedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface ContextualSafeguardingPolicyResult {
  overallScore: number;
  contextualSafeguardingPolicy: boolean;
  peerRiskAssessmentPolicy: boolean;
  onlineSafetyPolicy: boolean;
  exploitationScreeningPolicy: boolean;
  communityMappingPolicy: boolean;
  multiAgencyProtocol: boolean;
  safetyPlanningPolicy: boolean;
}

export interface StaffContextualSafeguardingReadinessResult {
  overallScore: number;
  totalStaff: number;
  contextualSafeguardingKnowledgeRate: number;
  exploitationAwarenessRate: number;
  onlineSafetyCompetencyRate: number;
  multiAgencyWorkingSkillsRate: number;
  riskAssessmentSkillsRate: number;
  safetyPlanningSkillsRate: number;
}

export interface ChildContextualSafeguardingProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  riskAssessmentCompletedRate: number;
  protectiveFactorsIdentifiedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface ContextualSafeguardingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  contextualSafeguardingQuality: ContextualSafeguardingQualityResult;
  contextualSafeguardingCompliance: ContextualSafeguardingComplianceResult;
  contextualSafeguardingPolicy: ContextualSafeguardingPolicyResult;
  staffReadiness: StaffContextualSafeguardingReadinessResult;
  childProfiles: ChildContextualSafeguardingProfile[];
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

export function evaluateContextualSafeguardingQuality(
  records: ContextualSafeguardingRecord[],
): ContextualSafeguardingQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, riskAssessmentCompletedRate: 0, protectiveFactorsIdentifiedRate: 0, multiAgencyInvolvedRate: 0, safetyPlanInPlaceRate: 0 };
  }

  const riskAssessmentCompletedRate = pct(records.filter((r) => r.riskAssessmentCompleted).length, n);
  const protectiveFactorsIdentifiedRate = pct(records.filter((r) => r.protectiveFactorsIdentified).length, n);
  const multiAgencyInvolvedRate = pct(records.filter((r) => r.multiAgencyInvolved).length, n);
  const safetyPlanInPlaceRate = pct(records.filter((r) => r.safetyPlanInPlace).length, n);

  let score = 0;
  score += (riskAssessmentCompletedRate / 100) * 7;
  score += (protectiveFactorsIdentifiedRate / 100) * 6;
  score += (multiAgencyInvolvedRate / 100) * 6;
  score += (safetyPlanInPlaceRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, riskAssessmentCompletedRate, protectiveFactorsIdentifiedRate, multiAgencyInvolvedRate, safetyPlanInPlaceRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateContextualSafeguardingCompliance(
  records: ContextualSafeguardingRecord[],
): ContextualSafeguardingComplianceResult {
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

export function evaluateContextualSafeguardingPolicy(
  policy: ContextualSafeguardingPolicy | null,
): ContextualSafeguardingPolicyResult {
  if (policy === null) {
    return { overallScore: 0, contextualSafeguardingPolicy: false, peerRiskAssessmentPolicy: false, onlineSafetyPolicy: false, exploitationScreeningPolicy: false, communityMappingPolicy: false, multiAgencyProtocol: false, safetyPlanningPolicy: false };
  }

  let score = 0;
  if (policy.contextualSafeguardingPolicy) score += 4;
  if (policy.peerRiskAssessmentPolicy) score += 4;
  if (policy.onlineSafetyPolicy) score += 4;
  if (policy.exploitationScreeningPolicy) score += 4;
  if (policy.communityMappingPolicy) score += 3;
  if (policy.multiAgencyProtocol) score += 3;
  if (policy.safetyPlanningPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    contextualSafeguardingPolicy: policy.contextualSafeguardingPolicy,
    peerRiskAssessmentPolicy: policy.peerRiskAssessmentPolicy,
    onlineSafetyPolicy: policy.onlineSafetyPolicy,
    exploitationScreeningPolicy: policy.exploitationScreeningPolicy,
    communityMappingPolicy: policy.communityMappingPolicy,
    multiAgencyProtocol: policy.multiAgencyProtocol,
    safetyPlanningPolicy: policy.safetyPlanningPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffContextualSafeguardingReadiness(
  training: StaffContextualSafeguardingTraining[],
): StaffContextualSafeguardingReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, contextualSafeguardingKnowledgeRate: 0, exploitationAwarenessRate: 0, onlineSafetyCompetencyRate: 0, multiAgencyWorkingSkillsRate: 0, riskAssessmentSkillsRate: 0, safetyPlanningSkillsRate: 0 };
  }

  const contextualSafeguardingKnowledgeRate = pct(training.filter((t) => t.contextualSafeguardingKnowledge).length, n);
  const exploitationAwarenessRate = pct(training.filter((t) => t.exploitationAwareness).length, n);
  const onlineSafetyCompetencyRate = pct(training.filter((t) => t.onlineSafetyCompetency).length, n);
  const multiAgencyWorkingSkillsRate = pct(training.filter((t) => t.multiAgencyWorkingSkills).length, n);
  const riskAssessmentSkillsRate = pct(training.filter((t) => t.riskAssessmentSkills).length, n);
  const safetyPlanningSkillsRate = pct(training.filter((t) => t.safetyPlanningSkills).length, n);

  let score = 0;
  score += (contextualSafeguardingKnowledgeRate / 100) * 6;
  score += (exploitationAwarenessRate / 100) * 5;
  score += (onlineSafetyCompetencyRate / 100) * 5;
  score += (multiAgencyWorkingSkillsRate / 100) * 4;
  score += (riskAssessmentSkillsRate / 100) * 3;
  score += (safetyPlanningSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, contextualSafeguardingKnowledgeRate, exploitationAwarenessRate, onlineSafetyCompetencyRate, multiAgencyWorkingSkillsRate, riskAssessmentSkillsRate, safetyPlanningSkillsRate };
}

// ── Build Child Contextual Safeguarding Profiles ────────────────────────

export function buildChildContextualSafeguardingProfiles(
  records: ContextualSafeguardingRecord[],
): ChildContextualSafeguardingProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: ContextualSafeguardingRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const riskAssessmentCompletedRate = pct(child.records.filter((r) => r.riskAssessmentCompleted).length, totalRecords);
    const protectiveFactorsIdentifiedRate = pct(child.records.filter((r) => r.protectiveFactorsIdentified).length, totalRecords);
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
    if (protectiveFactorsIdentifiedRate >= 80) rate2Score = 3;
    else if (protectiveFactorsIdentifiedRate >= 60) rate2Score = 2;
    else if (protectiveFactorsIdentifiedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, riskAssessmentCompletedRate, protectiveFactorsIdentifiedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateContextualSafeguardingIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: ContextualSafeguardingRecord[];
  policy: ContextualSafeguardingPolicy | null;
  staff: StaffContextualSafeguardingTraining[];
}

export function generateContextualSafeguardingIntelligence(
  input: GenerateContextualSafeguardingIntelligenceInput,
): ContextualSafeguardingIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateContextualSafeguardingQuality(periodRecords);
  const complianceResult = evaluateContextualSafeguardingCompliance(periodRecords);
  const policyResult = evaluateContextualSafeguardingPolicy(policy);
  const staffResult = evaluateStaffContextualSafeguardingReadiness(staff);

  const childProfiles = buildChildContextualSafeguardingProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Contextual safeguarding rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Contextual safeguarding rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Contextual safeguarding quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Contextual safeguarding compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Contextual safeguarding policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff contextual safeguarding readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.riskAssessmentCompletedRate >= 90) strengths.push("Risk assessments completed at " + qualityResult.riskAssessmentCompletedRate + "%");
  if (periodRecords.length > 0 && qualityResult.protectiveFactorsIdentifiedRate >= 90) strengths.push("Protective factors identified at " + qualityResult.protectiveFactorsIdentifiedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Contextual safeguarding rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Contextual safeguarding Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Contextual safeguarding quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Contextual safeguarding compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Contextual safeguarding policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff contextual safeguarding readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.riskAssessmentCompletedRate < 80) areasForImprovement.push("Risk assessment completion at " + qualityResult.riskAssessmentCompletedRate + "% — must improve for child safety");
  if (periodRecords.length === 0) areasForImprovement.push("No contextual safeguarding records — assessments must be documented");
  if (policy === null) areasForImprovement.push("No contextual safeguarding policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff contextual safeguarding training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No contextual safeguarding policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff contextual safeguarding training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.riskAssessmentCompletedRate < 50) actions.push("HIGH: Risk assessment completion at " + qualityResult.riskAssessmentCompletedRate + "% — review assessment schedules and processes");
  if (periodRecords.length > 0 && qualityResult.multiAgencyInvolvedRate < 50) actions.push("HIGH: Multi-agency involvement at " + qualityResult.multiAgencyInvolvedRate + "% — strengthen partnership working");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all assessments must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.contextualSafeguardingKnowledgeRate < 50) actions.push("MEDIUM: Contextual safeguarding knowledge at " + staffResult.contextualSafeguardingKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low contextual safeguarding scores — review individual assessment provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Contextual safeguarding systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 34 — Safeguarding",
    "CHR 2015 Reg 35 — Behaviour management",
    "WTSC 2023 Ch.3 — Multi-agency safeguarding",
    "KCSIE 2024 — Keeping Children Safe in Education",
    "Children Act 1989 s.47 — Duty to investigate",
    "NMS 20 — Child protection",
    "SCCIF — How well children are helped and protected",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    contextualSafeguardingQuality: qualityResult,
    contextualSafeguardingCompliance: complianceResult,
    contextualSafeguardingPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

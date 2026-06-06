/* ──────────────────────────────────────────────────────────────
   Therapeutic Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of therapeutic support and emotional wellbeing
   practices in children's residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 6 — Quality of care standard
     - CHR 2015 Reg 10 — Health (mental health)
     - CHR 2015 Reg 13 — Leadership and management
     - NMS 3 — Therapeutic care model
     - SCCIF — Experiences and progress
     - Children Act 1989 s.22(3A) — Duty to promote welfare
     - Quality Standards 2015 — Standard 3 (health and wellbeing)

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type TherapeuticCategory =
  | "individual_therapy"
  | "group_therapy"
  | "crisis_intervention"
  | "emotional_regulation"
  | "trauma_informed_care"
  | "wellbeing_assessment"
  | "therapeutic_activity"
  | "mental_health_review";

export type TherapeuticOutcome =
  | "positive_progress"
  | "maintaining"
  | "some_improvement"
  | "no_change"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const therapeuticCategoryLabels: Record<TherapeuticCategory, string> = {
  individual_therapy: "Individual Therapy",
  group_therapy: "Group Therapy",
  crisis_intervention: "Crisis Intervention",
  emotional_regulation: "Emotional Regulation",
  trauma_informed_care: "Trauma-Informed Care",
  wellbeing_assessment: "Wellbeing Assessment",
  therapeutic_activity: "Therapeutic Activity",
  mental_health_review: "Mental Health Review",
};

const therapeuticOutcomeLabels: Record<TherapeuticOutcome, string> = {
  positive_progress: "Positive Progress",
  maintaining: "Maintaining",
  some_improvement: "Some Improvement",
  no_change: "No Change",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getTherapeuticCategoryLabel(category: TherapeuticCategory): string {
  return therapeuticCategoryLabels[category];
}

export function getTherapeuticOutcomeLabel(outcome: TherapeuticOutcome): string {
  return therapeuticOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface TherapeuticRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: TherapeuticCategory;
  outcome: TherapeuticOutcome;
  therapeuticGoalAligned: boolean;
  voiceOfChildIncluded: boolean;
  evidenceBasedApproach: boolean;
  wellbeingImpactRecorded: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface TherapeuticPolicy {
  therapeuticCareModel: boolean;
  traumaInformedPolicy: boolean;
  emotionalRegulationFramework: boolean;
  mentalHealthSupportPolicy: boolean;
  crisisInterventionProtocol: boolean;
  wellbeingMonitoringPolicy: boolean;
  therapeuticSupervisionPolicy: boolean;
}

export interface StaffTherapeuticTraining {
  staffId: string;
  therapeuticCareKnowledge: boolean;
  traumaInformedPractice: boolean;
  emotionalRegulationSkills: boolean;
  mentalHealthAwareness: boolean;
  crisisDeEscalation: boolean;
  therapeuticRelationshipBuilding: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface TherapeuticQualityResult {
  overallScore: number;
  totalRecords: number;
  therapeuticGoalAlignedRate: number;
  voiceOfChildIncludedRate: number;
  evidenceBasedApproachRate: number;
  wellbeingImpactRecordedRate: number;
}

export interface TherapeuticComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  therapeuticGoalAlignedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface TherapeuticPolicyResult {
  overallScore: number;
  therapeuticCareModel: boolean;
  traumaInformedPolicy: boolean;
  emotionalRegulationFramework: boolean;
  mentalHealthSupportPolicy: boolean;
  crisisInterventionProtocol: boolean;
  wellbeingMonitoringPolicy: boolean;
  therapeuticSupervisionPolicy: boolean;
}

export interface StaffTherapeuticReadinessResult {
  overallScore: number;
  totalStaff: number;
  therapeuticCareKnowledgeRate: number;
  traumaInformedPracticeRate: number;
  emotionalRegulationSkillsRate: number;
  mentalHealthAwarenessRate: number;
  crisisDeEscalationRate: number;
  therapeuticRelationshipBuildingRate: number;
}

export interface ChildTherapeuticProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  therapeuticGoalAlignedRate: number;
  voiceOfChildIncludedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface TherapeuticIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  therapeuticQuality: TherapeuticQualityResult;
  therapeuticCompliance: TherapeuticComplianceResult;
  therapeuticPolicy: TherapeuticPolicyResult;
  staffReadiness: StaffTherapeuticReadinessResult;
  childProfiles: ChildTherapeuticProfile[];
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

export function evaluateTherapeuticQuality(
  records: TherapeuticRecord[],
): TherapeuticQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, therapeuticGoalAlignedRate: 0, voiceOfChildIncludedRate: 0, evidenceBasedApproachRate: 0, wellbeingImpactRecordedRate: 0 };
  }

  const therapeuticGoalAlignedRate = pct(records.filter((r) => r.therapeuticGoalAligned).length, n);
  const voiceOfChildIncludedRate = pct(records.filter((r) => r.voiceOfChildIncluded).length, n);
  const evidenceBasedApproachRate = pct(records.filter((r) => r.evidenceBasedApproach).length, n);
  const wellbeingImpactRecordedRate = pct(records.filter((r) => r.wellbeingImpactRecorded).length, n);

  let score = 0;
  score += (therapeuticGoalAlignedRate / 100) * 7;
  score += (voiceOfChildIncludedRate / 100) * 6;
  score += (evidenceBasedApproachRate / 100) * 6;
  score += (wellbeingImpactRecordedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, therapeuticGoalAlignedRate, voiceOfChildIncludedRate, evidenceBasedApproachRate, wellbeingImpactRecordedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateTherapeuticCompliance(
  records: TherapeuticRecord[],
): TherapeuticComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, therapeuticGoalAlignedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const therapeuticGoalAlignedRate = pct(records.filter((r) => r.therapeuticGoalAligned).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (therapeuticGoalAlignedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, therapeuticGoalAlignedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateTherapeuticPolicy(
  policy: TherapeuticPolicy | null,
): TherapeuticPolicyResult {
  if (policy === null) {
    return { overallScore: 0, therapeuticCareModel: false, traumaInformedPolicy: false, emotionalRegulationFramework: false, mentalHealthSupportPolicy: false, crisisInterventionProtocol: false, wellbeingMonitoringPolicy: false, therapeuticSupervisionPolicy: false };
  }

  let score = 0;
  if (policy.therapeuticCareModel) score += 4;
  if (policy.traumaInformedPolicy) score += 4;
  if (policy.emotionalRegulationFramework) score += 4;
  if (policy.mentalHealthSupportPolicy) score += 4;
  if (policy.crisisInterventionProtocol) score += 3;
  if (policy.wellbeingMonitoringPolicy) score += 3;
  if (policy.therapeuticSupervisionPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    therapeuticCareModel: policy.therapeuticCareModel,
    traumaInformedPolicy: policy.traumaInformedPolicy,
    emotionalRegulationFramework: policy.emotionalRegulationFramework,
    mentalHealthSupportPolicy: policy.mentalHealthSupportPolicy,
    crisisInterventionProtocol: policy.crisisInterventionProtocol,
    wellbeingMonitoringPolicy: policy.wellbeingMonitoringPolicy,
    therapeuticSupervisionPolicy: policy.therapeuticSupervisionPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffTherapeuticReadiness(
  training: StaffTherapeuticTraining[],
): StaffTherapeuticReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, therapeuticCareKnowledgeRate: 0, traumaInformedPracticeRate: 0, emotionalRegulationSkillsRate: 0, mentalHealthAwarenessRate: 0, crisisDeEscalationRate: 0, therapeuticRelationshipBuildingRate: 0 };
  }

  const therapeuticCareKnowledgeRate = pct(training.filter((t) => t.therapeuticCareKnowledge).length, n);
  const traumaInformedPracticeRate = pct(training.filter((t) => t.traumaInformedPractice).length, n);
  const emotionalRegulationSkillsRate = pct(training.filter((t) => t.emotionalRegulationSkills).length, n);
  const mentalHealthAwarenessRate = pct(training.filter((t) => t.mentalHealthAwareness).length, n);
  const crisisDeEscalationRate = pct(training.filter((t) => t.crisisDeEscalation).length, n);
  const therapeuticRelationshipBuildingRate = pct(training.filter((t) => t.therapeuticRelationshipBuilding).length, n);

  let score = 0;
  score += (therapeuticCareKnowledgeRate / 100) * 6;
  score += (traumaInformedPracticeRate / 100) * 5;
  score += (emotionalRegulationSkillsRate / 100) * 5;
  score += (mentalHealthAwarenessRate / 100) * 4;
  score += (crisisDeEscalationRate / 100) * 3;
  score += (therapeuticRelationshipBuildingRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, therapeuticCareKnowledgeRate, traumaInformedPracticeRate, emotionalRegulationSkillsRate, mentalHealthAwarenessRate, crisisDeEscalationRate, therapeuticRelationshipBuildingRate };
}

// ── Build Child Therapeutic Profiles ────────────────────────────────────

export function buildChildTherapeuticProfiles(
  records: TherapeuticRecord[],
): ChildTherapeuticProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: TherapeuticRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const therapeuticGoalAlignedRate = pct(child.records.filter((r) => r.therapeuticGoalAligned).length, totalRecords);
    const voiceOfChildIncludedRate = pct(child.records.filter((r) => r.voiceOfChildIncluded).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (therapeuticGoalAlignedRate >= 80) rate1Score = 3;
    else if (therapeuticGoalAlignedRate >= 60) rate1Score = 2;
    else if (therapeuticGoalAlignedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (voiceOfChildIncludedRate >= 80) rate2Score = 3;
    else if (voiceOfChildIncludedRate >= 60) rate2Score = 2;
    else if (voiceOfChildIncludedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, therapeuticGoalAlignedRate, voiceOfChildIncludedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateTherapeuticIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: TherapeuticRecord[];
  policy: TherapeuticPolicy | null;
  staff: StaffTherapeuticTraining[];
}

export function generateTherapeuticIntelligence(
  input: GenerateTherapeuticIntelligenceInput,
): TherapeuticIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateTherapeuticQuality(periodRecords);
  const complianceResult = evaluateTherapeuticCompliance(periodRecords);
  const policyResult = evaluateTherapeuticPolicy(policy);
  const staffResult = evaluateStaffTherapeuticReadiness(staff);

  const childProfiles = buildChildTherapeuticProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Therapeutic support rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Therapeutic support rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Therapeutic quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Therapeutic compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Therapeutic policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff therapeutic readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.therapeuticGoalAlignedRate >= 90) strengths.push("Therapeutic goal alignment at " + qualityResult.therapeuticGoalAlignedRate + "%");
  if (periodRecords.length > 0 && qualityResult.voiceOfChildIncludedRate >= 90) strengths.push("Voice of child included at " + qualityResult.voiceOfChildIncludedRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Therapeutic support rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Therapeutic support Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Therapeutic quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Therapeutic compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Therapeutic policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff therapeutic readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.voiceOfChildIncludedRate < 80) areasForImprovement.push("Voice of child inclusion at " + qualityResult.voiceOfChildIncludedRate + "% — must improve");
  if (periodRecords.length === 0) areasForImprovement.push("No therapeutic records — therapeutic support must be documented");
  if (policy === null) areasForImprovement.push("No therapeutic policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff therapeutic training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No therapeutic policy — develop and implement comprehensive therapeutic care model immediately");
  if (staff.length === 0) actions.push("URGENT: No staff therapeutic training — schedule training for all care staff");
  if (periodRecords.length > 0 && qualityResult.therapeuticGoalAlignedRate < 50) actions.push("HIGH: Therapeutic goal alignment at " + qualityResult.therapeuticGoalAlignedRate + "% — review care plans and therapeutic goals");
  if (periodRecords.length > 0 && qualityResult.voiceOfChildIncludedRate < 50) actions.push("HIGH: Voice of child inclusion at " + qualityResult.voiceOfChildIncludedRate + "% — ensure children's views are captured in therapeutic work");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all therapeutic activities must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.therapeuticCareKnowledgeRate < 50) actions.push("MEDIUM: Therapeutic care knowledge at " + staffResult.therapeuticCareKnowledgeRate + "% — schedule training");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low therapeutic engagement scores — review individual therapeutic plans");
  if (actions.length === 0) actions.push("No immediate actions required. Therapeutic support systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 6 — Quality of care standard",
    "CHR 2015 Reg 10 — Health (mental health)",
    "CHR 2015 Reg 13 — Leadership and management",
    "NMS 3 — Therapeutic care model",
    "SCCIF — Experiences and progress",
    "Children Act 1989 s.22(3A) — Duty to promote welfare",
    "Quality Standards 2015 — Standard 3 (health and wellbeing)",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    therapeuticQuality: qualityResult,
    therapeuticCompliance: complianceResult,
    therapeuticPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

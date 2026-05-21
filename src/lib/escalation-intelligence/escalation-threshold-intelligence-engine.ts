/* ──────────────────────────────────────────────────────────────
   Escalation Threshold Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of escalation and threshold management practices
   in children's residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 34 — Safeguarding
     - CHR 2015 Reg 40 — Notification of serious events
     - CHR 2015 Reg 13 — Leadership and management
     - NMS 18 — Multi-agency working
     - SCCIF — Safety and protection
     - Children Act 1989 s.47 — Child protection investigations
     - WTSC 2023 — Escalation protocols

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type EscalationThresholdCategory =
  | "safeguarding_escalation"
  | "threshold_assessment"
  | "multi_agency_referral"
  | "concern_escalation"
  | "professional_disagreement"
  | "management_escalation"
  | "ofsted_notification"
  | "emergency_response";

export type EscalationThresholdOutcome =
  | "appropriately_escalated"
  | "partially_escalated"
  | "delayed_escalation"
  | "not_escalated"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const escalationThresholdCategoryLabels: Record<EscalationThresholdCategory, string> = {
  safeguarding_escalation: "Safeguarding Escalation",
  threshold_assessment: "Threshold Assessment",
  multi_agency_referral: "Multi-Agency Referral",
  concern_escalation: "Concern Escalation",
  professional_disagreement: "Professional Disagreement",
  management_escalation: "Management Escalation",
  ofsted_notification: "Ofsted Notification",
  emergency_response: "Emergency Response",
};

const escalationThresholdOutcomeLabels: Record<EscalationThresholdOutcome, string> = {
  appropriately_escalated: "Appropriately Escalated",
  partially_escalated: "Partially Escalated",
  delayed_escalation: "Delayed Escalation",
  not_escalated: "Not Escalated",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getEscalationThresholdCategoryLabel(category: EscalationThresholdCategory): string {
  return escalationThresholdCategoryLabels[category];
}

export function getEscalationThresholdOutcomeLabel(outcome: EscalationThresholdOutcome): string {
  return escalationThresholdOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface EscalationThresholdRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: EscalationThresholdCategory;
  outcome: EscalationThresholdOutcome;
  thresholdCorrectlyIdentified: boolean;
  escalationTimelyCompleted: boolean;
  appropriateRecipientNotified: boolean;
  outcomeRecorded: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface EscalationThresholdPolicy {
  escalationPolicy: boolean;
  thresholdFramework: boolean;
  safeguardingEscalationProcedure: boolean;
  multiAgencyReferralPolicy: boolean;
  professionalDisagreementPolicy: boolean;
  ofstedNotificationProcedure: boolean;
  emergencyResponseProtocol: boolean;
}

export interface StaffEscalationThresholdTraining {
  staffId: string;
  escalationProcedureKnowledge: boolean;
  thresholdAssessmentSkills: boolean;
  safeguardingEscalationSkills: boolean;
  multiAgencyReferralSkills: boolean;
  professionalDisagreementResolution: boolean;
  emergencyResponseSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface EscalationThresholdQualityResult {
  overallScore: number;
  totalRecords: number;
  thresholdCorrectlyIdentifiedRate: number;
  escalationTimelyCompletedRate: number;
  appropriateRecipientNotifiedRate: number;
  outcomeRecordedRate: number;
}

export interface EscalationThresholdComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  thresholdCorrectlyIdentifiedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface EscalationThresholdPolicyResult {
  overallScore: number;
  escalationPolicy: boolean;
  thresholdFramework: boolean;
  safeguardingEscalationProcedure: boolean;
  multiAgencyReferralPolicy: boolean;
  professionalDisagreementPolicy: boolean;
  ofstedNotificationProcedure: boolean;
  emergencyResponseProtocol: boolean;
}

export interface StaffEscalationThresholdReadinessResult {
  overallScore: number;
  totalStaff: number;
  escalationProcedureKnowledgeRate: number;
  thresholdAssessmentSkillsRate: number;
  safeguardingEscalationSkillsRate: number;
  multiAgencyReferralSkillsRate: number;
  professionalDisagreementResolutionRate: number;
  emergencyResponseSkillsRate: number;
}

export interface ChildEscalationThresholdProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  thresholdCorrectlyIdentifiedRate: number;
  escalationTimelyCompletedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface EscalationThresholdIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  escalationThresholdQuality: EscalationThresholdQualityResult;
  escalationThresholdCompliance: EscalationThresholdComplianceResult;
  escalationThresholdPolicy: EscalationThresholdPolicyResult;
  staffReadiness: StaffEscalationThresholdReadinessResult;
  childProfiles: ChildEscalationThresholdProfile[];
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

export function evaluateEscalationThresholdQuality(
  records: EscalationThresholdRecord[],
): EscalationThresholdQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, thresholdCorrectlyIdentifiedRate: 0, escalationTimelyCompletedRate: 0, appropriateRecipientNotifiedRate: 0, outcomeRecordedRate: 0 };
  }

  const thresholdCorrectlyIdentifiedRate = pct(records.filter((r) => r.thresholdCorrectlyIdentified).length, n);
  const escalationTimelyCompletedRate = pct(records.filter((r) => r.escalationTimelyCompleted).length, n);
  const appropriateRecipientNotifiedRate = pct(records.filter((r) => r.appropriateRecipientNotified).length, n);
  const outcomeRecordedRate = pct(records.filter((r) => r.outcomeRecorded).length, n);

  let score = 0;
  score += (thresholdCorrectlyIdentifiedRate / 100) * 7;
  score += (escalationTimelyCompletedRate / 100) * 6;
  score += (appropriateRecipientNotifiedRate / 100) * 6;
  score += (outcomeRecordedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, thresholdCorrectlyIdentifiedRate, escalationTimelyCompletedRate, appropriateRecipientNotifiedRate, outcomeRecordedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateEscalationThresholdCompliance(
  records: EscalationThresholdRecord[],
): EscalationThresholdComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, thresholdCorrectlyIdentifiedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const thresholdCorrectlyIdentifiedRate = pct(records.filter((r) => r.thresholdCorrectlyIdentified).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (thresholdCorrectlyIdentifiedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, thresholdCorrectlyIdentifiedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateEscalationThresholdPolicy(
  policy: EscalationThresholdPolicy | null,
): EscalationThresholdPolicyResult {
  if (policy === null) {
    return { overallScore: 0, escalationPolicy: false, thresholdFramework: false, safeguardingEscalationProcedure: false, multiAgencyReferralPolicy: false, professionalDisagreementPolicy: false, ofstedNotificationProcedure: false, emergencyResponseProtocol: false };
  }

  let score = 0;
  if (policy.escalationPolicy) score += 4;
  if (policy.thresholdFramework) score += 4;
  if (policy.safeguardingEscalationProcedure) score += 4;
  if (policy.multiAgencyReferralPolicy) score += 4;
  if (policy.professionalDisagreementPolicy) score += 3;
  if (policy.ofstedNotificationProcedure) score += 3;
  if (policy.emergencyResponseProtocol) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    escalationPolicy: policy.escalationPolicy,
    thresholdFramework: policy.thresholdFramework,
    safeguardingEscalationProcedure: policy.safeguardingEscalationProcedure,
    multiAgencyReferralPolicy: policy.multiAgencyReferralPolicy,
    professionalDisagreementPolicy: policy.professionalDisagreementPolicy,
    ofstedNotificationProcedure: policy.ofstedNotificationProcedure,
    emergencyResponseProtocol: policy.emergencyResponseProtocol,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffEscalationThresholdReadiness(
  training: StaffEscalationThresholdTraining[],
): StaffEscalationThresholdReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, escalationProcedureKnowledgeRate: 0, thresholdAssessmentSkillsRate: 0, safeguardingEscalationSkillsRate: 0, multiAgencyReferralSkillsRate: 0, professionalDisagreementResolutionRate: 0, emergencyResponseSkillsRate: 0 };
  }

  const escalationProcedureKnowledgeRate = pct(training.filter((t) => t.escalationProcedureKnowledge).length, n);
  const thresholdAssessmentSkillsRate = pct(training.filter((t) => t.thresholdAssessmentSkills).length, n);
  const safeguardingEscalationSkillsRate = pct(training.filter((t) => t.safeguardingEscalationSkills).length, n);
  const multiAgencyReferralSkillsRate = pct(training.filter((t) => t.multiAgencyReferralSkills).length, n);
  const professionalDisagreementResolutionRate = pct(training.filter((t) => t.professionalDisagreementResolution).length, n);
  const emergencyResponseSkillsRate = pct(training.filter((t) => t.emergencyResponseSkills).length, n);

  let score = 0;
  score += (escalationProcedureKnowledgeRate / 100) * 6;
  score += (thresholdAssessmentSkillsRate / 100) * 5;
  score += (safeguardingEscalationSkillsRate / 100) * 5;
  score += (multiAgencyReferralSkillsRate / 100) * 4;
  score += (professionalDisagreementResolutionRate / 100) * 3;
  score += (emergencyResponseSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, escalationProcedureKnowledgeRate, thresholdAssessmentSkillsRate, safeguardingEscalationSkillsRate, multiAgencyReferralSkillsRate, professionalDisagreementResolutionRate, emergencyResponseSkillsRate };
}

// ── Build Child Escalation Threshold Profiles ──────────────────────────

export function buildChildEscalationThresholdProfiles(
  records: EscalationThresholdRecord[],
): ChildEscalationThresholdProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: EscalationThresholdRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const thresholdCorrectlyIdentifiedRate = pct(child.records.filter((r) => r.thresholdCorrectlyIdentified).length, totalRecords);
    const escalationTimelyCompletedRate = pct(child.records.filter((r) => r.escalationTimelyCompleted).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (thresholdCorrectlyIdentifiedRate >= 80) rate1Score = 3;
    else if (thresholdCorrectlyIdentifiedRate >= 60) rate1Score = 2;
    else if (thresholdCorrectlyIdentifiedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (escalationTimelyCompletedRate >= 80) rate2Score = 3;
    else if (escalationTimelyCompletedRate >= 60) rate2Score = 2;
    else if (escalationTimelyCompletedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, thresholdCorrectlyIdentifiedRate, escalationTimelyCompletedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateEscalationThresholdIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: EscalationThresholdRecord[];
  policy: EscalationThresholdPolicy | null;
  staff: StaffEscalationThresholdTraining[];
}

export function generateEscalationThresholdIntelligence(
  input: GenerateEscalationThresholdIntelligenceInput,
): EscalationThresholdIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);

  const qualityResult = evaluateEscalationThresholdQuality(periodRecords);
  const complianceResult = evaluateEscalationThresholdCompliance(periodRecords);
  const policyResult = evaluateEscalationThresholdPolicy(policy);
  const staffResult = evaluateStaffEscalationThresholdReadiness(staff);

  const childProfiles = buildChildEscalationThresholdProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Escalation & threshold management rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Escalation & threshold management rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Escalation quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Escalation compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Escalation policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff escalation readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.thresholdCorrectlyIdentifiedRate >= 90) strengths.push("Threshold identification accuracy at " + qualityResult.thresholdCorrectlyIdentifiedRate + "%");
  if (periodRecords.length > 0 && qualityResult.escalationTimelyCompletedRate >= 90) strengths.push("Timely escalation completion at " + qualityResult.escalationTimelyCompletedRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Escalation management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Escalation management Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Escalation quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Escalation compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Escalation policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff escalation readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.escalationTimelyCompletedRate < 80) areasForImprovement.push("Timely escalation at " + qualityResult.escalationTimelyCompletedRate + "% — must improve");
  if (periodRecords.length === 0) areasForImprovement.push("No escalation records — escalation management must be documented");
  if (policy === null) areasForImprovement.push("No escalation policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff escalation training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No escalation policy — develop and implement comprehensive escalation framework immediately");
  if (staff.length === 0) actions.push("URGENT: No staff escalation training — schedule training for all care staff");
  if (periodRecords.length > 0 && qualityResult.thresholdCorrectlyIdentifiedRate < 50) actions.push("HIGH: Threshold identification at " + qualityResult.thresholdCorrectlyIdentifiedRate + "% — review threshold framework and staff competency");
  if (periodRecords.length > 0 && qualityResult.escalationTimelyCompletedRate < 50) actions.push("HIGH: Timely escalation at " + qualityResult.escalationTimelyCompletedRate + "% — escalations must be completed within required timeframes");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all escalations must be fully documented");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.escalationProcedureKnowledgeRate < 50) actions.push("MEDIUM: Escalation procedure knowledge at " + staffResult.escalationProcedureKnowledgeRate + "% — schedule training");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low escalation management scores — review individual escalation histories");
  if (actions.length === 0) actions.push("No immediate actions required. Escalation management systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 34 — Safeguarding",
    "CHR 2015 Reg 40 — Notification of serious events",
    "CHR 2015 Reg 13 — Leadership and management",
    "NMS 18 — Multi-agency working",
    "SCCIF — Safety and protection",
    "Children Act 1989 s.47 — Child protection investigations",
    "WTSC 2023 — Escalation protocols",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    escalationThresholdQuality: qualityResult,
    escalationThresholdCompliance: complianceResult,
    escalationThresholdPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

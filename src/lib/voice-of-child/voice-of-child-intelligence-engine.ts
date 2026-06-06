/* ──────────────────────────────────────────────────────────────
   Voice of the Child Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of voice-of-child practice — how well children's
   wishes, feelings, and views are captured, recorded, and acted
   upon in children's residential care.

   Regulatory basis:
     - CHR 2015 Reg 7 — Children's wishes and feelings
     - CHR 2015 Reg 4(1)(a) — Quality of care: child's views
     - Children Act 1989 s.22(4) — Duty to ascertain wishes
     - UNCRC Article 12 — Right to be heard
     - SCCIF — All judgement areas: child's voice evidence
     - Working Together 2023 — Child-centred approach
     - Quality Standards 2015 — Standard 1 (child-centred)

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type VoiceOfChildCategory =
  | "wishes_feelings_capture"
  | "key_decision_participation"
  | "advocacy_access"
  | "complaint_voice"
  | "care_plan_voice"
  | "lac_review_participation"
  | "house_meeting_voice"
  | "daily_life_choice";

export type VoiceOfChildOutcome =
  | "voice_influenced_decision"
  | "voice_acknowledged"
  | "voice_partially_captured"
  | "voice_not_captured"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const voiceOfChildCategoryLabels: Record<VoiceOfChildCategory, string> = {
  wishes_feelings_capture: "Wishes & Feelings Capture",
  key_decision_participation: "Key Decision Participation",
  advocacy_access: "Advocacy Access",
  complaint_voice: "Complaint Voice",
  care_plan_voice: "Care Plan Voice",
  lac_review_participation: "LAC Review Participation",
  house_meeting_voice: "House Meeting Voice",
  daily_life_choice: "Daily Life Choice",
};

const voiceOfChildOutcomeLabels: Record<VoiceOfChildOutcome, string> = {
  voice_influenced_decision: "Voice Influenced Decision",
  voice_acknowledged: "Voice Acknowledged",
  voice_partially_captured: "Voice Partially Captured",
  voice_not_captured: "Voice Not Captured",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getVoiceOfChildCategoryLabel(category: VoiceOfChildCategory): string {
  return voiceOfChildCategoryLabels[category];
}

export function getVoiceOfChildOutcomeLabel(outcome: VoiceOfChildOutcome): string {
  return voiceOfChildOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface VoiceOfChildRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: VoiceOfChildCategory;
  outcome: VoiceOfChildOutcome;
  wishesFeelingsRecorded: boolean;
  childDirectlyConsulted: boolean;
  voiceInfluencedOutcome: boolean;
  ageAppropriateMethod: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface VoiceOfChildPolicy {
  wishesFeelingsPolicy: boolean;
  advocacyAccessPolicy: boolean;
  complaintVoicePolicy: boolean;
  participationFramework: boolean;
  ageAppropriateMethodsPolicy: boolean;
  independentAdvocacyArrangement: boolean;
  childFeedbackMechanism: boolean;
}

export interface StaffVoiceOfChildTraining {
  staffId: string;
  wishesFeelingsCapture: boolean;
  activeListeningSkills: boolean;
  ageAppropriateEngagement: boolean;
  advocacyAwareness: boolean;
  participationFacilitation: boolean;
  nonVerbalCommunication: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface VoiceOfChildQualityResult {
  overallScore: number;
  totalRecords: number;
  wishesFeelingsRecordedRate: number;
  childDirectlyConsultedRate: number;
  voiceInfluencedOutcomeRate: number;
  ageAppropriateMethodRate: number;
}

export interface VoiceOfChildComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  wishesFeelingsRecordedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface VoiceOfChildPolicyResult {
  overallScore: number;
  wishesFeelingsPolicy: boolean;
  advocacyAccessPolicy: boolean;
  complaintVoicePolicy: boolean;
  participationFramework: boolean;
  ageAppropriateMethodsPolicy: boolean;
  independentAdvocacyArrangement: boolean;
  childFeedbackMechanism: boolean;
}

export interface StaffVoiceOfChildReadinessResult {
  overallScore: number;
  totalStaff: number;
  wishesFeelingsCaptureRate: number;
  activeListeningSkillsRate: number;
  ageAppropriateEngagementRate: number;
  advocacyAwarenessRate: number;
  participationFacilitationRate: number;
  nonVerbalCommunicationRate: number;
}

export interface ChildVoiceOfChildProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  wishesFeelingsRecordedRate: number;
  childDirectlyConsultedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface VoiceOfChildIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  voiceOfChildQuality: VoiceOfChildQualityResult;
  voiceOfChildCompliance: VoiceOfChildComplianceResult;
  voiceOfChildPolicy: VoiceOfChildPolicyResult;
  staffReadiness: StaffVoiceOfChildReadinessResult;
  childProfiles: ChildVoiceOfChildProfile[];
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

export function evaluateVoiceOfChildQuality(
  records: VoiceOfChildRecord[],
): VoiceOfChildQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, wishesFeelingsRecordedRate: 0, childDirectlyConsultedRate: 0, voiceInfluencedOutcomeRate: 0, ageAppropriateMethodRate: 0 };
  }

  const wishesFeelingsRecordedRate = pct(records.filter((r) => r.wishesFeelingsRecorded).length, n);
  const childDirectlyConsultedRate = pct(records.filter((r) => r.childDirectlyConsulted).length, n);
  const voiceInfluencedOutcomeRate = pct(records.filter((r) => r.voiceInfluencedOutcome).length, n);
  const ageAppropriateMethodRate = pct(records.filter((r) => r.ageAppropriateMethod).length, n);

  let score = 0;
  score += (wishesFeelingsRecordedRate / 100) * 7;
  score += (childDirectlyConsultedRate / 100) * 6;
  score += (voiceInfluencedOutcomeRate / 100) * 6;
  score += (ageAppropriateMethodRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, wishesFeelingsRecordedRate, childDirectlyConsultedRate, voiceInfluencedOutcomeRate, ageAppropriateMethodRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateVoiceOfChildCompliance(
  records: VoiceOfChildRecord[],
): VoiceOfChildComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, wishesFeelingsRecordedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const wishesFeelingsRecordedRate = pct(records.filter((r) => r.wishesFeelingsRecorded).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (wishesFeelingsRecordedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, wishesFeelingsRecordedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateVoiceOfChildPolicy(
  policy: VoiceOfChildPolicy | null,
): VoiceOfChildPolicyResult {
  if (policy === null) {
    return { overallScore: 0, wishesFeelingsPolicy: false, advocacyAccessPolicy: false, complaintVoicePolicy: false, participationFramework: false, ageAppropriateMethodsPolicy: false, independentAdvocacyArrangement: false, childFeedbackMechanism: false };
  }

  let score = 0;
  if (policy.wishesFeelingsPolicy) score += 4;
  if (policy.advocacyAccessPolicy) score += 4;
  if (policy.complaintVoicePolicy) score += 4;
  if (policy.participationFramework) score += 4;
  if (policy.ageAppropriateMethodsPolicy) score += 3;
  if (policy.independentAdvocacyArrangement) score += 3;
  if (policy.childFeedbackMechanism) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    wishesFeelingsPolicy: policy.wishesFeelingsPolicy,
    advocacyAccessPolicy: policy.advocacyAccessPolicy,
    complaintVoicePolicy: policy.complaintVoicePolicy,
    participationFramework: policy.participationFramework,
    ageAppropriateMethodsPolicy: policy.ageAppropriateMethodsPolicy,
    independentAdvocacyArrangement: policy.independentAdvocacyArrangement,
    childFeedbackMechanism: policy.childFeedbackMechanism,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffVoiceOfChildReadiness(
  training: StaffVoiceOfChildTraining[],
): StaffVoiceOfChildReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, wishesFeelingsCaptureRate: 0, activeListeningSkillsRate: 0, ageAppropriateEngagementRate: 0, advocacyAwarenessRate: 0, participationFacilitationRate: 0, nonVerbalCommunicationRate: 0 };
  }

  const wishesFeelingsCaptureRate = pct(training.filter((t) => t.wishesFeelingsCapture).length, n);
  const activeListeningSkillsRate = pct(training.filter((t) => t.activeListeningSkills).length, n);
  const ageAppropriateEngagementRate = pct(training.filter((t) => t.ageAppropriateEngagement).length, n);
  const advocacyAwarenessRate = pct(training.filter((t) => t.advocacyAwareness).length, n);
  const participationFacilitationRate = pct(training.filter((t) => t.participationFacilitation).length, n);
  const nonVerbalCommunicationRate = pct(training.filter((t) => t.nonVerbalCommunication).length, n);

  let score = 0;
  score += (wishesFeelingsCaptureRate / 100) * 6;
  score += (activeListeningSkillsRate / 100) * 5;
  score += (ageAppropriateEngagementRate / 100) * 5;
  score += (advocacyAwarenessRate / 100) * 4;
  score += (participationFacilitationRate / 100) * 3;
  score += (nonVerbalCommunicationRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, wishesFeelingsCaptureRate, activeListeningSkillsRate, ageAppropriateEngagementRate, advocacyAwarenessRate, participationFacilitationRate, nonVerbalCommunicationRate };
}

// ── Build Child Voice Profiles ────────────────────────────────────────────

export function buildChildVoiceOfChildProfiles(
  records: VoiceOfChildRecord[],
): ChildVoiceOfChildProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: VoiceOfChildRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const wishesFeelingsRecordedRate = pct(child.records.filter((r) => r.wishesFeelingsRecorded).length, totalRecords);
    const childDirectlyConsultedRate = pct(child.records.filter((r) => r.childDirectlyConsulted).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (wishesFeelingsRecordedRate >= 80) rate1Score = 3;
    else if (wishesFeelingsRecordedRate >= 60) rate1Score = 2;
    else if (wishesFeelingsRecordedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (childDirectlyConsultedRate >= 80) rate2Score = 3;
    else if (childDirectlyConsultedRate >= 60) rate2Score = 2;
    else if (childDirectlyConsultedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, wishesFeelingsRecordedRate, childDirectlyConsultedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateVoiceOfChildIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: VoiceOfChildRecord[];
  policy: VoiceOfChildPolicy | null;
  staff: StaffVoiceOfChildTraining[];
}

export function generateVoiceOfChildIntelligenceReport(
  input: GenerateVoiceOfChildIntelligenceInput,
): VoiceOfChildIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateVoiceOfChildQuality(periodRecords);
  const complianceResult = evaluateVoiceOfChildCompliance(periodRecords);
  const policyResult = evaluateVoiceOfChildPolicy(policy);
  const staffResult = evaluateStaffVoiceOfChildReadiness(staff);

  const childProfiles = buildChildVoiceOfChildProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Voice of child practice rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Voice of child practice rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Voice capture quality is strong (" + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Voice compliance is strong (" + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Voice policy framework is robust (" + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff voice capture readiness is strong (" + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.wishesFeelingsRecordedRate >= 90) strengths.push("Wishes and feelings recorded at " + qualityResult.wishesFeelingsRecordedRate + "%");
  if (periodRecords.length > 0 && qualityResult.voiceInfluencedOutcomeRate >= 90) strengths.push("Voice influenced outcomes at " + qualityResult.voiceInfluencedOutcomeRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Voice of child practice rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Voice of child practice Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Voice capture quality needs improvement (" + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Voice compliance needs improvement (" + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Voice policy needs strengthening (" + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff voice readiness needs improvement (" + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.voiceInfluencedOutcomeRate < 80) areasForImprovement.push("Voice influenced outcomes at " + qualityResult.voiceInfluencedOutcomeRate + "% — children's views must more consistently shape decisions");
  if (periodRecords.length === 0) areasForImprovement.push("No voice of child records — participation must be documented");
  if (policy === null) areasForImprovement.push("No voice of child policy in place — statutory requirement under CHR 2015 Reg 7");
  if (staff.length === 0) areasForImprovement.push("No staff voice training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No voice of child policy — develop and implement wishes and feelings framework immediately (CHR 2015 Reg 7)");
  if (staff.length === 0) actions.push("URGENT: No staff voice training — schedule participation and voice capture training for all care staff");
  if (periodRecords.length > 0 && qualityResult.wishesFeelingsRecordedRate < 50) actions.push("HIGH: Wishes and feelings recorded at " + qualityResult.wishesFeelingsRecordedRate + "% — all interactions must capture the child's voice");
  if (periodRecords.length > 0 && qualityResult.childDirectlyConsultedRate < 50) actions.push("HIGH: Direct consultation at " + qualityResult.childDirectlyConsultedRate + "% — ensure children are directly asked their views");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all voice capture must be properly documented");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — voice records must be completed promptly");
  if (staff.length > 0 && staffResult.wishesFeelingsCaptureRate < 50) actions.push("MEDIUM: Wishes capture skills at " + staffResult.wishesFeelingsCaptureRate + "% — schedule training");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low voice participation scores — review individual participation plans");
  if (actions.length === 0) actions.push("No immediate actions required. Voice of child systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 7 — Children's wishes and feelings",
    "CHR 2015 Reg 4(1)(a) — Quality of care: child's views",
    "Children Act 1989 s.22(4) — Duty to ascertain wishes",
    "UNCRC Article 12 — Right to be heard",
    "SCCIF — All judgement areas: child's voice evidence",
    "Working Together 2023 — Child-centred approach",
    "Quality Standards 2015 — Standard 1 (child-centred)",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    voiceOfChildQuality: qualityResult,
    voiceOfChildCompliance: complianceResult,
    voiceOfChildPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

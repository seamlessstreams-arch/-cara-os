/* ──────────────────────────────────────────────────────────────
   Peer Dynamics Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of peer relationship management, group living
   dynamics, and social skills development in children's
   residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 12 — Protection from bullying
     - CHR 2015 Reg 35 — Behaviour management
     - NMS 3 — Positive relationships
     - SCCIF — Experiences and progress
     - Children Act 1989 — Welfare
     - Quality Standards 2015 Standard 3
     - KCSIE 2024 — Peer-on-peer abuse

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type PeerDynamicsIntelligenceCategory =
  | "peer_conflict_resolution"
  | "friendship_building"
  | "group_activity_engagement"
  | "bullying_response"
  | "positive_peer_influence"
  | "social_skills_development"
  | "peer_mediation"
  | "group_living_assessment";

export type PeerDynamicsIntelligenceOutcome =
  | "positive_dynamics"
  | "improving_dynamics"
  | "mixed_dynamics"
  | "concerning_dynamics"
  | "not_applicable";

export type PeerDynamicsRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const peerDynamicsIntelligenceCategoryLabels: Record<PeerDynamicsIntelligenceCategory, string> = {
  peer_conflict_resolution: "Peer Conflict Resolution",
  friendship_building: "Friendship Building",
  group_activity_engagement: "Group Activity Engagement",
  bullying_response: "Bullying Response",
  positive_peer_influence: "Positive Peer Influence",
  social_skills_development: "Social Skills Development",
  peer_mediation: "Peer Mediation",
  group_living_assessment: "Group Living Assessment",
};

const peerDynamicsIntelligenceOutcomeLabels: Record<PeerDynamicsIntelligenceOutcome, string> = {
  positive_dynamics: "Positive Dynamics",
  improving_dynamics: "Improving Dynamics",
  mixed_dynamics: "Mixed Dynamics",
  concerning_dynamics: "Concerning Dynamics",
  not_applicable: "Not Applicable",
};

const peerDynamicsRatingLabels: Record<PeerDynamicsRating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getPeerDynamicsIntelligenceCategoryLabel(category: PeerDynamicsIntelligenceCategory): string {
  return peerDynamicsIntelligenceCategoryLabels[category];
}

export function getPeerDynamicsIntelligenceOutcomeLabel(outcome: PeerDynamicsIntelligenceOutcome): string {
  return peerDynamicsIntelligenceOutcomeLabels[outcome];
}

export function getPeerDynamicsRatingLabel(rating: PeerDynamicsRating): string {
  return peerDynamicsRatingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface PeerDynamicsIntelligenceRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: PeerDynamicsIntelligenceCategory;
  outcome: PeerDynamicsIntelligenceOutcome;
  childViewCaptured: boolean;
  restorativeApproachUsed: boolean;
  positiveOutcomeAchieved: boolean;
  safetyConsideredFirst: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface PeerDynamicsIntelligencePolicy {
  peerRelationshipPolicy: boolean;
  antiBullyingPolicy: boolean;
  restorativePracticePolicy: boolean;
  groupLivingPolicy: boolean;
  socialSkillsDevelopmentPolicy: boolean;
  peerMediationPolicy: boolean;
  conflictResolutionPolicy: boolean;
}

export interface StaffPeerDynamicsTraining {
  staffId: string;
  peerDynamicsAwareness: boolean;
  conflictResolutionSkills: boolean;
  restorativePracticeSkills: boolean;
  groupFacilitationSkills: boolean;
  bullyingPreventionKnowledge: boolean;
  socialSkillsTeaching: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface PeerDynamicsQualityResult {
  overallScore: number;
  totalRecords: number;
  childViewCapturedRate: number;
  restorativeApproachUsedRate: number;
  positiveOutcomeAchievedRate: number;
  safetyConsideredFirstRate: number;
}

export interface PeerDynamicsComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  childViewCapturedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface PeerDynamicsPolicyResult {
  overallScore: number;
  peerRelationshipPolicy: boolean;
  antiBullyingPolicy: boolean;
  restorativePracticePolicy: boolean;
  groupLivingPolicy: boolean;
  socialSkillsDevelopmentPolicy: boolean;
  peerMediationPolicy: boolean;
  conflictResolutionPolicy: boolean;
}

export interface StaffPeerDynamicsReadinessResult {
  overallScore: number;
  totalStaff: number;
  peerDynamicsAwarenessRate: number;
  conflictResolutionSkillsRate: number;
  restorativePracticeSkillsRate: number;
  groupFacilitationSkillsRate: number;
  bullyingPreventionKnowledgeRate: number;
  socialSkillsTeachingRate: number;
}

export interface ChildPeerDynamicsProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  childViewCapturedRate: number;
  restorativeApproachUsedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface PeerDynamicsIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: PeerDynamicsRating;
  peerDynamicsQuality: PeerDynamicsQualityResult;
  peerDynamicsCompliance: PeerDynamicsComplianceResult;
  peerDynamicsPolicy: PeerDynamicsPolicyResult;
  staffReadiness: StaffPeerDynamicsReadinessResult;
  childProfiles: ChildPeerDynamicsProfile[];
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

export function getRating(score: number): PeerDynamicsRating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluatePeerDynamicsQuality(
  records: PeerDynamicsIntelligenceRecord[],
): PeerDynamicsQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, childViewCapturedRate: 0, restorativeApproachUsedRate: 0, positiveOutcomeAchievedRate: 0, safetyConsideredFirstRate: 0 };
  }

  const childViewCapturedRate = pct(records.filter((r) => r.childViewCaptured).length, n);
  const restorativeApproachUsedRate = pct(records.filter((r) => r.restorativeApproachUsed).length, n);
  const positiveOutcomeAchievedRate = pct(records.filter((r) => r.positiveOutcomeAchieved).length, n);
  const safetyConsideredFirstRate = pct(records.filter((r) => r.safetyConsideredFirst).length, n);

  let score = 0;
  score += (childViewCapturedRate / 100) * 7;
  score += (restorativeApproachUsedRate / 100) * 6;
  score += (positiveOutcomeAchievedRate / 100) * 6;
  score += (safetyConsideredFirstRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, childViewCapturedRate, restorativeApproachUsedRate, positiveOutcomeAchievedRate, safetyConsideredFirstRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluatePeerDynamicsCompliance(
  records: PeerDynamicsIntelligenceRecord[],
): PeerDynamicsComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, childViewCapturedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const childViewCapturedRate = pct(records.filter((r) => r.childViewCaptured).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (childViewCapturedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, childViewCapturedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluatePeerDynamicsPolicy(
  policy: PeerDynamicsIntelligencePolicy | null,
): PeerDynamicsPolicyResult {
  if (policy === null) {
    return { overallScore: 0, peerRelationshipPolicy: false, antiBullyingPolicy: false, restorativePracticePolicy: false, groupLivingPolicy: false, socialSkillsDevelopmentPolicy: false, peerMediationPolicy: false, conflictResolutionPolicy: false };
  }

  let score = 0;
  if (policy.peerRelationshipPolicy) score += 4;
  if (policy.antiBullyingPolicy) score += 4;
  if (policy.restorativePracticePolicy) score += 4;
  if (policy.groupLivingPolicy) score += 4;
  if (policy.socialSkillsDevelopmentPolicy) score += 3;
  if (policy.peerMediationPolicy) score += 3;
  if (policy.conflictResolutionPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    peerRelationshipPolicy: policy.peerRelationshipPolicy,
    antiBullyingPolicy: policy.antiBullyingPolicy,
    restorativePracticePolicy: policy.restorativePracticePolicy,
    groupLivingPolicy: policy.groupLivingPolicy,
    socialSkillsDevelopmentPolicy: policy.socialSkillsDevelopmentPolicy,
    peerMediationPolicy: policy.peerMediationPolicy,
    conflictResolutionPolicy: policy.conflictResolutionPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffPeerDynamicsReadiness(
  training: StaffPeerDynamicsTraining[],
): StaffPeerDynamicsReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, peerDynamicsAwarenessRate: 0, conflictResolutionSkillsRate: 0, restorativePracticeSkillsRate: 0, groupFacilitationSkillsRate: 0, bullyingPreventionKnowledgeRate: 0, socialSkillsTeachingRate: 0 };
  }

  const peerDynamicsAwarenessRate = pct(training.filter((t) => t.peerDynamicsAwareness).length, n);
  const conflictResolutionSkillsRate = pct(training.filter((t) => t.conflictResolutionSkills).length, n);
  const restorativePracticeSkillsRate = pct(training.filter((t) => t.restorativePracticeSkills).length, n);
  const groupFacilitationSkillsRate = pct(training.filter((t) => t.groupFacilitationSkills).length, n);
  const bullyingPreventionKnowledgeRate = pct(training.filter((t) => t.bullyingPreventionKnowledge).length, n);
  const socialSkillsTeachingRate = pct(training.filter((t) => t.socialSkillsTeaching).length, n);

  let score = 0;
  score += (peerDynamicsAwarenessRate / 100) * 6;
  score += (conflictResolutionSkillsRate / 100) * 5;
  score += (restorativePracticeSkillsRate / 100) * 5;
  score += (groupFacilitationSkillsRate / 100) * 4;
  score += (bullyingPreventionKnowledgeRate / 100) * 3;
  score += (socialSkillsTeachingRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, peerDynamicsAwarenessRate, conflictResolutionSkillsRate, restorativePracticeSkillsRate, groupFacilitationSkillsRate, bullyingPreventionKnowledgeRate, socialSkillsTeachingRate };
}

// ── Build Child Peer Dynamics Profiles ─────────────────────────────────

export function buildChildPeerDynamicsProfiles(
  records: PeerDynamicsIntelligenceRecord[],
): ChildPeerDynamicsProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: PeerDynamicsIntelligenceRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const childViewCapturedRate = pct(child.records.filter((r) => r.childViewCaptured).length, totalRecords);
    const restorativeApproachUsedRate = pct(child.records.filter((r) => r.restorativeApproachUsed).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (childViewCapturedRate >= 80) rate1Score = 3;
    else if (childViewCapturedRate >= 60) rate1Score = 2;
    else if (childViewCapturedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (restorativeApproachUsedRate >= 80) rate2Score = 3;
    else if (restorativeApproachUsedRate >= 60) rate2Score = 2;
    else if (restorativeApproachUsedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, childViewCapturedRate, restorativeApproachUsedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GeneratePeerDynamicsIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: PeerDynamicsIntelligenceRecord[];
  policy: PeerDynamicsIntelligencePolicy | null;
  staff: StaffPeerDynamicsTraining[];
}

export function generatePeerDynamicsIntelligenceResult(
  input: GeneratePeerDynamicsIntelligenceInput,
): PeerDynamicsIntelligenceResult {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluatePeerDynamicsQuality(periodRecords);
  const complianceResult = evaluatePeerDynamicsCompliance(periodRecords);
  const policyResult = evaluatePeerDynamicsPolicy(policy);
  const staffResult = evaluateStaffPeerDynamicsReadiness(staff);

  const childProfiles = buildChildPeerDynamicsProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Peer dynamics management rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Peer dynamics management rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Peer dynamics quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Peer dynamics compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Peer dynamics policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff peer dynamics readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.childViewCapturedRate >= 90) strengths.push("Child views captured at " + qualityResult.childViewCapturedRate + "%");
  if (periodRecords.length > 0 && qualityResult.restorativeApproachUsedRate >= 90) strengths.push("Restorative approaches used at " + qualityResult.restorativeApproachUsedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Peer dynamics management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Peer dynamics management Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Peer dynamics quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Peer dynamics compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Peer dynamics policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff peer dynamics readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.childViewCapturedRate < 80) areasForImprovement.push("Child view capture at " + qualityResult.childViewCapturedRate + "% — must improve to ensure child participation");
  if (periodRecords.length === 0) areasForImprovement.push("No peer dynamics records — assessments must be documented");
  if (policy === null) areasForImprovement.push("No peer dynamics policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff peer dynamics training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No peer dynamics policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff peer dynamics training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.childViewCapturedRate < 50) actions.push("HIGH: Child view capture at " + qualityResult.childViewCapturedRate + "% — review processes for capturing child views");
  if (periodRecords.length > 0 && qualityResult.restorativeApproachUsedRate < 50) actions.push("HIGH: Restorative approach usage at " + qualityResult.restorativeApproachUsedRate + "% — strengthen restorative practice implementation");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all assessments must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.peerDynamicsAwarenessRate < 50) actions.push("MEDIUM: Peer dynamics awareness at " + staffResult.peerDynamicsAwarenessRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low peer dynamics scores — review individual support plans");
  if (actions.length === 0) actions.push("No immediate actions required. Peer dynamics systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 12 — Protection from bullying",
    "CHR 2015 Reg 35 — Behaviour management",
    "NMS 3 — Positive relationships",
    "SCCIF — Experiences and progress",
    "Children Act 1989 — Welfare",
    "Quality Standards 2015 Standard 3",
    "KCSIE 2024 — Peer-on-peer abuse",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    peerDynamicsQuality: qualityResult,
    peerDynamicsCompliance: complianceResult,
    peerDynamicsPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

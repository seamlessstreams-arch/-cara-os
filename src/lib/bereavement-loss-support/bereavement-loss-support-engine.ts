// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Bereavement, Loss & Support Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home supports children through bereavement, loss,
// separation, and grief. Loss for looked-after children includes separation
// from birth family, placement moves, and relationship endings — not only death.
//
// Maps to: CHR 2015 Reg 10 (duty to promote contact), Reg 14 (care of
// young person), SCCIF, Working Together 2023, UNCRC Article 39, NICE CG16,
// Children Act 1989
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Unions ─────────────────────────────────────────────────────────────

export type LossType =
  | "bereavement"
  | "family_separation"
  | "placement_move"
  | "friendship_loss"
  | "pet_loss"
  | "relationship_breakdown"
  | "other";

export type SupportType =
  | "therapeutic"
  | "keyworker"
  | "peer_support"
  | "specialist_referral"
  | "memory_work"
  | "group_work"
  | "external_counselling";

export type GriefStage =
  | "acute"
  | "ongoing"
  | "resolved"
  | "recurring"
  | "not_assessed";

export type SupportOutcome =
  | "positive"
  | "partially_positive"
  | "neutral"
  | "negative"
  | "too_early";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface LossEvent {
  id: string;
  childId: string;
  childName: string;
  eventDate: string;
  lossType: LossType;
  description: string;
  impactAssessed: boolean;
  supportPlanCreated: boolean;
  supportPlanReviewed: boolean;
}

export interface SupportIntervention {
  id: string;
  childId: string;
  childName: string;
  lossEventId: string;
  interventionDate: string;
  supportType: SupportType;
  deliveredBy: string;
  childEngaged: boolean;
  outcome: SupportOutcome;
  followUpScheduled: boolean;
  followUpCompleted: boolean;
}

export interface BereavementPolicy {
  id: string;
  policyReviewDate: string;
  policyCurrent: boolean;
  griefAwarenessIncluded: boolean;
  memoryWorkGuidance: boolean;
  specialistReferralPathway: boolean;
  culturalConsiderations: boolean;
  peerSupportFramework: boolean;
  staffSupportIncluded: boolean;
}

export interface StaffBereavementTraining {
  id: string;
  staffId: string;
  staffName: string;
  griefAwareness: boolean;
  therapeuticResponse: boolean;
  memoryWorkSkills: boolean;
  culturalSensitivity: boolean;
  childDevelopmentGrief: boolean;
  referralPathways: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface LossResponseResult {
  totalEvents: number;
  impactAssessedRate: number;
  supportPlanCreatedRate: number;
  supportPlanReviewedRate: number;
  allEventsWithPlansRate: number;
  overallScore: number;
}

export interface SupportQualityResult {
  totalInterventions: number;
  childEngagedRate: number;
  positiveOutcomeRate: number;
  followUpCompletedRate: number;
  supportTypeVariety: number;
  overallScore: number;
}

export interface BereavementPolicyResult {
  totalPolicies: number;
  policyCurrent: boolean;
  griefAwarenessIncluded: boolean;
  memoryWorkGuidance: boolean;
  specialistReferralPathway: boolean;
  culturalConsiderations: boolean;
  peerSupportFramework: boolean;
  staffSupportIncluded: boolean;
  overallScore: number;
}

export interface StaffBereavementReadinessResult {
  totalStaff: number;
  griefAwarenessRate: number;
  therapeuticResponseRate: number;
  memoryWorkSkillsRate: number;
  culturalSensitivityRate: number;
  childDevelopmentGriefRate: number;
  referralPathwaysRate: number;
  overallScore: number;
}

export interface ChildGriefProfile {
  childId: string;
  childName: string;
  totalLossEvents: number;
  lossTypes: LossType[];
  impactAssessed: boolean;
  supportPlanInPlace: boolean;
  totalInterventions: number;
  engagementRate: number;
  positiveOutcomeRate: number;
  overallScore: number;
  riskFactors: string[];
  protectiveFactors: string[];
}

export interface BereavementLossSupportIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  lossResponse: LossResponseResult;
  supportQuality: SupportQualityResult;
  bereavementPolicy: BereavementPolicyResult;
  staffReadiness: StaffBereavementReadinessResult;
  childProfiles: ChildGriefProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Label Maps & Getters ────────────────────────────────────────────────────

const lossTypeLabels: Record<LossType, string> = {
  bereavement: "Bereavement",
  family_separation: "Family Separation",
  placement_move: "Placement Move",
  friendship_loss: "Friendship Loss",
  pet_loss: "Pet Loss",
  relationship_breakdown: "Relationship Breakdown",
  other: "Other",
};

const supportTypeLabels: Record<SupportType, string> = {
  therapeutic: "Therapeutic",
  keyworker: "Keyworker",
  peer_support: "Peer Support",
  specialist_referral: "Specialist Referral",
  memory_work: "Memory Work",
  group_work: "Group Work",
  external_counselling: "External Counselling",
};

const griefStageLabels: Record<GriefStage, string> = {
  acute: "Acute",
  ongoing: "Ongoing",
  resolved: "Resolved",
  recurring: "Recurring",
  not_assessed: "Not Assessed",
};

const supportOutcomeLabels: Record<SupportOutcome, string> = {
  positive: "Positive",
  partially_positive: "Partially Positive",
  neutral: "Neutral",
  negative: "Negative",
  too_early: "Too Early",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getLossTypeLabel(type: LossType): string {
  return lossTypeLabels[type] || type;
}

export function getSupportTypeLabel(type: SupportType): string {
  return supportTypeLabels[type] || type;
}

export function getGriefStageLabel(stage: GriefStage): string {
  return griefStageLabels[stage] || stage;
}

export function getSupportOutcomeLabel(outcome: SupportOutcome): string {
  return supportOutcomeLabels[outcome] || outcome;
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] || rating;
}

export function getLossTypeLabels(): Record<LossType, string> {
  return { ...lossTypeLabels };
}

export function getSupportTypeLabels(): Record<SupportType, string> {
  return { ...supportTypeLabels };
}

export function getGriefStageLabels(): Record<GriefStage, string> {
  return { ...griefStageLabels };
}

export function getSupportOutcomeLabels(): Record<SupportOutcome, string> {
  return { ...supportOutcomeLabels };
}

export function getRatingLabels(): Record<Rating, string> {
  return { ...ratingLabels };
}

// ── Evaluator 1: Loss Response (0-25) ───────────────────────────────────────

export function evaluateLossResponse(events: LossEvent[]): LossResponseResult {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      impactAssessedRate: 0,
      supportPlanCreatedRate: 0,
      supportPlanReviewedRate: 0,
      allEventsWithPlansRate: 0,
      overallScore: 25,
    };
  }

  const total = events.length;
  const impactAssessedCount = events.filter(e => e.impactAssessed).length;
  const supportPlanCreatedCount = events.filter(e => e.supportPlanCreated).length;
  const supportPlanReviewedCount = events.filter(e => e.supportPlanReviewed).length;
  const allWithPlansCount = events.filter(e => e.impactAssessed && e.supportPlanCreated && e.supportPlanReviewed).length;

  const impactAssessedRate = pct(impactAssessedCount, total);
  const supportPlanCreatedRate = pct(supportPlanCreatedCount, total);
  const supportPlanReviewedRate = pct(supportPlanReviewedCount, total);
  const allEventsWithPlansRate = pct(allWithPlansCount, total);

  // Impact assessed rate (0-7)
  const impactScore = Math.min(Math.round((impactAssessedRate / 100) * 7), 7);
  // Support plan created rate (0-6)
  const planCreatedScore = Math.min(Math.round((supportPlanCreatedRate / 100) * 6), 6);
  // Support plan reviewed rate (0-6)
  const planReviewedScore = Math.min(Math.round((supportPlanReviewedRate / 100) * 6), 6);
  // All events with plans rate bonus (0-6)
  const allPlansScore = Math.min(Math.round((allEventsWithPlansRate / 100) * 6), 6);

  const overallScore = Math.min(impactScore + planCreatedScore + planReviewedScore + allPlansScore, 25);

  return {
    totalEvents: total,
    impactAssessedRate,
    supportPlanCreatedRate,
    supportPlanReviewedRate,
    allEventsWithPlansRate,
    overallScore,
  };
}

// ── Evaluator 2: Support Quality (0-25) ─────────────────────────────────────

export function evaluateSupportQuality(interventions: SupportIntervention[]): SupportQualityResult {
  if (interventions.length === 0) {
    return {
      totalInterventions: 0,
      childEngagedRate: 0,
      positiveOutcomeRate: 0,
      followUpCompletedRate: 0,
      supportTypeVariety: 0,
      overallScore: 0,
    };
  }

  const total = interventions.length;
  const childEngagedCount = interventions.filter(i => i.childEngaged).length;
  const positiveOutcomeCount = interventions.filter(i => i.outcome === "positive" || i.outcome === "partially_positive").length;
  const followUpScheduledCount = interventions.filter(i => i.followUpScheduled).length;
  const followUpCompletedCount = interventions.filter(i => i.followUpCompleted).length;

  const childEngagedRate = pct(childEngagedCount, total);
  const positiveOutcomeRate = pct(positiveOutcomeCount, total);
  const followUpCompletedRate = pct(followUpCompletedCount, followUpScheduledCount);

  const uniqueSupportTypes = new Set(interventions.map(i => i.supportType)).size;
  const totalPossibleTypes = 7; // total number of SupportType values
  const supportTypeVariety = uniqueSupportTypes;

  // Child engaged rate (0-7)
  const engagedScore = Math.min(Math.round((childEngagedRate / 100) * 7), 7);
  // Positive outcome rate (0-6)
  const outcomeScore = Math.min(Math.round((positiveOutcomeRate / 100) * 6), 6);
  // Follow-up completed rate (0-6)
  const followUpScore = Math.min(Math.round((followUpCompletedRate / 100) * 6), 6);
  // Variety of support types (0-6)
  const varietyScore = Math.min(Math.round((uniqueSupportTypes / totalPossibleTypes) * 6), 6);

  const overallScore = Math.min(engagedScore + outcomeScore + followUpScore + varietyScore, 25);

  return {
    totalInterventions: total,
    childEngagedRate,
    positiveOutcomeRate,
    followUpCompletedRate,
    supportTypeVariety,
    overallScore,
  };
}

// ── Evaluator 3: Bereavement Policy (0-25) ──────────────────────────────────

export function evaluateBereavementPolicy(policies: BereavementPolicy[]): BereavementPolicyResult {
  if (policies.length === 0) {
    return {
      totalPolicies: 0,
      policyCurrent: false,
      griefAwarenessIncluded: false,
      memoryWorkGuidance: false,
      specialistReferralPathway: false,
      culturalConsiderations: false,
      peerSupportFramework: false,
      staffSupportIncluded: false,
      overallScore: 0,
    };
  }

  // Use the most recent policy (sort by review date descending)
  const sorted = [...policies].sort((a, b) => b.policyReviewDate.localeCompare(a.policyReviewDate));
  const latest = sorted[0];

  const policyCurrent = latest.policyCurrent;
  const griefAwarenessIncluded = latest.griefAwarenessIncluded;
  const memoryWorkGuidance = latest.memoryWorkGuidance;
  const specialistReferralPathway = latest.specialistReferralPathway;
  const culturalConsiderations = latest.culturalConsiderations;
  const peerSupportFramework = latest.peerSupportFramework;
  const staffSupportIncluded = latest.staffSupportIncluded;

  // Boolean scoring per field (total = 25)
  let score = 0;
  if (policyCurrent) score += 5;
  if (griefAwarenessIncluded) score += 4;
  if (memoryWorkGuidance) score += 4;
  if (specialistReferralPathway) score += 4;
  if (culturalConsiderations) score += 3;
  if (peerSupportFramework) score += 3;
  if (staffSupportIncluded) score += 2;

  const overallScore = Math.min(score, 25);

  return {
    totalPolicies: policies.length,
    policyCurrent,
    griefAwarenessIncluded,
    memoryWorkGuidance,
    specialistReferralPathway,
    culturalConsiderations,
    peerSupportFramework,
    staffSupportIncluded,
    overallScore,
  };
}

// ── Evaluator 4: Staff Bereavement Readiness (0-25) ─────────────────────────

export function evaluateStaffBereavementReadiness(training: StaffBereavementTraining[]): StaffBereavementReadinessResult {
  if (training.length === 0) {
    return {
      totalStaff: 0,
      griefAwarenessRate: 0,
      therapeuticResponseRate: 0,
      memoryWorkSkillsRate: 0,
      culturalSensitivityRate: 0,
      childDevelopmentGriefRate: 0,
      referralPathwaysRate: 0,
      overallScore: 0,
    };
  }

  const total = training.length;
  const griefAwarenessRate = pct(training.filter(t => t.griefAwareness).length, total);
  const therapeuticResponseRate = pct(training.filter(t => t.therapeuticResponse).length, total);
  const memoryWorkSkillsRate = pct(training.filter(t => t.memoryWorkSkills).length, total);
  const culturalSensitivityRate = pct(training.filter(t => t.culturalSensitivity).length, total);
  const childDevelopmentGriefRate = pct(training.filter(t => t.childDevelopmentGrief).length, total);
  const referralPathwaysRate = pct(training.filter(t => t.referralPathways).length, total);

  // Rate-based scoring per field (total = 25)
  // griefAwareness=6, therapeuticResponse=5, memoryWorkSkills=4,
  // culturalSensitivity=4, childDevelopmentGrief=3, referralPathways=3
  const griefScore = Math.min(Math.round((griefAwarenessRate / 100) * 6), 6);
  const therapyScore = Math.min(Math.round((therapeuticResponseRate / 100) * 5), 5);
  const memoryScore = Math.min(Math.round((memoryWorkSkillsRate / 100) * 4), 4);
  const culturalScore = Math.min(Math.round((culturalSensitivityRate / 100) * 4), 4);
  const devScore = Math.min(Math.round((childDevelopmentGriefRate / 100) * 3), 3);
  const referralScore = Math.min(Math.round((referralPathwaysRate / 100) * 3), 3);

  const overallScore = Math.min(griefScore + therapyScore + memoryScore + culturalScore + devScore + referralScore, 25);

  return {
    totalStaff: total,
    griefAwarenessRate,
    therapeuticResponseRate,
    memoryWorkSkillsRate,
    culturalSensitivityRate,
    childDevelopmentGriefRate,
    referralPathwaysRate,
    overallScore,
  };
}

// ── Child Grief Profiles ────────────────────────────────────────────────────

export function buildChildGriefProfiles(
  events: LossEvent[],
  interventions: SupportIntervention[],
): ChildGriefProfile[] {
  const childIds = new Set<string>();
  for (const e of events) childIds.add(e.childId);
  for (const i of interventions) childIds.add(i.childId);

  if (childIds.size === 0) return [];

  return Array.from(childIds).map(childId => {
    const childEvents = events.filter(e => e.childId === childId);
    const childInterventions = interventions.filter(i => i.childId === childId);
    const childName = childEvents[0]?.childName || childInterventions[0]?.childName || childId;

    const totalLossEvents = childEvents.length;
    const lossTypes = [...new Set(childEvents.map(e => e.lossType))];
    const impactAssessed = totalLossEvents > 0 && childEvents.every(e => e.impactAssessed);
    const supportPlanInPlace = totalLossEvents > 0 && childEvents.every(e => e.supportPlanCreated);

    const totalInterventions = childInterventions.length;
    const engagedCount = childInterventions.filter(i => i.childEngaged).length;
    const engagementRate = pct(engagedCount, totalInterventions);
    const positiveCount = childInterventions.filter(i => i.outcome === "positive" || i.outcome === "partially_positive").length;
    const positiveOutcomeRate = pct(positiveCount, totalInterventions);

    // Overall score 0-10
    let score = 0;
    if (totalLossEvents === 0) {
      // No loss events — no grief profile needed, score 10 (no concern)
      score = 10;
    } else {
      // Impact assessed (0-2)
      if (impactAssessed) score += 2;
      // Support plan in place (0-2)
      if (supportPlanInPlace) score += 2;
      // Engagement rate (0-3)
      score += Math.min(Math.round((engagementRate / 100) * 3), 3);
      // Positive outcome rate (0-3)
      score += Math.min(Math.round((positiveOutcomeRate / 100) * 3), 3);
    }

    const overallScore = Math.min(score, 10);

    // Risk and protective factors
    const riskFactors: string[] = [];
    const protectiveFactors: string[] = [];

    if (totalLossEvents > 0 && !impactAssessed) riskFactors.push("Impact of loss not fully assessed");
    if (totalLossEvents > 0 && !supportPlanInPlace) riskFactors.push("Support plan not in place for all loss events");
    if (totalLossEvents > 1) riskFactors.push("Multiple loss events — cumulative grief risk");
    if (totalInterventions === 0 && totalLossEvents > 0) riskFactors.push("No support interventions recorded despite loss events");
    if (engagementRate < 50 && totalInterventions > 0) riskFactors.push("Low engagement with support interventions");
    if (lossTypes.includes("bereavement")) riskFactors.push("Bereavement experienced — ongoing monitoring needed");

    if (impactAssessed && totalLossEvents > 0) protectiveFactors.push("Impact of loss has been assessed");
    if (supportPlanInPlace && totalLossEvents > 0) protectiveFactors.push("Support plan in place for all loss events");
    if (engagementRate >= 80 && totalInterventions > 0) protectiveFactors.push("High engagement with support interventions");
    if (positiveOutcomeRate >= 80 && totalInterventions > 0) protectiveFactors.push("Positive outcomes from support interventions");
    if (totalInterventions >= 3) protectiveFactors.push("Multiple support interventions delivered");
    if (lossTypes.length > 0 && childInterventions.some(i => i.supportType === "memory_work")) {
      protectiveFactors.push("Memory work undertaken to process loss");
    }

    return {
      childId,
      childName,
      totalLossEvents,
      lossTypes,
      impactAssessed,
      supportPlanInPlace,
      totalInterventions,
      engagementRate,
      positiveOutcomeRate,
      overallScore,
      riskFactors,
      protectiveFactors,
    };
  });
}

// ── Main Orchestrator ───────────────────────────────────────────────────────

export function generateBereavementLossSupportIntelligence(
  events: LossEvent[],
  interventions: SupportIntervention[],
  policies: BereavementPolicy[],
  training: StaffBereavementTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): BereavementLossSupportIntelligence {
  const lossResponse = evaluateLossResponse(events);
  const supportQuality = evaluateSupportQuality(interventions);
  const bereavementPolicy = evaluateBereavementPolicy(policies);
  const staffReadiness = evaluateStaffBereavementReadiness(training);
  const childProfiles = buildChildGriefProfiles(events, interventions);

  // Sum 4 evaluators (each 0-25, total 0-100)
  const rawScore = lossResponse.overallScore + supportQuality.overallScore + bereavementPolicy.overallScore + staffReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  // Strengths
  const strengths: string[] = [];
  if (lossResponse.overallScore >= 20) strengths.push("Strong response to loss events with thorough impact assessments and support planning");
  if (lossResponse.totalEvents === 0) strengths.push("No loss events recorded in the period — proactive readiness should be maintained");
  if (supportQuality.childEngagedRate >= 80) strengths.push("High child engagement with support interventions demonstrates child-centred grief practice");
  if (supportQuality.positiveOutcomeRate >= 80) strengths.push("Consistently positive outcomes from bereavement and loss support interventions");
  if (supportQuality.supportTypeVariety >= 4) strengths.push("Diverse range of support types offered including therapeutic, memory work, and specialist input");
  if (bereavementPolicy.overallScore >= 20) strengths.push("Comprehensive bereavement and loss policy covering grief awareness, memory work, and specialist pathways");
  if (bereavementPolicy.policyCurrent) strengths.push("Bereavement and loss policy is current and recently reviewed");
  if (staffReadiness.griefAwarenessRate >= 80) strengths.push("Majority of staff have grief awareness training, supporting consistent responses to loss");
  if (staffReadiness.overallScore >= 20) strengths.push("Strong staff readiness across grief awareness, therapeutic response, and cultural sensitivity");
  if (supportQuality.followUpCompletedRate >= 80) strengths.push("Follow-up support is consistently completed after initial interventions");

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (lossResponse.impactAssessedRate < 100 && lossResponse.totalEvents > 0) areasForImprovement.push("Not all loss events have been impact-assessed — gaps in understanding children's grief responses");
  if (lossResponse.supportPlanCreatedRate < 100 && lossResponse.totalEvents > 0) areasForImprovement.push("Support plans not created for all loss events — each loss should have a tailored support plan");
  if (lossResponse.supportPlanReviewedRate < 80 && lossResponse.totalEvents > 0) areasForImprovement.push("Support plans not consistently reviewed — regular review ensures plans remain effective");
  if (supportQuality.childEngagedRate < 60 && supportQuality.totalInterventions > 0) areasForImprovement.push("Child engagement with support interventions is low — consider alternative approaches");
  if (supportQuality.supportTypeVariety < 3 && supportQuality.totalInterventions > 0) areasForImprovement.push("Limited variety in support types — children benefit from a range of grief support approaches");
  if (!bereavementPolicy.policyCurrent) areasForImprovement.push("Bereavement and loss policy is not current — review and update required");
  if (!bereavementPolicy.memoryWorkGuidance) areasForImprovement.push("Policy lacks memory work guidance — memory work is vital for children processing loss");
  if (!bereavementPolicy.culturalConsiderations) areasForImprovement.push("Policy does not address cultural considerations in grief and bereavement");
  if (staffReadiness.griefAwarenessRate < 80) areasForImprovement.push("Grief awareness training coverage is insufficient — all staff need foundational grief knowledge");
  if (staffReadiness.therapeuticResponseRate < 60) areasForImprovement.push("Therapeutic response training is low — staff need skills to support children through grief");
  if (staffReadiness.culturalSensitivityRate < 60) areasForImprovement.push("Cultural sensitivity training for grief is lacking — grief responses vary across cultures");
  if (supportQuality.followUpCompletedRate < 60 && supportQuality.totalInterventions > 0) areasForImprovement.push("Follow-up after interventions is inconsistent — risk of children falling through gaps in support");

  // Actions
  const actions: string[] = [];
  if (lossResponse.impactAssessedRate < 100 && lossResponse.totalEvents > 0) actions.push("Complete impact assessments for all outstanding loss events within 10 working days");
  if (lossResponse.supportPlanCreatedRate < 100 && lossResponse.totalEvents > 0) actions.push("Create tailored support plans for all children with loss events lacking a plan");
  if (!bereavementPolicy.policyCurrent) actions.push("Review and update the bereavement and loss policy to ensure it reflects current best practice");
  if (!bereavementPolicy.specialistReferralPathway) actions.push("Establish clear specialist referral pathways within the bereavement policy");
  if (!bereavementPolicy.memoryWorkGuidance) actions.push("Add memory work guidance to the bereavement policy to support life story and remembrance activities");
  if (staffReadiness.griefAwarenessRate < 100) actions.push("Schedule grief awareness training for all staff who have not yet completed it");
  if (staffReadiness.therapeuticResponseRate < 80) actions.push("Provide therapeutic response training to increase staff confidence in supporting grieving children");
  if (staffReadiness.culturalSensitivityRate < 80) actions.push("Deliver cultural sensitivity training in relation to grief, loss, and bereavement practices");
  if (supportQuality.childEngagedRate < 60 && supportQuality.totalInterventions > 0) actions.push("Review engagement approach for children not engaging with support — explore creative and non-verbal methods");
  if (supportQuality.followUpCompletedRate < 80 && supportQuality.totalInterventions > 0) actions.push("Implement a follow-up tracking system to ensure all scheduled follow-ups are completed");

  const regulatoryLinks = [
    "CHR 2015 Reg 10 — Duty to promote contact between child and family, supporting children through separation",
    "CHR 2015 Reg 14 — Care of young person including emotional wellbeing and response to significant life events",
    "SCCIF — Experiences and progress of children including how the home supports children through loss and bereavement",
    "Working Together 2023 — Multi-agency response to children's emotional needs including grief and loss",
    "UNCRC Article 39 — Right to recovery and reintegration for children who have suffered neglect, exploitation, or trauma",
    "NICE CG16 — Self-harm guidelines including recognition of grief and loss as risk factors",
    "Children Act 1989 — Welfare of the child including emotional needs and the impact of separation and loss",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    lossResponse,
    supportQuality,
    bereavementPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

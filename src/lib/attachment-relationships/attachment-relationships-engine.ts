// ══════════════════════════════════════════════════════════════════════════════
// Cara — Attachment & Relationships Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Maps to: CHR 2015 Reg 6 (quality of care standard), Reg 11 (positive
// relationships), Reg 14 (care of young person), SCCIF experiences & progress,
// NICE CG26 (PTSD / attachment), Working Together 2023 (relational practice)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type AttachmentStyle =
  | "secure"
  | "anxious_ambivalent"
  | "anxious_avoidant"
  | "disorganised"
  | "not_assessed";

export type RelationshipType =
  | "key_worker"
  | "secondary_key_worker"
  | "staff_member"
  | "peer"
  | "family"
  | "professional"
  | "mentor"
  | "community";

export type RelationshipQuality =
  | "strong"
  | "developing"
  | "inconsistent"
  | "strained"
  | "broken"
  | "new";

export type RelationshipTrend =
  | "strengthening"
  | "stable"
  | "weakening"
  | "fluctuating";

export type InteractionContext =
  | "daily_living"
  | "key_work_session"
  | "activity"
  | "crisis_support"
  | "meal_time"
  | "bedtime_routine"
  | "community_outing"
  | "education_support"
  | "family_contact"
  | "transition_support";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface AttachmentAssessment {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessor: string;
  assessorRole: "psychologist" | "therapist" | "social_worker" | "key_worker" | "registered_manager";
  attachmentStyle: AttachmentStyle;
  previousStyle?: AttachmentStyle;
  strengthAreas: string[];
  vulnerabilityAreas: string[];
  therapeuticRecommendations: string[];
  informedCareApproach: boolean;
  sharedWithTeam: boolean;
  reviewDate: string;
}

export interface RelationshipRecord {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  personId: string;
  personName: string;
  relationshipType: RelationshipType;
  quality: RelationshipQuality;
  trend: RelationshipTrend;
  startDate: string;
  lastReviewDate: string;
  trustScore: number; // 1-10
  consistencyScore: number; // 1-10
  childRating?: number; // 1-10 child's own rating of relationship
  notes: string;
}

export interface RelationshipInteraction {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  staffId: string;
  staffName: string;
  date: string;
  context: InteractionContext;
  durationMins: number;
  qualityRating: number; // 1-10
  childInitiated: boolean;
  positiveIndicators: string[];
  concernIndicators: string[];
  attachmentRelevant: boolean;
  regulationSupport: boolean;
}

export interface StabilityIndicator {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  date: string;
  keyWorkerConsistency: boolean; // same key worker for 3+ months
  staffTeamStability: boolean; // less than 30% team change in period
  routineConsistency: number; // 1-10
  placementSecurityScore: number; // 1-10
  belongingScore: number; // 1-10
  childFeelsSafe: boolean;
  childFeelsValued: boolean;
  significantChanges: string[];
}

export interface PeerRelationship {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  peerId: string;
  peerName: string;
  quality: RelationshipQuality;
  trend: RelationshipTrend;
  positiveInteractions: number; // count in period
  negativeInteractions: number;
  conflictsResolved: number;
  conflictsUnresolved: number;
  sharedActivities: string[];
  staffMediationNeeded: boolean;
}

// ── Result Types ─────────────────────────────────────────────────────────────

export interface AttachmentAssessmentResult {
  totalAssessments: number;
  childrenAssessed: number;
  // fab-0: null when no children in the cohort (can't compute).
  assessmentCoverageRate: number | null;
  styleDistribution: Record<string, number>;
  // fab-0: null when no assessments exist to check currency.
  assessmentCurrency: number | null; // % current (within 6 months)
  informedCareRate: number;
  sharedWithTeamRate: number;
  childrenShowingProgress: number;
  overallScore: number;
}

export interface RelationshipQualityResult {
  totalRelationships: number;
  qualityDistribution: Record<string, number>;
  averageTrustScore: number;
  averageConsistencyScore: number;
  // fab-0: null when no relationships have a child rating.
  averageChildRating: number | null;
  strongRelationshipsRate: number;
  // fab-0: null when no key worker relationships exist.
  keyWorkerRelationshipQuality: number | null;
  trendDistribution: Record<string, number>;
  overallScore: number;
}

export interface InteractionQualityResult {
  totalInteractions: number;
  averageQuality: number;
  childInitiatedRate: number;
  contextDistribution: Record<string, number>;
  attachmentRelevantRate: number;
  regulationSupportRate: number;
  averageDuration: number;
  // fab-0: null when no children have interactions.
  interactionsPerChildPerWeek: number | null;
  overallScore: number;
}

export interface StabilityResult {
  indicatorsCollected: number;
  keyWorkerConsistencyRate: number;
  staffTeamStabilityRate: number;
  averageRoutineConsistency: number;
  averagePlacementSecurity: number;
  averageBelonging: number;
  childFeelsSafeRate: number;
  childFeelsValuedRate: number;
  overallScore: number;
}

export interface PeerRelationshipResult {
  totalPeerRelationships: number;
  qualityDistribution: Record<string, number>;
  averagePositiveInteractions: number;
  averageNegativeInteractions: number;
  conflictResolutionRate: number;
  mediationNeededRate: number;
  overallScore: number;
}

export interface ChildAttachmentProfile {
  childId: string;
  childName: string;
  attachmentStyle: AttachmentStyle;
  assessmentCurrent: boolean;
  keyWorkerQuality: RelationshipQuality | "none";
  totalRelationships: number;
  strongRelationships: number;
  // fab-0: null when the child has no relationships/interactions/peers.
  averageTrustScore: number | null;
  interactionQuality: number | null;
  stabilityScore: number;
  belongingScore: number;
  peerRelationshipQuality: number | null;
  overallWellbeing: number | null;
  riskFactors: string[];
  protectiveFactors: string[];
}

export interface AttachmentRelationshipsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  attachmentAssessments: AttachmentAssessmentResult;
  relationshipQuality: RelationshipQualityResult;
  interactionQuality: InteractionQualityResult;
  stability: StabilityResult;
  peerRelationships: PeerRelationshipResult;
  childProfiles: ChildAttachmentProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const ASSESSMENT_CURRENCY_MONTHS = 6;

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateAttachmentAssessments(
  assessments: AttachmentAssessment[],
  childIds: string[],
  referenceDate: string,
): AttachmentAssessmentResult {
  if (assessments.length === 0) {
    return {
      totalAssessments: 0, childrenAssessed: 0, assessmentCoverageRate: null,
      styleDistribution: {}, assessmentCurrency: null, informedCareRate: 0,
      sharedWithTeamRate: 0, childrenShowingProgress: 0, overallScore: 0,
    };
  }

  const refDate = new Date(referenceDate);
  const totalAssessments = assessments.length;
  const childrenAssessed = new Set(assessments.map(a => a.childId)).size;
  const assessmentCoverageRate: number | null = childIds.length > 0
    ? Math.round((childrenAssessed / childIds.length) * 1000) / 10
    : null;

  // Style distribution
  const styleDistribution: Record<string, number> = {};
  for (const a of assessments) {
    styleDistribution[a.attachmentStyle] = (styleDistribution[a.attachmentStyle] || 0) + 1;
  }

  // Currency: latest assessment per child within 6 months
  const latestByChild = new Map<string, AttachmentAssessment>();
  for (const a of assessments) {
    const existing = latestByChild.get(a.childId);
    if (!existing || a.assessmentDate > existing.assessmentDate) {
      latestByChild.set(a.childId, a);
    }
  }

  let currentCount = 0;
  for (const [, a] of latestByChild) {
    const assessDate = new Date(a.assessmentDate);
    const monthsDiff = (refDate.getFullYear() - assessDate.getFullYear()) * 12 +
      (refDate.getMonth() - assessDate.getMonth());
    if (monthsDiff <= ASSESSMENT_CURRENCY_MONTHS) currentCount++;
  }
  const assessmentCurrency: number | null = latestByChild.size > 0
    ? Math.round((currentCount / latestByChild.size) * 1000) / 10
    : null;

  // Informed care and shared with team
  const informedCareRate = Math.round((assessments.filter(a => a.informedCareApproach).length / totalAssessments) * 1000) / 10;
  const sharedWithTeamRate = Math.round((assessments.filter(a => a.sharedWithTeam).length / totalAssessments) * 1000) / 10;

  // Progress: children whose latest assessment has a previousStyle and current is "better"
  const styleRank: Record<string, number> = {
    disorganised: 0, anxious_avoidant: 1, anxious_ambivalent: 2, secure: 3, not_assessed: -1,
  };

  let childrenShowingProgress = 0;
  for (const [, a] of latestByChild) {
    if (a.previousStyle && styleRank[a.attachmentStyle] > styleRank[a.previousStyle]) {
      childrenShowingProgress++;
    }
  }

  // Scoring: coverage(30) + currency(25) + informed care(20) + shared(15) + progress(10) = 100
  const coverageScore = Math.min(assessmentCoverageRate ?? 0, 100) * 0.3;
  const currencyScore = Math.min(assessmentCurrency ?? 0, 100) * 0.25;
  const informedScore = Math.min(informedCareRate, 100) * 0.2;
  const sharedScore = Math.min(sharedWithTeamRate, 100) * 0.15;
  // latestByChild.size is guaranteed > 0 here (we returned early when assessments.length === 0).
  const progressScore = Math.min((childrenShowingProgress / Math.max(latestByChild.size, 1)) * 100, 100) * 0.1;

  const overallScore = Math.round(coverageScore + currencyScore + informedScore + sharedScore + progressScore);

  return {
    totalAssessments, childrenAssessed, assessmentCoverageRate,
    styleDistribution, assessmentCurrency, informedCareRate,
    sharedWithTeamRate, childrenShowingProgress, overallScore,
  };
}

export function evaluateRelationshipQuality(
  relationships: RelationshipRecord[],
  _childIds: string[],
): RelationshipQualityResult {
  if (relationships.length === 0) {
    return {
      totalRelationships: 0, qualityDistribution: {}, averageTrustScore: 0,
      averageConsistencyScore: 0, averageChildRating: null, strongRelationshipsRate: 0,
      keyWorkerRelationshipQuality: null, trendDistribution: {}, overallScore: 0,
    };
  }

  const totalRelationships = relationships.length;

  // Quality distribution
  const qualityDistribution: Record<string, number> = {};
  for (const r of relationships) {
    qualityDistribution[r.quality] = (qualityDistribution[r.quality] || 0) + 1;
  }

  // Average scores
  const averageTrustScore = Math.round((relationships.reduce((s, r) => s + r.trustScore, 0) / totalRelationships) * 10) / 10;
  const averageConsistencyScore = Math.round((relationships.reduce((s, r) => s + r.consistencyScore, 0) / totalRelationships) * 10) / 10;

  const withChildRating = relationships.filter(r => r.childRating !== undefined);
  const averageChildRating: number | null = withChildRating.length > 0
    ? Math.round((withChildRating.reduce((s, r) => s + r.childRating!, 0) / withChildRating.length) * 10) / 10
    : null;

  // Strong relationships rate
  const strongCount = relationships.filter(r => r.quality === "strong").length;
  const strongRelationshipsRate = Math.round((strongCount / totalRelationships) * 1000) / 10;

  // Key worker relationship quality (average trust + consistency for key worker relationships)
  const keyWorkerRels = relationships.filter(r => r.relationshipType === "key_worker");
  const keyWorkerRelationshipQuality: number | null = keyWorkerRels.length > 0
    ? Math.round(((keyWorkerRels.reduce((s, r) => s + r.trustScore + r.consistencyScore, 0) / (keyWorkerRels.length * 2))) * 10) / 10
    : null;

  // Trend distribution
  const trendDistribution: Record<string, number> = {};
  for (const r of relationships) {
    trendDistribution[r.trend] = (trendDistribution[r.trend] || 0) + 1;
  }

  // Scoring: trust(25) + consistency(20) + child rating(20) + strong rate(20) + key worker(15) = 100
  const trustScore = (averageTrustScore / 10) * 25;
  const consistencyScoreVal = (averageConsistencyScore / 10) * 20;
  const childRatingScore = averageChildRating !== null ? (averageChildRating / 10) * 20 : 10; // default mid if no child ratings
  const strongRateScore = Math.min(strongRelationshipsRate, 100) * 0.2;
  const keyWorkerScore = keyWorkerRelationshipQuality !== null ? (keyWorkerRelationshipQuality / 10) * 15 : 0;

  const overallScore = Math.round(trustScore + consistencyScoreVal + childRatingScore + strongRateScore + keyWorkerScore);

  return {
    totalRelationships, qualityDistribution, averageTrustScore,
    averageConsistencyScore, averageChildRating, strongRelationshipsRate,
    keyWorkerRelationshipQuality, trendDistribution, overallScore,
  };
}

export function evaluateInteractionQuality(
  interactions: RelationshipInteraction[],
  _childIds: string[],
  periodStart: string,
  periodEnd: string,
): InteractionQualityResult {
  if (interactions.length === 0) {
    return {
      totalInteractions: 0, averageQuality: 0, childInitiatedRate: 0,
      contextDistribution: {}, attachmentRelevantRate: 0, regulationSupportRate: 0,
      averageDuration: 0, interactionsPerChildPerWeek: null, overallScore: 0,
    };
  }

  const totalInteractions = interactions.length;
  const averageQuality = Math.round((interactions.reduce((s, i) => s + i.qualityRating, 0) / totalInteractions) * 10) / 10;
  const childInitiatedRate = Math.round((interactions.filter(i => i.childInitiated).length / totalInteractions) * 1000) / 10;

  // Context distribution
  const contextDistribution: Record<string, number> = {};
  for (const i of interactions) {
    contextDistribution[i.context] = (contextDistribution[i.context] || 0) + 1;
  }

  const attachmentRelevantRate = Math.round((interactions.filter(i => i.attachmentRelevant).length / totalInteractions) * 1000) / 10;
  const regulationSupportRate = Math.round((interactions.filter(i => i.regulationSupport).length / totalInteractions) * 1000) / 10;
  const averageDuration = Math.round(interactions.reduce((s, i) => s + i.durationMins, 0) / totalInteractions);

  // Interactions per child per week
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const weeksDiff = Math.max(1, (end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const childrenWithInteractions = new Set(interactions.map(i => i.childId)).size;
  const interactionsPerChildPerWeek: number | null = childrenWithInteractions > 0
    ? Math.round((totalInteractions / childrenWithInteractions / weeksDiff) * 10) / 10
    : null;

  // Scoring: quality(30) + frequency(25) + child-initiated(20) + attachment-relevant(15) + regulation(10)
  const qualityScore = (averageQuality / 10) * 30;
  const frequencyScore = Math.min((interactionsPerChildPerWeek ?? 0) / 5, 1) * 25; // 5+ per week = full marks
  const childInitScore = Math.min(childInitiatedRate, 100) * 0.2;
  const attachScore = Math.min(attachmentRelevantRate, 100) * 0.15;
  const regScore = Math.min(regulationSupportRate, 100) * 0.1;

  const overallScore = Math.round(qualityScore + frequencyScore + childInitScore + attachScore + regScore);

  return {
    totalInteractions, averageQuality, childInitiatedRate,
    contextDistribution, attachmentRelevantRate, regulationSupportRate,
    averageDuration, interactionsPerChildPerWeek, overallScore,
  };
}

export function evaluateStability(
  indicators: StabilityIndicator[],
  _childIds: string[],
): StabilityResult {
  if (indicators.length === 0) {
    return {
      indicatorsCollected: 0, keyWorkerConsistencyRate: 0, staffTeamStabilityRate: 0,
      averageRoutineConsistency: 0, averagePlacementSecurity: 0, averageBelonging: 0,
      childFeelsSafeRate: 0, childFeelsValuedRate: 0, overallScore: 0,
    };
  }

  const indicatorsCollected = indicators.length;
  const keyWorkerConsistencyRate = Math.round((indicators.filter(i => i.keyWorkerConsistency).length / indicatorsCollected) * 1000) / 10;
  const staffTeamStabilityRate = Math.round((indicators.filter(i => i.staffTeamStability).length / indicatorsCollected) * 1000) / 10;

  const averageRoutineConsistency = Math.round((indicators.reduce((s, i) => s + i.routineConsistency, 0) / indicatorsCollected) * 10) / 10;
  const averagePlacementSecurity = Math.round((indicators.reduce((s, i) => s + i.placementSecurityScore, 0) / indicatorsCollected) * 10) / 10;
  const averageBelonging = Math.round((indicators.reduce((s, i) => s + i.belongingScore, 0) / indicatorsCollected) * 10) / 10;

  const childFeelsSafeRate = Math.round((indicators.filter(i => i.childFeelsSafe).length / indicatorsCollected) * 1000) / 10;
  const childFeelsValuedRate = Math.round((indicators.filter(i => i.childFeelsValued).length / indicatorsCollected) * 1000) / 10;

  // Scoring: safety(25) + belonging(20) + key worker consistency(20) + routine(15) + team stability(10) + valued(10)
  const safeScore = Math.min(childFeelsSafeRate, 100) * 0.25;
  const belongScore = (averageBelonging / 10) * 20;
  const kwScore = Math.min(keyWorkerConsistencyRate, 100) * 0.2;
  const routineScore = (averageRoutineConsistency / 10) * 15;
  const teamScore = Math.min(staffTeamStabilityRate, 100) * 0.1;
  const valuedScore = Math.min(childFeelsValuedRate, 100) * 0.1;

  const overallScore = Math.round(safeScore + belongScore + kwScore + routineScore + teamScore + valuedScore);

  return {
    indicatorsCollected, keyWorkerConsistencyRate, staffTeamStabilityRate,
    averageRoutineConsistency, averagePlacementSecurity, averageBelonging,
    childFeelsSafeRate, childFeelsValuedRate, overallScore,
  };
}

export function evaluatePeerRelationships(
  peers: PeerRelationship[],
): PeerRelationshipResult {
  if (peers.length === 0) {
    return {
      totalPeerRelationships: 0, qualityDistribution: {}, averagePositiveInteractions: 0,
      averageNegativeInteractions: 0, conflictResolutionRate: 0, mediationNeededRate: 0,
      overallScore: 0,
    };
  }

  const totalPeerRelationships = peers.length;

  const qualityDistribution: Record<string, number> = {};
  for (const p of peers) {
    qualityDistribution[p.quality] = (qualityDistribution[p.quality] || 0) + 1;
  }

  const averagePositiveInteractions = Math.round((peers.reduce((s, p) => s + p.positiveInteractions, 0) / totalPeerRelationships) * 10) / 10;
  const averageNegativeInteractions = Math.round((peers.reduce((s, p) => s + p.negativeInteractions, 0) / totalPeerRelationships) * 10) / 10;

  // Conflict resolution
  const totalConflicts = peers.reduce((s, p) => s + p.conflictsResolved + p.conflictsUnresolved, 0);
  const totalResolved = peers.reduce((s, p) => s + p.conflictsResolved, 0);
  const conflictResolutionRate = totalConflicts > 0
    ? Math.round((totalResolved / totalConflicts) * 1000) / 10
    : 100; // no conflicts = perfect

  const mediationNeededRate = Math.round((peers.filter(p => p.staffMediationNeeded).length / totalPeerRelationships) * 1000) / 10;

  // Scoring: quality(35) + positive ratio(25) + conflict resolution(25) + low mediation(15)
  const qualityRank: Record<string, number> = { strong: 4, developing: 3, new: 2.5, inconsistent: 2, strained: 1, broken: 0 };
  const avgQuality = peers.reduce((s, p) => s + (qualityRank[p.quality] || 0), 0) / totalPeerRelationships;
  const qualityScore = (avgQuality / 4) * 35;

  // Positive ratio: positive / (positive + negative)
  const totalPos = peers.reduce((s, p) => s + p.positiveInteractions, 0);
  const totalNeg = peers.reduce((s, p) => s + p.negativeInteractions, 0);
  const positiveRatio = (totalPos + totalNeg) > 0 ? totalPos / (totalPos + totalNeg) : 0.5;
  const ratioScore = positiveRatio * 25;

  const resolutionScore = Math.min(conflictResolutionRate, 100) * 0.25;

  // Low mediation is positive (less mediation = more independence)
  const lowMediationScore = (1 - Math.min(mediationNeededRate, 100) / 100) * 15;

  const overallScore = Math.round(qualityScore + ratioScore + resolutionScore + lowMediationScore);

  return {
    totalPeerRelationships, qualityDistribution, averagePositiveInteractions,
    averageNegativeInteractions, conflictResolutionRate, mediationNeededRate,
    overallScore,
  };
}

export function buildChildAttachmentProfiles(
  assessments: AttachmentAssessment[],
  relationships: RelationshipRecord[],
  interactions: RelationshipInteraction[],
  stability: StabilityIndicator[],
  peers: PeerRelationship[],
  childIds: string[],
  referenceDate: string,
): ChildAttachmentProfile[] {
  const refDate = new Date(referenceDate);

  return childIds.map(childId => {
    // Attachment
    const childAssessments = assessments.filter(a => a.childId === childId);
    const latest = childAssessments.sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate))[0];
    const attachmentStyle: AttachmentStyle = latest?.attachmentStyle || "not_assessed";
    const assessmentCurrent = latest
      ? ((refDate.getFullYear() - new Date(latest.assessmentDate).getFullYear()) * 12 +
         (refDate.getMonth() - new Date(latest.assessmentDate).getMonth())) <= ASSESSMENT_CURRENCY_MONTHS
      : false;

    // Relationships
    const childRels = relationships.filter(r => r.childId === childId);
    const keyWorkerRel = childRels.find(r => r.relationshipType === "key_worker");
    const keyWorkerQuality: RelationshipQuality | "none" = keyWorkerRel?.quality || "none";
    const strongRelationships = childRels.filter(r => r.quality === "strong").length;
    const avgTrust: number | null = childRels.length > 0
      ? Math.round((childRels.reduce((s, r) => s + r.trustScore, 0) / childRels.length) * 10) / 10
      : null;

    // Interactions
    const childInteractions = interactions.filter(i => i.childId === childId);
    const interactionQuality: number | null = childInteractions.length > 0
      ? Math.round((childInteractions.reduce((s, i) => s + i.qualityRating, 0) / childInteractions.length) * 10) / 10
      : null;

    // Stability
    const childStability = stability.filter(s => s.childId === childId);
    const latestStability = childStability.sort((a, b) => b.date.localeCompare(a.date))[0];
    const stabilityScore = latestStability
      ? Math.round(((latestStability.routineConsistency + latestStability.placementSecurityScore) / 2) * 10) / 10
      : 0;
    const belongingScore = latestStability?.belongingScore || 0;

    // Peer relationships
    const childPeers = peers.filter(p => p.childId === childId);
    const peerQualityRank: Record<string, number> = { strong: 10, developing: 7, new: 5, inconsistent: 4, strained: 2, broken: 0 };
    const peerRelationshipQuality: number | null = childPeers.length > 0
      ? Math.round((childPeers.reduce((s, p) => s + (peerQualityRank[p.quality] || 0), 0) / childPeers.length) * 10) / 10
      : null;

    // Overall wellbeing: average of available scores (out of 10)
    const scores = [avgTrust, interactionQuality, stabilityScore, belongingScore, peerRelationshipQuality]
      .filter((s): s is number => s !== null && s > 0);
    const overallWellbeing: number | null = scores.length > 0
      ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
      : null;

    // Risk and protective factors
    const riskFactors: string[] = [];
    const protectiveFactors: string[] = [];

    if (attachmentStyle === "disorganised") riskFactors.push("Disorganised attachment style identified");
    if (attachmentStyle === "anxious_avoidant" || attachmentStyle === "anxious_ambivalent") riskFactors.push("Insecure attachment style identified");
    if (!assessmentCurrent) riskFactors.push("Attachment assessment not current");
    if (keyWorkerQuality === "none") riskFactors.push("No key worker relationship established");
    if (keyWorkerQuality === "strained" || keyWorkerQuality === "broken") riskFactors.push("Key worker relationship under strain");
    if (latestStability && !latestStability.childFeelsSafe) riskFactors.push("Child does not feel safe");
    if (latestStability && !latestStability.childFeelsValued) riskFactors.push("Child does not feel valued");
    if (childPeers.some(p => p.quality === "broken" || p.quality === "strained")) riskFactors.push("Strained peer relationships present");

    if (attachmentStyle === "secure") protectiveFactors.push("Secure attachment style");
    if (keyWorkerQuality === "strong") protectiveFactors.push("Strong key worker relationship");
    if (strongRelationships >= 2) protectiveFactors.push(`${strongRelationships} strong relationships identified`);
    if (latestStability?.childFeelsSafe && latestStability?.childFeelsValued) protectiveFactors.push("Child feels safe and valued");
    if (belongingScore >= 8) protectiveFactors.push("Strong sense of belonging");
    if (childPeers.length > 0 && childPeers.every(p => p.quality === "strong" || p.quality === "developing")) {
      protectiveFactors.push("All peer relationships positive");
    }

    const childName = latest?.childName
      || childRels[0]?.childName
      || childInteractions[0]?.childName
      || childStability[0]?.childName
      || childPeers[0]?.childName
      || childId;

    return {
      childId, childName, attachmentStyle, assessmentCurrent,
      keyWorkerQuality, totalRelationships: childRels.length,
      strongRelationships, averageTrustScore: avgTrust,
      interactionQuality, stabilityScore, belongingScore,
      peerRelationshipQuality, overallWellbeing,
      riskFactors, protectiveFactors,
    };
  });
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateAttachmentRelationshipsIntelligence(
  assessments: AttachmentAssessment[],
  relationships: RelationshipRecord[],
  interactions: RelationshipInteraction[],
  stabilityIndicators: StabilityIndicator[],
  peerRelationships: PeerRelationship[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): AttachmentRelationshipsIntelligence {
  const assessmentResult = evaluateAttachmentAssessments(assessments, childIds, referenceDate);
  const relationshipResult = evaluateRelationshipQuality(relationships, childIds);
  const interactionResult = evaluateInteractionQuality(interactions, childIds, periodStart, periodEnd);
  const stabilityResult = evaluateStability(stabilityIndicators, childIds);
  const peerResult = evaluatePeerRelationships(peerRelationships);
  const childProfiles = buildChildAttachmentProfiles(
    assessments, relationships, interactions, stabilityIndicators, peerRelationships,
    childIds, referenceDate,
  );

  // Weighted scoring: assessments(20) + relationships(25) + interactions(20) + stability(20) + peers(15)
  const overallScore = Math.round(
    assessmentResult.overallScore * 0.2 +
    relationshipResult.overallScore * 0.25 +
    interactionResult.overallScore * 0.2 +
    stabilityResult.overallScore * 0.2 +
    peerResult.overallScore * 0.15,
  );

  const rating = overallScore >= 80 ? "outstanding"
    : overallScore >= 60 ? "good"
    : overallScore >= 40 ? "requires_improvement"
    : "inadequate";

  // Strengths
  const strengths: string[] = [];
  if (assessmentResult.assessmentCoverageRate !== null && assessmentResult.assessmentCoverageRate >= 100) strengths.push("All children have current attachment assessments informing their care approach");
  if (relationshipResult.averageTrustScore >= 8) strengths.push("High trust scores across staff-child relationships demonstrate consistent relational practice");
  if (interactionResult.childInitiatedRate >= 50) strengths.push("Children frequently initiate positive interactions with staff, indicating strong relational security");
  if (stabilityResult.childFeelsSafeRate >= 100) strengths.push("All children report feeling safe — a fundamental indicator of attachment security");
  if (stabilityResult.averageBelonging >= 8) strengths.push("Strong sense of belonging across the home supports secure base development");
  if (peerResult.conflictResolutionRate >= 80) strengths.push("High conflict resolution rate demonstrates effective peer mediation and restorative approaches");
  if (relationshipResult.keyWorkerRelationshipQuality !== null && relationshipResult.keyWorkerRelationshipQuality >= 8) strengths.push("Key worker relationships are strong and consistent, providing secure base for each child");
  if (assessmentResult.childrenShowingProgress > 0) strengths.push("Evidence of positive shifts in attachment patterns shows therapeutic impact");

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (assessmentResult.assessmentCoverageRate !== null && assessmentResult.assessmentCoverageRate < 100) areasForImprovement.push("Not all children have attachment assessments — gaps in understanding needs");
  if (assessmentResult.assessmentCurrency !== null && assessmentResult.assessmentCurrency < 80) areasForImprovement.push("Some attachment assessments are not current — review schedule needs strengthening");
  if (relationshipResult.averageTrustScore < 6) areasForImprovement.push("Trust scores are below expected levels — focus on consistency and predictability");
  if (interactionResult.averageQuality < 6) areasForImprovement.push("Interaction quality ratings suggest need for relational practice training");
  if (stabilityResult.keyWorkerConsistencyRate < 80) areasForImprovement.push("Key worker consistency is low — changes in key worker impact attachment security");
  if (peerResult.mediationNeededRate > 50) areasForImprovement.push("High rate of staff mediation in peer relationships — support conflict resolution skill development");
  if (stabilityResult.childFeelsSafeRate < 100) areasForImprovement.push("Not all children feel safe — immediate action needed to understand and address concerns");
  if (assessmentResult.sharedWithTeamRate < 80) areasForImprovement.push("Attachment assessments not consistently shared with team — impacts care consistency");

  // Actions
  const actions: string[] = [];
  if (assessmentResult.assessmentCoverageRate !== null && assessmentResult.assessmentCoverageRate < 100) actions.push("Commission attachment assessments for all children without current assessment");
  if (assessmentResult.informedCareRate < 80) actions.push("Ensure every attachment assessment translates into personalised care strategies");
  if (relationshipResult.averageTrustScore < 7) actions.push("Implement relational practice training focused on building trust through predictability and attunement");
  if (interactionResult.interactionsPerChildPerWeek !== null && interactionResult.interactionsPerChildPerWeek < 3) actions.push("Increase planned quality interactions to minimum 3 per child per week");
  if (stabilityResult.keyWorkerConsistencyRate < 80) actions.push("Review staff allocation to ensure key worker consistency — avoid unnecessary changes");
  if (peerResult.conflictResolutionRate < 70) actions.push("Strengthen peer conflict resolution through restorative practice circles and social skills groups");

  const regulatoryLinks = [
    "CHR 2015 Reg 6 — Quality of care standard (meeting emotional needs, developing secure attachments)",
    "CHR 2015 Reg 11 — Positive relationships (warmth, understanding, consistency)",
    "CHR 2015 Reg 14 — Care of young person (responding sensitively to attachment needs)",
    "SCCIF — Experiences and progress of children (quality of relationships, sense of belonging)",
    "NICE CG26 — PTSD / attachment disorders (assessment and therapeutic intervention)",
    "Working Together 2023 — Relational practice and child-centred approaches",
    "UNCRC Article 20 — Right to special care when separated from family",
  ];

  return {
    homeId, periodStart, periodEnd, referenceDate,
    overallScore, rating,
    attachmentAssessments: assessmentResult,
    relationshipQuality: relationshipResult,
    interactionQuality: interactionResult,
    stability: stabilityResult,
    peerRelationships: peerResult,
    childProfiles,
    strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

// ── Label Functions ──────────────────────────────────────────────────────────

export function getAttachmentStyleLabel(style: AttachmentStyle): string {
  const labels: Record<AttachmentStyle, string> = {
    secure: "Secure",
    anxious_ambivalent: "Anxious-Ambivalent",
    anxious_avoidant: "Anxious-Avoidant",
    disorganised: "Disorganised",
    not_assessed: "Not Assessed",
  };
  return labels[style] || style;
}

export function getRelationshipTypeLabel(type: RelationshipType): string {
  const labels: Record<RelationshipType, string> = {
    key_worker: "Key Worker",
    secondary_key_worker: "Secondary Key Worker",
    staff_member: "Staff Member",
    peer: "Peer",
    family: "Family",
    professional: "Professional",
    mentor: "Mentor",
    community: "Community",
  };
  return labels[type] || type;
}

export function getRelationshipQualityLabel(quality: RelationshipQuality): string {
  const labels: Record<RelationshipQuality, string> = {
    strong: "Strong",
    developing: "Developing",
    inconsistent: "Inconsistent",
    strained: "Strained",
    broken: "Broken",
    new: "New",
  };
  return labels[quality] || quality;
}

export function getInteractionContextLabel(context: InteractionContext): string {
  const labels: Record<InteractionContext, string> = {
    daily_living: "Daily Living",
    key_work_session: "Key Work Session",
    activity: "Activity",
    crisis_support: "Crisis Support",
    meal_time: "Meal Time",
    bedtime_routine: "Bedtime Routine",
    community_outing: "Community Outing",
    education_support: "Education Support",
    family_contact: "Family Contact",
    transition_support: "Transition Support",
  };
  return labels[context] || context;
}

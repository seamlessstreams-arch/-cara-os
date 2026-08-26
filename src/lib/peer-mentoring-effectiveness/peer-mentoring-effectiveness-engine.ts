import { below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// PEER MENTORING EFFECTIVENESS INTELLIGENCE ENGINE
//
// Pure deterministic engine for assessing peer mentoring and buddy schemes
// within children's residential care. Covers pairing quality, session
// outcomes, relationship development, and safeguarding within peer
// relationships.
//
// Regulatory basis:
//   - CHR 2015, Reg 11 — The positive relationships standard
//   - CHR 2015, Reg 12 — The protection of children standard
//   - SCCIF — Overall experiences and progress of children
//   - NMS 3 — Engaging with the wider community / peer relationships
//   - UNCRC Article 15 — Freedom of association and peaceful assembly
//   - UNCRC Article 12 — Right to express views and be heard
//   - Peer Support Guidelines (DfE) — Best practice for peer mentoring
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type MentoringRole =
  | "mentor"
  | "mentee"
  | "peer_buddy"
  | "welcome_buddy";

export type SessionOutcome =
  | "positive"
  | "mixed"
  | "negative"
  | "cancelled";

export type PairingStatus =
  | "active"
  | "completed"
  | "paused"
  | "ended_early";

export type SafeguardingConcern =
  | "none"
  | "power_imbalance"
  | "bullying_risk"
  | "emotional_dependency"
  | "boundary_issue"
  | "exploitation_risk";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface PeerPairing {
  id: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  startDate: string;
  status: PairingStatus;
  consentObtained: boolean;
  riskAssessed: boolean;
  matchCriteria: string[];
  staffSupervisor: string;
}

export interface MentoringSession {
  id: string;
  pairingId: string;
  date: string;
  duration: number;
  facilitatedBy: string;
  outcome: SessionOutcome;
  mentorFeedback: string;
  menteeFeedback: string;
  goalsDiscussed: boolean;
  progressMade: boolean;
  staffObservation: string;
}

export interface RelationshipReview {
  id: string;
  pairingId: string;
  reviewDate: string;
  reviewedBy: string;
  relationshipHealthy: boolean;
  boundariesRespected: boolean;
  safeguardingConcern: SafeguardingConcern;
  actionTaken: string;
  mentorBenefiting: boolean;
  menteeBenefiting: boolean;
}

export interface StaffMentoringTraining {
  id: string;
  staffId: string;
  staffName: string;
  peerMentoringTrained: boolean;
  safeguardingInPeerRelationships: boolean;
  conflictResolution: boolean;
  boundarySetting: boolean;
  supportingYoungMentors: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface PairingQualityResult {
  overallScore: number;
  totalPairings: number;
  /** null when the population is empty — nothing measured, not 0%. */
  consentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  matchCriteriaDefinedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  activePairingRate: number | null;
}

export interface SessionEffectivenessResult {
  overallScore: number;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveOutcomeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  goalsDiscussedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  progressMadeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  regularSessionRate: number | null;
}

export interface RelationshipSafeguardingResult {
  overallScore: number;
  totalReviews: number;
  /** null when the population is empty — nothing measured, not 0%. */
  healthyRelationshipRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  boundariesRespectedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  noSafeguardingConcernRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  bothBenefitingRate: number | null;
}

export interface StaffSupportResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  peerMentoringTrainedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingInPeerRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  conflictResolutionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  boundarySettingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supportingMentorsRate: number | null;
}

export interface ChildMentoringProfile {
  childId: string;
  childName: string;
  roles: MentoringRole[];
  pairingsCount: number;
  sessionsInPeriod: number;
  positiveOutcomeRate: number;
  safeguardingConcerns: number;
  overallScore: number;
}

export interface PeerMentoringEffectivenessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  pairingQuality: PairingQualityResult;
  sessionEffectiveness: SessionEffectivenessResult;
  relationshipSafeguarding: RelationshipSafeguardingResult;
  staffSupport: StaffSupportResult;
  childProfiles: ChildMentoringProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Maps ---------------------------------------------------------------

const MENTORING_ROLE_LABELS: Record<MentoringRole, string> = {
  mentor: "Mentor",
  mentee: "Mentee",
  peer_buddy: "Peer Buddy",
  welcome_buddy: "Welcome Buddy",
};

const SESSION_OUTCOME_LABELS: Record<SessionOutcome, string> = {
  positive: "Positive",
  mixed: "Mixed",
  negative: "Negative",
  cancelled: "Cancelled",
};

const PAIRING_STATUS_LABELS: Record<PairingStatus, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  ended_early: "Ended Early",
};

const SAFEGUARDING_CONCERN_LABELS: Record<SafeguardingConcern, string> = {
  none: "None",
  power_imbalance: "Power Imbalance",
  bullying_risk: "Bullying Risk",
  emotional_dependency: "Emotional Dependency",
  boundary_issue: "Boundary Issue",
  exploitation_risk: "Exploitation Risk",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getMentoringRoleLabel(v: MentoringRole): string { return MENTORING_ROLE_LABELS[v]; }
export function getSessionOutcomeLabel(v: SessionOutcome): string { return SESSION_OUTCOME_LABELS[v]; }
export function getPairingStatusLabel(v: PairingStatus): string { return PAIRING_STATUS_LABELS[v]; }
export function getSafeguardingConcernLabel(v: SafeguardingConcern): string { return SAFEGUARDING_CONCERN_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates quality of peer mentoring pairings.
 * Empty = 0 (no pairings documented = nothing to score).
 */
export function evaluatePairingQuality(
  pairings: PeerPairing[],
): PairingQualityResult {
  if (pairings.length === 0) {
    return {
      overallScore: 0,
      totalPairings: 0,
      consentRate: null,
      riskAssessedRate: null,
      matchCriteriaDefinedRate: null,
      activePairingRate: null,
    };
  }

  let consented = 0;
  let riskAssessed = 0;
  let matchDefined = 0;
  let active = 0;

  for (const p of pairings) {
    if (p.consentObtained) consented++;
    if (p.riskAssessed) riskAssessed++;
    if (p.matchCriteria.length > 0) matchDefined++;
    if (p.status === "active") active++;
  }

  const consentRate = rate(consented, pairings.length);
  const riskAssessedRate = rate(riskAssessed, pairings.length);
  const matchCriteriaDefinedRate = rate(matchDefined, pairings.length);
  const activePairingRate = rate(active, pairings.length);

  // Scoring: consent (0-7), risk assessed (0-6), match criteria (0-6), active pairings (0-6)
  let score = 0;
  score += Math.round((consentRate! / 100) * 7);
  score += Math.round((riskAssessedRate! / 100) * 6);
  score += Math.round((matchCriteriaDefinedRate! / 100) * 6);
  score += Math.round((activePairingRate! / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalPairings: pairings.length,
    consentRate,
    riskAssessedRate,
    matchCriteriaDefinedRate,
    activePairingRate,
  };
}

/**
 * Evaluates effectiveness of mentoring sessions.
 * Empty = 0 (no sessions documented = nothing to score).
 */
export function evaluateSessionEffectiveness(
  sessions: MentoringSession[],
  pairings: PeerPairing[],
): SessionEffectivenessResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      positiveOutcomeRate: null,
      goalsDiscussedRate: null,
      progressMadeRate: null,
      regularSessionRate: null,
    };
  }

  let positive = 0;
  let goalsDiscussed = 0;
  let progressMade = 0;

  for (const s of sessions) {
    if (s.outcome === "positive") positive++;
    if (s.goalsDiscussed) goalsDiscussed++;
    if (s.progressMade) progressMade++;
  }

  const positiveOutcomeRate = rate(positive, sessions.length);
  const goalsDiscussedRate = rate(goalsDiscussed, sessions.length);
  const progressMadeRate = rate(progressMade, sessions.length);

  // Regular sessions: each active pairing should have at least 2 sessions
  const activePairings = pairings.filter((p) => p.status === "active");
  let pairingsWithRegular = 0;
  for (const p of activePairings) {
    const pairSessions = sessions.filter((s) => s.pairingId === p.id);
    if (pairSessions.length >= 2) pairingsWithRegular++;
  }
  const regularSessionRate = rate(pairingsWithRegular, activePairings.length);

  // Scoring: positive outcome (0-7), goals discussed (0-6), progress made (0-6), regular sessions (0-6)
  let score = 0;
  score += Math.round((positiveOutcomeRate! / 100) * 7);
  score += Math.round((goalsDiscussedRate! / 100) * 6);
  score += Math.round((progressMadeRate! / 100) * 6);
  score += Math.round(((regularSessionRate ?? 0) / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalSessions: sessions.length,
    positiveOutcomeRate,
    goalsDiscussedRate,
    progressMadeRate,
    regularSessionRate,
  };
}

/**
 * Evaluates safeguarding within peer mentoring relationships.
 * Empty = 0 if pairings exist (no reviews done), 25 if no pairings (nothing to safeguard).
 */
export function evaluateRelationshipSafeguarding(
  reviews: RelationshipReview[],
  pairings: PeerPairing[],
): RelationshipSafeguardingResult {
  if (pairings.length === 0) {
    return {
      overallScore: 25,
      totalReviews: 0,
      healthyRelationshipRate: null,
      boundariesRespectedRate: null,
      noSafeguardingConcernRate: null,
      bothBenefitingRate: null,
    };
  }

  if (reviews.length === 0) {
    return {
      overallScore: 0,
      totalReviews: 0,
      healthyRelationshipRate: null,
      boundariesRespectedRate: null,
      noSafeguardingConcernRate: null,
      bothBenefitingRate: null,
    };
  }

  let healthy = 0;
  let boundaries = 0;
  let noConcern = 0;
  let bothBenefit = 0;

  for (const r of reviews) {
    if (r.relationshipHealthy) healthy++;
    if (r.boundariesRespected) boundaries++;
    if (r.safeguardingConcern === "none") noConcern++;
    if (r.mentorBenefiting && r.menteeBenefiting) bothBenefit++;
  }

  const healthyRelationshipRate = rate(healthy, reviews.length);
  const boundariesRespectedRate = rate(boundaries, reviews.length);
  const noSafeguardingConcernRate = rate(noConcern, reviews.length);
  const bothBenefitingRate = rate(bothBenefit, reviews.length);

  // Scoring: healthy (0-7), boundaries (0-6), no concerns (0-6), both benefiting (0-6)
  let score = 0;
  score += Math.round((healthyRelationshipRate! / 100) * 7);
  score += Math.round((boundariesRespectedRate! / 100) * 6);
  score += Math.round((noSafeguardingConcernRate! / 100) * 6);
  score += Math.round((bothBenefitingRate! / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalReviews: reviews.length,
    healthyRelationshipRate,
    boundariesRespectedRate,
    noSafeguardingConcernRate,
    bothBenefitingRate,
  };
}

/**
 * Evaluates staff readiness for supporting peer mentoring.
 * Empty = 0.
 */
export function evaluateStaffSupport(
  training: StaffMentoringTraining[],
): StaffSupportResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      peerMentoringTrainedRate: null,
      safeguardingInPeerRate: null,
      conflictResolutionRate: null,
      boundarySettingRate: null,
      supportingMentorsRate: null,
    };
  }

  let peerMentoring = 0;
  let safeguarding = 0;
  let conflict = 0;
  let boundary = 0;
  let supporting = 0;

  for (const t of training) {
    if (t.peerMentoringTrained) peerMentoring++;
    if (t.safeguardingInPeerRelationships) safeguarding++;
    if (t.conflictResolution) conflict++;
    if (t.boundarySetting) boundary++;
    if (t.supportingYoungMentors) supporting++;
  }

  const peerMentoringTrainedRate = rate(peerMentoring, training.length);
  const safeguardingInPeerRate = rate(safeguarding, training.length);
  const conflictResolutionRate = rate(conflict, training.length);
  const boundarySettingRate = rate(boundary, training.length);
  const supportingMentorsRate = rate(supporting, training.length);

  // Scoring: peer mentoring (0-6), safeguarding (0-6), conflict (0-5), boundary (0-4), supporting (0-4)
  let score = 0;
  score += Math.round((peerMentoringTrainedRate! / 100) * 6);
  score += Math.round((safeguardingInPeerRate! / 100) * 6);
  score += Math.round((conflictResolutionRate! / 100) * 5);
  score += Math.round((boundarySettingRate! / 100) * 4);
  score += Math.round(((supportingMentorsRate ?? 0) / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    peerMentoringTrainedRate,
    safeguardingInPeerRate,
    conflictResolutionRate,
    boundarySettingRate,
    supportingMentorsRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildMentoringProfiles(
  pairings: PeerPairing[],
  sessions: MentoringSession[],
  reviews: RelationshipReview[],
): ChildMentoringProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const p of pairings) {
    childIds.add(p.mentorId);
    childNames.set(p.mentorId, p.mentorName);
    childIds.add(p.menteeId);
    childNames.set(p.menteeId, p.menteeName);
  }

  return Array.from(childIds).map((childId) => {
    // Determine roles
    const roles: MentoringRole[] = [];
    const childPairings = pairings.filter(
      (p) => p.mentorId === childId || p.menteeId === childId,
    );

    for (const p of childPairings) {
      if (p.mentorId === childId && !roles.includes("mentor")) roles.push("mentor");
      if (p.menteeId === childId && !roles.includes("mentee")) roles.push("mentee");
    }

    // Sessions for this child's pairings
    const pairingIds = childPairings.map((p) => p.id);
    const childSessions = sessions.filter((s) => pairingIds.includes(s.pairingId));

    const positiveSessions = childSessions.filter((s) => s.outcome === "positive").length;
    const positiveOutcomeRate = rate(positiveSessions, childSessions.length)!;

    // Safeguarding concerns
    const childReviews = reviews.filter((r) => pairingIds.includes(r.pairingId));
    const safeguardingConcerns = childReviews.filter(
      (r) => r.safeguardingConcern !== "none",
    ).length;

    // Score 0-10
    let score = 0;

    // Active or completed pairings (0-2)
    const activeOrCompleted = childPairings.filter(
      (p) => p.status === "active" || p.status === "completed",
    ).length;
    if (activeOrCompleted === childPairings.length && childPairings.length > 0) score += 2;
    else if (activeOrCompleted > 0) score += 1;

    // Positive outcome rate (0-3)
    score += Math.round(((positiveOutcomeRate ?? 0) / 100) * 3);

    // No safeguarding concerns (0-2)
    if (safeguardingConcerns === 0 && childReviews.length > 0) score += 2;
    else if (safeguardingConcerns === 0 && childReviews.length === 0) score += 0;
    else if (safeguardingConcerns <= 1) score += 1;

    // Consent and risk for all pairings (0-2)
    const allConsented = childPairings.every((p) => p.consentObtained);
    const allRiskAssessed = childPairings.every((p) => p.riskAssessed);
    if (allConsented) score += 1;
    if (allRiskAssessed) score += 1;

    // Has sessions (0-1)
    if (childSessions.length > 0) score += 1;

    return {
      childId,
      childName: childNames.get(childId) || "Unknown",
      roles,
      pairingsCount: childPairings.length,
      sessionsInPeriod: childSessions.length,
      positiveOutcomeRate,
      safeguardingConcerns,
      overallScore: Math.min(10, score),
    };
  });
}

// -- Main Function ------------------------------------------------------------

export function generatePeerMentoringEffectivenessIntelligence(
  pairings: PeerPairing[],
  sessions: MentoringSession[],
  reviews: RelationshipReview[],
  training: StaffMentoringTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PeerMentoringEffectivenessIntelligence {
  const pairingQuality = evaluatePairingQuality(pairings);
  const sessionEffectiveness = evaluateSessionEffectiveness(sessions, pairings);
  const relationshipSafeguarding = evaluateRelationshipSafeguarding(reviews, pairings);
  const staffSupport = evaluateStaffSupport(training);

  const rawScore =
    pairingQuality.overallScore +
    sessionEffectiveness.overallScore +
    relationshipSafeguarding.overallScore +
    staffSupport.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildMentoringProfiles(pairings, sessions, reviews);

  // -- Strengths --
  const strengths: string[] = [];
  if (pairings.length > 0 && pairingQuality.consentRate === 100)
    strengths.push("Consent obtained for all peer mentoring pairings");
  if (pairings.length > 0 && pairingQuality.riskAssessedRate === 100)
    strengths.push("Risk assessments completed for all pairings");
  if (pairings.length > 0 && pairingQuality.matchCriteriaDefinedRate === 100)
    strengths.push("Match criteria defined for all pairings");
  if (sessions.length > 0 && meets(sessionEffectiveness.positiveOutcomeRate, 90))
    strengths.push("Positive outcomes in " + sessionEffectiveness.positiveOutcomeRate + "% of mentoring sessions");
  if (sessions.length > 0 && sessionEffectiveness.goalsDiscussedRate === 100)
    strengths.push("Goals discussed in every mentoring session");
  if (sessions.length > 0 && meets(sessionEffectiveness.progressMadeRate, 80))
    strengths.push("Progress made in " + sessionEffectiveness.progressMadeRate + "% of sessions");
  if (reviews.length > 0 && relationshipSafeguarding.noSafeguardingConcernRate === 100)
    strengths.push("No safeguarding concerns identified in any relationship review");
  if (reviews.length > 0 && relationshipSafeguarding.healthyRelationshipRate === 100)
    strengths.push("All peer mentoring relationships assessed as healthy");
  if (reviews.length > 0 && relationshipSafeguarding.bothBenefitingRate === 100)
    strengths.push("Both mentor and mentee benefiting in all reviewed pairings");
  if (training.length > 0 && staffSupport.peerMentoringTrainedRate === 100)
    strengths.push("All staff trained in peer mentoring facilitation");

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (pairings.length === 0)
    areasForImprovement.push("No peer mentoring pairings established — consider implementing a peer support programme");
  if (pairings.length > 0 && below(pairingQuality.consentRate, 100))
    areasForImprovement.push("Consent not obtained for " + (100 - pairingQuality.consentRate!) + "% of pairings");
  if (pairings.length > 0 && below(pairingQuality.riskAssessedRate, 100))
    areasForImprovement.push("Risk assessments missing for " + (100 - pairingQuality.riskAssessedRate!) + "% of pairings");
  if (sessions.length > 0 && below(sessionEffectiveness.positiveOutcomeRate, 60))
    areasForImprovement.push("Low positive outcome rate at " + sessionEffectiveness.positiveOutcomeRate + "% — review session structure");
  if (sessions.length > 0 && below(sessionEffectiveness.goalsDiscussedRate, 80))
    areasForImprovement.push("Goals discussed in only " + sessionEffectiveness.goalsDiscussedRate + "% of sessions — target 100%");
  if (sessions.length === 0 && pairings.length > 0)
    areasForImprovement.push("No mentoring sessions recorded despite active pairings");
  if (reviews.length === 0 && pairings.length > 0)
    areasForImprovement.push("No relationship reviews completed — schedule regular safeguarding reviews");
  if (reviews.length > 0 && below(relationshipSafeguarding.noSafeguardingConcernRate, 80))
    areasForImprovement.push("Safeguarding concerns identified in " + (100 - relationshipSafeguarding.noSafeguardingConcernRate!) + "% of reviews — requires attention");
  if (training.length === 0)
    areasForImprovement.push("No staff training records for peer mentoring support");
  if (training.length > 0 && below(staffSupport.safeguardingInPeerRate, 80))
    areasForImprovement.push("Only " + staffSupport.safeguardingInPeerRate + "% of staff trained in safeguarding within peer relationships");

  // -- Actions --
  const actions: string[] = [];
  const endedEarly = pairings.filter((p) => p.status === "ended_early");
  if (endedEarly.length > 0)
    actions.push("URGENT: " + endedEarly.length + " pairing(s) ended early — review reasons and ensure safeguarding actions completed");
  const concernReviews = reviews.filter((r) => r.safeguardingConcern !== "none");
  if (concernReviews.length > 0) {
    const exploitationOrBullying = concernReviews.filter(
      (r) => r.safeguardingConcern === "exploitation_risk" || r.safeguardingConcern === "bullying_risk",
    );
    if (exploitationOrBullying.length > 0)
      actions.push("URGENT: " + exploitationOrBullying.length + " review(s) flagged exploitation risk or bullying — immediate safeguarding action required");
    const otherConcerns = concernReviews.filter(
      (r) => r.safeguardingConcern !== "exploitation_risk" && r.safeguardingConcern !== "bullying_risk",
    );
    if (otherConcerns.length > 0)
      actions.push("Review " + otherConcerns.length + " safeguarding concern(s) in peer relationships — ensure action plans in place");
  }
  if (pairings.length > 0 && below(pairingQuality.consentRate, 100))
    actions.push("URGENT: Obtain consent for all peer mentoring pairings — " + (100 - pairingQuality.consentRate!) + "% outstanding");
  if (pairings.length > 0 && below(pairingQuality.riskAssessedRate, 100))
    actions.push("Complete risk assessments for all pairings — " + (100 - pairingQuality.riskAssessedRate!) + "% outstanding");
  if (pairings.length === 0)
    actions.push("Consider establishing peer mentoring or buddy scheme to support children's social development");
  if (reviews.length === 0 && pairings.length > 0)
    actions.push("Schedule relationship reviews for all active pairings — at minimum every half term");
  if (sessions.length > 0 && below(sessionEffectiveness.progressMadeRate, 50))
    actions.push("Review mentoring session structure — progress made in only " + sessionEffectiveness.progressMadeRate + "% of sessions");
  if (training.length > 0 && below(staffSupport.conflictResolutionRate, 75))
    actions.push("Arrange conflict resolution training — only " + staffSupport.conflictResolutionRate + "% of staff trained");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 11 — The positive relationships standard: supporting children to develop positive peer relationships",
    "CHR 2015, Reg 12 — The protection of children standard: safeguarding within peer relationships",
    "SCCIF — Overall experiences and progress: quality of peer relationships and support",
    "NMS 3 — Engaging with the wider community: peer support and positive social networks",
    "UNCRC Article 15 — Freedom of association: right to form and maintain peer relationships",
    "UNCRC Article 12 — Right to express views: children's voice in mentoring arrangements",
    "Peer Support Guidelines (DfE) — Best practice guidance for peer mentoring in care settings",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    pairingQuality,
    sessionEffectiveness,
    relationshipSafeguarding,
    staffSupport,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

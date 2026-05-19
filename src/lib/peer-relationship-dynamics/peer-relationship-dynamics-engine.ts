// ══════════════════════════════════════════════════════════════════════════════
// PEER RELATIONSHIP DYNAMICS INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating peer relationships, social skills
// development, conflict resolution, and positive interactions among
// looked-after children in a residential home.
//
// Regulatory basis:
//   - CHR 2015 Regulation 10 — Positive relationships
//   - CHR 2015 Regulation 12 — The protection of children
//   - SCCIF — Experiences and progress of children
//   - NMS 3 — Promoting positive behaviour
//   - Children Act 1989 — Welfare of the child
//   - UNCRC Article 19 — Protection from violence
//   - Ofsted ILACS — Experiences of children in care
//
// No AI. No external calls. No randomness. No Date.now(). Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type InteractionType =
  | "positive_social"
  | "conflict_resolution"
  | "cooperative_activity"
  | "mentoring"
  | "shared_interest"
  | "conflict"
  | "withdrawal"
  | "bullying";

export type OutcomeLevel =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ──────────────────────────────────────────────────

const interactionTypeLabels: Record<InteractionType, string> = {
  positive_social: "Positive Social",
  conflict_resolution: "Conflict Resolution",
  cooperative_activity: "Cooperative Activity",
  mentoring: "Mentoring",
  shared_interest: "Shared Interest",
  conflict: "Conflict",
  withdrawal: "Withdrawal",
  bullying: "Bullying",
};

export function getInteractionTypeLabel(type: InteractionType): string {
  return interactionTypeLabels[type];
}

const outcomeLevelLabels: Record<OutcomeLevel, string> = {
  very_positive: "Very Positive",
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  very_negative: "Very Negative",
};

export function getOutcomeLevelLabel(level: OutcomeLevel): string {
  return outcomeLevelLabels[level];
}

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface PeerInteraction {
  id: string;
  childId: string;
  childName: string;
  interactionDate: string; // ISO date
  interactionType: InteractionType;
  outcomeLevel: OutcomeLevel;
  staffMediated: boolean;
  childReflected: boolean;
  resolutionAchieved: boolean;
  socialSkillPracticed: boolean;
  documentedInLog: boolean;
  followUpPlanned: boolean;
}

export interface PeerPolicy {
  id: string;
  antisBullyingStrategy: boolean;
  conflictResolutionFramework: boolean;
  socialSkillsProgramme: boolean;
  peerMentoringScheme: boolean;
  inclusionStrategy: boolean;
  restorationPractice: boolean;
  regularReview: boolean;
}

export interface StaffPeerTraining {
  id: string;
  staffId: string;
  staffName: string;
  conflictResolution: boolean;
  socialSkillsFacilitation: boolean;
  antibullyingPractice: boolean;
  restorativeJustice: boolean;
  groupDynamics: boolean;
  traumaInformedRelationships: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface InteractionQualityResult {
  totalInteractions: number;
  positiveOutcomeCount: number;
  positiveOutcomeRate: number;
  resolutionAchievedCount: number;
  resolutionAchievedRate: number;
  socialSkillPracticedCount: number;
  socialSkillPracticedRate: number;
  childReflectedCount: number;
  childReflectedRate: number;
  documentedInLogCount: number;
  documentedInLogRate: number;
  score: number; // 0-25
}

export interface RelationshipSafetyResult {
  totalInteractions: number;
  negativeInteractionCount: number;
  negativeInteractionRate: number;
  staffMediatedNegativeCount: number;
  staffMediatedNegativeRate: number;
  followUpPlannedNegativeCount: number;
  followUpPlannedNegativeRate: number;
  score: number; // 0-25
}

export interface PeerPolicyResult {
  antisBullyingStrategy: boolean;
  conflictResolutionFramework: boolean;
  socialSkillsProgramme: boolean;
  peerMentoringScheme: boolean;
  inclusionStrategy: boolean;
  restorationPractice: boolean;
  regularReview: boolean;
  score: number; // 0-25
}

export interface StaffPeerReadinessResult {
  totalStaff: number;
  conflictResolutionCount: number;
  conflictResolutionRate: number;
  socialSkillsFacilitationCount: number;
  socialSkillsFacilitationRate: number;
  antibullyingPracticeCount: number;
  antibullyingPracticeRate: number;
  restorativeJusticeCount: number;
  restorativeJusticeRate: number;
  groupDynamicsCount: number;
  groupDynamicsRate: number;
  traumaInformedRelationshipsCount: number;
  traumaInformedRelationshipsRate: number;
  score: number; // 0-25
}

export interface ChildPeerProfile {
  childId: string;
  childName: string;
  totalInteractions: number;
  positiveOutcomeRate: number;
  socialSkillPracticedRate: number;
  negativeInteractionRate: number;
  score: number; // 0-10
}

export interface PeerRelationshipDynamicsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  interactionQuality: InteractionQualityResult;
  relationshipSafety: RelationshipSafetyResult;
  peerPolicy: PeerPolicyResult;
  staffPeerReadiness: StaffPeerReadinessResult;

  childProfiles: ChildPeerProfile[];

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

function cap(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Interaction Quality (0-25) ────────────────────────────────

export function evaluateInteractionQuality(
  interactions: PeerInteraction[],
): InteractionQualityResult {
  const total = interactions.length;

  if (total === 0) {
    return {
      totalInteractions: 0,
      positiveOutcomeCount: 0,
      positiveOutcomeRate: 0,
      resolutionAchievedCount: 0,
      resolutionAchievedRate: 0,
      socialSkillPracticedCount: 0,
      socialSkillPracticedRate: 0,
      childReflectedCount: 0,
      childReflectedRate: 0,
      documentedInLogCount: 0,
      documentedInLogRate: 0,
      score: 0,
    };
  }

  const positiveOutcomeCount = interactions.filter(
    (i) => i.outcomeLevel === "very_positive" || i.outcomeLevel === "positive",
  ).length;
  const positiveOutcomeRate = pct(positiveOutcomeCount, total);

  const resolutionAchievedCount = interactions.filter((i) => i.resolutionAchieved).length;
  const resolutionAchievedRate = pct(resolutionAchievedCount, total);

  const socialSkillPracticedCount = interactions.filter((i) => i.socialSkillPracticed).length;
  const socialSkillPracticedRate = pct(socialSkillPracticedCount, total);

  const childReflectedCount = interactions.filter((i) => i.childReflected).length;
  const childReflectedRate = pct(childReflectedCount, total);

  const documentedInLogCount = interactions.filter((i) => i.documentedInLog).length;
  const documentedInLogRate = pct(documentedInLogCount, total);

  // Weighted scoring: positive outcome (0-7), resolution (0-6), socialSkill (0-6), combined reflected+documented (0-6)
  let score = 0;
  score += (positiveOutcomeRate / 100) * 7;
  score += (resolutionAchievedRate / 100) * 6;
  score += (socialSkillPracticedRate / 100) * 6;
  const combinedRate = pct(childReflectedCount + documentedInLogCount, total * 2);
  score += (combinedRate / 100) * 6;

  score = cap(Math.round(score * 10) / 10, 0, 25);

  return {
    totalInteractions: total,
    positiveOutcomeCount,
    positiveOutcomeRate,
    resolutionAchievedCount,
    resolutionAchievedRate,
    socialSkillPracticedCount,
    socialSkillPracticedRate,
    childReflectedCount,
    childReflectedRate,
    documentedInLogCount,
    documentedInLogRate,
    score,
  };
}

// ── Evaluator 2: Relationship Safety (0-25) — ABSENCE pattern ─────────────

export function evaluateRelationshipSafety(
  interactions: PeerInteraction[],
): RelationshipSafetyResult {
  const total = interactions.length;

  // ABSENCE pattern: no interactions = no negative interactions = perfect safety
  if (total === 0) {
    return {
      totalInteractions: 0,
      negativeInteractionCount: 0,
      negativeInteractionRate: 0,
      staffMediatedNegativeCount: 0,
      staffMediatedNegativeRate: 0,
      followUpPlannedNegativeCount: 0,
      followUpPlannedNegativeRate: 0,
      score: 25,
    };
  }

  const negativeTypes: InteractionType[] = ["conflict", "withdrawal", "bullying"];
  const negativeInteractions = interactions.filter((i) => negativeTypes.includes(i.interactionType));
  const negativeInteractionCount = negativeInteractions.length;
  const negativeInteractionRate = pct(negativeInteractionCount, total);

  const staffMediatedNegativeCount = negativeInteractions.filter((i) => i.staffMediated).length;
  const staffMediatedNegativeRate = pct(staffMediatedNegativeCount, negativeInteractionCount);

  const followUpPlannedNegativeCount = negativeInteractions.filter((i) => i.followUpPlanned).length;
  const followUpPlannedNegativeRate = pct(followUpPlannedNegativeCount, negativeInteractionCount);

  // Weighted scoring:
  // negative interaction rate inverted (0-9): score = 9 * (100 - negativeRate) / 100
  // staff mediated rate for negatives (0-8)
  // follow-up planned rate for negatives (0-8)
  let score = 0;
  score += 9 * (100 - negativeInteractionRate) / 100;
  score += (staffMediatedNegativeRate / 100) * 8;
  score += (followUpPlannedNegativeRate / 100) * 8;

  score = cap(Math.round(score * 10) / 10, 0, 25);

  return {
    totalInteractions: total,
    negativeInteractionCount,
    negativeInteractionRate,
    staffMediatedNegativeCount,
    staffMediatedNegativeRate,
    followUpPlannedNegativeCount,
    followUpPlannedNegativeRate,
    score,
  };
}

// ── Evaluator 3: Peer Policy (0-25) ───────────────────────────────────────

export function evaluatePeerPolicy(
  policy: PeerPolicy | null,
): PeerPolicyResult {
  if (!policy) {
    return {
      antisBullyingStrategy: false,
      conflictResolutionFramework: false,
      socialSkillsProgramme: false,
      peerMentoringScheme: false,
      inclusionStrategy: false,
      restorationPractice: false,
      regularReview: false,
      score: 0,
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.antisBullyingStrategy) score += 4;
  if (policy.conflictResolutionFramework) score += 4;
  if (policy.socialSkillsProgramme) score += 4;
  if (policy.peerMentoringScheme) score += 4;
  if (policy.inclusionStrategy) score += 3;
  if (policy.restorationPractice) score += 3;
  if (policy.regularReview) score += 3;

  score = cap(score, 0, 25);

  return {
    antisBullyingStrategy: policy.antisBullyingStrategy,
    conflictResolutionFramework: policy.conflictResolutionFramework,
    socialSkillsProgramme: policy.socialSkillsProgramme,
    peerMentoringScheme: policy.peerMentoringScheme,
    inclusionStrategy: policy.inclusionStrategy,
    restorationPractice: policy.restorationPractice,
    regularReview: policy.regularReview,
    score,
  };
}

// ── Evaluator 4: Staff Peer Readiness (0-25) ──────────────────────────────

export function evaluateStaffPeerReadiness(
  training: StaffPeerTraining[],
): StaffPeerReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      conflictResolutionCount: 0,
      conflictResolutionRate: 0,
      socialSkillsFacilitationCount: 0,
      socialSkillsFacilitationRate: 0,
      antibullyingPracticeCount: 0,
      antibullyingPracticeRate: 0,
      restorativeJusticeCount: 0,
      restorativeJusticeRate: 0,
      groupDynamicsCount: 0,
      groupDynamicsRate: 0,
      traumaInformedRelationshipsCount: 0,
      traumaInformedRelationshipsRate: 0,
      score: 0,
    };
  }

  const conflictResolutionCount = training.filter((t) => t.conflictResolution).length;
  const conflictResolutionRate = pct(conflictResolutionCount, totalStaff);

  const socialSkillsFacilitationCount = training.filter((t) => t.socialSkillsFacilitation).length;
  const socialSkillsFacilitationRate = pct(socialSkillsFacilitationCount, totalStaff);

  const antibullyingPracticeCount = training.filter((t) => t.antibullyingPractice).length;
  const antibullyingPracticeRate = pct(antibullyingPracticeCount, totalStaff);

  const restorativeJusticeCount = training.filter((t) => t.restorativeJustice).length;
  const restorativeJusticeRate = pct(restorativeJusticeCount, totalStaff);

  const groupDynamicsCount = training.filter((t) => t.groupDynamics).length;
  const groupDynamicsRate = pct(groupDynamicsCount, totalStaff);

  const traumaInformedRelationshipsCount = training.filter((t) => t.traumaInformedRelationships).length;
  const traumaInformedRelationshipsRate = pct(traumaInformedRelationshipsCount, totalStaff);

  // 6 skills weighted: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (conflictResolutionRate / 100) * 6;
  score += (socialSkillsFacilitationRate / 100) * 5;
  score += (antibullyingPracticeRate / 100) * 5;
  score += (restorativeJusticeRate / 100) * 4;
  score += (groupDynamicsRate / 100) * 3;
  score += (traumaInformedRelationshipsRate / 100) * 2;

  score = cap(Math.round(score * 10) / 10, 0, 25);

  return {
    totalStaff,
    conflictResolutionCount,
    conflictResolutionRate,
    socialSkillsFacilitationCount,
    socialSkillsFacilitationRate,
    antibullyingPracticeCount,
    antibullyingPracticeRate,
    restorativeJusticeCount,
    restorativeJusticeRate,
    groupDynamicsCount,
    groupDynamicsRate,
    traumaInformedRelationshipsCount,
    traumaInformedRelationshipsRate,
    score,
  };
}

// ── Build Child Peer Profiles ─────────────────────────────────────────────

export function buildChildPeerProfiles(
  interactions: PeerInteraction[],
): ChildPeerProfile[] {
  const childMap = new Map<string, { childId: string; childName: string; interactions: PeerInteraction[] }>();

  for (const interaction of interactions) {
    if (!childMap.has(interaction.childId)) {
      childMap.set(interaction.childId, {
        childId: interaction.childId,
        childName: interaction.childName,
        interactions: [],
      });
    }
    childMap.get(interaction.childId)!.interactions.push(interaction);
  }

  return Array.from(childMap.values()).map((child) => {
    const total = child.interactions.length;

    const positiveCount = child.interactions.filter(
      (i) => i.outcomeLevel === "very_positive" || i.outcomeLevel === "positive",
    ).length;
    const positiveOutcomeRate = pct(positiveCount, total);

    const skillCount = child.interactions.filter((i) => i.socialSkillPracticed).length;
    const socialSkillPracticedRate = pct(skillCount, total);

    const negativeTypes: InteractionType[] = ["conflict", "withdrawal", "bullying"];
    const negativeCount = child.interactions.filter((i) => negativeTypes.includes(i.interactionType)).length;
    const negativeInteractionRate = pct(negativeCount, total);

    // Score 0-10: frequency(0-2), positiveOutcome(0-3), socialSkills(0-3), safety(0-2)
    let score = 0;

    // frequency: >=10 interactions → 2, >=5 → 1, <5 → 0
    if (total >= 10) score += 2;
    else if (total >= 5) score += 1;

    // positiveOutcome: based on rate tiers
    if (positiveOutcomeRate >= 80) score += 3;
    else if (positiveOutcomeRate >= 60) score += 2;
    else if (positiveOutcomeRate >= 40) score += 1;

    // socialSkills: based on skill practiced rate
    if (socialSkillPracticedRate >= 80) score += 3;
    else if (socialSkillPracticedRate >= 60) score += 2;
    else if (socialSkillPracticedRate >= 40) score += 1;

    // safety: based on low negative interaction rate
    if (negativeInteractionRate <= 10) score += 2;
    else if (negativeInteractionRate <= 30) score += 1;

    score = cap(score, 0, 10);

    return {
      childId: child.childId,
      childName: child.childName,
      totalInteractions: total,
      positiveOutcomeRate,
      socialSkillPracticedRate,
      negativeInteractionRate,
      score,
    };
  });
}

// ── Main Orchestrator ─────────────────────────────────────────────────────

export function generatePeerRelationshipDynamicsIntelligence(
  interactions: PeerInteraction[],
  policy: PeerPolicy | null,
  training: StaffPeerTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PeerRelationshipDynamicsIntelligence {
  const interactionQuality = evaluateInteractionQuality(interactions);
  const relationshipSafety = evaluateRelationshipSafety(interactions);
  const peerPolicyResult = evaluatePeerPolicy(policy);
  const staffPeerReadiness = evaluateStaffPeerReadiness(training);

  const rawScore =
    interactionQuality.score +
    relationshipSafety.score +
    peerPolicyResult.score +
    staffPeerReadiness.score;
  const overallScore = cap(Math.round(rawScore), 0, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildPeerProfiles(interactions);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths logic
  if (interactionQuality.positiveOutcomeRate >= 80 && interactions.length > 0) {
    strengths.push("Strong culture of positive peer interactions with " + interactionQuality.positiveOutcomeRate + "% positive outcome rate");
  }
  if (interactionQuality.resolutionAchievedRate >= 80 && interactions.length > 0) {
    strengths.push("Excellent conflict resolution practice with " + interactionQuality.resolutionAchievedRate + "% resolution rate");
  }
  if (interactionQuality.socialSkillPracticedRate >= 80 && interactions.length > 0) {
    strengths.push("Consistent social skills development with " + interactionQuality.socialSkillPracticedRate + "% skill practice rate");
  }

  // Actions logic
  if (interactions.length === 0) {
    actions.push("No peer interaction records found — begin recording peer interactions to build evidence base");
  }
  if (!policy) {
    actions.push("URGENT: No peer relationship policy in place — develop and implement policy immediately");
  }
  if (training.length === 0) {
    actions.push("URGENT: No staff peer relationship training records — arrange training programme for all staff");
  }

  // Areas for improvement
  if (interactions.length > 0 && interactionQuality.positiveOutcomeRate < 60) {
    areasForImprovement.push("Positive outcome rate at " + interactionQuality.positiveOutcomeRate + "% — below 60% threshold, targeted intervention needed");
  }
  if (interactions.length > 0 && relationshipSafety.negativeInteractionRate > 30) {
    areasForImprovement.push("Negative interaction rate at " + relationshipSafety.negativeInteractionRate + "% — exceeds 30% threshold, review safeguarding approach");
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 10 — Positive relationships",
    "CHR 2015 Regulation 12 — The protection of children",
    "SCCIF — Experiences and progress of children",
    "NMS 3 — Promoting positive behaviour",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 19 — Protection from violence",
    "Ofsted ILACS — Experiences of children in care",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    interactionQuality,
    relationshipSafety,
    peerPolicy: peerPolicyResult,
    staffPeerReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// PEER DYNAMICS & GROUP COMPATIBILITY INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing group dynamics, child-to-child
// interactions, matching compatibility, and group stability within a
// children's home.
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — The matching requirement
//   - CHR 2015, Reg 5 — Quality and purpose of care (balanced group)
//   - CHR 2015, Reg 34 — Review of quality of care
//   - CHR 2015, Reg 13 — Behaviour management (group dynamics)
//   - SCCIF — "How well children are helped and protected" — group dynamics
//   - Working Together 2023 — Peer-on-peer abuse recognition
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";
import { formatRate, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type InteractionType =
  | "positive_social"
  | "cooperative_activity"
  | "mutual_support"
  | "conflict"
  | "verbal_aggression"
  | "physical_aggression"
  | "bullying"
  | "exclusion"
  | "coercion"
  | "sexual_behaviour"
  | "exploitation_dynamic";

export type InteractionSeverity = 1 | 2 | 3 | 4 | 5;

export type CompatibilityFactor =
  | "age_gap"
  | "risk_profile_clash"
  | "exploitation_risk"
  | "sexual_behaviour_proximity"
  | "gang_affiliation_conflict"
  | "substance_influence"
  | "emotional_needs_imbalance"
  | "trauma_trigger_proximity"
  | "positive_peer_influence"
  | "shared_interests"
  | "sibling_bond"
  | "mentoring_dynamic";

export type GroupStabilityTrend = "improving" | "stable" | "declining" | "volatile";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  admissionDate: string;
  riskFactors: string[];
  vulnerabilities: string[];
  strengths: string[];
  knownTriggers: string[];
  currentPlacement: boolean;
}

export interface PeerInteraction {
  id: string;
  date: string;
  childAId: string;
  childBId: string;
  interactionType: InteractionType;
  severity: InteractionSeverity;
  initiatedBy?: string; // childId
  context: string;
  staffResponse?: string;
  deEscalationUsed: boolean;
  followUpRequired: boolean;
  followUpCompleted?: boolean;
  safeguardingReferral?: boolean;
}

export interface MatchingAssessment {
  id: string;
  childId: string;
  assessmentDate: string;
  assessedBy: string;
  compatibilityFactors: {
    factor: CompatibilityFactor;
    impact: "positive" | "neutral" | "negative";
    notes?: string;
  }[];
  overallSuitability: "suitable" | "suitable_with_conditions" | "unsuitable";
  conditions?: string[];
  reviewDate: string;
}

export interface GroupAssessment {
  id: string;
  assessmentDate: string;
  assessedBy: string;
  groupDynamicsNotes: string;
  stabilityRating: 1 | 2 | 3 | 4 | 5; // 1=volatile, 5=very stable
  keyStrengths: string[];
  keyConcerns: string[];
  actionsTaken: string[];
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface DyadAnalysis {
  childAId: string;
  childAName: string;
  childBId: string;
  childBName: string;
  totalInteractions: number;
  positiveCount: number;
  negativeCount: number;
  relationshipHealth: "healthy" | "mixed" | "concerning" | "harmful";
  patterns: string[];
  requiresIntervention: boolean;
}

export interface BullyingPattern {
  victimId: string;
  victimName: string;
  aggressorId: string;
  aggressorName: string;
  incidentCount: number;
  interactionTypes: InteractionType[];
  escalating: boolean;
  safeguardingAction: string;
}

export interface ChildGroupProfile {
  childId: string;
  childName: string;
  totalInteractions: number;
  positiveInteractionRate: number;
  conflictRate: number;
  isIsolated: boolean;
  isFrequentAggressor: boolean;
  isFrequentVictim: boolean;
  peerRelationships: {
    peerId: string;
    peerName: string;
    health: "healthy" | "mixed" | "concerning" | "harmful";
  }[];
  concerns: string[];
}

export interface MatchingComplianceResult {
  totalChildren: number;
  assessmentsCompleted: number;
  assessmentsOverdue: number;
  complianceRate: number | null;   // null = no children placed to assess
  unsuitablePlacements: number;
  conditionalPlacements: number;
  conditionsMetRate: number | null; // null = no conditional placements
}

export interface PeerDynamicsIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Overall
  overallScore: number; // 0-100
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";

  // Group overview
  totalChildren: number;
  totalInteractions: number;
  positiveInteractionRate: number;
  conflictRate: number;
  groupStabilityTrend: GroupStabilityTrend;

  // Matching compliance
  matching: MatchingComplianceResult;

  // Dyad analysis (pair relationships)
  dyadAnalyses: DyadAnalysis[];

  // Bullying detection
  bullyingPatterns: BullyingPattern[];

  // Per-child profiles
  childGroupProfiles: ChildGroupProfile[];

  // Group assessments
  latestGroupStability: number; // 1-5
  groupAssessmentsDone: number;

  // Insights
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const POSITIVE_TYPES: InteractionType[] = [
  "positive_social", "cooperative_activity", "mutual_support",
];

const NEGATIVE_TYPES: InteractionType[] = [
  "conflict", "verbal_aggression", "physical_aggression",
  "bullying", "exclusion", "coercion", "sexual_behaviour", "exploitation_dynamic",
];

const HIGH_SEVERITY_TYPES: InteractionType[] = [
  "physical_aggression", "bullying", "coercion", "sexual_behaviour", "exploitation_dynamic",
];

// ── Core: Analyse Dyads ───────────────────────────────────────────────────

export function analyseDyads(
  children: ChildProfile[],
  interactions: PeerInteraction[],
  periodStart: string,
  periodEnd: string,
): DyadAnalysis[] {
  const periodInteractions = interactions.filter(
    (i) => withinPeriod(i.date, periodStart, periodEnd),
  );

  const childMap = new Map(children.filter((c) => c.currentPlacement).map((c) => [c.id, c]));

  // Build dyad keys
  const dyadMap = new Map<string, PeerInteraction[]>();
  for (const interaction of periodInteractions) {
    const key = [interaction.childAId, interaction.childBId].sort().join("|");
    const existing = dyadMap.get(key) || [];
    existing.push(interaction);
    dyadMap.set(key, existing);
  }

  return [...dyadMap.entries()].map(([key, ints]) => {
    const [childAId, childBId] = key.split("|");
    const childA = childMap.get(childAId);
    const childB = childMap.get(childBId);

    const positiveCount = ints.filter((i) => POSITIVE_TYPES.includes(i.interactionType)).length;
    const negativeCount = ints.filter((i) => NEGATIVE_TYPES.includes(i.interactionType)).length;

    const patterns: string[] = [];

    // Detect one-directional aggression
    const aInitiated = ints.filter(
      (i) => i.initiatedBy === childAId && NEGATIVE_TYPES.includes(i.interactionType),
    ).length;
    const bInitiated = ints.filter(
      (i) => i.initiatedBy === childBId && NEGATIVE_TYPES.includes(i.interactionType),
    ).length;

    if (negativeCount >= 3 && aInitiated > bInitiated * 2) {
      patterns.push(`One-directional: ${childA?.name ?? childAId} is predominant aggressor`);
    } else if (negativeCount >= 3 && bInitiated > aInitiated * 2) {
      patterns.push(`One-directional: ${childB?.name ?? childBId} is predominant aggressor`);
    }

    // Detect escalation
    const recentNeg = ints
      .filter((i) => NEGATIVE_TYPES.includes(i.interactionType))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (recentNeg.length >= 3) {
      const lastThree = recentNeg.slice(-3);
      if (lastThree[0].severity < lastThree[1].severity && lastThree[1].severity < lastThree[2].severity) {
        patterns.push("Escalating severity pattern detected");
      }
    }

    // High-severity incidents
    const highSeverity = ints.filter(
      (i) => HIGH_SEVERITY_TYPES.includes(i.interactionType) || i.severity >= 4,
    );
    if (highSeverity.length > 0) {
      patterns.push(`${highSeverity.length} high-severity incident(s)`);
    }

    // Determine health
    let relationshipHealth: DyadAnalysis["relationshipHealth"];
    if (negativeCount === 0 && positiveCount > 0) {
      relationshipHealth = "healthy";
    } else if (highSeverity.length > 0 || negativeCount > positiveCount * 2) {
      relationshipHealth = negativeCount >= 4 || highSeverity.length >= 2 ? "harmful" : "concerning";
    } else if (negativeCount > 0) {
      relationshipHealth = "mixed";
    } else {
      relationshipHealth = "healthy";
    }

    return {
      childAId,
      childAName: childA?.name ?? childAId,
      childBId,
      childBName: childB?.name ?? childBId,
      totalInteractions: ints.length,
      positiveCount,
      negativeCount,
      relationshipHealth,
      patterns,
      requiresIntervention: relationshipHealth === "harmful" || relationshipHealth === "concerning",
    };
  });
}

// ── Core: Detect Bullying Patterns ────────────────────────────────────────

export function detectBullyingPatterns(
  children: ChildProfile[],
  interactions: PeerInteraction[],
  periodStart: string,
  periodEnd: string,
): BullyingPattern[] {
  const periodInteractions = interactions.filter(
    (i) => withinPeriod(i.date, periodStart, periodEnd),
  );
  const childMap = new Map(children.map((c) => [c.id, c]));

  // Find repeated aggressor-victim patterns
  const aggressorVictimMap = new Map<string, PeerInteraction[]>();
  for (const interaction of periodInteractions) {
    if (!interaction.initiatedBy) continue;
    if (!NEGATIVE_TYPES.includes(interaction.interactionType)) continue;

    const victimId = interaction.childAId === interaction.initiatedBy
      ? interaction.childBId : interaction.childAId;
    const key = `${interaction.initiatedBy}|${victimId}`;
    const existing = aggressorVictimMap.get(key) || [];
    existing.push(interaction);
    aggressorVictimMap.set(key, existing);
  }

  const patterns: BullyingPattern[] = [];

  for (const [key, ints] of aggressorVictimMap) {
    // Threshold: 3+ negative interactions from same aggressor to same victim
    if (ints.length < 3) continue;

    const [aggressorId, victimId] = key.split("|");
    const aggressor = childMap.get(aggressorId);
    const victim = childMap.get(victimId);

    const types = [...new Set(ints.map((i) => i.interactionType))];
    const sorted = ints.sort((a, b) => a.date.localeCompare(b.date));
    const escalating = sorted.length >= 3 &&
      sorted[sorted.length - 1].severity > sorted[0].severity;

    patterns.push({
      victimId,
      victimName: victim?.name ?? victimId,
      aggressorId,
      aggressorName: aggressor?.name ?? aggressorId,
      incidentCount: ints.length,
      interactionTypes: types,
      escalating,
      safeguardingAction: escalating
        ? "URGENT: Escalating pattern — safeguarding referral and immediate separation plan required"
        : "Review behaviour management plan and increase staff supervision during shared spaces",
    });
  }

  return patterns;
}

// ── Core: Build Child Group Profiles ──────────────────────────────────────

export function buildChildGroupProfiles(
  children: ChildProfile[],
  interactions: PeerInteraction[],
  periodStart: string,
  periodEnd: string,
): ChildGroupProfile[] {
  const periodInteractions = interactions.filter(
    (i) => withinPeriod(i.date, periodStart, periodEnd),
  );
  const activeChildren = children.filter((c) => c.currentPlacement);
  const childMap = new Map(activeChildren.map((c) => [c.id, c]));

  return activeChildren.map((child) => {
    const childInteractions = periodInteractions.filter(
      (i) => i.childAId === child.id || i.childBId === child.id,
    );

    const positive = childInteractions.filter((i) => POSITIVE_TYPES.includes(i.interactionType)).length;
    const negative = childInteractions.filter((i) => NEGATIVE_TYPES.includes(i.interactionType)).length;
    const total = childInteractions.length;

    // Aggressor analysis
    const initiatedNegative = childInteractions.filter(
      (i) => i.initiatedBy === child.id && NEGATIVE_TYPES.includes(i.interactionType),
    ).length;

    // Victim analysis
    const victimOf = childInteractions.filter(
      (i) => i.initiatedBy && i.initiatedBy !== child.id && NEGATIVE_TYPES.includes(i.interactionType),
    ).length;

    const isIsolated = total < 2 && activeChildren.length > 1;
    const isFrequentAggressor = initiatedNegative >= 3;
    const isFrequentVictim = victimOf >= 3;

    // Peer relationships
    const peerIds = new Set<string>();
    for (const interaction of childInteractions) {
      const peerId = interaction.childAId === child.id ? interaction.childBId : interaction.childAId;
      peerIds.add(peerId);
    }

    const peerRelationships = [...peerIds].map((peerId) => {
      const peerInts = childInteractions.filter(
        (i) => i.childAId === peerId || i.childBId === peerId,
      );
      const peerPositive = peerInts.filter((i) => POSITIVE_TYPES.includes(i.interactionType)).length;
      const peerNegative = peerInts.filter((i) => NEGATIVE_TYPES.includes(i.interactionType)).length;
      const peerHighSeverity = peerInts.filter(
        (i) => HIGH_SEVERITY_TYPES.includes(i.interactionType) || i.severity >= 4,
      ).length;

      let health: "healthy" | "mixed" | "concerning" | "harmful";
      if (peerNegative === 0) health = "healthy";
      else if (peerHighSeverity >= 2 || peerNegative >= 4) health = "harmful";
      else if (peerHighSeverity > 0 || peerNegative > peerPositive) health = "concerning";
      else health = "mixed";

      return {
        peerId,
        peerName: childMap.get(peerId)?.name ?? peerId,
        health,
      };
    });

    // Generate concerns
    const concerns: string[] = [];
    if (isIsolated) {
      concerns.push("Child appears socially isolated — few recorded peer interactions");
    }
    if (isFrequentAggressor) {
      concerns.push(`Frequent aggressor — initiated ${initiatedNegative} negative interactions this period`);
    }
    if (isFrequentVictim) {
      concerns.push(`Frequent victim — experienced ${victimOf} negative interactions initiated by peers`);
    }
    const harmfulRelationships = peerRelationships.filter((r) => r.health === "harmful");
    if (harmfulRelationships.length > 0) {
      concerns.push(
        `Harmful relationship dynamic with: ${harmfulRelationships.map((r) => r.peerName).join(", ")}`,
      );
    }

    return {
      childId: child.id,
      childName: child.name,
      totalInteractions: total,
      positiveInteractionRate: total > 0 ? Math.round((positive / total) * 100) : 0,
      conflictRate: total > 0 ? Math.round((negative / total) * 100) : 0,
      isIsolated,
      isFrequentAggressor,
      isFrequentVictim,
      peerRelationships,
      concerns,
    };
  });
}

// ── Core: Evaluate Matching Compliance ────────────────────────────────────

export function evaluateMatchingCompliance(
  children: ChildProfile[],
  assessments: MatchingAssessment[],
  currentDate: string,
): MatchingComplianceResult {
  const activeChildren = children.filter((c) => c.currentPlacement);

  const assessedChildIds = new Set(
    assessments
      .filter((a) => activeChildren.some((c) => c.id === a.childId))
      .map((a) => a.childId),
  );

  const overdueAssessments = activeChildren.filter(
    (c) => !assessedChildIds.has(c.id) ||
      assessments
        .filter((a) => a.childId === c.id)
        .every((a) => a.reviewDate < currentDate),
  );

  const unsuitable = assessments.filter(
    (a) => a.overallSuitability === "unsuitable" &&
      activeChildren.some((c) => c.id === a.childId),
  );

  const conditional = assessments.filter(
    (a) => a.overallSuitability === "suitable_with_conditions" &&
      activeChildren.some((c) => c.id === a.childId),
  );

  return {
    totalChildren: activeChildren.length,
    assessmentsCompleted: assessedChildIds.size,
    assessmentsOverdue: overdueAssessments.length,
    complianceRate: rate(assessedChildIds.size, activeChildren.length),
    unsuitablePlacements: unsuitable.length,
    conditionalPlacements: conditional.length,
    conditionsMetRate: rateOf(
      conditional.filter((a) => a.conditions && a.conditions.length > 0),
      conditional,
    ),
  };
}

// ── Core: Determine Group Stability Trend ─────────────────────────────────

export function determineGroupStabilityTrend(
  groupAssessments: GroupAssessment[],
): GroupStabilityTrend {
  if (groupAssessments.length < 2) return "stable";

  const sorted = [...groupAssessments].sort(
    (a, b) => a.assessmentDate.localeCompare(b.assessmentDate),
  );

  const ratings = sorted.map((a) => a.stabilityRating);
  const recent = ratings.slice(-3);

  if (recent.length < 2) return "stable";

  // Check for volatility (swings of 2+ between adjacent assessments)
  let volatileSwings = 0;
  for (let i = 1; i < recent.length; i++) {
    if (Math.abs(recent[i] - recent[i - 1]) >= 2) volatileSwings++;
  }
  if (volatileSwings >= 2) return "volatile";

  const firstHalf = recent[0];
  const lastValue = recent[recent.length - 1];

  if (lastValue > firstHalf) return "improving";
  if (lastValue < firstHalf) return "declining";
  return "stable";
}

// ── Main: Generate Peer Dynamics Intelligence ─────────────────────────────

export function generatePeerDynamicsIntelligence(
  children: ChildProfile[],
  interactions: PeerInteraction[],
  matchingAssessments: MatchingAssessment[],
  groupAssessments: GroupAssessment[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  currentDate: string,
): PeerDynamicsIntelligenceResult {
  const assessedAt = new Date().toISOString();
  const activeChildren = children.filter((c) => c.currentPlacement);

  const periodInteractions = interactions.filter(
    (i) => withinPeriod(i.date, periodStart, periodEnd),
  );

  // Core analyses
  const dyadAnalyses = analyseDyads(children, interactions, periodStart, periodEnd);
  const bullyingPatterns = detectBullyingPatterns(children, interactions, periodStart, periodEnd);
  const childGroupProfiles = buildChildGroupProfiles(children, interactions, periodStart, periodEnd);
  const matching = evaluateMatchingCompliance(children, matchingAssessments, currentDate);
  const groupStabilityTrend = determineGroupStabilityTrend(groupAssessments);

  // Aggregate metrics
  const positiveInteractions = periodInteractions.filter(
    (i) => POSITIVE_TYPES.includes(i.interactionType),
  ).length;
  const negativeInteractions = periodInteractions.filter(
    (i) => NEGATIVE_TYPES.includes(i.interactionType),
  ).length;

  const periodGroupAssessments = groupAssessments.filter(
    (a) => withinPeriod(a.assessmentDate, periodStart, periodEnd),
  );
  const latestGroupStability = periodGroupAssessments.length > 0
    ? periodGroupAssessments.sort(
      (a, b) => b.assessmentDate.localeCompare(a.assessmentDate),
    )[0].stabilityRating
    : 3;

  // Score
  const overallScore = calculatePeerDynamicsScore(
    periodInteractions.length, positiveInteractions, negativeInteractions,
    matching, bullyingPatterns, dyadAnalyses, latestGroupStability, childGroupProfiles,
  );
  const rating = getPeerDynamicsRating(overallScore);

  // Insights
  const strengths = generatePeerStrengths(
    positiveInteractions, periodInteractions.length, matching, dyadAnalyses, childGroupProfiles, latestGroupStability,
  );
  const concerns = generatePeerConcerns(
    negativeInteractions, periodInteractions.length, matching, bullyingPatterns, dyadAnalyses, childGroupProfiles,
  );
  const immediateActions = generatePeerActions(
    bullyingPatterns, dyadAnalyses, matching, childGroupProfiles,
  );
  const regulatoryLinks = generatePeerRegulatoryLinks(
    bullyingPatterns, matching, dyadAnalyses,
  );

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    totalChildren: activeChildren.length,
    totalInteractions: periodInteractions.length,
    positiveInteractionRate: periodInteractions.length > 0
      ? Math.round((positiveInteractions / periodInteractions.length) * 100) : 0,
    conflictRate: periodInteractions.length > 0
      ? Math.round((negativeInteractions / periodInteractions.length) * 100) : 0,
    groupStabilityTrend,
    matching,
    dyadAnalyses,
    bullyingPatterns,
    childGroupProfiles,
    latestGroupStability,
    groupAssessmentsDone: periodGroupAssessments.length,
    strengths,
    concerns,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculatePeerDynamicsScore(
  totalInteractions: number,
  positiveInteractions: number,
  negativeInteractions: number,
  matching: MatchingComplianceResult,
  bullyingPatterns: BullyingPattern[],
  dyadAnalyses: DyadAnalysis[],
  latestGroupStability: number,
  childGroupProfiles: ChildGroupProfile[],
): number {
  let score = 0;

  // Positive interaction rate (max 25)
  if (totalInteractions > 0) {
    const positiveRate = positiveInteractions / totalInteractions;
    score += positiveRate * 25;
  }

  // Matching compliance (max 20) — an unassessed home earns nothing here rather
  // than being credited for assessments it has not done.
  if (matching.complianceRate !== null) score += (matching.complianceRate / 100) * 15;
  if (matching.totalChildren > 0 && matching.unsuitablePlacements === 0) score += 5;

  // Group stability (max 20)
  score += (latestGroupStability / 5) * 20;

  // Relationship health (max 20)
  const harmfulDyads = dyadAnalyses.filter((d) => d.relationshipHealth === "harmful").length;
  const concerningDyads = dyadAnalyses.filter((d) => d.relationshipHealth === "concerning").length;
  const healthyDyads = dyadAnalyses.filter((d) => d.relationshipHealth === "healthy").length;
  const totalDyads = dyadAnalyses.length;
  if (totalDyads > 0) {
    score += (healthyDyads / totalDyads) * 20;
  } else {
    score += 10; // neutral if no interactions
  }

  // No isolation (max 15)
  const isolatedChildren = childGroupProfiles.filter((c) => c.isIsolated).length;
  if (childGroupProfiles.length > 0) {
    const nonIsolatedRate = 1 - (isolatedChildren / childGroupProfiles.length);
    score += nonIsolatedRate * 15;
  } else {
    score += 10;
  }

  // Penalties
  score -= bullyingPatterns.length * 8;
  score -= harmfulDyads * 5;
  score -= concerningDyads * 2;
  if (matching.unsuitablePlacements > 0) score -= matching.unsuitablePlacements * 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getPeerDynamicsRating(score: number): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generatePeerStrengths(
  positiveCount: number,
  totalCount: number,
  matching: MatchingComplianceResult,
  dyads: DyadAnalysis[],
  profiles: ChildGroupProfile[],
  groupStability: number,
): string[] {
  const strengths: string[] = [];

  const positiveRate = rate(positiveCount, totalCount);
  if (meets(positiveRate, 70)) {
    strengths.push("Group dynamics are predominantly positive — children engage cooperatively");
  }
  if (meets(matching.complianceRate, 100)) {
    strengths.push("All children have up-to-date matching assessments (Reg 12 compliant)");
  }
  if (dyads.every((d) => d.relationshipHealth === "healthy") && dyads.length > 0) {
    strengths.push("All recorded peer relationships are healthy — no concerning dyads identified");
  }
  if (profiles.every((p) => !p.isIsolated) && profiles.length > 1) {
    strengths.push("No children are socially isolated — all engaged in peer interactions");
  }
  if (groupStability >= 4) {
    strengths.push("Group stability is rated high — consistent and predictable dynamics");
  }
  if (matching.unsuitablePlacements === 0 && matching.totalChildren > 0) {
    strengths.push("No unsuitable placement matches identified — Reg 12 matching is effective");
  }

  return strengths;
}

function generatePeerConcerns(
  negativeCount: number,
  totalCount: number,
  matching: MatchingComplianceResult,
  bullyingPatterns: BullyingPattern[],
  dyads: DyadAnalysis[],
  profiles: ChildGroupProfile[],
): string[] {
  const concerns: string[] = [];

  if (bullyingPatterns.length > 0) {
    concerns.push(
      `${bullyingPatterns.length} bullying pattern(s) detected — repeated aggressor-victim dynamics require immediate safeguarding response`,
    );
  }

  const harmfulDyads = dyads.filter((d) => d.relationshipHealth === "harmful");
  if (harmfulDyads.length > 0) {
    concerns.push(
      `${harmfulDyads.length} harmful peer relationship(s): ${harmfulDyads.map((d) => `${d.childAName}/${d.childBName}`).join(", ")}`,
    );
  }

  if (matching.assessmentsOverdue > 0) {
    concerns.push(
      `${matching.assessmentsOverdue} matching assessment(s) overdue — Reg 12 compliance at risk`,
    );
  }

  if (matching.unsuitablePlacements > 0) {
    concerns.push(
      `${matching.unsuitablePlacements} child(ren) assessed as unsuitable match — placement review urgently required`,
    );
  }

  const isolated = profiles.filter((p) => p.isIsolated);
  if (isolated.length > 0) {
    concerns.push(
      `${isolated.length} child(ren) appear socially isolated: ${isolated.map((p) => p.childName).join(", ")}`,
    );
  }

  const aggressors = profiles.filter((p) => p.isFrequentAggressor);
  if (aggressors.length > 0) {
    concerns.push(
      `${aggressors.length} child(ren) identified as frequent aggressors — review behaviour management plans`,
    );
  }

  const conflictRate = rate(negativeCount, totalCount);
  if (conflictRate !== null && conflictRate > 40) {
    concerns.push(
      `Conflict rate is ${formatRate(conflictRate)} — group dynamics are predominantly negative`,
    );
  }

  return concerns;
}

function generatePeerActions(
  bullyingPatterns: BullyingPattern[],
  dyads: DyadAnalysis[],
  matching: MatchingComplianceResult,
  profiles: ChildGroupProfile[],
): string[] {
  const actions: string[] = [];

  // Escalating bullying — highest priority
  const escalating = bullyingPatterns.filter((b) => b.escalating);
  for (const pattern of escalating) {
    actions.push(
      `URGENT: Escalating bullying pattern — ${pattern.aggressorName} → ${pattern.victimName} (${pattern.incidentCount} incidents). Safeguarding referral required. Immediate separation and safety planning.`,
    );
  }

  // Non-escalating bullying
  const nonEscalating = bullyingPatterns.filter((b) => !b.escalating);
  for (const pattern of nonEscalating) {
    actions.push(
      `HIGH: Repeated aggression from ${pattern.aggressorName} towards ${pattern.victimName} (${pattern.incidentCount} incidents). Review behaviour management plan, increase supervision.`,
    );
  }

  // Harmful dyads without bullying pattern
  const harmfulDyads = dyads.filter(
    (d) => d.relationshipHealth === "harmful" &&
      !bullyingPatterns.some(
        (b) => (b.aggressorId === d.childAId && b.victimId === d.childBId) ||
          (b.aggressorId === d.childBId && b.victimId === d.childAId),
      ),
  );
  for (const dyad of harmfulDyads) {
    actions.push(
      `HIGH: Harmful dynamic between ${dyad.childAName} and ${dyad.childBName}. Schedule restorative intervention and review matching assessment.`,
    );
  }

  // Matching overdue
  if (matching.assessmentsOverdue > 0) {
    actions.push(
      `MEDIUM: ${matching.assessmentsOverdue} Reg 12 matching assessment(s) overdue. Complete within 5 working days.`,
    );
  }

  // Unsuitable placements
  if (matching.unsuitablePlacements > 0) {
    actions.push(
      `URGENT: ${matching.unsuitablePlacements} child(ren) assessed as unsuitable match. Escalate to placing authority and RI for emergency review.`,
    );
  }

  // Isolated children
  const isolated = profiles.filter((p) => p.isIsolated);
  for (const child of isolated) {
    actions.push(
      `MEDIUM: ${child.childName} appears socially isolated. Review social opportunities, key work on peer relationship building.`,
    );
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Group dynamics are healthy and well-monitored.");
  }

  return actions;
}

function generatePeerRegulatoryLinks(
  bullyingPatterns: BullyingPattern[],
  matching: MatchingComplianceResult,
  dyads: DyadAnalysis[],
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 12 — The matching requirement");
  links.add("SCCIF: How well children are helped and protected — Group dynamics");

  if (matching.assessmentsOverdue > 0 || matching.unsuitablePlacements > 0) {
    links.add("CHR 2015, Reg 12(2) — Impact assessment before placement");
    links.add("CHR 2015, Reg 5 — Quality and purpose of care (balanced group)");
  }

  if (bullyingPatterns.length > 0) {
    links.add("Working Together 2023 — Peer-on-peer abuse");
    links.add("CHR 2015, Reg 13 — Behaviour management (safeguarding others)");
    links.add("Keeping Children Safe in Education 2024 — Child-on-child abuse");
  }

  const harmfulDyads = dyads.filter((d) => d.relationshipHealth === "harmful");
  if (harmfulDyads.length > 0) {
    links.add("CHR 2015, Reg 34 — Review of quality of care");
    links.add("CHR 2015, Reg 40 — Notification of serious events");
  }

  return [...links];
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getInteractionTypeLabel(type: InteractionType): string {
  const labels: Record<InteractionType, string> = {
    positive_social: "Positive Social",
    cooperative_activity: "Cooperative Activity",
    mutual_support: "Mutual Support",
    conflict: "Conflict",
    verbal_aggression: "Verbal Aggression",
    physical_aggression: "Physical Aggression",
    bullying: "Bullying",
    exclusion: "Exclusion",
    coercion: "Coercion",
    sexual_behaviour: "Harmful Sexual Behaviour",
    exploitation_dynamic: "Exploitation Dynamic",
  };
  return labels[type];
}

export function getCompatibilityFactorLabel(factor: CompatibilityFactor): string {
  const labels: Record<CompatibilityFactor, string> = {
    age_gap: "Age Gap",
    risk_profile_clash: "Risk Profile Clash",
    exploitation_risk: "Exploitation Risk",
    sexual_behaviour_proximity: "HSB Proximity",
    gang_affiliation_conflict: "Gang Affiliation Conflict",
    substance_influence: "Substance Influence",
    emotional_needs_imbalance: "Emotional Needs Imbalance",
    trauma_trigger_proximity: "Trauma Trigger Proximity",
    positive_peer_influence: "Positive Peer Influence",
    shared_interests: "Shared Interests",
    sibling_bond: "Sibling Bond",
    mentoring_dynamic: "Mentoring Dynamic",
  };
  return labels[factor];
}

export function getRelationshipHealthLabel(health: string): string {
  const labels: Record<string, string> = {
    healthy: "Healthy",
    mixed: "Mixed",
    concerning: "Concerning",
    harmful: "Harmful",
  };
  return labels[health] ?? health;
}

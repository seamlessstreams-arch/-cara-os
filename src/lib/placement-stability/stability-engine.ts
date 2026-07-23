// ══════════════════════════════════════════════════════════════════════════════
// Cara Placement Stability — Intelligence Engine
//
// Deterministic engine for tracking placement stability, matching suitability,
// disruption risk factors, and transition planning.
//
// Aligned to:
//   - CHR 2015 Reg 11 — The duty to secure the welfare of children
//   - CHR 2015 Reg 12 — The protection of children (placement matching)
//   - CHR 2015 Reg 14 — The care planning standard
//   - Ofsted SCCIF — "Children are well matched to their placements"
//   - DfE: Matching children with foster carers / residential homes
//
// Placement stability factors:
//   1. Matching assessment (needs vs provision capability)
//   2. Disruption risk indicators
//   3. Stability timeline and milestone tracking
//   4. Impact of group dynamics (other children in placement)
//   5. Staff continuity and relationship quality
//   6. Transition planning (move-on readiness)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { meanOf, rate } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type PlacementStatus =
  | "planned"             // referral accepted, not yet arrived
  | "settling_in"        // first 28 days
  | "established"        // stable placement
  | "at_risk"            // disruption indicators present
  | "notice_given"       // formal notice of ending
  | "transitioning"      // active transition to next placement
  | "ended";             // placement concluded

export type EndReason =
  | "planned_move_on"     // positive transition
  | "reunification"       // returned to family
  | "step_down"          // moved to less intensive provision
  | "step_up"            // moved to more intensive provision
  | "disruption"         // unplanned breakdown
  | "age_out"            // turned 18
  | "safeguarding"       // removed for safety concerns
  | "other";

export type MatchingDomain =
  | "age_appropriateness"
  | "peer_dynamics"
  | "risk_compatibility"
  | "therapeutic_needs"
  | "education_provision"
  | "location_suitability"
  | "cultural_identity"
  | "contact_arrangements"
  | "staff_capability"
  | "physical_environment";

export type RiskIndicator =
  | "frequent_missing"          // 3+ missing episodes in 28 days
  | "escalating_incidents"      // increasing severity of incidents
  | "peer_conflict"             // ongoing conflict with other residents
  | "staff_relationship_breakdown"
  | "placement_refusal"         // child expressing wish to leave
  | "school_exclusion"          // exclusion or persistent absence
  | "declining_wellbeing"       // mood/engagement declining
  | "family_pressure"           // family undermining placement
  | "exploitation_risk"         // CSE/CCE concerns
  | "self_harm_increase"
  | "substance_use_escalation"
  | "absconding_pattern";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface Placement {
  id: string;
  childId: string;
  childName: string;
  homeId: string;
  homeName: string;
  status: PlacementStatus;

  // Timeline
  referralDate: string;
  admissionDate: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  endReason?: EndReason;

  // Matching
  matchingScore: number;          // 1-100 calculated at admission
  matchingAssessment: MatchingAssessmentItem[];

  // Stability
  currentRiskIndicators: RiskIndicator[];
  stabilityMilestones: StabilityMilestone[];
  disruptionHistory: DisruptionEvent[];

  // People
  keyworkerId: string;
  keyworkerName: string;
  socialWorkerId: string;
  previousPlacements: number;     // count of prior placements
}

export interface MatchingAssessmentItem {
  domain: MatchingDomain;
  score: number;                  // 1-10
  notes: string;
  mitigationPlan?: string;       // if score < 6
}

export interface StabilityMilestone {
  name: string;
  targetDate: string;
  achievedDate?: string;
  status: "pending" | "achieved" | "overdue" | "revised";
}

export interface DisruptionEvent {
  date: string;
  description: string;
  severity: "low" | "medium" | "high";
  resolved: boolean;
  actionTaken: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface PlacementStabilityResult {
  placementId: string;
  childName: string;
  status: PlacementStatus;
  daysInPlacement: number;
  stabilityScore: number;           // 0-100
  stabilityRating: "excellent" | "good" | "concerning" | "at_risk" | "critical";
  /** "not_assessed" = no matching assessment exists, which is never "adequate". */
  matchingAdequacy: "strong" | "adequate" | "weak" | "not_assessed";
  riskIndicatorCount: number;
  activeRisks: RiskIndicator[];
  milestonesAchieved: number;
  milestonesPending: number;
  milestonesOverdue: number;
  disruptionRisk: "low" | "medium" | "high" | "very_high";
  recommendations: string[];
}

export interface HomeStabilityMetrics {
  homeId: string;
  homeName: string;
  totalPlacements: number;
  activePlacements: number;
  averageDaysInPlacement: number | null;
  averageStabilityScore: number | null;   // null = no active placement to score
  placementsAtRisk: number;
  plannedEndings: number;
  disruptionRate: number | null;    // % ended by disruption; null = no placement has ended
  averageMatchingScore: number | null;
  occupancyRate: number | null;     // %; null = no registered capacity
  stabilityByChild: { childId: string; childName: string; score: number; days: number }[];
  riskSummary: { indicator: RiskIndicator; count: number }[];
}

export interface MatchingRecommendation {
  domain: MatchingDomain;
  domainLabel: string;
  currentScore: number;
  concern: string;
  recommendation: string;
}

// ── Configuration ──────────────────────────────────────────────────────────

const SETTLING_IN_DAYS = 28;
const HIGH_RISK_INDICATORS = 3;       // 3+ indicators = high disruption risk
const LOW_MATCHING_THRESHOLD = 6;     // domain score < 6 needs mitigation
const DISRUPTION_WEIGHT = 15;         // each disruption event reduces stability score

const MATCHING_DOMAIN_LABELS: Record<MatchingDomain, string> = {
  age_appropriateness: "Age Appropriateness",
  peer_dynamics: "Peer Group Dynamics",
  risk_compatibility: "Risk Compatibility",
  therapeutic_needs: "Therapeutic Needs Provision",
  education_provision: "Education Provision",
  location_suitability: "Location & Contact",
  cultural_identity: "Cultural Identity & Faith",
  contact_arrangements: "Family Contact",
  staff_capability: "Staff Skills & Experience",
  physical_environment: "Physical Environment",
};

// ── Core: Evaluate Placement Stability ───────────────────────────────────

export function evaluatePlacementStability(
  placement: Placement,
  now?: string,
): PlacementStabilityResult {
  const currentDate = now ? new Date(now) : new Date();
  const admissionDate = new Date(placement.admissionDate);
  const daysInPlacement = Math.floor(
    (currentDate.getTime() - admissionDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  // Stability score calculation
  let stabilityScore = 100;

  // Risk indicators reduce score
  stabilityScore -= placement.currentRiskIndicators.length * 12;

  // Disruption events reduce score
  const recentDisruptions = placement.disruptionHistory.filter(d =>
    new Date(d.date) >= new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000),
  );
  stabilityScore -= recentDisruptions.length * DISRUPTION_WEIGHT;

  // Low matching scores reduce stability
  const lowMatchDomains = placement.matchingAssessment.filter(m => m.score < LOW_MATCHING_THRESHOLD);
  stabilityScore -= lowMatchDomains.length * 5;

  // Overdue milestones reduce score
  const overdueMilestones = placement.stabilityMilestones.filter(m => m.status === "overdue");
  stabilityScore -= overdueMilestones.length * 3;

  // Previous placements indicate instability risk
  if (placement.previousPlacements >= 5) stabilityScore -= 10;
  else if (placement.previousPlacements >= 3) stabilityScore -= 5;

  // Longer placements get stability bonus (max 10 points)
  const tenureBonus = Math.min(Math.floor(daysInPlacement / 90) * 2, 10);
  stabilityScore += tenureBonus;

  // Clamp
  stabilityScore = Math.max(0, Math.min(100, stabilityScore));

  // Rating
  let stabilityRating: PlacementStabilityResult["stabilityRating"];
  if (stabilityScore >= 85) stabilityRating = "excellent";
  else if (stabilityScore >= 70) stabilityRating = "good";
  else if (stabilityScore >= 50) stabilityRating = "concerning";
  else if (stabilityScore >= 30) stabilityRating = "at_risk";
  else stabilityRating = "critical";

  // Matching adequacy. No assessment means the match was never evidenced —
  // that is a Reg 12 gap, not a mid-range pass.
  const avgMatchScore = placement.matchingAssessment.length > 0
    ? placement.matchingAssessment.reduce((s, m) => s + m.score, 0) / placement.matchingAssessment.length
    : null;
  let matchingAdequacy: PlacementStabilityResult["matchingAdequacy"];
  if (avgMatchScore === null) matchingAdequacy = "not_assessed";
  else if (avgMatchScore >= 8) matchingAdequacy = "strong";
  else if (avgMatchScore >= 6) matchingAdequacy = "adequate";
  else matchingAdequacy = "weak";

  // Milestones
  const milestonesAchieved = placement.stabilityMilestones.filter(m => m.status === "achieved").length;
  const milestonesPending = placement.stabilityMilestones.filter(m => m.status === "pending").length;
  const milestonesOverdue = overdueMilestones.length;

  // Disruption risk
  let disruptionRisk: PlacementStabilityResult["disruptionRisk"];
  const riskCount = placement.currentRiskIndicators.length;
  if (riskCount >= 5 || stabilityScore < 30) disruptionRisk = "very_high";
  else if (riskCount >= HIGH_RISK_INDICATORS || stabilityScore < 50) disruptionRisk = "high";
  else if (riskCount >= 2 || stabilityScore < 70) disruptionRisk = "medium";
  else disruptionRisk = "low";

  // Recommendations
  const recommendations = generateStabilityRecommendations(
    placement,
    stabilityScore,
    daysInPlacement,
    lowMatchDomains,
    overdueMilestones,
    recentDisruptions,
  );

  return {
    placementId: placement.id,
    childName: placement.childName,
    status: placement.status,
    daysInPlacement,
    stabilityScore,
    stabilityRating,
    matchingAdequacy,
    riskIndicatorCount: riskCount,
    activeRisks: placement.currentRiskIndicators,
    milestonesAchieved,
    milestonesPending,
    milestonesOverdue,
    disruptionRisk,
    recommendations,
  };
}

// ── Core: Home Stability Metrics ─────────────────────────────────────────

export function calculateHomeStabilityMetrics(
  placements: Placement[],
  homeId: string,
  homeName: string,
  capacity: number,
  now?: string,
): HomeStabilityMetrics {
  const currentDate = now ? new Date(now) : new Date();

  const homePlacements = placements.filter(p => p.homeId === homeId);
  const activePlacements = homePlacements.filter(p =>
    p.status !== "ended" && p.status !== "planned",
  );
  const endedPlacements = homePlacements.filter(p => p.status === "ended");

  // Average days
  const daysValues = activePlacements.map(p =>
    Math.floor((currentDate.getTime() - new Date(p.admissionDate).getTime()) / (24 * 60 * 60 * 1000)),
  );
  const averageDays = meanOf(daysValues);

  // Stability scores
  const stabilityResults = activePlacements.map(p => evaluatePlacementStability(p, now));
  const averageStability = meanOf(stabilityResults.map(r => r.stabilityScore));

  // At risk
  const atRisk = stabilityResults.filter(r =>
    r.disruptionRisk === "high" || r.disruptionRisk === "very_high",
  ).length;

  // Planned endings
  const plannedEndings = activePlacements.filter(p =>
    p.status === "notice_given" || p.status === "transitioning",
  ).length;

  // Disruption rate
  const disruptedCount = endedPlacements.filter(p => p.endReason === "disruption").length;
  const disruptionRate = rate(disruptedCount, endedPlacements.length);

  // Average matching score
  const averageMatching = meanOf(homePlacements.map(p => p.matchingScore));

  // Occupancy
  const occupancyRate = rate(activePlacements.length, capacity);

  // By child
  const stabilityByChild = stabilityResults.map(r => ({
    childId: activePlacements.find(p => p.id === r.placementId)?.childId ?? "",
    childName: r.childName,
    score: r.stabilityScore,
    days: r.daysInPlacement,
  }));

  // Risk summary
  const riskCounts = new Map<RiskIndicator, number>();
  for (const p of activePlacements) {
    for (const risk of p.currentRiskIndicators) {
      riskCounts.set(risk, (riskCounts.get(risk) ?? 0) + 1);
    }
  }
  const riskSummary = Array.from(riskCounts.entries())
    .map(([indicator, count]) => ({ indicator, count }))
    .sort((a, b) => b.count - a.count);

  return {
    homeId,
    homeName,
    totalPlacements: homePlacements.length,
    activePlacements: activePlacements.length,
    averageDaysInPlacement: averageDays,
    averageStabilityScore: averageStability,
    placementsAtRisk: atRisk,
    plannedEndings,
    disruptionRate,
    averageMatchingScore: averageMatching,
    occupancyRate,
    stabilityByChild,
    riskSummary,
  };
}

// ── Core: Matching Recommendations ───────────────────────────────────────

export function getMatchingRecommendations(
  placement: Placement,
): MatchingRecommendation[] {
  return placement.matchingAssessment
    .filter(m => m.score < LOW_MATCHING_THRESHOLD)
    .map(m => ({
      domain: m.domain,
      domainLabel: MATCHING_DOMAIN_LABELS[m.domain],
      currentScore: m.score,
      concern: m.notes,
      recommendation: m.mitigationPlan ?? generateDefaultMitigation(m.domain),
    }));
}

// ── Helpers ───────────────────────────────────────────────────────────────

function generateStabilityRecommendations(
  placement: Placement,
  score: number,
  days: number,
  lowMatchDomains: MatchingAssessmentItem[],
  overdueMilestones: StabilityMilestone[],
  recentDisruptions: DisruptionEvent[],
): string[] {
  const recs: string[] = [];

  if (days <= SETTLING_IN_DAYS) {
    recs.push("Within settling-in period — enhanced monitoring and daily keyworker contact recommended.");
  }

  if (placement.currentRiskIndicators.includes("placement_refusal")) {
    recs.push("URGENT: Child expressing wish to leave. Convene placement stability meeting within 48h.");
  }

  if (placement.currentRiskIndicators.includes("exploitation_risk")) {
    recs.push("Exploitation concern active — ensure safety mapping and MACE/NRM referrals in place.");
  }

  if (recentDisruptions.length >= 2) {
    recs.push("Multiple disruption events — placement stability meeting required. Review matching assessment.");
  }

  if (lowMatchDomains.length >= 3) {
    recs.push("Multiple weak matching domains — review placement suitability with commissioning team.");
  }

  for (const domain of lowMatchDomains) {
    if (domain.domain === "peer_dynamics" && domain.score <= 3) {
      recs.push("Peer dynamics critical — consider group dynamics assessment and possible separation plan.");
    }
  }

  if (overdueMilestones.length > 0) {
    recs.push(`${overdueMilestones.length} stability milestone(s) overdue — review and update care plan.`);
  }

  if (placement.previousPlacements >= 4 && score < 70) {
    recs.push("Multiple previous placement breakdowns — intensive stability support package needed.");
  }

  if (score >= 85 && days >= 180) {
    recs.push("Stable placement of 6+ months — consider transition planning and independence pathway.");
  }

  return recs;
}

function generateDefaultMitigation(domain: MatchingDomain): string {
  const mitigations: Record<MatchingDomain, string> = {
    age_appropriateness: "Review age-appropriate activities. Consider whether peer group age range is manageable.",
    peer_dynamics: "Implement structured activities to build positive relationships. Monitor group dynamics closely.",
    risk_compatibility: "Enhanced risk management plan. Review compatibility with other children's risk profiles.",
    therapeutic_needs: "Source additional therapeutic input. Review CAMHS engagement and specialist provision.",
    education_provision: "Liaise with Virtual School Head. Explore alternative education provision if needed.",
    location_suitability: "Review contact arrangements. Consider transport support for family contact.",
    cultural_identity: "Source culturally appropriate resources and community links. Cultural competence training for staff.",
    contact_arrangements: "Review and improve contact plan. Consider frequency and quality of family time.",
    staff_capability: "Identify training needs. Consider specialist consultation or additional staffing.",
    physical_environment: "Review environmental suitability. Implement adaptations where possible.",
  };
  return mitigations[domain];
}

export function getPlacementStatusLabel(status: PlacementStatus): string {
  const labels: Record<PlacementStatus, string> = {
    planned: "Planned (Pre-Admission)",
    settling_in: "Settling In",
    established: "Established",
    at_risk: "At Risk of Disruption",
    notice_given: "Notice Given",
    transitioning: "Transitioning Out",
    ended: "Ended",
  };
  return labels[status];
}

export function getEndReasonLabel(reason: EndReason): string {
  const labels: Record<EndReason, string> = {
    planned_move_on: "Planned Move-On",
    reunification: "Family Reunification",
    step_down: "Step-Down to Less Intensive",
    step_up: "Step-Up to More Intensive",
    disruption: "Unplanned Disruption",
    age_out: "Turned 18",
    safeguarding: "Safeguarding Removal",
    other: "Other",
  };
  return labels[reason];
}

export function getMatchingDomainLabel(domain: MatchingDomain): string {
  return MATCHING_DOMAIN_LABELS[domain];
}

// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Placement Stability
//
// Pure deterministic analysis of placement stability and disruption risk.
// Tracks:
//   - Placement history (moves, duration, reasons)
//   - Disruption risk indicators
//   - Matching quality (age, needs, peer group)
//   - Stability factors (relationships, belonging, routine)
//   - Transition planning quality
//   - Placement review compliance
//
// Regulatory alignment:
//   - CHR 2015 Reg 11 — Care planning (duty to avoid disruption)
//   - CHR 2015 Reg 12 — Safeguarding (placement suitability)
//   - SCCIF — Stability and permanence
//   - Sufficiency Duty — Local authority s22G
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type PlacementEndReason =
  | "planned_move"
  | "breakdown"
  | "child_request"
  | "safeguarding"
  | "carer_request"
  | "matching_issue"
  | "step_up"
  | "step_down"
  | "return_home"
  | "ageing_out"
  | "other";

export type DisruptionIndicator =
  | "increased_incidents"
  | "running_away"
  | "school_exclusion"
  | "peer_conflict"
  | "staff_conflict"
  | "self_harm"
  | "safeguarding"
  | "refusing_boundaries"
  | "disengagement"
  | "placement_request"
  | "police_involvement";

export interface PlacementHistory {
  id: string;
  startDate: string;
  endDate?: string;
  type: "residential" | "foster" | "semi_independent" | "secure" | "other";
  durationDays: number;
  endReason?: PlacementEndReason;
  planned: boolean;
  matchingScore?: number; // 0-100 how well matched
}

export interface PlacementStabilityInput {
  childId: string;
  childName: string;
  age: number;
  currentPlacementStartDate: string;
  currentPlacementDays: number;
  placementHistory: PlacementHistory[];
  totalPlacementsEver: number;
  disruptionIndicators: DisruptionIndicator[];
  indicatorTrend: "worsening" | "stable" | "improving";
  incidentsLast30Days: number;
  incidentsTrend: "increasing" | "stable" | "decreasing";
  missingEpisodesLast30Days: number;
  childFeelsSettled: boolean | null;
  childWantsToStay: boolean | null;
  childHasRoomPersonalised: boolean | null;
  regularRoutineEstablished: boolean | null;
  positiveStaffRelationships: boolean | null;
  peerRelationshipsGood: boolean | null;
  placementReviewCurrent: boolean | null;
  placementReviewLastDate?: string;
  matchingAssessmentDone: boolean | null;
  impactRiskAssessmentDone: boolean | null;
  contingencyPlanInPlace: boolean | null;
  stayingPutOptionExplored: boolean;
}

export interface PlacementStabilityAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  stabilityScore: number;
  disruptionRiskScore: number;
  belongingScore: number;
  planningScore: number;
  currentPlacementDays: number;
  totalPlacements: number;
  breakdownCount: number;
  averagePlacementDays: number;
  disruptionRiskLevel: "low" | "medium" | "high" | "very_high";
  activeIndicators: DisruptionIndicator[];
  concerns: StabilityConcern[];
  strengths: StabilityStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface StabilityConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface StabilityStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met" | "not_evidenced";
  detail: string;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analysePlacementStability(input: PlacementStabilityInput): PlacementStabilityAssessment {
  const { childName, placementHistory } = input;

  // ── History metrics ─────────────────────────────────────────────────
  const totalPlacements = input.totalPlacementsEver;
  const breakdownCount = placementHistory.filter(p => p.endReason === "breakdown").length;
  const avgDuration = placementHistory.length > 0
    ? Math.round(placementHistory.reduce((sum, p) => sum + p.durationDays, 0) / placementHistory.length)
    : input.currentPlacementDays;

  // ── Disruption risk ─────────────────────────────────────────────────
  const disruptionRiskLevel = assessDisruptionRisk(input);
  const activeIndicators = input.disruptionIndicators;

  // ── Scores ────────────────────────────────────────────────────────
  const stabilityScore = scoreStability(input, breakdownCount, avgDuration);
  const disruptionRiskScore = scoreDisruptionRisk(input);
  const belongingScore = scoreBelonging(input);
  const planningScore = scorePlanning(input);

  // ── Overall — invert disruption risk (lower risk = higher score)
  const overallScore = Math.round(
    stabilityScore * 0.30 +
    disruptionRiskScore * 0.25 +
    belongingScore * 0.25 +
    planningScore * 0.20
  );
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, disruptionRiskLevel, breakdownCount);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, breakdownCount);

  // ── Regulatory flags ──────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, disruptionRiskLevel);

  // ── Recommendations ───────────────────────────────────────────────
  const recommendations = buildRecommendations(input, disruptionRiskLevel, breakdownCount);

  // ── Summary ───────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, input.currentPlacementDays, disruptionRiskLevel, totalPlacements);

  return {
    childName,
    overallScore,
    overallRating,
    stabilityScore,
    disruptionRiskScore,
    belongingScore,
    planningScore,
    currentPlacementDays: input.currentPlacementDays,
    totalPlacements,
    breakdownCount,
    averagePlacementDays: avgDuration,
    disruptionRiskLevel,
    activeIndicators,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Disruption Risk Assessment ──────────────────────────────────────────────

function assessDisruptionRisk(input: PlacementStabilityInput): "low" | "medium" | "high" | "very_high" {
  let points = 0;

  // Indicators (each worth 1-2 points)
  const highRiskIndicators: DisruptionIndicator[] = [
    "running_away", "self_harm", "safeguarding", "police_involvement",
  ];
  input.disruptionIndicators.forEach(ind => {
    points += highRiskIndicators.includes(ind) ? 2 : 1;
  });

  // Trend
  if (input.indicatorTrend === "worsening") points += 2;

  // High incidents
  if (input.incidentsLast30Days >= 10) points += 3;
  else if (input.incidentsLast30Days >= 5) points += 2;
  else if (input.incidentsLast30Days >= 3) points += 1;

  // Incident trend
  if (input.incidentsTrend === "increasing") points += 2;

  // Missing episodes
  if (input.missingEpisodesLast30Days >= 3) points += 2;
  else if (input.missingEpisodesLast30Days >= 1) points += 1;

  // Child doesn't want to stay. A child who has never been asked is not a
  // child who said no — adding risk points for silence is a false red.
  if (input.childWantsToStay === false) points += 2;

  // Short placement (still settling)
  if (input.currentPlacementDays < 30) points += 1;

  // Previous breakdowns
  const breakdowns = input.placementHistory.filter(p => p.endReason === "breakdown").length;
  if (breakdowns >= 3) points += 3;
  else if (breakdowns >= 2) points += 2;
  else if (breakdowns >= 1) points += 1;

  if (points >= 10) return "very_high";
  if (points >= 6) return "high";
  if (points >= 3) return "medium";
  return "low";
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreStability(input: PlacementStabilityInput, breakdowns: number, avgDuration: number): number {
  let score = 50; // baseline

  // Current placement length
  if (input.currentPlacementDays >= 365) score += 25;
  else if (input.currentPlacementDays >= 180) score += 20;
  else if (input.currentPlacementDays >= 90) score += 15;
  else if (input.currentPlacementDays >= 30) score += 5;

  // Low total placements
  if (input.totalPlacementsEver <= 1) score += 20;
  else if (input.totalPlacementsEver <= 2) score += 15;
  else if (input.totalPlacementsEver <= 3) score += 5;
  else score -= 10;

  // Breakdowns
  score -= breakdowns * 10;

  // Average duration
  if (avgDuration >= 365) score += 5;
  else if (avgDuration < 90) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function scoreDisruptionRisk(input: PlacementStabilityInput): number {
  // Lower risk = higher score (inverted)
  let score = 100;

  // Each indicator reduces score
  score -= input.disruptionIndicators.length * 10;

  // Worsening trend
  if (input.indicatorTrend === "worsening") score -= 15;
  else if (input.indicatorTrend === "improving") score += 5;

  // Incidents
  score -= Math.min(30, input.incidentsLast30Days * 5);

  // Increasing incidents
  if (input.incidentsTrend === "increasing") score -= 10;

  // Missing
  score -= Math.min(20, input.missingEpisodesLast30Days * 8);

  // Child not wanting to stay
  if (input.childWantsToStay === false) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function scoreBelonging(input: PlacementStabilityInput): number {
  let score = 0;

  if (input.childFeelsSettled === true) score += 25;
  if (input.childWantsToStay === true) score += 20;
  if (input.childHasRoomPersonalised === true) score += 15;
  if (input.regularRoutineEstablished === true) score += 15;
  if (input.positiveStaffRelationships === true) score += 15;
  if (input.peerRelationshipsGood === true) score += 10;

  return Math.min(100, score);
}

function scorePlanning(input: PlacementStabilityInput): number {
  let score = 0;

  if (input.placementReviewCurrent === true) score += 25;
  if (input.matchingAssessmentDone === true) score += 25;
  if (input.impactRiskAssessmentDone === true) score += 20;
  if (input.contingencyPlanInPlace === true) score += 15;
  if (input.stayingPutOptionExplored) score += 15;

  return Math.min(100, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: PlacementStabilityInput,
  riskLevel: string,
  breakdowns: number,
): StabilityConcern[] {
  const concerns: StabilityConcern[] = [];

  // Very high disruption risk
  if (riskLevel === "very_high") {
    concerns.push({
      severity: "critical",
      category: "disruption_risk",
      description: "Very high risk of placement disruption — immediate multi-agency planning needed",
    });
  } else if (riskLevel === "high") {
    concerns.push({
      severity: "significant",
      category: "disruption_risk",
      description: "High disruption risk — enhanced stability support needed",
    });
  }

  // Multiple breakdowns
  if (breakdowns >= 3) {
    concerns.push({
      severity: "critical",
      category: "history",
      description: "Pattern of placement breakdowns — specialist assessment of needs required",
    });
  } else if (breakdowns >= 2) {
    concerns.push({
      severity: "significant",
      category: "history",
      description: "Multiple previous breakdowns — stability planning critical",
    });
  }

  // Child doesn't feel settled
  if (input.childFeelsSettled === false && input.currentPlacementDays > 60) {
    concerns.push({
      severity: "significant",
      category: "belonging",
      description: "Child does not feel settled after 2+ months — explore reasons",
    });
  }

  // Child doesn't want to stay
  if (input.childWantsToStay === false) {
    concerns.push({
      severity: "significant",
      category: "voice",
      description: "Child does not want to remain in placement — wishes must inform planning",
    });
  }

  // High incidents + increasing
  if (input.incidentsLast30Days >= 5 && input.incidentsTrend === "increasing") {
    concerns.push({
      severity: "significant",
      category: "incidents",
      description: "Incident frequency increasing — early intervention needed to prevent escalation",
    });
  }

  // No matching assessment
  if (input.matchingAssessmentDone === false) {
    concerns.push({
      severity: "moderate",
      category: "matching",
      description: "No matching assessment completed — placement suitability not formally evidenced",
    });
  }

  // No contingency plan
  if (input.contingencyPlanInPlace === false && (riskLevel === "high" || riskLevel === "very_high")) {
    concerns.push({
      severity: "significant",
      category: "planning",
      description: "No contingency plan despite high disruption risk",
    });
  }

  // No placement review
  if (input.placementReviewCurrent === false) {
    concerns.push({
      severity: "moderate",
      category: "oversight",
      description: "Placement review not current — statutory requirement",
    });
  }

  // Multiple placements — instability
  if (input.totalPlacementsEver >= 4) {
    concerns.push({
      severity: "significant",
      category: "instability",
      description: `${input.totalPlacementsEver} placements — instability impacting attachment and development`,
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: PlacementStabilityInput,
  breakdowns: number,
): StabilityStrength[] {
  const strengths: StabilityStrength[] = [];

  if (input.currentPlacementDays >= 365) {
    strengths.push({
      category: "duration",
      description: "Placement sustained over 12 months — stability achieved",
    });
  } else if (input.currentPlacementDays >= 180) {
    strengths.push({
      category: "duration",
      description: "Placement stable for 6+ months",
    });
  }

  if (input.childFeelsSettled === true && input.childWantsToStay === true) {
    strengths.push({
      category: "belonging",
      description: "Child feels settled and wants to remain — sense of belonging",
    });
  }

  if (input.positiveStaffRelationships === true && input.peerRelationshipsGood === true) {
    strengths.push({
      category: "relationships",
      description: "Positive relationships with staff and peers",
    });
  }

  if (input.childHasRoomPersonalised === true && input.regularRoutineEstablished === true) {
    strengths.push({
      category: "home",
      description: "Personalised space and established routine — feels like home",
    });
  }

  if (breakdowns === 0 && input.totalPlacementsEver <= 2) {
    strengths.push({
      category: "history",
      description: "No placement breakdowns — good stability record",
    });
  }

  if (input.disruptionIndicators.length === 0) {
    strengths.push({
      category: "risk",
      description: "No current disruption indicators",
    });
  }

  if (input.indicatorTrend === "improving") {
    strengths.push({
      category: "trend",
      description: "Disruption indicators improving — stability increasing",
    });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: PlacementStabilityInput,
  riskLevel: string,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 11 — Care planning / avoiding disruption
  const stabilityGood = riskLevel === "low" && input.placementReviewCurrent === true;
  flags.push({
    regulation: "CHR 2015 Reg 11",
    area: "Placement Stability",
    status: stabilityGood ? "met" : riskLevel === "low" || riskLevel === "medium" ? "partially_met" : "not_met",
    detail: stabilityGood
      ? "Placement stable with appropriate oversight"
      : "Placement stability at risk — active planning needed",
  });

  // CHR 2015 Reg 12 — Placement suitability
  flags.push({
    regulation: "CHR 2015 Reg 12",
    area: "Matching & Suitability",
    status: input.matchingAssessmentDone === true ? "met"
      : input.matchingAssessmentDone === null ? "not_evidenced"
      : "not_met",
    detail: input.matchingAssessmentDone === true
      ? "Matching assessment completed"
      : "No matching assessment — placement suitability not formally evidenced",
  });

  // SCCIF — Stability and permanence
  const permanenceGood = input.childFeelsSettled === true && input.currentPlacementDays >= 90;
  flags.push({
    regulation: "SCCIF",
    area: "Stability",
    status: permanenceGood ? "met" : input.currentPlacementDays >= 30 ? "partially_met" : "not_met",
    detail: permanenceGood
      ? "Child settled with sense of permanence"
      : "Stability not yet established",
  });

  // Sufficiency duty
  flags.push({
    regulation: "s22G CA 1989",
    area: "Sufficiency",
    status: input.contingencyPlanInPlace === true || riskLevel === "low" ? "met"
      : input.contingencyPlanInPlace === null ? "not_evidenced"
      : "partially_met",
    detail: input.contingencyPlanInPlace === true
      ? "Contingency planning in place"
      : "Contingency plan not in place should disruption occur",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: PlacementStabilityInput,
  riskLevel: string,
  breakdowns: number,
): string[] {
  const recs: string[] = [];

  if (riskLevel === "very_high" || riskLevel === "high") {
    recs.push("URGENT: Convene placement stability meeting — multi-agency response needed");
  }

  if (input.contingencyPlanInPlace === false && (riskLevel === "high" || riskLevel === "very_high")) {
    recs.push("Develop contingency plan immediately in case of disruption");
  }

  if (input.matchingAssessmentDone === false) {
    recs.push("Complete matching assessment to evidence placement suitability");
  }

  if (input.placementReviewCurrent === false) {
    recs.push("Schedule placement review — overdue");
  }

  if (input.childFeelsSettled === false && input.currentPlacementDays > 30) {
    recs.push("Explore why child does not feel settled — consider environmental or relational factors");
  }

  if (input.childWantsToStay === false) {
    recs.push("Record child's wishes about placement — ensure views inform planning");
  }

  if (input.incidentsTrend === "increasing") {
    recs.push("Review behaviour support plan — incident frequency increasing");
  }

  if (input.disruptionIndicators.includes("running_away")) {
    recs.push("Address missing episodes as placement disruption risk factor");
  }

  if (input.childHasRoomPersonalised === false && input.currentPlacementDays > 14) {
    recs.push("Support child to personalise their room — builds sense of belonging");
  }

  if (input.impactRiskAssessmentDone === false) {
    recs.push("Complete impact risk assessment for placement group");
  }

  if (input.age >= 16 && !input.stayingPutOptionExplored) {
    recs.push("Explore staying-put options for placement continuity");
  }

  if (breakdowns >= 2) {
    recs.push("Commission specialist assessment to understand pattern of placement disruption");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  days: number,
  riskLevel: string,
  totalPlacements: number,
): string {
  const durationDesc = days >= 365 ? `${Math.round(days / 365)} year(s)` :
    days >= 30 ? `${Math.round(days / 30)} months` : `${days} days`;
  return `${childName}: Stability rated ${rating.replace(/_/g, " ")}. Current placement ${durationDesc}, disruption risk ${riskLevel.replace(/_/g, " ")}. ${totalPlacements} placement(s) total.`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

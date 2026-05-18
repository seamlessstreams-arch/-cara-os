// ══════════════════════════════════════════════════════════════════════════════
// PLACEMENT STABILITY INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating the stability of placements at a
// children's home, including planned vs unplanned endings, disruption factors,
// stability support, and outcomes during placement.
//
// Aligned to:
//   - CHR 2015 Reg 36 — Assessment of prospective placements
//   - CHR 2015 Reg 14 — Care planning (matching to meet needs)
//   - SCCIF — Stability and permanence
//   - Children Act 1989 s22C — Duty to provide suitable accommodation
//
// Scoring model (100 points total):
//   - placement_duration_stability (25) — length, unplanned moves, emergency
//   - disruption_management (25)       — anticipation, management, prevention
//   - matching_quality (25)            — child-home fit, peer compatibility
//   - outcomes_during_placement (25)   — education, health, behaviour progress
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type PlacementStatus =
  | "active"
  | "ended_planned"
  | "ended_unplanned"
  | "ended_emergency"
  | "on_notice";

export type EndingReason =
  | "planned_transition"
  | "reunification"
  | "moved_to_family"
  | "moved_to_independence"
  | "placement_breakdown"
  | "safeguarding_concern"
  | "peer_conflict"
  | "absconding"
  | "behaviour_escalation"
  | "needs_changed"
  | "provider_request"
  | "other";

export type DisruptionFactor =
  | "peer_conflict"
  | "staff_relationship"
  | "education_breakdown"
  | "family_contact_issues"
  | "mental_health_crisis"
  | "substance_misuse"
  | "criminal_exploitation"
  | "absconding"
  | "behavioural_escalation"
  | "environmental_change";

export type SupportType =
  | "key_worker_session"
  | "therapeutic_intervention"
  | "family_mediation"
  | "education_support"
  | "risk_management_review"
  | "placement_review_meeting"
  | "multi_agency_meeting"
  | "peer_mediation"
  | "crisis_intervention"
  | "transition_planning";

export type OutcomeArea =
  | "education_engagement"
  | "health_wellbeing"
  | "behaviour_progress"
  | "emotional_regulation"
  | "social_relationships"
  | "independent_skills";

export type MatchingFactor =
  | "age_compatibility"
  | "needs_compatibility"
  | "risk_compatibility"
  | "peer_dynamics"
  | "cultural_needs"
  | "statement_of_purpose_fit"
  | "location_suitability"
  | "therapeutic_alignment";

export type ProgressRating = "significant_improvement" | "some_improvement" | "stable" | "some_decline" | "significant_decline";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface Placement {
  id: string;
  childId: string;
  childName: string;
  childAge: number;
  homeId: string;
  startDate: string;
  endDate?: string;
  status: PlacementStatus;
  endingReason?: EndingReason;
  plannedDurationMonths?: number;
  isEmergencyPlacement: boolean;
  placingAuthority: string;
  keyWorker?: string;
}

export interface DisruptionEvent {
  id: string;
  placementId: string;
  childId: string;
  date: string;
  factors: DisruptionFactor[];
  severity: "low" | "medium" | "high" | "critical";
  wasAnticipated: boolean;
  preventionAttempted: boolean;
  preventionSuccessful: boolean;
  supportProvided: SupportType[];
  outcome: string;
  recordedBy: string;
}

export interface StabilitySupport {
  id: string;
  placementId: string;
  childId: string;
  date: string;
  type: SupportType;
  description: string;
  providedBy: string;
  childEngaged: boolean;
  outcomePositive: boolean;
}

export interface MatchingRecord {
  id: string;
  placementId: string;
  childId: string;
  assessedBy: string;
  assessmentDate: string;
  factors: MatchingFactorScore[];
  overallScore: number; // 1-5
  impactAssessmentCompleted: boolean;
  existingChildrenConsulted: boolean;
  childViewsRecorded: boolean;
  riskAssessmentCompleted: boolean;
  notes?: string;
}

export interface MatchingFactorScore {
  factor: MatchingFactor;
  score: number; // 1-5
  rationale: string;
}

export interface PlacementOutcome {
  id: string;
  placementId: string;
  childId: string;
  childName: string;
  reviewDate: string;
  areas: OutcomeAssessment[];
  overallProgress: ProgressRating;
  educationAttendancePercent?: number;
  healthAppointmentsAttended: boolean;
  carePlanUpToDate: boolean;
  reviewedBy: string;
}

export interface OutcomeAssessment {
  area: OutcomeArea;
  rating: ProgressRating;
  evidence: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface PlacementDurationResult {
  totalPlacements: number;
  activePlacements: number;
  endedPlannedCount: number;
  endedUnplannedCount: number;
  endedEmergencyCount: number;
  onNoticeCount: number;
  averageDurationDays: number;
  plannedEndingRate: number;
  unplannedEndingRate: number;
  emergencyPlacementRate: number;
  longestPlacementDays: number;
  shortestPlacementDays: number;
  endingReasons: Record<string, number>;
}

export interface DisruptionManagementResult {
  totalDisruptions: number;
  anticipatedRate: number;
  preventionAttemptedRate: number;
  preventionSuccessRate: number;
  averageSupportActionsPerDisruption: number;
  severityBreakdown: { low: number; medium: number; high: number; critical: number };
  topFactors: { factor: DisruptionFactor; count: number }[];
  supportProvidedRate: number;
}

export interface MatchingQualityResult {
  totalAssessments: number;
  averageOverallScore: number;
  factorBreakdown: { factor: MatchingFactor; averageScore: number; count: number }[];
  impactAssessmentRate: number;
  childrenConsultedRate: number;
  childViewsRate: number;
  riskAssessmentRate: number;
  fullFactorAssessmentRate: number;
}

export interface OutcomesDuringPlacementResult {
  totalOutcomes: number;
  progressBreakdown: Record<ProgressRating, number>;
  averageEducationAttendance: number;
  healthAppointmentRate: number;
  carePlanUpToDateRate: number;
  areaBreakdown: { area: OutcomeArea; averageRating: number; count: number }[];
  improvementRate: number;
  declineRate: number;
}

export interface ChildStabilityProfile {
  childId: string;
  childName: string;
  childAge: number;
  placementId: string;
  startDate: string;
  endDate?: string;
  status: PlacementStatus;
  durationDays: number;
  disruptionCount: number;
  supportSessionCount: number;
  latestOutcome?: ProgressRating;
  matchingScore?: number;
  keyWorker?: string;
}

export interface PlacementStabilityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  placementDuration: PlacementDurationResult;
  disruptionManagement: DisruptionManagementResult;
  matchingQuality: MatchingQualityResult;
  outcomesDuringPlacement: OutcomesDuringPlacementResult;
  childProfiles: ChildStabilityProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  componentScores: {
    placementDurationStability: number;
    disruptionManagement: number;
    matchingQuality: number;
    outcomesDuringPlacement: number;
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_MATCHING_FACTORS: MatchingFactor[] = [
  "age_compatibility",
  "needs_compatibility",
  "risk_compatibility",
  "peer_dynamics",
  "cultural_needs",
  "statement_of_purpose_fit",
  "location_suitability",
  "therapeutic_alignment",
];

const PROGRESS_RATING_SCORES: Record<ProgressRating, number> = {
  significant_improvement: 5,
  some_improvement: 4,
  stable: 3,
  some_decline: 2,
  significant_decline: 1,
};

// ── Core Function 1: Evaluate Placement Duration & Stability ──────────────

export function evaluatePlacementDuration(
  placements: Placement[],
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): PlacementDurationResult {
  // Include placements that overlap with the period
  const relevantPlacements = placements.filter((p) => {
    const started = p.startDate <= periodEnd;
    const notEndedBeforePeriod = !p.endDate || p.endDate >= periodStart;
    return started && notEndedBeforePeriod;
  });

  const totalPlacements = relevantPlacements.length;
  const activePlacements = relevantPlacements.filter((p) => p.status === "active").length;
  const endedPlannedCount = relevantPlacements.filter((p) => p.status === "ended_planned").length;
  const endedUnplannedCount = relevantPlacements.filter((p) => p.status === "ended_unplanned").length;
  const endedEmergencyCount = relevantPlacements.filter((p) => p.status === "ended_emergency").length;
  const onNoticeCount = relevantPlacements.filter((p) => p.status === "on_notice").length;

  const endedPlacements = relevantPlacements.filter(
    (p) => p.status === "ended_planned" || p.status === "ended_unplanned" || p.status === "ended_emergency",
  );
  const totalEnded = endedPlacements.length;

  const plannedEndingRate =
    totalEnded > 0
      ? Math.round((endedPlannedCount / totalEnded) * 100)
      : 0;

  const unplannedEndingRate =
    totalEnded > 0
      ? Math.round(((endedUnplannedCount + endedEmergencyCount) / totalEnded) * 100)
      : 0;

  const emergencyPlacementRate =
    totalPlacements > 0
      ? Math.round((relevantPlacements.filter((p) => p.isEmergencyPlacement).length / totalPlacements) * 100)
      : 0;

  // Duration calculations
  const durations = relevantPlacements.map((p) => {
    const end = p.endDate ?? referenceDate;
    return daysBetween(p.startDate, end);
  });

  const averageDurationDays =
    durations.length > 0
      ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10
      : 0;

  const longestPlacementDays = durations.length > 0 ? Math.max(...durations) : 0;
  const shortestPlacementDays = durations.length > 0 ? Math.min(...durations) : 0;

  // Ending reasons
  const endingReasons: Record<string, number> = {};
  relevantPlacements
    .filter((p) => p.endingReason)
    .forEach((p) => {
      endingReasons[p.endingReason!] = (endingReasons[p.endingReason!] || 0) + 1;
    });

  return {
    totalPlacements,
    activePlacements,
    endedPlannedCount,
    endedUnplannedCount,
    endedEmergencyCount,
    onNoticeCount,
    averageDurationDays,
    plannedEndingRate,
    unplannedEndingRate,
    emergencyPlacementRate,
    longestPlacementDays,
    shortestPlacementDays,
    endingReasons,
  };
}

// ── Core Function 2: Evaluate Disruption Management ───────────────────────

export function evaluateDisruptionManagement(
  disruptions: DisruptionEvent[],
  periodStart: string,
  periodEnd: string,
): DisruptionManagementResult {
  const periodDisruptions = disruptions.filter(
    (d) => d.date >= periodStart && d.date <= periodEnd,
  );

  const totalDisruptions = periodDisruptions.length;

  const anticipatedRate =
    totalDisruptions > 0
      ? Math.round((periodDisruptions.filter((d) => d.wasAnticipated).length / totalDisruptions) * 100)
      : 0;

  const preventionAttemptedRate =
    totalDisruptions > 0
      ? Math.round((periodDisruptions.filter((d) => d.preventionAttempted).length / totalDisruptions) * 100)
      : 0;

  const preventionAttempted = periodDisruptions.filter((d) => d.preventionAttempted);
  const preventionSuccessRate =
    preventionAttempted.length > 0
      ? Math.round((preventionAttempted.filter((d) => d.preventionSuccessful).length / preventionAttempted.length) * 100)
      : 0;

  const totalSupportActions = periodDisruptions.reduce(
    (s, d) => s + d.supportProvided.length,
    0,
  );
  const averageSupportActionsPerDisruption =
    totalDisruptions > 0
      ? Math.round((totalSupportActions / totalDisruptions) * 10) / 10
      : 0;

  const severityBreakdown = {
    low: periodDisruptions.filter((d) => d.severity === "low").length,
    medium: periodDisruptions.filter((d) => d.severity === "medium").length,
    high: periodDisruptions.filter((d) => d.severity === "high").length,
    critical: periodDisruptions.filter((d) => d.severity === "critical").length,
  };

  // Top factors
  const factorCounts = new Map<DisruptionFactor, number>();
  for (const disruption of periodDisruptions) {
    for (const factor of disruption.factors) {
      factorCounts.set(factor, (factorCounts.get(factor) || 0) + 1);
    }
  }
  const topFactors = Array.from(factorCounts.entries())
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);

  const supportProvidedRate =
    totalDisruptions > 0
      ? Math.round((periodDisruptions.filter((d) => d.supportProvided.length > 0).length / totalDisruptions) * 100)
      : 0;

  return {
    totalDisruptions,
    anticipatedRate,
    preventionAttemptedRate,
    preventionSuccessRate,
    averageSupportActionsPerDisruption,
    severityBreakdown,
    topFactors,
    supportProvidedRate,
  };
}

// ── Core Function 3: Evaluate Matching Quality ────────────────────────────

export function evaluateMatchingQuality(
  matchingRecords: MatchingRecord[],
): MatchingQualityResult {
  const totalAssessments = matchingRecords.length;

  const averageOverallScore =
    totalAssessments > 0
      ? Math.round(
          (matchingRecords.reduce((s, m) => s + m.overallScore, 0) / totalAssessments) * 10,
        ) / 10
      : 0;

  // Factor-level breakdown
  const factorMap = new Map<MatchingFactor, { total: number; count: number }>();
  for (const record of matchingRecords) {
    for (const score of record.factors) {
      const existing = factorMap.get(score.factor) || { total: 0, count: 0 };
      existing.total += score.score;
      existing.count += 1;
      factorMap.set(score.factor, existing);
    }
  }

  const factorBreakdown = ALL_MATCHING_FACTORS
    .filter((f) => factorMap.has(f))
    .map((f) => {
      const data = factorMap.get(f)!;
      return {
        factor: f,
        averageScore: Math.round((data.total / data.count) * 10) / 10,
        count: data.count,
      };
    });

  const impactAssessmentRate =
    totalAssessments > 0
      ? Math.round((matchingRecords.filter((m) => m.impactAssessmentCompleted).length / totalAssessments) * 100)
      : 0;

  const childrenConsultedRate =
    totalAssessments > 0
      ? Math.round((matchingRecords.filter((m) => m.existingChildrenConsulted).length / totalAssessments) * 100)
      : 0;

  const childViewsRate =
    totalAssessments > 0
      ? Math.round((matchingRecords.filter((m) => m.childViewsRecorded).length / totalAssessments) * 100)
      : 0;

  const riskAssessmentRate =
    totalAssessments > 0
      ? Math.round((matchingRecords.filter((m) => m.riskAssessmentCompleted).length / totalAssessments) * 100)
      : 0;

  const fullFactorAssessmentRate =
    totalAssessments > 0
      ? Math.round(
          (matchingRecords.filter((m) => m.factors.length >= ALL_MATCHING_FACTORS.length).length /
            totalAssessments) *
            100,
        )
      : 0;

  return {
    totalAssessments,
    averageOverallScore,
    factorBreakdown,
    impactAssessmentRate,
    childrenConsultedRate,
    childViewsRate,
    riskAssessmentRate,
    fullFactorAssessmentRate,
  };
}

// ── Core Function 4: Evaluate Outcomes During Placement ───────────────────

export function evaluateOutcomesDuringPlacement(
  outcomes: PlacementOutcome[],
): OutcomesDuringPlacementResult {
  const totalOutcomes = outcomes.length;

  // Progress breakdown
  const progressBreakdown: Record<ProgressRating, number> = {
    significant_improvement: 0,
    some_improvement: 0,
    stable: 0,
    some_decline: 0,
    significant_decline: 0,
  };
  for (const outcome of outcomes) {
    progressBreakdown[outcome.overallProgress] += 1;
  }

  // Education attendance
  const educationOutcomes = outcomes.filter(
    (o) => o.educationAttendancePercent !== undefined && o.educationAttendancePercent !== null,
  );
  const averageEducationAttendance =
    educationOutcomes.length > 0
      ? Math.round(
          (educationOutcomes.reduce((s, o) => s + o.educationAttendancePercent!, 0) /
            educationOutcomes.length) *
            10,
        ) / 10
      : 0;

  const healthAppointmentRate =
    totalOutcomes > 0
      ? Math.round(
          (outcomes.filter((o) => o.healthAppointmentsAttended).length / totalOutcomes) * 100,
        )
      : 0;

  const carePlanUpToDateRate =
    totalOutcomes > 0
      ? Math.round(
          (outcomes.filter((o) => o.carePlanUpToDate).length / totalOutcomes) * 100,
        )
      : 0;

  // Area breakdown
  const areaMap = new Map<OutcomeArea, { total: number; count: number }>();
  for (const outcome of outcomes) {
    for (const assessment of outcome.areas) {
      const existing = areaMap.get(assessment.area) || { total: 0, count: 0 };
      existing.total += PROGRESS_RATING_SCORES[assessment.rating];
      existing.count += 1;
      areaMap.set(assessment.area, existing);
    }
  }

  const allAreas: OutcomeArea[] = [
    "education_engagement",
    "health_wellbeing",
    "behaviour_progress",
    "emotional_regulation",
    "social_relationships",
    "independent_skills",
  ];

  const areaBreakdown = allAreas
    .filter((a) => areaMap.has(a))
    .map((a) => {
      const data = areaMap.get(a)!;
      return {
        area: a,
        averageRating: Math.round((data.total / data.count) * 10) / 10,
        count: data.count,
      };
    });

  const improvementRate =
    totalOutcomes > 0
      ? Math.round(
          ((progressBreakdown.significant_improvement + progressBreakdown.some_improvement) /
            totalOutcomes) *
            100,
        )
      : 0;

  const declineRate =
    totalOutcomes > 0
      ? Math.round(
          ((progressBreakdown.some_decline + progressBreakdown.significant_decline) /
            totalOutcomes) *
            100,
        )
      : 0;

  return {
    totalOutcomes,
    progressBreakdown,
    averageEducationAttendance,
    healthAppointmentRate,
    carePlanUpToDateRate,
    areaBreakdown,
    improvementRate,
    declineRate,
  };
}

// ── Build Child Stability Profiles ────────────────────────────────────────

function buildChildProfiles(
  placements: Placement[],
  disruptions: DisruptionEvent[],
  supports: StabilitySupport[],
  outcomes: PlacementOutcome[],
  matchingRecords: MatchingRecord[],
  referenceDate: string,
): ChildStabilityProfile[] {
  return placements.map((placement) => {
    const end = placement.endDate ?? referenceDate;
    const durationDays = daysBetween(placement.startDate, end);
    const disruptionCount = disruptions.filter((d) => d.placementId === placement.id).length;
    const supportSessionCount = supports.filter((s) => s.placementId === placement.id).length;

    const childOutcomes = outcomes
      .filter((o) => o.placementId === placement.id)
      .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate));
    const latestOutcome = childOutcomes.length > 0 ? childOutcomes[0].overallProgress : undefined;

    const matchingRecord = matchingRecords.find((m) => m.placementId === placement.id);
    const matchingScore = matchingRecord ? matchingRecord.overallScore : undefined;

    return {
      childId: placement.childId,
      childName: placement.childName,
      childAge: placement.childAge,
      placementId: placement.id,
      startDate: placement.startDate,
      endDate: placement.endDate,
      status: placement.status,
      durationDays,
      disruptionCount,
      supportSessionCount,
      latestOutcome,
      matchingScore,
      keyWorker: placement.keyWorker,
    };
  });
}

// ── Main Intelligence Function ────────────────────────────────────────────

export function generatePlacementStabilityIntelligence(
  placements: Placement[],
  disruptions: DisruptionEvent[],
  supports: StabilitySupport[],
  matchingRecords: MatchingRecord[],
  outcomes: PlacementOutcome[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): PlacementStabilityIntelligence {
  const placementDuration = evaluatePlacementDuration(placements, periodStart, periodEnd, referenceDate);
  const disruptionManagement = evaluateDisruptionManagement(disruptions, periodStart, periodEnd);
  const matchingQuality = evaluateMatchingQuality(matchingRecords);
  const outcomesDuringPlacement = evaluateOutcomesDuringPlacement(outcomes);
  const childProfiles = buildChildProfiles(placements, disruptions, supports, outcomes, matchingRecords, referenceDate);

  const componentScores = calculateComponentScores(
    placementDuration,
    disruptionManagement,
    matchingQuality,
    outcomesDuringPlacement,
  );

  const overallScore = Math.round(
    componentScores.placementDurationStability +
      componentScores.disruptionManagement +
      componentScores.matchingQuality +
      componentScores.outcomesDuringPlacement,
  );

  const rating = getOverallRating(overallScore);

  const strengths = generateStrengths(
    placementDuration,
    disruptionManagement,
    matchingQuality,
    outcomesDuringPlacement,
  );
  const areasForImprovement = generateAreasForImprovement(
    placementDuration,
    disruptionManagement,
    matchingQuality,
    outcomesDuringPlacement,
  );
  const actions = generateActions(
    placementDuration,
    disruptionManagement,
    matchingQuality,
    outcomesDuringPlacement,
  );
  const regulatoryLinks = generateRegulatoryLinks(
    placementDuration,
    disruptionManagement,
    matchingQuality,
    outcomesDuringPlacement,
  );

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    placementDuration,
    disruptionManagement,
    matchingQuality,
    outcomesDuringPlacement,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
    componentScores,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateComponentScores(
  pd: PlacementDurationResult,
  dm: DisruptionManagementResult,
  mq: MatchingQualityResult,
  op: OutcomesDuringPlacementResult,
): {
  placementDurationStability: number;
  disruptionManagement: number;
  matchingQuality: number;
  outcomesDuringPlacement: number;
} {
  // Placement duration stability: max 25 points
  let pdScore = 0;
  if (pd.totalPlacements > 0) {
    // Planned ending rate: 10 pts — higher is better (of those ended, how many were planned?)
    const endedTotal = pd.endedPlannedCount + pd.endedUnplannedCount + pd.endedEmergencyCount;
    if (endedTotal > 0) {
      pdScore += (pd.plannedEndingRate / 100) * 10;
    } else {
      // No endings yet — all active is good
      pdScore += 10;
    }

    // Low emergency placement rate: 5 pts — invert: 0% emergency = 5pts, 100% = 0pts
    pdScore += ((100 - pd.emergencyPlacementRate) / 100) * 5;

    // Duration stability: 10 pts — longer average = more stable
    // Benchmark: 180+ days = full marks, sliding scale below
    const durationScore = Math.min(pd.averageDurationDays / 180, 1);
    pdScore += durationScore * 10;
  } else {
    pdScore = 0;
  }

  // Disruption management: max 25 points
  let dmScore = 0;
  if (dm.totalDisruptions > 0) {
    // Anticipation rate: 8 pts
    dmScore += (dm.anticipatedRate / 100) * 8;
    // Prevention attempted rate: 7 pts
    dmScore += (dm.preventionAttemptedRate / 100) * 7;
    // Prevention success rate: 5 pts
    dmScore += (dm.preventionSuccessRate / 100) * 5;
    // Support provided rate: 5 pts
    dmScore += (dm.supportProvidedRate / 100) * 5;
  } else {
    // No disruptions — perfect stability
    dmScore = 25;
  }

  // Matching quality: max 25 points
  let mqScore = 0;
  if (mq.totalAssessments > 0) {
    // Overall matching score: 8 pts
    mqScore += (Math.min(mq.averageOverallScore, 5) / 5) * 8;
    // Impact assessment rate: 5 pts
    mqScore += (mq.impactAssessmentRate / 100) * 5;
    // Children consulted rate: 4 pts
    mqScore += (mq.childrenConsultedRate / 100) * 4;
    // Child views rate: 4 pts
    mqScore += (mq.childViewsRate / 100) * 4;
    // Risk assessment rate: 4 pts
    mqScore += (mq.riskAssessmentRate / 100) * 4;
  } else {
    mqScore = 0;
  }

  // Outcomes during placement: max 25 points
  let opScore = 0;
  if (op.totalOutcomes > 0) {
    // Improvement rate: 10 pts
    opScore += (op.improvementRate / 100) * 10;
    // Education attendance: 5 pts
    opScore += (Math.min(op.averageEducationAttendance, 100) / 100) * 5;
    // Health appointments: 5 pts
    opScore += (op.healthAppointmentRate / 100) * 5;
    // Care plan up to date: 5 pts
    opScore += (op.carePlanUpToDateRate / 100) * 5;
  } else {
    opScore = 0;
  }

  return {
    placementDurationStability: Math.round(pdScore * 10) / 10,
    disruptionManagement: Math.round(dmScore * 10) / 10,
    matchingQuality: Math.round(mqScore * 10) / 10,
    outcomesDuringPlacement: Math.round(opScore * 10) / 10,
  };
}

function getOverallRating(
  score: number,
): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateStrengths(
  pd: PlacementDurationResult,
  dm: DisruptionManagementResult,
  mq: MatchingQualityResult,
  op: OutcomesDuringPlacementResult,
): string[] {
  const strengths: string[] = [];

  if (pd.plannedEndingRate >= 80 && (pd.endedPlannedCount + pd.endedUnplannedCount + pd.endedEmergencyCount) > 0) {
    strengths.push(
      "Excellent placement stability: over 80% of endings are planned, demonstrating effective transition management",
    );
  }

  if (pd.averageDurationDays >= 180 && pd.totalPlacements > 0) {
    strengths.push(
      `Strong placement duration with an average of ${pd.averageDurationDays} days, supporting continuity and permanence`,
    );
  }

  if (pd.emergencyPlacementRate === 0 && pd.totalPlacements > 0) {
    strengths.push(
      "No emergency placements in the period, indicating well-planned admissions processes",
    );
  }

  if (dm.anticipatedRate >= 80 && dm.totalDisruptions > 0) {
    strengths.push(
      "Disruptions are consistently anticipated, showing proactive risk awareness and management",
    );
  }

  if (dm.preventionSuccessRate >= 70 && dm.totalDisruptions > 0) {
    strengths.push(
      "High prevention success rate: staff effectively intervene to prevent placement disruption",
    );
  }

  if (dm.supportProvidedRate >= 90 && dm.totalDisruptions > 0) {
    strengths.push(
      "Support is consistently provided during disruptions, ensuring children receive timely intervention",
    );
  }

  if (dm.totalDisruptions === 0 && pd.totalPlacements > 0) {
    strengths.push(
      "No disruption events recorded in the period, indicating a stable and well-managed home environment",
    );
  }

  if (mq.averageOverallScore >= 4 && mq.totalAssessments > 0) {
    strengths.push(
      "High-quality matching assessments demonstrate careful consideration of each child's needs against the home's offer",
    );
  }

  if (mq.impactAssessmentRate >= 90 && mq.totalAssessments > 0) {
    strengths.push(
      "Impact assessments consistently completed before placement, supporting Reg 36 compliance",
    );
  }

  if (mq.childrenConsultedRate >= 90 && mq.totalAssessments > 0) {
    strengths.push(
      "Existing children consistently consulted during matching, promoting child-centred practice",
    );
  }

  if (mq.childViewsRate >= 90 && mq.totalAssessments > 0) {
    strengths.push(
      "Children's views consistently recorded in matching assessments, supporting participation rights",
    );
  }

  if (op.improvementRate >= 70 && op.totalOutcomes > 0) {
    strengths.push(
      "Strong outcomes: over 70% of children showing improvement during placement, evidencing effective care",
    );
  }

  if (op.averageEducationAttendance >= 90 && op.totalOutcomes > 0) {
    strengths.push(
      `Excellent education engagement with ${op.averageEducationAttendance}% average attendance during placement`,
    );
  }

  if (op.healthAppointmentRate >= 90 && op.totalOutcomes > 0) {
    strengths.push(
      "Health appointments consistently attended, ensuring children's health needs are met during placement",
    );
  }

  if (op.carePlanUpToDateRate === 100 && op.totalOutcomes > 0) {
    strengths.push(
      "All care plans are up to date, meeting Reg 14 requirements for ongoing care planning",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  pd: PlacementDurationResult,
  dm: DisruptionManagementResult,
  mq: MatchingQualityResult,
  op: OutcomesDuringPlacementResult,
): string[] {
  const areas: string[] = [];

  if (pd.unplannedEndingRate > 40 && (pd.endedPlannedCount + pd.endedUnplannedCount + pd.endedEmergencyCount) > 0) {
    areas.push(
      "High rate of unplanned endings: review placement support and disruption prevention strategies",
    );
  }

  if (pd.emergencyPlacementRate > 30 && pd.totalPlacements > 0) {
    areas.push(
      "High proportion of emergency placements: strengthen planned admission processes to reduce crisis placements",
    );
  }

  if (pd.averageDurationDays < 90 && pd.totalPlacements > 0) {
    areas.push(
      `Short average placement duration of ${pd.averageDurationDays} days: investigate factors affecting stability and permanence`,
    );
  }

  if (dm.anticipatedRate < 60 && dm.totalDisruptions > 0) {
    areas.push(
      "Disruptions not consistently anticipated: strengthen risk monitoring and early warning systems",
    );
  }

  if (dm.preventionAttemptedRate < 70 && dm.totalDisruptions > 0) {
    areas.push(
      "Prevention not consistently attempted when disruptions arise: develop proactive intervention protocols",
    );
  }

  if (dm.preventionSuccessRate < 50 && dm.totalDisruptions > 0) {
    areas.push(
      "Low prevention success rate: review effectiveness of disruption prevention strategies and staff training",
    );
  }

  if (dm.supportProvidedRate < 70 && dm.totalDisruptions > 0) {
    areas.push(
      "Support not consistently provided during disruptions: ensure all disruption events trigger appropriate support response",
    );
  }

  if (mq.averageOverallScore < 3 && mq.totalAssessments > 0) {
    areas.push(
      "Low average matching scores suggest placements may not be well-matched to the home's purpose and capabilities",
    );
  }

  if (mq.impactAssessmentRate < 70 && mq.totalAssessments > 0) {
    areas.push(
      "Impact assessments not consistently completed: ensure Reg 36 compliance by assessing impact before every placement",
    );
  }

  if (mq.childrenConsultedRate < 70 && mq.totalAssessments > 0) {
    areas.push(
      "Existing children not consistently consulted during matching: develop routine consultation processes",
    );
  }

  if (mq.childViewsRate < 70 && mq.totalAssessments > 0) {
    areas.push(
      "Children's views not consistently captured in matching: strengthen child participation in placement decisions",
    );
  }

  if (mq.riskAssessmentRate < 70 && mq.totalAssessments > 0) {
    areas.push(
      "Risk assessments not consistently completed for matching: ensure all placements have documented risk assessments",
    );
  }

  if (op.improvementRate < 50 && op.totalOutcomes > 0) {
    areas.push(
      "Less than half of children showing improvement during placement: review care planning and intervention effectiveness",
    );
  }

  if (op.declineRate > 30 && op.totalOutcomes > 0) {
    areas.push(
      "Significant decline rate observed during placement: urgently review care strategies and individual support plans",
    );
  }

  if (op.averageEducationAttendance < 70 && op.totalOutcomes > 0) {
    areas.push(
      `Education attendance at ${op.averageEducationAttendance}%: strengthen education support and engagement strategies`,
    );
  }

  if (op.healthAppointmentRate < 70 && op.totalOutcomes > 0) {
    areas.push(
      "Health appointments not consistently attended: review health advocacy and appointment support processes",
    );
  }

  if (op.carePlanUpToDateRate < 80 && op.totalOutcomes > 0) {
    areas.push(
      "Care plans not consistently up to date: implement regular review schedule per Reg 14",
    );
  }

  return areas;
}

function generateActions(
  pd: PlacementDurationResult,
  dm: DisruptionManagementResult,
  mq: MatchingQualityResult,
  op: OutcomesDuringPlacementResult,
): string[] {
  const actions: string[] = [];

  if (pd.onNoticeCount > 0) {
    actions.push(
      `Review ${pd.onNoticeCount} placement(s) currently on notice to ensure planned transition support is in place`,
    );
  }

  if (pd.unplannedEndingRate > 30 && (pd.endedPlannedCount + pd.endedUnplannedCount + pd.endedEmergencyCount) > 0) {
    actions.push(
      "Conduct disruption analysis for all unplanned endings to identify common factors and develop prevention strategies",
    );
  }

  if (pd.emergencyPlacementRate > 20 && pd.totalPlacements > 0) {
    actions.push(
      "Review emergency placement procedures and strengthen planned admission pathways to reduce crisis placements",
    );
  }

  if (dm.anticipatedRate < 70 && dm.totalDisruptions > 0) {
    actions.push(
      "Implement early warning indicator system to improve disruption anticipation and enable proactive intervention",
    );
  }

  if (dm.preventionAttemptedRate < 80 && dm.totalDisruptions > 0) {
    actions.push(
      "Develop disruption prevention protocol requiring documented intervention for every identified disruption risk",
    );
  }

  if (dm.severityBreakdown.critical > 0) {
    actions.push(
      `Review ${dm.severityBreakdown.critical} critical disruption event(s) at the next team meeting to identify systemic issues`,
    );
  }

  if (mq.impactAssessmentRate < 100 && mq.totalAssessments > 0) {
    actions.push(
      "Ensure impact assessments are completed for all prospective placements before admission per Reg 36",
    );
  }

  if (mq.childrenConsultedRate < 80 && mq.totalAssessments > 0) {
    actions.push(
      "Establish routine consultation with existing children before each new placement decision",
    );
  }

  if (mq.fullFactorAssessmentRate < 80 && mq.totalAssessments > 0) {
    actions.push(
      "Implement comprehensive matching checklist covering all 8 factors for every placement assessment",
    );
  }

  if (op.declineRate > 20 && op.totalOutcomes > 0) {
    actions.push(
      "Convene multi-agency review for children showing decline to adjust care plans and interventions",
    );
  }

  if (op.averageEducationAttendance < 80 && op.totalOutcomes > 0) {
    actions.push(
      "Strengthen education support: implement daily attendance monitoring and liaise with designated teachers",
    );
  }

  if (op.carePlanUpToDateRate < 100 && op.totalOutcomes > 0) {
    actions.push(
      "Schedule care plan reviews to ensure all plans are current and reflect each child's evolving needs",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Placement stability practice is operating within required standards.",
    );
  }

  return actions;
}

function generateRegulatoryLinks(
  pd: PlacementDurationResult,
  dm: DisruptionManagementResult,
  mq: MatchingQualityResult,
  op: OutcomesDuringPlacementResult,
): string[] {
  const links: string[] = [];

  // Always relevant
  links.push(
    "CHR 2015 Reg 36 — Assessment of prospective placements: registered person must assess suitability before placement",
  );
  links.push(
    "CHR 2015 Reg 14 — Care planning: each child must have an up-to-date care plan reviewed regularly",
  );

  links.push(
    "SCCIF — Stability and permanence: children benefit from stable, consistent placements that meet their needs",
  );

  links.push(
    "Children Act 1989 s22C — Duty to provide accommodation that meets the child's needs and is in their best interests",
  );

  if (mq.totalAssessments > 0) {
    links.push(
      "CHR 2015 Reg 14 — Matching: placement decisions must consider the child's needs, wishes, and the impact on other children",
    );
  }

  if (dm.totalDisruptions > 0) {
    links.push(
      "SCCIF — How well children are helped and protected: disruptions are managed to maintain placement stability",
    );
  }

  if (pd.unplannedEndingRate > 0 && (pd.endedPlannedCount + pd.endedUnplannedCount + pd.endedEmergencyCount) > 0) {
    links.push(
      "CHR 2015 Reg 36 — Unplanned endings must be reviewed to understand contributing factors and prevent recurrence",
    );
  }

  if (op.totalOutcomes > 0) {
    links.push(
      "SCCIF — Experience and progress: children make measurable progress in education, health, and behaviour during placement",
    );
  }

  return links;
}

// ── Labels ─────────────────────────────────────────────────────────────────

export function getPlacementStatusLabel(status: PlacementStatus): string {
  const labels: Record<PlacementStatus, string> = {
    active: "Active",
    ended_planned: "Ended (Planned)",
    ended_unplanned: "Ended (Unplanned)",
    ended_emergency: "Ended (Emergency)",
    on_notice: "On Notice",
  };
  return labels[status] ?? status;
}

export function getEndingReasonLabel(reason: EndingReason): string {
  const labels: Record<EndingReason, string> = {
    planned_transition: "Planned Transition",
    reunification: "Reunification",
    moved_to_family: "Moved to Family",
    moved_to_independence: "Moved to Independence",
    placement_breakdown: "Placement Breakdown",
    safeguarding_concern: "Safeguarding Concern",
    peer_conflict: "Peer Conflict",
    absconding: "Absconding",
    behaviour_escalation: "Behaviour Escalation",
    needs_changed: "Needs Changed",
    provider_request: "Provider Request",
    other: "Other",
  };
  return labels[reason] ?? reason;
}

export function getDisruptionFactorLabel(factor: DisruptionFactor): string {
  const labels: Record<DisruptionFactor, string> = {
    peer_conflict: "Peer Conflict",
    staff_relationship: "Staff Relationship",
    education_breakdown: "Education Breakdown",
    family_contact_issues: "Family Contact Issues",
    mental_health_crisis: "Mental Health Crisis",
    substance_misuse: "Substance Misuse",
    criminal_exploitation: "Criminal Exploitation",
    absconding: "Absconding",
    behavioural_escalation: "Behavioural Escalation",
    environmental_change: "Environmental Change",
  };
  return labels[factor] ?? factor;
}

export function getSupportTypeLabel(type: SupportType): string {
  const labels: Record<SupportType, string> = {
    key_worker_session: "Key Worker Session",
    therapeutic_intervention: "Therapeutic Intervention",
    family_mediation: "Family Mediation",
    education_support: "Education Support",
    risk_management_review: "Risk Management Review",
    placement_review_meeting: "Placement Review Meeting",
    multi_agency_meeting: "Multi-Agency Meeting",
    peer_mediation: "Peer Mediation",
    crisis_intervention: "Crisis Intervention",
    transition_planning: "Transition Planning",
  };
  return labels[type] ?? type;
}

export function getOutcomeAreaLabel(area: OutcomeArea): string {
  const labels: Record<OutcomeArea, string> = {
    education_engagement: "Education Engagement",
    health_wellbeing: "Health & Wellbeing",
    behaviour_progress: "Behaviour Progress",
    emotional_regulation: "Emotional Regulation",
    social_relationships: "Social Relationships",
    independent_skills: "Independent Skills",
  };
  return labels[area] ?? area;
}

export function getProgressRatingLabel(rating: ProgressRating): string {
  const labels: Record<ProgressRating, string> = {
    significant_improvement: "Significant Improvement",
    some_improvement: "Some Improvement",
    stable: "Stable",
    some_decline: "Some Decline",
    significant_decline: "Significant Decline",
  };
  return labels[rating] ?? rating;
}

export function getMatchingFactorLabel(factor: MatchingFactor): string {
  const labels: Record<MatchingFactor, string> = {
    age_compatibility: "Age Compatibility",
    needs_compatibility: "Needs Compatibility",
    risk_compatibility: "Risk Compatibility",
    peer_dynamics: "Peer Dynamics",
    cultural_needs: "Cultural Needs",
    statement_of_purpose_fit: "Statement of Purpose Fit",
    location_suitability: "Location Suitability",
    therapeutic_alignment: "Therapeutic Alignment",
  };
  return labels[factor] ?? factor;
}

// ── Utility ────────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(dateB).getTime() - new Date(dateA).getTime()) / msPerDay,
  );
}

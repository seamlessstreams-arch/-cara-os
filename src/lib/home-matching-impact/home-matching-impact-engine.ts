// ══════════════════════════════════════════════════════════════════════════════
// HOME MATCHING IMPACT INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating the impact of new admissions on
// existing residents and the quality of matching assessments.
//
// Ofsted frequently scrutinises whether homes properly assess compatibility
// before admitting a new child and monitor the impact afterward.
//
// Aligned to:
//   - CHR 2015 Reg 14 — Admissions: matching, risk assessment, impact analysis
//   - CHR 2015 Reg 3  — Statement of purpose: matching against home's purpose
//   - CHR 2015 Reg 5  — Engaging with the local community
//   - SCCIF — Experience and progress of children and young people
//   - DfE Guide to Children's Homes Regulations 2015
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";
import { below, meets, rateOf, weightedMeanOf } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type AdmissionType =
  | "planned"
  | "emergency"
  | "respite"
  | "step_down"
  | "step_up";

export type MatchingDecision =
  | "proceed"
  | "proceed_with_conditions"
  | "defer"
  | "decline";

export type ImpactArea =
  | "behaviour"
  | "emotional_wellbeing"
  | "peer_dynamics"
  | "routines"
  | "education"
  | "safety"
  | "staffing"
  | "space";

export type ImpactLevel =
  | "positive"
  | "neutral"
  | "negative"
  | "significant_negative";

export type MonitoringFrequency =
  | "daily"
  | "weekly"
  | "fortnightly"
  | "monthly";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MatchingAssessment {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  admissionType: AdmissionType;
  assessedBy: string;
  existingChildrenConsulted: boolean;
  existingChildrenIds: string[];
  riskFactorsIdentified: string[];
  protectiveFactors: string[];
  compatibilityScore: number; // 1-10
  decision: MatchingDecision;
  conditionsApplied: string[];
  reviewDate: string;
}

export interface ImpactMonitoring {
  id: string;
  homeId: string;
  newChildId: string;
  existingChildId: string;
  existingChildName: string;
  monitoringDate: string;
  impactArea: ImpactArea;
  impactLevel: ImpactLevel;
  evidence: string;
  mitigationAction: string;
  resolved: boolean;
}

export interface ResidentConsultation {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  consultationDate: string;
  informedAboutNewResident: boolean;
  viewsSought: boolean;
  viewsSummary: string;
  viewsActedUpon: boolean;
}

export interface AdmissionOutcome {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  admissionDate: string;
  matchingAssessmentId: string;
  placementStable: boolean;
  daysToSettle: number;
  disruptionOccurred: boolean;
  disruptionReason: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface MatchingQualityResult {
  totalAssessments: number;
  averageCompatibilityScore: number;
  assessmentCompletionRate: number;
  existingChildrenConsultedRate: number;
  conditionsAppliedRate: number | null;   // null when no admission proceeded with conditions
  decisionBreakdown: Record<MatchingDecision, number>;
  admissionTypeBreakdown: Record<AdmissionType, number>;
  averageRiskFactors: number;
  averageProtectiveFactors: number;
  reviewDateSetRate: number;
}

export interface ImpactMonitoringResult {
  totalMonitoringRecords: number;
  negativeImpactRate: number;
  significantNegativeRate: number;
  positiveImpactRate: number;
  impactAreaBreakdown: Record<ImpactArea, number>;
  resolutionRate: number | null;          // null when no negative impact was recorded
  mitigationProvidedRate: number | null;  // null when no negative impact was recorded
  averageMonitoringPerChild: number;
  monitoringFrequencyAdequate: boolean;
}

export interface ResidentConsultationResult {
  totalConsultations: number;
  informedRate: number;
  viewsSoughtRate: number;
  viewsActedUponRate: number;
  consultationCompletionRate: number;
  averageConsultationsPerAdmission: number;
}

export interface AdmissionOutcomeResult {
  totalOutcomes: number;
  placementStabilityRate: number;
  averageDaysToSettle: number;
  disruptionRate: number;
  disruptionReasons: Record<string, number>;
  matchingAssessmentLinkedRate: number;
}

export interface HomeMatchingImpactIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  matchingQuality: MatchingQualityResult;
  impactMonitoring: ImpactMonitoringResult;
  residentConsultation: ResidentConsultationResult;
  admissionOutcomes: AdmissionOutcomeResult;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  componentScores: {
    matchingQuality: number;
    impactMonitoring: number;
    residentConsultation: number;
    admissionOutcomes: number;
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_IMPACT_AREAS: ImpactArea[] = [
  "behaviour",
  "emotional_wellbeing",
  "peer_dynamics",
  "routines",
  "education",
  "safety",
  "staffing",
  "space",
];

const ALL_ADMISSION_TYPES: AdmissionType[] = [
  "planned",
  "emergency",
  "respite",
  "step_down",
  "step_up",
];

const ALL_MATCHING_DECISIONS: MatchingDecision[] = [
  "proceed",
  "proceed_with_conditions",
  "defer",
  "decline",
];

// ── Core Function 1: Evaluate Matching Quality ────────────────────────────

export function evaluateMatchingQuality(
  assessments: MatchingAssessment[],
  periodStart: string,
  periodEnd: string,
): MatchingQualityResult {
  const periodAssessments = assessments.filter(
    (a) => withinPeriod(a.assessmentDate, periodStart, periodEnd),
  );

  const totalAssessments = periodAssessments.length;

  const averageCompatibilityScore =
    totalAssessments > 0
      ? Math.round(
          (periodAssessments.reduce((s, a) => s + a.compatibilityScore, 0) /
            totalAssessments) *
            10,
        ) / 10
      : 0;

  // Assessment completion rate: assessments that have a decision (not deferred without resolution)
  const completedAssessments = periodAssessments.filter(
    (a) => a.decision === "proceed" || a.decision === "proceed_with_conditions" || a.decision === "decline",
  );
  const assessmentCompletionRate =
    totalAssessments > 0
      ? Math.round((completedAssessments.length / totalAssessments) * 100)
      : 0;

  // Existing children consulted rate
  const existingChildrenConsultedRate =
    totalAssessments > 0
      ? Math.round(
          (periodAssessments.filter((a) => a.existingChildrenConsulted).length /
            totalAssessments) *
            100,
        )
      : 0;

  // Conditions applied rate (for those that proceeded with conditions)
  const proceedWithConditions = periodAssessments.filter(
    (a) => a.decision === "proceed_with_conditions",
  );
  // Null when nothing was admitted subject to conditions — there is no
  // conditions practice to rate, which is not the same as rating it perfect.
  const conditionsAppliedRate = rateOf(
    proceedWithConditions.filter((a) => a.conditionsApplied.length > 0),
    proceedWithConditions,
  );

  // Decision breakdown
  const decisionBreakdown: Record<MatchingDecision, number> = {
    proceed: 0,
    proceed_with_conditions: 0,
    defer: 0,
    decline: 0,
  };
  for (const a of periodAssessments) {
    decisionBreakdown[a.decision]++;
  }

  // Admission type breakdown
  const admissionTypeBreakdown: Record<AdmissionType, number> = {
    planned: 0,
    emergency: 0,
    respite: 0,
    step_down: 0,
    step_up: 0,
  };
  for (const a of periodAssessments) {
    admissionTypeBreakdown[a.admissionType]++;
  }

  // Average risk factors
  const averageRiskFactors =
    totalAssessments > 0
      ? Math.round(
          (periodAssessments.reduce((s, a) => s + a.riskFactorsIdentified.length, 0) /
            totalAssessments) *
            10,
        ) / 10
      : 0;

  // Average protective factors
  const averageProtectiveFactors =
    totalAssessments > 0
      ? Math.round(
          (periodAssessments.reduce((s, a) => s + a.protectiveFactors.length, 0) /
            totalAssessments) *
            10,
        ) / 10
      : 0;

  // Review date set rate
  const reviewDateSetRate =
    totalAssessments > 0
      ? Math.round(
          (periodAssessments.filter((a) => a.reviewDate.length > 0).length /
            totalAssessments) *
            100,
        )
      : 0;

  return {
    totalAssessments,
    averageCompatibilityScore,
    assessmentCompletionRate,
    existingChildrenConsultedRate,
    conditionsAppliedRate,
    decisionBreakdown,
    admissionTypeBreakdown,
    averageRiskFactors,
    averageProtectiveFactors,
    reviewDateSetRate,
  };
}

// ── Core Function 2: Evaluate Impact Monitoring ───────────────────────────

export function evaluateImpactMonitoring(
  monitoring: ImpactMonitoring[],
  assessments: MatchingAssessment[],
  periodStart: string,
  periodEnd: string,
): ImpactMonitoringResult {
  const periodMonitoring = monitoring.filter(
    (m) => withinPeriod(m.monitoringDate, periodStart, periodEnd),
  );

  const totalMonitoringRecords = periodMonitoring.length;

  // Negative impact rate
  const negativeRecords = periodMonitoring.filter(
    (m) => m.impactLevel === "negative" || m.impactLevel === "significant_negative",
  );
  const negativeImpactRate =
    totalMonitoringRecords > 0
      ? Math.round((negativeRecords.length / totalMonitoringRecords) * 100)
      : 0;

  // Significant negative rate
  const significantNegativeRecords = periodMonitoring.filter(
    (m) => m.impactLevel === "significant_negative",
  );
  const significantNegativeRate =
    totalMonitoringRecords > 0
      ? Math.round(
          (significantNegativeRecords.length / totalMonitoringRecords) * 100,
        )
      : 0;

  // Positive impact rate
  const positiveRecords = periodMonitoring.filter(
    (m) => m.impactLevel === "positive",
  );
  const positiveImpactRate =
    totalMonitoringRecords > 0
      ? Math.round((positiveRecords.length / totalMonitoringRecords) * 100)
      : 0;

  // Impact area breakdown
  const impactAreaBreakdown: Record<ImpactArea, number> = {
    behaviour: 0,
    emotional_wellbeing: 0,
    peer_dynamics: 0,
    routines: 0,
    education: 0,
    safety: 0,
    staffing: 0,
    space: 0,
  };
  for (const m of periodMonitoring) {
    impactAreaBreakdown[m.impactArea]++;
  }

  // Resolution rate (for negative/significant_negative only)
  const resolvableRecords = periodMonitoring.filter(
    (m) => m.impactLevel === "negative" || m.impactLevel === "significant_negative",
  );
  const resolvedRecords = resolvableRecords.filter((m) => m.resolved);
  // Null when no negative impact was recorded — nothing to resolve, rather
  // than everything resolved.
  const resolutionRate = rateOf(resolvedRecords, resolvableRecords);

  // Mitigation provided rate (for negative/significant_negative only)
  const mitigatedRecords = resolvableRecords.filter(
    (m) => m.mitigationAction.length > 0,
  );
  const mitigationProvidedRate = rateOf(mitigatedRecords, resolvableRecords);

  // Average monitoring records per new child admitted in period
  const periodAssessments = assessments.filter(
    (a) =>
      withinPeriod(a.assessmentDate, periodStart, periodEnd) &&
      (a.decision === "proceed" || a.decision === "proceed_with_conditions"),
  );
  const uniqueNewChildren = new Set(periodAssessments.map((a) => a.childId));
  const averageMonitoringPerChild =
    uniqueNewChildren.size > 0
      ? Math.round((totalMonitoringRecords / uniqueNewChildren.size) * 10) / 10
      : 0;

  // Monitoring frequency adequacy: at least 2 monitoring records per admitted child
  const monitoringFrequencyAdequate =
    uniqueNewChildren.size === 0 || averageMonitoringPerChild >= 2;

  return {
    totalMonitoringRecords,
    negativeImpactRate,
    significantNegativeRate,
    positiveImpactRate,
    impactAreaBreakdown,
    resolutionRate,
    mitigationProvidedRate,
    averageMonitoringPerChild,
    monitoringFrequencyAdequate,
  };
}

// ── Core Function 3: Evaluate Resident Consultation ───────────────────────

export function evaluateResidentConsultation(
  consultations: ResidentConsultation[],
  assessments: MatchingAssessment[],
  periodStart: string,
  periodEnd: string,
): ResidentConsultationResult {
  const periodConsultations = consultations.filter(
    (c) =>
      withinPeriod(c.consultationDate, periodStart, periodEnd),
  );

  const totalConsultations = periodConsultations.length;

  // Informed rate
  const informedRate =
    totalConsultations > 0
      ? Math.round(
          (periodConsultations.filter((c) => c.informedAboutNewResident).length /
            totalConsultations) *
            100,
        )
      : 0;

  // Views sought rate
  const viewsSoughtRate =
    totalConsultations > 0
      ? Math.round(
          (periodConsultations.filter((c) => c.viewsSought).length /
            totalConsultations) *
            100,
        )
      : 0;

  // Views acted upon rate (of those where views were sought)
  const soughtConsultations = periodConsultations.filter((c) => c.viewsSought);
  const viewsActedUponRate =
    soughtConsultations.length > 0
      ? Math.round(
          (soughtConsultations.filter((c) => c.viewsActedUpon).length /
            soughtConsultations.length) *
            100,
        )
      : 0;

  // Consultation completion rate: percentage of admissions with at least one consultation
  const periodAssessments = assessments.filter(
    (a) =>
      withinPeriod(a.assessmentDate, periodStart, periodEnd) &&
      (a.decision === "proceed" || a.decision === "proceed_with_conditions"),
  );
  const admittedChildIds = new Set(periodAssessments.map((a) => a.childId));
  const consultedChildIds = new Set(
    periodConsultations.map((c) => c.childId),
  );
  // Consultations should reference the new child being admitted.
  // We check how many admitted children had consultations done about them.
  const consultationCompletionRate =
    admittedChildIds.size > 0
      ? Math.round(
          ([...admittedChildIds].filter((id) => consultedChildIds.has(id)).length /
            admittedChildIds.size) *
            100,
        )
      : 0;

  // Average consultations per admission
  const averageConsultationsPerAdmission =
    admittedChildIds.size > 0
      ? Math.round((totalConsultations / admittedChildIds.size) * 10) / 10
      : 0;

  return {
    totalConsultations,
    informedRate,
    viewsSoughtRate,
    viewsActedUponRate,
    consultationCompletionRate,
    averageConsultationsPerAdmission,
  };
}

// ── Core Function 4: Evaluate Admission Outcomes ──────────────────────────

export function evaluateAdmissionOutcomes(
  outcomes: AdmissionOutcome[],
  periodStart: string,
  periodEnd: string,
): AdmissionOutcomeResult {
  const periodOutcomes = outcomes.filter(
    (o) => withinPeriod(o.admissionDate, periodStart, periodEnd),
  );

  const totalOutcomes = periodOutcomes.length;

  // Placement stability rate
  const placementStabilityRate =
    totalOutcomes > 0
      ? Math.round(
          (periodOutcomes.filter((o) => o.placementStable).length /
            totalOutcomes) *
            100,
        )
      : 0;

  // Average days to settle
  const settledOutcomes = periodOutcomes.filter((o) => o.daysToSettle > 0);
  const averageDaysToSettle =
    settledOutcomes.length > 0
      ? Math.round(
          (settledOutcomes.reduce((s, o) => s + o.daysToSettle, 0) /
            settledOutcomes.length) *
            10,
        ) / 10
      : 0;

  // Disruption rate
  const disruptionRate =
    totalOutcomes > 0
      ? Math.round(
          (periodOutcomes.filter((o) => o.disruptionOccurred).length /
            totalOutcomes) *
            100,
        )
      : 0;

  // Disruption reasons
  const disruptionReasons: Record<string, number> = {};
  periodOutcomes
    .filter((o) => o.disruptionOccurred && o.disruptionReason.length > 0)
    .forEach((o) => {
      disruptionReasons[o.disruptionReason] =
        (disruptionReasons[o.disruptionReason] || 0) + 1;
    });

  // Matching assessment linked rate
  const matchingAssessmentLinkedRate =
    totalOutcomes > 0
      ? Math.round(
          (periodOutcomes.filter(
            (o) => o.matchingAssessmentId.length > 0,
          ).length /
            totalOutcomes) *
            100,
        )
      : 0;

  return {
    totalOutcomes,
    placementStabilityRate,
    averageDaysToSettle,
    disruptionRate,
    disruptionReasons,
    matchingAssessmentLinkedRate,
  };
}

// ── Core Function 5: Generate Full Intelligence ───────────────────────────

export function generateHomeMatchingImpactIntelligence(
  assessments: MatchingAssessment[],
  monitoring: ImpactMonitoring[],
  consultations: ResidentConsultation[],
  outcomes: AdmissionOutcome[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): HomeMatchingImpactIntelligence {
  const matchingQuality = evaluateMatchingQuality(assessments, periodStart, periodEnd);
  const impactMonitoring = evaluateImpactMonitoring(monitoring, assessments, periodStart, periodEnd);
  const residentConsultation = evaluateResidentConsultation(consultations, assessments, periodStart, periodEnd);
  const admissionOutcomes = evaluateAdmissionOutcomes(outcomes, periodStart, periodEnd);

  const componentScores = calculateComponentScores(
    matchingQuality,
    impactMonitoring,
    residentConsultation,
    admissionOutcomes,
  );

  const overallScore = Math.round(
    componentScores.matchingQuality +
      componentScores.impactMonitoring +
      componentScores.residentConsultation +
      componentScores.admissionOutcomes,
  );

  const rating = getOverallRating(overallScore);

  const strengths = generateStrengths(
    matchingQuality,
    impactMonitoring,
    residentConsultation,
    admissionOutcomes,
  );
  const areasForImprovement = generateAreasForImprovement(
    matchingQuality,
    impactMonitoring,
    residentConsultation,
    admissionOutcomes,
  );
  const actions = generateActions(
    matchingQuality,
    impactMonitoring,
    residentConsultation,
    admissionOutcomes,
  );
  const regulatoryLinks = generateRegulatoryLinks(
    matchingQuality,
    impactMonitoring,
    residentConsultation,
    admissionOutcomes,
  );

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    matchingQuality,
    impactMonitoring,
    residentConsultation,
    admissionOutcomes,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
    componentScores,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────
// matching_quality (30) + impact_monitoring (25) + resident_consultation (25) + admission_outcomes (20) = 100

function calculateComponentScores(
  mq: MatchingQualityResult,
  im: ImpactMonitoringResult,
  rc: ResidentConsultationResult,
  ao: AdmissionOutcomeResult,
): {
  matchingQuality: number;
  impactMonitoring: number;
  residentConsultation: number;
  admissionOutcomes: number;
} {
  // Matching quality: max 30 points
  let mqScore = 0;
  if (mq.totalAssessments > 0) {
    // Compatibility score quality: 10 pts (score out of 10, scaled to 10)
    mqScore += (Math.min(mq.averageCompatibilityScore, 10) / 10) * 10;
    // Existing children consulted rate: 8 pts
    mqScore += (mq.existingChildrenConsultedRate / 100) * 8;
    // Assessment completion rate: 6 pts
    mqScore += (mq.assessmentCompletionRate / 100) * 6;
    // Review date set rate: 6 pts
    mqScore += (mq.reviewDateSetRate / 100) * 6;
  }

  // Impact monitoring: max 25 points
  let imScore = 0;
  if (im.totalMonitoringRecords > 0) {
    // Resolution and mitigation are only measurable where a negative impact was
    // recorded; when they are not, the remaining 20 points are carried by the
    // limbs that were measured rather than awarded for silence.
    const negativeInverse = Math.max(0, 100 - im.negativeImpactRate);
    const measured = weightedMeanOf([
      { score: im.resolutionRate, weight: 8 },
      { score: im.mitigationProvidedRate, weight: 7 },
      { score: negativeInverse, weight: 5 },
    ]);
    imScore += ((measured ?? 0) / 100) * 20;
    // Monitoring frequency adequate: 5 pts
    imScore += im.monitoringFrequencyAdequate ? 5 : 0;
  } else if (mq.totalAssessments > 0) {
    // Assessments exist but no monitoring = bad practice
    imScore = 0;
  } else {
    // No assessments and no monitoring = no admissions = neutral
    imScore = 25;
  }

  // Resident consultation: max 25 points
  let rcScore = 0;
  if (rc.totalConsultations > 0) {
    // Informed rate: 7 pts
    rcScore += (rc.informedRate / 100) * 7;
    // Views sought rate: 7 pts
    rcScore += (rc.viewsSoughtRate / 100) * 7;
    // Views acted upon rate: 6 pts
    rcScore += (rc.viewsActedUponRate / 100) * 6;
    // Consultation completion rate: 5 pts
    rcScore += (rc.consultationCompletionRate / 100) * 5;
  } else if (mq.totalAssessments > 0) {
    // Assessments exist but no consultations = bad
    rcScore = 0;
  } else {
    // No admissions = neutral
    rcScore = 25;
  }

  // Admission outcomes: max 20 points
  let aoScore = 0;
  if (ao.totalOutcomes > 0) {
    // Placement stability rate: 8 pts
    aoScore += (ao.placementStabilityRate / 100) * 8;
    // Low disruption (invert: higher is better): 5 pts
    const disruptionInverse = Math.max(0, 100 - ao.disruptionRate);
    aoScore += (disruptionInverse / 100) * 5;
    // Matching assessment linked rate: 4 pts
    aoScore += (ao.matchingAssessmentLinkedRate / 100) * 4;
    // Quick settling time: 3 pts (target <= 14 days)
    if (ao.averageDaysToSettle > 0) {
      const settleScore = Math.max(0, 1 - (ao.averageDaysToSettle - 7) / 21);
      aoScore += Math.min(settleScore, 1) * 3;
    } else {
      aoScore += 3; // No data = neutral
    }
  } else if (mq.totalAssessments > 0) {
    // Assessments but no outcomes tracked = partial data
    aoScore = 0;
  } else {
    // No admissions = neutral
    aoScore = 20;
  }

  return {
    matchingQuality: Math.round(mqScore * 10) / 10,
    impactMonitoring: Math.round(imScore * 10) / 10,
    residentConsultation: Math.round(rcScore * 10) / 10,
    admissionOutcomes: Math.round(aoScore * 10) / 10,
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
  mq: MatchingQualityResult,
  im: ImpactMonitoringResult,
  rc: ResidentConsultationResult,
  ao: AdmissionOutcomeResult,
): string[] {
  const strengths: string[] = [];

  if (mq.averageCompatibilityScore >= 7 && mq.totalAssessments > 0) {
    strengths.push(
      "High average compatibility scores indicate thorough matching against the home's statement of purpose",
    );
  }

  if (mq.existingChildrenConsultedRate >= 90 && mq.totalAssessments > 0) {
    strengths.push(
      "Existing children consistently consulted during matching assessments, demonstrating child-centred practice",
    );
  }

  if (mq.assessmentCompletionRate === 100 && mq.totalAssessments > 0) {
    strengths.push(
      "All matching assessments completed with clear decisions, supporting Reg 14 compliance",
    );
  }

  if (mq.reviewDateSetRate === 100 && mq.totalAssessments > 0) {
    strengths.push(
      "Review dates consistently set for all matching assessments, ensuring ongoing oversight",
    );
  }

  if (meets(im.resolutionRate, 90)) {
    strengths.push(
      "Excellent resolution rate for negative impact concerns, demonstrating responsive practice",
    );
  }

  if (meets(im.mitigationProvidedRate, 90)) {
    strengths.push(
      "Mitigation actions consistently documented for negative impacts, supporting evidence-based care",
    );
  }

  if (im.positiveImpactRate >= 50 && im.totalMonitoringRecords > 0) {
    strengths.push(
      "Majority of impact monitoring records show positive outcomes for existing residents",
    );
  }

  if (im.monitoringFrequencyAdequate && im.totalMonitoringRecords > 0) {
    strengths.push(
      "Monitoring frequency meets expected standards, ensuring impact is tracked systematically",
    );
  }

  if (rc.informedRate >= 90 && rc.totalConsultations > 0) {
    strengths.push(
      "Existing residents consistently informed about new admissions, promoting transparency and trust",
    );
  }

  if (rc.viewsSoughtRate >= 90 && rc.totalConsultations > 0) {
    strengths.push(
      "Children's views consistently sought before new admissions, supporting participation rights",
    );
  }

  if (rc.viewsActedUponRate >= 80 && rc.totalConsultations > 0) {
    strengths.push(
      "Children's views demonstrably acted upon in admission decisions, showing genuine participation",
    );
  }

  if (ao.placementStabilityRate >= 90 && ao.totalOutcomes > 0) {
    strengths.push(
      "High placement stability rate indicates effective matching and transition support",
    );
  }

  if (ao.disruptionRate <= 10 && ao.totalOutcomes > 0) {
    strengths.push(
      "Very low placement disruption rate, demonstrating that matching decisions support stable placements",
    );
  }

  if (ao.matchingAssessmentLinkedRate === 100 && ao.totalOutcomes > 0) {
    strengths.push(
      "All admission outcomes linked to matching assessments, providing clear audit trail",
    );
  }

  if (ao.averageDaysToSettle > 0 && ao.averageDaysToSettle <= 7 && ao.totalOutcomes > 0) {
    strengths.push(
      `Average settling time of ${ao.averageDaysToSettle} days indicates effective transition planning`,
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  mq: MatchingQualityResult,
  im: ImpactMonitoringResult,
  rc: ResidentConsultationResult,
  ao: AdmissionOutcomeResult,
): string[] {
  const areas: string[] = [];

  if (mq.averageCompatibilityScore < 5 && mq.totalAssessments > 0) {
    areas.push(
      "Low average compatibility scores suggest placements may not be well matched to the home's statement of purpose",
    );
  }

  if (mq.existingChildrenConsultedRate < 70 && mq.totalAssessments > 0) {
    areas.push(
      "Existing children not consistently consulted during matching: develop systematic consultation process per Reg 14",
    );
  }

  if (mq.assessmentCompletionRate < 80 && mq.totalAssessments > 0) {
    areas.push(
      "Not all matching assessments result in clear decisions: ensure assessments lead to documented outcomes",
    );
  }

  if (mq.reviewDateSetRate < 80 && mq.totalAssessments > 0) {
    areas.push(
      "Review dates not consistently set for matching assessments: implement review scheduling at point of decision",
    );
  }

  if (im.negativeImpactRate > 30 && im.totalMonitoringRecords > 0) {
    areas.push(
      "High rate of negative impact recorded: review matching decisions and strengthen transition support",
    );
  }

  if (im.significantNegativeRate > 10 && im.totalMonitoringRecords > 0) {
    areas.push(
      "Significant negative impacts identified: urgent review needed of risk assessment and matching processes",
    );
  }

  if (below(im.resolutionRate, 70)) {
    areas.push(
      "Low resolution rate for negative impacts: strengthen follow-up and mitigation tracking processes",
    );
  }

  if (below(im.mitigationProvidedRate, 80)) {
    areas.push(
      "Mitigation actions not consistently documented: ensure all negative impacts have recorded mitigation plans",
    );
  }

  if (!im.monitoringFrequencyAdequate && mq.totalAssessments > 0) {
    areas.push(
      "Impact monitoring frequency below expected standard: increase monitoring to at least twice per admission",
    );
  }

  if (rc.informedRate < 70 && rc.totalConsultations > 0) {
    areas.push(
      "Existing residents not consistently informed about new admissions: improve communication processes",
    );
  }

  if (rc.viewsSoughtRate < 70 && rc.totalConsultations > 0) {
    areas.push(
      "Children's views not consistently sought before admissions: develop age-appropriate consultation methods",
    );
  }

  if (rc.viewsActedUponRate < 60 && rc.totalConsultations > 0) {
    areas.push(
      "Children's views not demonstrably acted upon: ensure feedback loop shows how views influenced decisions",
    );
  }

  if (rc.consultationCompletionRate < 80 && mq.totalAssessments > 0 && rc.totalConsultations > 0) {
    areas.push(
      "Not all admissions supported by resident consultations: ensure every admission involves existing resident views",
    );
  }

  if (ao.placementStabilityRate < 70 && ao.totalOutcomes > 0) {
    areas.push(
      "Low placement stability rate: review matching criteria and transition support to improve outcomes",
    );
  }

  if (ao.disruptionRate > 30 && ao.totalOutcomes > 0) {
    areas.push(
      "High placement disruption rate: analyse disruption reasons and strengthen matching practice",
    );
  }

  if (ao.matchingAssessmentLinkedRate < 80 && ao.totalOutcomes > 0) {
    areas.push(
      "Not all outcomes linked to matching assessments: ensure audit trail from assessment to outcome",
    );
  }

  if (ao.averageDaysToSettle > 21 && ao.totalOutcomes > 0) {
    areas.push(
      `Average settling time of ${ao.averageDaysToSettle} days exceeds expected norms: review transition and settling-in support`,
    );
  }

  return areas;
}

function generateActions(
  mq: MatchingQualityResult,
  im: ImpactMonitoringResult,
  rc: ResidentConsultationResult,
  ao: AdmissionOutcomeResult,
): string[] {
  const actions: string[] = [];

  if (mq.existingChildrenConsultedRate < 80 && mq.totalAssessments > 0) {
    actions.push(
      "Implement mandatory consultation checklist within matching assessment process to ensure existing children are consulted",
    );
  }

  if (mq.reviewDateSetRate < 100 && mq.totalAssessments > 0) {
    actions.push(
      "Set review dates for all matching assessments at point of decision to ensure post-admission follow-up",
    );
  }

  if (mq.assessmentCompletionRate < 100 && mq.totalAssessments > 0) {
    actions.push(
      "Review deferred matching assessments and progress to clear decision within agreed timescales",
    );
  }

  if (im.significantNegativeRate > 0 && im.totalMonitoringRecords > 0) {
    actions.push(
      "Convene multi-disciplinary review for all significant negative impacts to develop remediation plans",
    );
  }

  if (below(im.resolutionRate, 80)) {
    actions.push(
      "Establish weekly impact review meetings to track resolution progress for outstanding negative impacts",
    );
  }

  if (!im.monitoringFrequencyAdequate && mq.totalAssessments > 0) {
    actions.push(
      "Increase impact monitoring frequency: schedule minimum fortnightly monitoring for each new admission",
    );
  }

  if (rc.viewsSoughtRate < 80 && rc.totalConsultations > 0) {
    actions.push(
      "Develop age-appropriate consultation tools to ensure all existing residents can share their views",
    );
  }

  if (rc.viewsActedUponRate < 70 && rc.totalConsultations > 0) {
    actions.push(
      "Document how children's views have influenced each admission decision in the matching record",
    );
  }

  if (rc.consultationCompletionRate < 100 && mq.totalAssessments > 0 && rc.totalConsultations >= 0) {
    actions.push(
      "Ensure resident consultation is completed for every new admission before the child moves in",
    );
  }

  if (ao.disruptionRate > 20 && ao.totalOutcomes > 0) {
    actions.push(
      "Analyse disruption patterns and present findings at next management meeting with proposed improvements",
    );
  }

  if (ao.matchingAssessmentLinkedRate < 100 && ao.totalOutcomes > 0) {
    actions.push(
      "Link all admission outcomes to their matching assessments to maintain regulatory audit trail",
    );
  }

  if (ao.placementStabilityRate < 80 && ao.totalOutcomes > 0) {
    actions.push(
      "Develop enhanced settling-in programme with daily keyworker check-ins for first 14 days post-admission",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Home matching impact practice is operating within expected standards.",
    );
  }

  return actions;
}

function generateRegulatoryLinks(
  mq: MatchingQualityResult,
  im: ImpactMonitoringResult,
  rc: ResidentConsultationResult,
  ao: AdmissionOutcomeResult,
): string[] {
  const links: string[] = [];

  // Always relevant
  links.push(
    "CHR 2015 Reg 14 — Admissions: the registered person must ensure the home only admits children where it is consistent with their Statement of Purpose and placement plan",
  );

  links.push(
    "CHR 2015 Reg 3 — Statement of purpose: matching decisions should align with the home's stated aims, ethos, and the range of children the home is designed to accommodate",
  );

  if (mq.totalAssessments > 0 || rc.totalConsultations > 0) {
    links.push(
      "CHR 2015 Reg 5 — Engaging with the local community: consider the impact of admissions on the local community and existing relationships",
    );
  }

  if (im.totalMonitoringRecords > 0 || ao.totalOutcomes > 0) {
    links.push(
      "SCCIF — Experience and progress of children: inspectors will evaluate whether matching assessments and post-admission monitoring support positive outcomes",
    );
  }

  links.push(
    "DfE Guide to Children's Homes Regulations 2015 — Matching: thorough impact assessment before every admission, including consultation with existing residents",
  );

  if (im.significantNegativeRate > 0 || ao.disruptionRate > 0) {
    links.push(
      "SCCIF — Safety of children: significant negative impacts and disruptions must be reviewed to ensure children remain safe",
    );
  }

  if (rc.totalConsultations > 0) {
    links.push(
      "CHR 2015 Reg 7 — Children's views, wishes and feelings: existing residents must be consulted and their views considered in admission decisions",
    );
  }

  return links;
}

// ── Label Functions ────────────────────────────────────────────────────────

export function getAdmissionTypeLabel(type: AdmissionType): string {
  const labels: Record<AdmissionType, string> = {
    planned: "Planned",
    emergency: "Emergency",
    respite: "Respite",
    step_down: "Step Down",
    step_up: "Step Up",
  };
  return labels[type] ?? type;
}

export function getMatchingDecisionLabel(decision: MatchingDecision): string {
  const labels: Record<MatchingDecision, string> = {
    proceed: "Proceed",
    proceed_with_conditions: "Proceed with Conditions",
    defer: "Defer",
    decline: "Decline",
  };
  return labels[decision] ?? decision;
}

export function getImpactAreaLabel(area: ImpactArea): string {
  const labels: Record<ImpactArea, string> = {
    behaviour: "Behaviour",
    emotional_wellbeing: "Emotional Wellbeing",
    peer_dynamics: "Peer Dynamics",
    routines: "Routines",
    education: "Education",
    safety: "Safety",
    staffing: "Staffing",
    space: "Space",
  };
  return labels[area] ?? area;
}

export function getImpactLevelLabel(level: ImpactLevel): string {
  const labels: Record<ImpactLevel, string> = {
    positive: "Positive",
    neutral: "Neutral",
    negative: "Negative",
    significant_negative: "Significant Negative",
  };
  return labels[level] ?? level;
}

export function getMonitoringFrequencyLabel(freq: MonitoringFrequency): string {
  const labels: Record<MonitoringFrequency, string> = {
    daily: "Daily",
    weekly: "Weekly",
    fortnightly: "Fortnightly",
    monthly: "Monthly",
  };
  return labels[freq] ?? freq;
}

import { above, below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// ENVIRONMENTAL RISK COMPLIANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing premises safety, environmental
// hazards, and regulatory compliance in children's residential care homes.
// Covers ligature risk assessments, water temperature checks, COSHH
// compliance, window restrictors, fire safety, and general environmental
// hazard management.
//
// Regulatory basis:
//   - CHR 2015, Reg 25 — Premises: suitability and safety of premises
//   - Health and Safety at Work Act 1974 — General duty of care
//   - COSHH Regulations 2002 — Control of Substances Hazardous to Health
//   - Regulatory Reform (Fire Safety) Order 2005 — Fire risk assessment
//   - SCCIF — Overall experiences and progress of children
//   - NMS 10 — Premises: safety, suitability and maintenance
//   - CHR 2015, Reg 13 — Leadership and management: ensuring safe environment
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type HazardType =
  | "ligature_point"
  | "water_temperature"
  | "coshh"
  | "window_restrictor"
  | "sharp_object"
  | "electrical"
  | "slip_trip"
  | "fire_equipment"
  | "structural"
  | "other";

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type CheckStatus =
  | "compliant"
  | "minor_issue"
  | "major_issue"
  | "non_compliant";

export type AreaType =
  | "bedroom"
  | "bathroom"
  | "kitchen"
  | "communal"
  | "garden"
  | "utility"
  | "office"
  | "corridor";

export type RemediationStatus =
  | "completed"
  | "in_progress"
  | "planned"
  | "overdue"
  | "not_started";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface RiskAssessment {
  id: string;
  areaType: AreaType;
  areaName: string;
  assessmentDate: string;
  assessedBy: string;
  hazardType: HazardType;
  riskLevel: RiskLevel;
  mitigationInPlace: boolean;
  mitigationDescription: string;
  nextReviewDate: string;
  reviewCurrent: boolean;
}

export interface SafetyCheck {
  id: string;
  areaType: AreaType;
  areaName: string;
  checkDate: string;
  checkedBy: string;
  checkType: HazardType;
  status: CheckStatus;
  reading: number | null;
  notes: string;
  actionRequired: boolean;
  actionCompleted: boolean;
}

export interface RemediationAction {
  id: string;
  assessmentId: string;
  hazardType: HazardType;
  areaType: AreaType;
  description: string;
  assignedTo: string;
  targetDate: string;
  completionDate: string | null;
  status: RemediationStatus;
  verified: boolean;
}

export interface StaffSafetyTraining {
  id: string;
  staffId: string;
  staffName: string;
  ligatureAwareness: boolean;
  coshhTrained: boolean;
  fireSafetyTrained: boolean;
  waterSafetyTrained: boolean;
  manualHandling: boolean;
  riskAssessmentCompetent: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface RiskAssessmentCoverageResult {
  overallScore: number;
  totalAssessments: number;
  areasCovered: number;
  totalAreas: number;
  /** null when the population is empty — nothing measured, not 0%. */
  areaCoverageRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reviewCurrentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  mitigationInPlaceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  highCriticalMitigatedRate: number | null;
}

export interface SafetyCheckComplianceResult {
  overallScore: number;
  totalChecks: number;
  /** null when the population is empty — nothing measured, not 0%. */
  compliantRate: number | null;
  nonCompliantCount: number;
  /** null when the population is empty — nothing measured, not 0%. */
  actionRequiredCompletedRate: number | null;
  checkFrequencyAdequate: boolean;
}

export interface RemediationEffectivenessResult {
  overallScore: number;
  totalActions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  completedOnTimeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  overdueRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  verifiedRate: number | null;
  inProgressCount: number;
}

export interface StaffSafetyReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  ligatureAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  coshhTrainedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  fireSafetyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  waterSafetyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessmentCompetentRate: number | null;
}

export interface AreaRiskProfile {
  areaType: AreaType;
  areaName: string;
  assessmentCount: number;
  checkCount: number;
  remediationCount: number;
  assessmentCoverage: boolean;
  checkCompliance: boolean;
  remediationClear: boolean;
  overallScore: number;
}

export interface EnvironmentalRiskComplianceIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  riskAssessmentCoverage: RiskAssessmentCoverageResult;
  safetyCheckCompliance: SafetyCheckComplianceResult;
  remediationEffectiveness: RemediationEffectivenessResult;
  staffSafetyReadiness: StaffSafetyReadinessResult;
  areaProfiles: AreaRiskProfile[];
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

// -- Label Maps & Getters -----------------------------------------------------

const HAZARD_TYPE_LABELS: Record<HazardType, string> = {
  ligature_point: "Ligature Point",
  water_temperature: "Water Temperature",
  coshh: "COSHH",
  window_restrictor: "Window Restrictor",
  sharp_object: "Sharp Object",
  electrical: "Electrical",
  slip_trip: "Slip / Trip",
  fire_equipment: "Fire Equipment",
  structural: "Structural",
  other: "Other",
};

const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  compliant: "Compliant",
  minor_issue: "Minor Issue",
  major_issue: "Major Issue",
  non_compliant: "Non-Compliant",
};

const AREA_TYPE_LABELS: Record<AreaType, string> = {
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  kitchen: "Kitchen",
  communal: "Communal",
  garden: "Garden",
  utility: "Utility",
  office: "Office",
  corridor: "Corridor",
};

const REMEDIATION_STATUS_LABELS: Record<RemediationStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  planned: "Planned",
  overdue: "Overdue",
  not_started: "Not Started",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getHazardTypeLabel(v: HazardType): string { return HAZARD_TYPE_LABELS[v]; }
export function getRiskLevelLabel(v: RiskLevel): string { return RISK_LEVEL_LABELS[v]; }
export function getCheckStatusLabel(v: CheckStatus): string { return CHECK_STATUS_LABELS[v]; }
export function getAreaTypeLabel(v: AreaType): string { return AREA_TYPE_LABELS[v]; }
export function getRemediationStatusLabel(v: RemediationStatus): string { return REMEDIATION_STATUS_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates risk assessment coverage across areas.
 * Empty = 0 (no assessments = non-compliant).
 *
 * Scoring:
 *   - Assessment exists per area (0-7)
 *   - Review current rate (0-6)
 *   - Mitigation in place rate (0-6)
 *   - High/critical risks mitigated (0-6)
 */
export function evaluateRiskAssessmentCoverage(
  assessments: RiskAssessment[],
): RiskAssessmentCoverageResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      areasCovered: 0,
      totalAreas: 8,
      areaCoverageRate: null,
      reviewCurrentRate: null,
      mitigationInPlaceRate: null,
      highCriticalMitigatedRate: null,
    };
  }

  const ALL_AREAS: AreaType[] = ["bedroom", "bathroom", "kitchen", "communal", "garden", "utility", "office", "corridor"];
  const coveredAreas = new Set<AreaType>();
  for (const a of assessments) {
    coveredAreas.add(a.areaType);
  }
  const areasCovered = coveredAreas.size;

  const reviewCurrent = assessments.filter((a) => a.reviewCurrent).length;
  const mitigationInPlace = assessments.filter((a) => a.mitigationInPlace).length;

  const highCritical = assessments.filter((a) => a.riskLevel === "high" || a.riskLevel === "critical");
  const highCriticalMitigated = highCritical.filter((a) => a.mitigationInPlace).length;

  const areaCoverageRate = rate(areasCovered, ALL_AREAS.length);
  const reviewCurrentRate = rate(reviewCurrent, assessments.length);
  const mitigationInPlaceRate = rate(mitigationInPlace, assessments.length);
  const highCriticalMitigatedRate = rate(highCriticalMitigated, highCritical.length);

  // Scoring
  let score = 0;
  score += Math.round(((areaCoverageRate ?? 0) / 100) * 7);
  score += Math.round((reviewCurrentRate! / 100) * 6);
  score += Math.round((mitigationInPlaceRate! / 100) * 6);
  score += Math.round(((highCriticalMitigatedRate ?? 0) / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalAssessments: assessments.length,
    areasCovered,
    totalAreas: ALL_AREAS.length,
    areaCoverageRate,
    reviewCurrentRate,
    mitigationInPlaceRate,
    highCriticalMitigatedRate,
  };
}

/**
 * Evaluates safety check compliance.
 * Empty = 0 (no checks = non-compliant).
 *
 * Scoring:
 *   - Compliant rate (0-8)
 *   - Non-compliant count penalty: bonus 6 if none (0-6)
 *   - Action required completed rate (0-6)
 *   - Check frequency adequate (0-5)
 */
export function evaluateSafetyCheckCompliance(
  checks: SafetyCheck[],
): SafetyCheckComplianceResult {
  if (checks.length === 0) {
    return {
      overallScore: 0,
      totalChecks: 0,
      compliantRate: null,
      nonCompliantCount: 0,
      actionRequiredCompletedRate: null,
      checkFrequencyAdequate: false,
    };
  }

  const compliant = checks.filter((c) => c.status === "compliant").length;
  const nonCompliant = checks.filter((c) => c.status === "non_compliant").length;

  const actionRequired = checks.filter((c) => c.actionRequired);
  const actionCompleted = actionRequired.filter((c) => c.actionCompleted).length;

  const compliantRate = rate(compliant, checks.length);
  const actionRequiredCompletedRate = rate(actionCompleted, actionRequired.length);

  // Check frequency: adequate if >= 10 checks in period
  const checkFrequencyAdequate = checks.length >= 10;

  // Scoring
  let score = 0;
  score += Math.round((compliantRate! / 100) * 8);
  if (nonCompliant === 0) score += 6;
  else if (nonCompliant <= 1) score += 3;
  score += Math.round(((actionRequiredCompletedRate ?? 0) / 100) * 6);
  if (checkFrequencyAdequate) score += 5;
  else if (checks.length >= 5) score += 2;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalChecks: checks.length,
    compliantRate,
    nonCompliantCount: nonCompliant,
    actionRequiredCompletedRate,
    checkFrequencyAdequate,
  };
}

/**
 * Evaluates remediation action effectiveness.
 * Empty = 25 if no assessments exist (nothing to remediate), else 0 if
 * assessments exist but no remediation actions taken.
 *
 * Scoring:
 *   - Completed on time (0-8)
 *   - Overdue rate penalty: bonus 6 if none (0-6)
 *   - Verified rate (0-6)
 *   - In-progress tracked (0-5)
 */
export function evaluateRemediationEffectiveness(
  actions: RemediationAction[],
  assessmentsExist: boolean,
): RemediationEffectivenessResult {
  if (actions.length === 0) {
    return {
      overallScore: assessmentsExist ? 0 : 25,
      totalActions: 0,
      completedOnTimeRate: null,
      overdueRate: null,
      verifiedRate: null,
      inProgressCount: 0,
    };
  }

  const completed = actions.filter((a) => a.status === "completed");
  const completedOnTime = completed.filter((a) => {
    if (!a.completionDate) return false;
    return a.completionDate <= a.targetDate;
  }).length;
  const overdue = actions.filter((a) => a.status === "overdue").length;
  const verified = actions.filter((a) => a.verified).length;
  const inProgress = actions.filter((a) => a.status === "in_progress").length;

  const completedOnTimeRate = rate(completedOnTime, actions.length);
  const overdueRate = rate(overdue, actions.length);
  const verifiedRate = rate(verified, actions.length);

  // Scoring
  let score = 0;
  score += Math.round((completedOnTimeRate! / 100) * 8);
  if (overdue === 0) score += 6;
  else if (overdueRate! <= 10) score += 3;
  score += Math.round((verifiedRate! / 100) * 6);
  if (inProgress > 0) score += 5;
  else if (completed.length === actions.length) score += 5;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalActions: actions.length,
    completedOnTimeRate,
    overdueRate,
    verifiedRate,
    inProgressCount: inProgress,
  };
}

/**
 * Evaluates staff safety training readiness.
 * Empty = 0.
 *
 * Scoring:
 *   - Ligature awareness (0-6)
 *   - COSHH trained (0-5)
 *   - Fire safety (0-5)
 *   - Water safety (0-5)
 *   - Risk assessment competent (0-4)
 */
export function evaluateStaffSafetyReadiness(
  training: StaffSafetyTraining[],
): StaffSafetyReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      ligatureAwarenessRate: null,
      coshhTrainedRate: null,
      fireSafetyRate: null,
      waterSafetyRate: null,
      riskAssessmentCompetentRate: null,
    };
  }

  let ligature = 0;
  let coshh = 0;
  let fire = 0;
  let water = 0;
  let riskComp = 0;

  for (const t of training) {
    if (t.ligatureAwareness) ligature++;
    if (t.coshhTrained) coshh++;
    if (t.fireSafetyTrained) fire++;
    if (t.waterSafetyTrained) water++;
    if (t.riskAssessmentCompetent) riskComp++;
  }

  const ligatureAwarenessRate = rate(ligature, training.length);
  const coshhTrainedRate = rate(coshh, training.length);
  const fireSafetyRate = rate(fire, training.length);
  const waterSafetyRate = rate(water, training.length);
  const riskAssessmentCompetentRate = rate(riskComp, training.length);

  // Scoring
  let score = 0;
  score += Math.round((ligatureAwarenessRate! / 100) * 6);
  score += Math.round((coshhTrainedRate! / 100) * 5);
  score += Math.round((fireSafetyRate! / 100) * 5);
  score += Math.round((waterSafetyRate! / 100) * 5);
  score += Math.round(((riskAssessmentCompetentRate ?? 0) / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    ligatureAwarenessRate,
    coshhTrainedRate,
    fireSafetyRate,
    waterSafetyRate,
    riskAssessmentCompetentRate,
  };
}

// -- Area Risk Profiles -------------------------------------------------------

/**
 * Builds per-area risk profiles with 0-10 scores based on assessment coverage,
 * check compliance, and remediation status.
 */
export function buildAreaRiskProfiles(
  assessments: RiskAssessment[],
  checks: SafetyCheck[],
  remediations: RemediationAction[],
): AreaRiskProfile[] {
  // Collect unique areas
  const areaMap = new Map<string, { areaType: AreaType; areaName: string }>();
  for (const a of assessments) {
    areaMap.set(a.areaName, { areaType: a.areaType, areaName: a.areaName });
  }
  for (const c of checks) {
    if (!areaMap.has(c.areaName)) {
      areaMap.set(c.areaName, { areaType: c.areaType, areaName: c.areaName });
    }
  }

  return Array.from(areaMap.values()).map(({ areaType, areaName }) => {
    const areaAssessments = assessments.filter((a) => a.areaName === areaName);
    const areaChecks = checks.filter((c) => c.areaName === areaName);
    const areaRemediations = remediations.filter((r) => r.areaType === areaType);

    const assessmentCoverage = areaAssessments.length > 0;
    const allCurrentReviews = areaAssessments.length > 0 && areaAssessments.every((a) => a.reviewCurrent);
    const checkCompliance = areaChecks.length > 0 && areaChecks.every((c) => c.status === "compliant" || c.status === "minor_issue");
    const noOverdue = areaRemediations.every((r) => r.status !== "overdue");
    const remediationClear = noOverdue;

    // Score 0-10
    let score = 0;
    if (assessmentCoverage) score += 3;
    if (allCurrentReviews) score += 2;
    if (areaChecks.length > 0) {
      const compliant = areaChecks.filter((c) => c.status === "compliant").length;
      score += Math.round((rate(compliant, areaChecks.length)! / 100) * 3);
    } else if (assessmentCoverage) {
      // Has assessments but no checks — partial credit
      score += 1;
    }
    if (remediationClear) score += 2;

    return {
      areaType,
      areaName,
      assessmentCount: areaAssessments.length,
      checkCount: areaChecks.length,
      remediationCount: areaRemediations.length,
      assessmentCoverage,
      checkCompliance,
      remediationClear,
      overallScore: Math.min(10, score),
    };
  });
}

// -- Main Function ------------------------------------------------------------

export function generateEnvironmentalRiskComplianceIntelligence(
  assessments: RiskAssessment[],
  checks: SafetyCheck[],
  remediations: RemediationAction[],
  training: StaffSafetyTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EnvironmentalRiskComplianceIntelligence {
  const riskAssessmentCoverage = evaluateRiskAssessmentCoverage(assessments);
  const safetyCheckCompliance = evaluateSafetyCheckCompliance(checks);
  const remediationEffectiveness = evaluateRemediationEffectiveness(remediations, assessments.length > 0);
  const staffSafetyReadiness = evaluateStaffSafetyReadiness(training);

  const rawScore =
    riskAssessmentCoverage.overallScore +
    safetyCheckCompliance.overallScore +
    remediationEffectiveness.overallScore +
    staffSafetyReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const areaProfiles = buildAreaRiskProfiles(assessments, checks, remediations);

  // -- Strengths --
  const strengths: string[] = [];
  if (assessments.length > 0 && riskAssessmentCoverage.areaCoverageRate === 100)
    strengths.push("Risk assessments cover all premises areas");
  if (assessments.length > 0 && riskAssessmentCoverage.reviewCurrentRate === 100)
    strengths.push("All risk assessments have current reviews");
  if (assessments.length > 0 && riskAssessmentCoverage.mitigationInPlaceRate === 100)
    strengths.push("Mitigations in place for all identified hazards");
  if (assessments.length > 0 && riskAssessmentCoverage.highCriticalMitigatedRate === 100)
    strengths.push("All high and critical risks have mitigations in place");
  if (checks.length > 0 && meets(safetyCheckCompliance.compliantRate, 90))
    strengths.push("Safety check compliance rate at " + safetyCheckCompliance.compliantRate + "%");
  if (checks.length > 0 && safetyCheckCompliance.nonCompliantCount === 0)
    strengths.push("No non-compliant safety checks in period");
  if (remediations.length > 0 && remediationEffectiveness.overdueRate === 0)
    strengths.push("No overdue remediation actions");
  if (training.length > 0 && staffSafetyReadiness.ligatureAwarenessRate === 100)
    strengths.push("All staff trained in ligature awareness");
  if (training.length > 0 && staffSafetyReadiness.fireSafetyRate === 100)
    strengths.push("All staff have current fire safety training");

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (assessments.length === 0)
    areasForImprovement.push("No risk assessments documented — all premises areas require assessment");
  if (assessments.length > 0 && below(riskAssessmentCoverage.areaCoverageRate, 100))
    areasForImprovement.push("Risk assessments only cover " + riskAssessmentCoverage.areaCoverageRate + "% of premises areas — full coverage required");
  if (assessments.length > 0 && below(riskAssessmentCoverage.reviewCurrentRate, 80))
    areasForImprovement.push("Only " + riskAssessmentCoverage.reviewCurrentRate + "% of risk assessments have current reviews");
  if (checks.length === 0 && assessments.length > 0)
    areasForImprovement.push("No safety checks completed — regular checks required for compliance");
  if (checks.length > 0 && below(safetyCheckCompliance.compliantRate, 80))
    areasForImprovement.push("Safety check compliance at only " + safetyCheckCompliance.compliantRate + "% — target 100%");
  if (checks.length > 0 && safetyCheckCompliance.nonCompliantCount > 0)
    areasForImprovement.push(safetyCheckCompliance.nonCompliantCount + " non-compliant safety check(s) require immediate attention");
  if (remediations.length > 0 && above(remediationEffectiveness.overdueRate, 0))
    areasForImprovement.push(remediationEffectiveness.overdueRate + "% of remediation actions are overdue");
  if (training.length === 0)
    areasForImprovement.push("No staff safety training records — all staff require environmental safety training");
  if (training.length > 0 && below(staffSafetyReadiness.coshhTrainedRate, 100))
    areasForImprovement.push("COSHH training incomplete — only " + staffSafetyReadiness.coshhTrainedRate + "% of staff trained");

  // -- Actions --
  const actions: string[] = [];
  const highCriticalUnmitigated = assessments.filter(
    (a) => (a.riskLevel === "high" || a.riskLevel === "critical") && !a.mitigationInPlace,
  );
  if (highCriticalUnmitigated.length > 0)
    actions.push("URGENT: " + highCriticalUnmitigated.length + " high/critical risk(s) without mitigation — immediate action required");
  const nonCompliantChecks = checks.filter((c) => c.status === "non_compliant");
  if (nonCompliantChecks.length > 0)
    actions.push("URGENT: " + nonCompliantChecks.length + " non-compliant safety check(s) — rectify immediately");
  const overdueRemediations = remediations.filter((r) => r.status === "overdue");
  if (overdueRemediations.length > 0)
    actions.push("URGENT: " + overdueRemediations.length + " overdue remediation action(s) — escalate and complete");
  if (assessments.length === 0)
    actions.push("Complete risk assessments for all premises areas — statutory requirement under CHR 2015 Reg 25");
  if (assessments.length > 0 && below(riskAssessmentCoverage.reviewCurrentRate, 100))
    actions.push("Update " + (100 - riskAssessmentCoverage.reviewCurrentRate!) + "% of risk assessments with overdue reviews");
  if (checks.length === 0 && assessments.length > 0)
    actions.push("Implement regular safety check schedule — water temperatures, fire equipment, window restrictors");
  if (training.length > 0 && below(staffSafetyReadiness.ligatureAwarenessRate, 100))
    actions.push("Arrange ligature awareness training — only " + staffSafetyReadiness.ligatureAwarenessRate + "% of staff trained");
  if (training.length > 0 && below(staffSafetyReadiness.coshhTrainedRate, 100))
    actions.push("Arrange COSHH training — only " + staffSafetyReadiness.coshhTrainedRate + "% of staff trained");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 25 — Premises: suitability, safety, and maintenance of the home",
    "Health and Safety at Work Act 1974 — General duty of care for all persons on premises",
    "COSHH Regulations 2002 — Control of Substances Hazardous to Health",
    "Regulatory Reform (Fire Safety) Order 2005 — Fire risk assessment and safety measures",
    "SCCIF — Overall experiences and progress of children: safe environment",
    "NMS 10 — Premises: physical safety, suitability, and maintenance standards",
    "CHR 2015, Reg 13 — Leadership and management: ensuring a safe living environment",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    riskAssessmentCoverage,
    safetyCheckCompliance,
    remediationEffectiveness,
    staffSafetyReadiness,
    areaProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

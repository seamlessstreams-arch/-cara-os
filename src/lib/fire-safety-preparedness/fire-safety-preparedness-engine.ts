// ==============================================================================
// Fire Safety Preparedness Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home maintains fire safety preparedness:
//   1. Fire Drill Compliance (frequency, participation, evacuation times)
//   2. Equipment Checks (alarms, extinguishers, emergency lighting, signage)
//   3. Evacuation Planning (PEEPs, assembly points, routes, accessibility)
//   4. Staff Fire Training (awareness, marshal, first response, PEEPs)
//
// Regulatory: Regulatory Reform (Fire Safety) Order 2005, CHR 2015 Reg 12,
//             CHR 2015 Reg 25, SCCIF, NMS 10, Health and Safety at Work Act 1974
// ==============================================================================

import { below, meets, rateOf, weightedMeanOf } from "@/lib/metrics/rate";

// -- Type unions ---------------------------------------------------------------

export type DrillType =
  | "planned"
  | "unannounced"
  | "night_drill"
  | "partial_evacuation"
  | "tabletop_exercise";

export type DrillOutcome =
  | "successful"
  | "partial_success"
  | "failed"
  | "abandoned";

export type EquipmentType =
  | "smoke_alarm"
  | "heat_detector"
  | "fire_extinguisher"
  | "fire_blanket"
  | "emergency_lighting"
  | "fire_door"
  | "sprinkler"
  | "break_glass_point"
  | "signage";

export type CheckOutcome =
  | "pass"
  | "minor_fault"
  | "major_fault"
  | "out_of_service";

export type PeepStatus =
  | "current"
  | "overdue"
  | "not_required"
  | "in_progress";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const drillTypeLabels: Record<DrillType, string> = {
  planned: "Planned",
  unannounced: "Unannounced",
  night_drill: "Night Drill",
  partial_evacuation: "Partial Evacuation",
  tabletop_exercise: "Tabletop Exercise",
};

const drillOutcomeLabels: Record<DrillOutcome, string> = {
  successful: "Successful",
  partial_success: "Partial Success",
  failed: "Failed",
  abandoned: "Abandoned",
};

const equipmentTypeLabels: Record<EquipmentType, string> = {
  smoke_alarm: "Smoke Alarm",
  heat_detector: "Heat Detector",
  fire_extinguisher: "Fire Extinguisher",
  fire_blanket: "Fire Blanket",
  emergency_lighting: "Emergency Lighting",
  fire_door: "Fire Door",
  sprinkler: "Sprinkler",
  break_glass_point: "Break Glass Point",
  signage: "Signage",
};

const checkOutcomeLabels: Record<CheckOutcome, string> = {
  pass: "Pass",
  minor_fault: "Minor Fault",
  major_fault: "Major Fault",
  out_of_service: "Out of Service",
};

const peepStatusLabels: Record<PeepStatus, string> = {
  current: "Current",
  overdue: "Overdue",
  not_required: "Not Required",
  in_progress: "In Progress",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getDrillTypeLabel(t: DrillType): string {
  return drillTypeLabels[t] ?? t;
}
export function getDrillOutcomeLabel(o: DrillOutcome): string {
  return drillOutcomeLabels[o] ?? o;
}
export function getEquipmentTypeLabel(t: EquipmentType): string {
  return equipmentTypeLabels[t] ?? t;
}
export function getCheckOutcomeLabel(o: CheckOutcome): string {
  return checkOutcomeLabels[o] ?? o;
}
export function getPeepStatusLabel(s: PeepStatus): string {
  return peepStatusLabels[s] ?? s;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface FireDrillRecord {
  id: string;
  drillDate: string;
  drillType: DrillType;
  conductedBy: string;
  outcome: DrillOutcome;
  evacuationTimeSeconds: number;
  allChildrenParticipated: boolean;
  allStaffParticipated: boolean;
  issuesIdentified: string[];
  correctiveActionsTaken: boolean;
}

export interface EquipmentCheck {
  id: string;
  checkDate: string;
  checkedBy: string;
  equipmentType: EquipmentType;
  location: string;
  outcome: CheckOutcome;
  faultDescription?: string;
  rectifiedDate?: string;
  nextCheckDue: string;
}

export interface EvacuationPlan {
  id: string;
  childId: string;
  childName: string;
  peepStatus: PeepStatus;
  lastReviewDate: string;
  assemblyPointKnown: boolean;
  escapeRouteAccessible: boolean;
  mobilityConsiderations: string[];
  nightEvacuationPlan: boolean;
}

export interface StaffFireTraining {
  id: string;
  staffId: string;
  staffName: string;
  fireAwareness: boolean;
  fireMarshalTrained: boolean;
  evacuationProcedures: boolean;
  extinguisherUse: boolean;
  peepAwareness: boolean;
  nightResponseTrained: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface FireDrillComplianceResult {
  overallScore: number;
  totalDrills: number;
  successRate: number | null;
  fullParticipationRate: number | null;
  drillTypeVariety: number;
  averageEvacuationTime: number | null;
  /** null = no drill identified an issue, so there was nothing to correct. */
  correctiveActionsRate: number | null;
}

export interface EquipmentCheckResult {
  overallScore: number;
  totalChecks: number;
  passRate: number | null;
  majorFaultRate: number | null;
  equipmentTypesCovered: number;
  /** null = no fault was found, so there was nothing to rectify. */
  rectificationRate: number | null;
}

export interface EvacuationPlanResult {
  overallScore: number;
  totalPlans: number;
  peepCurrentRate: number | null;
  assemblyPointRate: number | null;
  escapeRouteRate: number | null;
  nightPlanRate: number | null;
}

export interface StaffFireReadinessResult {
  overallScore: number;
  totalStaff: number;
  fireAwarenessRate: number | null;
  fireMarshalRate: number | null;
  evacuationRate: number | null;
  extinguisherRate: number | null;
  peepAwarenessRate: number | null;
  nightResponseRate: number | null;
}

export interface ChildFireSafetySummary {
  childId: string;
  childName: string;
  peepStatus: string;
  assemblyPointKnown: boolean;
  escapeRouteAccessible: boolean;
  nightPlanInPlace: boolean;
  overallScore: number;
}

export interface FireSafetyPreparednessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  fireDrillCompliance: FireDrillComplianceResult;
  equipmentChecks: EquipmentCheckResult;
  evacuationPlanning: EvacuationPlanResult;
  staffFireReadiness: StaffFireReadinessResult;
  childSummaries: ChildFireSafetySummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

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

/**
 * Domain sub-score over the components that could actually be measured.
 * A component with nothing to measure (no faults to rectify, no drill issues to
 * correct) is dropped and the remaining weights renormalise, so silence neither
 * earns its points nor forfeits them.
 */
function scaleToBand(
  components: readonly { score: number | null; weight: number }[],
  max: number,
): number {
  const proportion = weightedMeanOf(
    components.map((c) => ({
      score: c.score === null ? null : (c.score / c.weight) * 100,
      weight: c.weight,
    })),
  );
  if (proportion === null) return 0;
  return Math.min(Math.round((proportion / 100) * max), max);
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates fire drill frequency, outcomes, and participation.
 * Empty = 0 (no drills = no evidence of practice).
 *
 *   Success rate (successful drills)      → 0-7
 *   Full participation rate               → 0-6
 *   Drill type variety                    → 0-6
 *   Corrective actions taken when needed  → 0-6
 */
export function evaluateFireDrillCompliance(
  drills: FireDrillRecord[],
): FireDrillComplianceResult {
  if (drills.length === 0) {
    return {
      overallScore: 0,
      totalDrills: 0,
      successRate: null,
      fullParticipationRate: null,
      drillTypeVariety: 0,
      averageEvacuationTime: null,
      correctiveActionsRate: null,
    };
  }

  const successful = drills.filter((d) => d.outcome === "successful").length;
  const successRate = pct(successful, drills.length);
  let successPoints = 0;
  if (successRate >= 90) successPoints = 7;
  else if (successRate >= 70) successPoints = 5;
  else if (successRate >= 50) successPoints = 3;
  else if (successRate > 0) successPoints = 1;

  const fullParticipation = drills.filter(
    (d) => d.allChildrenParticipated && d.allStaffParticipated,
  ).length;
  const fullParticipationRate = pct(fullParticipation, drills.length);
  let participationPoints = 0;
  if (fullParticipationRate >= 90) participationPoints = 6;
  else if (fullParticipationRate >= 70) participationPoints = 4;
  else if (fullParticipationRate >= 50) participationPoints = 3;
  else if (fullParticipationRate > 0) participationPoints = 1;

  const uniqueTypes = new Set(drills.map((d) => d.drillType));
  const drillTypeVariety = uniqueTypes.size;
  let varietyPoints = 1;
  if (drillTypeVariety >= 4) varietyPoints = 6;
  else if (drillTypeVariety >= 3) varietyPoints = 4;
  else if (drillTypeVariety >= 2) varietyPoints = 3;

  const withIssues = drills.filter((d) => d.issuesIdentified.length > 0);
  const corrected = withIssues.filter((d) => d.correctiveActionsTaken);
  const correctiveActionsRate = rateOf(corrected, withIssues);
  let correctivePoints: number | null = null;
  if (meets(correctiveActionsRate, 90)) correctivePoints = 6;
  else if (meets(correctiveActionsRate, 70)) correctivePoints = 4;
  else if (meets(correctiveActionsRate, 50)) correctivePoints = 3;
  else if (below(correctiveActionsRate, 50)) correctivePoints = correctiveActionsRate! > 0 ? 1 : 0;

  const totalTime = drills.reduce(
    (sum, d) => sum + d.evacuationTimeSeconds,
    0,
  );
  const averageEvacuationTime = Math.round(totalTime / drills.length);

  return {
    overallScore: scaleToBand(
      [
        { score: successPoints, weight: 7 },
        { score: participationPoints, weight: 6 },
        { score: varietyPoints, weight: 6 },
        { score: correctivePoints, weight: 6 },
      ],
      25,
    ),
    totalDrills: drills.length,
    successRate,
    fullParticipationRate,
    drillTypeVariety,
    averageEvacuationTime,
    correctiveActionsRate,
  };
}

/**
 * Evaluates fire equipment checks and maintenance.
 * Empty = 0 (no checks = no evidence of maintenance).
 *
 *   Pass rate                        → 0-8
 *   Equipment types covered          → 0-6
 *   Rectification of faults          → 0-6
 *   No major faults                  → 0-5
 */
export function evaluateEquipmentChecks(
  checks: EquipmentCheck[],
): EquipmentCheckResult {
  if (checks.length === 0) {
    return {
      overallScore: 0,
      totalChecks: 0,
      passRate: null,
      majorFaultRate: null,
      equipmentTypesCovered: 0,
      rectificationRate: null,
    };
  }

  const passed = checks.filter((c) => c.outcome === "pass").length;
  const passRate = pct(passed, checks.length);
  let passPoints = 0;
  if (passRate >= 95) passPoints = 8;
  else if (passRate >= 80) passPoints = 6;
  else if (passRate >= 60) passPoints = 4;
  else if (passRate > 0) passPoints = 2;

  const uniqueTypes = new Set(checks.map((c) => c.equipmentType));
  const equipmentTypesCovered = uniqueTypes.size;
  let coveragePoints = 1;
  if (equipmentTypesCovered >= 6) coveragePoints = 6;
  else if (equipmentTypesCovered >= 4) coveragePoints = 4;
  else if (equipmentTypesCovered >= 2) coveragePoints = 3;

  const faults = checks.filter(
    (c) => c.outcome === "minor_fault" || c.outcome === "major_fault",
  );
  const rectified = faults.filter((c) => c.rectifiedDate);
  const rectificationRate = rateOf(rectified, faults);
  let rectificationPoints: number | null = null;
  if (meets(rectificationRate, 90)) rectificationPoints = 6;
  else if (meets(rectificationRate, 70)) rectificationPoints = 4;
  else if (meets(rectificationRate, 50)) rectificationPoints = 3;
  else if (below(rectificationRate, 50)) rectificationPoints = rectificationRate! > 0 ? 1 : 0;

  const majorFaults = checks.filter(
    (c) => c.outcome === "major_fault" || c.outcome === "out_of_service",
  ).length;
  const majorFaultRate = pct(majorFaults, checks.length);
  let majorFaultPoints = 0;
  if (majorFaultRate === 0) majorFaultPoints = 5;
  else if (majorFaultRate <= 5) majorFaultPoints = 3;
  else if (majorFaultRate <= 15) majorFaultPoints = 2;
  else if (majorFaultRate <= 30) majorFaultPoints = 1;

  return {
    overallScore: scaleToBand(
      [
        { score: passPoints, weight: 8 },
        { score: coveragePoints, weight: 6 },
        { score: rectificationPoints, weight: 6 },
        { score: majorFaultPoints, weight: 5 },
      ],
      25,
    ),
    totalChecks: checks.length,
    passRate,
    majorFaultRate,
    equipmentTypesCovered,
    rectificationRate,
  };
}

/**
 * Evaluates evacuation planning, PEEPs, and accessibility.
 * Empty = 0 (no plans = no evidence of preparedness).
 *
 *   PEEP current rate                → 0-7
 *   Assembly point known             → 0-6
 *   Escape route accessible          → 0-6
 *   Night evacuation plan rate       → 0-6
 */
export function evaluateEvacuationPlanning(
  plans: EvacuationPlan[],
): EvacuationPlanResult {
  if (plans.length === 0) {
    return {
      overallScore: 0,
      totalPlans: 0,
      peepCurrentRate: null,
      assemblyPointRate: null,
      escapeRouteRate: null,
      nightPlanRate: null,
    };
  }

  let score = 0;

  const currentOrNotRequired = plans.filter(
    (p) => p.peepStatus === "current" || p.peepStatus === "not_required",
  ).length;
  const peepCurrentRate = pct(currentOrNotRequired, plans.length);
  if (peepCurrentRate >= 90) score += 7;
  else if (peepCurrentRate >= 70) score += 5;
  else if (peepCurrentRate >= 50) score += 3;
  else if (peepCurrentRate > 0) score += 1;

  const assemblyKnown = plans.filter((p) => p.assemblyPointKnown).length;
  const assemblyPointRate = pct(assemblyKnown, plans.length);
  if (assemblyPointRate >= 90) score += 6;
  else if (assemblyPointRate >= 70) score += 4;
  else if (assemblyPointRate >= 50) score += 3;
  else if (assemblyPointRate > 0) score += 1;

  const escapeAccessible = plans.filter(
    (p) => p.escapeRouteAccessible,
  ).length;
  const escapeRouteRate = pct(escapeAccessible, plans.length);
  if (escapeRouteRate >= 90) score += 6;
  else if (escapeRouteRate >= 70) score += 4;
  else if (escapeRouteRate >= 50) score += 3;
  else if (escapeRouteRate > 0) score += 1;

  const nightPlan = plans.filter((p) => p.nightEvacuationPlan).length;
  const nightPlanRate = pct(nightPlan, plans.length);
  if (nightPlanRate >= 90) score += 6;
  else if (nightPlanRate >= 70) score += 4;
  else if (nightPlanRate >= 50) score += 3;
  else if (nightPlanRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalPlans: plans.length,
    peepCurrentRate,
    assemblyPointRate,
    escapeRouteRate,
    nightPlanRate,
  };
}

/**
 * Evaluates staff fire safety training and competence.
 * Empty = 0 (no trained staff = no readiness).
 *
 *   Fire awareness                   → 0-6
 *   Fire marshal trained             → 0-5
 *   Evacuation procedures            → 0-5
 *   Extinguisher use                 → 0-4
 *   PEEP awareness                   → 0-3
 *   Night response                   → 0-2
 */
export function evaluateStaffFireReadiness(
  training: StaffFireTraining[],
): StaffFireReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      fireAwarenessRate: null,
      fireMarshalRate: null,
      evacuationRate: null,
      extinguisherRate: null,
      peepAwarenessRate: null,
      nightResponseRate: null,
    };
  }

  let score = 0;

  const awareness = training.filter((t) => t.fireAwareness).length;
  const fireAwarenessRate = pct(awareness, training.length);
  if (fireAwarenessRate >= 90) score += 6;
  else if (fireAwarenessRate >= 70) score += 4;
  else if (fireAwarenessRate >= 50) score += 3;
  else if (fireAwarenessRate > 0) score += 1;

  const marshal = training.filter((t) => t.fireMarshalTrained).length;
  const fireMarshalRate = pct(marshal, training.length);
  if (fireMarshalRate >= 90) score += 5;
  else if (fireMarshalRate >= 70) score += 3;
  else if (fireMarshalRate >= 50) score += 2;
  else if (fireMarshalRate > 0) score += 1;

  const evacuation = training.filter((t) => t.evacuationProcedures).length;
  const evacuationRate = pct(evacuation, training.length);
  if (evacuationRate >= 90) score += 5;
  else if (evacuationRate >= 70) score += 3;
  else if (evacuationRate >= 50) score += 2;
  else if (evacuationRate > 0) score += 1;

  const extinguisher = training.filter((t) => t.extinguisherUse).length;
  const extinguisherRate = pct(extinguisher, training.length);
  if (extinguisherRate >= 90) score += 4;
  else if (extinguisherRate >= 70) score += 3;
  else if (extinguisherRate >= 50) score += 2;
  else if (extinguisherRate > 0) score += 1;

  const peep = training.filter((t) => t.peepAwareness).length;
  const peepAwarenessRate = pct(peep, training.length);
  if (peepAwarenessRate >= 90) score += 3;
  else if (peepAwarenessRate >= 70) score += 2;
  else if (peepAwarenessRate >= 50) score += 1;

  const nightResponse = training.filter(
    (t) => t.nightResponseTrained,
  ).length;
  const nightResponseRate = pct(nightResponse, training.length);
  if (nightResponseRate >= 90) score += 2;
  else if (nightResponseRate >= 70) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    fireAwarenessRate,
    fireMarshalRate,
    evacuationRate,
    extinguisherRate,
    peepAwarenessRate,
    nightResponseRate,
  };
}

// -- Child Summaries -----------------------------------------------------------

export function buildChildFireSafetySummaries(
  plans: EvacuationPlan[],
): ChildFireSafetySummary[] {
  return plans.map((plan) => {
    let score = 0;

    // PEEP status (0-3)
    if (plan.peepStatus === "current") score += 3;
    else if (plan.peepStatus === "not_required") score += 3;
    else if (plan.peepStatus === "in_progress") score += 1;

    // Assembly point (0-2)
    if (plan.assemblyPointKnown) score += 2;

    // Escape route (0-2)
    if (plan.escapeRouteAccessible) score += 2;

    // Night plan (0-2)
    if (plan.nightEvacuationPlan) score += 2;

    // Review current (0-1)
    const reviewDate = new Date(plan.lastReviewDate);
    const now = new Date();
    const monthsSinceReview =
      (now.getFullYear() - reviewDate.getFullYear()) * 12 +
      (now.getMonth() - reviewDate.getMonth());
    if (monthsSinceReview <= 3) score += 1;

    return {
      childId: plan.childId,
      childName: plan.childName,
      peepStatus: plan.peepStatus,
      assemblyPointKnown: plan.assemblyPointKnown,
      escapeRouteAccessible: plan.escapeRouteAccessible,
      nightPlanInPlace: plan.nightEvacuationPlan,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateFireSafetyPreparednessIntelligence(
  drills: FireDrillRecord[],
  checks: EquipmentCheck[],
  plans: EvacuationPlan[],
  training: StaffFireTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): FireSafetyPreparednessIntelligence {
  const fireDrillCompliance = evaluateFireDrillCompliance(drills);
  const equipmentChecks = evaluateEquipmentChecks(checks);
  const evacuationPlanning = evaluateEvacuationPlanning(plans);
  const staffFireReadiness = evaluateStaffFireReadiness(training);

  const rawScore =
    fireDrillCompliance.overallScore +
    equipmentChecks.overallScore +
    evacuationPlanning.overallScore +
    staffFireReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childSummaries = buildChildFireSafetySummaries(plans);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (meets(fireDrillCompliance.successRate, 90)) {
    strengths.push(
      "Fire drills consistently achieving successful outcomes",
    );
  }
  if (meets(fireDrillCompliance.fullParticipationRate, 90)) {
    strengths.push(
      "Full participation from children and staff in fire drills",
    );
  }
  if (meets(equipmentChecks.passRate, 95)) {
    strengths.push(
      "Fire safety equipment maintained to an excellent standard",
    );
  }
  if (equipmentChecks.majorFaultRate === 0) {
    strengths.push(
      "No major faults identified in fire equipment during the assessment period",
    );
  }
  if (meets(evacuationPlanning.peepCurrentRate, 90)) {
    strengths.push(
      "Personal Emergency Evacuation Plans current for all children",
    );
  }
  if (meets(staffFireReadiness.fireAwarenessRate, 90)) {
    strengths.push(
      "Staff team demonstrates comprehensive fire safety awareness",
    );
  }
  if (meets(evacuationPlanning.nightPlanRate, 90)) {
    strengths.push(
      "Night evacuation plans in place for all children",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (below(fireDrillCompliance.successRate, 70)) {
    areasForImprovement.push(
      "Fire drill success rate below expected standard — review procedures",
    );
  }
  if (fireDrillCompliance.drillTypeVariety < 3 && drills.length > 0) {
    areasForImprovement.push(
      "Limited variety of fire drill types — incorporate night drills and unannounced drills",
    );
  }
  if (below(equipmentChecks.rectificationRate, 70)) {
    areasForImprovement.push(
      "Faults in fire equipment not consistently rectified in a timely manner",
    );
  }
  if (below(evacuationPlanning.escapeRouteRate, 80)) {
    areasForImprovement.push(
      "Not all escape routes confirmed as accessible — review and update",
    );
  }
  if (below(staffFireReadiness.fireMarshalRate, 50)) {
    areasForImprovement.push(
      "Insufficient fire marshal trained staff — increase training provision",
    );
  }
  if (below(evacuationPlanning.nightPlanRate, 70)) {
    areasForImprovement.push(
      "Night evacuation planning not comprehensive for all children",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (drills.length === 0) {
    actions.push(
      "URGENT: No fire drill records — conduct fire drills immediately and establish regular schedule",
    );
  }
  if (checks.length === 0) {
    actions.push(
      "URGENT: No fire equipment check records — conduct full equipment audit immediately",
    );
  }
  if (plans.length === 0) {
    actions.push(
      "URGENT: No evacuation plans recorded — create PEEPs for all children",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff fire safety training records — deliver mandatory training immediately",
    );
  }
  if (equipmentChecks.majorFaultRate !== null && equipmentChecks.majorFaultRate > 15) {
    actions.push(
      "URGENT: High rate of major faults in fire equipment — prioritise rectification",
    );
  }
  const overdue = plans.filter((p) => p.peepStatus === "overdue");
  if (overdue.length > 0) {
    actions.push(
      `URGENT: ${overdue.length} PEEP(s) overdue for review — update immediately`,
    );
  }
  if (below(fireDrillCompliance.successRate, 50)) {
    actions.push(
      "Review fire drill procedures and address recurring issues preventing successful outcomes",
    );
  }
  if (below(staffFireReadiness.extinguisherRate, 50)) {
    actions.push(
      "Provide fire extinguisher training to all staff",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "Regulatory Reform (Fire Safety) Order 2005 — Fire risk assessment and precautions",
    "CHR 2015 Reg 12 — The protection of children standard",
    "CHR 2015 Reg 25 — Review of quality of care (fire safety checks)",
    "SCCIF — Social Care Common Inspection Framework (premises safety)",
    "NMS 10 — National Minimum Standards (safety of premises)",
    "Health and Safety at Work Act 1974 — Employer duties for workplace safety",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    fireDrillCompliance,
    equipmentChecks,
    evacuationPlanning,
    staffFireReadiness,
    childSummaries,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
